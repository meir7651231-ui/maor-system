/**
 * 📒 פרנסה׳לע — תוויות-תצוגה של המסכים (אשכול 5). טהור, בלי store/DOM. הנוסח מהמקור (מפרט §1.4,
 * §3.9–3.10, נספחים A3/A19) במקום שיש נוסח; "אלפון" ⇒ "מדריך".
 */
import type { PrAdKind, PrAdSlot, PrPostKind, PrPriceKey } from '../../types/domain';

/** סוגי-הודעה בלוח (LU_KIND במקור). */
export const PR_NOTICE_KIND_LABELS: Readonly<Record<string, string>> = {
  simcha: 'מזל טוב',
  avel: 'אבלות',
  shiur: 'שיעורים',
  refuah: 'לרפואה',
  gemach: 'גמ״חים',
  mosad: 'מוסדות',
  lost: 'אבידות',
  kiddush: 'קידושא',
  sale: 'מכירה',
};

export const PR_NOTICE_KIND_ICONS: Readonly<Record<string, string>> = {
  simcha: '🎉',
  avel: '🕯',
  shiur: '📖',
  refuah: '🙏',
  gemach: '🤝',
  mosad: '🏫',
  lost: '🔎',
  kiddush: '🍷',
  sale: '🏷',
};

/** "מי בקהילה יכול לעזור" — צ'יפים שמחפשים במדריך (LU_HELP במקור). */
export const PR_NOTICE_HELP: Readonly<Record<string, { title: string; chips: readonly string[] }>> = {
  simcha: { title: 'מי בקהילה יכול לעזור לשמחה', chips: ['קייטרינג', 'עוגות ומגשים', 'צלם', 'תזמורת'] },
  kiddush: { title: 'מי בקהילה יכול לעזור לשמחה', chips: ['קייטרינג', 'יין וקידוש', 'צלם'] },
  avel: { title: 'הקהילה עוזרת לבית האבל', chips: ['אוכל לבית האבל', 'כיסאות לשבעה', 'הסעות ללוויה'] },
};

export const PR_POST_KIND_LABELS: Readonly<Record<PrPostKind, string>> = {
  notice: '📌 מודעה בלוח',
  minyan: '🕍 בית כנסת ומניינים',
  event: '🗓 אירוע בקהילה',
  emergency: '🚑 מספר חירום',
};

/** שמות-תפילה מוצעים לטופס-המניין. */
export const PR_PRAYERS: readonly string[] = ['שחרית', 'מנחה', 'מעריב'];

/** מחירון (PRICE_LBL במקור; 'board' = שורת-החסות בלוח). */
export const PR_PRICE_LABELS: ReadonlyArray<readonly [PrPriceKey, string, string]> = [
  ['featured', 'כרטיס מודגש', 'לחודש'],
  ['sponsor', 'חסות על שער', 'לחודש'],
  ['board', 'חסות על דף הבית', 'לחודש'],
  ['dedication', 'הקדשה בראש האלפון', 'לחודש'],
  ['job', 'משרה מקודמת', 'לפרסום'],
  ['full', 'מודעה בחוברת: עמוד שלם', 'לחוברת'],
  ['half', 'מודעה בחוברת: חצי עמוד', 'לחוברת'],
  ['small', 'מודעה בחוברת: מודעה קטנה', 'לחוברת'],
];

export const PR_AD_SLOT_LABELS: Readonly<Record<PrAdSlot, string>> = {
  booklet: '📖 מודעה בחוברת',
  category: '👑 חסות על שער',
  board: '📌 שורת חסות בלוח',
};

export const PR_AD_KIND_LABELS: Readonly<Record<PrAdKind, string>> = {
  full: 'עמוד שלם',
  half: 'חצי עמוד',
  small: 'מודעה קטנה',
  line: 'שורה',
};

/** אותיות-הימים לטפסים (0=ראשון … 6=מוצאי-שבת — שבת עצמה סגורה במנוע). */
export const PR_DOW_LETTERS: readonly string[] = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'מוצ״ש'];

/** מחיר-טקסט לתצוגה (המקור): "150" ⇒ "150 ₪" · "מ300" ⇒ "מ־300 ₪" · אחר ⇒ כמות-שהוא. */
export function priceText(p: string): string {
  const t = String(p ?? '').trim();
  if (/^\d[\d,.]*$/.test(t)) return t + ' ₪';
  const m = /^מ[־-]?\s*(\d[\d,.]*)$/.exec(t);
  if (m) return 'מ־' + m[1] + ' ₪';
  return t;
}

/** "לפני N" קצר מחותמת ISO מול רגע מוזרק. */
export function agoText(iso: string, nowMs: number): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const min = Math.max(0, Math.round((nowMs - t) / 60000));
  if (min < 1) return 'עכשיו';
  if (min < 60) return 'לפני ' + min + ' דק׳';
  const h = Math.floor(min / 60);
  if (h < 24) return h === 1 ? 'לפני שעה' : h === 2 ? 'לפני שעתיים' : 'לפני ' + h + ' שעות';
  const d = Math.floor(h / 24);
  return d === 1 ? 'אתמול' : d === 2 ? 'שלשום' : 'לפני ' + d + ' ימים';
}

/** רבים למונח בנקבה ("בקשה" ⇒ "בקשות", "מודעה" ⇒ "מודעות"); מונח אחר — כמות-שהוא. */
export function pluralOf(w: string): string {
  return w.endsWith('ה') ? w.slice(0, -1) + 'ות' : w;
}

/** dd/mm מתאריך ISO. */
export function ddmm(iso: string): string {
  return /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(8, 10) + '/' + iso.slice(5, 7) : '';
}
