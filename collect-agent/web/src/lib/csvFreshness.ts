// גבי עיצוב (b050cc8, ממצא חיבורים §3): עסק CSV — הרשימה טרייה רק כמו הקובץ. השרת (/dashboard csv_freshness, אותו
// חישוב כמו סיכום הבוקר) מסמן upload_needed אחרי 24 שעות ⇒ תזכורות על חשבוניות CSV לא ייצאו (ר-4). טהור — נבדק בבדיקות.
export interface CsvFreshness { last_import: string | null; upload_needed: boolean }

/** הטקסט לבאנר, או null כשאין מה להציג (מקור אחר / הקובץ טרי). */
export function csvBannerText(f: CsvFreshness | null | undefined): string | null {
  if (!f || !f.upload_needed) return null;
  if (!f.last_import || !/^\d{4}-\d{2}-\d{2}$/.test(f.last_import))
    return 'עוד לא הועלה קובץ CSV — העלו קובץ חשבוניות פתוחות כדי שגבי תכין את הרשימה של היום';
  const d = f.last_import.split('-').reverse().join('.');
  return `העלו קובץ CSV עדכני — הרשימה של היום מבוססת על ייבוא מ-${d}`;
}
