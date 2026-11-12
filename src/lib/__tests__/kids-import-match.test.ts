/**
 * ratchet — התאמת-משפחה בייבוא-ילדים (12.11.2026).
 * 🐛 ההתאמה השוותה ספרות-גולמיות (`digits(f.phone) === ph`): מספר שאקסל השמיט לו את ה-0 המוביל,
 * מספר בקידומת 972/+972, מספר ששמור ב"טלפונים נוספים" (`phones[]`), או ת"ז-הורה בלי אפס מוביל —
 * לא הותאמו ⇒ הילד נוצר במשפחה **כפולה** חדשה (או דולג כ"דו-משמעי" כששם-המשפחה חוזר).
 */
import { describe, expect, it } from 'vitest';
import { familiesByParentId, familiesByPhone, importIdKey, importPhoneKey } from '../familiesImport';
import { phoneKey } from '../callerId';
import { emptyFamily } from '../../types/domain';
import type { Family } from '../../types/domain';
import importSrc from '../../components/settings/ImportSection.tsx?raw';

const fam = (id: string, over: Partial<Family>): Family => ({ ...emptyFamily(), id, createdAt: '2026-01-01', name: 'כהן', ...over });

describe('🛡 familiesByPhone — התאמה לפי כל הטלפונים, חסינת-פורמט', () => {
  const fams = [
    fam('f1', { phone: '050-1234567' }),
    fam('f2', { phone2: '02-6543210' }),
    fam('f3', { phones: [{ id: 'p1', num: '054-7778899', label: 'עבודה' }] }),
  ];
  it('0 מוביל שהושמט באקסל / 972 / +972 / מקפים ⇒ אותה משפחה', () => {
    for (const raw of ['0501234567', '501234567', '972501234567', '+972-50-123-4567', '00972501234567', '050 123 4567'])
      expect(familiesByPhone(fams, raw).map((f) => f.id), raw).toEqual(['f1']);
  });
  it('טלפון שני וטלפונים-נוספים נספרים', () => {
    expect(familiesByPhone(fams, '26543210').map((f) => f.id)).toEqual(['f2']);
    expect(familiesByPhone(fams, '0547778899').map((f) => f.id)).toEqual(['f3']);
  });
  it('קצר מדי / ריק / לא-קיים ⇒ אין התאמה', () => {
    for (const raw of ['', undefined, '12345', '0000000', '0509999999']) expect(familiesByPhone(fams, raw), String(raw)).toEqual([]);
  });
  it('שתי משפחות עם אותו מספר ⇒ שתיהן חוזרות (הקורא דורש התאמה יחידה)', () => {
    const two = [...fams, fam('f4', { phones: [{ id: 'p2', num: '0501234567' }] })];
    expect(familiesByPhone(two, '501234567').map((f) => f.id)).toEqual(['f1', 'f4']);
  });
  it('המפתח זהה ל-phoneKey של זיהוי-המתקשר', () => {
    for (const raw of ['050-1234567', '+972501234567', '00972 50 1234567', '026543210', 'abc', '']) expect(importPhoneKey(raw), raw).toBe(phoneKey(raw));
  });
});

describe('🛡 familiesByParentId — ת"ז חסינת-אפסים-מובילים', () => {
  const fams = [fam('f1', { fatherId: '012345678' }), fam('f2', { motherId: '31234567-8' })];
  it('אפס מוביל שהושמט ⇒ עדיין מותאם; אב ואם', () => {
    expect(familiesByParentId(fams, '12345678').map((f) => f.id)).toEqual(['f1']);
    expect(familiesByParentId(fams, '012345678').map((f) => f.id)).toEqual(['f1']);
    expect(familiesByParentId(fams, '312345678').map((f) => f.id)).toEqual(['f2']);
  });
  it('קצר מ-5 ספרות / ריק ⇒ אין התאמה (גם לא מול ת"ז ריקה)', () => {
    for (const raw of ['', undefined, '1234', '0000']) expect(familiesByParentId([...fams, fam('f3', {})], raw), String(raw)).toEqual([]);
    expect(importIdKey('00012')).toBe('12');
  });
});

describe('🛡 הגנת-מקור — ייבוא-הילדים משתמש במתאימים החסינים', () => {
  it('אין עוד השוואת ספרות-גולמיות לטלפון/ת"ז-הורה', () => {
    expect(importSrc).toContain('familiesByPhone(fams, r[iPhone])');
    expect(importSrc).toContain('familiesByParentId(fams, r[iParentId])');
    expect(importSrc).not.toContain('digits(f.phone) === ph');
    expect(importSrc).not.toContain('digits(f.fatherId) === pid');
  });
});
