/**
 * ratchet — 🔌 המרכזייה: המסכים ביט-זהים כשהכלי השני כבוי (BUILD-ORDER-SWITCHBOARD-2026-10-13, הכרעה 2).
 *
 * הזהב נוצר מהקוד **שלפני** חיבורי-המרכזייה (c0296f6+ידע): רינדור-שרת אמיתי של כל מסך שהחיבורים נוגעים בו —
 * לוח-הבקרה, כרטיס-ההזמנה (שהייה לשבת · אמצע-שבוע), לשונית-השבת, התחזוקה, הניקיון, המסך-כולו (אירוח) · לשונית-הטיפול,
 * הקו, המסך-כולו (פרנסה׳לע) — עם נתוני **שני** הכלים ב-DB ועם וואטסאפ+טלפוניה דלוקים, אבל רק כלי אחד דלוק בקונפיג.
 * נשמר כגיבוב sha256 של ה-HTML (מזהי useId מנורמלים — מיקום-בעץ, לא ממשק נראה).
 * כלי שני כבוי ⇒ אף פיקסל לא זז. (רענון מכוון בלבד: ‎UPDATE_GOLDEN=1‎.)
 * 13.10 מיזוג עם העיצוב המקורי של פרנסה׳לע: הזהב של parnasa/ParnasaView ו-parnasa/CareTab הוקלט מחדש מקוד-העיצוב
 * **בלי** המרכזייה (9f843b9, אותה רתמה) — אימות-שפיות: 7 מסכי-האירוח ו-PhoneTab שוחזרו שם ביט-זהים לזהב הקודם.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement, type ComponentType, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { _resetFilterMemory } from '../../filterMemory';
import { cfgWith, fixtureDb, normHtml, NOW_ISO, prNowAt, restoreStore, setupStore } from './fixture';

const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'ui.golden.json');

// מסכים שמציגים שעה/ברכה לפי אזור-הזמן של המכשיר (לוח-הבקרה) ⇒ הזהב מקובע ל-UTC; הייבוא אחרי הקיבוע (פורמטים
// שנבנים בטעינת-המודול לוקחים את אזור-הזמן של אותו רגע).
const ORIG_TZ = process.env.TZ;
process.env.TZ = 'UTC';

type Scr = Record<string, ComponentType<Record<string, unknown>>>;
let H: Scr = {};
let PR: Scr = {};

beforeAll(async () => {
  const [view, dash, booking, shabbat, maint, clean, pview, care, phone] = await Promise.all([
    import('../../../components/hosting/HostingView'),
    import('../../../components/hosting/DashTab'),
    import('../../../components/hosting/BookingModal'),
    import('../../../components/hosting/ShabbatTab'),
    import('../../../components/hosting/MaintTab'),
    import('../../../components/hosting/CleanTab'),
    import('../../../components/parnasa/ParnasaView'),
    import('../../../components/parnasa/CareTab'),
    import('../../../components/parnasa/PhoneTab'),
  ]);
  H = {
    HostingView: view.HostingView,
    DashTab: dash.DashTab,
    BookingDialog: booking.BookingDialog,
    ShabbatTab: shabbat.ShabbatTab,
    MaintTab: maint.MaintTab,
    CleanTab: clean.CleanTab,
  } as unknown as Scr;
  PR = { ParnasaView: pview.ParnasaView, CareTab: care.CareTab, PhoneTab: phone.PhoneTab } as unknown as Scr;
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
});

const sha = (s: string): string => createHash('sha256').update(s).digest('hex');
const noop = (): void => {};
const yes = (): boolean => true;

/** מקרי-הזהב: [שם, אילו כלים דלוקים, המסך]. */
function cases(): Array<{ name: string; mods: { parnasa?: boolean; hosting?: boolean }; el: () => ReactElement }> {
  const now = prNowAt();
  return [
    { name: 'hosting/HostingView', mods: { hosting: true }, el: () => createElement(H.HostingView) },
    { name: 'hosting/DashTab', mods: { hosting: true }, el: () => createElement(H.DashTab, { biz: 'צימרי הגליל' }) },
    { name: 'hosting/BookingDialog:shabbat-stay', mods: { hosting: true }, el: () => createElement(H.BookingDialog, { id: 'hb1' }) },
    { name: 'hosting/BookingDialog:midweek', mods: { hosting: true }, el: () => createElement(H.BookingDialog, { id: 'hb4' }) },
    { name: 'hosting/ShabbatTab', mods: { hosting: true }, el: () => createElement(H.ShabbatTab) },
    { name: 'hosting/MaintTab', mods: { hosting: true }, el: () => createElement(H.MaintTab) },
    { name: 'hosting/CleanTab', mods: { hosting: true }, el: () => createElement(H.CleanTab) },
    { name: 'parnasa/ParnasaView', mods: { parnasa: true }, el: () => createElement(PR.ParnasaView) },
    { name: 'parnasa/CareTab', mods: { parnasa: true }, el: () => createElement(PR.CareTab, { now, onJump: noop, canJump: yes }) },
    { name: 'parnasa/PhoneTab', mods: { parnasa: true }, el: () => createElement(PR.PhoneTab, { now }) },
  ];
}

function renderCase(c: ReturnType<typeof cases>[number]): string {
  setupStore(cfgWith(c.mods), fixtureDb());
  return normHtml(renderToStaticMarkup(c.el()));
}

describe('🔌 זהב-מסכים — כלי שני כבוי ⇒ ביט-זהה לקוד שלפני המרכזייה', () => {
  if (process.env.UPDATE_GOLDEN === '1') {
    it('רענון-זהב מכוון (UPDATE_GOLDEN=1)', () => {
      const out: Record<string, { sha: string; len: number }> = {};
      for (const c of cases()) {
        const html = renderCase(c);
        out[c.name] = { sha: sha(html), len: html.length };
      }
      mkdirSync(dirname(FIXTURE), { recursive: true });
      writeFileSync(FIXTURE, JSON.stringify(out, null, 1) + '\n');
      expect(Object.keys(out).length).toBe(cases().length);
    });
    return;
  }

  it('קובץ-הזהב קיים ומכסה את כל המסכים', () => {
    expect(existsSync(FIXTURE)).toBe(true);
    const g = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Record<string, unknown>;
    expect(Object.keys(g).sort()).toEqual(cases().map((c) => c.name).sort());
  });

  for (const c of cases()) {
    it('ביט-זהה: ' + c.name, () => {
      const g = (JSON.parse(readFileSync(FIXTURE, 'utf8')) as Record<string, { sha: string; len: number }>)[c.name];
      const html = renderCase(c);
      expect(html.length, 'אורך ה-HTML').toBe(g.len);
      expect(sha(html), 'ה-HTML כולו').toBe(g.sha);
    });
  }
});
