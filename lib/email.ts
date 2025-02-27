/**
 * Email service
 * Uses Nodemailer to send real emails in production and falls back to mock implementation in development
 */
import nodemailer from "nodemailer";

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Sends an email to the specified recipient
 * @param to - Recipient email address
 * @param subject - Email subject line
 * @param content - Email body content (HTML or text)
 */
export async function sendEmail(
  to: string,
  subject: string,
  content: string,
): Promise<EmailResponse> {
  try {
    // Create a nodemailer transporter using environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Send the email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html: content,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Email sending failed:", error);

    // Return error response
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown email error",
    };
  }
}
