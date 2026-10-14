/**
 * 🔬 עובד-הבדיקה (CATALOG-VERBS, 14.10.2026) — רץ ב-worker_threads עם env ריק ותקרת-זיכרון.
 * לכל קובץ: probeJob (catalog/lib/probe-file.mjs) — אריזה בזיכרון ⇒ ארגז-חול (vm, בלי process/require אמיתיים/fetch/eval) ⇒ probePart.
 * לפני כל חלק נשלחת הודעת 'start' — התהליך הראשי מפעיל שומר-קריסה (lib/pool.mjs); העצירה עצמה = תקציב-צעדים.
 */
import { parentPort, workerData } from 'node:worker_threads';
import { pathToFileURL } from 'node:url';
import { probeJob } from '../lib/probe-file.mjs';

const { bridgePath, seed } = workerData;
// קוד אסינכרוני שהתחיל בטעינת-קובץ (סקריפט שקורא לעצמו) ונכשל אחר-כך בארגז-החול — לא מפיל את העובד
process.on('unhandledRejection', () => {});
const B = await import(pathToFileURL(bridgePath).href);

// «בתורות» (SELF-V2): עבודה אחת בכל פעם מהתור המשותף של lib/pool.mjs; 'idle' = מוכן לבאה
parentPort.on('message', async (m) => {
  if (m.type !== 'job') return;
  const job = m.job;
  await probeJob(job, { B, seed, onStart: (id) => parentPort.postMessage({ type: 'start', id }), onDone: (id, result) => parentPort.postMessage({ type: 'done', id, result }), onDeps: (deps) => parentPort.postMessage({ type: 'deps', abs: job.abs, deps }) });
  parentPort.postMessage({ type: 'idle' });
});
parentPort.postMessage({ type: 'idle' });
