import { supabase } from "@/integrations/supabase/client";

interface SendEmailProps {
  email: string;
  name: string;
  type: "email-verification" | "welcome-new-investor" | "investor-newsletter-update" | "password-reset-request";
  link?: string;
}

export const sendEmail = async ({ email, name, type, link }: SendEmailProps) => {
  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: { email, name, type, link },
    });

    if (error) throw error;

    console.log("Email sent successfully:", data);
    return { success: true, data };
  } catch (err) {
    console.error("Failed to send email:", err);
    return { success: false, error: err };
  }
};
