const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

function niceDate(value) {
  if (!value) return "Not yet";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "Not yet" : d.toLocaleString();
}

function render(data) {
  const targets = data.targets || [];
  const online = targets.filter(t => t.status === "Online").length;
  const issues = targets.filter(t => t.status === "Issue").length;
  $("total").textContent = data.targetsConfigured ?? targets.length;
  $("online").textContent = online;
  $("issues").textContent = issues;
  $("updated").textContent = new Date().toLocaleTimeString();

  if (!targets.length) {
    $("sites").innerHTML = `<div class="empty"><div class="empty-icon">＋</div><h3>No websites configured</h3><p>Open <code>server.js</code> and add your website URLs to the <code>TARGETS</code> list.</p></div>`;
    return;
  }

  $("sites").innerHTML = targets.map(t => {
    const cls = t.status === "Online" ? "online" : t.status === "Issue" ? "issue" : "waiting";
    return `<article class="site-card">
      <div class="site-head"><div class="site-url">${esc(t.url)}</div><span class="badge ${cls}">${esc(t.status)}</span></div>
      <div class="site-meta">
        <div><span>RESPONSE</span><strong>${t.responseTimeMs == null ? "—" : esc(t.responseTimeMs + " ms")}</strong></div>
        <div><span>HTTP CODE</span><strong>${t.statusCode == null ? "—" : esc(t.statusCode)}</strong></div>
        <div><span>CHECKS</span><strong>${esc(t.checks ?? 0)}</strong></div>
      </div>
      <div class="site-message">Last checked: ${esc(niceDate(t.lastChecked))} · ${esc(t.message || "")}</div>
    </article>`;
  }).join("");
}

async function refresh() {
  try {
    const res = await fetch("/api/status", { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load status");
    render(await res.json());
  } catch (err) {
    $("updated").textContent = "Offline";
  }
}

$("pingBtn").addEventListener("click", async () => {
  const btn = $("pingBtn");
  btn.disabled = true;
  btn.textContent = "↻ Pinging...";
  try {
    const res = await fetch("/api/ping-now", { method: "POST" });
    const data = await res.json();
    if (!res.ok) alert(data.error || "Ping request failed.");
    await refresh();
  } catch {
    alert("Could not contact the AutoPing server.");
  } finally {
    btn.disabled = false;
    btn.textContent = "↻ Ping all now";
  }
});

refresh();
setInterval(refresh, 10000);
