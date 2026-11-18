// Creates one GitHub Issue per file in docs/issues/*.md (first line = title, rest = body).
//
// Prerequisites
//   1. On GitHub: repo > Settings > General > Features > tick "Issues" (forks have it OFF by default).
//   2. Create a token (Settings > Developer settings > Fine-grained token, repo access = this repo,
//      permission "Issues: Read and write") and export it:
//        PowerShell:  $env:GITHUB_TOKEN = "github_pat_..."
//        bash:        export GITHUB_TOKEN=github_pat_...
//   3. node scripts/create-issues.js            (add --dry-run to only print titles)
//
// Safe to re-run: it skips titles that already exist as issues.
const fs = require('fs');
const path = require('path');

const REPO = process.env.GITHUB_REPO || 'UngDuong125/eshop-sut';
const TOKEN = process.env.GITHUB_TOKEN;
const DRY = process.argv.includes('--dry-run');
const dir = path.join(__dirname, '..', 'docs', 'issues');

const api = (p, opt = {}) => fetch(`https://api.github.com/repos/${REPO}${p}`, {
  ...opt,
  headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'hw04-issue-script' },
});

(async () => {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
  if (DRY) { files.forEach((f) => console.log(f, '->', fs.readFileSync(path.join(dir, f), 'utf8').split('\n')[0])); return; }
  if (!TOKEN) { console.error('Set GITHUB_TOKEN first (see header of this file).'); process.exit(1); }

  const repo = await (await api('')).json();
  if (!repo.has_issues) { console.error('Issues are disabled on this repo. Enable them in Settings > General > Features.'); process.exit(1); }
  const existing = await (await api('/issues?state=all&per_page=100')).json();
  const titles = new Set(existing.map((i) => i.title));

  for (const f of files) {
    const [title, , ...rest] = fs.readFileSync(path.join(dir, f), 'utf8').split('\n');
    if (titles.has(title)) { console.log('skip (exists):', title); continue; }
    const res = await api('/issues', { method: 'POST', body: JSON.stringify({ title, body: rest.join('\n') }) });
    const j = await res.json();
    console.log(res.status, j.html_url || j.message);
  }
})();
