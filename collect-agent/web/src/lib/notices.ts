// הודעות מערכת לבעל העסק מתוך /owner/inbox (תזכורת סוף ניסיון, 3 תזכורות מוצו, חשבונית ישנה, SMS שלא נמסר).
// רק direction='system' — אלה טקסטים שהשרת עצמו כתב. תשובות לקוחות (טקסט חופשי) מוצגות ב«תשובות לקוחות», לא כאן.
export interface OwnerMsg { id: number; customer_id: number | null; direction: string; channel: string; body: string; intent: string | null; created_at: string; payload?: string | null }
export interface Notice { id: number; icon: string; title: string; body: string; tone: 'warn' | 'info'; intent: string; linked?: { id: number; name: string }[]; unverified?: boolean; customerId?: number }

const KIND: Record<string, { icon: string; title: string; tone: Notice['tone'] }> = {
  trial_ending: { icon: '⏳', title: 'תקופת הניסיון מסתיימת בקרוב', tone: 'warn' },
  dsr: { icon: '📄', title: 'בקשת עיון/תיקון/מחיקה — יש מועד להשיב', tone: 'warn' },
  max_reminders: { icon: '✋', title: 'נשלחו 3 תזכורות — מומלץ קשר אישי', tone: 'warn' },
  manual_only_old: { icon: '🗂️', title: 'חשבונית ישנה — טיפול ידני בלבד', tone: 'info' },
  no_due_date: { icon: '📅', title: 'חשבונית בלי תאריך — אין תזכורות עליה', tone: 'warn' },
  shared_contact: { icon: '👥', title: 'אותו טלפון/מייל, שמות שונים — נשמרו כלקוחות נפרדים', tone: 'info' },
  stale_draft: { icon: '⏳', title: 'הצעה שחיכתה יותר מדי — לא נשלחה', tone: 'warn' },
  send_unknown: { icon: '⚠️', title: 'שליחה נקטעה באמצע — לבדוק ביומן היוצאים', tone: 'warn' },
  send_error: { icon: '⚠️', title: 'תשובה ללקוח לא נשלחה — שגיאת שליחה', tone: 'warn' },
  // critic סבב 60: טיוטה שנעצרה כי הלקוח ביקש הסרה אחרי שנוסחה (נעלמה בשקט מהתור, גם כשכבר אושרה)
  // critic סבב 61: תשובה שאושרה ונדחתה ברגע השליחה (היתרה השתנתה / אין כתובת / חסימה בשער) — הייתה נדחית בשקט
  // critic סבב 72: קישור תשלום / Reply-To / שם שולח שונו (כל עובד יכול) ⇒ בעל העסק יודע
  settings_changed: { icon: '🔐', title: 'הגדרות רגישות שונו — ודאו שזה אתם', tone: 'warn' },
  draft_not_sent: { icon: '🚫', title: 'תשובה שאישרתם לא נשלחה — לבדיקתכם', tone: 'warn' },
  draft_stopped_opt_out: { icon: '🚫', title: 'תשובה ללקוח לא נשלחה — הלקוח ביקש הסרה', tone: 'warn' },
  // מבקר 219ב: חשבונית CSV שנסגרה לפי קובץ חזרה כפתוחה בקובץ חדש (קובץ ישן שהועלה בטעות?)
  csv_contact_plan: { icon: '📇', title: 'פרטי קשר השתנו בקובץ לחשבונית בהסדר — הלקוח הושהה, לעדכן', tone: 'warn' },
  // מבקר 239: הסרה שעברה בקובץ עם חשבונית — הלקוח החדש כתב ולא ביקש הסרה; לא נרשמה כבקשה שלו
  inherited_optout: { icon: '📇', title: 'הסרה שעברה עם חשבונית מפרטי קשר קודמים — הלקוח לא ביקש, להכריע', tone: 'warn' },
  csv_reopened: { icon: '📂', title: 'חשבונית שנסגרה לפי קובץ חזרה כפתוחה — לבדוק', tone: 'warn' },
  // מבקר 244: מטבע של חשבונית פתוחה השתנה במקור — סכומים במטבעות שונים לא מושווים
  currency_changed: { icon: '💱', title: 'מטבע של חשבונית השתנה במקור — הלקוח הושהה, לבדוק', tone: 'warn' },
  csv_balance_rose: { icon: '📂', title: 'יתרה של חשבונית עלתה בקובץ — אולי קובץ ישן, לבדוק', tone: 'warn' },
  doc_without_id: { icon: '🧾', title: 'מסמכים בלי מזהה ממערכת החשבוניות — לא נשלחות עליהם תזכורות', tone: 'warn' },
  // critic סבב 49: התראת הסכום החריג (הפעלה 123) הופיעה ככותרת כללית «הודעה מגבי» בטון מידע
  amount_check: { icon: '🔢', title: 'סכום חריג מאוד מהרגיל ללקוח — לבדוק לפני אישור', tone: 'warn' },
  doc_malformed: { icon: '🧾', title: 'מסמכים עם נתון לא תקין — דולגו, ולא נסגרה אף חשבונית', tone: 'warn' },
  // critic 175: DB שוחזר מגיבוי — כל השליחה עצורה עד שבעל העסק מאשר (POST /owner/restore-hold/release)
  restore_hold: { icon: '🛑', title: 'המערכת שוחזרה מגיבוי — השליחה ללקוחות עצורה', tone: 'warn' },
  // מנהל 323: תזכורת מאושרת שלא יוצאת >48 שעות כי הרענון מול מערכת החשבוניות נכשל
  refresh_stuck: { icon: '⏳', title: 'תזכורות מאושרות לא יוצאות — הבדיקה מול מערכת החשבוניות נכשלת', tone: 'warn' },
  plan_missed: { icon: '📅', title: 'תשלום בהסדר לא התקבל — התזכורות חוזרות לאישורכם', tone: 'warn' },
  plan_outside_invoice: { icon: '🧾', title: 'חשבונית מחוץ להסדר הפעיל — אין עליה תזכורות עד סוף ההסדר', tone: 'warn' },
  plan_amount_changed: { icon: '📈', title: 'סכום החשבונית עלה בזמן הסדר פעיל — התוספת לא כלולה בהסדר', tone: 'warn' },
  // critic 176: כשל כתיבה ליומן ההסרות — אחרי שחזור גיבוי ההסרה לא תוחזר
  optout_ledger_failed: { icon: '📒', title: 'הסרה לא נרשמה ביומן הגיבוי — לטיפול טכני', tone: 'warn' },
  sms_undelivered: { icon: '📵', title: 'SMS לא נמסר', tone: 'warn' },
  // q22-04 + critic סבב 192: DSN שלא אומת ⇒ מיילים ללקוח מושהים עד הכרעה (POST /customers/{cid}/email-bounce)
  email_bounce_review: { icon: '📭', title: 'ייתכן שהמייל של לקוח לא תקין — המיילים אליו מושהים, הכריעו', tone: 'warn' },
  credit_review: { icon: '🧾', title: 'זיכוי שלא שויך לחשבונית — לבדיקתך', tone: 'warn' },
  // חיוב דרך אורביט (8.11.2026): חסד / סיום / ביטול — הגוף כולל קישור לחיוב באורביט
  orbit_billing: { icon: '💳', title: 'המנוי לגבי — נדרשת פעולה באורביט', tone: 'warn' },
  // critic סבב 33: הודעות **נכנסות** בלי לקוח — אין להן טיוטה ב«תשובות לקוחות», וזה המקום היחיד שבו הן נראות
  unknown_sender: { icon: '❔', title: 'הודעה ממספר/כתובת לא מוכרים', tone: 'warn' },
  // critic סבב 127: מצוקה/קטין/משפטי/מחלוקת משולח לא משויך — המייל הדחוף מוביל לכאן ⇒ ראשונה ומסומנת
  unknown_sender_urgent: { icon: '🚨', title: 'פנייה דחופה ממספר/כתובת לא מוכרים — לבדיקתך עכשיו', tone: 'warn' },
  // החלטה 5 (18.11.2026): פנייה דחופה מכתובת המשותפת לכמה לקוחות — כרטיס אחד, בלי שיוך אוטומטי, בעל העסק בוחר
  shared_contact_urgent: { icon: '🚨', title: 'פנייה דחופה ממספר/כתובת של כמה לקוחות — לא שויכה, בחרו למי היא שייכת', tone: 'warn' },
  // גבייה סוכן 18.11: «שילמתי» מכתובת משותפת בלי שיוך — כל המקושרים מושהים עד שבעל העסק בוחר
  // מבקר 233: הבטחה מכתובת משותפת בלי שיוך — כל המקושרים מושהים עד שבעל העסק בוחר
  shared_contact_promise: { icon: '👥', title: 'הבטחת תשלום ממספר/כתובת של כמה לקוחות — התזכורות לכולם נעצרו, בחרו מי הבטיח', tone: 'warn' },
  // מבקר 234א: בקשת הסדר מכתובת משותפת בלי שיוך — כל המקושרים מושהים עד שבעל העסק בוחר
  shared_contact_plan_request: { icon: '👥', title: 'בקשת הסדר תשלומים ממספר/כתובת של כמה לקוחות — התזכורות לכולם נעצרו, בחרו מי ביקש', tone: 'warn' },
  shared_contact_paid_claim: { icon: '👥', title: '«שילמתי» ממספר/כתובת של כמה לקוחות — התזכורות לכולם נעצרו, בחרו מי שילם', tone: 'warn' },
  shared_contact_ambiguous: { icon: '👥', title: 'הודעה ממספר/כתובת של כמה לקוחות — לא שויכה, לבדיקתך', tone: 'warn' },
};
/** נכנסות שמוצגות כאן: רק בלי לקוח מזוהה (ללקוח מזוהה יש טיוטה/כרטיס ב«תשובות לקוחות»). */
const INBOUND_ORPHANS = new Set(['unknown_sender', 'unknown_sender_urgent', 'shared_contact_ambiguous', 'shared_contact_urgent', 'shared_contact_paid_claim', 'shared_contact_promise', 'shared_contact_plan_request']);
/** כרטיסי כתובת משותפת עם בחירת לקוח (POST /owner/shared-cards/{id}/assign). */
const SHARED_CARDS = new Set(['shared_contact_urgent', 'shared_contact_paid_claim', 'shared_contact_promise', 'shared_contact_plan_request']);
/** critic סבב 192: כרטיס «בדוק ואשר» — נסגר רק בהכרעה (חסום / החזר מיילים), לא ב«טופל». */
export const BOUNCE_REVIEW = 'email_bounce_review';
const URGENT_ORPHANS = new Set(['unknown_sender_urgent', 'shared_contact_urgent']);

/** החלטה 5: הלקוחות המקושרים מה-payload (id+שם; בעל העסק בוחר — critic סבב 149) — בלי לזרוק על JSON פגום. */
function linkedCustomers(payload?: string | null): { id: number; name: string }[] {
  try {
    return ((JSON.parse(payload ?? '{}').linked_customers ?? []) as { id?: unknown; name?: unknown }[])
      .filter(c => typeof c.id === 'number' && typeof c.name === 'string' && c.name)
      .map(c => ({ id: c.id as number, name: c.name as string }));
  } catch { return []; }
}

/** מנהל 361 (ביקורת 207): כמה תשובות מאושרות (ממתינות לחלון) נעצרו בגלל הפנייה הדחופה מהכתובת המשותפת. */
export function stoppedApprovedLine(payload?: string | null): string {
  let n = 0;
  try { const v = JSON.parse(payload ?? '{}')?.stopped_approved; n = typeof v === 'number' && v > 0 ? Math.floor(v) : 0; } catch { n = 0; }
  if (!n) return '';
  return (n === 1
    ? '⏸ עצרנו תשובה שאישרת קודם ועוד לא יצאה (ממתינה לחלון השליחה) — לא תישלח.'
    : `⏸ עצרנו ${n} תשובות שאישרת קודם ועוד לא יצאו (ממתינות לחלון השליחה) — לא יישלחו.`
  // מנהל 364 (מבקר 209🟡): בשיוך — מה שנעצר ללקוח שלא נבחר חוזר לתור לאישור מחדש (לא נשלח לבד)
  ) + ' בשיוך: תשובות של מי שלא נבחר/ה יחזרו לתור לאישור מחדש.';
}

/** מנהל 364: טוסט אחרי שיוך — כמה תשובות שנעצרו חזרו לתור (POST assign ⇒ requeued_drafts). */
export function requeuedToast(base: string, res: unknown): string {
  const v = (res as { requeued_drafts?: unknown } | null)?.requeued_drafts;
  const n = Array.isArray(v) ? v.length : 0;
  if (!n) return base;
  return `${base} · ${n === 1 ? 'תשובה שנעצרה חזרה' : `${n} תשובות שנעצרו חזרו`} לתור האישורים — לבדוק ולאשר מחדש`;
}

/** מנהל 365: /preview ⇒ shared_warning — קטין/מצוקה/משפטי מכתובת משותפת שבעל העסק שייך ל«אף אחד מהם». */
export interface SharedWarning { card_id: number; urgent: string; channel?: string | null; received_at?: string | null; released_at?: string | null }
const SHARED_WARN_WHO: Record<string, string> = { minor: 'קטין/ה ענה/תה', distress: 'הגיעה הודעת מצוקה', legal: 'הגיעה הודעה על צעד משפטי' };
/** שורת אזהרה לתצוגה המקדימה של תזכורת. null ⇒ אין מה להציג (גם על קלט שאינו בצורה הצפויה). */
export function sharedWarningText(w: unknown): string | null {
  const v = w as Partial<SharedWarning> | null;
  if (!v || typeof v !== 'object' || typeof v.urgent !== 'string' || !(v.urgent in SHARED_WARN_WHO)) return null;
  const via = v.channel === 'email' ? 'מכתובת המייל המשותפת' : 'מהמספר המשותף';
  const d = typeof v.received_at === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v.received_at)
    ? ` ב-${v.received_at.slice(8, 10)}.${v.received_at.slice(5, 7)}` : '';
  return `${SHARED_WARN_WHO[v.urgent]} ${via} ללקוח/ה הזה/זו${d}, ובחרתם «אף אחד מהם». ודאו שהתזכורת לא תגיע אליו/ה לפני שמאשרים.`;
}

/** critic סבב 169: כרטיס ממייל שלא עבר אימות שולח (SPF/DKIM/DMARC) — payload.email_verified === false. */
export const UNVERIFIED_EMAIL_LINE = '⚠️ המייל לא עבר אימות שולח (SPF/DKIM) — ייתכן שלא נשלח ע״י הלקוח. לפני שיוך או «שולם» כדאי לוודא מולו.';
function unverifiedEmail(payload?: string | null): boolean {
  try { return JSON.parse(payload ?? '{}')?.email_verified === false; } catch { return false; }
}

/** מסנן ומתרגם. intent לא מוכר ⇒ מוצג עם כותרת כללית (לא נבלע בשקט). סדר: trial_ending ראשון, ואז החדש ביותר. */
export function systemNotices(rows: OwnerMsg[]): Notice[] {
  return rows
    .filter(r => r.direction === 'system'
      || (r.direction === 'in' && r.customer_id == null && INBOUND_ORPHANS.has(r.intent ?? '')))
    .map(r => {
      const k = KIND[r.intent ?? ''] ?? { icon: 'ℹ️', title: 'הודעה מגבי', tone: 'info' as const };
      const linked = SHARED_CARDS.has(r.intent ?? '') ? linkedCustomers(r.payload) : [];
      const unverified = r.direction === 'in' && unverifiedEmail(r.payload);
      let body = linked.length ? `${r.body}\n\nלקוחות מקושרים: ${linked.map(c => c.name).join(' · ')}` : r.body;
      const stopped = linked.length ? stoppedApprovedLine(r.payload) : '';
      if (stopped) body = `${body}\n\n${stopped}`;
      if (unverified) body = `${UNVERIFIED_EMAIL_LINE}\n\n${body}`;
      return { id: r.id, icon: k.icon, title: k.title, body, tone: k.tone, intent: r.intent ?? '',
        ...(linked.length ? { linked } : {}), ...(unverified ? { unverified: true } : {}),
        ...((r.intent === BOUNCE_REVIEW || r.intent === 'inherited_optout') && r.customer_id != null ? { customerId: r.customer_id } : {}) };
    })
    .sort((a, b) => Number(URGENT_ORPHANS.has(b.intent)) - Number(URGENT_ORPHANS.has(a.intent))
      || Number(b.intent === 'trial_ending') - Number(a.intent === 'trial_ending') || b.id - a.id);
}
