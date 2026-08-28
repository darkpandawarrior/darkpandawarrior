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
import { THEMES, S, PAD, W, header, footer, open, close, esc, fit } from "./lib/panel.mjs";

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

const HUES = ["#a371f7", "#3fb950", "#d29922", "#58a6ff", "#f778ba", "#7d8590"];

function svg(groups, total, t, stamp) {
  const h = header({
    t,
    title: "Every lesson, and the system it came out of",
    subtitle: `${total} written pieces, traced back to the code that produced them. Left is the system, right is what it taught, and the edges are the claim.`,
    stats: groups.slice(0, 5).map((g) => [g.project.toUpperCase(), String(g.lessons.length)]),
  });

  const ROW = 21, LX = PAD + 4, LW = 178, RX = PAD + 286;
  const titleMax = W - RX - PAD;
  let y = h.height + 22;
  const nodes = [], edges = [], leaves = [];

  groups.forEach((g, gi) => {
    const hue = HUES[gi % HUES.length];
    const gy = y;
    g.lessons.forEach((l) => {
      const ly = y;
      leaves.push(`<circle cx="${RX - 13}" cy="${ly + 6}" r="2.5" fill="${hue}"/>`
        + `<text x="${RX}" y="${ly + 10}" class="row">${esc(fit(l.title, titleMax, S.row))}</text>`);
      edges.push(`<path d="M${LX + LW} ${gy + 7} C${LX + LW + 54} ${gy + 7} ${RX - 62} ${ly + 6} ${RX - 19} ${ly + 6}" fill="none" stroke="${hue}" stroke-opacity=".42" stroke-width="1"/>`);
      y += ROW;
    });
    nodes.push(`<rect x="${LX}" y="${gy}" width="${LW}" height="15" rx="3" fill="${hue}" fill-opacity=".15"/>`
      + `<text x="${LX + 9}" y="${gy + 11}" class="meta" fill="${hue}" font-weight="700">${esc(fit(g.project, LW - 44, S.meta))}</text>`
      + `<text x="${LX + LW - 9}" y="${gy + 11}" class="meta end" fill="${hue}" font-weight="700">${g.lessons.length}</text>`
      + `<text x="${LX + 9}" y="${gy + 26}" class="foot">${esc(fit(HOME[g.project] || "", LW, S.foot))}</text>`);
    y += 14;
  });

  const Hh = y + 16;
  return open({ t, w: W, h: Hh, label: `Provenance: ${total} written lessons traced to the systems that produced them` })
    + h.svg + edges.join("") + nodes.join("") + leaves.join("")
    + footer({ t, text: `Generated ${stamp} from the-loopdown registry.json, itself derived from the lesson files.`, y: Hh - 10 })
    + close();
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
  for (const t of Object.values(THEMES)) writeFileSync(`assets/provenance-${t.name}.svg`, svg(groups, lessons.length, t, stamp));
  console.log(`[gen-provenance] ${lessons.length} lessons across ${groups.length} systems`);
} catch (err) {
  console.warn("[gen-provenance] fetch failed, leaving the committed SVGs alone,", err.message);
}
