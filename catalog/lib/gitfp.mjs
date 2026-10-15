/**
 * ⚡ «טביעה בלי קריאה» (SPEED1000, 14.10.2026) — הטביעה של כל קובץ במעקב כבר רשומה באינדקס של git (sha של ה-blob).
 * `git ls-files -s` נותן אותה לכל הקבצים בבת אחת **בלי לקרוא אף קובץ**; `git diff-files` אומר אילו קבצים בתיקיית-העבודה
 * שונים מהאינדקס (git בודק בעצמו גם קבצים "גזעיים" — racy — לפי התוכן). רק אותם — ואת מה שלא במעקב — קוראים ומחשבים.
 *
 * הטביעה של קובץ = sha1 של `blob <גודל>\0<תוכן>` — **בדיוק** מה ש-git מחשב, כך שקובץ נקי (מהאינדקס) וקובץ מלוכלך (מחושב)
 * עם אותו תוכן נותנים אותה טביעה. אין git / האינדקס לא של התיקייה הזו / יש סינון-תוכן (.gitattributes, autocrlf) /
 * קבצים מסומנים assume-unchanged או skip-worktree ⇒ **נפילה בטוחה**: כל קובץ נקרא ומחושב (אותן טביעות, רק לאט יותר).
 * ratchet: catalog/__tests__/speed1000.test.ts (מהאינדקס = מחושב, לכל קובץ במעקב; קובץ מלוכלך/חדש; בלי git).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
// child_process נטען רק כשבאמת קוראים ל-git (readHead קורא את .git ישירות — מסלולים מהירים לא משלמים על הטעינה)
let cpMemo = null;
const cp = () => (cpMemo ??= createRequire(import.meta.url)('node:child_process'));

/** sha1 של blob ב-git — הטביעה של תוכן-קובץ. */
export function blobSha(buf) {
  const b = typeof buf === 'string' ? Buffer.from(buf) : buf;
  return crypto.createHash('sha1').update('blob ' + b.length + '\0').update(b).digest('hex');
}

/** סביבה נקייה ל-git: בלי משתני-GIT_* שמפנים לריפו/אינדקס אחר. */
let envMemo = null;
function gitEnv() {
  if (envMemo) return envMemo;
  const env = { ...process.env, LC_ALL: 'C', GIT_OPTIONAL_LOCKS: '0' };
  for (const k of Object.keys(env)) if (/^GIT_(DIR|WORK_TREE|INDEX_FILE|OBJECT_DIRECTORY|COMMON_DIR|NAMESPACE|CEILING_DIRECTORIES)$/.test(k)) delete env[k];
  return (envMemo = env);
}
const run = (root, args) => cp().spawnSync('git', ['-C', root, ...args], { encoding: 'buffer', env: gitEnv(), maxBuffer: 1 << 30 });
const runAsync = (root, args) => new Promise((resolve) => cp().execFile('git', ['-C', root, ...args], { encoding: 'buffer', env: gitEnv(), maxBuffer: 1 << 30 }, (err, stdout) => resolve({ status: err ? (err.code ?? 1) : 0, stdout })));

/**
 * האינדקס: Map(נתיב-יחסי ⇒ sha) של כל קובץ **נקי** במעקב (התוכן בתיקייה = התוכן באינדקס). {ok:false, why} ⇒ נפילה בטוחה.
 * `GITFP=off` מכבה (לבדיקות: הדרך הרגילה).
 */
export function gitIndex(root) {
  const pre = precheck(root);
  if (pre) return pre;
  return parseIndex(root, ...CALLS.map((a) => run(root, a)));
}
/** אותו דבר, ארבע הקריאות ל-git במקביל (≈ פי 3 מהר יותר בזמן-קיר). */
export async function gitIndexAsync(root) {
  const pre = precheck(root);
  if (pre) return pre;
  return parseIndex(root, ...(await Promise.all(CALLS.map((a) => runAsync(root, a)))));
}
/** הקריאות ל-git: השורש + קובץ-attributes מקומי · הגדרות-סינון · האינדקס · מה מלוכלך · .gitattributes שלא במעקב. */
const CALLS = [
  ['rev-parse', '--show-toplevel', '--git-path', 'info/attributes'],
  ['config', '--get-regexp', '^core\\.(autocrlf|eol|attributesfile)$'],
  ['ls-files', '-s', '-v', '-z'],
  ['diff-files', '--name-only', '-z'],
  ['ls-files', '--others', '--exclude-standard', '-z', '--', ':(glob)**/.gitattributes'],
];
function precheck(root) {
  if (process.env.GITFP === 'off') return { ok: false, why: 'GITFP=off', shas: new Map() };
  // מעקב-קריאות פעיל (lib/trace-reads.mjs — test-changed, self-v2): הקיצור לא קורא קבצים ⇒ המעקב לא היה רואה את הקלטים.
  // נופלים לקריאה ⇒ כל קלט נקרא ונרשם (אותן טביעות בדיוק)
  if (process.env.CATALOG_TRACE) return { ok: false, why: 'מעקב-קריאות', shas: new Map() };
  if (!fs.existsSync(path.join(root, '.git'))) return { ok: false, why: 'אין git בתיקייה', shas: new Map() };
  return null;
}
function parseIndex(root, top, cfg, ls, df, attrs) {
  if (attrs.status !== 0 || String(attrs.stdout).length) return { ok: false, why: '.gitattributes (לא במעקב)', shas: new Map() };
  if (top.status !== 0) return { ok: false, why: 'git לא זמין', shas: new Map() };
  const [tl, infoAttr] = String(top.stdout).split('\n');
  let real; try { real = fs.realpathSync(root); } catch { real = root; }
  if (tl !== real && tl !== root) return { ok: false, why: 'האינדקס של ריפו אחר', shas: new Map() };
  // סינון-תוכן (attributes/autocrlf/eol) ⇒ התוכן בתיקייה ≠ התוכן באינדקס גם כשהקובץ "נקי" — לא סומכים
  const xdg = path.join(process.env.XDG_CONFIG_HOME || path.join(process.env.HOME || '/nonexistent', '.config'), 'git/attributes');
  if (fs.existsSync(path.resolve(root, infoAttr)) || fs.existsSync(xdg)) return { ok: false, why: 'קובץ attributes', shas: new Map() };
  // (הגדרות filter.* לבדן — כמו git-lfs הגלובלי — לא חלות על שום קובץ בלי attributes, ואלה נבדקו למעלה)
  if (String(cfg.stdout).split('\n').some((l) => l && !/^core\.autocrlf false$/i.test(l))) return { ok: false, why: 'סינון-תוכן ב-git config', shas: new Map() };
  if (ls.status !== 0) return { ok: false, why: 'ls-files נכשל', shas: new Map() };
  const shas = new Map();
  for (const rec of String(ls.stdout).split('\0')) {
    if (!rec) continue;
    // "<תג> <מצב> <sha> <שלב>\t<נתיב>" — תג: H רגיל · אות קטנה = assume-unchanged · S = skip-worktree
    const m = /^(\S) (\d+) ([0-9a-f]{40}) (\d)\t([^]*)$/.exec(rec);
    if (!m) return { ok: false, why: 'פלט לא צפוי מ-ls-files', shas: new Map() };
    const [, tag, mode, sha, stage, rel] = m;
    if (path.posix.basename(rel) === '.gitattributes') return { ok: false, why: '.gitattributes במעקב', shas: new Map() };
    if (tag !== 'H' || stage !== '0' || mode === '120000' || mode === '160000') continue; // לא נקי בוודאות ⇒ יחושב
    shas.set(rel, sha);
  }
  if (df.status !== 0) return { ok: false, why: 'diff-files נכשל', shas: new Map() };
  for (const rel of String(df.stdout).split('\0')) if (rel) shas.delete(rel);
  return { ok: true, shas };
}

/**
 * HEAD (sha) — קריאה ישירה מ-.git (HEAD · ref · packed-refs · worktree דרך gitdir/commondir), בלי תהליך git. לא הצליח ⇒
 * `git rev-parse HEAD`. אין git ⇒ null.
 */
export function readHead(root) {
  try {
    let gd = path.join(root, '.git');
    if (fs.statSync(gd).isFile()) gd = path.resolve(root, /^gitdir: (.+)$/m.exec(fs.readFileSync(gd, 'utf8'))[1].trim());
    const h = fs.readFileSync(path.join(gd, 'HEAD'), 'utf8').trim();
    if (/^[0-9a-f]{40}$/.test(h)) return h;
    const ref = /^ref: (.+)$/.exec(h)[1];
    let common = gd; try { common = path.resolve(gd, fs.readFileSync(path.join(gd, 'commondir'), 'utf8').trim()); } catch { /* לא worktree */ }
    for (const d of [gd, common]) { try { const v = fs.readFileSync(path.join(d, ref), 'utf8').trim(); if (/^[0-9a-f]{40}$/.test(v)) return v; } catch { /* */ } }
    const packed = fs.readFileSync(path.join(common, 'packed-refs'), 'utf8');
    const m = new RegExp('^([0-9a-f]{40}) ' + ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'm').exec(packed);
    if (m) return m[1];
  } catch { /* ⇒ git */ }
  if (!fs.existsSync(path.join(root, '.git'))) return null;
  const r = run(root, ['rev-parse', '--verify', '-q', 'HEAD']);
  return r.status === 0 ? String(r.stdout).trim() : null;
}

/** טביעת קובץ (יחסי): מהאינדקס אם נקי, אחרת מהתוכן. קובץ חסר ⇒ null. */
export function fileSha(root, idx, rel) {
  const s = idx?.shas.get(rel);
  if (s) return s;
  try { return blobSha(fs.readFileSync(path.join(root, rel))); } catch { return null; }
}
