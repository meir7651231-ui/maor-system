#!/usr/bin/env node
/**
 * מחצב · שלב 0 — מִפְקָד (census).
 * עובר על כל קובץ בריפו ומשייך אותו לדלי + תחום-אטומים. כל קובץ חייב שיוך —
 * קובץ יתום = אזעקה (exit 1). דטרמיניסטי, ניתן להרצה חוזרת, אפס כתיבה למקור.
 * שימוש: node census.mjs <repo-root> <repo-name>
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2], NAME = process.argv[3] || path.basename(ROOT);
if (!ROOT) { console.error('usage: census.mjs <root> <name>'); process.exit(2); }

// תיקיות שנספרות כגוש אחד בלי לרדת פנימה (חיצוני/מחולל)
const OPAQUE = new Set(['.git', 'node_modules', 'dist', 'build', '.dart_tool', '.gradle', 'Pods']);

// כללי-שיוך — הראשון שתופס מנצח. [דלי, תחום-אטומים, בדיקה]
const RULES = [
  ['test',      'tests',      p => /(^|\/)(__tests__|e2e|test|tests|integration_test)\//.test(p) || /\.(test|spec)\.[jt]sx?$|_test\.dart$|\.test\.mjs$/.test(p)],
  ['knowledge', 'knowledge',  p => /(^|\/)(knowledge|docs)\//.test(p) || /\.md$/i.test(p)],
  ['tokens',    'tokens',     p => /\.css$/.test(p)],
  ['flags',     'flags',      p => /types\/(features|config)\.ts$/.test(p)],
  ['screens',   'screens',    p => /(components|screens|lib\/screens)\/.*\.(tsx|dart)$/.test(p)],
  ['engines',   'engines',    p => /(src\/lib|\/logic|\/domain)\/.*\.(ts|dart|mjs)$/.test(p) || /lib\.ts$/.test(p)],
  ['actions',   'actions',    p => /(store|state)\/.*\.(ts|dart)$/.test(p)],
  ['server',    'server',     p => /(^|\/)(functions|telephony|edge-proxy|server)\//.test(p)],
  ['source',    'source',     p => /\.(ts|tsx|js|mjs|cjs|dart|py|kt|html)$/.test(p)],
  ['data',      'data',       p => /\.(json|csv|tsv|webmanifest|sha256)$/.test(p)],
  ['asset',     'assets',     p => /\.(png|jpe?g|svg|webp|ico|woff2?|ttf|webm|mp4|mp3|pdf|zip|b64|xlsx)$/i.test(p)],
  ['config',    'config',     p => /(^|\/)(\.github|\.claude|\.githooks|\.vscode|scripts|tool|tools|android|ios|web|gradle)\//.test(p) || /^[^/]+\.(ya?ml|toml|lock|rc|cfg|properties|gitignore|nvmrc|rules|txt|sh|ps1|xml|iml|json5|allow_push_main)$/.test(path.basename(p)) || /^\./.test(path.basename(p)) || /(gradlew|LICENSE|CNAME|Dockerfile|Makefile|\.eslintrc.*|vite\.config\.ts|firestore\.indexes\.json)/.test(p)],
];

const files = [], orphans = [];
let opaqueBytes = 0, opaqueDirs = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a,b)=>a.name.localeCompare(b.name))) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (OPAQUE.has(e.name)) { opaqueDirs.push(path.relative(ROOT, full)); continue; }
      walk(full);
    } else if (e.isFile()) {
      const rel = path.relative(ROOT, full).replace(/\\/g, '/');
      const rule = RULES.find(([,,t]) => t(rel));
      let lines = 0;
      try { const buf = fs.readFileSync(full); lines = buf.includes(0) ? 0 : buf.toString('utf8').split('\n').length; } catch {}
      if (rule) files.push({ path: rel, bucket: rule[0], domain: rule[1], lines });
      else orphans.push(rel);
    }
  }
})(ROOT);

const byDomain = {};
for (const f of files) { byDomain[f.domain] = byDomain[f.domain] || { files: 0, lines: 0 }; byDomain[f.domain].files++; byDomain[f.domain].lines += f.lines; }
const out = { repo: NAME, root: ROOT, generatedBy: 'machtzev/census v1',
  totals: { files: files.length, lines: files.reduce((s,f)=>s+f.lines,0), orphans: orphans.length },
  byDomain, opaqueDirs, orphans, files };
fs.mkdirSync(new URL('./registry/', import.meta.url).pathname, { recursive: true });
fs.writeFileSync(new URL(`./registry/census-${NAME}.json`, import.meta.url).pathname, JSON.stringify(out, null, 1));

console.log(`── מפקד ${NAME}: ${out.totals.files} קבצים · ${out.totals.lines.toLocaleString()} שורות`);
for (const [d, v] of Object.entries(byDomain).sort((a,b)=>b[1].lines-a[1].lines))
  console.log(`   ${d.padEnd(10)} ${String(v.files).padStart(5)} קבצים ${String(v.lines.toLocaleString()).padStart(9)} שורות`);
if (orphans.length) { console.error(`\n🚨 אזעקה: ${orphans.length} קבצים יתומים ללא שיוך:`); orphans.slice(0,20).forEach(o=>console.error('   ✗ '+o)); process.exit(1); }
console.log('   ✓ 100% מהקבצים משויכים — אפס יתומים');
