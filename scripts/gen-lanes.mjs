// Four lives on one timeline.
//
// The contribution calendar everyone posts measures one thing (commits) on one
// axis (a day) and looks identical on every profile. This uses the same visual
// language, because it is a good one and people can read it instantly, and
// points it at four dimensions that are actually his: work delivered, chess
// played, writing published, open source merged, month by month since 2019.
//
// The argument it makes is the one a table cannot: these ran in PARALLEL. A
// list of interests reads as scatter. Four lanes moving at once reads as range.
//
// Source is cv-siddharth's timeline.ts, which is itself generated from
// profile.ts employment periods, the chess corpus, the writing archive and the
// public PR record. Fetch failure leaves the committed SVGs alone; a lane that
// parses empty exits 1.
import { writeFileSync } from "node:fs";

const SRC = "https://raw.githubusercontent.com/darkpandawarrior/cv-siddharth/main/src/data/timeline.ts";

const LANES = [
  { key: "work", label: "work", hue: "#7F52FF" },
  { key: "opensource", label: "open source", hue: "#3fb950" },
  { key: "writing", label: "writing", hue: "#d29922" },
  { key: "chess", label: "chess", hue: "#58a6ff" },
];

const T = {
  dark: { bg: "#0d1117", fg: "#e6edf3", dim: "#7d8590", empty: "#161b22", line: "#21262d" },
  light: { bg: "#ffffff", fg: "#1f2328", dim: "#59636e", empty: "#eaeef2", line: "#d1d9e0" },
};

// Hex mixed toward the panel colour, so a low month reads as faint rather than
// as a different colour. Four scales that each go light-to-saturated in their
// own hue keeps the lanes distinguishable at a glance.
const mix = (hex, bg, t) => {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = p(hex), [r2, g2, b2] = p(bg);
  const c = (a, b) => Math.round(b + (a - b) * t).toString(16).padStart(2, "0");
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
};

function svg(months, lanes, t, stamp) {
  const CELL = 8, GAP = 2, STEP = CELL + GAP, GUT = 92, PADX = 20, TOP = 74;
  const W = PADX * 2 + GUT + months.length * STEP;
  const LANE_H = 26;
  const H = TOP + lanes.length * LANE_H + 46;

  const rows = lanes.map((ln, li) => {
    const y = TOP + li * LANE_H;
    const max = Math.max(...months.map((m) => ln.months[m] || 0), 1);
    const cells = months.map((m, i) => {
      const v = ln.months[m] || 0;
      const fill = v === 0 ? t.empty : mix(ln.hue, t.bg, 0.28 + 0.72 * (v / max));
      return `<rect x="${PADX + GUT + i * STEP}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${fill}"/>`;
    }).join("");
    return `<text x="${PADX + GUT - 10}" y="${y + 8}" class="ln" fill="${ln.hue}">${ln.label}</text>${cells}`;
  }).join("");

  // One tick per January, so the axis is readable without 92 labels.
  const ticks = months.map((m, i) => (m.endsWith("-01")
    ? `<text x="${PADX + GUT + i * STEP}" y="${TOP + lanes.length * LANE_H + 14}" class="yr">${m.slice(0, 4)}</text>`
    : "")).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Four lanes of activity by month since 2019: work delivered, open source merged, writing published, chess played">
<style>
  text{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
  .t{font-size:15px;font-weight:700;fill:${t.fg}}
  .sub{font-size:11px;fill:${t.dim}}
  .ln{font-size:10.5px;text-anchor:end;font-weight:600}
  .yr{font-size:9px;fill:${t.dim};text-anchor:middle}
  .f{font-size:9.5px;fill:${t.dim}}
</style>
<rect width="${W}" height="${H}" rx="8" fill="${t.bg}"/>
<text x="${PADX}" y="30" class="t">Four things at once, every month since 2019</text>
<text x="${PADX}" y="48" class="sub">Same grammar as a contribution graph, pointed at four dimensions that are actually mine. They overlap on purpose.</text>
<line x1="${PADX}" y1="${TOP - 14}" x2="${W - PADX}" y2="${TOP - 14}" stroke="${t.line}"/>
${rows}${ticks}
<text x="${PADX}" y="${H - 12}" class="f">Generated ${stamp} from cv-siddharth timeline.ts, itself derived from employment periods, the chess corpus, the writing archive and the public PR record.</text>
</svg>`;
}

try {
  const res = await fetch(SRC);
  if (!res.ok) throw new Error(`${res.status} timeline.ts`);
  const txt = await res.text();

  const months = [...txt.slice(txt.indexOf('"months": ['), txt.indexOf("]", txt.indexOf('"months": [')))
    .matchAll(/"(\d{4}-\d{2})"/g)].map((m) => m[1]);

  const lanes = LANES.map((l) => {
    const at = txt.indexOf(`"key": "${l.key}"`);
    if (at < 0) return null;
    const mo = txt.indexOf('"months": {', at);
    const seg = txt.slice(mo, txt.indexOf("}", mo));
    const map = {};
    for (const m of seg.matchAll(/"(\d{4}-\d{2})":\s*(\d+(?:\.\d+)?)/g)) map[m[1]] = +m[2];
    return Object.keys(map).length ? { ...l, months: map } : null;
  }).filter(Boolean);

  if (months.length < 24 || lanes.length < 3) {
    console.error(`[gen-lanes] parsed ${months.length} months and ${lanes.length} lanes, refusing to write a near-empty strip.`);
    console.error("  timeline.ts's shape probably changed. Fix the pattern here rather than deleting this guard.");
    process.exitCode = 1;
  } else {
    const stamp = new Date().toISOString().slice(0, 10);
    for (const [name, t] of Object.entries(T)) writeFileSync(`assets/lanes-${name}.svg`, svg(months, lanes, t, stamp));
    console.log(`[gen-lanes] ${lanes.length} lanes x ${months.length} months (${months[0]} to ${months.at(-1)})`);
  }
} catch (err) {
  console.warn("[gen-lanes] fetch failed, leaving the committed SVGs alone,", err.message);
}
