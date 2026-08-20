/**
 * מנוע הודעה-לכיתה (פאזה 6) — אנשי-הקשר של רוסטר-החוג להודעת-WhatsApp מרוכזת.
 * נגזרת טהורה (אפס-סכמה, אפס-שרת). דדופ לפי-טלפון (משפחה עם 2 ילדים = הודעה אחת).
 */
import type { Db } from '../../types/domain';

export interface ClassContact {
  id: string; // מזהה-השיבוץ הראשון עבור הטלפון (למפתח-React)
  name: string; // שם + משפחה (ואם משפחה כפולה — שם-המשפחה)
  phone: string;
}

/** אנשי-הקשר של החוג — רוסטר פעיל/מוקפא (לא wait/ended), מדודפים לפי-טלפון. */
export function classContacts(db: Db, courseId: string): ClassContact[] {
  const out: ClassContact[] = [];
  const seenPhone = new Set<string>();
  for (const e of db.enrollments) {
    if (e.courseId !== courseId || e.status === 'ended' || e.status === 'wait') continue;
    for (const f of db.families) {
      const m = f.members.find((x) => x.id === e.memberId);
      if (!m) continue;
      const phone = f.phone || m.phone || '';
      if (phone && seenPhone.has(phone)) break; // אותה משפחה — הודעה אחת
      if (phone) seenPhone.add(phone);
      out.push({ id: e.id, name: m.first + ' · ' + f.name, phone });
      break;
    }
  }
  return out;
}

/** נוסח-פתיחה לברירת-מחדל להודעת-כיתה. */
export function defaultClassMessage(courseName: string, orgName: string): string {
  return 'שלום, כאן ' + (orgName || 'העמותה') + ' — הודעה בנוגע ל"' + courseName + '": ';
}

/** רשימת-טלפונים להעתקה (מדולגים ריקים). */
export function classPhonesText(contacts: ClassContact[]): string {
  return contacts.map((c) => c.phone).filter(Boolean).join(', ');
}
