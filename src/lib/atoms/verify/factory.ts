/**
 * 🏭 המפעל — מנוע אחד שמפרק, מחבר, מאמת ומכניס לארגז רק מה שעבר (ATOMS-FACTORY, 14.10.2026).
 *
 * "למה זה לא מנוע, לא סוכן, שמפרק מחבר ומאמת? … מנוע עדיף על נחיל." — קוד דטרמיניסטי אחד, בלי AI ובלי סוכנים:
 *  (א) המפרק (`scripts/atoms-decompose.mjs`) כבר כתב את `engines/generated/*` — כאן הם נרשמים (registry).
 *  (ב) מחבר: לכל מנוע (יד + שנמצא) — כל מקום × כל חלק מאותו סוג, וכל שרשרת דרך `outputKind` (`connectionTargets`).
 *  (ג) מאמת: כל החיבורים על DB-הבדיקה + ארגונים אקראיים + הדמו + עולמות מטולטלים (`verifyConnections`), וכל שמונת החלקים מול
 *      החוקים שלהם (`verifyAtoms`). חיבור **מאומת** = כל הבדיקות שלו עברו · הוא הראה תוצאה לפחות בעולם אחד · וכל החלקים
 *      שבו עברו את כל החוקים. HONEST_NULLS אף פעם לא מאומתים (אין להם תצוגה ⇒ הם לא ברשימה בכלל).
 *  (ד) הסיכום (`renderVerified`) — קובץ סטטי שהארגז קורא; רק מה שבו מוצג.
 *  (ה) הדוח — טבלה לכל מנוע: מקומות, אפשרויות, מאומתים, נדחו + הסיבה.
 * טהור ודטרמיניסטי (זרע; בלי שעון ובלי Math.random). לא נכנס לבנדל — רק הסקריפט והבדיקות.
 */
import type { Db } from '../../../types/domain';
import type { AtomId } from '../contract';
import { ENGINE_CARDS } from '../engines';
import { generatedCards, registerGenerated } from '../engines/registry';
import type { GenEngine } from '../decompose/types';
import type { PreviewCtx } from '../preview';
import type { OrgSecrets } from './gen';
import { connectionTargets, DEFAULT_SEED, verifyAtoms, verifyConnections, type ConnReport } from './run';

export interface FactoryOpts {
  generated: readonly GenEngine[];
  /** DB-הבדיקה (previewsFixture) ו"עכשיו" שלו. */
  fixture: PreviewCtx;
  fixtureSecrets?: Partial<OrgSecrets>;
  /** הדמו הציבורי. */
  demo: { db: Partial<Db>; nowMs: number };
  seed?: number;
  /** קלטים אקראיים לכל חלק. */
  n?: number;
  /** ארגונים אקראיים מעל DB-הבדיקה (לחיבורי-היד). */
  dbs?: number;
  /** כמה מהם גם לחיבורים שנמצאו. */
  genDbs?: number;
  /** עולמות מטולטלים מהדמו. */
  demoDbs?: number;
}

export interface Rejected {
  key: string;
  why: string;
}

export interface EngineRow {
  id: string;
  name: string;
  emoji: string;
  /** נמצא אוטומטית (המפרק) או נבנה ביד. */
  generated: boolean;
  places: number;
  /** מקום × חלק. */
  options: number;
  chains: number;
  verified: number;
  verifiedChains: number;
  rejected: number;
}

export interface FactoryResult {
  seed: number;
  opts: { n: number; dbs: number; genDbs: number; demoDbs: number };
  atoms: Record<string, { cases: number; passed: number; law?: string; why?: string }>;
  /** מפתח ⇒ כמה בדיקות עברו (רק המאומתים). */
  verified: Record<string, number>;
  rejected: Rejected[];
  engines: EngineRow[];
  totals: { targets: number; verified: number; rejected: number; checks: number };
}

/** כל הבדיקות עברו · הראה תוצאה לפחות פעם אחת · כל החלקים שבו עברו את כל החוקים. אחרת — למה לא. */
function verdict(r: ConnReport | undefined, atoms: readonly AtomId[], atomOk: (a: AtomId) => boolean): string | null {
  if (!r || r.checks === 0) return 'לא נבדק';
  if (r.passed !== r.checks) return r.failures[0] ? r.failures[0].db + ' — ' + r.failures[0].why : 'בדיקה נכשלה';
  if (r.shown === 0) return 'אין תוצאה אמיתית באף עולם (' + r.evals + ' הערכות) — אין מה להראות';
  const bad = atoms.find((a) => !atomOk(a));
  return bad ? 'החלק ' + bad + ' נכשל בחוק שלו' : null;
}

export function runFactory(o: FactoryOpts): FactoryResult {
  const seed = o.seed ?? DEFAULT_SEED;
  const n = o.n ?? 2000;
  const dbs = o.dbs ?? 50;
  const genDbs = o.genDbs ?? 8;
  const demoDbs = o.demoDbs ?? 12;
  registerGenerated(o.generated);
  const atomRep = verifyAtoms({ n, seed });
  const atoms: FactoryResult['atoms'] = {};
  for (const [k, v] of Object.entries(atomRep)) atoms[k] = { cases: v.cases, passed: v.passed, ...(v.counterexample ? { law: v.counterexample.law, why: v.counterexample.why } : {}) };
  const atomOk = (a: AtomId): boolean => !!atoms[a] && atoms[a].cases > 0 && atoms[a].passed === atoms[a].cases;

  const targets = connectionTargets();
  const conns = verifyConnections(o.fixture, { dbs, seed, paramSets: 2, secrets: o.fixtureSecrets, demo: o.demo, demoDbs, genDbs, genParamSets: 1 });

  const verified: Record<string, number> = {};
  const rejected: Rejected[] = [];
  let checks = 0;
  for (const t of targets) {
    const r = conns[t.key];
    checks += r?.checks ?? 0;
    const why = verdict(r, t.atoms, atomOk);
    if (why) rejected.push({ key: t.key, why });
    else verified[t.key] = r.passed;
  }

  const engineOf = (key: string): string => {
    // שרשרת: "<מנוע>:<מקום>:<חלק>>…" · ישיר: "<מקום>:<חלק>" — המנוע = הקידומת של המקום / המזהה
    const t = targets.find((x) => x.key === key);
    return t ? (t.caps[0]?.engine ?? t.cap.engine) : key.split('.')[0];
  };
  const rows: EngineRow[] = [];
  for (const e of [...ENGINE_CARDS, ...generatedCards()]) {
    const mine = targets.filter((t) => engineOf(t.key) === e.id);
    const direct = mine.filter((t) => !t.caps.length);
    const chains = mine.filter((t) => t.caps.length);
    rows.push({
      id: e.id,
      name: e.name,
      emoji: e.emoji,
      generated: !ENGINE_CARDS.includes(e),
      places: e.places.length,
      options: direct.length,
      chains: chains.length,
      verified: direct.filter((t) => t.key in verified).length,
      verifiedChains: chains.filter((t) => t.key in verified).length,
      rejected: mine.filter((t) => !(t.key in verified)).length,
    });
  }
  return {
    seed,
    opts: { n, dbs, genDbs, demoDbs },
    atoms,
    verified,
    rejected,
    engines: rows,
    totals: { targets: targets.length, verified: Object.keys(verified).length, rejected: rejected.length, checks },
  };
}

const HEADER = 'נוצר אוטומטית ע״י המפעל — לא לערוך ידנית. להרצה מחדש: npm run atoms:factory';

/** המנועים שנמצאו אוטומטית שיש להם לפחות חיבור מאומת אחד (בסדר הטבלה). */
export function verifiedEngines(res: FactoryResult): string[] {
  return res.engines.filter((e) => e.generated && e.verified > 0).map((e) => e.id);
}

/** הקובץ הסטטי שהארגז קורא (עצל): מפתח-חיבור ⇒ מספר הבדיקות שעברו. דטרמיניסטי — מפתחות ממוינים. */
export function renderVerified(res: FactoryResult): string {
  const keys = Object.keys(res.verified).sort();
  const body = keys.map((k) => '  ' + JSON.stringify(k) + ': ' + res.verified[k] + ',').join('\n');
  return [
    '/**',
    ' * ✅ סיכום האימות של ארגז המנועים — ' + HEADER,
    ' * רק חיבור שכל הבדיקות שלו עברו, שהראה תוצאה אמיתית, ושכל החלקים שבו עברו את כל החוקים — מוצג בארגז ("✅ מאומת").',
    ' * זרע ' + res.seed + ' · ' + res.opts.n + ' קלטים לכל חלק · DB-הבדיקה + ' + res.opts.dbs + ' ארגונים אקראיים · הדמו + ' + res.opts.demoDbs + ' עולמות מטולטלים.',
    ' * ' + res.totals.verified + ' מאומתים מתוך ' + res.totals.targets + ' חיבורים (' + res.totals.rejected + ' נדחו — הסיבות ב-knowledge/FACTORY-LAST-RUN.md).',
    ' */',
    '',
    '/** המנועים שנמצאו אוטומטית ויש להם לפחות חיבור מאומת אחד — רק אותם הארגז טוען. */',
    'export const VERIFIED_ENGINES: readonly string[] = ' + JSON.stringify(verifiedEngines(res)) + ';',
    '',
    '/** חיבור (מקום:חלק, או מזהה-השרשרת) ⇒ כמה בדיקות עברו. */',
    'export const VERIFIED: Readonly<Record<string, number>> = {',
    body,
    '};',
    '',
  ].join('\n');
}

const pad = (s: string | number, w: number): string => String(s) + ' '.repeat(Math.max(0, w - [...String(s)].length));

/** הטבלה (למסוף ולדוח). */
export function factoryTable(res: FactoryResult): string[] {
  const lines = [pad('מנוע', 26) + pad('מקומות', 8) + pad('אפשרויות', 10) + pad('שרשראות', 9) + pad('מאומתים', 9) + pad('שרשראות ✓', 11) + 'נדחו'];
  for (const e of res.engines) lines.push(pad(e.emoji + ' ' + e.name + (e.generated ? ' 🔨' : ''), 26) + pad(e.places, 8) + pad(e.options, 10) + pad(e.chains, 9) + pad(e.verified, 9) + pad(e.verifiedChains, 11) + e.rejected);
  return lines;
}

/** סיבות הדחייה מקובצות (סיבה ⇒ מפתחות), בסדר יציב. */
export function rejectedByReason(res: FactoryResult): { reason: string; keys: string[] }[] {
  const m = new Map<string, string[]>();
  for (const r of res.rejected) {
    const reason = r.why.replace(/^(DB-הבדיקה|האמיתי|הדמו|אקראי #\d+|דמו מטולטל #\d+) — /, '').replace(/:.*$/, '');
    const list = m.get(reason) ?? [];
    list.push(r.key);
    m.set(reason, list);
  }
  return [...m.entries()].map(([reason, keys]) => ({ reason, keys })).sort((a, b) => b.keys.length - a.keys.length || (a.reason < b.reason ? -1 : 1));
}

/** הדוח (knowledge/FACTORY-LAST-RUN.md) — דטרמיניסטי: בלי שעון ובלי זמני-ריצה. */
export function renderReport(res: FactoryResult): string {
  const atomRows = Object.entries(res.atoms).map(([k, v]) => '| ' + k + ' | ' + v.passed + '/' + v.cases + ' | ' + (v.passed === v.cases ? '✅' : '❌ ' + (v.law ?? '') + ' — ' + (v.why ?? '')) + ' |');
  const eng = res.engines.map((e) => '| ' + e.emoji + ' ' + e.name + (e.generated ? ' 🔨' : '') + ' | ' + e.places + ' | ' + e.options + ' | ' + e.chains + ' | ' + e.verified + ' | ' + e.verifiedChains + ' | ' + e.rejected + ' |');
  const reasons = rejectedByReason(res).map((r) => '| ' + r.reason + ' | ' + r.keys.length + ' | ' + r.keys.slice(0, 4).map((k) => '`' + k + '`').join(' · ') + (r.keys.length > 4 ? ' · …' : '') + ' |');
  return [
    '# 🏭 המפעל — הריצה האחרונה',
    '',
    '> ' + HEADER + ' · זרע ' + res.seed + ' · ' + res.opts.n + ' קלטים לכל חלק · DB-הבדיקה + ' + res.opts.dbs + ' ארגונים אקראיים (' + res.opts.genDbs + ' מהם גם למנועים שנמצאו) · הדמו + ' + res.opts.demoDbs + ' עולמות מטולטלים.',
    '',
    '**' + res.totals.verified + ' חיבורים מאומתים** מתוך ' + res.totals.targets + ' · ' + res.totals.rejected + ' נדחו · ' + res.totals.checks.toLocaleString('en-US') + ' בדיקות.',
    '',
    '## החלקים (החוקים)',
    '| חלק | קלטים | |',
    '|---|---|---|',
    ...atomRows,
    '',
    '## המנועים',
    '| מנוע | מקומות | אפשרויות | שרשראות | מאומתים | שרשראות ✓ | נדחו |',
    '|---|---|---|---|---|---|---|',
    ...eng,
    '',
    '🔨 = נמצא אוטומטית ע״י המפרק.',
    '',
    '## למה נדחו',
    '| סיבה | כמה | דוגמאות |',
    '|---|---|---|',
    ...reasons,
    '',
  ].join('\n');
}

/** לכלים ולבדיקות: אותו גרף-מודולים (הרישום משותף) — המאמת והרישום דרך המפעל. */
export { connectionTargets, verifyConnections } from './run';
export { registerGenerated } from '../engines/registry';
export { previewOf } from '../preview';
