/**
 * ratchet — מסלול-B פאזה-2b: חיווט פיצול-התרומות לסנכרון (דגל-כבוי by default).
 * OFF (ברירת-מחדל, וכל הלקוחות הקיימים) = ביט-זהה: pushDiff רגיל, אוסף-התרומות לא נגע.
 * ON = מסמכי-התומך נדחפים בלי donations + diff-אוסף-התרומות נדחף בנפרד.
 * ../lib/cloud ממוקק (אין firebase) — שולטים ב-donationSplitActive ולוכדים את שתי הדחיפות.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyDb, emptyFamily, type Db, type Donation, type Supporter } from '../../types/domain';
import type { DbDiff } from '../../lib/cloud-diff';
import { stripSupporterDonations, donationsPath, DONATIONS_COL } from '../../lib/cloud-diff';

const pushed: DbDiff[] = [];
const pushedDonations: Array<{ sets: Array<{ id: string; pkey: string }>; deletes: string[] }> = [];
let splitFlag = false;
let cloudReturn: Db | null = null;

vi.mock('../../lib/cloud', () => ({
  pullAll: () => Promise.resolve(cloudReturn),
  pushDiff: (d: DbDiff) => {
    pushed.push(d);
    return Promise.resolve();
  },
  pushDonations: (d: { sets: Array<{ id: string; pkey: string }>; deletes: string[] }) => {
    pushedDonations.push(d);
    return Promise.resolve();
  },
  donationSplitActive: () => splitFlag,
  setDonationSplit: (v: boolean) => {
    splitFlag = v;
  },
  subscribeAll: () => () => {},
  initCloud: () => {},
  resetPassword: () => Promise.resolve(),
  signIn: () => Promise.resolve(),
  signOutCloud: () => Promise.resolve(),
  watchAuth: () => () => {},
}));

const { startCloudSync, stopCloudSync } = await import('../cloudSync');

const don = (rid: string, purpose?: string): Donation =>
  ({ rid, date: '2026-01-01', amount: 100, cur: '₪', cat: '', ...(purpose ? { purpose } : {}) });
const supWithDon = (id: string, dons: Donation[]): Supporter =>
  ({ ...emptyFamily(), id, name: id, donations: dons } as unknown as Supporter);
const localWith = (sups: Supporter[]): Db => ({ ...emptyDb(), supporters: sups });

beforeEach(() => {
  pushed.length = 0;
  pushedDonations.length = 0;
  splitFlag = false;
  cloudReturn = null;
  stopCloudSync();
});

describe('stripSupporterDonations / donationsPath (טהור)', () => {
  it('מרוקן donations ממסמכי-תומך בלבד; שאר האוספים לא נגעו', () => {
    const diff: DbDiff = {
      sets: [
        { col: 'supporters', id: 'sp1', data: { id: 'sp1', name: 'א', donations: [don('D-1')] } },
        { col: 'families', id: 'f1', data: { id: 'f1', name: 'משפ' } },
      ],
      deletes: [],
      meta: null,
    };
    const out = stripSupporterDonations(diff);
    expect((out.sets[0].data as { donations: unknown[] }).donations).toEqual([]);
    expect(out.sets[1]).toEqual(diff.sets[1]); // families ללא-שינוי
  });
  it('donationsPath — שורש ביט-זהה; פלטפורמה תחת orgs/', () => {
    expect(donationsPath('default', true)).toBe(DONATIONS_COL);
    expect(donationsPath('acme', false)).toBe('orgs/acme/' + DONATIONS_COL);
  });
});

describe('סנכרון — פיצול כבוי (ברירת-מחדל, ביט-זהה)', () => {
  it('מסמך-התומך נדחף עם donations; אוסף-התרומות לא נגע', async () => {
    splitFlag = false;
    cloudReturn = null; // ענן ריק ⇒ fullDbDiff
    await startCloudSync({ getDb: () => localWith([supWithDon('sp1', [don('D-1')])]), setDbFromRemote: () => {}, toast: () => {}, setStatus: () => {} });
    const supSet = pushed.flatMap((p) => p.sets).find((s) => s.col === 'supporters');
    expect((supSet!.data as { donations: unknown[] }).donations).toHaveLength(1);
    expect(pushedDonations).toHaveLength(0);
  });
});

describe('סנכרון — פיצול דלוק', () => {
  it('מסמך-התומך נדחף בלי donations; אוסף-התרומות מקבל את D-1 עם pkey=ייעוד', async () => {
    splitFlag = true;
    cloudReturn = null;
    await startCloudSync({ getDb: () => localWith([supWithDon('sp1', [don('D-1', 'חתונות')])]), setDbFromRemote: () => {}, toast: () => {}, setStatus: () => {} });
    const supSet = pushed.flatMap((p) => p.sets).find((s) => s.col === 'supporters');
    expect((supSet!.data as { donations: unknown[] }).donations).toEqual([]); // רוקן
    const donSets = pushedDonations.flatMap((d) => d.sets);
    expect(donSets.map((s) => s.id)).toContain('D-1');
    expect(donSets.find((s) => s.id === 'D-1')!.pkey).toBe('חתונות');
  });
});
