/**
 * 🧭 "מתחילים מהסוף" — מנוע-המסלול (ENGINEBOX-ROUTE, 13.10.2026).
 *
 * הלקוח כותב את התוצאה שהוא רוצה; המנוע עובד אחורה כמו Waze: אילו מנועים להוסיף, ולאן לחבר כל אחד — המסלול הקצר
 * ראשון. כל מנוע (`RoutePart`) נותן תקעים ("זכר", `gives`) וצריך תקעים ("נקבה", `needs`). מזהי-התקעים = התקן המשותף
 * של ארגז-המנועים (`PLUG_IDS`).
 *
 * טהור ודטרמיניסטי: בלי React/store/DOM/Date.now/רשת. בכוונה **לא** מייבא מ-`enginebox/` (נבנה במקביל) — הממשק
 * כאן מינימלי, והמשלב ממפה עליו את הקטלוג האמיתי (ראו knowledge/CLOSED-ENGINEBOX-ROUTE-2026-10-13.md).
 *
 * האלגוריתם: חיפוש-לרוחב על **קבוצות** מנועים-מתווספים (רמה = מספר המנועים שנוספו). בכל מצב מחשבים את התקעים
 * החסרים — יעדי-המטרה וכל מה שהמנועים-שנוספו צריכים — בניכוי מה שזמין (מה שנותנים מנועי-ההתחלה והמנועים-שנוספו).
 * מתפצלים רק על תקע-חסר אחד — זה עם הכי מעט נותנים (תיקו ⇒ לפי מזהה) — ועל נותניו ⇒ שלם (כל פתרון חייב לכלול
 * נותן לתקע הזה) וזול. מצבים כפולים (אותה קבוצה בסדר אחר) נחתכים ⇒ חסין-מעגלים; ההעמקה חסומה ב-maxDepth, ובחסם-
 * תחתון (כמה מנועים לפחות עוד חסרים). מסלול שהוא הרחבה של מסלול קצר שכבר נמצא (מנוע מיותר) נזרק. רמה נבדקת
 * כולה לפני שמחליטים להעמיק; מספיק מסלולים שלמים ⇒ עוצרים. התקעים = מסכות-ביטים, והמסכות של מצב מחושבות בעצלות.
 */

/** התקן המשותף — מזהי-התקעים של ארגז-המנועים (בדיוק המחרוזות האלה). */
export const PLUG_IDS = [
  'times.shabbat',
  'times.prayers',
  'times.blocked',
  'pro.match',
  'emergency',
  'availability',
  'booking',
  'request.text',
  'message.text',
  'voice.menu',
  'print.page',
  'date.hebrew',
  'reminder',
  'payment.link',
  'person',
  'day.summary',
] as const;

export type PlugId = (typeof PLUG_IDS)[number];

/** שם עברי פשוט לכל תקע (לנוסח "חסר מנוע שנותן X"). מזהה זר ⇒ המזהה עצמו. */
export const PLUG_NAMES: Readonly<Record<PlugId, string>> = {
  'times.shabbat': 'זמני שבת',
  'times.prayers': 'זמני תפילות',
  'times.blocked': 'שעות חסומות',
  'pro.match': 'התאמת בעל מקצוע',
  emergency: 'חירום',
  availability: 'מקום פנוי',
  booking: 'הזמנה',
  'request.text': 'בקשה בכתב',
  'message.text': 'הודעה',
  'voice.menu': 'קו טלפוני',
  'print.page': 'דף להדפסה',
  'date.hebrew': 'תאריך עברי',
  reminder: 'תזכורת',
  'payment.link': 'קישור תשלום',
  person: 'איש קשר',
  'day.summary': 'סיכום יום',
};

export function plugName(plug: string): string {
  return (PLUG_NAMES as Readonly<Record<string, string>>)[plug] ?? plug;
}

/** מנוע בארגז — מה הוא נותן ומה הוא צריך. */
export interface RoutePart {
  id: string;
  name: string;
  gives: readonly string[];
  needs: readonly string[];
}

/** חיבור: `giver` נותן את `plug` ל-`needer`. needer = `GOAL` ⇒ התקע הוא מה שהלקוח ביקש. */
export interface RouteLink {
  giver: string;
  plug: string;
  needer: string;
}

/** צעד: מוסיפים מנוע אחד, ואלה החיבורים שנסגרים ברגע שהוא בפנים. */
export interface RouteStep {
  add: string;
  links: RouteLink[];
}

export interface Route {
  steps: RouteStep[];
  links: RouteLink[];
  /** תקעים שאין להם נותן בכל הארגז — "חסר מנוע שנותן X" (המחולל יכול לבנות אותו). */
  missing: string[];
  addedCount: number;
}

/** ה"צרכן" המדומה של יעדי-המטרה — התוצאה שהלקוח ביקש. */
export const GOAL = '@goal';

export interface FindRoutesInput {
  parts: readonly RoutePart[];
  /** מזהי המנועים שכבר יש לארגון (מזהה זר — מתעלמים). */
  start: readonly string[];
  goalPlugs: readonly string[];
  /** מקסימום מנועים להוסיף (ברירת-מחדל 4). */
  maxDepth?: number;
  /** מקסימום מסלולים להחזיר (ברירת-מחדל 5). */
  maxRoutes?: number;
}

/** תקרת-בטיחות למספר המצבים שנבדקים — גם בארגז ענק החיפוש נגמר. */
const STATE_CAP = 200_000;

const cmp = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
const uniqSorted = (xs: Iterable<string>): string[] => [...new Set(xs)].sort(cmp);

interface Solved {
  added: string[]; // ממוין
  linkCount: number;
  missing: string[];
  /** מפתח-מיון יציב לפי מזהים. */
  key: string;
}

export function findRoutes(p: FindRoutesInput): Route[] {
  const int = (v: number | undefined, dflt: number, min: number): number =>
    typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.floor(v)) : dflt;
  const maxDepth = Math.min(int(p.maxDepth, 4, 0), 8); // 2^maxDepth תת-קבוצות בבדיקת-מיותר ⇒ תקרה
  const maxRoutes = int(p.maxRoutes, 5, 1);

  // מנוע ראשון לכל מזהה (מזהה כפול בקטלוג ⇒ הראשון קובע — דטרמיניסטי).
  const byId = new Map<string, RoutePart>();
  for (const part of p.parts) if (!byId.has(part.id)) byId.set(part.id, part);

  const startIds = uniqSorted(p.start.filter((id) => byId.has(id)));
  const startSet = new Set(startIds);
  const startGives = new Set<string>();
  for (const id of startIds) for (const g of byId.get(id)!.gives) startGives.add(g);

  // נותני כל תקע (מחוץ למנועי-ההתחלה), ממוינים לפי מזהה.
  const giversOf = new Map<string, string[]>();
  for (const id of [...byId.keys()].sort(cmp)) {
    if (startSet.has(id)) continue;
    for (const g of new Set(byId.get(id)!.gives)) {
      const arr = giversOf.get(g);
      if (arr) arr.push(id);
      else giversOf.set(g, [id]);
    }
  }
  const nobodyGives = (plug: string): boolean => !startGives.has(plug) && !giversOf.has(plug);
  let maxGives = 1;
  for (const part of byId.values()) maxGives = Math.max(maxGives, new Set(part.gives).size);

  const goal = uniqSorted(p.goalPlugs);

  // יעד שאין לו נותן בכל הארגז ⇒ תשובה אחת בצורת-מסלול שאומרת בדיוק מה חסר.
  const goalMissing = goal.filter(nobodyGives);
  if (goalMissing.length) return [{ steps: [], links: [], missing: goalMissing, addedCount: 0 }];

  // ── מסכות-ביטים: כל תקע = ביט; מצב = מה זמין (avail) ומה מבוקש (want) — הרחבה = OR, בלי Set-ים בלולאה החמה.
  const plugList = uniqSorted([...goal, ...[...byId.values()].flatMap((part) => [...part.gives, ...part.needs])]);
  const bit = new Map(plugList.map((plug, i) => [plug, i] as const));
  const W = Math.max(1, Math.ceil(plugList.length / 32));
  const maskOf = (plugs: Iterable<string>): Uint32Array => {
    const m = new Uint32Array(W);
    for (const plug of plugs) {
      const i = bit.get(plug)!;
      m[i >>> 5] |= 1 << (i & 31);
    }
    return m;
  };
  const popcount = (x: number): number => {
    let c = 0;
    for (; x; x &= x - 1) c++;
    return c;
  };
  const plugsIn = (m: Uint32Array): string[] => {
    const out: string[] = [];
    for (let i = 0; i < plugList.length; i++) if (m[i >>> 5] & (1 << (i & 31))) out.push(plugList[i]);
    return out;
  };

  const nobodyM = maskOf(plugList.filter(nobodyGives));
  const startAvail = maskOf(startGives);
  const goalM = maskOf(goal);

  // מועמדים = כל מי שאינו מנוע-התחלה, באינדקס לפי סדר-המזהים (אינדקס עולה ⇔ מזהה עולה).
  const cand = [...byId.keys()].filter((id) => !startSet.has(id)).sort(cmp);
  const N = cand.length;
  const idxOf = new Map(cand.map((id, i) => [id, i] as const));
  const gm = cand.map((id) => maskOf(byId.get(id)!.gives));
  const nm = cand.map((id) => maskOf(byId.get(id)!.needs));
  // חיבורים שמנוע מביא איתו במצב פתור: כל צורך שאינו נותן לעצמו ושיש לו נותן (= זמין במצב פתור).
  const ownLinks = cand.map((_, i) => {
    let c = 0;
    for (let w = 0; w < W; w++) c += popcount(nm[i][w] & ~gm[i][w] & ~nobodyM[w]);
    return c;
  });
  let goalLinks = 0;
  for (let w = 0; w < W; w++) goalLinks += popcount(goalM[w] & ~startAvail[w]);
  const startNeedsM = startIds.map((id) => maskOf(byId.get(id)!.needs));
  const giversIdx = plugList.map((plug) => (giversOf.get(plug) ?? []).map((id) => idxOf.get(id)!));

  // מפתח-קבוצה מספרי (אינדקסים ממוינים בבסיס N+1) כשהוא נכנס בבטחה ל-double; אחרת מחרוזת.
  const numericKeys = Math.pow(N + 1, maxDepth) < Number.MAX_SAFE_INTEGER;
  const keyOf = (idx: readonly number[]): number | string => {
    if (!numericKeys) return idx.join(',');
    let k = 0;
    for (const i of idx) k = k * (N + 1) + i + 1;
    return k;
  };

  interface State {
    idx: number[]; // ממוין עולה
    /** המסכות מחושבות בעצלות — רק למצב שבאמת מרחיבים (רוב המצבים ברמה האחרונה לא מורחבים לעולם). */
    parent: State | null;
    g: number;
    avail: number[] | null;
    want: number[] | null;
    pivot: number;
    openCount: number;
  }
  const solved: Solved[] = [];
  const solvedKeys = new Set<number | string>();
  let complete = 0;
  let states = 0;

  /** יש תת-קבוצה ממש שכבר נפתרה? (≤ 2^maxDepth תת-קבוצות — זול.) */
  const hasSolvedSubset = (idx: readonly number[]): boolean => {
    const n = idx.length;
    for (let m = 0; m < (1 << n) - 1; m++) {
      const sub: number[] = [];
      for (let i = 0; i < n; i++) if (m & (1 << i)) sub.push(idx[i]);
      if (solvedKeys.has(keyOf(sub))) return true;
    }
    return false;
  };

  const ZERO = new Uint32Array(W);
  const masksOf = (st: State): { avail: ArrayLike<number>; want: ArrayLike<number> } => {
    if (!st.avail || !st.want) {
      const base = st.parent ? masksOf(st.parent) : { avail: startAvail, want: goalM };
      const ga = st.parent ? gm[st.g] : ZERO;
      const na = st.parent ? nm[st.g] : ZERO;
      const avail: number[] = [];
      const want: number[] = [];
      for (let w = 0; w < W; w++) {
        avail.push(base.avail[w] | ga[w]);
        want.push(base.want[w] | na[w]);
      }
      st.avail = avail;
      st.want = want;
    }
    return { avail: st.avail, want: st.want };
  };

  /**
   * בודק את "ההורה + מנוע g" בלי להקצות: פתוחים = מבוקש ולא-זמין ויש לו נותן איפשהו; מה שאין לו נותן בכלל = חסר
   * (לא חוסם). אין פתוחים ⇒ נרשם כפתרון ומחזיר null; אחרת — המצב עם התקע שעליו מתפצלים.
   */
  const evaluate = (idx: number[], parent: State | null, g: number): State | null => {
    states++;
    const base = parent ? masksOf(parent) : { avail: startAvail, want: goalM };
    const ga = parent ? gm[g] : ZERO;
    const na = parent ? nm[g] : ZERO;
    let openCount = 0;
    let pivot = -1;
    for (let w = 0; w < W; w++) {
      let x = (base.want[w] | na[w]) & ~(base.avail[w] | ga[w]) & ~nobodyM[w];
      while (x) {
        const low = x & -x;
        const i = (w << 5) + 31 - Math.clz32(low);
        x ^= low;
        openCount++;
        // מתפצלים על התקע הפתוח עם הכי מעט נותנים (שלם באותה מידה, הרבה פחות ענפים); תיקו ⇒ הראשון לפי מזהה.
        if (pivot < 0 || giversIdx[i].length < giversIdx[pivot].length) pivot = i;
      }
    }
    if (openCount) return { idx, parent, g, avail: null, want: null, pivot, openCount };
    const miss = new Uint32Array(W);
    let linkCount = goalLinks;
    for (const i of idx) linkCount += ownLinks[i];
    for (let w = 0; w < W; w++) {
      const avail = base.avail[w] | ga[w];
      miss[w] = (base.want[w] | na[w]) & ~avail & nobodyM[w];
      const fresh = avail & ~startAvail[w];
      for (const sm of startNeedsM) linkCount += popcount(sm[w] & fresh);
    }
    const missing = plugsIn(miss);
    const added = idx.map((i) => cand[i]);
    solved.push({ added, linkCount, missing, key: added.join('\u0000') });
    solvedKeys.add(keyOf(idx));
    if (!missing.length) complete++;
    return null;
  };

  const seen = new Set<number | string>([keyOf([])]);
  const root = evaluate([], null, -1);
  let level: State[] = root ? [root] : [];

  for (let depth = 0; depth < maxDepth && level.length; depth++) {
    // הרמה הזו נבדקה כולה; מספיק מסלולים שלמים ⇒ לא מעמיקים (העמוקים תמיד ארוכים יותר).
    if (complete >= maxRoutes || states > STATE_CAP) break;
    // תת-קבוצה פתורה יכולה להיות רק מרמה קודמת (הפתרונות של הרמה הזו באותו גודל כמו הילדים).
    const checkSubsets = solvedKeys.size > 0;
    const next: State[] = [];
    // חסם-תחתון: גם מנוע שנותן הכי הרבה תקעים לא יסגור את כל הפתוחים בעומק שנשאר ⇒ לא מעמיקים.
    const left = maxDepth - depth - 1;
    for (const st of level) {
      const base = masksOf(st);
      for (const g of giversIdx[st.pivot]) {
        if (st.idx.includes(g)) continue;
        // סינון-מוקדם זול (תלוי רק בקבוצה, לא במסלול אליה): ילד שלא נפתר ולא יכול להיפתר בעומק שנשאר — מדלגים
        // לפני מיון/מפתח/כפילויות. ברמה האחרונה זה משאיר רק את מי שסוגר הכול בבת-אחת.
        let childOpen = 0;
        for (let w = 0; w < W; w++) {
          childOpen += popcount((base.want[w] | nm[g][w]) & ~(base.avail[w] | gm[g][w]) & ~nobodyM[w]);
        }
        if (childOpen && Math.ceil(childOpen / maxGives) > left) continue;
        const grown = [...st.idx, g].sort((a, b) => a - b);
        const key = keyOf(grown);
        if (seen.has(key)) continue;
        seen.add(key);
        // מנוע מיותר: אם תת-קבוצה כבר פתרה — זה לא מסלול חדש, רק ארוך יותר (ולא מעמיקים ממנו).
        if (checkSubsets && hasSolvedSubset(grown)) continue;
        const child = evaluate(grown, st, g);
        if (child) next.push(child);
      }
    }
    level = next;
  }

  /** החיבורים של קבוצה: כל צורך של מנוע-שנוסף, כל יעד שמנוע-שנוסף נותן, וכל צורך של מנוע-התחלה שנסגר עכשיו. */
  function linksOf(added: readonly string[]): RouteLink[] {
    const addedSet = new Set(added);
    // נותן מועדף לתקע: מנוע-התחלה קודם (כבר מחובר), אחריו מנוע-שנוסף; בתוך כל קבוצה לפי מזהה.
    const giverFor = (plug: string, needer: string): string | undefined => {
      for (const id of startIds) if (id !== needer && byId.get(id)!.gives.includes(plug)) return id;
      for (const id of added) if (id !== needer && byId.get(id)!.gives.includes(plug)) return id;
      // מנוע שנותן לעצמו — אין צורך בכבל.
      return undefined;
    };
    const links: RouteLink[] = [];
    const push = (l: RouteLink) => {
      if (!links.some((x) => x.giver === l.giver && x.plug === l.plug && x.needer === l.needer)) links.push(l);
    };
    for (const id of added) {
      for (const n of uniqSorted(byId.get(id)!.needs)) {
        if (byId.get(id)!.gives.includes(n)) continue;
        const g = giverFor(n, id);
        if (g) push({ giver: g, plug: n, needer: id });
      }
    }
    for (const plug of goal) {
      if (startGives.has(plug)) continue;
      const g = added.find((id) => byId.get(id)!.gives.includes(plug));
      if (g) push({ giver: g, plug, needer: GOAL });
    }
    // מנוע-התחלה שחיכה לתקע שרק מנוע-חדש נותן — גם זה חיבור ("ושם").
    for (const id of startIds) {
      for (const n of uniqSorted(byId.get(id)!.needs)) {
        if (startGives.has(n)) continue;
        const g = added.find((a) => addedSet.has(a) && byId.get(a)!.gives.includes(n));
        if (g) push({ giver: g, plug: n, needer: id });
      }
    }
    return links;
  }

  solved.sort(
    (a, b) =>
      a.missing.length - b.missing.length ||
      a.added.length - b.added.length ||
      a.linkCount - b.linkCount ||
      cmp(a.key, b.key),
  );

  return solved.slice(0, maxRoutes).map((s) => toRoute(s));

  /** סדר-ההרכבה: קודם מי שכל צרכיו כבר זמינים; מעגל (צריכים זה את זה) ⇒ הקטן לפי מזהה. */
  function toRoute(s: Solved): Route {
    const links = linksOf(s.added);
    const order: string[] = [];
    const avail = new Set(startGives);
    const left = [...s.added];
    while (left.length) {
      let i = left.findIndex((id) => byId.get(id)!.needs.every((n) => avail.has(n) || nobodyGives(n) || byId.get(id)!.gives.includes(n)));
      if (i < 0) i = 0;
      const [id] = left.splice(i, 1);
      order.push(id);
      for (const g of byId.get(id)!.gives) avail.add(g);
    }
    const pos = new Map(order.map((id, i) => [id, i] as const));
    const at = (id: string): number => pos.get(id) ?? -1; // מנוע-התחלה / GOAL = כבר שם
    const steps: RouteStep[] = order.map((add) => ({ add, links: [] }));
    for (const l of links) steps[Math.max(at(l.giver), at(l.needer))]?.links.push(l);
    return { steps, links, missing: s.missing, addedCount: s.added.length };
  }
}

/** "ללמוד מכל הלקוחות": מסדר אפשרויות לפי כמה ארגונים השתמשו בכל מפתח-חיבור. תיקו ⇒ הסדר המקורי. טהור. */
export function rankByRecipes<T extends { key: string }>(
  options: readonly T[],
  recipeCounts: Readonly<Record<string, number>>,
): T[] {
  const countOf = (k: string): number => {
    const v = Object.prototype.hasOwnProperty.call(recipeCounts, k) ? recipeCounts[k] : 0;
    return typeof v === 'number' && Number.isFinite(v) ? v : 0;
  };
  return options
    .map((o, i) => ({ o, i, c: countOf(o.key) }))
    .sort((a, b) => b.c - a.c || a.i - b.i)
    .map((x) => x.o);
}
