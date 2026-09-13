import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import logger from "../utils/Logger/logger.js";
import { buildExecutionRunners } from "../utils/codeExecEngines.js";

// Security limits
const MAX_CODE_BYTES = 100_000; // 100 KB
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;

// Simple in-memory rate limiter per user
const rateLimitMap = new Map();
function checkRateLimit(userId) {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(userId, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  return entry.count <= MAX_REQUESTS_PER_WINDOW;
}

const LANGUAGE_MAP = {
  javascript: { language: "javascript", version: "18.15.0" },
  typescript: { language: "typescript", version: "5.0.3" },
  python: { language: "python", version: "3.10.0" },
  java: { language: "java", version: "15.0.2" },
  c: { language: "c", version: "10.2.0" },
  cpp: { language: "c++", version: "10.2.0" },
  php: { language: "php", version: "8.2.3" },
  kotlin: { language: "kotlin", version: "1.8.20" },
  rust: { language: "rust", version: "1.68.2" },
  go: { language: "go", version: "1.16.2" },
  dart: { language: "dart", version: "3.0.1" },
  sql: { language: "sqlite3", version: "3.36.0" },
};

export const executeCode = asyncHandler(async (req, res) => {
  const { language, code } = req.body;
  const userId = req.user?._id?.toString() || "anonymous";

  // ── Input validation ──
  if (!language || !code || typeof code !== "string") {
    throw new ApiError(400, "Language and code are required");
  }

  const langConfig = LANGUAGE_MAP[language];
  if (!langConfig) {
    throw new ApiError(400, `Unsupported language: ${language}. Supported: ${Object.keys(LANGUAGE_MAP).join(", ")}`);
  }

  // ── Rate limit per user ──
  if (!checkRateLimit(userId)) {
    logger.warn(`Rate limit exceeded for user ${userId}`);
    throw new ApiError(429, `Too many requests. Limit: ${MAX_REQUESTS_PER_WINDOW} per minute.`);
  }

  // ── Code size limit ──
  if (Buffer.byteLength(code, "utf8") > MAX_CODE_BYTES) {
    throw new ApiError(400, `Code exceeds maximum size of ${MAX_CODE_BYTES / 1000}KB`);
  }

  // ── Dangerous pattern detection ──
  const dangerousPatterns = [
    /import\s+\(\s*['"].*system['"]\s*\)/i,
    /__importlib__/,
    /ctypes\.cdll/i,
    /os\.system\(/i,
    /subprocess\./i,
    /exec\s*\(/i,
    /eval\s*\(/i,
    /child_process/i,
    /require\s*\(\s*['"]child_process['"]\s*\)/i,
    /process\.exit/i,
    /rm\s+-rf/i,
    /format\s+[a-z]:/i,
    /\bopen\s*\(/i,
    /require\s*\(\s*['"]fs['"]/i,
    /from\s+os\s+import/i,
    /import\s+os\b/i,
    /\bfs\.|-r\b.*--no-preserve-root/i,
  ];
  if (dangerousPatterns.some(p => p.test(code))) {
    logger.warn(`Blocked potentially dangerous code from user ${userId} (language: ${language})`);
    throw new ApiError(400, "Code contains potentially unsafe patterns");
  }

  // ── SQL: wrap bare SELECT in a table setup ──
  let codeToSend = code;
  if (language === "sql" && code.trim().toUpperCase().startsWith("SELECT")) {
    codeToSend = `CREATE TABLE IF NOT EXISTS hello (greeting TEXT);\nINSERT OR IGNORE INTO hello VALUES ('Hello, World!');\n${code}`;
  }

  // For Java, the file must be named Main.java
  const fileName = language === "java" ? "Main.java" : `main.${language === "cpp" ? "cpp" : language === "c" ? "c" : language}`;

  logger.info(`Executing ${language} code (user: ${userId}, size: ${Buffer.byteLength(code, "utf8")}B)`);

  // ── Try engines in configured order (default: self piston → judge0 →
  //    public piston → community pistons); each runner throws on failure ──
  const runners = buildExecutionRunners({ langConfig, codeToSend, fileName, language });
  if (!runners.length) {
    throw new ApiError(503, "Code execution service is not configured.");
  }

  for (const run of runners) {
    try {
      const result = await run();

      logger.info(`Code executed successfully (user: ${userId}, language: ${language})`);

      return res.status(200).json(new ApiResponse(200, {
        stdout: result.stdout,
        stderr: result.stderr,
        compileError: result.compileError,
        success: !result.compileError && !result.stderr,
        language,
      }, "Code executed successfully"));
    } catch (err) {
      if (err.name === "AbortError") {
        logger.warn(`Code execution engine timed out (user: ${userId}, language: ${language})`);
      } else {
        logger.warn(`Code execution engine failed (user: ${userId}, language: ${language}): ${err.message}`);
      }
    }
  }

  throw new ApiError(503, "Code execution service is temporarily unavailable. All engines failed.");
});
