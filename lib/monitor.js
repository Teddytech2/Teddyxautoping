const { URL } = require("node:url");

const TARGETS = [
  "https://pair-teddyxmd.bonto.run/",
  "https://EDIT-SECOND-WEBSITE-HERE.com/"
];

const TIMEOUT_MS = 12000;

function validateTarget(raw) {
  const parsed = new URL(raw);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`Only HTTP and HTTPS targets are allowed: ${raw}`);
  }
  if (parsed.username || parsed.password) {
    throw new Error("Target URLs must not contain credentials.");
  }
  return parsed.toString();
}

async function pingTarget(raw) {
  const url = validateTarget(raw);
  const started = Date.now();

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "User-Agent": "TEDDY-XMD-AutoPing/1.1",
        "Accept": "*/*"
      }
    });

    const ms = Date.now() - started;
    const ok = response.status < 500;
    // Consume the body so the request can finish cleanly.
    try { await response.body?.cancel(); } catch {}

    return {
      url,
      status: ok ? "Online" : "Issue",
      statusCode: response.status,
      responseTimeMs: ms,
      lastChecked: new Date().toISOString(),
      message: `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      url,
      status: "Issue",
      statusCode: null,
      responseTimeMs: Date.now() - started,
      lastChecked: new Date().toISOString(),
      message: error?.name === "TimeoutError" || error?.name === "AbortError"
        ? "Request timed out"
        : (error?.message || "Request failed")
    };
  }
}

async function pingAll() {
  const results = [];
  // Run sequentially to avoid sending a burst of requests.
  for (const target of TARGETS) {
    if (target.includes("EDIT-SECOND-WEBSITE-HERE")) {
      results.push({
        url: target,
        status: "Waiting",
        statusCode: null,
        responseTimeMs: null,
        lastChecked: null,
        message: "Replace the second target in lib/monitor.js"
      });
      continue;
    }
    try {
      results.push(await pingTarget(target));
    } catch (error) {
      results.push({
        url: target,
        status: "Issue",
        statusCode: null,
        responseTimeMs: null,
        lastChecked: new Date().toISOString(),
        message: error?.message || "Invalid target URL"
      });
    }
  }
  return results;
}

module.exports = { TARGETS, pingAll };
