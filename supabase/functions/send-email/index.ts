import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
  name: string;
  type: "email-verification" | "welcome-new-investor" | "investor-newsletter-update" | "password-reset-request";
  link?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, type, link }: EmailRequest = await req.json();

    console.log(`Sending ${type} email to ${email}`);

    // Map email types to Resend template IDs
    const templateMap = {
      "email-verification": "email-verification",
      "welcome-new-investor": "welcome-new-investor",
      "investor-newsletter-update": "investor-newsletter-update",
      "password-reset-request": "password-reset-request",
    };

    const templateId = templateMap[type];
    if (!templateId) {
      return new Response(
        JSON.stringify({ error: "Invalid email type" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const emailResponse = await resend.emails.send({
      from: "Whitestones Markets <no-reply@whitestonesmarkets.com>",
      to: [email],
      subject: getEmailSubject(type),
      html: getEmailHTML(type, name, link),
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ message: "Email sent successfully", data: emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function getEmailSubject(type: string): string {
  const subjects = {
    "email-verification": "Verify Your Email - Whitestones Markets",
    "welcome-new-investor": "Welcome to Whitestones Markets!",
    "investor-newsletter-update": "Whitestones Markets Newsletter Update",
    "password-reset-request": "Password Reset Request - Whitestones Markets",
  };
  return subjects[type as keyof typeof subjects] || "Whitestones Markets";
}

function getEmailHTML(type: string, name: string, link?: string): string {
  const baseStyle = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Whitestones Markets</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
  `;
  
  const footer = `
      </div>
      <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px;">
        <p>© ${new Date().getFullYear()} Whitestones Markets. All rights reserved.</p>
      </div>
    </div>
  `;

  switch (type) {
    case "email-verification":
      return `${baseStyle}
        <h2 style="color: #1f2937;">Hello ${name},</h2>
        <p style="color: #4b5563; line-height: 1.6;">Thank you for signing up with Whitestones Markets. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="background: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
      ${footer}`;

    case "welcome-new-investor":
      return `${baseStyle}
        <h2 style="color: #1f2937;">Welcome ${name}!</h2>
        <p style="color: #4b5563; line-height: 1.6;">We're excited to have you join Whitestones Markets. Your journey to financial growth starts here.</p>
        <p style="color: #4b5563; line-height: 1.6;">Explore our investment plans and start building your portfolio today.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link || 'https://whitestonesmarkets.com/dashboard'}" style="background: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Go to Dashboard</a>
        </div>
      ${footer}`;

    case "investor-newsletter-update":
      return `${baseStyle}
        <h2 style="color: #1f2937;">Hello ${name},</h2>
        <p style="color: #4b5563; line-height: 1.6;">We have important updates about your investments and market insights to share with you.</p>
        <p style="color: #4b5563; line-height: 1.6;">Check your dashboard for the latest information.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link || 'https://whitestonesmarkets.com/dashboard'}" style="background: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Updates</a>
        </div>
      ${footer}`;

    case "password-reset-request":
      return `${baseStyle}
        <h2 style="color: #1f2937;">Hello ${name},</h2>
        <p style="color: #4b5563; line-height: 1.6;">We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="background: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
        <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour.</p>
      ${footer}`;

    default:
      return `${baseStyle}<p>Email content</p>${footer}`;
  }
}

serve(handler);
