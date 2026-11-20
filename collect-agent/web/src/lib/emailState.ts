// גבי עיצוב: מצב כתובת המייל של הלקוח בטבלת החובות (מ-/dashboard → email_state). טהור — נבדק ב-tests.
//  bounced = bounce קבוע (הכתובת לא קיימת) ⇒ גבי לא שולחת אליה מייל; SMS ממשיך. תיקון: כתובת נכונה במקור
//            (מערכת החשבוניות / קובץ CSV) ⇒ כתובת חדשה ⇒ גבי חוזרת לשלוח למייל.
//  spam    = הלקוח סימן את המייל כספאם ⇒ סירוב לפי סעיף 30א ⇒ אסור לשלוח שוב לכתובת הזו. אם הכתובת שייכת
//            לאדם אחר (טעות במקור) — מתקנים במקור, ואז זו כתובת אחרת.
export type EmailState = 'bounced' | 'spam';
export interface EmailStateView { state: EmailState; title: string; body: string; action: { text: string; href: string } }

export function emailStateView(state: string | null | undefined, source: 'api' | 'csv' | undefined): EmailStateView | null {
  if (state !== 'bounced' && state !== 'spam') return null;
  const csv = source === 'csv';
  const fix = csv ? 'עדכנו את הכתובת בקובץ ה-CSV וייבאו אותו שוב' : 'תקנו את הכתובת במערכת החשבוניות — השינוי ייקלט בסנכרון הבא';
  const action = { text: csv ? 'ייבוא קובץ מעודכן ←' : 'לתיקון ←', href: '#/settings' };
  return state === 'bounced'
    ? { state, title: '📧 כתובת המייל לא פעילה (המייל חזר)', body: `גבי לא שולחת אליה מייל; SMS ממשיך. ${fix}.`, action }
    : { state, title: '🚫 הלקוח סימן את המייל כספאם', body: `לפי החוק לא שולחים עוד מייל לכתובת הזו; SMS ממשיך. אם הכתובת שייכת לאדם אחר — ${fix}.`, action };
}
