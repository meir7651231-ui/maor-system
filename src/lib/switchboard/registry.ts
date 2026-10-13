/**
 * 🔌 המרכזייה — הרישום (BUILD-ORDER-SWITCHBOARD-2026-10-13): מי מציע מה, ואיך שואלים.
 *
 * `REGISTRY` = **שורה אחת לכל כלי**: מודול-הספק · אוספי-ה-DB שהספק קורא · היכולות (מזהה ⇒ תווית עברית + תת-דגל
 * אופציונלי) · `load` — הספק עצמו ב-`import()` דינמי. הטיפוסים (`AbilityId`/`InputOf`/`OutputOf`) נגזרים מקובץ-הספק
 * (`typeof import(...)` — חינם בזמן-ריצה), כך שכלי חדש מצטרף בקובץ-ספק אחד + שורה אחת כאן.
 *
 *   · `listAbilities(config)` — רק יכולות שמודול-הספק שלהן דלוק (moduleOn ⇒ moduleEnabledIn; parnasa/hosting הם opt-in —
 *     רק true מדליק) ושתת-הדגל שלהן (אם הוגדר) דלוק (featureOn).
 *   · `ask(id, ctx, input)` — תשובה מטופסת, או "לא זמין" מטופס (unknown/off/loading/error). **לעולם לא זורק.**
 *   · `loadProviders(config, ids?)` — טוען רק ספקים של יכולות זמינות (ורק את הנחוצות) — "שוקל רק מה שהדלקת".
 * הקובץ קל: בלי ספק סטטי, בלי store, בלי DOM. נצרך רק ממסכים עצלים (הבנדל-הראשי לא מייבא אותו).
 * בידוד: יכולות הן קריאה-בלבד — אין כאן כתיבה, אין כסף/קבלות/לוח-ראשי/חדרי-חוגים.
 */
import { featureOn, moduleOn } from '../config';
import type { Db } from '../../types/domain';
import type { ModuleKey, OrgConfig } from '../../types/config';
import type { AskResult, SwitchCtx, Unavailable, UnavailableReason } from './contract';

/* ═══════════════ הרישום — שורה לכל כלי (הסדר = סדר תקציר-היום) ═══════════════ */

export const REGISTRY = [
  { module: 'hosting', reads: ['hostUnits', 'hostBookings', 'hostRecords', 'ui', 'orgName'], abilities: { 'hosting.today': { label: 'האירוח היום' }, 'hosting.availability': { label: 'בדיקת יחידת אירוח פנויה' } }, load: () => import('../../components/hosting/abilities') },
  { module: 'parnasa', reads: ['prListings', 'prPosts', 'ui'], abilities: { 'parnasa.findPro': { label: 'מציאת בעל מקצוע', flag: 'parnasa.directory' }, 'parnasa.shabbat': { label: 'זמני השבת', flag: 'parnasa.zmanim' }, 'parnasa.minyanim': { label: 'מניינים בקהילה', flag: 'parnasa.board' }, 'parnasa.emergency': { label: 'מספרי חירום', flag: 'parnasa.board' } }, load: () => import('../../components/parnasa/abilities') },
] as const satisfies readonly ProviderEntry[];

/* ═══════════════ טיפוסים ═══════════════ */

interface AbilityMeta {
  readonly label: string;
  /** תת-הדגל של הכלי שבלעדיו היכולת שותקת (featureOn) — חסר ⇒ די במודול דלוק. */
  readonly flag?: string;
}

/** צורת-יכולת אחרי "מחיקת-טיפוסים" (מה שהרישום מחזיק בזמן-ריצה). */
interface LoadedAbility {
  run(ctx: SwitchCtx, input: never): unknown;
  today?: { readonly input: unknown; lines(out: never, ctx: SwitchCtx): readonly string[] };
}

interface ProviderEntry {
  readonly module: ModuleKey;
  readonly reads: readonly (keyof Db)[];
  readonly abilities: Readonly<Record<string, AbilityMeta>>;
  readonly load: () => Promise<{ readonly abilities: Readonly<Record<string, LoadedAbility>> }>;
}

type Entry = (typeof REGISTRY)[number];
type ImplsOf<E> = E extends { load: () => Promise<infer M> } ? (M extends { abilities: infer A } ? A : never) : never;
type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
type Impls = UnionToIntersection<ImplsOf<Entry>>;

/** מזהי-היכולות — נגזרים מקובצי-הספקים. */
export type AbilityId = Extract<keyof Impls, string>;
/** הקלט של יכולת. */
export type InputOf<K extends AbilityId> = Impls[K] extends { run(ctx: SwitchCtx, input: infer I): unknown } ? I : never;
/** הפלט של יכולת. */
export type OutputOf<K extends AbilityId> = Impls[K] extends { run(ctx: SwitchCtx, input: never): infer O } ? O : never;
/** חתימת `ask` — לצרכנים שמקבלים אותה בהזרקה (מודל-הקו). */
export type AskFn = <K extends AbilityId>(id: K, ctx: SwitchCtx, input: InputOf<K>) => AskResult<OutputOf<K>>;

export interface AbilityInfo {
  readonly id: AbilityId;
  readonly module: ModuleKey;
  readonly label: string;
  readonly flag: string | null;
}

/* ═══════════════ הקטלוג והזמינות ═══════════════ */

const CATALOG: readonly AbilityInfo[] = (REGISTRY as readonly ProviderEntry[]).flatMap((e) =>
  Object.entries(e.abilities).map(([id, m]) => ({ id: id as AbilityId, module: e.module, label: m.label, flag: m.flag ?? null })),
);
const BY_ID = new Map<string, AbilityInfo>(CATALOG.map((a) => [a.id, a]));

/**
 * מודול-הספק דלוק (העוזר הקיים — opt-in: רק true) ∧ הדגל דלוק בשרשור-האבות של featureOn: תת-הדגל של היכולת, ובלעדיו —
 * דגל-הכלי עצמו (features['hosting'] = false משתיק גם יכולת בלי תת-דגל).
 */
function availableIn(a: AbilityInfo, config: OrgConfig): boolean {
  return moduleOn(config, a.module) && featureOn(config, a.flag ?? a.module);
}

/** כל היכולות שזמינות בקונפיג, בסדר-הרישום. קונפיג פגום ⇒ []. */
export function listAbilities(config: OrgConfig): AbilityInfo[] {
  try {
    return CATALOG.filter((a) => availableIn(a, config));
  } catch {
    return [];
  }
}

/** האם יכולת זמינה — שער סינכרוני לכפתורים (לא טוען דבר). */
export function isAvailable(id: string, config: OrgConfig): boolean {
  const a = BY_ID.get(id);
  if (!a) return false;
  try {
    return availableIn(a, config);
  } catch {
    return false;
  }
}

/** פרטי-יכולת מהרישום (תווית/מודול/דגל) — undefined למזהה זר. */
export function abilityInfo(id: string): AbilityInfo | undefined {
  return BY_ID.get(id);
}

/** אוספי-ה-DB שהספקים של היכולות האלה (הזמינות) קוראים — רשימת-הצפייה של המסך (useSwitchCtx). */
export function readsFor(config: OrgConfig, ids: readonly string[]): (keyof Db)[] {
  const mods = new Set<string>(listAbilities(config).filter((a) => ids.includes(a.id)).map((a) => a.module));
  const keys = new Set<keyof Db>();
  for (const e of REGISTRY as readonly ProviderEntry[]) if (mods.has(e.module)) for (const k of e.reads) keys.add(k);
  return [...keys];
}

/* ═══════════════ הספקים שנטענו ═══════════════ */

const installed = new Map<string, LoadedAbility>();
const installedModules = new Set<string>();
const loadingModules = new Map<string, Promise<void>>();
const failedModules = new Map<string, string>();
let version = 0;
const listeners = new Set<() => void>();

function bump(): void {
  version++;
  for (const l of listeners) {
    try {
      l();
    } catch {
      /* מאזין שנכשל לא מפיל את המרכזייה */
    }
  }
}

/** מנוי לשינויי-המרכזייה (ספק נטען/נכשל) — ל-useSyncExternalStore. */
export function subscribeSwitchboard(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** מונה-גרסה: עולה בכל טעינה/כשל של ספק. */
export function switchboardVersion(): number {
  return version;
}

/** האם הספק של המודול נטען. */
export function providerLoaded(module: string): boolean {
  return installedModules.has(module);
}

/** התקנת ספק (מ-loadProviders, ומבדיקות): רק מזהים שרשומים **לאותו מודול** נכנסים. */
export function installProvider(module: string, abilities: Readonly<Record<string, LoadedAbility>>): void {
  for (const [id, a] of Object.entries(abilities)) {
    const info = BY_ID.get(id);
    if (info && info.module === module && a && typeof a.run === 'function') installed.set(id, a);
  }
  installedModules.add(module);
  failedModules.delete(module);
  bump();
}

/** בדיקות בלבד — "שום ספק לא נטען". */
export function resetSwitchboard(): void {
  installed.clear();
  installedModules.clear();
  loadingModules.clear();
  failedModules.clear();
  bump();
}

function loadEntry(e: ProviderEntry): Promise<void> {
  const cur = loadingModules.get(e.module);
  if (cur) return cur;
  const p = Promise.resolve()
    .then(() => e.load())
    .then(
      (m) => installProvider(e.module, m.abilities),
      (err: unknown) => {
        failedModules.set(e.module, err instanceof Error ? err.message : String(err));
        bump();
      },
    )
    .finally(() => {
      loadingModules.delete(e.module);
    });
  loadingModules.set(e.module, p);
  return p;
}

/**
 * טעינת ספקים (עצל, אידמפוטנטי): רק מודולים שיש להם יכולת **זמינה** — ואם ניתנו ids, רק מה שנחוץ להן. כשל-טעינה נרשם
 * (ask ⇒ 'error') ומנוסה שוב בקריאה הבאה. לעולם לא נדחה.
 */
export function loadProviders(config: OrgConfig, ids?: readonly string[]): Promise<void> {
  const mods = new Set<string>(listAbilities(config).filter((a) => !ids || ids.includes(a.id)).map((a) => a.module));
  const jobs: Promise<void>[] = [];
  for (const e of REGISTRY as readonly ProviderEntry[]) if (mods.has(e.module) && !installedModules.has(e.module)) jobs.push(loadEntry(e));
  return Promise.all(jobs).then(() => undefined);
}

/* ═══════════════ ask ═══════════════ */

function unavailable(id: string, reason: UnavailableReason, message: string): Unavailable {
  return { ok: false, unavailable: true, id, reason, message };
}

/**
 * שאלה לכלי אחר. סדר: מזהה מוכר ⇒ זמין בקונפיג (מודול + תת-דגל) ⇒ הספק נטען ⇒ ריצה. כל חריגה (ctx פגום, ספק שזרק)
 * ⇒ 'error' — **לעולם לא זורק**.
 */
export function ask<K extends AbilityId>(id: K, ctx: SwitchCtx, input: InputOf<K>): AskResult<OutputOf<K>> {
  const info = BY_ID.get(id);
  if (!info) return unavailable(String(id), 'unknown', 'יכולת לא מוכרת במרכזייה');
  try {
    if (!availableIn(info, ctx.config)) return unavailable(info.id, 'off', info.label + ' — הכלי כבוי');
    const a = installed.get(info.id);
    if (!a) {
      const err = failedModules.get(info.module);
      return err === undefined ? unavailable(info.id, 'loading', info.label + ' — נטען') : unavailable(info.id, 'error', info.label + ' — הטעינה נכשלה');
    }
    return { ok: true, id: info.id, module: info.module, label: info.label, value: a.run(ctx, input as never) as OutputOf<K> };
  } catch {
    return unavailable(info.id, 'error', info.label + ' — שגיאה בשאלה');
  }
}

/** מנסח תקציר-היום של יכולת שנטענה (או undefined) — ל-todaySummary. */
export function todayHook(id: string): LoadedAbility['today'] {
  return installed.get(id)?.today;
}
