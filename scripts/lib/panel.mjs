// The shared panel system.
//
// Five generators were each hand-rolling a header, a type scale and their own
// padding, which is how the ledger's subtitle ended up running off the right
// edge mid-word: nothing measured text, so nothing could know it overflowed.
// Panels that are meant to read as one instrument have to be drawn by one
// renderer, so this is that renderer.
//
// Everything here is monospace on purpose. A fixed advance width means text can
// be measured with arithmetic instead of a layout engine, which is what makes
// fit() and wrap() reliable in a plain Node script with no DOM.

/** Monospace advance width. Measured against the ui-monospace stack rather than
 *  assumed: 0.6em is the standard cell, and this errs 2% wide so a fit() never
 *  under-estimates and clips. */
export const CH = 0.612;
export const adv = (size) => size * CH;
export const textW = (s, size) => s.length * adv(size);

/** Truncate to fit a pixel width, with a real ellipsis. */
export function fit(s, maxPx, size) {
  const max = Math.floor(maxPx / adv(size));
  return s.length <= max ? s : s.slice(0, Math.max(1, max - 1)) + "…";
}

/** Wrap to a pixel width. Never returns an empty array for non-empty input. */
export function wrap(s, maxPx, size) {
  const cols = Math.max(8, Math.floor(maxPx / adv(size)));
  const out = [];
  let line = "";
  for (const w of String(s).split(/\s+/)) {
    if (!w) continue;
    if (line && (line + " " + w).length > cols) { out.push(line); line = w; }
    else line = line ? line + " " + w : w;
  }
  if (line) out.push(line);
  return out.length ? out : [""];
}

export const esc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const THEMES = {
  dark: {
    name: "dark",
    bg: "#0d1117", panel: "#161b22", fg: "#e6edf3", dim: "#8b949e", faint: "#6e7681",
    line: "#21262d", rule: "#30363d", accent: "#a371f7",
    ok: "#3fb950", warn: "#d29922", bad: "#f85149", idle: "#6e7681",
    sev: { critical: "#f85149", high: "#db6d28", medium: "#d29922", low: "#6e7681" },
    // Graph vocabulary. Aliases rather than new colours on purpose: a node is a
    // panel, an edge is a rule, a hot node is the accent. Adding these to the
    // shared palette is what stopped the module graph rendering 134 fills of
    // literal "undefined" the moment it started reading from here.
    muted: "#8b949e", edge: "#30363d", node: "#161b22", stroke: "#30363d",
    hot: "#a371f7", hotText: "#0d1117",
  },
  light: {
    name: "light",
    bg: "#ffffff", panel: "#f6f8fa", fg: "#1f2328", dim: "#59636e", faint: "#818b98",
    line: "#d1d9e0", rule: "#d1d9e0", accent: "#7F52FF",
    ok: "#1a7f37", warn: "#9a6700", bad: "#cf222e", idle: "#818b98",
    sev: { critical: "#cf222e", high: "#bc4c00", medium: "#9a6700", low: "#818b98" },
    muted: "#59636e", edge: "#d1d9e0", node: "#f6f8fa", stroke: "#d1d9e0",
    hot: "#7F52FF", hotText: "#ffffff",
  },
};

/** One type scale, so panels stacked in a README look like one instrument. */
export const S = { title: 15, sub: 11, statKey: 9, statVal: 17, group: 10, row: 11.5, meta: 9.5, foot: 9.5 };
export const PAD = 22;
export const W = 900;

export const css = (t) => `
  text{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace}
  .title{font-size:${S.title}px;font-weight:700;fill:${t.fg}}
  .sub{font-size:${S.sub}px;fill:${t.dim}}
  .statk{font-size:${S.statKey}px;fill:${t.dim};letter-spacing:.14em}
  .statv{font-size:${S.statVal}px;font-weight:700;fill:${t.accent}}
  .group{font-size:${S.group}px;font-weight:700;fill:${t.dim};letter-spacing:.12em}
  .row{font-size:${S.row}px;fill:${t.fg}}
  .meta{font-size:${S.meta}px;fill:${t.dim}}
  .foot{font-size:${S.foot}px;fill:${t.faint}}
  .end{text-anchor:end}
  .pulse{animation:pulse 1.6s ease-in-out infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
`;

/**
 * Header block: title, up to two measured subtitle lines, and an optional stat
 * strip laid out on an even grid.
 *
 * The subtitle is WRAPPED, not clipped. A panel that silently drops half a
 * sentence is the same class of bug as a generator that silently serves stale
 * data, and this file exists partly because that happened.
 */
export function header({ t, title, subtitle = "", stats = [], w = W }) {
  const inner = w - PAD * 2;
  const lines = subtitle ? wrap(subtitle, inner, S.sub).slice(0, 2) : [];
  let y = 30;
  const parts = [`<text x="${PAD}" y="${y}" class="title">${esc(title)}</text>`];
  y += 6;
  for (const ln of lines) { y += 15; parts.push(`<text x="${PAD}" y="${y}" class="sub">${esc(ln)}</text>`); }

  if (stats.length) {
    y += 24;
    const cell = inner / stats.length;
    stats.forEach(([k, v], i) => {
      const x = PAD + i * cell;
      parts.push(`<text x="${x}" y="${y}" class="statk">${esc(k)}</text>`);
      parts.push(`<text x="${x}" y="${y + 21}" class="statv">${esc(v)}</text>`);
    });
    y += 21;
  }
  const height = y + 16;
  return {
    height,
    svg: `<rect x="0" y="0" width="${w}" height="${height}" fill="${t.panel}"/>` +
         parts.join("") +
         `<line x1="0" y1="${height}" x2="${w}" y2="${height}" stroke="${t.rule}"/>`,
  };
}

export function footer({ t, text, y, w = W }) {
  return `<text x="${PAD}" y="${y}" class="foot">${esc(fit(text, w - PAD * 2, S.foot))}</text>`;
}

export function open({ t, w, h, label }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
<style>${css(t)}</style>
<rect width="${w}" height="${h}" rx="8" fill="${t.bg}"/>`;
}
export const close = () => "</svg>";
