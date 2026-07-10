// Refreshes the two fastest-drifting HireSignal numbers (merged PR count,
// provider count) in README.md via targeted regex — kirklazar-android/hiresignal
// merges PRs same-day, so these go stale faster than anything else on this
// page. Never fails the build: leaves README.md untouched on any fetch error
// or suspicious count. No dependencies — plain Node fetch/fs, no package.json needed.
import { readFileSync, writeFileSync } from "node:fs";

const token = process.env.GITHUB_TOKEN;
const headers = { Accept: "application/vnd.github+json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

async function prCount() {
  const res = await fetch(
    "https://api.github.com/search/issues?q=repo:kirklazar-android/hiresignal+type:pr+is:merged+author:darkpandawarrior",
    { headers },
  );
  if (!res.ok) throw new Error(`${res.status} PR search`);
  return (await res.json()).total_count;
}

async function providerCount() {
  const res = await fetch("https://api.github.com/repos/kirklazar-android/hiresignal/contents/providers", { headers });
  if (!res.ok) throw new Error(`${res.status} providers dir`);
  const list = await res.json();
  // Upstream's own convention: infra files are underscore-prefixed, provider modules aren't.
  return list.filter((f) => f.type === "file" && !f.name.startsWith("_") && /\.m?js$/.test(f.name)).length;
}

try {
  const [prs, providers] = await Promise.all([prCount(), providerCount()]);
  if (!prs || !providers) throw new Error(`suspicious counts prs=${prs} providers=${providers} — refusing to write`);
  let src = readFileSync("README.md", "utf8");
  src = src
    .replace(/\*\*\d+ merged PRs\*\*/, `**${prs} merged PRs**`)
    .replace(/reverse-ATS discovery \(\d+ providers\)/, `reverse-ATS discovery (${providers} providers)`);
  writeFileSync("README.md", src);
  console.log(`[gen-hiresignal-stats] prs=${prs} providers=${providers}`);
} catch (err) {
  console.warn("[gen-hiresignal-stats] fetch failed, leaving README.md untouched —", err.message);
}
