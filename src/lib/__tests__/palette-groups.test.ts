/**
 * ratchet — השלמת הפלטה (P1.6, feature shell.palette.actions).
 *
 * מקור האמת: legacy-main-script.js — פעולות הפלטה (2333-2366: copyPhones,
 * + אירוע, + תזכורת טלפון, + קורס, + תומכת, ניקוב-להיום) וקיבוץ תוצאות
 * החיפוש לפי סוג (push(type,...) — 2373 והלאה). כאן: הקיבוץ הטהור + הגנות-מקור
 * שהפעולות מחווטות ומגודרות בדגל.
 */
import { describe, expect, it } from 'vitest';
import { groupPaletteResults, type KeyedCmd } from '../paletteGroups';
import paletteSrc from '../../components/palette/CommandPalette.tsx?raw';

const k = (key: string): KeyedCmd => ({ key });

describe('🎛 ratchet — groupPaletteResults: קיבוץ יציב לפי סוג', () => {
  it('ממיין לדליי-סוג, שומר סדר פנימי, וכותרת רק לראשון בכל קבוצה', () => {
    const grouped = groupPaletteResults([k('crs-1'), k('fam-1'), k('fam-2'), k('act-x'), k('crs-2')]);
    expect(grouped.map((g) => g.key)).toEqual(['act-x', 'fam-1', 'fam-2', 'crs-1', 'crs-2']);
    expect(grouped.map((g) => g.section)).toEqual(['ניווט ופעולות', 'משפחות', undefined, 'חוגים', undefined]);
  });

  it("קידומות שחולקות כותרת ('nav-'/'act-') לא מכפילות אותה", () => {
    const grouped = groupPaletteResults([k('nav-home'), k('act-backup')]);
    expect(grouped[0].section).toBe('ניווט ופעולות');
    expect(grouped[1].section).toBeUndefined();
  });

  it('קידומת לא מוכרת נדחפת לסוף בלי כותרת', () => {
    const grouped = groupPaletteResults([k('zzz-1'), k('fam-1')]);
    expect(grouped.map((g) => g.key)).toEqual(['fam-1', 'zzz-1']);
    expect(grouped[1].section).toBeUndefined();
  });
});

describe('🛡 הגנות-מקור — פעולות הפלטה מחווטות ומגודרות בדגל', () => {
  it('כל פעולות legacy:2333-2366 קיימות תחת shell.palette.actions', () => {
    expect(paletteSrc).toMatch(/featureOn\(config, 'shell\.palette\.actions'\)/);
    expect(paletteSrc).toContain('העתקת כל הטלפונים');
    expect(paletteSrc).toContain("'act-new-event'");
    expect(paletteSrc).toContain("'act-new-call'");
    expect(paletteSrc).toContain("'act-new-course'");
    expect(paletteSrc).toContain("'act-new-supporter'");
    expect(paletteSrc).toContain("'act-today-punch'");
    expect(paletteSrc).toMatch(/groupPaletteResults\(/);
  });
});
