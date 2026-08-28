// The live control board: every claim this account makes, and whether it is
// still being maintained.
//
// This is the visual the whole freshness effort was for. Green or red is what
// GitHub already shows you. The interesting state is AMBER: a check that is
// passing while the thing underneath it ages out. That is the failure this
// profile actually hit in August 2026, three times, with a green suite.
//
// Every row is the same four fields: LED, SUBJECT, STATE, VERIFIED. Nothing
// gets a fifth. Only BROKEN pulses; nothing else on the board ever moves.
//
// Fetch failure leaves the committed SVGs alone. Parsing nothing exits 1,
// because a board that renders empty is worse than no board.
import { writeFileSync } from "node:fs";

const token = process.env.GITHUB_TOKEN;
const H = { Accept: "application/vnd.github+json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
const RAW = "https://raw.githubusercontent.com/darkpandawarrior/cv-siddharth/main/src/data";

// Live external sources on a daily cron have no business being weeks old. The
// Play Store sweep is deliberately slow and rate-limited, so it gets room.
const SLA = { "chess.ts": 21, "chessDeep.ts": 21, "weeb.ts": 21, "store.ts": 45, "timeline.ts": 45 };

const WORKFLOWS = [
  ["cv-siddharth", "CI"], ["cv-siddharth", "Refresh project media"],
  ["cv-siddharth", "Lighthouse CI"], ["cv-siddharth", "screenshot-sentinel"],
  ["darkpandawarrior", "Refresh generated content"],
  ["darkpandawarrior", "Generate contribution snake"],
];

const ago = (d) => {
  const h = Math.floor((Date.now() - Date.parse(d)) / 3.6e6);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
};

async function workflowRows() {
  const out = [];
  for (const [repo, name] of WORKFLOWS) {
    try {
      const r = await fetch(`https://api.github.com/repos/darkpandawarrior/${repo}/actions/runs?per_page=30`, { headers: H });
      if (!r.ok) continue;
      const run = (await r.json()).workflow_runs.find((w) => w.name === name);
      if (!run) continue;
      const state = run.conclusion === "success" ? "OK" : run.conclusion === null ? "RUNNING" : "BROKEN";
      out.push({ subject: `${repo}/${name}`, state, verified: ago(run.updated_at) });
    } catch { /* one workflow missing is not a reason to lose the board */ }
  }
  return out;
}

async function freshnessRows() {
  const out = [];
  for (const [file, sla] of Object.entries(SLA)) {
    try {
      const r = await fetch(`${RAW}/${file}`);
      if (!r.ok) continue;
      const t = await r.text();
      const m = /(?:"generatedAt":|[A-Za-z]*[Gg]eneratedAt\s*=)\s*"(\d{4}-\d{2}-\d{2})/.exec(t);
      if (!m) { out.push({ subject: `${file} (no stamp)`, state: "BROKEN", verified: "unknown" }); continue; }
      const days = Math.floor((Date.now() - Date.parse(m[1])) / 864e5);
      // Amber at 70% of the deadline: the whole point is to see rot coming.
      const state = days > sla ? "BROKEN" : days > sla * 0.7 ? "DEGRADED" : "OK";
      out.push({ subject: `${file}`, state, verified: `${days}d / ${sla}d` });
    } catch { /* keep going */ }
  }
  return out;
}

const T = {
  dark: { bg: "#0d1117", panel: "#161b22", fg: "#e6edf3", dim: "#7d8590", line: "#21262d",
          ok: "#3fb950", warn: "#d29922", bad: "#f85149", accent: "#a371f7" },
  light: { bg: "#ffffff", panel: "#f6f8fa", fg: "#1f2328", dim: "#59636e", line: "#d1d9e0",
           ok: "#1a7f37", warn: "#9a6700", bad: "#cf222e", accent: "#7F52FF" },
};

function svg(groups, loop, t, stamp) {
  const W = 900, ROW = 21, PADX = 22;
  const headerH = 96;
  let y = headerH;
  const body = [];

  for (const g of groups) {
    body.push(`<text x="${PADX}" y="${y + 12}" class="h">${g.title}</text>`);
    y += 26;
    for (const r of g.rows) {
      const c = r.state === "OK" ? t.ok : r.state === "DEGRADED" ? t.warn : r.state === "RUNNING" ? t.dim : t.bad;
      // Only BROKEN breathes. One moving dot in a still field reads as
      // instrumentation; six moving things read as a screensaver.
      const led = r.state === "BROKEN"
        ? `<circle cx="${PADX + 5}" cy="${y + 6}" r="4" fill="${c}" class="pulse"/>`
        : `<circle cx="${PADX + 5}" cy="${y + 6}" r="4" fill="${c}"/>`;
      body.push(
        led +
        `<text x="${PADX + 20}" y="${y + 10}" class="s">${r.subject}</text>` +
        `<text x="${W - 200}" y="${y + 10}" class="st" fill="${c}">${r.state}</text>` +
        `<text x="${W - PADX}" y="${y + 10}" class="v">${r.verified}</text>`,
      );
      y += ROW;
    }
    y += 12;
  }
  const Hh = y + 26;

  const loopCells = loop.map((l, i) => {
    const x = PADX + i * 168;
    return `<text x="${x}" y="62" class="lk">${l.k}</text><text x="${x}" y="82" class="lv">${l.v}</text>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${Hh}" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Live status board: every generated dataset and scheduled job behind this profile, with its state and age">
<style>
  text{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
  .t{font-size:15px;font-weight:700;fill:${t.fg}}
  .sub{font-size:11px;fill:${t.dim}}
  .h{font-size:10px;font-weight:700;fill:${t.dim};letter-spacing:.12em}
  .s{font-size:11.5px;fill:${t.fg}}
  .st{font-size:10.5px;font-weight:700;letter-spacing:.06em}
  .v{font-size:10.5px;fill:${t.dim};text-anchor:end}
  .lk{font-size:9px;fill:${t.dim};letter-spacing:.14em}
  .lv{font-size:17px;font-weight:700;fill:${t.accent}}
  .f{font-size:9.5px;fill:${t.dim}}
  .pulse{animation:p 1.6s ease-in-out infinite}
  @keyframes p{0%,100%{opacity:1}50%{opacity:.25}}
</style>
<rect width="${W}" height="${Hh}" rx="8" fill="${t.bg}"/>
<rect x="0" y="0" width="${W}" height="${headerH - 8}" fill="${t.panel}"/>
<text x="${PADX}" y="26" class="t">Is any of this still true?</text>
<text x="${PADX}" y="42" class="sub">Every generated dataset and scheduled job behind this profile. Amber means passing, and aging out.</text>
${loopCells}
<line x1="0" y1="${headerH - 8}" x2="${W}" y2="${headerH - 8}" stroke="${t.line}"/>
${body.join("")}
<text x="${PADX}" y="${Hh - 9}" class="f">Generated ${stamp} by scripts/gen-ops-board.mjs. States are read live from the GitHub API and from each file's own generatedAt stamp.</text>
</svg>`;
}

try {
  const [wf, fresh] = await Promise.all([workflowRows(), freshnessRows()]);
  if (!wf.length && !fresh.length) {
    console.error("[gen-ops-board] no rows resolved, refusing to write an empty board.");
    process.exitCode = 1;
  } else {
    const all = [...wf, ...fresh];
    const broken = all.filter((r) => r.state === "BROKEN").length;
    const degraded = all.filter((r) => r.state === "DEGRADED").length;
    const loop = [
      { k: "DETECT", v: String(all.length) },
      { k: "DEGRADED", v: String(degraded) },
      { k: "BROKEN", v: String(broken) },
      { k: "GREEN", v: String(all.length - broken - degraded) },
      { k: "SLA FLOOR", v: "21d" },
    ];
    const groups = [
      { title: "PIPELINES", rows: wf },
      { title: "GENERATED DATA, AGE AGAINST ITS SLA", rows: fresh },
    ].filter((g) => g.rows.length);
    const stamp = new Date().toISOString().slice(0, 10);
    for (const [name, t] of Object.entries(T)) writeFileSync(`assets/board-${name}.svg`, svg(groups, loop, t, stamp));
    console.log(`[gen-ops-board] ${all.length} rows, ${broken} broken, ${degraded} degraded`);
  }
} catch (err) {
  console.warn("[gen-ops-board] fetch failed, leaving the committed SVGs alone,", err.message);
}
