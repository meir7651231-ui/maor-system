// הפעלה 222 (QA): בדיקות הדפדפן לא משאירות קבצים ב-TMPDIR. live.mjs השאיר תיקייה עם סוד ה-TOTP של עובד הדמו,
// ו-beta.mjs ארבע תיקיות sqlite עם נתוני הענף — בכל ריצה, גם בהצלחה. עכשיו כל תיקייה זמנית דרך tempDir (e2e/lib.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// @ts-expect-error — מודול JS בלי טיפוסים
import { tempDir, trackProc, cleanupTemps, launchChromium } from '../e2e/lib.mjs';

const LIB = fileURLToPath(new URL('../e2e/lib.mjs', import.meta.url));

test('tempDir ⇒ cleanupTemps מוחק; שרת חי נהרג לפני המחיקה (לא כותב אחרי ה-rm)', () => {
  const d = tempDir('gabi-check-');
  assert.ok(existsSync(d));
  const seen: boolean[] = [];
  const fake = { exitCode: null, signalCode: null, kill(sig: string) { seen.push(existsSync(d)); assert.equal(sig, 'SIGKILL'); } };
  const dead = { exitCode: 0, signalCode: null, kill() { throw new Error('לא הורגים תהליך שכבר יצא'); } };
  trackProc(fake); trackProc(dead);
  cleanupTemps();
  assert.deepEqual(seen, [true], 'kill לפני rm');
  assert.ok(!existsSync(d));
});

// תהליך node אמיתי עם TMPDIR פרטי: יוצר תיקייה + קובץ «סוד», ואז נגמר בדרך אחרת בכל פעם.
function runChild(mode: 'ok' | 'throw' | 'sigint' | 'sigterm'): Promise<{ code: number | null; left: string[] }> {
  const tmp = mkdtempSync(join(tmpdir(), 'gabi-check-root-'));
  const body = `import { tempDir } from ${JSON.stringify(LIB)}; import { writeFileSync } from 'node:fs';
const d = tempDir('gabi-e2e-'); writeFileSync(d + '/totp', 'x'.repeat(32)); console.log('ready');
if (${JSON.stringify(mode)} === 'throw') throw new Error('נפילה באמצע');
if (${JSON.stringify(mode)} !== 'ok') setInterval(() => {}, 1000);`;
  return new Promise((res, rej) => {
    const c = spawn(process.execPath, ['--input-type=module', '-e', body], { env: { ...process.env, TMPDIR: tmp }, stdio: ['ignore', 'pipe', 'ignore'] });
    c.stdout.on('data', b => {
      if (!String(b).includes('ready')) return;
      if (mode === 'sigint') c.kill('SIGINT');
      if (mode === 'sigterm') c.kill('SIGTERM');
    });
    c.on('error', rej);
    c.on('exit', code => { const left = readdirSync(tmp); rmSync(tmp, { recursive: true, force: true }); res({ code, left }); });
  });
}

test('יציאה רגילה ⇒ TMPDIR ריק', async () => {
  const r = await runChild('ok'); assert.equal(r.code, 0); assert.deepEqual(r.left, []);
});
test('חריגה שלא נתפסה ⇒ TMPDIR ריק', async () => {
  const r = await runChild('throw'); assert.equal(r.code, 1); assert.deepEqual(r.left, []);
});
test('SIGINT ⇒ 130 ו-TMPDIR ריק', async () => {
  const r = await runChild('sigint'); assert.equal(r.code, 130); assert.deepEqual(r.left, []);
});
test('SIGTERM ⇒ 143 ו-TMPDIR ריק', async () => {
  const r = await runChild('sigterm'); assert.equal(r.code, 143); assert.deepEqual(r.left, []);
});

test('מגן-מקור: אין mkdtemp/tmpdir ישיר ב-e2e — רק tempDir מ-lib.mjs', () => {
  const dir = new URL('../e2e/', import.meta.url);
  const bad: string[] = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.mjs') || f === 'lib.mjs') continue;
    readFileSync(new URL(f, dir), 'utf8').split('\n').forEach((l, i) => { if (/mkdtemp|\btmpdir\(/.test(l)) bad.push(`${f}:${i + 1}`); });
  }
  assert.deepEqual(bad, []);
});

// הפעלה 223 (QA): Chromium עצמו השאיר ‎.org.chromium.Chromium.*‎ ב-TMPDIR ב-5 מ-64 הרצות של concepts-*-board (מרוץ
// בכיבוי, גם אחרי close()). launchChromium נותן לדפדפן TMPDIR פרטי שנמחק ביציאה. אחרי: 0 מ-93.
test('launchChromium: הדפדפן מקבל TMPDIR פרטי (לא של התהליך) שנמחק ב-cleanupTemps; opts נשמרים', async () => {
  let got: { env: Record<string, string>; headless?: boolean } | undefined;
  const fake = { launch: async (o: typeof got) => { got = o; return 'browser'; } };
  assert.equal(await launchChromium(fake, { headless: true, env: { A: '1' } }), 'browser');
  assert.ok(got);
  const d = got.env.TMPDIR;
  assert.notEqual(d, process.env.TMPDIR);
  assert.match(d, /gabi-chromium-/);
  assert.equal(got.env.TMP, d); assert.equal(got.env.TEMP, d);
  assert.equal(got.env.A, '1'); assert.equal(got.headless, true);
  assert.equal(got.env.PATH, process.env.PATH, 'שאר הסביבה עוברת');
  assert.ok(existsSync(d));
  cleanupTemps();
  assert.ok(!existsSync(d));
});

test('מגן-מקור: כל launch של Playwright ב-e2e/ וב-scripts/ עובר דרך launchChromium', () => {
  const bad: string[] = [];
  for (const sub of ['../e2e/', '../scripts/']) {
    const dir = new URL(sub, import.meta.url);
    for (const f of readdirSync(dir)) {
      if (!/\.(mjs|js|ts)$/.test(f) || f === 'lib.mjs') continue;
      readFileSync(new URL(f, dir), 'utf8').split('\n').forEach((l, i) => { if (/\.launch(Persistent(Context)?|Server)?\(/.test(l)) bad.push(`${sub}${f}:${i + 1}`); });
    }
  }
  assert.deepEqual(bad, []);
});
