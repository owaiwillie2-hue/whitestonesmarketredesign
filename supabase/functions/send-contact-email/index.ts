import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "resend";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactFormRequest {
  name: string;
  telephone: string;
  email: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, telephone, email, message }: ContactFormRequest = await req.json();

    console.log("Sending contact form email from:", email);

    // Get IP address for rate limiting
    const ipAddress = req.headers.get("x-forwarded-for") || 
                      req.headers.get("x-real-ip") || 
                      "unknown";

    console.log("Request from IP:", ipAddress);

    // Initialize Supabase client for rate limiting checks
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Check rate limit: 3 submissions per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: recentSubmissions, error: checkError } = await supabase
      .from("contact_form_submissions")
      .select("id")
      .eq("ip_address", ipAddress)
      .gte("submitted_at", oneHourAgo);

    if (checkError) {
      console.error("Error checking rate limit:", checkError);
      throw new Error("Failed to verify rate limit");
    }

    console.log(`Recent submissions from ${ipAddress}: ${recentSubmissions?.length || 0}`);

    // If 3 or more submissions in the last hour, reject
    if (recentSubmissions && recentSubmissions.length >= 3) {
      console.log("Rate limit exceeded for IP:", ipAddress);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Rate limit exceeded. You can only submit 3 contact requests per hour. Please try again later." 
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Record this submission for rate limiting
    const { error: insertError } = await supabase
      .from("contact_form_submissions")
      .insert({
        ip_address: ipAddress,
        email: email,
      });

    if (insertError) {
      console.error("Error recording submission:", insertError);
      // Continue anyway - don't block the email
    }

    // Fetch the support email dynamically from website_settings
    let supportEmail = "whitestonesmarkets@gmail.com";
    try {
      const { data: settingsData } = await supabase
        .from("website_settings")
        .select("value")
        .eq("key", "company_email")
        .maybeSingle();
      if (settingsData?.value) {
        supportEmail = settingsData.value;
      }
    } catch (err) {
      console.error("Error fetching support email from DB in function:", err);
    }

    // Send email to both support addresses
    const supportEmails = [supportEmail, "tgramstore@gmail.com"];

    const emailResponse = await resend.emails.send({
      from: "Whitestones Markets <no-reply@whitestonesmarkets.com>",
      to: supportEmails,
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
              .field { margin-bottom: 20px; }
              .label { font-weight: bold; color: #1e40af; margin-bottom: 5px; display: block; }
              .value { background-color: white; padding: 12px; border-radius: 4px; border: 1px solid #e5e7eb; }
              .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">New Contact Form Submission</h1>
              </div>
              <div class="content">
                <div class="field">
                  <span class="label">Full Name:</span>
                  <div class="value">${name}</div>
                </div>
                
                <div class="field">
                  <span class="label">Telephone:</span>
                  <div class="value">${telephone}</div>
                </div>
                
                <div class="field">
                  <span class="label">Email Address:</span>
                  <div class="value">${email}</div>
                </div>
                
                <div class="field">
                  <span class="label">Message:</span>
                  <div class="value">${message || 'No message provided'}</div>
                </div>
              </div>
              <div class="footer">
                <p>This email was sent from the Whitestones Markets contact form.</p>
                <p>You can reply directly to this email to contact ${name}.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
