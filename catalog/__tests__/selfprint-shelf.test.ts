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
import { offer } from '../selfprint/shelf.mjs';

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
