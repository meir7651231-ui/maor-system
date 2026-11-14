/**
 * התאמת תשלום-נכנס לשיבוץ/כרטיס לפי טלפון — טהור (לילה 14.11.2026).
 *
 * תיקון: מסך "שיוך תשלום-נכנס" בדק רק את phone/phone2 של המשפחה ואת הטלפון-הראשי
 * של התורם ⇒ "טלפונים נוספים" (`phones[]`, בקשת-בעלים 13.10) לא מצאו את המשפחה
 * (אין "📞 טלפון תואם" ואין הצעת-שיבוץ) ולא את התורם בחיפוש-לפי-ספרות.
 */
import type { Family, Member, Supporter } from '../../types/domain';
import { normPhone } from '../../lib/dedup';
import { allFamilyPhones } from '../families/lib';
import { allSupPhones } from './lib';

/** כל הטלפונים (ספרות מנורמלות, ≥7) של תלמיד/ה בשיבוץ: שלו/ה ואז כל טלפוני-המשפחה. */
export function enrollPhoneDigits(m: Pick<Member, 'phone'>, fam: Pick<Family, 'phone' | 'phone2' | 'phones'> | undefined): string[] {
  const raw = [m.phone || '', ...(fam ? allFamilyPhones(fam) : [])];
  return raw.map((x) => normPhone(x)).filter((x) => x.length >= 7);
}

/** האם אחד מטלפוני-התורם (ראשי או נוסף) מכיל את הספרות שהוקלדו. */
export function supPhoneContains(sp: Supporter, qDigits: string): boolean {
  if (qDigits.length < 3) return false;
  return allSupPhones(sp).some((r) => normPhone(r.num).includes(qDigits));
}

/** טלפון-התורם להשוואה מול טלפון-התשלום: אם אחד ממספרי-התורם (ראשי או נוסף) תואם —
 *  הוא המוצג ו-match=true; אחרת הטלפון-הראשי ו-match=false. כך כרטיס שהותאם לפי
 *  מספר-נוסף לא מציג "טלפון לא תואם" מטעה. */
export function supPhoneVsPay(sp: Supporter, payPhone: string | undefined): { num: string; match: boolean } {
  const pd = normPhone(payPhone || '');
  if (pd.length >= 7) {
    const hit = allSupPhones(sp).find((r) => normPhone(r.num) === pd);
    if (hit) return { num: hit.num, match: true };
  }
  return { num: sp.phone || '', match: false };
}
