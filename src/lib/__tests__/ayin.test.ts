import { describe, it, expect } from 'vitest';
import {
  ayinActionVisible,
  ayinActive,
  ayinAdvanceLabel,
  ayinDailyRows,
  featLabel,
  itemLabel,
  planAddName,
  planAyinAdvance,
  revertPatch,
  stageLabel,
  unitLabel,
} from '../ayin';
import { DEFAULT_CONFIG, type OrgConfig } from '../../types/config';
import { emptyAyin, type AyinCase, type Supporter } from '../../types/domain';

function cfg(partial: Partial<OrgConfig> = {}): OrgConfig {
  return { ...DEFAULT_CONFIG, ...partial };
}

function caseOf(over: Partial<AyinCase> = {}): AyinCase {
  return { ...emptyAyin(), ...over };
}

function supOf(over: Partial<Supporter> = {}): Supporter {
  return {
    id: 'sp1',
    name: 'תומך',
    phone: '',
    email: '',
    address: '',
    idNum: '',
    cat: '',
    forWho: '',
    notes: '',
    count: 0,
    ils: 0,
    usd: 0,
    first: '',
    last: '',
    nextDate: '',
    donations: [],
    ...over,
  };
}

describe('term fallbacks resolve for the new keys', () => {
  it('generic defaults out of the box', () => {
    expect(featLabel(cfg())).toBe('מעקב טיפול');
    expect(itemLabel(cfg())).toBe('שם לטיפול');
    expect(unitLabel(cfg())).toBe('כמות');
    expect(stageLabel(cfg(), 'new')).toBe('חדש');
    expect(stageLabel(cfg(), 'lead')).toBe('בהכנה');
    expect(stageLabel(cfg(), 'eyes')).toBe('רישום');
    expect(stageLabel(cfg(), 'answer')).toBe('מסירה');
    expect(stageLabel(cfg(), 'done')).toBe('הושלם');
  });

  it('an org can rename them via terms', () => {
    const c = cfg({ terms: { 'nav.ayin': 'עופרת', 'entity.ayinUnit': 'עיניים', 'ayin.stage.lead': 'לעשות עופרת' } });
    expect(featLabel(c)).toBe('עופרת');
    expect(unitLabel(c)).toBe('עיניים');
    expect(stageLabel(c, 'lead')).toBe('לעשות עופרת');
    // key שלא נדרס נשאר בברירת המחדל
    expect(stageLabel(c, 'new')).toBe('חדש');
  });
});

describe('ayinActionVisible / advance / revert', () => {
  it('new stage needs at least one name', () => {
    expect(ayinActionVisible(caseOf({ stage: 'new', names: [] }))).toBe(false);
    expect(ayinActionVisible(caseOf({ stage: 'new', names: [{ id: 'a', name: 'x', eyes: '', done: false }] }))).toBe(true);
  });

  it('eyes stage needs at least one counted name', () => {
    expect(ayinActionVisible(caseOf({ stage: 'eyes', names: [{ id: 'a', name: 'x', eyes: '', done: false }] }))).toBe(false);
    expect(ayinActionVisible(caseOf({ stage: 'eyes', names: [{ id: 'a', name: 'x', eyes: 3, done: false }] }))).toBe(true);
  });

  it('done stage has no action', () => {
    expect(ayinActionVisible(caseOf({ stage: 'done' }))).toBe(false);
  });

  it('advances new → lead and emits a non-done event', () => {
    const a = caseOf({ stage: 'new', names: [{ id: 'a', name: 'x', eyes: '', done: false }] });
    const plan = planAyinAdvance(cfg(), 'משה', a)!;
    expect(plan.patch.stage).toBe('lead');
    expect(plan.event?.done).toBe(false);
    expect(plan.event?.title).toContain('משה');
  });

  it('advances lead → eyes and marks the event done', () => {
    const plan = planAyinAdvance(cfg(), 'משה', caseOf({ stage: 'lead' }))!;
    expect(plan.patch.stage).toBe('eyes');
    expect(plan.event?.done).toBe(true);
  });

  it('advances eyes → answer with the unit total in the title', () => {
    const a = caseOf({ stage: 'eyes', names: [{ id: 'a', name: 'x', eyes: 4, done: false }, { id: 'b', name: 'y', eyes: 3, done: false }] });
    const plan = planAyinAdvance(cfg(), 'משה', a)!;
    expect(plan.patch.stage).toBe('answer');
    expect(plan.event?.title).toContain('7');
  });

  it('answer first press sets answerPushed (stays in answer), second press completes', () => {
    const first = planAyinAdvance(cfg(), 'משה', caseOf({ stage: 'answer', answerPushed: false }))!;
    expect(first.patch.answerPushed).toBe(true);
    expect(first.patch.stage).toBeUndefined();
    const second = planAyinAdvance(cfg(), 'משה', caseOf({ stage: 'answer', answerPushed: true }))!;
    expect(second.patch.stage).toBe('done');
    expect(second.event?.done).toBe(true);
  });

  it('returns null when the action is not visible', () => {
    expect(planAyinAdvance(cfg(), 'משה', caseOf({ stage: 'new', names: [] }))).toBeNull();
  });

  it('revert before answer clears answerPushed; revert to answer/done keeps it', () => {
    expect(revertPatch('new')).toEqual({ stage: 'new', answerPushed: false });
    expect(revertPatch('eyes')).toEqual({ stage: 'eyes', answerPushed: false });
    expect(revertPatch('answer')).toEqual({ stage: 'answer' });
    expect(revertPatch('done')).toEqual({ stage: 'done' });
  });

  it('advance labels differ per stage', () => {
    expect(ayinAdvanceLabel(cfg(), caseOf({ stage: 'new' }))).toContain('בהכנה');
    expect(ayinAdvanceLabel(cfg(), caseOf({ stage: 'answer', answerPushed: false }))).toContain('דחיפה');
    expect(ayinAdvanceLabel(cfg(), caseOf({ stage: 'answer', answerPushed: true }))).toContain('הושלם');
  });
});

describe('planAddName — dedup by normalized name', () => {
  it('adds a fresh name', () => {
    const r = planAddName(caseOf(), 'ראובן', '', 'an1');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.names).toHaveLength(1);
  });

  it('rejects empty', () => {
    const r = planAddName(caseOf(), '   ', '', 'an1');
    expect(r.ok).toBe(false);
  });

  it('rejects a duplicate normalized name (final letters / spaces ignored)', () => {
    const base = caseOf({ names: [{ id: 'a', name: 'שמעון', eyes: '', done: false }] });
    const r = planAddName(base, ' שמעון ', '', 'an2');
    expect(r.ok).toBe(false);
  });

  it('records a log entry when a count is provided', () => {
    const r = planAddName(caseOf(), 'לוי', 5, 'an1');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.log).toBeDefined();
      expect(r.log![0].eyes).toBe(5);
    }
  });
});

describe('ayinDailyRows', () => {
  const today = '2026-07-22';

  it('includes only supporters touched today and builds the expected columns', () => {
    const touched = supOf({
      id: 's1',
      name: 'טופל היום',
      phone: '050',
      ayin: caseOf({ stage: 'lead', lastTouch: today, names: [{ id: 'n', name: 'א', eyes: 2, done: true }] }),
    });
    const stale = supOf({ id: 's2', name: 'ישן', ayin: caseOf({ stage: 'new', lastTouch: '2026-01-01' }) });
    const none = supOf({ id: 's3', name: 'ללא תיק' });
    const rows = ayinDailyRows(cfg(), [touched, stale, none], today);
    expect(rows).toHaveLength(2); // header + 1
    expect(rows[0][0]).toBe('שם');
    expect(rows[0][2]).toBe('כמות היום'); // unit term in header
    expect(rows[1][0]).toBe('טופל היום');
    expect(rows[1][3]).toBe('בהכנה'); // stage label
  });

  it('counts eyes from today log entries when present', () => {
    const sp = supOf({
      id: 's1',
      name: 'x',
      ayin: caseOf({ lastTouch: today, log: [{ date: today, eyes: 4 }, { date: today, eyes: 1 }] }),
    });
    const rows = ayinDailyRows(cfg(), [sp], today);
    expect(rows[1][2]).toBe(5);
  });

  it('header-only when nobody was touched today', () => {
    expect(ayinActive(undefined)).toBe(false);
    const rows = ayinDailyRows(cfg(), [supOf()], today);
    expect(rows).toHaveLength(1);
  });
});
