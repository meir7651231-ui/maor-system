/**
 * 📒 פרנסה׳לע — לוח הבקשות של המקור (עיצוב 5, renderReq/relatedFor/reqMatch), הליבה הטהורה: "מי עוד יכול לעזור לך"
 * (טבלת-האירועים OCC — בר מצווה, חתונה, ברית ולידה, מעבר דירה, שיפוץ, תקלה בבית, לימודים, שבת וחג, אבלות),
 * "באלפון יש N בעלי מקצוע ב…", הסינון (פתוחות · הצעות עבודה · הכול), המיון (משרה מקודמת ← דחוף ← חדש) והקבוצות
 * (דחוף · פתוחות · נמצאו), ושורת-התאריך "יום ג׳ · ב׳ חשוון". בלי store/DOM; "עכשיו" מוזרק.
 */
import type { PrListing, PrRequest } from '../../types/domain';
import { isPromotedJob, isUrgent } from './lib';
import { clockAt, hebDayMonth } from './zmanimBoard';

/** גבול-מילה עברי (‏\b של המקור לא פועל על אותיות עבריות — אותו תיקון כמו sensitiveTopic). */
const HE_END = '(?![א-ת])';

export interface PnOccasion {
  /** שם-האירוע ("בר מצווה"). */
  k: string;
  re: RegExp;
  /** מה עוד צריך: [תווית, ביטוי שמזהה עסק מתאים]. */
  need: ReadonlyArray<readonly [string, RegExp]>;
}

/** OCC של המקור (נספח A17), מילה-במילה; פאות — גבול-מילה עברי. */
export const PN_OCCASIONS: readonly PnOccasion[] = [
  {
    k: 'בר מצווה',
    re: /בר[ -]?מצו?וה|הנחת תפילין/,
    need: [['צלם', /צל(ם|ום)|וידאו/], ['קייטרינג', /קייטרינג|מגשי/], ['אולם', /אולם/], ['תפילין', /תפילין|סת["״]ם/], ['מלמד לדרשה', /מלמד|דרשה/], ['חליפה וכובע', /חליפ|חייט|כובע/], ['עוגות ומגשים', /עוג|מאפ|חלות/], ['תזמורת', /תזמורת|זמר|מוזיק|נגן/], ['הסעות', /הסע|אוטובוס|מיניבוס/], ['הזמנות', /הזמנ|דפוס|גרפי/]],
  },
  {
    k: 'חתונה',
    re: /חתונה|חתן|כלה|אירוסין|ווארט|וורט|תנאים|שבע ברכות|שידוך/,
    need: [['אולם', /אולם/], ['קייטרינג', /קייטרינג|מגשי/], ['צלם', /צל(ם|ום)|וידאו/], ['תזמורת', /תזמורת|זמר|מוזיק/], ['פאות', new RegExp('פא(ה|ות)' + HE_END + '|פאנית')], ['שמלה', /שמל|תפיר|אופנ/], ['תכשיטים', /תכשיט|צורף|שעונ/], ['תפילין', /תפילין|סת["״]ם/], ['דירה', /תיווך|נדל|דירות להשכרה/], ['הובלה', /הובל/], ['ריהוט ושיפוץ', /שיפוץ|ריהוט|נגר/], ['הזמנות', /הזמנ|דפוס|גרפי/]],
  },
  {
    k: 'ברית ולידה',
    re: /ברית|לידה|נולד|שלום זכר|קידוש לבת|יולדת|תינוק|פדיון הבן/,
    need: [['מוהל', /מוהל/], ['קייטרינג', /קייטרינג|מגשי/], ['צלם', /צל(ם|ום)/], ['עוגות ומגשים', /עוג|מאפ|חלות/], ['ארוחות ליולדת', /ארוח|משלוח|אוכל/], ['ניקיון ועזרה בבית', /ניקיון|עוזרת/], ['ציוד לתינוק', /תינוק|עגל|לול/]],
  },
  {
    k: 'מעבר דירה',
    re: /מעבר דירה|לעבור דירה|עוברים דירה|דירה חדשה|הובל|מקרר|מכונת כביסה/,
    need: [['הובלה', /הובל/], ['ניקיון', /ניקיון/], ['שיפוצים', /שיפוץ|טיח|ריצוף|צבע/], ['חשמלאי', /חשמל/], ['אינסטלטור', /אינסטל|נזיל|סתימ/], ['מזגנים', /מזגן|מיזוג/], ['מזוזות', /מזוז|סת["״]ם/], ['תיווך', /תיווך|נדל/]],
  },
  {
    k: 'שיפוץ',
    re: /שיפוץ|ריצוף|טיח|מטבח חדש|בנייה|הרחבה|צביעה/,
    need: [['חשמלאי', /חשמל/], ['אינסטלטור', /אינסטל|נזיל|סתימ/], ['מזגנים', /מזגן|מיזוג/], ['ניקיון אחרי שיפוץ', /ניקיון/], ['הובלה ופינוי', /הובל/], ['מזוזות', /מזוז|סת["״]ם/]],
  },
  {
    k: 'תקלה בבית',
    re: /נזיל|סתימ|דוד|צנרת|אינסטל|קצר|חשמל|מזגן/,
    need: [['אינסטלטור', /אינסטל|נזיל|סתימ/], ['חשמלאי', /חשמל/], ['מזגנים', /מזגן|מיזוג/], ['שיפוצים (תיקון אחרי)', /שיפוץ|טיח|ריצוף/], ['ניקיון', /ניקיון/]],
  },
  {
    k: 'לימודים',
    re: /מלמד|שיעור|גמרא|משניות|מבחן|חיזוק|חברותא|ישיבה|תלמוד תורה/,
    need: [['מלמד', /מלמד|שיעור|גמרא/], ['ספרים', /ספר|יודאיק/], ['הסעות', /הסע|מיניבוס/], ['אבחון וליווי', /אבחון|ייעוץ|טיפול/]],
  },
  {
    k: 'שבת וחג',
    re: /שבת|פסח|סוכות|סוכה|חנוכה|פורים|משלוח מנות|ראש השנה|יום טוב/,
    need: [['חלות ועוגות', /חלות|עוג|מאפ/], ['קייטרינג', /קייטרינג|מגשי/], ['ניקיון', /ניקיון/], ['סוכות וסכך', /סוכ|סכך/], ['יודאיקה', /יודאיק|סת["״]ם|ספר/], ['משלוחים', /משלוח/]],
  },
  {
    k: 'אבלות',
    re: /שבעה|אבל|לוויה|נפטר|יארצייט|יאָרצייט|מצבה|קדיש/,
    need: [['אוכל לבית האבל', /קייטרינג|ארוח|משלוח|אוכל/], ['הסעות', /הסע|מיניבוס/], ['מצבה', /מצב/], ['אומרים קדיש ומשניות', /מלמד|שיעור|משניות/], ['ניקיון', /ניקיון/]],
  },
];

/** הטקסט שמזהים בו עסק (entText במקור; לפורט אין תגיות — שמות-השירותים ומשפט-המפתח במקומן). */
function entText(l: PrListing): string {
  return [l.title, l.name, l.desc, l.tagline ?? '', ...(Array.isArray(l.services) ? l.services.map((s) => s.name) : [])].join(' ');
}

export interface PnRelated {
  k: string;
  items: Array<{ l: string; who: PrListing[] }>;
}

/** "מי עוד יכול לעזור לך" (relatedFor): האירוע שבטקסט ⇒ מה עוד צריך בדרך כלל, עם עד 2 עסקים מאושרים לכל צורך. */
export function relatedFor(text: string, listings: readonly PrListing[]): PnRelated | null {
  const t = String(text ?? '');
  const o = PN_OCCASIONS.find((x) => x.re.test(t));
  if (!o) return null;
  const all = listings.filter((l) => l.status === 'approved');
  const used = new Set<string>();
  const out: PnRelated['items'] = [];
  for (const [l, re] of o.need) {
    if (re.test(t)) continue; // כבר מבקשים את זה
    const who = all.filter((e) => !used.has(e.id) && re.test(entText(e))).slice(0, 2);
    who.forEach((e) => used.add(e.id));
    out.push({ l, who });
  }
  if (!out.length) return null;
  return { k: o.k, items: out.sort((a, b) => (b.who.length ? 1 : 0) - (a.who.length ? 1 : 0)).slice(0, 7) };
}

/** "באלפון יש N בעלי מקצוע ב…" (reqMatch) — המאושרים בשער. */
export function matchCount(cat: string, listings: readonly PrListing[]): number {
  return cat ? listings.filter((l) => l.status === 'approved' && l.category === cat).length : 0;
}

export type PnReqFilter = 'open' | 'jobs' | 'all';
export type PnReqGroup = 'urg' | 'open' | 'done';

/** כותרות-הקבוצות (GL במקור). */
export const PN_REQ_GROUPS: Readonly<Record<PnReqGroup, readonly [string, string]>> = {
  urg: ['דחוף', 'צריך היום'],
  open: ['פתוחות', 'מחכות למישהו שיכיר'],
  done: ['נמצאו', 'הקהילה עזרה'],
};

export function reqGroupOf(r: PrRequest, nowMs: number): PnReqGroup {
  return r.status === 'closed' ? 'done' : isUrgent(r, nowMs) ? 'urg' : 'open';
}

/**
 * הרשימה בלוח (renderReq): הסינון, ואז משרה מקודמת ← דחוף ← החדשה ראשונה; מחוץ ל"הצעות עבודה" — מקובץ
 * לפי דחוף · פתוחות · נמצאו (המיון יציב).
 */
export function boardRequests(requests: readonly PrRequest[], filter: PnReqFilter, nowMs: number): PrRequest[] {
  const rs =
    filter === 'open' ? requests.filter((r) => r.status !== 'closed') : filter === 'jobs' ? requests.filter((r) => r.job && r.status !== 'closed') : requests.slice();
  const t = (r: PrRequest): number => {
    const x = Date.parse(r.createdAt);
    return Number.isFinite(x) ? x : 0;
  };
  rs.sort(
    (a, b) =>
      Number(isPromotedJob(b)) - Number(isPromotedJob(a)) || Number(isUrgent(b, nowMs)) - Number(isUrgent(a, nowMs)) || t(b) - t(a) || a.id.localeCompare(b.id),
  );
  if (filter === 'jobs') return rs;
  const order: PnReqGroup[] = ['urg', 'open', 'done'];
  return rs.sort((a, b) => order.indexOf(reqGroupOf(a, nowMs)) - order.indexOf(reqGroupOf(b, nowMs)));
}

const WD = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'שבת'] as const;

/** "יום ג׳ · ב׳ חשוון" (rdate במקור) — באזור-הזמן של הקהילה. */
export function reqDateText(createdAt: string, tz: string): string {
  const ms = Date.parse(String(createdAt ?? ''));
  if (!Number.isFinite(ms)) return '';
  const c = clockAt(ms, tz);
  const h = hebDayMonth(c.iso, tz);
  return 'יום ' + WD[c.dow] + (h ? ' · ' + h : '');
}
