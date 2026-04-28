import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl!, serviceRoleKey!);

interface LogActivityPayload {
  userId: string;
  action: string;
  ip?: string;
  location?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { ...corsHeaders, "Access-Control-Allow-Methods": "POST, OPTIONS" } });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload = (await req.json()) as LogActivityPayload;

    if (!payload.userId || !payload.action) {
      return new Response(JSON.stringify({ error: "Missing userId or action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await supabase.from("activity_logs").insert({
      user_id: payload.userId,
      action: payload.action,
      ip_address: payload.ip ?? null,
      user_agent: payload.userAgent ?? null,
      metadata: payload.metadata ?? { location: payload.location },
    });

    if (error) {
      console.error("Error inserting activity log", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error in log-activity function", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
