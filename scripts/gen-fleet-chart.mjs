// Draws the white-label fleet as a lifecycle, not a total.
//
// The number usually quoted is "173 client apps shipped", which is true and
// says almost nothing: it cannot tell you whether the platform was a burst of
// launches that died, or something that kept apps alive. The distribution can.
// Live versus delisted by year is the shape of platform ownership, and it is
// the one image on this profile that no other developer could produce, because
// the underlying data was mined from 1,747 white-label branches across two
// Jugnoo Android repos.
//
// Source of truth is cv-siddharth's store.ts, which is public, so this reads the
// same numbers the case study prints rather than keeping a second copy that can
// drift. Fetch failure leaves the committed SVGs alone. A parse failure is a
// repo bug and exits 1, because a silently-empty chart is the failure mode this
// whole pass exists to remove.
import { writeFileSync } from "node:fs";
import { THEMES, PAD, W as PW, header, footer, open, close } from "./lib/panel.mjs";

const SRC = "https://raw.githubusercontent.com/darkpandawarrior/cv-siddharth/main/src/data/store.ts";

// Two palettes rather than one CSS media query: GitHub serves README images
// through a proxy, and <picture> with prefers-color-scheme is the mechanism
// this README already proves works.

// PAD_T clears the subtitle AND the value label that sits above the tallest
// bar. At 56 the max-height bar put its label at y=48 and the subtitle at
// y=44, so they collided. Only rendering the thing showed it.
const W = PW, PAD_L = 52, PAD_R = 24, PAD_B = 52;

function svg(rows, t, stamp) {
  const totLive = rows.reduce((a, r) => a + r.live, 0);
  const totGone = rows.reduce((a, r) => a + r.gone, 0);
  const h = header({
    t,
    title: "The white-label fleet, by the year each app last shipped",
    subtitle: `${totLive + totGone} client apps reached the Play Store from one codebase. ${totLive} are still listed today, across 47 companies. The shape is the point, not the total.`,
    stats: [["REACHED PLAY", String(totLive + totGone)], ["STILL LIVE", String(totLive)], ["DELISTED", String(totGone)], ["COMPANIES", "47"]],
  });
  const PAD_T = h.height + 30;
  const H = PAD_T + 190 + PAD_B;
  const plotW = W - PAD_L - PAD_R, plotH = 190;
  const max = Math.max(...rows.map((r) => r.live + r.gone));
  const step = plotW / rows.length;
  const barW = Math.min(64, step * 0.56);
  const y = (v) => PAD_T + plotH - (v / max) * plotH;

  const grid = [0, 0.5, 1].map((f) => {
    const v = Math.round(max * f), yy = y(v);
    return `<line x1="${PAD_L}" y1="${yy}" x2="${W - PAD_R}" y2="${yy}" stroke="${t.line}"/>`
      + `<text x="${PAD_L - 10}" y="${yy + 4}" class="meta end">${v}</text>`;
  }).join("");

  const bars = rows.map((r, i) => {
    const cx = PAD_L + step * i + step / 2, x = cx - barW / 2;
    const total = r.live + r.gone;
    const hGone = (r.gone / max) * plotH, hLive = (r.live / max) * plotH;
    return `<rect x="${x}" y="${y(total).toFixed(1)}" width="${barW}" height="${hGone.toFixed(1)}" fill="${t.line}" rx="2"/>`
      + `<rect x="${x}" y="${y(r.live).toFixed(1)}" width="${barW}" height="${hLive.toFixed(1)}" fill="${t.accent}" rx="2"/>`
      + `<text x="${cx}" y="${(y(total) - 8).toFixed(1)}" class="meta" text-anchor="middle" fill="${t.fg}" font-weight="700">${total}</text>`
      + `<text x="${cx}" y="${PAD_T + plotH + 20}" class="meta" text-anchor="middle">${r.year}</text>`;
  }).join("");

  const lx = W - PAD_R;
  const legend = `<rect x="${lx - 196}" y="${PAD_T + plotH + 34}" width="9" height="9" fill="${t.accent}" rx="2"/>`
    + `<text x="${lx - 182}" y="${PAD_T + plotH + 42}" class="meta">still live (${totLive})</text>`
    + `<rect x="${lx - 92}" y="${PAD_T + plotH + 34}" width="9" height="9" fill="${t.line}" rx="2"/>`
    + `<text x="${lx - 78}" y="${PAD_T + plotH + 42}" class="meta">delisted (${totGone})</text>`;

  return open({ t, w: W, h: H, label: `White-label client apps by year, ${totLive} still live and ${totGone} delisted of ${totLive + totGone}` })
    + h.svg + grid + bars + legend
    + footer({ t, text: `Generated ${stamp}. Mined from 1,747 white-label branches; delisted apps verified against Internet Archive crawls.`, y: H - 12 })
    + close();
}

try {
  const res = await fetch(SRC);
  if (!res.ok) throw new Error(`${res.status} store.ts`);
  const text = await res.text();

  const i = text.indexOf("export const lastShipped");
  if (i < 0) throw new Error("lastShipped not found in store.ts");
  const seg = text.slice(i, text.indexOf("] as const", i));
  const rows = [...seg.matchAll(/\{\s*"year":\s*(\d+),\s*"live":\s*(\d+),\s*"gone":\s*(\d+)\s*\}/g)]
    .map((m) => ({ year: +m[1], live: +m[2], gone: +m[3] }));

  // A parse that returns nothing is the silent-empty-chart failure. Loud.
  if (rows.length < 4) {
    console.error(`[gen-fleet-chart] parsed only ${rows.length} year(s) from store.ts, refusing to write a near-empty chart.`);
    console.error("  The lastShipped shape probably changed. Fix the pattern here rather than deleting this guard.");
    process.exitCode = 1;
  } else {
    const stamp = new Date().toISOString().slice(0, 10);
    for (const t of Object.values(THEMES)) writeFileSync(`assets/fleet-${t.name}.svg`, svg(rows, t, stamp));
    const live = rows.reduce((a, r) => a + r.live, 0);
    console.log(`[gen-fleet-chart] ${rows.length} years, ${live} live of ${rows.reduce((a, r) => a + r.live + r.gone, 0)}`);
  }
} catch (err) {
  console.warn("[gen-fleet-chart] fetch failed, leaving the committed SVGs alone,", err.message);
}
