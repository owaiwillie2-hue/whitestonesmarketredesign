import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompletionRequest {
  investmentId: string;
  userId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Parse request body
    const { investmentId, userId }: CompletionRequest = await req.json();

    if (!investmentId || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing investmentId or userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch investment details
    const { data: investment, error: investmentError } = await supabase
      .from("investments")
      .select(`
        *,
        investment_plans(roi_percentage, duration_days)
      `)
      .eq("id", investmentId)
      .eq("user_id", userId)
      .single();

    if (investmentError || !investment) {
      return new Response(
        JSON.stringify({ error: "Investment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if investment is already completed
    if (investment.status !== "active") {
      return new Response(
        JSON.stringify({ error: "Investment is not active" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if investment has actually matured
    const endDate = new Date(investment.end_date);
    const now = new Date();
    if (endDate > now) {
      return new Response(
        JSON.stringify({ error: "Investment has not yet matured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch current investment wallet balance
    const { data: balances, error: balanceError } = await supabase
      .from("account_balances")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (balanceError || !balances) {
      return new Response(
        JSON.stringify({ error: "User balances not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate total return (principal + profit)
    const principal = investment.amount;
    const profit = investment.expected_profit;
    const totalReturn = principal + profit;

    // Update investment status to completed
    const { error: updateError } = await supabase
      .from("investments")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", investmentId);

    if (updateError) {
      throw updateError;
    }

    // Update account balances: deduct from investment, add to main
    const newInvestmentBalance = Math.max(0, balances.investment_balance - principal);
    const newMainBalance = balances.main_balance + totalReturn;

    const { error: balanceUpdateError } = await supabase
      .from("account_balances")
      .update({
        investment_balance: newInvestmentBalance,
        main_balance: newMainBalance,
      })
      .eq("user_id", userId);

    if (balanceUpdateError) {
      throw balanceUpdateError;
    }

    // Log transactions
    // 1. Principal return transaction
    const { error: principalTxError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: "profit",
        amount: principal,
        balance_after: newMainBalance,
        description: "Investment principal returned",
        reference_id: investmentId,
      });

    if (principalTxError) {
      throw principalTxError;
    }

    // 2. Profit return transaction
    const { error: profitTxError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: "profit",
        amount: profit,
        balance_after: newMainBalance,
        description: `Investment profit (${((profit / principal) * 100).toFixed(1)}%)`,
        reference_id: investmentId,
      });

    if (profitTxError) {
      throw profitTxError;
    }

    // Send notification to user
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        title: "Investment Completed!",
        message: `Your investment of $${principal} has matured. You received $${profit} in profits. Total $${totalReturn} has been returned to your Main Wallet.`,
        category: "investment_updates",
      });

    if (notificationError) {
      console.error("Notification error:", notificationError);
      // Don't throw - notification failure shouldn't block completion
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Investment completed successfully",
        investment_id: investmentId,
        principal_returned: principal,
        profit_returned: profit,
        total_returned: totalReturn,
        new_main_balance: newMainBalance,
        new_investment_balance: newInvestmentBalance,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error completing investment:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to complete investment",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
