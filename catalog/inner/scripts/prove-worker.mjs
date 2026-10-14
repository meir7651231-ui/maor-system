/**
 * 🔬 עובד-ההוכחה של החלקים הפנימיים (INNER, 14.10.2026) — רץ ב-worker_threads עם env ריק ותקרת-זיכרון.
 * לכל מודול-gen: proveJob (lib/prove-job.mjs) — אריזה בזיכרון ⇒ ארגז-החול של הקטלוג (vm בלי process/require/fetch/eval,
 * שעון קבוע) ⇒ probePart (פעלי-האלפבית, n/n) + motionOf (תכונות-התנועה, בנפרד) לכל חלק.
 * לפני כל חלק נשלחת הודעת 'start' — התהליך הראשי מפעיל שומר-קריסה (lib/pool.mjs); העצירה עצמה = תקציב-צעדים.
 */
import { parentPort, workerData } from 'node:worker_threads';
import { pathToFileURL } from 'node:url';
import { proveJob } from '../lib/prove-job.mjs';

const { bridgePath, seed } = workerData;
process.on('unhandledRejection', () => {});
const B = await import(pathToFileURL(bridgePath).href);

// «בתורות» (SELF-V2): עבודה אחת בכל פעם מהתור המשותף של lib/pool.mjs; 'idle' = מוכן לבאה
parentPort.on('message', async (m) => {
  if (m.type !== 'job') return;
  const job = m.job;
  const { pairs } = await proveJob(job, { B, seed, onStart: (id) => parentPort.postMessage({ type: 'start', id }), onDone: (id, result) => parentPort.postMessage({ type: 'done', id, result }), onDeps: (deps) => parentPort.postMessage({ type: 'deps', abs: job.abs, deps }) });
  if (pairs.length) parentPort.postMessage({ type: 'pairs', pairs });
  parentPort.postMessage({ type: 'idle' });
});
parentPort.postMessage({ type: 'idle' });
