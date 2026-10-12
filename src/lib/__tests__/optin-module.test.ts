/**
 * 🔒 ratchet — מודול opt-in: "חסר = כבוי" (12.10.2026, פרנסה׳לע — BUILD-ORDER-PARNASA הכרעה 1).
 *
 * הבעיה: חוזה-המודולים "חסר = פעיל" + מפת-מודולים ריקה ({}) אצל הלקוח-החי (שורש +
 * maor-hachesed), בדמו הציבורי ובחבילת-החסד ⇒ כל ModuleKey חדש היה נדלק אצלם בשקט
 * (לקח #16 — "מוסך קיבל עמודת קופות צדקה"). ובנוסף ~15 משטחים קראו את מפת-המודולים
 * גולמית (`!== false`) ועקפו את moduleOn — ניווט, חימום-chunks, הקפצה-הביתה, אשף,
 * לוח-בקרה, תקרת-המנהל, תמחור, דף-מסירה, מסך-הבית, לוח-השנה.
 *
 * הפתרון: OPT_IN_MODULES (חסר = כבוי) + עוזר יחיד moduleEnabledIn ב-types/config; moduleOn
 * מאציל אליו, וכל קריאה ממפת-המודולים עוברת דרכו. הנעילה כאן:
 *  (א) כל קונפיג אמיתי ב-public/ (+ קונפיג ריק): parnasa כבוי — moduleOn · ניווט · featureOn('parnasa.*')
 *      · תקרת-המנהל · אשף · תמחור · דף-מסירה · הקפצה-הביתה.
 *  (ב) modules.parnasa === true (ורק הוא) — דלוק בכל המשטחים.
 *  (ג) 9 המודולים הקיימים — "חסר = פעיל" ביט-זהה.
 *  (ד) סריקת-מקור: אין קריאה גולמית ממפת-המודולים מחוץ לקובץ-העוזר.
 *
 * בדיקת-מוטציה (בוצעה 12.10): moduleEnabledIn ⇒ `v !== false` לכל מפתח (חסר = פעיל) ⇒ (א)+(ב)
 * אדומים; החזרת הקריאה הגולמית לניווט ב-App ⇒ (ד) אדום; שחזור ⇒ ירוק.
 */
import { describe, expect, it, vi } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  DEFAULT_CONFIG,
  OPT_IN_MODULES,
  isOptInModule,
  moduleEnabledIn,
  moduleRestrictedIn,
  type ModuleKey,
  type OrgConfig,
} from '../../types/config';
import { FEATURES, TERM_DEFS } from '../../types/features';
import { canGrantedAction, featureOn, moduleOn, normalizeConfig } from '../config';
import { computeQuote, DEFAULT_PRICES } from '../pricing';
import { VERTICAL_PACKS, applyVerticalPack } from '../verticalPacks';
import {
  ALL_MODULES,
  MODULE_LABELS,
  allOffConfig,
  effectiveConfigFor,
  isGrantableFeature,
  orgEnabledFeatures,
  orgEnabledModules,
} from '../../components/platform/lib';
import { WIZARD_SECTIONS, featureEffectiveOn } from '../../components/builder/sections';
import { diffCount, wizardDiff } from '../../components/builder/wizardLib';
import { buildHandoffHtml, removedFeatures } from '../../components/builder/handoff';
import { useApp } from '../../store/useApp';
import type { OrgCloudDoc } from '../cloudConfig';
import appSrc from '../../App.tsx?raw';
import stubSrc from '../../components/parnasa/ParnasaView.tsx?raw';
import configLibSrc from '../config.ts?raw';

/* ───────────── קונפיגים אמיתיים (כמו שהאפליקציה טוענת — דרך normalizeConfig) ───────────── */

function loadCfg(path: string): OrgConfig {
  const cfg = normalizeConfig(JSON.parse(readFileSync(path, 'utf8')));
  if (!cfg) throw new Error('קונפיג לא-תקין: ' + path);
  return cfg;
}

const REAL_CONFIGS: { name: string; cfg: OrgConfig }[] = [
  { name: 'public/config.json (שורש — הלקוח-החי)', cfg: loadCfg('public/config.json') },
  ...readdirSync('public/c')
    .filter((slug) => statSync(join('public/c', slug, 'config.json'), { throwIfNoEntry: false })?.isFile())
    .map((slug) => ({ name: `public/c/${slug}/config.json`, cfg: loadCfg(join('public/c', slug, 'config.json')) })),
];

const CONFIGS: { name: string; cfg: OrgConfig }[] = [
  ...REAL_CONFIGS,
  { name: 'DEFAULT_CONFIG', cfg: DEFAULT_CONFIG },
  { name: 'קונפיג ריק (modules:{})', cfg: { ...DEFAULT_CONFIG, modules: {}, features: {} } },
];

const enable = (cfg: OrgConfig): OrgConfig => ({ ...cfg, modules: { ...cfg.modules, parnasa: true } });

const PARNASA_FEATURES = FEATURES.filter((f) => f.module === 'parnasa');
const EXISTING_MODULES = ALL_MODULES.filter((m) => !isOptInModule(m));

/* ───────────── הניווט של App — פרדיקט נעול-מקור ───────────── */

const navBlock = appSrc.slice(appSrc.indexOf('const NAV:'), appSrc.indexOf('const VIEWS:'));
const NAV_VIEWS = [...navBlock.matchAll(/\{ view: '(\w+)'/g)].map((m) => m[1]);
/** שיקוף מדויק של סינון-הניווט ב-App (בית תמיד; השאר דרך moduleEnabledIn) — הנוסח נעול למטה. */
const visibleNav = (cfg: OrgConfig): string[] =>
  NAV_VIEWS.filter((v) => v !== 'settings' && v !== 'reenroll' && (v === 'home' || moduleEnabledIn(cfg.modules, v)));

const quoteKeys = (cfg: OrgConfig): string[] => {
  const q = computeQuote(cfg, 'small', DEFAULT_PRICES, (m) => m);
  return [...q.lines, ...q.included].map((l) => l.key);
};

describe('🔒 מודול opt-in — העוזר היחיד moduleEnabledIn', () => {
  it('OPT_IN_MODULES נעול: רק parnasa (הוספה = הכרעת-בעלים מפורשת)', () => {
    expect([...OPT_IN_MODULES]).toEqual(['parnasa']);
    expect(isOptInModule('parnasa')).toBe(true);
    for (const m of EXISTING_MODULES) expect(isOptInModule(m), m).toBe(false);
  });

  it('סמנטיקה: opt-in = רק true מפורש; ערך עוין ("true"/1) = כבוי', () => {
    expect(moduleEnabledIn({}, 'parnasa')).toBe(false);
    expect(moduleEnabledIn(undefined, 'parnasa')).toBe(false);
    expect(moduleEnabledIn(null, 'parnasa')).toBe(false);
    expect(moduleEnabledIn({ parnasa: false }, 'parnasa')).toBe(false);
    expect(moduleEnabledIn({ parnasa: true }, 'parnasa')).toBe(true);
    expect(moduleEnabledIn({ parnasa: 'true' } as unknown as Record<string, boolean>, 'parnasa')).toBe(false);
    expect(moduleEnabledIn({ parnasa: 1 } as unknown as Record<string, boolean>, 'parnasa')).toBe(false);
  });

  it('כרטיס-עובד (moduleRestrictedIn) = הגבלה-בלבד: רק false מגביל, גם במודול opt-in', () => {
    expect(moduleRestrictedIn({}, 'parnasa')).toBe(false);
    expect(moduleRestrictedIn(undefined, 'parnasa')).toBe(false);
    expect(moduleRestrictedIn({ parnasa: true }, 'parnasa')).toBe(false);
    expect(moduleRestrictedIn({ parnasa: false }, 'parnasa')).toBe(true);
    expect(moduleRestrictedIn({ shop: false }, 'shop')).toBe(true);
  });
});

describe('(א) כל קונפיג אמיתי + קונפיג ריק — parnasa כבוי בכל המשטחים', () => {
  it('הסורק חי: נמצאו הקונפיגים האמיתיים (שורש, maor-hachesed, demo)', () => {
    const names = REAL_CONFIGS.map((c) => c.name).join(' | ');
    expect(REAL_CONFIGS.length).toBeGreaterThanOrEqual(3);
    expect(names).toContain('public/c/maor-hachesed/config.json');
    expect(names).toContain('public/c/demo/config.json');
    expect(PARNASA_FEATURES.length).toBeGreaterThanOrEqual(10);
    expect(NAV_VIEWS).toContain('parnasa');
  });

  for (const { name, cfg } of CONFIGS) {
    it(name, () => {
      expect(cfg.modules.parnasa, name + ' — הקונפיג עצמו לא נגע ב-parnasa').toBeUndefined();
      expect(moduleOn(cfg, 'parnasa')).toBe(false);
      expect(visibleNav(cfg)).not.toContain('parnasa');
      for (const f of PARNASA_FEATURES) {
        expect(featureOn(cfg, f.key), f.key).toBe(false);
        expect(featureEffectiveOn(cfg, f), 'אשף: ' + f.key).toBe(false);
      }
      expect(orgEnabledModules(cfg)).not.toContain('parnasa');
      expect(orgEnabledFeatures(cfg, FEATURES).filter((f) => f.module === 'parnasa')).toEqual([]);
      expect(quoteKeys(cfg)).not.toContain('parnasa');
      const html = buildHandoffHtml(cfg, 'https://example.org/', 'מטמיע');
      expect(html).not.toContain('פרנסה');
      expect(removedFeatures(cfg).filter((f) => f.module === 'parnasa')).toEqual([]);
      expect(wizardDiff(cfg, FEATURES, TERM_DEFS).modulesOn).toEqual([]);
    });
  }

  it('כל חבילת-ורטיקל משאירה את parnasa כבוי (גם מעל קונפיג שהדליק אותו — החלה = החלפה)', () => {
    for (const p of VERTICAL_PACKS) {
      expect(p.modules.parnasa, p.id).toBeUndefined();
      expect(moduleOn(applyVerticalPack(enable(DEFAULT_CONFIG), p.id), 'parnasa'), p.id).toBe(false);
    }
  });

  it('קונפיג-הלידה all-off: parnasa false מפורש וכבוי', () => {
    const c = allOffConfig('new-org', 'ארגון חדש');
    expect(c.modules.parnasa).toBe(false);
    expect(moduleOn(c, 'parnasa')).toBe(false);
    // false הוא ברירת-המחדל של opt-in ⇒ לא נספר כ"שינוי" בדוח-השינויים של האשף
    expect(wizardDiff(c, FEATURES, TERM_DEFS).modulesOff).not.toContain('parnasa');
  });

  it('הקפצה-הביתה (store): מסך parnasa פתוח + קונפיג בלי הדלקה ⇒ הביתה', () => {
    vi.stubGlobal('document', { documentElement: { dataset: {}, style: { setProperty() {}, removeProperty() {} } } });
    try {
      useApp.setState({ view: 'parnasa' });
      useApp.getState().setConfig(enable(DEFAULT_CONFIG));
      expect(useApp.getState().view).toBe('parnasa');
      useApp.getState().setConfig({ ...DEFAULT_CONFIG, modules: {} });
      expect(useApp.getState().view).toBe('home');
      // מודול קיים — ביט-זהה: חסר = נשאר, false = הביתה
      useApp.setState({ view: 'tzedaka' });
      useApp.getState().setConfig({ ...DEFAULT_CONFIG, modules: {} });
      expect(useApp.getState().view).toBe('tzedaka');
      useApp.getState().setConfig({ ...DEFAULT_CONFIG, modules: { tzedaka: false } });
      expect(useApp.getState().view).toBe('home');
    } finally {
      useApp.setState({ view: 'home', config: DEFAULT_CONFIG });
      vi.unstubAllGlobals();
    }
  });
});

describe('(ב) modules.parnasa === true — דלוק בכל המשטחים', () => {
  for (const { name, cfg: base } of CONFIGS) {
    it(name + ' + parnasa:true', () => {
      const cfg = enable(base);
      expect(moduleOn(cfg, 'parnasa')).toBe(true);
      expect(visibleNav(cfg)).toContain('parnasa');
      for (const f of PARNASA_FEATURES) {
        expect(featureOn(cfg, f.key), f.key).toBe(true); // בתוך מודול דלוק — החוזה הרגיל (חסר = פעיל)
        expect(featureEffectiveOn(cfg, f), 'אשף: ' + f.key).toBe(true);
      }
      expect(orgEnabledModules(cfg)).toContain('parnasa');
      expect(orgEnabledFeatures(cfg, FEATURES).filter((f) => f.module === 'parnasa')).toHaveLength(PARNASA_FEATURES.length);
      expect(quoteKeys(cfg)).toContain('parnasa');
      expect(buildHandoffHtml(cfg, 'https://example.org/', 'מטמיע')).toContain('✅ פרנסה׳לע');
      expect(wizardDiff(cfg, FEATURES, TERM_DEFS).modulesOn).toEqual(['parnasa']);
    });
  }

  it('תת-דגל כבוי בתוך מודול דלוק — החוזה הרגיל + שרשור-הקידומת', () => {
    const cfg = { ...enable(DEFAULT_CONFIG), features: { 'parnasa.ads': false } };
    expect(featureOn(cfg, 'parnasa.ads')).toBe(false);
    expect(featureOn(cfg, 'parnasa.board')).toBe(true);
    // מודול דלוק ⇒ דגליו בסמנטיקת-המסירה הרגילה: רק הכבוי-במפורש "הוסר"
    expect(removedFeatures(cfg).filter((f) => f.module === 'parnasa').map((f) => f.key)).toEqual(['parnasa.ads']);
    // כיבוי-מפורש של המודול גובר על דגל true
    const off = { ...DEFAULT_CONFIG, modules: { parnasa: false }, features: { 'parnasa.board': true } };
    expect(featureOn(off, 'parnasa.board')).toBe(false);
  });

  it('מתג האשף/לוח-הבקרה: כבוי ⇒ כותב true מפורש; דלוק ⇒ false', () => {
    expect(!moduleEnabledIn({}, 'parnasa')).toBe(true); // ההדלקה הראשונה כותבת true (מחיקה הייתה משאירה כבוי)
    expect(!moduleEnabledIn({ parnasa: true }, 'parnasa')).toBe(false);
    expect(diffCount(wizardDiff(enable(DEFAULT_CONFIG), FEATURES, TERM_DEFS))).toBe(1);
  });

  it('כרטיס-עובד: מגביל בלבד — לא מדליק מודול שהארגון לא הדליק', () => {
    const org = { manager: 'boss@x.org', members: ['emp@x.org'], memberConfigs: {} } as OrgCloudDoc;
    const restrict = { ...org, memberConfigs: { 'emp@x.org': { modules: { parnasa: false } } } } as OrgCloudDoc;
    const grantOn = { ...org, memberConfigs: { 'emp@x.org': { modules: { parnasa: true } } } } as OrgCloudDoc;
    expect(moduleOn(effectiveConfigFor('emp@x.org', restrict, enable(DEFAULT_CONFIG)), 'parnasa')).toBe(false);
    expect(moduleOn(effectiveConfigFor('emp@x.org', org, enable(DEFAULT_CONFIG)), 'parnasa')).toBe(true);
    expect(moduleOn(effectiveConfigFor('emp@x.org', grantOn, { ...DEFAULT_CONFIG, modules: {} }), 'parnasa')).toBe(false);
  });

  it('🔓 אישורי-גבאי ומחיקות: grantable — מנהל תמיד, עובד/ת רק בהדלקה; מודול כבוי ⇒ אף אחד', () => {
    expect(isGrantableFeature('parnasa.approve')).toBe(true);
    expect(isGrantableFeature('parnasa.delete')).toBe(true);
    // ארגון-פלטפורמה בלי adminEmails: סמכות = מנהל/מייל-על בלבד
    const platform: OrgConfig = { ...enable(DEFAULT_CONFIG), slug: 'kehila-x', cloudRoot: false, firebase: { apiKey: 'k', authDomain: 'a', projectId: 'p', appId: 'x' } };
    const gate = (cfg: OrgConfig, email: string, mgr: boolean, k: string) => featureOn(cfg, k) && canGrantedAction(cfg, email, mgr, k);
    for (const k of ['parnasa.approve', 'parnasa.delete']) {
      expect(gate(platform, 'boss@x.org', true, k), 'מנהל ' + k).toBe(true);
      expect(gate(platform, 'emp@x.org', false, k), 'עובד/ת בלי הדלקה ' + k).toBe(false);
      const org = { manager: 'boss@x.org', members: ['emp@x.org'], memberConfigs: { 'emp@x.org': { features: { [k]: true } } } } as OrgCloudDoc;
      expect(gate(effectiveConfigFor('emp@x.org', org, platform), 'emp@x.org', false, k), 'עובד/ת עם הדלקה ' + k).toBe(true);
      // המודול כבוי (חסר) ⇒ השער כבוי גם למנהל
      expect(gate({ ...platform, modules: {} }, 'boss@x.org', true, k), 'מודול כבוי ' + k).toBe(false);
    }
  });
});

describe('(ג) 9 המודולים הקיימים — "חסר = פעיל" ביט-זהה', () => {
  it('9 מודולים רגילים: חסר=דלוק · false=כבוי · true=דלוק', () => {
    expect(EXISTING_MODULES).toEqual(['families', 'courses', 'calendar', 'diary', 'supporters', 'reports', 'tzedaka', 'shop', 'shop7']);
    for (const m of EXISTING_MODULES) {
      expect(moduleEnabledIn({}, m), m).toBe(true);
      expect(moduleEnabledIn(undefined, m), m).toBe(true);
      expect(moduleEnabledIn({ [m]: false }, m), m).toBe(false);
      expect(moduleEnabledIn({ [m]: true }, m), m).toBe(true);
      expect(moduleOn({ ...DEFAULT_CONFIG, modules: {} }, m as ModuleKey), m).toBe(true);
      expect(moduleOn({ ...DEFAULT_CONFIG, modules: { [m]: false } }, m as ModuleKey), m).toBe(false);
    }
  });

  it('בכל קונפיג אמיתי: 9 המודולים דלוקים, הניווט/התקרה/ההצעה זהים להיום', () => {
    for (const { name, cfg } of REAL_CONFIGS) {
      for (const m of EXISTING_MODULES) expect(moduleOn(cfg, m as ModuleKey), name + ' ' + m).toBe(true);
      expect(orgEnabledModules(cfg), name).toEqual(EXISTING_MODULES);
      expect(visibleNav(cfg), name).toEqual(['home', 'families', 'courses', 'calendar', 'diary', 'supporters', 'tzedaka', 'shop', 'shop7', 'reports']);
      expect(quoteKeys(cfg).sort(), name).toEqual([...EXISTING_MODULES].sort());
    }
  });

  it('דוח-השינויים של האשף: false במודול רגיל נשאר "שינוי" (ביט-זהה)', () => {
    const d = wizardDiff({ ...DEFAULT_CONFIG, modules: { shop: false } }, FEATURES, TERM_DEFS);
    expect(d.modulesOff).toEqual(['shop']);
    expect(d.modulesOn).toEqual([]);
    expect(diffCount(d)).toBe(1);
  });
});

describe('(ד) 🛡 סריקת-מקור — אין קריאה גולמית ממפת-המודולים מחוץ לקובץ-העוזר', () => {
  /** קובץ-העוזר — המקום היחיד שרשאי לפרש את מפת-המודולים ישירות. */
  const HELPER_FILE = 'src/types/config.ts';
  /**
   * מפות שאינן מפת-הפעלה: ‏PriceTable.modules = **מחירים** (מספרים) פר-מודול, לא דגל פעיל/כבוי.
   * מותרות רק במקבלים האלה ובקבצים האלה.
   */
  const PRICE_MAP_RECEIVERS: Record<string, readonly string[]> = {
    'src/lib/pricing.ts': ['base', 'DEFAULT_PRICES', 'prices'],
    'src/components/builder/BuilderWizard.tsx': ['prices'],
  };
  /** (1) קריאת-מקבל: config.modules[x] · cfg.modules?.[x] · config.modules.courses (גם בלי השוואה). */
  const RECEIVER_READ = /([A-Za-z_$][\w$]*)\s*\.modules\s*(?:\?\.)?\s*(?:\[|\.(?=[A-Za-z_$]))/g;
  /** (2) כינוי מקומי מושווה לבוליאני: modules[m] !== false · mods[modKey] !== false. */
  const ALIAS_COMPARE = /\b(?:mods|modules)\s*(?:\?\.)?\s*\[[^\]\n]+\]\s*[!=]==?\s*(?:true|false)\b/g;
  /** (3) המרה ואז אינדקס: (eff.modules as Record<…>)?.[v]. */
  const CAST_INDEX = /\.modules\s+as\s+[^;\n]*?\)\s*(?:\?\.)?\s*\[/g;

  function offendersIn(rel: string, src: string): string[] {
    const out: string[] = [];
    for (const m of src.matchAll(RECEIVER_READ)) {
      if (PRICE_MAP_RECEIVERS[rel]?.includes(m[1])) continue;
      out.push(rel + ' ⇒ ' + m[0]);
    }
    for (const re of [ALIAS_COMPARE, CAST_INDEX]) for (const m of src.matchAll(re)) out.push(rel + ' ⇒ ' + m[0]);
    return out;
  }

  function walk(dir: string, acc: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
      if (name === '__tests__' || name === 'node_modules') continue;
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p, acc);
      else if (/\.(ts|tsx)$/.test(name) && !/\.test\./.test(name)) acc.push(p.replace(/\\/g, '/'));
    }
    return acc;
  }

  it('הסורק חי: תופס את כל צורות-הקריאה הגולמית ולא את הצורות המותרות', () => {
    const bad = [
      'config.modules[n.view] !== false',
      'cfg.modules?.[m] === false',
      'config.modules.supporters !== false',
      'if (config.modules.parnasa) go()',
      'const on = (m) => modules[m] !== false;',
      'if (mods[modKey] !== false) warm()',
      '(eff.modules as Record<string, boolean | undefined>)?.[v] === false',
      'prices.modules[m] !== false',
    ];
    for (const s of bad) expect(offendersIn('src/x.ts', s), s).not.toEqual([]);
    const good = [
      'moduleEnabledIn(config.modules, n.view)',
      '{ ...cfg.modules, [m]: !moduleEnabledIn(cfg.modules, m) }',
      'Object.entries(cfg.modules ?? {})',
      'const mods = useApp.getState().config.modules as Partial<Record<string, boolean>>;',
      'for (const m of ALL_MODULES) modules[m] = false;',
      'moduleRestrictedIn(ov.modules, m)',
    ];
    for (const s of good) expect(offendersIn('src/x.ts', s), s).toEqual([]);
    // מפת-מחירים מותרת רק במקבל ובקובץ המוצהרים
    expect(offendersIn('src/lib/pricing.ts', 'num(base.modules?.[m], DEFAULT_PRICES.modules[m] ?? 0)')).toEqual([]);
    expect(offendersIn('src/lib/pricing.ts', 'cfg.modules?.[m] !== false')).not.toEqual([]);
  });

  it('אפס קריאות גולמיות בכל src/ (מלבד קובץ-העוזר)', () => {
    const files = walk('src');
    expect(files.length).toBeGreaterThan(300);
    expect(files).toContain(HELPER_FILE);
    const offenders = files
      .filter((f) => f !== HELPER_FILE)
      .flatMap((f) => offendersIn(f, readFileSync(f, 'utf8')));
    expect(offenders, 'קריאה גולמית ממפת-המודולים — העבירו דרך moduleEnabledIn (types/config)').toEqual([]);
  });

  it('כל אתר שנותב משתמש בעוזר בפועל (לא רק "לא-גולמי")', () => {
    const MUST: Record<string, number> = {
      'src/lib/config.ts': 1, // moduleOn ⇒ שרשור featureOn
      'src/App.tsx': 2, // ניווט + חימום-ב-idle
      'src/store/useApp.ts': 2, // הקפצה-הביתה (קונפיג-חי + setConfig)
      'src/components/builder/BuilderWizard.tsx': 3, // טוגל · מצב-המקטע · "כלול" לקבלות
      'src/components/builder/sections.ts': 1, // featureEffectiveOn
      'src/components/builder/wizardLib.ts': 1, // דוח-השינויים
      'src/components/builder/handoff.ts': 2, // "מה קיבלתם" + "מה הוסר"
      'src/components/platform/PlatformPanel.tsx': 2, // צ'יפ + טוגל
      'src/components/platform/lib.ts': 1, // orgEnabledModules (תקרת-המנהל)
      'src/lib/pricing.ts': 1, // computeQuote
      'src/components/home/homeData.ts': 3, // דורש-טיפול · תקציר · קרוסלה
      'src/components/calendar/calLib.ts': 1, // ייצוא-מפגשים
    };
    for (const [file, n] of Object.entries(MUST)) {
      const src = readFileSync(file, 'utf8');
      expect((src.match(/moduleEnabledIn\(/g) ?? []).length, file).toBeGreaterThanOrEqual(n);
    }
    // כרטיס-העובד — סמנטיקת-הגבלה דרך העוזר הנפרד
    const mgr = readFileSync('src/components/platform/ManagerPanel.tsx', 'utf8');
    expect((mgr.match(/moduleRestrictedIn\(/g) ?? []).length).toBeGreaterThanOrEqual(2);
    // moduleOn מאציל לעוזר
    expect(configLibSrc).toMatch(/export function moduleOn\(cfg: OrgConfig, m: ModuleKey\): boolean \{\s*return moduleEnabledIn\(cfg\.modules, m\);/);
    // ניווט App: בית תמיד; השאר דרך העוזר (visibleNav למעלה משקף את הנוסח הזה)
    expect(appSrc).toContain("(n.view === 'home' || moduleEnabledIn(config.modules, n.view))");
    expect(appSrc).toContain('moduleEnabledIn(mods, modKey)) void VIEW_LOADERS[k]()');
  });
});

describe('📒 שרשרת-הרישום של parnasa (אשכול 0)', () => {
  it('ModuleKey/ALL_MODULES/MODULE_LABELS/NAV_MODULE_KEYS', () => {
    expect(ALL_MODULES).toContain('parnasa');
    expect(MODULE_LABELS.parnasa).toBe('פרנסה׳לע');
    // NAV_MODULE_KEYS — כיבוי/אי-הדלקה של המודול משרשר לכל parnasa.* (נבדק התנהגותית ב-(א)/(ב))
    expect(configLibSrc).toMatch(/const NAV_MODULE_KEYS[\s\S]*?'parnasa',\s*\];/);
  });

  it('FEATURES: תת-דגלים בחוזה הרגיל (לא optIn) + 2 פעולות grantable 🔓', () => {
    expect(PARNASA_FEATURES.map((f) => f.key).sort()).toEqual(
      ['parnasa.ads', 'parnasa.approve', 'parnasa.board', 'parnasa.booklet', 'parnasa.care', 'parnasa.delete', 'parnasa.directory', 'parnasa.export', 'parnasa.requests', 'parnasa.zmanim'],
    );
    for (const f of PARNASA_FEATURES) expect(f.optIn, f.key + ' — המודול הוא ה-opt-in, לא הדגל').toBeUndefined();
    for (const k of ['parnasa.approve', 'parnasa.delete']) expect(FEATURES.find((f) => f.key === k)!.label, k).toContain('🔓');
  });

  it('TERM_DEFS + מקטע-אשף (מונחים חשופים לשינוי-שם)', () => {
    const keys = ['nav.parnasa', 'entity.prListing', 'entity.prListings', 'entity.prRequest', 'entity.prPost', 'entity.prAd', 'entity.prGabbai'];
    for (const k of keys) expect(TERM_DEFS.some((t) => t.key === k), k).toBe(true);
    expect(TERM_DEFS.find((t) => t.key === 'nav.parnasa')!.fallback).toBe('פרנסה׳לע');
    const sec = WIZARD_SECTIONS.find((s) => s.id === 'parnasa');
    expect(sec?.module).toBe('parnasa');
    expect(sec?.emoji).toBe('📒');
    expect(sec?.termKeys).toEqual(keys);
  });

  it('App: VIEW_LOADERS (chunk עצל) · lazy · NAV · VIEWS · המסך (אשכול 5: הלשוניות האמיתיות במקום ה-stub)', () => {
    expect(appSrc).toContain("parnasa: () => import('./components/parnasa/ParnasaView'),");
    expect(appSrc).toContain('const ParnasaView = lazy(async () => ({ default: (await VIEW_LOADERS.parnasa()).ParnasaView }));');
    expect(appSrc).toContain("{ view: 'parnasa', icon: '📒', label: 'פרנסה׳לע' }");
    expect(appSrc).toContain('parnasa: ParnasaView,');
    expect(stubSrc).toContain('export function ParnasaView()');
    // 12.10 אשכול 5 (שינוי-נעילה מכוון): ה-stub "המודול בבנייה" הוחלף בצ'יפ-לשוניות מגודרות-תת-דגל
    // — הנעילה המלאה ב-components/parnasa/__tests__/parnasa-shell.test.ts
    expect(stubSrc).not.toContain('המודול בבנייה');
    expect(stubSrc).toContain("featureOn(config, 'parnasa.directory')");
    expect(stubSrc).toContain("termOf(config, 'nav.parnasa', 'פרנסה׳לע')");
  });
});
