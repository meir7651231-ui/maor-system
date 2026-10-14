/**
 * 🧵 מאגר-העובדים של המכונה (SELF-V2, 14.10.2026) — «מחלק» + «בתורות»: עבודות (קובץ/מודול לכל עבודה) ⇒ N עובדים
 * (worker_threads), כל עובד עם env ריק ותקרת-זיכרון. היה כתוב שלוש פעמים (קורא-ההתנהגות · מוכיח-הפנימיים ·
 * המכונה-על-עצמה), כל אחד עם חלוקה קבועה מראש ושעון של 20 שניות שקבע "timeout" לפי מהירות המחשב. עכשיו:
 *   · תור משותף — עובד פנוי לוקח את העבודה הבאה (הגדולה קודם), כך שעבודה כבדה אחת לא משאירה את שאר הליבות בלי עבודה;
 *   · עצירה דטרמיניסטית = תקציב-הצעדים שבתוך הארגז (lib/steps.mjs ⇒ status 'budget');
 *   · השעון כאן הוא רק **שומר-קריסה** (WATCHDOG_MS, נדיב): אם הוא נורה — זו תקלה, לא תוצאה, והתהליך יוצא בכישלון
 *     (exitCode 3) כדי שתוצאה שתלויה בשעון לא תיכנס לריפו בשקט.
 * התוצאה של כל חלק תלויה רק בעבודה שלו (ארגז-חול לכל קובץ) — לא בעובד ולא בסדר; הצרכנים ממיינים לפי id.
 *
 * העובד שולח: {type:'idle'} כשהוא פנוי · {type:'start', id} לפני חלק · {type:'done', id, result} · כל סוג אחר ⇒ onMessage.
 * המאגר שולח לעובד: {type:'job', job}.
 */
import { Worker } from 'node:worker_threads';

export const WATCHDOG_MS = 10 * 60_000;

/** jobs = [{ parts: [{id,…}], … }] ⇒ results (Map id ⇒ result). עובד שקרס ⇒ 'crashed' לחלק שבאמצע, ושאר העבודה חוזרת לתור. */
export async function runPool({ file, jobs, workers, data, onMessage = () => {}, results = new Map(), watchdogMs = WATCHDOG_MS }) {
  const queue = jobs.slice().sort((a, b) => b.parts.length - a.parts.length || (String(a.abs) < String(b.abs) ? -1 : 1));
  const left = (j) => ({ ...j, parts: j.parts.filter((p) => !results.has(p.id)) });
  const env = Object.fromEntries(['CATALOG_CACHE', 'CATALOG_STEPS_LOG'].filter((k) => process.env[k]).map((k) => [k, process.env[k]]));
  const one = () => new Promise((resolve) => {
    const spawn = () => {
      if (!queue.length) return resolve();
      const w = new Worker(file, { workerData: data, env, resourceLimits: { maxOldGenerationSizeMb: 1536 }, stdout: true, stderr: true });
      let cur = null; let job = null; let timer = null; let ended = false;
      const next = () => {
        while (queue.length) { const j = left(queue.shift()); if (j.parts.length) { job = j; w.postMessage({ type: 'job', job: j }); return; } }
        job = null; ended = true; w.terminate();
      };
      const arm = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (cur) {
            results.set(cur, { status: 'watchdog' });
            console.error(`✗ שומר-הקריסה: ${cur} רץ יותר מ-${watchdogMs / 1000}s בלי לגמור את תקציב-הצעדים — תקלה, לא תוצאה (exitCode 3)`);
            process.exitCode = 3;
          }
          w.terminate();
        }, watchdogMs);
      };
      w.on('message', (m) => {
        if (m.type === 'idle') next();
        else if (m.type === 'start') { cur = m.id; arm(); }
        else if (m.type === 'done') { results.set(m.id, m.result); cur = null; clearTimeout(timer); }
        else onMessage(m);
      });
      w.on('error', () => { if (cur) results.set(cur, { status: 'crashed' }); });
      w.on('exit', () => {
        clearTimeout(timer);
        if (cur && !results.has(cur)) results.set(cur, { status: 'crashed' });
        if (ended) return resolve();
        if (job) { const j = left(job); if (j.parts.length) queue.unshift(j); } // שאר העבודה של עובד שקרס — לעובד חדש
        spawn();
      });
    };
    spawn();
  });
  await Promise.all(Array.from({ length: Math.max(1, Math.min(workers, queue.length)) }, one));
  return results;
}
