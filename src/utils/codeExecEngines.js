// ---------------------------------------------------------------------------
// Code-execution engine registry — Piston + Judge0 with ordered failover.
//
// Each engine is exposed as an async runner that either returns a normalized
// result { stdout, stderr, compileError } or throws (the controller then
// tries the next engine in the configured order).
//
// Order is controlled by CODE_EXECUTION_ENGINES (comma-separated):
//   self_piston    → PISTON_API_URL (bundled Piston container)
//   judge0         → JUDGE0_API_URL (bundled Judge0 container; skips languages
//                    Judge0 has no runtime for, e.g. sql)
//   public_piston  → https://emkc.org/api/v2/piston/execute
//   community_piston → community mirrors
// ---------------------------------------------------------------------------

import logger from "./Logger/logger.js";

const MAX_EXECUTION_TIMEOUT_MS = 10_000;

const SELF_HOSTED_PISTON = process.env.PISTON_API_URL || null;
const PUBLIC_PISTON = "https://emkc.org/api/v2/piston/execute";
const COMMUNITY_PISTONS = [
  "https://piston-api.nico.fyi/api/v2/piston/execute",
  "https://pistonapi.up.railway.app/api/v2/piston/execute",
];

const JUDGE0_URL = process.env.JUDGE0_API_URL || null;
const JUDGE0_AUTH_TOKEN = process.env.JUDGE0_AUTH_TOKEN || null;

// Judge0 language_ids (standard Judge0 distribution). sql has no Judge0
// runtime — it stays Piston-only (see buildExecutionRunners).
const JUDGE0_LANGUAGE_IDS = {
  c: 50,
  cpp: 54,
  go: 60,
  java: 62,
  javascript: 63,
  php: 68,
  python: 71,
  typescript: 74,
  kotlin: 78,
  dart: 84,
};

const fetchWithTimeout = async (url, options, timeoutMs = MAX_EXECUTION_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

// --- Piston adapter -------------------------------------------------------

const runPiston = async (endpoint, { langConfig, codeToSend, fileName }) => {
  const payload = {
    language: langConfig.language,
    version: langConfig.version,
    files: [{ name: fileName, content: codeToSend }],
  };

  const response = await fetchWithTimeout(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Piston ${endpoint} returned HTTP ${response.status}`);
  }

  const result = await response.json();

  // Whitelisted / blocked endpoint response
  if (result.message && !result.run) {
    throw new Error(`Piston ${endpoint} rejected: ${result.message}`);
  }

  return {
    stdout: (result.run?.stdout || "").slice(0, 50_000),
    stderr: (result.run?.stderr || "").slice(0, 50_000),
    compileError: (result.compile?.stderr || "").slice(0, 50_000),
  };
};

// --- Judge0 adapter -------------------------------------------------------

const runJudge0 = async ({ language, codeToSend }) => {
  const url = `${JUDGE0_URL}/submissions?wait=true&base64_encoded=false&fields=stdout,stderr,compile_output,status`;
  const headers = { "Content-Type": "application/json" };
  if (JUDGE0_AUTH_TOKEN) headers["X-Auth-Token"] = JUDGE0_AUTH_TOKEN;

  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      source_code: codeToSend,
      language_id: JUDGE0_LANGUAGE_IDS[language],
      stdin: "",
    }),
  });

  if (!response.ok) {
    throw new Error(`Judge0 returned HTTP ${response.status}`);
  }

  const result = await response.json();
  if (!result || typeof result !== "object") {
    throw new Error("Judge0 returned an invalid response");
  }

  // Normalize to the same shape Piston produces.
  return {
    stdout: (result.stdout || "").slice(0, 50_000),
    stderr: (result.stderr || "").slice(0, 50_000),
    compileError: (result.compile_output || "").slice(0, 50_000),
  };
};

// --- Registry -------------------------------------------------------------

/**
 * Builds an ordered list of async runners for the configured engines.
 * Runners throw on failure; the controller tries them in sequence.
 */
export function buildExecutionRunners({ langConfig, codeToSend, fileName, language }) {
  const order = (process.env.CODE_EXECUTION_ENGINES || "self_piston,judge0,public_piston,community_piston")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const runners = [];

  for (const engine of order) {
    switch (engine) {
      case "self_piston":
        if (SELF_HOSTED_PISTON) {
          runners.push(() => runPiston(SELF_HOSTED_PISTON, { langConfig, codeToSend, fileName }));
        }
        break;
      case "public_piston":
        runners.push(() => runPiston(PUBLIC_PISTON, { langConfig, codeToSend, fileName }));
        break;
      case "community_piston":
        for (const url of COMMUNITY_PISTONS) {
          runners.push(() => runPiston(url, { langConfig, codeToSend, fileName }));
        }
        break;
      case "judge0":
        if (JUDGE0_URL && JUDGE0_LANGUAGE_IDS[language]) {
          runners.push(() => runJudge0({ language, codeToSend }));
        } else if (JUDGE0_URL) {
          logger.warn(`Judge0 has no runtime for language "${language}" — skipping`);
        }
        break;
      default:
        logger.warn(`Unknown code execution engine: "${engine}" — skipping`);
    }
  }

  return runners;
}
