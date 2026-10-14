/**
 * 🔒 ratchet — 🧬 המקור האמיתי של "מנועים וחלקים" (ATOMS 14.10.2026, הסשן המשלב).
 *  (א) engines/atoms = הכרטיסים עצמם; capabilities = db.ui.capabilities מחוטא; create מחליף את השם לשם לפי מזהה-המקום; canEdit=false ⇒ אין כתיבה.
 *  (ב) המסך עם המקור האמיתי: השאלה "מה לחלק?" מציעה רק את מקומות-ההזמנות מהסוג, וליד כל אחד התוצאה **האמיתית**; הטופס מראה
 *      את התוצאה עם הפרטים; "✨ נוצר מנוע חדש" עם התורים האמיתיים; שרשראות עם שורה מחושבת; בלי שמות-אורחים.
 *  (ג) הכניסה טוענת את המקור ב-import() (לא סטטי) ולשונית-הפתיחה היא "מנועים וחלקים".
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Db, HostStaff } from '../../../types/domain';
import { fixtureDb, HOST_RECORDS, NOW_MS } from '../../../lib/switchboard/__tests__/fixture';
import { ATOM_CARDS } from '../../../lib/atoms/cards';
import { ENGINE_CARDS } from '../../../lib/atoms/engines';
import { capabilityId, type Capability } from '../../../lib/atoms/contract';
import { atomsSource } from '../atoms/source';
import { AtomsBody } from '../atoms/AtomsBody';
import { EngineBoxBody } from '../EngineBoxScreen';
import { fixtureSource } from './fixtures';
import entrySrc from '../EngineBoxEntry.tsx?raw';

const STAFF = (id: string, name: string): HostStaff => ({ id, kind: 'staff', name, role: 'ניקיון', phone: '', createdAt: 'x', updatedAt: 'x' });
const DB = (): Db => ({ ...fixtureDb(), hostRecords: [...fixtureDb().hostRecords, STAFF('hs1', 'דנה'), STAFF('hs2', 'רבקה')] });
const TURNS: Capability = { id: capabilityId('bookings', 'bookings.turnover', 'divide'), engine: 'bookings', place: 'bookings.turnover', atom: 'divide', params: { by: 'size', size: 40, gap: 0 }, name: 'bookings + חלוקה' };
const src = (over: Partial<Parameters<typeof atomsSource>[0]> = {}) =>
  atomsSource({ db: DB(), config: null, nowMs: NOW_MS, canEdit: true, create: vi.fn(), remove: vi.fn(), ...over });
const GUESTS = HOST_RECORDS.filter((r) => r.kind === 'guest').map((g) => (g as { name: string }).name);

describe('🧬 (א) atomsSource', () => {
  it('הכרטיסים האמיתיים; היכולות השמורות מחוטאות', () => {
    const s = src({ db: { ...DB(), ui: { ...DB().ui, capabilities: [TURNS, { id: 'junk' } as Capability] } } });
    expect(s.engines().map((e) => e.id)).toEqual(ENGINE_CARDS.map((e) => e.id));
    expect(s.atoms().map((a) => a.id)).toEqual(ATOM_CARDS.map((a) => a.id));
    expect(s.engines().find((e) => e.id === 'bookings')!.parts).toHaveLength(13);
    expect(s.capabilities().map((c) => c.id)).toEqual([TURNS.id]);
  });

  it('create ⇒ עם השם לפי מזהה-המקום ("מנוע תורים"); canEdit=false ⇒ אין כתיבה', () => {
    const create = vi.fn();
    const remove = vi.fn();
    src({ create, remove }).create(TURNS);
    expect(create).toHaveBeenCalledWith({ ...TURNS, name: 'מנוע תורים' });
    const ro = src({ create, remove, canEdit: false });
    ro.create(TURNS);
    ro.remove(TURNS.id);
    expect(create).toHaveBeenCalledTimes(1);
    expect(remove).not.toHaveBeenCalled();
    expect(ro.canEdit).toBe(false);
  });

  it('preview/chains מחושבים מהנתונים', () => {
    const s = src();
    expect(s.preview(TURNS)!.title).toBe('חלון הניקיון 11:00–15:00 · 6 תורים');
    const ch = s.chains('bookings');
    expect(ch.map((c) => c.atoms.join('>'))).toEqual(['divide>merge', 'merge>next', 'merge>divide']);
    expect(ch[1].lines![0]).toBe('צימר הגפן · 3 לילות פנויים ברצף מ-18/10 עד 21/10');
  });
});

describe('🧬 (ב) המסך עם המקור האמיתי', () => {
  const html = (initial: Parameters<typeof AtomsBody>[0]['initial'], s = src()) => renderToStaticMarkup(createElement(AtomsBody, { source: s, initial }));

  it('"מה לחלק?" — רק מקומות מסוג טווח/סכום עם משפט, וליד כל אחד התוצאה האמיתית', () => {
    const out = html({ host: 'bookings', atom: 'divide' });
    expect(out).toContain('מה לחלק?');
    const places = [...out.matchAll(/data-place="([^"]+)"/g)].map((m) => m[1]);
    expect(places).toEqual(['bookings.turnover', 'bookings.day', 'bookings.stay', 'bookings.balance', 'bookings.total', 'bookings.untilArrival']);
    expect(out).not.toContain('data-place="bookings.nights"');
    // חלון הניקיון עם ברירות-המחדל (12 חלקים) ⇒ תורים של 20 דקות, עם השמות של המנקות
    expect(out).toContain('חלון הניקיון 11:00–15:00 · 12 תורים');
    expect(out).toContain('11:00–11:20 · דנה');
    expect((out.match(/data-preview="real"/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });

  it('הטופס: התוצאה עם הפרטים; "נוצר מנוע חדש" עם התורים האמיתיים', () => {
    const details = html({ host: 'bookings', atom: 'divide', place: 'bookings.turnover' });
    expect(details).toContain('data-preview="real"');
    const s = src({ db: { ...DB(), ui: { ...DB().ui, capabilities: [{ ...TURNS, name: 'מנוע תורים' }] } } });
    const made = html({ host: 'bookings', made: TURNS.id }, s);
    expect(made).toContain('✨ נוצר מנוע חדש: מנוע תורים');
    expect(made).toContain('11:00–11:40 · דנה');
    expect(made).toContain('14:20–15:00 · רבקה');
  });

  it('מקום בלי תצוגה ⇒ "התצוגה תגיע בקרוב"', () => {
    expect(html({ host: 'bookings', atom: 'divide', place: 'bookings.day' })).toContain('התצוגה תגיע בקרוב');
  });

  it('שרשראות עם שורות; בלי שמות-אורחים בשום צעד', () => {
    const atomStep = html({ host: 'bookings' });
    expect(atomStep).toContain('החלון הפנוי הבא של 3 לילות');
    expect(atomStep).toContain('3 לילות פנויים ברצף מ-18/10 עד 21/10');
    const all = [atomStep, html({ host: 'bookings', atom: 'divide' }), html({ host: 'bookings', atom: 'merge' }), html({ host: 'bookings', atom: 'escalate' }), html({ host: 'bookings', atom: 'rotate' })].join('');
    for (const g of GUESTS) expect(all, g).not.toContain(g);
  });
});

describe('🧬 (ג) הכניסה', () => {
  it('המקור נטען ב-import(); לשונית-הפתיחה "מנועים וחלקים" כשיש מקור', () => {
    expect(entrySrc).toMatch(/import\('\.\/atoms\/source'\)/);
    expect(entrySrc).not.toMatch(/^import (?!type )[^;]*'\.\/atoms\/source'/m);
    const out = renderToStaticMarkup(createElement(EngineBoxBody, { source: fixtureSource(), atoms: src() }));
    expect(out).toMatch(/aria-selected="true"[^>]*data-tab="atoms"/);
    expect(out).toContain('data-atoms="engines"');
  });
});
