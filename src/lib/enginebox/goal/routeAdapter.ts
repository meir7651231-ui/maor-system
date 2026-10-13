/**
 * 🎯 ארגז-המנועים — "להתחיל מהסוף" מעל הקטלוג האמיתי (ENGINEBOX-GOAL, 13.10.2026).
 *
 * הלקוח כותב את התוצאה ("אני רוצה שאורחים יוכלו להזמין שבת גם מטלפון כשר"); המתאם מתרגם את הקטלוג של הארגון
 * (`catalogFor(config)`) לשפת מנוע-המסלול (`RoutePart[]`), מריץ את `findRoutes`, ומחזיר מסלולים בעברית פשוטה עם
 * מפתחות-חיבור תקינים במודל של הליבה (`נותן>מחבר>מקבל`) — וכנות מלאה על מה שחסר.
 *
 * חוקי-הכנות:
 *   · רק צדדים **חיים** נכנסים למסלול שאפשר להחיל. צד מתוכנן (live:false) לעולם לא מופיע בו.
 *   · יעד שאין לו נותן-חי בקטלוג ⇒ `missing` עם שורה כנה: "חסר מנוע שנותן X" (אין בכלל) · "X עוד לא זמין · בקרוב"
 *     (קיים רק כמתוכנן) · "X נמצא ב-Y, שעוד לא הודלק אצלכם" (חי, אבל הכלי כבוי בקונפיג).
 *   · חיבור = בין שני כלים שונים (כמו `VALID_LINKS`): כל צורך מקודד `תקע>המודול-שלי`, וכל נתינה מקודדת `תקע` (ליעד)
 *     ו-`תקע>מודול-אחר` לכל מודול אחר — כך מנוע-המסלול לא סוגר צורך מתוך אותו כלי ולא מתוך עצמו.
 *   · יעד שרק מתוכנן אבל יש מנוע בקטלוג שעתיד לתת אותו ושיש לו צורך-חי (למשל הקו) — המנוע הזה הוא "עוגן":
 *     המסלול מביא אותו ומחבר את מה שכבר אפשר לחבר אליו, והשאר נאמר כ"בקרוב".
 *
 * טהור ודטרמיניסטי (בלי React/store/DOM/שעון). נטען **רק** עצלות מתוך המסך — לא מהבנדל-הראשי (ratchet).
 */
import type { OrgConfig } from '../../../types/config';
import { findRoutes, goalFromText, type Route, type RoutePart } from '../../engineroute';
import { catalogFor } from '../match';
import { effectiveLinks, isValidLink, linkKey } from '../links';
import { PARTS, partById, productById, type Part } from '../parts';
import { plugInfo, plugOrder } from '../plugs';

/** איך יעד חסר: אין שום מנוע · רק מתוכנן ("בקרוב") · חי אבל הכלי כבוי אצל הארגון. */
export type MissingKind = 'none' | 'planned' | 'off';

export interface GoalMissing {
  readonly plug: string;
  readonly label: string;
  readonly kind: MissingKind;
  /** השורה הכנה בעברית. */
  readonly line: string;
  /** המנועים שעתידים לתת (planned) או שכבר נותנים בכלי כבוי (off). */
  readonly partNames: readonly string[];
}

export interface GoalRoute {
  /** צעדים בעברית פשוטה (שמות-המנועים). */
  readonly steps: readonly string[];
  /** מפתחות-החיבור של כל הדרך — כולם עוברים `sanitizeLinks`. */
  readonly linkKeys: readonly string[];
  /** כל החיבורים כבר מחוברים (לפי השמור, או ברירת-המחדל). */
  readonly alreadyLinked: boolean;
  /** מה עוד חסר בדרך הזו (יעדים וצרכי-ביניים). */
  readonly missing: readonly GoalMissing[];
}

export interface GoalResult {
  /** התקעים שהובנו מהמשפט (בסדר-ההופעה). */
  readonly plugs: readonly string[];
  /** המילים שהובנו — כפי שנכתבו, עם התקע ותוויתו. */
  readonly matched: ReadonlyArray<{ word: string; plug: string; label: string }>;
  /** עד 3 מסלולים, הקצר ראשון. */
  readonly routes: readonly GoalRoute[];
  /** כל מה שחסר (איחוד, בלי כפילויות) — לכרטיס "חסר מנוע". */
  readonly missing: readonly GoalMissing[];
}

export interface GoalQuery {
  readonly text: string;
  /** מזהה מוצר או מזהה מנוע. ריק/זר ⇒ מתחילים מכלום. */
  readonly start?: string | null;
  readonly config: OrgConfig;
  /** `ui.engineLinks` השמור (חסר ⇒ ברירת-המחדל). */
  readonly stored?: readonly string[] | null;
}

export const MAX_GOAL_ROUTES = 3;

const EMPTY: GoalResult = { plugs: [], matched: [], routes: [], missing: [] };

const labelOf = (plug: string): string => plugInfo(plug)?.label ?? plug;
const nameOf = (p: Part): string => p.emoji + ' ' + p.name;

/** סימון פנימי לעוגן (לא תקע מהתקן, לא נכנס לשום מפתח). */
const ANCHOR = '@anchor:';
const needCode = (plug: string, module: string): string => plug + '>' + module;

/** הקטלוג בשפת מנוע-המסלול — צדדים חיים בלבד, מקודדים בין-כלים. */
export function routePartsFor(catalog: readonly Part[], anchors: ReadonlySet<string> = new Set()): RoutePart[] {
  const modules = [...new Set(catalog.map((p) => p.module as string))].sort();
  return catalog.map((p) => {
    const gives: string[] = [];
    for (const g of p.gives) {
      if (!g.live) continue;
      gives.push(g.plug);
      for (const m of modules) if (m !== p.module) gives.push(needCode(g.plug, m));
    }
    if (anchors.has(p.id)) gives.push(ANCHOR + p.id);
    const needs = p.needs.filter((n) => n.live).map((n) => needCode(n.plug, p.module));
    return { id: p.id, name: p.name, gives: [...new Set(gives)], needs: [...new Set(needs)] };
  });
}

/** סיווג תקע מול הקטלוג: חי · כבוי-אצלכם · מתוכנן · אין. */
function classify(plug: string, catalog: readonly Part[], forModule?: string): { kind: MissingKind | 'live'; parts: Part[] } {
  const on = new Set(catalog.map((p) => p.id));
  // צורך של כלי X נסגר רק מכלי אחר — נותן מאותו כלי לא נחשב.
  const other = (p: Part): boolean => p.module !== forModule;
  const liveIn = catalog.filter((p) => other(p) && p.gives.some((g) => g.live && g.plug === plug));
  if (liveIn.length) return { kind: 'live', parts: liveIn };
  const off = PARTS.filter((p) => other(p) && !on.has(p.id) && p.gives.some((g) => g.live && g.plug === plug));
  if (off.length) return { kind: 'off', parts: off };
  const planned = catalog.filter((p) => p.gives.some((g) => !g.live && g.plug === plug));
  const plannedAll = planned.length ? planned : PARTS.filter((p) => p.gives.some((g) => !g.live && g.plug === plug));
  if (plannedAll.length) return { kind: 'planned', parts: plannedAll };
  return { kind: 'none', parts: [] };
}

function missingOf(plug: string, kind: MissingKind, parts: readonly Part[]): GoalMissing {
  const label = labelOf(plug);
  const partNames = parts.map(nameOf);
  const line =
    kind === 'none'
      ? `חסר מנוע שנותן ${label}`
      : kind === 'planned'
        ? `${label} עוד לא זמין · בקרוב`
        : `${label} נמצא ב-${partNames.join(' / ')}, שעוד לא הודלק אצלכם`;
  return { plug, label, kind, line, partNames };
}

const byPlug = (a: GoalMissing, b: GoalMissing): number => plugOrder(a.plug) - plugOrder(b.plug) || (a.plug < b.plug ? -1 : a.plug > b.plug ? 1 : 0);

function uniqMissing(list: readonly GoalMissing[]): GoalMissing[] {
  const seen = new Set<string>();
  return list.filter((m) => (seen.has(m.plug) ? false : (seen.add(m.plug), true))).sort(byPlug);
}

/** פענוח תקע מקודד (`תקע>מודול`) ⇒ התקע מהתקן. */
const plugOfCode = (code: string): string => code.split('>')[0]!;

interface RouteCtx {
  readonly catalog: readonly Part[];
  readonly startIds: readonly string[];
  readonly anchors: ReadonlySet<string>;
  readonly linked: ReadonlySet<string>;
  readonly goalMissing: readonly GoalMissing[];
}

/** חיבורי העוגן: לכל צורך-חי שלו — הנותן-החי הראשון (התחלה קודם, אחר-כך מה שנוסף) מכלי אחר. */
function anchorKeys(anchor: Part, present: readonly string[], catalog: readonly Part[]): string[] {
  const out: string[] = [];
  for (const need of anchor.needs) {
    if (!need.live) continue;
    for (const id of present) {
      const g = catalog.find((p) => p.id === id);
      if (!g || g.module === anchor.module || !g.gives.some((x) => x.live && x.plug === need.plug)) continue;
      const key = linkKey(g.id, need.plug, anchor.id);
      if (isValidLink(key)) out.push(key);
      break;
    }
  }
  return out;
}

const innerMissingOf = (codes: readonly string[], catalog: readonly Part[]): GoalMissing[] =>
  codes.map((code) => {
    const plug = plugOfCode(code);
    const c = classify(plug, catalog, code.slice(plug.length + 1) || undefined);
    return missingOf(plug, c.kind === 'live' ? 'none' : c.kind, c.parts);
  });

/** מסלול של המנוע ⇒ צעדים בעברית + מפתחות-חיבור תקינים. */
function shapeRoute(r: Route, ctx: RouteCtx): GoalRoute {
  const { catalog } = ctx;
  const part = (id: string): Part | undefined => catalog.find((p) => p.id === id);
  const added = r.steps.map((s) => s.add);
  const present = [...ctx.startIds, ...added];
  const keys: string[] = [];
  const push = (key: string) => {
    if (isValidLink(key) && !keys.includes(key)) keys.push(key);
  };

  // כל חיבור אמיתי (לא ליעד, לא לעוגן) ⇒ מפתח במודל של הליבה; ואחריהם חיבורי-העוגנים.
  for (const l of r.links) {
    if (l.plug.startsWith(ANCHOR) || !l.plug.includes('>')) continue;
    push(linkKey(l.giver, plugOfCode(l.plug), l.needer));
  }
  for (const id of [...ctx.anchors].sort()) {
    const a = part(id);
    if (a && present.includes(id)) anchorKeys(a, present, catalog).forEach(push);
  }
  const parsed = keys.map((k) => {
    const [giver, plug, needer] = k.split('>') as [string, string, string];
    return { giver, plug, needer };
  });

  const steps: string[] = [];
  for (const id of added) {
    const p = part(id);
    if (!p) continue;
    const out: string[] = [];
    for (const l of parsed) {
      const n = l.giver === id ? part(l.needer) : undefined;
      if (n && !out.includes(nameOf(n))) out.push(nameOf(n));
    }
    const gave: string[] = [];
    for (const l of r.links) {
      if (l.giver === id && !l.plug.includes('>') && !l.plug.startsWith(ANCHOR) && !gave.includes(labelOf(l.plug))) gave.push(labelOf(l.plug));
    }
    let line = out.length ? `הוסף את ${nameOf(p)} וחבר אותו ל-${out.join(' ול-')}` : `הוסף את ${nameOf(p)}`;
    if (gave.length) line += ` — הוא נותן ${gave.join(' ו')}`;
    steps.push(line);
    for (const l of parsed) {
      const g = l.needer === id ? part(l.giver) : undefined;
      if (g) steps.push(`${nameOf(p)} מקבל ${labelOf(l.plug)} מ-${nameOf(g)}`);
    }
  }
  // חיבור בין שני מנועים שכבר יש (למשל עוגן שכבר בפנים) — גם הוא צעד.
  for (const l of parsed) {
    if (added.includes(l.giver) || added.includes(l.needer)) continue;
    const g = part(l.giver);
    const n = part(l.needer);
    if (g && n) steps.push(`חבר את ${nameOf(g)} ל-${nameOf(n)} — ${labelOf(l.plug)}`);
  }
  if (!steps.length) steps.push('כבר יש לך את כל מה שצריך — אין מה להוסיף');

  const sorted = [...keys].sort();
  return {
    steps,
    linkKeys: sorted,
    alreadyLinked: sorted.every((k) => ctx.linked.has(k)),
    missing: uniqMissing([...ctx.goalMissing, ...innerMissingOf(r.missing, catalog)]),
  };
}

/** מזהי-ההתחלה (מוצר ⇒ חלקיו; מנוע ⇒ הוא) — רק מה שבקטלוג. */
function startIdsOf(start: string | null | undefined, catalog: readonly Part[]): string[] {
  const on = new Set(catalog.map((p) => p.id));
  if (!start) return [];
  const product = productById(start);
  const ids = product ? product.parts : partById(start) ? [start] : [];
  return ids.filter((id) => on.has(id));
}

/** "להתחיל מהסוף": משפט ⇒ תקעים ⇒ עד 3 מסלולים בעברית + מה שחסר. לעולם לא זורק. */
export function goalRoutes(q: GoalQuery): GoalResult {
  try {
    if (!q || typeof q !== 'object') return EMPTY;
    const { plugs, matched } = goalFromText(typeof q.text === 'string' ? q.text : '');
    if (!plugs.length) return EMPTY;
    const catalog = catalogFor(q.config);
    const startIds = startIdsOf(q.start, catalog);
    const linked = effectiveLinks(q.stored);
    const shownMatched = matched.map((m) => ({ ...m, label: labelOf(m.plug) }));

    // מיון היעדים: חי ⇒ יעד למסלול; אחרת ⇒ חסר (ואולי עוגן).
    const liveGoal: string[] = [];
    const goalMissing: GoalMissing[] = [];
    const anchors = new Set<string>();
    for (const plug of plugs) {
      const c = classify(plug, catalog);
      if (c.kind === 'live') {
        liveGoal.push(plug);
        continue;
      }
      goalMissing.push(missingOf(plug, c.kind, c.parts));
      // עוגן: מנוע בקטלוג שעתיד לתת את התקע, ויש לו צורך-חי — מחברים אליו את מה שכבר אפשר.
      if (c.kind === 'planned') {
        for (const p of c.parts) if (catalog.includes(p) && p.needs.some((n) => n.live)) anchors.add(p.id);
      }
    }

    const parts = routePartsFor(catalog, anchors);
    const goal = [...liveGoal];
    for (const id of [...anchors].sort()) {
      if (startIds.includes(id)) {
        // העוגן כבר בפנים — היעד הוא הצרכים החיים שלו.
        for (const n of parts.find((p) => p.id === id)!.needs) goal.push(n);
      } else goal.push(ANCHOR + id);
    }

    const missingAll = uniqMissing(goalMissing);
    if (!goal.length) return { plugs, matched: shownMatched, routes: [], missing: missingAll };

    const found = findRoutes({ parts, start: startIds, goalPlugs: goal, maxRoutes: MAX_GOAL_ROUTES + 2 });
    const ctx: RouteCtx = { catalog, startIds, anchors, linked, goalMissing };
    // מסלול שלא מביא כלום ורק אומר "חסר" — לא מסלול; החוסר נאמר בכרטיס.
    // הסדר: הקצר ראשון (פחות חסר · פחות מנועים, כמו המנוע); בתיקו — זה שמתחבר ליותר ממה שיש (מיון יציב).
    const routes = found
      .filter((r) => r.steps.length || r.links.length || !r.missing.length)
      .map((r) => ({ r, g: shapeRoute(r, ctx) }))
      .sort((a, b) => a.r.missing.length - b.r.missing.length || a.r.addedCount - b.r.addedCount || b.g.linkKeys.length - a.g.linkKeys.length)
      .map((x) => x.g)
      .slice(0, MAX_GOAL_ROUTES);
    const innerMissing = found.flatMap((r) => innerMissingOf(r.missing, catalog));
    return { plugs, matched: shownMatched, routes, missing: uniqMissing([...goalMissing, ...innerMissing]) };
  } catch {
    return EMPTY;
  }
}
