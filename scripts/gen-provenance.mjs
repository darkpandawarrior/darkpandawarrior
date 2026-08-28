// Where the writing came from.
//
// "Engineer who writes" is a claim anyone can make, and on most profiles the
// writing sits in its own section with no visible relationship to the code. The
// interesting version of the claim is the edge: each lesson traces back to a
// specific production system, and most of them trace back to the same one.
//
// That shape is the argument. Ten lessons out of Mileway is not a blog, it is a
// project that generated ten things worth writing down, which is what real
// engineering looks like from the outside. This draws the edges rather than
// asserting them.
//
// Source is the-loopdown's registry.json, which is public and generated from
// the lesson files themselves. A lesson with no project is drawn as
// unattributed rather than quietly dropped: a missing edge is information.
import { writeFileSync } from "node:fs";

const SRC = "https://raw.githubusercontent.com/darkpandawarrior/the-loopdown/main/data/registry.json";

// Where each project actually lives, so every node on the left is a real link.
const HOME = {
  Mileway: "github.com/darkpandawarrior/Mileway",
  PaymentsLab: "github.com/darkpandawarrior/PaymentsLab",
  Kursi: "github.com/darkpandawarrior/Kursi",
  "The Loopdown": "github.com/darkpandawarrior/the-loopdown",
  Dice: "production, private",
  AgentHarness: "private",
};

const T = {
  dark: { bg: "#0d1117", panel: "#161b22", fg: "#e6edf3", dim: "#7d8590", line: "#21262d", edge: "#30363d", accent: "#a371f7" },
  light: { bg: "#ffffff", panel: "#f6f8fa", fg: "#1f2328", dim: "#59636e", line: "#d1d9e0", edge: "#d1d9e0", accent: "#7F52FF" },
};
const HUES = ["#a371f7", "#3fb950", "#d29922", "#58a6ff", "#f778ba", "#7d8590"];
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function svg(groups, total, t, stamp) {
  const W = 900, PADX = 22, TOP = 92, ROW = 21, LX = PADX + 6, LW = 190, RX = PADX + 300;
  let y = TOP;
  const nodes = [], edges = [], leaves = [];

  groups.forEach((g, gi) => {
    const hue = HUES[gi % HUES.length];
    const gy = y;
    g.lessons.forEach((l) => {
      const ly = y;
      let title = l.title;
      if (title.length > 68) title = title.slice(0, 67) + "…";
      leaves.push(`<circle cx="${RX - 12}" cy="${ly + 6}" r="2.5" fill="${hue}"/>` +
        `<text x="${RX}" y="${ly + 10}" class="ls">${esc(title)}</text>`);
      // one curve per lesson, from the project node to its own row
      edges.push(`<path d="M${LX + LW} ${gy + 6} C${LX + LW + 50} ${gy + 6} ${RX - 60} ${ly + 6} ${RX - 18} ${ly + 6}" fill="none" stroke="${hue}" stroke-opacity=".38" stroke-width="1"/>`);
      y += ROW;
    });
    nodes.push(
      `<rect x="${LX}" y="${gy}" width="${LW}" height="13" rx="3" fill="${hue}" fill-opacity=".14"/>` +
      `<text x="${LX + 8}" y="${gy + 10}" class="pj" fill="${hue}">${esc(g.project)}</text>` +
      `<text x="${LX + LW - 8}" y="${gy + 10}" class="cnt" fill="${hue}">${g.lessons.length}</text>` +
      `<text x="${LX + 8}" y="${gy + 25}" class="src">${esc(HOME[g.project] || "")}</text>`,
    );
    y += 12;
  });

  const H = y + 34;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Provenance: ${total} written lessons traced back to the production systems they came from">
<style>
  text{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
  .t{font-size:15px;font-weight:700;fill:${t.fg}}
  .sub{font-size:11px;fill:${t.dim}}
  .pj{font-size:11px;font-weight:700}
  .cnt{font-size:10px;font-weight:700;text-anchor:end}
  .src{font-size:9px;fill:${t.dim}}
  .ls{font-size:10.5px;fill:${t.fg}}
  .f{font-size:9.5px;fill:${t.dim}}
</style>
<rect width="${W}" height="${H}" rx="8" fill="${t.bg}"/>
<rect x="0" y="0" width="${W}" height="${TOP - 16}" fill="${t.panel}"/>
<text x="${PADX}" y="30" class="t">Every lesson, and the system it came out of</text>
<text x="${PADX}" y="48" class="sub">${total} written pieces, traced back to the code that produced them. Ten out of one project is not a blog, it is a project worth writing down.</text>
<text x="${PADX}" y="64" class="sub">Left is the system. Right is what it taught. The edges are the claim.</text>
<line x1="0" y1="${TOP - 16}" x2="${W}" y2="${TOP - 16}" stroke="${t.line}"/>
${edges.join("")}${nodes.join("")}${leaves.join("")}
<text x="${PADX}" y="${H - 12}" class="f">Generated ${stamp} from the-loopdown registry.json, itself derived from the lesson files.</text>
</svg>`;
}

try {
  const res = await fetch(SRC);
  if (!res.ok) throw new Error(`${res.status} registry.json`);
  const lessons = (await res.json()).lessons || [];
  if (lessons.length < 3) throw new Error(`only ${lessons.length} lessons parsed`);

  const by = new Map();
  for (const l of lessons) {
    const p = l.project || "unattributed";
    if (!by.has(p)) by.set(p, []);
    by.get(p).push(l);
  }
  const groups = [...by.entries()]
    .map(([project, ls]) => ({ project, lessons: ls }))
    .sort((a, b) => b.lessons.length - a.lessons.length);

  const stamp = new Date().toISOString().slice(0, 10);
  for (const [name, t] of Object.entries(T)) writeFileSync(`assets/provenance-${name}.svg`, svg(groups, lessons.length, t, stamp));
  console.log(`[gen-provenance] ${lessons.length} lessons across ${groups.length} systems`);
} catch (err) {
  console.warn("[gen-provenance] fetch failed, leaving the committed SVGs alone,", err.message);
}
