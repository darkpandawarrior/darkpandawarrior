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
import { THEMES, S, PAD, W, header, footer, open, close, esc, fit } from "./lib/panel.mjs";

const token = process.env.GITHUB_TOKEN;
const H = { Accept: "application/vnd.github+json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

const ago = (d) => {
  const m = Math.floor((Date.now() - Date.parse(d)) / 6e4);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
};

function svg(rows, t, stamp, repoCount) {
  const h = header({
    t,
    title: "Lately",
    subtitle: `The most recent push in each of ${repoCount} repositories. Not a commit count: the actual subjects, so you can see what kind of work it is.`,
  });
  const ROW = 20, WHEN_X = PAD, REPO_X = PAD + 84, MSG_X = PAD + 262;
  const msgMax = W - MSG_X - PAD;
  let y = h.height + 20;
  const body = rows.map((r, i) => {
    const yy = y + i * ROW;
    return `<text x="${WHEN_X}" y="${yy + 10}" class="meta">${esc(r.when)}</text>`
      + `<text x="${REPO_X}" y="${yy + 10}" class="row" fill="${t.accent}" font-weight="700">${esc(fit(r.repo, MSG_X - REPO_X - 12, S.row))}</text>`
      + `<text x="${MSG_X}" y="${yy + 10}" class="row">${esc(fit(r.msg, msgMax, S.row))}</text>`;
  }).join("");
  y += rows.length * ROW + 12;
  const Hh = y + 14;
  // A single breathing dot in the header, and nothing else moves. It is the one
  // panel whose claim is "right now", so it earns the one live pixel.
  return open({ t, w: W, h: Hh, label: `Recent activity across ${repoCount} repositories, most recent first` })
    + h.svg
    + `<circle cx="${W - PAD - 6}" cy="24" r="4" fill="${t.ok}" class="pulse"/>`
    + body
    + footer({ t, text: `Generated ${stamp} from the GitHub API, one commit per recently pushed repository.`, y: Hh - 10 })
    + close();
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
    for (const t of Object.values(THEMES)) writeFileSync(`assets/now-${t.name}.svg`, svg(rows, t, stamp, rows.length));
    console.log(`[gen-now] ${rows.length} repos, newest ${rows[0].when}`);
  }
} catch (err) {
  console.warn("[gen-now] fetch failed, leaving the committed SVGs alone,", err.message);
}
