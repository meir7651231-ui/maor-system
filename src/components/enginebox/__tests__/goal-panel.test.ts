/**
 * 🎯 ארגז המנועים — פאנל "להתחיל מהסוף" (ENGINEBOX-GOAL, 13.10.2026).
 * אידיום-הפרויקט: renderToStaticMarkup לרינדור, והפעלת onClick ישירה על עץ-האלמנטים של הרכיבים הטהורים (בלי hooks).
 * הנתונים — מהמתאם האמיתי (goalRoutes על הקטלוג), לא דוגמה מומצאת.
 */
import { describe, expect, it } from 'vitest';
import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  APPLY_TEXT,
  GOAL_EXAMPLES,
  GOAL_TITLE,
  GoalPanel,
  GoalRouteCard,
  LINKED_TEXT,
  MissingCard,
  NO_MATCH_TEXT,
  NO_ROUTE_TEXT,
  REQUEST_TEXT,
} from '../GoalPanel';
import { Btn } from '../../ui';
import { DEFAULT_CONFIG, type OrgConfig } from '../../../types/config';
import { goalRoutes, type GoalResult } from '../../../lib/enginebox/goal/routeAdapter';

const BOTH: OrgConfig = { ...DEFAULT_CONFIG, modules: { ...DEFAULT_CONFIG.modules, parnasa: true, hosting: true } };
const OWNER = GOAL_EXAMPLES[0];

/** כל האלמנטים בעץ; רכיבי-פונקציה טהורים (חוץ מ-Btn, שמזוהה כמות-שהוא) נפרשים. */
function walk(node: ReactNode, out: ReactElement[] = []): ReactElement[] {
  if (Array.isArray(node)) { node.forEach((n) => walk(n, out)); return out; }
  if (!isValidElement(node)) return out;
  out.push(node);
  if (typeof node.type === 'function' && node.type !== Btn) {
    walk((node.type as (p: unknown) => ReactNode)(node.props), out);
    return out;
  }
  walk((node.props as { children?: ReactNode }).children, out);
  return out;
}
const btns = (tree: ReactNode, text: string) =>
  walk(tree).filter((e) => e.type === Btn && (e.props as { children: ReactNode }).children === text) as Array<
    ReactElement<{ onClick: () => void }>
  >;

const noop = () => {};
function panel(over: Partial<Parameters<typeof GoalPanel>[0]> = {}) {
  return GoalPanel({ text: '', result: null, canEdit: true, onText: noop, onApply: noop, onRequestEngine: noop, ...over });
}

describe('🎯 הפאנל', () => {
  it('ריק: הכותרת, תיבת-הטקסט ו-4 דוגמאות (כולל המשפט של הבעלים) — בלי מסלולים', () => {
    const out = renderToStaticMarkup(panel());
    expect(out).toContain(GOAL_TITLE);
    expect(out).toContain('<textarea');
    expect(GOAL_EXAMPLES).toHaveLength(4);
    expect(GOAL_EXAMPLES).toContain('אני רוצה שאורחים יוכלו להזמין שבת גם מטלפון כשר');
    for (const ex of GOAL_EXAMPLES) expect(out).toContain(ex);
    expect(out).not.toContain('eg-route');
  });

  it('לחיצה על דוגמה ⇒ onText עם המשפט; הקלדה ⇒ onText עם הערך', () => {
    const seen: string[] = [];
    const tree = panel({ onText: (t) => seen.push(t) });
    for (const e of walk(tree)) {
      const p = e.props as { 'data-example'?: string; onClick?: () => void };
      if (p['data-example'] && p.onClick) p.onClick();
    }
    expect(seen).toEqual([...GOAL_EXAMPLES]);
    const ta = walk(tree).find((e) => e.type === 'textarea')!.props as { onChange: (e: { target: { value: string } }) => void };
    ta.onChange({ target: { value: 'שבת' } });
    expect(seen.at(-1)).toBe('שבת');
  });

  it('המשפט של הבעלים: מילים שהובנו כצ׳יפים, צעדים ממוספרים, "✓ כבר מחובר" והחוסר', () => {
    const result = goalRoutes({ text: OWNER, start: 'hosting', config: BOTH });
    const out = renderToStaticMarkup(panel({ text: OWNER, result }));
    expect(out).toContain('הבנתי:');
    expect(out).toContain('להזמין · הזמנה');
    expect(out).toContain('מטלפון כשר · שלוחה בקו');
    expect(out).toContain('<ol class="eg-steps">');
    expect(out).toContain('הוסף את 📞 הקו (טלפון כשר)');
    expect(out).toContain(LINKED_TEXT);
    expect(out).not.toContain(APPLY_TEXT + '<'); // כבר מחובר ⇒ אין כפתור-חיבור
    expect(out).toContain('הזמנה עוד לא זמין · בקרוב');
    expect(out).toContain(REQUEST_TEXT);
  });

  it('"חבר את כל הדרך" קורא ל-onApply עם מפתחות-הדרך', () => {
    const result = goalRoutes({ text: OWNER, start: 'hosting', config: BOTH, stored: [] });
    const applied: Array<readonly string[]> = [];
    const card = GoalRouteCard({ route: result.routes[0], index: 0, canEdit: true, onApply: (k) => applied.push(k) });
    const [b] = btns(card, APPLY_TEXT);
    b.props.onClick();
    expect(applied).toEqual([result.routes[0].linkKeys]);
    expect(applied[0]).toContain('host.units>availability>pr.phone');
  });

  it('"בקשו מהמחולל" קורא ל-onRequestEngine עם התקע והמשפט; כלי כבוי ⇒ בלי כפתור', () => {
    const calls: string[] = [];
    const missing = goalRoutes({ text: OWNER, start: 'hosting', config: BOTH }).missing;
    const card = MissingCard({ missing, text: OWNER, canEdit: true, onRequestEngine: (p, t) => calls.push(p + '|' + t) })!;
    btns(card, REQUEST_TEXT).forEach((b) => b.props.onClick());
    expect(calls).toEqual(['booking|' + OWNER, 'voice.menu|' + OWNER]);
    const off = MissingCard({
      missing: [{ plug: 'times.shabbat', label: 'זמני שבת', kind: 'off', line: 'x', partNames: [] }],
      text: OWNER,
      canEdit: true,
      onRequestEngine: noop,
    })!;
    expect(btns(off, REQUEST_TEXT)).toEqual([]);
    expect(MissingCard({ missing: [], text: '', canEdit: true, onRequestEngine: noop })).toBeNull();
  });

  it('קריאה בלבד (canEdit=false) — אין שום כפתור-פעולה', () => {
    const result = goalRoutes({ text: OWNER, start: 'hosting', config: BOTH, stored: [] });
    const tree = panel({ text: OWNER, result, canEdit: false });
    const out = renderToStaticMarkup(tree);
    expect(out).toContain('הוסף את 📞 הקו (טלפון כשר)');
    expect(out).not.toContain(APPLY_TEXT);
    expect(out).not.toContain(REQUEST_TEXT);
    expect(walk(tree).some((e) => e.type === Btn)).toBe(false);
  });

  it('לא הובן כלום ⇒ הודעה עם הצעה לדוגמה; אין דרך ⇒ "ראו מה חסר"', () => {
    const none: GoalResult = goalRoutes({ text: 'סתם משפט', start: 'hosting', config: BOTH });
    expect(renderToStaticMarkup(panel({ text: 'סתם משפט', result: none }))).toContain(NO_MATCH_TEXT);
    const booklet = goalRoutes({ text: 'חוברת להדפסה', start: 'hosting', config: BOTH });
    const out = renderToStaticMarkup(panel({ text: 'חוברת להדפסה', result: booklet }));
    expect(out).toContain(NO_ROUTE_TEXT);
    expect(out).toContain('דף להדפסה עוד לא זמין · בקרוב');
    // טקסט ריק ⇒ גם עם תוצאה ישנה לא מוצג דבר
    expect(renderToStaticMarkup(panel({ text: '  ', result: booklet }))).not.toContain(NO_ROUTE_TEXT);
  });

  it('מסלול בלי חיבורים ⇒ אין כפתור ואין "כבר מחובר" מטעה', () => {
    const r = goalRoutes({ text: 'בעל מקצוע', start: 'parnasa', config: BOTH });
    const out = renderToStaticMarkup(GoalRouteCard({ route: r.routes[0], index: 0, canEdit: true, onApply: noop }));
    expect(out).not.toContain(APPLY_TEXT);
    expect(out).not.toContain(LINKED_TEXT);
  });
});
