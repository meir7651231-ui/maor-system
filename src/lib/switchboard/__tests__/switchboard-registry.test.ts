/**
 * ratchet — 🔌 המרכזייה 1: הרישום והחוזה (BUILD-ORDER-SWITCHBOARD-2026-10-13).
 *
 * ננעל:
 *  (א) הקטלוג: שורה אחת לכל כלי, 6 יכולות, תוויות עבריות; מזהי-השורה = מזהי-הספק (שני הכיוונים).
 *  (ב) זמינות דרך העוזרים הקיימים: מודול כבוי ⇒ היכולת חסרה ו-ask ⇒ 'off'; תת-דגל כבוי ⇒ חסרה; "true" כמחרוזת ⇒ כבוי
 *      (opt-in); דגל-הכלי false ⇒ גם יכולת בלי תת-דגל שותקת.
 *  (ג) ask לעולם לא זורק: unknown · off · loading · error (ריצה שזורקת · ctx פגום); התקנה רק למודול-הבעלים.
 *  (ד) טעינה עצלה: רק מודולים דלוקים, רק מה שנחוץ, אידמפוטנטית, מודיעה למנויים.
 *  (ה) הגנות-מקור: הספקים והליבה טהורים (בלי Date.now/store/DOM), מבודדים (בלי כסף/קבלות/לוח-ראשי/חדרי-חוגים/בקשות),
 *      קוראים רק את מה שהצהירו; הבנדל-הראשי לא מייבא את המרכזייה, והספקים נטענים רק ב-import() של הרישום.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, type OrgConfig } from '../../../types/config';
import {
  abilityInfo,
  ask,
  installProvider,
  isAvailable,
  listAbilities,
  loadProviders,
  providerLoaded,
  readsFor,
  REGISTRY,
  resetSwitchboard,
  subscribeSwitchboard,
  switchboardVersion,
  type AbilityId,
} from '../registry';
import { abilities as hostingAbilities } from '../../../components/hosting/abilities';
import { abilities as parnasaAbilities, FIND_SURE_CONCEPT, proWaIntro } from '../../../components/parnasa/abilities';
import { abilities as calendarAbilities } from '../../../components/calendar/abilities';
// 13.10 מיזוג עם העיצוב המקורי: ListingCard הוחלף ב-BizSheet (סקין-המקור) — הנוסח נעול מול מקור-הכרטיס החדש
import bizSheetSrc from '../../../components/parnasa/BizSheet.tsx?raw';
import { cfgWith, fixtureDb, NOW_MS } from './fixture';
import phoneLineSrc from '../../../components/parnasa/phoneLine.ts?raw';
import appSrc from '../../../App.tsx?raw';

const ALL_IDS = ['hosting.today', 'hosting.availability', 'parnasa.findPro', 'parnasa.shabbat', 'parnasa.minyanim', 'parnasa.emergency'];
// ENGINEBOX-SOCKETS (13.10): ספק-ליבה שקט (calendar.dayInfo — מודול-הלוח דלוק-כברירת-מחדל) נבדק בנפרד ב-calendar-ability.test;
// כאן — היכולות של שני הכלים (opt-in), כמו שננעלו.
const ids = (cfg: OrgConfig): string[] => listAbilities(cfg).map((a) => a.id).filter((id) => !id.startsWith('calendar.'));
const ctxOf = (config: OrgConfig) => ({ db: fixtureDb(), config, nowMs: NOW_MS });

afterEach(() => {
  resetSwitchboard();
});

/* ═══════════════ (א) הקטלוג ═══════════════ */

describe('🔌 (א) הקטלוג — שורה לכל כלי', () => {
  it('שני כלים, שש יכולות, בסדר-הרישום; לכל יכולת מודול ותווית עברית', () => {
    expect(REGISTRY.map((e) => e.module)).toEqual(['hosting', 'parnasa', 'calendar']);
    expect(ids(cfgWith({ parnasa: true, hosting: true }))).toEqual(ALL_IDS);
    for (const id of ALL_IDS) {
      const info = abilityInfo(id)!;
      expect(info.module, id).toBe(id.split('.')[0]);
      expect(info.label, id).toMatch(/^[֐-׿][֐-׿ ״׳]+$/);
    }
    expect(abilityInfo('hosting.availability')!.label).toBe('בדיקת יחידת אירוח פנויה');
    expect(abilityInfo('parnasa.findPro')).toMatchObject({ flag: 'parnasa.directory' });
    expect(abilityInfo('parnasa.shabbat')).toMatchObject({ flag: 'parnasa.zmanim' });
    expect(abilityInfo('parnasa.minyanim')).toMatchObject({ flag: 'parnasa.board' });
    expect(abilityInfo('hosting.today')).toMatchObject({ flag: null });
  });

  it('מזהי-השורה = מזהי-הספק (שני הכיוונים) — אין יכולת רשומה בלי מימוש, ואין מימוש בלי רישום', () => {
    const byModule: Record<string, readonly string[]> = { hosting: Object.keys(hostingAbilities), parnasa: Object.keys(parnasaAbilities), calendar: Object.keys(calendarAbilities) };
    for (const e of REGISTRY) expect(Object.keys(e.abilities).sort(), e.module).toEqual([...byModule[e.module]].sort());
    for (const a of [...Object.values(hostingAbilities), ...Object.values(parnasaAbilities), ...Object.values(calendarAbilities)]) expect(typeof a.run).toBe('function');
  });

  it('אותו כלל של הקו: סף-הוודאות של findPro = SURE_CONCEPT של phoneLine; נוסח-הוואטסאפ = של כרטיס-העסק', () => {
    const m = /const SURE_CONCEPT = ([\d.]+);/.exec(phoneLineSrc);
    expect(m, 'SURE_CONCEPT ב-phoneLine').toBeTruthy();
    expect(FIND_SURE_CONCEPT).toBe(Number(m![1]));
    // כרטיס-העסק בסקין-המקור בונה את הנוסח במקום — אותה נוסחה בדיוק (מקור-אמת אחד, נעול בשני הצדדים)
    expect(bizSheetSrc).toContain("const waMsg = 'שלום, הגעתי אליך דרך ' + brand + '.' + (props.qtext ? ' צריך עזרה: ' + props.qtext : '');");
    const cardIntro = (brand: string, q: string): string => 'שלום, הגעתי אליך דרך ' + brand + '.' + (q ? ' צריך עזרה: ' + q : '');
    for (const [brand, q] of [['פרנסה׳לע', ''], ['פרנסה׳לע של קהילת בעלזא', 'נזילה בכיור'], ['מדריך', '  רווחים  ']]) {
      expect(proWaIntro(brand, q)).toBe(cardIntro(brand, q.trim()));
    }
  });
});

/* ═══════════════ (ב) זמינות ═══════════════ */

describe('🔌 (ב) זמינות — דרך moduleOn/featureOn (שני הכלים opt-in)', () => {
  it('אף מודול ⇒ אין יכולות; כלי אחד ⇒ רק שלו; שניהם ⇒ הכול', () => {
    expect(ids(DEFAULT_CONFIG)).toEqual([]);
    expect(ids({ ...DEFAULT_CONFIG, modules: {} })).toEqual([]);
    expect(ids(cfgWith({ hosting: true }))).toEqual(['hosting.today', 'hosting.availability']);
    expect(ids(cfgWith({ parnasa: true }))).toEqual(['parnasa.findPro', 'parnasa.shabbat', 'parnasa.minyanim', 'parnasa.emergency']);
    expect(ids(cfgWith({ parnasa: true, hosting: true }))).toEqual(ALL_IDS);
  });

  it('opt-in: "true" כמחרוזת (ענן עוין) / false / חסר ⇒ כבוי', () => {
    expect(ids({ ...DEFAULT_CONFIG, modules: { parnasa: 'true', hosting: 1 } as never })).toEqual([]);
    expect(ids({ ...DEFAULT_CONFIG, modules: { parnasa: false, hosting: false } })).toEqual([]);
  });

  it('תת-דגל כבוי ⇒ היכולת שלו חסרה (השאר נשארות); דגל-הכלי false ⇒ גם יכולת בלי תת-דגל', () => {
    const both = { parnasa: true, hosting: true };
    expect(ids(cfgWith(both, { 'parnasa.directory': false }))).not.toContain('parnasa.findPro');
    expect(ids(cfgWith(both, { 'parnasa.directory': false }))).toContain('parnasa.shabbat');
    expect(ids(cfgWith(both, { 'parnasa.zmanim': false }))).not.toContain('parnasa.shabbat');
    expect(ids(cfgWith(both, { 'parnasa.board': false }))).toEqual(['hosting.today', 'hosting.availability', 'parnasa.findPro', 'parnasa.shabbat']);
    expect(ids(cfgWith(both, { parnasa: false }))).toEqual(['hosting.today', 'hosting.availability']);
    expect(ids(cfgWith(both, { hosting: false }))).toEqual(['parnasa.findPro', 'parnasa.shabbat', 'parnasa.minyanim', 'parnasa.emergency']);
    expect(isAvailable('parnasa.findPro', cfgWith(both, { 'parnasa.directory': false }))).toBe(false);
    expect(isAvailable('parnasa.findPro', cfgWith(both))).toBe(true);
    expect(isAvailable('nope.nothing', cfgWith(both))).toBe(false);
  });

  it('קונפיג פגום ⇒ [] / false (לא זורק)', () => {
    expect(listAbilities(null as never)).toEqual([]);
    expect(isAvailable('hosting.today', undefined as never)).toBe(false);
  });

  it('readsFor: רשימת-הצפייה = אוספי-הספקים של היכולות הזמינות המבוקשות בלבד', () => {
    const both = cfgWith({ parnasa: true, hosting: true });
    expect(readsFor(both, ['parnasa.shabbat']).sort()).toEqual(['prListings', 'prPosts', 'ui']);
    expect(readsFor(both, ['hosting.today']).sort()).toEqual(['hostBookings', 'hostRecords', 'hostUnits', 'orgName', 'ui']);
    expect(readsFor(cfgWith({ hosting: true }), ['parnasa.shabbat'])).toEqual([]);
    expect(readsFor(both, [])).toEqual([]);
  });
});

/* ═══════════════ (ג) ask ═══════════════ */

describe('🔌 (ג) ask — תשובה מטופסת או "לא זמין" מטופס; לעולם לא זורק', () => {
  it('מזהה זר ⇒ unknown', () => {
    const r = ask('nope.nothing' as AbilityId, ctxOf(cfgWith({ hosting: true })), {} as never);
    expect(r).toMatchObject({ ok: false, unavailable: true, reason: 'unknown', id: 'nope.nothing' });
  });

  it('מודול כבוי ⇒ off — גם כשהספק נטען', () => {
    installProvider('parnasa', parnasaAbilities);
    const r = ask('parnasa.shabbat', ctxOf(cfgWith({ hosting: true })), {});
    expect(r).toMatchObject({ ok: false, reason: 'off' });
    const r2 = ask('parnasa.findPro', ctxOf(cfgWith({ parnasa: true }, { 'parnasa.directory': false })), { text: 'אינסטלטור' });
    expect(r2).toMatchObject({ ok: false, reason: 'off' });
  });

  it('דלוק אבל הספק לא נטען ⇒ loading; אחרי התקנה ⇒ ok עם מודול ותווית', () => {
    const ctx = ctxOf(cfgWith({ hosting: true }));
    expect(ask('hosting.today', ctx, {})).toMatchObject({ ok: false, reason: 'loading' });
    installProvider('hosting', hostingAbilities);
    const r = ask('hosting.today', ctx, {});
    expect(r).toMatchObject({ ok: true, id: 'hosting.today', module: 'hosting', label: 'האירוח היום' });
  });

  it('ריצה שזורקת ⇒ error (נבלע); ctx פגום ⇒ error; קלט פגום ⇒ לא זורק', () => {
    installProvider('hosting', { 'hosting.today': { run: () => { throw new Error('boom'); } } });
    expect(ask('hosting.today', ctxOf(cfgWith({ hosting: true })), {})).toMatchObject({ ok: false, reason: 'error' });
    installProvider('parnasa', parnasaAbilities);
    expect(() => ask('parnasa.findPro', null as never, { text: 'x' })).not.toThrow();
    expect(ask('parnasa.findPro', null as never, { text: 'x' })).toMatchObject({ ok: false, reason: 'error' });
    const r = ask('parnasa.findPro', ctxOf(cfgWith({ parnasa: true })), { text: 42, limit: 'many', openNow: 'yes' } as never);
    expect(r.ok).toBe(true);
    const db = { ...fixtureDb(), prListings: null, prPosts: undefined, ui: {} } as never;
    for (const id of ['parnasa.findPro', 'parnasa.shabbat', 'parnasa.minyanim', 'parnasa.emergency'] as const) {
      expect(ask(id, { db, config: cfgWith({ parnasa: true }), nowMs: NaN }, { text: '' } as never).ok, id).toBe(true);
    }
  });

  it('התקנה רק למודול-הבעלים: ספק "parnasa" לא יכול להשתיל יכולת של hosting', () => {
    installProvider('parnasa', { 'hosting.today': { run: () => 'זר' } } as never);
    expect(ask('hosting.today', ctxOf(cfgWith({ hosting: true, parnasa: true })), {})).toMatchObject({ ok: false, reason: 'loading' });
  });
});

/* ═══════════════ (ד) טעינה עצלה ═══════════════ */

describe('🔌 (ד) טעינה עצלה — רק מה שהודלק, רק מה שנחוץ', () => {
  it('כלי כבוי לא נטען; ids מצמצם; אידמפוטנטי; מודיע למנויים', async () => {
    let n = 0;
    const off = subscribeSwitchboard(() => {
      n++;
    });
    const v0 = switchboardVersion();
    await loadProviders(cfgWith({ hosting: true }));
    expect(providerLoaded('hosting')).toBe(true);
    expect(providerLoaded('parnasa')).toBe(false);
    // ENGINEBOX-SOCKETS: בלי ids — גם ספק-הלוח (מודול-ליבה דלוק) נטען; התקנה אחת נוספת למונה
    expect(providerLoaded('calendar')).toBe(true);
    await loadProviders(cfgWith({ hosting: true, parnasa: true }), ['hosting.today']);
    expect(providerLoaded('parnasa'), 'ids מצמצם — רק הספק של היכולת המבוקשת').toBe(false);
    await Promise.all([loadProviders(cfgWith({ parnasa: true })), loadProviders(cfgWith({ parnasa: true }))]);
    expect(providerLoaded('parnasa')).toBe(true);
    expect(switchboardVersion() - v0).toBe(3);
    expect(n).toBe(3);
    off();
    await loadProviders(DEFAULT_CONFIG);
    expect(ask('parnasa.emergency', ctxOf(cfgWith({ parnasa: true })), {})).toMatchObject({ ok: true });
  });
});

/* ═══════════════ (ה) הגנות-מקור ═══════════════ */

const CORE_SRC = import.meta.glob(['../*.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const PROVIDER_SRC = import.meta.glob(['../../../components/*/abilities.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const ALL_SRC = import.meta.glob(['../../../**/*.ts', '../../../**/*.tsx', '!../../../**/__tests__/**'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const MONEY_WORDS = ['receiptSeq', 'donationSeq', 'shopReceiptSeq', 'donations', 'upsertEvent', 'deleteEvent', 'addDonation', 'addPayment', 'OrgEvent', 'receipt'];

/** מפתח-glob (יחסי לתיקיית-הבדיקה) ⇒ נתיב מ-src/. */
function fromTestDir(rel: string): string {
  const parts = ['src', 'lib', 'switchboard', '__tests__'];
  for (const seg of rel.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.') parts.push(seg);
  }
  return parts.join('/');
}

describe('🔌 (ה) הגנות-מקור — טוהר · בידוד · קריאה מוצהרת · בנדל', () => {
  it('ה-glob חי: 3 קובצי-ליבה + 3 ספקים (+ הלוח העברי — ENGINEBOX-SOCKETS)', () => {
    expect(Object.keys(CORE_SRC).map((p) => p.split('/').pop()).sort()).toEqual(['contract.ts', 'registry.ts', 'summary.ts']);
    expect(Object.keys(PROVIDER_SRC).length).toBe(3);
  });

  it('טוהר: בלי Date.now / new Date() / store / DOM / אחסון / כתיבה — בליבה ובספקים', () => {
    for (const [p, src] of [...Object.entries(CORE_SRC), ...Object.entries(PROVIDER_SRC)]) {
      expect(src, p + ' — Date.now / new Date()').not.toMatch(/Date\.now\(|new Date\(\)/);
      expect(src, p + ' — store').not.toMatch(/\buseApp\b|\bsetDb\b|\bsetState\b|from '[^']*store\//);
      expect(src, p + ' — DOM').not.toMatch(/\bdocument\.|\bwindow\.|\blocalStorage\b|\bnavigator\./);
    }
  });

  it('בידוד: אפס מילות-כסף/קבלות, אפס לוח-ראשי (.events) וחדרי-חוגים (db.rooms); הספקים לא קוראים בקשות-תושבים ולא כסף-אירוח', () => {
    for (const [p, src] of [...Object.entries(CORE_SRC), ...Object.entries(PROVIDER_SRC)]) {
      for (const w of MONEY_WORDS) expect(src, p + ' מזכיר ' + w).not.toContain(w);
      expect(src, p + ' — .events').not.toMatch(/\.events\b/);
      expect(src, p + ' — db.rooms').not.toMatch(/\bdb\.rooms\b/);
    }
    for (const [p, src] of Object.entries(PROVIDER_SRC)) {
      expect(src, p + ' — בקשות-תושבים (פרטי-מבקש)').not.toMatch(/\bprRequests\b|\brequester\b/);
      expect(src, p + ' — כסף-האירוח (פנקס/מחירים/סליקה)').not.toMatch(/\b(bookingBalance|bookingPaid|bookingTotal|priceQuote|payLink|money)\b|\.(rate|payments|charges)\b/);
    }
  });

  it('קריאה מוצהרת: כל ctx.db.<מפתח> בספק ⊆ ה-reads של שורת-הרישום שלו; אין גישה דינמית ל-db', () => {
    const reads: Record<string, readonly string[]> = Object.fromEntries(REGISTRY.map((e) => [e.module, e.reads as readonly string[]]));
    for (const [p, src] of Object.entries(PROVIDER_SRC)) {
      const mod = /components\/(\w+)\/abilities\.ts$/.exec(p)![1];
      const used = [...new Set([...src.matchAll(/\bdb\.([A-Za-z0-9_]+)/g)].map((m) => m[1]))];
      // ספק בלי reads (הלוח העברי — מנוע טהור מעל lib/hebrew) לא נוגע ב-db בכלל; האחרים קוראים משהו
      if (reads[mod].length === 0) expect(used, p + ' — reads ריק ⇒ אסור לקרוא db').toEqual([]);
      else expect(used.length, p + ' קורא משהו').toBeGreaterThan(0);
      for (const k of used) expect(reads[mod], p + ' קורא db.' + k + ' שלא הוצהר ב-REGISTRY.reads').toContain(k);
      expect(src, p + ' — db[…]').not.toMatch(/\bdb\[/);
    }
  });

  it('בנדל: המרכזייה מיובאת רק מקוד-עצל (המרכזייה עצמה, מסכי-האירוח/פרנסה׳לע, דבק-React) — לא מ-App/store/main/lib אחר', () => {
    // + ספק-הלוח (ENGINEBOX-SOCKETS) — רק קובץ-הספק, שנטען דרך מסך-הלוח העצל
    // + הכניסה העצלה של ארגז-המנועים (ENGINEBOX-FINAL — ה-ask של "מה היה קורה בחודש האחרון"; chunk משלה, נטען lazy מ-App)
    const allowed = /^src\/(lib\/switchboard\/|components\/switchboard\/|components\/hosting\/|components\/parnasa\/|components\/calendar\/abilities\.ts$|components\/enginebox\/EngineBoxEntry\.tsx$)/;
    const importers = Object.entries(ALL_SRC)
      .filter(([, s]) => s.split('\n').some((l) => /^import (?!type )/.test(l.trim()) && /from '[^']*lib\/switchboard\/(registry|summary|contract)'/.test(l)))
      .map(([p]) => fromTestDir(p));
    expect(importers.length, 'יש צרכנים').toBeGreaterThan(0);
    for (const f of importers) expect(f, 'מייבא את המרכזייה מקוד שאינו עצל: ' + f).toMatch(allowed);
    expect(appSrc).not.toMatch(/switchboard/);
    // הקבצים של המודולים שנמצאים בבנדל-הראשי (דרך ה-store) לא נוגעים במרכזייה
    for (const f of ['components/parnasa/model.ts', 'components/parnasa/transitions.ts', 'components/hosting/model.ts', 'components/hosting/transitions.ts']) {
      const hit = Object.entries(ALL_SRC).find(([p]) => p.endsWith(f));
      expect(hit, f).toBeTruthy();
      expect(hit![1], f + ' בבנדל-הראשי — אסור לגרור את המרכזייה').not.toMatch(/switchboard|abilities/);
    }
  });

  it('הספקים נטענים רק דרך מסך-הכלי (import() של הרישום) — אין נקודת-כניסה חדשה; הייצוא-מחדש היחיד: שורה אחת במסך', () => {
    // נמדד 13.10: chunk-ספק נפרד שמגיע סטטית למודולי-הבנדל-הראשי ⇒ המאגד מפצל אותם ⇒ +3.2KB gzip בהפעלה לכל ארגון
    const reexports: string[] = [];
    for (const [p, s] of Object.entries(ALL_SRC)) {
      for (const l of s.split('\n')) {
        const t = l.trim();
        if (!t.startsWith('import ') && !t.startsWith('export ')) continue;
        if (!/from '[^']*\/abilities'/.test(t)) continue;
        reexports.push(fromTestDir(p) + ' :: ' + t);
      }
    }
    expect(reexports.sort()).toEqual([
      "src/components/calendar/CalendarView.tsx :: export * as calendarProvider from './abilities';",
      "src/components/hosting/HostingView.tsx :: export * as hostingProvider from './abilities';",
      "src/components/parnasa/ParnasaView.tsx :: export * as parnasaProvider from './abilities';",
    ]);
    const reg = CORE_SRC['../registry.ts'];
    expect(reg).toContain("load: (): Promise<typeof import('../../components/hosting/abilities')> => import('../../components/hosting/HostingView').then((m) => m.hostingProvider) },");
    expect(reg).toContain("load: (): Promise<typeof import('../../components/parnasa/abilities')> => import('../../components/parnasa/ParnasaView').then((m) => m.parnasaProvider) },");
    expect(reg).toContain("load: (): Promise<typeof import('../../components/calendar/abilities')> => import('../../components/calendar/CalendarView').then((m) => m.calendarProvider) },");
    expect(reg, 'הרישום לא מייבא מסך/ספק סטטית').not.toMatch(/^import (?!type )[^\n]*components\//m);
  });
});
