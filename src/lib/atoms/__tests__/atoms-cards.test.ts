/**
 * ratchet — 🧩 כרטיסי-החלקים, החוזה המשותף, וטוהר השכבה (ATOMS, 14.10.2026).
 * מה זה שומר: (1) הכרטיסים תואמים את החוזה — המזהים בסדר, הסוגים חוקיים, השאלה והפרטים בעברית,
 * מספרי-הפירוק כמו שהבעלים לימד; (2) contract.ts משותף לכמה סשנים — ביט-זהה (md5);
 * (3) החלקים טהורים: בלי שעון, בלי אקראיות, בלי React/store/מוצרים.
 */
import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { ATOM_CARDS, atomCard } from '../cards';
import { ATOM_IDS, ENGINE_IDS, KINDS, capabilityId, optionsFor, type EngineCard } from '../contract';

const HEB = /[א-ת]/;

describe('כרטיסים', () => {
  it('המזהים = ATOM_IDS בסדר; atomCard מוצא; לא-מוכר ⇒ null', () => {
    expect(ATOM_CARDS.map((c) => c.id)).toEqual([...ATOM_IDS]);
    for (const id of ATOM_IDS) expect(atomCard(id)?.id).toBe(id);
    expect(atomCard('nope')).toBeNull();
  });
  it('סוגים חוקיים, שאלה ופרטים בעברית, מנוע-מקור חוקי', () => {
    const kinds = new Set(KINDS.map((k) => k.id));
    for (const c of ATOM_CARDS) {
      expect(c.worksOn.length).toBeGreaterThan(0);
      for (const k of c.worksOn) expect(kinds.has(k), c.id + ':' + k).toBe(true);
      expect(c.question.trim()).toMatch(HEB);
      expect(c.name).toMatch(HEB);
      expect(c.computes).toMatch(HEB);
      expect(c.emoji.trim()).not.toBe('');
      expect(ENGINE_IDS).toContain(c.from.engine);
      expect(c.details.length).toBeGreaterThan(0);
      for (const d of c.details) {
        expect(d.label.trim(), c.id + '.' + d.id).toMatch(HEB);
        if (d.type === 'choice') {
          expect(d.choices?.length).toBeGreaterThan(1);
          for (const ch of d.choices ?? []) expect(ch.label).toMatch(HEB);
          expect(d.choices?.some((ch) => ch.id === d.default)).toBe(true);
        } else {
          expect(typeof d.default).toBe('number');
          if (d.min !== undefined) expect(d.default as number).toBeGreaterThanOrEqual(d.min);
          if (d.max !== undefined) expect(d.default as number).toBeLessThanOrEqual(d.max);
        }
      }
    }
  });
  it('הסוגים והשאלות קבועים (סשנים אחרים נשענים עליהם)', () => {
    const fixed = Object.fromEntries(ATOM_CARDS.map((c) => [c.id, [c.worksOn.join('+'), c.question]]));
    expect(fixed).toEqual({
      divide: ['span+amount', 'מה לחלק?'],
      merge: ['sequence', 'מה לאחד?'],
      next: ['times+sequence', 'מה לחפש קדימה?'],
      round: ['amount+times', 'מה לעגל?'],
      offset: ['times', 'ביחס למה?'],
      escalate: ['waiting', 'מה להעביר הלאה כשאין תשובה?'],
      rotate: ['waiting+sequence', 'מה לחלק בתורות?'],
      fuzzy: ['text', 'איפה לחפש?'],
    });
  });
  it('מספרי-הפירוק כמו שהבעלים לימד', () => {
    const from = Object.fromEntries(ATOM_CARDS.map((c) => [c.id, c.from.engine + '#' + c.from.num]));
    expect(from).toEqual({
      divide: 'zmanim#7',
      merge: 'zmanim#13',
      next: 'zmanim#14',
      round: 'zmanim#8',
      offset: 'zmanim#9',
      escalate: 'whatNeed#8',
      rotate: 'whatNeed#11',
      fuzzy: 'whatNeed#4',
    });
  });
  it('ברירות-המחדל של ההסלמה = המקור (180/60 דק׳)', () => {
    const d = Object.fromEntries(atomCard('escalate')!.details.map((x) => [x.id, x.default]));
    expect(d).toEqual({ waitMin: 180, urgentWaitMin: 60 });
  });
  it('optionsFor עם הכרטיסים: רק מקום מאותו סוג ועם משפט-תוצאה', () => {
    const eng: EngineCard = {
      id: 'bookings',
      name: 'בדיקה',
      emoji: '🧪',
      from: 'בדיקה',
      computes: 'בדיקה',
      parts: [],
      places: [
        { id: 'p.span', engine: 'bookings', name: 'טווח', kind: 'span', results: { divide: 'משבצות', merge: 'לא בסוג' } },
        { id: 'p.seq', engine: 'bookings', name: 'רצף', kind: 'sequence', results: { merge: 'רצפים' } },
        { id: 'p.none', engine: 'bookings', name: 'בלי משפט', kind: 'span', results: {} },
      ],
    };
    expect(optionsFor(atomCard('divide')!, eng).map((o) => o.place)).toEqual(['p.span']);
    expect(optionsFor(atomCard('merge')!, eng).map((o) => o.place)).toEqual(['p.seq']);
    expect(optionsFor(atomCard('fuzzy')!, eng)).toEqual([]);
    expect(capabilityId('bookings', 'p.span', 'divide')).toBe('bookings:p.span:divide');
  });
});

describe('החוזה המשותף', () => {
  it('contract.ts ביט-זהה (md5) — לא עורכים קובץ משותף', () => {
    const buf = readFileSync(new URL('../contract.ts', import.meta.url));
    expect(createHash('md5').update(buf).digest('hex')).toBe('d1633928cab86f6d2b0e9c3f8c7de598');
  });
});

describe('טוהר השכבה (הגנת-מקור)', () => {
  const SRC = {
    ...(import.meta.glob(['../parts/*.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>),
    ...(import.meta.glob(['../cards.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>),
  };
  it('כל הקבצים נסרקו', () => {
    expect(Object.keys(SRC).length).toBe(10); // 8 חלקים + index + cards
  });
  for (const [file, src] of Object.entries(SRC)) {
    it(file, () => {
      expect(src).not.toMatch(/Date\.now/);
      expect(src).not.toMatch(/Math\.random/);
      expect(src).not.toMatch(/from\s+['"]react/);
      expect(src).not.toMatch(/from\s+['"][^'"]*\/store\//);
      expect(src).not.toMatch(/from\s+['"][^'"]*components\//);
      expect(src).not.toMatch(/new Date\(\)/);
    });
  }
});
