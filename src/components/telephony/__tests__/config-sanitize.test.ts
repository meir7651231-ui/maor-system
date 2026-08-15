/**
 * ratchet — התמדת תצורת-הטלפוניה ב-OrgConfig + חיטוי normalizeConfig.
 *
 * הבאג-שנמנע: הקונפיג מסתנכרן לענן/גיבוי, ולכן `telephony` **חייב** לעבור
 * allowlist מלא — אחרת שדה-זר (כולל ניסיון-הזרקה בתוך מספר) רוכב לתוך העותק-בענן.
 * בנוסף: חסר telephony חייב להישאר חסר (ביט-זהה להיום), ו-spread של ...c אסור
 * שידליף telephony לא-מחוטא. ואינווריאנט-חוצה-שכבות: הצורה-המחוטאת עדיין מתקבלת
 * במנוע הטהור (previewTelephony ok) — הטיפוס ב-types/config מיושר למנוע.
 */
import { describe, expect, it } from 'vitest';
import { normalizeConfig, normalizeTelephony } from '../../../lib/config';
import { previewTelephony, type TelephonyConfig } from '../lib';

const base = { slug: 'chesed-demo', orgName: 'מאור', theme: 'or-rishon' };

function validTel(): TelephonyConfig {
  return {
    numbers: [
      { id: 'n1', e164: '02-5551234', label: 'ראשי', kind: 'sim' },
      { id: 'n2', e164: '053-9998877', label: 'כשר', kind: 'sim', kosher: true },
    ],
    officeDays: [0, 1, 2, 3, 4],
    officeStart: '09:00',
    officeEnd: '17:00',
    officeExt: '101',
    managerExt: '201',
    vmBox: '100',
    city: 'jerusalem',
    kosherMode: false,
    hebrewCalendar: true,
    zmanim: false,
    shabbat: true,
    fasts: false,
    voicemail: true,
  };
}

describe('telephony · התמדה + חיטוי', () => {
  it('חסר telephony ⇒ אין מפתח telephony בפלט (ביט-זהה להיום)', () => {
    const cfg = normalizeConfig({ ...base });
    expect(cfg).not.toBeNull();
    expect('telephony' in cfg!).toBe(false);
  });

  it('spread לא מדליף telephony לא-מחוטא — allowlist מלא על שדות-המספר', () => {
    // מספר עם שדה-זר (ניסיון-הזרקה), kind לא-חוקי, ו-e164 לא-מחרוזת
    const dirty = {
      ...base,
      telephony: {
        numbers: [
          { id: 'n1', e164: '02-1', label: 'ok', kind: 'sim', evil: '${SECRET}', extra: 42 },
          { id: 'n2', e164: 12345, label: 'x', kind: 'satellite' },
        ],
        officeDays: [1, 2],
      },
    };
    const cfg = normalizeConfig(dirty);
    const t = cfg!.telephony!;
    expect(t.numbers).toHaveLength(2);
    // רק שדות ה-allowlist שרדו; 'evil'/'extra' נזרקו
    expect(Object.keys(t.numbers[0]).sort()).toEqual(['e164', 'id', 'kind', 'label']);
    expect((t.numbers[0] as unknown as Record<string, unknown>).evil).toBeUndefined();
    // kind לא-חוקי ⇒ נפילה ל-'sim'; e164 לא-מחרוזת ⇒ ''
    expect(t.numbers[1].kind).toBe('sim');
    expect(t.numbers[1].e164).toBe('');
  });

  it('טווחים: officeDays מסונן 0–6, זמן לא-תקין ⇒ ברירת-מחדל, שלוחה לא-ספרתית ⇒ ברירת-מחדל, בוליאן מאולץ', () => {
    const t = normalizeTelephony({
      numbers: [],
      officeDays: [0, 3, 7, -1, 3, 'x'],
      officeStart: '99:99',
      officeEnd: '17:00',
      officeExt: 'abc',
      managerExt: '2050',
      vmBox: '',
      kosherMode: 'yes',
      voicemail: 0,
    })!;
    expect(t.officeDays).toEqual([0, 3]); // מחוץ-לטווח/כפולים/לא-שלמים סוננו + מוין
    expect(t.officeStart).toBe('09:00'); // '99:99' לא-תקין ⇒ ברירת-מחדל
    expect(t.officeEnd).toBe('17:00');
    expect(t.officeExt).toBe('101'); // 'abc' ⇒ ריק ⇒ ברירת-מחדל
    expect(t.managerExt).toBe('2050'); // ספרות נשמרות
    expect(t.vmBox).toBe('100'); // ריק ⇒ ברירת-מחדל
    expect(t.kosherMode).toBe(false); // 'yes' אינו boolean ⇒ ברירת-מחדל
    expect(t.voicemail).toBe(true); // 0 אינו boolean ⇒ ברירת-מחדל (true)
  });

  it('עיר: [a-z] בלבד, 2–20 תווים; מחוץ-לטווח ⇒ ""', () => {
    expect(normalizeTelephony({ city: 'Tel-Aviv' })!.city).toBe('telaviv');
    expect(normalizeTelephony({ city: 'j' })!.city).toBe(''); // תו-יחיד ⇒ מושמט
    expect(normalizeTelephony({ city: 'x'.repeat(40) })!.city).toBe(''); // >20 ⇒ מושמט (regex-המנוע דוחה)
    expect(normalizeTelephony({ city: 123 })!.city).toBe('');
  });

  it('תווית: תווי-בקרה מנוקים; $ נשמר כטקסט (XML-safety = אחריות-המנוע)', () => {
    const bell = String.fromCharCode(7); // תו-בקרה (Cc) — נבנה בזמן-ריצה, לא בתוך המקור
    const t = normalizeTelephony({ numbers: [{ id: 'n1', e164: '02-1', label: `a${bell}b\${x}`, kind: 'sim' }] })!;
    expect(t.numbers[0].label).toBe('ab${x}'); // פעמון (Cc) הוסר; $ ו-{} נשמרו
  });

  it('מתג-מקטע opt-in: ברירת-מחדל כבוי; רק enabled:true מדליק; נשמר רק כשדלוק', () => {
    // הכרעת-בעלים ("כמו שאר הכפתורים אבל בהתחלה מכובה"): הפוך ממודול — חסר=כבוי.
    expect(normalizeTelephony({})!.enabled).toBeUndefined(); // חסר ⇒ כבוי
    expect(normalizeTelephony({ enabled: false })!.enabled).toBeUndefined(); // false ⇒ מושמט
    expect(normalizeTelephony({ enabled: 'yes' })!.enabled).toBeUndefined(); // לא-boolean ⇒ כבוי
    expect(normalizeTelephony({ enabled: true })!.enabled).toBe(true); // רק true מדליק
    // ועובר round-trip דרך normalizeConfig
    const cfg = normalizeConfig({ ...base, telephony: { ...validTel(), enabled: true } });
    expect(cfg!.telephony!.enabled).toBe(true);
  });

  it('תקרה: יותר מ-64 מספרים ⇒ נגזם ל-64', () => {
    const numbers = Array.from({ length: 100 }, (_, i) => ({ id: `n${i}`, e164: `05${i}`, label: 'x', kind: 'sim' }));
    const t = normalizeTelephony({ numbers })!;
    expect(t.numbers).toHaveLength(64);
  });

  it('אינווריאנט-חוצה-שכבות: התצורה-המחוטאת עוברת round-trip ועדיין מתקבלת במנוע', () => {
    // תצורה תקינה → JSON (כמו ייצוא/ענן) → normalizeConfig → תצוגה-מקדימה חיה
    const roundTripped = normalizeConfig(JSON.parse(JSON.stringify({ ...base, telephony: validTel() })));
    const tel = roundTripped!.telephony!;
    expect(tel.numbers).toHaveLength(2);
    expect(tel.city).toBe('jerusalem');
    const p = previewTelephony(tel, 'מאור', 'chesed-demo');
    expect(p.ok).toBe(true);
    expect(p.rows[0].outcome).toBe('office'); // יום-חול בשעות ⇒ מצלצל במשרד
    expect(p.trust!.grade).toMatch(/^[A-F]$/);
  });
});
