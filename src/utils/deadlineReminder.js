import logger from "./Logger/logger.js";
import { createAndEmitNotification } from "./notify.js";

const INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours
const WINDOW_DAYS = 3;

const runReminderSweep = async (io, mailer) => {
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

  // Lazy transporter: built once per sweep from the configured SMTP env vars.
  const transporter = mailer?.createTransport
    ? mailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
    : null;

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

      // Best-effort email: a send failure is logged and the loop continues.
      if (transporter && student.email) {
        try {
          await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
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
 * Env-gated deadline reminder loop. Returns immediately (no-op) unless SMTP
 * is fully configured (SMTP_HOST, SMTP_USER, SMTP_PASS).
 */
export const startDeadlineReminder = () => {
  const smtpConfigured =
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (!smtpConfigured) {
    logger.info("Deadline reminder disabled: SMTP not configured");
    return;
  }

  // nodemailer is loaded lazily so a missing dependency never crashes boot.
  const mailerPromise = import("nodemailer")
    .then((mod) => mod.default)
    .catch((err) => {
      logger.error(`Could not load nodemailer: ${err?.message}`);
      return null;
    });

  setInterval(() => {
    Promise.resolve(mailerPromise)
      .then((mailer) => {
        if (!mailer) return null;
        return runReminderSweep(global.__io || null, mailer);
      })
      .catch((err) => {
        logger.error(`Deadline reminder sweep failed: ${err?.message}`);
      });
  }, INTERVAL_MS);

  logger.info("Deadline reminder started (every 6h, 3-day window)");
};
