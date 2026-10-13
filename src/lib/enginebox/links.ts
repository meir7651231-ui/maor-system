/**
 * 🧰 ארגז-המנועים — החיבורים (BUILD-ORDER-ENGINEBOX-2026-10-13): מי מחובר למי.
 *
 * חיבור = מפתח `${נותן}>${מחבר}>${מקבל}` (מזהי-חלקים וסוג-מחבר מהתקן). חיבור **תקין** רק כשהצד הזכרי והצד הנקבי
 * שניהם חיים, באותו סוג-מחבר, ובשני כלים שונים (חיווט בתוך כלי אחד הוא פנימי — לא "חיבור" שהלקוח בוחר).
 *
 *   · DEFAULT_LINKS — בדיוק החיבורים שחווטו היום בקוד בין הכלים (כל אחד מאומת file:line בדוח-הסגירה).
 *   · sanitizeLinks — חיטוי רשימה שמורה: רק חיבורים תקינים · בלי כפילויות · מיון יציב · תקרה 500; לא-מערך ⇒ undefined.
 *   · effectiveLinks — הרשימה שבתוקף: חסר ⇒ ברירת-המחדל; קיים (גם []) ⇒ הרשימה המחוטאת.
 *   · healEngineLinksIn — ריפוי `ui.engineLinks` ב-migrate ובמיזוג-הענן: חסר נשאר חסר, תקין ⇒ אותה הפניה.
 *
 * שלב א׳: הרשימה **רק מתארת** — היא עוד לא מדליקה/מכבה דבר בכלים (החיבורים של היום קשיחים בקוד). את המתג האמיתי
 * יחבר שלב ב׳. טהור: בלי React/store/DOM/שעון. קל במכוון — נטען גם מהבנדל-הראשי (persist/cloud-merge) ולכן לא מייבא
 * את המרכזייה ולא את config.
 */
import { PARTS, partById } from './parts';
import { plugInfo } from './plugs';

/** מפתח חיבור. */
export function linkKey(giver: string, plug: string, needer: string): string {
  return giver + '>' + plug + '>' + needer;
}

/** תקרת רשימה שמורה. */
export const MAX_LINKS = 500;

/** כל החיבורים התקינים (חי⇄חי, אותו מחבר, כלים שונים) — בסדר-החלקים. */
function computeValid(): string[] {
  const out: string[] = [];
  for (const g of PARTS) {
    for (const give of g.gives) {
      if (!give.live) continue;
      for (const n of PARTS) {
        if (n.module === g.module) continue;
        for (const need of n.needs) {
          if (need.live && need.plug === give.plug) out.push(linkKey(g.id, give.plug, n.id));
        }
      }
    }
  }
  return [...new Set(out)];
}

/** כל החיבורים שאפשר לבחור היום (שני הצדדים בנויים). */
export const VALID_LINKS: readonly string[] = computeValid();
const VALID = new Set(VALID_LINKS);

/** האם המפתח הוא חיבור תקין. */
export function isValidLink(key: unknown): key is string {
  return typeof key === 'string' && VALID.has(key);
}

/** פירוק מפתח-חיבור (undefined למפתח לא-תקין). */
export function parseLink(key: string): { giver: string; plug: string; needer: string } | undefined {
  if (!isValidLink(key)) return undefined;
  const [giver, plug, needer] = key.split('>');
  return partById(giver) && partById(needer) ? { giver: giver!, plug: plug!, needer: needer! } : undefined;
}

/**
 * החיבורים שחווטו היום בקוד בין הכלים (ראיות file:line — CLOSED-ENGINEBOX-CORE-2026-10-13):
 *   זמני-השבת ⇒ כרטיס-השהייה ולשונית-השבת · המניינים ⇒ אותם שניים (כולל "📤 שליחה למשפחה") · המדריך ⇒ תקלה וניקיון ·
 *   מספרי-החירום ⇒ תקלה דחופה · מקום-פנוי ⇒ הקו · שורות-היום ⇒ שני כרטיסי "☀ תקציר היום".
 */
export const DEFAULT_LINKS: readonly string[] = [
  linkKey('pr.zmanim', 'times.shabbat', 'host.stay'),
  linkKey('pr.zmanim', 'times.shabbat', 'host.shabbat'),
  linkKey('pr.board', 'times.prayers', 'host.stay'),
  linkKey('pr.board', 'times.prayers', 'host.shabbat'),
  linkKey('pr.directory', 'pro.match', 'host.maint'),
  linkKey('pr.directory', 'pro.match', 'host.clean'),
  linkKey('pr.board', 'emergency', 'host.maint'),
  linkKey('host.units', 'availability', 'pr.phone'),
  linkKey('pr.zmanim', 'day.summary', 'host.dash'),
  linkKey('pr.board', 'day.summary', 'host.dash'),
  linkKey('host.dash', 'day.summary', 'pr.care'),
];
const DEFAULT_SET: ReadonlySet<string> = new Set(DEFAULT_LINKS);

/** חיטוי רשימה שמורה: רק חיבורים תקינים, בלי כפילויות, ממוינת, עד 500. לא-מערך ⇒ undefined. לעולם לא זורק. */
export function sanitizeLinks(x: unknown): string[] | undefined {
  if (!Array.isArray(x)) return undefined;
  const seen = new Set<string>();
  for (const k of x as unknown[]) if (isValidLink(k)) seen.add(k);
  return [...seen].sort().slice(0, MAX_LINKS);
}

/** החיבורים שבתוקף: חסר (או לא-מערך) ⇒ ברירת-המחדל; קיים — גם ריק — ⇒ הרשימה המחוטאת. */
export function effectiveLinks(stored?: readonly string[] | null): ReadonlySet<string> {
  const clean = sanitizeLinks(stored);
  return clean === undefined ? DEFAULT_SET : new Set(clean);
}

/** האם נותן⇒מחבר⇒מקבל מחובר (לפי הרשימה השמורה או ברירת-המחדל). */
export function isLinked(stored: readonly string[] | null | undefined, giver: string, plug: string, needer: string): boolean {
  return effectiveLinks(stored).has(linkKey(giver, plug, needer));
}

const sameList = (a: readonly string[], b: readonly string[]): boolean => a.length === b.length && a.every((v, i) => v === b[i]);

/**
 * ריפוי `engineLinks` בתוך אובייקט-ui (migrate · מיזוג meta מהענן). בלי המפתח / לא-אובייקט ⇒ אותו ערך (ביט-זהה);
 * רשימה תקינה וממוינת ⇒ אותה הפניה; אחרת — עותק עם הרשימה המחוטאת, או בלי המפתח כשהערך אינו מערך.
 */
export function healEngineLinksIn<T>(ui: T): T {
  if (!ui || typeof ui !== 'object' || Array.isArray(ui) || !('engineLinks' in ui)) return ui;
  const rec = ui as Record<string, unknown>;
  const cur = rec.engineLinks;
  if (cur === undefined) return ui;
  const clean = sanitizeLinks(cur);
  if (clean === undefined) {
    const out = { ...rec };
    delete out.engineLinks;
    return out as T;
  }
  if (Array.isArray(cur) && sameList(cur as readonly string[], clean)) return ui;
  return { ...rec, engineLinks: clean } as T;
}

/* ═══════════════ שלב ב׳ (ENGINEBOX-B 13.10): חיבור/ניתוק אמיתי · שורות-התקציר לפי החיבורים ═══════════════ */

/**
 * הרשימה אחרי חיבור `key`: מתחילים מהחיבורים שבתוקף (חסר ⇒ ברירת-המחדל) ומוסיפים. מפתח לא-תקין, או שכבר מחובר ⇒ null
 * (אין מה לשמור). התוצאה מחוטאת וממוינת — ערך מוכן ל-`ui.engineLinks`.
 */
export function withLink(stored: readonly string[] | null | undefined, key: string): string[] | null {
  if (!isValidLink(key)) return null;
  const cur = effectiveLinks(stored);
  if (cur.has(key)) return null;
  return sanitizeLinks([...cur, key]) ?? null;
}

/** הרשימה אחרי ניתוק `key` (חסר ⇒ מתחילים מברירת-המחדל). מפתח לא-תקין, או שלא מחובר ⇒ null. ניתוק אחרון ⇒ [] מפורש. */
export function withoutLink(stored: readonly string[] | null | undefined, key: string): string[] | null {
  if (!isValidLink(key)) return null;
  const cur = effectiveLinks(stored);
  if (!cur.has(key)) return null;
  return sanitizeLinks([...cur].filter((k) => k !== key)) ?? null;
}

/** תיאור עברי של חיבור לשורת-הלוג: "זמני היום והשבת ← כרטיס השהייה · זמני שבת". מפתח לא-תקין ⇒ המפתח עצמו. */
export function linkLabel(key: string): string {
  const l = parseLink(key);
  if (!l) return key;
  return partById(l.giver)!.name + ' ← ' + partById(l.needer)!.name + ' · ' + (plugInfo(l.plug)?.label ?? l.plug);
}

/** החלק שנותן שורות-תקציר (day.summary) דרך היכולת הזו — undefined כשאין (שירות שקט / יכולת בלי חלק-נותן). */
export function summaryGiverOf(ability: string): string | undefined {
  for (const p of PARTS) for (const g of p.gives) if (g.live && g.plug === 'day.summary' && g.via === ability) return p.id;
  return undefined;
}

/** האם לכרטיס "☀ תקציר היום" של `needer` מחובר לפחות נותן אחד (אחרת — זה רכיב חוצה-כלים שאין לו מקור ⇒ לא מוצג). */
export function hasSummaryLink(stored: readonly string[] | null | undefined, needer: string): boolean {
  const eff = effectiveLinks(stored);
  for (const k of eff) {
    const l = parseLink(k);
    if (l && l.plug === 'day.summary' && l.needer === needer) return true;
  }
  return false;
}

/**
 * שורות-התקציר שמותר להציג בכרטיס של `needer` (מודול `self`): שורות הכלי עצמו — תמיד (התנהגות מקומית); שורת כלי אחר —
 * רק כשהחלק שנותן אותה מחובר ל-`needer` ב-day.summary. שורה זרה בלי חלק-נותן ⇒ לא מוצגת. חסר ⇒ ברירת-המחדל ⇒ כמו היום.
 */
export function linkedSummaryLines<L extends { readonly ability: string; readonly module: string }>(lines: readonly L[], stored: readonly string[] | null | undefined, self: string, needer: string): L[] {
  const eff = effectiveLinks(stored);
  return lines.filter((l) => {
    if (l.module === self) return true;
    const g = summaryGiverOf(l.ability);
    return !!g && eff.has(linkKey(g, 'day.summary', needer));
  });
}
