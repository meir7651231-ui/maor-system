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
import { segulaStatus } from '../lib';

const src = readFileSync(resolve(__dirname, '../AyinBoard.tsx'), 'utf8');

describe('לוח מעקב-הטיפול · 🕯 40 יום', () => {
  it('מנגנון אחד — seedSegulaReminders מה-store (לא כתיבה ישירה לאירועים), היום מוזרק (today), מטרה «זיווג»', () => {
    expect(src).toContain('const seedSegula = useApp((s) => s.seedSegulaReminders);');
    expect(src).toContain("seedSegula(sp.id, today, 'זיווג');");
    expect(src).not.toMatch(/upsertEvent\(/);
    expect(src).not.toMatch(/Date\.now\(/);
  });
  it('מגודר באותו דגל כמו הכרטיס (supporters.segula) — לא core.taxreceipt', () => {
    expect(src).toContain("const segulaOn = featureOn(cfg, 'supporters.segula');");
    expect(src).toContain('{segulaOn && (() => {');
    expect(src).not.toContain("featureOn(cfg, 'core.taxreceipt')");
  });
  it('מצב-הסגולה נגזר מאירועי-הלוח (segulaStatus) ⇒ events נצפה ב-useDbWatch (חוזה db-watch)', () => {
    expect(src).toContain("const db = useDbWatch('supporters', 'events');");
    expect(src).toContain('const seg = segulaStatus(db.events, sp.id, today);');
  });
  it('פעילה ⇒ צ\'יפ «🕯 יום N/40» (לא כפתור-זריעה); לא-פעילה ⇒ כפתור «🕯 40 יום» עם stopPropagation (לא פותח כרטיס)', () => {
    expect(src).toContain("{'🕯 יום ' + seg.day + '/' + seg.target}");
    expect(src).toContain('🕯 40 יום');
    const i = src.indexOf("seedSegula(sp.id, today, 'זיווג');");
    expect(src.slice(i - 80, i)).toContain('e.stopPropagation();');
  });
  it('יישור-הגריד נשמר (2 ROW_GRID) — הכפתור נכנס לעמודת-הפעולה הקיימת, לא עמודה חדשה', () => {
    expect(src.match(/gridTemplateColumns: ROW_GRID/g)?.length).toBe(2);
    expect(src).toContain("flexDirection: 'column', gap: 4, alignItems: 'stretch'");
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
