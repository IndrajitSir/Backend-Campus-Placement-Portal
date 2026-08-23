import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import logger from "../utils/Logger/logger.js";

const PISTON_API = process.env.PISTON_API_URL || "https://emkc.org/api/v2/piston/execute";

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

// Community Piston instances as fallbacks
const PISTON_FALLBACKS = [
  "https://piston-api.nico.fyi/api/v2/piston/execute",
  "https://pistonapi.up.railway.app/api/v2/piston/execute",
];

export const executeCode = asyncHandler(async (req, res) => {
  const { language, code } = req.body;

  if (!language || !code) {
    throw new ApiError(400, "Language and code are required");
  }

  const langConfig = LANGUAGE_MAP[language];
  if (!langConfig) {
    throw new ApiError(400, `Unsupported language: ${language}`);
  }

  // For SQL, wrap bare SELECT in a table setup
  let codeToSend = code;
  if (language === "sql" && code.trim().toUpperCase().startsWith("SELECT")) {
    codeToSend = `CREATE TABLE IF NOT EXISTS hello (greeting TEXT);\nINSERT OR IGNORE INTO hello VALUES ('Hello, World!');\n${code}`;
  }

  // For Java, the file must be named Main.java
  const fileName = language === "java" ? "Main.java" : `main.${language === "cpp" ? "cpp" : language === "c" ? "c" : language}`;

  const payload = {
    language: langConfig.language,
    version: langConfig.version,
    files: [{ name: fileName, content: codeToSend }],
  };

  // Try main API first, then fallbacks
  const endpoints = [PISTON_API, ...PISTON_FALLBACKS];

  for (const endpoint of endpoints) {
    try {
      logger.info(`Executing ${language} code via ${endpoint}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        logger.warn(`Piston endpoint ${endpoint} returned ${response.status}`);
        continue;
      }

      const result = await response.json();

      if (result.message) {
        // API returned an error message (e.g., not whitelisted)
        logger.warn(`Piston error from ${endpoint}: ${result.message}`);
        continue;
      }

      const stdout = result.run?.stdout || "";
      const stderr = result.run?.stderr || "";
      const compileErr = result.compile?.stderr || "";

      return res.status(200).json(new ApiResponse(200, {
        stdout,
        stderr,
        compileError: compileErr,
        success: !compileErr && !stderr,
        language,
      }, "Code executed successfully"));

    } catch (err) {
      if (err.name === "AbortError") {
        logger.warn(`Piston endpoint ${endpoint} timed out`);
        continue;
      }
      logger.warn(`Piston endpoint ${endpoint} failed: ${err.message}`);
      continue;
    }
  }

  // All endpoints failed
  throw new ApiError(503, "Code execution service is temporarily unavailable. All endpoints failed.");
});
