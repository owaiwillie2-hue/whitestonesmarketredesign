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

interface RejectKYCRequest {
  user_id: string;
  rejection_reason: string;
  rejected_by: string;
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
    const { user_id, rejection_reason, rejected_by }: RejectKYCRequest = await req.json();

    if (!user_id || !rejection_reason || !rejected_by) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update KYC status
    const { error: kycError } = await supabase
      .from("kyc_documents")
      .update({
        status: "rejected",
        reviewed_by: rejected_by,
        reviewed_at: new Date().toISOString(),
        rejection_reason,
      })
      .eq("user_id", user_id);

    if (kycError) {
      console.error("KYC rejection error:", kycError);
      return new Response(
        JSON.stringify({ error: `Failed to update KYC: ${kycError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send notification
    await supabase.from("notifications").insert({
      user_id,
      title: "KYC Rejected",
      message: `Your identity verification was rejected. Reason: ${rejection_reason}. Please resubmit with correct documents.`,
      type: "kyc_status",
    });

    return new Response(
      JSON.stringify({
        success: true,
        user_id,
        kyc_status: "rejected",
        message: "KYC rejected successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error rejecting KYC:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
