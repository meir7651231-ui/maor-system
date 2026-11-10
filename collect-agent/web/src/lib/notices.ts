// הודעות מערכת לבעל העסק מתוך /owner/inbox (תזכורת סוף ניסיון, 3 תזכורות מוצו, חשבונית ישנה, SMS שלא נמסר).
// רק direction='system' — אלה טקסטים שהשרת עצמו כתב. תשובות לקוחות (טקסט חופשי) מוצגות ב«תשובות לקוחות», לא כאן.
export interface OwnerMsg { id: number; customer_id: number | null; direction: string; channel: string; body: string; intent: string | null; created_at: string }
export interface Notice { id: number; icon: string; title: string; body: string; tone: 'warn' | 'info'; intent: string }

const KIND: Record<string, { icon: string; title: string; tone: Notice['tone'] }> = {
  trial_ending: { icon: '⏳', title: 'תקופת הניסיון מסתיימת בקרוב', tone: 'warn' },
  max_reminders: { icon: '✋', title: 'נשלחו 3 תזכורות — מומלץ קשר אישי', tone: 'warn' },
  manual_only_old: { icon: '🗂️', title: 'חשבונית ישנה — טיפול ידני בלבד', tone: 'info' },
  no_due_date: { icon: '📅', title: 'חשבונית בלי תאריך — אין תזכורות עליה', tone: 'warn' },
  shared_contact: { icon: '👥', title: 'אותו טלפון/מייל, שמות שונים — נשמרו כלקוחות נפרדים', tone: 'info' },
  stale_draft: { icon: '⏳', title: 'הצעה שחיכתה יותר מדי — לא נשלחה', tone: 'warn' },
  send_unknown: { icon: '⚠️', title: 'שליחה נקטעה באמצע — לבדוק ביומן היוצאים', tone: 'warn' },
  doc_without_id: { icon: '🧾', title: 'מסמכים בלי מזהה ממערכת החשבוניות — לא נשלחות עליהם תזכורות', tone: 'warn' },
  sms_undelivered: { icon: '📵', title: 'SMS לא נמסר', tone: 'warn' },
  credit_review: { icon: '🧾', title: 'זיכוי שלא שויך לחשבונית — לבדיקתך', tone: 'warn' },
  // חיוב דרך אורביט (8.11.2026): חסד / סיום / ביטול — הגוף כולל קישור לחיוב באורביט
  orbit_billing: { icon: '💳', title: 'המנוי לגבי — נדרשת פעולה באורביט', tone: 'warn' },
  // critic סבב 33: הודעות **נכנסות** בלי לקוח — אין להן טיוטה ב«תשובות לקוחות», וזה המקום היחיד שבו הן נראות
  unknown_sender: { icon: '❔', title: 'הודעה ממספר/כתובת לא מוכרים', tone: 'warn' },
  shared_contact_ambiguous: { icon: '👥', title: 'הודעה ממספר/כתובת של כמה לקוחות — לא שויכה, לבדיקתך', tone: 'warn' },
};
/** נכנסות שמוצגות כאן: רק בלי לקוח מזוהה (ללקוח מזוהה יש טיוטה/כרטיס ב«תשובות לקוחות»). */
const INBOUND_ORPHANS = new Set(['unknown_sender', 'shared_contact_ambiguous']);

/** מסנן ומתרגם. intent לא מוכר ⇒ מוצג עם כותרת כללית (לא נבלע בשקט). סדר: trial_ending ראשון, ואז החדש ביותר. */
export function systemNotices(rows: OwnerMsg[]): Notice[] {
  return rows
    .filter(r => r.direction === 'system'
      || (r.direction === 'in' && r.customer_id == null && INBOUND_ORPHANS.has(r.intent ?? '')))
    .map(r => {
      const k = KIND[r.intent ?? ''] ?? { icon: 'ℹ️', title: 'הודעה מגבי', tone: 'info' as const };
      return { id: r.id, icon: k.icon, title: k.title, body: r.body, tone: k.tone, intent: r.intent ?? '' };
    })
    .sort((a, b) => Number(b.intent === 'trial_ending') - Number(a.intent === 'trial_ending') || b.id - a.id);
}
