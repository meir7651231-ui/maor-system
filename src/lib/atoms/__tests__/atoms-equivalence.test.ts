/**
 * ratchet — 🧩 שקילות: כל חלק הוא *אותו חישוב* כמו המנוע הגדול שממנו פורק (ATOMS, 14.10.2026).
 * מה זה שומר: אם מישהו ישנה חלק כך שהוא כבר לא מחשב בדיוק כמו המקור — הבדיקה נשברת. כך החלק
 * נשאר "הבורג האמיתי" של המנוע, לא חיקוי. (הבדיקות מייבאות את מנועי-המקור; החלקים עצמם — לא.)
 */
import { describe, expect, it } from 'vitest';
import { divideSpan, escalationPlan, escalationState, fuzzyFind, mergeRuns, nextAfter, normHe, offsetAll, pointsAt, resolveRelative, roundTo, turnIndex, turnOf, dayIndex, wordScore, type RoundDir } from '../parts';
import { addDaysIso, dayTimes, dayZmanim, hmToMin, markZmanim, minToHm, resolveTimeToken, resolveZmanimLoc } from '../../../components/parnasa/zmanimBoard';
import { activeAds, adRotation, prNorm, PR_CONCEPTS, PR_ESCALATE_MS, routeRequest, tokMatch } from '../../../components/parnasa/lib';
import { classifyDay, hebrewClosedWindows } from '../../telephony/engine';
import type { PrAd, PrListing, PrRequest } from '../../../types/domain';

const DATES = ['2026-01-07', '2026-03-20', '2026-06-21', '2026-09-11', '2026-10-14', '2026-12-21'];
const LOCS = [resolveZmanimLoc({ city: 'jerusalem' }), resolveZmanimLoc({ city: 'bneibrak' }), resolveZmanimLoc({ city: 'haifa' })];

describe('✂️ divide + 🎯 round ≡ השעות הזמניות של dayZmanim', () => {
  // השעה הזמנית = (שקיעה − נץ) / 12; סוף-זמן ⇒ למטה, התחלה ⇒ למעלה, חצות ⇒ לקרוב.
  const GRA: [key: string, at: number, dir: RoundDir][] = [
    ['shmaGra', 3, 'down'],
    ['tefila', 4, 'down'],
    ['chatzot', 6, 'nearest'],
    ['minchaG', 6.5, 'up'],
    ['minchaK', 9.5, 'up'],
    ['plag', 10.75, 'up'],
  ];
  for (const loc of LOCS) {
    for (const iso of DATES) {
      it(`${loc.label} ${iso}`, () => {
        const t = dayTimes(iso, loc);
        const sr = hmToMin(t.sunrise)!;
        const ss = hmToMin(t.sunset)!;
        const rows = new Map(dayZmanim(iso, loc).map((r) => [r.key, r.time]));
        const pts = pointsAt({ from: sr, to: ss }, 12, GRA.map((g) => g[1]));
        GRA.forEach(([key, , dir], i) => expect(minToHm(roundTo(pts[i], 1, dir)), key).toBe(rows.get(key)));
        // מג״א: אותו חלק, טווח אחר — עלות (נץ−72) עד צאת (שקיעה+72).
        const [mga3] = pointsAt({ from: sr - 72, to: ss + 72 }, 12, [3]);
        expect(minToHm(roundTo(mga3, 1, 'down'))).toBe(rows.get('shmaMga'));
        // divideSpan לפי מספר נותן את אותם גבולות בדיוק (חצות = סוף החלק ה-6).
        expect(divideSpan({ from: sr, to: ss }, { parts: 12 })[5].to).toBe(pointsAt({ from: sr, to: ss }, 12, [6])[0]);
      });
    }
  }
});

describe('⏱️ offset ≡ resolveTimeToken (sh/tz/nz) ו-הדלקת-נרות', () => {
  const loc = LOCS[0];
  const TOKENS = ['sh-15', 'sh', 'tz+5', 'TZ - 10', 'nz', 'nz-30', '06:45', '24:00', 'xx+3', 'sh+1000', '', 'sh+999'];
  for (const iso of DATES) {
    it(iso, () => {
      const t = dayTimes(iso, loc);
      const anchors = { sh: t.sunset, tz: t.tzeis, nz: t.sunrise };
      for (const tok of TOKENS) {
        const m = resolveRelative(tok, anchors);
        expect(m === null ? '' : minToHm(m), tok).toBe(resolveTimeToken(tok, t));
      }
      // הדלקת נרות = שקיעה − מנהג-העיר.
      expect(minToHm(offsetAll([hmToMin(t.sunset)!], -loc.candleMin)[0])).toBe(t.candle);
    });
  }
});

describe('🔗 merge ≡ hebrewClosedWindows (שבת ליד חג = חלון אחד)', () => {
  const tenant = { city: 'jerusalem', timezone: 'Asia/Jerusalem' };
  for (const [from, days] of [['2026-09-01', 60], ['2027-04-01', 70], ['2026-05-15', 30]] as const) {
    it(`${from} +${days}`, () => {
      const cls = Array.from({ length: days + 3 }, (_, i) => {
        const iso = addDaysIso(from, i);
        const c = classifyDay(iso, { diaspora: false, tz: 'Asia/Jerusalem' });
        return { iso, closed: !!c.yomTov || c.dow === 6 };
      });
      const runs = mergeRuns(cls, (c) => c.closed).filter((r) => r.from <= days);
      const wins = hebrewClosedWindows(from, days, tenant, { diaspora: false });
      expect(runs.map((r) => ({ startIso: addDaysIso(cls[r.from].iso, -1), endIso: cls[r.to].iso, days: r.length }))).toEqual(
        wins.map((w) => ({ startIso: w.startIso, endIso: w.endIso, days: w.days })),
      );
    });
  }
  it('יש לפחות חלון ממוזג אחד (ראש השנה תשפ״ז = שבת+ראשון)', () => {
    const wins = hebrewClosedWindows('2026-09-01', 60, tenant, { diaspora: false });
    expect(wins.some((w) => w.days >= 2)).toBe(true);
  });
});

describe('⏭️ next ≡ markZmanim (הזמן הבא שעוד לא הגיע)', () => {
  it('לכל שעה ביום', () => {
    const rows = dayZmanim('2026-10-14', LOCS[0]);
    for (let now = 0; now < 1440; now += 37) {
      const hhmm = minToHm(now);
      const marked = markZmanim(rows, { iso: '2026-10-14', hhmm, dow: 3, ms: 0 });
      const src = marked.find((r) => r.next)?.time ?? null;
      const mins = rows.map((r) => hmToMin(r.time)).filter((m): m is number => m !== null);
      const [n] = nextAfter(mins, now);
      expect(n === undefined ? null : minToHm(n)).toBe(src);
    }
  });
});

describe('📣 escalate ≡ routeRequest (3 שעות; שעה בדחוף)', () => {
  const listing = { id: 'L1', status: 'approved', source: 'owner', category: 'elec', phone: '050-1111111', phone2: '', whatsapp: '' } as unknown as PrListing;
  const created = '2026-10-14T08:00:00.000Z';
  const t0 = Date.parse(created);
  const req = (over: Partial<PrRequest> = {}): PrRequest =>
    ({ id: 'r', text: 'צריך חשמלאי', category: 'elec', area: '', urgent: false, quiet: false, job: false, requester: { phone: '052-2222222' }, status: 'open', responses: [], createdAt: created, ...over }) as unknown as PrRequest;
  const stepsFor = (recipients: string[]): { to: string[]; waitMin: number }[] => [
    { to: recipients, waitMin: PR_ESCALATE_MS.normal / 60_000 },
    { to: ['community'], waitMin: 0 },
  ];
  const OFFSETS = [0, 1, 59, 60, 61, 179, 180, 181, 600].map((m) => m * 60_000);
  for (const urgent of [false, true]) {
    it(urgent ? 'דחוף' : 'רגיל', () => {
      for (const off of OFFSETS) {
        const now = t0 + off;
        const r = routeRequest(req({ urgent }), [listing], now);
        const s = escalationState({ createdMs: t0, steps: stepsFor(['L1']), urgent, urgentWaitMin: PR_ESCALATE_MS.urgent / 60_000, nowMs: now });
        expect(s.stepIndex, String(off)).toBe(r.stage === 'biz' ? 0 : 1);
        if (r.stage === 'biz') expect(s.nextMoveMs).toBe(r.escalateAtMs);
        expect(escalationPlan({ createdMs: t0, steps: stepsFor(['L1']), urgent, urgentWaitMin: 60 })[1].atMs).toBe(r.escalateAtMs);
      }
    });
  }
  it('אין מקבלים ⇒ לקהילה מיד · יצירה פגומה ⇒ לקהילה', () => {
    const other = req({ category: 'edu' });
    expect(routeRequest(other, [listing], t0).stage).toBe('all');
    expect(escalationState({ createdMs: t0, steps: stepsFor([]), nowMs: t0 }).stepIndex).toBe(1);
    expect(routeRequest(req({ createdAt: 'לא תאריך' }), [listing], t0).stage).toBe('all');
    expect(escalationState({ createdMs: Date.parse('לא תאריך'), steps: stepsFor(['L1']), nowMs: t0 }).stepIndex).toBe(1);
  });
});

describe('🔄 rotate ≡ adRotation (סבב לפי יום)', () => {
  const ad = (id: string, advertiser: string): PrAd =>
    ({ id, slot: 'board', kind: 'small', target: '', advertiser, headline: '', body: '', phone: '', from: '', to: '', price: 0, paid: false, paidAt: '', active: true, createdAt: '', updatedAt: '' }) as PrAd;
  const ads = [ad('a1', 'גולדברג'), ad('a2', 'אברהמי'), ad('a3', 'לוי'), ad('a4', 'כהן')];
  it('14 ימים רצופים', () => {
    for (let i = 0; i < 14; i++) {
      const iso = addDaysIso('2026-10-10', i);
      const src = adRotation(ads, 'board', iso);
      const list = activeAds(ads, 'board', iso);
      expect(turnIndex(list.length, dayIndex(iso))).toBe(src.index);
      expect(turnOf(list, dayIndex(iso))).toBe(src.today);
    }
  });
});

describe('🔍 fuzzy ≡ tokMatch (אותיות-שימוש + שגיאת-כתיב אחת)', () => {
  const words = [...new Set(PR_CONCEPTS.flatMap((c) => c.w).map(prNorm).filter((w) => w && !w.includes(' ')))].slice(0, 120);
  const variants = (w: string): string[] => {
    const mid = Math.floor(w.length / 2);
    return [w, 'ב' + w, 'ו' + w, 'וה' + w, w.slice(0, 3), w.slice(0, mid) + 'א' + w.slice(mid + 1), w.slice(0, mid) + w.slice(mid + 1), w + 'ים', 'xyz'];
  };
  it('wordScore(…,1) = tokMatch על דגימה של מילים אמיתיות', () => {
    let pairs = 0;
    for (let i = 0; i < words.length; i++) {
      for (const tok of variants(words[i])) {
        for (const s of [words[i], words[(i + 1) % words.length], words[(i + 7) % words.length]]) {
          expect(wordScore(tok, s, 1), tok + '→' + s).toBe(tokMatch(tok, s));
          pairs++;
        }
      }
    }
    expect(pairs).toBeGreaterThan(2000);
  });
  it('normHe = prNorm', () => {
    for (const s of ['חַשְׁמַלַּאי', 'סת״ם', 'רו"ח', 'ביטוח־לאומי', 'מזוזות!!', 'BNEI  Brak', 'צבע, טיח', 'ווילון', 'ייעוץ']) expect(normHe(s)).toBe(prNorm(s));
  });
  it('שגיאת-כתיב אחת נמצאת; עם maxTypos=0 — לא', () => {
    expect(fuzzyFind('אינסתלציה', [{ id: 'x', text: 'אינסטלציה' }])).toEqual(['x']);
    expect(fuzzyFind('אינסתלציה', [{ id: 'x', text: 'אינסטלציה' }], 0)).toEqual([]);
  });
});
