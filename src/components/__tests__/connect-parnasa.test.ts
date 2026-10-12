/**
 * ratchet — 📒 פרנסה׳לע 7: חיבורים — פלטת-החיפוש · המדריך המהיר · הסיור · מבט-ההנהלה. כולם מגודרים
 * במודול ה-opt-in (moduleOn — חסר = כבוי), כמו העמודות המבודדות (CONNECT חיבורים 1+5).
 *
 *  (א) מודול כבוי — כל קונפיג אמיתי (public/config.json — הלקוח-החי; public/c/<slug> — maor-hachesed,
 *      הדמו…), ברירת-המחדל וקונפיג ריק: **ביט-זהה** — שער-הפלטה סגור (אף תוצאת-עסק) וקיבוצה זהה; המדריך
 *      והסיור בלי שורה/צעד של פרנסה׳לע (ו-false מפורש = חסר); מבט-ההנהלה — נתוני פרנסה׳לע לא משנים בייט,
 *      גם בלי config (קוראים ישנים/טסטים).
 *  (ב) מודול דלוק — פתיחת-העסק עוברת בתיבה בלי store; שורת-מדריך וצעד-סיור; קבוצת-הנהלה (ספירות, בלי
 *      כסף). תוצאות-העסקים בפלטה — בדפוס tzedaka/shop (inline, נעול-מקור) ובדפדפן (e2e toggle-matrix).
 *  (ג) הגנות-מקור: גידור moduleOn בפלטה (דפוס tzedakaOn/shopOn); מאושרים+ממתינים, שם · מקצוע · ☎ קוד; הפלטה/
 *      המדריך/הסיור/ההנהלה לא מייבאים את המנוע הכבד — paletteLink זעיר בלי ייבוא; המסך צורך את הבקשה.
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { featureOn, moduleOn, normalizeConfig, termOf } from '../../lib/config';
import { DEFAULT_CONFIG, type ModuleKey, type OrgConfig } from '../../types/config';
import { emptyDb, type Db, type PrListing } from '../../types/domain';
import { prOpenBox, requestOpenListing } from '../parnasa/paletteLink';
import { groupPaletteResults, type KeyedCmd } from '../../lib/paletteGroups';
import { GUIDE_SECTIONS, guideSections } from '../../lib/guide';
import { TOUR_STEPS, tourSteps, type TourModule } from '../../lib/tour';
import { managementMetrics } from '../reports/management';
import paletteSrc from '../palette/CommandPalette.tsx?raw';
import paletteLinkSrc from '../parnasa/paletteLink.ts?raw';
import parnasaViewSrc from '../parnasa/ParnasaView.tsx?raw';
import guideSrc from '../../lib/guide.ts?raw';
import tourSrc from '../../lib/tour.ts?raw';
import groupsSrc from '../../lib/paletteGroups.ts?raw';
import mgmtSrc from '../reports/management.tsx?raw';
import guideModalSrc from '../GuideModal.tsx?raw';
import tourOverlaySrc from '../TourOverlay.tsx?raw';

/* ───────────── קונפיגים אמיתיים (כמו שהאפליקציה טוענת — דרך normalizeConfig) ───────────── */

function loadCfg(path: string): OrgConfig {
  const cfg = normalizeConfig(JSON.parse(readFileSync(path, 'utf8')));
  if (!cfg) throw new Error('קונפיג לא-תקין: ' + path);
  return cfg;
}
const REAL: { name: string; cfg: OrgConfig }[] = [
  { name: 'public/config.json (הלקוח-החי)', cfg: loadCfg('public/config.json') },
  ...readdirSync('public/c')
    .filter((slug) => statSync(join('public/c', slug, 'config.json'), { throwIfNoEntry: false })?.isFile())
    .map((slug) => ({ name: `public/c/${slug}/config.json`, cfg: loadCfg(join('public/c', slug, 'config.json')) })),
];
const OFF: { name: string; cfg: OrgConfig }[] = [
  ...REAL,
  { name: 'DEFAULT_CONFIG', cfg: DEFAULT_CONFIG },
  { name: 'קונפיג ריק', cfg: { ...DEFAULT_CONFIG, modules: {}, features: {} } },
];
const on = (cfg: OrgConfig = DEFAULT_CONFIG, features: Record<string, boolean> = {}): OrgConfig => ({
  ...cfg,
  modules: { ...cfg.modules, parnasa: true },
  features: { ...cfg.features, ...features },
});
const explicitOff = (cfg: OrgConfig): OrgConfig => ({ ...cfg, modules: { ...cfg.modules, parnasa: false } });

function L(over: Partial<PrListing>): PrListing {
  return {
    id: 'x', source: 'owner', name: '', title: '', category: 'other', area: '', city: '', phone: '', phone2: '', whatsapp: '',
    hours: [], always: false, hoursNote: '', services: [], languages: ['he'], kashrut: '', emergency: false, desc: '', notes: '',
    status: 'approved', dialCode: '', featuredUntil: '', recs: [],
    createdAt: '2026-10-01T08:00:00.000Z', updatedAt: '2026-10-01T08:00:00.000Z', ...over,
  };
}
const LISTINGS: PrListing[] = [
  L({ id: 'pl1', name: 'אינסטלציה זילברמן', title: 'נזילות וסתימות', category: 'elec', phone: '050-0000101', dialCode: '101' }),
  L({ id: 'pl2', name: 'גינון עדן', title: 'גינון והשקיה', category: 'home', dialCode: '', status: 'pending' }),
  L({ id: 'pl3', name: 'עסק שנדחה', title: 'נדחה', category: 'home', dialCode: '103', status: 'rejected' }),
];
/** מאגר עם נתוני-פרנסה׳לע (עסקים, בקשה, מודעה ממתינה, פרסומת) — ובלעדיהם. */
function dbWith(withParnasa: boolean): Db {
  const db = { ...emptyDb(), families: [{ status: 'active' } as Db['families'][number]] };
  if (!withParnasa) return db;
  return {
    ...db,
    prListings: LISTINGS,
    prRequests: [{ id: 'q1', text: 'מחפש מלמד', category: 'edu', area: '', urgent: false, quiet: false, job: false, requester: { name: 'א', phone: '' }, status: 'open', responses: [], createdAt: '', updatedAt: '' }],
    prPosts: [{ id: 'p1', kind: 'notice', title: 'הודעה', text: '', place: '', phone: '', noticeKind: '', prayers: [], days: [], date: '', time: '', until: '', approved: false, pinned: false, createdAt: '', updatedAt: '' }],
    prAds: [{ id: 'a1', slot: 'booklet', kind: 'half', target: '', advertiser: 'מאפייה', headline: '', body: '', phone: '', from: '', to: '', price: 300, paid: false, paidAt: '', active: true, createdAt: '', updatedAt: '' }],
  };
}
const guideOf = (cfg: OrgConfig) => guideSections((m) => moduleOn(cfg, m), cfg);
const tourOf = (cfg: OrgConfig) => tourSteps((m: TourModule) => moduleOn(cfg, m as ModuleKey), cfg);
/** שער-הפלטה — שיקוף מדויק של הנוסח ב-CommandPalette (נעול-מקור ב-(ג)). */
const paletteGate = (cfg: OrgConfig): boolean => moduleOn(cfg, 'parnasa') && featureOn(cfg, 'parnasa.directory');

/* ═══════════════ (א) מודול כבוי ⇒ ביט-זהה ═══════════════ */

describe('📒 (א) מודול כבוי (opt-in — חסר) ⇒ כל משטח ביט-זהה', () => {
  it('הסורק חי: הקונפיגים האמיתיים נמצאו (שורש, maor-hachesed, demo) ואף אחד לא הדליק את parnasa', () => {
    const names = REAL.map((c) => c.name).join(' | ');
    expect(REAL.length).toBeGreaterThanOrEqual(3);
    expect(names).toContain('public/c/maor-hachesed/config.json');
    expect(names).toContain('public/c/demo/config.json');
    for (const { name, cfg } of OFF) expect(moduleOn(cfg, 'parnasa'), name).toBe(false);
  });

  for (const { name, cfg } of OFF) {
    it(name + ' — פלטה · מדריך · סיור · מבט-הנהלה', () => {
      // פלטה: השער סגור ⇒ הלולאה רצה על [] — אפס תוצאות-עסק גם כשיש עסקים במאגר
      expect(paletteGate(cfg)).toBe(false);
      // מדריך: בלי השורה; false מפורש = חסר (אותו פלט, בייט-בייט)
      const g = guideOf(cfg);
      expect(g.some((s) => s.module === 'parnasa')).toBe(false);
      expect(JSON.stringify(g)).not.toContain('פרנסה');
      expect(JSON.stringify(g)).toBe(JSON.stringify(guideOf(explicitOff(cfg))));
      // מה שנשאר = בדיוק השורות הקיימות של המודולים הדלוקים, בנוסח שלהן
      expect(g.map((s) => s.title)).toEqual(GUIDE_SECTIONS.filter((s) => s.module !== 'parnasa' && (!s.module || moduleOn(cfg, s.module))).map((s) => s.title));
      // סיור: בלי הצעד; false מפורש = חסר
      const t = tourOf(cfg);
      expect(t.some((s) => s.view === 'parnasa' || s.module === 'parnasa')).toBe(false);
      expect(JSON.stringify(t)).not.toContain('פרנסה');
      expect(JSON.stringify(t)).toBe(JSON.stringify(tourOf(explicitOff(cfg))));
      // מבט-הנהלה: נתוני פרנסה׳לע לא משנים בייט
      expect(JSON.stringify(managementMetrics(dbWith(true), cfg))).toBe(JSON.stringify(managementMetrics(dbWith(false), cfg)));
      expect(managementMetrics(dbWith(true), cfg).some((x) => x.title.includes('פרנסה'))).toBe(false);
    });
  }

  it('מבט-הנהלה בלי config (קוראים ישנים/טסטים) — מודול opt-in כבוי, השאר כמו קודם', () => {
    const g = managementMetrics(dbWith(true));
    expect(g.some((x) => x.title.includes('פרנסה'))).toBe(false);
    expect(JSON.stringify(g)).toBe(JSON.stringify(managementMetrics(dbWith(false))));
    for (const t of ['🚚 חלוקה', '🛍 חנות', '🪙 קופות צדקה', '👨‍👩‍👧 משפחות']) expect(g.find((x) => x.title === t), t).toBeTruthy();
  });

  it('קיבוץ-הפלטה ביט-זהה לכל הקידומות הקיימות (קבוצת prl- נוספה אחרונה, לפני הלא-מוכרות)', () => {
    const keys = ['tzc-1', 'shp-1', 'punch-1', 'ev-1', 'doc-1', 'sup-1', 'tch-1', 'crs-1', 'mem-1', 'fam-1', 'enr-1', 'act-1', 'nav-1', 'fam-2'];
    const grouped = groupPaletteResults(keys.map((key): KeyedCmd => ({ key })));
    expect(grouped.map((x) => x.key)).toEqual(['nav-1', 'act-1', 'enr-1', 'fam-1', 'fam-2', 'mem-1', 'crs-1', 'tch-1', 'sup-1', 'doc-1', 'ev-1', 'punch-1', 'tzc-1', 'shp-1']);
    expect(grouped.map((x) => x.section ?? '')).toEqual(['ניווט ופעולות', '', 'שיבוצים', 'משפחות', '', 'בני משפחה', 'חוגים', 'מורים', 'תומכות', 'מסמכים', 'אירועים', 'כרטיסיות', '', '']);
    // עם פריטי-עסק (מודול דלוק): קבוצה משלה אחרי כרטיסיות, לפני הלא-מוכרות; מונח-הארגון בכותרת
    const withPr = groupPaletteResults(['tzc-1', 'prl-a', 'fam-1', 'prl-b'].map((key): KeyedCmd => ({ key })), on(DEFAULT_CONFIG));
    expect(withPr.map((x) => x.key + ':' + (x.section ?? ''))).toEqual(['fam-1:משפחות', 'prl-a:פרנסה׳לע', 'prl-b:', 'tzc-1:']);
    const renamed = groupPaletteResults<KeyedCmd>([{ key: 'prl-a' }], { ...DEFAULT_CONFIG, terms: { 'nav.parnasa': 'מדריך השכונה' } });
    expect(renamed[0].section).toBe('מדריך השכונה');
  });
});

/* ═══════════════ (ב) מודול דלוק ═══════════════ */

describe('📒 (ב) modules.parnasa === true — החיבורים פועלים', () => {
  it('שער-הפלטה: דלוק רק במודול דלוק + מדריך דלוק (התוצאה פותחת את כרטיס-העסק במדריך)', () => {
    expect(paletteGate(on())).toBe(true);
    expect(paletteGate(on(DEFAULT_CONFIG, { 'parnasa.directory': false }))).toBe(false);
    expect(paletteGate(explicitOff(on()))).toBe(false);
  });

  it('"פתח את העסק" — תיבה בלי store: מסך פתוח מקבל מיד (צלצול); בלי מסך — הבקשה נשמרת לעלייה', () => {
    const got: string[] = [];
    try {
      prOpenBox.ring = () => {
        got.push(prOpenBox.id);
        prOpenBox.id = ''; // המסך צורך
      };
      requestOpenListing('pl1');
      expect(got).toEqual(['pl1']);
      expect(prOpenBox.id).toBe('');
      prOpenBox.ring = undefined; // המסך ירד
      requestOpenListing('pl2');
      expect(got).toEqual(['pl1']);
      expect(prOpenBox.id).toBe('pl2'); // ממתינה לעלייה
    } finally {
      prOpenBox.id = '';
      prOpenBox.ring = undefined;
    }
  });

  it('מדריך: השורה בין "חנות" ל"הגדרות"; הכותרת ממונח-הארגון (nav.parnasa), הגוף בלי מונחי-ישות שידלפו', () => {
    const g = guideOf(on());
    const titles = g.map((s) => s.title);
    expect(titles.indexOf('פרנסה׳לע')).toBe(titles.indexOf('הגדרות') - 1);
    const row = g.find((s) => s.module === 'parnasa')!;
    expect(row).toMatchObject({ term: 'nav.parnasa', title: 'פרנסה׳לע' });
    expect(row.text).toBe('"מה צריך?" · לוח קהילה · חוברת עם קוד חיוג.');
    expect(row.text).not.toMatch(/עסק|פרנסה/); // אין מה לתרגם בגוף — אין דליפה כשהארגון שינה שמות
    expect(termOf({ ...on(), terms: { 'nav.parnasa': 'מדריך השכונה' } }, row.term!, row.title)).toBe('מדריך השכונה'); // כך GuideModal מרנדר
  });

  it('סיור: צעד אחרי החנות ולפני ההגדרות; הכיתוב בלי שם-עמודה/מונח-ישות שידלפו', () => {
    const t = tourOf(on());
    const views = t.map((s) => s.view);
    expect(views.indexOf('parnasa')).toBe(views.indexOf('settings') - 1);
    const step = t.find((s) => s.view === 'parnasa')!;
    expect(step).toMatchObject({ module: 'parnasa', caption: '📒 "מה צריך?" — מדריך הקהילה' });
    expect(step.caption).not.toMatch(/עסק|פרנסה/);
    expect(tourSteps(() => true)).toHaveLength(TOUR_STEPS.length);
  });

  it('מבט-הנהלה: קבוצת "📒 פרנסה׳לע" — ספירות בלבד (בלי ₪)', () => {
    const g = managementMetrics(dbWith(true), on()).find((x) => x.title === '📒 פרנסה׳לע')!;
    expect(g.rows).toEqual([
      ['עסקים במדריך', 1],
      ['ממתינים לאישור', 2], // עסק ממתין + מודעה שלא אושרה
      ['בקשות פתוחות', 1],
      ['פרסומות פעילות', 1],
    ]);
    expect(JSON.stringify(g)).not.toContain('₪');
  });
});

/* ═══════════════ (ג) הגנות-מקור ═══════════════ */

const HEAVY = /from '[^']*parnasa\/(lib|zmanimBoard|booklet|phoneLine|phoneSim|transitions|model)'/;

describe('📒 (ג) הגנות-מקור', () => {
  it('הפלטה: גידור moduleOn (דפוס tzedakaOn/shopOn) — מודול כבוי לא מאנדקס כלום; מאושרים+ממתינים; הפעולה פותחת את העסק', () => {
    expect(paletteSrc).toContain("const parnasaOn = moduleOn(config, 'parnasa') && featureOn(config, 'parnasa.directory');");
    expect(paletteSrc).toMatch(/for \(const l of parnasaOn \? db\.prListings : \[\]\) \{\s*if \(l\.status === 'rejected'\) continue;/);
    expect(paletteSrc).toContain("const prWord = termOf(config, 'entity.prListing', 'עסק');");
    expect(paletteSrc).toContain("key: 'prl-' + l.id,");
    expect(paletteSrc).toContain("title: l.name + ' — ' + prWord,");
    expect(paletteSrc).toContain("sub: [l.title, l.dialCode && '☎ ' + l.dialCode].filter(Boolean).join(' · '),");
    expect(paletteSrc).toContain('terms: toTerms([l.name, l.title, l.dialCode, prWord]),');
    expect(paletteSrc).toMatch(/requestOpenListing\(l\.id\);\s*go\('parnasa'\);\s*setPalette\(false\);/);
    expect(paletteSrc).toMatch(/\n {4}parnasaOn,\n/); // בתלויות ה-useMemo
  });

  it('🛡 בנדל: הפלטה/המדריך/הסיור/ההנהלה לא מייבאים את המנוע הכבד; paletteLink זעיר (אפס ייבוא)', () => {
    for (const [name, src] of [['CommandPalette', paletteSrc], ['guide', guideSrc], ['tour', tourSrc], ['paletteGroups', groupsSrc], ['management', mgmtSrc], ['GuideModal', guideModalSrc], ['TourOverlay', tourOverlaySrc]] as const) {
      expect(src, name).not.toMatch(HEAVY);
    }
    expect([...paletteSrc.matchAll(/from '\.\.\/parnasa\/([\w.]+)'/g)].map((m) => m[1])).toEqual(['paletteLink']);
    expect(paletteLinkSrc).not.toMatch(/^import /m); // זעיר: אפס ייבוא — כל בייט כאן נטען אצל כל לקוח
    expect(paletteLinkSrc).not.toMatch(/\bwindow\.|\bdocument\.|useApp|localStorage|sessionStorage/);
  });

  it('המסך צורך את הבקשה פעם אחת (בעלייה + צלצול כשפתוח), ורק כשהמדריך דלוק; מסיר את הצלצול ביציאה', () => {
    expect(parnasaViewSrc).toContain("import { prOpenBox } from './paletteLink';");
    expect(parnasaViewSrc).toMatch(/const id = prOpenBox\.id;\s*prOpenBox\.id = '';\s*if \(!id \|\| !directoryOn\) return;\s*setSelListing\(id\);\s*setTab\('directory'\);/);
    expect(parnasaViewSrc).toMatch(/open\(\);\s*prOpenBox\.ring = open;\s*return \(\) => \{\s*if \(prOpenBox\.ring === open\) prOpenBox\.ring = undefined;/);
  });

  it('מדריך/סיור/הנהלה מגודרים במודול; ההנהלה opt-in-מודעת גם בלי config', () => {
    expect(GUIDE_SECTIONS.find((s) => s.module === 'parnasa')).toMatchObject({ term: 'nav.parnasa' });
    expect(TOUR_STEPS.find((s) => s.view === 'parnasa')).toMatchObject({ module: 'parnasa' });
    expect(mgmtSrc).toContain("const mod = (m: ModuleKey) => (config ? moduleOn(config, m) : moduleEnabledIn(undefined, m));");
    expect(mgmtSrc).toContain("if (mod('parnasa')) {");
    for (const kw of ['receiptSeq', 'donationSeq', 'payLink', 'price']) expect(mgmtSrc.slice(mgmtSrc.indexOf("if (mod('parnasa'))"), mgmtSrc.indexOf("if (mod('parnasa'))") + 1200), kw).not.toContain(kw);
  });
});
