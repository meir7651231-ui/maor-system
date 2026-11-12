/**
 * ייבוא משפחות 13 עמודות (P0.5, feature settings.import.families13) — טהור בלבד.
 *
 * ratchet — מקור האמת legacy-main-script.js:944-960 (processImport, ענף המשפחות):
 * מיפוי עמודות קבוע: 0=שם · 1=ת"ז אב · 2=טלפון · 3=שם האם · 4=ת"ז אם · 5=טלפון2 ·
 * 6=עיר · 7+8=כתובת (מחוברות ברווח) · 9=רמז אלמן · 10=קהילה · 12=הערות.
 * הניקויים — בדיוק כמו בלגאסי:
 * - שורת "שם פרטי שם משפחה" (כותרת משנה) מדולגת (legacy:945)
 * - "יריד חנוכה תשפ״ו" מוסר מהשם + notes="השתתפה ביריד חנוכה תשפ\"ו" (legacy:947)
 * - '#NAME?' (שגיאת אקסל) מוסר מהשם (legacy:948)
 * - עיר "רגיל" → '' ; "ביתר"/"ביתר עלית" → "ביתר עילית" (legacy:949-950)
 * - סטטוס מהערות: `סטטוס: <טקסט>` — "לא פעיל" → inactive (legacy:951-952, 955)
 * - מצב משפחתי: הערת-סטטוס עם "אלמנ" או עמודה 9 עם "אלמן" → 'אלמן/ה';
 *   "גרוש" → 'גרושים'; אחרת 'נשואים' (legacy:957)
 * - טלפונים: '-' → '' (legacy:954) · קהילה ריקה → 'חסידי' (legacy:958)
 * התאמה לקיימות (legacy:960): normName(שם) שווה + (טלפון ריק באחד הצדדים או
 * digits שווים) → עדכון; אחרת חדשה.
 */
import type { Family, FamilyStatus } from '../types/domain';
import { normSearch } from './validate';

/** שדות המשפחה הנקלטים מהקובץ — הצורה של obj בלגאסי (בלי members/docs). */
export interface FamilyImportRow {
  name: string;
  father: '';
  mother: string;
  fatherId: string;
  motherId: string;
  phone: string;
  phone2: string;
  email: '';
  address: string;
  city: string;
  status: FamilyStatus;
  maritalStatus: string;
  language: 'עברית';
  community: string;
  notes: string;
}

export interface FamiliesImportPlan {
  /** משפחות חדשות להוספה. */
  news: FamilyImportRow[];
  /** עדכונים לקיימות — רק שדות לא-ריקים דורסים (כמו בלגאסי). */
  upds: { id: string; obj: FamilyImportRow }[];
}

/** נרמול שם להשוואה — כמו normName במקור. */
function normName(s: string): string {
  return normSearch(s).replace(/\s/g, '');
}

const clean = (x: string | undefined) => (x ?? '').replace(/\s+/g, ' ').trim();
const digits = (x: string) => (x || '').replace(/\D/g, '');

/**
 * פענוח קובץ 13 עמודות — שורה ראשונה נחשבת כותרת ומדולגת (כמו rows.slice(1)
 * בלגאסי). טהור: לא נוגע ב-store, מחזיר תוכנית (חדשות + עדכונים) בלבד.
 */
export function parseFamiliesCsv(rows: string[][], existing: Family[]): FamiliesImportPlan {
  const news: FamilyImportRow[] = [];
  const upds: FamiliesImportPlan['upds'] = [];
  for (const r of rows.slice(1)) {
    let name = clean(r[0]);
    if (!name || name.includes('שם פרטי שם משפחה')) continue;
    let isFair = false;
    if (/יריד חנוכה/.test(name)) {
      isFair = true;
      name = clean(name.replace(/-?\s*יריד חנוכה תשפ..?/g, ''));
    }
    name = clean(name.replace('#NAME?', ''));
    if (!name) continue;
    let city = clean(r[6]);
    if (city === 'רגיל') city = '';
    if (city === 'ביתר' || city === 'ביתר עלית') city = 'ביתר עילית';
    const noteRaw = r[12] || '';
    const stc = clean((noteRaw.match(/סטטוס:\s*([^\n]+)/) || [])[1] || '');
    const obj: FamilyImportRow = {
      name,
      father: '',
      mother: clean(r[3]),
      fatherId: clean(r[1]),
      motherId: clean(r[4]),
      phone: clean(r[2]) === '-' ? '' : clean(r[2]),
      phone2: clean(r[5]) === '-' ? '' : clean(r[5]),
      email: '',
      address: clean([r[7], r[8]].map(clean).filter(Boolean).join(' ')),
      city,
      status: stc.includes('לא פעיל') ? 'inactive' : 'active',
      maritalStatus:
        stc.includes('אלמנ') || (r[9] || '').includes('אלמן')
          ? 'אלמן/ה'
          : stc.includes('גרוש')
            ? 'גרושים'
            : 'נשואים',
      language: 'עברית',
      community: clean(r[10]) || 'חסידי',
      notes: isFair ? 'השתתפה ביריד חנוכה תשפ"ו' : '',
    };
    const ex = existing.find(
      (f) =>
        normName(f.name) === normName(name) &&
        (!digits(obj.phone) || !digits(f.phone) || digits(f.phone) === digits(obj.phone)),
    );
    if (ex) upds.push({ id: ex.id, obj });
    else news.push(obj);
  }
  return { news, upds };
}

/**
 * החלת עדכון על משפחה קיימת — רק ערכים לא-ריקים דורסים (legacy:1005:
 * `if (obj[k]) f[k] = obj[k]`, בדילוג members/docs). טהור ואימוטבילי.
 */
export function mergeFamilyImport(f: Family, obj: FamilyImportRow): Family {
  const out = { ...f };
  for (const k of Object.keys(obj) as (keyof FamilyImportRow)[]) {
    const v = obj[k];
    if (v) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

/**
 * מגדר-ילד מעמודת "מין/מגדר" בייבוא-ילדים (W2-S3, 7.11.2026).
 * 🐛 הזיהוי הישן (`/בת|נק|f|ילדה/i`) לא הכיר את הקיצור הנפוץ באקסלים ישראליים — **"נ"** לבד
 * (ז/נ) ⇒ בריצת-ההקמה כל 153 הבנות נקלטו כבנים, וסינון-השיבוץ החכם הסתיר אותן מחוגי-בנות.
 * הכלל הישן נשמר כמות-שהוא (ביט-זהה לכל קלט שזוהה קודם) + "נ" כתא-שלם (עם ׳/'/./" אופציונלי).
 */
export function kidGenderOf(raw: string): 'f' | 'm' {
  const g = (raw ?? '').trim();
  if (/בת|נק|f|ילדה/i.test(g)) return 'f';
  if (/^נ\s*['׳".]?$/.test(g)) return 'f';
  return 'm';
}

/**
 * מפתח-השוואה לטלפון בייבוא (12.11.2026) — ספרות בלבד, בלי 00/972 ובלי אפסים מובילים.
 * זהה ל-`phoneKey` של זיהוי-המתקשר (ננעל ב-ratchet); מוגדר כאן כדי שהמודול יישאר נטול-תלויות.
 */
export function importPhoneKey(raw: string | undefined): string {
  let d = (raw ?? '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('972')) d = d.slice(3);
  return d.replace(/^0+/, '');
}

/** מפתח-השוואה לת"ז — ספרות בלי אפסים מובילים (אקסל משמיט אותם: 012345678 ⇒ 12345678). */
export function importIdKey(raw: string | undefined): string {
  return (raw ?? '').replace(/\D/g, '').replace(/^0+/, '');
}

/**
 * המשפחות שהטלפון שייך להן — לפי **כל** הטלפונים (ראשי, שני, ונוספים `phones[]`).
 * 🐛 ייבוא-הילדים השווה ספרות-גולמיות ⇒ מספר שאקסל השמיט לו את ה-0 המוביל (501234567),
 * מספר בקידומת 972, או מספר ששמור ב"טלפונים נוספים" — לא הותאמו, והילד נוצר במשפחה כפולה
 * חדשה (או דולג כ"דו-משמעי"). מפתח קצר מ-7 ספרות ⇒ אין התאמה (כמו הסף הקודם).
 */
export function familiesByPhone(fams: readonly Family[], raw: string | undefined): Family[] {
  const key = importPhoneKey(raw);
  if (key.length < 7) return [];
  const hit = (p: string | undefined) => !!p && importPhoneKey(p) === key;
  return fams.filter((f) => hit(f.phone) || hit(f.phone2) || (Array.isArray(f.phones) ? f.phones : []).some((x) => hit(x?.num)));
}

/** המשפחות שת"ז-ההורה שייכת להן (אב/אם) — חסין לאפסים-מובילים שהושמטו. מפתח קצר מ-5 ⇒ אין התאמה. */
export function familiesByParentId(fams: readonly Family[], raw: string | undefined): Family[] {
  const key = importIdKey(raw);
  if (key.length < 5) return [];
  return fams.filter((f) => importIdKey(f.fatherId) === key || importIdKey(f.motherId) === key);
}
