/**
 * 🗄️ SHELF-FIX (3.11.2026) — ratchet לבאג "הממוצע אבד" (RECIPES2 §3, אומת ע״י המנהל ב-runs/rc.json מול runs/r2.json).
 *
 * הבאג: ב-r2 נכנסה ראשונה למדף (סבב 1, מתכון fold-mapped-stat) גרסה של "ממוצע" שמחשבת סכום של x/n. ברשימה של 100 מקלטי-הלחץ
 * היא מחזירה ‎−5.55e-17‎ במקום 0 ⇒ "שונה בלחץ" ⇒ average יצא מ"נבנה מחדש בדיוק", ו-mean/aboveMean (SP-FAIR) ו"סימן-מול-הממוצע"
 * (א׳) נפלו. המדף (shelf.mjs › offer) ממופתח לפי טביעה; הגרסה הנכונה (סכום÷ספירה, אותה טביעה) נזרקה ככפולה.
 *
 * השורש (החלטת-מנהל): המכונה לא טעתה — **הסרגל** (grow/lib.mjs › canon/sameOut) עיגל ל-12 ספרות יחסיות בלבד, ולכן רעש-צף
 * ליד אפס נחשב "תשובה אחרת". התיקון: רצפה ליד אפס (setNumTol, budget.numTol). המדף לא שונה.
 */
import { describe, it, expect, afterEach } from 'vitest';
import * as L from '../grow/lib.mjs';
import { offer, onShelf, sameVersion } from '../selfprint/shelf.mjs';

type Thing = { id: string; key: string; fp: string; steps: number; nParts: number; sig: string[]; f: (xs: number[]) => number | null };
const SIG = ['nums'];
const S = L.samplesOf(SIG);
const ST = L.stressSamples(SIG);
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, x) => a + x, 0) / xs.length : null); // סכום ÷ ספירה
const meanOfParts = (xs: number[]) => (xs.length ? xs.reduce((a, x) => a + x / xs.length, 0) : null); // סכום של x/n
function thing(id: string, f: Thing['f'], steps: number): Thing {
  const j = L.judge(SIG, S, S.map(([xs]) => f(xs as number[])));
  return { id, key: id, fp: j.fp, steps, nParts: 3, sig: SIG, f };
}
const outsOf = (t: Thing) => ST.map(([xs]) => t.f(xs as number[]));
const cx = { better: L.better, stressSamples: () => ST, stressOuts: outsOf, stressCompare: L.stressCompare, extraDiffers: (t: Thing, cur: Thing) => L.extraSamples(SIG).some(([xs]) => !L.sameOut(t.f(xs as number[]), cur.f(xs as number[]))) };
/** מה שהמדף "יודע" על הממוצע: מה שיושב בטביעה הזו — והאם הוא עובר את בדיקת-הלחץ מול הממוצע האמיתי. */
function meanAvailable() {
  const shelf = new Map<string, Thing>();
  const wrong = thing('sumOfParts', meanOfParts, 40);
  const right = thing('sumOverCount', mean, 50); // לא זול יותר — כמו ב-r2 (נבנתה אחרי ⇒ "כפול")
  offer(shelf, wrong, cx);
  const second = offer(shelf, right, cx).kind;
  const onShelf = shelf.get(right.fp)!;
  return { second, sameFp: wrong.fp === right.fp, ok: L.stressCompare(ST, outsOf(onShelf), outsOf(right)).same };
}
afterEach(() => L.setNumTol(false));

describe('SHELF-FIX · הסרגל עם רצפה ליד אפס (numTol)', () => {
  it('‎−5.55e-17 מול 0‎ — "שונה" בלי הדגל, "זהה" איתו (גם −0 ⇒ 0)', () => {
    expect(L.sameOut(-5.551115123125783e-17, 0)).toBe(false);
    L.setNumTol(true);
    expect(L.sameOut(-5.551115123125783e-17, 0)).toBe(true);
    expect(L.sameOut([1e-13, -0], [0, 0])).toBe(true);
  });
  it('לא מטשטשים תשובות אמיתיות: ‎1e-3‎ מול 0, ‎1.0000001‎ מול 1, ‎0.1+0.2‎ מול ‎0.31‎ — שונים גם עם הדגל', () => {
    L.setNumTol(true);
    expect(L.sameOut(1e-3, 0)).toBe(false);
    expect(L.sameOut(1.0000001, 1)).toBe(false);
    expect(L.sameOut(0.1 + 0.2, 0.31)).toBe(false);
    expect(L.sameOut(1e-11, 0)).toBe(false);
    expect(L.sameOut(0.1 + 0.2, 0.3)).toBe(true); // כמו תמיד
    expect(L.sameOut(123456789012345, 123456789012346)).toBe(true); // מעל 1 — 12 ספרות יחסיות, כמו היום
  });
  it('בלי הדגל — canon ביט-זהה לנוסחה של היום', () => {
    for (const v of [0, -0, 1e-17, -5.551115123125783e-17, 0.3333333333333333, 2 / 3, 1e15 + 0.5, -123.456789012345, 7]) {
      const old = Number(v.toPrecision(12)); expect(L.canon(v)).toBe(Object.is(old, -0) ? 0 : old);
    }
    expect(L.numTolOn()).toBe(false);
  });
});

describe('SHELF-FIX · שחזור: השגויה-בעיני-הסרגל נכנסת ראשונה', () => {
  it('בלי הדגל (הבאג): אותה טביעה, הנכונה נזרקת ככפולה, ומה שעל המדף "נכשל" בלחץ מול הממוצע', () => {
    const r = meanAvailable();
    expect(r).toEqual({ second: 'dup', sameFp: true, ok: false });
  });
  it('עם הדגל: מה שעל המדף עובר את בדיקת-הלחץ מול הממוצע — הממוצע זמין', () => {
    L.setNumTol(true);
    const r = meanAvailable();
    expect(r).toEqual({ second: 'dup', sameFp: true, ok: true });
  });
});

/**
 * SHELF-V (9.11.2026) — "מי שנכנס ראשון תופס את המקום" גם כשהשוני **אמיתי**: מונה ה-stressDiffer של r2t מצא ~1,500 מועמדים עם
 * אותה טביעה שנזרקו כשהם שונים באמת בלחץ — ביניהם "מקסימום". ב-r2/r2t "המקסימום" שעל המדף (80acfe2f, סבב 1) נגמר לו
 * תקציב-הצעדים ברשימה של 500 (null) ⇒ extreme לא "נבנה מחדש בדיוק"; גרסה שרצה גם שם נזרקה ככפולה.
 * התיקון (budget.shelfVariants = { max }): עד max גרסאות לכל טביעה שנבדלות בלחץ; החלפה רק בין זהות-בלחץ, כמו היום.
 */
describe('SHELF-V · כמה גרסאות לכל טביעה (shelfVariants)', () => {
  const cxV = (max = 4) => ({ ...cx, sameOut: L.sameOut, variants: { max }, index: new Map() });
  const max = (xs: number[]) => (xs.length ? xs.reduce((a, x) => (x > a ? x : a), -Infinity) : null);
  const maxSlow = (xs: number[]) => (xs.length > 250 ? null : max(xs)); // כמו 80acfe2f: לא רץ על 500
  const atFp = (shelf: Map<string, Thing>, fp: string) => [...shelf.values()].filter((t) => t.fp === fp).map((t) => t.id).sort();
  it('"המקסימום": האיטי (נגמר ב-500) נכנס ראשון ⇒ המהיר עדיין נשמר כגרסה; בלי הדגל — נזרק', () => {
    const slow = thing('slow', maxSlow, 10); const fast = thing('fast', max, 20);
    expect(slow.fp).toBe(fast.fp);
    expect(outsOf(slow).filter((o) => o === null).length).toBe(3); // 3 מ-12 (כל הרשימות של 500) ⇒ רץ על רובם
    const off = new Map<string, Thing>();
    offer(off, slow, cx);
    expect(offer(off, fast, cx).kind).toBe('dup');
    const on = new Map<string, Thing>(); const c = cxV();
    offer(on, slow, c);
    expect(offer(on, fast, c).kind).toBe('variant');
    expect(atFp(on, fast.fp)).toEqual(['fast', 'slow']);
    expect(onShelf(on, fast) && onShelf(on, slow)).toBe(true);
    expect(on.get(fast.fp + '~1')).toBe(fast);
  });
  it('הממוצע בסרגל הישן (בלי numTol): שתי הגרסאות נשמרות, בכל סדר', () => {
    for (const order of [['parts', 'over'], ['over', 'parts']]) {
      const ts: Record<string, Thing> = { parts: thing('parts', meanOfParts, 40), over: thing('over', mean, 50) };
      const sh = new Map<string, Thing>(); const c = cxV();
      expect(offer(sh, ts[order[0]], c).kind).toBe('new');
      expect(offer(sh, ts[order[1]], c).kind).toBe('variant');
      expect(atFp(sh, ts.over.fp)).toEqual(['over', 'parts']);
    }
  });
  it('עם numTol שני הממוצעים הם אותה גרסה ⇒ כמו היום (כפול / החלפה בזול)', () => {
    L.setNumTol(true);
    const sh = new Map<string, Thing>(); const c = cxV();
    offer(sh, thing('parts', meanOfParts, 40), c);
    expect(offer(sh, thing('over', mean, 50), c).kind).toBe('dup');
    expect(offer(sh, thing('cheap', mean, 30), c).kind).toBe('replaced');
    expect(atFp(sh, thing('x', mean, 1).fp)).toEqual(['cheap']);
  });
  it('החלפה רק בין זהות-בלחץ: גרסה זולה מחליפה את הגרסה שלה, לא את האחרת', () => {
    const sh = new Map<string, Thing>(); const c = cxV();
    const slow = thing('slow', maxSlow, 10); const fast = thing('fast', max, 20);
    offer(sh, slow, c); offer(sh, fast, c);
    const fast2 = thing('fast2', (xs) => (xs.length ? Math.max(...xs) : null), 5);
    expect(offer(sh, fast2, c)).toMatchObject({ kind: 'replaced', cur: fast });
    expect(atFp(sh, fast.fp)).toEqual(['fast2', 'slow']);
    expect(offer(sh, thing('fast3', max, 99), c).kind).toBe('dup');
  });
  it('תקרה ⇒ כפול why=cap; לא-רץ על רוב הלחץ ⇒ כפול why=noRun (לא נשמר)', () => {
    const sh = new Map<string, Thing>(); const c = cxV(2);
    offer(sh, thing('slow', maxSlow, 10), c); offer(sh, thing('fast', max, 20), c);
    expect(offer(sh, thing('mid', (xs) => (xs.length > 100 ? null : max(xs)), 15), c)).toMatchObject({ kind: 'dup', why: 'cap' });
    const sh2 = new Map<string, Thing>(); const c2 = cxV();
    offer(sh2, thing('fast', max, 20), c2);
    expect(offer(sh2, thing('tiny', (xs) => (xs.length > 30 ? null : max(xs)), 5), c2)).toMatchObject({ kind: 'dup', why: 'noRun' });
    expect(sh2.size).toBe(1);
  });
  it('sameVersion — מוצא את הגרסה הזהה-בלחץ בלבד', () => {
    const sh = new Map<string, Thing>(); const c = cxV();
    const slow = thing('slow', maxSlow, 10);
    offer(sh, slow, c);
    expect(sameVersion(sh, thing('fast', max, 20), c)).toBeUndefined();
    expect(sameVersion(sh, thing('slow2', maxSlow, 3), c)?.v).toBe(slow);
  });
});

