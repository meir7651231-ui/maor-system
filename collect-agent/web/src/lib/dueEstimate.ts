// מועד מוערך (d018a41, גבי חיבורים): במסמך במקור לא היה מועד תשלום ⇒ השרת חישב הנפקה + 30 יום ומסמן due_estimated.
// גלוי בדשבורד, ברשימת הפתוחות ובתצוגת התזכורת, וניתן לתיקון ברשימת הפתוחות (POST /open-list/confirm due:{id}).
// טהור — נבדק ב-tests/lib.check.ts.
export const DUE_ESTIMATED_LABEL = 'מועד מוערך';
export const DUE_ESTIMATED_HELP = 'במסמך לא היה מועד; חושב: הנפקה + 30 יום';

/** תאריך תקין YYYY-MM-DD (תאריך אמיתי בלוח, לא רק בתבנית). */
export function validDue(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

/** גוף ה-due לאישור: רק לחשבוניות שסומנו «עדיין פתוח», שהמועד שלהן שונה ממה שהשרת שלח ותקין. */
export function dueCorrections(stillOpen: number[], edits: Record<number, string>, original: Record<number, string | null>):
  Record<string, string> {
  const out: Record<string, string> = {};
  for (const id of stillOpen) {
    const v = (edits[id] ?? '').trim();
    if (v && v !== (original[id] ?? '') && validDue(v)) out[String(id)] = v;
  }
  return out;
}

/** הודעת 409 מהשרת מציינת מזהה פנימי («חשבונית 13») ⇒ מציגים את מספר החשבונית שבעל העסק מכיר («חשבונית 9303»). */
export function humanizeOpenListError(msg: string, items: { id: number; number: string }[]): string {
  return msg.replace(/חשבונית (\d+)/g, (m, id) => {
    const it = items.find(i => i.id === Number(id));
    return it ? `חשבונית ${it.number}` : m;
  });
}
