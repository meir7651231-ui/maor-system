// ─────────────────────────────────────────────────────────────────────────────
// vcardImport — מנתח קובץ אנשי-קשר (vCard / .vcf) טהור: הופך יצוא-טלפון לרשומות
// שאפשר לייבא למאור (לקוחות / לידים). בלי store/DOM/רשת — נבדק ביחידה.
//
// תומך ב-vCard 2.1 (יצוא אנדרואיד/סמסונג/iOS): שמות עברית מקודדים
// QUOTED-PRINTABLE (‏`=D7=A7=D7=99=D7=A8` = "קיר"), שורות-המשך רכות (‏`=` בסוף
// שורה), ריבוי-טלפונים עם תוויות (CELL/HOME/WORK/FAX/X-CUSTOM עברי), מייל, ארגון,
// תפקיד, כתובת והערה. גם vCard 3.0/4.0 (ENCODING לרוב מיותר שם) עוברים.
// ─────────────────────────────────────────────────────────────────────────────

/** טלפון בודד מכרטיס — הערך הגולמי + תווית קריאה ("נייד"/"בית"/…). */
export interface VCardPhone {
  value: string;
  label: string;
}

/** איש-קשר מפוענח מכרטיס vCard בודד — שדות מנורמלים, מוכנים למיפוי לישות מאור. */
export interface VCardContact {
  /** שם-תצוגה: FN מפוענח, אחרת מורכב מ-N (משפחה + פרטי). */
  fullName: string;
  /** חלק-המשפחה מ-N (אם קיים). */
  family: string;
  /** חלק-הפרטי מ-N (אם קיים). */
  given: string;
  phones: VCardPhone[];
  emails: string[];
  org: string;
  title: string;
  address: string;
  note: string;
}

const HEX2 = /^[0-9A-Fa-f]{2}$/;

/**
 * פענוח QUOTED-PRINTABLE → UTF-8. כל `=XX` הוא בית; שאר התווים ASCII כמות-שהם.
 * שורות-המשך רכות (‏`=` בסוף) כבר אוחו לפני-כן. TextDecoder זמין בדפדפן וב-vitest.
 */
export function decodeQuotedPrintable(s: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '=' && i + 2 < s.length && HEX2.test(s.slice(i + 1, i + 3))) {
      bytes.push(parseInt(s.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      // תו ASCII רגיל — code-point בטווח בית בודד; מעל 0xFF נשמר כמות-שהוא (נדיר).
      const cp = s.charCodeAt(i);
      bytes.push(cp <= 0xff ? cp : 0x3f /* '?' */);
    }
  }
  try {
    return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
  } catch {
    return s;
  }
}

/**
 * איחוד שורות פיזיות לשורות-לוגיות: (א) קיפול-vCard רגיל — שורה שמתחילה ברווח/טאב
 * ממשיכה את הקודמת; (ב) שורת-המשך רכה של QP — שורה שנגמרת ב-`=` מתחברת לבאה בלי
 * ה-`=`. חשוב: ריכוך-ה-`=` חל **רק** על שדה QUOTED-PRINTABLE — אחרת בסיס-64 של
 * PHOTO (שנגמר ב-`=`/`==` ריפוד) היה בולע את גבול-הכרטיס (END/BEGIN) ומאבד רשומות.
 */
function unfoldLines(text: string): string[] {
  const raw = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const out: string[] = [];
  let qpActive = false; // השורה-הלוגית הנוכחית היא QP וממתינה להמשך רך
  for (const line of raw) {
    // קיפול-vCard רגיל: המשך בהזחה מצטרף לקודמת.
    if (out.length && (line.startsWith(' ') || line.startsWith('\t'))) {
      out[out.length - 1] += line.slice(1);
      if (!out[out.length - 1].endsWith('=')) qpActive = false;
      continue;
    }
    // ריכוך-QP: רק כשהשורה-הלוגית הנוכחית היא QP ונגמרת ב-'='.
    if (out.length && qpActive && out[out.length - 1].endsWith('=')) {
      out[out.length - 1] = out[out.length - 1].slice(0, -1) + line;
      if (!out[out.length - 1].endsWith('=')) qpActive = false;
      continue;
    }
    // שורה-לוגית חדשה — QP-פעיל אם היא שדה-QP שנגמר ב-'=' (ממתין להמשך).
    out.push(line);
    qpActive = /ENCODING=QUOTED-PRINTABLE/i.test(line) && line.endsWith('=');
  }
  return out;
}

/** פיצול "NAME;PARAM;PARAM:VALUE" ל-{ name, params[], value }. ה-`:` הראשון מפריד. */
function splitProperty(line: string): { name: string; params: string[]; value: string } | null {
  const colon = line.indexOf(':');
  if (colon < 0) return null;
  const head = line.slice(0, colon);
  const value = line.slice(colon + 1);
  const segs = head.split(';');
  const name = (segs.shift() || '').trim().toUpperCase();
  if (!name) return null;
  return { name, params: segs, value };
}

const hasParam = (params: string[], token: string) =>
  params.some((p) => p.toUpperCase().includes(token));

/** ערך-שדה מפוענח לפי הפרמטרים (QUOTED-PRINTABLE אם צוין; אחרת גלמי). */
function decodeValue(value: string, params: string[]): string {
  return hasParam(params, 'QUOTED-PRINTABLE') ? decodeQuotedPrintable(value) : value;
}

const PHONE_LABELS: Record<string, string> = {
  CELL: 'נייד',
  HOME: 'בית',
  WORK: 'עבודה',
  FAX: 'פקס',
  MAIN: 'ראשי',
  VOICE: '',
  PREF: '',
};

/** תווית-טלפון קריאה מהפרמטרים: X-CUSTOM(…עברית…) מפוענח, אחרת מיפוי CELL/HOME/… */
function phoneLabel(params: string[]): string {
  for (const p of params) {
    const up = p.toUpperCase();
    if (up.startsWith('X-CUSTOM')) {
      // X-CUSTOM(CHARSET=UTF-8,ENCODING=QUOTED-PRINTABLE,=D7=A0=D7=99=D7=99=D7=93)
      const inner = p.slice(p.indexOf('(') + 1, p.lastIndexOf(')'));
      const parts = inner.split(',');
      const last = parts[parts.length - 1] || '';
      const decoded = /=[0-9A-Fa-f]{2}/.test(last) ? decodeQuotedPrintable(last) : last;
      if (decoded.trim()) return decoded.trim();
    }
  }
  for (const p of params) {
    const key = p.toUpperCase().trim();
    if (key in PHONE_LABELS && PHONE_LABELS[key]) return PHONE_LABELS[key];
  }
  return '';
}

/** ADR מובנה (po;ext;street;city;region;postal;country) → מחרוזת-כתובת נקייה. */
function joinAddress(value: string, params: string[]): string {
  const decoded = decodeValue(value, params);
  return decoded
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(', ');
}

/**
 * פענוח קובץ vCard שלם → רשימת אנשי-קשר. כרטיס בלי שם ובלי טלפון/מייל מדולג.
 * דטרמיניסטי, טהור. סדר-הפלט = סדר-הכרטיסים בקובץ.
 */
export function parseVcards(text: string): VCardContact[] {
  const lines = unfoldLines(text || '');
  const out: VCardContact[] = [];
  let cur: VCardContact | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^BEGIN:VCARD$/i.test(trimmed)) {
      cur = { fullName: '', family: '', given: '', phones: [], emails: [], org: '', title: '', address: '', note: '' };
      continue;
    }
    if (/^END:VCARD$/i.test(trimmed)) {
      if (cur) {
        if (!cur.fullName) {
          cur.fullName = [cur.given, cur.family].filter(Boolean).join(' ').trim();
        }
        out.push(cur);
      }
      cur = null;
      continue;
    }
    if (!cur) continue;
    const prop = splitProperty(line);
    if (!prop) continue;
    const { name, params, value } = prop;

    switch (name) {
      case 'FN':
        cur.fullName = decodeValue(value, params).trim();
        break;
      case 'N': {
        const decoded = decodeValue(value, params);
        const segs = decoded.split(';');
        cur.family = (segs[0] || '').trim();
        cur.given = (segs[1] || '').trim();
        break;
      }
      case 'TEL': {
        const v = value.trim();
        if (v) cur.phones.push({ value: v, label: phoneLabel(params) });
        break;
      }
      case 'EMAIL': {
        const v = decodeValue(value, params).trim();
        if (v) cur.emails.push(v);
        break;
      }
      case 'ORG': {
        const v = decodeValue(value, params).replace(/;+$/, '').trim();
        if (v && v.toLowerCase() !== 'null') cur.org = v;
        break;
      }
      case 'TITLE':
        cur.title = decodeValue(value, params).trim();
        break;
      case 'ADR':
        cur.address = joinAddress(value, params);
        break;
      case 'NOTE':
        cur.note = decodeValue(value, params).trim();
        break;
      default:
        break; // PHOTO/URL/X-* וכו' — מדולגים
    }
  }
  return out;
}

/** ספרות בלבד ממספר-טלפון (לזיהוי מספרי-חירום/זבל קצרים). */
const digitsOnly = (s: string) => (s || '').replace(/\D/g, '');

/**
 * כרטיס-זבל שאין טעם לייבא: בלי שם, או שכל הטלפונים קצרים-מדי (מספרי-מערכת/חירום
 * כמו 100/101/102) ואין מייל. שם עם מספר/מייל אמיתי — נשמר.
 */
export function isJunkContact(c: VCardContact): boolean {
  if (!c.fullName.trim()) return true;
  const realPhone = c.phones.some((p) => digitsOnly(p.value).length >= 5);
  return !realPhone && c.emails.length === 0;
}

/** אנשי-הקשר הראויים-לייבוא (בניכוי זבל-מערכת). שומר על הסדר. */
export function importableContacts(text: string): VCardContact[] {
  return parseVcards(text).filter((c) => !isJunkContact(c));
}

/** שורת-ייבוא ניטרלית — הצומת בין הכרטיס לישות-מאור (לקוח/ליד). */
export interface ContactRow {
  name: string;
  phone: string;
  phone2: string;
  email: string;
  address: string;
  /** ארגון · תפקיד · הערה — מאוחדים לשדה-הערות (הקשר עסקי שלא הולך לאיבוד). */
  notes: string;
}

/**
 * מיפוי כרטיס → שורת-ייבוא: שם-תצוגה, שני טלפונים ראשונים, מייל ראשון, כתובת,
 * ו"ארגון · תפקיד · הערה" מאוחדים ל-notes. טהור — הנרמול/הדדופ נעשים בצרכן.
 */
export function contactToRow(c: VCardContact): ContactRow {
  const notes = [c.org ? '🏢 ' + c.org : '', c.title, c.note].filter(Boolean).join(' · ');
  return {
    name: c.fullName.trim(),
    phone: c.phones[0]?.value || '',
    phone2: c.phones[1]?.value || '',
    email: c.emails[0] || '',
    address: c.address,
    notes,
  };
}
