import "server-only";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

type Email = { to: string; subject: string; html: string; text: string };

/**
 * Sends transactional email through Resend when RESEND_API_KEY is configured.
 * Without a key the message is logged (development) — it is never silently dropped.
 */
export async function sendEmail(mail: Email): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    logger.info("email.not_configured — message logged instead of sent", { to: mail.to, subject: mail.subject, text: mail.text });
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: mail.to, subject: mail.subject, html: mail.html, text: mail.text }),
    });
    if (!res.ok) {
      logger.error("email.send_failed", { status: res.status, body: await res.text() });
      return false;
    }
    return true;
  } catch (e) {
    logger.error("email.send_error", { error: e });
    return false;
  }
}
