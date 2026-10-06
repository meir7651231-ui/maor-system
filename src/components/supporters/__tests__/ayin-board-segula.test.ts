/**
 * ratchet · 🕯 סגולת 40 יום מלוח מעקב-הטיפול (בקשת-בעלים 6.10.2026 «תכניס את הכפתור בלוח מעקב טיפול»).
 *
 * כל שורה בלוח מקבלת כפתור «🕯 40 יום» — אותו מנגנון של הכרטיס (store.seedSegulaReminders: 5 תזכורות-לוח
 * + קשר-הבא), מגודר באותו דגל (supporters.segula, חסר=דלוק; false ⇒ אפס-השפעה). שורה עם סגולה פעילה
 * מציגה צ'יפ-מצב «🕯 יום N/40» במקום הכפתור (לא זורעים פעמיים — אותו שומר כמו בכרטיס).
 * מצב-הסגולה נגזר מ-db.events ⇒ המפתח 'events' חייב להירשם ב-useDbWatch (חוזה db-watch: מפתח חסר = UI-עומד).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { emptyDb, type OrgEvent } from '../../../types/domain';
import { activeRecurSeries, dueRecurReminder, segulaStatus } from '../lib';

const src = readFileSync(resolve(__dirname, '../AyinBoard.tsx'), 'utf8');

describe('לוח מעקב-הטיפול · 🕯 40 יום', () => {
  it('מנגנון אחד — seedSegulaReminders מה-store (לא כתיבה ישירה לאירועים), היום מוזרק (today), מטרה «זיווג», כל 4 המצבים', () => {
    expect(src).toContain('const seedSegula = useApp((s) => s.seedSegulaReminders);');
    expect(src).toContain("seedSegula(sp.id, today, 'זיווג', m.key as RecurMode);");
    expect(src).toContain('{RECUR_MODES.map((m) => (');
    expect(src).not.toMatch(/upsertEvent\(/);
    expect(src).not.toMatch(/Date\.now\(/);
  });
  it('מגודר באותו דגל כמו הכרטיס (supporters.segula) — לא core.taxreceipt', () => {
    expect(src).toContain("const segulaOn = featureOn(cfg, 'supporters.segula');");
    expect(src).toContain('{segulaOn && series.length === 0 && !dueR && (');
    expect(src).not.toContain("featureOn(cfg, 'core.taxreceipt')");
  });
  it('מצב-הסגולה נגזר מאירועי-הלוח (segulaStatus) ⇒ events נצפה ב-useDbWatch (חוזה db-watch)', () => {
    expect(src).toContain("const db = useDbWatch('supporters', 'events');");
    expect(src).toContain('const series = segulaOn ? activeRecurSeries(db.events, sp.id, today) : [];');
    expect(src).toContain('const dueRemOf = (sp: Supporter) => (segulaOn ? dueRecurReminder(db.events, sp.id, today) : null);');
  });
  it('פעילה ⇒ צ\'יפ-מצב לכל סדרה (לא כפתור-זריעה); אין סדרה ⇒ «🕯 40 יום ▾» + תפריט 4 מצבים; stopPropagation (לא פותח כרטיס)', () => {
    expect(src).toContain("{recurDef(mode).emoji + (mode === 'segula' ? ' יום ' : ' ') + st.day + '/' + st.target}");
    expect(src).toContain('🕯 40 יום ▾');
    expect(src).toContain('className="ayin-recur-menu" onClick={(e) => e.stopPropagation()}');
    const i = src.indexOf("seedSegula(sp.id, today, 'זיווג', m.key as RecurMode);");
    expect(src.slice(i - 80, i)).toContain('e.stopPropagation();');
  });
  it('«הגיע הזמן» לתזכורת-סדרה (6.10 «האם הוא קופץ בלוח כמו הקשר הבא»): שורה עולה ללוח גם בלי תיק, צבועה, «✓ בוצע» דרך toggleEventDone', () => {
    expect(src).toContain('const dueRem = visible.filter((sp) => !!dueRemOf(sp));');
    expect(src).toContain("filter === 'all' ? [...due, ...dueRem.filter((sp) => !due.includes(sp)), ...active.filter((sp) => !dueRem.includes(sp))]");
    expect(src).toContain('const toggleEventDone = useApp((s) => s.toggleEventDone);');
    expect(src).toContain('toggleEventDone(dueR.id);');
    expect(src).toContain("background: dueNext || dueR ? '#fff4ea' : '#fff',");
    expect(src).toContain("{recurDef(dueR.mode).emoji + ' הגיע הזמן · ' + fmtDate(dueR.date)}");
    // תומך/ת בלי תיק-טיפול לא מפיל את הלוח (sp.ayin! הוסר מהשורה ומהמיון)
    expect(src).toContain('const a = sp.ayin ?? emptyAyin();');
    expect(src).toContain('const showBtn = hasCase && ayinActionVisible(a);');
    expect(src).not.toContain('const a = sp.ayin!;');
    expect(src).not.toContain('const aa = sa.ayin!;');
  });
  it('יישור-הגריד נשמר (2 ROW_GRID) — הכפתור נכנס לעמודת-הפעולה הקיימת, לא עמודה חדשה', () => {
    expect(src.match(/gridTemplateColumns: ROW_GRID/g)?.length).toBe(2);
    expect(src).toContain("flexDirection: 'column', gap: 4, alignItems: 'stretch'");
  });
});

describe('dueRecurReminder / activeRecurSeries — מה מקפיץ שורה ללוח', () => {
  const mk = (id: string, date: string, notes: string, done = false): OrgEvent =>
    ({ id, title: 'x', date, time: '', type: 'call', customType: '', notes, price: 0, roomId: '', famId: '', spId: 's1', priority: 'green', done }) as unknown as OrgEvent;
  const seg = ['2026-10-07', '2026-10-13', '2026-10-27', '2026-11-10', '2026-11-15'].map((d, i) => mk('g' + i, d, 'סגולת 40 יום · זיווג'));
  it('בלי אירועים ⇒ null; תזכורת עתידית ⇒ null; תזכורת שהגיע יומה ⇒ מוחזרת עם mode/day/target', () => {
    expect(dueRecurReminder([], 's1', '2026-10-06')).toBeNull();
    expect(dueRecurReminder(seg, 's1', '2026-10-06')).toBeNull();
    const d = dueRecurReminder(seg, 's1', '2026-10-07');
    expect(d).toMatchObject({ id: 'g0', date: '2026-10-07', mode: 'segula', day: 1, target: 40, overdueDays: 0 });
  });
  it('באיחור ⇒ overdueDays; סומנה ✓ ⇒ הבאה; שתי סדרות ⇒ המוקדמת-ביותר', () => {
    expect(dueRecurReminder(seg, 's1', '2026-10-10')?.overdueDays).toBe(3);
    const done0 = seg.map((e) => (e.id === 'g0' ? { ...e, done: true } : e));
    expect(dueRecurReminder(done0, 's1', '2026-10-10')).toBeNull();
    expect(dueRecurReminder(done0, 's1', '2026-10-13')?.id).toBe('g1');
    const weekly = [mk('w1', '2026-10-09', 'חזרה שבועית ×2'), mk('w2', '2026-10-16', 'חזרה שבועית ×2')];
    const both = dueRecurReminder([...done0, ...weekly], 's1', '2026-10-13');
    expect(both?.id).toBe('w1'); // 9.10 לפני 13.10
    expect(both?.mode).toBe('weekly');
    expect(both?.target).toBe(2);
  });
  it('activeRecurSeries — רק סדרות פעילות, לפי מצב; אירוע שאינו סדרה לא נספר', () => {
    const weekly = [mk('w1', '2026-10-09', 'חזרה שבועית ×2'), mk('w2', '2026-10-16', 'חזרה שבועית ×2')];
    const other = [mk('o', '2026-10-08', 'פגישה')];
    expect(activeRecurSeries([...seg, ...weekly, ...other], 's1', '2026-10-06').map((x) => x.mode)).toEqual(['segula', 'weekly']);
    expect(activeRecurSeries([...seg, ...weekly], 's1', '2026-10-20').map((x) => x.mode)).toEqual(['segula']); // השבועית הסתיימה
    expect(activeRecurSeries(other, 's1', '2026-10-06')).toEqual([]);
  });
});

describe('segulaStatus — מה הצ\'יפ בלוח מציג', () => {
  const ev = (id: string, date: string, done = false): OrgEvent =>
    ({ id, title: 'x', date, time: '', type: 'call', customType: '', notes: 'סגולת 40 יום · זיווג', price: 0, roomId: '', famId: '', spId: 's1', priority: 'green', done }) as unknown as OrgEvent;
  it('בלי אירועים ⇒ לא פעילה (הכפתור מוצג); עם 5 אירועים מהיום ⇒ פעילה, יום 0/40, הסיום = האירוע האחרון', () => {
    expect(segulaStatus(emptyDb().events, 's1', '2026-10-06').active).toBe(false);
    const evs = [ev('a', '2026-10-07'), ev('b', '2026-10-13'), ev('c', '2026-10-27'), ev('d', '2026-11-10'), ev('e', '2026-11-15')];
    const st = segulaStatus(evs, 's1', '2026-10-06');
    expect(st.active).toBe(true);
    expect(st.day).toBe(0);
    expect(st.target).toBe(40);
    expect(st.end).toBe('2026-11-15');
    expect(segulaStatus(evs, 's1', '2026-10-20').day).toBe(14);
    expect(segulaStatus(evs, 's1', '2026-11-16').active).toBe(false); // אחרי הסיום ⇒ הכפתור חוזר
  });
});
