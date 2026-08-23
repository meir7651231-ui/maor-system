/// <reference types="node" />
/**
 * ratchet — ניקוי-דמו-שהתערבב (ממצא-בעלים 23.8). מוודא:
 *  1. רשומות-דמו (מ-demo.json האמיתי) מוסרות לפי תוכן.
 *  2. רשומה **אמיתית** עם אותו id של רשומת-דמו אך תוכן שונה — **נשמרת** (אין
 *     התאמה-לפי-id ⇒ אפס-מחיקה-שגויה של תורם אמיתי sp639 וכו').
 *  3. מפל: שיבוץ-דמו (חוג-דמו) מוסר; שיבוץ אמיתי נשמר.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { planDemoCleanup } from '../demoCleanup';
import type { Db } from '../../types/domain';

const demo = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../public/demo.json'), 'utf8'),
) as Partial<Db>;

describe('🧹 ratchet — ניקוי-דמו לפי-תוכן (אפס-נגיעה בנתונים אמיתיים)', () => {
  it('מסיר את כל רשומות-הדמו כשה-DB הוא הדמו עצמו', () => {
    const plan = planDemoCleanup(demo as Db, demo);
    expect(plan.removed.families.count).toBe((demo.families ?? []).length);
    expect(plan.removed.supporters.count).toBe((demo.supporters ?? []).length);
    expect((plan.cleaned.families ?? []).length).toBe(0);
    expect((plan.cleaned.supporters ?? []).length).toBe(0);
  });

  it('שומר תורם אמיתי עם אותו id של דמו (sp639) אך שם/טלפון שונים', () => {
    const realSupporter = {
      ...(demo.supporters![0] as unknown as Record<string, unknown>),
      id: 'sp639', // אותו id בדיוק של רשומת-הדמו הראשונה
      name: 'משפחת ישראלי האמיתית',
      phone: '050-0000000',
      email: 'real@gmail.com',
      donations: [],
    };
    const db = {
      ...(demo as Db),
      supporters: [...(demo.supporters as unknown[]), realSupporter],
    } as unknown as Db;
    const plan = planDemoCleanup(db, demo);
    // 15 דמו מוסרים, האמיתי נשאר
    expect(plan.removed.supporters.count).toBe(15);
    const keptIds = (plan.cleaned.supporters ?? []).map((s) => s.id);
    expect(keptIds).toContain('sp639');
    expect((plan.cleaned.supporters ?? []).length).toBe(1);
    expect((plan.cleaned.supporters ?? [])[0].name).toBe('משפחת ישראלי האמיתית');
  });

  it('מפל: שיבוץ-דמו (חוג-דמו) מוסר; שיבוץ אמיתי נשמר', () => {
    const realEnroll = { id: 'eREAL', memberId: 'mREAL', courseId: 'cREAL', plan: 'monthly', payments: [], absences: [] };
    const db = {
      ...(demo as Db),
      enrollments: [...(demo.enrollments as unknown[]), realEnroll],
    } as unknown as Db;
    const plan = planDemoCleanup(db, demo);
    const keptEnroll = (plan.cleaned.enrollments ?? []).map((e) => e.id);
    expect(keptEnroll).toEqual(['eREAL']);
  });

  it('DB ללא דמו ⇒ total=0 (אפס-השפעה ללקוח נקי)', () => {
    const clean = { families: [{ id: 'x1', name: 'משפחה אמיתית', phone: '050-1' }], supporters: [], enrollments: [], courses: [] } as unknown as Db;
    const plan = planDemoCleanup(clean, demo);
    expect(plan.total).toBe(0);
  });
});
