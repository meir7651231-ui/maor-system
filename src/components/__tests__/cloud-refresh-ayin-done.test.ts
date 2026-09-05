/**
 * ratchet — "זה עדיין לא עובד בפלטפורמה ענן" (5.9.2026): ברוב המקרים = טאב/אפליקציה-מותקנת
 * על build ישן. (א) שורת-גרסה גלויה + "🔄 בדוק עדכון" בהגדרות←פרטי-הארגון; (ב) הבאנר בודק
 * גם ב-focus/pageshow (חזרה ל-PWA לא תמיד מייצרת visibilitychange); (ג) מסך-השמות מסתיר
 * שמות של מקרה שהושלם (עקבי עם הלוח — הכרעת-בעלים 3.9), אלא אם צ׳יפ "הושלם" נבחר.
 */
import { describe, expect, it } from 'vitest';
import settingsSrc from '../settings/SettingsView.tsx?raw';
import bannerSrc from '../UpdateBanner.tsx?raw';
import namesSrc from '../supporters/AyinNamesBoard.tsx?raw';
import { ayinBoardItems, filterAyinBoard } from '../../lib/ayin';
import { emptyAyin } from '../../types/domain';
import type { Supporter } from '../../types/domain';

describe('גרסה גלויה + בדיקת-עדכון', () => {
  it('הגדרות מציגות גרסת-האתר ומאפשרות בדיקה ידנית', () => {
    expect(settingsSrc).toContain("'גרסת-האתר: ' + fmtBuildId(__BUILD_ID__)");
    expect(settingsSrc).toContain('🔄 בדוק עדכון');
    expect(settingsSrc).toContain("fetch(import.meta.env.BASE_URL + 'version.json?t=' + Date.now(), { cache: 'no-store' })");
  });
  it('הבאנר בודק גם ב-focus ו-pageshow ומנקה את המאזינים', () => {
    expect(bannerSrc).toContain("window.addEventListener('focus', check);");
    expect(bannerSrc).toContain("window.addEventListener('pageshow', check);");
    expect(bannerSrc).toContain("window.removeEventListener('pageshow', check);");
  });
});

describe('מסך-השמות — מקרה שהושלם יורד (אלא אם נבחר "הושלם")', () => {
  const sup = (id: string, stage: 'lead' | 'done'): Supporter =>
    ({ id, name: 'ת ' + id, phone: '', donations: [], count: 0, ils: 0, usd: 0, ayin: { ...emptyAyin(), stage, names: [{ id: 'n' + id, name: 'שם ' + id, eyes: 3, done: false }] } }) as unknown as Supporter;
  it('המנוע מחזיר את הכול; הרכיב מסנן done כברירת-מחדל (הגנת-מקור)', () => {
    const items = ayinBoardItems([sup('a', 'lead'), sup('b', 'done')]);
    expect(items.length).toBe(2);
    expect(filterAyinBoard(items, '', null, null).filter((it) => it.stage !== 'done').map((it) => it.supporterId)).toEqual(['a']);
    expect(filterAyinBoard(items, '', null, 'done').map((it) => it.supporterId)).toEqual(['b']);
    expect(namesSrc).toContain(".filter((it) => stageF === 'done' || it.stage !== 'done')");
  });
});
