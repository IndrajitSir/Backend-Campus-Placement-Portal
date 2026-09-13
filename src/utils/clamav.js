// ---------------------------------------------------------------------------
// ClamAV client — talks to the clamav/clamav container's clamd over TCP
// (no clamav binaries needed inside the backend image).
//
// Failure policy (CLAMAV_FAIL_OPEN):
//   false (default) → fail-closed: if clamd is unreachable we report a scan
//                     failure so the caller REJECTS the upload (secure default
//                     for production).
//   true            → fail-open: log a warning and allow the upload through.
//
// When CLAMAV_HOST is unset entirely, scanning is disabled (local dev without
// the ClamAV container) and scanFile reports { disabled: true }.
// ---------------------------------------------------------------------------

import NodeClam from "clamscan";
import logger from "./Logger/logger.js";

const HOST = process.env.CLAMAV_HOST || null;
const PORT = parseInt(process.env.CLAMAV_PORT || "3310", 10);
const TIMEOUT_MS = parseInt(process.env.CLAMAV_TIMEOUT_MS || "30000", 10);
const FAIL_OPEN = process.env.CLAMAV_FAIL_OPEN === "true";

let clientPromise = null;

const getClient = () => {
  if (!HOST) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = new NodeClam()
      .init({
        clamdscan: {
          host: HOST,
          port: PORT,
          timeout: TIMEOUT_MS,
          localFallback: false,
          concurrency: 4,
        },
      })
      .then((instance) => {
        logger.info(`ClamAV connected at ${HOST}:${PORT}`);
        return instance;
      })
      .catch((err) => {
        clientPromise = null; // allow retry on next call
        logger.error(`ClamAV initialization failed: ${err.message}`);
        return null;
      });
  }
  return clientPromise;
};

/**
 * Scans a file on disk.
 * @param {string} filePath absolute path of the temp file
 * @returns {Promise<{ok: boolean, disabled?: boolean, virus?: string|null, error?: string}>}
 */
export async function scanFile(filePath) {
  if (!HOST) {
    return { ok: true, disabled: true, virus: null };
  }

  const client = await getClient();
  if (!client) {
    const message = `ClamAV unavailable (${HOST}:${PORT})`;
    if (FAIL_OPEN) {
      logger.warn(`${message} — CLAMAV_FAIL_OPEN=true, allowing upload`);
      return { ok: true, disabled: true, virus: null, error: message };
    }
    logger.error(`${message} — CLAMAV_FAIL_OPEN=false, rejecting upload`);
    return { ok: false, disabled: true, virus: null, error: message };
  }

  try {
    const { isInfected, viruses } = await client.isInfected(filePath);
    if (isInfected) {
      logger.warn(`ClamAV detected infection: ${viruses?.join(", ") || "unknown"} (${filePath})`);
      return { ok: false, virus: viruses?.[0] || "unknown" };
    }
    return { ok: true, virus: null };
  } catch (err) {
    const message = `ClamAV scan error: ${err.message}`;
    if (FAIL_OPEN) {
      logger.warn(`${message} — CLAMAV_FAIL_OPEN=true, allowing upload`);
      return { ok: true, disabled: true, virus: null, error: message };
    }
    logger.error(`${message} — CLAMAV_FAIL_OPEN=false, rejecting upload`);
    return { ok: false, disabled: true, virus: null, error: message };
  }
}
