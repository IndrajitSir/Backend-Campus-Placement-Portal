// ---------------------------------------------------------------------------
// Code-execution engine registry — Piston + Judge0 + OneCompiler with ordered
// failover.
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
//   onecompiler    → https://onecompiler.com/api/console/run (free public API;
//                    skips languages with no OneCompiler runtime, e.g. sql)
// ---------------------------------------------------------------------------

import logger from "./Logger/logger.js";

const MAX_EXECUTION_TIMEOUT_MS = 10_000;

const SELF_HOSTED_PISTON = process.env.PISTON_API_URL || null;
const PUBLIC_PISTON = "https://emkc.org/api/v2/piston/execute";
const COMMUNITY_PISTONS = [
  "https://piston-api.nico.fyi/api/v2/piston/execute",
  "https://pistonapi.up.railway.app/api/v2/piston/execute",
];
// The public emkc.org API now requires an authorization key (obtained from
// the Piston maintainers). Sent as Authorization: Bearer <key> on public and
// community endpoints; leave blank for self-hosted-only setups.
const PISTON_API_KEY = process.env.PISTON_API_KEY || null;

const JUDGE0_URL = process.env.JUDGE0_API_URL || null;
const JUDGE0_AUTH_TOKEN = process.env.JUDGE0_AUTH_TOKEN || null;

// OneCompiler free public API (no key required). Override only if you proxy
// or self-host it.
const ONECOMPILER_URL = process.env.ONECOMPILER_API_URL || "https://onecompiler.com/api/console/run";

// OneCompiler detects the language from the file extension — the controller's
// generic "main.<language>" name would not be recognized, so use proper names.
const ONECOMPILER_FILE_NAMES = {
  javascript: "index.js",
  typescript: "index.ts",
  python: "main.py",
  java: "Main.java",
  c: "main.c",
  cpp: "main.cpp",
  php: "index.php",
  kotlin: "Main.kt",
  rust: "main.rs",
  go: "main.go",
  dart: "main.dart",
};

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

const runPiston = async (endpoint, { langConfig, codeToSend, fileName, isPublic }) => {
  const payload = {
    language: langConfig.language,
    version: langConfig.version,
    files: [{ name: fileName, content: codeToSend }],
  };

  const headers = { "Content-Type": "application/json" };
  // Only remote (public/community) endpoints need the API key; self-hosted
  // instances are protected by the network itself.
  if (isPublic && PISTON_API_KEY) {
    headers.Authorization = `Bearer ${PISTON_API_KEY}`;
  }

  const response = await fetchWithTimeout(endpoint, {
    method: "POST",
    headers,
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

// --- OneCompiler adapter ----------------------------------------------------

const runOneCompiler = async ({ language, codeToSend }) => {
  const payload = {
    language,
    files: [{ name: ONECOMPILER_FILE_NAMES[language], content: codeToSend }],
  };

  const response = await fetchWithTimeout(ONECOMPILER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`OneCompiler returned HTTP ${response.status}`);
  }

  const bodyText = await response.text();

  // /api/console/run does NOT return a single JSON body — it streams
  // newline-delimited JSON events like:
  //   {"type":"started","jobId":"...","timestamp":...}
  //   {"type":"stdout","data":"Hello, World!","timestamp":...}
  //   {"type":"stderr","data":"...","timestamp":...}
  //   {"type":"exit","exitCode":0,"executionTime":178,"timestamp":...}
  // Aggregate the stdout/stderr payloads so the output displays correctly.
  let stdout = "";
  let stderr = "";
  let compileError = "";
  let exitCode = null;
  let sawEvent = false;

  for (const line of bodyText.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let event;
    try {
      event = JSON.parse(trimmed);
    } catch {
      continue; // ignore non-JSON lines (keepalives, empty frames, …)
    }
    if (!event || typeof event !== "object") continue;
    sawEvent = true;
    switch (event.type) {
      case "stdout":
        stdout += event.data ?? "";
        break;
      case "stderr":
        stderr += event.data ?? "";
        break;
      case "compile_error":
      case "compile-error":
      case "error":
        compileError += event.data ?? event.message ?? "";
        break;
      case "exit":
        exitCode = typeof event.exitCode === "number" ? event.exitCode : exitCode;
        break;
      default:
        break; // "started", keepalives, etc.
    }
  }

  // Fallback: if the body was actually the batch JSON shape (array/object of
  // { stdout, stderr, ... } results) rather than an event stream, use it.
  if (!sawEvent) {
    try {
      const raw = JSON.parse(bodyText);
      const item = Array.isArray(raw) ? raw[0] : raw;
      if (item && typeof item === "object") {
        const status = String(item.status || "").toLowerCase();
        const exception = item.exception || item.error || "";
        return {
          stdout: (item.stdout || "").slice(0, 50_000),
          stderr: (item.stderr || "").slice(0, 50_000),
          compileError: (item.compile_output || (status === "error" || status === "failed" ? exception : ""))
            .slice(0, 50_000),
        };
      }
    } catch {
      // fall through to the error below
    }
    throw new Error("OneCompiler returned an invalid response");
  }

  // A non-zero exit with no output shouldn't look like a success.
  if (exitCode !== null && exitCode !== 0 && !stderr && !compileError) {
    stderr = `Process exited with code ${exitCode}`;
  }

  return {
    stdout: stdout.slice(0, 50_000),
    stderr: stderr.slice(0, 50_000),
    compileError: compileError.slice(0, 50_000),
  };
};

// --- Registry -------------------------------------------------------------

/**
 * Builds an ordered list of async runners for the configured engines.
 * Runners throw on failure; the controller tries them in sequence.
 */
export function buildExecutionRunners({ langConfig, codeToSend, fileName, language }) {
  const order = (process.env.CODE_EXECUTION_ENGINES || "self_piston,judge0,public_piston,community_piston,onecompiler")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const runners = [];

  for (const engine of order) {
    switch (engine) {
      case "self_piston":
        if (SELF_HOSTED_PISTON) {
          runners.push(() => runPiston(SELF_HOSTED_PISTON, { langConfig, codeToSend, fileName, isPublic: false }));
        }
        break;
      case "public_piston":
        runners.push(() => runPiston(PUBLIC_PISTON, { langConfig, codeToSend, fileName, isPublic: true }));
        break;
      case "community_piston":
        for (const url of COMMUNITY_PISTONS) {
          runners.push(() => runPiston(url, { langConfig, codeToSend, fileName, isPublic: true }));
        }
        break;
      case "judge0":
        if (JUDGE0_URL && JUDGE0_LANGUAGE_IDS[language]) {
          runners.push(() => runJudge0({ language, codeToSend }));
        } else if (JUDGE0_URL) {
          logger.warn(`Judge0 has no runtime for language "${language}" — skipping`);
        }
        break;
      case "onecompiler":
        if (ONECOMPILER_FILE_NAMES[language]) {
          runners.push(() => runOneCompiler({ language, codeToSend }));
        } else {
          logger.warn(`OneCompiler has no runtime for language "${language}" — skipping`);
        }
        break;
      default:
        logger.warn(`Unknown code execution engine: "${engine}" — skipping`);
    }
  }

  return runners;
}
