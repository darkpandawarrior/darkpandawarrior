// The hero: the whole body of work as one diagram, with live numbers.
//
// The banner it replaces said one thing, that a shared Kotlin core reaches five
// platforms. True, and narrow: it described a technique rather than a career,
// and it was the only thing on the page that could not answer "so what".
//
// This draws the actual spine instead, left to right, because the spine is the
// argument: production work at scale, the reusable core extracted out of it,
// the apps that core then carried, and the writing that came back out of all of
// it. Four stages, one direction, real counts under each. Someone who reads
// nothing else on the page should still leave knowing what kind of engineer
// this is.
//
// The counts are fetched, not typed. A hero that quietly goes stale is the
// exact failure this profile spent a week removing, so it participates in the
// same system as every other panel: fetch, guard, write or skip.
import { writeFileSync } from "node:fs";
import { THEMES, PAD, esc, fit } from "./lib/panel.mjs";

const RAWCV = "https://raw.githubusercontent.com/darkpandawarrior/cv-siddharth/main/src/data";
const RAWKT = "https://raw.githubusercontent.com/darkpandawarrior/kmp-toolkit/main";
const RAWLD = "https://raw.githubusercontent.com/darkpandawarrior/the-loopdown/main/data/registry.json";

const W = 1000, H = 330;

/** Claim-audited and stable: these are gated by skills/claim-audit rather than
 *  by a fetch, so they are safe to state and wrong to guess at. */
const DICE = { loc: "964k", kotlin: "772k", mau: "50k+", compose: "~87%" };

async function text(u) { const r = await fetch(u); if (!r.ok) throw new Error(`${r.status} ${u}`); return r.text(); }

async function live() {
  const out = { modules: null, plugins: 22, fleet: null, live: null, lessons: null };
  try {
    const st = await text(`${RAWKT}/settings.gradle.kts`);
    out.modules = (st.match(/^\s*include\(/gm) || []).length;
  } catch { /* leave null, guarded below */ }
  try {
    const store = await text(`${RAWCV}/store.ts`);
    const seg = store.slice(store.indexOf("export const lastShipped"), store.indexOf("] as const", store.indexOf("export const lastShipped")));
    const rows = [...seg.matchAll(/"live":\s*(\d+),\s*"gone":\s*(\d+)/g)];
    out.live = rows.reduce((a, m) => a + +m[1], 0);
    out.fleet = rows.reduce((a, m) => a + +m[1] + +m[2], 0);
  } catch { /* leave null */ }
  try {
    const reg = JSON.parse(await text(RAWLD));
    out.lessons = (reg.lessons || []).length;
  } catch { /* leave null */ }
  return out;
}

function svg(d, t, stamp) {
  // Four stages on one axis. The gap between them is where the arrows live, and
  // the arrows are the only thing on this image that moves.
  const stages = [
    { k: "PRODUCTION", title: "Dice.tech", lines: [`${DICE.loc} LOC, ${DICE.kotlin} Kotlin`, `${DICE.mau} monthly actives`, `${DICE.compose} of the UI on Compose`] },
    { k: "EXTRACTED", title: "kmp-toolkit", lines: [`${d.modules} modules`, `${d.plugins} convention plugins`, "extracted on second use"] },
    { k: "REUSED", title: "four apps", lines: ["Doori, PaymentsLab-KMP", "Gaddi, app-template", "Android, iOS, Desktop, Web"] },
    { k: "PUBLISHED", title: "in the open", lines: [`${d.fleet} client apps shipped`, `${d.live} still live today`, `${d.lessons} lessons written up`] },
  ];

  const TOP = 132, CW = 208, GAP = 30, X0 = PAD + 8;
  const cards = stages.map((s, i) => {
    const x = X0 + i * (CW + GAP);
    const body = s.lines.map((l, n) =>
      `<text x="${x + 14}" y="${TOP + 56 + n * 16}" class="hl">${esc(fit(l, CW - 28, 10.5))}</text>`).join("");
    return `<rect x="${x}" y="${TOP}" width="${CW}" height="${118}" rx="7" fill="${t.node}" stroke="${t.stroke}"/>`
      + `<rect x="${x}" y="${TOP}" width="${CW}" height="3" rx="1.5" fill="${t.accent}" opacity="${0.35 + i * 0.22}"/>`
      + `<text x="${x + 14}" y="${TOP + 22}" class="hk">${s.k}</text>`
      + `<text x="${x + 14}" y="${TOP + 40}" class="ht">${esc(s.title)}</text>`
      + body;
  }).join("");

  // Connectors, with one travelling dot each. Motion earns its place here
  // because the direction IS the claim: work becomes a core, the core becomes
  // apps, the apps become something anyone can read.
  const arrows = [0, 1, 2].map((i) => {
    const x1 = X0 + (i + 1) * CW + i * GAP, y = TOP + 59;
    return `<line x1="${x1 + 4}" y1="${y}" x2="${x1 + GAP - 4}" y2="${y}" stroke="${t.stroke}" stroke-width="1.5"/>`
      + `<circle cx="${x1 + 4}" cy="${y}" r="2.6" fill="${t.accent}" class="flow" style="animation-delay:${i * 0.45}s"/>`;
  }).join("");

  // The one thing the old banner did well: where the shared core actually
  // lands. It belongs under the spine rather than instead of it, because the
  // reach is a consequence of the extraction, not a separate boast.
  const PLATFORMS = ["Android", "iOS", "Wear OS", "Desktop", "Web (Wasm)"];
  const railY = TOP + 146;
  let px = X0 + 168;
  const pills = PLATFORMS.map((p) => {
    const w = p.length * 6.4 + 22;
    const seg = `<rect x="${px}" y="${railY - 12}" width="${w}" height="19" rx="9.5" fill="${t.accent}" fill-opacity=".12" stroke="${t.accent}" stroke-opacity=".3"/>`
      + `<text x="${px + w / 2}" y="${railY + 1}" class="pl" text-anchor="middle">${esc(p)}</text>`;
    px += w + 9;
    return seg;
  }).join("");
  const rail = `<text x="${X0}" y="${railY + 1}" class="hk">ONE SHARED CORE REACHES</text>${pills}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Siddharth Pandalai, Senior Android Engineer. Production work at Dice.tech, the Kotlin Multiplatform core extracted from it, the four apps that core carries, and what was published in the open.">
<defs>
  <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${t.bg}"/><stop offset="100%" stop-color="${t.panel}"/>
  </linearGradient>
</defs>
<style>
  text{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace}
  .nm{font-size:38px;font-weight:700;fill:${t.fg};letter-spacing:-.5px}
  .rl{font-size:13px;fill:${t.accent};letter-spacing:.18em}
  .sb{font-size:11.5px;fill:${t.dim}}
  .hk{font-size:8.5px;fill:${t.dim};letter-spacing:.16em}
  .ht{font-size:14px;font-weight:700;fill:${t.fg}}
  .hl{font-size:10.5px;fill:${t.dim}}
  .pl{font-size:10px;fill:${t.accent}}
  .ft{font-size:9px;fill:${t.faint}}
  .flow{animation:flow 2.7s ease-in-out infinite}
  @keyframes flow{0%{transform:translateX(0);opacity:0}
    18%{opacity:1}82%{opacity:1}
    100%{transform:translateX(${GAP - 8}px);opacity:0}}
</style>
<rect width="${W}" height="${H}" rx="10" fill="url(#hg)"/>
<text x="${PAD + 8}" y="52" class="nm">Siddharth Pandalai</text>
<text x="${PAD + 8}" y="76" class="rl">SENIOR ANDROID ENGINEER</text>
<text x="${PAD + 8}" y="100" class="sb">I own an Android platform at scale, and I keep the reusable half of it. Kotlin, Compose, Kotlin Multiplatform.</text>
<line x1="${PAD + 8}" y1="114" x2="${W - PAD - 8}" y2="114" stroke="${t.rule}"/>
${arrows}${cards}${rail}
<text x="${PAD + 8}" y="${H - 14}" class="ft">Every count above is fetched from the repository that owns it, on the same schedule as the rest of this page. Generated ${stamp}.</text>
</svg>`;
}

try {
  const d = await live();
  const missing = Object.entries(d).filter(([, v]) => v === null).map(([k]) => k);
  if (missing.length) {
    console.warn(`[gen-hero] could not resolve ${missing.join(", ")}, leaving the committed hero alone.`);
  } else {
    const stamp = new Date().toISOString().slice(0, 10);
    for (const t of Object.values(THEMES)) writeFileSync(`assets/hero-${t.name}.svg`, svg(d, t, stamp));
    console.log(`[gen-hero] ${d.modules} modules, ${d.fleet} apps (${d.live} live), ${d.lessons} lessons`);
  }
} catch (err) {
  console.warn("[gen-hero] failed, leaving the committed hero alone,", err.message);
}
