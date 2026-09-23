// Draws the white-label fleet as a lifecycle, not a total.
//
// A total alone says almost nothing: it cannot tell you whether the platform was a burst of
// launches that died, or something that kept apps alive. The distribution can.
// Live versus delisted by year is the shape of platform ownership, and it is
// the one image on this profile that no other developer could produce, because
// the underlying data was mined from white-label branches across two Jugnoo
// Android repos.
//
// Source of truth is cv-siddharth's store.ts, which is public, so this reads the
// same numbers the case study prints rather than keeping a second copy that can
// drift. Fetch or parse failure leaves the committed SVGs alone and fails the
// refresh workflow, so a stale chart does not pass silently.
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

function svg(rows, stats, snapshot, t, stamp) {
  const totLive = rows.reduce((a, r) => a + r.live, 0);
  const totGone = rows.reduce((a, r) => a + r.gone, 0);
  const h = header({
    t,
    title: "The white-label fleet, by the year each app last shipped",
    subtitle: `${totLive + totGone} client apps reached the Play Store from one codebase. ${totLive} are still listed today, across ${stats.clientsLive} companies. The shape is the point, not the total.`,
    stats: [["REACHED PLAY", String(totLive + totGone)], ["STILL LIVE", String(totLive)], ["DELISTED", String(totGone)], ["COMPANIES", String(stats.clientsLive)]],
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
    + `<metadata>Source: ${SRC}; storeGeneratedAt: ${snapshot}; rendered: ${stamp}</metadata>`
    + h.svg + grid + bars + legend
    + footer({ t, text: `Rendered ${stamp} from cv-siddharth/main/src/data/store.ts (snapshot ${snapshot}; ${stats.branches.toLocaleString("en-US")} branches).`, y: H - 12 })
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

  const statsBody = text.match(/export const fleetStats = \{([^}]+)\} as const;/)?.[1];
  const stat = (name) => {
    const value = statsBody?.match(new RegExp(`"${name}":\\s*(\\d+)`))?.[1];
    if (!value) throw new Error(`fleetStats.${name} missing from store.ts`);
    return Number(value);
  };
  const stats = { live: stat("live"), delisted: stat("delisted"), clientsLive: stat("clientsLive"), branches: stat("branches") };
  const snapshot = text.match(/export const storeGeneratedAt = "(\d{4}-\d{2}-\d{2})";/)?.[1];
  if (!snapshot) throw new Error("storeGeneratedAt missing from store.ts");
  if (rows.length < 4) throw new Error(`parsed only ${rows.length} year(s) from store.ts`);
  const live = rows.reduce((a, r) => a + r.live, 0);
  const delisted = rows.reduce((a, r) => a + r.gone, 0);
  if (live !== stats.live || delisted !== stats.delisted) {
    throw new Error(`lastShipped ${live}/${delisted} differs from fleetStats ${stats.live}/${stats.delisted}`);
  }

  const stamp = new Date().toISOString().slice(0, 10);
  for (const t of Object.values(THEMES)) writeFileSync(`assets/fleet-${t.name}.svg`, svg(rows, stats, snapshot, t, stamp));
  console.log(`[gen-fleet-chart] ${rows.length} years, ${live} live of ${live + delisted}; Store snapshot ${snapshot}`);
} catch (err) {
  console.error("[gen-fleet-chart] refresh failed; committed SVGs unchanged:", err.message);
  process.exitCode = 1;
}
