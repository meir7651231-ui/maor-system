/**
 * 🔔 הודעת-בעלים על הרשמה/ליד (22.10.2026 — "ברגע שאדם נרשם אני מקבל הודעה
 * בוואטסאפ וגם באתר"). טהור: בלי store/DOM/Firebase.
 *
 * וואטסאפ = **הודעה רגילה מהוואטסאפ של הנרשם** (הכרעת-בעלים: "כמו מה שיש
 * במאור") — קישור wa.me ממולא למספר-הבעלים, דרך `waLink` הקיים. אפס API/שרת:
 * הנרשם לוחץ "שלחו לנו בוואטסאפ" במסך-ההצלחה וההודעה יוצאת מהמכשיר שלו.
 * בלי מספר-בעלים מוגדר ⇒ null ⇒ אין כפתור (ביט-זהה להיום).
 *
 * גם: קריאת פרמטרי-החנות (`?signup=1&v=<תחום>&picks=<מזהים>`) וספירת "חדשים
 * מאז שנצפה" להתראה החיה בלוח-הבקרה.
 */
import { waLink } from './wa';
import { industryLabel, sizeLabel, needLabel } from './signupWizard';

/** מספר-הוואטסאפ של בעלי-הפלטפורמה (הכרעת-בעלים 22.10). ניתן לדריסה ב-build דרך VITE_ORBIT_WHATSAPP. */
export const ORBIT_OWNER_WHATSAPP = '055-5043749';

export function ownerWhatsapp(): string {
  try {
    const v = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_ORBIT_WHATSAPP;
    return (v || '').trim() || ORBIT_OWNER_WHATSAPP;
  } catch {
    return ORBIT_OWNER_WHATSAPP;
  }
}

/** הקשר-החנות שהגיע ב-URL — נשמר בבקשה כדי שהבעלים יידע מאיפה הגיע ומה בחר. */
export interface StoreRef {
  vertical?: string;
  picks?: string[];
}

const MAX_PICKS = 30;
const SAFE_ID = /^[A-Za-z0-9_-]{1,40}$/;

/** `?signup=1&v=shop&picks=12,34` ⇒ {vertical:'shop', picks:['12','34']}. בלי signup=1 ⇒ null. מזהים לא-בטוחים נזרקים. */
export function parseStoreParams(search: string): StoreRef | null {
  let p: URLSearchParams;
  try {
    p = new URLSearchParams(search);
  } catch {
    return null;
  }
  if (p.get('signup') !== '1') return null;
  const ref: StoreRef = {};
  const v = (p.get('v') || '').trim();
  if (SAFE_ID.test(v)) ref.vertical = v;
  const picks = (p.get('picks') || '')
    .split(',')
    .map((x) => x.trim())
    .filter((x) => SAFE_ID.test(x));
  if (picks.length) ref.picks = [...new Set(picks)].slice(0, MAX_PICKS);
  return ref;
}

export interface SignupSummary {
  orgName: string;
  contactName: string;
  phone: string;
  email: string;
  industry?: string;
  size?: string;
  needs?: string[];
  store?: StoreRef | null;
}

/** נוסח ההודעה לבעלים אחרי הרשמה. */
export function signupOwnerText(s: SignupSummary): string {
  const lines = [
    'שלום, נרשמתי עכשיו לאורביט 🪐',
    'ארגון: ' + s.orgName.trim(),
    'שם: ' + s.contactName.trim(),
    'טלפון: ' + s.phone.trim(),
    'אימייל: ' + s.email.trim(),
  ];
  if (s.industry) lines.push('תחום: ' + industryLabel(s.industry));
  if (s.size) lines.push('גודל: ' + sizeLabel(s.size));
  if (s.needs && s.needs.length) lines.push('חשוב לנו: ' + s.needs.map(needLabel).join(', '));
  if (s.store?.picks?.length) lines.push('נבחר בחנות: ' + s.store.picks.join(', '));
  lines.push('אשמח שתאשרו ותחזרו אליי.');
  return lines.join('\n');
}

export interface LeadSummary {
  contactName: string;
  phone: string;
  preferredTime?: string;
  notes?: string;
}

/** נוסח ההודעה לבעלים אחרי "נחזור אליכם". */
export function leadOwnerText(l: LeadSummary): string {
  const lines = ['שלום, השארתי פרטים באורביט 📞', 'שם: ' + l.contactName.trim(), 'טלפון: ' + l.phone.trim()];
  if (l.preferredTime) lines.push('נוח לי: ב' + l.preferredTime);
  if (l.notes && l.notes.trim()) lines.push('הודעה: ' + l.notes.trim());
  return lines.join('\n');
}

/**
 * הודעת-הליד + הקשר-החנות בשורה אחת — platformLeads מוגבל ב-Rules ל-5 שדות
 * ו-notes ≤500 תווים, לכן ההקשר נכנס לטקסט (לא שדה חדש) ונחתך בבטחה.
 */
export function leadNotesWithStore(notes: string, store: StoreRef | null): string {
  const base = notes.trim();
  const parts: string[] = [];
  if (store?.vertical) parts.push('תחום: ' + industryLabel(store.vertical));
  if (store?.picks?.length) parts.push('נבחר: ' + store.picks.join(','));
  const ctx = parts.length ? '🛒 מהחנות · ' + parts.join(' · ') : '';
  return [base, ctx].filter(Boolean).join('\n').slice(0, 500);
}

/** קישור wa.me למספר-הבעלים עם ההודעה; בלי מספר תקין ⇒ null. */
export function ownerWaLink(text: string, ownerPhone: string = ownerWhatsapp()): string | null {
  return ownerPhone ? waLink(ownerPhone, text) : null;
}

/** כמה פריטים חדשים מאז הצפייה האחרונה (`at` ISO). seen ריק ⇒ הכול חדש. */
export function countNewSince(items: Array<{ at?: string }>, seenAt: string): number {
  return items.filter((x) => !!x.at && (!seenAt || x.at > seenAt)).length;
}

/** חותמת ה-`at` המאוחרת ביותר (לסימון "נצפה"). */
export function latestAt(items: Array<{ at?: string }>): string {
  return items.reduce((m, x) => (x.at && x.at > m ? x.at : m), '');
}
