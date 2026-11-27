// מבקר 270🟡: «✓ אשר ושלח» הציג תמיד «נשלח» — גם כשהתשובה רק נכנסה לתור (שירות עצור / שבת-לילה /
// עצירת שחזור). טהור — נבדק ב-tests/lib.check.ts. הסטטוס והסיבה מגיעים מהשרת (app/inbox.py
// → approve_draft / drafts: queued_reason).

export type QueueReason = 'outside_window' | 'trial_expired' | 'restore_hold' | 'retry';
export interface ApproveResult { status: string; queued_reason?: QueueReason | string }

/** למה תשובה שאושרה עדיין לא יצאה — במילים של בעל העסק */
export const QUEUE_REASON: Record<QueueReason, string> = {
  outside_window: 'תישלח אוטומטית בחלון השליחה הבא (לא בלילה, בשבת או בחג)',
  trial_expired: 'השירות עצור (המנוי לא פעיל) — תישלח אחרי חידוש',
  restore_hold: 'השליחה עצורה עד שתאשרו את השחזור מגיבוי',
  retry: 'לא הצלחנו לאמת את היתרה מול המקור — ננסה שוב אוטומטית',
};
export const queueReasonText = (r?: string) => QUEUE_REASON[(r ?? 'retry') as QueueReason] ?? QUEUE_REASON.retry;

/** אחרי 4 ימים בתור תשובה חוזרת לאישור (inbox.STALE_DRAFT_HOURS) */
export const STALE_NOTE = 'אם תחכה יותר מ-4 ימים, היא תחזור אליכם לאישור מחדש.';

export function approveToast(r: ApproveResult | null | undefined): string {
  const st = r?.status;
  if (st === 'sent_dry_run' || st === 'sent') return '✓ המענה אושר ונשלח (dry-run)';
  if (st === 'approved') return `⏳ המענה אושר, אבל עדיין לא נשלח: ${queueReasonText(r?.queued_reason)}. ${STALE_NOTE}`;
  if (st === 'rejected') return 'המענה לא נשלח — הסיבה מחכה לכם ב«דורש טיפול»';
  if (st === 'pending_approval') return 'המענה לא נשלח: הוא חיכה יותר מדי וחזר לאישור מחדש';
  return '✓ המענה אושר';
}
