// הפעלה 235 (QA, «הבא» 2 מ-234): שרתים שבדיקות הדפדפן מרימות לא נשארים יתומים.
// הבאג: a11y.mjs ו-shots.mjs הרימו `npx vite preview` ועצרו ב-srv.kill() — נהרג רק npx, vite (נכד) נשאר על הפורט בכל
// ריצה, גם בהצלחה. ושאר הסקריפטים רשמו process.on('exit') בלבד ⇒ ב-SIGINT/SIGTERM השרת נשאר.
// עכשיו כל spawn ב-e2e/ עובר דרך spawnServer (lib.mjs): קבוצת תהליכים משלו, נהרגת ב-kill() וביציאה בכל דרך.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const LIB = fileURLToPath(new URL('../e2e/lib.mjs', import.meta.url));

const alive = (pid: number) => { try { process.kill(pid, 0); return true; } catch { return false; } };
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
async function gone(pid: number) { for (let i = 0; i < 40 && alive(pid); i++) await sleep(50); return !alive(pid); }

// תהליך node שמרים «שרת» שהוא מעטפת (כמו npx) עם נכד ארוך-חיים (כמו vite), מדפיס את pid הנכד, ואז נגמר בדרך אחרת.
type Mode = 'kill' | 'ok' | 'throw' | 'sigint' | 'sigterm';
function runChild(mode: Mode): Promise<{ code: number | null; grandchild: number }> {
  const body = `import { spawnServer } from ${JSON.stringify(LIB)};
const srv = spawnServer('sh', ['-c', 'sleep 300 & echo $!; wait'], { stdio: ['ignore', 'pipe', 'ignore'] });
srv.stdout.once('data', async b => {
  console.log('gc=' + String(b).trim());
  const m = ${JSON.stringify(mode)};
  if (m === 'kill') { srv.kill(); await new Promise(r => setTimeout(r, 300)); process.exit(0); }
  if (m === 'ok') process.exit(0);
  if (m === 'throw') throw new Error('נפילה באמצע');
  setInterval(() => {}, 1000);
});`;
  return new Promise((res, rej) => {
    let gc = 0;
    const c = spawn(process.execPath, ['--input-type=module', '-e', body], { stdio: ['ignore', 'pipe', 'ignore'] });
    c.stdout.on('data', b => {
      const m = /gc=(\d+)/.exec(String(b));
      if (!m) return;
      gc = Number(m[1]);
      if (mode === 'sigint') c.kill('SIGINT');
      if (mode === 'sigterm') c.kill('SIGTERM');
    });
    c.on('error', rej);
    c.on('exit', code => res({ code, grandchild: gc }));
  });
}

for (const [mode, code] of [['kill', 0], ['ok', 0], ['throw', 1], ['sigint', 130], ['sigterm', 143]] as const) {
  test(`spawnServer: ${mode} ⇒ גם הנכד (vite מתחת ל-npx) מת, קוד ${code}`, async () => {
    const r = await runChild(mode);
    assert.ok(r.grandchild > 0, 'הנכד הופעל');
    try {
      assert.equal(r.code, code);
      assert.ok(await gone(r.grandchild), `נכד ${r.grandchild} נשאר יתום אחרי ${mode}`);
    } finally { try { process.kill(r.grandchild, 'SIGKILL'); } catch { /* מת */ } }
  });
}

test('מגן-מקור: כל spawn ב-e2e/ עובר דרך spawnServer (לא spawn/trackProc ישיר)', () => {
  const dir = new URL('../e2e/', import.meta.url);
  const bad: string[] = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.mjs') || f === 'lib.mjs') continue;
    readFileSync(new URL(f, dir), 'utf8').split('\n').forEach((l, i) => {
      if (/(^|[^\w.])spawn\(|\bfork\(|\bexec\(|trackProc\(|from 'node:child_process'.*\bspawn\b/.test(l)) bad.push(`${f}:${i + 1}`);
    });
  }
  assert.deepEqual(bad, []);
});
