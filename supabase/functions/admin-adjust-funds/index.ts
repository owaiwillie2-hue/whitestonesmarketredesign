import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

interface AdminAdjustFundsRequest {
  user_id: string;
  admin_id: string;
  wallet: "main" | "investment" | "profit" | "total_investment";
  amount: number; // positive = add, negative = remove
  reason: string;
  notes?: string;
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const {
      user_id,
      admin_id,
      wallet,
      amount,
      reason,
      notes,
    }: AdminAdjustFundsRequest = await req.json();

    if (!user_id || !admin_id || !wallet || amount === undefined || !reason) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify admin role (frontend should check, backend verifies)
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", admin_id)
      .eq("role", "admin")
      .single();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: "Admin authorization required" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get current balances
    const { data: balances } = await supabase
      .from("account_balances")
      .select("main_balance, investment_balance, profit_balance")
      .eq("user_id", user_id)
      .single();

    if (!balances) {
      return new Response(
        JSON.stringify({ error: "User balances not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const currentMainBalance = parseFloat(balances.main_balance || "0");
    const currentInvestmentBalance = parseFloat(balances.investment_balance || "0");
    const currentProfitBalance = parseFloat(balances.profit_balance || "0");

    let previousBalance = 0;
    let balanceAfter = 0;

    if (wallet === "total_investment") {
      // 1. Fetch user's active investment
      const { data: activeInv, error: fetchInvErr } = await supabase
        .from("investments")
        .select("*, investment_plans(*)")
        .eq("user_id", user_id)
        .eq("status", "active")
        .maybeSingle();

      if (fetchInvErr) throw fetchInvErr;

      if (activeInv) {
        const currentAmount = parseFloat(activeInv.amount || "0");
        previousBalance = currentAmount;
        const newAmount = Math.max(0, currentAmount + amount);
        balanceAfter = newAmount;

        const profitPct = parseFloat(activeInv.investment_plans?.profit_percentage || "0");
        const newExpectedProfit = newAmount * (profitPct / 100);

        // Update active investment
        const { error: updateInvErr } = await supabase
          .from("investments")
          .update({
            amount: newAmount,
            expected_profit: newExpectedProfit,
            updated_at: new Date().toISOString(),
          })
          .eq("id", activeInv.id);

        if (updateInvErr) throw updateInvErr;
      } else {
        // If amount is negative, prevent since there's no active investment to subtract from
        if (amount < 0) {
          return new Response(
            JSON.stringify({ error: "Cannot subtract from non-existent active investment" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        previousBalance = 0;
        balanceAfter = amount;

        // Determine plan to use: override or first active plan
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_plan_override_id")
          .eq("user_id", user_id)
          .single();

        let planId = profile?.current_plan_override_id;
        let planData = null;

        if (planId) {
          const { data } = await supabase
            .from("investment_plans")
            .select("*")
            .eq("id", planId)
            .single();
          planData = data;
        }

        if (!planData) {
          // Fallback: get the lowest active plan
          const { data: fallbackPlans } = await supabase
            .from("investment_plans")
            .select("*")
            .eq("is_active", true)
            .order("min_amount", { ascending: true })
            .limit(1);
          
          if (fallbackPlans && fallbackPlans.length > 0) {
            planData = fallbackPlans[0];
            planId = planData.id;
          }
        }

        if (!planData) {
          return new Response(
            JSON.stringify({ error: "No active investment plans found" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const durationInDays = Number(planData.duration_days);
        const startDate = new Date();
        const endDate = new Date();
        if (durationInDays < 1) {
          endDate.setHours(endDate.getHours() + (durationInDays * 24));
        } else {
          endDate.setDate(endDate.getDate() + durationInDays);
        }

        const expectedProfit = amount * (parseFloat(planData.profit_percentage) / 100);

        // Insert new active investment
        const { error: insertInvErr } = await supabase
          .from("investments")
          .insert({
            user_id,
            plan_id: planId,
            amount: amount,
            expected_profit: expectedProfit,
            status: "active",
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
          });

        if (insertInvErr) throw insertInvErr;
      }
    } else {
      // Calculate new balances for standard wallets
      let newMainBalance = currentMainBalance;
      let newInvestmentBalance = currentInvestmentBalance;
      let newProfitBalance = currentProfitBalance;

      if (wallet === "main") {
        previousBalance = currentMainBalance;
        newMainBalance = Math.max(0, currentMainBalance + amount);
        balanceAfter = newMainBalance;
      } else if (wallet === "investment") {
        previousBalance = currentInvestmentBalance;
        newInvestmentBalance = Math.max(0, currentInvestmentBalance + amount);
        balanceAfter = newInvestmentBalance;
      } else if (wallet === "profit") {
        previousBalance = currentProfitBalance;
        newProfitBalance = Math.max(0, currentProfitBalance + amount);
        balanceAfter = newProfitBalance;
      }

      // Prevent negative balances
      if (newMainBalance < 0 || newInvestmentBalance < 0 || newProfitBalance < 0) {
        return new Response(
          JSON.stringify({ error: "Adjustment would result in negative balance" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Update balances
      const { error: updateBalErr } = await supabase
        .from("account_balances")
        .update({
          main_balance: newMainBalance,
          investment_balance: newInvestmentBalance,
          profit_balance: newProfitBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user_id);

      if (updateBalErr) throw updateBalErr;
    }

    // Log transaction
    await supabase.from("transactions").insert({
      user_id,
      type: "bonus",
      amount: Math.abs(amount),
      balance_after: balanceAfter,
      description: `Admin adjustment: ${reason} (${amount > 0 ? "+" : ""}${amount})`,
    });

    // Create admin note
    await supabase.from("admin_notes").insert({
      admin_id,
      user_id,
      note: `Adjusted ${wallet === "total_investment" ? "total investment" : wallet + " wallet"} by $${Math.abs(amount).toFixed(2)}. Reason: ${reason}`,
      metadata: {
        amount,
        wallet,
        reason,
        admin_notes: notes,
        timestamp: new Date().toISOString(),
      },
    });

    // Send notification to user
    await supabase.from("notifications").insert({
      user_id,
      title: "Account Adjustment",
      message: `Your ${wallet === "total_investment" ? "total investment" : wallet + " wallet"} has been adjusted by $${Math.abs(amount).toFixed(2)}. Reason: ${reason}`,
      category: "general",
    });

    return new Response(
      JSON.stringify({
        success: true,
        user_id,
        wallet,
        amount_adjusted: amount,
        previous_balance: previousBalance,
        new_balance: balanceAfter,
        reason,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
