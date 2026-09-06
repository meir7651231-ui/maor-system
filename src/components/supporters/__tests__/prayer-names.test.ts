/**
 * ratchet — 🙏 שמות לתפילה בכרטיס-התורם (בקשת-בעלים 5.9): מנוע טהור + פעולות-store + חיווט.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { planAddPrayerName, prayerListText, prayerOpenCount, removePrayerName, setPrayerNote, togglePrayerName } from '../prayer';
import { mergeSupporterInto } from '../../../lib/dedup';
import { useApp } from '../../../store/useApp';
import { emptyDb } from '../../../types/domain';
import type { Db, Supporter } from '../../../types/domain';
import { FEATURES } from '../../../types/features';

const sup = (id: string, over: Partial<Supporter> = {}): Supporter =>
  ({ id, name: 'תורם ' + id, phone: '', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [], ...over }) as unknown as Supporter;

describe('מנוע', () => {
  it('הוספה עם דדופ (רווחים/אותיות), הערה מנוקה, addedAt מוזרק', () => {
    const p1 = planAddPrayerName([], 'p1', ' רחל  בת לאה ', '  לרפואה ', '2026-09-05');
    expect(p1.dup).toBe(false);
    expect(p1.list).toEqual([{ id: 'p1', name: 'רחל בת לאה', note: 'לרפואה', addedAt: '2026-09-05', done: false }]);
    expect(planAddPrayerName(p1.list, 'p2', 'רחל בת לאה', '', '2026-09-05').dup).toBe(true);
    expect(planAddPrayerName(p1.list, 'p3', '   ', '', '2026-09-05').list.length).toBe(1);
  });
  it('הערה/סימון/הסרה/מונה/טקסט-להעתקה', () => {
    let l = planAddPrayerName([], 'a', 'א', 'הערה א', '2026-09-05').list;
    l = planAddPrayerName(l, 'b', 'ב', '', '2026-09-05').list;
    l = setPrayerNote(l, 'b', 'הערה ב');
    l = togglePrayerName(l, 'a');
    expect(prayerOpenCount(l)).toBe(1);
    expect(prayerListText(l, 'כותרת')).toBe('כותרת\nב — הערה ב\n✓ א — הערה א');
    expect(removePrayerName(l, 'a').map((p) => p.id)).toEqual(['b']);
  });
});

describe('store + מיזוג + חיווט', () => {
  beforeEach(() => {
    const db: Db = { ...emptyDb(), supporters: [sup('s1')] };
    useApp.getState().setDb(() => db);
  });
  it('addPrayerName ⇒ נשמר על התומך; כפול נדחה; הערה/סימון/הסרה', () => {
    expect(useApp.getState().addPrayerName('s1', 'משה בן שרה', 'לזיווג')).toBe(true);
    expect(useApp.getState().addPrayerName('s1', 'משה  בן שרה', '')).toBe(false);
    const list = () => useApp.getState().db.supporters[0].prayerNames ?? [];
    expect(list().length).toBe(1);
    const id = list()[0].id;
    useApp.getState().setPrayerNote('s1', id, 'לרפואה');
    useApp.getState().togglePrayerName('s1', id);
    expect(list()[0]).toMatchObject({ name: 'משה בן שרה', note: 'לרפואה', done: true });
    useApp.getState().removePrayerName('s1', id);
    expect(list().length).toBe(0);
  });
  it('מיזוג-כפולים מאחד שמות-לתפילה לפי id', () => {
    const keep = sup('k', { prayerNames: [{ id: 'p1', name: 'א', note: '', addedAt: '2026-09-01' }] });
    const drop = sup('d', { prayerNames: [{ id: 'p1', name: 'א', note: '', addedAt: '2026-09-01' }, { id: 'p2', name: 'ב', note: 'x', addedAt: '2026-09-02' }] });
    expect(mergeSupporterInto(keep, drop).prayerNames?.map((p) => p.id)).toEqual(['p1', 'p2']);
  });
  it('דגל supporters.prayernames מוגדר; הכרטיס מחווט; הרכיב משתמש בפעולות-ה-store', () => {
    expect(FEATURES.some((f) => f.key === 'supporters.prayernames')).toBe(true);
    const detail = readFileSync(new URL('../SupporterDetail.tsx', import.meta.url), 'utf8');
    expect(detail).toContain("const prayerOn = featureOn(config, 'supporters.prayernames');");
    expect(detail).toContain('{prayerOn && <PrayerNames supporter={sp} />}');
    const comp = readFileSync(new URL('../PrayerNames.tsx', import.meta.url), 'utf8');
    for (const a of ['s.addPrayerName', 's.setPrayerNote', 's.togglePrayerName', 's.removePrayerName', '📋 העתקת הרשימה', 'placeholder="הערה (למי / על מה)"']) expect(comp).toContain(a);
  });
});
