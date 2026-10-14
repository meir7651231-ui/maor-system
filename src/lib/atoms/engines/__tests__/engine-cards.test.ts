/**
 * ratchet — 🧩 שכבת החלקים · כרטיסי המנועים (ATOMS-ENGINES, 14.10.2026).
 * ננעל: (א) החוזה המשותף ביט-זהה (md5) — קובץ משותף לשלושה סשנים; (ב) שלושת הכרטיסים: מזהים, פירוק 15/12 עם
 * קישורי-החלקים, סוגים חוקיים, ומשפט-תוצאה רק לחלק שהסוג שלו מתאים למקום; (ג) optionsFor על כרטיס ההזמנות
 * מוציא את המקומות הצפויים בסדר; (ד) טוהר — בלי Date.now/Math.random/React/store.
 */
import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import contractRaw from '../../contract.ts?raw';
import zmanimRaw from '../zmanim.ts?raw';
import whatNeedRaw from '../whatNeed.ts?raw';
import bookingsRaw from '../bookings.ts?raw';
import indexRaw from '../index.ts?raw';
import dataRaw from '../bookingsData.ts?raw';
import { ATOM_IDS, ENGINE_IDS, KINDS, optionsFor, type AtomCard, type AtomId, type Kind } from '../../contract';
import { ENGINE_CARDS, engineCard, placeById } from '..';

/** הסוגים של כל חלק — כפי שהוגדרו לגל הראשון (הצד הנקבה; S1 בונה את החלקים עצמם). */
const ATOM_KINDS: Readonly<Record<AtomId, readonly Kind[]>> = {
  divide: ['span', 'amount'],
  merge: ['sequence'],
  next: ['times', 'sequence'],
  round: ['amount', 'times'],
  offset: ['times'],
  escalate: ['waiting'],
  rotate: ['waiting', 'sequence'],
  fuzzy: ['text'],
};

const HEB = /[א-ת]/;

describe('החוזה המשותף', () => {
  it('ביט-זהה (md5) ומסתיים בשורה-חדשה אחת', () => {
    // CHAIN 14.10: שינוי מכוון ותוספתי בלבד (Capability.parent? + ATOM_OUTPUT/outputKind) — היה d1633928cab86f6d2b0e9c3f8c7de598
    expect(createHash('md5').update(contractRaw).digest('hex')).toBe('09e899edbeef152b596b5773914fab03');
    expect(contractRaw.endsWith('}\n')).toBe(true);
    expect(contractRaw.endsWith('\n\n')).toBe(false);
  });
});

describe('כרטיסי המנועים', () => {
  it('המזהים = ENGINE_IDS בסדר, והחיפוש עובד', () => {
    expect(ENGINE_CARDS.map((c) => c.id)).toEqual([...ENGINE_IDS]);
    for (const id of ENGINE_IDS) expect(engineCard(id)?.id).toBe(id);
    expect(engineCard('nope')).toBeUndefined();
    expect(placeById('bookings.nights')?.kind).toBe('sequence');
    expect(placeById('nope')).toBeUndefined();
  });

  it('מנוע הזמנים: 15 חלקים, עם קישורי החלקים הנכונים', () => {
    const c = engineCard('zmanim')!;
    expect(c.parts.map((p) => p.num)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
    const links = Object.fromEntries(c.parts.filter((p) => p.atom).map((p) => [p.num, p.atom]));
    expect(links).toEqual({ 6: 'offset', 7: 'divide', 8: 'round', 9: 'offset', 13: 'merge', 14: 'next' });
    expect(c.from).toBe('פרנסה׳לע');
  });

  it('מנוע מה צריך?: 12 חלקים, עם קישורי החלקים הנכונים', () => {
    const c = engineCard('whatNeed')!;
    expect(c.parts.map((p) => p.num)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
    const links = Object.fromEntries(c.parts.filter((p) => p.atom).map((p) => [p.num, p.atom]));
    expect(links).toEqual({ 4: 'fuzzy', 8: 'escalate', 11: 'rotate' });
  });

  it('מנוע ההזמנות: 10–14 חלקים ממוספרים, וכל 12 המקומות שנדרשו קיימים בסוג הנכון', () => {
    const c = engineCard('bookings')!;
    expect(c.parts.length).toBeGreaterThanOrEqual(10);
    expect(c.parts.length).toBeLessThanOrEqual(14);
    expect(c.parts.map((p) => p.num)).toEqual(Array.from({ length: c.parts.length }, (_, i) => i + 1));
    const want: Record<string, Kind> = {
      'bookings.turnover': 'span',
      'bookings.day': 'span',
      'bookings.stay': 'span',
      'bookings.balance': 'amount',
      'bookings.total': 'amount',
      'bookings.untilArrival': 'span',
      'bookings.nights': 'sequence',
      'bookings.arrivals': 'times',
      'bookings.cleaning': 'waiting',
      'bookings.faults': 'waiting',
      'bookings.unpaid': 'waiting',
      'bookings.guests': 'text',
    };
    for (const [id, kind] of Object.entries(want)) expect(placeById(id)?.kind, id).toBe(kind);
  });

  it('כל מקום: סוג חוקי, מנוע נכון, מזהה ייחודי, ומשפטי-תוצאה רק לחלק שהסוג שלו מתאים', () => {
    const kinds = KINDS.map((k) => k.id) as string[];
    const seen = new Set<string>();
    for (const c of ENGINE_CARDS) {
      expect(HEB.test(c.name) && HEB.test(c.computes)).toBe(true);
      for (const p of c.parts) {
        expect(HEB.test(p.name) && HEB.test(p.computes), c.id + ':' + p.num).toBe(true);
        if (p.atom) expect(ATOM_IDS as readonly string[]).toContain(p.atom);
      }
      expect(c.places.length).toBeGreaterThan(0);
      for (const p of c.places) {
        expect(seen.has(p.id), p.id).toBe(false);
        seen.add(p.id);
        expect(p.engine).toBe(c.id);
        expect(p.id.startsWith(c.id + '.')).toBe(true);
        expect(kinds).toContain(p.kind);
        expect(HEB.test(p.name)).toBe(true);
        const keys = Object.keys(p.results);
        expect(keys.length, p.id).toBeGreaterThan(0);
        for (const k of keys) {
          expect(ATOM_IDS as readonly string[], p.id).toContain(k);
          expect(ATOM_KINDS[k as AtomId], p.id + '→' + k).toContain(p.kind);
          const s = p.results[k as AtomId]!;
          expect(s.trim().length, p.id + '→' + k).toBeGreaterThan(0);
          expect(HEB.test(s), p.id + '→' + k).toBe(true);
        }
      }
    }
  });
});

describe('optionsFor על כרטיס ההזמנות', () => {
  const atom = (id: AtomId): AtomCard => ({
    id,
    name: id,
    emoji: '·',
    from: { engine: 'zmanim', num: 1 },
    computes: 'בדיקה',
    worksOn: ATOM_KINDS[id],
    question: '?',
    details: [],
  });

  it('לחלק — הטווחים והסכומים, בסדר המקומות', () => {
    const opts = optionsFor(atom('divide'), engineCard('bookings')!);
    expect(opts.map((o) => o.place)).toEqual([
      'bookings.turnover',
      'bookings.day',
      'bookings.stay',
      'bookings.balance',
      'bookings.total',
      'bookings.untilArrival',
    ]);
    expect(opts.every((o) => o.atom === 'divide' && o.result.length > 0)).toBe(true);
  });

  it('לאחד — הרצפים, בסדר המקומות, ו"פנוי 3 לילות ברצף" ראשון', () => {
    const opts = optionsFor(atom('merge'), engineCard('bookings')!);
    expect(opts.map((o) => o.place)).toEqual(['bookings.nights', 'bookings.guestStays', 'bookings.unitStays', 'bookings.sacredDays', 'bookings.unitFaults']);
    expect(opts[0].result).toBe('פנוי 3 לילות ברצף');
  });
});

describe('טוהר', () => {
  it('בלי Date.now / Math.random / React / store, ובלי ייבוא מ-components בכרטיסים', () => {
    for (const [name, src] of Object.entries({ zmanimRaw, whatNeedRaw, bookingsRaw, indexRaw, dataRaw, contractRaw })) {
      expect(src, name).not.toMatch(/Date\.now|Math\.random|from ['"]react['"]|\/store\//);
    }
    for (const src of [zmanimRaw, whatNeedRaw, bookingsRaw, indexRaw]) expect(src).not.toMatch(/from ['"][^'"]*components\//);
    // הקוראים מייבאים רק את ליבת-המעברים הטהורה של האירוח (לא lib.ts הכבד, לא רכיבים)
    expect(dataRaw.match(/from '([^']+)'/g)).toEqual(["from '../../../types/domain'", "from '../../../components/hosting/transitions'"]);
  });
});
