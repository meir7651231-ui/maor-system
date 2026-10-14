/**
 * 🔒 ratchet — 🧬 מנועים וחלקים: היכולות כנתונים אמיתיים (ATOMS, 14.10.2026, הסשן המשלב).
 *
 * ננעל:
 *  (א) צורה (`capShape`): חסר נשאר חסר (אותה הפניה, ביט-זהה) · לא-מערך ⇒ המפתח יורד · רשומה בלי id ⇒ נזרקת · תקרה 200 ·
 *      ב-migrate ובמיזוג-הענן. capShape בלי ייבואים, ויושב ב-chunk של linkShape (אין בקשת-הפעלה נוספת).
 *  (ב) אימות מול הכרטיסים האמיתיים (`capabilities.ts`): מנוע/מקום/חלק/סוג/משפט-תוצאה; פרמטרים מנוקים; id = capabilityId;
 *      שם ברירת-מחדל לפי מזהה-המקום ("מנוע תורים").
 *  (ג) store: createCapability/removeCapability — שורת-לוג עברית, עדכון (אותו id) ⇒ "עדכון מנוע", זהה ⇒ false, לא-תקין ⇒ false
 *      בלי נגיעה, מורה ⇒ נדחה, הסרה שלא קיימת ⇒ false.
 *  (ד) הבנדל-הראשי: App/store/persist/cloud-merge לא מייבאים סטטית את הכרטיסים, החלקים, התצוגות או המקור.
 *  (ה) החוזה המשותף — md5 קבוע.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { emptyDb, type Db } from '../../../types/domain';
import { migrate } from '../../../store/persist';
import { applyMetaPartial } from '../../cloud-merge';
import { useApp } from '../../../store/useApp';
import { cfgWith, fixtureDb, restoreStore, setupStore } from '../../switchboard/__tests__/fixture';
import { capabilityId, type Capability } from '../contract';
import { healCapabilitiesIn, MAX_CAPABILITIES } from '../capShape';
import { capabilityLabel, cleanParams, placeShort, sanitizeCapabilities, suggestedName, validCapability, withCapability, withoutCapability } from '../capabilities';
import { atomCard } from '../cards';
import type { OrgConfig } from '../../../types/config';
import capShapeSrc from '../capShape.ts?raw';
import viteCfg from '../../../../vite.config.ts?raw';
import appSrc from '../../../App.tsx?raw';
import storeSrc from '../../../store/useApp.ts?raw';
import persistSrc from '../../../store/persist.ts?raw';
import mergeSrc from '../../cloud-merge.ts?raw';
import mainSrc from '../../../main.tsx?raw';

const TURNS: Capability = {
  id: capabilityId('bookings', 'bookings.turnover', 'divide'),
  engine: 'bookings',
  place: 'bookings.turnover',
  atom: 'divide',
  params: { by: 'size', size: 40, gap: 0, remainder: 'drop', parts: 12 },
  name: 'מנוע תורים',
};

/* ═══════════════ (א) צורה ═══════════════ */

describe('🧬 (א) capShape — ריפוי-צורה בלבד', () => {
  it('חסר ⇒ אותה הפניה; תקין ⇒ אותה הפניה; לא-מערך ⇒ המפתח יורד; בלי id ⇒ נזרק', () => {
    const ui = { a: 1 };
    expect(healCapabilitiesIn(ui)).toBe(ui);
    const ok = { capabilities: [TURNS] };
    expect(healCapabilitiesIn(ok)).toBe(ok);
    expect('capabilities' in healCapabilitiesIn({ capabilities: { x: 1 } } as Record<string, unknown>)).toBe(false);
    expect(healCapabilitiesIn({ capabilities: [TURNS, null, 7, { name: 'x' }] }).capabilities).toEqual([TURNS]);
    expect(healCapabilitiesIn(null)).toBe(null);
    const many = Array.from({ length: 260 }, (_, i) => ({ ...TURNS, id: 'c' + i }));
    expect(healCapabilitiesIn({ capabilities: many }).capabilities).toHaveLength(MAX_CAPABILITIES);
  });

  it('migrate: DB בלי המפתח ⇒ בלי capabilities, אידמפוטנטי; קיים ⇒ נשמר; לא-מערך ⇒ יורד', () => {
    const once = migrate(JSON.parse(JSON.stringify(emptyDb())))!;
    expect('capabilities' in once.ui).toBe(false);
    expect(JSON.stringify(migrate(JSON.parse(JSON.stringify(once))))).toBe(JSON.stringify(once));
    const raw = JSON.parse(JSON.stringify(emptyDb()));
    raw.ui.capabilities = [TURNS, 'junk'];
    expect(migrate(raw)!.ui.capabilities).toEqual([TURNS]);
    const bad = JSON.parse(JSON.stringify(emptyDb()));
    bad.ui.capabilities = 'x';
    expect('capabilities' in migrate(bad)!.ui).toBe(false);
  });

  it('מיזוג meta מהענן: ui בלי המפתח ⇒ אותו DB; מלוכלך ⇒ מחוטא', () => {
    const db = emptyDb();
    expect(applyMetaPartial(db, { ui: JSON.parse(JSON.stringify(db.ui)) })).toBe(db);
    const next = applyMetaPartial(db, { ui: { ...db.ui, capabilities: [TURNS, { bad: 1 }] } as Db['ui'] });
    expect(next.ui.capabilities).toEqual([TURNS]);
  });

  it('capShape בלי ייבואים, ובקבוצת linkShape ב-vite.config (אין chunk-הפעלה תשיעי)', () => {
    expect(capShapeSrc).not.toMatch(/^\s*import\b|\bimport\s*\(|\brequire\(|^\s*export\s[^;]*\bfrom\s/m);
    expect(viteCfg).toMatch(/name: 'linkShape', test: [^\n]*atoms\[\\\\\/\]capShape/);
  });
});

/* ═══════════════ (ב) אימות מול הכרטיסים ═══════════════ */

describe('🧬 (ב) capabilities — אימות מול הכרטיסים האמיתיים', () => {
  it('תקינה ⇒ מנורמלת (id מחושב, פרמטרים מנוקים, שם נשמר)', () => {
    const c = validCapability({ ...TURNS, id: 'whatever', params: { by: 'size', size: '40', junk: 1 } })!;
    expect(c.id).toBe('bookings:bookings.turnover:divide');
    expect(c.params).toEqual({ by: 'size', parts: 12, size: 40, gap: 0, remainder: 'drop' });
    expect(c.name).toBe('מנוע תורים');
  });

  it('לא-תקינה ⇒ null: מנוע זר · מקום ממנוע אחר · חלק בלי משפט במקום · סוג לא מתאים', () => {
    expect(validCapability({ ...TURNS, engine: 'nope' })).toBeNull();
    expect(validCapability({ ...TURNS, engine: 'zmanim' })).toBeNull();
    expect(validCapability({ ...TURNS, atom: 'merge' })).toBeNull();
    expect(validCapability({ ...TURNS, place: 'bookings.guests', atom: 'divide' })).toBeNull();
    expect(validCapability(null)).toBeNull();
  });

  it('פרמטרים: מחוץ לטווח / בחירה זרה ⇒ ברירת-המחדל', () => {
    const divide = atomCard('divide')!;
    expect(cleanParams(divide, { parts: 0, by: 'zz', gap: -3 })).toEqual({ by: 'parts', parts: 12, size: 30, gap: 0, remainder: 'drop' });
    expect(cleanParams(atomCard('fuzzy')!, { maxTypos: 5 })).toEqual({ maxTypos: 1 });
  });

  it('שמות: מזהה-המקום האמיתי ⇒ "מנוע תורים"; שם ריק ⇒ המוצע; תווית-לוג', () => {
    expect(suggestedName('bookings.turnover', 'divide')).toBe('מנוע תורים');
    expect(suggestedName('bookings.guests', 'fuzzy')).toBe('מנוע חיפוש עם טעויות · שמות האורחים');
    expect(placeShort('zmanim.day')).toBe('היום מהנץ עד השקיעה');
    expect(validCapability({ ...TURNS, name: '   ' })!.name).toBe('מנוע תורים');
    expect(capabilityLabel(TURNS)).toBe('מנוע תורים (מנהל ההזמנות · חלון הניקיון · ✂️ חלוקה)');
  });

  it('with/without: הוספה · עדכון (אותו id) · זהה ⇒ null · כפילויות ברשימה השמורה ⇒ הראשונה נשארת', () => {
    const a = withCapability(undefined, TURNS)!;
    expect(a.updated).toBe(false);
    expect(a.list).toHaveLength(1);
    expect(withCapability(a.list, TURNS)).toBeNull();
    const b = withCapability(a.list, { ...TURNS, params: { ...TURNS.params, size: 30 } })!;
    expect(b.updated).toBe(true);
    expect(b.list[0].params.size).toBe(30);
    expect(withoutCapability(b.list, 'nope')).toBeNull();
    expect(withoutCapability(b.list, TURNS.id)!.list).toEqual([]);
    expect(sanitizeCapabilities([TURNS, { ...TURNS, name: 'שני' }, 'x'])).toHaveLength(1);
  });
});

/* ═══════════════ (ג) store ═══════════════ */

describe('🧬 (ג) createCapability / removeCapability', () => {
  const st = () => useApp.getState();
  const audit = () => st().db.audit ?? [];
  afterEach(() => restoreStore());

  it('יצירה ⇒ db.ui.capabilities + שורת-לוג "מנוע חדש"; עדכון ⇒ "עדכון מנוע"; זהה ⇒ false; הסרה ⇒ "הסרת מנוע"', async () => {
    setupStore(cfgWith({ hosting: true }), fixtureDb({ audit: [] }));
    expect(await st().createCapability(TURNS)).toBe(true);
    expect(st().db.ui.capabilities).toEqual([validCapability(TURNS)]);
    expect(audit().map((a) => [a.act, a.what])).toEqual([['מנוע חדש', 'מנוע תורים (מנהל ההזמנות · חלון הניקיון · ✂️ חלוקה)']]);
    expect(await st().createCapability(TURNS)).toBe(false);
    expect(await st().createCapability({ ...TURNS, params: { ...TURNS.params, size: 30 } })).toBe(true);
    expect(audit().filter((a) => a.act === 'עדכון מנוע')).toHaveLength(1);
    expect(await st().removeCapability(TURNS.id)).toBe(true);
    expect(st().db.ui.capabilities).toEqual([]);
    expect(await st().removeCapability(TURNS.id)).toBe(false);
    expect(audit().filter((a) => a.act === 'הסרת מנוע').map((a) => a.what)).toEqual(['מנוע תורים (מנהל ההזמנות · חלון הניקיון · ✂️ חלוקה)']);
  });

  it('לא-תקינה ⇒ false, ה-DB לא זז', async () => {
    setupStore(cfgWith({ hosting: true }), fixtureDb({ audit: [] }));
    const before = st().db;
    expect(await st().createCapability({ ...TURNS, atom: 'merge' })).toBe(false);
    expect(await st().createCapability({ ...TURNS, place: 'nope' })).toBe(false);
    expect(st().db).toBe(before);
  });

  it('הרשאה: מורה (shell.roles) ⇒ נדחה; צוות ⇒ מותר, who = המייל', async () => {
    const roles = cfgWith({ hosting: true }, { 'shell.roles': true }, { roles: { teachers: { 't@x.co': 'tc1' } } } as Partial<OrgConfig>);
    setupStore(roles, fixtureDb({ audit: [] }), 't@x.co');
    expect(await st().createCapability(TURNS)).toBe(false);
    expect('capabilities' in st().db.ui).toBe(false);
    setupStore(roles, fixtureDb({ audit: [] }), 'staff@x.co');
    expect(await st().createCapability(TURNS)).toBe(true);
    expect(audit()[0]!.who).toBe('staff@x.co');
  });
});

/* ═══════════════ (ד) הבנדל-הראשי ═══════════════ */

describe('🧬 (ד) הבנדל-הראשי לא גורר את שכבת-החלקים', () => {
  const HEAVY = /from\s+'[^']*(?:lib\/atoms\/(?:cards|parts|engines|preview|capabilities|boxChange)|enginebox\/atoms\/source)[^']*'/;
  it('App/main/store/persist/cloud-merge: אין ייבוא סטטי של הכרטיסים, החלקים, התצוגות או המקור', () => {
    for (const [name, src] of [['App', appSrc], ['main', mainSrc], ['store', storeSrc], ['persist', persistSrc], ['cloud-merge', mergeSrc]] as const) {
      expect(src, name).not.toMatch(HEAVY);
      // מותר: capShape (צורה) ו-import type מהחוזה (נמחק בקומפילציה)
      for (const m of src.matchAll(/^import\s+(type\s+)?[^;]*from\s+'([^']*lib\/atoms\/[^']*|\.\/atoms\/[^']*)'/gm)) {
        expect(m[1] === 'type ' || m[2]!.endsWith('capShape'), name + ': ' + m[0]).toBe(true);
      }
    }
    expect(storeSrc).toContain("import('../lib/atoms/boxChange')");
    // capabilities + הכרטיסים ב-chunk עצל אחד ⇒ שם-קובץ אחד בלבד ברשימת-התלויות של ההפעלה
    expect(viteCfg).toMatch(/name: 'atoms', test: [^\n]*capabilities/);
    expect(storeSrc).toMatch(/createCapability: \(c\) => boxDo\(c, true\)/);
    expect(viteCfg).toMatch(/name: 'atoms', test: [^\n]*boxChange/);
    // links נשאר chunk משלו (בעדיפות גבוהה מ-atoms) — אחרת מסכי האירוח/פרנסה׳לע טוענים את הכרטיסים (11KB במקום 5KB, נמדד)
    expect(viteCfg).toMatch(/name: 'links', test: [^\n]*enginebox\[\\\\\/\]links\\\.ts\$\/, priority: 2/);
  });
});

/* ═══════════════ (ה) החוזה ═══════════════ */

describe('🧬 (ה) החוזה המשותף', () => {
  it('md5 קבוע', () => {
    expect(createHash('md5').update(readFileSync('src/lib/atoms/contract.ts')).digest('hex')).toBe('d1633928cab86f6d2b0e9c3f8c7de598');
  });
});
