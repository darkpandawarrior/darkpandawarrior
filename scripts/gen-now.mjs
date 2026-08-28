// What moved lately, across every repo at once.
//
// A profile is a claim about the past. This is the one strip that says the work
// is still happening, and it says it in the present tense with commit subjects
// rather than a contribution count. It answers the question a reader actually
// has after the metrics: is this person still doing this, or is this a museum.
//
// The public events feed was the obvious source and it does not work: GitHub
// trimmed PushEvent payloads, so they now carry before/head/ref and no commit
// messages at all. So this reads the N most recently pushed repos and asks each
// for one commit. Bounded on purpose: N+1 requests, not one per repo in the
// account, because a generator that hammers an API on a schedule becomes the
// next silently-failing generator.
//
// Fetch failure leaves the committed SVGs alone. Zero events exits 1, because a
// ticker rendering empty says "nothing is happening", which is a claim.
import { writeFileSync } from "node:fs";

const token = process.env.GITHUB_TOKEN;
const H = { Accept: "application/vnd.github+json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

const T = {
  dark: { bg: "#0d1117", panel: "#161b22", fg: "#e6edf3", dim: "#7d8590", line: "#21262d", accent: "#a371f7", live: "#3fb950" },
  light: { bg: "#ffffff", panel: "#f6f8fa", fg: "#1f2328", dim: "#59636e", line: "#d1d9e0", accent: "#7F52FF", live: "#1a7f37" },
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const ago = (d) => {
  const m = Math.floor((Date.now() - Date.parse(d)) / 6e4);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
};

function svg(rows, t, stamp, repoCount) {
  const W = 900, PADX = 22, TOP = 78, ROW = 20;
  const H = TOP + rows.length * ROW + 34;
  const body = rows.map((r, i) => {
    const y = TOP + i * ROW;
    return `<text x="${PADX}" y="${y + 10}" class="when">${r.when}</text>` +
      `<text x="${PADX + 78}" y="${y + 10}" class="repo">${esc(r.repo)}</text>` +
      `<text x="${PADX + 250}" y="${y + 10}" class="msg">${esc(r.msg)}</text>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Recent activity across ${repoCount} repositories, most recent first">
<style>
  text{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
  .t{font-size:15px;font-weight:700;fill:${t.fg}}
  .sub{font-size:11px;fill:${t.dim}}
  .when{font-size:10.5px;fill:${t.dim}}
  .repo{font-size:11px;font-weight:700;fill:${t.accent}}
  .msg{font-size:11px;fill:${t.fg}}
  .f{font-size:9.5px;fill:${t.dim}}
  .dot{animation:b 2.4s ease-in-out infinite}
  @keyframes b{0%,100%{opacity:1}50%{opacity:.3}}
</style>
<rect width="${W}" height="${H}" rx="8" fill="${t.bg}"/>
<rect x="0" y="0" width="${W}" height="${TOP - 12}" fill="${t.panel}"/>
<circle cx="${PADX + 5}" cy="24" r="4" fill="${t.live}" class="dot"/>
<text x="${PADX + 18}" y="28" class="t">Lately</text>
<text x="${PADX}" y="50" class="sub">The last ${rows.length} pushes across ${repoCount} repositories. Not a commit count: the actual subjects, so you can see what kind of work it is.</text>
<line x1="0" y1="${TOP - 12}" x2="${W}" y2="${TOP - 12}" stroke="${t.line}"/>
${body}
<text x="${PADX}" y="${H - 12}" class="f">Generated ${stamp} from the public events feed.</text>
</svg>`;
}

const LOOK = 12;

try {
  const rr = await fetch(`https://api.github.com/users/darkpandawarrior/repos?sort=pushed&per_page=${LOOK}`, { headers: H });
  if (!rr.ok) throw new Error(`${rr.status} repos`);
  const repos = (await rr.json()).filter((r) => !r.archived);

  const rows = [];
  for (const r of repos) {
    try {
      const cr = await fetch(`https://api.github.com/repos/${r.full_name}/commits?per_page=1`, { headers: H });
      if (!cr.ok) continue;
      const c = (await cr.json())[0];
      if (!c) continue;
      let msg = c.commit.message.split("\n")[0].replace(/\s*\(#\d+\)\s*$/, "");
      if (msg.length > 74) msg = msg.slice(0, 73) + "\u2026";
      rows.push({ when: ago(c.commit.author.date), repo: r.name, msg, at: c.commit.author.date });
    } catch { /* one repo missing is not a reason to lose the ticker */ }
  }
  rows.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  if (!rows.length) {
    console.error("[gen-now] no commits resolved, refusing to write an empty ticker.");
    process.exitCode = 1;
  } else {
    const stamp = new Date().toISOString().slice(0, 10);
    for (const [name, t] of Object.entries(T)) writeFileSync(`assets/now-${name}.svg`, svg(rows, t, stamp, rows.length));
    console.log(`[gen-now] ${rows.length} repos, newest ${rows[0].when}`);
  }
} catch (err) {
  console.warn("[gen-now] fetch failed, leaving the committed SVGs alone,", err.message);
}
