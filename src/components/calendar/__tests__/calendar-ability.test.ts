/**
 * ratchet — 📅 calendar.dayInfo: מנוע מליבת-אורביט במרכזייה (ENGINEBOX-SOCKETS 13.10).
 *
 * ננעל:
 *  (א) רישום: שורת-רישום למודול 'calendar', תווית עברית, שירות-רקע שקט (quiet) — זמין כברירת-מחדל (מודול-ליבה), אבל
 *      **לא** "כלי נוסף" (hasOtherTool) ואין לו קול בתקציר (voiceIds) ⇒ אף מסך קיים לא זז.
 *  (ב) מודול-הלוח כבוי (modules.calendar=false / features.calendar=false) ⇒ לא זמין, ask ⇒ 'off'.
 *  (ג) לעולם לא זורק: תאריכים פגומים (לא-מחרוזת · 2026-02-31 · טקסט · ריק) ⇒ valid:false; ctx פגום ⇒ 'error' מטופס.
 *  (ד) נכונות מול הלוח: יום-חול רגיל · שבת · יום כיפור (יו״ט באמצע-שבוע) · סוכות בשבת · ר״ה ב׳ · שבת-חנוכה (שבת, לא
 *      יו״ט) · חול-המועד (לא יו״ט) · אדר א׳/ב׳ בשנה מעוברת (פורים קטן / פורים) · ט׳ באב — צום, לא יו״ט.
 *  (ה) "היום" (בלי iso) = ctx.nowMs בשעון-ישראל — לא שעון-המכשיר.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, type OrgConfig } from '../../../types/config';
import { abilityInfo, ask, installProvider, isAvailable, listAbilities, resetSwitchboard } from '../../../lib/switchboard/registry';
import { hasOtherTool, todaySummary, voiceIds } from '../../../lib/switchboard/summary';
import { abilities, dayInfoOf, YOM_TOV } from '../abilities';
import { cfgWith, fixtureDb, NOW_MS } from '../../../lib/switchboard/__tests__/fixture';

const ctxOf = (config: OrgConfig, nowMs = NOW_MS) => ({ db: fixtureDb(), config, nowMs });

afterEach(() => {
  resetSwitchboard();
});

describe('📅 (א) רישום במרכזייה — מנוע-ליבה שקט', () => {
  it('רשום למודול calendar, תווית עברית, quiet; זמין כברירת-מחדל', () => {
    expect(abilityInfo('calendar.dayInfo')).toEqual({ id: 'calendar.dayInfo', module: 'calendar', label: 'יום בלוח העברי', flag: null, quiet: true });
    expect(listAbilities(DEFAULT_CONFIG).map((a) => a.id)).toEqual(['calendar.dayInfo']);
    expect(isAvailable('calendar.dayInfo', DEFAULT_CONFIG)).toBe(true);
    expect(isAvailable('calendar.dayInfo', cfgWith({ parnasa: true, hosting: true }))).toBe(true);
  });

  it('לא "כלי נוסף" ולא קול בתקציר — כלי יחיד נשאר יחיד (הכרטיסים ביט-זהים)', () => {
    expect(hasOtherTool(cfgWith({ hosting: true }), 'hosting')).toBe(false);
    expect(hasOtherTool(cfgWith({ parnasa: true }), 'parnasa')).toBe(false);
    expect(hasOtherTool(cfgWith({ parnasa: true, hosting: true }), 'hosting')).toBe(true);
    expect(voiceIds(cfgWith({ hosting: true }))).toEqual(['hosting.today', 'hosting.availability']);
    expect(voiceIds(DEFAULT_CONFIG)).toEqual([]);
    installProvider('calendar', abilities);
    expect(todaySummary(ctxOf(DEFAULT_CONFIG))).toEqual([]);
  });

  it('ask אחרי התקנה ⇒ ok, עם המודול והתווית; לפני ⇒ loading', () => {
    expect(ask('calendar.dayInfo', ctxOf(DEFAULT_CONFIG), { iso: '2026-10-17' })).toMatchObject({ ok: false, reason: 'loading' });
    installProvider('calendar', abilities);
    const r = ask('calendar.dayInfo', ctxOf(DEFAULT_CONFIG), { iso: '2026-10-17' });
    expect(r).toMatchObject({ ok: true, module: 'calendar', label: 'יום בלוח העברי', value: { hebDayMonth: 'ו׳ חשוון', isShabbat: true } });
  });
});

describe('📅 (ב) מודול-הלוח כבוי ⇒ לא זמין', () => {
  it("modules.calendar=false / features.calendar=false ⇒ off (גם כשהספק נטען)", () => {
    installProvider('calendar', abilities);
    const offMod: OrgConfig = { ...DEFAULT_CONFIG, modules: { ...DEFAULT_CONFIG.modules, calendar: false } };
    const offFlag: OrgConfig = { ...DEFAULT_CONFIG, features: { ...DEFAULT_CONFIG.features, calendar: false } };
    for (const cfg of [offMod, offFlag]) {
      expect(isAvailable('calendar.dayInfo', cfg)).toBe(false);
      expect(listAbilities(cfg).map((a) => a.id)).not.toContain('calendar.dayInfo');
      expect(ask('calendar.dayInfo', ctxOf(cfg), { iso: '2026-10-17' })).toMatchObject({ ok: false, reason: 'off' });
    }
  });
});

describe('📅 (ג) לעולם לא זורק', () => {
  it('תאריכים פגומים ⇒ valid:false, שדות ריקים', () => {
    installProvider('calendar', abilities);
    const garbage: unknown[] = ['2026-02-31', '2026-13-01', '2026-1-5', 'abc', '', ' 2026-10-17', '2026-10-17T00:00', 42, null, {}, [], NaN, true];
    for (const g of garbage) {
      expect(() => dayInfoOf(g), String(g)).not.toThrow();
      expect(dayInfoOf(g), String(g)).toMatchObject({ valid: false, iso: '', hebDate: '', holiday: null, isShabbat: false, isYomTov: false, closed: false });
      const r = ask('calendar.dayInfo', ctxOf(DEFAULT_CONFIG), { iso: g } as never);
      expect(r.ok && r.value.valid, String(g)).toBe(false);
    }
  });

  it('ctx פגום / קלט פגום ⇒ תשובה מטופסת, בלי חריגה', () => {
    installProvider('calendar', abilities);
    expect(() => ask('calendar.dayInfo', null as never, {})).not.toThrow();
    expect(ask('calendar.dayInfo', null as never, {})).toMatchObject({ ok: false, reason: 'error' });
    expect(ask('calendar.dayInfo', ctxOf(DEFAULT_CONFIG), null as never)).toMatchObject({ ok: true });
    const r = ask('calendar.dayInfo', ctxOf(DEFAULT_CONFIG, NaN), {});
    expect(r).toMatchObject({ ok: true, value: { valid: true, iso: '1970-01-01' } });
  });
});

describe('📅 (ד) נכונות מול הלוח העברי (מנהג ארץ-ישראל)', () => {
  const cases: Array<[string, Partial<ReturnType<typeof dayInfoOf>>]> = [
    // יום-חול רגיל
    ['2026-10-14', { hebDate: 'ג׳ חשוון תשפ״ז', hebDayMonth: 'ג׳ חשוון', dayName: 'רביעי', holiday: null, isShabbat: false, isYomTov: false, closed: false }],
    // שבת רגילה — הדוגמה של הבעלים ("ה׳ חשוון" הוא שישי; השבת — ו׳)
    ['2026-10-16', { hebDayMonth: 'ה׳ חשוון', dayName: 'שישי', closed: false }],
    ['2026-10-17', { hebDayMonth: 'ו׳ חשוון', dayName: 'שבת', isShabbat: true, isYomTov: false, closed: true }],
    // יו״ט באמצע-השבוע
    ['2026-09-21', { hebDayMonth: 'י׳ תשרי', holiday: 'יום כיפור', isShabbat: false, isYomTov: true, closed: true }],
    // יו״ט שחל בשבת
    ['2026-09-26', { hebDayMonth: 'ט״ו תשרי', holiday: 'סוכות', isShabbat: true, isYomTov: true, closed: true }],
    ['2026-09-13', { hebDayMonth: 'ב׳ תשרי', holiday: 'ראש השנה ב׳', isYomTov: true, closed: true }],
    // חול-המועד — לא יו״ט
    ['2026-09-27', { hebDayMonth: 'ט״ז תשרי', isYomTov: false, closed: false }],
    // שבת-חנוכה — שבת, אבל חנוכה אינו יו״ט
    ['2026-12-05', { hebDayMonth: 'כ״ה כסלו', holiday: 'חנוכה', isShabbat: true, isYomTov: false, closed: true }],
    ['2026-12-07', { hebDayMonth: 'כ״ז כסלו', holiday: 'חנוכה', isShabbat: false, isYomTov: false, closed: false }],
    // שנה מעוברת (תשפ״ז): אדר א׳ / אדר ב׳
    ['2027-02-21', { hebDate: 'י״ד אדר א׳ תשפ״ז', hebMonth: 'אדר א׳', holiday: 'פורים קטן', isYomTov: false, closed: false }],
    ['2027-03-23', { hebDate: 'י״ד אדר ב׳ תשפ״ז', hebMonth: 'אדר ב׳', holiday: 'פורים', isYomTov: false }],
    // פסח (יו״ט) מול חוה״מ-בשבת
    ['2027-04-22', { holiday: 'פסח', isYomTov: true, closed: true }],
    ['2027-04-24', { hebDayMonth: 'י״ז ניסן', holiday: null, isShabbat: true, isYomTov: false, closed: true }],
  ];
  for (const [iso, want] of cases) {
    it(iso + ' ⇒ ' + (want.hebDayMonth ?? want.hebDate ?? want.holiday ?? ''), () => {
      expect(dayInfoOf(iso)).toMatchObject({ iso, valid: true, ...want });
    });
  }

  it('ט׳ באב — צום, לא יו״ט (ולא "סגור" כשאינו שבת); YOM_TOV = FULL_HOLIDAYS בלי ט׳ באב', () => {
    expect(YOM_TOV).not.toContain('תשעה באב');
    expect(YOM_TOV).toEqual(['ראש השנה', 'ראש השנה ב׳', 'יום כיפור', 'סוכות', 'שמחת תורה', 'פסח', 'שביעי של פסח', 'שבועות']);
    // ט׳ באב תשפ״ו = חמישי 23.7.2026
    expect(dayInfoOf('2026-07-23')).toMatchObject({ holiday: 'תשעה באב', isYomTov: false, closed: false });
  });

  it('דטרמיניסטי: אותו קלט ⇒ אותו פלט', () => {
    expect(JSON.stringify(dayInfoOf('2026-12-05'))).toBe(JSON.stringify(dayInfoOf('2026-12-05')));
  });
});

describe('📅 (ה) "היום" = הרגע המוזרק בשעון-ישראל', () => {
  it('בלי iso ⇒ התאריך בישראל (01:30 בלילה בישראל = כבר מחר, גם כשב-UTC עוד אתמול)', () => {
    installProvider('calendar', abilities);
    const noon = ask('calendar.dayInfo', ctxOf(DEFAULT_CONFIG, NOW_MS), {});
    expect(noon).toMatchObject({ ok: true, value: { iso: '2026-10-14', hebDayMonth: 'ג׳ חשוון' } });
    const lateNight = ask('calendar.dayInfo', ctxOf(DEFAULT_CONFIG, Date.parse('2026-10-14T22:30:00Z')), {});
    expect(lateNight).toMatchObject({ ok: true, value: { iso: '2026-10-15', hebDayMonth: 'ד׳ חשוון' } });
  });
});

describe('📅 (ו) משקל-ההפעלה', () => {
  it('הספק מייבא מהחוזה טיפוסים בלבד (ייבוא-ריצה פיצל את contract ל-chunk והגדיל את הבנדל-הראשי) · "היום" = contract.isoAt', async () => {
    const src = (await import('../abilities.ts?raw')).default as string;
    expect(src).not.toMatch(/^import (?!type )[^\n]*switchboard\/contract/m);
    const { isoAt } = await import('../../../lib/switchboard/contract');
    installProvider('calendar', abilities);
    for (const ms of [NOW_MS, Date.parse('2026-10-14T22:30:00Z'), Date.parse('2026-03-27T22:30:00Z'), Date.parse('2026-12-31T23:30:00Z'), NaN]) {
      const r = ask('calendar.dayInfo', ctxOf(DEFAULT_CONFIG, ms), {});
      expect(r.ok && r.value.iso, String(ms)).toBe(isoAt(ms));
    }
  });
});
