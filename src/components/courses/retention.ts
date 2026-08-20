/**
 * מנוע-שימור (גל ה׳ · פאזה 11) — חיזוי-נשירה: רוכב על dropoutRisk הדטרמיניסטי (ops.ts)
 * ומעשיר כל תלמיד-בסיכון בציון-סיכון (0–100) וסיבה קריאה. השכבה הזו טהורה ודטרמיניסטית
 * (בלי store/DOM/Date.now); הצעת-ההתערבות עצמה נכתבת ע"י lib/ai.ts הדורמנטי (מפתח-מקומי).
 */
import type { Enrollment } from '../../types/domain';
import { dropoutRisk } from './ops';
import { payBal } from './lib';

export interface DropoutInsight {
  enrollmentId: string;
  memberId: string;
  courseId: string;
  absences: number;
  /** יתרת-חוב פתוחה (אות-נטישה נוספת). */
  debt: number;
  /** ציון-סיכון 0–100 (גבוה = סיכון-נשירה גבוה). */
  score: number;
  /** סיבה קריאה בעברית. */
  reason: string;
}

/**
 * תלמידים-בסיכון-נשירה מועשרים — מהסיכון-הגבוה לנמוך. ציון: החיסורים הם המנוע
 * (סף minAbs ⇒ 50, וכל חיסור נוסף +12, תקרה 100); חוב-פתוח מוסיף עד +10. דטרמיניסטי.
 */
export function dropoutInsights(enrollments: Enrollment[], minAbs = 3): DropoutInsight[] {
  return dropoutRisk(enrollments, minAbs)
    .map(({ e, absences }) => {
      const debt = payBal(e);
      const base = Math.min(100, 50 + (absences - minAbs) * 12);
      const score = Math.min(100, base + (debt > 0 ? 10 : 0));
      const reasonParts = [absences + ' חיסורים שנצברו'];
      if (debt > 0) reasonParts.push('יתרת-חוב פתוחה ₪' + debt.toLocaleString('he-IL'));
      return {
        enrollmentId: e.id,
        memberId: e.memberId,
        courseId: e.courseId,
        absences,
        debt,
        score,
        reason: reasonParts.join(' · '),
      };
    })
    .sort((a, b) => b.score - a.score);
}

export interface InterventionInput {
  orgName: string;
  childName: string;
  courseName: string;
  absences: number;
}

/** בונה-הפרומפט להצעת-התערבות — טהור ונבדק; הודעת-פנייה חמה להורה (בלי אשמה). */
export function interventionPrompt(inp: InterventionInput): string {
  return [
    'כתוב הודעת-פנייה קצרה (3-5 שורות), חמה ואכפתית, בעברית, מטעם רכז/ת החוגים בארגון "' +
      (inp.orgName || 'הארגון') +
      '"',
    'אל הורה של "' + inp.childName + '", שנעדר/ה לאחרונה מ"' + inp.courseName + '" (' + inp.absences + ' חיסורים).',
    'המטרה: להתעניין בשלום הילד/ה, לשדר שמתגעגעים ושרוצים לעזור לחזור — בלי להאשים, בלי לחץ, בלי לגבות.',
    'להציע בעדינות לחזור למפגש הקרוב או לתאם שיחה. לסיים בברכה חמה.',
    'להחזיר את ההודעה בלבד — בלי הקדמות.',
  ].join('\n');
}
