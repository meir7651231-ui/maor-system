/**
 * ratchet — 🏡 אירוח ⇄ 📅 הלוח העברי של אורביט (ENGINEBOX-SOCKETS 13.10): שני שקעים חדשים, כבויים כברירת-מחדל.
 *
 *  · `shabbatGuard` (טופס-ההזמנה — BookingDialog): כניסה/עזיבה בשבת/יו״ט ⇒ "⚠ הכניסה נופלת בשבת · ו׳ חשוון".
 *  · `hebDates` (כרטיס-השהייה — BookingsTab): " · ה׳–ז׳ חשוון" לצד התאריכים הרגילים.
 * ננעל: (א) העזרים הטהורים (sacredGuardLines/hebRangeText); (ב) כבוי ⇒ ביט-זהה לקוד **שלפני** השינוי (גיבוב שנלקח
 * מ-7073c4b באותה רתמה — לא הוקלט מחדש); דלוק אבל הלוח לא זמין (לא נטען · מודול-הלוח כבוי) ⇒ גם ביט-זהה (האזהרה
 * המקומית נשמרת); (ג) דלוק ⇒ שבת · יו״ט · יום-חול (בלי אזהרה) · טווח עברי בכרטיס.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { _resetFilterMemory } from '../../../lib/filterMemory';
import { installProvider, resetSwitchboard } from '../../../lib/switchboard/registry';
import { abilities as calendarAbilities, dayInfoOf } from '../../calendar/abilities';
import { hebRangeText, sacredGuardLines } from '../switchLinks';
import { B, cfgWith, fixtureDb, HOST_BOOKINGS, normHtml, NOW_ISO, restoreStore, setupStore } from '../../../lib/switchboard/__tests__/fixture';
import type { OrgConfig } from '../../../types/config';

const ORIG_TZ = process.env.TZ;
process.env.TZ = 'UTC';

/** הזהב — מהקוד שלפני השקעים (7073c4b), אותה רתמה בדיוק (TZ=UTC · NOW_ISO · אותו DB). */
const PRE = {
  tab: { sha: 'd0beb724c0ad53e5a1940f466657beeead192ffd045bf6426d3038525a0ca8d0', len: 7290 },
  hbS: { sha: 'dc5041de2c0732a0efed9b599b09630ad752c20ed8b1760db7444561f2225239', len: 2676 },
  hbY: { sha: '9e3fca260e158a25a57a8950a0837471b233a04431e75a041c4904594065f0a9', len: 2589 },
} as const;

/** שהייה שנכנסת בשבת (ו׳ חשוון) · שהייה שנכנסת בשבת ויוצאת ביום-כיפור. */
const db = () =>
  fixtureDb({
    hostBookings: [
      ...HOST_BOOKINGS,
      B({ id: 'hbS', guestId: 'hg2', unitId: 'hu3', checkIn: '2026-10-17', checkOut: '2026-10-19' }),
      B({ id: 'hbY', guestId: 'hg3', unitId: 'hu1', checkIn: '2026-09-19', checkOut: '2026-09-21', status: 'done' }),
    ],
  });

type Scr = ComponentType<Record<string, unknown>>;
let BookingsTab: Scr;
let BookingDialog: Scr;
beforeAll(async () => {
  BookingsTab = (await import('../BookingsTab')).BookingsTab as unknown as Scr;
  BookingDialog = (await import('../BookingModal')).BookingDialog as unknown as Scr;
});
afterAll(() => {
  if (ORIG_TZ === undefined) delete process.env.TZ;
  else process.env.TZ = ORIG_TZ;
});
beforeEach(() => {
  vi.setSystemTime(new Date(NOW_ISO));
  _resetFilterMemory();
});
afterEach(() => {
  vi.useRealTimers();
  restoreStore();
  resetSwitchboard();
});

const sha = (s: string): string => createHash('sha256').update(s).digest('hex');
function render(C: Scr, props: Record<string, unknown>, cfg: OrgConfig = cfgWith({ hosting: true })): string {
  _resetFilterMemory();
  setupStore(cfg, db());
  return normHtml(renderToStaticMarkup(createElement(C, props)));
}
const calOff = (): OrgConfig => {
  const c = cfgWith({ hosting: true });
  return { ...c, modules: { ...c.modules, calendar: false } };
};

/* ═══════════════ (א) העזרים הטהורים ═══════════════ */

describe('📅 (א) sacredGuardLines / hebRangeText', () => {
  it('כניסה בשבת ⇒ "⚠ הכניסה נופלת בשבת · ו׳ חשוון"; יום-חול ⇒ אין שורה', () => {
    expect(sacredGuardLines(dayInfoOf('2026-10-17'), dayInfoOf('2026-10-19'))).toEqual(['⚠ הכניסה נופלת בשבת · ו׳ חשוון']);
    expect(sacredGuardLines(dayInfoOf('2026-10-20'), dayInfoOf('2026-10-22'))).toEqual([]);
  });
  it('יו״ט באמצע-השבוע · יו״ט בשבת · שבת-חנוכה', () => {
    expect(sacredGuardLines(dayInfoOf('2026-09-19'), dayInfoOf('2026-09-21'))).toEqual([
      '⚠ הכניסה נופלת בשבת · ח׳ תשרי',
      '⚠ העזיבה נופלת ביום טוב · יום כיפור · י׳ תשרי',
    ]);
    expect(sacredGuardLines(dayInfoOf('2026-09-24'), dayInfoOf('2026-09-26'))).toEqual(['⚠ העזיבה נופלת בשבת · סוכות · ט״ו תשרי']);
    expect(sacredGuardLines(dayInfoOf('2026-12-03'), dayInfoOf('2026-12-05'))).toEqual(['⚠ העזיבה נופלת בשבת · חנוכה · כ״ה כסלו']);
    // חנוכה ביום-חול — לא סגור
    expect(sacredGuardLines(dayInfoOf('2026-12-07'), dayInfoOf('2026-12-08'))).toEqual([]);
  });
  it('תאריך פגום ⇒ אין שורה (לא זורק)', () => {
    expect(sacredGuardLines(dayInfoOf('xx'), dayInfoOf('2026-10-17'))).toEqual(['⚠ העזיבה נופלת בשבת · ו׳ חשוון']);
    expect(sacredGuardLines(dayInfoOf(null), dayInfoOf(undefined))).toEqual([]);
  });
  it('טווח עברי: אותו חודש · חודשים · שנים · אדר א׳→אדר ב׳ בשנה מעוברת · פגום', () => {
    expect(hebRangeText(dayInfoOf('2026-10-16'), dayInfoOf('2026-10-18'))).toBe('ה׳–ז׳ חשוון');
    expect(hebRangeText(dayInfoOf('2026-10-10'), dayInfoOf('2026-10-13'))).toBe('כ״ט תשרי – ב׳ חשוון');
    expect(hebRangeText(dayInfoOf('2026-09-10'), dayInfoOf('2026-09-13'))).toBe('כ״ח אלול תשפ״ו – ב׳ תשרי תשפ״ז');
    expect(hebRangeText(dayInfoOf('2027-03-07'), dayInfoOf('2027-03-10'))).toBe('כ״ח אדר א׳ – א׳ אדר ב׳') // אדר א׳ מלא (30);
    expect(hebRangeText(dayInfoOf('2026-10-16'), dayInfoOf('2026-10-16'))).toBe('ה׳ חשוון');
    expect(hebRangeText(dayInfoOf('2026-02-31'), dayInfoOf('2026-10-16'))).toBe('');
  });
});

/* ═══════════════ (ב) כבוי ⇒ ביט-זהה ═══════════════ */

describe('📅 (ב) כבוי (ברירת-המחדל) ⇒ ביט-זהה לקוד שלפני השקעים', () => {
  const cases: Array<[keyof typeof PRE, () => Scr, Record<string, unknown>]> = [
    ['tab', () => BookingsTab, {}],
    ['hbS', () => BookingDialog, { id: 'hbS' }],
    ['hbY', () => BookingDialog, { id: 'hbY' }],
  ];
  for (const [name, C, props] of cases) {
    it('ביט-זהה: ' + name + ' — בלי prop · prop=false · גם כשספק-הלוח נטען', () => {
      const off = name === 'tab' ? { hebDates: false } : { shabbatGuard: false };
      const plain = render(C(), props);
      expect(plain.length).toBe(PRE[name].len);
      expect(sha(plain)).toBe(PRE[name].sha);
      installProvider('calendar', calendarAbilities);
      expect(render(C(), props)).toBe(plain);
      expect(render(C(), { ...props, ...off })).toBe(plain);
      expect(plain).not.toContain('data-switch="shabbat-guard"');
      expect(plain).not.toContain('data-switch="stay-hebdates"');
    });
  }

  it('דלוק אבל הלוח לא זמין (ספק לא נטען · מודול-הלוח כבוי) ⇒ ביט-זהה (האזהרה המקומית נשמרת)', () => {
    const base = render(BookingDialog, { id: 'hbS' });
    expect(base).toContain('🕯️ צ׳ק-אין בשבת');
    expect(render(BookingDialog, { id: 'hbS', shabbatGuard: true })).toBe(base);
    expect(render(BookingsTab, { hebDates: true })).toBe(render(BookingsTab, {}));
    installProvider('calendar', calendarAbilities);
    expect(render(BookingDialog, { id: 'hbS', shabbatGuard: true }, calOff())).toBe(render(BookingDialog, { id: 'hbS' }, calOff()));
    expect(render(BookingsTab, { hebDates: true }, calOff())).toBe(render(BookingsTab, {}, calOff()));
  });
});

/* ═══════════════ (ג) דלוק ═══════════════ */

describe('📅 (ג) דלוק + הלוח זמין', () => {
  it('shabbatGuard: כניסה בשבת ⇒ האזהרה עם התאריך העברי (במקום האזהרה המקומית)', () => {
    installProvider('calendar', calendarAbilities);
    const html = render(BookingDialog, { id: 'hbS', shabbatGuard: true });
    expect(html).toContain('<div class="h-warnbox" data-switch="shabbat-guard"><div>⚠ הכניסה נופלת בשבת · ו׳ חשוון</div></div>');
    expect(html).not.toContain('🕯️ צ׳ק-אין בשבת');
  });
  it('shabbatGuard: כניסה בשבת + עזיבה ביום כיפור ⇒ שתי שורות', () => {
    installProvider('calendar', calendarAbilities);
    const html = render(BookingDialog, { id: 'hbY', shabbatGuard: true });
    expect(html).toContain('<div>⚠ הכניסה נופלת בשבת · ח׳ תשרי</div><div>⚠ העזיבה נופלת ביום טוב · יום כיפור · י׳ תשרי</div>');
  });
  it('shabbatGuard: יום-חול ⇒ אין אזהרה (ביט-זהה לכבוי)', () => {
    installProvider('calendar', calendarAbilities);
    expect(render(BookingDialog, { id: 'hb4', shabbatGuard: true })).toBe(render(BookingDialog, { id: 'hb4' }));
  });
  it('hebDates: כל כרטיס-שהייה מקבל את הטווח העברי לצד התאריכים', () => {
    installProvider('calendar', calendarAbilities);
    const html = render(BookingsTab, { hebDates: true });
    expect(html).toContain('<b>16/10 – 18/10</b><span style="color:var(--h-dim);font-size:12px;font-weight:600" data-switch="stay-hebdates"> · ה׳–ז׳ חשוון</span>');
    expect(html).toContain(' · ו׳–ח׳ חשוון</span>');
    expect(html).toContain(' · ח׳–י׳ תשרי</span>');
    expect(html.match(/data-switch="stay-hebdates"/g)?.length).toBe(db().hostBookings.length);
  });
});
