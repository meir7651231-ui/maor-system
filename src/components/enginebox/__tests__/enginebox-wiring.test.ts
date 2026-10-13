/**
 * ratchet — 🧰 ארגז-המנועים, שלב ב׳ (ENGINEBOX-B 13.10): "הלקוח לוחץ חבר — והמוצר באמת משתנה".
 *
 * ננעל:
 *  (א) הקטלוג: 📅 הלוח העברי (orbit.calendar) נותן date.hebrew + times.blocked דרך calendar.dayInfo; שלושת הצרכנים
 *      (שומר-השבת בטופס-ההזמנה · התאריך העברי ברשימת-ההזמנות · ברכת-הקו) חיים, **לא** בברירת-המחדל (מתחילים מנותקים).
 *  (ב) store: linkEngine/unlinkEngine — חסר ⇒ מתחילים מ-DEFAULT_LINKS; אימות מול הקטלוג; שורת-לוג לכל שינוי; מורה נדחה;
 *      ניתוק-אחרון ⇒ [] מפורש (לא "חסר").
 *  (ג) המוצרים מצייתים: ניתוק ⇒ הרכיב חוצה-הכלים נעלם (והכלי שומר על ההתנהגות המקומית); חיבור-מחדש ⇒ ביט-זהה לקודם.
 *      כל 11 חיבורי ברירת-המחדל + 3 חיבורי-הלוח.
 *  (ד) המתאם (source.ts): מוצרים/ארגז/אפשרויות/בקרוב/מונה; start = מוצר או חלק בודד; מפתחות יציבים; canEdit=false ⇒ אין כתיבה.
 *  (ה) הגנות-מקור: הבנדל-הראשי (App/store) לא מייבא את הקטלוג או את המתאים; כל צרכן שואל את החיבור שלו.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, type ComponentType, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { _resetFilterMemory } from '../../../lib/filterMemory';
import { installProvider, resetSwitchboard } from '../../../lib/switchboard/registry';
import { abilities as hostingAbilities } from '../../hosting/abilities';
import { abilities as parnasaAbilities } from '../../parnasa/abilities';
import { abilities as calendarAbilities } from '../../calendar/abilities';
import { cfgWith, fixtureDb, B, HOST_BOOKINGS, normHtml, NOW_ISO, prNowAt, restoreStore, setupStore } from '../../../lib/switchboard/__tests__/fixture';
import { useApp } from '../../../store/useApp';
import { DEFAULT_LINKS, VALID_LINKS, catalogFor, connectOptions, linkKey, linkLabel, linkedSummaryLines, partById, PRODUCTS, summaryGiverOf, withLink, withoutLink } from '../../../lib/enginebox';
import { engineBoxSource } from '../source';
import type { OrgConfig } from '../../../types/config';
import type { Db } from '../../../types/domain';
import appSrc from '../../../App.tsx?raw';
import storeSrc from '../../../store/useApp.ts?raw';
import entrySrc from '../EngineBoxEntry.tsx?raw';
import hostingViewSrc from '../../hosting/HostingView.tsx?raw';
import maintSrc from '../../hosting/MaintTab.tsx?raw';
import cleanSrc from '../../hosting/CleanTab.tsx?raw';
import panelsSrc from '../../hosting/SwitchPanels.tsx?raw';
import phoneTabSrc from '../../parnasa/PhoneTab.tsx?raw';
import phoneLineSrc from '../../parnasa/phoneLine.ts?raw';
import todayCardSrc from '../../parnasa/TodayCard.tsx?raw';

const ORIG_TZ = process.env.TZ;
process.env.TZ = 'UTC';

const CAL = ['orbit.calendar>times.blocked>host.stay', 'orbit.calendar>date.hebrew>host.bookings', 'orbit.calendar>date.hebrew>pr.phone'];
const BOTH = { parnasa: true, hosting: true };

type Scr = Record<string, ComponentType<Record<string, unknown>>>;
let S: Scr = {};
beforeAll(async () => {
  const [booking, bookings, shabbat, maint, clean, dash, care, phone] = await Promise.all([
    import('../../hosting/BookingModal'),
    import('../../hosting/BookingsTab'),
    import('../../hosting/ShabbatTab'),
    import('../../hosting/MaintTab'),
    import('../../hosting/CleanTab'),
    import('../../hosting/DashTab'),
    import('../../parnasa/CareTab'),
    import('../../parnasa/PhoneTab'),
  ]);
  S = {
    BookingDialog: booking.BookingDialog,
    BookingsTab: bookings.BookingsTab,
    ShabbatTab: shabbat.ShabbatTab,
    MaintTab: maint.MaintTab,
    CleanTab: clean.CleanTab,
    DashTab: dash.DashTab,
    CareTab: care.CareTab,
    PhoneTab: phone.PhoneTab,
  } as unknown as Scr;
});
afterAll(() => {
  if (ORIG_TZ === undefined) delete process.env.TZ;
  else process.env.TZ = ORIG_TZ;
});
beforeEach(() => {
  vi.setSystemTime(new Date(NOW_ISO));
  _resetFilterMemory();
  installProvider('hosting', hostingAbilities);
  installProvider('parnasa', parnasaAbilities);
  installProvider('calendar', calendarAbilities);
});
afterEach(() => {
  vi.useRealTimers();
  restoreStore();
  resetSwitchboard();
});

/** DB עם רשימת-חיבורים שמורה (undefined ⇒ בלי המפתח ⇒ ברירת-המחדל). */
function dbWith(links: readonly string[] | undefined, over: Partial<Db> = {}): Db {
  const db = fixtureDb(over);
  const ui = { ...db.ui };
  if (links === undefined) delete ui.engineLinks;
  else ui.engineLinks = [...links];
  return { ...db, ui };
}
function html(links: readonly string[] | undefined, el: () => ReactElement, over: Partial<Db> = {}, cfg: OrgConfig = cfgWith(BOTH)): string {
  _resetFilterMemory();
  setupStore(cfg, dbWith(links, over));
  return normHtml(renderToStaticMarkup(el()));
}
const minus = (k: string): string[] => withoutLink(undefined, k)!;
const careEl = () => createElement(S.CareTab, { now: prNowAt(), onJump: () => {}, canJump: () => true });
const phoneEl = () => createElement(S.PhoneTab, { now: prNowAt() });

/* ═══════════════ (א) הקטלוג ═══════════════ */

describe('🧰 (א) 📅 הלוח העברי בארגז', () => {
  it('חלק של אורביט, מודול calendar, נותן date.hebrew ו-times.blocked דרך calendar.dayInfo (חי)', () => {
    const p = partById('orbit.calendar')!;
    expect(p.name).toBe('הלוח העברי');
    expect(p.emoji).toBe('📅');
    expect(p.from).toBe('אורביט');
    expect(p.module).toBe('calendar');
    expect(p.gives.map((g) => g.plug + ':' + g.via + ':' + g.live)).toEqual(['date.hebrew:calendar.dayInfo:true', 'times.blocked:calendar.dayInfo:true']);
    expect(p.needs).toEqual([]);
  });

  it('שלושת הצרכנים חיים ותקינים — ולא בברירת-המחדל (מתחילים מנותקים); VALID = ברירת-המחדל ∪ שלושתם', () => {
    for (const k of CAL) {
      expect(VALID_LINKS, k).toContain(k);
      expect(DEFAULT_LINKS, k).not.toContain(k);
    }
    expect([...VALID_LINKS].sort()).toEqual([...DEFAULT_LINKS, ...CAL].sort());
  });

  it('כל צרכן על החלק של המסך שלו: טופס-ההזמנה=כרטיס השהייה · רשימת ההזמנות (חלק חדש) · הקו', () => {
    expect(partById('host.stay')!.needs.find((n) => n.plug === 'times.blocked')?.at?.file).toBe('src/components/hosting/BookingModal.tsx');
    expect(partById('host.bookings')!.needs.find((n) => n.plug === 'date.hebrew')?.at?.file).toBe('src/components/hosting/BookingsTab.tsx');
    expect(partById('pr.phone')!.needs.find((n) => n.plug === 'date.hebrew')?.at?.file).toBe('src/components/parnasa/phoneLine.ts');
    expect(PRODUCTS.find((p) => p.id === 'hosting')!.parts).toContain('host.bookings');
  });

  it('תוצאות-ההבטחה = המשפטים של טבלת-השקעים', () => {
    expect(partById('host.stay')!.needs.find((n) => n.plug === 'times.blocked')!.result).toContain('"⚠ הכניסה נופלת בשבת · ו׳ חשוון"');
    expect(partById('host.bookings')!.needs[0]!.result).toContain('"16/10 – 18/10 · ה׳–ז׳ חשוון"');
    expect(partById('pr.phone')!.needs.find((n) => n.plug === 'date.hebrew')!.result).toContain('"היום כ״ז כסלו, חנוכה."');
  });

  it('אירוח + הלוח ⇒ שתי אפשרויות into (מנותקות); פרנסה׳לע + הלוח ⇒ ברכת-הקו; מודול-הלוח כבוי ⇒ לא בארגז', () => {
    const cfg = cfgWith(BOTH);
    expect(connectOptions({ start: 'hosting', picked: 'orbit.calendar', config: cfg }).map((o) => o.side + ':' + o.key + ':' + o.linked)).toEqual([
      'into:orbit.calendar>times.blocked>host.stay:false',
      'into:orbit.calendar>date.hebrew>host.bookings:false',
    ]);
    expect(connectOptions({ start: 'parnasa', picked: 'orbit.calendar', config: cfg }).map((o) => o.key)).toEqual(['orbit.calendar>date.hebrew>pr.phone']);
    const off = { ...cfg, modules: { ...cfg.modules, calendar: false } };
    expect(catalogFor(off).map((p) => p.id)).not.toContain('orbit.calendar');
  });
});

/* ═══════════════ (ב) store ═══════════════ */

describe('🧰 (ב) linkEngine / unlinkEngine', () => {
  const st = () => useApp.getState();
  const audit = () => st().db.audit ?? [];
  const K = 'pr.zmanim>times.shabbat>host.stay';

  it('חסר ⇒ ניתוק מתחיל מברירת-המחדל ומוריד רק את המפתח; שורת-לוג עברית', async () => {
    setupStore(cfgWith(BOTH), dbWith(undefined, { audit: [] }));
    expect(await st().unlinkEngine(K)).toBe(true);
    expect(st().db.ui.engineLinks).toEqual([...DEFAULT_LINKS].filter((k) => k !== K).sort());
    expect(audit().length).toBe(1);
    const a = audit().find((x) => x.act === 'ניתוק מנוע')!;
    expect(a.what).toBe('זמני היום והשבת ← כרטיס השהייה · זמני שבת');
  });

  it('חסר ⇒ חיבור מתחיל מברירת-המחדל ומוסיף; שורת-לוג לכל שינוי; חיבור חוזר / ניתוק כפול ⇒ false בלי לוג', async () => {
    setupStore(cfgWith(BOTH), dbWith(undefined, { audit: [] }));
    const C = CAL[1]!;
    expect(await st().linkEngine(C)).toBe(true);
    expect(st().db.ui.engineLinks).toEqual([...DEFAULT_LINKS, C].sort());
    expect(audit().filter((x) => x.act === 'חיבור מנוע').map((x) => x.what)).toEqual(['הלוח העברי ← רשימת ההזמנות · תאריך עברי']);
    expect(await st().linkEngine(C)).toBe(false);
    expect(await st().unlinkEngine(C)).toBe(true);
    expect(await st().unlinkEngine(C)).toBe(false);
    expect(audit().length).toBe(2);
    expect(st().db.ui.engineLinks).toEqual([...DEFAULT_LINKS].sort());
  });

  it('אימות מול הקטלוג: מפתח זר / לא-חי / בתוך כלי אחד ⇒ false, ה-DB לא זז', async () => {
    setupStore(cfgWith(BOTH), dbWith(undefined, { audit: [] }));
    const before = st().db;
    for (const bad of ['nope', 'host.units>booking>pr.phone', 'pr.zmanim>day.summary>pr.care', linkKey('pr.directory', 'emergency', 'host.maint')]) {
      expect(await st().linkEngine(bad), bad).toBe(false);
      expect(await st().unlinkEngine(bad), bad).toBe(false);
    }
    expect(st().db).toBe(before);
  });

  it('ניתוק-אחרון ⇒ [] מפורש (כלום לא מחובר), לא "חסר" (שהיה מחזיר את ברירת-המחדל)', async () => {
    setupStore(cfgWith(BOTH), dbWith([K], { audit: [] }));
    expect(await st().unlinkEngine(K)).toBe(true);
    expect(st().db.ui.engineLinks).toEqual([]);
  });

  it('הרשאה: מורה (shell.roles) ⇒ נדחה; מנהל/צוות ⇒ מותר', async () => {
    const roles = cfgWith(BOTH, { 'shell.roles': true }, { roles: { teachers: { 't@x.co': 'tc1' } } } as Partial<OrgConfig>);
    setupStore(roles, dbWith(undefined, { audit: [] }), 't@x.co');
    expect(await st().unlinkEngine(K)).toBe(false);
    expect('engineLinks' in st().db.ui).toBe(false);
    setupStore(roles, dbWith(undefined, { audit: [] }), 'staff@x.co');
    expect(await st().unlinkEngine(K)).toBe(true);
    expect(audit()[0]!.who).toBe('staff@x.co');
  });

  it('withLink/withoutLink/linkLabel טהורים', () => {
    expect(withLink(undefined, DEFAULT_LINKS[0]!)).toBeNull();
    expect(withLink([], 'zz')).toBeNull();
    expect(withoutLink([], K)).toBeNull();
    expect(withLink([], K)).toEqual([K]);
    expect(linkLabel('zz')).toBe('zz');
  });
});

/* ═══════════════ (ג) המוצרים מצייתים ═══════════════ */

describe('🧰 (ג) ניתוק ⇒ הרכיב נעלם · חיבור-מחדש ⇒ חוזר ביט-זהה', () => {
  const booking = (id: string) => () => createElement(S.BookingDialog, { id });

  /** ניתוק מפתח ⇒ ה-HTML בלי `gone`; חיבור-מחדש (רשימה מפורשת) ⇒ זהה לברירת-המחדל. */
  function roundTrip(key: string, el: () => ReactElement, gone: string, kept?: string): void {
    const dflt = html(undefined, el);
    expect(dflt, key + ' — ברירת-המחדל מציגה').toContain(gone);
    const cut = html(minus(key), el);
    expect(cut, key + ' — מנותק עדיין מציג').not.toContain(gone);
    if (kept) expect(cut, key + ' — ההתנהגות המקומית נשמרת').toContain(kept);
    expect(html(withLink(minus(key), key)!, el), key + ' — חיבור-מחדש').toBe(dflt);
  }

  it('זמני-השבת ⇒ כרטיס-השהייה: הבלוק "🕯️ שבת בשהייה" (הטופס עצמו נשאר)', () => {
    roundTrip('pr.zmanim>times.shabbat>host.stay', booking('hb1'), 'data-switch="stay-shabbat"', 'h-modal');
  });

  it('המניינים ⇒ כרטיס-השהייה: שורות-המניין ו"📤 שליחה למשפחה" (זמני-השבת נשארים)', () => {
    roundTrip('pr.board>times.prayers>host.stay', booking('hb1'), 'בית המדרש הגדול', 'data-switch="stay-shabbat"');
    expect(html(minus('pr.board>times.prayers>host.stay'), booking('hb1'))).not.toContain('📤 שליחה למשפחה');
  });

  it('זמני-השבת ⇒ לשונית-השבת: הפאנל "מלוח הקהילה" (השדות הידניים נשארים)', () => {
    roundTrip('pr.zmanim>times.shabbat>host.shabbat', () => createElement(S.ShabbatTab), 'data-switch="board-shabbat"', 'כניסת שבת');
  });

  it('המניינים ⇒ לשונית-השבת: שורות-המניין בפאנל ו-📤 בשורות', () => {
    roundTrip('pr.board>times.prayers>host.shabbat', () => createElement(S.ShabbatTab), 'בית המדרש הגדול', 'data-switch="board-shabbat"');
    expect(html(minus('pr.board>times.prayers>host.shabbat'), () => createElement(S.ShabbatTab))).not.toContain('📤');
  });

  it('המדריך ⇒ תחזוקה / ניקיון: "🔧 מצא בעל מקצוע" נעלם רק במסך שנותק', () => {
    roundTrip('pr.directory>pro.match>host.maint', () => createElement(S.MaintTab), '🔧 מצא בעל מקצוע');
    expect(html(minus('pr.directory>pro.match>host.maint'), () => createElement(S.CleanTab))).toContain('🔧 מצא בעל מקצוע');
    roundTrip('pr.directory>pro.match>host.clean', () => createElement(S.CleanTab), '🔧 מצא בעל מקצוע');
    expect(html(minus('pr.directory>pro.match>host.clean'), () => createElement(S.MaintTab))).toContain('🔧 מצא בעל מקצוע');
  });

  it('מספרי-החירום ⇒ תחזוקה: urgent נשלח רק כשמחובר (שער-המקור)', () => {
    expect(maintSrc).toContain("const emOn = useEmergencyLinked();");
    expect(maintSrc).toContain('urgent: emOn && (r.priority <= 1 || r.safety) })');
    expect(panelsSrc).toContain("return useEngineLink('pr.board', 'emergency', 'host.maint');");
  });

  it('מקום-פנוי ⇒ הקו: שלוחה 5 נעלמת', () => {
    roundTrip('host.units>availability>pr.phone', phoneEl, 'לבדיקת יחידת אירוח פנויה הקישו 5', 'לזמני היום הקישו 2');
  });

  it('תקציר-היום ⇒ לוח-הבקרה: כל נותן בנפרד; שניהם מנותקים ⇒ אין כרטיס', () => {
    const dash = () => createElement(S.DashTab, { biz: 'צימרי הגליל' });
    const SHB = '🕯 שבת: הדלקת נרות';
    roundTrip('pr.zmanim>day.summary>host.dash', dash, SHB, '☀ תקציר היום');
    expect(html(minus('pr.zmanim>day.summary>host.dash'), dash)).toContain('🏡 הגעות היום');
    const none = DEFAULT_LINKS.filter((k) => !k.endsWith('>day.summary>host.dash'));
    expect(html(none, dash)).not.toContain('data-switch="today"');
    expect(html(withLink(none, 'pr.board>day.summary>host.dash')!, dash)).not.toContain(SHB);
  });

  it('תקציר-היום ⇒ לשונית-האישורים: הכרטיס נעלם כשהאירוח מנותק', () => {
    roundTrip('host.dash>day.summary>pr.care', careEl, 'data-switch="today"');
  });

  it('📅 שומר-השבת: מנותק (ברירה) ⇒ האזהרה המקומית; מחובר ⇒ "⚠ הכניסה נופלת בשבת · ו׳ חשוון"', () => {
    const over = { hostBookings: [...HOST_BOOKINGS, B({ id: 'hbS', guestId: 'hg2', unitId: 'hu3', checkIn: '2026-10-17', checkOut: '2026-10-19' })] };
    const el = () => createElement(S.BookingDialog, { id: 'hbS', shabbatGuard: useApp.getState().db.ui.engineLinks?.includes(CAL[0]!) === true });
    const off = html(undefined, el, over);
    expect(off).toContain('🕯️ צ׳ק-אין בשבת');
    expect(off).not.toContain('data-switch="shabbat-guard"');
    const on = html(withLink(undefined, CAL[0]!)!, el, over);
    expect(on).toContain('⚠ הכניסה נופלת בשבת · ו׳ חשוון');
    expect(hostingViewSrc).toContain("const shabbatGuard = useEngineLink('orbit.calendar', 'times.blocked', 'host.stay');");
    expect(hostingViewSrc).toContain('<BookingDialog key={key} id={x.id} pre={x.pre} shabbatGuard={shabbatGuard} />');
  });

  it('📅 התאריך העברי ברשימת-ההזמנות: נשלט ע"י החיבור (HostingView)', () => {
    expect(hostingViewSrc).toContain("const hebDates = useEngineLink('orbit.calendar', 'date.hebrew', 'host.bookings');");
    expect(hostingViewSrc).toContain("body = <BookingsTab hebDates={hebDates} />;");
    expect(html(undefined, () => createElement(S.BookingsTab, { hebDates: true }))).toContain('data-switch="stay-hebdates"');
  });

  it('📅 ברכת-הקו: מנותק (ברירה) ⇒ בלי התאריך העברי; מחובר ⇒ "היום …" בברכה; מנותק-שוב ⇒ ביט-זהה', () => {
    const off = html(undefined, phoneEl);
    const on = html(withLink(undefined, CAL[2]!)!, phoneEl);
    expect(on).not.toBe(off);
    expect(on).toMatch(/היום [א-ת״׳]+ חשוון\./);
    expect(off).not.toMatch(/היום [א-ת״׳]+ חשוון\./);
    expect(html([...DEFAULT_LINKS], phoneEl)).toBe(off);
  });
});

/* ═══════════════ (ד) המתאם ═══════════════ */

describe('🧰 (ד) engineBoxSource', () => {
  const cfg = cfgWith(BOTH);
  const mk = (links: readonly string[] | undefined, canEdit = true) => {
    const calls: string[] = [];
    const src = engineBoxSource({ config: cfg, links, canEdit, connect: (k) => calls.push('+' + k), disconnect: (k) => calls.push('-' + k) });
    return { src, calls };
  };

  it('מוצרים = רק עם חלקים בארגז; הארגז = catalogFor; ארגון בלי הכלים ⇒ אין מוצרים, רק מנועי-אורביט', () => {
    const { src } = mk(undefined);
    expect(src.products().map((p) => p.id)).toEqual(['hosting', 'parnasa']);
    expect(src.products()[0]!.parts.map((p) => p.id)).toEqual(PRODUCTS[0]!.parts);
    expect(src.parts().map((p) => p.id)).toEqual(catalogFor(cfg).map((p) => p.id));
    const bare = engineBoxSource({ config: cfgWith({}), links: undefined, canEdit: true, connect: () => {}, disconnect: () => {} });
    expect(bare.products()).toEqual([]);
    expect(bare.parts().map((p) => p.id)).toEqual(['orbit.calendar', 'orbit.families']);
  });

  it('options: מפתח = linkKey הליבה (יציב), נותן/מקבל ככרטיסים, linked לפי השמור; start יכול להיות חלק בודד', () => {
    const { src } = mk(undefined);
    const o = src.options('hosting', 'pr.zmanim');
    expect(o.map((x) => x.key)).toEqual(['pr.zmanim>times.shabbat>host.stay', 'pr.zmanim>times.shabbat>host.shabbat', 'pr.zmanim>day.summary>host.dash']);
    expect(o.every((x) => x.linked)).toBe(true);
    expect(o[0]!.giver).toEqual({ id: 'pr.zmanim', name: 'זמני היום והשבת', emoji: '🕯️', from: 'פרנסה׳לע', what: partById('pr.zmanim')!.what });
    expect(o[0]!.needer.id).toBe('host.stay');
    expect(src.options('hosting', 'pr.zmanim')).toEqual(o);
    expect(src.options('host.stay', 'pr.zmanim').map((x) => x.key)).toEqual(['pr.zmanim>times.shabbat>host.stay']);
    expect(mk(minus(o[0]!.key)).src.options('hosting', 'pr.zmanim').map((x) => x.linked)).toEqual([false, true, true]);
  });

  it('future: "בקרוב" כנה (הזמנה מהקו), לא מעורבב', () => {
    const { src } = mk(undefined);
    expect(src.future('hosting', 'pr.phone').map((f) => f.giver.id + '>' + f.needer.id)).toEqual(['host.units>pr.phone']);
    expect(src.options('hosting', 'pr.phone').map((x) => x.key)).toEqual(['host.units>availability>pr.phone']);
  });

  it('linkedCount: החיבורים שבתוקף שנוגעים בהתחלה; משתנה עם החיבורים', () => {
    expect(mk(undefined).src.linkedCount('hosting')).toBe(11);
    expect(mk(undefined).src.linkedCount('host.stay')).toBe(2);
    expect(mk(undefined).src.linkedCount('orbit.calendar')).toBe(0);
    expect(mk(withLink(undefined, CAL[0]!)!).src.linkedCount('orbit.calendar')).toBe(1);
    expect(mk([]).src.linkedCount('hosting')).toBe(0);
    expect(mk(undefined).src.linkedCount('nope')).toBe(0);
  });

  it('connect/disconnect מועברים כמות-שהם; canEdit=false ⇒ אין קריאה', () => {
    const a = mk(undefined);
    a.src.connect(CAL[0]!);
    a.src.disconnect(DEFAULT_LINKS[0]!);
    expect(a.calls).toEqual(['+' + CAL[0], '-' + DEFAULT_LINKS[0]]);
    const b = mk(undefined, false);
    expect(b.src.canEdit).toBe(false);
    b.src.connect(CAL[0]!);
    b.src.disconnect(DEFAULT_LINKS[0]!);
    expect(b.calls).toEqual([]);
  });
});

/* ═══════════════ (ה) הגנות-מקור ═══════════════ */

describe('🧰 (ה) הגנות-מקור', () => {
  it('הבנדל-הראשי: App טוען את הכניסה lazy; ה-store טוען את החיבורים בייבוא דינמי בלבד', () => {
    expect(appSrc).toContain("lazy(async () => ({ default: (await import('./components/enginebox/EngineBoxEntry')).EngineBoxEntry }))");
    expect(appSrc).not.toMatch(/^import[^\n]*enginebox/m);
    expect(storeSrc).not.toMatch(/^import[^\n]*enginebox/m);
    expect(storeSrc).toContain("await import('../lib/enginebox/links')");
    expect(entrySrc).toContain("from './source'");
  });

  it('כל צרכן חי שואל את החיבור שלו', () => {
    expect(panelsSrc).toContain("useEngineLink('pr.zmanim', 'times.shabbat', needer)");
    expect(panelsSrc).toContain("useEngineLink('pr.board', 'times.prayers', needer)");
    expect(panelsSrc).toContain("useEngineLink('pr.directory', 'pro.match', needer)");
    expect(maintSrc).toContain("useFindProOn('host.maint')");
    expect(cleanSrc).toContain("useFindProOn('host.clean')");
    expect(phoneLineSrc).toContain("isLinked(input.engineLinks, 'host.units', 'availability', 'pr.phone') ? hostBranch(");
    expect(phoneTabSrc).toContain("'calendar.dayInfo': ['orbit.calendar', 'date.hebrew']");
    expect(todayCardSrc).toContain("hasSummaryLink(stored, 'pr.care')");
  });

  it('שורות-התקציר: כל יכולת עם today ממופה לנותן; שורה זרה בלי נותן ⇒ נזרקת', () => {
    expect(summaryGiverOf('parnasa.shabbat')).toBe('pr.zmanim');
    expect(summaryGiverOf('parnasa.minyanim')).toBe('pr.board');
    expect(summaryGiverOf('hosting.today')).toBe('host.dash');
    expect(summaryGiverOf('calendar.dayInfo')).toBeUndefined();
    const lines = [
      { ability: 'hosting.today', module: 'hosting' },
      { ability: 'parnasa.shabbat', module: 'parnasa' },
      { ability: 'x.y', module: 'zz' },
    ];
    expect(linkedSummaryLines(lines, undefined, 'hosting', 'host.dash').map((l) => l.ability)).toEqual(['hosting.today', 'parnasa.shabbat']);
    expect(linkedSummaryLines(lines, [], 'hosting', 'host.dash').map((l) => l.ability)).toEqual(['hosting.today']);
  });
});
