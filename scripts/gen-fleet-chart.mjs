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
import { readFileSync, writeFileSync } from "node:fs";

const SRC = "https://raw.githubusercontent.com/darkpandawarrior/cv-siddharth/main/src/data/store.ts";

// Two palettes rather than one CSS media query: GitHub serves README images
// through a proxy, and <picture> with prefers-color-scheme is the mechanism
// this README already proves works.
const THEMES = {
  light: { bg: "#ffffff", fg: "#1f2328", muted: "#59636e", grid: "#d1d9e0", live: "#7F52FF", gone: "#c9d1d9" },
  dark: { bg: "#0d1117", fg: "#e6edf3", muted: "#9198a1", grid: "#30363d", live: "#a371f7", gone: "#30363d" },
};

// PAD_T clears the subtitle AND the value label that sits above the tallest
// bar. At 56 the max-height bar put its label at y=48 and the subtitle at
// y=44, so they collided. Only rendering the thing showed it.
const W = 900, H = 320, PAD_L = 48, PAD_R = 24, PAD_T = 78, PAD_B = 52;

function svg(rows, t, stamp) {
  const plotW = W - PAD_L - PAD_R, plotH = H - PAD_T - PAD_B;
  const max = Math.max(...rows.map((r) => r.live + r.gone));
  const step = plotW / rows.length;
  const barW = Math.min(64, step * 0.56);
  const y = (v) => PAD_T + plotH - (v / max) * plotH;

  const gridlines = [0, 0.5, 1].map((f) => {
    const v = Math.round(max * f), yy = y(v);
    return `<line x1="${PAD_L}" y1="${yy}" x2="${W - PAD_R}" y2="${yy}" stroke="${t.grid}" stroke-width="1"/>`
      + `<text x="${PAD_L - 10}" y="${yy + 4}" text-anchor="end" font-size="11" fill="${t.muted}">${v}</text>`;
  }).join("");

  const bars = rows.map((r, i) => {
    const cx = PAD_L + step * i + step / 2, x = cx - barW / 2;
    const total = r.live + r.gone;
    const hGone = (r.gone / max) * plotH, hLive = (r.live / max) * plotH;
    const yGone = y(total), yLive = y(r.live);
    return `
    <rect x="${x}" y="${yGone.toFixed(1)}" width="${barW}" height="${hGone.toFixed(1)}" fill="${t.gone}" rx="2"/>
    <rect x="${x}" y="${yLive.toFixed(1)}" width="${barW}" height="${hLive.toFixed(1)}" fill="${t.live}" rx="2"/>
    <text x="${cx}" y="${(yGone - 8).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="600" fill="${t.fg}">${total}</text>
    <text x="${cx}" y="${H - PAD_B + 20}" text-anchor="middle" font-size="12" fill="${t.muted}">${r.year}</text>`;
  }).join("");

  const totLive = rows.reduce((a, r) => a + r.live, 0);
  const totGone = rows.reduce((a, r) => a + r.gone, 0);
  const lx = W - PAD_R;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="White-label client apps by year, ${totLive} still live and ${totGone} delisted out of ${totLive + totGone} total">
<rect width="${W}" height="${H}" fill="${t.bg}"/>
<text x="${PAD_L}" y="26" font-size="15" font-weight="700" fill="${t.fg}" font-family="system-ui,-apple-system,Segoe UI,sans-serif">The white-label fleet, by the year each app last shipped</text>
<text x="${PAD_L}" y="44" font-size="12" fill="${t.muted}" font-family="system-ui,-apple-system,Segoe UI,sans-serif">${totLive + totGone} client apps reached Play. ${totLive} are still listed today, across 47 companies.</text>
<g font-family="system-ui,-apple-system,Segoe UI,sans-serif">${gridlines}${bars}</g>
<g font-family="system-ui,-apple-system,Segoe UI,sans-serif">
  <rect x="${lx - 190}" y="12" width="10" height="10" fill="${t.live}" rx="2"/>
  <text x="${lx - 175}" y="21" font-size="11" fill="${t.muted}">still live (${totLive})</text>
  <rect x="${lx - 90}" y="12" width="10" height="10" fill="${t.gone}" rx="2"/>
  <text x="${lx - 75}" y="21" font-size="11" fill="${t.muted}">delisted (${totGone})</text>
</g>
<text x="${PAD_L}" y="${H - 10}" font-size="10" fill="${t.muted}" font-family="system-ui,-apple-system,Segoe UI,sans-serif">Mined from 1,747 white-label branches. Delisted apps verified against Internet Archive crawls. Generated ${stamp}.</text>
</svg>`;
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
    for (const [name, t] of Object.entries(THEMES)) {
      writeFileSync(`assets/fleet-${name}.svg`, svg(rows, t, stamp));
    }
    const live = rows.reduce((a, r) => a + r.live, 0);
    console.log(`[gen-fleet-chart] ${rows.length} years, ${live} live of ${rows.reduce((a, r) => a + r.live + r.gone, 0)}`);
  }
} catch (err) {
  console.warn("[gen-fleet-chart] fetch failed, leaving the committed SVGs alone,", err.message);
}
