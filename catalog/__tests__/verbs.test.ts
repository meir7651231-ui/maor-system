/**
 * 🔤 אלפבית-הפעלים (CATALOG-VERBS, 14.10.2026) — ratchet.
 * 1. כל פועל-עם-חוקים: המימוש-לדוגמה שלו מקיים את כל החוקים (n/n), והוא מתויג בפועל הזה ע"י הקורא.
 * 2. כל חוק **נושך**: יש לו מוטנט (מימוש מקולקל), והחוק נכשל עליו. חוק שלא תופס מוטנט = חוק ריק.
 * 3. 8 פעלי-הארגז: 30 החוקים של המאמת (src/lib/atoms/verify/laws.ts) עוברים על החלקים עצמם.
 * 4. הקורא דטרמיניסטי: אותו חלק + אותו זרע ⇒ אותה תווית, בדיוק.
 */
import { describe, it, expect } from 'vitest';
import * as B from '../lib/bridge';
import { VERBS, PRIMARY_ORDER } from '../lib/verbs.mjs';
import { evalVerb, bindingsOf, baseCases, directCall, fOf, probePart } from '../lib/probe.mjs';

type Sig = { takes: { name: string; d: unknown }[] };
type Verb = (typeof VERBS)[number] & { ref: { sig: Sig['takes']; fn: (b: typeof B) => (...a: unknown[]) => unknown }; mutants: Record<string, (b: typeof B) => (...a: unknown[]) => unknown>; laws: { id: string }[] };
const RUNTIME = (VERBS as Verb[]).filter((v) => !v.staticOnly);
const SEED = 12345;

function report(v: Verb, fn: (...a: unknown[]) => unknown, want?: { i: number; j?: number }) {
  const sig = { takes: v.ref.sig };
  const call = directCall(fn);
  const cases = baseCases(sig, call, SEED, B);
  const bs = bindingsOf(v, sig, cases);
  const b = want ? (bs.find((x: { i: number; j?: number }) => x.i === want.i && x.j === want.j) ?? want) : bs[0];
  return { b, rep: evalVerb(v, b, sig, cases, fOf(call), SEED, B, true) };
}

describe('אלפבית-הפעלים', () => {
  it('25–64 פעלים, מזהים ייחודיים, לכל אחד שם עברי ומשמעות; פועל-עם-חוקים — לפחות חוק אחד', () => {
    expect(VERBS.length).toBeGreaterThanOrEqual(25);
    expect(VERBS.length).toBeLessThanOrEqual(64);
    expect(new Set(VERBS.map((v) => v.id)).size).toBe(VERBS.length);
    for (const v of VERBS as Verb[]) {
      expect(v.he, v.id).toMatch(/[א-ת]/);
      expect(v.means, v.id).toMatch(/[א-ת]/);
      if (!v.staticOnly) expect(v.laws.length, v.id).toBeGreaterThan(0);
    }
    // 8 פעלי-הארגז בפנים
    for (const id of ['divide', 'merge', 'next', 'round', 'offset', 'escalate', 'rotate', 'fuzzy']) expect(VERBS.some((v) => v.id === id && v.box), id).toBe(true);
    // סדר-הספציפיות מכסה כל פועל-עם-חוקים
    for (const v of RUNTIME) expect(PRIMARY_ORDER, v.id).toContain(v.id);
  });

  for (const v of RUNTIME) {
    it(`${v.id} — המימוש-לדוגמה מקיים את כל החוקים`, () => {
      const { rep } = report(v, v.ref.fn(B));
      expect(rep, v.id).not.toBeNull();
      const bad = Object.entries(rep.laws as Record<string, { fail: number; why: string | null }>).filter(([, l]) => l.fail).map(([k, l]) => k + ': ' + l.why);
      expect(bad).toEqual([]);
      expect(rep.held, JSON.stringify({ witness: rep.witness, dep: rep.dep, laws: rep.laws })).toBe(true);
      // וגם הקורא המלא מוצא אותו
      const pp = probePart({ sig: { takes: v.ref.sig }, call: directCall(v.ref.fn(B)), seed: SEED, B });
      expect(pp.verbs.map((h: { id: string }) => h.id), v.id).toContain(v.id);
    });
    for (const law of v.laws) {
      it(`${law.id} — נושך: נכשל על המוטנט`, () => {
        const mk = v.mutants?.[law.id];
        expect(mk, 'חסר מוטנט ל-' + law.id).toBeTypeOf('function');
        const { b } = report(v, v.ref.fn(B));
        const { rep } = report(v, mk(B), b);
        expect(rep, law.id).not.toBeNull();
        expect(rep.laws[law.id].fail, JSON.stringify(rep.laws[law.id])).toBeGreaterThan(0);
        expect(rep.held).toBe(false);
      });
    }
  }

  /* MACHINE-V4: ארבעה פעלים רצים גם על נקודות (נקודות ⇒ רשת · נקודה שהולכת אחרי · נקודות אקראיות) — אותם חוקים, ולכל חוק מוטנט-נקודות */
  for (const v of (RUNTIME as (Verb & { refGeo?: Verb['ref']; mutantsGeo?: Verb['mutants'] })[]).filter((x) => x.refGeo)) {
    const geo = { ...v, ref: v.refGeo! } as Verb;
    it(`${v.id} על נקודות — המימוש-לדוגמה מקיים את כל החוקים`, () => {
      const { rep } = report(geo, geo.ref.fn(B));
      expect(rep, v.id).not.toBeNull();
      const bad = Object.entries(rep.laws as Record<string, { fail: number; why: string | null }>).filter(([, l]) => l.fail).map(([k, l]) => k + ': ' + l.why);
      expect(bad).toEqual([]);
      expect(rep.held, JSON.stringify({ witness: rep.witness, dep: rep.dep, laws: rep.laws })).toBe(true);
    });
    for (const law of v.laws) {
      it(`${law.id} על נקודות — נושך`, () => {
        const mk = v.mutantsGeo?.[law.id];
        expect(mk, 'חסר מוטנט-נקודות ל-' + law.id).toBeTypeOf('function');
        const { b } = report(geo, geo.ref.fn(B));
        const { rep } = report(geo, mk!(B), b);
        expect(rep, law.id).not.toBeNull();
        expect(rep.laws[law.id].fail, JSON.stringify(rep.laws[law.id])).toBeGreaterThan(0);
        expect(rep.held).toBe(false);
      });
    }
  }

  it('8 פעלי-הארגז: 30 חוקי-המאמת עוברים על החלקים עצמם (200 קלטים לחלק)', () => {
    expect(B.ATOM_LAWS.length).toBe(30);
    for (const atom of ['divide', 'merge', 'next', 'round', 'offset', 'escalate', 'rotate', 'fuzzy'] as const) {
      const r = B.rng(B.subSeed(7, atom));
      for (let i = 0; i < 200; i++) expect(B.violations(atom, B.atomCase(atom, r, i)), atom + '#' + i).toEqual([]);
    }
  });

  it('דטרמיניסטי: אותו חלק + אותו זרע ⇒ אותה תווית', () => {
    for (const v of RUNTIME.slice(0, 12)) {
      const a = probePart({ sig: { takes: v.ref.sig }, call: directCall(v.ref.fn(B)), seed: 99, B });
      const b = probePart({ sig: { takes: v.ref.sig }, call: directCall(v.ref.fn(B)), seed: 99, B });
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    }
  });
});
