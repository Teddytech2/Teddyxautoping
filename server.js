// TEDDY-XMD AutoPing
// Works as a Vercel Node.js function and can also run locally with Node.js.

const TARGETS = [
  "https://pair-teddyxmd.bonto.run/"
  // Add another target on the next line, for example:
  // "https://example.com/"
];

const TIMEOUT_MS = 12000;

async function checkTarget(url) {
  const started = Date.now();

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": "TEDDY-XMD-AutoPing/1.0" }
    });

    return {
      url,
      status: response.status < 500 ? "Online" : "Issue",
      statusCode: response.status,
      responseTimeMs: Date.now() - started,
      checkedAt: new Date().toISOString(),
      message: `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      url,
      status: "Issue",
      statusCode: null,
      responseTimeMs: Date.now() - started,
      checkedAt: new Date().toISOString(),
      message: error.name === "TimeoutError" ? "Request timed out" : error.message
    };
  }
}

async function handler(req, res) {
  const parsed = new URL(req.url || "/", "https://autoping.local");
  const route = parsed.searchParams.get("route");

  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (route !== "status" && route !== "cron") {
    return res.status(404).json({
      error: "Not found",
      hint: "Use /api/status or /api/cron."
    });
  }

  const targets = await Promise.all(TARGETS.map(checkTarget));
  res.setHeader("Cache-Control", "no-store, max-age=0");

  return res.status(200).json({
    ok: true,
    service: "TEDDY-XMD AutoPing",
    checkedAt: new Date().toISOString(),
    targetsConfigured: targets.length,
    targets
  });
}

module.exports = handler;

// Optional local development server: `node server.js`
if (require.main === module) {
  const http = require("node:http");
  const fs = require("node:fs");
  const path = require("node:path");

  const port = Number(process.env.PORT || 3000);

  const localServer = http.createServer(async (req, res) => {
    const parsed = new URL(req.url || "/", `http://localhost:${port}`);

    if (parsed.pathname === "/" || parsed.pathname === "/index.html") {
      const html = fs.readFileSync(path.join(__dirname, "index.html"));
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(html);
    }

    if (parsed.pathname === "/api/status" || parsed.pathname === "/api/cron") {
      parsed.searchParams.set("route", parsed.pathname.endsWith("/cron") ? "cron" : "status");
      req.url = parsed.pathname + parsed.search;
      res.status = code => {
        res.statusCode = code;
        return res;
      };
      res.json = data => {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify(data));
      };
      return handler(req, res);
    }

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  });

  localServer.listen(port, () => {
    console.log(`TEDDY-XMD AutoPing running at http://localhost:${port}`);
  });
}
