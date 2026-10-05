/**
 * ratchet · 🎯 «קשר הבא» מהלוח (בקשת-בעלים 6.10.2026 «שיהיה את הכפתור גם בלוח מעקב טיפול עצמו»).
 *
 * הבאג-שנמנע: אחרי «✓ הושלם» מהלוח השורה נעלמה (הכרעת-בעלים 3.9 «הושלם יורד מהלוח») ולא היה
 * איפה לקבוע «קשר הבא» בלי לפתוח כרטיס. עכשיו: (1) ברגע «✓ הושלם» השורה נשארת עם שאלת «קשר הבא?»
 * עד קביעה/דילוג; (2) בסינון «הושלם» לכל תיק כפתור 🎯 (תאריך ירוק אם נקבע). אותו מנגנון של הכרטיס
 * (store.setSupporterNext) ⇒ תזכורת-שיחה בלוח-השנה; מגודר supporters.nextdate כמו הקובייה בכרטיס.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const src = readFileSync(resolve(__dirname, '../AyinBoard.tsx'), 'utf8');

describe('לוח מעקב-הטיפול · קשר הבא 🎯', () => {
  it('מנגנון אחד — setSupporterNext מה-store, לא כתיבה ישירה', () => {
    expect(src).toContain('const setSupporterNext = useApp((s) => s.setSupporterNext);');
    expect(src).toContain("setSupporterNext(sp.id, iso, 'אחרי סיום ' + feat)");
    expect(src).not.toMatch(/upsertSupporter\(\{[^}]*nextDate/);
  });

  it('מגודר כמו הקובייה בכרטיס (supporters.nextdate) — חסר-הדגל ⇒ ברירת-מחדל פעיל, false ⇒ אפס-השפעה', () => {
    expect(src).toContain("const nextDateOn = featureOn(cfg, 'supporters.nextdate');");
    expect(src).toContain('const promptOpen = nextDateOn && isDone && nextPromptId === sp.id;');
    expect(src).toContain('{nextDateOn && isDone && !showBtn && (');
  });

  it('«✓ הושלם» מהלוח ⇒ השורה נשארת עם שאלת «קשר הבא?» (ולא רק נעלמת)', () => {
    expect(src).toContain('const finishing = a.stage === \'answer\' && !!a.answerPushed;');
    expect(src).toContain('if (finishing && nextDateOn) setNextPromptId(sp.id);');
    // השורה המוחזקת מצטרפת ל-rows רק אם היא עדיין תיק פעיל ונראה-להרשאה
    expect(src).toContain('if (nextPromptId && !rows.some((sp) => sp.id === nextPromptId)) {');
    expect(src).toContain('visible.find((sp) => sp.id === nextPromptId && ayinActive(sp.ayin))');
  });

  it('בסינון «הושלם» — כפתור 🎯 לכל תיק; תאריך-שנקבע מוצג ירוק; דילוג אפשרי', () => {
    expect(src).toContain("{sp.nextDate ? '🎯 ' + fmtDate(sp.nextDate) : '🎯 קשר הבא'}");
    expect(src).toContain("{sp.nextDate ? 'סגירה' : 'דלג'}");
    expect(src).toContain('className="ayin-next-prompt"');
  });

  it('הכרעת-בעלים 3.9 נשמרת — הושלם עדיין יורד מהלוח (ayinOnBoard), ההחזקה היא רק לתיק-הרגע', () => {
    expect(src).toContain('const active = visible.filter((sp) => ayinOnBoard(sp.ayin));');
    expect(src).toContain('useState<string | null>(null)');
  });

  it('קליק בתוך שאלת-הקשר לא פותח את הכרטיס (stopPropagation) ולא שובר את יישור-הגריד (2 ROW_GRID)', () => {
    expect(src.match(/gridTemplateColumns: ROW_GRID/g)?.length).toBe(2);
    const i = src.indexOf('className="ayin-next-prompt"');
    expect(src.slice(i, i + 120)).toContain('onClick={(e) => e.stopPropagation()}');
  });
});
