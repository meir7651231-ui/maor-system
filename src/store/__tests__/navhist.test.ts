/**
 * ratchet — navHist + recentIds (P1.5, feature shell.navhist).
 *
 * מקור האמת: legacy-main-script.js —
 * 166: מחסנית עד 20 צעדים, הישן ביותר נזרק; רק מעבר-מיקום אמיתי נרשם.
 * 3146-3147: goBack שולף ומנווט בלי לרשום את החזרה עצמה כצעד.
 * 344-346: recentIds — פתיחת משפחה מקדמת לראש, ייחודי, עד 6.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { pushNav, pushRecent, sameLoc, NAV_HIST_MAX } from '../../lib/navhist';
import { emptyDb, emptyFamily } from '../../types/domain';

beforeEach(() => {
  useApp.setState({ view: 'home', selFamilyId: null, selCourseId: null, navHist: [], recentIds: [] });
  useApp.getState().setDb(() => ({
    ...emptyDb(),
    families: [
      { ...emptyFamily(), id: 'f1', createdAt: '2026-01-01', name: 'כהן' },
      { ...emptyFamily(), id: 'f2', createdAt: '2026-01-01', name: 'לוי' },
    ],
  }));
});

describe('🧭 ratchet — הפונקציות הטהורות (legacy:166, 344-346)', () => {
  it('pushNav שומר תקרה של 20 — הישן ביותר נזרק', () => {
    let h: ReturnType<typeof pushNav> = [];
    for (let i = 0; i < 25; i++) h = pushNav(h, { view: 'v' + i, selFamilyId: null, selCourseId: null });
    expect(h).toHaveLength(NAV_HIST_MAX);
    expect(h[0].view).toBe('v5');
    expect(h[19].view).toBe('v24');
  });

  it('pushRecent — ייחודי, לראש, עד 6', () => {
    let r: string[] = [];
    for (const id of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) r = pushRecent(r, id);
    expect(r).toEqual(['g', 'f', 'e', 'd', 'c', 'b']);
    r = pushRecent(r, 'd'); // קידום קיים — בלי כפילות
    expect(r).toEqual(['d', 'g', 'f', 'e', 'c', 'b']);
  });

  it('sameLoc משווה מסך + שתי הבחירות', () => {
    const a = { view: 'families', selFamilyId: 'f1', selCourseId: null };
    expect(sameLoc(a, { ...a })).toBe(true);
    expect(sameLoc(a, { ...a, selFamilyId: 'f2' })).toBe(false);
  });
});

describe('🧭 ratchet — ה-store: רישום צעדים וחזרה מדויקת', () => {
  it('go/selectFamily רושמים את המיקום הקודם; goBack מחזיר אליו בלי לרשום צעד', () => {
    const s = () => useApp.getState();
    s().go('courses');
    s().selectFamily('f1');
    expect(s().navHist).toHaveLength(2);
    expect(s().navHist[0]).toEqual({ view: 'home', selFamilyId: null, selCourseId: null });
    expect(s().navHist[1]).toEqual({ view: 'courses', selFamilyId: null, selCourseId: null });
    s().goBack();
    expect(s().view).toBe('courses');
    expect(s().navHist).toHaveLength(1); // החזרה לא נרשמה כצעד
    s().goBack();
    expect(s().view).toBe('home');
    expect(s().navHist).toHaveLength(0);
    s().goBack(); // מחסנית ריקה — לא קורס ולא משנה כלום
    expect(s().view).toBe('home');
  });

  it('מעבר לאותו מיקום אינו נרשם כצעד', () => {
    const s = () => useApp.getState();
    s().go('courses');
    s().go('courses');
    expect(s().navHist).toHaveLength(1);
  });

  it('selectFamily מקדם את recentIds; ניקוי הבחירה (null) לא', () => {
    const s = () => useApp.getState();
    s().selectFamily('f1');
    s().selectFamily('f2');
    s().selectFamily('f1');
    expect(s().recentIds).toEqual(['f1', 'f2']);
    s().selectFamily(null);
    expect(s().recentIds).toEqual(['f1', 'f2']);
  });
});
