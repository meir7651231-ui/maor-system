/**
 * 🔒 ratchet — 🧬 מנוע שנוצר חוזר לארגז (ATOMS-CHAIN, 14.10.2026).
 * הבעלים: "התוצאה היא מנוע חדש שחוזר לארגז. מנועים קטנים משתרשרים: מחלק לחלקים שווים ואז מחבר דברים צמודים = תורים באורך משתנה."
 * הבאג שננעל: "✨ מנוע תורים" נוצר ונרשם — אבל אי אפשר היה לקחת אותו כמנוע ולחבר אליו עוד חלק; השרשראות היו רק הצעות.
 *  (א) החוזה: מה כל חלק נותן (ATOM_OUTPUT) + outputKind · Capability.parent? תוספתי.
 *  (ב) מנוע שנוצר = כרטיס-מנוע עם מקום אחד (הפלט שלו); optionsFor עובד עליו בלי שינוי; רק חלקים מהסוג של הפלט.
 *  (ג) התוצאות האמיתיות של השרשראות — 5 הנדרשות, שורה-שורה; פלט ריק של ההורה ⇒ null.
 *  (ד) בטיחות: עד 3 דורות · חסין-מעגל · יתום ⇒ "הוסר" · הסרת הורה עם ילדים חסומה · לוג עם כל הדרך · capShape צורה-בלבד.
 *  (ה) שמות: בלי המילים האסורות בכל מחרוזת חדשה שהמשתמש רואה.
 */
import { describe, expect, it } from 'vitest';
import type { Db, HostStaff } from '../../../types/domain';
import { B, fixtureDb, HOST_RECORDS, NOW_MS } from '../../switchboard/__tests__/fixture';
import { ATOM_IDS, ATOM_OUTPUT, capabilityId, optionsFor, outputKind, type AtomId, type Capability } from '../contract';
import { atomCard } from '../cards';
import { capabilityLabel, capUiChange, sanitizeCapabilities, suggestedChildName, withCapability, withoutCapability } from '../capabilities';
import { healCapabilitiesIn } from '../capShape';
import { capHostCard, capStatus, childCapability, childProblem, generationOf, MAX_GENERATIONS, outKindOf, outPlaceId, outputPlaceFor, outputPlaces, parseCapId, valueOf } from '../chain';
import { chainChildParams } from '../chainPreview';
import { previewOf, type PreviewCtx } from '../preview';
import * as steps from '../../../components/enginebox/atoms/AtomSteps';

const STAFF = (id: string, name: string, role: string): HostStaff => ({ id, kind: 'staff', name, role, phone: '', createdAt: 'x', updatedAt: 'x' });
function orgDb(): Db {
  const base = fixtureDb();
  return {
    ...base,
    hostBookings: [...base.hostBookings, B({ id: 'hb9', guestId: 'hg1', unitId: 'hu1', checkIn: '2026-10-25', checkOut: '2026-10-28', charges: [{ id: 'c1', kind: 'stay', label: 'לינה', amount: 1200 }], payments: [] })],
    hostRecords: [...base.hostRecords, STAFF('hs1', 'דנה', 'ניקיון'), STAFF('hs2', 'רבקה', 'ניקיון')],
  };
}
const root = (place: string, atom: AtomId, params: Record<string, number | string> = {}, name = 'מנוע ' + atom): Capability => ({ id: capabilityId('bookings', place, atom), engine: 'bookings', place, atom, params, name });
const TURNS = root('bookings.turnover', 'divide', {}, 'מנוע תורים');
const FREE = root('bookings.nights', 'merge', {}, 'מנוע לילות פנויים צמודים');
const kid = (parent: Capability, atom: AtomId, params: Record<string, number | string> = {}, name = 'x') => childCapability(parent, outputPlaceFor(parent, atom)!.id, atom, params, name);
const ctx = (caps: Capability[], db: Partial<Db> | null = orgDb()): PreviewCtx => ({ db, nowMs: NOW_MS, caps });
const GUESTS = HOST_RECORDS.filter((r) => r.kind === 'guest').map((g) => (g as { name: string }).name);

describe('🧬 (א) החוזה — מה כל חלק נותן', () => {
  it('הטבלה המפורשת; round/offset נותנים את מה שקיבלו', () => {
    expect(ATOM_OUTPUT).toEqual({ divide: 'sequence', merge: 'sequence', next: 'times', round: 'same', offset: 'same', escalate: 'sequence', rotate: 'sequence', fuzzy: 'text' });
    expect(Object.keys(ATOM_OUTPUT)).toEqual([...ATOM_IDS]);
    expect(outputKind('round', 'amount')).toBe('amount');
    expect(outputKind('offset', 'times')).toBe('times');
    expect(outputKind('divide', 'span')).toBe('sequence');
    expect(outputKind('next', 'sequence')).toBe('times');
  });
});

describe('🧬 (ב) מנוע שנוצר הוא מנוע', () => {
  it('מקום אחד — הפלט שלו, בשם פשוט ובסוג של החוזה; optionsFor בלי שינוי', () => {
    const host = capHostCard(TURNS, [TURNS])!;
    expect(host.emoji).toBe('✨');
    expect(host.name).toBe('מנוע תורים');
    expect(host.places).toHaveLength(1);
    expect(host.places[0]).toMatchObject({ id: outPlaceId(TURNS.id), name: 'התורים של מנוע תורים', kind: 'sequence' });
    expect(host.places[0].kind).toBe(outKindOf(TURNS.id));
    const offered = ATOM_IDS.filter((a) => optionsFor(atomCard(a)!, host).length);
    expect(offered).toEqual(['merge', 'next', 'rotate']);
    // כל מה שמוצע — מהסוג של הפלט
    for (const a of offered) expect(atomCard(a)!.worksOn).toContain('sequence');
  });

  it('🔗 בלילות: הפלט (רשימה) + כל חלון מתחילתו ועד סופו — כדי ש-✂️ יחלק את הזמן הפנוי', () => {
    const host = capHostCard(FREE, [FREE])!;
    expect(host.places.map((p) => [p.kind, p.name])).toEqual([
      ['sequence', 'החלונות הפנויים של מנוע לילות פנויים צמודים'],
      ['span', 'כל חלון פנוי של מנוע לילות פנויים צמודים, מתחילתו ועד סופו'],
    ]);
    expect(ATOM_IDS.filter((a) => optionsFor(atomCard(a)!, host).length)).toEqual(['divide', 'next', 'rotate']);
  });

  it('מזהה, דור וערך — נקראים מהמזהה', () => {
    const tm = kid(TURNS, 'merge');
    expect(tm.id).toBe('bookings:bookings.turnover:divide>merge');
    expect(tm.parent).toBe(TURNS.id);
    expect(parseCapId(tm.id)).toEqual({ root: TURNS.id, engine: 'bookings', place: 'bookings.turnover', atoms: ['divide', 'merge'] });
    expect(generationOf(tm.id)).toBe(2);
    expect(valueOf(tm.id)).toBe('slots');
    expect(valueOf(kid(tm, 'next').id)).toBe('moments');
    expect(parseCapId('a:b')).toBeNull();
    expect(parseCapId('bookings:x:divide>nope')).toBeNull();
  });
});

describe('🧬 (ג) התוצאות האמיתיות של השרשראות', () => {
  it('✂️⇒🔗 תורים באורך משתנה', () => {
    const tm = kid(TURNS, 'merge');
    expect(previewOf(tm, ctx([TURNS]))).toEqual({
      title: 'תורים באורך משתנה · 11:00–15:00',
      lines: ['12 תורים של 20 דקות בחלון 11:00–15:00', 'תור של 2 צמודים = 40 דקות · 11:00–11:40', 'תור של 3 צמודים = 60 דקות · 11:00–12:00', 'יחידה גדולה ⇒ 6 תורים ארוכים: 11:00–11:40, 11:40–12:20, 12:20–13:00…'],
    });
    // הפרטים של ההורה נלקחים מהרשימה: גודל 40 ⇒ 6 תורים
    const t40 = { ...TURNS, params: { by: 'size', size: 40, gap: 0 } };
    expect(previewOf(tm, ctx([t40]))!.lines[0]).toBe('6 תורים של 40 דקות בחלון 11:00–15:00');
  });

  it('🔗⇒⏭️ החלון הפנוי הבא של N לילות', () => {
    expect(previewOf(kid(FREE, 'next', { minLength: 3 }), ctx([FREE]))).toEqual({
      title: 'החלון הפנוי הבא של 3 לילות',
      lines: ['בית ההארחה · 3 לילות פנויים ברצף מ-15/10 עד 18/10', 'דירת הנחל · 3 לילות פנויים ברצף מ-16/10 עד 19/10', 'צימר הגפן · 3 לילות פנויים ברצף מ-18/10 עד 21/10'],
    });
  });

  it('🔗⇒✂️ חלוקה הוגנת של הזמן הפנוי', () => {
    expect(previewOf(kid(FREE, 'divide'), ctx([FREE]))).toEqual({
      title: 'חלוקה הוגנת של הזמן הפנוי',
      lines: ['צימר הגפן · 2 לילות פנויים ⇒ דנה 14/10 · רבקה 15/10', 'בית ההארחה · 5 לילות פנויים ⇒ דנה 15/10–17/10 · רבקה 18/10–19/10', 'צימר הגפן · 7 לילות פנויים ⇒ דנה 18/10–21/10 · רבקה 22/10–24/10'],
    });
  });

  it('✂️⇒🔄 התורים לאנשי הצוות בתורות · ✂️⇒⏭️ התור הבא', () => {
    expect(previewOf(kid(TURNS, 'rotate', { by: 'item' }), ctx([TURNS]))!.lines.slice(0, 3)).toEqual(['11:00–11:20 ⇒ דנה', '11:20–11:40 ⇒ רבקה', '11:40–12:00 ⇒ דנה']);
    expect(previewOf(kid(TURNS, 'next'), ctx([TURNS]))).toEqual({ title: 'התור הבא', lines: ['היום 12:20–12:40'] });
  });

  it('דור שלישי: ✂️⇒🔗⇒⏭️ התורים הארוכים הבאים', () => {
    const tm = kid(TURNS, 'merge');
    expect(previewOf(kid(tm, 'next', { count: 2 }), ctx([TURNS, tm]))).toEqual({ title: 'התורים הבאים', lines: ['היום 12:20–13:00', 'היום 13:00–13:40'] });
  });

  it('פלט ריק של ההורה ⇒ null (כן) · הורה חסר ⇒ null · בלי שמות אורחים', () => {
    const empty = { ...orgDb(), hostUnits: [] };
    expect(previewOf(kid(TURNS, 'merge'), ctx([TURNS], empty))).toBeNull();
    expect(previewOf(kid(FREE, 'next'), ctx([FREE], empty))).toBeNull();
    expect(previewOf(kid(TURNS, 'merge'), ctx([]))).toBeNull();
    const all = [kid(TURNS, 'merge'), kid(TURNS, 'rotate'), kid(TURNS, 'next'), kid(FREE, 'next'), kid(FREE, 'divide'), kid(FREE, 'rotate')]
      .map((c) => JSON.stringify(previewOf(c, ctx([TURNS, FREE]))))
      .join('\n');
    for (const g of GUESTS) expect(all.includes(g), g).toBe(false);
  });

  it('"שמור כמנוע" ל-🔗⇒⏭️: N כמו בשרשרת המוצעת', () => {
    expect(chainChildParams('bookings:merge>next', [])).toEqual({ minLength: 3 });
    expect(chainChildParams('bookings:merge>next', [{ ...FREE, params: { minLength: 4 } }])).toEqual({ minLength: 4 });
    expect(chainChildParams('bookings:divide>merge', [])).toEqual({});
  });
});

describe('🧬 (ד) בטיחות', () => {
  it('עד 3 דורות: לדור השלישי אין מקום לבנות עליו; דור רביעי לא נוצר', () => {
    const g2 = kid(TURNS, 'merge');
    const g3 = kid(g2, 'merge');
    expect(MAX_GENERATIONS).toBe(3);
    expect(outputPlaces(g3)).toEqual([]);
    const list = [TURNS, g2, g3];
    const g4 = childCapability(g3, outPlaceId(g3.id), 'merge', {}, 'x');
    expect(childProblem(g4, list)).not.toBeNull();
    expect(withCapability(list, g4)).toBeNull();
  });

  it('יצירה: ההורה חייב להיות שמור, והחלק חייב להתחבר לפלט שלו', () => {
    const tm = kid(TURNS, 'merge');
    expect(withCapability([], tm)).toBeNull();
    const r = withCapability([TURNS], tm)!;
    expect(r.list.map((c) => c.id)).toEqual([TURNS.id, tm.id]);
    expect(r.cap.parent).toBe(TURNS.id);
    // ✂️ לא מתחבר לתורים (רשימה) — גם אם מנסים בכוח
    expect(withCapability([TURNS], { ...childCapability(TURNS, outPlaceId(TURNS.id), 'divide', {}, 'x') })).toBeNull();
    // מקום שאינו פלט של ההורה ⇒ נדחה כבר בצורה
    expect(withCapability([TURNS], { ...tm, place: 'bookings.nights' })).toBeNull();
  });

  it('חסין-מעגל: הורה שמצביע על הצאצא ⇒ bad; יתום ⇒ orphan ואין כרטיס', () => {
    const a = { ...kid(TURNS, 'merge'), parent: 'X>next' };
    const b = { id: 'X>next', parent: a.id } as Capability;
    expect(capStatus(a, [a, b])).toBe('bad');
    const tm = kid(TURNS, 'merge');
    expect(capStatus(tm, [tm])).toBe('orphan');
    expect(capHostCard(tm, [tm])).toBeNull();
    // יתום נשאר ברשימה המחוטאת (כדי שאפשר יהיה להסיר אותו)
    expect(sanitizeCapabilities([tm]).map((c) => c.id)).toEqual([tm.id]);
    expect(withoutCapability([tm], tm.id)!.list).toEqual([]);
  });

  it('הסרת הורה שיש מנוע שבנוי עליו — חסומה (בלי הסרה-בשרשרת); אחרי הילד — מותרת', () => {
    const tm = kid(TURNS, 'merge', {}, 'מנוע תורים באורך משתנה');
    expect(withoutCapability([TURNS, tm], TURNS.id)).toBeNull();
    expect(capUiChange({ capabilities: [TURNS, tm] }, { id: TURNS.id }, false)).toBeNull();
    const r = withoutCapability([TURNS, tm], tm.id)!;
    expect(withoutCapability(r.list, TURNS.id)!.list).toEqual([]);
  });

  it('שורת-הלוג עם כל הדרך', () => {
    const tm = kid(TURNS, 'merge', {}, 'מנוע תורים באורך משתנה');
    const r = capUiChange({ capabilities: [TURNS] }, tm, true)!;
    expect(r.patch.capabilities!.map((c) => c.id)).toEqual([TURNS.id, tm.id]);
    expect({ act: r.act, what: r.what }).toEqual({
      act: 'מנוע חדש',
      what: 'מנוע תורים באורך משתנה (מנהל ההזמנות · חלון הניקיון · ✂️ ← 🔗)',
    });
    expect(capabilityLabel(TURNS)).toBe('מנוע תורים (מנהל ההזמנות · חלון הניקיון · ✂️ חלוקה)');
  });

  it('capShape — צורה בלבד: parent נשאר כמו שהוא (אותה הפניה)', () => {
    const ui = { capabilities: [TURNS, kid(TURNS, 'merge')] };
    expect(healCapabilitiesIn(ui)).toBe(ui);
  });
});

describe('🧬 (ה) שמות — עברית פשוטה, בלי המילים האסורות', () => {
  const BANNED = [/מיזוג/, /ניתוב/, /הסלמה/, /סלחני/, /יחסי/, /אטום/, /(?<!ב)רצף/, /טווח/];
  it('כל מחרוזת חדשה שהמשתמש רואה', () => {
    const tm = kid(TURNS, 'merge');
    const visible: string[] = [
      steps.SAVE_CHAIN_TEXT, steps.SAVED_CHAIN_TEXT, steps.BUILD_ON_TEXT, steps.BUILT_ON_TEXT, steps.ORPHAN_TEXT,
      steps.NOTHING_FITS_TEXT, steps.MAX_GEN_TEXT, steps.CREATED_HOST_HINT, steps.blockedText(['מנוע תורים באורך משתנה']),
    ];
    for (const c of [TURNS, FREE, tm, root('bookings.arrivals', 'next')]) {
      const h = capHostCard(c, [TURNS, FREE, tm, c]);
      if (!h) continue;
      visible.push(h.computes);
      for (const p of h.places) visible.push(p.name, ...Object.values(p.results));
      for (const a of ATOM_IDS) visible.push(suggestedChildName(c, a));
    }
    for (const c of [kid(TURNS, 'merge'), kid(TURNS, 'rotate'), kid(TURNS, 'next'), kid(FREE, 'next'), kid(FREE, 'divide'), kid(FREE, 'rotate')]) {
      const p = previewOf(c, ctx([TURNS, FREE]))!;
      visible.push(p.title, ...p.lines);
    }
    for (const t of visible) for (const w of BANNED) expect(w.test(t), t).toBe(false);
    expect(steps.blockedText(['מנוע תורים באורך משתנה'])).toBe('קודם הסירו את ✨ מנוע תורים באורך משתנה שבנוי עליו');
    expect(suggestedChildName(TURNS, 'merge')).toBe('מנוע תורים באורך משתנה');
  });
});
