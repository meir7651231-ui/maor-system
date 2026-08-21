/**
 * ratchet — מנוע-היקום-התלת-ממד (universe3d). דטרמיניסטי + מכבד opt-in.
 */
import { describe, expect, it } from 'vitest';
import { donorUniverse, project } from '../universe3d';
import viewSrc from '../SupportersView.tsx?raw';
import type { Supporter } from '../../../types/domain';

function sup(id: string, gifts: [string, number][]): Supporter {
  return {
    id, name: 'תורם ' + id, phone: '', email: '', address: '', idNum: '', cat: '', forWho: '',
    notes: '', count: gifts.length, ils: 0, usd: 0, first: '', last: '', nextDate: '',
    donations: gifts.map(([date, amount], i) => ({ rid: 'D-' + id + i, date, amount, cur: '₪' as const, cat: '' })),
  } as Supporter;
}
const TODAY = '2026-08-21';
const people = [
  sup('a', [['2026-08-01', 5000], ['2026-06-01', 5000]]),
  sup('b', [['2024-01-01', 300]]),
  sup('c', [['2026-07-15', 1200]]),
];

describe('🪐 ratchet — היקום התלת-ממד', () => {
  it('נגזרת דטרמיניסטית — אותו קלט ⇒ אותן קואורדינטות בדיוק', () => {
    const a = donorUniverse(people, TODAY, { rate: 3.7 });
    const b = donorUniverse(people, TODAY, { rate: 3.7 });
    expect(a).toEqual(b);
    expect(a.length).toBe(3);
  });

  it('כל כוכב נמצא בתוך כדור-היחידה (‖xyz‖ ≤ ~1)', () => {
    for (const n of donorUniverse(people, TODAY)) {
      const r = Math.hypot(n.x, n.y, n.z);
      expect(r).toBeLessThanOrEqual(1.001);
    }
  });

  it('project — קרוב-למצלמה (z חיובי) גדול-יותר מרחוק (scale עולה עם z)', () => {
    const near = project({ x: 0, y: 0, z: 0.9 }, 0, 0, 800, 460);
    const far = project({ x: 0, y: 0, z: -0.9 }, 0, 0, 800, 460);
    expect(near.scale).toBeGreaterThan(far.scale);
    // מרכז-המסך למי-שבציר
    expect(Math.round(near.sx)).toBe(400);
  });

  it('🛡 מגודר opt-in מפורש + מחווט לבורר-המבטים', () => {
    expect(viewSrc).toContain("config.features?.['supporters.universe3d'] === true");
    expect(viewSrc).toContain('universeOn && universeMode');
    expect(viewSrc).toContain("k === 'universe'");
    expect(viewSrc).toContain('<SupportersUniverse3D');
  });
});
