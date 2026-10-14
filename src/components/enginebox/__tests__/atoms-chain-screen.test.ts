/**
 * 🔒 ratchet — 🧬 המסך: מנוע שנוצר נפתח כמנוע (ATOMS-CHAIN, 14.10.2026).
 *  (א) המקור: capHost/capState/blockedBy; "שמור כמנוע" יוצר קודם את הראשון ורק אחרי שנשמר — את הבנוי עליו; קיים ⇒ רק הבנוי; מורה ⇒ כלום.
 *  (ב) המסך: כרטיס ✨ בגריד המנועים · "איזה חלק לחבר אל ✨ מנוע תורים?" מציע רק חלקים מהסוג של הפלט · השאלה מראה את המקום
 *      היחיד עם התוצאה האמיתית · יתום ⇒ "המנוע שעליו הוא בנוי הוסר" ורק "הסר" · "שמור כמנוע" / "נשמר כמנוע ✓" · מורה בלי כפתורים.
 *  (ג) המזהה של המסך = המזהה של השכבה (naming.buildChildCapability ≡ chain.childId).
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Db, HostStaff } from '../../../types/domain';
import { fixtureDb, NOW_MS } from '../../../lib/switchboard/__tests__/fixture';
import { capabilityId, type Capability } from '../../../lib/atoms/contract';
import { childCapability, childId, outPlaceId } from '../../../lib/atoms/chain';
import { atomCard } from '../../../lib/atoms/cards';
import { engineCard } from '../../../lib/atoms/engines';
import { atomsSource } from '../atoms/source';
import { AtomsBody } from '../atoms/AtomsBody';
import { buildChildCapability } from '../atoms/naming';
import { ORPHAN_TEXT, SAVE_CHAIN_TEXT, SAVED_CHAIN_TEXT } from '../atoms/AtomSteps';

const STAFF = (id: string, name: string): HostStaff => ({ id, kind: 'staff', name, role: 'ניקיון', phone: '', createdAt: 'x', updatedAt: 'x' });
const TURNS: Capability = { id: capabilityId('bookings', 'bookings.turnover', 'divide'), engine: 'bookings', place: 'bookings.turnover', atom: 'divide', params: {}, name: 'מנוע תורים' };
const TM = childCapability(TURNS, outPlaceId(TURNS.id), 'merge', {}, 'מנוע תורים באורך משתנה');
const DB = (caps: Capability[] = []): Db => {
  const b = fixtureDb();
  return { ...b, hostRecords: [...b.hostRecords, STAFF('hs1', 'דנה'), STAFF('hs2', 'רבקה')], ui: { ...b.ui, capabilities: caps } };
};
const src = (caps: Capability[] = [TURNS], over: Partial<Parameters<typeof atomsSource>[0]> = {}) =>
  atomsSource({ db: DB(caps), config: null, nowMs: NOW_MS, canEdit: true, create: vi.fn(), remove: vi.fn(), ...over });
const body = (s: ReturnType<typeof src>, initial?: Parameters<typeof AtomsBody>[0]['initial']) => renderToStaticMarkup(createElement(AtomsBody, { source: s, initial }));
/** הטקסט בלי תגיות (ה-bdi של המספרים) ובלי הערות-React. */
const text = (h: string) => h.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, '');
const esc = (id: string) => id.replace(/>/g, '&gt;');

describe('🧬 (א) המקור', () => {
  it('capHost · capState · blockedBy', () => {
    const s = src([TURNS, TM]);
    expect(s.capHost!(TURNS.id)!.places.map((p) => p.name)).toEqual(['התורים של מנוע תורים']);
    expect(s.capState!(TM.id)).toBe('ok');
    expect(s.blockedBy!(TURNS.id)).toEqual(['מנוע תורים באורך משתנה']);
    expect(s.blockedBy!(TM.id)).toEqual([]);
    const orphan = src([TM]);
    expect(orphan.capState!(TM.id)).toBe('orphan');
    expect(orphan.capHost!(TM.id)).toBeNull();
  });

  it('create של מנוע בנוי ⇒ השם לפי ההורה', () => {
    const create = vi.fn();
    src([TURNS], { create }).create({ ...TM, name: 'x' });
    expect(create).toHaveBeenCalledWith({ ...TM, name: 'מנוע תורים באורך משתנה' });
  });

  it('"שמור כמנוע": הראשון ⇒ ורק אחרי שנשמר ⇒ הבנוי עליו; קיים ⇒ רק הבנוי; מורה ⇒ כלום', async () => {
    const order: string[] = [];
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const create = vi.fn((c: Capability) => {
      order.push(c.id);
      return c.parent ? Promise.resolve(true) : gate.then(() => true);
    });
    const s = src([], { create });
    const chains = s.chains('bookings');
    expect(chains.map((c) => c.canSave)).toEqual([true, true, true]);
    expect(s.saveChain!('bookings', 0)).toBe(TM.id);
    await Promise.resolve();
    expect(order).toEqual([TURNS.id]);
    release();
    await gate;
    await new Promise((r) => setTimeout(r, 0));
    expect(order).toEqual([TURNS.id, TM.id]);
    expect(create.mock.calls[1][0]).toMatchObject({ id: TM.id, parent: TURNS.id, name: 'מנוע תורים באורך משתנה' });
    // 🔗⇒⏭️: N לילות כמו בשרשרת
    const c2 = vi.fn(() => Promise.resolve(true));
    const s2 = src([], { create: c2 });
    s2.saveChain!('bookings', 1);
    await new Promise((r) => setTimeout(r, 0));
    expect((c2.mock.calls as unknown as [Capability][]).map((c) => [c[0].id, c[0].params])).toEqual([
      ['bookings:bookings.nights:merge', {}],
      ['bookings:bookings.nights:merge>next', { minLength: 3 }],
    ]);
    // הראשון קיים ⇒ רק הבנוי; הבנוי קיים ⇒ כלום, "נשמר"
    const c3 = vi.fn();
    src([TURNS], { create: c3 }).saveChain!('bookings', 0);
    await new Promise((r) => setTimeout(r, 0));
    expect(c3.mock.calls.map((c) => (c[0] as Capability).id)).toEqual([TM.id]);
    const done = src([TURNS, TM]);
    expect(done.chains('bookings')[0].savedId).toBe(TM.id);
    // מורה
    const c4 = vi.fn();
    expect(src([], { create: c4, canEdit: false }).saveChain!('bookings', 0)).toBeNull();
    expect(c4).not.toHaveBeenCalled();
  });
});

describe('🧬 (ב) המסך', () => {
  it('כרטיס ✨ בגריד המנועים, וכפתור "בנה עליו" ברשימה', () => {
    const h = body(src([TURNS]));
    expect(h).toContain('data-host-cap="' + TURNS.id + '"');
    expect(h).toContain('data-open-cap="' + TURNS.id + '"');
  });

  it('"איזה חלק לחבר אל ✨ מנוע תורים?" — רק חלקים מהסוג של הפלט', () => {
    const h = body(src([TURNS]), { host: TURNS.id });
    expect(text(h)).toContain('איזה חלק לחבר אל ✨ מנוע תורים?');
    const offered = [...h.matchAll(/data-atom="(\w+)"/g)].map((m) => m[1]);
    expect(offered).toEqual(['merge', 'next', 'rotate']);
    // אין שרשראות מוצעות על מנוע שנוצר
    expect(h).not.toContain('data-chain=');
  });

  it('השאלה: המקום היחיד עם התוצאה האמיתית (תורים באורך משתנה)', () => {
    const h = body(src([TURNS]), { host: TURNS.id, atom: 'merge' });
    expect(h).toContain('data-place="' + outPlaceId(TURNS.id) + '"');
    expect(h).toContain('התורים של מנוע תורים');
    expect(h).toContain('תורים באורך משתנה');
    expect(text(h)).toContain('12 תורים של 20 דקות בחלון 11:00–15:00');
  });

  it('יתום ⇒ "המנוע שעליו הוא בנוי הוסר", בלי "בנה עליו" ובלי כרטיס ✨; "הסר" נשאר', () => {
    const h = body(src([TM]));
    expect(h).toContain(ORPHAN_TEXT);
    expect(h).not.toContain('data-open-cap=');
    expect(h).not.toContain('data-host-cap=');
    expect(h).toContain('הסר');
  });

  it('שרשראות: "שמור כמנוע" / "נשמר כמנוע ✓"; מורה — בלי כפתור', () => {
    expect(body(src([]), { host: 'bookings' })).toContain(SAVE_CHAIN_TEXT);
    const saved = body(src([TURNS, TM]), { host: 'bookings' });
    expect(saved).toContain(SAVED_CHAIN_TEXT);
    expect(saved).toContain('data-chain-saved="' + esc(TM.id) + '"');
    expect(body(src([], { canEdit: false }), { host: 'bookings' })).not.toContain('data-save-chain');
  });
});

describe('🧬 (ג) מזהה אחד', () => {
  it('buildChildCapability ≡ childId של השכבה', () => {
    const e = engineCard('bookings')!;
    const a = atomCard('merge')!;
    const c = buildChildCapability(TURNS.id, e, a, { atom: 'merge', place: outPlaceId(TURNS.id), placeName: 'x', kind: 'sequence', result: 'x' }, {});
    expect(c.id).toBe(childId(TURNS.id, 'merge'));
    expect(c.parent).toBe(TURNS.id);
    expect(c.place).toBe(outPlaceId(TURNS.id));
  });
});
