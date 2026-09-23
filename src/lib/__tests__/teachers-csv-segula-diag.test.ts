/**
 * ratchet — 16.9: (א) ⬇ ייצוא רשימת-המורות המלאה ל-CSV (בקשת-בעלים); (ב) חקירת "הלקוח בענן לא
 * רואה 40 יום": כשהדגל כבוי — הכרטיס אומר זאת במקום להעלים; 🔎 אבחון-דגלים בהגדרות.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { teachersCsvRows } from '../teachersCsv';
import type { Course, Teacher } from '../../types/domain';

const src = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8');
const t = (id: string, name: string, over: Partial<Teacher> = {}): Teacher =>
  ({ id, name, phone: '050-1', phone2: '', email: 'a@b.c', idNum: '123456782', address: 'ירושלים', specialty: 'ציור', payRate: 120, startDate: '2026-09-01', notes: 'הערה', ...over }) as Teacher;
const c = (id: string, name: string, teacherId: string): Course => ({ id, name, teacherId } as unknown as Course);

describe('teachersCsvRows — טהור', () => {
  const teachers = [t('t2', 'רות'), t('t1', 'אביגיל', { phone2: '02-1' })];
  const courses = [c('c1', 'ציור', 't1'), c('c2', 'פיסול', 't1'), c('c3', 'גיטרה', 't2')];
  it('כותרת + שורה-פר-מורה, ממוין א״ב, חוגים מצורפים; בלי ייצוא-מלא אין ת"ז/תעריף', () => {
    const rows = teachersCsvRows(teachers, courses, { full: false, teacherLabel: 'מורה', courseLabel: 'חוגים' });
    expect(rows[0]).toEqual(['שם המורה', 'טלפון', 'טלפון נוסף', 'אימייל', 'כתובת', 'תחום', 'תאריך התחלה', 'חוגים פעילים', 'הערות']);
    expect(rows.length).toBe(3);
    expect(rows[1][0]).toBe('אביגיל');
    expect(rows[1][7]).toBe('ציור · פיסול');
    expect(rows[2][7]).toBe('גיטרה');
    expect(rows.flat().join('|')).not.toContain('123456782');
  });
  it('ייצוא-מלא: ת"ז אחרי הכתובת-לפניה (עמודה 5) + תעריף ופרטי-תשלום בסוף', () => {
    const rows = teachersCsvRows(teachers, courses, { full: true, teacherLabel: 'מורה', courseLabel: 'חוגים' });
    expect(rows[0][4]).toBe('ת"ז');
    expect(rows[1][4]).toBe('123456782');
    expect(rows[0].slice(-5)).toEqual(['תעריף שעתי ₪', 'סגנון תשלום', 'בנק', 'סניף', 'חשבון']);
    expect(rows[1][rows[0].length - 5]).toBe(120);
  });
  it('רשימה ריקה ⇒ כותרת בלבד', () => {
    expect(teachersCsvRows([], [], { full: false, teacherLabel: 'מורה', courseLabel: 'חוגים' }).length).toBe(1);
  });
});

describe('הגנות-מקור', () => {
  it('כפתור "⬇ רשימת המורות (CSV)" בסעיף-המורות דרך downloadCsv (שער core.export) + reports.export.full', () => {
    const s = src('../../components/settings/TeachersSection.tsx');
    expect(s).toContain("downloadCsv('maor-teachers.csv', teachersCsvRows(teachers, courses, { full: featureOn(config, 'reports.export.full')");
    expect(s).toContain("{'⬇ רשימת ה' + teacher + ' (CSV)'}");
  });
  // הכרעת-בעלים 22.9 ("שיהיה כפתור דלוק ברירת-מחדל"): הנראות כבר לא תלויה בדגל
  // supporters.segula אלא בעמותה (core.taxreceipt) — דגל false לא מסתיר; אין הודעת-כבוי.
  it('כרטיס-תורם: 40 יום דלוק ברירת-מחדל לעמותה (core.taxreceipt), לא תלוי בדגל; אין הודעת-כבוי', () => {
    const s = src('../../components/supporters/SupporterDetail.tsx');
    expect(s).toContain("const segulaOn = featureOn(config, 'core.taxreceipt');");
    expect(s).not.toContain('{!segulaOn && (');
    expect(s).not.toContain('"40 ימים" כבוי בהגדרות-הארגון הזה');
  });
  it('הגדרות: 🔎 אבחון-דגלים — org/cloud/build/מודול/40-יום-נראה+raw/רשימות-כבויים', () => {
    const s = src('../../components/settings/SettingsView.tsx');
    expect(s).toContain('<FlagDiagnostics />');
    expect(s).toContain("'40 יום נראה: ' + (segula ? 'ON' : 'OFF')");
    expect(s).toContain("raw supporters.segula=' + String(config.features?.['supporters.segula'])");
    expect(s).toContain("'supporters module: ' + (moduleOn(config, 'supporters') ? 'on' : 'OFF')");
  });
});
