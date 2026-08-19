import "server-only";
import { Resend } from "resend";

/**
 * Thin email wrapper. If RESEND_API_KEY is not configured (e.g. local dev
 * before email is set up), we log the message instead of throwing, so flows
 * that send email remain testable. In production the key must be set.
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ delivered: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Homeward <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn(
      `[email] RESEND_API_KEY not set — skipping send to ${options.to}. Subject: ${options.subject}`
    );
    return { delivered: false };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  if (error) {
    console.error("[email] send failed:", error);
    return { delivered: false };
  }
  return { delivered: true };
}
