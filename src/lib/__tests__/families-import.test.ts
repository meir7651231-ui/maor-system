/**
 * ratchet — ייבוא משפחות 13 עמודות (P0.5, feature settings.import.families13).
 *
 * מקור האמת: legacy-main-script.js:944-960 (processImport, ענף המשפחות) —
 * בדיקה נפרדת לכל ניקוי:
 * 945: שורת "שם פרטי שם משפחה" מדולגת
 * 947: "יריד חנוכה תשפ״ו" מוסר מהשם + notes="השתתפה ביריד חנוכה תשפ\"ו"
 * 948: '#NAME?' מוסר מהשם (שם שנשאר ריק — מדולג)
 * 949-950: עיר "רגיל"→'' · "ביתר"/"ביתר עלית"→"ביתר עילית"
 * 951-955: `סטטוס: <טקסט>` מההערות — "לא פעיל"→inactive · טלפון '-'→''
 * 957: מצב משפחתי — "אלמנ" בסטטוס או "אלמן" בעמודה 9 → 'אלמן/ה'; "גרוש"→'גרושים'; אחרת 'נשואים'
 * 958: קהילה ריקה → 'חסידי'
 * 953: כתובת = עמודות 7+8 מחוברות ברווח
 * 960: התאמה לקיימת — normName(שם) + (טלפון ריק באחד הצדדים או digits שווים)
 * 1005: עדכון — רק שדות לא-ריקים דורסים (members/docs לא נגעים)
 */
import { describe, expect, it } from 'vitest';
import { mergeFamilyImport, parseFamiliesCsv } from '../familiesImport';
import { emptyFamily, type Family } from '../../types/domain';

const HEADER = ['שם', 'ת"ז אב', 'טלפון', 'שם האם', 'ת"ז אם', 'טלפון2', 'עיר', 'כתובת', 'המשך', 'רמז', 'קהילה', '', 'הערות'];

/** שורת בסיס תקינה — 13 עמודות במיפוי הקבוע. */
function row(over: Partial<Record<number, string>> = {}): string[] {
  const r = ['כהן', '012345678', '050-1234567', 'שרה', '087654321', '052-7654321', 'ירושלים', "רח' הרב קוק", '12', '', 'ליטאי', '', ''];
  for (const [k, v] of Object.entries(over)) r[+k] = v as string;
  return r;
}

function parse(rows: string[][], existing: Family[] = []) {
  return parseFamiliesCsv([HEADER, ...rows], existing);
}

describe('🧹 ratchet — הניקויים של legacy:944-960, אחד-אחד', () => {
  it('שורה תקינה — כל 13 העמודות ממופות נכון (כולל כתובת 7+8 ברווח)', () => {
    const p = parse([row()]);
    expect(p.news).toHaveLength(1);
    expect(p.news[0]).toMatchObject({
      name: 'כהן',
      fatherId: '012345678',
      phone: '050-1234567',
      mother: 'שרה',
      motherId: '087654321',
      phone2: '052-7654321',
      city: 'ירושלים',
      address: "רח' הרב קוק 12",
      community: 'ליטאי',
      status: 'active',
      maritalStatus: 'נשואים',
      language: 'עברית',
    });
  });

  it('945: שורת "שם פרטי שם משפחה" מדולגת; שם ריק מדולג', () => {
    const p = parse([row({ 0: 'שם פרטי שם משפחה' }), row({ 0: '' })]);
    expect(p.news).toHaveLength(0);
  });

  it('947: יריד חנוכה — מוסר מהשם ועובר להערות', () => {
    const p = parse([row({ 0: 'לוי - יריד חנוכה תשפ"ו' })]);
    expect(p.news[0].name).toBe('לוי');
    expect(p.news[0].notes).toBe('השתתפה ביריד חנוכה תשפ"ו');
  });

  it('948: ‎#NAME?‎ מוסר מהשם; שם שכולו ‎#NAME?‎ — מדולג', () => {
    const p = parse([row({ 0: '#NAME? גולד' }), row({ 0: '#NAME?' })]);
    expect(p.news).toHaveLength(1);
    expect(p.news[0].name).toBe('גולד');
  });

  it('949-950: עיר "רגיל"→ריק · "ביתר"/"ביתר עלית"→"ביתר עילית"', () => {
    const p = parse([
      row({ 0: 'א', 6: 'רגיל' }),
      row({ 0: 'ב', 6: 'ביתר' }),
      row({ 0: 'ג', 6: 'ביתר עלית' }),
      row({ 0: 'ד', 6: 'ביתר עילית' }),
    ]);
    expect(p.news.map((x) => x.city)).toEqual(['', 'ביתר עילית', 'ביתר עילית', 'ביתר עילית']);
  });

  it('951-955: סטטוס מהערות — "סטטוס: לא פעיל" → inactive; אחרת active', () => {
    const p = parse([row({ 0: 'א', 12: 'סטטוס: לא פעיל\nעוד הערה' }), row({ 0: 'ב', 12: 'הערה רגילה' })]);
    expect(p.news[0].status).toBe('inactive');
    expect(p.news[1].status).toBe('active');
  });

  it('954: טלפון/טלפון2 שערכם "-" → ריק', () => {
    const p = parse([row({ 2: '-', 5: '-' })]);
    expect(p.news[0].phone).toBe('');
    expect(p.news[0].phone2).toBe('');
  });

  it('957: מצב משפחתי — אלמנ בסטטוס / אלמן בעמודה 9 → אלמן/ה; גרוש → גרושים; אחרת נשואים', () => {
    const p = parse([
      row({ 0: 'א', 12: 'סטטוס: אלמנה' }),
      row({ 0: 'ב', 9: 'אלמן' }),
      row({ 0: 'ג', 12: 'סטטוס: גרושה' }),
      row({ 0: 'ד' }),
    ]);
    expect(p.news.map((x) => x.maritalStatus)).toEqual(['אלמן/ה', 'אלמן/ה', 'גרושים', 'נשואים']);
  });

  it('958: קהילה ריקה → חסידי', () => {
    const p = parse([row({ 10: '' })]);
    expect(p.news[0].community).toBe('חסידי');
  });
});

describe('🔗 ratchet — התאמה לקיימות (legacy:960) ועדכון שדות לא-ריקים (legacy:1005)', () => {
  const existing: Family[] = [
    { ...emptyFamily(), id: 'f1', createdAt: '2024-01-01', name: 'כהן', phone: '050-1234567', city: 'עיר ישנה', notes: 'הערה ישנה' },
    { ...emptyFamily(), id: 'f2', createdAt: '2024-01-01', name: 'לוי', phone: '' },
  ];

  it('שם שווה + טלפון זהה (digits) → עדכון; טלפון שונה → חדשה', () => {
    const p = parse([row(), row({ 2: '050-9999999' })], existing);
    expect(p.upds).toHaveLength(1);
    expect(p.upds[0].id).toBe('f1');
    expect(p.news).toHaveLength(1);
  });

  it('טלפון ריק באחד הצדדים → עדיין התאמה לפי שם', () => {
    // בקובץ יש טלפון, לקיימת (לוי) אין — מתאימים לפי שם
    const p = parse([row({ 0: 'לוי' })], existing);
    expect(p.upds).toHaveLength(1);
    expect(p.upds[0].id).toBe('f2');
    // בקובץ אין טלפון ('-' → ריק) — מתאימים לכהן למרות שלקיימת יש טלפון
    const p2 = parse([row({ 2: '-' })], existing);
    expect(p2.upds[0]?.id).toBe('f1');
  });

  it('mergeFamilyImport: רק ערכים לא-ריקים דורסים; members/docs לא נגעים', () => {
    const fam: Family = {
      ...emptyFamily(),
      id: 'f1',
      createdAt: '2024-01-01',
      name: 'כהן',
      phone: '050-1234567',
      email: 'old@mail',
      notes: 'הערה ישנה',
      members: [{ id: 'm1', first: 'רוני', gender: 'm', birth: '', idNum: '', phone: '', phone2: '', school: '', grade: '', health: '', mSefach: false, mInvite: false, mRecommend: false, mPhotos: false, mVideos: false, notes: '' }],
      docs: [{ id: 'd1', name: 'ספח', addedAt: '2024-01-01' }],
    };
    const p = parse([row({ 6: 'בני ברק', 12: '' })], [fam]);
    const merged = mergeFamilyImport(fam, p.upds[0].obj);
    expect(merged.city).toBe('בני ברק'); // לא-ריק — דורס
    expect(merged.email).toBe('old@mail'); // email תמיד '' בקובץ — לא דורס
    expect(merged.notes).toBe('הערה ישנה'); // notes ריק — לא דורס
    expect(merged.members).toHaveLength(1); // members לא נגעים
    expect(merged.docs).toHaveLength(1); // docs לא נגעים
    expect(fam.city).toBe(''); // אימוטביליות — המקור לא שונה
  });
});
