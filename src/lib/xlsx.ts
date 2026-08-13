/**
 * פענוח xlsx מינימלי לרשת-תאים (string[][]) — ל-**ייבוא** בלבד.
 *
 * למה בית-מלאכה ולא ספריית-ענק: קובץ xlsx הוא ‏zip של XML. ה-unzip נעשה ב-`fflate`
 * (כבר תלות בעץ), והתאים שאנחנו קוראים (יצוא-סליקה/רשימת-תורמים) מאוחסנים כ-
 * sharedStrings (מחרוזות) — אז די בקריאת טבלת-המחרוזות + מעבר על התאים. אין צורך
 * בפענוח-סגנונות/תאריכי-סריאל של SheetJS (מאות KB). מספרים/תאריכים שכן מאוחסנים
 * כערך-גולמי מוחזרים כמחרוזתם, ומנוע-הייבוא (parseAnyDate/Number) מטפל בהם — בדיוק
 * כמו ב-CSV. טהור (בלי DOM) ⇒ נבדק ביחידה ב-vitest.
 */
import { strFromU8, unzipSync } from 'fflate';

/** ביטול-escaping של ישויות-XML (חמש התקניות + הפניות-מספריות). */
function unescapeXml(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&'); // אחרון — שלא לפרש &amp;lt; פעמיים
}

/** אינדקס-עמודה 0-בסיס מתוך הפניית-תא ("AB4" → 27). */
export function colRefToIndex(ref: string): number {
  const m = /^([A-Z]+)/.exec(ref);
  if (!m) return 0;
  let n = 0;
  for (const ch of m[1]) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/** טבלת המחרוזות המשותפות: כל `<si>` ⇒ שרשור כל ה-`<t>` שבתוכו (טקסט-עשיר). */
function readSharedStrings(xml: string): string[] {
  const out: string[] = [];
  const siRe = /<si>([\s\S]*?)<\/si>/g;
  let m: RegExpExecArray | null;
  while ((m = siRe.exec(xml))) {
    const tRe = /<t[^>]*>([\s\S]*?)<\/t>/g;
    let t: RegExpExecArray | null;
    let s = '';
    while ((t = tRe.exec(m[1]))) s += t[1];
    out.push(unescapeXml(s));
  }
  return out;
}

/**
 * מפענח את הגיליון הראשון של קובץ xlsx לרשת-תאים דחוסה (שורות × עמודות).
 * תא ריק ⇒ מחרוזת ריקה; שורה מדולגת ב-XML פשוט לא מופיעה (הסדר היחסי נשמר,
 * וזיהוי-הכותרות ב-import סורק את השורות ⇒ אין תלות במספרי-שורה מוחלטים).
 * מחזיר [] כשאין גיליון/מבנה לא-צפוי (נכשל-רך — לעולם לא זורק ל-UI).
 */
export function parseXlsxSheet(bytes: Uint8Array): string[][] {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes);
  } catch {
    return [];
  }
  const shared = files['xl/sharedStrings.xml']
    ? readSharedStrings(strFromU8(files['xl/sharedStrings.xml']))
    : [];
  // הגיליון בעל המספר הנמוך ביותר (sheet1.xml הוא הראשון בפועל בכל היצואים).
  const sheetPath = Object.keys(files)
    .filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))
    .sort()[0];
  if (!sheetPath) return [];
  const xml = strFromU8(files[sheetPath]);
  const rows: string[][] = [];
  const rowRe = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
  let rm: RegExpExecArray | null;
  while ((rm = rowRe.exec(xml))) {
    const cells: string[] = [];
    const cRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let cm: RegExpExecArray | null;
    let auto = 0;
    while ((cm = cRe.exec(rm[1]))) {
      const attrs = cm[1];
      const inner = cm[2] ?? '';
      const refM = /r="([A-Z]+\d+)"/.exec(attrs);
      const idx = refM ? colRefToIndex(refM[1]) : auto;
      const tM = /t="([^"]+)"/.exec(attrs);
      const t = tM ? tM[1] : '';
      let val = '';
      if (t === 'inlineStr') {
        // שרשור כל ה-<t> בתוך <is> (טקסט-עשיר מוטבע)
        const isRe = /<t[^>]*>([\s\S]*?)<\/t>/g;
        let im: RegExpExecArray | null;
        while ((im = isRe.exec(inner))) val += im[1];
        val = unescapeXml(val);
      } else {
        const vM = /<v>([\s\S]*?)<\/v>/.exec(inner);
        const raw = vM ? vM[1] : '';
        val = t === 's' ? (shared[Number(raw)] ?? '') : unescapeXml(raw);
      }
      while (cells.length < idx) cells.push('');
      cells[idx] = val;
      auto = idx + 1;
    }
    rows.push(cells);
  }
  return rows;
}
