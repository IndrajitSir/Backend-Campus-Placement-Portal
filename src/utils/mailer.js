import logger from "./Logger/logger.js";

let transporterPromise = null;
let resendPromise = null;

const getTransporter = () => {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        return null;
      }
      const mod = await import("nodemailer");
      return mod.default.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
    })().catch((err) => {
      logger.error(`Mail: nodemailer init failed: ${err?.message}`);
      transporterPromise = null; // allow a retry on the next call
      return null;
    });
  }
  return transporterPromise;
};

const getResend = () => {
  if (!resendPromise) {
    resendPromise = (async () => {
      if (!process.env.RESEND_API_KEY) return null;
      const { Resend } = await import("resend");
      return new Resend(process.env.RESEND_API_KEY);
    })().catch((err) => {
      logger.error(`Mail: resend init failed: ${err?.message}`);
      resendPromise = null;
      return null;
    });
  }
  return resendPromise;
};

/**
 * True when at least one provider (nodemailer/SMTP or Resend) is configured.
 * Used to gate jobs like the deadline-reminder sweep.
 */
export const mailProvidersConfigured = () =>
  Boolean(
    (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) ||
      process.env.RESEND_API_KEY
  );

/**
 * Sends an email by trying providers in MAIL_PROVIDER_ORDER
 * (default "nodemailer,resend"); falls through to the next provider when
 * one is unconfigured or fails. Throws only when every provider failed or
 * none is configured — the caller decides how to treat the failure.
 *
 * @param {{to: string, subject: string, text?: string, html?: string, from?: string}} msg
 * @returns {Promise<{provider: "nodemailer"|"resend"}>}
 */
export const sendEmail = async ({ to, subject, text, html, from } = {}) => {
  if (!to || !subject) {
    throw new Error("sendEmail: to and subject are required");
  }

  const order = (process.env.MAIL_PROVIDER_ORDER || "nodemailer,resend")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const failures = [];

  for (const provider of order) {
    try {
      if (provider === "nodemailer") {
        const transporter = await getTransporter();
        if (!transporter) continue; // SMTP not configured — try next provider
        await transporter.sendMail({
          from: from || process.env.SMTP_FROM || process.env.SMTP_USER,
          to,
          subject,
          text,
          html,
        });
        return { provider: "nodemailer" };
      }

      if (provider === "resend") {
        const resend = await getResend();
        if (!resend) continue; // RESEND_API_KEY not set — try next provider
        const { data, error } = await resend.emails.send({
          // The sandbox key only allows onboarding@resend.dev; set
          // RESEND_FROM once you verify a domain in the Resend dashboard.
          from: from || process.env.RESEND_FROM || "onboarding@resend.dev",
          to,
          subject,
          text,
          html,
        });
        if (error) {
          throw new Error(typeof error === "string" ? error : error?.message || "unknown error");
        }
        return { provider: "resend", id: data?.id };
      }

      failures.push(`unknown provider "${provider}"`);
    } catch (err) {
      failures.push(`${provider}: ${err?.message || err}`);
      logger.error(`Mail provider "${provider}" failed for ${to}: ${err?.message || err}`);
    }
  }

  if (failures.length) {
    throw new Error(`All mail providers failed — ${failures.join(" | ")}`);
  }
  throw new Error("No mail provider configured — set SMTP_* or RESEND_API_KEY");
};
