/**
 * ratchet — ⚡ ביצועים (12.10.2026): שקילות-רינדור של צינור-הרשימה.
 * אין סביבת-React בבדיקות (בלי jsdom/testing-library — לא מוסיפים תלויות), לכן הנעילה
 * היא על ה**מנוע הטהור**: filterSupporterList+sortSupporterList (קוראים מ-SupStats,
 * ממומואיזים במסך) חייבים להחזיר **בדיוק** את אותן שורות באותו סדר כמו הפרדיקט-האינליין
 * והמיון-המקורי שישבו בגוף SupportersView לפני השינוי (האורקל כאן = העתק-מילולי שלהם).
 * נמדד: 16,000 תורמים — הקשה 1.1–1.4 שנ׳, מיון 1.0 שנ׳ (CPU ×4) לפני; ראו הדוח.
 */
import { describe, expect, it } from 'vitest';
import type { Supporter } from '../../../types/domain';
import { numMatch } from '../../families/lib';
import { normSearch } from '../../../lib/validate';
import { eyesTotal, stageIndex } from '../../../lib/ayin';
import {
  allSupPhones, buildSupporterStats, filterSupporterList, hokEffectivelyActive, hokRecordedThisMonth, sortSupporterList,
  supAcqYear, supCount, supGaveInPeriod, supHasRegion, supIls, supLast, supLastInBucket, supLastInPeriod, supScore, supTier,
  supTotalIls, supUsd, type SupListFilters, type SupSortKey, LAST_BUCKETS,
} from '../lib';
import { atRiskIdSet, matchSegment, SEGMENTS, type SegmentKey } from '../segments';
import { mulberry32, randomSupporters } from './perf-fixtures';

const TODAY = '2026-10-12';
const RATE = 3.7;

/* ── האורקל: הפרדיקט-האינליין המקורי של SupportersView (לפני 12.10.2026), מילה-במילה ── */
function oldFilter(visibleBase: Supporter[], f: F, today: string, rate: number, atRiskIds?: ReadonlySet<string>): Supporter[] {
  const { dq, cat, purposeF, regionF, hokF, tierF, lastF, monthF, gaveYearF, periodMode, acqYearF, colF, nextF, ayinF } = f;
  const segF = f.segF ?? null;
  const nq = normSearch(dq);
  const qd = dq.replace(/\D/g, '');
  return visibleBase.filter((sp) => {
    if (cat !== 'all' && (sp.cat || '') !== cat) return false;
    if (purposeF !== 'all' && (sp.forWho || '').trim() !== purposeF) return false;
    if (regionF !== 'all' && !supHasRegion(sp, regionF)) return false;
    if (hokF === 'active' && !sp.hok?.active) return false;
    if (hokF === 'due' && !(hokEffectivelyActive(sp, today) && !hokRecordedThisMonth(sp, today))) return false;
    if (tierF && supTier(supScore(sp, rate)).label !== tierF) return false;
    if (segF && !matchSegment(sp, segF, visibleBase, today, rate, atRiskIds)) return false;
    if (lastF && !supLastInBucket(sp, today, lastF)) return false;
    if (monthF || gaveYearF) {
      const inPeriod = periodMode === 'last'
        ? supLastInPeriod(sp, gaveYearF, monthF)
        : supGaveInPeriod(sp, gaveYearF, monthF);
      if (!inPeriod) return false;
    }
    if (acqYearF && supAcqYear(sp) !== acqYearF) return false;
    if (!numMatch(colF.count, supCount(sp))) return false;
    if (!numMatch(colF.total, Math.round(supTotalIls(sp, rate)))) return false;
    if (!numMatch(colF.score, supScore(sp, rate))) return false;
    if (nextF && !(sp.nextDate && sp.nextDate <= today)) return false;
    if (ayinF === 'eyes' && !(sp.ayin && eyesTotal(sp.ayin) > 0)) return false;
    if (ayinF === 'noeyes' && sp.ayin && eyesTotal(sp.ayin) > 0) return false;
    if (ayinF === 'today' && !(sp.ayin && (sp.ayin.lastTouch === today || sp.ayin.log?.some((l) => l.date === today)))) return false;
    if (!dq.trim()) return true;
    const phoneHit = qd.length >= 3 && allSupPhones(sp).some((r) => r.num.replace(/\D/g, '').includes(qd));
    const textHit =
      !!nq && normSearch([sp.name, sp.email, sp.cat, sp.address, sp.forWho].join(' ')).includes(nq);
    return phoneHit || textHit;
  });
}

/* ── האורקל: sortVal + המיון המקורי (sortVal×2 לכל השוואה, localeCompare 'he') ── */
function sortVal(sp: Supporter, key: SupSortKey, rate = 3.7): string | number {
  switch (key) {
    case 'name': return sp.name;
    // 🪪 13.10 — מפתח חדש (לא היה במיון-הישן); המפרט שלו מוגדר כאן במנותק מהמימוש:
    // שם-המשפחה המפוצל, ובתורם שעוד לא פוצל — השם המלא.
    case 'lastName': return (sp.lastName || '').trim() || (sp.name || '').trim();
    case 'cat': return sp.cat || '';
    case 'phone': return sp.phone || '';
    case 'email': return sp.email || '';
    case 'count': return supCount(sp);
    case 'ils': return supIls(sp);
    case 'usd': return supUsd(sp);
    case 'last': return supLast(sp);
    case 'nextDate': return sp.nextDate || '';
    case 'score': return supScore(sp, rate);
    case 'stage': return sp.ayin ? stageIndex(sp.ayin.stage) : -1;
    case 'eyes': return sp.ayin ? eyesTotal(sp.ayin) : -1;
    case 'paid': return sp.ayin?.paid ? 1 : 0;
  }
}
function oldSort(list: Supporter[], key: SupSortKey, dir: 1 | -1, rate: number): Supporter[] {
  return [...list].sort((a, b) => {
    const va = sortVal(a, key, rate);
    const vb = sortVal(b, key, rate);
    const c = typeof va === 'number' ? va - (vb as number) : String(va).localeCompare(String(vb), 'he');
    return c * dir;
  });
}

type F = SupListFilters & { segF: SegmentKey | null };
const EMPTY: F = {
  dq: '', cat: 'all', purposeF: 'all', regionF: 'all', hokF: null, tierF: null, segF: null, lastF: null, monthF: null,
  gaveYearF: null, periodMode: 'gave', acqYearF: null, colF: { count: '', total: '', score: '' }, nextF: false, ayinF: null,
};

/** מסננים אקראיים — כל שדה נדלק בהסתברות קטנה, כך שרוב הקומבינציות דלילות (כמו בשימוש-אמת). */
function randomFilters(r: () => number): F {
  const p = <T,>(a: readonly T[]): T => a[Math.floor(r() * a.length)];
  const on = (q: number) => r() < q;
  return {
    dq: on(0.4) ? p(['', 'כהן', 'דוד', 'gold', '0501', '212', 'example', 'לוי 1', '  ', '@', 'ב', '99']) : '',
    cat: on(0.25) ? p(['חברים', 'משפחה', 'עסקים', 'קהילה', 'לא-קיים']) : 'all',
    purposeF: on(0.2) ? p(['חתונות', 'קמחא דפסחא', 'בניין']) : 'all',
    regionF: on(0.2) ? p(['il', 'intl'] as const) : 'all',
    hokF: on(0.2) ? p(['active', 'due'] as const) : null,
    tierF: on(0.25) ? p(['זהב', 'כסף', 'ארד', 'רדומה']) : null,
    segF: on(0.2) ? p(SEGMENTS.map((s) => s.key)) : null,
    lastF: on(0.2) ? p(LAST_BUCKETS.map((b) => b.key)) : null,
    monthF: on(0.15) ? 1 + Math.floor(r() * 12) : null,
    gaveYearF: on(0.15) ? 2018 + Math.floor(r() * 9) : null,
    periodMode: on(0.5) ? 'last' : 'gave',
    acqYearF: on(0.15) ? 2018 + Math.floor(r() * 9) : null,
    colF: {
      count: on(0.15) ? p(['3', '3+', '1-5', '0', ' 2 + ']) : '',
      total: on(0.15) ? p(['500+', '1000-5000', '0', '12']) : '',
      score: on(0.15) ? p(['600+', '400-799', '850']) : '',
    },
    nextF: on(0.15),
    ayinF: on(0.2) ? p(['eyes', 'noeyes', 'today'] as const) : null,
  };
}

const SORT_KEYS: SupSortKey[] = ['name', 'lastName', 'cat', 'phone', 'email', 'count', 'ils', 'usd', 'last', 'nextDate', 'score', 'stage', 'eyes', 'paid'];

describe('filterSupporterList ≡ הפרדיקט-האינליין המקורי (אותן שורות, אותו סדר)', () => {
  it('200 קומבינציות-מסננים אקראיות על 600 תורמים אקראיים — זהות מלאה', () => {
    const sups = randomSupporters(600, 11, TODAY);
    const stats = buildSupporterStats(sups, RATE, Date.now());
    const r = mulberry32(99);
    let nonEmpty = 0;
    for (let i = 0; i < 200; i++) {
      const f = randomFilters(r);
      const atRiskIds = f.segF === 'atrisk' ? atRiskIdSet(sups, TODAY) : undefined;
      const matchSeg = f.segF ? (sp: Supporter) => matchSegment(sp, f.segF!, sups, TODAY, RATE, atRiskIds) : null;
      const expected = oldFilter(sups, f, TODAY, RATE, atRiskIds);
      const actual = filterSupporterList(sups, stats, f, TODAY, RATE, matchSeg);
      expect(actual.map((s) => s.id)).toEqual(expected.map((s) => s.id));
      if (expected.length) nonEmpty++;
    }
    expect(nonEmpty).toBeGreaterThan(100); // הבדיקה לא טריוויאלית — רוב הקומבינציות מחזירות שורות
  });

  it('בלי מסננים — כל הרשימה כמו-שהיא (אותו סדר)', () => {
    const sups = randomSupporters(300, 5, TODAY);
    const stats = buildSupporterStats(sups, RATE, Date.now());
    expect(filterSupporterList(sups, stats, EMPTY, TODAY, RATE, null).map((s) => s.id)).toEqual(sups.map((s) => s.id));
  });

  it('חיפוש-טלפון (≥3 ספרות, כולל מספרים נוספים) וחיפוש-טקסט מנורמל — זהים לאורקל', () => {
    const sups = randomSupporters(400, 21, TODAY);
    const stats = buildSupporterStats(sups, RATE, Date.now());
    for (const dq of ['050', '12', '0501234567', '+972', 'גולדברג', 'goldberg', 'GOLD', 'ב"ן', 'בן דוד', 'רחוב', 'u1']) {
      const f = { ...EMPTY, dq };
      expect(filterSupporterList(sups, stats, f, TODAY, RATE, null).map((s) => s.id)).toEqual(oldFilter(sups, f, TODAY, RATE).map((s) => s.id));
    }
  });
});

describe('sortSupporterList ≡ המיון המקורי — מיון-מעוטר יציב, Collator("he") יחיד', () => {
  it('13 מפתחות × 2 כיוונים × 3 זרעים — אותו סדר (כולל שוויונים)', () => {
    for (const seed of [2, 13, 77]) {
      const sups = randomSupporters(500, seed, TODAY);
      const stats = buildSupporterStats(sups, RATE, Date.now());
      for (const key of SORT_KEYS) {
        for (const dir of [1, -1] as const) {
          const expected = oldSort(sups, key, dir, RATE).map((s) => s.id);
          const actual = sortSupporterList(sups, stats, key, dir, RATE).map((s) => s.id);
          expect(actual, key + ':' + dir).toEqual(expected);
        }
      }
    }
  });

  it('לא משנה את הרשימה הנכנסת (כמו [...list].sort)', () => {
    const sups = randomSupporters(50, 4, TODAY);
    const ids = sups.map((s) => s.id);
    const stats = buildSupporterStats(sups, RATE, Date.now());
    sortSupporterList(sups, stats, 'score', -1, RATE);
    expect(sups.map((s) => s.id)).toEqual(ids);
  });

  it('סינון ואז מיון — הצינור המלא ≡ האורקל (filter→sort) עבור 40 קומבינציות', () => {
    const sups = randomSupporters(400, 31, TODAY);
    const stats = buildSupporterStats(sups, RATE, Date.now());
    const r = mulberry32(5);
    for (let i = 0; i < 40; i++) {
      const f = randomFilters(r);
      const key = SORT_KEYS[Math.floor(r() * SORT_KEYS.length)];
      const dir = r() < 0.5 ? 1 : -1;
      const atRiskIds = f.segF === 'atrisk' ? atRiskIdSet(sups, TODAY) : undefined;
      const matchSeg = f.segF ? (sp: Supporter) => matchSegment(sp, f.segF!, sups, TODAY, RATE, atRiskIds) : null;
      const expected = oldSort(oldFilter(sups, f, TODAY, RATE, atRiskIds), key, dir, RATE).map((s) => s.id);
      const actual = sortSupporterList(filterSupporterList(sups, stats, f, TODAY, RATE, matchSeg), stats, key, dir, RATE).map((s) => s.id);
      expect(actual).toEqual(expected);
    }
  });
});
