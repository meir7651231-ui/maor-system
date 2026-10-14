/**
 * 🔬 עובד-הבדיקה (CATALOG-VERBS, 14.10.2026) — רץ ב-worker_threads עם env ריק ותקרת-זיכרון.
 * לכל קובץ: probeJob (catalog/lib/probe-file.mjs) — אריזה בזיכרון ⇒ ארגז-חול (vm, בלי process/require אמיתיים/fetch/eval) ⇒ probePart.
 * לפני כל חלק נשלחת הודעת 'start' — התהליך הראשי מפעיל שומר-זמן ומפיל את העובד אם נתקע.
 */
import { parentPort, workerData } from 'node:worker_threads';
import { pathToFileURL } from 'node:url';
import { probeJob } from '../lib/probe-file.mjs';

const { bridgePath, jobs, seed } = workerData;
// קוד אסינכרוני שהתחיל בטעינת-קובץ (סקריפט שקורא לעצמו) ונכשל אחר-כך בארגז-החול — לא מפיל את העובד
process.on('unhandledRejection', () => {});
const B = await import(pathToFileURL(bridgePath).href);

for (const job of jobs) {
  await probeJob(job, { B, seed, onStart: (id, key) => parentPort.postMessage({ type: 'start', id, key }), onDone: (id, result) => parentPort.postMessage({ type: 'done', id, result }) });
}
parentPort.postMessage({ type: 'end' });
