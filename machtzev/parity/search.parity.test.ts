/**
 * מחצב · רתמת-הזהב #1 — זהות ישן≡חדש למנוע-החיפוש כולו.
 * (השיטה מ-telephony: קורפוס דטרמיניסטי, אפס random/Date — LCG זרוע.)
 * הישן: src/lib/search.ts (המונוליט) · החדש: קופסת-החיפוש של Genesis (6 חוטים).
 */
import { describe, it, expect } from 'vitest';
import { smartScore, smartFilter, expandQuery, XLAT } from '../../src/lib/search';
// @ts-expect-error — ייבוא חוצה-ריפו של קופסת-Genesis (ESM .mjs)
import { score as newScore, search as newSearch, expand as newExpand } from '/home/user/-ai-chat-server/new/boxes/search.mjs';

/* קורפוס דטרמיניסטי: LCG זרוע + חומרי-אמת */
const lcg = (seed: number) => () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const rnd = lcg(20260824);
const CHARS = 'אבגדהוזחטיכלמנסעפצקרשתםןףץ abcdefgh0123456789-"\'';
const randStr = (len: number) => Array.from({ length: len }, () => CHARS[Math.floor(rnd() * CHARS.length)]).join('');
const QUERIES: string[] = [
  '', ' ', 'כהן', 'cohen', 'коэн', 'משה', 'מוישי', 'חוגים', 'חוג', 'דוד כהן', 'דויד', 'כוהן',
  'בן דוד', 'ben david', 'golstein', 'גולדשטין', 'שרה לוי', 'xyz', '123', 'א', 'אב',
  ...Object.keys(XLAT).slice(0, 25),
  ...Array.from({ length: 120 }, () => randStr(1 + Math.floor(rnd() * 12))),
];
const TERMS: string[][] = [
  ['כהן'], ['משפחת כהן'], ['לוי', 'כהן'], ['חוג ציור'], ['דוד כהן', 'שרה'], ['goldstein'],
  ['בן דוד', 'טל'], [''], ['תשפ"ו'], ...Array.from({ length: 40 }, () => [randStr(6), randStr(9)]),
];
const ITEMS = TERMS.map((t, i) => ({ id: i, terms: t }));

describe('רתמת-זהב: חיפוש ישן ≡ קופסת-Genesis', () => {
  it('expandQuery ≡ expand — זהות-מערך מלאה על כל הקורפוס', () => {
    for (const q of QUERIES) expect(newExpand(q), `expand("${q}")`).toEqual(expandQuery(q));
  });
  it('smartScore ≡ score — זהות-מספרית על כל צירופי קורפוס×מונחים', () => {
    let checked = 0;
    for (const q of QUERIES) for (const t of TERMS) {
      expect(newScore(q, t), `score("${q}",${JSON.stringify(t)})`).toBe(smartScore(q, t));
      checked++;
    }
    expect(checked).toBeGreaterThan(8000);
  });
  it('smartFilter ≡ search — אותם פריטים באותו סדר, כולל limit', () => {
    for (const q of QUERIES) {
      const oldR = smartFilter(q, ITEMS, (x) => x.terms).map((x) => x.id);
      const newR = newSearch(q, ITEMS, (x: any) => x.terms).map((x: any) => x.id);
      expect(newR, `search("${q}")`).toEqual(oldR);
      const oldL = smartFilter(q, ITEMS, (x) => x.terms, 3).map((x) => x.id);
      const newL = newSearch(q, ITEMS, (x: any) => x.terms, 3).map((x: any) => x.id);
      expect(newL, `search-limit("${q}")`).toEqual(oldL);
    }
  });
});
