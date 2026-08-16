/**
 * ratchet — מנתח vCard (.vcf) לייבוא אנשי-קשר. מקור-האמת: יצוא-טלפון אמיתי
 * (אנדרואיד/סמסונג, vCard 2.1) — שמות עברית ב-QUOTED-PRINTABLE, שורות-המשך
 * רכות (`=` בסוף), ריבוי-טלפונים עם תוויות (CELL/X-CUSTOM עברי), וכרטיסי-זבל
 * (מספרי-חירום קצרים). הבדיקות משתמשות בקידוד הביט-אחר-ביט של הקובץ האמיתי.
 */
import { describe, expect, it } from 'vitest';
import { decodeQuotedPrintable, parseVcards, isJunkContact, importableContacts, contactToRow } from '../vcardImport';
import lookupSrc from '../../components/settings/ImportSection.tsx?raw';

describe('decodeQuotedPrintable', () => {
  it('מפענח עברית UTF-8 (‏=D7=A7=D7=99=D7=A8 = "קיר")', () => {
    expect(decodeQuotedPrintable('=D7=A7=D7=99=D7=A8')).toBe('קיר');
    expect(decodeQuotedPrintable('=D7=A7=D7=99=D7=A8=20=D7=96=D7=96')).toBe('קיר זז'); // 20=רווח
  });
  it('משאיר ASCII כמות-שהוא', () => {
    expect(decodeQuotedPrintable('Police')).toBe('Police');
  });
});

// כרטיסים אמיתיים מהקובץ (הקידוד הועתק ביט-אחר-ביט).
const VCF = [
  'BEGIN:VCARD',
  'VERSION:2.1',
  'N:;Police;;;',
  'FN:Police',
  'TEL;CELL;PREF:100',
  'END:VCARD',
  'BEGIN:VCARD',
  'VERSION:2.1',
  'N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:=D7=96=D7=96;=D7=A7=D7=99=D7=A8;;;',
  'FN;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:=D7=A7=D7=99=D7=A8=20=D7=96=D7=96',
  'TEL;CELL:0556656313',
  'END:VCARD',
  'BEGIN:VCARD',
  'VERSION:2.1',
  // שם רב-שורתי עם ריכוך-QP (`=` בסוף השורה) — "יעקב אייזנבאך"
  'N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:=D7=90=D7=99=D7=99=D7=96=D7=A0=D7=91=D7=90=D7=9A;=D7=99=D7=A2=D7=A7=D7=91;;;',
  'FN;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:=D7=99=D7=A2=D7=A7=D7=91=20=D7=90=D7=99=D7=99=D7=96=D7=A0=D7=91=D7=90=',
  '=D7=9A',
  'TEL;X-CUSTOM(CHARSET=UTF-8,ENCODING=QUOTED-PRINTABLE,=D7=A0=D7=99=D7=99=D7=93):+972527634973',
  'ORG:null',
  'TITLE;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:=D7=A1=D7=90=D7=95=D7=95=D7=A8=D7=90=D7=9F',
  'END:VCARD',
  'BEGIN:VCARD',
  'VERSION:2.1',
  'N:;Amnon;;;',
  'FN:Amnon The Transciber',
  'TEL;CELL:+972523362105',
  'TEL;HOME:02-5001234',
  'EMAIL:amnon@example.com',
  'ORG:Amnon Studio',
  'ADR;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:;;=D7=94=D7=A8=D7=A6=D7=9C=20=D7=9E=D7=95=D7=A8;;;;',
  'END:VCARD',
].join('\r\n');

describe('parseVcards — פענוח כרטיסים אמיתיים', () => {
  const cards = parseVcards(VCF);

  it('קורא את כל 4 הכרטיסים', () => {
    expect(cards.length).toBe(4);
  });

  it('כרטיס לועזי פשוט (Police / 100)', () => {
    expect(cards[0].fullName).toBe('Police');
    expect(cards[0].phones).toEqual([{ value: '100', label: 'נייד' }]); // CELL → "נייד"
  });

  it('שם עברי חד-שורתי + טלפון נייד', () => {
    expect(cards[1].fullName).toBe('קיר זז');
    expect(cards[1].family).toBe('זז');
    expect(cards[1].given).toBe('קיר');
    expect(cards[1].phones[0].value).toBe('0556656313');
    expect(cards[1].phones[0].label).toBe('נייד'); // CELL
  });

  it('שם עברי רב-שורתי (ריכוך-QP) + תווית-טלפון עברית מותאמת + ORG:null מדולג', () => {
    expect(cards[2].fullName).toBe('יעקב אייזנבאך'); // חובר משתי שורות
    expect(cards[2].phones[0].value).toBe('+972527634973');
    expect(cards[2].phones[0].label).toBe('נייד'); // X-CUSTOM(…=D7=A0=D7=99=D7=99=D7=93…)
    expect(cards[2].org).toBe(''); // "null" סונן
    expect(cards[2].title).toBe('סאווראן');
  });

  it('ריבוי-טלפונים + מייל + ארגון + כתובת-QP', () => {
    expect(cards[3].fullName).toBe('Amnon The Transciber');
    expect(cards[3].phones.map((p) => p.value)).toEqual(['+972523362105', '02-5001234']);
    expect(cards[3].phones.map((p) => p.label)).toEqual(['נייד', 'בית']);
    expect(cards[3].emails).toEqual(['amnon@example.com']);
    expect(cards[3].org).toBe('Amnon Studio');
    expect(cards[3].address).toBe('הרצל מור'); // ADR מובנה → מחרוזת נקייה
  });
});

describe('סינון זבל-מערכת', () => {
  it('מספר-חירום קצר (Police/100) = זבל; איש-קשר אמיתי נשמר', () => {
    const cards = parseVcards(VCF);
    expect(isJunkContact(cards[0])).toBe(true); // 100 — 3 ספרות, בלי מייל
    expect(isJunkContact(cards[1])).toBe(false);
    expect(importableContacts(VCF).length).toBe(3); // 4 פחות Police
  });
  it('כרטיס בלי שם ובלי טלפון = זבל', () => {
    expect(isJunkContact({ fullName: '', family: '', given: '', phones: [], emails: [], org: '', title: '', address: '', note: '' })).toBe(true);
  });
});

describe('contactToRow — מיפוי כרטיס לשורת-ייבוא', () => {
  it('שם/שני-טלפונים/מייל/כתובת + ארגון·תפקיד·הערה מאוחדים ל-notes', () => {
    const cards = parseVcards(VCF);
    const row = contactToRow(cards[3]); // Amnon The Transciber
    expect(row.name).toBe('Amnon The Transciber');
    expect(row.phone).toBe('+972523362105');
    expect(row.phone2).toBe('02-5001234');
    expect(row.email).toBe('amnon@example.com');
    expect(row.address).toBe('הרצל מור');
    expect(row.notes).toBe('🏢 Amnon Studio'); // ארגון בלבד (בלי title/note לכרטיס זה)
  });
  it('מאחד ארגון·תפקיד להערה', () => {
    const row = contactToRow(parseVcards(VCF)[2]); // יעקב אייזנבאך — title "סאווראן", org null
    expect(row.notes).toBe('סאווראן'); // org "null" סונן, נשאר title
  });
});

describe('הגנת-מקור — מסך-הייבוא מחווט למנתח', () => {
  it('ImportSection מייבא ומריץ importableContacts/contactToRow עם בורר-יעד', () => {
    expect(lookupSrc).toContain('vcardImport');
    expect(lookupSrc).toContain('importableContacts');
    expect(lookupSrc).toContain('contactToRow');
    expect(lookupSrc).toContain("target === 'fam'"); // בורר לקוחות/לידים
  });
});
