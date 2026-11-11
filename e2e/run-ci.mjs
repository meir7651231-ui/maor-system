/**
 * מריץ סוויטת-e2e אחת, סקריפט אחרי סקריפט (פורטים קבועים ⇒ לא במקביל), ונכשל אם אחד נכשל.
 *
 *   npm run build && node e2e/run-ci.mjs                 # סוויטת push (ברירת-מחדל)
 *   node e2e/run-ci.mjs --suite=nightly                  # הארוכים
 *   node e2e/run-ci.mjs --only=dialer-smoke,signup       # רק אלה (בלי .mjs)
 *
 * כשל = יציאה≠0 או חריגה ממגבלת-הזמן. הפלט של סקריפט שנכשל מודפס במלואו (קבוצה פתוחה ב-GitHub),
 * של סקריפט שעבר — מקופל. בסוף: טבלת-סיכום עם זמנים.
 * דורש dist/ בנוי. אין ניסיון-חוזר במכוון: בדיקה מתנדנדת צריכה להיראות, לא להיבלע.
 */
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PUSH, NIGHTLY, TIMEOUT_S } from './ci-suites.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const suite = arg('suite') ?? 'push';
const lists = { push: PUSH, nightly: NIGHTLY };
if (!lists[suite]) {
  console.error(`סוויטה לא מוכרת: ${suite} (push | nightly)`);
  process.exit(2);
}
const only = arg('only')?.split(',').map((s) => (s.endsWith('.mjs') ? s : s + '.mjs'));
const scripts = only ?? lists[suite];
const timeoutS = Number(process.env.E2E_TIMEOUT_S) || TIMEOUT_S[suite];
const GH = !!process.env.GITHUB_ACTIONS;

if (!existsSync(join(HERE, '..', 'dist', 'index.html'))) {
  console.error('❌ dist/ חסר — הריצו npm run build קודם');
  process.exit(2);
}

function run(file) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const child = spawn(process.execPath, [join(HERE, file)], { cwd: join(HERE, '..'), env: process.env });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutS * 1000);
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ file, code: timedOut ? 'timeout' : code, secs: Math.round((Date.now() - t0) / 1000), out });
    });
  });
}

console.log(`▶ e2e · סוויטה ${suite} · ${scripts.length} סקריפטים · מגבלה ${timeoutS} ש' לסקריפט`);
const results = [];
for (const file of scripts) {
  if (!existsSync(join(HERE, file))) {
    results.push({ file, code: 'missing', secs: 0, out: '' });
    console.log(`❌ ${file} — הקובץ לא קיים`);
    continue;
  }
  const r = await run(file);
  results.push(r);
  const pass = r.code === 0;
  const head = `${pass ? '✅' : '❌'} ${file} (${r.secs} ש'${pass ? '' : ' · ' + r.code})`;
  if (pass && GH) {
    console.log(`::group::${head}`);
    console.log(r.out.trimEnd());
    console.log('::endgroup::');
  } else if (pass) {
    console.log(head);
  } else {
    console.log(head);
    console.log(r.out.trimEnd());
    if (GH) console.log(`::error title=e2e ${file}::${file} נכשל (${r.code})`);
  }
}

const failed = results.filter((r) => r.code !== 0);
const total = results.reduce((s, r) => s + r.secs, 0);
console.log(`\n── סיכום e2e (${suite}) ──`);
for (const r of results) console.log(`${r.code === 0 ? '✅' : '❌'} ${String(r.secs).padStart(4)} ש'  ${r.file}${r.code === 0 ? '' : '  (' + r.code + ')'}`);
console.log(`${results.length - failed.length}/${results.length} עברו · ${Math.round(total / 60)} דק'`);
process.exit(failed.length ? 1 : 0);
