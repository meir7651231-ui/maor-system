/**
 * ratchet — ⚡ ביצועי הפאנלים של מסך-התורמים (12.10.2026, חבילה 3 "פאנלים שמריצים מנועי-DB-מלא בכל רינדור").
 *
 * נמדד על 16,000 תורמים (הלקוח האמיתי, 34 MB JSON) ב-Node בלי האטה (×4 במכשיר-איטי):
 *   · לוח-המעקב (AyinBoard): dueRecurReminder+activeRecurSeries לכל תומך/ת — 179 ms על 300 אירועים,
 *     **5,404 ms** על 5,000 אירועים — לסבב-אחד; הלוח קרא ~4 סבבים לרינדור.
 *   · הקוקפיט: cockpitAtRisk 173 ms (×3 לרינדור) · cockpitKpis 179 · cockpitQueue 213 · segmentCounts 182 ·
 *     cockpitFeed 101 ⇒ **770 ms לכל רינדור**, גם על setState מקומי («✓ בוצע»).
 *
 * העיקרון: אפס שינוי-התנהגות — אותן שורות, אותו סדר, אותם סכומים. הבדיקות כאן מוכיחות **ביט-זהות**
 * בין הגרסאות-המהירות לישנות (property-tests על קלט אקראי-דטרמיניסטי) ונועלות את החיווט (הגנות-מקור).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Supporter } from '../../../types/domain';
import {
  activeRecurSeries,
  activeRecurSeriesIndexed,
  buildRecurIndex,
  dueRecurReminder,
  dueRecurReminderIndexed,
  RECUR_MODES,
  recurStatus,
  recurStatusIndexed,
  supLast,
  type RecurEventLike,
} from '../lib';
import { cockpitAtRisk, cockpitFeed, cockpitKpis, cockpitQueue, daysSince, topNewest } from '../cockpit';
import { segmentCounts } from '../segments';

const TODAY = '2026-10-12';

/** PRNG דטרמיניסטי (LCG) — הבדיקה ניתנת-לשחזור. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function isoOf(r: () => number, y0 = 2026, y1 = 2026): string {
  const y = y0 + Math.floor(r() * (y1 - y0 + 1));
  const m = 1 + Math.floor(r() * 12);
  const d = 1 + Math.floor(r() * 28);
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function sup(over: Partial<Supporter>): Supporter {
  return {
    id: 'x', name: 'תורם', phone: '', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '',
    count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [], ...over,
  };
}

function randomEvents(r: () => number, n: number, spIds: string[]): RecurEventLike[] {
  const prefixes = [...RECUR_MODES.map((m) => m.prefix), 'שיחה', '', 'סגול', 'חזרה'];
  const out: RecurEventLike[] = [];
  for (let i = 0; i < n; i++) {
    const roll = r();
    out.push({
      id: r() < 0.1 ? undefined : 'e' + i,
      spId: roll < 0.05 ? undefined : roll < 0.08 ? '' : spIds[Math.floor(r() * spIds.length)],
      type: r() < 0.85 ? 'call' : 'meeting',
      date: isoOf(r),
      notes: prefixes[Math.floor(r() * prefixes.length)] + (r() < 0.5 ? ' · זיווג' : ''),
      done: r() < 0.3,
    });
  }
  return out;
}

describe('⚡ אינדקס-סדרות — הגרסאות ה-Indexed ביט-זהות לישנות', () => {
  it('property: recurStatus / activeRecurSeries / dueRecurReminder — 200 עולמות אקראיים × כל התומכים × כל המצבים', () => {
    const r = rng(2026_10_12);
    for (let world = 0; world < 200; world++) {
      const nSp = 1 + Math.floor(r() * 6);
      const spIds = Array.from({ length: nSp }, (_, i) => 'sp' + i);
      const events = randomEvents(r, Math.floor(r() * 40), spIds);
      const today = isoOf(r);
      const index = buildRecurIndex(events);
      for (const spId of [...spIds, 'ghost', '']) {
        for (const m of RECUR_MODES) {
          expect(recurStatusIndexed(index, spId, today, m.key)).toEqual(recurStatus(events, spId, today, m.key));
        }
        expect(activeRecurSeriesIndexed(index, spId, today)).toEqual(activeRecurSeries(events, spId, today));
        expect(dueRecurReminderIndexed(index, spId, today)).toEqual(dueRecurReminder(events, spId, today));
      }
    }
  });

  it('האינדקס שומר סדר-מקור (שוויון-תאריכים ⇒ אותו tie-break כמו sort יציב) ומסנן רק call+spId+תחילית', () => {
    const events: RecurEventLike[] = [
      { id: 'b', spId: 's', type: 'call', date: '2026-10-01', notes: 'חזרה יומית', done: false },
      { id: 'a', spId: 's', type: 'call', date: '2026-10-01', notes: 'חזרה יומית', done: false },
      { id: 'c', spId: 's', type: 'meeting', date: '2026-09-01', notes: 'חזרה יומית', done: false },
      { id: 'd', spId: 't', type: 'call', date: '2026-09-01', notes: 'חזרה יומית', done: false },
      { id: 'e', spId: 's', type: 'call', date: '2026-09-01', notes: 'סתם', done: false },
    ];
    const index = buildRecurIndex(events);
    expect([...index.keys()]).toEqual(['s', 't']);
    expect(index.get('s')!.map((e) => e.id)).toEqual(['b', 'a']);
    expect(recurStatusIndexed(index, 's', TODAY, 'daily').reminders.map((x) => x.id)).toEqual(['b', 'a']);
    expect(recurStatusIndexed(index, 's', TODAY, 'daily')).toEqual(recurStatus(events, 's', TODAY, 'daily'));
  });
});

describe('⚡ cockpitAtRisk — מפתח-שקט מחושב פעם-אחת, אותו סדר בדיוק', () => {
  /** המימוש הישן (לפני 12.10) — המשווה חישב supLast+daysSince לכל השוואה. */
  function oldAtRisk(supporters: readonly Supporter[], todayIso: string, silentDays = 60): Supporter[] {
    return supporters
      .filter((sp) => {
        const given = (sp.count || 0) + (sp.hist ?? []).filter((h) => (h.a || 0) > 0).length > 0 && !!supLast(sp);
        if (!given) return false;
        if (sp.nextDate) return false;
        return daysSince(supLast(sp), todayIso) >= silentDays;
      })
      .sort((a, b) => daysSince(supLast(b), todayIso) - daysSince(supLast(a), todayIso));
  }
  it('property: 300 אוכלוסיות אקראיות (כולל hist, שוויון-ימים, nextDate, בלי-תרומה) — זהות מלאה כולל סדר', () => {
    const r = rng(42);
    for (let world = 0; world < 300; world++) {
      const n = Math.floor(r() * 60);
      const sups: Supporter[] = [];
      for (let i = 0; i < n; i++) {
        const roll = r();
        sups.push(
          sup({
            id: 'sp' + i,
            count: roll < 0.2 ? 0 : 1 + Math.floor(r() * 5),
            last: r() < 0.15 ? '' : isoOf(r, 2025, 2026),
            nextDate: r() < 0.15 ? isoOf(r) : '',
            hist: r() < 0.4 ? [{ d: isoOf(r, 2025, 2026), a: r() < 0.2 ? 0 : 100 }] : undefined,
          }),
        );
      }
      const today = isoOf(r);
      const silent = r() < 0.5 ? 60 : Math.floor(r() * 200);
      expect(cockpitAtRisk(sups, today, silent).map((s) => s.id)).toEqual(oldAtRisk(sups, today, silent).map((s) => s.id));
    }
  });

  it('שיתוף רשימת-הבסיכון: kpis/queue/segmentCounts עם רשימה-מוזרקת ≡ בלעדיה', () => {
    const r = rng(7);
    const sups: Supporter[] = [];
    for (let i = 0; i < 80; i++) {
      sups.push(sup({ id: 'sp' + i, name: 'ת' + i, phone: '05' + i, count: 1 + Math.floor(r() * 3), last: isoOf(r, 2025, 2026), nextDate: r() < 0.2 ? isoOf(r) : '', donations: [{ rid: 'D-' + i, date: isoOf(r), amount: 100, cur: '₪', cat: '' }] }));
    }
    const atRisk = cockpitAtRisk(sups, TODAY);
    expect(cockpitKpis(sups, TODAY, 3.7, atRisk)).toEqual(cockpitKpis(sups, TODAY, 3.7));
    expect(cockpitQueue(sups, TODAY, 3.7, undefined, atRisk)).toEqual(cockpitQueue(sups, TODAY, 3.7));
    expect(segmentCounts(sups, TODAY, 3.7, atRisk)).toEqual(segmentCounts(sups, TODAY, 3.7));
  });
});

describe('⚡ cockpitFeed — בחירת-N-החדשים במעבר-יחיד ≡ מיון-מלא + slice', () => {
  const ref = <T extends { date: string }>(xs: readonly T[], n: number) =>
    xs.filter((e) => e.date).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, n);

  it('property: 500 רשימות אקראיות עם תאריכים-כפולים ותאריכים-ריקים × n∈{0,1,3,8,20,N+5} — זהות (כולל tie-break)', () => {
    const r = rng(99);
    const dates = ['', '2026-01-01', '2026-01-02', '2026-05-05', '2026-10-12', '2025-12-31'];
    for (let world = 0; world < 500; world++) {
      const n = Math.floor(r() * 50);
      const xs = Array.from({ length: n }, (_, i) => ({ i, date: r() < 0.5 ? dates[Math.floor(r() * dates.length)] : isoOf(r, 2024, 2026) }));
      for (const k of [0, 1, 3, 8, 20, n + 5]) expect(topNewest(xs, k)).toEqual(ref(xs, k));
    }
  });

  it('cockpitFeed מחזיר אותם 8 פריטים באותו סדר ועם אותם מזהים (האינדקס i בתוך ה-8)', () => {
    const r = rng(5);
    const sups: Supporter[] = [];
    for (let i = 0; i < 120; i++) {
      const donations = Array.from({ length: Math.floor(r() * 4) }, (_, k) => ({ rid: 'D-' + i + '-' + k, date: isoOf(r, 2025, 2026), amount: 10 + k, cur: '₪' as const, cat: '' }));
      sups.push(sup({ id: 'sp' + i, name: 'ת' + i, donations, nextDate: r() < 0.3 ? isoOf(r) : '' }));
    }
    const feed = cockpitFeed(sups, 8);
    expect(feed).toHaveLength(8);
    for (let i = 1; i < feed.length; i++) expect(feed[i - 1].date >= feed[i].date).toBe(true);
    expect(feed.map((f) => f.id.split(':').pop())).toEqual(['0', '1', '2', '3', '4', '5', '6', '7']);
    // שוויון-תאריכים: הקודם ברשימת-orgCalEntries קודם (כמו sort יציב)
    const same = sups.map((s) => sup({ id: s.id, name: s.name, donations: [{ rid: 'D', date: '2026-10-10', amount: 1, cur: '₪', cat: '' }] }));
    expect(cockpitFeed(same, 3).map((f) => f.spId)).toEqual(['sp0', 'sp1', 'sp2']);
  });
});

describe('🔒 הגנות-מקור — החיווט נשאר ממומאז', () => {
  const read = (p: string) => readFileSync(resolve(__dirname, p), 'utf8');
  it('SupportersCockpit: כל מנוע ב-useMemo, הבסיכון משותף, אפס קריאה-חשופה לרינדור', () => {
    const s = read('../SupportersCockpit.tsx');
    expect(s).toContain('const atRisk = useMemo(() => cockpitAtRisk(supporters, today), [supporters, today]);');
    expect(s).toContain('const kpis = useMemo(() => cockpitKpis(supporters, today, rate, atRisk), [supporters, today, rate, atRisk]);');
    expect(s).toContain('const queue = useMemo(() => cockpitQueue(supporters, today, rate, config, atRisk), [supporters, today, rate, config, atRisk]);');
    expect(s).toContain('const segs = useMemo(() => segmentCounts(supporters, today, rate, atRisk).filter((s) => s.count > 0), [supporters, today, rate, atRisk]);');
    expect(s).toContain('const feed = useMemo(() => cockpitFeed(supporters, 8), [supporters]);');
    expect(s).toContain('const hebTasks = useMemo<CockpitTask[]>(');
    expect(s).not.toMatch(/const (kpis|queue|segs|feed) = cockpit/);
  });
  it('AyinBoard: אינדקס-אירועים פעם-אחת + הנגזרת כולה ממומאזת; הישנות (סריקה-מלאה) לא נקראות', () => {
    const s = read('../AyinBoard.tsx');
    expect(s).toContain('const recurIndex = useMemo(() => buildRecurIndex(db.events), [db.events]);');
    expect(s).toContain('const { active, rows, isDueNext, dueRemOf } = useMemo(() => {');
    expect(s).toContain('}, [db.supporters, recurIndex, desigLimit, region, filter, sort, today, segulaOn, nextDateOn, nextPromptId]);');
    expect(s).toContain('const series = segulaOn ? activeRecurSeriesIndexed(recurIndex, sp.id, today) : [];');
    expect(s).not.toMatch(/\bdueRecurReminder\(|\bactiveRecurSeries\(|\brecurStatus\(/);
    expect(s).not.toMatch(/Date\.now\(/);
  });
  it('SupportersKpiStrip: React.memo; ה-useMemo-ים תלויים רק בפרימיטיבים + מערך-הקלט', () => {
    const s = read('../SupportersKpiStrip.tsx');
    expect(s).toContain('export const SupportersKpiStrip = memo(function SupportersKpiStrip(props: {');
    expect(s).toContain('cockpitAtRisk(props.supporters, today).length');
    for (const deps of s.matchAll(/useMemo\([\s\S]*?\], ?\[([^\]]*)\]\)/g)) {
      for (const d of deps[1].split(',').map((x) => x.trim()).filter(Boolean)) expect(['props.supporters', 'today', 'rate', 'hokOn']).toContain(d);
    }
  });
  it('SupportersIntel / Galaxy / Universe3D נטענים רק כשהמצב שלהם פעיל (לא mount-חשוף)', () => {
    const v = read('../SupportersView.tsx');
    for (const [flag, mode, comp] of [['intelOn', 'intelMode', 'SupportersIntel'], ['galaxyOn', 'galaxyMode', 'SupportersGalaxy'], ['universeOn', 'universeMode', 'SupportersUniverse3D']]) {
      expect(v).toContain(`if (${flag} && ${mode}) {`);
      expect(v.match(new RegExp(`<${comp}\\b`, 'g'))?.length).toBe(1);
      const gate = v.indexOf(`if (${flag} && ${mode}) {`);
      const use = v.indexOf(`<${comp}`);
      expect(use).toBeGreaterThan(gate);
      expect(use - gate).toBeLessThan(400);
    }
  });
});
