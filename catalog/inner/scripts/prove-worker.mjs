/**
 * 🔬 עובד-ההוכחה של החלקים הפנימיים (INNER, 14.10.2026) — רץ ב-worker_threads עם env ריק ותקרת-זיכרון.
 * לכל מודול-gen: proveJob (lib/prove-job.mjs) — אריזה בזיכרון ⇒ ארגז-החול של הקטלוג (vm בלי process/require/fetch/eval,
 * שעון קבוע) ⇒ probePart (פעלי-האלפבית, n/n) + motionOf (תכונות-התנועה, בנפרד) לכל חלק.
 * לפני כל חלק נשלחת הודעת 'start' — התהליך הראשי מפעיל שומר-זמן ומפיל את העובד אם נתקע.
 */
import { parentPort, workerData } from 'node:worker_threads';
import { pathToFileURL } from 'node:url';
import { proveJob } from '../lib/prove-job.mjs';

const { bridgePath, jobs, seed } = workerData;
process.on('unhandledRejection', () => {});
const B = await import(pathToFileURL(bridgePath).href);

for (const job of jobs) {
  const { pairs } = await proveJob(job, { B, seed, onStart: (id) => parentPort.postMessage({ type: 'start', id }), onDone: (id, result) => parentPort.postMessage({ type: 'done', id, result }) });
  if (pairs.length) parentPort.postMessage({ type: 'pairs', pairs });
}
parentPort.postMessage({ type: 'end' });
