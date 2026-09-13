import logger from "./Logger/logger.js";
import { createAndEmitNotification } from "./notify.js";
import { mailProvidersConfigured, sendEmail } from "./mailer.js";

const INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours
const WINDOW_DAYS = 3;

const runReminderSweep = async (io) => {
  const { Placement } = await import("../models/placement.model.js");
  const { User } = await import("../models/user.models.js");
  const { Application } = await import("../models/application.model.js");

  const now = new Date();
  const windowEnd = new Date(now.getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const placements = await Placement.find({
    last_date: { $gte: now, $lte: windowEnd },
  }).select("company_name job_title last_date");

  if (!placements.length) return;

  // Only notify actual students (never staff/admin accounts).
  const students = await User.find({ role: "student" }).select("_id email").lean();
  if (!students.length) return;

  let sent = 0;
  for (const placement of placements) {
    // Students who have NOT applied to this placement.
    const applied = await Application.find({ placement_id: placement._id }).select("user_id").lean();
    const appliedIds = new Set(applied.map((a) => a.user_id?.toString()).filter(Boolean));

    const lastDateStr = placement.last_date?.toISOString?.().slice(0, 10) || "soon";

    for (const student of students) {
      if (appliedIds.has(student._id.toString())) continue;

      const notification = await createAndEmitNotification(io, {
        userId: student._id,
        type: "announcement",
        title: "Placement closing soon",
        body: `${placement.company_name} — ${placement.job_title} closes on ${lastDateStr}. Apply before the deadline!`,
        link: "/home/dashboard/placements",
      });
      if (notification) sent++;

      // Best-effort email via the provider chain (nodemailer → Resend):
      // a send failure is logged and the loop continues.
      if (student.email) {
        try {
          await sendEmail({
            to: student.email,
            subject: "Placement closing soon",
            text: `${placement.company_name} — ${placement.job_title} closes on ${lastDateStr}. Apply before the deadline!`,
          });
        } catch (mailErr) {
          logger.error(`Deadline reminder email failed for ${student.email}: ${mailErr?.message}`);
        }
      }
    }
  }

  logger.info(`Deadline reminder sweep: created ${sent} notifications for ${placements.length} closing placements`);
};

/**
 * Env-gated deadline reminder loop. Returns immediately (no-op) unless a mail
 * provider is configured (SMTP_* or RESEND_API_KEY). Providers are tried in
 * MAIL_PROVIDER_ORDER (default nodemailer → resend) via src/utils/mailer.js.
 */
export const startDeadlineReminder = () => {
  if (!mailProvidersConfigured()) {
    logger.info("Deadline reminder disabled: no mail provider configured (set SMTP_* or RESEND_API_KEY)");
    return;
  }

  setInterval(() => {
    runReminderSweep(global.__io || null).catch((err) => {
      logger.error(`Deadline reminder sweep failed: ${err?.message}`);
    });
  }, INTERVAL_MS);

  logger.info("Deadline reminder started (every 6h, 3-day window)");
};
