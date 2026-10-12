/**
 * ratchet — 🏡 אירוח 3: מנוע "מפקדת ההושבה" (BUILD-ORDER-HOSTING-2026-10-12) — פורט `seatingModal` של המקור,
 * כפונקציות טהורות (המקור שינה את האובייקט במקום): מילוי/משפחות/איזון/ערבוב, הושבה ידנית, שולחנות, גאומטריה, טקסט.
 */
import { describe, expect, it } from 'vitest';
import type { HostSeatPlan } from '../../../types/domain';
import {
  seatAddPerson,
  seatAddTable,
  seatAutoFill,
  seatBalance,
  seatByFamilies,
  seatClear,
  seatColorOf,
  seatDeleteTable,
  seatDupTable,
  seatFamColors,
  seatFamilies,
  seatFillTo,
  seatFromDiners,
  seatOneFamily,
  seatPlace,
  seatPool,
  seatPositions,
  seatRemovePerson,
  seatRename,
  seatRing,
  seatSetCap,
  seatSetNote,
  seatShuffle,
  seatStats,
  seatText,
  seatToggleHead,
  seatUnseat,
} from '../seating';

const plan = (): HostSeatPlan => ({
  people: [
    { id: 'sp1', name: 'כהן · מבוגר 1', kind: 'adult', guestId: 'g1' },
    { id: 'sp2', name: 'כהן · מבוגר 2', kind: 'adult', guestId: 'g1' },
    { id: 'sp3', name: 'כהן · ילד 1', kind: 'kid', guestId: 'g1' },
    { id: 'sp4', name: 'לוי · מבוגר 1', kind: 'adult', guestId: 'g2' },
    { id: 'sp5', name: 'לוי · מבוגר 2', kind: 'adult', guestId: 'g2' },
    { id: 'sp6', name: 'דוד', kind: 'adult' },
  ],
  tables: [
    { id: 'st1', name: 'שולחן 1', cap: 4, shape: 'round', chair: 'כיסא', seated: [], head: false, note: '' },
    { id: 'st2', name: 'שולחן 2', cap: 3, shape: 'rect', chair: 'ספסל', seated: [], head: false, note: '' },
  ],
});
const seatedOf = (p: HostSeatPlan) => p.tables.map((t) => t.seated);

describe('🪑 הושבה אוטומטית', () => {
  it('✨ מילוי בסבב על השולחנות; התוכנית המקורית לא משתנה (טהור)', () => {
    const p0 = plan();
    const p = seatAutoFill(p0);
    expect(seatedOf(p)).toEqual([
      ['sp1', 'sp3', 'sp5'],
      ['sp2', 'sp4', 'sp6'],
    ]);
    expect(seatedOf(p0)).toEqual([[], []]);
    expect(seatAutoFill({ ...p0, tables: [] })).toEqual({ ...p0, tables: [] });
  });

  it('👪 לפי משפחות: משפחה שלמה לשולחן שמכיל אותה (הצפוף-ביותר שמתאים); הממתין הבודד אחריהן', () => {
    const r = seatByFamilies(plan());
    // כהן (3 אנשים): שולחן-2 (3 פנויים) הוא הצפוף-ביותר שמכיל — כולם שם; לוי (2): שולחן-1 (4 פנויים); דוד — לשולחן-1
    expect(seatedOf(r.plan)).toEqual([
      ['sp4', 'sp5', 'sp6'],
      ['sp1', 'sp2', 'sp3'],
    ]);
    expect(r.placed).toBe(6);
    expect(seatOneFamily(r.plan, 'g1').placed).toBe(0); // כבר יושבים
  });

  it('⚖️ איזון — כל ממתין לשולחן הריק-ביותר; 🔀 ערבוב דטרמיניסטי עם אקראיות מוזרקת; 🧹 נקה', () => {
    const b = seatBalance(plan());
    expect(b.tables.map((t) => t.seated.length)).toEqual([3, 3]);
    const s1 = seatShuffle(plan(), () => 0.3);
    const s2 = seatShuffle(plan(), () => 0.3);
    expect(seatedOf(s1)).toEqual(seatedOf(s2));
    expect(s1.tables.flatMap((t) => t.seated).sort()).toEqual(['sp1', 'sp2', 'sp3', 'sp4', 'sp5', 'sp6']);
    expect(seatedOf(seatClear(s1))).toEqual([[], []]);
    expect(seatClear(s1).people).toHaveLength(6);
  });
});

describe('🪑 משתתפים ושולחנות', () => {
  it('הוספה/מילוי-עד-N/מחיקה (גם מהשולחן)/הורדה; ממתינים', () => {
    let p = seatAddPerson(plan(), 'אורחת');
    expect(p.people.at(-1)).toEqual({ id: 'sp7', name: 'אורחת' });
    p = seatFillTo(p, 9);
    expect(p.people.slice(-2).map((x) => x.name)).toEqual(['אורח 8', 'אורח 9']);
    p = seatAutoFill(p);
    p = seatRemovePerson(p, 'sp1');
    expect(p.people.some((x) => x.id === 'sp1')).toBe(false);
    expect(p.tables.some((t) => t.seated.includes('sp1'))).toBe(false);
    p = seatUnseat(p, 'sp2');
    expect(seatPool(p).map((x) => x.id)).toContain('sp2');
  });

  it('הושבה ידנית: עוברת שולחן; שולחן מלא ⇒ "full"; שולחן לא קיים ⇒ "none"', () => {
    let p = seatPlace(plan(), 'sp1', 'st2').plan;
    p = seatPlace(p, 'sp1', 'st1').plan;
    expect(seatedOf(p)).toEqual([['sp1'], []]);
    for (const id of ['sp2', 'sp3', 'sp4']) p = seatPlace(p, id, 'st1').plan;
    expect(seatPlace(p, 'sp5', 'st1').error).toBe('full');
    expect(seatPlace(p, 'sp5', 'nope').error).toBe('none');
  });

  it('שולחנות: הוספה (שם/כיסאות/צורה/ראש) · שכפול · מחיקה · 👑 · שם · כיסאות (מקצץ) · הערה', () => {
    let p = seatAddTable(plan(), { cap: 12, shape: 'round', head: true, name: '' });
    expect(p.tables.at(-1)).toMatchObject({ id: 'st3', name: 'שולחן 3', cap: 12, head: true, chair: 'כיסא', seated: [] });
    p = seatAutoFill(p);
    p = seatDupTable(p, 'st1');
    expect(p.tables.at(-1)).toMatchObject({ id: 'st4', name: 'שולחן 1 (2)', seated: [], head: false });
    p = seatToggleHead(p, 'st1');
    expect(p.tables[0].head).toBe(true);
    p = seatRename(p, 'st1', ' שולחן כבוד ');
    expect(p.tables[0].name).toBe('שולחן כבוד');
    expect(seatRename(p, 'st1', '  ')).toBe(p);
    p = seatSetCap(p, 'st1', '1');
    expect(p.tables[0].cap).toBe(1);
    expect(p.tables[0].seated).toHaveLength(1);
    expect(seatSetCap(p, 'st1', 'abc').tables[0].cap).toBe(1);
    p = seatSetNote(p, 'st2', 'ליד החלון');
    expect(p.tables[1].note).toBe('ליד החלון');
    expect(seatDeleteTable(p, 'st2').tables.map((t) => t.id)).toEqual(['st1', 'st3', 'st4']);
  });

  it('🔄 סנכרון מהסועדים: משתתפים מהמשפחות, השולחנות מתרוקנים', () => {
    const p = seatFromDiners({ diners: [{ guestId: 'g9', adults: 1, kids: 1 }] }, seatAutoFill(plan()), () => 'גולד');
    expect(p.people.map((x) => x.name)).toEqual(['גולד · מבוגר 1', 'גולד · ילד 1']);
    expect(seatedOf(p)).toEqual([[], []]);
  });
});

describe('🪑 מדדים · צבעים · טקסט · גאומטריה', () => {
  it('מדדים: מקומות/הושבו/ממתינים/ניצולת/חוסר; משפחות עם צבע ומונה', () => {
    const p = seatAutoFill({ ...plan(), tables: [plan().tables[1]] });
    expect(seatStats(p)).toEqual({ totSeats: 3, seatedN: 3, waiting: 3, util: 100, short: 3 });
    const fm = seatFamColors(p);
    expect(Object.keys(fm)).toEqual(['g1', 'g2']);
    expect(seatColorOf(p.people[5], fm)).toBe('var(--h-brand)');
    expect(seatColorOf({ id: 'k', name: 'ילד', kind: 'kid' }, fm)).toBe('var(--h-info)');
    expect(seatFamilies(p, fm, (id) => (id === 'g1' ? 'כהן' : 'לוי')).map((f) => [f.name, f.total, f.waiting])).toEqual([
      ['כהן', 3, 0], // שולחן יחיד בן 3 — הסבב מושיב את שלושת הראשונים
      ['לוי', 2, 2],
      ['ידני', 1, 1],
    ]);
  });

  it('טקסט ההעתקה/וואטסאפ בנוסח המקור', () => {
    const p = seatToggleHead(seatPlace(plan(), 'sp1', 'st1').plan, 'st1');
    expect(seatText(p, 'ארוחת שבת').split('\n')).toEqual([
      '🪑 תוכנית הושבה · ארוחת שבת',
      '',
      '▪ שולחן 1 (1/4) 👑',
      '1. כהן · מבוגר 1',
      '',
      '▪ שולחן 2 (0/3)',
      '',
      '⏳ ממתינים: כהן · מבוגר 2, כהן · ילד 1, לוי · מבוגר 1, לוי · מבוגר 2, דוד',
    ]);
  });

  it('גאומטריה: כיסא לכל מקום, בתוך המשטח; עגול/מלבני/מרובע במידות המקור', () => {
    for (const shape of ['round', 'rect', 'square'] as const) {
      for (const cap of [1, 4, 7, 12]) {
        const g = seatRing({ cap, shape });
        expect(g.pts, shape + cap).toHaveLength(cap);
        for (const pt of g.pts) {
          expect(pt.x).toBeGreaterThanOrEqual(0);
          expect(pt.x).toBeLessThanOrEqual(g.W);
          expect(pt.y).toBeGreaterThanOrEqual(0);
          expect(pt.y).toBeLessThanOrEqual(g.H);
        }
      }
    }
    expect(seatRing({ cap: 8, shape: 'round' })).toMatchObject({ W: 180, H: 180, surf: { round: true } });
    expect(seatRing({ cap: 10, shape: 'rect' })).toMatchObject({ W: 330, H: 150, surf: { left: 30, top: 44, width: 270, height: 62, round: false } });
    expect(seatPositions('rect', 3, 200, 150)).toEqual([
      { x: 20, y: 20 },
      { x: 180, y: 20 },
      { x: 100, y: 130 },
    ]);
  });
});
