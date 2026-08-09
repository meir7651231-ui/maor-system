/**
 * ratchet — בקשת-בעלים 9.8: תמונה-חיצונית בחוגים + מורה מכרטיס-החוג.
 * 1. תמונת-חוג: הדבקת URL חיצוני (https בלבד — safeHttpsUrl בשמירה; dataURL
 *    מהעלאה נשמר כמות-שהוא) + התמונה מוצגת גם בכרטיסי לוח-החוגים (gradeimg).
 * 2. TeacherPickModal בכרטיס-החוג: בחירת מורה קיים/ת או יצירה מהירה ושיוך —
 *    אותם ברירות-מחדל של היצירה-inline בטופס (formatIsraeliPhone, nextId('t')).
 */
import { describe, expect, it } from 'vitest';
import formSrc from '../CourseForm.tsx?raw';
import viewSrc from '../CoursesView.tsx?raw';
import detailSrc from '../CourseDetail.tsx?raw';

describe('🎨 ratchet — תמונה-חיצונית בחוגים', () => {
  it('URL חיצוני מחוטא ל-https בשמירה; dataURL מהעלאה לא נגוע', () => {
    expect(formSrc).toContain("img: f.img.startsWith('data:') ? f.img : (safeHttpsUrl(f.img) ?? '')");
    expect(formSrc).toContain('או הדביקו כתובת-תמונה מהאינטרנט');
    // ההעלאה-המכווצת נשארה (פיצ'ר-הגלריה) — הוספנו, לא החלפנו
    expect(formSrc).toContain('pickAndCompressImage');
  });

  it('לוח-החוגים מציג את התמונה בכרטיס-גריד (אותו דגל gradeimg); בלי תמונה — האות הצבעונית', () => {
    expect(viewSrc).toMatch(/gradeimgOn && c\.img \?[\s\S]{0,200}objectFit: 'cover'/);
    expect(viewSrc).toContain('{c.name[0]}'); // ה-fallback לא נמחק
  });
});

describe('👩‍🏫 ratchet — מורה מכרטיס-החוג', () => {
  it('TeacherPickModal: קיים-או-חדש, שיוך מיידי, טלפון מפורמט', () => {
    expect(detailSrc).toContain('function TeacherPickModal');
    expect(detailSrc).toContain("value: '__new', label: '➕ הוספת '");
    expect(detailSrc).toContain('upsertCourse({ ...props.course, teacherId })');
    expect(detailSrc).toContain('formatIsraeliPhone(phone.trim())');
    // דדופ-לפי-שם — שם קיים משתייך במקום להיווצר שוב (כמו בטופס)
    expect(detailSrc).toMatch(/db\.teachers\.find\(\(t\) => t\.name === tn\)/);
  });
});
