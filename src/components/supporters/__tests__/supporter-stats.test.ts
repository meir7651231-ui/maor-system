/**
 * ratchet — ⚡ ביצועים (12.10.2026): סטטיסטיקת-תורם במעבר-אחד (buildSupporterStats).
 * נמדד על הלקוח-האמיתי (16,000 תורמים · 34MB): הקשה 1.1–1.4 שנ׳, מיון 1.0 שנ׳ (CPU ×4) —
 * כי כל רינדור חישב מחדש supCount/supTotalIls/supScore/supIls/supUsd/supLast לכל תורם
 * (~10 מעברי-hist פר-תורם). הנעילה: כל שדה ב-SupStats **שווה ביט-לביט** לפונקציית-המקור
 * על תורמים אקראיים — כולל hist ריק/חסר, שורות '$', סכומים שליליים/אפס ושדות חסרים.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  buildSupporterStats, donationYears, donationYearsFromStats, supAcqYear, supCount, supIls, supLast, supScore, supTier,
  supTotalIls, supUsd, supporterStats, totalLabel, totalLabelOf, rfmScore, searchTextOf, phoneDigitsOf,
} from '../lib';
import { allSupPhones } from '../lib';
import { normSearch } from '../../../lib/validate';
import { randomSupporters } from './perf-fixtures';
import type { Supporter } from '../../../types/domain';

const RATE = 3.8;

describe('buildSupporterStats ≡ הפונקציות המקוריות (property, 3 זרעים × 400 תורמים)', () => {
  for (const seed of [1, 7, 42]) {
    it('זרע ' + seed, () => {
      const sups = randomSupporters(400, seed);
      const now = Date.now();
      const stats = buildSupporterStats(sups, RATE, now);
      expect(stats.size).toBe(sups.length);
      for (const sp of sups) {
        const st = stats.get(sp)!; // ⚠️ ביקורת (12.10): המפתח = הרשומה (חסין מזהים-כפולים)
        expect(st).toBeDefined();
        // NaN≡NaN (toEqual) — שדה חסר ב-hist מניב NaN בשתי הדרכים, לא ערך שונה
        expect(st.ils).toEqual(supIls(sp));
        expect(st.usd).toEqual(supUsd(sp));
        expect(st.count).toEqual(supCount(sp));
        expect(st.last).toBe(supLast(sp));
        expect(st.totalIls).toEqual(supTotalIls(sp, RATE));
        expect(st.score).toBe(rfmScore(supTotalIls(sp, RATE), supLast(sp), supCount(sp), now));
        expect(st.tier).toEqual(supTier(st.score));
        expect(st.acqYear).toBe(supAcqYear(sp));
        // עצלים: לא מחושבים בבנייה (פתיחת-טאב זולה), מתמלאים בגישה הראשונה ונשמרים
        expect(st.search).toBeUndefined();
        expect(searchTextOf(st, sp)).toBe(normSearch([sp.name, sp.email, sp.cat, sp.address, sp.forWho].join(' ')));
        expect(st.search).toBe(searchTextOf(st, sp));
        expect(phoneDigitsOf(st, sp)).toEqual(allSupPhones(sp).map((r) => r.num.replace(/\D/g, '')));
        expect(totalLabelOf(st.ils, st.usd)).toBe(totalLabel(sp));
      }
      expect(donationYearsFromStats(stats.values())).toEqual(donationYears(sups));
    });
  }

  it('supScore ≡ rfmScore עם Date.now() (הנוסחה המשותפת — אותם ספים)', () => {
    const sups = randomSupporters(50, 3);
    // ⚠️ ביקורת (12.10): "עכשיו" אחד מוזרק לשתי הדרכים (Date.now מרוגל) — בלי זה הבדיקה הייתה
    // תלויה בשעון (שתי קריאות Date.now סביב 12:00 המקומי) והסובלנות ‎≤350‎ שלצידה הייתה מתה.
    const now = Date.now();
    const spy = vi.spyOn(Date, 'now').mockReturnValue(now);
    try {
      for (const sp of sups) {
        expect(supScore(sp, RATE)).toBe(rfmScore(supTotalIls(sp, RATE), supLast(sp), supCount(sp), now));
      }
    } finally {
      spy.mockRestore();
    }
  });

  it('⚠️ ביקורת (12.10): הציון מתחלף ב-12:00 המקומי (עיגון T12:00:00) — memo-הרשימה חייב להתרענן אז', () => {
    const sp = { id: 'n', name: 'נ', donations: [], count: 5, ils: 2000, usd: 0, last: '2026-09-11', hist: [] } as unknown as Supporter;
    const T = (hm: string) => new Date('2026-10-12T' + hm + ':00').getTime(); // 31 ימים ⇒ גבול 30 נחצה בצהריים
    const before = buildSupporterStats([sp], 3.7, T('11:59')).get(sp)!;
    const after = buildSupporterStats([sp], 3.7, T('12:00')).get(sp)!;
    expect(before.score).toBe(860); // R=350 (30 יום) + F=230 + M=280
    expect(before.tier.label).toBe('זהב');
    expect(after.score).toBe(790); // R=280 (31 יום)
    expect(after.tier.label).toBe('כסף');
  });

  it('⚠️ ביקורת (12.10): שני תורמים עם אותו id — כל שורה במספרים של עצמה (מפתח = הרשומה, לא ה-id)', () => {
    const a = { id: 'dup', name: 'א', donations: [], count: 1, ils: 100, usd: 0, last: '2026-01-01', hist: [] } as unknown as Supporter;
    const b = { id: 'dup', name: 'ב', donations: [], count: 9, ils: 9000, usd: 0, last: '2026-10-01', hist: [] } as unknown as Supporter;
    const stats = buildSupporterStats([a, b], 3.7, Date.now());
    expect(stats.size).toBe(2);
    expect(stats.get(a)!.ils).toBe(100);
    expect(stats.get(b)!.ils).toBe(9000);
  });

  it('מקרי-קצה מפורשים: hist חסר/ריק · שורת $ · שורה שלילית · שדות חסרים · hist עתידי', () => {
    const base = { id: 'x', name: 'א', donations: [], count: 2, ils: 100, usd: 10, last: '2026-01-05' } as unknown as Supporter;
    const cases: Supporter[] = [
      base,
      { ...base, hist: [] },
      { ...base, hist: [{ d: '2026-03-01', a: 50, c: '$' }] },
      { ...base, hist: [{ d: '2025-03-01', a: -30 }, { d: '2025-04-01', a: 0 }] },
      { ...base, count: undefined, ils: undefined, usd: undefined, last: undefined, hist: [{ d: '2026-09-09', a: 7 }] } as unknown as Supporter,
      { ...base, hist: [{ d: '2027-01-01', a: 1 }] },
      { ...base, hist: [{ d: '2026-02-02', a: undefined as unknown as number }] },
    ];
    const now = Date.now();
    for (const sp of cases) {
      const st = supporterStats(sp, RATE, now);
      expect(st.ils).toEqual(supIls(sp));
      expect(st.usd).toEqual(supUsd(sp));
      expect(st.count).toEqual(supCount(sp));
      expect(st.last).toBe(supLast(sp));
      expect(st.totalIls).toEqual(supTotalIls(sp, RATE));
      expect(st.score).toBe(rfmScore(supTotalIls(sp, RATE), supLast(sp), supCount(sp), now));
      expect(st.acqYear).toBe(supAcqYear(sp));
    }
  });

  it('ברירת-מחדל השער 3.7 — כמו supTotalIls/supScore', () => {
    const sp = randomSupporters(1, 9)[0];
    const now = Date.now();
    expect(buildSupporterStats([sp], undefined, now).get(sp)!.totalIls).toEqual(supTotalIls(sp));
  });
});
