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

interface ApproveDepositRequest {
  deposit_id: string;
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
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { deposit_id, approved_by }: ApproveDepositRequest = await req.json();

    if (!deposit_id || !approved_by) {
      return new Response(
        JSON.stringify({ error: "Missing deposit_id or approved_by" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get deposit details
    const { data: deposit, error: depositError } = await supabase
      .from("deposits")
      .select("*")
      .eq("id", deposit_id)
      .single();

    if (depositError || !deposit) {
      return new Response(
        JSON.stringify({ error: "Deposit not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (deposit.status !== "pending") {
      return new Response(
        JSON.stringify({ error: "Deposit is not pending" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user_id = deposit.user_id;
    const deposit_amount = parseFloat(deposit.amount);

    // Check if this is the user's first ever deposit
    const { data: transactionCount } = await supabase
      .from("transactions")
      .select("id", { count: "exact" })
      .eq("user_id", user_id)
      .eq("type", "deposit");

    const isFirstDeposit = !transactionCount || transactionCount.length === 0;

    // Calculate bonus (10% of first deposit)
    const bonusPercent = isFirstDeposit
      ? parseFloat(
          (
            await supabase
              .from("website_settings")
              .select("value")
              .eq("key", "first_deposit_bonus_percent")
              .single()
          ).data?.value || "10"
        )
      : 0;

    const bonus = isFirstDeposit ? (deposit_amount * bonusPercent) / 100 : 0;
    const totalCredit = deposit_amount + bonus;

    // Get current balance
    const { data: currentBalance } = await supabase
      .from("account_balances")
      .select("main_balance")
      .eq("user_id", user_id)
      .single();

    const currentMainBalance = parseFloat(currentBalance?.main_balance || "0");
    const newMainBalance = currentMainBalance + deposit_amount + (bonus || 0);

    // Update account balance
    const { error: balanceError } = await supabase
      .from("account_balances")
      .update({
        main_balance: newMainBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user_id)
      .select();

    if (balanceError) {
      console.error("Balance update error:", balanceError);
      return new Response(
        JSON.stringify({ error: `Failed to update balance: ${balanceError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark deposit as approved (status: completed)
    const { error: updateError } = await supabase
      .from("deposits")
      .update({
        status: "completed",
        approved_by,
        approved_at: new Date().toISOString(),
      })
      .eq("id", deposit_id);

    if (updateError) {
      console.error("Deposit update error:", updateError);
      return new Response(
        JSON.stringify({ error: `Failed to approve deposit: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log deposit transaction
    await supabase.from("transactions").insert({
      user_id,
      type: "deposit",
      amount: deposit_amount,
      balance_after: totalCredit,
      description: `Deposit approved`,
      reference_id: deposit_id,
    });

    // Log bonus transaction if applicable
    if (bonus > 0) {
      await supabase.from("transactions").insert({
        user_id,
        type: "bonus",
        amount: bonus,
        balance_after: totalCredit,
        description: `First deposit bonus (${bonusPercent}%)`,
        reference_id: deposit_id,
      });

      // Create notification for bonus
      await supabase.from("notifications").insert({
        user_id,
        title: "Deposit Approved + Bonus!",
        message: `Your deposit of $${deposit_amount} has been approved. You received a ${bonusPercent}% bonus of $${bonus.toFixed(2)}!`,
        category: "payment_updates",
      });
    } else {
      // Create notification without bonus
      await supabase.from("notifications").insert({
        user_id,
        title: "Deposit Approved",
        message: `Your deposit of $${deposit_amount} has been approved.`,
        category: "payment_updates",
      });
    }

    // Handle referral bonus if this is the first deposit
    if (isFirstDeposit) {
      const { data: referral } = await supabase
        .from("referrals")
        .select("*")
        .eq("referred_id", user_id)
        .single();

      if (referral && !referral.bonus_paid) {
        // Calculate 10% bonus for referrer
        const referralBonusAmount = deposit_amount * 0.10;

        // Update referral record
        await supabase
          .from("referrals")
          .update({
            bonus_amount: referralBonusAmount,
            bonus_paid: true,
          })
          .eq("id", referral.id);

        // Get referrer's current balance
        const { data: referrerBalance } = await supabase
          .from("account_balances")
          .select("main_balance")
          .eq("user_id", referral.referrer_id)
          .single();

        const referrerCurrentBalance = parseFloat(referrerBalance?.main_balance || "0");
        const newReferrerBalance = referrerCurrentBalance + referralBonusAmount;

        // Credit bonus to referrer's account
        await supabase
          .from("account_balances")
          .update({
            main_balance: newReferrerBalance,
          })
          .eq("user_id", referral.referrer_id);

        // Create transaction for referrer
        await supabase.from("transactions").insert({
          user_id: referral.referrer_id,
          type: "referral",
          amount: referralBonusAmount,
          balance_after: newReferrerBalance,
          reference_id: referral.id,
          description: `Referral bonus - $${deposit_amount} deposit by referred user`,
        });

        // Send notification to referrer
        await supabase.from("notifications").insert({
          user_id: referral.referrer_id,
          title: "Referral Bonus Received!",
          message: `You've earned $${referralBonusAmount.toFixed(2)} referral bonus from your referred user's first deposit.`,
          category: "payment_updates",
        });

        console.log(`Referral bonus of $${referralBonusAmount} credited to referrer ${referral.referrer_id}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        deposit_id,
        amount_credited: totalCredit,
        bonus: bonus,
        message: isFirstDeposit ? "First deposit approved with bonus!" : "Deposit approved",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
