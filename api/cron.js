const { pingAll } = require("../lib/monitor");

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const results = await pingAll();
  return res.status(200).json({
    ok: true,
    service: "TEDDY-XMD AutoPing",
    checkedAt: new Date().toISOString(),
    results
  });
};
