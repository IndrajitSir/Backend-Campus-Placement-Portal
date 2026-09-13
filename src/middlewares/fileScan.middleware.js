// ---------------------------------------------------------------------------
// Upload guard — runs AFTER multer (disk temp file) and BEFORE the controller
// / Cloudinary. Steps:
//   1. size check (MAX_UPLOAD_MB)
//   2. content-signature check via file-type (blocks renamed malware)
//   3. image sanitization via sharp (strips EXIF/GPS/all metadata)
//   4. ClamAV virus scan (fail-closed by default, see utils/clamav.js)
// On any failure the temp file is removed and nothing reaches the DB/Cloudinary.
// ---------------------------------------------------------------------------

import fs from "node:fs";
import { fileTypeFromFile } from "file-type";
import sharp from "sharp";
import { scanFile } from "../utils/clamav.js";

const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_MB || "10", 10);
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

const reject = (res, status, message) =>
  res.status(status).json({ success: false, statusCode: status, message, data: null });

export const scanAndSanitize = ({ field, allowedMimes, isImage = false }) =>
  async (req, res, next) => {
    const file = req.file;
    if (!file) return next(); // missing file — let the controller respond

    // Compat shim: the existing controllers read req.files?.[field][0].path,
    // but multer's .single() only sets req.file. Normalize so uploads work.
    req.files = { ...(req.files || {}), [field]: [file] };

    const tempPath = file.path;
    const cleanup = () => {
      try {
        fs.unlinkSync(tempPath);
      } catch (e) {
        /* already gone */
      }
    };

    try {
      // 1. Size
      if (file.size > MAX_UPLOAD_BYTES) {
        cleanup();
        return reject(res, 413, `File exceeds the maximum size of ${MAX_UPLOAD_MB} MB`);
      }

      // 2. Content signature (not the client-supplied extension)
      const detected = await fileTypeFromFile(tempPath);
      const detectedMime = detected?.mime || null;
      if (!detectedMime || !allowedMimes.includes(detectedMime)) {
        cleanup();
        return reject(
          res,
          415,
          `Unsupported file type${detectedMime ? ` (${detectedMime})` : ""}. Allowed: ${allowedMimes.join(", ")}`
        );
      }

      // 3. Image sanitization — remove EXIF/GPS/all metadata before anything
      //    else sees the bytes (write to a temp sibling, then swap in).
      if (isImage) {
        const sanitizedPath = `${tempPath}.sanitized`;
        await sharp(tempPath).rotate().withMetadata(false).toFile(sanitizedPath);
        fs.renameSync(sanitizedPath, tempPath);
      }

      // 4. ClamAV scan (fail-closed unless CLAMAV_FAIL_OPEN=true)
      const scan = await scanFile(tempPath);
      if (!scan.ok) {
        cleanup();
        const message = scan.virus
          ? `File is infected with a virus${scan.virus !== "unknown" ? `: ${scan.virus}` : ""}`
          : scan.error || "Virus scan could not be completed";
        return reject(res, 422, message);
      }

      next();
    } catch (err) {
      cleanup();
      return reject(res, 500, "File validation failed. Please try again.");
    }
  };
