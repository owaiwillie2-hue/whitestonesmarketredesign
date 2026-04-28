import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

interface ApproveWithdrawalRequest {
  withdrawal_id: string;
  approved_by: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const { withdrawal_id, approved_by }: ApproveWithdrawalRequest = await req.json();

    if (!withdrawal_id || !approved_by) {
      return new Response(
        JSON.stringify({ error: "Missing withdrawal_id or approved_by" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get withdrawal details
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawal_id)
      .single();

    if (withdrawalError || !withdrawal) {
      return new Response(
        JSON.stringify({ error: "Withdrawal not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (withdrawal.status !== "pending") {
      return new Response(
        JSON.stringify({ error: "Withdrawal is not pending" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const user_id = withdrawal.user_id;
    const amount = parseFloat(withdrawal.amount);
    const wallet_type = withdrawal.wallet_type;

    // Get current balance for the specific wallet
    const { data: balance } = await supabase
      .from("account_balances")
      .select("*")
      .eq("user_id", user_id)
      .single();

    const walletField = `${wallet_type}_balance`;
    const currentBalance = parseFloat(balance?.[walletField] || "0");

    if (currentBalance < amount) {
      return new Response(
        JSON.stringify({ error: "Insufficient balance" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const newBalance = currentBalance - amount;

    // Update balance - deduct from the specific wallet
    const updateData: any = {
      [walletField]: newBalance,
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from("account_balances")
      .update(updateData)
      .eq("user_id", user_id);

    // Update withdrawal status to 'completed'
    await supabase
      .from("withdrawals")
      .update({
        status: "completed",
        processed_by: approved_by,
        processed_at: new Date().toISOString(),
      })
      .eq("id", withdrawal_id);

    // Log transaction with negative amount for withdrawal
    await supabase.from("transactions").insert({
      user_id,
      type: "withdrawal",
      amount: -amount,
      description: `Withdrawal from ${wallet_type} wallet`,
      reference_id: withdrawal_id,
      status: "completed",
    });

    // Send notification
    await supabase.from("notifications").insert({
      user_id,
      title: "Withdrawal Approved",
      message: `Your withdrawal of $${amount.toFixed(2)} from ${wallet_type} wallet has been approved and processed.`,
      type: "withdrawal",
    });

    return new Response(
      JSON.stringify({
        success: true,
        withdrawal_id,
        amount,
        new_balance: newBalance,
        message: "Withdrawal approved successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error approving withdrawal:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
