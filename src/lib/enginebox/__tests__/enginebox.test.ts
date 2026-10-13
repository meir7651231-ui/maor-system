/**
 * ratchet — 🧰 ארגז-המנועים, הליבה (BUILD-ORDER-ENGINEBOX-2026-10-13).
 *
 * ננעל:
 *  (א) התקן סגור: כל מחבר שחלק משתמש בו נמצא ב-PLUG_TYPES; לכל סוג תווית+הסבר עבריים; מזהים ייחודיים.
 *  (ב) כנות ("מה שהמסך מבטיח זה מה שקורה"): Give חי ⇒ via = יכולת רשומה של אותו מודול, שזמינה כשהחלק בארגז;
 *      Need חי ⇒ at = קובץ קיים שמכיל את ה-marker; לכל Need תוצאה עברית לא-ריקה; המוצרים מצביעים לחלקים של המודול שלהם.
 *  (ג) DEFAULT_LINKS: כל אחד אפשרות חיה ותקינה, והקבוצה = הרשימה המאומתת (file:line בדוח-הסגירה).
 *  (ד) המתאים: שני הכיוונים · סדר דטרמיניסטי · בלי כפילויות · מזהה זר ⇒ [] · מודול כבוי ⇒ לא בארגז ובלי אפשרויות ·
 *      linked לפי השמור מול ברירת-המחדל · [] מפורש ⇒ כלום לא מחובר · זבל ⇒ לא זורק.
 *  (ה) חיטוי ומיגרציה: לא-תקין נזרק, תקין נשמר, אידמפוטנטי; חסר נשאר חסר; DB בלי המפתח ביט-זהה אחרי migrate ומיזוג-ענן.
 *  (ו) מוטציה פר-חוק-ליבה: הפיכת צד ל-live:false מעבירה את הזוג מ-connectOptions ל-futureOptions (ועוד).
 *  (ז) הגנות-מקור: טוהר (בלי Date.now/store/DOM), בידוד (בלי כסף/קבלות/לוח-ראשי/חדרים), והבנדל-הראשי מייבא רק את links.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG, type OrgConfig } from '../../../types/config';
import { emptyDb } from '../../../types/domain';
import { migrate } from '../../../store/persist';
import { applyMetaPartial } from '../../../lib/cloud-merge';
import { abilityInfo, REGISTRY } from '../../switchboard/registry';
import {
  catalogFor,
  connectOptions,
  DEFAULT_LINKS,
  effectiveLinks,
  futureOptions,
  healEngineLinksIn,
  isLinked,
  isPlugType,
  linkKey,
  MAX_LINKS,
  parseLink,
  PARTS,
  PLUG_STANDARD_VERSION,
  PLUG_TYPES,
  PRODUCTS,
  sanitizeLinks,
  VALID_LINKS,
  type Part,
} from '..';
import { MAX_LINK_SHAPES, sanitizeLinkShapes } from '../linkShape';

const HEB = /[֐-׿]/;
const ROOT = resolve(__dirname, '../../../..');

/** ארגון עם שני הכלים דלוקים (opt-in ⇒ true מפורש). */
const BOTH: OrgConfig = { ...DEFAULT_CONFIG, modules: { ...DEFAULT_CONFIG.modules, parnasa: true, hosting: true } };
const cfg = (over: Partial<OrgConfig>): OrgConfig => ({ ...BOTH, ...over });

/** הרשימה המאומתת בקוד (CLOSED-ENGINEBOX-CORE-2026-10-13 §טבלה). */
const VERIFIED = [
  'pr.zmanim>times.shabbat>host.stay',
  'pr.zmanim>times.shabbat>host.shabbat',
  'pr.board>times.prayers>host.stay',
  'pr.board>times.prayers>host.shabbat',
  'pr.directory>pro.match>host.maint',
  'pr.directory>pro.match>host.clean',
  'pr.board>emergency>host.maint',
  'host.units>availability>pr.phone',
  'pr.zmanim>day.summary>host.dash',
  'pr.board>day.summary>host.dash',
  'host.dash>day.summary>pr.care',
];

/* ═══════════════ (א) התקן סגור ═══════════════ */

describe('🧰 (א) תקן החיבור — סגור', () => {
  it('גרסה 1, 12–20 סוגים, מזהים ייחודיים, תווית+הסבר עבריים', () => {
    expect(PLUG_STANDARD_VERSION).toBe(1);
    expect(PLUG_TYPES.length).toBeGreaterThanOrEqual(12);
    expect(PLUG_TYPES.length).toBeLessThanOrEqual(20);
    expect(new Set(PLUG_TYPES.map((p) => p.id)).size).toBe(PLUG_TYPES.length);
    for (const p of PLUG_TYPES) {
      expect(p.label, p.id).toMatch(HEB);
      expect(p.desc, p.id).toMatch(HEB);
      expect(p.desc, p.id + ' — שורה אחת').not.toMatch(/\n/);
    }
  });

  it('כל מחבר שחלק נותן/צריך — מהתקן', () => {
    for (const part of PARTS) for (const s of [...part.gives, ...part.needs]) expect(isPlugType(s.plug), part.id + ' ⇒ ' + s.plug).toBe(true);
  });
});

/* ═══════════════ (ב) כנות ═══════════════ */

describe('🧰 (ב) כנות — מה שהמסך מבטיח זה מה שקורה', () => {
  it('חלקים: מזהים ייחודיים (ולא מתנגשים במוצרים), שם/מה/מקור עבריים', () => {
    const ids = PARTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const pr of PRODUCTS) expect(ids, 'מזהה-מוצר = מזהה-חלק: ' + pr.id).not.toContain(pr.id);
    for (const p of PARTS) {
      expect(p.name, p.id).toMatch(HEB);
      expect(p.what, p.id).toMatch(HEB);
      expect(['פרנסה׳לע', 'אירוח משפחתי', 'אורביט']).toContain(p.from);
    }
  });

  it('Give חי ⇒ via יכולת רשומה של אותו מודול, ותת-הדגל שלה = של החלק (זמינה תמיד כשהחלק בארגז); Give לא-חי בלי via', () => {
    const regMods = new Set(REGISTRY.map((e) => e.module as string));
    for (const p of PARTS) {
      for (const g of p.gives) {
        expect(g.label, p.id).toMatch(HEB);
        if (!g.live) {
          expect(g.via, p.id + ' — בקרוב בלי via').toBeUndefined();
          continue;
        }
        const info = abilityInfo(g.via ?? '');
        expect(info, p.id + ' ⇒ ' + g.via + ' לא רשומה במרכזייה').toBeTruthy();
        expect(info!.module, p.id).toBe(p.module);
        expect(regMods.has(p.module)).toBe(true);
        expect(info!.flag, p.id + ' ⇒ ' + g.via + ' — תת-הדגל של היכולת חייב להיות של החלק').toBe(p.flag ?? null);
      }
    }
  });

  it('Need חי ⇒ at = קובץ קיים תחת src/ שמכיל את ה-marker; Need לא-חי בלי at; לכל Need תוצאה עברית', () => {
    for (const p of PARTS) {
      for (const n of p.needs) {
        expect(n.label, p.id).toMatch(HEB);
        expect(n.result.trim().length, p.id + ' — תוצאה ריקה').toBeGreaterThan(10);
        expect(n.result, p.id).toMatch(HEB);
        if (!n.live) {
          expect(n.at, p.id + ' — בקרוב בלי at').toBeUndefined();
          continue;
        }
        expect(n.at, p.id + ' ⇒ ' + n.plug + ' חי בלי נקודת-צריכה').toBeTruthy();
        expect(n.at!.file.startsWith('src/'), n.at!.file).toBe(true);
        const abs = resolve(ROOT, n.at!.file);
        expect(existsSync(abs), n.at!.file + ' לא קיים').toBe(true);
        expect(readFileSync(abs, 'utf8'), n.at!.file + ' לא מכיל: ' + n.at!.marker).toContain(n.at!.marker);
      }
    }
  });

  it('מוצרים: כל חלק קיים ושייך למודול-המוצר; כל חלק של המודול במוצר שלו', () => {
    for (const pr of PRODUCTS) {
      expect(pr.name).toMatch(HEB);
      for (const id of pr.parts) expect(PARTS.find((p) => p.id === id)?.module, pr.id + ' ⇒ ' + id).toBe(pr.module);
      expect([...pr.parts].sort()).toEqual(PARTS.filter((p) => p.module === pr.module).map((p) => p.id).sort());
    }
  });
});

/* ═══════════════ (ג) DEFAULT_LINKS ═══════════════ */

describe('🧰 (ג) ברירת-המחדל = החיווט של היום', () => {
  it('הקבוצה = הרשימה המאומתת; בלי כפילויות', () => {
    expect([...DEFAULT_LINKS].sort()).toEqual([...VERIFIED].sort());
    expect(new Set(DEFAULT_LINKS).size).toBe(DEFAULT_LINKS.length);
  });

  it('כל אחד תקין (חי⇄חי, אותו מחבר, כלים שונים) ומוצע כאפשרות מחוברת', () => {
    for (const k of DEFAULT_LINKS) {
      const l = parseLink(k);
      expect(l, k).toBeTruthy();
      const giver = PARTS.find((p) => p.id === l!.giver)!;
      const opts = connectOptions({ start: l!.needer, picked: l!.giver, config: BOTH });
      const o = opts.find((x) => x.key === k);
      expect(o, k + ' לא מוצע').toBeTruthy();
      expect(o!.side).toBe('into');
      expect(o!.linked).toBe(true);
      expect(giver.module).not.toBe(PARTS.find((p) => p.id === l!.needer)!.module);
    }
  });

  it('היום: כל חיבור חי-תקין כבר מחווט (שלב ב׳ רשאי להוסיף חי-לא-מחובר — אז הבדיקה הזו תשתנה במכוון)', () => {
    expect([...VALID_LINKS].sort()).toEqual([...DEFAULT_LINKS].sort());
  });
});

/* ═══════════════ (ד) המתאים ═══════════════ */

describe('🧰 (ד) המתאים', () => {
  it('הארגז: ברירת-מחדל (opt-in כבוי) ⇒ אין חלקי פרנסה׳לע/אירוח; שניהם דלוקים ⇒ כולם', () => {
    const ids = catalogFor(DEFAULT_CONFIG).map((p) => p.id);
    expect(ids.some((i) => i.startsWith('pr.') || i.startsWith('host.'))).toBe(false);
    expect(catalogFor(BOTH).map((p) => p.id)).toEqual(PARTS.map((p) => p.id));
  });

  it('מוצר האירוח + מדריך העסקים ⇒ שתי אפשרויות into (תקלה · ניקיון), עם התוצאה מהצד המקבל', () => {
    const opts = connectOptions({ start: 'hosting', picked: 'pr.directory', config: BOTH });
    expect(opts.map((o) => o.key)).toEqual(['pr.directory>pro.match>host.maint', 'pr.directory>pro.match>host.clean']);
    for (const o of opts) {
      expect(o.side).toBe('into');
      expect(o.plugLabel).toBe('בעל מקצוע מתאים');
      expect(o.result).toBe(PARTS.find((p) => p.id === o.needer)!.needs.find((n) => n.plug === 'pro.match')!.result);
    }
  });

  it('מוצר פרנסה׳לע + לוח הבקרה של האירוח ⇒ שני הכיוונים: into (תקציר בלשונית האישורים) ו-from (זמנים+מניין לתקציר)', () => {
    const opts = connectOptions({ start: 'parnasa', picked: 'host.dash', config: BOTH });
    expect(opts.map((o) => o.side + ':' + o.key)).toEqual([
      'into:host.dash>day.summary>pr.care',
      'from:pr.zmanim>day.summary>host.dash',
      'from:pr.board>day.summary>host.dash',
    ]);
  });

  it('התחלה ממנוע בודד: זמני השבת ⇐ כרטיס השהייה (from), ומוצר האירוח ⇐ הקו (from: מקום פנוי)', () => {
    expect(connectOptions({ start: 'pr.zmanim', picked: 'host.stay', config: BOTH }).map((o) => o.side + ':' + o.key)).toEqual(['from:pr.zmanim>times.shabbat>host.stay']);
    expect(connectOptions({ start: 'hosting', picked: 'pr.phone', config: BOTH }).map((o) => o.side + ':' + o.key)).toEqual(['from:host.units>availability>pr.phone']);
  });

  it('דטרמיניסטי ובלי כפילויות — על כל צירוף התחלה×בחירה', () => {
    const starts = [...PRODUCTS.map((p) => p.id), ...PARTS.map((p) => p.id)];
    for (const s of starts) {
      for (const p of PARTS) {
        const a = connectOptions({ start: s, picked: p.id, config: BOTH });
        const b = connectOptions({ start: s, picked: p.id, config: BOTH });
        expect(a).toEqual(b);
        expect(new Set(a.map((o) => o.key)).size, s + '+' + p.id).toBe(a.length);
        const f = futureOptions({ start: s, picked: p.id, config: BOTH });
        expect(new Set(f.map((o) => o.key)).size).toBe(f.length);
        for (const o of f) expect(a.some((x) => x.key === o.key), 'בקרוב מעורבב: ' + o.key).toBe(false);
      }
    }
  });

  it('מזהה זר ⇒ []; בחירה שכבר בתוך ההתחלה ⇒ []; חיבור בתוך אותו כלי לא מוצע', () => {
    expect(connectOptions({ start: 'nope', picked: 'pr.directory', config: BOTH })).toEqual([]);
    expect(connectOptions({ start: 'hosting', picked: 'nope', config: BOTH })).toEqual([]);
    expect(connectOptions({ start: 'parnasa', picked: 'pr.directory', config: BOTH })).toEqual([]);
    expect(connectOptions({ start: 'pr.zmanim', picked: 'pr.care', config: BOTH })).toEqual([]);
    expect(futureOptions({ start: 'nope', picked: 'nope', config: BOTH })).toEqual([]);
  });

  it('מודול כבוי ⇒ החלק לא בארגז ואין אפשרויות; תת-דגל כבוי ⇒ אותו דבר לחלק הזה בלבד', () => {
    const noPr = cfg({ modules: { ...BOTH.modules, parnasa: false } });
    expect(catalogFor(noPr).some((p) => p.module === 'parnasa')).toBe(false);
    expect(connectOptions({ start: 'hosting', picked: 'pr.directory', config: noPr })).toEqual([]);
    expect(connectOptions({ start: 'parnasa', picked: 'host.dash', config: noPr })).toEqual([]);
    const noMaint = cfg({ features: { 'hosting.maint': false } });
    expect(catalogFor(noMaint).map((p) => p.id)).not.toContain('host.maint');
    expect(connectOptions({ start: 'hosting', picked: 'pr.directory', config: noMaint }).map((o) => o.key)).toEqual(['pr.directory>pro.match>host.clean']);
    const noDir = cfg({ features: { 'parnasa.directory': false } });
    expect(connectOptions({ start: 'hosting', picked: 'pr.directory', config: noDir })).toEqual([]);
    const noTool = cfg({ features: { hosting: false } });
    expect(catalogFor(noTool).some((p) => p.module === 'hosting')).toBe(false);
  });

  it('linked: חסר ⇒ ברירת-המחדל; רשימה שמורה ⇒ רק מה שבה; [] מפורש ⇒ כלום', () => {
    const q = { start: 'hosting', picked: 'pr.directory', config: BOTH } as const;
    expect(connectOptions(q).map((o) => o.linked)).toEqual([true, true]);
    expect(connectOptions({ ...q, stored: ['pr.directory>pro.match>host.clean'] }).map((o) => o.linked)).toEqual([false, true]);
    expect(connectOptions({ ...q, stored: [] }).map((o) => o.linked)).toEqual([false, false]);
    expect(isLinked(undefined, 'pr.directory', 'pro.match', 'host.maint')).toBe(true);
    expect(isLinked([], 'pr.directory', 'pro.match', 'host.maint')).toBe(false);
    expect(isLinked(['pr.directory>pro.match>host.maint'], 'pr.directory', 'pro.match', 'host.maint')).toBe(true);
  });

  it('בקרוב: מוצר האירוח + הקו ⇒ "הזמנה מהקו" (שני הצדדים לא בנויים); משפחות ⇒ יחידות (בקרוב)', () => {
    const f = futureOptions({ start: 'hosting', picked: 'pr.phone', config: BOTH });
    expect(f.map((o) => o.side + ':' + o.key + ':' + o.missing)).toEqual(['from:host.units>booking>pr.phone:both']);
    const fam = futureOptions({ start: 'hosting', picked: 'orbit.families', config: BOTH });
    expect(fam.map((o) => o.key)).toEqual(['orbit.families>person>host.units']);
    expect(connectOptions({ start: 'hosting', picked: 'orbit.families', config: BOTH })).toEqual([]);
  });

  it('זבל לא מפיל: קונפיג/שאילתה/רשימה שמורה פגומים ⇒ [] או ברירת-מחדל', () => {
    const junk = [null, undefined, 42, 'x', {}, { start: 1, picked: {} }, { start: 'hosting', picked: 'pr.directory', config: null }];
    for (const j of junk) {
      expect(() => connectOptions(j as never)).not.toThrow();
      expect(() => futureOptions(j as never)).not.toThrow();
      expect(connectOptions(j as never)).toEqual([]);
    }
    expect(catalogFor(null as never)).toEqual([]);
    const q = { start: 'hosting', picked: 'pr.directory', config: BOTH };
    expect(connectOptions({ ...q, stored: 'garbage' as never }).map((o) => o.linked)).toEqual([true, true]);
    expect(connectOptions({ ...q, stored: [1, null, {}] as never }).map((o) => o.linked)).toEqual([false, false]);
  });
});

/* ═══════════════ (ה) חיטוי ומיגרציה ═══════════════ */

describe('🧰 (ה) חיטוי · מיגרציה · מיזוג-ענן', () => {
  const A = 'pr.directory>pro.match>host.maint';
  const B = 'host.units>availability>pr.phone';

  it('sanitizeLinks: לא-מערך ⇒ undefined; זר/לא-חי/אותו-כלי/לא-מחרוזת נזרקים; כפילויות; מיון; אידמפוטנטי', () => {
    expect(sanitizeLinks(undefined)).toBeUndefined();
    expect(sanitizeLinks('x')).toBeUndefined();
    expect(sanitizeLinks({ 0: A })).toBeUndefined();
    const dirty = [B, A, A, 'nope', 7, null, 'host.units>booking>pr.phone', 'pr.zmanim>day.summary>pr.care', linkKey('pr.directory', 'emergency', 'host.maint')];
    const clean = sanitizeLinks(dirty)!;
    expect(clean).toEqual([A, B].sort());
    expect(sanitizeLinks(clean)).toEqual(clean);
    expect(sanitizeLinks([])).toEqual([]);
  });

  it('תקרה 500 (גם אחרי ניקוי כפילויות)', () => {
    expect(MAX_LINKS).toBe(500);
    const many = Array.from({ length: 2000 }, (_, i) => VALID_LINKS[i % VALID_LINKS.length]);
    expect(sanitizeLinks(many)!.length).toBe(Math.min(VALID_LINKS.length, 500));
  });

  it('effectiveLinks: חסר ⇒ ברירת-המחדל; [] ⇒ ריק; רשימה ⇒ המחוטאת', () => {
    expect([...effectiveLinks(undefined)].sort()).toEqual([...DEFAULT_LINKS].sort());
    expect(effectiveLinks([]).size).toBe(0);
    expect([...effectiveLinks([A, 'zz'])]).toEqual([A]);
  });

  it('healEngineLinksIn: בלי המפתח ⇒ אותה הפניה; תקין ⇒ אותה הפניה; מלוכלך ⇒ מחוטא; לא-מערך ⇒ המפתח יורד', () => {
    const ui0 = { famView: 'list', crsView: 'grid' };
    expect(healEngineLinksIn(ui0)).toBe(ui0);
    const ok = { ...ui0, engineLinks: [A, B].sort() };
    expect(healEngineLinksIn(ok)).toBe(ok);
    expect(healEngineLinksIn({ ...ui0, engineLinks: [B, A, 'x'] })).toEqual({ ...ui0, engineLinks: [A, B].sort() });
    const dropped = healEngineLinksIn({ ...ui0, engineLinks: 'bad' });
    expect('engineLinks' in dropped).toBe(false);
    expect(healEngineLinksIn(undefined)).toBeUndefined();
    expect(healEngineLinksIn(null)).toBeNull();
  });

  // תיקון משקל-טעינה A2: הריפוי בבנדל-הראשי הוא ריפוי-**צורה** בלבד (בלי הקטלוג). מפתח בצורה תקינה שאינו בקטלוג נשמר
  // ב-DB — אבל לעולם לא "מחובר", כי effectiveLinks/isLinked מסננים מול הקטלוג בזמן-השימוש. וכל חיבור-אמת חייב לעבור
  // את מסננת-הצורה (אחרת migrate היה מוחק חיבורים שהלקוח בחר).
  it('ריפוי-צורה: trim · מבנה חלק>מחבר>חלק · מפתח-זר-בצורה-תקינה נשמר אך לא מחובר · כל חיבור-אמת עובר', () => {
    const ghost = 'zz.ghost>times.shabbat>host.stay';
    const healed = healEngineLinksIn({ engineLinks: [' ' + A + ' ', ghost, 'a>b', 'A>b>c', 'a>b>c>d', 'a b>c>d', 7, A] });
    expect(healed.engineLinks).toEqual([A, ghost].sort());
    expect(effectiveLinks(healed.engineLinks as string[]).has(ghost)).toBe(false);
    expect(isLinked(healed.engineLinks as string[], 'zz.ghost', 'times.shabbat', 'host.stay')).toBe(false);
    expect([...effectiveLinks(healed.engineLinks as string[])]).toEqual([A]);
    expect(sanitizeLinkShapes([...VALID_LINKS])).toEqual([...VALID_LINKS].sort());
    expect(sanitizeLinkShapes([...DEFAULT_LINKS])).toEqual([...DEFAULT_LINKS].sort());
    expect(MAX_LINK_SHAPES).toBe(MAX_LINKS);
    expect(sanitizeLinkShapes(Array.from({ length: 900 }, (_, i) => 'p' + i + '>x>q'))!.length).toBe(500);
  });

  it('migrate: DB בלי המפתח ⇒ ביט-זהה (בלי engineLinks), ואידמפוטנטי', () => {
    const once = migrate(JSON.parse(JSON.stringify(emptyDb())))!;
    expect('engineLinks' in once.ui).toBe(false);
    const twice = migrate(JSON.parse(JSON.stringify(once)))!;
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });

  it('migrate: מחטא engineLinks קיים, משמר [] מפורש, ומוריד לא-מערך', () => {
    const raw = JSON.parse(JSON.stringify(emptyDb()));
    raw.ui.engineLinks = [B, 'junk', A, A];
    expect(migrate(raw)!.ui.engineLinks).toEqual([A, B].sort());
    const empty = JSON.parse(JSON.stringify(emptyDb()));
    empty.ui.engineLinks = [];
    expect(migrate(empty)!.ui.engineLinks).toEqual([]);
    const bad = JSON.parse(JSON.stringify(emptyDb()));
    bad.ui.engineLinks = { a: 1 };
    expect('engineLinks' in migrate(bad)!.ui).toBe(false);
  });

  it('מיזוג meta מהענן: ui בלי המפתח ⇒ אותו DB; engineLinks מלוכלך ⇒ מחוטא', () => {
    const db = emptyDb();
    expect(applyMetaPartial(db, { ui: JSON.parse(JSON.stringify(db.ui)) })).toBe(db);
    const next = applyMetaPartial(db, { ui: { ...db.ui, engineLinks: [B, 'x', A] } });
    expect(next.ui.engineLinks).toEqual([A, B].sort());
  });
});

/* ═══════════════ (ו) מוטציה — חוק-ליבה אחד לכל בדיקה ═══════════════ */

describe('🧰 (ו) מוטציה', () => {
  /** הרצת המתאים מול עותק-חלקים שהוחלף (vi.doMock על parts — מודולים טריים). */
  type Mut = { -readonly [K in keyof Part]: Part[K] };
  async function withParts(mut: (parts: Mut[]) => Mut[]) {
    vi.resetModules();
    const real = await vi.importActual<typeof import('../parts')>('../parts');
    const parts: Part[] = mut(real.PARTS.map((p): Mut => ({ ...p, gives: p.gives.map((g) => ({ ...g })), needs: p.needs.map((n) => ({ ...n })) })));
    const byId = new Map(parts.map((p) => [p.id, p]));
    vi.doMock('../parts', () => ({
      ...real,
      PARTS: parts,
      partById: (id: unknown) => (typeof id === 'string' ? byId.get(id) : undefined),
      partOrder: (id: string) => {
        const i = parts.findIndex((p) => p.id === id);
        return i < 0 ? parts.length : i;
      },
    }));
    const m = await import('../match');
    const l = await import('../links');
    vi.doUnmock('../parts');
    return { m, l };
  }

  it('Need ⇒ live:false: נעלם מ-connectOptions ועובר ל-futureOptions (missing=need), ונפסל ב-sanitize', async () => {
    const { m, l } = await withParts((ps) => {
      ps.find((p) => p.id === 'host.clean')!.needs = ps.find((p) => p.id === 'host.clean')!.needs.map((n) => ({ ...n, live: false }));
      return ps;
    });
    const q = { start: 'hosting', picked: 'pr.directory', config: BOTH };
    expect(m.connectOptions(q).map((o) => o.key)).toEqual(['pr.directory>pro.match>host.maint']);
    expect(m.futureOptions(q).map((o) => o.key + ':' + o.missing)).toEqual(['pr.directory>pro.match>host.clean:need']);
    expect(l.sanitizeLinks(['pr.directory>pro.match>host.clean'])).toEqual([]);
  });

  it('Give ⇒ live:false: כל הזוגות שלו עוברים ל"בקרוב" (missing=give)', async () => {
    const { m } = await withParts((ps) => {
      const d = ps.find((p) => p.id === 'pr.directory')!;
      d.gives = d.gives.map((g) => ({ ...g, live: false }));
      return ps;
    });
    const q = { start: 'hosting', picked: 'pr.directory', config: BOTH };
    expect(m.connectOptions(q)).toEqual([]);
    expect(m.futureOptions(q).map((o) => o.missing)).toEqual(['give', 'give']);
  });

  it('מחבר שונה ⇒ אין התאמה (זכר ונקבה חייבים אותו סוג)', async () => {
    const { m } = await withParts((ps) => {
      const d = ps.find((p) => p.id === 'pr.directory')!;
      d.gives = d.gives.map((g) => ({ ...g, plug: 'emergency' as const }));
      return ps;
    });
    expect(m.connectOptions({ start: 'host.clean', picked: 'pr.directory', config: BOTH })).toEqual([]);
  });

  it('אותו מודול ⇒ לא חיבור (חיווט פנימי) — גם אם המחבר מתאים', async () => {
    const { m, l } = await withParts((ps) => {
      const c = ps.find((p) => p.id === 'host.clean')!;
      c.module = 'parnasa';
      return ps;
    });
    expect(m.connectOptions({ start: 'host.clean', picked: 'pr.directory', config: BOTH })).toEqual([]);
    expect(l.VALID_LINKS).not.toContain('pr.directory>pro.match>host.clean');
  });
});

/* ═══════════════ (ז) הגנות-מקור ═══════════════ */

const SRC = import.meta.glob(['../*.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

describe('🧰 (ז) הגנות-מקור', () => {
  it('ה-glob חי: 6 קבצים', () => {
    expect(Object.keys(SRC).map((p) => p.split('/').pop()).sort()).toEqual(['index.ts', 'linkShape.ts', 'links.ts', 'match.ts', 'parts.ts', 'plugs.ts']);
  });

  it('טוהר: בלי Date.now / new Date() / Math.random / store / DOM / React', () => {
    for (const [p, s] of Object.entries(SRC)) {
      expect(s, p).not.toMatch(/Date\.now\(|new Date\(|Math\.random\(/);
      expect(s, p).not.toMatch(/\buseApp\b|\bsetDb\b|from '[^']*store\/|from 'react'/);
      expect(s, p).not.toMatch(/\bdocument\.|\bwindow\.|\blocalStorage\b|\bnavigator\./);
    }
  });

  it('בידוד: אפס כסף/קבלות/תרומות/לוח-ראשי/חדרי-חוגים בקוד', () => {
    for (const [p, s] of Object.entries(SRC)) {
      expect(s, p).not.toMatch(/receipt|donation|OrgEvent|upsertEvent|addPayment|\.events\b|\bdb\.rooms\b/i);
    }
  });

  it('תלויות: links/parts/plugs לא מייבאים קוד-ריצה של המרכזייה או config (נטענים מהבנדל-הראשי); רק match מייבא config', () => {
    for (const f of ['../links.ts', '../parts.ts', '../plugs.ts']) {
      const runtime = SRC[f]!.split('\n').filter((l) => /^import (?!type )/.test(l.trim()));
      for (const l of runtime) expect(l, f).not.toMatch(/switchboard|config|match/);
    }
    const persistSrc = readFileSync(resolve(ROOT, 'src/store/persist.ts'), 'utf8');
    const mergeSrc = readFileSync(resolve(ROOT, 'src/lib/cloud-merge.ts'), 'utf8');
    expect(persistSrc).toContain("from '../lib/enginebox/linkShape'");
    expect(mergeSrc).toContain("from './enginebox/linkShape'");
  });

  // תיקון משקל-טעינה A2 (13.10): ייבוא `links` מ-persist/cloud-merge גרר את כל הקטלוג (parts+plugs) ל-chunk ה-persist
  // שנטען-מראש לכל ארגון: ‎+3,279 bytes gzip — על כלי opt-in ובלתי-נראה. הבנדל-הראשי מייבא מארגז-המנועים **רק** את
  // linkShape, ו-linkShape עצמו בלי שום ייבוא — כדי שאף אחד לא יחזיר את הקטלוג לטעינה-הראשונית בשקט.
  it('משקל-טעינה: persist/cloud-merge מייבאים מארגז-המנועים רק את linkShape, ו-linkShape בלי ייבואים', () => {
    for (const f of ['src/store/persist.ts', 'src/lib/cloud-merge.ts']) {
      const src = readFileSync(resolve(ROOT, f), 'utf8');
      const specs = [...src.matchAll(/(?:from|import)\s*\(?\s*'([^']*enginebox[^']*)'/g)].map((m) => m[1]!.split('/').pop());
      expect(specs.length, f).toBeGreaterThan(0);
      for (const sp of specs) expect(sp, f).toBe('linkShape');
    }
    expect(SRC['../linkShape.ts']!).not.toMatch(/^\s*import\b|\bimport\s*\(|\brequire\(|^\s*export\s[^;]*\bfrom\s/m);
  });
});
