const express = require("express");
const https = require("https");
const http = require("http");
const { URL } = require("url");

const app = express();
const PORT = process.env.PORT || 3000;

// Add your own website URLs here. Use full https:// or http:// URLs.
// Keep this list to websites you own or have permission to monitor.
const TARGETS = [
  "https://pair-teddyxmd.bonto.run/",
//  "https://EDIT-SECOND-WEBSITE-HERE.com/"
];

const INTERVAL_MS = 60 * 1000; // Every one minute
const TIMEOUT_MS = 15000;
const MAX_LOGS_PER_TARGET = 30;

app.disable("x-powered-by");
app.use(express.static("public"));
app.use(express.json({ limit: "10kb" }));

const state = new Map();

function ensureTarget(url) {
  if (!state.has(url)) {
    state.set(url, {
      url,
      status: "Waiting",
      statusCode: null,
      responseTimeMs: null,
      lastChecked: null,
      message: "Not checked yet",
      checks: 0,
      failures: 0,
      logs: []
    });
  }
  return state.get(url);
}

function validateTarget(raw) {
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`Invalid URL: ${raw}`);
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`Only HTTP/HTTPS URLs are supported: ${raw}`);
  }
  if (parsed.username || parsed.password) {
    throw new Error("URLs containing usernames or passwords are not supported.");
  }
  return parsed.toString();
}

function requestOnce(target) {
  return new Promise((resolve) => {
    const started = Date.now();
    let parsed;
    try {
      parsed = new URL(target);
    } catch (error) {
      return resolve({ ok: false, statusCode: null, ms: 0, message: error.message });
    }

    const transport = parsed.protocol === "https:" ? https : http;
    const req = transport.request(parsed, {
      method: "GET",
      timeout: TIMEOUT_MS,
      headers: {
        "User-Agent": "TEDDY-XMD-AutoPing/1.0",
        "Accept": "*/*"
      }
    }, (res) => {
      // Drain the response so the connection can close cleanly.
      res.resume();
      const ms = Date.now() - started;
      const code = res.statusCode || null;
      // Any HTTP response means the host responded. 2xx-4xx are considered
      // reachable; 5xx indicates an application/server error.
      const ok = code !== null && code < 500;
      resolve({
        ok,
        statusCode: code,
        ms,
        message: ok ? `HTTP ${code}` : `HTTP ${code || "unknown"}`
      });
    });

    req.on("timeout", () => req.destroy(new Error("Request timed out")));
    req.on("error", (error) => {
      resolve({
        ok: false,
        statusCode: null,
        ms: Date.now() - started,
        message: error.message || "Request failed"
      });
    });
    req.end();
  });
}

async function pingTarget(rawUrl) {
  const target = ensureTarget(rawUrl);
  const result = await requestOnce(rawUrl);
  const checkedAt = new Date().toISOString();

  target.status = result.ok ? "Online" : "Issue";
  target.statusCode = result.statusCode;
  target.responseTimeMs = result.ms;
  target.lastChecked = checkedAt;
  target.message = result.message;
  target.checks += 1;
  if (!result.ok) target.failures += 1;

  target.logs.unshift({
    at: checkedAt,
    status: target.status,
    statusCode: result.statusCode,
    responseTimeMs: result.ms,
    message: result.message
  });
  target.logs = target.logs.slice(0, MAX_LOGS_PER_TARGET);
  console.log(`[AutoPing] ${target.status} ${rawUrl} - ${result.message} (${result.ms}ms)`);
  return target;
}

async function pingAll() {
  if (!TARGETS.length) {
    console.log("[AutoPing] No targets configured. Add URLs to TARGETS in server.js.");
    return;
  }
  // Run sequentially to avoid creating a burst of requests.
  for (const raw of TARGETS) {
    try {
      await pingTarget(raw);
    } catch (error) {
      console.error(`[AutoPing] Failed for ${raw}:`, error.message);
    }
  }
}

// Validate configured URLs at startup and initialize dashboard state.
for (const raw of TARGETS) {
  const valid = validateTarget(raw);
  ensureTarget(valid);
}

// API for dashboard only; targets are configured in server.js.
app.get("/api/status", (_req, res) => {
  res.json({
    service: "TEDDY-XMD AutoPing",
    intervalMs: INTERVAL_MS,
    serverTime: new Date().toISOString(),
    targetsConfigured: TARGETS.length,
    targets: TARGETS.map((raw) => ensureTarget(raw))
  });
});

app.post("/api/ping-now", async (_req, res) => {
  if (!TARGETS.length) {
    return res.status(400).json({ error: "No websites configured in TARGETS inside server.js." });
  }
  const results = [];
  for (const raw of TARGETS) results.push(await pingTarget(raw));
  res.json({ ok: true, results });
});

app.get("/health", (_req, res) => res.json({ ok: true, service: "TEDDY-XMD AutoPing" }));

app.listen(PORT, () => {
  console.log(`TEDDY-XMD AutoPing listening on port ${PORT}`);
  console.log(`Configured websites: ${TARGETS.length}`);
  // Run immediately after startup, then every minute.
  pingAll();
  setInterval(pingAll, INTERVAL_MS);
});
