const { TARGETS, pingAll } = require("../lib/monitor");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const targets = await pingAll();
  return res.status(200).json({
    service: "TEDDY-XMD AutoPing",
    intervalMs: 60000,
    serverTime: new Date().toISOString(),
    targetsConfigured: TARGETS.length,
    targets
  });
};
