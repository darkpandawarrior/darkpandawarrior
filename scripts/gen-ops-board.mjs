// The live control board: every claim this account makes, and whether it is
// still being maintained.
//
// Green or red is what GitHub already shows. The interesting state is AMBER: a
// check that is passing while the thing underneath it ages out. That is the
// failure this profile actually hit, three times, with a green suite.
//
// Every row is the same four fields: LED, subject, state, age. Nothing gets a
// fifth. Only BROKEN pulses; nothing else on the board ever moves.
//
// Fetch failure leaves the committed SVGs alone. Parsing nothing exits 1,
// because a board that renders empty is worse than no board.
import { writeFileSync } from "node:fs";
import { THEMES, S, PAD, W, header, footer, open, close, esc, fit } from "./lib/panel.mjs";

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
  return h < 1 ? "just now" : h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
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
      // Amber at 70% of the deadline: the point is to see rot coming, not to
      // find out about it on the day it lands.
      const state = days > sla ? "BROKEN" : days > sla * 0.7 ? "DEGRADED" : "OK";
      out.push({ subject: file, state, verified: `${days}d of ${sla}d` });
    } catch { /* keep going */ }
  }
  return out;
}

const ROW = 21;

/**
 * One row: LED, subject, then a right rail of STATE and AGE.
 *
 * The rail is fixed and right-aligned so the eye runs straight down it instead
 * of hunting across ragged text, and the subject is measured and truncated
 * against the space actually left rather than a guessed character count.
 */
function rows(items, t, y0) {
  const AGE_X = W - PAD, STATE_X = W - PAD - 104;
  const subjectMax = STATE_X - (PAD + 20) - 90;
  return items.map((r, i) => {
    const y = y0 + i * ROW;
    const c = r.state === "OK" ? t.ok : r.state === "DEGRADED" ? t.warn : r.state === "RUNNING" ? t.idle : t.bad;
    const cls = r.state === "BROKEN" ? ' class="pulse"' : "";
    return `<circle cx="${PAD + 5}" cy="${y + 6}" r="4" fill="${c}"${cls}/>`
      + `<text x="${PAD + 20}" y="${y + 10}" class="row">${esc(fit(r.subject, subjectMax, S.row))}</text>`
      + `<text x="${STATE_X}" y="${y + 10}" class="meta" fill="${c}" font-weight="700">${esc(r.state)}</text>`
      + `<text x="${AGE_X}" y="${y + 10}" class="meta end">${esc(r.verified)}</text>`;
  }).join("");
}

function svg(groups, stats, t, stamp) {
  const h = header({
    t,
    title: "Is any of this still true?",
    subtitle: "Every scheduled job and generated dataset behind this profile, with its age against its deadline. Amber means passing, and aging out.",
    stats,
  });
  let y = h.height + 24;
  const body = [];
  for (const g of groups) {
    body.push(`<text x="${PAD}" y="${y}" class="group">${esc(g.title)}</text>`);
    y += 13;
    body.push(rows(g.rows, t, y));
    y += g.rows.length * ROW + 20;
  }

  // The three states, named once. Without this the reader has to infer what
  // amber means, and amber is the entire argument.
  const leg = [["OK", t.ok, "passing"], ["DEGRADED", t.warn, "passing, past 70% of its deadline"], ["BROKEN", t.bad, "failed, or past its deadline"]];
  let lx = PAD;
  const legend = leg.map(([k, c, d]) => {
    const kw = k.length * S.meta * 0.612, dw = d.length * S.meta * 0.612;
    const seg = `<circle cx="${lx + 4}" cy="${y - 4}" r="3.5" fill="${c}"/>`
      + `<text x="${lx + 14}" y="${y}" class="meta" fill="${c}" font-weight="700">${k}</text>`
      + `<text x="${lx + 14 + kw + 7}" y="${y}" class="meta">${esc(d)}</text>`;
    lx += 14 + kw + 7 + dw + 24;
    return seg;
  }).join("");
  y += 24;

  const Hh = y + 14;
  return open({ t, w: W, h: Hh, label: `Live status board: ${stats[0][1]} checks tracked, ${stats[2][1]} broken, ${stats[1][1]} degraded` })
    + h.svg + body.join("") + legend
    + footer({ t, text: `Generated ${stamp}. States read live from the GitHub API and from each file's own generatedAt stamp.`, y: Hh - 10 })
    + close();
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
    const stats = [
      ["TRACKED", String(all.length)],
      ["DEGRADED", String(degraded)],
      ["BROKEN", String(broken)],
      ["PASSING", String(all.length - broken - degraded)],
      ["TIGHTEST SLA", "21d"],
    ];
    const groups = [
      { title: "PIPELINES", rows: wf },
      { title: "GENERATED DATA, AGE AGAINST ITS DEADLINE", rows: fresh },
    ].filter((g) => g.rows.length);
    const stamp = new Date().toISOString().slice(0, 10);
    for (const t of Object.values(THEMES)) writeFileSync(`assets/board-${t.name}.svg`, svg(groups, stats, t, stamp));
    console.log(`[gen-ops-board] ${all.length} rows, ${broken} broken, ${degraded} degraded`);
  }
} catch (err) {
  console.warn("[gen-ops-board] fetch failed, leaving the committed SVGs alone,", err.message);
}
