/**
 * ratchet — פרסור רשימת-התורמים של נדרים (GetTormimCsv, UTF-16LE TSV).
 * דגימת-אמת מהשדה: כותרות בעברית, תאים עטופי ="..."‏, מזהה-תורם בעמודה האחרונה,
 * ת"ז-אפסים = ריק, "null" = ריק, שם-מלא בעמודת שם-משפחה.
 */
import { describe, expect, it } from 'vitest';
import { parseDonorsTsv, unwrapCell } from './nedarimDonors.js';

const HEADER =
  'מספר זהות\tשם משפחה\tשם פרטי\tכתובת\tעיר\tטלפון 1\tטלפון 2\tטלפון 3\tאימייל\tהערות\tשדה 1\tשדה 2\tשדה 3\tשדה 4\tשדה 5\tשדה 6\tשדה 7\tשדה 8\tסך נדרים\tמספר אישי בעסקים\tרשום בעמדות\tמזהה תורם';

// שורות-אמת (מקוצרות אחרי עמודת מזהה-תורם — הפרסור ממפה לפי כותרת)
const rows = [
  HEADER,
  '=""\t\t\t\t\t=""\t=""\t=""\t\t\t\t\t\t\t\t\t\t\t\t\t\t822193', // שורת-סיכום (בלי שם/מזהה בעמודות שלנו) — מדולגת? יש מזהה 822193
  '="000000000"\tבן צבי רחל\t\t\t\t="053-3142342"\t=""\t=""\t\t"אוטומטי - מאגר הו""ק אשראי"\t\t\t\t\t\t\t\t\t\t\t\t492787',
  '="000000020"\tגאביזון דוד ישראל\t\t\t\t="054-8479736"\t=""\t=""\tannael25elbaze@gmail.com\tאוטומטי\t\t\t\t\t\t\t\t\t\t\t\t1652298',
  '="000000065"\tלאה דלאל\t\tnull\t\t="053-3142484"\t=""\t=""\t\tאוטומטי\t\t\t\t\t\t\t\t\t\t\t\t1652468',
];

describe('📇 ratchet — parseDonorsTsv (רשימת-תורמים נדרים)', () => {
  it('unwrapCell: מסיר ="..."‏, "null"/אפסים ⇒ ריק', () => {
    expect(unwrapCell('="053-3142342"')).toBe('053-3142342');
    expect(unwrapCell('="""')).toBe('"');
    expect(unwrapCell('null')).toBe('');
    expect(unwrapCell('  hi  ')).toBe('hi');
  });

  it('ממפה לפי כותרות: שם, טלפון, מייל, מזהה-תורם', () => {
    const donors = parseDonorsTsv(rows.join('\r\n'));
    const byId = Object.fromEntries(donors.map((d) => [d.toremId, d]));

    const rachel = byId['492787'];
    expect(rachel.name).toBe('בן צבי רחל');
    expect(rachel.phone).toBe('053-3142342');
    expect(rachel.zeout).toBe(''); // 000000000 ⇒ ריק (לא ת"ז אמיתית)

    const david = byId['1652298'];
    expect(david.name).toBe('גאביזון דוד ישראל');
    expect(david.email).toBe('annael25elbaze@gmail.com');
    expect(david.phone).toBe('054-8479736');

    const leah = byId['1652468'];
    expect(leah.name).toBe('לאה דלאל');
    expect(leah.address).toBe(''); // "null" ⇒ ריק
  });

  it('מזהה-תורם קיים לכל רשומה (מפתח-שיוך 100%)', () => {
    const donors = parseDonorsTsv(rows.join('\r\n'));
    for (const d of donors) expect(d.toremId).toMatch(/^\d+$/);
  });

  it('קלט ריק ⇒ [] בטוח', () => {
    expect(parseDonorsTsv('')).toEqual([]);
    expect(parseDonorsTsv(null)).toEqual([]);
  });
});
