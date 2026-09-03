/**
 * ratchet — לוח מעקב הטיפול (3.9.2026): מנוע/ריפוי של ayin חלקי + שער-תשלום + היגיינת-אירועים.
 *
 * 🐛 הבאגים שננעלים כאן (ביקורת-הלוח 3.9, spec+wiring+runtime):
 *  · HIGH  — הלגאסי (`legacy-main-script.js:1596 ayinOf`) יוצר ayin חלקי {stage,eyes,note,nextTalk,lastTouch}
 *            בלי names/log/answers; migrate העביר אותו כמות-שהוא ⇒ eyesTotal (a.names.reduce) קרס את
 *            **מסך-התורמים כולו** (ErrorBoundary) עוד לפני פתיחת הלוח. ריפוי ב-migrate + healRecord (ענן)
 *            + חגורה-ושלייקס במנוע (eyesTotal/ayinActionVisible/ayinAdvanceLabel/planAyinAdvance/ayinSheetRows)
 *            + curAyin ב-store.
 *  · MED   — ayin בלי stage: כפתור-חכם עם תווית ריקה, ולחיצה נפלה לענף 'answer' (answerPushed=true + אירוע
 *            "מסירה" + boardEventIds["undefined"]) — כתיבה שגויה בשקט. עכשיו: שלב לא-מוכר ⇒ 'new'.
 *  · MED   — שער-תשלום (opt-in): הלוח הציג "✓ הושלם" ואז סירב בטוסט; ו-setAyin(id, {}) החתים lastTouch
 *            ⇒ "עודכן היום" + כניסה לדוח-היומי בלי שום שינוי. עכשיו: תווית "💳 תשלום לפני הושלם",
 *            plan.blocked=true, ה-store לא נוגע בתיק.
 *  · MED   — ayinRestart שמר paid ⇒ מחזור-2 עקף את שער-התשלום; ושמר boardEventIds ⇒ revert במחזור-2
 *            מחק אירועי-לוח של מחזור-1. עכשיו: paid=false + boardEventIds={}.
 *  · LOW   — "🔁 שוב" יצר אירוע-לוח חדש בכל לחיצה בלי מעקב ⇒ כפילויות. עכשיו: boardEventIds.again מחליף.
 *  · LOW   — עמודת "{unit} היום" בדוח-היומי נפלה ל-eyesTotal (סכום-כל-הזמנים) בלי log מהיום. עכשיו: ''.
 * אינווריאנטים: additive · תומכ/ת בלי ayin נשאר/ת בלי המפתח · migrate אידמפוטנטי · well-formed ביט-זהה.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  ayinActionVisible,
  ayinAdvanceLabel,
  ayinDailyRows,
  ayinSheetRows,
  eyesTotal,
  planAyinAdvance,
} from '../ayin';
import { sanitizeIncoming } from '../cloud-merge';
import { migrate } from '../../store/persist';
import { useApp } from '../../store/useApp';
import { emptyAyin, emptyDb } from '../../types/domain';
import type { AyinCase, Db, Supporter } from '../../types/domain';
import { DEFAULT_CONFIG, type OrgConfig } from '../../types/config';

const TODAY = '2026-09-03';

function supOf(over: Partial<Supporter> = {}): Supporter {
  return {
    id: 'sp1', name: 'כהן', phone: '050', email: '', address: '', idNum: '', cat: '', forWho: '',
    notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [],
    ...over,
  } as Supporter;
}

/** ayin בצורת-הלגאסי (ayinOf) — בלי names/log/answers. */
const legacyAyin = (over: Record<string, unknown> = {}) => ({ stage: 'lead', eyes: 0, note: '', nextTalk: '', lastTouch: '', ...over }) as unknown as AyinCase;
const emptyObjAyin = () => ({}) as unknown as AyinCase;

const cfg = (features: Record<string, boolean> = {}): OrgConfig => ({ ...DEFAULT_CONFIG, features } as OrgConfig);
const PAYGATE = { 'supporters.ayin.paygate': true };

describe('🩹 migrate — ריפוי ayin חלקי בנקודת-הכניסה', () => {
  const dbOf = (sups: Supporter[]): Db => ({ ...emptyDb(), supporters: sups });

  it('{stage:"lead"} מהלגאסי ⇒ names/log/answers מערכים + השלב נשמר', () => {
    const out = migrate(dbOf([supOf({ ayin: legacyAyin() })]))!;
    const a = out.supporters[0].ayin!;
    expect(a.stage).toBe('lead');
    expect(Array.isArray(a.names)).toBe(true);
    expect(Array.isArray(a.log)).toBe(true);
    expect(Array.isArray(a.answers)).toBe(true);
    expect(a.lastTouch).toBe('');
  });

  it('ayin={} ⇒ שלב "new"; שלב לא-מוכר ⇒ "new"', () => {
    const out = migrate(dbOf([supOf({ id: 'a', ayin: emptyObjAyin() }), supOf({ id: 'b', ayin: legacyAyin({ stage: 'bogus' }) })]))!;
    expect(out.supporters[0].ayin!.stage).toBe('new');
    expect(out.supporters[1].ayin!.stage).toBe('new');
  });

  it('שדות קיימים גוברים על emptyAyin (השלב/הערה/nextTalk לא נדרסים)', () => {
    const out = migrate(dbOf([supOf({ ayin: legacyAyin({ stage: 'eyes', note: 'הערה', nextTalk: '2026-09-10', lastTouch: TODAY }) })]))!;
    const a = out.supporters[0].ayin!;
    expect(a.stage).toBe('eyes');
    expect(a.note).toBe('הערה');
    expect(a.nextTalk).toBe('2026-09-10');
    expect(a.lastTouch).toBe(TODAY);
  });

  it('תומכ/ת בלי ayin נשאר/ת בלי המפתח (לא מוסיפים)', () => {
    const out = migrate(dbOf([supOf()]))!;
    expect('ayin' in out.supporters[0]).toBe(false);
    expect(out.supporters[0].ayin).toBeUndefined();
  });

  it('אידמפוטנטי — הרצה שנייה לא משנה כלום', () => {
    const x = dbOf([supOf({ id: 'a', ayin: legacyAyin() }), supOf({ id: 'b', ayin: emptyObjAyin() }), supOf({ id: 'c' })]);
    const once = migrate(x)!;
    const twice = migrate(once)!;
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });

  it('ayin מלא (well-formed) ⇒ ביט-זהה', () => {
    const full: AyinCase = { ...emptyAyin(), stage: 'answer', answerPushed: true, paid: true, names: [{ id: 'n1', name: 'א', eyes: 3, done: false }] };
    const out = migrate(dbOf([supOf({ ayin: full })]))!;
    expect(JSON.stringify(out.supporters[0].ayin)).toBe(JSON.stringify(full));
  });
});

describe('☁️ healRecord (sanitizeIncoming) — ayin חלקי מהענן', () => {
  it('well-formed ⇒ אותה הפניה (no-op, מונע לולאת-הד)', () => {
    const item = { id: 's1', name: 'כהן', donations: [], ayin: { ...emptyAyin(), stage: 'lead' } } as unknown as Record<string, unknown>;
    expect(sanitizeIncoming('supporters', item)).toBe(item);
  });
  it('בלי ayin ⇒ אותה הפניה, המפתח לא נוסף', () => {
    const item = { id: 's1', name: 'כהן', donations: [] } as unknown as Record<string, unknown>;
    const out = sanitizeIncoming('supporters', item);
    expect(out).toBe(item);
    expect('ayin' in out).toBe(false);
  });
  it('ayin חלקי ⇒ מערכים + שלב נשמר; שלב לא-מוכר ⇒ "new"', () => {
    const a = sanitizeIncoming('supporters', { id: 's1', donations: [], ayin: { stage: 'lead' } }).ayin as AyinCase;
    expect(a.stage).toBe('lead');
    expect(a.names).toEqual([]);
    expect(a.log).toEqual([]);
    expect(a.answers).toEqual([]);
    const b = sanitizeIncoming('supporters', { id: 's1', donations: [], ayin: { stage: 'zzz', names: [], log: [], answers: [] } }).ayin as AyinCase;
    expect(b.stage).toBe('new');
  });
});

describe('🛡️ מנוע — לא קורס על ayin חלקי / בלי שלב', () => {
  for (const [label, mk] of [['{stage:"lead"}', legacyAyin], ['{}', emptyObjAyin]] as const) {
    it(`${label}: eyesTotal/ayinActionVisible/ayinAdvanceLabel/planAyinAdvance/ayinSheetRows לא זורקים`, () => {
      const a = mk();
      expect(() => eyesTotal(a)).not.toThrow();
      expect(eyesTotal(a)).toBe(0);
      expect(() => ayinActionVisible(a)).not.toThrow();
      expect(() => ayinAdvanceLabel(cfg(), a)).not.toThrow();
      expect(() => planAyinAdvance(cfg(), 'כהן', a)).not.toThrow();
      expect(() => ayinSheetRows([supOf({ ayin: a })])).not.toThrow();
      expect(ayinSheetRows([supOf({ ayin: a })])).toHaveLength(1); // כותרת בלבד — אין שמות
    });
  }

  it('בלי שלב ⇒ מתנהג כ-"new": תווית לא-ריקה, ומעבר = new→lead (לא ענף answer)', () => {
    const a = { names: [{ id: 'n1', name: 'א', eyes: '', done: false }] } as unknown as AyinCase;
    expect(ayinAdvanceLabel(cfg(), a)).not.toBe('');
    expect(ayinAdvanceLabel(cfg(), a)).toContain('בהכנה');
    const plan = planAyinAdvance(cfg(), 'כהן', a)!;
    expect(plan.patch).toEqual({ stage: 'lead' });
    expect(plan.patch.answerPushed).toBeUndefined();
  });

  it('בלי שלב ובלי שמות ⇒ אין פעולה (כמו new ריק)', () => {
    expect(ayinActionVisible(emptyObjAyin())).toBe(false);
    expect(planAyinAdvance(cfg(), 'כהן', emptyObjAyin())).toBeNull();
  });
});

describe('💳 שער-תשלום — תווית כנה + חסימה מפורשת', () => {
  const pushed = (over: Partial<AyinCase> = {}): AyinCase =>
    ({ ...emptyAyin(), stage: 'answer', answerPushed: true, names: [{ id: 'n', name: 'א', eyes: 1, done: true }], ...over });

  it('דגל דלוק + נדחף + לא-שולם ⇒ "💳 תשלום לפני הושלם"', () => {
    expect(ayinAdvanceLabel(cfg(PAYGATE), pushed({ paid: false }))).toBe('💳 תשלום לפני הושלם');
  });
  it('שולם ⇒ "✓ הושלם"; דגל כבוי ⇒ "✓ הושלם" (ביט-זהה)', () => {
    expect(ayinAdvanceLabel(cfg(PAYGATE), pushed({ paid: true }))).toBe('✓ הושלם');
    expect(ayinAdvanceLabel(cfg(), pushed({ paid: false }))).toBe('✓ הושלם');
  });
  it('planAyinAdvance חסום ⇒ blocked===true, patch ריק, בלי אירוע', () => {
    const plan = planAyinAdvance(cfg(PAYGATE), 'כהן', pushed({ paid: false }))!;
    expect(plan.blocked).toBe(true);
    expect(plan.patch).toEqual({});
    expect(plan.event).toBeNull();
  });
  it('לא-חסום ⇒ blocked לא מסומן', () => {
    expect(planAyinAdvance(cfg(PAYGATE), 'כהן', pushed({ paid: true }))!.blocked).toBeUndefined();
    expect(planAyinAdvance(cfg(), 'כהן', pushed({ paid: false }))!.blocked).toBeUndefined();
  });
});

describe('📋 דוח-יומי — עמודת "היום" ריקה בלי log מהיום', () => {
  it('lastTouch=היום, שמות עם מונים, בלי log ⇒ העמודה "" (לא סכום-כל-הזמנים)', () => {
    const sp = supOf({ ayin: { ...emptyAyin(), stage: 'eyes', lastTouch: TODAY, names: [{ id: 'n', name: 'א', eyes: 5, done: false }] } });
    const rows = ayinDailyRows(cfg(), [sp], TODAY);
    expect(rows).toHaveLength(2);
    expect(rows[1][2]).toBe('');
  });
  it('log מהיום ⇒ סכום היום בלבד (ללא שינוי)', () => {
    const sp = supOf({ ayin: { ...emptyAyin(), lastTouch: TODAY, names: [{ id: 'n', name: 'א', eyes: 12, done: false }], log: [{ date: TODAY, eyes: 7 }] } });
    expect(ayinDailyRows(cfg(), [sp], TODAY)[1][2]).toBe(7);
  });
});

describe('🏪 store — חסימה/מחזור-חדש/🔁 שוב', () => {
  const st = () => useApp.getState();
  const ayin = () => st().db.supporters[0].ayin!;
  const seed = (a: AyinCase, features: Record<string, boolean> = {}) => {
    useApp.setState({ config: { ...DEFAULT_CONFIG, features } } as never);
    st().setDb(() => ({ ...emptyDb(), supporters: [supOf({ ayin: a })] }) as Partial<Db>);
  };

  beforeEach(() => {
    useApp.setState({ config: { ...DEFAULT_CONFIG, features: {} } } as never);
  });

  it('advance חסום בשער ⇒ lastTouch לא מוחתם, השלב נשאר, אין אירוע', () => {
    seed({ ...emptyAyin(), stage: 'answer', answerPushed: true, paid: false, lastTouch: '2026-01-01', names: [{ id: 'n', name: 'א', eyes: 1, done: true }] }, PAYGATE);
    st().ayinAdvance('sp1');
    expect(ayin().lastTouch).toBe('2026-01-01');
    expect(ayin().stage).toBe('answer');
    expect(st().db.events).toHaveLength(0);
  });

  it('advance על ayin לגאסי {stage:"lead"} (בלי migrate) לא קורס ומתקדם ל-eyes', () => {
    seed(legacyAyin());
    expect(() => st().ayinAdvance('sp1')).not.toThrow();
    expect(ayin().stage).toBe('eyes');
  });

  it('ayinRestart ⇒ paid=false ו-boardEventIds={} ; log/answers נשמרים', () => {
    seed({ ...emptyAyin(), stage: 'done', paid: true, boardEventIds: { new: 'ev1', lead: 'ev2' }, log: [{ date: TODAY, eyes: 2 }], answers: [{ date: TODAY, note: 'תשובה' }] });
    st().ayinRestart('sp1');
    expect(ayin().stage).toBe('new');
    expect(ayin().paid).toBe(false);
    expect(ayin().boardEventIds).toEqual({});
    expect(ayin().log).toHaveLength(1);
    expect(ayin().answers).toHaveLength(1);
  });

  it('שתי לחיצות "🔁 שוב" ⇒ אירוע "לדבר שוב" אחד בדיוק, ומזהו ב-boardEventIds.again', () => {
    seed({ ...emptyAyin(), stage: 'eyes', nextTalk: '2026-09-10' });
    st().ayinCallAgain('sp1');
    st().ayinCallAgain('sp1');
    const again = st().db.events.filter((e) => e.spId === 'sp1' && e.title.includes('לדבר שוב'));
    expect(again).toHaveLength(1);
    expect(ayin().boardEventIds?.again).toBe(again[0].id);
  });
});
