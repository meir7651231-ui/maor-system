/**
 * ratchet — 🔌 המרכזייה 1: ☀ תקציר-היום (BUILD-ORDER-SWITCHBOARD-2026-10-13, חיבור ד׳).
 * "2 הגעות, הנזילה טופלה, שבת נכנסת 17:43" — todaySummary שואל כל יכולת זמינה ואוסף שורות עבריות.
 *  · שני כלים / אחד / אף אחד · ספק לא-נטען שותק · מנסח שזורק שותק (השאר ממשיכים) · תת-דגל כבוי משתיק את שורתו.
 *  · השבת: היום / מחר / ביום שישי DD/MM / בשבת עצמה "שבת שלום"; המניין הבא מהרגע.
 *  · דטרמיניזם; כותרת · טקסט · קישור-שיתוף (wa.me / סכמת-האפליקציה) · תנאי-הכרטיס hasOtherTool.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { installProvider, resetSwitchboard } from '../registry';
import { hasOtherTool, shareWaUrl, summaryHeader, summaryText, todaySummary } from '../summary';
import { abilities as hostingAbilities } from '../../../components/hosting/abilities';
import { abilities as parnasaAbilities } from '../../../components/parnasa/abilities';
import { DEFAULT_CONFIG } from '../../../types/config';
import { cfgWith, fixtureDb, NOW_MS } from './fixture';

const idt = (y: number, mo: number, d: number, h: number, mi = 0): number => Date.UTC(y, mo - 1, d, h - 3, mi);
const texts = (mods: { parnasa?: boolean; hosting?: boolean }, nowMs = NOW_MS, features: Record<string, boolean> = {}): string[] =>
  todaySummary({ db: fixtureDb(), config: cfgWith(mods, features), nowMs }).map((l) => l.text);

const HOSTING_LINES = ['🏡 הגעות היום: 1 · עזיבות: 0 · בשהייה: 1', '🧹 יחידות לניקיון: 1', '🚨 קריאות חירום פתוחות (P0/P1): 1', '✅ טופל היום: מזגן לא מקרר · בית ההארחה'];
const SHABBAT_WED = '🕯 שבת: הדלקת נרות ביום שישי 16/10 ב־17:46 · צאת השבת 18:47';
const MINYAN_WED = '🙏 המניין הבא: מנחה 17:55 · בית המדרש הגדול';

beforeEach(() => {
  installProvider('hosting', hostingAbilities);
  installProvider('parnasa', parnasaAbilities);
});
afterEach(() => {
  resetSwitchboard();
});

describe('☀ todaySummary — כל הכלים, כלי אחד, אף אחד', () => {
  it('שני כלים: שורות-האירוח ואז השבת והמניין (סדר-הרישום), עם המקור של כל שורה', () => {
    const lines = todaySummary({ db: fixtureDb(), config: cfgWith({ parnasa: true, hosting: true }), nowMs: NOW_MS });
    expect(lines.map((l) => l.text)).toEqual([...HOSTING_LINES, SHABBAT_WED, MINYAN_WED]);
    expect(lines.map((l) => l.module)).toEqual(['hosting', 'hosting', 'hosting', 'hosting', 'parnasa', 'parnasa']);
    expect(lines.map((l) => l.ability)).toEqual(['hosting.today', 'hosting.today', 'hosting.today', 'hosting.today', 'parnasa.shabbat', 'parnasa.minyanim']);
  });

  it('כלי אחד ⇒ רק הקול שלו; אף אחד ⇒ ריק', () => {
    expect(texts({ hosting: true })).toEqual(HOSTING_LINES);
    expect(texts({ parnasa: true })).toEqual([SHABBAT_WED, MINYAN_WED]);
    expect(texts({})).toEqual([]);
    expect(todaySummary({ db: fixtureDb(), config: DEFAULT_CONFIG, nowMs: NOW_MS })).toEqual([]);
  });

  it('ספק שעוד לא נטען — שותק (בלי שגיאה); תת-דגל כבוי משתיק רק את שורתו', () => {
    resetSwitchboard();
    expect(texts({ parnasa: true, hosting: true })).toEqual([]);
    installProvider('parnasa', parnasaAbilities);
    expect(texts({ parnasa: true, hosting: true })).toEqual([SHABBAT_WED, MINYAN_WED]);
    installProvider('hosting', hostingAbilities);
    expect(texts({ parnasa: true, hosting: true }, NOW_MS, { 'parnasa.zmanim': false })).toEqual([...HOSTING_LINES, MINYAN_WED]);
    expect(texts({ parnasa: true, hosting: true }, NOW_MS, { 'hosting.maint': false })).toEqual(['🏡 הגעות היום: 1 · עזיבות: 0 · בשהייה: 1', '🧹 יחידות לניקיון: 1', SHABBAT_WED, MINYAN_WED]);
  });

  it('מנסח שזורק / ריצה שזורקת ⇒ הכלי שותק, השאר ממשיכים; לא זורק החוצה', () => {
    installProvider('hosting', {
      'hosting.today': {
        run: () => ({}),
        today: {
          input: {},
          lines: () => {
            throw new Error('boom');
          },
        },
      },
    });
    expect(texts({ parnasa: true, hosting: true })).toEqual([SHABBAT_WED, MINYAN_WED]);
    installProvider('parnasa', { 'parnasa.shabbat': { run: () => { throw new Error('boom'); }, today: { input: {}, lines: () => ['לא יגיע'] } } });
    expect(texts({ parnasa: true, hosting: true })).toEqual([MINYAN_WED]);
    expect(() => todaySummary(null as never)).not.toThrow();
    expect(todaySummary(null as never)).toEqual([]);
  });

  it('השבת לפי היום: חמישי ⇒ "מחר", שישי בבוקר ⇒ "היום", בשבת ⇒ "שבת שלום · צאת השבת"', () => {
    expect(texts({ parnasa: true }, idt(2026, 10, 15, 9))[0]).toBe('🕯 שבת: הדלקת נרות מחר ב־17:46 · צאת השבת 18:47');
    expect(texts({ parnasa: true }, idt(2026, 10, 16, 9))[0]).toBe('🕯 שבת: הדלקת נרות היום ב־17:46 · צאת השבת 18:47');
    expect(texts({ parnasa: true }, idt(2026, 10, 17, 10))[0]).toBe('🕯 שבת שלום · צאת השבת 18:47 (ר״ת 19:19)');
  });

  it('דטרמיניסטי: אותו ctx ⇒ אותן שורות', () => {
    const ctx = { db: fixtureDb(), config: cfgWith({ parnasa: true, hosting: true }), nowMs: NOW_MS };
    expect(JSON.stringify(todaySummary(ctx))).toBe(JSON.stringify(todaySummary(ctx)));
  });
});

describe('☀ טקסט · כותרת · שיתוף · תנאי-הכרטיס', () => {
  it('כותרת בשעון-הארגון; טקסט = כותרת + "• שורה"; קישור-שיתוף מקודד', () => {
    expect(summaryHeader(NOW_MS)).toBe('☀ תקציר היום · יום רביעי 14/10');
    expect(summaryHeader(idt(2026, 10, 17, 0, 30)), '00:30 בישראל = כבר שבת').toBe('☀ תקציר היום · יום שבת 17/10');
    const lines = todaySummary({ db: fixtureDb(), config: cfgWith({ parnasa: true, hosting: true }), nowMs: NOW_MS });
    const text = summaryText(lines, summaryHeader(NOW_MS));
    expect(text.split('\n')).toEqual(['☀ תקציר היום · יום רביעי 14/10', ...[...HOSTING_LINES, SHABBAT_WED, MINYAN_WED].map((t) => '• ' + t)]);
    expect(shareWaUrl('א ב&ג', false)).toBe('https://wa.me/?text=' + encodeURIComponent('א ב&ג'));
    expect(shareWaUrl('א ב&ג', true)).toBe('whatsapp://send?text=' + encodeURIComponent('א ב&ג'));
  });

  it('hasOtherTool: הכרטיס רק כשיש קול של כלי אחר — כלי יחיד ⇒ לא', () => {
    expect(hasOtherTool(cfgWith({ hosting: true }), 'hosting')).toBe(false);
    expect(hasOtherTool(cfgWith({ parnasa: true }), 'parnasa')).toBe(false);
    expect(hasOtherTool(cfgWith({ parnasa: true, hosting: true }), 'hosting')).toBe(true);
    expect(hasOtherTool(cfgWith({ parnasa: true, hosting: true }), 'parnasa')).toBe(true);
    expect(hasOtherTool(cfgWith({ parnasa: true, hosting: true }, { parnasa: false }), 'hosting')).toBe(false);
  });
});
