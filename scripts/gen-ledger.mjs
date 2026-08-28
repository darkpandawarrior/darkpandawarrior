// The incident ledger: what broke on the systems behind this profile, and how
// long it stayed broken.
//
// This is the half of the control loop a status board always leaves out. A
// board shows the present, which anyone can make green by choosing what to
// measure. A ledger shows the history, including the eight days something was
// red, and it is the only artifact here that cannot be flattered.
//
// Publishing your own MTTR is the point, and it is also the reason to keep the
// entries honest: an incident quietly deleted is worse than one never recorded.
//
// Reads data/incidents.json. No network, so it cannot fail on a fetch. An empty
// or malformed ledger exits 1 rather than rendering a reassuring blank.
import { readFileSync, writeFileSync } from "node:fs";
import { THEMES, S, PAD, W, header, footer, open, close, esc, wrap } from "./lib/panel.mjs";

const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

function entry(i, t, y) {
  const sev = t.sev[i.severity] || t.idle;
  const ttr = i.resolved ? days(i.detected, i.resolved) : null;
  const dur = ttr === null ? "OPEN" : ttr === 0 ? "same day" : `${ttr} days open`;
  const X = PAD + 14;
  const textMax = W - X - PAD - 110;   // leaves the duration rail clear
  const out = [];
  const top = y;

  out.push(`<text x="${X}" y="${y + 11}" class="row" font-weight="700">${esc(i.title)}</text>`);
  out.push(`<text x="${W - PAD}" y="${y + 11}" class="meta end" fill="${ttr ? sev : t.ok}" font-weight="700">${esc(dur)}</text>`);
  y += 18;
  out.push(`<text x="${X}" y="${y + 9}" class="meta">${esc(i.surface)}  ·  ${i.detected} to ${i.resolved || "now"}  ·  ${i.severity}</text>`);
  y += 17;
  for (const ln of wrap(i.cause, textMax, S.meta + 1)) {
    out.push(`<text x="${X}" y="${y + 9}" class="row" font-size="${S.meta + 1}">${esc(ln)}</text>`);
    y += 14;
  }
  for (const ln of wrap("FIX  " + i.fix, textMax, S.meta + 1)) {
    out.push(`<text x="${X}" y="${y + 9}" class="row" font-size="${S.meta + 1}" fill="${t.ok}">${esc(ln)}</text>`);
    y += 14;
  }
  // The severity bar spans the whole entry, so the eye can bracket one incident
  // without a box around it.
  out.unshift(`<rect x="${PAD}" y="${top}" width="3" height="${y - top - 2}" rx="1.5" fill="${sev}"/>`);
  return { svg: out.join(""), y: y + 14 };
}

function svg(inc, t, stamp) {
  const ttrs = inc.filter((i) => i.resolved).map((i) => days(i.detected, i.resolved));
  const mttr = ttrs.length ? (ttrs.reduce((a, b) => a + b, 0) / ttrs.length).toFixed(1) : "n/a";
  const open_ = inc.filter((i) => !i.resolved).length;
  const worst = Math.max(...ttrs, 0);

  const h = header({
    t,
    title: "What broke, and how long it stayed broken",
    subtitle: "Every incident on the systems behind this profile, with what caused it and what fixed it. A board shows the present, which is easy to make green. This is the part that cannot be.",
    stats: [["RECORDED", String(inc.length)], ["STILL OPEN", String(open_)], ["MEAN TIME TO FIX", `${mttr}d`], ["WORST", `${worst}d`]],
  });

  let y = h.height + 20;
  const body = [];
  inc.forEach((i, n) => {
    const e = entry(i, t, y);
    body.push(e.svg);
    y = e.y;
    if (n < inc.length - 1) { body.push(`<line x1="${PAD}" y1="${y - 7}" x2="${W - PAD}" y2="${y - 7}" stroke="${t.line}"/>`); }
  });

  const Hh = y + 14;
  return open({ t, w: W, h: Hh, label: `Incident ledger: ${inc.length} recorded, ${open_} open, mean time to fix ${mttr} days` })
    + h.svg + body.join("")
    + footer({ t, text: `Generated ${stamp} from data/incidents.json. Dates trace to workflow runs, generatedAt stamps and git history.`, y: Hh - 10 })
    + close();
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
      const sorted = [...inc].sort((a, b) => b.detected.localeCompare(a.detected));
      for (const t of Object.values(THEMES)) writeFileSync(`assets/ledger-${t.name}.svg`, svg(sorted, t, stamp));
      console.log(`[gen-ledger] ${inc.length} incidents, ${inc.filter((i) => !i.resolved).length} open`);
    }
  }
} catch (err) {
  console.error("[gen-ledger] could not read the ledger,", err.message);
  process.exitCode = 1;
}
