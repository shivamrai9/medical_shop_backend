import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const RESEND_API_KEY = process.env.RESEND_API;

if (!RESEND_API_KEY) {
  console.error("❌ Provide RESEND_API inside the .env file");
  process.exit(1); // Stop execution if API key is missing
}

const resend = new Resend(RESEND_API_KEY);

const sendEmail = async ({ sendTo, subject, html }) => {
  try {
    // Validate input parameters
    if (!sendTo || !subject || !html) {
      throw new Error(
        "❌ Missing required email parameters (sendTo, subject, html)"
      );
    }

    const { data, error } = await resend.emails.send({
      from: "shivam <onboarding@resend.dev>",
      to: sendTo,
      subject,
      html,
    });

    if (error) {
      throw new Error(`❌ Resend API Error: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    throw error; // Rethrow for handling at the controller level
  }
};

export default sendEmail;
