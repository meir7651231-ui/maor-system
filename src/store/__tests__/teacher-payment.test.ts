/**
 * ratchet — פרטי תשלום למורה (בקשת-בעלים 13.8): "למורה תוסיף פרטי תשלום סגנון
 * תשלום מזומן/משכורות/צק שם טלפון תעודת זהות פרטי בנק".
 *
 * הנעילה: השדות additive (payMethod/payeeName/bankName/bankBranch/bankAccount)
 * שורדים upsert דרך ה-store, ולא נמחקים ע"י migrate/normalize. השם/טלפון/ת"ז
 * לתשלום = שדות הכרטיס הקיימים (name/phone/idNum) — לכן לא משוכפלים.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { emptyDb } from '../../types/domain';
import type { Teacher } from '../../types/domain';

beforeEach(() => {
  useApp.getState().setDb(() => ({ ...emptyDb(), teachers: [] }));
});

const baseTeacher = (over: Partial<Teacher> = {}): Teacher => ({
  id: 't1',
  name: 'מרים לוי',
  phone: '050-1234567',
  phone2: '',
  email: '',
  idNum: '039285016',
  address: '',
  specialty: 'ציור',
  payRate: 120,
  startDate: '',
  notes: '',
  ...over,
});

describe('פרטי תשלום למורה — additive, שורד round-trip', () => {
  it('payMethod + פרטי בנק נשמרים ונקראים חזרה מה-store', () => {
    const t = baseTeacher({
      payMethod: 'salary',
      payeeName: 'מרים לוי',
      bankName: 'לאומי',
      bankBranch: '813',
      bankAccount: '45678',
    });
    useApp.getState().upsertTeacher(t);
    const saved = useApp.getState().db.teachers[0];
    expect(saved.payMethod).toBe('salary');
    expect(saved.bankName).toBe('לאומי');
    expect(saved.bankBranch).toBe('813');
    expect(saved.bankAccount).toBe('45678');
    expect(saved.payeeName).toBe('מרים לוי');
  });

  it('שלושת סגנונות התשלום נתמכים: מזומן / משכורת / צ׳ק', () => {
    for (const m of ['cash', 'salary', 'check'] as const) {
      useApp.getState().upsertTeacher(baseTeacher({ id: 't-' + m, payMethod: m }));
    }
    const byId = (id: string) => useApp.getState().db.teachers.find((x) => x.id === id)!;
    expect(byId('t-cash').payMethod).toBe('cash');
    expect(byId('t-salary').payMethod).toBe('salary');
    expect(byId('t-check').payMethod).toBe('check');
  });

  it('כרטיס ישן בלי פרטי תשלום = ביט-זהה (השדות undefined, לא קורס)', () => {
    // מורה שנוצר לפני הפיצ'ר — אין payMethod כלל.
    const legacy = baseTeacher();
    useApp.getState().upsertTeacher(legacy);
    const saved = useApp.getState().db.teachers[0];
    expect(saved.payMethod).toBeUndefined();
    expect(saved.bankName).toBeUndefined();
    // השם/טלפון/ת"ז — פרטי התשלום המזוהים — נשארים בשדות הקיימים:
    expect(saved.name).toBe('מרים לוי');
    expect(saved.phone).toBe('050-1234567');
    expect(saved.idNum).toBe('039285016');
  });
});
