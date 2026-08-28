// The incident ledger: what broke on the systems behind this profile, and how
// long it stayed broken.
//
// This is the half of the control loop a status board always leaves out. A
// board shows the present, which anyone can make look green by choosing what to
// measure. A ledger shows the history, including the eight days something was
// red, and it is the only artifact here that cannot be flattered.
//
// Publishing your own MTTR is the point. It is also the reason to keep the
// entries honest: an incident quietly deleted is worse than one never recorded.
//
// Reads data/incidents.json. No network, so this cannot fail on a fetch. An
// empty or malformed ledger exits 1 rather than rendering a reassuring blank.
import { readFileSync, writeFileSync } from "node:fs";

const T = {
  dark: { bg: "#0d1117", panel: "#161b22", fg: "#e6edf3", dim: "#7d8590", line: "#21262d",
          ok: "#3fb950", accent: "#a371f7",
          sev: { critical: "#f85149", high: "#db6d28", medium: "#d29922", low: "#7d8590" } },
  light: { bg: "#ffffff", panel: "#f6f8fa", fg: "#1f2328", dim: "#59636e", line: "#d1d9e0",
           ok: "#1a7f37", accent: "#7F52FF",
           sev: { critical: "#cf222e", high: "#bc4c00", medium: "#9a6700", low: "#59636e" } },
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

// Naive wrap on a monospace grid: character count is a good enough width model
// when every glyph is the same width.
function wrap(text, cols) {
  const out = [], words = text.split(" ");
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > cols) { out.push(line.trim()); line = w; }
    else line += " " + w;
  }
  if (line.trim()) out.push(line.trim());
  return out;
}

function svg(inc, t, stamp) {
  const W = 900, PADX = 22, TOP = 104, COLS = 118;
  let y = TOP;
  const body = [];

  for (const i of inc) {
    const sev = t.sev[i.severity] || t.dim;
    const ttr = i.resolved ? days(i.detected, i.resolved) : null;
    const dur = ttr === null ? "OPEN" : ttr === 0 ? "same day" : `${ttr}d open`;
    body.push(
      `<rect x="${PADX}" y="${y}" width="3" height="16" fill="${sev}"/>` +
      `<text x="${PADX + 12}" y="${y + 12}" class="ti">${esc(i.title)}</text>` +
      `<text x="${W - PADX}" y="${y + 12}" class="dur" fill="${ttr ? sev : t.ok}">${dur}</text>`,
    );
    y += 19;
    body.push(`<text x="${PADX + 12}" y="${y + 10}" class="meta">${esc(i.surface)}  ·  ${i.detected} to ${i.resolved || "now"}  ·  ${i.severity}</text>`);
    y += 17;
    for (const ln of wrap(i.cause, COLS)) { body.push(`<text x="${PADX + 12}" y="${y + 10}" class="cause">${esc(ln)}</text>`); y += 14; }
    for (const ln of wrap("FIX: " + i.fix, COLS)) { body.push(`<text x="${PADX + 12}" y="${y + 10}" class="fix">${esc(ln)}</text>`); y += 14; }
    y += 12;
    body.push(`<line x1="${PADX}" y1="${y - 6}" x2="${W - PADX}" y2="${y - 6}" stroke="${t.line}"/>`);
  }

  const H = y + 30;
  const ttrs = inc.filter((i) => i.resolved).map((i) => days(i.detected, i.resolved));
  const mttr = ttrs.length ? (ttrs.reduce((a, b) => a + b, 0) / ttrs.length).toFixed(1) : "n/a";
  const open = inc.filter((i) => !i.resolved).length;
  const worst = Math.max(...ttrs, 0);

  const stats = [
    ["RECORDED", String(inc.length)], ["OPEN", String(open)],
    ["MEAN TIME TO FIX", `${mttr}d`], ["WORST", `${worst}d`],
  ].map(([k, v], i) => {
    const x = PADX + i * 205;
    return `<text x="${x}" y="66" class="lk">${k}</text><text x="${x}" y="88" class="lv">${v}</text>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Incident ledger: ${inc.length} recorded incidents on the systems behind this profile, ${open} open, mean time to fix ${mttr} days">
<style>
  text{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
  .t{font-size:15px;font-weight:700;fill:${t.fg}}
  .sub{font-size:11px;fill:${t.dim}}
  .lk{font-size:9px;fill:${t.dim};letter-spacing:.14em}
  .lv{font-size:17px;font-weight:700;fill:${t.accent}}
  .ti{font-size:12px;font-weight:700;fill:${t.fg}}
  .dur{font-size:10.5px;font-weight:700;text-anchor:end}
  .meta{font-size:9.5px;fill:${t.dim}}
  .cause{font-size:10.5px;fill:${t.fg}}
  .fix{font-size:10.5px;fill:${t.ok}}
  .f{font-size:9.5px;fill:${t.dim}}
</style>
<rect width="${W}" height="${H}" rx="8" fill="${t.bg}"/>
<rect x="0" y="0" width="${W}" height="96" fill="${t.panel}"/>
<text x="${PADX}" y="28" class="t">What broke, and how long it stayed broken</text>
<text x="${PADX}" y="46" class="sub">Every incident on the systems behind this profile. A board shows the present, which is easy to make green. This is the part that cannot be flattered.</text>
${stats}
<line x1="0" y1="96" x2="${W}" y2="96" stroke="${t.line}"/>
${body.join("")}
<text x="${PADX}" y="${H - 10}" class="f">Generated ${stamp} from data/incidents.json. Dates trace to workflow runs, generatedAt stamps and git history.</text>
</svg>`;
}

try {
  const inc = JSON.parse(readFileSync("data/incidents.json", "utf8")).incidents;
  if (!Array.isArray(inc) || !inc.length) {
    console.error("[gen-ledger] no incidents parsed, refusing to write a reassuring blank ledger.");
    process.exitCode = 1;
  } else {
    const bad = inc.filter((i) => !i.title || !i.detected || !i.cause || !i.fix);
    if (bad.length) {
      console.error(`[gen-ledger] ${bad.length} incident(s) missing a required field:`, bad.map((b) => b.id));
      process.exitCode = 1;
    } else {
      const stamp = new Date().toISOString().slice(0, 10);
      const sorted = [...inc].sort((a, b) => (b.detected).localeCompare(a.detected));
      for (const [name, t] of Object.entries(T)) writeFileSync(`assets/ledger-${name}.svg`, svg(sorted, t, stamp));
      console.log(`[gen-ledger] ${inc.length} incidents, ${inc.filter((i) => !i.resolved).length} open`);
    }
  }
} catch (err) {
  console.error("[gen-ledger] could not read the ledger,", err.message);
  process.exitCode = 1;
}
