/**
 * ratchet — 🔌 המרכזייה 3: החיבורים במסכים (BUILD-ORDER-SWITCHBOARD-2026-10-13).
 * כלי שני כבוי ⇒ ביט-זהה — ננעל ב-ui-golden. כאן: שני הכלים דלוקים, הספקים נטענו (רינדור-שרת אמיתי), וכל שער נבדק לבד.
 *  א׳ כרטיס-ההזמנה ולשונית-השבת: זמני השבת + מניינים (בית-כנסת · כתובת) מלוח-הקהילה; "📤 שליחה למשפחה" רק בוואטסאפ
 *     ובטלפון תקין; תת-דגל השבת של האירוח (צרכן) / זמני-היום של פרנסה׳לע (ספק) / ספק שלא נטען ⇒ כלום.
 *  ב׳ "🔧 מצא בעל מקצוע" בקריאות פתוחות ובמשימות-ניקיון פתוחות — רק כשהמדריך זמין; הדיאלוג: פתוח-עכשיו, ☎ קוד, 📞
 *     בטלפוניה, 💬 בוואטסאפ, חירום ⇒ מספרי-החירום.
 *  ג׳ הקו בלשונית 📞: מקש 5 כשהאירוח דלוק.
 *  ד׳ ☀ תקציר היום בלוח-הבקרה ובלשונית-הטיפול; ⧉/💬 בדגל-הייצוא של הכלי.
 *  + הגנות-מקור: כל שער כתוב במקום אחד ומוכר; מסך של כלי אחד לא מייבא את הכלי האחר (רק דרך המרכזייה).
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, type ComponentType, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { _resetFilterMemory } from '../../filterMemory';
import { installProvider, resetSwitchboard } from '../registry';
import { abilities as hostingAbilities } from '../../../components/hosting/abilities';
import { abilities as parnasaAbilities } from '../../../components/parnasa/abilities';
import type { OrgConfig } from '../../../types/config';
import { cfgWith, fixtureDb, NOW_ISO, prNowAt, restoreStore, setupStore } from './fixture';

const ORIG_TZ = process.env.TZ;
process.env.TZ = 'UTC';

type Scr = Record<string, ComponentType<Record<string, unknown>>>;
let S: Scr = {};
let SRC: Record<string, string> = {};

beforeAll(async () => {
  const [booking, shabbat, maint, clean, dash, panels, care, phone] = await Promise.all([
    import('../../../components/hosting/BookingModal'),
    import('../../../components/hosting/ShabbatTab'),
    import('../../../components/hosting/MaintTab'),
    import('../../../components/hosting/CleanTab'),
    import('../../../components/hosting/DashTab'),
    import('../../../components/hosting/SwitchPanels'),
    import('../../../components/parnasa/CareTab'),
    import('../../../components/parnasa/PhoneTab'),
  ]);
  S = {
    BookingDialog: booking.BookingDialog,
    ShabbatTab: shabbat.ShabbatTab,
    MaintTab: maint.MaintTab,
    CleanTab: clean.CleanTab,
    DashTab: dash.DashTab,
    FindProDialog: panels.FindProDialog,
    CareTab: care.CareTab,
    PhoneTab: phone.PhoneTab,
  } as unknown as Scr;
  SRC = import.meta.glob(
    ['../../../components/hosting/*.tsx', '../../../components/hosting/*.ts', '../../../components/parnasa/*.tsx', '../../../components/parnasa/*.ts', '../../../components/switchboard/*.ts'],
    { query: '?raw', import: 'default', eager: true },
  ) as Record<string, string>;
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
});
afterEach(() => {
  vi.useRealTimers();
  restoreStore();
  resetSwitchboard();
});

const BOTH = { parnasa: true, hosting: true };
function html(cfg: OrgConfig, el: () => ReactElement, db = fixtureDb()): string {
  setupStore(cfg, db);
  return renderToStaticMarkup(el());
}
const count = (s: string, sub: string): number => s.split(sub).length - 1;
const src = (name: string): string => {
  const hit = Object.entries(SRC).find(([p]) => p.endsWith('/' + name));
  expect(hit, name).toBeTruthy();
  return hit![1];
};

/* ═══════════════ א׳ אירוח ← לוח הקהילה ═══════════════ */

describe('🕯 א׳ כרטיס-ההזמנה ולשונית-השבת ⇐ parnasa.shabbat + parnasa.minyanim', () => {
  const booking = (id: string) => () => createElement(S.BookingDialog, { id });

  it('שהייה לשבת (לוי, שישי–ראשון): זמני השבת, המניינים לפי בית-כנסת וכתובת, "📤 שליחה למשפחה" ממולא לטלפון-האורח', () => {
    const h = html(cfgWith(BOTH), booking('hb1'));
    expect(h).toContain('🕯️ שבת בשהייה · ו׳ חשוון תשפ״ז');
    expect(h).toContain('<span>הדלקת נרות · שישי 16/10 <b class="h-mono" dir="ltr">17:46</b></span>');
    expect(h).toContain('<span>צאת השבת <b class="h-mono" dir="ltr">18:47</b></span>');
    expect(h).toContain('<span>ר״ת <b class="h-mono" dir="ltr">19:19</b></span>');
    expect(h).toContain('בית המדרש הגדול');
    expect(h).toContain('רח׳ רבי עקיבא 10');
    expect(h).toContain('שישי: שחרית 06:30, מנחה 17:53 · שבת: שחרית 06:30, מנחה 17:52');
    expect(h).toContain('לפי אופק בני ברק · פרנסה׳לע של קהילת בעלזא');
    const m = /href="(https:\/\/wa\.me\/972501234567\?text=[^"]+)"[^>]*>📤 שליחה למשפחה/.exec(h);
    expect(m, 'קישור-הוואטסאפ לטלפון של משפחת לוי').toBeTruthy();
    const text = decodeURIComponent(m![1].split('?text=')[1].replace(/&amp;/g, '&'));
    expect(text).toBe(
      [
        'שלום משפחת לוי,',
        'מחכים לכם לשבת בצימר הגפן (צימרי הגליל).',
        '🕯️ שבת ו׳ חשוון תשפ״ז: הדלקת נרות ביום שישי 16/10 בשעה 17:46 · צאת השבת 18:47 (ר״ת 19:19).',
        '🙏 מניינים בקהילה:',
        '• בית המדרש הגדול (רח׳ רבי עקיבא 10) — שישי: שחרית 06:30, מנחה 17:53 · שבת: שחרית 06:30, מנחה 17:52',
        '• שטיבלך (רח׳ חזון איש 3) — שישי: שחרית 08:30, קבלת שבת 17:58 · שבת: שחרית 08:30, קבלת שבת 17:57',
        'הזמנים לפי אופק בני ברק.',
        'שבת שלום!',
      ].join('\n'),
    );
  });

  it('שהייה באמצע-השבוע ⇒ אין בלוק-שבת; וואטסאפ כבוי ⇒ הזמנים בלי 📤; אורח בלי טלפון ⇒ בלי 📤', () => {
    expect(html(cfgWith(BOTH), booking('hb4'))).not.toContain('שבת בשהייה');
    const noWa = html(cfgWith(BOTH, {}, { integrations: {} }), booking('hb1'));
    expect(noWa).toContain('שבת בשהייה');
    expect(noWa).not.toContain('📤');
    const db = fixtureDb({ hostBookings: fixtureDb().hostBookings.map((b) => (b.id === 'hb1' ? { ...b, guestId: 'hg3' } : b)) });
    const noPhone = html(cfgWith(BOTH), booking('hb1'), db);
    expect(noPhone).toContain('שבת בשהייה');
    expect(noPhone).not.toContain('📤');
  });

  it('שערים: צוות-השבת של האירוח כבוי (צרכן) · זמני-היום של פרנסה׳לע כבויים (ספק) · הספק לא נטען ⇒ כלום', () => {
    expect(html(cfgWith(BOTH, { 'hosting.shabbat': false }), booking('hb1'))).not.toContain('שבת בשהייה');
    expect(html(cfgWith(BOTH, { 'parnasa.zmanim': false }), booking('hb1'))).not.toContain('שבת בשהייה');
    const cancelled = fixtureDb({ hostBookings: fixtureDb().hostBookings.map((b) => (b.id === 'hb1' ? { ...b, status: 'cancelled' as const } : b)) });
    expect(html(cfgWith(BOTH), booking('hb1'), cancelled), 'הזמנה שבוטלה — אין מה לשלוח').not.toContain('שבת בשהייה');
    resetSwitchboard();
    expect(html(cfgWith(BOTH), booking('hb1'))).not.toContain('שבת בשהייה');
  });

  it('לשונית-השבת: פאנל "זמני השבת מלוח הקהילה" + 📤 רק בשורת ההזמנה ששוהה בליל-שבת; לוח כבוי ⇒ בלי מניינים', () => {
    const h = html(cfgWith(BOTH), () => createElement(S.ShabbatTab));
    expect(h).toContain('🕯️ זמני השבת מלוח הקהילה');
    expect(h).toContain('השבת הקרובה · ו׳ חשוון תשפ״ז');
    expect(h).toContain('השדות הידניים למטה נשמרים כמו שהם');
    expect(count(h, '📤 שליחה למשפחה')).toBe(1);
    // השדות הידניים של האירוח נשארים (הלוגיקה של האירוח לא הוחלפה)
    expect(h).toContain('value="17:40"');
    const noBoard = html(cfgWith(BOTH, { 'parnasa.board': false }), () => createElement(S.ShabbatTab));
    expect(noBoard).toContain('🕯️ זמני השבת מלוח הקהילה');
    expect(noBoard).not.toContain('בית המדרש הגדול');
  });
});

/* ═══════════════ ב׳ תחזוקה ⇒ מדריך ═══════════════ */

describe('🔧 ב׳ "מצא בעל מקצוע" ⇐ parnasa.findPro', () => {
  it('כפתור בכל קריאה פתוחה (לא בסגורה) ובכל משימת-ניקיון פתוחה; המדריך כבוי ⇒ אין כפתור', () => {
    expect(count(html(cfgWith(BOTH), () => createElement(S.MaintTab)), '🔧 מצא בעל מקצוע')).toBe(2);
    expect(count(html(cfgWith(BOTH), () => createElement(S.CleanTab)), '🔧 מצא בעל מקצוע')).toBe(1);
    expect(count(html(cfgWith(BOTH, { 'parnasa.directory': false }), () => createElement(S.MaintTab)), '🔧 מצא בעל מקצוע')).toBe(0);
    expect(count(html(cfgWith(BOTH, { 'parnasa.directory': false }), () => createElement(S.CleanTab)), '🔧 מצא בעל מקצוע')).toBe(0);
  });

  it('הדיאלוג: האינסטלטור הפתוח עכשיו (☎ 101 · ● פנוי עכשיו), 📞 בטלפוניה, 💬 עם נוסח-הפתיחה; קריאה-בלבד', () => {
    const h = html(cfgWith(BOTH), () => createElement(S.FindProDialog, { text: 'נזילה בכיור אינסטלציה', title: 'נזילה בכיור' }));
    expect(h).toContain('אינסטלציה זילברמן');
    expect(h).toContain(' · ☎ 101');
    expect(h).toContain('● פנוי עכשיו · עד 19:00');
    expect(h).toContain('href="tel:0500000101"');
    expect(h).toContain('href="https://wa.me/972500000101?text=' + encodeURIComponent('שלום, הגעתי אליך דרך פרנסה׳לע של קהילת בעלזא. צריך עזרה: נזילה בכיור אינסטלציה'));
    expect(h).toContain('קריאה בלבד מהמדריך של פרנסה׳לע של קהילת בעלזא — לא נשמר דבר.');
    expect(h).not.toContain('מספרי חירום');
  });

  it('שערי-ההרחבות: טלפוניה כבויה ⇒ בלי 📞 (המספר עדיין מוצג); וואטסאפ כבוי ⇒ בלי 💬; חירום ⇒ מספרי-החירום של הלוח', () => {
    const noTel = html(cfgWith(BOTH, {}, { telephony: undefined }), () => createElement(S.FindProDialog, { text: 'נזילה', title: 'נזילה' }));
    expect(noTel).not.toContain('tel:');
    expect(noTel).toContain('050-0000101');
    const noWa = html(cfgWith(BOTH, {}, { integrations: {} }), () => createElement(S.FindProDialog, { text: 'נזילה', title: 'נזילה' }));
    expect(noWa).not.toContain('wa.me');
    const urgent = html(cfgWith(BOTH), () => createElement(S.FindProDialog, { text: 'ריח גז במטבח גז', title: 'ריח גז במטבח', urgent: true }));
    expect(urgent).toContain('🚨 סכנה? מספרי חירום: מד״א 101 · איחוד הצלה 1221 · משטרה 100 · כיבוי אש 102');
  });

  it('בשבת: אין פתוח ⇒ "הכי מתאימים" עם מצבם; אין התאמה ⇒ "לא נמצא"', () => {
    vi.setSystemTime(new Date('2026-10-17T07:00:00Z'));
    const sat = html(cfgWith(BOTH), () => createElement(S.FindProDialog, { text: 'נזילה', title: 'נזילה' }));
    expect(sat).toContain('אין כרגע בעל מקצוע פתוח — הכי מתאימים:');
    expect(sat).toContain('○ חוזר במוצ״ש');
    vi.setSystemTime(new Date(NOW_ISO));
    expect(html(cfgWith(BOTH), () => createElement(S.FindProDialog, { text: 'מעלית תקועה', title: 'מעלית' }))).toContain('לא נמצא במדריך בעל מקצוע מתאים');
  });
});

/* ═══════════════ ג׳ הקו ═══════════════ */

describe('📞 ג׳ הקו בלשונית ⇐ hosting.availability', () => {
  it('שני הכלים ⇒ מקש 5 "לבדיקת יחידת אירוח פנויה" בתפריט; אירוח כבוי ⇒ אין', () => {
    expect(html(cfgWith(BOTH), () => createElement(S.PhoneTab, { now: prNowAt() }))).toContain('לבדיקת יחידת אירוח פנויה הקישו 5');
    expect(html(cfgWith({ parnasa: true }), () => createElement(S.PhoneTab, { now: prNowAt() }))).not.toContain('הקישו 5');
  });
});

/* ═══════════════ ד׳ תקציר-היום ═══════════════ */

describe('☀ ד׳ תקציר היום — לוח-הבקרה ולשונית-הטיפול', () => {
  const LINES = ['🏡 הגעות היום: 1 · עזיבות: 0 · בשהייה: 1', '✅ טופל היום: מזגן לא מקרר · בית ההארחה', '🕯 שבת: הדלקת נרות ביום שישי 16/10 ב־17:46 · צאת השבת 18:47'];

  it('לוח-הבקרה: הכרטיס עם שורות שני הכלים, ⧉ העתקה + 💬 שיתוף; ייצוא כבוי ⇒ בלי הכפתורים; וואטסאפ כבוי ⇒ בלי 💬', () => {
    const h = html(cfgWith(BOTH), () => createElement(S.DashTab, { biz: 'צימרי הגליל' }));
    expect(h).toContain('☀ תקציר היום');
    for (const l of LINES) expect(h, l).toContain(l);
    expect(h).toContain('⧉ העתקה');
    expect(h).toContain('href="https://wa.me/?text=' + encodeURIComponent('☀ תקציר היום · יום רביעי 14/10\n• ' + LINES[0]));
    const noExp = html(cfgWith(BOTH, { 'hosting.export': false }), () => createElement(S.DashTab, { biz: 'צימרי הגליל' }));
    expect(noExp).toContain('☀ תקציר היום');
    expect(noExp).not.toContain('⧉ העתקה');
    expect(html(cfgWith(BOTH, {}, { integrations: {} }), () => createElement(S.DashTab, { biz: 'x' }))).not.toContain('שיתוף בוואטסאפ');
    // כלי יחיד — גם כשהספקים כבר נטענו (מעבר-ארגון/כיבוי חי) — אין כרטיס
    expect(html(cfgWith({ hosting: true }), () => createElement(S.DashTab, { biz: 'x' }))).not.toContain('☀ תקציר היום');
  });

  it('לשונית-הטיפול: אותו תקציר; parnasa.export כבוי ⇒ בלי הכפתורים; הספקים לא נטענו ⇒ אין כרטיס (לא חצי-כרטיס)', () => {
    const care = () => createElement(S.CareTab, { now: prNowAt(), onJump: () => {}, canJump: () => true });
    const h = html(cfgWith(BOTH), care);
    for (const l of LINES) expect(h, l).toContain(l);
    expect(h).toContain('💬 שיתוף בוואטסאפ');
    expect(html(cfgWith(BOTH, { 'parnasa.export': false }), care)).not.toContain('⧉ העתקה');
    expect(html(cfgWith(BOTH, {}, { integrations: {} }), care)).not.toContain('שיתוף בוואטסאפ');
    expect(html(cfgWith({ parnasa: true }), care), 'כלי יחיד — אין כרטיס').not.toContain('☀ תקציר היום');
    resetSwitchboard();
    expect(html(cfgWith(BOTH), care)).not.toContain('☀ תקציר היום');
  });
});

/* ═══════════════ הגנות-מקור ═══════════════ */

describe('🔌 הגנות-מקור — כל שער במקומו; אין גישה ישירה בין הכלים', () => {
  it('א׳: צרכן (hosting.shabbat) + ספק (ask ok) + וואטסאפ/טלפון בקישור', () => {
    const s = src('SwitchPanels.tsx');
    expect(s).toContain('const on = env.on.shabbat && !!friIso;');
    expect(s).toMatch(/const sh = ask\('parnasa\.shabbat', ctx, \{ atIso: friIso \}\);\s*if \(!sh\.ok\) return null;/);
    expect(s).toContain('const wa = env.wa && g.phone ? waHref(g.phone, text, env.waApp) : null;');
    expect(src('BookingModal.tsx')).toContain('{b && <StayShabbat b={b} />}');
    expect(src('ShabbatTab.tsx')).toContain('<BoardShabbatPanel ctx={sw} />');
  });

  it('ב׳: הכפתור בשער סינכרוני (isAvailable) ובקריאה/משימה פתוחה בלבד; 📞 בטלפוניה, 💬 בוואטסאפ', () => {
    const s = src('SwitchPanels.tsx');
    expect(s).toContain("return isAvailable('parnasa.findPro', config);");
    expect(s).toContain('{telOn && p.phone && (');
    expect(s).toContain('const wa = env.wa && p.whatsapp ? waHref(p.whatsapp, res.waIntro, env.waApp) : null;');
    expect(src('MaintTab.tsx')).toContain("{proOn && r.status !== 'done' && (");
    expect(src('CleanTab.tsx')).toMatch(/\{o \? \([\s\S]*\{proOn && \(/);
    expect(src('HostingView.tsx')).toContain("case 'findPro':");
  });

  it('ד׳: הכרטיס רק עם כלי נוסף; הכפתורים בדגל-הייצוא; השיתוף בוואטסאפ ובשער-הייצוא', () => {
    const s = src('SwitchPanels.tsx');
    expect(s).toContain("const other = hasOtherTool(config, 'hosting');");
    expect(s).toMatch(/if \(!other\) return null;\s*const lines = todaySummary\(ctx\);\s*if \(!lines\.length\) return null;/);
    expect(s).toContain('{env.on.export && (');
    expect(s).toContain('if (!guardExport()) e.preventDefault();');
    const c = src('TodayCard.tsx');
    expect(c).toContain("const other = hasOtherTool(config, 'parnasa');");
    expect(c).toContain('{exportOn && (');
    expect(c).toContain('{waOn && (');
    expect(c).toMatch(/function copy\(\): void \{\s*if \(!guardExport\(\)\) return;/);
    expect(src('CareTab.tsx')).toContain('<TodayCard now={now} />');
    expect(src('DashTab.tsx')).toContain('<TodayPanel />');
  });

  it('אין גישה ישירה בין הכלים: מסכי-האירוח לא מייבאים את פרנסה׳לע ולהפך — רק דרך המרכזייה', () => {
    for (const [p, s] of Object.entries(SRC)) {
      if (p.includes('/components/hosting/')) expect(s, p).not.toMatch(/from '\.\.\/parnasa\//);
      if (p.includes('/components/parnasa/')) expect(s, p).not.toMatch(/from '\.\.\/hosting\//);
    }
  });

  it('כיסוי-טעינה: כל יכולת שצרכן שואל נמצאת ברשימת-הטעינה שלו (אחרת בדפדפן הספק לא ייטען — רינדור-שרת לא רואה)', () => {
    const idsIn = (s: string, constName: string): string[] => {
      const m = new RegExp('const ' + constName + ': readonly AbilityId\\[\\] = \\[([^\\]]*)\\];').exec(s);
      expect(m, constName).toBeTruthy();
      return [...m![1].matchAll(/'([a-z]+\.[A-Za-z]+)'/g)].map((x) => x[1]);
    };
    const asked = (s: string): string[] => [...new Set([...s.matchAll(/\bask\('([a-z]+\.[A-Za-z]+)'/g)].map((x) => x[1]))];
    // הקו: מה שהמודל (phoneLine) שואל ⊆ מה שהלשונית טוענת
    const line = asked(src('phoneLine.ts'));
    expect(line).toEqual(['calendar.dayInfo', 'hosting.availability']);
    // ENGINEBOX-SOCKETS: calendar.dayInfo נשאל רק מאחורי hebDateGreeting (ברירה false) — מי שמדליק מוסיף אותו ל-LINE_ABILITIES
    const lineOptIn = new Set(['calendar.dayInfo']);
    for (const id of line) if (!lineOptIn.has(id)) expect(idsIn(src('PhoneTab.tsx'), 'LINE_ABILITIES'), id).toContain(id);
    expect(src('phoneLine.ts')).toContain("input.hebDateGreeting === true ? hebTodaySentence(input.switchboard, hebDateAt(clock, loc)) : ''");
    // מסכי-האירוח: מה ש-SwitchPanels שואל ⊆ רשימות-הטעינה שלו
    const panels = src('SwitchPanels.tsx');
    const loaded = [...idsIn(panels, 'SHABBAT_IDS'), ...idsIn(panels, 'PRO_IDS'), ...idsIn(panels, 'CAL_IDS')];
    for (const id of asked(panels)) expect(loaded, id).toContain(id);
  });

  it('דבק-React: צפייה צרה (לא מנוי-DB-מלא), טעינה רק כשיש יכולת זמינה', () => {
    const s = src('useSwitchCtx.ts');
    expect(s).not.toMatch(/useApp\(\(s\) => s\.db\)/);
    // ENGINEBOX-SOCKETS: השער עבר ל-idsKey (ספק-ליבה בלי reads צריך להיטען); הסינון-לזמינות — בתוך loadProviders
    expect(s).toContain("if (idsKey) void loadProviders(config, idsKey.split('|'));");
    expect(s).toContain("keysRef.current.some((k) => !Object.is(prev[k], cur[k]))");
  });
});
