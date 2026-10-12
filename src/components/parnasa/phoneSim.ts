/**
 * 📒 פרנסה׳לע — 📞 מצב-הסימולטור של הקו (אשכול 6ב · טהור): מעל מודל-הקו (phoneLine.ts), בלי
 * store/DOM/רשת ובלי שעון-המערכת — "עכשיו" מוזרק. לשונית "📞 הקו" רק מציגה את המצב ומעבירה אליו
 * מקשים ותמלילים; **אין כאן קו חי, אין ספק ואין שיחה** — צומת-חיבור רק מתאר מה היה קורה.
 *
 *   · simPress — מקש אחד דרך phoneStep: **אותה** הליכה כמו walkPhone (מקש לא-חוקי ⇒ הקו חוזר על
 *     הצומת; צומת-הקשה אוסף 3 ספרות ⇒ resolveDialCode ⇒ צומת-אישור; צומת סופי ⇒ הקו לא מקשיב).
 *   · simSay — "אמרו משהו": תמליל ⇒ resolveSpeech ⇒ צומת-אישור או "לא נמצא" — **לעולם לא חיבור**.
 *   · המסלול (ומה הוביל לכל צומת: מקש / 🗣) + התחלה מחדש; תקרת-מסלול.
 *   · phonePreviewMs — הרגע לתצוגת "כך הקו נשמע בשבת / ביום חול" (שעון-הקהילה, מהרגע המוזרק).
 *   · hebrewVoice — קול עברי להשמעה, רק כשקיים במכשיר (אחרת null — הלשונית מציגה הערה, לא שגיאה).
 */
import type { PrListing } from '../../types/domain';
import type { PrSearchCtx } from './lib';
import { phoneStep, resolveSpeech, type PhoneMenu, type PhoneNode } from './phoneLine';
import { addDaysIso, clockAt, hmToMin, makeClosureFn, type PrZmanimLoc } from './zmanimBoard';

/** כמה צעדים לכל היותר נשמרים במסלול (הישנים נשמטים). */
export const PHONE_TRAIL_MAX = 40;

/** צעד במסלול: הצומת, ומה הוביל אליו — '' (התחלה) · מקש ('0'–'9' '*' '#') · '🗣' (תמליל). */
export interface PhoneSimStep {
  node: PhoneNode;
  via: string;
}

export interface PhoneSimState {
  trail: PhoneSimStep[];
  /** ספרות שנאספו בצומת-הקשה (קוד מהחוברת) — עד שלוש. */
  buf: string;
}

/** התחלה: השורש (התפריט הראשי, או הודעת-הסגירה בשבת/יו״ט). */
export function simStart(menu: PhoneMenu): PhoneSimState {
  const root = Object.hasOwn(menu.nodes, menu.root) ? menu.nodes[menu.root] : undefined;
  return { trail: root ? [{ node: root, via: '' }] : [], buf: '' };
}

/** הצומת הנוכחי — הנוסח הטרי מהעץ (העץ נבנה מחדש כל דקה); צומת דינמי (אישור) — כפי שנשמר. */
export function simNode(menu: PhoneMenu, st: PhoneSimState): PhoneNode | null {
  const last = st.trail[st.trail.length - 1];
  if (!last) return null;
  return Object.hasOwn(menu.nodes, last.node.id) ? menu.nodes[last.node.id] : last.node;
}

/** האם הקו מקשיב בצומת (יש מקשים או איסוף-ספרות). צומת סופי — חיבור, סגירת שבת/חג — לא. */
export function simListening(node: PhoneNode | null): boolean {
  return !!node && (node.options.length > 0 || !!node.collect);
}

const advance = (st: PhoneSimState, step: PhoneSimStep, buf: string): PhoneSimState => ({
  trail: [...st.trail, step].slice(-PHONE_TRAIL_MAX),
  buf,
});

/** מקש אחד. תו שאינו מקש-טלפון, או צומת סופי ⇒ המצב לא משתנה. */
export function simPress(menu: PhoneMenu, st: PhoneSimState, key: string): PhoneSimState {
  const node = simNode(menu, st);
  if (!node || !/^[0-9*#]$/.test(key)) return st;
  const r = phoneStep(menu, { node, buf: st.buf }, key);
  if (!r) return st;
  return r.moved ? advance(st, { node: r.node, via: key }, r.buf) : { ...st, buf: r.buf };
}

/**
 * "אמרו משהו" — התמליל עובר את resolveSpeech של המודל: בצומת-דיבור ⇒ צומת-אישור ("שמעתי: … — לאישור
 * הקישו 1") או "לא נמצא"; בצומת שאינו מקבל דיבור ⇒ "כאן אפשר רק להקיש". לעולם לא צומת-חיבור.
 * צומת סופי ⇒ הקו לא מקשיב — המצב לא משתנה.
 */
export function simSay(menu: PhoneMenu, st: PhoneSimState, utterance: string, listings: readonly PrListing[], ctx: PrSearchCtx): PhoneSimState {
  const node = simNode(menu, st);
  if (!simListening(node) || !node) return st;
  return advance(st, { node: resolveSpeech(menu, node.id, utterance, listings, ctx).confirm, via: '🗣' }, '');
}

/** מצב-תצוגה: עכשיו · השבת הקרובה · יום-החול הקרוב. */
export type PhonePreview = 'now' | 'shabbat' | 'weekday';

/**
 * רגע-התצוגה (epoch) מהרגע המוזרק, בשעון-הקהילה: 'now' — כמות-שהוא; 'shabbat' — השבת הקרובה ב-12:00
 * (בשבת עצמה — היום); 'weekday' — היום הקרוב (ממחר) שהקו פתוח בו ב-12:00 — לא שבת ולא יו״ט (עד 14
 * יום; אין ⇒ עכשיו). הסטה בדקות-שעון-קיר: מעבר שעון-קיץ מזיז שעה לכל היותר, ו-12:00±1 נשאר באותו מצב.
 */
export function phonePreviewMs(nowMs: number, loc: PrZmanimLoc, mode: PhonePreview): number {
  if (mode === 'now') return nowMs;
  const c = clockAt(nowMs, loc.tz);
  const min = hmToMin(c.hhmm) ?? 0;
  const noonIn = (days: number): number => nowMs + (days * 1440 + 12 * 60 - min) * 60_000;
  if (mode === 'shabbat') return noonIn((6 - c.dow + 7) % 7);
  const closure = makeClosureFn(loc);
  for (let d = 1; d <= 14; d++) if (!closure(addDaysIso(c.iso, d), '12:00').closed) return noonIn(d);
  return nowMs;
}

/** קול עברי מתוך קולות-המכשיר (he, או iw — הקוד הישן), עדיפות ל-he-IL; אין ⇒ null. */
export function hebrewVoice<T extends { lang: string }>(voices: readonly T[] | null | undefined): T | null {
  const list: readonly T[] = Array.isArray(voices) ? voices : [];
  const he = list.filter((v) => /^(he|iw)(?:[-_]|$)/i.test(String(v?.lang ?? '')));
  return he.find((v) => /^(he|iw)[-_]il$/i.test(v.lang)) ?? he[0] ?? null;
}
