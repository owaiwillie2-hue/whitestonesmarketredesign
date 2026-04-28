import { Handler } from "@netlify/functions";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export const handler: Handler = async (event) => {
  try {
    if (!event.body) throw new Error("No body provided");

    const { email, name, type, link } = JSON.parse(event.body);

    let templateId = "";

    switch (type) {
      case "email-verification":
        templateId = "email-verification";   // Your Resend template name
        break;
      case "welcome-new-investor":
        templateId = "welcome-new-investor";
        break;
      case "investor-newsletter-update":
        templateId = "investor-newsletter-update";
        break;
      case "password-reset-request":
        templateId = "password-reset-request";
        break;
      default:
        return { statusCode: 400, body: "Invalid email type" };
    }

    const data = await resend.emails.send({
      from: "Whitestones Markets <no-reply@whitestonesmarkets.com>",
      to: email,
      templateId: templateId,  // FIXED
      reply_to: "support@whitestonesmarkets.com",

      // Resend SMTP variables must be lowercase & simple
      // FIXED VARIABLES:
      variables: {
        username: name,
        email: email,
        link: link   // For both verification + password reset
      },
    });

    return { 
      statusCode: 200, 
      body: JSON.stringify({ message: "Email sent", data }) 
    };

  } catch (err: any) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: err.message }) 
    };
  }
};
