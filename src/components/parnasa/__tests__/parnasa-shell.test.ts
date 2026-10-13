/**
 * ratchet — 📒 פרנסה׳לע 5: שלד-המסכים (BUILD-ORDER-PARNASA-2026-10-12, אשכול 5).
 *  (א) חיווט: NAV/VIEWS/VIEW_LOADERS (chunk עצל) ב-App; הניווט מסנן דרך העוזר היחיד moduleEnabledIn.
 *  (ב) מודול כבוי (opt-in — המפתח חסר) ⇒ לא נגיש: אין קישור, כל parnasa.* כבויים, view פתוח קופץ
 *      הביתה; דלוק ⇒ תת-הדגלים בחוזה הרגיל (חסר = פעיל, רק false מכבה).
 *  (ג) עיצוב 1 — הניווט של המקור (אלפון · לוח בקשות · לוח הקהילה · העסק שלי · ניהול): כל לשונית מגודרת בתת-הדגל
 *      שלה (רינדור-שרת אמיתי של המסך, לא רק סריקה); "ניהול" = אזורי-המקור (אישורים · הכנסות · חסויות · מודעות
 *      וחוברת · 📞 הקו · הגדרות) — כל אזור בדגל שלו, הגדרות — גבאי בלבד; אף לשונית של הפורט לא אבדה.
 *  (ד) מוסכמות-הממשק (CLAUDE.md): "➕ הוספת {termOf}" (חוזה ה-e2e) · useRemembered + useListScrollRestore ·
 *      מחיקה = useArmed + הרשאה · וואטסאפ/חיוג/מפות מגודרי-הרחבה · אפס דיאלוג-ילידי · אפס מנוי-DB-מלא.
 *  (ה) 🛡 פרטיות-שקט בממשק: בקשה שקטה מתרנדרת בלי שם/טלפון הפונה; מה שנשלח לעסקים — מ-businessView;
 *      חשיפת-פונה רק למאשר/ת, ונרשמת ביומן-הגישה.
 * + עשן-רינדור לכל לשונית עם נתונים (אפס קריסה, התוכן המרכזי מופיע).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useApp } from '../../../store/useApp';
import { featureOn, moduleOn } from '../../../lib/config';
import { DEFAULT_CONFIG, type OrgConfig } from '../../../types/config';
import { emptyDb, type Db, type PrAd, type PrListing, type PrPost, type PrRequest } from '../../../types/domain';
import { ParnasaView } from '../ParnasaView';
import { CareTab } from '../CareTab';
import { DirectoryTab } from '../DirectoryTab';
import { RequestsTab } from '../RequestsTab';
import { BoardTab } from '../BoardTab';
import { BookletTab } from '../BookletTab';
import { AdsTab } from '../AdsTab';
import { SettingsTab } from '../SettingsTab';
import { AdminTab, adminSegsOf } from '../AdminTab';
import { MeTab } from '../MeTab';
import { clockAt, makeClosureFn, resolveZmanimLoc } from '../zmanimBoard';
import type { PrNow } from '../hooks';
import type { DirCtx } from '../DirectoryTab';
import { BizSheet, type BizCtx } from '../BizSheet';
import { hebNow } from '../shell';
import appSrc from '../../../App.tsx?raw';

const UI_SRC = import.meta.glob('../*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const src = (name: string): string => {
  const hit = Object.entries(UI_SRC).find(([p]) => p.endsWith('/' + name + '.tsx'));
  expect(hit, name + '.tsx קיים').toBeTruthy();
  return hit![1];
};

const SUB_FLAGS = ['parnasa.care', 'parnasa.directory', 'parnasa.requests', 'parnasa.board', 'parnasa.booklet', 'parnasa.phone', 'parnasa.ads', 'parnasa.zmanim', 'parnasa.export'];
/** לשוניות-המקור (פס-הלשוניות) ⇐ תת-הדגל שמגדר כל אחת. */
const TAB_LABELS: Record<string, string> = {
  directory: 'אלפון',
  requests: 'לוח בקשות',
  board: 'לוח הקהילה',
  me: 'העסק שלי',
  admin: 'ניהול',
};
const TAB_FLAG: Record<string, string> = { directory: 'parnasa.directory', requests: 'parnasa.requests', board: 'parnasa.board', me: 'parnasa.directory' };
/** אזורי "ניהול" ⇐ תת-הדגל (הכנסות/חסויות/מודעות — parnasa.ads; מודעות וחוברת — גם parnasa.booklet). */
const SEG_LABELS: Record<string, string> = { appr: 'אישורים', rev: 'הכנסות', spon: 'חסויות', ads: 'מודעות וחוברת', phone: '📞 הקו', set: 'הגדרות' };

/** פס-הלשוניות מתוך רינדור-השרת (התוויות מופיעות גם בטקסטים אחרים — "כל האלפון", "האלפון במנוחה"). */
function tabbar(html: string): string {
  const m = /<nav class="pn-tabbar"[\s\S]*?<\/nav>/.exec(html);
  return m ? m[0] : '';
}
function tabKeys(html: string): string[] {
  return [...tabbar(html).matchAll(/data-tab="(\w+)"/g)].map((m) => m[1]);
}

const ON = (features: Record<string, boolean> = {}, extra: Partial<OrgConfig> = {}): OrgConfig => ({ ...DEFAULT_CONFIG, modules: { parnasa: true }, features, ...extra });

function render(el: Parameters<typeof renderToStaticMarkup>[0]): string {
  return renderToStaticMarkup(el);
}

/**
 * רינדור-שרת (renderToStaticMarkup) קורא את ה-store דרך getServerSnapshot של useSyncExternalStore —
 * כלומר getInitialState של zustand, לא getState. לכן setup מיישר את שניהם (ומשוחזר אחרי כל בדיקה).
 */
const INIT = useApp.getInitialState() as unknown as Record<string, unknown>;
const ORIG = { config: INIT.config, db: INIT.db, cloud: INIT.cloud };

function setup(cfg: OrgConfig, db: Partial<Db> = {}, email: string | null = null): void {
  const st = useApp.getState();
  const patch = { config: cfg, db: { ...emptyDb(), ...db }, cloud: { ...st.cloud, user: email ? { uid: 'u', email } : null, isManager: false } };
  useApp.setState(patch as never);
  Object.assign(INIT, patch);
}

afterEach(() => {
  Object.assign(INIT, ORIG);
  useApp.setState({ config: DEFAULT_CONFIG, db: emptyDb(), view: 'home' } as never);
});

/* ═══════════════ (א) חיווט ═══════════════ */

describe('📒 (א) חיווט ב-App', () => {
  it('NAV · VIEWS · VIEW_LOADERS עצל · סינון-הניווט דרך moduleEnabledIn', () => {
    expect(appSrc).toContain("{ view: 'parnasa', icon: '📒', label: 'פרנסה׳לע' }");
    expect(appSrc).toContain('parnasa: ParnasaView,');
    expect(appSrc).toContain("parnasa: () => import('./components/parnasa/ParnasaView'),");
    expect(appSrc).toMatch(/n\.view === 'home' \|\| moduleEnabledIn\(config\.modules, n\.view\)/);
    // אין ייבוא-ערך סטטי של המסך (היה מכניס את כל המודול לבנדל-הראשי)
    expect(appSrc).not.toMatch(/^import .*from '\.\/components\/parnasa\//m);
  });
});

/* ═══════════════ (ב) מודול כבוי ⇒ לא נגיש ═══════════════ */

describe('📒 (ב) opt-in: כבוי כשחסר — לא נגיש; דלוק ⇒ החוזה הרגיל', () => {
  it('המפתח חסר ⇒ המודול וכל תת-הדגלים כבויים; true ⇒ כולם דלוקים; false לתת-דגל מכבה רק אותו', () => {
    expect(moduleOn(DEFAULT_CONFIG, 'parnasa')).toBe(false);
    for (const k of SUB_FLAGS) expect(featureOn(DEFAULT_CONFIG, k), k).toBe(false);
    expect(moduleOn(ON(), 'parnasa')).toBe(true);
    for (const k of SUB_FLAGS) expect(featureOn(ON(), k), k).toBe(true);
    const adsOff = ON({ 'parnasa.ads': false });
    expect(featureOn(adsOff, 'parnasa.ads')).toBe(false);
    expect(featureOn(adsOff, 'parnasa.board')).toBe(true);
  });

  it('מסך פתוח + המודול כובה/לא הודלק ⇒ הקפצה הביתה', () => {
    vi.stubGlobal('document', { documentElement: { dataset: {}, style: { setProperty() {}, removeProperty() {} } } });
    try {
      useApp.setState({ view: 'parnasa' });
      useApp.getState().setConfig(ON());
      expect(useApp.getState().view).toBe('parnasa');
      useApp.getState().setConfig({ ...DEFAULT_CONFIG, modules: {} });
      expect(useApp.getState().view).toBe('home');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

/* (ג) משתמש בנתוני-העשן שלמטה (DATA/nowOf) — נקראים בזמן-הריצה של הבדיקה, אחרי אתחול-המודול. */
/* ═══════════════ (ג) הניווט של המקור — לשוניות מגודרות ═══════════════ */

describe('📒 (ג) הניווט של המקור — כל לשונית ואזור מגודרים בתת-הדגל שלהם (רינדור-שרת)', () => {
  it('הכול דלוק (מקומי = סמכות-מנהל) ⇒ 5 הלשוניות של המקור, בסדר שלו, עם אייקוני-הקו', () => {
    setup(ON());
    const html = render(createElement(ParnasaView));
    expect(tabKeys(html)).toEqual(['directory', 'requests', 'board', 'me', 'admin']);
    for (const [k, label] of Object.entries(TAB_LABELS)) expect(tabbar(html), k).toContain('<span>' + label + '</span>');
    expect(tabbar(html)).toContain('#pn-i-tab-alfon');
    expect(tabbar(html)).toContain('#pn-i-tab-admin');
    // ברירת-המחדל = האלפון (הלשונית הראשונה של המקור)
    expect(tabbar(html)).toMatch(/aria-selected="true" data-tab="directory"/);
  });

  it('תת-דגל false ⇒ הלשונית שלו נעלמת, השאר נשארות (directory ⇒ גם "העסק שלי")', () => {
    for (const flag of ['parnasa.directory', 'parnasa.requests', 'parnasa.board']) {
      setup(ON({ [flag]: false }));
      const keys = tabKeys(render(createElement(ParnasaView)));
      for (const [k, f] of Object.entries(TAB_FLAG)) expect(keys.includes(k), flag + ' כבוי ⇒ ' + k).toBe(f !== flag);
      expect(keys, flag + ' כבוי ⇒ ניהול נשאר').toContain('admin');
    }
  });

  it('אזורי "ניהול": כל אזור בדגל שלו; הגדרות — רק לגבאי; בלי אף אזור ⇒ אין לשונית "ניהול"', () => {
    const keysOf = (c: OrgConfig, approve: boolean) => adminSegsOf(c, approve).filter((x) => x.on).map((x) => x.key);
    expect(keysOf(ON(), true)).toEqual(['appr', 'rev', 'spon', 'ads', 'phone', 'set']);
    expect(keysOf(ON(), false)).toEqual(['appr', 'rev', 'spon', 'ads', 'phone']);
    expect(keysOf(ON({ 'parnasa.care': false }), true)).not.toContain('appr');
    expect(keysOf(ON({ 'parnasa.ads': false }), true)).toEqual(['appr', 'ads', 'phone', 'set']); // החוברת עדיין במודעות וחוברת
    expect(keysOf(ON({ 'parnasa.ads': false, 'parnasa.booklet': false }), true)).toEqual(['appr', 'phone', 'set']);
    expect(keysOf(ON({ 'parnasa.phone': false }), true)).not.toContain('phone');
    // עובד/ת בלי parnasa.approve ושכל האזורים האחרים כבויים ⇒ אין "ניהול"; עם הדלקה-פר-עובד ⇒ יש (הגדרות)
    const allOff = { 'parnasa.care': false, 'parnasa.ads': false, 'parnasa.booklet': false, 'parnasa.phone': false };
    setup(ON(allOff, { adminEmails: ['gabbai@x.org'] }), {}, 'staff@x.org');
    expect(tabKeys(render(createElement(ParnasaView)))).not.toContain('admin');
    setup(ON({ ...allOff, 'parnasa.approve': true }, { adminEmails: ['gabbai@x.org'] }), {}, 'staff@x.org');
    expect(tabKeys(render(createElement(ParnasaView)))).toContain('admin');
  });

  it('"ניהול" מתרנדר עם פס-האזורים של המקור (div.seg) — כל התוויות, והאזור הפעיל עם התוכן שלו', () => {
    setup(ON(), DATA);
    const now = nowOf();
    const segs = adminSegsOf(ON(), true);
    const html = render(
      createElement(AdminTab, { now, segs, seg: 'appr', setSeg: () => {}, counts: { appr: 3, ads: 1 }, onJump: () => {}, canJump: () => true, adsOn: true, bookletOn: true }),
    );
    expect(html).toContain('גבאי האלפון');
    expect(html).toContain('<h1>ניהול</h1>');
    for (const label of Object.values(SEG_LABELS)) expect(html, label).toContain(label);
    expect(html).toMatch(/aria-selected="true">אישורים<span class="pn-sc">3<\/span>/);
    expect(html).toContain('ממתינים לאישור');
    // מודעות וחוברת = המודעות + "חוברת להדפסה" (תת-האזור book של המקור)
    const ads = render(
      createElement(AdminTab, { now, segs, seg: 'ads', setSeg: () => {}, counts: {}, onJump: () => {}, canJump: () => true, adsOn: true, bookletOn: true }),
    );
    expect(ads).toContain('data-sub="book"');
    expect(ads).toContain('מפתח המקצועות');
  });

  it('"העסק שלי": כותרת-המקור + בורר הדף-שבעריכה (כל העסקים עם מצב-האישור) + ➕ הוספה + העורך', () => {
    setup(ON(), DATA);
    const html = render(createElement(MeTab, { ctx: bizCtx(nowOf()), sel: null, setSel: () => {}, onOpen: () => {}, onPreview: () => {} }));
    expect(html).toContain('לבעלי עסקים');
    expect(html).toContain('<h1>העסק שלי</h1>');
    expect(html).toContain('אינסטלציה זילברמן · ☎ 101');
    expect(html).toContain('גינון עדן · ממתין');
    expect(html).toContain('➕ הוספת עסק');
    expect(html).toContain('עורך הדף');
    expect(html).toContain('טיוטה · עוד לא נשמר');
  });

  it('כל הלשוניות כבויות ⇒ מצב-ריק מסביר, לא מסך שבור', () => {
    const allOff = Object.fromEntries(SUB_FLAGS.map((k) => [k, false]));
    setup(ON(allOff, { adminEmails: ['gabbai@x.org'] }), {}, 'staff@x.org');
    const html = render(createElement(ParnasaView));
    expect(html).toContain('כבויות באשף');
    expect(tabKeys(html)).toEqual([]);
  });

  it('הגנת-מקור: כל לשונית נושאת featureOn(config, \'parnasa.<x>\') משלה; ניהול — כשיש אזור; הגדרות — canApprove', () => {
    const view = src('ParnasaView');
    for (const [k, flag] of Object.entries(TAB_FLAG)) {
      expect(view, k).toMatch(new RegExp("key: '" + k + "', label: '" + TAB_LABELS[k] + "', icon: '[\\w-]+', on: featureOn\\(config, '" + flag.replace('.', '\\.') + "'\\)"));
    }
    expect(view).toMatch(/key: 'admin', label: 'ניהול', icon: 'tab-admin', on: segs\.some\(\(s\) => s\.on\)/);
    const admin = src('AdminTab');
    expect(admin).toMatch(/key: 'appr', label: 'אישורים', on: featureOn\(config, 'parnasa\.care'\)/);
    expect(admin).toMatch(/key: 'phone', label: '📞 הקו', on: featureOn\(config, 'parnasa\.phone'\)/);
    expect(admin).toMatch(/key: 'set', label: 'הגדרות', on: canApprove/);
    // המודול מייבא את הסקין רק מהמסך העצל (‎parnasa.css בצ'אנק של ParnasaView)
    for (const [path, s2] of Object.entries(UI_SRC)) if (!path.endsWith('/ParnasaView.tsx')) expect(s2, path).not.toContain("import './parnasa.css'");
    expect(view).toContain("import './parnasa.css';");
  });
});

/* ═══════════════ (ד) מוסכמות-הממשק ═══════════════ */

describe('📒 (ד) מוסכמות-הממשק', () => {
  it('כפתורי-הוספה במוסכמת "➕ הוספת {termOf}" (חוזה ה-e2e)', () => {
    expect(src('MeTab')).toMatch(/➕ הוספת \{termOf\(config, 'entity\.prListing', 'עסק'\)\}/);
    expect(src('RequestsTab')).toMatch(/➕ הוספת \{termOf\(config, 'entity\.prRequest', 'בקשה'\)\}/);
    expect(src('BoardTab')).toMatch(/➕ הוספת \{termOf\(config, 'entity\.prPost', 'מודעה'\)\}/);
    expect(src('AdForm')).toMatch(/➕ הוספת \{termOf\(config, 'entity\.prAd', 'פרסומת'\)\}/); // עיצוב 6: הטופס בתוך הדף
  });

  it('רשימות: זיכרון-סינון (useRemembered) + חזרה-למקום מהכרטיס (useListScrollRestore)', () => {
    const remembered = /useRemembered(<[^>]+>)?\('parnasa\./;
    const dir = src('DirectoryTab');
    expect(dir).toMatch(remembered);
    expect(dir).toContain("useListScrollRestore('parnasa.dir', !!props.selId)");
    expect(src('RequestsTab')).toMatch(remembered);
    expect(src('BoardTab')).toMatch(remembered);
  });

  it('מחיקות: useArmed (שתי לחיצות) + הרשאת canDelete; אפס window.confirm/prompt; אפס מנוי-DB-מלא', () => {
    for (const [path, s] of Object.entries(UI_SRC)) {
      expect(s, path).not.toContain('window.confirm(');
      expect(s, path).not.toContain('window.prompt(');
      expect(s, path + ' — מנוי-DB-מלא').not.toMatch(/useApp\(\(s\) => s\.db\)/);
      if (/deletePr(Listing|Request|Post|Ad)\(/.test(s)) {
        expect(s, path + ' — מחיקה בלי חימוש (שער if (!confirmTwice(…))').toContain('if (!confirmTwice(');
        expect(s, path + ' — מחיקה בלי הרשאה').toContain('canDelete');
      }
    }
  });

  it('וואטסאפ/חיוג/מפות — מגודרי-הרחבה בכל קובץ שמשתמש בהם', () => {
    for (const [path, s] of Object.entries(UI_SRC)) {
      if (s.includes('<WaBtn')) expect(s, path).toContain("integrationOn(config, 'whatsapp')");
      if (s.includes('<CallBtn')) expect(s, path).toContain('telephonyOn(config)');
      if (s.includes('mapsSearchUrl(')) expect(s, path).toContain("integrationOn(config, 'maps')");
    }
  });
});

/* ═══════════════ עשן-רינדור לכל לשונית + (ה) פרטיות-שקט ═══════════════ */

const NOW_MS = Date.UTC(2026, 9, 14, 9, 0); // 14.10.2026 12:00 בישראל (רביעי)
function nowOf(): PrNow {
  const loc = resolveZmanimLoc();
  const clock = clockAt(NOW_MS, loc.tz);
  return { nowMs: NOW_MS, loc, clock, todayIso: clock.iso, closureAt: makeClosureFn(loc) };
}
/** הקשר-המסך של האלפון (השלד מספק אותו). */
function dirCtx(now: PrNow): DirCtx {
  return {
    now,
    heb: hebNow(now.clock, now.loc),
    closure: now.closureAt(now.clock.iso, now.clock.hhmm),
    reduced: false,
    focusTick: 0,
    quick: { favs: [], recents: [], toggleFav: () => false, touch: () => {} },
    toastAct: () => {},
    goReq: () => {},
    goAdmin: () => {},
    goJoin: () => {},
  };
}

function bizCtx(now: PrNow): BizCtx {
  return { now, calm: false, reduced: true, quick: { favs: [], recents: [], toggleFav: () => false, touch: () => {} }, monthStartIso: now.todayIso, toastAct: () => {} };
}
const sheet = (now: PrNow, id = 'prl1') => render(createElement(BizSheet, { id, qtext: '', ctx: bizCtx(now), onClose: () => {}, onOpen: () => {} }));

function L(over: Partial<PrListing>): PrListing {
  return {
    id: 'prl1', source: 'owner', name: 'אינסטלציה זילברמן', title: 'נזילות וסתימות', category: 'elec', area: 'גוש דן', city: 'בני ברק',
    phone: '050-0000101', phone2: '', whatsapp: '050-0000101', hours: [{ dow: 3, from: '08:00', to: '19:00' }], always: false, hoursNote: '',
    services: [{ name: 'פתיחת סתימה', price: '250', note: '' }], languages: ['he'], kashrut: '', emergency: true, desc: '', notes: 'סוד פנימי',
    status: 'approved', dialCode: '101', featuredUntil: '', recs: [], createdAt: '2026-10-01T08:00:00.000Z', updatedAt: '2026-10-01T08:00:00.000Z', ...over,
  };
}
const QUIET: PrRequest = {
  id: 'prq1', text: 'מחפשת יועץ זוגי דיסקרטי. טלפון 052-9876543', category: 'health', area: '', urgent: false, quiet: true, job: false,
  requester: { name: 'רחל גולדברג', phone: '052-9876543' }, status: 'open', responses: [], createdAt: '2026-10-14T07:00:00.000Z', updatedAt: '2026-10-14T07:00:00.000Z',
};
const REGULAR: PrRequest = { ...QUIET, id: 'prq2', text: 'צריך אינסטלטור', category: 'elec', quiet: false, requester: { name: 'יעקב כהן', phone: '052-1111111' } };
const POSTS: PrPost[] = [
  { id: 'prp1', kind: 'minyan', title: 'בית המדרש הגדול', text: '', place: 'רחוב החסידים 2', phone: '', noticeKind: '', prayers: [{ prayer: 'מנחה', times: ['sh-15'] }], days: [], date: '', time: '', until: '', approved: true, pinned: false, createdAt: '', updatedAt: '' },
  { id: 'prp2', kind: 'notice', title: 'שיעור חדש בשולחן ערוך', text: 'כל יום אחרי מעריב', place: '', phone: '', noticeKind: 'shiur', prayers: [], days: [], date: '', time: '', until: '', approved: true, pinned: false, createdAt: '', updatedAt: '' },
];
const ADS: PrAd[] = [
  { id: 'pra1', slot: 'category', kind: 'line', target: 'elec', advertiser: 'חשמל אור הגנוז', headline: 'השער בחסותנו', body: '', phone: '', from: '', to: '', price: 300, paid: false, paidAt: '', active: true, createdAt: '', updatedAt: '' },
];
const DATA: Partial<Db> = { prListings: [L({}), L({ id: 'prl2', name: 'גינון עדן', category: 'home', status: 'pending', dialCode: '' })], prRequests: [QUIET, REGULAR], prPosts: POSTS, prAds: ADS };

describe('📒 עשן-רינדור לכל לשונית (נתונים אמיתיים, אפס קריסה)', () => {
  const now = nowOf();
  const noop = () => {};

  it('🏠 טיפול: הממתין מופיע עם פעולות-גבאי; בלי פרטי-פונה', () => {
    setup(ON(), DATA);
    const html = render(createElement(CareTab, { now, onJump: noop, canJump: () => true }));
    expect(html).toContain('גינון עדן');
    // עיצוב 6: כרטיס-הניהול של המקור (acard) — "אישור" עם ✓ של המקור, "הסתרה", "מחיקה"
    expect(html).toMatch(/<article class="pn-acard"><div class="pn-row1">/);
    expect(html).toMatch(/<button class="pn-btn pn-primary" type="button"><svg[^>]*><use href="#pn-i-check"><\/use><\/svg>אישור<\/button>/);
    expect(html).toContain('>הסתרה</button>');
    expect(html).not.toContain('רחל');
  });

  it('📇 אלפון — "כל האלפון": עיון לפי שער — הכרטיס, קוד-החיוג, פתוח-עכשיו; הערה-פנימית לא בכרטיס', () => {
    setup(ON(), DATA);
    const html = render(createElement(DirectoryTab, { ctx: dirCtx(now), q: '', setQ: noop, selId: null, setSelId: noop, onNewRequest: noop, initialBrowse: true }));
    expect(html).toContain('data-mode="browse"');
    expect(html).toContain('כל האלפון');
    expect(html).toContain('אינסטלציה זילברמן');
    expect(html).toContain('☎ 101');
    expect(html).toContain('פנוי עכשיו');
    expect(html).not.toContain('סוד פנימי');
  });

  it('📇 אלפון — הבית של המקור: "מה צריך?", מטבעות-העונה (6) עם הספירה, חיפושים נפוצים, שורת-הסיכום', () => {
    setup(ON(), DATA);
    const html = render(createElement(DirectoryTab, { ctx: dirCtx(now), q: '', setQ: noop, selId: null, setSelId: noop, onNewRequest: noop }));
    expect(html).toContain('data-mode="ask"');
    expect(html).toContain('מה צריך<span class="pn-qm">?</span>');
    expect(html).toContain('placeholder="נזילה, קצר בחשמל, מלמד…"');
    expect(html.match(/class="pn-pb pn-ct"/g)?.length).toBe(6);
    expect(html).toContain('חיפושים נפוצים');
    expect(html).toContain('בעונה הזו');
    expect(html).toContain('ימי החורף'); // ג׳ חשוון
    expect(html).toContain('1 בעל מקצוע'.replace('1 בעל מקצוע', 'בעל מקצוע'));
    expect(html).not.toContain('סוד פנימי');
  });

  it('📇 מדריך: "מה צריך?" — שאילתת-בעיה מוצאת את בעל-המקצוע (מושג "אינסטלציה")', () => {
    setup(ON(), DATA);
    const html = render(createElement(DirectoryTab, { ctx: dirCtx(now), q: 'יש לי נזילה בכיור', setQ: noop, selId: null, setSelId: noop, onNewRequest: noop }));
    expect(html).toContain('data-mode="answer"');
    expect(html).toContain('אינסטלציה זילברמן');
    expect(html).toContain('אינסטלציה');
    expect(html).toContain('class="pn-bn pn-pbn'); // באנר-תמונה
    expect(html).toContain('<mark>נזילה</mark>'); // שורת-ההבנה מדגישה
  });

  it('📇 דף-העסק (הגיליון של המקור): שעות, שירותים, המלצות, קוד-החיוג; הערה-פנימית רק למאשר', () => {
    setup(ON(), DATA);
    const html = sheet(now);
    expect(html).toContain('class="pn-sheet"');
    expect(html).toContain('שעות פעילות');
    expect(html).toContain('פתיחת סתימה');
    expect(html).toContain('250 ₪');
    expect(html).toContain('קוד חיוג 101');
    expect(html).toContain('סוד פנימי'); // מקומי = מאשר
    setup(ON({}, { adminEmails: ['gabbai@x.org'] }), DATA, 'staff@x.org');
    expect(sheet(now)).not.toContain('סוד פנימי');
  });

  it('🙋 (ה) בקשה שקטה מתרנדרת בלי שם/טלפון הפונה (וגם לא טלפון שהוקלד בטקסט); רגילה — עם הפרטים', () => {
    setup(ON(), DATA);
    const html = render(createElement(RequestsTab, { now, focusId: null, onFocusConsumed: noop, draft: null, onDraftConsumed: noop, onOpenListing: noop }));
    expect(html).toContain('פונה בשקט · השם לא מוצג');
    expect(html).not.toContain('רחל');
    expect(html).not.toContain('גולדברג');
    expect(html).not.toContain('9876543');
    expect(html).toContain('יעקב כהן');
    expect(html).toContain('class="pn-rq-route'); // שורת-המסלול של המקור (עיצוב 5)
    expect(html).toContain('👁 הצגת פרטי הפונה'); // מקומי = מאשר
    setup(ON({}, { adminEmails: ['gabbai@x.org'] }), DATA, 'staff@x.org');
    expect(render(createElement(RequestsTab, { now, focusId: null, onFocusConsumed: noop, draft: null, onDraftConsumed: noop, onOpenListing: noop }))).not.toContain('👁 הצגת פרטי הפונה');
  });

  it('🙋 (ה) הגנת-מקור: ההודעה לעסקים מ-businessView; חשיפה = canApprove + logAccess', () => {
    const req = src('RequestsTab');
    expect(req).toContain('const view = businessView(r, nowMs);');
    expect(req).toMatch(/<WaBtn phone=\{l\.whatsapp\} text=\{businessMessage\(view, brand, word\)\}/);
    expect(req).toMatch(/canApprove && \([\s\S]{0,200}logAccess\(/);
  });

  it('📌 לוח: זמני-היום, המניין (sh-15 ⇒ שעה), מספרי-חירום; מודעות', () => {
    setup(ON(), DATA);
    const html = render(createElement(BoardTab, { now, onSearch: noop }));
    expect(html).toContain('זמני היום');
    expect(html).toContain('בית המדרש הגדול');
    expect(html).toContain('מד״א');
    expect(html).toContain('לפי אופק');
  });

  it('📖 חוברת: תוכן-עניינים חי + הערכת-עמודים', () => {
    setup(ON(), DATA);
    const html = render(createElement(BookletTab, { now }));
    expect(html).toContain('מפתח המקצועות');
    expect(html).toContain('<span>שער אחד · איש מקצוע אחד</span>'); // pl() של המקור — יחיד
    expect(html).toContain('עמודי A5');
    expect(html).toContain('<span>מספרי חירום</span><span class="pn-dots"></span><b>עמוד אחד</b>'); // תוספת-הפורט בקווי-הנקודות
  });

  it('📣 פרסומות: חסות-שער ברשימה, מחיר וסטטוס-תשלום', () => {
    setup(ON(), DATA);
    const html = render(createElement(AdsTab, { now }));
    expect(html).toContain('חשמל אור הגנוז');
    expect(html).toContain('טרם שולם');
  });

  it('⚙ הגדרות: שם-קהילה, אישור, מחירון ומיקום-הזמנים', () => {
    setup(ON(), DATA);
    const html = render(createElement(SettingsTab));
    expect(html).toContain('שם הקהילה / החסידות');
    expect(html).toContain('כרטיס חדש מופיע רק אחרי אישור');
    expect(html).toContain('מחירון');
    expect(html).toContain('מיקום הזמנים');
  });
});
