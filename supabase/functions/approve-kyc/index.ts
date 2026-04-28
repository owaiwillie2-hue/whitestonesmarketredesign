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

interface ApproveKYCRequest {
  user_id: string;
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
    const { user_id, approved_by }: ApproveKYCRequest = await req.json();

    if (!user_id || !approved_by) {
      return new Response(
        JSON.stringify({ error: "Missing user_id or approved_by" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update KYC status
    const { error: kycError } = await supabase
      .from("kyc_documents")
      .update({
        status: "approved",
        reviewed_by: approved_by,
        reviewed_at: new Date().toISOString(),
      })
      .eq("user_id", user_id);

    if (kycError) {
      console.error("KYC update error:", kycError);
      return new Response(
        JSON.stringify({ error: `Failed to update KYC: ${kycError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get KYC approval bonus amount from settings
    const { data: bonusSettings } = await supabase
      .from("website_settings")
      .select("value")
      .eq("key", "kyc_approval_bonus_amount")
      .single();

    const bonusAmount = parseFloat(bonusSettings?.value || "0");

    // Check if bonus has already been applied
    const { data: existingBonus } = await supabase
      .from("transactions")
      .select("id")
      .eq("user_id", user_id)
      .eq("type", "bonus")
      .like("description", "%KYC approval%")
      .single();

    if (existingBonus) {
      return new Response(
        JSON.stringify({ error: "KYC bonus already applied to this user" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If bonus > 0, credit it
    if (bonusAmount > 0) {
      // Get current balance
      const { data: balance } = await supabase
        .from("account_balances")
        .select("main_balance")
        .eq("user_id", user_id)
        .single();

      const currentBalance = parseFloat(balance?.main_balance || "0");
      const newBalance = currentBalance + bonusAmount;

      // Update balance
      await supabase
        .from("account_balances")
        .update({
          main_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user_id);

      // Log transaction
      await supabase.from("transactions").insert({
        user_id,
        type: "bonus",
        amount: bonusAmount,
        balance_after: newBalance,
        description: `KYC approval bonus`,
      });
    }

    // Send notification
    await supabase.from("notifications").insert({
      user_id,
      title: "KYC Approved!",
      message: `Congratulations! Your identity verification is complete${bonusAmount > 0 ? ` and a bonus of $${bonusAmount.toFixed(2)} has been added to your account.` : "."}`,
      type: "kyc_status",
    });

    return new Response(
      JSON.stringify({
        success: true,
        user_id,
        kyc_status: "approved",
        bonus_credited: bonusAmount,
        message: "KYC approved successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error approving KYC:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
