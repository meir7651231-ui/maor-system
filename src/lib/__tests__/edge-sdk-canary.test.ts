/**
 * קנרית — 🌉 מצב-מסונן (12.10.2026) נשען על התנהגות **מאומתת-במקור** של ה-SDK המותקן:
 * connectAuthEmulator מול המתווך (Auth) ו-host רשמי (Firestore). אלה ממשקים ציבוריים, אבל
 * סמנטיקת-האמולטור לא תוכננה לפרודקשן — bump של firebase (Dependabot!) שמשנה אחת מההנחות
 * חייב לעצור כאן עד ביקורת-חוזרת של knowledge/BUILD-ORDER-FILTERED-2026-10-12.md §2.2.
 * נבדק מול הקוד ש-Vite מאגד לדפדפן (@firebase/auth dist/esm, ‏@firebase/firestore index.esm).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const NM = resolve(__dirname, '../../../node_modules/@firebase');
const AUTH_DIR = join(NM, 'auth/dist/esm');
const authFiles = readdirSync(AUTH_DIR).filter((f) => /^index-[0-9a-f]+\.js$/.test(f));
const authSrc = authFiles.map((f) => readFileSync(join(AUTH_DIR, f), 'utf8')).join('\n');
const FS_DIR = join(NM, 'firestore/dist');
const fsSrc = readdirSync(FS_DIR)
  .filter((f) => /^common-[0-9a-f]+\.esm\.js$/.test(f))
  .map((f) => readFileSync(join(FS_DIR, f), 'utf8'))
  .join('\n');
const authVersion = (JSON.parse(readFileSync(join(NM, 'auth/package.json'), 'utf8')) as { version: string }).version;
const fsVersion = (JSON.parse(readFileSync(join(NM, 'firestore/package.json'), 'utf8')) as { version: string }).version;
const REVIEW = ' — firebase שודרג ושינה הנחה של מצב-מסונן; לבדוק מחדש BUILD-ORDER-FILTERED §2.2';

/** גוף-פונקציה בקובץ המאוגד (מ-`function name(` עד ה-`function ` הבא בתחילת-שורה). */
function fnBody(src: string, name: string): string {
  const start = src.search(new RegExp('(?:async )?function ' + name + '\\('));
  if (start < 0) return '';
  const next = src.slice(start + 1).search(/\n(?:async )?function |\nclass /);
  return src.slice(start, next < 0 ? undefined : start + 1 + next);
}

describe(`קנרית @firebase/auth ${authVersion} — סמנטיקת-האמולטור שהמתווך נשען עליה`, () => {
  it('יש בדיוק חבילת-esm אחת לבדוק', () => {
    expect(authFiles.length, 'auth dist/esm/index-*.js' + REVIEW).toBe(1);
  });

  it('connectAuthEmulator מקבל https:// ובונה url=<scheme>//<host>/ · באנר רק בלי disableWarnings', () => {
    const body = fnBody(authSrc, 'connectAuthEmulator');
    expect(body, 'https מותר' + REVIEW).toContain('_assert(/^https?:\\/\\//.test(url)');
    expect(body, 'צורת-ה-url' + REVIEW).toContain('const emulator = { url: `${protocol}//${host}${portStr}/` };');
    expect(body, 'באנר מגודר' + REVIEW).toMatch(/else if \(!disableWarnings\) \{\s*emitEmulatorWarning\(\);/);
  });

  it('כל בקשה = `${emulator.url}${googleHost}${path}` ⇒ מארח-גוגל הוא המקטע הראשון (ניתוב המתווך)', () => {
    expect(fnBody(authSrc, '_emulatorUrl'), '_emulatorUrl' + REVIEW).toContain("return `${url}${path.startsWith('/') ? path.slice(1) : path}`;");
    const target = fnBody(authSrc, '_getFinalTarget');
    expect(target, '_getFinalTarget' + REVIEW).toContain('const base = `${host}${path}?${query}`;');
    expect(target, '_getFinalTarget' + REVIEW).toMatch(/config\.emulator\s*\?\s*_emulatorUrl\(auth\.config, base\)/);
    expect(fnBody(authSrc, 'requestStsToken'), 'רענון-טוקן' + REVIEW).toMatch(/_getFinalTarget\(auth, tokenApiHost, "\/v1\/token"/);
  });

  it('משטח-האמולטור הוא זה שנבדק (9× config.emulator · 11× emulatorConfig · 5× appVerificationDisabledForTesting)', () => {
    const count = (re: RegExp) => (authSrc.match(re) ?? []).length;
    expect(count(/config\.emulator/g), 'config.emulator' + REVIEW).toBe(9);
    expect(count(/emulatorConfig/g), 'emulatorConfig' + REVIEW).toBe(11);
    expect(count(/appVerificationDisabledForTesting/g), 'appVerificationDisabledForTesting' + REVIEW).toBe(5);
  });

  it('getAuth = initializeAuth(resolver + אותה היררכיית-התמדה) ⇒ מצב-מסונן משחזר אותה בלי ה-resolver', () => {
    const body = fnBody(authSrc, 'getAuth');
    expect(body, 'getAuth' + REVIEW).toContain('popupRedirectResolver: browserPopupRedirectResolver');
    expect(body, 'היררכיית-התמדה' + REVIEW).toMatch(/persistence:\s*\[\s*indexedDBLocalPersistence,\s*browserLocalPersistence,\s*browserSessionPersistence\s*\]/);
  });
});

describe(`קנרית @firebase/firestore ${fsVersion} — host רשמי + זיהוי-long-polling`, () => {
  it('host/ssl מותאמים נלקחים כמות-שהם; ssl ברירת-מחדל true', () => {
    expect(fsSrc, 'FirestoreSettingsImpl' + REVIEW).toMatch(/this\.host\s*=\s*\w+\.host,\s*this\.ssl\s*=\s*\w+\.ssl\s*\?\?\s*\w+/);
    expect(fsSrc, 'ברירת-מחדל' + REVIEW).toMatch(/=\s*"firestore\.googleapis\.com",\s*\w+\s*=\s*!0/);
  });

  it('זיהוי buffering-proxy (long-polling אוטומטי) דלוק כברירת-מחדל', () => {
    expect(fsSrc, 'autoDetect' + REVIEW).toMatch(/void 0 === \w+\.experimentalAutoDetectLongPolling \? this\.experimentalAutoDetectLongPolling = (?:true|!0)/);
  });

  it('נתיבי-הבקשה שהמתווך מתיר: ‎/google.firestore.v1.Firestore/<rpc>/channel‎ ו-‎/v1/<path>:<rpc>‎', () => {
    expect(fsSrc, 'WebChannel' + REVIEW).toMatch(/"google\.firestore\.v1\.Firestore",\s*"\/",\s*\w+,\s*"\/channel"/);
    expect(fsSrc, 'REST' + REVIEW).toMatch(/`\$\{this\.\w+\}\/v1\/\$\{\w+\}:\$\{\w+\}`/);
    for (const rpc of ['batchGet', 'commit', 'runQuery', 'runAggregationQuery']) expect(fsSrc, rpc + REVIEW).toContain(`"${rpc}"`);
  });
});
