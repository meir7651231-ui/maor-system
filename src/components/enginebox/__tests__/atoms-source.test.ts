/**
 * 🔒 ratchet — 🧬 המקור האמיתי של "מנועים וחלקים" (ATOMS 14.10.2026, הסשן המשלב).
 *  (א) engines/atoms = הכרטיסים עצמם; capabilities = db.ui.capabilities מחוטא; create מחליף את השם לשם לפי מזהה-המקום; canEdit=false ⇒ אין כתיבה.
 *  (ב) המסך עם המקור האמיתי: השאלה "מה לחלק?" מציעה רק את מקומות-ההזמנות מהסוג, וליד כל אחד התוצאה **האמיתית**; הטופס מראה
 *      את התוצאה עם הפרטים; "✨ נוצר מנוע חדש" עם התורים האמיתיים; שרשראות עם שורה מחושבת; בלי שמות-אורחים.
 *  (ג) הכניסה טוענת את המקור ב-import() (לא סטטי) ולשונית-הפתיחה היא "מנועים וחלקים".
 */
import { ATOM_EXPLAIN, ENGINE_EXPLAIN } from '../../../lib/atoms/explain';
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
import { LtrNums } from '../atoms/AtomSteps';
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
  const markup = (initial: Parameters<typeof AtomsBody>[0]['initial'], s = src()) => renderToStaticMarkup(createElement(AtomsBody, { source: s, initial }));
  /** הטקסט הנראה (בלי תגיות — הרצפים המספריים עטופים ב-<bdi dir="ltr">); data-* נשארים בשורת-הסימון. */
  const html = (initial: Parameters<typeof AtomsBody>[0]['initial'], s = src()) => {
    const m = markup(initial, s);
    return m + '\n' + m.replace(/<[^>]+>/g, '');
  };

  it('RTL: כל רצף מספרי (שעות/טווחים/תאריכים/סכומים) מבודד משמאל-לימין — "11:00–11:40" לא מתהפך', () => {
    const s2 = src({ db: { ...DB(), ui: { ...DB().ui, capabilities: [{ ...TURNS, name: 'מנוע תורים' }] } } });
    const m = markup({ host: 'bookings', made: TURNS.id }, s2);
    expect(m).toContain('<bdi dir="ltr">11:00–11:40</bdi> · דנה');
    expect(m).toContain('<bdi dir="ltr">11:00–15:00</bdi> · 6 תורים');
    const q = markup({ host: 'bookings', atom: 'divide' });
    expect(q).toContain('<bdi dir="ltr">12/10–15/10</bdi> ⇒ ניקיון ב-<bdi dir="ltr">13/10</bdi>, <bdi dir="ltr">14/10</bdi>');
    // סכום-בתשלומים: רצף אחד שלם
    expect(renderToStaticMarkup(createElement(LtrNums, { text: 'צימר הגפן · ₪1,200 = 3 × ₪400' }))).toBe('<bdi>צימר הגפן · <bdi dir="ltr">₪1,200 = 3 × ₪400</bdi></bdi>');
  });

  it('"מה לחלק?" — רק מקומות מסוג טווח/סכום עם משפט, וליד כל אחד התוצאה האמיתית', () => {
    const out = html({ host: 'bookings', atom: 'divide' });
    expect(out).toContain('מה לחלק?');
    const places = [...out.matchAll(/data-place="([^"]+)"/g)].map((m) => m[1]);
    // FACTORY 14.10: רק מה שהמפעל אימת — יום העבודה (HONEST_NULLS, אין לו תצוגה) כבר לא מוצע
    expect(places).toEqual(['bookings.turnover', 'bookings.stay', 'bookings.balance', 'bookings.total', 'bookings.untilArrival']);
    expect(out).toContain('data-verified=');
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

  it('FACTORY: מקום בלי תצוגה (HONEST_NULLS) לא מאומת ⇒ לא מוצע בכלל; יכולת שמורה עליו ⇒ "התצוגה תגיע בקרוב"', () => {
    expect(html({ host: 'bookings', atom: 'divide' })).not.toContain('data-place="bookings.day"');
    const DAY = { id: 'bookings:bookings.day:divide', engine: 'bookings' as const, place: 'bookings.day', atom: 'divide' as const, params: {}, name: 'מנוע תורי קבלה' };
    const s = src({ db: { ...DB(), ui: { ...DB().ui, capabilities: [DAY] } } });
    expect(html({ host: 'bookings', made: DAY.id }, s)).toContain('התצוגה תגיע בקרוב');
  });

  it('שרשראות עם שורות; בלי שמות-אורחים בשום צעד', () => {
    const atomStep = html({ host: 'bookings' });
    expect(atomStep).toContain('החלון הפנוי הבא של 3 לילות');
    expect(atomStep).toContain('3 לילות פנויים ברצף מ-18/10 עד 21/10');
    const all = [atomStep, html({ host: 'bookings', atom: 'divide' }), html({ host: 'bookings', atom: 'merge' }), html({ host: 'bookings', atom: 'escalate' }), html({ host: 'bookings', atom: 'rotate' })].join('');
    // ATOMS-NAMES: הדוגמאות הקבועות שאושרו ("ההגעה הבאה: משפחת לוי, 15:00") אינן נתוני-ארגון — מורידים אותן,
    // והבדיקה נשארת על כל מה שמחושב מהנתונים (תצוגות, שרשראות, תוצאות)
    const EX = /<div class="at-examples" data-examples="\w+">[\s\S]*?<\/details><\/div>/g;
    const blocks = all.match(EX) ?? [];
    expect(blocks.length).toBeGreaterThan(0);
    // מה שהורד = רק הטקסט הקבוע שאושר (אחרי הסרת התגיות, החץ והרווחים)
    const flat = (t: string) => t.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/[\s←]/g, '');
    const approved = [...Object.values(ATOM_EXPLAIN), ...Object.values(ENGINE_EXPLAIN)].flatMap((x) => x.examples).map(flat);
    for (const b of blocks) expect(approved.some((x) => flat(b).includes(x))).toBe(true);
    // html() מחזיר גם את הסימון וגם את הטקסט בלי תגיות — מורידים את הבלוקים מהסימון ואת הדוגמאות עצמן מהטקסט
    const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    const examples = [...Object.values(ATOM_EXPLAIN), ...Object.values(ENGINE_EXPLAIN)].flatMap((x) => x.examples).map(esc);
    const data = examples.reduce((acc, x) => acc.split(x).join(''), all.replace(EX, ''));
    expect(data).not.toContain('at-ex-arrow');
    for (const g of GUESTS) expect(data, g).not.toContain(g);
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
