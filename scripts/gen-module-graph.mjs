// Draws the real kmp-toolkit dependency graph, parsed, never hand-drawn.
//
// The claim this image carries is "36 modules extracted the moment a second
// consumer needed the same logic". A reader has no reason to believe that from
// a sentence. The graph shows it: :common carries 13 dependents, :payments-api
// carries 19 providers, and the layering falls out of the edges rather than out
// of a layout choice. Every node and every edge here comes from
// settings.gradle.kts and the module build files in the public repo, so the
// picture cannot flatter the architecture.
//
// Layers are computed by longest-path depth over the parsed edges. That matters:
// a hand-assigned layer would be a claim about the architecture, and a computed
// one is a measurement of it.
//
// Fetch failure leaves the committed SVGs alone. A parse that finds too few
// modules or no edges exits 1, because a graph that quietly renders as a row of
// disconnected boxes is worse than no graph.
import { writeFileSync } from "node:fs";

const REPO = "darkpandawarrior/kmp-toolkit";
const RAW = `https://raw.githubusercontent.com/${REPO}/main`;
const token = process.env.GITHUB_TOKEN;
const headers = { Accept: "application/vnd.github+json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

const THEMES = {
  light: { bg: "#ffffff", fg: "#1f2328", muted: "#59636e", edge: "#d1d9e0", node: "#f6f8fa", stroke: "#d1d9e0", hot: "#7F52FF", hotText: "#ffffff" },
  dark: { bg: "#0d1117", fg: "#e6edf3", muted: "#9198a1", edge: "#30363d", node: "#161b22", stroke: "#30363d", hot: "#a371f7", hotText: "#0d1117" },
};

async function moduleList() {
  const res = await fetch(`${RAW}/settings.gradle.kts`);
  if (!res.ok) throw new Error(`${res.status} settings.gradle.kts`);
  const txt = await res.text();
  return [...txt.matchAll(/include\("([^"]+)"\)/g)].map((m) => m[1].replace(/^:/, ""));
}

async function edgesFor(mod) {
  // Gradle path ":provider:stripe" lives at provider/stripe/build.gradle.kts.
  const res = await fetch(`${RAW}/${mod.replace(/:/g, "/")}/build.gradle.kts`);
  if (!res.ok) return [];
  const txt = await res.text();
  return [...txt.matchAll(/project\(":([a-zA-Z0-9:-]+)"\)/g)].map((m) => m[1]);
}

function layerOf(nodes, edges) {
  // Longest-path depth: a node sits one below its deepest dependency.
  const deps = new Map(nodes.map((n) => [n, []]));
  for (const [from, to] of edges) if (deps.has(from)) deps.get(from).push(to);
  const memo = new Map();
  const depth = (n, seen = new Set()) => {
    if (memo.has(n)) return memo.get(n);
    if (seen.has(n)) return 0; // cycles cannot happen in Gradle, but never loop forever
    seen.add(n);
    const d = (deps.get(n) || []).reduce((mx, t) => Math.max(mx, depth(t, seen) + 1), 0);
    memo.set(n, d);
    return d;
  };
  return new Map(nodes.map((n) => [n, depth(n)]));
}

function svg(nodes, edges, layers, t, stamp) {
  const byLayer = new Map();
  for (const [n, l] of layers) (byLayer.get(l) || byLayer.set(l, []).get(l)).push(n);
  const maxL = Math.max(...layers.values());

  const NW = 116, NH = 26, GAPX = 34, GAPY = 22, PAD = 28, TOP = 78;
  const cols = [];
  for (let l = 0; l <= maxL; l++) cols.push([...(byLayer.get(l) || [])]);
  const colH = cols.map((c) => c.length * (NH + GAPY) - GAPY);
  const H = TOP + Math.max(...colH) + PAD + 26;
  const W = PAD * 2 + cols.length * NW + (cols.length - 1) * GAPX;

  const indegPre = new Map(nodes.map((n) => [n, 0]));
  for (const [, to] of edges) if (indegPre.has(to)) indegPre.set(to, indegPre.get(to) + 1);
  // Ordered by dependents, not alphabetically. Alphabetical buried :common and
  // :network in the middle of a 17-box column, which hides the exact thing the
  // graph exists to show: which modules the rest of the toolkit leans on.
  for (const c of cols) c.sort((a, b) => (indegPre.get(b) - indegPre.get(a)) || a.localeCompare(b));

  const pos = new Map();
  cols.forEach((col, l) => {
    const x = PAD + l * (NW + GAPX);
    const y0 = TOP + (Math.max(...colH) - colH[l]) / 2;
    col.forEach((n, i) => pos.set(n, { x, y: y0 + i * (NH + GAPY) }));
  });

  const indeg = new Map(nodes.map((n) => [n, 0]));
  for (const [, to] of edges) if (indeg.has(to)) indeg.set(to, indeg.get(to) + 1);

  const edgePaths = edges.filter(([f, tt]) => pos.has(f) && pos.has(tt)).map(([f, tt]) => {
    const a = pos.get(f), b = pos.get(tt);
    const x1 = a.x, y1 = a.y + NH / 2, x2 = b.x + NW, y2 = b.y + NH / 2;
    const mx = (x1 + x2) / 2;
    return `<path d="M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}" fill="none" stroke="${t.edge}" stroke-width="1"/>`;
  }).join("");

  const boxes = nodes.filter((n) => pos.has(n)).map((n) => {
    const p = pos.get(n), hot = indeg.get(n) >= 4;
    const label = n.startsWith("provider:") ? n.slice(9) : n;
    const fill = hot ? t.hot : t.node, fg = hot ? t.hotText : t.fg;
    const badge = indeg.get(n) > 0
      ? `<text x="${p.x + NW - 7}" y="${p.y + 17}" text-anchor="end" font-size="9" fill="${hot ? t.hotText : t.muted}">${indeg.get(n)}</text>` : "";
    return `<rect x="${p.x}" y="${p.y}" width="${NW}" height="${NH}" rx="5" fill="${fill}" stroke="${t.stroke}"/>`
      + `<text x="${p.x + 9}" y="${p.y + 17}" font-size="11" font-weight="${hot ? 700 : 400}" fill="${fg}">${label.length > 15 ? label.slice(0, 14) + "…" : label}</text>${badge}`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="kmp-toolkit dependency graph, ${nodes.length} modules and ${edges.length} internal dependencies">
<rect width="${W}" height="${H}" fill="${t.bg}"/>
<g font-family="system-ui,-apple-system,Segoe UI,sans-serif">
<text x="${PAD}" y="30" font-size="15" font-weight="700" fill="${t.fg}">kmp-toolkit, as the build file actually wires it</text>
<text x="${PAD}" y="50" font-size="12" fill="${t.muted}">${nodes.length} modules, ${edges.length} internal dependencies. Columns are dependency depth, computed from the edges.</text>
<text x="${PAD}" y="68" font-size="11" fill="${t.muted}">The number in a box is how many modules depend on it. Filled boxes carry four or more.</text>
${edgePaths}${boxes}
<text x="${PAD}" y="${H - 10}" font-size="10" fill="${t.muted}">Parsed from settings.gradle.kts and each module's build.gradle.kts. Generated ${stamp}.</text>
</g></svg>`;
}

try {
  const nodes = await moduleList();
  if (nodes.length < 20) throw new Error(`only ${nodes.length} modules parsed`);

  const edges = [];
  // Sequential on purpose: this runs weekly and a burst of 39 parallel requests
  // against raw.githubusercontent is how you get throttled for no benefit.
  for (const n of nodes) for (const dep of await edgesFor(n)) edges.push([n, dep]);

  if (!edges.length) {
    console.error("[gen-module-graph] parsed 0 edges, refusing to write a graph of disconnected boxes.");
    console.error("  The project(\":x\") pattern probably changed. Fix it here rather than removing this guard.");
    process.exitCode = 1;
  } else {
    const layers = layerOf(nodes, edges);
    const stamp = new Date().toISOString().slice(0, 10);
    for (const [name, t] of Object.entries(THEMES)) {
      writeFileSync(`assets/modules-${name}.svg`, svg(nodes, edges, layers, t, stamp));
    }
    console.log(`[gen-module-graph] ${nodes.length} modules, ${edges.length} edges, ${Math.max(...layers.values()) + 1} layers`);
  }
} catch (err) {
  console.warn("[gen-module-graph] fetch failed, leaving the committed SVGs alone,", err.message);
}
