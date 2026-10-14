/**
 * 🔨 המד של המפרק — ratchet (ATOMS-DECOMPOSE, 14.10.2026).
 * (א) recall מול 27 המקומות שפורקו ביד · (ב) חיבורים עם תוצאה אמיתית על נתוני-הדמו + ארגון-האירוח/פרנסה׳לע, לפי מודול ·
 * (ג) הקבצים שנוצרו מעודכנים מול הסקריפט, והסקריפט דטרמיניסטי.
 * הבדיקה נכשלת אם מספר יורד. מספר שעלה ⇒ מעלים את הרצפה כאן (לא יורדים לעולם).
 */
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { ENGINE_CARDS } from '../../engines';
import { GENERATED_ENGINES } from '../../engines/generated';
import { countByEngine, realConnections, recall } from '../meter';
import { meterCtxs } from './meterFixture';
import { RECALL_KEYS } from './recallKey';

/** הרצפות (נמדדו 14.10.2026). */
const RECALL_FLOOR_PCT = 77.8;
const CONNECTIONS_FLOOR: Record<string, number> = {
  calendar: 18,
  courses: 30,
  diary: 8,
  families: 14,
  hosting: 26,
  parnasa: 20,
  shop: 15,
  shop7: 13,
  supporters: 15,
  tzedaka: 19,
};
const TOTAL_FLOOR = 178;

describe('🔨 המד — (א) כמה מקומות-יד המפרק מצא לבד', () => {
  const hand = ENGINE_CARDS.flatMap((c) => c.places.map((p) => ({ id: p.id, kind: p.kind })));
  const r = recall(GENERATED_ENGINES, hand, RECALL_KEYS);

  it('לכל 27 מקומות-היד יש שורה במפתח', () => {
    expect(hand).toHaveLength(27);
    expect(RECALL_KEYS.map((k) => k.hand).sort()).toEqual(hand.map((h) => h.id).sort());
  });

  it(`recall לא יורד מ-${RECALL_FLOOR_PCT}%`, () => {
    expect(r.pct).toBeGreaterThanOrEqual(RECALL_FLOOR_PCT);
  });

  it('מה שלא נמצא — בדיוק המקומות שהמפתח מודה שאין להם מקור', () => {
    const honestNone = RECALL_KEYS.filter((k) => !k.any.length).map((k) => k.hand);
    expect(r.missed.sort()).toEqual(honestNone.sort());
  });
});

describe('🔨 המד — (ב) חיבורים עם תוצאה אמיתית', () => {
  const conns = realConnections(GENERATED_ENGINES, meterCtxs());
  const by = countByEngine(conns);

  it.each(Object.entries(CONNECTIONS_FLOOR))('%s ≥ %i', (engine, floor) => {
    expect(by[engine] ?? 0).toBeGreaterThanOrEqual(floor);
  });

  it(`סך הכול ≥ ${TOTAL_FLOOR}`, () => {
    expect(conns.length).toBeGreaterThanOrEqual(TOTAL_FLOOR);
  });

  it('כל תוצאה: כותרת + 1–6 שורות לא ריקות', () => {
    for (const c of conns) {
      expect(c.preview.title).toBeTruthy();
      expect(c.preview.lines.length).toBeGreaterThan(0);
      expect(c.preview.lines.length).toBeLessThanOrEqual(6);
      for (const l of c.preview.lines) expect(l.trim()).not.toBe('');
    }
  });

  it('דוגמאות אמיתיות מהתורמים ומהחוגים (לדוח)', () => {
    const pick = (place: string, atom: string) => conns.find((c) => c.place === place && c.atom === atom)?.preview.lines ?? [];
    expect(pick('supporters.supporters.donations[]@seq', 'merge')[0]).toMatch(/^אצל \d+ מתוך 15 יש 2 חודשים או יותר ברצף$/);
    expect(pick('supporters.supporters.nextDate', 'next')[0]).toMatch(/^הבא: \d+\/\d+ \(בעוד/);
    expect(pick('courses.courses.start~end', 'divide')[0]).toMatch(/⇐ 12 חלקים$/);
    expect(pick('courses.courses.name', 'fuzzy')[0]).toMatch(/\(עם טעות\) ⇐ נמצאו \d+ מתוך 14$/);
  });
});

describe('🔨 המד — (ג) הקבצים שנוצרו מעודכנים, והמפרק דטרמיניסטי', () => {
  it('node scripts/atoms-decompose.mjs --check עובר (פעמיים — אותו פלט)', () => {
    for (let i = 0; i < 2; i++) {
      const out = execFileSync(process.execPath, ['scripts/atoms-decompose.mjs', '--check'], { encoding: 'utf8' });
      expect(out).toMatch(/מעודכנים/);
    }
  }, 60_000);

  it('כל קובץ שנוצר מתחיל בכותרת "נוצר אוטומטית"', async () => {
    const files = import.meta.glob('../../engines/generated/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
    expect(Object.keys(files).length).toBe(GENERATED_ENGINES.length + 2);
    for (const src of Object.values(files)) expect(src).toContain('נוצר אוטומטית ע״י המפרק — לא לערוך ידנית');
  });

  it('הטוען העצל מחזיר בדיוק את אותם מנועים', async () => {
    const { GENERATED_IDS, GENERATED_LOADERS } = await import('../../engines/generated/lazy');
    expect([...GENERATED_IDS]).toEqual(GENERATED_ENGINES.map((e) => e.id));
    for (const e of GENERATED_ENGINES) expect(await GENERATED_LOADERS[e.id]()).toBe(e);
  });
});
