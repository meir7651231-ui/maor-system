/**
 * ratchet — רצועת «תזכורות שהגיע זמנן» בראש לוח מעקב-הטיפול (בקשת-בעלים 13.10:
 * "שכל תזכורת שמגיעה מ-40 יום או שבוע או כל חוזר תיפתח בתחילת המעקב ברגע שהזמן שלה הגיע —
 * אבל לא במצב רישום או תשלום, אלא בתצוגה של תזכורת, ואז כשלוחצים עליה נכנסים לטיפול").
 *
 * 🐛 קודם: התזכורת הוזרקה לטבלת-השלבים כשורה רגילה עם צ'יפי רישום/תשלום, המיון יכול היה להטמין
 * אותה, והלוח סגור כברירת-מחדל ⇒ לא רואים שהגיע הזמן.
 */
import { describe, expect, it } from 'vitest';
import boardSrc from '../AyinBoard.tsx?raw';
import viewSrc from '../SupportersView.tsx?raw';

describe('⏰ רצועה נפרדת בראש הלוח', () => {
  it('לפני הטבלה, תמיד גלויה (לא תלויה בסינון-השלב), הוותיקה ראשונה', () => {
    const strip = boardSrc.indexOf("{'⏰ תזכורות שהגיע זמנן · ' + reminders.length}");
    const table = boardSrc.indexOf('{rows.length === 0 ? (');
    expect(strip).toBeGreaterThan(0);
    expect(strip).toBeLessThan(table);
    expect(boardSrc).toContain("const reminders = [...dueRem].sort((x, y) => dueRemOf(x)!.date.localeCompare(dueRemOf(y)!.date) || x.name.localeCompare(y.name, 'he'));");
    // reminders לא נגזר מ-filter — רק מ-visible (ייעוד+אזור)
    expect(boardSrc).toContain('const dueRem = visible.filter((sp) => !!dueRemOf(sp));');
  });

  it('תצוגת-תזכורת (לא שלבי רישום/תשלום): סוג-הסדרה · מספר-התזכורת · תאריך · איחור', () => {
    const i = boardSrc.indexOf('className="ayin-reminder-row"');
    const row = boardSrc.slice(i, i + 3000);
    expect(row).toContain("def.emoji + ' ' + def.label + ' · תזכורת ' + r.day + '/' + r.target");
    expect(row).toContain("(r.overdueDays ? ' · באיחור ' + r.overdueDays + ' ימים' : ' · היום')");
    expect(row).not.toContain('StageChips');
  });

  it('לחיצה על השורה / «▶ לטיפול» = כניסה לטיפול (פתיחת הכרטיס); «✓ בוצע» לא פותח (stopPropagation)', () => {
    const i = boardSrc.indexOf('className="ayin-reminder-row"');
    const row = boardSrc.slice(i, i + 3000);
    expect(row).toContain('onClick={() => props.onOpen(sp.id)}');
    expect(row).toContain('▶ לטיפול');
    const done = row.indexOf('toggleEventDone(r.id);');
    expect(row.slice(done - 80, done)).toContain('e.stopPropagation();');
  });

  it('הטבלה לא מערבבת יותר תזכורות-סדרה בשלבים', () => {
    expect(boardSrc).toContain("filter === 'all' ? [...due, ...active.filter((sp) => !due.includes(sp))]");
    expect(boardSrc).not.toContain("' הגיע הזמן · ' + fmtDate(dueR.date)");
    expect(boardSrc).not.toContain('dueRemOf(sp)?.date ||');
  });
});

describe('⏰ מונה על כותרת הלוח — גלוי גם כשהלוח סגור', () => {
  it('רכיב נפרד שצופה ב-events בעצמו (מסך-התורמים לא מתרנדר על כל שינוי-אירוע), מגודר סגולה+ייעוד', () => {
    expect(boardSrc).toContain('export function AyinDueBadge(props: { onOpen: () => void }) {');
    const i = boardSrc.indexOf('export function AyinDueBadge');
    const body = boardSrc.slice(i, i + 1500);
    expect(body).toContain("useDbWatch('supporters', 'events')");
    expect(body).toContain('if (!segulaOn) return 0;');
    expect(body).toContain('supporterVisibleForDesignations(sp, desigLimit)');
    expect(body).toContain('if (!count) return null;');
  });
  it('בכותרת הלוח במסך-התורמים; לחיצה פותחת את הלוח', () => {
    expect(viewSrc).toContain('<AyinDueBadge onOpen={() => setAyinBoardOpen(true)} />');
    expect(viewSrc).not.toMatch(/useDbWatch\([^)]*'events'/);
  });
});
