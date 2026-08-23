/**
 * 🕎 מנוע-העיתוי העברי (VISION-LIGHT ‏#37, 23.8.2026, חבילת-הבידול) —
 * הנתינה היהודית חיה על הלוח העברי (אלול · ימים-נוראים · חנוכה · פורים ·
 * פסח), אבל כל מנועי-ה-CRM חושבים בלועזי. המנוע מזהה פר-תורם את **החודש
 * העברי** שבו הוא נוהג לתת (היסטוגרמה חוצת-שנים על קבלות+היסטוריה, דין-אדר
 * דרך adarNorm) — ומרים משימת-"העונה שלו" בדיוק כשהחודש הזה מגיע, אם טרם
 * נתן בו השנה.
 *
 * טהור ודטרמיניסטי: היום מוזרק (todayIso), אפס Date.now, אפס store/DOM.
 * ‏O(סה"כ-אירועי-הנתינה) עם מטמון-תאריכים מקומי-לקריאה (לא מודול-גלובלי —
 * לקח מטמון-hebParts). ‏additive: קריאה-בלבד, אפס שינוי-סכמה.
 */
import type { Supporter } from '../../types/domain';
import { adarNorm, hebPartsOfIso } from '../../lib/hebrew';

/** עונות-הנתינה המוכרות — לתווית-ההקשר שליד החודש. */
export const HEB_SEASONS: Record<string, string> = {
  Elul: '🕯 אלול — חודש הרחמים והסליחות',
  Tishri: '🍯 תשרי — ימים נוראים וסוכות',
  Kislev: '🕎 כסלו — חנוכה',
  Adar: '🎭 אדר — פורים ומתנות לאביונים',
  Nisan: '🌿 ניסן — פסח וקמחא דפסחא',
};

/** שם-תצוגה עברי לחודש (Intl מחזיר שמות-אנגליים). */
export const HEB_MONTH_HE: Record<string, string> = {
  Tishri: 'תשרי', Heshvan: 'חשוון', Kislev: 'כסלו', Tevet: 'טבת', Shevat: 'שבט',
  'Adar I': 'אדר א׳', Adar: 'אדר', Nisan: 'ניסן', Iyar: 'אייר', Sivan: 'סיוון',
  Tamuz: 'תמוז', Av: 'אב', Elul: 'אלול',
};

export interface HebSeasonNow {
  /** שם-החודש האנגלי המנורמל (אדר-ב׳⇒אדר). */
  monthEn: string;
  /** שם-החודש בעברית. */
  monthHe: string;
  /** השנה העברית. */
  hebYear: number;
  /** תווית-עונה מוכרת, אם החודש הוא עונת-נתינה. */
  season: string | null;
}

export function hebSeasonOf(todayIso: string): HebSeasonNow {
  const p = hebPartsOfIso(todayIso);
  const monthEn = adarNorm(p.month);
  return {
    monthEn,
    monthHe: HEB_MONTH_HE[monthEn] ?? monthEn,
    hebYear: p.year,
    season: HEB_SEASONS[monthEn] ?? null,
  };
}

export interface HebTimingTask {
  supId: string;
  name: string;
  phone: string;
  /** כמה פעמים נתן בחודש-העברי הזה בשנים קודמות. */
  timesInMonth: number;
  /** "נותן בד״כ באלול (3 שנים) — העונה שלו עכשיו". */
  reason: string;
}

/** אירועי-הנתינה של תורם: קבלות + היסטוריית-סליקה (סכום>0, נדחו לא נספרים). */
function giftDates(sp: Supporter): string[] {
  const out: string[] = [];
  for (const d of sp.donations) if (d.amount > 0) out.push(d.date);
  for (const h of sp.hist ?? []) if (h.a > 0 && !/נדח|decline|error/i.test(h.status ?? '')) out.push(h.d);
  return out;
}

/**
 * המשימות-העונתיות של היום: תורמים שנתנו בחודש-העברי-הנוכחי ב-2+ שנים
 * עבריות שונות — וטרם נתנו בו השנה. ממויין לפי חוזק-ההרגל.
 */
export function hebTimingTasks(supporters: readonly Supporter[], todayIso: string, cap = 40): HebTimingTask[] {
  const now = hebSeasonOf(todayIso);
  // מטמון פר-קריאה: תאריכי-נתינה חוזרים על עצמם (יום-חיוב-הו"ק) — Intl יקר
  const cache = new Map<string, { m: string; y: number }>();
  const partsOf = (iso: string) => {
    const hit = cache.get(iso);
    if (hit) return hit;
    const p = hebPartsOfIso(iso);
    const v = { m: adarNorm(p.month), y: p.year };
    cache.set(iso, v);
    return v;
  };

  const tasks: HebTimingTask[] = [];
  for (const sp of supporters) {
    const yearsInMonth = new Set<number>();
    let gaveThisYear = false;
    for (const iso of giftDates(sp)) {
      if (!iso || iso.length < 10) continue;
      const p = partsOf(iso);
      if (p.m !== now.monthEn) continue;
      if (p.y === now.hebYear) gaveThisYear = true;
      else yearsInMonth.add(p.y);
    }
    if (gaveThisYear || yearsInMonth.size < 2) continue;
    tasks.push({
      supId: sp.id,
      name: sp.name,
      phone: sp.phone,
      timesInMonth: yearsInMonth.size,
      reason: 'נותן בד"כ ב' + now.monthHe + ' (' + yearsInMonth.size + ' שנים) — העונה שלו עכשיו, טרם נתן השנה',
    });
  }
  tasks.sort((a, b) => b.timesInMonth - a.timesInMonth || a.name.localeCompare(b.name, 'he'));
  return tasks.slice(0, cap);
}
