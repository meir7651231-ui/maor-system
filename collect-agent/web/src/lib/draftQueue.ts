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

// מנהל 444 (מבקר 271🟡): «✓ אישור ההצעה» (הסדר תשלומים) אמר תמיד «נשלחה ללקוח» — גם כשהשרת החזיר
// queued (שירות עצור / מחוץ לחלון / עצירת שחזור). השרת מחזיר queued + queued_reason (service._approve_plan_claimed).
export interface PlanApproveResult { queued?: boolean; queued_reason?: QueueReason | string; draft_status?: string }

/** הצעה בתור שלא יצאה תוך 4 ימים, או שמועד התשלום הראשון בה עבר — מבוטלת (inbox._withdraw_if_stale) */
export const PLAN_STALE_NOTE = 'אם לא תצא תוך 4 ימים או לפני מועד התשלום הראשון, ההצעה תבוטל ותצטרכו לאשר הצעה חדשה.';

export function planApproveToast(r: PlanApproveResult | null | undefined): string {
  if (r?.draft_status === 'rejected') return 'ההצעה לא נשלחה ללקוח — הסיבה מחכה לכם ב«דורש טיפול», וההסדר חזר להצעה';
  if (r?.queued) return `⏳ ההסדר אושר, אבל ההצעה עדיין לא נשלחה ללקוח: ${queueReasonText(r.queued_reason).replace('תישלח', 'היא תישלח')}. ${PLAN_STALE_NOTE}`;
  if (r && 'queued' in r) return 'ההצעה אושרה ונשלחה ללקוח (dry-run)';
  return '✓ ההצעה אושרה';
}

/** מבקר 271ℹ️: אישור תזכורת כשלא יצא כלום — «ייצא בחלון הבא» רק כשזו באמת הסיבה (השרת: /dispatch → held) */
export function reminderQueuedText(held?: string | null): string {
  if (held === 'trial_expired') return 'נכנס לתור — השירות עצור (המנוי לא פעיל), התזכורת תצא אחרי חידוש';
  if (held === 'restore_hold') return 'נכנס לתור — השליחה עצורה עד שתאשרו את השחזור מגיבוי';
  return 'נכנס לתור — ייצא בחלון השליחה הבא';
}
