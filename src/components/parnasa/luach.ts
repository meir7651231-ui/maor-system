/**
 * 📒 פרנסה׳לע — "לוח הקהילה" של המקור (עיצוב 5, LU_* / renderLuach), הליבה הטהורה: הדוגמאות כשהלוח ריק (בתי-
 * כנסת, אירועים, מודעות — "(דוגמה)", בדיוק אלה של המקור), קיבוץ המניינים לבית-כנסת ← תפילה ← שעות (עבר / הבא),
 * הספירה למניין הבא ("25 דקות" / "1:40 שעות"), המודעות שעל הלוח (מאושרות ושלא ירדו; ממתינות — רק למאשר), סיבוב-
 * הפתקים ושורת-התחתית. בלי store/DOM; "עכשיו" מוזרק.
 */
import type { IsoDate, PrPost } from '../../types/domain';
import { hmToMin, postActiveOn, sunAngleTime, type PrMinyanTime, type PrZman, type PrZmanimLoc } from './zmanimBoard';
import { pluralOf } from './labels';

/** בתי-הכנסת לדוגמה (LU_EX_SHULS) — כמודעות-מניין מאושרות, כדי שהמנוע יחשב אותן (sh = שקיעה, tz = צאת). */
export const LU_EX_SHULS: readonly PrPost[] = (
  [
    ['lux1', 'בית המדרש הגדול', 'רחוב החסידים 2', { שחרית: ['06:00', '06:45', '07:30', '08:30'], מנחה: ['sh-15', '13:30'], מעריב: ['tz+0', '21:00', '22:30'] }],
    ['lux2', 'שטיבל רבי זושא', 'רחוב רבי זושא 11', { שחרית: ['06:15', '07:00', '09:00'], מנחה: ['sh-12'], מעריב: ['tz+5', '21:45'] }],
    ['lux3', 'קלויז אהל משה', 'שדרות הבעש״ט 30', { שחרית: ['05:45', '07:15'], מנחה: ['sh-20', '14:15'], מעריב: ['tz+0', '20:30', '23:00'] }],
  ] as const
).map(([id, title, place, t]) => ({
  id, kind: 'minyan', title, text: '', place, phone: '', noticeKind: '', prayers: Object.entries(t).map(([prayer, times]) => ({ prayer, times: [...times] })),
  days: [], date: '', time: '', until: '', approved: true, pinned: false, createdAt: '', updatedAt: '',
}));
export const LU_EX_IDS: ReadonlySet<string> = new Set(LU_EX_SHULS.map((s) => s.id));

/** אירועים לדוגמה (LU_EX_EVENTS): d = יום (מילה ראשונה מודגשת), t = כותרת, s = פירוט. */
export const LU_EX_EVENTS: ReadonlyArray<{ d: string; t: string; s: string }> = [
  { d: 'ליל ש״ק', t: 'טיש של הרבי', s: 'בבית המדרש הגדול, אחרי הסעודה' },
  { d: 'מוצ״ש', t: 'מלווה מלכה ושיחה', s: 'קלויז אהל משה · 21:30' },
  { d: 'יום א׳', t: 'שיעור בשו״ע אורח חיים', s: 'כל יום אחרי מעריב הראשון' },
  { d: 'מקווה', t: 'שעות המקווה לגברים', s: 'ערב שבת מ־12:00 עד שעה לפני השקיעה' },
];

/** פתק על הלוח (luNoteHTML) — מודעה אמיתית או דוגמה. */
export interface PnNote {
  id: string;
  /** סוג (simcha/avel/…; '' = כללי). */
  k: string;
  h: string;
  b: string;
  place: string;
  time: string;
  phone: string;
  /** שם לרפואה / שם המוסד (בדוגמאות של המקור בלבד). */
  nm?: string;
  org?: string;
  rot?: number;
  st: 'approved' | 'pending';
  pinned: boolean;
  /** דוגמה (לא נשמרת, בלי פעולות). */
  ex: boolean;
  post?: PrPost;
}

/** מודעות לדוגמה (LU_EX_NOTES) — מילה-במילה. */
export const LU_EX_NOTES: readonly PnNote[] = (
  [
    { k: 'simcha', rot: -2, h: 'לרגל הולדת הבן', b: 'לידידנו ר׳ יואל פריינד וב״ב שיחיו (דוגמה). השלום זכר יתקיים בליל שב״ק בביתם.', place: 'רחוב החסידים 14', time: 'ליל ש״ק אחרי הסעודה' },
    { k: 'avel', rot: 1, h: 'מרת שרה בת ר׳ אברהם ע״ה (דוגמה)', b: 'בצער רב נודיע על פטירת האשה החשובה. הלוויה תצא מבית המדרש הגדול.', place: 'השבעה: רחוב רבי זושא 7', time: 'הלוויה ב־15:00' },
    { k: 'shiur', rot: 2, h: 'שיעור חדש בשולחן ערוך', b: 'הלכות שבת, בעיון ובבהירות. כל יום אחרי מעריב הראשון (דוגמה).', place: 'בית המדרש הגדול', time: 'מתחיל ביום א׳' },
    { k: 'refuah', rot: -1, h: 'נא להתפלל לרפואת', nm: 'ישראל בן שרה (דוגמה)', b: 'בתוך שאר חולי ישראל. תהילים בציבור אחרי שחרית.' },
    { k: 'gemach', rot: 3, h: 'גמ״ח כיסאות ושולחנות', b: 'לשמחות, לשבעה ולסעודות. בלי תשלום, רק להחזיר נקי (דוגמה).', place: 'רחוב הנגר 6' },
    { k: 'mosad', rot: -2, org: 'תלמוד תורה (דוגמה)', h: 'ההרשמה לשנה״ל החדשה נפתחה', b: 'לכיתות מכינה עד ח׳. מקומות מוגבלים. ההרשמה במזכירות.', time: '9:00–13:00' },
    { k: 'lost', rot: 2, h: 'נמצא שטריימל!', b: 'בשמחה באולם ביום רביעי בלילה. מי שזה שלו, שיתאר ויקבל (דוגמה).' },
    { k: 'kiddush', rot: -1, h: 'קידושא רבה', b: 'לרגל שמחת בר המצווה של בננו (דוגמה). כל הקהל מוזמן אחרי מוסף.', place: 'קלויז אהל משה', time: 'ש״ק אחרי מוסף' },
  ] as ReadonlyArray<Partial<PnNote> & { k: string; h: string; b: string }>
).map((n, i) => ({ id: 'lun' + i, place: '', time: '', phone: '', st: 'approved', pinned: false, ex: true, ...n }));

/** פתק ממודעה של הפורט. */
export function noteOf(p: PrPost): PnNote {
  return { id: p.id, k: p.noticeKind || '', h: p.title, b: p.text, place: p.place, time: p.time, phone: p.phone, st: p.approved ? 'approved' : 'pending', pinned: p.pinned, ex: false, post: p };
}

/**
 * המודעות שעל הלוח (luNotices): מאושרות ושלא ירדו; ממתינות שעוד לא עבר תאריכן — רק למאשר/ת. נעוצות ראשונות, אחר כך
 * החדשות. ריק ⇒ הדוגמאות (ex).
 */
export function luachNotes(posts: readonly PrPost[], todayIso: IsoDate, canApprove: boolean): { xs: PnNote[]; ex: boolean } {
  const real = posts
    .filter((p) => p.kind === 'notice' && (postActiveOn(p, todayIso) || (canApprove && !p.approved && (!p.until || p.until >= todayIso))))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || String(b.createdAt).localeCompare(String(a.createdAt)) || a.id.localeCompare(b.id))
    .map(noteOf);
  return real.length ? { xs: real, ex: false } : { xs: LU_EX_NOTES.slice(), ex: true };
}

/** סיבוב-הפתק: מהדוגמה, אחרת ((i·37) mod 7) − 3 מעלות; בתצוגה הגדולה — 0. */
export function noteRot(n: PnNote, i: number, big = false): number {
  return big ? 0 : n.rot ?? ((i * 37) % 7) - 3;
}

export interface PnShulRow {
  id: string;
  shul: string;
  place: string;
  prayers: Array<{ prayer: string; times: Array<{ time: string; past: boolean; next: boolean }> }>;
}

/**
 * המניינים לפי בית-כנסת ← תפילה ← שעות; עבר / הבא (lumn במקור). סדר בתי-הכנסת = סדר ההגדרה (order — מזהי מודעות-
 * המניין כפי שהגבאי הוסיף אותן; S.settings.shuls במקור), ולא סדר המניין הראשון ביום.
 */
export function shulRows(minyanim: readonly PrMinyanTime[], next: PrMinyanTime | null, hhmm: string, order: readonly string[] = []): PnShulRow[] {
  const out: PnShulRow[] = [];
  const by = new Map<string, PnShulRow>();
  for (const m of minyanim) {
    let s = by.get(m.postId);
    if (!s) {
      s = { id: m.postId, shul: m.shul, place: m.place, prayers: [] };
      by.set(m.postId, s);
      out.push(s);
    }
    let p = s.prayers.find((x) => x.prayer === m.prayer);
    if (!p) {
      p = { prayer: m.prayer, times: [] };
      s.prayers.push(p);
    }
    p.times.push({ time: m.time, past: m.time < hhmm, next: next === m });
  }
  const at = (id: string): number => {
    const i = order.indexOf(id);
    return i < 0 ? order.length : i;
  };
  return out.map((s, i) => ({ s, i })).sort((a, b) => at(a.s.id) - at(b.s.id) || a.i - b.i).map((x) => x.s);
}

/** הספירה למניין הבא (luach "in"): פחות משעה — דקות; אחרת "ש:דד" שעות. */
export function minsUntil(time: string, hhmm: string): { n: string; unit: 'דקות' | 'שעות' } {
  const a = hmToMin(time);
  const b = hmToMin(hhmm);
  const m = a === null || b === null ? 0 : Math.max(0, a - b);
  return m < 60 ? { n: String(m), unit: 'דקות' } : { n: Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'), unit: 'שעות' };
}

/** זווית-המשיכיר של המקור (luZmanim: "זמן ציצית ותפילין" — 11.5° לפני הנץ). */
export const LU_MISHEYAKIR_DEG = 11.5;

/**
 * זמני-היום של הלוח: זמני-המנוע (dayZmanim — אותם זמנים של החוברת והקו) + "זמן ציצית ותפילין · משיכיר" אחרי
 * עלות-השחר, כמו 12 הלוחיות של המקור. רק בלוח — הקו והחוברת לא משתנים. בלי זווית (קוטב) ⇒ בלי השורה.
 */
export function luachZmanim(rows: readonly PrZman[], iso: IsoDate, loc: PrZmanimLoc): PrZman[] {
  const out = rows.slice();
  const t = sunAngleTime(iso, loc, LU_MISHEYAKIR_DEG, true, 'ceil');
  if (!t || out.some((r) => r.key === 'misheyakir')) return out;
  const at = out.findIndex((r) => r.key === 'alot');
  out.splice(at + 1, 0, { key: 'misheyakir', label: 'זמן ציצית ותפילין', sub: 'משיכיר', time: t });
  return out;
}

/** שורת-התחתית של המודעות (nbFoot). */
export function noticeFoot(pending: number, canApprove: boolean, gabbai: string, word: string): string {
  return canApprove && pending
    ? (pending === 1 ? word + ' אחת ממתינה' : pending + ' ' + pluralOf(word) + ' ממתינות') + ' לאישור שלך. לחיצה על ' + word + ' פותחת את האישור'
    : 'כל ' + word + ' עוברת אצל ה' + gabbai + ' לפני שהיא נתלית, ויורדת לבד אחרי האירוע.';
}
