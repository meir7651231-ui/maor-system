/**
 * מסלול-B · פאזה-1 — שכבת-פיצול תרומות (טהורה, בלי store/DOM/רשת).
 *
 * המטרה (רי-ארכיטקצורה, הכרעת-בעלים 14.8): לאכוף ייעוד-הרשאה פר-עובד בשכבת-הנתונים.
 * המודל-המקומי `Supporter.donations[]` **נשאר מקונן** (אפס שינוי ל-UI/צבירות); הפיצול
 * חי רק בשכבת-הסנכרון — בדחיפה מפרקים תרומות למסמכי-ענן פר-ייעוד, במשיכה מרכיבים חזרה.
 *
 * מפתח-הפיצול = **`purpose`** (מסנן-ההרשאה-פר-עובד, ריק=משותף), **לא** `designation`
 * (תג-אימוץ SHOP9) — הבחנה קריטית שהאטלס חשף.
 *
 * פאזה-1 = טהור בלבד: הפונקציות כאן עדיין לא מחווטות לענן. האינווריאנט העליון —
 * `reassemble(explode(sp))` שקול-פונקציונלית ל-sp (אותה קבוצת-תרומות, אותה צבירה,
 * hist לא-נגוע) — נשמר ב-ratchet לפני כל חיווט (פאזה-2).
 */
import type { Donation, Supporter } from '../types/domain';

/**
 * מפתח-פיצול לתרומה ללא-ייעוד = משותפת (כל עובד מורשה רואה). מקטע-נתיב תקין
 * ל-Firestore (לא ריק). נבחר כך שלא יתנגש בייעוד-אמת (מוקף קווים-תחתונים).
 */
export const SHARED_PURPOSE_KEY = '_shared_';

/** מפתח-הפיצול של תרומה — ה-purpose המחוטא; ריק/רווחים ⇒ משותף. */
export function purposeKeyOf(d: Pick<Donation, 'purpose'>): string {
  const p = (d.purpose ?? '').trim();
  return p || SHARED_PURPOSE_KEY;
}

/**
 * מסמך-תרומה בענן (מסלול-B): התרומה כפי-שהיא + backref לתומך + מפתח-פיצול.
 * `id = rid` (מזהה-הקבלה הייחודי — מקור-האמת של רציפות D-). התרומה נשמרת שלמה
 * (ביט-זהה) תחת `donation`, כך שהרכבה-חזרה משחזרת אותה בדיוק.
 */
export interface DonationDoc {
  id: string;
  supporterId: string;
  pkey: string;
  donation: Donation;
}

/**
 * פירוק תרומות-התומך למסמכי-ענן (טהור). `hist` **אינו** נכלל — הוא לא-קבלה, מקונן,
 * בלי rid/ייעוד, נשאר בתוך מסמך-התומך (אינווריאנט-קדוש). התרומות לא ממוינות כאן —
 * הסדר נקבע בהרכבה-חזרה (דטרמיניסטי, חוצה-מכשירים).
 */
export function explodeSupporter(sp: Supporter): DonationDoc[] {
  return (sp.donations ?? []).map((d) => ({
    id: d.rid,
    supporterId: sp.id,
    pkey: purposeKeyOf(d),
    donation: d,
  }));
}

/**
 * מיון-תרומות דטרמיניסטי: תאריך ואז rid. יציב חוצה-מכשירים (חשוב — מסמכי-ענן
 * נמשכים ללא-סדר) ואינרטי לצרכנים: כל הצבירות/התצוגות ממיינות בעצמן, ו-first/last
 * מחושבים ב-supporterAggregates לפי min/max תאריך (לא לפי מיקום-במערך).
 */
function byDateThenRid(a: Donation, b: Donation): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.rid !== b.rid) return a.rid < b.rid ? -1 : 1;
  return 0;
}

/**
 * הרכבה-חזרה (טהור): התומך-הבסיסי + התרומות ממסמכי-הענן שלו, ממוין דטרמיניסטית.
 * מסננים לפי supporterId (הגנה — מסמך זר לא ייכנס לתומך הלא-נכון). `hist` וכל שאר
 * שדות-הבסיס נשמרים כמו-שהם. אינווריאנט: קבוצת-התרומות והצבירה זהות ל-sp המקורי.
 */
export function reassembleDonations(base: Supporter, docs: DonationDoc[]): Supporter {
  const donations = docs
    .filter((x) => x.supporterId === base.id)
    .map((x) => x.donation)
    .sort(byDateThenRid);
  return { ...base, donations };
}

/** אופרציות-הענן על אוסף-התרומות לפי שינוי בין שתי רשימות-תומכים (טהור). */
export interface DonationCloudDiff {
  /** מסמכי-תרומה חדשים/שהשתנו — לכתיבה (upsert לפי id=rid). */
  sets: DonationDoc[];
  /** rid-ים שהוסרו — למחיקה מהאוסף. */
  deletes: string[];
}

/**
 * diff ברמת-אוסף-התרומות (טהור) — הצד-הדוחף של מסלול-B. בהינתן רשימות-התומכים
 * לפני/אחרי שינוי מקומי, מחשב אילו מסמכי-תרומה להעלות/למחוק. מקביל ל-diffDb אך
 * לאוסף-התרומות-הנפרד. זהות ה-doc = rid (ייחודי-גלובלי, אינווריאנט-קדוש). תרומה
 * שעברה תומך (supporterId שונה) או ששינתה ייעוד (pkey שונה) = set (התוכן שונה).
 */
export function donationPartitionDiff(prev: Supporter[], next: Supporter[]): DonationCloudDiff {
  const index = (list: Supporter[]): Map<string, DonationDoc> => {
    const m = new Map<string, DonationDoc>();
    for (const sp of list) for (const doc of explodeSupporter(sp)) m.set(doc.id, doc);
    return m;
  };
  const prevDocs = index(prev);
  const nextDocs = index(next);
  const sets: DonationDoc[] = [];
  for (const [id, doc] of nextDocs) {
    const before = prevDocs.get(id);
    if (!before || JSON.stringify(before) !== JSON.stringify(doc)) sets.push(doc);
  }
  const deletes: string[] = [];
  for (const id of prevDocs.keys()) if (!nextDocs.has(id)) deletes.push(id);
  return { sets, deletes };
}
