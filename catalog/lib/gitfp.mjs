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
import { spawnSync } from 'node:child_process';

/** sha1 של blob ב-git — הטביעה של תוכן-קובץ. */
export function blobSha(buf) {
  const b = typeof buf === 'string' ? Buffer.from(buf) : buf;
  return crypto.createHash('sha1').update('blob ' + b.length + '\0').update(b).digest('hex');
}

/** סביבה נקייה ל-git: בלי משתני-GIT_* שמפנים לריפו/אינדקס אחר. */
function gitEnv() {
  const env = { ...process.env, LC_ALL: 'C', GIT_OPTIONAL_LOCKS: '0' };
  for (const k of Object.keys(env)) if (/^GIT_(DIR|WORK_TREE|INDEX_FILE|OBJECT_DIRECTORY|COMMON_DIR|NAMESPACE|CEILING_DIRECTORIES)$/.test(k)) delete env[k];
  return env;
}
const run = (root, args) => spawnSync('git', ['-C', root, ...args], { encoding: 'buffer', env: gitEnv(), maxBuffer: 1 << 30 });

/**
 * האינדקס: Map(נתיב-יחסי ⇒ sha) של כל קובץ **נקי** במעקב (התוכן בתיקייה = התוכן באינדקס). {ok:false, why} ⇒ נפילה בטוחה.
 * `GITFP=off` מכבה (לבדיקות: הדרך הרגילה).
 */
export function gitIndex(root) {
  if (process.env.GITFP === 'off') return { ok: false, why: 'GITFP=off', shas: new Map() };
  if (!fs.existsSync(path.join(root, '.git'))) return { ok: false, why: 'אין git בתיקייה', shas: new Map() };
  const top = run(root, ['rev-parse', '--show-toplevel', '--git-path', 'info/attributes']);
  if (top.status !== 0) return { ok: false, why: 'git לא זמין', shas: new Map() };
  const [tl, infoAttr] = String(top.stdout).split('\n');
  let real; try { real = fs.realpathSync(root); } catch { real = root; }
  if (tl !== real && tl !== root) return { ok: false, why: 'האינדקס של ריפו אחר', shas: new Map() };
  // סינון-תוכן (attributes/autocrlf/eol) ⇒ התוכן בתיקייה ≠ התוכן באינדקס גם כשהקובץ "נקי" — לא סומכים
  const xdg = path.join(process.env.XDG_CONFIG_HOME || path.join(process.env.HOME || '/nonexistent', '.config'), 'git/attributes');
  if (fs.existsSync(path.resolve(root, infoAttr)) || fs.existsSync(xdg)) return { ok: false, why: 'קובץ attributes', shas: new Map() };
  const cfg = run(root, ['config', '--get-regexp', '^core\\.(autocrlf|eol|attributesfile)$']);
  // (הגדרות filter.* לבדן — כמו git-lfs הגלובלי — לא חלות על שום קובץ בלי attributes, ואלה נבדקו למעלה)
  if (String(cfg.stdout).split('\n').some((l) => l && !/^core\.autocrlf false$/i.test(l))) return { ok: false, why: 'סינון-תוכן ב-git config', shas: new Map() };
  const ls = run(root, ['ls-files', '-s', '-v', '-z']);
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
  const df = run(root, ['diff-files', '--name-only', '-z']);
  if (df.status !== 0) return { ok: false, why: 'diff-files נכשל', shas: new Map() };
  for (const rel of String(df.stdout).split('\0')) if (rel) shas.delete(rel);
  return { ok: true, shas };
}

/** טביעת קובץ (יחסי): מהאינדקס אם נקי, אחרת מהתוכן. קובץ חסר ⇒ null. */
export function fileSha(root, idx, rel) {
  const s = idx?.shas.get(rel);
  if (s) return s;
  try { return blobSha(fs.readFileSync(path.join(root, rel))); } catch { return null; }
}
