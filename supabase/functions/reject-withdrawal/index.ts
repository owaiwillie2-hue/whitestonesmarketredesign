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

interface RejectWithdrawalRequest {
  withdrawal_id: string;
  rejection_reason: string;
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
    const { withdrawal_id, rejection_reason }: RejectWithdrawalRequest = await req.json();

    if (!withdrawal_id || !rejection_reason) {
      return new Response(
        JSON.stringify({ error: "Missing withdrawal_id or rejection_reason" }),
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

    // Update withdrawal status
    await supabase
      .from("withdrawals")
      .update({
        status: "rejected",
        rejection_reason,
        processed_at: new Date().toISOString(),
      })
      .eq("id", withdrawal_id);

    // Send notification
    await supabase.from("notifications").insert({
      user_id: withdrawal.user_id,
      title: "Withdrawal Rejected",
      message: `Your withdrawal request has been rejected. Reason: ${rejection_reason}`,
      type: "withdrawal",
    });

    return new Response(
      JSON.stringify({
        success: true,
        withdrawal_id,
        message: "Withdrawal rejected successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error rejecting withdrawal:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
