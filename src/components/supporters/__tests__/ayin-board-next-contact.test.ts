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
    // 6.10: הנושא מהטיוטה «על מה לדבר» נכנס לתזכורת; ריק ⇒ ברירת-המחדל «אחרי סיום …»
    expect(src).toContain("setSupporterNext(sp.id, iso, nextTopic.trim() || 'אחרי סיום ' + feat)");
    expect(src).not.toMatch(/upsertSupporter\(\{[^}]*nextDate/);
  });

  it('מגודר כמו הקובייה בכרטיס (supporters.nextdate) — חסר-הדגל ⇒ ברירת-מחדל פעיל, false ⇒ אפס-השפעה', () => {
    expect(src).toContain("const nextDateOn = featureOn(cfg, 'supporters.nextdate');");
    expect(src).toContain('const promptOpen = nextDateOn && isDone && nextPromptId === sp.id;');
    expect(src).toContain('{nextDateOn && isDone && !showBtn && (');
  });

  it('«✓ הושלם» מהלוח ⇒ השורה נשארת עם שאלת «קשר הבא?» (ולא רק נעלמת)', () => {
    expect(src).toContain('const finishing = a.stage === \'answer\' && !!a.answerPushed;');
    expect(src).toContain('if (finishing && nextDateOn) openNextPrompt(sp);');
    // השורה המוחזקת מצטרפת ל-rows רק אם היא עדיין תיק פעיל ונראה-להרשאה
    expect(src).toContain('if (nextPromptId && !rows.some((sp) => sp.id === nextPromptId)) {');
    expect(src).toContain('visible.find((sp) => sp.id === nextPromptId && ayinActive(sp.ayin))');
  });

  it('בסינון «הושלם» — כפתור 🎯 לכל תיק; תאריך-שנקבע מוצג ירוק; דילוג אפשרי', () => {
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

  it('🎯 «הגיע הזמן» (בקשת-בעלים 6.10) — תיק שהושלם עם קשר-הבא ≤ היום חוזר ללוח מעצמו, נגזרת-מצב (לא ההחזקה-של-הרגע)', () => {
    expect(src).toContain("nextDateOn && ayinActive(sp.ayin) && (sp.ayin!.stage || 'new') === 'done' && !!sp.nextDate && sp.nextDate <= today;");
    expect(src).toContain('const due = visible.filter(isDueNext);');
    // 6.10 (סגולה בלוח): גם תזכורות-סדרה שהגיע יומן עולות ללוח — «הגיע הזמן» של קשר-הבא נשאר ראשון
    expect(src).toContain("filter === 'all' ? [...due, ...dueRem.filter((sp) => !due.includes(sp)), ...active.filter((sp) => !dueRem.includes(sp))]");
    // היום מוזרק דרך isoToday (דטרמיניסטי), לא Date.now
    expect(src).not.toMatch(/Date\.now\(/);
  });

  it('שורת «הגיע הזמן» — צבועה, היעד מציג את קשר-הבא, וכפתור «📞 הגיע הזמן»; פעולות: קשר-בוצע (מנקה+מוריד מהלוח) · מחזור-חדש (מגודר supporters.ayin.restart)', () => {
    expect(src).toContain("background: dueNext || dueR ? '#fff4ea' : '#fff'");
    expect(src).toContain("{(dueNext ? '📞 ' : '🎯 ') + fmtDate(sp.nextDate)}");
    expect(src).toContain("{dueNext ? '📞 הגיע הזמן' : sp.nextDate ? '🎯 ' + fmtDate(sp.nextDate) : '🎯 קשר הבא'}");
    expect(src).toContain("const restartOn = featureOn(cfg, 'supporters.ayin.restart');");
    expect(src).toContain('{dueNext && restartOn && (');
    // «הקשר בוצע» = ניקוי דרך אותו מנגנון (מסיר גם את תזכורת-הלוח — unlinkEvent ב-store)
    expect(src).toContain("setSupporterNext(sp.id, '', '');");
    // 6.10 («חסר שמירה וטופל»): «✓ טופל» תמיד זמין (לא רק כשהגיע הזמן) — מנקה תאריך+תזכורת+הערה
    expect(src).toContain("{dueNext ? '✓ טופל · הקשר בוצע' : '✓ טופל'}");
    expect(src).toContain("setSupporterNextNote(sp.id, '');");
    expect(src).toContain('↻ מחזור טיפול חדש');
  });

  it('מיון «יעד קרוב» — לתיק שהושלם היעד הוא קשר-הבא (ולא nextTalk)', () => {
    // 6.10: תזכורת-סדרה שהגיע יומה קודמת ליעד; תומך/ת בלי תיק (?.) לא מפיל את המיון
    expect(src).toContain("const tgt = (sp: Supporter) => dueRemOf(sp)?.date || ((sp.ayin?.stage || 'new') === 'done' ? sp.nextDate : sp.ayin?.nextTalk) || '9999';");
  });
});

describe('📝 «על מה לדבר» + 💾 שמירה + ✓ טופל בלוח (בקשת-בעלים 6.10 «בקשר הבא חסר במעקב טיפול על מה לדבר שמירה וטופל»)', () => {
  it('טיוטת-הנושא נטענת מ-sp.nextNote בפתיחת-השאלה ונשמרת דרך store.setSupporterNextNote (אותו שדה של הכרטיס)', () => {
    expect(src).toContain('const setSupporterNextNote = useApp((s) => s.setSupporterNextNote);');
    expect(src).toContain("setNextTopic(sp.nextNote || '');");
    expect(src).toContain('onBlur={() => setSupporterNextNote(sp.id, nextTopic)}');
    expect(src).toContain('💾 שמירה');
    expect(src).toContain('aria-label="על מה לדבר בפעם הבאה"');
  });
  it('store.setSupporterNextNote — מעדכן nextNote ומרענן notes של תזכורת-הלוח המקושרת; בלי שינוי = no-op', () => {
    const store = readFileSync(resolve(__dirname, '../../../store/useApp.ts'), 'utf8');
    expect(store).toContain('setSupporterNextNote(id, note) {');
    expect(store).toContain("if (v === (sp.nextNote || '')) return;");
    expect(store).toContain("get().upsertEvent({ ...linked, notes: base + (v ? ' · 📝 ' + v : '') });");
  });
});
