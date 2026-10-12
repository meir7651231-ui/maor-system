/**
 * ratchet — 📒 פרנסה׳לע 5: שלד-המסכים (BUILD-ORDER-PARNASA-2026-10-12, אשכול 5).
 *  (א) חיווט: NAV/VIEWS/VIEW_LOADERS (chunk עצל) ב-App; הניווט מסנן דרך העוזר היחיד moduleEnabledIn.
 *  (ב) מודול כבוי (opt-in — המפתח חסר) ⇒ לא נגיש: אין קישור, כל parnasa.* כבויים, view פתוח קופץ
 *      הביתה; דלוק ⇒ תת-הדגלים בחוזה הרגיל (חסר = פעיל, רק false מכבה).
 *  (ג) כל לשונית מגודרת בתת-הדגל שלה (רינדור-שרת אמיתי של המסך, לא רק סריקה); ⚙ הגדרות — גבאי בלבד.
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
import { clockAt, makeClosureFn, resolveZmanimLoc } from '../zmanimBoard';
import type { PrNow } from '../hooks';
import appSrc from '../../../App.tsx?raw';

const UI_SRC = import.meta.glob('../*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const src = (name: string): string => {
  const hit = Object.entries(UI_SRC).find(([p]) => p.endsWith('/' + name + '.tsx'));
  expect(hit, name + '.tsx קיים').toBeTruthy();
  return hit![1];
};

const SUB_FLAGS = ['parnasa.care', 'parnasa.directory', 'parnasa.requests', 'parnasa.board', 'parnasa.booklet', 'parnasa.phone', 'parnasa.ads', 'parnasa.zmanim', 'parnasa.export'];
const TAB_LABELS: Record<string, string> = {
  'parnasa.care': '🏠 טיפול ואישורים',
  'parnasa.directory': '📇 מדריך',
  'parnasa.requests': '🙋 בקשות',
  'parnasa.board': '📌 לוח קהילה',
  'parnasa.booklet': '📖 חוברת',
  'parnasa.phone': '📞 הקו', // אשכול 6ב — סימולטור, לא קו חי (נעילה מלאה: parnasa-phone.test)
  'parnasa.ads': '📣 פרסומות',
};

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

/* ═══════════════ (ג) לשוניות מגודרות ═══════════════ */

describe('📒 (ג) כל לשונית מגודרת בתת-הדגל שלה (רינדור-שרת)', () => {
  it('הכול דלוק (מקומי = סמכות-מנהל) ⇒ 7 הלשוניות + ⚙ הגדרות', () => {
    setup(ON());
    const html = render(createElement(ParnasaView));
    for (const label of Object.values(TAB_LABELS)) expect(html, label).toContain(label);
    expect(html).toContain('⚙ הגדרות');
  });

  it('תת-דגל false ⇒ הלשונית שלו נעלמת, השאר נשארות', () => {
    for (const [flag, label] of Object.entries(TAB_LABELS)) {
      setup(ON({ [flag]: false }));
      const html = render(createElement(ParnasaView));
      expect(html, flag + ' כבוי ⇒ ' + label + ' נעלם').not.toContain(label);
      for (const [other, l2] of Object.entries(TAB_LABELS)) if (other !== flag) expect(html, flag + ' כבוי ⇒ ' + l2 + ' נשאר').toContain(l2);
    }
  });

  it('⚙ הגדרות — רק לגבאי: עובד/ת בלי parnasa.approve לא רואה; עם הדלקה-פר-עובד — רואה', () => {
    setup(ON({}, { adminEmails: ['gabbai@x.org'] }), {}, 'staff@x.org');
    expect(render(createElement(ParnasaView))).not.toContain('⚙ הגדרות');
    setup(ON({ 'parnasa.approve': true }, { adminEmails: ['gabbai@x.org'] }), {}, 'staff@x.org');
    expect(render(createElement(ParnasaView))).toContain('⚙ הגדרות');
  });

  it('כל הלשוניות כבויות ⇒ מצב-ריק מסביר, לא מסך שבור', () => {
    const allOff = Object.fromEntries(Object.keys(TAB_LABELS).map((k) => [k, false]));
    setup(ON(allOff, { adminEmails: ['gabbai@x.org'] }), {}, 'staff@x.org');
    expect(render(createElement(ParnasaView))).toContain('כבויות באשף');
  });

  it('הגנת-מקור: כל לשונית ב-tabs נושאת featureOn(config, \'parnasa.<x>\') משלה', () => {
    const view = src('ParnasaView');
    for (const flag of Object.keys(TAB_LABELS)) {
      expect(view, flag).toMatch(new RegExp("label: '[^']+', on: featureOn\\(config, '" + flag.replace('.', '\\.') + "'\\)"));
    }
    expect(view).toMatch(/key: 'settings', label: '⚙ הגדרות', on: canApprove/);
  });
});

/* ═══════════════ (ד) מוסכמות-הממשק ═══════════════ */

describe('📒 (ד) מוסכמות-הממשק', () => {
  it('כפתורי-הוספה במוסכמת "➕ הוספת {termOf}" (חוזה ה-e2e)', () => {
    expect(src('DirectoryTab')).toMatch(/➕ הוספת \{termOf\(config, 'entity\.prListing', 'עסק'\)\}/);
    expect(src('RequestsTab')).toMatch(/➕ הוספת \{termOf\(config, 'entity\.prRequest', 'בקשה'\)\}/);
    expect(src('BoardTab')).toMatch(/➕ הוספת \{termOf\(config, 'entity\.prPost', 'מודעה'\)\}/);
    expect(src('AdsTab')).toMatch(/➕ הוספת \{termOf\(config, 'entity\.prAd', 'פרסומת'\)\}/);
  });

  it('רשימות: זיכרון-סינון (useRemembered) + חזרה-למקום מהכרטיס (useListScrollRestore)', () => {
    const remembered = /useRemembered(<[^>]+>)?\('parnasa\./;
    const dir = src('DirectoryTab');
    expect(dir).toMatch(remembered);
    expect(dir).toContain("useListScrollRestore('parnasa.dir', !!sel)");
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
    expect(html).toContain('✓ אישור');
    expect(html).not.toContain('רחל');
  });

  it('📇 מדריך: עיון לפי שער — הכרטיס, קוד-החיוג, פתוח-עכשיו; הערה-פנימית לא בכרטיס', () => {
    setup(ON(), DATA);
    const html = render(createElement(DirectoryTab, { now, q: '', setQ: noop, selId: null, setSelId: noop, onNewRequest: noop }));
    expect(html).toContain('אינסטלציה זילברמן');
    expect(html).toContain('☎ 101');
    expect(html).toContain('פנוי עכשיו');
    expect(html).not.toContain('סוד פנימי');
    expect(html).toContain('מה צריך?');
  });

  it('📇 מדריך: "מה צריך?" — שאילתת-בעיה מוצאת את בעל-המקצוע (מושג "אינסטלציה")', () => {
    setup(ON(), DATA);
    const html = render(createElement(DirectoryTab, { now, q: 'יש לי נזילה בכיור', setQ: noop, selId: null, setSelId: noop, onNewRequest: noop }));
    expect(html).toContain('אינסטלציה זילברמן');
    expect(html).toContain('אינסטלציה');
  });

  it('📇 כרטיס-העסק המלא: שעות, שירותים, המלצות; הערה-פנימית רק למאשר', () => {
    setup(ON(), DATA);
    const html = render(createElement(DirectoryTab, { now, q: '', setQ: noop, selId: 'prl1', setSelId: noop, onNewRequest: noop }));
    expect(html).toContain('שעות פעילות');
    expect(html).toContain('פתיחת סתימה');
    expect(html).toContain('250 ₪');
    expect(html).toContain('סוד פנימי'); // מקומי = מאשר
    setup(ON({}, { adminEmails: ['gabbai@x.org'] }), DATA, 'staff@x.org');
    expect(render(createElement(DirectoryTab, { now, q: '', setQ: noop, selId: 'prl1', setSelId: noop, onNewRequest: noop }))).not.toContain('סוד פנימי');
  });

  it('🙋 (ה) בקשה שקטה מתרנדרת בלי שם/טלפון הפונה (וגם לא טלפון שהוקלד בטקסט); רגילה — עם הפרטים', () => {
    setup(ON(), DATA);
    const html = render(createElement(RequestsTab, { now, focusId: null, onFocusConsumed: noop, draft: null, onDraftConsumed: noop, onOpenListing: noop }));
    expect(html).toContain('פונה בשקט · השם לא מוצג');
    expect(html).not.toContain('רחל');
    expect(html).not.toContain('גולדברג');
    expect(html).not.toContain('9876543');
    expect(html).toContain('יעקב כהן');
    expect(html).toContain('🧭');
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
    expect(html).toContain('אנשי מקצוע');
    expect(html).toContain('עמודי A5');
    expect(html).toContain('בחסות חשמל אור הגנוז');
  });

  it('📣 פרסומות: חסות-שער ברשימה, מחיר וסטטוס-תשלום', () => {
    setup(ON(), DATA);
    const html = render(createElement(AdsTab, { now }));
    expect(html).toContain('חשמל אור הגנוז');
    expect(html).toContain('לא שולם');
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
