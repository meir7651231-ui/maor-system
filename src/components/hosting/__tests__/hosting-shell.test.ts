/**
 * ratchet — 🏡 אירוח 5: שלד-המסכים + הסקין המקורי (BUILD-ORDER-HOSTING-2026-10-12, אשכול 5).
 *  (א) חיווט: NAV/VIEWS/VIEW_LOADERS (chunk עצל) ב-App; בלי ייבוא-ערך סטטי של המסך.
 *  (ב) מודול כבוי (opt-in — המפתח חסר) ⇒ לא נגיש: כל hosting.* כבויים, view פתוח קופץ הביתה; דלוק ⇒ תת-הדגלים
 *      בחוזה הרגיל (חסר = פעיל, רק false מכבה).
 *  (ג) 11 הלשוניות של המקור — כל אחת בתת-הדגל שלה (רינדור-שרת אמיתי של המסך); ⚙️ הגדרות — hosting.manage בלבד;
 *      המונחים (אשף / "משפחה מתארחת") עוברים לפס-הלשוניות; באנר-השבת רק כשצוות-השבת דלוק.
 *  (ד) מוסכמות-הממשק: אפס דיאלוג-ילידי · אפס מנוי-DB-מלא · אפס `?? {}`/`?? []` בתוך סלקטור (React #185) ·
 *      מחיקה = canDelete + אישור in-app · וואטסאפ/סליקה מגודרי-הרחבה · יציאות דרך שער-הייצוא · זיכרון-לשונית/סינון.
 *  (ה) הסקין מוגבל-שורש: כל כלל ב-hosting.css תחת ‎.hst, כל משתנה ‎--h-, כל keyframes ‎h-, גופן מאורח-עצמית —
 *      שאר אורביט לא זז (הכרעה 6).
 * + עשן-רינדור לכל לשונית ולכל אחד מ-20 הדיאלוגים — עם נתונים (אפס קריסה, התוכן המרכזי מופיע).
 */
/// <reference types="node" />
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useApp } from '../../../store/useApp';
import { featureOn, moduleOn } from '../../../lib/config';
import { _resetFilterMemory } from '../../../lib/filterMemory';
import { DEFAULT_CONFIG, type OrgConfig } from '../../../types/config';
import {
  emptyDb,
  type Db,
  type HostAsset,
  type HostBooking,
  type HostCleanTask,
  type HostDish,
  type HostFault,
  type HostGuest,
  type HostingPrefs,
  type HostMeal,
  type HostPlan,
  type HostStaff,
  type HostSupply,
  type HostTableItem,
  type HostTempLog,
  type HostUnit,
} from '../../../types/domain';
import { HostingView } from '../HostingView';
import { DashTab } from '../DashTab';
import { CalendarTab } from '../CalendarTab';
import { BookingsTab } from '../BookingsTab';
import { BookingDialog, PayDialog } from '../BookingModal';
import { RoomsDialog, UnitDialog, UnitsTab } from '../UnitsTab';
import { GuestDialog, GuestsTab } from '../GuestsTab';
import { CleanTab, TaskDialog } from '../CleanTab';
import { KitchenTab } from '../KitchenTab';
import { MealDialog, RecipeDialog } from '../MealModal';
import { DishDialog, MenuDialog } from '../MenuModals';
import { StaffCardDialog, StaffDialog, StaffEditDialog } from '../StaffModals';
import { ShopDialog, TablesetDialog } from '../ShoppingModal';
import { SeatingDialog } from '../SeatingModal';
import { ShabbatTab } from '../ShabbatTab';
import { AssetDialog, FaultDialog, MaintTab, PlanDialog, TempDialog } from '../MaintTab';
import { ReportsTab } from '../ReportsTab';
import { SettingsTab } from '../SettingsTab';
import { telHref } from '../lib';
import appSrc from '../../../App.tsx?raw';

// ‏‎.css?raw חוזר ריק תחת vitest (עיבוד-CSS של vite) ⇒ קוראים את הקובץ ישירות.
const cssSrc = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../hosting.css'), 'utf8');

const UI_SRC = import.meta.glob(['../*.tsx', '../hooks.ts', '../backup.ts', '../exportDoc.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const src = (name: string): string => {
  const hit = Object.entries(UI_SRC).find(([p]) => p.endsWith('/' + name));
  expect(hit, name + ' קיים').toBeTruthy();
  return hit![1];
};

const SUB_FLAGS = ['hosting.calendar', 'hosting.housekeeping', 'hosting.kitchen', 'hosting.shabbat', 'hosting.maint', 'hosting.reports', 'hosting.export', 'hosting.delete', 'hosting.manage'];
/** לשונית ⇒ תת-הדגל שלה (השאר — ליבה, תמיד בתוך מודול דלוק). */
const GATED_TABS: Record<string, string> = {
  'hosting.calendar': '📅 יומן',
  'hosting.housekeeping': '🧹 ניקיון',
  'hosting.kitchen': '🍳 מטבח',
  'hosting.shabbat': '🕯️ שבת',
  'hosting.maint': '🔧 תחזוקה',
  'hosting.reports': '📈 דוחות',
};
const CORE_TABS = ['📊 לוח בקרה', '🗂️ הזמנות', '🏠 יחידות', '👪 אורחים'];

const ON = (features: Record<string, boolean> = {}, extra: Partial<OrgConfig> = {}): OrgConfig => ({ ...DEFAULT_CONFIG, modules: { hosting: true }, features, ...extra });

/**
 * רינדור-שרת (renderToStaticMarkup) קורא את ה-store דרך getServerSnapshot — כלומר getInitialState של zustand,
 * לא getState. לכן setup מיישר את שניהם (ומשוחזר אחרי כל בדיקה).
 */
const INIT = useApp.getInitialState() as unknown as Record<string, unknown>;
const ORIG = { config: INIT.config, db: INIT.db, cloud: INIT.cloud };

function setup(cfg: OrgConfig, db: Partial<Db> = {}, email: string | null = null): void {
  const st = useApp.getState();
  const patch = { config: cfg, db: { ...emptyDb(), ...db }, cloud: { ...st.cloud, user: email ? { uid: 'u', email } : null, isManager: false } };
  useApp.setState(patch as never);
  Object.assign(INIT, patch);
}

const render = (el: ReactElement): string => renderToStaticMarkup(el);
/** תוויות פס-הלשוניות בלבד (לא תוכן-המסך). */
function tabsOf(html: string): string[] {
  return [...html.matchAll(/<button[^>]*role="tab"[^>]*>([^<]*)<\/button>/g)].map((m) => m[1]);
}

beforeEach(() => {
  // "היום" של המסכים — רביעי 14.10.2026 (שבת = 17.10)
  vi.setSystemTime(new Date('2026-10-14T09:00:00'));
  _resetFilterMemory();
});
afterEach(() => {
  vi.useRealTimers();
  Object.assign(INIT, ORIG);
  useApp.setState({ config: DEFAULT_CONFIG, db: emptyDb(), view: 'home' } as never);
});

/* ═══════════════ (א) חיווט ═══════════════ */

describe('🏡 (א) חיווט ב-App', () => {
  it('NAV · VIEWS · VIEW_LOADERS עצל · בלי ייבוא-ערך סטטי', () => {
    expect(appSrc).toContain("{ view: 'hosting', icon: '🏡', label: 'אירוח משפחתי' }");
    expect(appSrc).toContain('hosting: HostingView,');
    expect(appSrc).toContain("hosting: () => import('./components/hosting/HostingView'),");
    expect(appSrc).toMatch(/n\.view === 'home' \|\| moduleEnabledIn\(config\.modules, n\.view\)/);
    // אין ייבוא-ערך סטטי של המסך (היה מכניס את כל המודול — 58KB+סקין — לבנדל-הראשי)
    expect(appSrc).not.toMatch(/^import .*from '\.\/components\/hosting\//m);
  });

  it('הסקין נטען עם המסך (chunk-CSS עצל) — לא מ-index/App', () => {
    expect(src('HostingView.tsx')).toContain("import './hosting.css';");
    expect(appSrc).not.toContain('hosting.css');
  });
});

/* ═══════════════ (ב) opt-in ═══════════════ */

describe('🏡 (ב) opt-in: כבוי כשחסר — לא נגיש; דלוק ⇒ החוזה הרגיל', () => {
  it('המפתח חסר ⇒ המודול וכל תת-הדגלים כבויים; true ⇒ כולם דלוקים; false לתת-דגל מכבה רק אותו', () => {
    expect(moduleOn(DEFAULT_CONFIG, 'hosting')).toBe(false);
    for (const k of SUB_FLAGS) expect(featureOn(DEFAULT_CONFIG, k), k).toBe(false);
    expect(moduleOn(ON(), 'hosting')).toBe(true);
    for (const k of SUB_FLAGS) expect(featureOn(ON(), k), k).toBe(true);
    const kitchenOff = ON({ 'hosting.kitchen': false });
    expect(featureOn(kitchenOff, 'hosting.kitchen')).toBe(false);
    expect(featureOn(kitchenOff, 'hosting.maint')).toBe(true);
  });

  it('מסך פתוח + המודול כובה/לא הודלק ⇒ הקפצה הביתה', () => {
    vi.stubGlobal('document', { documentElement: { dataset: {}, style: { setProperty() {}, removeProperty() {} } } });
    try {
      useApp.setState({ view: 'hosting' });
      useApp.getState().setConfig(ON());
      expect(useApp.getState().view).toBe('hosting');
      useApp.getState().setConfig({ ...DEFAULT_CONFIG, modules: {} });
      expect(useApp.getState().view).toBe('home');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

/* ═══════════════ (ג) לשוניות מגודרות ═══════════════ */

describe('🏡 (ג) כל לשונית מגודרת בתת-הדגל שלה (רינדור-שרת)', () => {
  it('הכול דלוק (מקומי = סמכות-מנהל) ⇒ 11 הלשוניות של המקור, בסדר שלו', () => {
    setup(ON());
    expect(tabsOf(render(createElement(HostingView)))).toEqual([
      '📊 לוח בקרה',
      '📅 יומן',
      '🗂️ הזמנות',
      '🏠 יחידות',
      '👪 אורחים',
      '🧹 ניקיון',
      '🍳 מטבח',
      '🕯️ שבת',
      '🔧 תחזוקה',
      '📈 דוחות',
      '⚙️ הגדרות',
    ]);
  });

  it('תת-דגל false ⇒ הלשונית שלו נעלמת, השאר נשארות', () => {
    for (const [flag, label] of Object.entries(GATED_TABS)) {
      setup(ON({ [flag]: false }));
      const tabs = tabsOf(render(createElement(HostingView)));
      expect(tabs, flag + ' כבוי ⇒ ' + label + ' נעלם').not.toContain(label);
      for (const [other, l2] of Object.entries(GATED_TABS)) if (other !== flag) expect(tabs, flag + ' כבוי ⇒ ' + l2 + ' נשאר').toContain(l2);
      for (const core of CORE_TABS) expect(tabs, core).toContain(core);
    }
  });

  it('⚙️ הגדרות — רק hosting.manage: עובד/ת בלי הדלקה לא רואה; הדלקה-פר-עובד ⇒ רואה; false מפורש ⇒ גם מנהל לא', () => {
    setup(ON({}, { adminEmails: ['owner@x.org'] }), {}, 'staff@x.org');
    expect(tabsOf(render(createElement(HostingView)))).not.toContain('⚙️ הגדרות');
    setup(ON({ 'hosting.manage': true }, { adminEmails: ['owner@x.org'] }), {}, 'staff@x.org');
    expect(tabsOf(render(createElement(HostingView)))).toContain('⚙️ הגדרות');
    setup(ON({}, { adminEmails: ['owner@x.org'] }), {}, 'owner@x.org');
    expect(tabsOf(render(createElement(HostingView)))).toContain('⚙️ הגדרות');
    setup(ON({ 'hosting.manage': false }, { adminEmails: ['owner@x.org'] }), {}, 'owner@x.org');
    expect(tabsOf(render(createElement(HostingView)))).not.toContain('⚙️ הגדרות');
  });

  it('המונחים: מונח-אשף גובר בפס-הלשוניות; "משפחה מתארחת" מחליף את אורחים', () => {
    setup(ON({}, { terms: { 'entity.hostUnits': 'צימרים', 'entity.hostBookings': 'שריונים' } }));
    const tabs = tabsOf(render(createElement(HostingView)));
    expect(tabs).toContain('🏠 צימרים');
    expect(tabs).toContain('🗂️ שריונים');
    setup(ON(), { ui: { ...emptyDb().ui, hosting: { familyTerm: true } } });
    expect(tabsOf(render(createElement(HostingView)))).toContain('👪 משפחות');
  });

  it('הכותרת: 🏡 + שם-העסק (הגדרות ⇐ מיתוג-הקונפיגורציה ⇐ שם-הארגון בנתונים ⇐ שם-העמודה); באנר-שבת רק כשצוות-השבת דלוק', () => {
    const sb: HostingPrefs = { shabbat: { mode: 'shabbat' } };
    setup(ON(), { orgName: 'עמותת אור', ui: { ...emptyDb().ui, hosting: { ...sb, businessName: 'צימרי הגליל' } } });
    let html = render(createElement(HostingView));
    expect(html).toContain('<span class="h-bn">צימרי הגליל</span>');
    expect(html).toContain('h-sbanner');
    expect(html).toMatch(/class="hst hst-root"/);
    setup(ON({ 'hosting.shabbat': false }), { orgName: 'עמותת אור', ui: { ...emptyDb().ui, hosting: sb } });
    html = render(createElement(HostingView));
    expect(html).toContain('<span class="h-bn">עמותת אור</span>');
    expect(html).not.toContain('h-sbanner');
    setup(ON({}, { orgName: 'צימרי הגולן' }), { orgName: 'עמותת אור' });
    expect(render(createElement(HostingView))).toContain('<span class="h-bn">צימרי הגולן</span>'); // כמו App: הקונפיגורציה גוברת
    setup(ON(), { orgName: '' });
    expect(render(createElement(HostingView))).toContain('<span class="h-bn">אירוח משפחתי</span>');
  });

  it('הגנת-מקור: כל לשונית מגודרת ב-tabs נושאת env.on.<x> משלה; ⚙️ = env.canManage', () => {
    const view = src('HostingView.tsx');
    const map: Record<string, string> = { cal: 'calendar', clean: 'housekeeping', kitchen: 'kitchen', shabbat: 'shabbat', maint: 'maint', reports: 'reports' };
    for (const [key, on] of Object.entries(map)) expect(view, key).toMatch(new RegExp("key: '" + key + "', label: '[^']+', on: env\\.on\\." + on + ' }'));
    expect(view).toMatch(/key: 'set', label: '⚙️ הגדרות', on: env\.canManage \}/);
    // לשונית שכובתה בזמן שהייתה פתוחה ⇒ חזרה ללוח-הבקרה (לא מסך-ריק)
    expect(view).toContain("const active: HostTab = tabs.some((x) => x.key === tab && x.on) ? tab : 'dash';");
  });
});

/* ═══════════════ (ד) מוסכמות-הממשק ═══════════════ */

describe('🏡 (ד) מוסכמות-הממשק', () => {
  it('אפס דיאלוג-ילידי · אפס מנוי-DB-מלא · אפס ברירת-מחדל בתוך סלקטור (React #185)', () => {
    for (const [path, s] of Object.entries(UI_SRC)) {
      // ui.confirm/ui.ask (in-app) מותרים; confirm()/prompt()/alert() ילידיים — לא
      expect(s, path).not.toMatch(/(^|[^.\w])(confirm|prompt|alert)\(|window\.(confirm|prompt|alert)\(/m);
      expect(s, path + ' — מנוי-DB-מלא').not.toMatch(/useApp\(\(s\) => s\.db\)/);
      expect(s, path + ' — ?? בתוך סלקטור').not.toMatch(/useApp\(\(s\) => [^)]*\?\? (\{\}|\[\])/);
    }
  });

  it('מחיקה לצמיתות = הרשאת canDelete + אישור in-app (ui.confirm) בכל קובץ שמוחק', () => {
    for (const [path, s] of Object.entries(UI_SRC)) {
      if (/s\.deleteHost(Booking|Unit|Meal)\b|s\.resetHosting\b/.test(s) || (/s\.deleteHostRecord\b/.test(s) && !path.endsWith('/ShoppingModal.tsx'))) {
        expect(s, path + ' — מחיקה בלי הרשאה').toContain('env.canDelete &&');
        expect(s, path + ' — מחיקה בלי אישור').toContain('ui.confirm(');
      }
    }
    // רשימת-הקניות/מערך-השולחן — עריכת-רשימה פתוחה לצוות (כמו במקור; ה-store פוטר רק supply/tableItem)
    expect(src('ShoppingModal.tsx')).not.toMatch(/deleteHost(Booking|Unit|Meal)\b/);
  });

  it('וואטסאפ — מגודר-הרחבה (env.wa) בכל קובץ שבונה קישור; סליקה — רק עם env.payUrl', () => {
    for (const [path, s] of Object.entries(UI_SRC)) {
      // כל קריאה — בתוך תנאי env.wa משלה (לא די ש-"env.wa" מופיע בקובץ: env.waApp מכיל אותו)
      const calls = (s.match(/\bwaHref\(/g) ?? []).length;
      expect((s.match(/env\.wa && [^;\n]*\bwaHref\(/g) ?? []).length, path + ' — waHref בלי env.wa').toBe(calls);
      const shares = (s.match(/\bwaShareHref\(/g) ?? []).length;
      expect((s.match(/\{env\.wa && \(\s*<a[^>]*?\bhref=\{waShareHref\(/g) ?? []).length, path + ' — שיתוף בלי env.wa').toBe(shares);
      if (s.includes('payLink(')) expect(s, path).toMatch(/env\.payUrl && bal > 0 \? payLink\(env\.payUrl/);
    }
  });

  it('יציאות-מידע דרך השער: הדפסה/הורדה/העתקה (exportDoc) · CSV (downloadCsv) · וואטסאפ-שיתוף — guardExport; הדוחות נרשמים', () => {
    const doc = src('exportDoc.ts');
    for (const fn of ['printHtmlDoc', 'downloadFile', 'copyText']) expect(doc, fn).toMatch(new RegExp('export (async )?function ' + fn + '\\([^)]*\\)[^{]*\\{\\s*if \\(!guardExport\\(\\)\\) return false;'));
    for (const [path, s] of Object.entries(UI_SRC)) {
      if (path.endsWith('/exportDoc.ts')) continue;
      expect(s, path + ' — Blob/clipboard ישיר עוקף את השער').not.toMatch(/new Blob\(|navigator\.clipboard|\.print\(\)/);
      if (s.includes('waShareHref(')) expect(s, path + ' — שיתוף בלי שער').toContain('guardExport()');
    }
    const rep = src('ReportsTab.tsx');
    expect(rep).toContain('{env.on.export && (');
    expect((rep.match(/logged\('/g) ?? []).length).toBe(5);
    expect(src('backup.ts')).toMatch(/logAccess\('⬇️ גיבוי/);
  });

  it('זיכרון-לשונית/סינון (useRemembered) · קישורי-חיוג מחוטאים', () => {
    expect(src('HostingView.tsx')).toContain("useRemembered<HostTab>('hosting.tab', 'dash')");
    for (const f of ['BookingsTab.tsx', 'GuestsTab.tsx', 'ReportsTab.tsx', 'KitchenTab.tsx']) expect(src(f), f).toMatch(/useRemembered(<[^>]+>)?\('hosting\./);
    for (const [path, s] of Object.entries(UI_SRC)) expect(s, path + " — 'tel:' + גולמי").not.toContain("'tel:' +");
    expect(telHref('050-123 4567')).toBe('tel:0501234567');
    expect(telHref('+972 50-1234567')).toBe('tel:+972501234567');
    expect(telHref('javascript:alert(1)')).toBe('tel:1');
  });
});

/* ═══════════════ (ה) הסקין מוגבל-שורש ═══════════════ */

/** כללי-ה-CSS (בלי הערות): סלקטור ⇒ נבדק; ‎@font-face/@keyframes ⇒ נאספים; ‎@media/@supports ⇒ נכנסים פנימה. */
function cssRules(css: string): { selectors: string[]; keyframes: string[]; fontFaces: string[] } {
  const s = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const selectors: string[] = [];
  const keyframes: string[] = [];
  const fontFaces: string[] = [];
  let i = 0;
  let pre = '';
  const skipBlock = (from: number): number => {
    let depth = 0;
    for (let j = from; j < s.length; j++) {
      if (s[j] === '{') depth++;
      else if (s[j] === '}' && --depth === 0) return j + 1;
    }
    return s.length;
  };
  while (i < s.length) {
    const c = s[i];
    if (c === '{') {
      const p = pre.trim();
      pre = '';
      if (/^@(media|supports)\b/.test(p)) {
        i++;
        continue;
      }
      const end = skipBlock(i);
      if (p.startsWith('@keyframes')) keyframes.push(p.slice(10).trim());
      else if (p.startsWith('@font-face')) fontFaces.push(s.slice(i, end));
      else if (p.startsWith('@')) throw new Error('at-rule לא צפוי: ' + p);
      else selectors.push(...splitTop(p));
      i = end;
      continue;
    }
    if (c === '}') {
      pre = '';
      i++;
      continue;
    }
    pre += c;
    i++;
  }
  return { selectors, keyframes, fontFaces };
}
/** פיצול לפי פסיקים ברמה העליונה (לא בתוך :not()/:where()). */
function splitTop(sel: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of sel) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

describe('🏡 (ה) הסקין "Aurora Glass" מוגבל-שורש — שאר אורביט לא זז', () => {
  const { selectors, keyframes, fontFaces } = cssRules(cssSrc);

  it('כל סלקטור מתחיל ב-‎.hst (או ‎.hst תחת ערכת "היכל" של אורביט) — אפס כלל גלובלי', () => {
    expect(selectors.length).toBeGreaterThan(300);
    // ‎.hst-root/.hst-portal — שורש-המודול ושכבת-הפורטל שלו (מחלקות שרק המודול נותן)
    const bad = selectors.filter((x) => !/^(:root\[data-theme="heichal"\] )?\.hst(-root|-portal)?(?![\w-])/.test(x));
    expect(bad, 'סלקטורים לא-מוגבלים').toEqual([]);
    expect(cssSrc).not.toMatch(/(^|[}\s,])(html|body|:root)\s*\{/);
  });

  it('כל משתנה ‎--h-, כל keyframes ‎h-, כל מחלקה ‎h-/hst', () => {
    const defs = [...cssSrc.matchAll(/[{;\s](--[\w-]+)\s*:/g)].map((m) => m[1]);
    expect(defs.length).toBeGreaterThan(20);
    expect(defs.filter((v) => !v.startsWith('--h-'))).toEqual([]);
    expect([...cssSrc.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]).filter((v) => !v.startsWith('--h-'))).toEqual([]);
    expect(keyframes.length).toBeGreaterThan(5);
    expect(keyframes.filter((k) => !k.startsWith('h-'))).toEqual([]);
    const classes = new Set([...cssSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/url\([^)]*\)/g, '').matchAll(/\.(-?[a-zA-Z_][\w-]*)/g)].map((m) => m[1]));
    expect([...classes].filter((c) => !c.startsWith('h-') && c !== 'hst' && !c.startsWith('hst-'))).toEqual([]);
  });

  it('גופן מאורח-עצמית בלבד (אפס CDN) — JetBrains Mono מקובץ מקומי + רישיון OFL', () => {
    expect(fontFaces.length).toBe(1);
    expect(fontFaces[0]).toContain("url('./fonts/jetbrains-mono-latin-wght-normal.woff2')");
    expect(cssSrc).not.toMatch(/https?:\/\//);
    expect(cssSrc).not.toMatch(/@import/);
  });

  it('ערכה כהה: מכשיר-כהה (אלא אם ◑ בהיר) · ◑ כהה · ערכת "היכל" של אורביט — כל אחת מגדירה רקע ודיו', () => {
    expect(cssSrc).toMatch(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*\.hst:not\(\[data-hst-theme="light"\]\)\{--h-bg:#070b13;[^}]*--h-ink:#e9f1f8;/);
    expect(cssSrc).toMatch(/\.hst\[data-hst-theme="dark"\]\{--h-bg:#070b13;[^}]*--h-ink:#e9f1f8;/);
    expect(cssSrc).toMatch(/:root\[data-theme="heichal"\] \.hst:not\(\[data-hst-theme="light"\]\)\{--h-bg:#070b13;[^}]*--h-ink:#e9f1f8;/);
  });

  it('זכוכית ("Aurora Glass") שורדת את ה-build: backdrop-filter תקני בלבד — בלי ‎-webkit- כפול ידני', () => {
    // באג שנתפס בצילומי-הצד-אל-צד (12.10): במקור כל כלל-זכוכית נכתב "backdrop-filter:X;-webkit-backdrop-filter:X";
    // המכווץ של ה-build מאחד את הזוג ומשאיר רק את האחרון (‎-webkit-) ⇒ בכרום/פיירפוקס אפס טשטוש (21 כללים — מודאלים,
    // כותרת, פאנלים: הדף נראה חד מבעד למודאל). התקני לבד ⇒ ה-build מוסיף את הקידומת בעצמו (-webkit- ואז התקני).
    expect(cssSrc).not.toContain('-webkit-backdrop-filter');
    expect((cssSrc.match(/backdrop-filter:blur\(/g) ?? []).length).toBeGreaterThan(15);
  });

  it('F15 (טלפון): פריטי-גריד מתכווצים — טבלת ציוד/תחזוקה-מונעת לא דוחפת את המסך לרוחב (במקור: ~580px ב-390)', () => {
    expect(cssSrc).toMatch(/\.hst :where\(\.h-two,\.h-frow,[^)]*\)>\*\{min-width:0\}/);
    // ובמסך-טלפון — מדדי-המטבח 2×2 כמו במקור (חלון-המודול צר מהמסך בריפוד-הכרום של אורביט)
    const rule = '.hst .h-kgauges{grid-template-columns:repeat(2,minmax(0,1fr))}';
    const at = cssSrc.indexOf(rule);
    const open = cssSrc.lastIndexOf('@media(max-width:640px){', at);
    expect(at).toBeGreaterThan(0);
    expect(open, 'בתוך בלוק-הטלפון').toBeGreaterThan(0);
    const between = cssSrc.slice(open, at);
    expect((between.match(/\{/g) ?? []).length - (between.match(/\}/g) ?? []).length, 'הבלוק עוד פתוח').toBe(1);
  });

  it('שכבת-המודאלים: בלי הקשר-ערימה בפורטל; מעל כרום אורביט ומתחת לטוסטים (200) — הודעת-שגיאה נראית מעל טופס פתוח', () => {
    expect(cssSrc).toMatch(/\.hst-portal\{(?![^}]*z-index)(?![^}]*position)[^}]*\}/);
    const z = Number(/\.hst \.h-mask\{[^}]*z-index:(\d+)/.exec(cssSrc)?.[1]);
    expect(z).toBeGreaterThan(100); // מודאלי אורביט (‎.modal-back)
    expect(z).toBeLessThan(150); // פלטת-הפקודות / טוסטים (200)
    for (const f of ['hui.tsx', 'ShoppingModal.tsx']) {
      for (const m of src(f).matchAll(/z=\{(\d+)\}/g)) {
        expect(Number(m[1]), f).toBeGreaterThan(z);
        expect(Number(m[1]), f).toBeLessThan(150);
      }
    }
  });

  it('המסך ומודאלי-הפורטל לובשים את הסקין (‎.hst + data-hst-theme)', () => {
    expect(src('HostingView.tsx')).toContain('<div className="hst hst-root" data-hst-theme={theme ?? undefined}>');
    expect(src('hui.tsx')).toContain('<div className="hst hst-portal" data-hst-theme={ui.theme ?? undefined}>');
  });
});

/* ═══════════════ עשן-רינדור לכל לשונית ולכל דיאלוג ═══════════════ */

const AT = '2026-10-10T08:00:00.000Z';
const UNITS: HostUnit[] = [
  { id: 'hu1', name: 'צימר הגפן', type: 'צימר', beds: 2, cap: 4, rate: 600, status: 'free', subRooms: [], createdAt: AT, updatedAt: AT },
  {
    id: 'hu2', name: 'בית ההארחה', type: 'בית הארחה', beds: 5, cap: 10, rate: 900, status: 'free', createdAt: AT, updatedAt: AT,
    subRooms: [
      { id: 'r1', name: 'חדר הורים', beds: 2, rate: 300 },
      { id: 'r2', name: 'חדר ילדים', beds: 3, rate: 350 },
    ],
  },
  { id: 'hu3', name: 'וילת הזית', type: 'וילה', beds: 4, cap: 8, rate: 1500, status: 'blocked', subRooms: [], createdAt: AT, updatedAt: AT },
  { id: 'hu4', name: 'דירת הגן', type: 'דירה', beds: 3, cap: 5, rate: 500, status: 'dirty', subRooms: [], createdAt: AT, updatedAt: AT },
];
const g = (id: string, name: string, phone: string): HostGuest => ({ id, kind: 'guest', name, phone, email: '', adults: 2, kids: 2, notes: 'אלרגיה לבוטנים', createdAt: AT, updatedAt: AT });
const bk = (over: Partial<HostBooking> & Pick<HostBooking, 'id' | 'guestId' | 'unitId' | 'checkIn' | 'checkOut' | 'status'>): HostBooking => ({
  roomIds: [], adults: 2, kids: 1, charges: [{ id: 'c1', kind: 'stay', label: 'לינה', amount: 1200 }], payments: [{ id: 'p1', amount: 500, date: '2026-10-10', note: 'מזומן' }],
  notes: '', shabbat: false, createdAt: AT, updatedAt: AT, ...over,
});
const BOOKINGS: HostBooking[] = [
  bk({ id: 'hb1', guestId: 'hg1', unitId: 'hu1', checkIn: '2026-10-14', checkOut: '2026-10-18', status: 'confirmed' }),
  bk({ id: 'hb2', guestId: 'hg2', unitId: 'hu2', roomIds: ['r1'], checkIn: '2026-10-12', checkOut: '2026-10-14', status: 'in', checkedInAt: AT }),
  bk({ id: 'hb3', guestId: 'hg1', unitId: 'hu1', checkIn: '2026-10-25', checkOut: '2026-10-27', status: 'pending' }),
  bk({ id: 'hb4', guestId: 'hg2', unitId: 'hu4', checkIn: '2026-10-08', checkOut: '2026-10-10', status: 'done' }),
];
const MEAL: HostMeal = {
  id: 'hm1', kind: 'meal', mealName: 'סעודת ליל שבת', bookingId: 'hb1', unitId: 'hu1', guestId: 'hg1', diners: [{ guestId: 'hg1', adults: 2, kids: 1 }], dinerCount: 3,
  date: '2026-10-16', time: '19:00', cook: 'hs1', server: '', clearer: '', tableSetter: '', status: 'new', allergens: 'בוטנים', notes: '',
  items: [{ name: 'עוף בתנור', dishId: 'hd1', price: 60, qty: 3, alg: '', by: 'hs1' }],
  seatPlan: { people: [{ id: 'p1', name: 'אבא כהן', kind: 'adult', guestId: 'hg1' }], tables: [{ id: 't1', name: 'שולחן 1', cap: 8, shape: 'round', chair: 'כיסא', seated: ['p1'], head: true, note: '' }] },
  createdAt: AT, updatedAt: AT,
};
const DISH: HostDish = {
  id: 'hd1', kind: 'dish', name: 'עוף בתנור', type: 'בשרי', price: 60, allergens: '', prepTime: '20', cookTime: '90', cookTemp: '180', baseServings: 4,
  ingredients: ['עוף · 1 ק״ג', 'תפוחי אדמה · 4'], steps: ['לתבל', 'לאפות'], notes: '', defBy: 'hs1', createdAt: AT, updatedAt: AT,
};
const STAFF: HostStaff = { id: 'hs1', kind: 'staff', name: 'רחל הטבחית', role: 'טבח', phone: '052-7654321', createdAt: AT, updatedAt: AT };
const CLEAN: HostCleanTask = { id: 'hc1', kind: 'clean', unitId: 'hu4', type: 'ניקיון אחרי עזיבה', status: 'open', date: '2026-10-10', bookingId: 'hb4', createdAt: AT, updatedAt: AT };
const SUPPLY: HostSupply = { id: 'hsu1', kind: 'supply', name: 'מיץ ענבים', cat: 'שתייה', qty: '6', bought: false, createdAt: AT, updatedAt: AT };
const TITEM: HostTableItem = { id: 'hti1', kind: 'tableItem', name: 'מפיות', perGuest: 2, createdAt: AT, updatedAt: AT };
const TEMP: HostTempLog = { id: 'htl1', kind: 'temp', device: 'מקרר', temp: 9, ok: false, at: '2026-10-14T07:00:00.000Z', createdAt: AT, updatedAt: AT };
const FAULT: HostFault = { id: 'hf1', kind: 'fault', unitId: 'hu3', assetId: 'ha1', category: 'חשמל', priority: 1, desc: 'קצר בלוח החשמל', status: 'open', safety: true, blocked: true, createdAt: AT, updatedAt: AT };
const ASSET: HostAsset = { id: 'ha1', kind: 'asset', name: 'דוד שמש', category: 'אינסטלציה', unitId: 'hu3', crit: 'קריטי', next: '2026-11-01', createdAt: AT, updatedAt: AT };
const PLAN: HostPlan = { id: 'hp1', kind: 'plan', task: 'ניקוי מסנני מזגן', assetId: 'ha1', freq: 'חודשי', due: '2026-10-20', createdAt: AT, updatedAt: AT };
const DATA: Partial<Db> = {
  orgName: 'עמותת אור',
  hostUnits: UNITS,
  hostBookings: BOOKINGS,
  hostRecords: [g('hg1', 'משפחת כהן', '050-1234567'), g('hg2', 'משפחת לוי', '054-1112222'), MEAL, DISH, STAFF, CLEAN, SUPPLY, TITEM, TEMP, FAULT, ASSET, PLAN],
  ui: { ...emptyDb().ui, hosting: { businessName: 'צימרי הגליל', shabbat: { mode: 'prep', candle: '17:41', havdalah: '18:36', level: 'מהדרין' } } },
};

describe('🏡 עשן-רינדור לכל לשונית (נתונים אמיתיים, אפס קריסה)', () => {
  it('📊 לוח בקרה: ברכה+שם-העסק, הגעות/עזיבות היום, יחידות לניקיון, יתרות פתוחות', () => {
    setup(ON(), DATA);
    const html = render(createElement(DashTab, { biz: 'צימרי הגליל' }));
    expect(html).toContain('בוקר טוב, צימרי הגליל');
    expect(html).toContain('הגעות היום');
    expect(html).toContain('משפחת כהן');
    expect(html).toContain('עזיבות היום');
    expect(html).toContain('משפחת לוי');
    expect(html).toContain('דירת הגן');
    expect(html).toContain('יתרות פתוחות');
  });

  it('📅 יומן: היחידות כשורות + פס-הזמנה', () => {
    setup(ON(), DATA);
    const html = render(createElement(CalendarTab));
    expect(html).toContain('יומן תפוסה');
    for (const u of UNITS) expect(html, u.name).toContain(u.name);
    expect(html).toContain('משפחת כהן');
  });

  it('🗂️ הזמנות · 🏠 יחידות · 👪 אורחים', () => {
    setup(ON(), DATA);
    const res = render(createElement(BookingsTab));
    expect(res).toContain('מרכז ההזמנות');
    expect(res).toContain('משפחת לוי');
    expect(res).not.toContain('wa.me'); // הרחבת-וואטסאפ כבויה
    const units = render(createElement(UnitsTab));
    expect(units).toContain('יחידות אירוח');
    expect(units).toContain('בית ההארחה');
    expect(units).toContain('וילת הזית');
    const guests = render(createElement(GuestsTab));
    expect(guests).toContain('משפחת כהן');
    expect(guests).toContain('href="tel:0501234567"');
    expect(guests).not.toContain('wa.me'); // הרחבת-וואטסאפ כבויה
    setup(ON({}, { integrations: { whatsapp: { enabled: true } } }), DATA);
    expect(render(createElement(GuestsTab))).toContain('wa.me');
    expect(render(createElement(BookingsTab))).toContain('wa.me');
  });

  it('🧹 ניקיון · 🍳 מטבח · 🕯️ שבת', () => {
    setup(ON(), DATA);
    const clean = render(createElement(CleanTab));
    expect(clean).toContain('ניקיון ומשק בית');
    expect(clean).toContain('ניקיון אחרי עזיבה');
    const kitchen = render(createElement(KitchenTab));
    expect(kitchen).toContain('תחנת הפיקוד');
    expect(kitchen).toContain('סעודת ליל שבת');
    expect(kitchen).toContain('רחל הטבחית');
    const sb = render(createElement(ShabbatTab));
    expect(sb).toContain('אירוח שבת וכשרות');
    expect(sb).toContain('🕯️ שוהים בשבת 17/10');
    expect(sb).toContain('＋ חבילת שבת');
    expect(sb).toContain('value="מהדרין"');
  });

  it('🔧 תחזוקה: קריאה חוסמת, ציוד, תחזוקה-מונעת; מחיקה רק עם הרשאה', () => {
    setup(ON(), DATA);
    const html = render(createElement(MaintTab));
    expect(html).toContain('תחזוקה, מתקנים ובטיחות');
    expect(html).toContain('קצר בלוח החשמל');
    expect(html).toContain('דוד שמש');
    expect(html).toContain('ניקוי מסנני מזגן');
    expect(html).toContain('מחיקת דוד שמש');
    setup(ON({}, { adminEmails: ['owner@x.org'] }), DATA, 'staff@x.org');
    expect(render(createElement(MaintTab))).not.toContain('מחיקת דוד שמש');
  });

  it('📈 דוחות: 6 הדוחות + 5 היציאות; hosting.export כבוי ⇒ אין יציאות', () => {
    setup(ON(), DATA);
    const html = render(createElement(ReportsTab, { biz: 'צימרי הגליל' }));
    expect(html).toContain('מרכז הדוחות');
    for (const x of ['🖨️ הדפסה / PDF', '⧉ העתק', '📄 CSV', '⬇️ הורדה']) expect(html, x).toContain(x);
    expect(html).not.toContain('💬 וואטסאפ'); // הרחבה כבויה
    setup(ON({ 'hosting.export': false }), DATA);
    const off = render(createElement(ReportsTab, { biz: 'צימרי הגליל' }));
    for (const x of ['🖨️ הדפסה / PDF', '📄 CSV', '⬇️ גיבוי כל הנתונים']) expect(off, x).not.toContain(x);
  });

  it('⚙️ הגדרות: פרטי-הארגון, גיבוי/שחזור; "אפס הכל" רק עם hosting.delete', () => {
    setup(ON(), DATA);
    const html = render(createElement(SettingsTab));
    expect(html).toContain('פרטי הארגון');
    expect(html).toContain('value="צימרי הגליל"');
    expect(html).toContain('⬆ שחזור מקובץ');
    expect(html).toContain('🗑 אפס הכל');
    setup(ON({ 'hosting.manage': true }, { adminEmails: ['owner@x.org'] }), DATA, 'staff@x.org');
    expect(render(createElement(SettingsTab))).not.toContain('🗑 אפס הכל');
  });
});

describe('🏡 עשן-רינדור לכל אחד מ-20 הדיאלוגים (שכבת-הפורטל — inline ברינדור-שרת)', () => {
  const CASES: [string, ReactElement, string][] = [
    ['booking', createElement(BookingDialog, { id: 'hb1' }), 'משפחת כהן'],
    ['booking-new', createElement(BookingDialog, { id: null, pre: { unitId: 'hu2', checkIn: '2026-10-20' } }), 'צור הזמנה'],
    ['pay', createElement(PayDialog, { id: 'hb1' }), 'תשלום'],
    ['unit', createElement(UnitDialog, { id: 'hu2' }), 'בית ההארחה'],
    ['rooms', createElement(RoomsDialog, { id: 'hu2' }), 'חדר ילדים'],
    ['guest', createElement(GuestDialog, { id: 'hg1' }), 'משפחת כהן'],
    ['task', createElement(TaskDialog), 'ניקיון'],
    ['meal', createElement(MealDialog, { id: 'hm1' }), 'סעודת ליל שבת'],
    ['recipe', createElement(RecipeDialog, { id: 'hm1' }), 'עוף בתנור'],
    ['menu', createElement(MenuDialog), 'עוף בתנור'],
    ['dish', createElement(DishDialog, { id: 'hd1' }), 'עוף בתנור'],
    ['staff', createElement(StaffDialog), 'רחל הטבחית'],
    ['staffEdit', createElement(StaffEditDialog, { id: 'hs1' }), 'רחל הטבחית'],
    ['staffCard', createElement(StaffCardDialog, { id: 'hs1' }), 'רחל הטבחית'],
    ['shop', createElement(ShopDialog), 'מיץ ענבים'],
    ['tableset', createElement(TablesetDialog), 'מפיות'],
    ['seating', createElement(SeatingDialog, { id: 'hm1' }), 'אבא כהן'],
    ['temp', createElement(TempDialog), 'מקרר'],
    ['fault', createElement(FaultDialog, { assetId: 'ha1' }), 'דוד שמש'],
    ['asset', createElement(AssetDialog), 'ציוד'],
    ['plan', createElement(PlanDialog), 'דוד שמש'],
  ];

  it.each(CASES)('%s', (_k, el, needle) => {
    setup(ON(), DATA);
    const html = render(el);
    expect(html).toContain('class="hst hst-portal"');
    expect(html).toContain('h-modal');
    expect(html).toContain(needle);
  });

  it('🔧 קריאה חדשה: ברירת-מחדל P3 (במקור P0 — שמירה בלי בחירה חסמה יחידה בטעות) · "— כללי —" · מהציוד ⇒ התיאור והיחידה שלו', () => {
    setup(ON(), DATA);
    const plain = render(createElement(FaultDialog, {}));
    expect(plain).toMatch(/<option value="3" selected="">P3 · /);
    expect(plain).not.toMatch(/<option value="0" selected="">/);
    expect(plain).toContain('<option value="">— כללי —</option>');
    expect(plain).toMatch(/<option value="hu1" selected="">צימר הגפן<\/option>/); // בלי ציוד — היחידה הראשונה, כמו במקור
    expect(plain).not.toContain('ויתריעו'); // אין התראה אמיתית — לא מבטיחים אותה
    const fromAsset = render(createElement(FaultDialog, { assetId: 'ha1' }));
    expect(fromAsset).toContain('value="תקלה בדוד שמש"');
    expect(fromAsset).toMatch(/<option value="hu3" selected="">וילת הזית<\/option>/);
    setup(ON(), { ...DATA, hostRecords: [...(DATA.hostRecords ?? []).filter((r) => r.id !== 'ha1'), { ...ASSET, unitId: '' }] });
    expect(render(createElement(FaultDialog, { assetId: 'ha1' }))).toContain('<option value="" selected="">— כללי —</option>');
  });

  it('דיאלוג לרשומה שנמחקה ⇒ לא קורס (null)', () => {
    setup(ON(), DATA);
    for (const el of [createElement(PayDialog, { id: 'nope' }), createElement(RoomsDialog, { id: 'nope' }), createElement(SeatingDialog, { id: 'nope' }), createElement(StaffCardDialog, { id: 'nope' })]) {
      expect(() => render(el)).not.toThrow();
    }
  });
});
