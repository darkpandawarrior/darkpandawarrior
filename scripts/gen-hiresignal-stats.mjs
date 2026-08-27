// Refreshes the career-ops numbers this README prints: merged PR count, provider
// count and the upstream star count. These drift faster than anything else here.
//
// Two failure modes, deliberately treated differently, because conflating them
// is what froze this file:
//
//   A FETCH failure is a network blip. Warn, leave README.md untouched, exit 0.
//   A DEAD PATTERN is a repo bug: the prose was edited and a regex stopped
//   matching, so the number silently stops being refreshed. That sets
//   process.exitCode = 1 so somebody fixes it.
//
// The second half of that rule exists because this script had neither. It
// queried kirklazar-android/hiresignal, which is the private product repo, while
// the sentence it maintains is about santifer/career-ops, the public upstream he
// contributes to. The query 422'd, the catch swallowed it, and the README sat at
// "9 merged PRs" while the real figure reached 24. Fifteen merged PRs of his own
// open-source work, understated on his public profile, with nothing going red.
//
// No dependencies: plain Node fetch/fs, no package.json needed.
import { readFileSync, writeFileSync } from "node:fs";

// The PUBLIC upstream. This is the repo the README's sentence is about, and it
// is the same one cv-siddharth's copy of this generator reads, so the two
// surfaces cannot disagree.
const UPSTREAM = "santifer/career-ops";

const token = process.env.GITHUB_TOKEN;
const headers = { Accept: "application/vnd.github+json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

async function prCount() {
  const res = await fetch(
    `https://api.github.com/search/issues?q=repo:${UPSTREAM}+type:pr+is:merged+author:darkpandawarrior`,
    { headers },
  );
  if (!res.ok) throw new Error(`${res.status} PR search`);
  return (await res.json()).total_count;
}

async function providerCount() {
  const res = await fetch(`https://api.github.com/repos/${UPSTREAM}/contents/providers`, { headers });
  if (!res.ok) throw new Error(`${res.status} providers dir`);
  const list = await res.json();
  // Upstream's own convention: infra files are underscore-prefixed, provider modules aren't.
  return list.filter((f) => f.type === "file" && !f.name.startsWith("_") && /\.m?js$/.test(f.name)).length;
}

async function starCount() {
  const res = await fetch(`https://api.github.com/repos/${UPSTREAM}`, { headers });
  if (!res.ok) throw new Error(`${res.status} repo`);
  return (await res.json()).stargazers_count;
}

try {
  const [prs, providers, stars] = await Promise.all([prCount(), providerCount(), starCount()]);
  if (!prs || !providers || !stars) {
    throw new Error(`suspicious counts prs=${prs} providers=${providers} stars=${stars}, refusing to write`);
  }
  const starLabel = `${Math.floor(stars / 1000)}k+`;

  const misses = [];
  let src = readFileSync("README.md", "utf8");
  const sub = (re, to) => {
    if (!(src.match(re) || []).length) misses.push(String(re));
    src = src.replace(re, to);
  };

  // Match the number beside the phrase, never the punctuation between the words.
  // A dash sweep through this prose is exactly what killed the equivalent
  // pattern in cv-siddharth, and it took eight days of red CI to find.
  sub(/\*\*\d+ merged PRs\*\*/g, `**${prs} merged PRs**`);
  sub(/reverse-ATS discovery \(\d+ providers\)/g, `reverse-ATS discovery (${providers} providers)`);
  sub(/career-ops\]\(https:\/\/github\.com\/santifer\/career-ops\) \(⭐[\d.]+k\+\)/g,
      `career-ops](https://github.com/santifer/career-ops) (⭐${starLabel})`);

  writeFileSync("README.md", src);

  // Any other digit claiming to be a merged-PR count is a site that drifted.
  for (const [, n] of src.matchAll(/(\d+) merged (?:PRs|pull requests)/g)) {
    if (n !== String(prs)) misses.push(`stale count "${n} merged ..." in README.md`);
  }

  console.log(`[gen-hiresignal-stats] prs=${prs} providers=${providers} stars=${starLabel}`);
  if (misses.length) {
    console.error("[gen-hiresignal-stats] dead patterns / stale counts:");
    for (const m of misses) console.error(`  ${m}`);
    process.exitCode = 1;
  }
} catch (err) {
  console.warn("[gen-hiresignal-stats] fetch failed, leaving README.md untouched,", err.message);
}
