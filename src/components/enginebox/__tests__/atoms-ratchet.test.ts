/**
 * 🔒 ratchets · "🧬 מנועים וחלקים" (ATOMS-SCREEN 14.10.2026):
 *  (א) הזרימה הישנה ביט-זהה: בלי `atoms` — המסך זהה בדיוק לתצלום שנלקח לפני השינוי (old-flow-markup.json).
 *  (ב) עם `atoms` — לשונית ראשונה "🧬 מנועים וחלקים", והיא **לשונית-הפתיחה** (שינוי-נעילה מכוון, ATOMS 14.10 — הסשן המשלב:
 *      "🧬 מנועים וחלקים" ברירת-המחדל); אחרי לחיצה על "🔌 לחבר מנוע" תוכן הלשוניות הקיימות זהה לתצלום (רק פס-הלשוניות שונה).
 *  (ג) קוד-ייצור לעולם לא מייבא את נתוני-הדוגמה של החלקים.
 *  (ד) החוזה המשותף לא נגע: md5 קבוע, שורה-חדשה אחת בסוף.
 *  (ה) ההתאמה לא משוכפלת: המסך קורא ל-optionsFor של החוזה.
 */
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { EngineBoxBody, EngineBoxScreen } from '../EngineBoxScreen';
import { fixtureSource } from './fixtures';
import { atomsFixture } from './atoms-fixtures';
import OLD from './old-flow-markup.json';
import atomsBodySrc from '../atoms/AtomsBody.tsx?raw';

const g = () => ({ ...fixtureSource(), goal: () => null });
const ro = () => ({ ...fixtureSource({ canEdit: false }), goal: () => null });
type Atoms = ReturnType<typeof atomsFixture> | null | undefined;
/** `plugTab` ⇒ כאילו נלחצה "🔌 לחבר מנוע" (עם atoms לשונית-הפתיחה היא "מנועים וחלקים"). */
const states = (atoms: Atoms, plugTab = false): Record<string, string> => {
  const B = (source: ReturnType<typeof g> | ReturnType<typeof fixtureSource>, initial?: Parameters<typeof EngineBoxBody>[0]['initial']) => {
    const ini = plugTab && !initial?.tab ? { ...initial, tab: 'plug' as const } : initial;
    return renderToStaticMarkup(createElement(EngineBoxBody, atoms === undefined ? { source, initial: ini } : { source, initial: ini, atoms }));
  };
  return {
    start: B(fixtureSource()),
    pick: B(fixtureSource(), { start: 'parnasa' }),
    plug: B(fixtureSource(), { start: 'parnasa', picked: 'host' }),
    'goal-start': B(g()),
    'goal-plug': B(g(), { start: 'parnasa', picked: 'host' }),
    'goal-plug-ro': B(ro(), { start: 'parnasa', picked: 'host' }),
    'goal-tab': B(g(), { tab: 'goal', start: 'parnasa', goal: 'שבת' }),
    'screen-null': renderToStaticMarkup(createElement(EngineBoxScreen, atoms === undefined ? { source: null, onClose: () => {} } : { source: null, onClose: () => {}, atoms })),
    'screen-goal': renderToStaticMarkup(
      createElement(EngineBoxScreen, atoms === undefined ? { source: g(), onClose: () => {} } : { source: g(), onClose: () => {}, atoms, ...(plugTab ? { initial: { tab: 'plug' as const } } : {}) }),
    ),
  };
};
const stripTabs = (s: string) => s.replace(/<div class="eb-tabs"[\s\S]*?<\/div>/, '');

const RAW: Record<string, string> = import.meta.glob(['/src/**/*.{ts,tsx}'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const prod = Object.entries(RAW).filter(([p]) => !p.includes('__tests__') && !p.includes('.test.'));

describe('🧬 מנועים וחלקים — הגנות', () => {
  it('(א) בלי atoms — הזרימה הישנה ביט-זהה לתצלום', () => {
    expect(states(undefined)).toEqual(OLD);
  });

  it('(ב) עם atoms — לשונית ראשונה חדשה והיא לשונית-הפתיחה; אחרי "לחבר מנוע" תוכן הלשוניות הקיימות זהה', () => {
    for (const atoms of [atomsFixture(), null]) {
      // ברירת-המחדל (ATOMS 14.10): בלי initial.tab ⇒ "🧬 מנועים וחלקים" פתוחה
      const dflt = states(atoms);
      for (const k of ['start', 'goal-start', 'screen-goal'] as const) {
        expect(dflt[k], k).toMatch(/aria-selected="true"[^>]*data-tab="atoms"/);
        expect(dflt[k], k).toContain(atoms ? 'data-atoms="engines"' : '🧬 החלקים בהרכבה — עוד מעט');
      }
      const now = states(atoms, true);
      for (const k of ['goal-start', 'goal-plug', 'goal-plug-ro', 'goal-tab', 'screen-goal'] as const) {
        expect(stripTabs(now[k]), k).toBe(stripTabs((OLD as Record<string, string>)[k]));
        const tabs = [...now[k].matchAll(/data-tab="(\w+)"[^>]*>([^<]+)</g)].map((m) => m[1]);
        expect(tabs, k).toEqual(['atoms', 'plug', 'goal']);
      }
      expect(now['goal-plug']).toMatch(/aria-selected="true"[^>]*data-tab="plug"/);
      expect(now['screen-goal']).toMatch(/aria-selected="true"[^>]*data-tab="plug"/);
      // מקור בלי goal (שלב ב׳) ⇒ רק "מנועים וחלקים" + "לחבר מנוע"
      expect([...now.plug.matchAll(/role="tab"[^>]*data-tab="(\w+)"/g)].map((m) => m[1])).toEqual(['atoms', 'plug']);
      expect(stripTabs(now.plug)).toBe(OLD.plug);
    }
    // לחיצה על הלשונית הראשונה ⇒ המסך החדש
    const out = renderToStaticMarkup(createElement(EngineBoxBody, { source: g(), initial: { tab: 'atoms' }, atoms: atomsFixture() }));
    expect(out).toContain('data-atoms="engines"');
    expect(out).toMatch(/aria-selected="true"[^>]*data-tab="atoms"/);
    const empty = renderToStaticMarkup(createElement(EngineBoxBody, { source: g(), initial: { tab: 'atoms' }, atoms: null }));
    expect(empty).toContain('🧬 החלקים בהרכבה — עוד מעט');
  });

  it('(ג) קוד-ייצור לא מייבא את נתוני-הדוגמה של החלקים', () => {
    expect(prod.length).toBeGreaterThan(100);
    for (const [path, src] of prod) {
      expect(/atoms-fixtures|old-flow-markup/.test(src), path).toBe(false);
      if (path.includes('/components/enginebox/atoms/')) expect(/__tests__/.test(src), path).toBe(false);
    }
  });

  it('(ד) החוזה המשותף — md5 קבוע ושורה-חדשה אחת בסוף', () => {
    const buf = readFileSync('src/lib/atoms/contract.ts');
    // CHAIN 14.10: שינוי מכוון ותוספתי בלבד (Capability.parent? + ATOM_OUTPUT/outputKind) — היה d1633928cab86f6d2b0e9c3f8c7de598
    expect(createHash('md5').update(buf).digest('hex')).toBe('09e899edbeef152b596b5773914fab03');
    expect(buf.toString('utf8').endsWith('}\n')).toBe(true);
  });

  it('(ה) ההתאמה לא משוכפלת — רק optionsFor של החוזה', () => {
    expect(atomsBodySrc).toContain("import { optionsFor } from '../../../lib/atoms/contract'");
    expect(atomsBodySrc).toContain('optionsFor(atom, host)');
    for (const [path, src] of prod) {
      if (!path.includes('/components/enginebox/atoms/')) continue;
      expect(/worksOn\.includes|\.results\[/.test(src), path).toBe(false);
    }
  });
});
