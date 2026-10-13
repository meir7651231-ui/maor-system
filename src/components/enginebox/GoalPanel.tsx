/**
 * 🎯 ארגז המנועים — "להתחיל מהסוף" (ENGINEBOX-GOAL, 13.10.2026). חזון-הבעלים: הלקוח כותב את התוצאה שהוא רוצה,
 * והארגז עובד אחורה כמו Waze — אילו מנועים להוסיף ולאן לחבר כל אחד, הקצר ראשון; ואם חסר מנוע בדרך — אומר בדיוק איזה,
 * כדי שהמחולל יבנה אותו.
 *
 * רכיב-תצוגה טהור: props בלבד, בלי hooks ובלי store. את התוצאה (`GoalResult`) מחשב המסך דרך `goalRoutes`
 * (`lib/enginebox/goal/routeAdapter`, נטען עצל) — כאן רק ייבוא-טיפוסים. `canEdit=false` ⇒ אין שום כפתור-פעולה.
 * נבדק ב-renderToStaticMarkup ובהפעלת onClick ישירה (אידיום הפרויקט; אין testing-library בריפו).
 */
import { Btn } from '../ui';
import type { GoalMissing, GoalResult, GoalRoute } from '../../lib/enginebox/goal/routeAdapter';
import './goal.css';

export const GOAL_TITLE = '🎯 מה אתה רוצה שייצא?';
export const GOAL_EXAMPLES: readonly string[] = [
  'אני רוצה שאורחים יוכלו להזמין שבת גם מטלפון כשר',
  'בעל מקצוע לתקלה דחופה ביחידה',
  'זמני שבת ומניינים בכרטיס של האורח',
  'תקציר היום עם מה יש היום',
];
export const APPLY_TEXT = 'חבר את כל הדרך';
export const LINKED_TEXT = '✓ כבר מחובר';
export const REQUEST_TEXT = 'בקשו מהמחולל לבנות אותו';
export const NO_MATCH_TEXT = 'עוד לא הבנתי מה צריך לצאת. נסו במילים אחרות, או בחרו דוגמה.';
export const NO_ROUTE_TEXT = 'אין עדיין דרך שאפשר לחבר — ראו למטה מה חסר.';
export const NOTHING_TO_LINK_TEXT = 'אין כאן חיבור לבחור — המנועים כבר בארגז שלך';

/** מסלול אחד: צעדים ממוספרים + כפתור/חיווי. */
export function GoalRouteCard(props: {
  route: GoalRoute;
  index: number;
  canEdit: boolean;
  onApply: (linkKeys: readonly string[]) => void;
}) {
  const r = props.route;
  const hasLinks = r.linkKeys.length > 0;
  return (
    <li className={'eg-route' + (hasLinks && r.alreadyLinked ? ' eg-linked' : '')} data-route={props.index}>
      <div className="eg-route-title">דרך {props.index + 1}</div>
      <ol className="eg-steps">
        {r.steps.map((s, i) => (
          <li key={i} className="eg-step">{s}</li>
        ))}
      </ol>
      <div className="eg-actions">
        {!hasLinks ? (
          <span className="eg-note">{NOTHING_TO_LINK_TEXT}</span>
        ) : r.alreadyLinked ? (
          <span className="eg-on" role="status">{LINKED_TEXT}</span>
        ) : (
          props.canEdit && (
            <Btn kind="primary" onClick={() => props.onApply(r.linkKeys)} title={APPLY_TEXT + ' · ' + r.linkKeys.length + ' חיבורים'}>
              {APPLY_TEXT}
            </Btn>
          )
        )}
      </div>
    </li>
  );
}

/** כרטיס "חסר מנוע": שורה כנה לכל חוסר; כפתור למחולל רק למה שעוד לא בנוי (לא לכלי שפשוט כבוי). */
export function MissingCard(props: {
  missing: readonly GoalMissing[];
  text: string;
  canEdit: boolean;
  onRequestEngine: (plug: string, text: string) => void;
}) {
  if (props.missing.length === 0) return null;
  return (
    <section className="eg-missing" aria-labelledby="eg-h-missing">
      <h4 id="eg-h-missing" className="eg-sub-title">🧩 מה עוד חסר בדרך</h4>
      <ul className="eg-missing-list">
        {props.missing.map((m) => (
          <li key={m.plug} className={'eg-missing-item eg-' + m.kind} data-missing={m.plug}>
            <div className="eg-missing-line">{m.line}</div>
            {props.canEdit && m.kind !== 'off' && (
              <Btn onClick={() => props.onRequestEngine(m.plug, props.text)} title={REQUEST_TEXT + ': ' + m.label}>
                {REQUEST_TEXT}
              </Btn>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function GoalPanel(props: {
  text: string;
  /** תוצאת `goalRoutes` למשפט הנוכחי; null ⇒ עוד לא נכתב / עוד נטען. */
  result: GoalResult | null;
  canEdit: boolean;
  onText: (text: string) => void;
  onApply: (linkKeys: readonly string[]) => void;
  onRequestEngine: (plug: string, text: string) => void;
}) {
  const res = props.result;
  const typed = props.text.trim().length > 0;
  return (
    <section className="eg-panel" aria-labelledby="eg-h-goal">
      <label id="eg-h-goal" htmlFor="eg-goal-text" className="eg-title">{GOAL_TITLE}</label>
      <textarea
        id="eg-goal-text"
        className="eg-input"
        rows={2}
        dir="rtl"
        value={props.text}
        placeholder="למשל: אני רוצה שאורחים יוכלו להזמין שבת גם מטלפון כשר"
        onChange={(e) => props.onText(e.target.value)}
      />
      <div className="eg-examples" role="group" aria-label="דוגמאות">
        {GOAL_EXAMPLES.map((ex) => (
          <button key={ex} type="button" className="eg-example" data-example={ex} onClick={() => props.onText(ex)}>
            {ex}
          </button>
        ))}
      </div>

      {typed && res && res.matched.length > 0 && (
        <div className="eg-understood" aria-label="מה הבנתי">
          <span className="eg-understood-label">הבנתי:</span>
          {res.matched.map((m, i) => (
            <span key={i} className="eg-word" data-plug={m.plug} title={m.label}>
              {m.word} · {m.label}
            </span>
          ))}
        </div>
      )}

      {typed && res && res.plugs.length === 0 && <div className="empty eg-empty">{NO_MATCH_TEXT}</div>}

      {typed && res && res.plugs.length > 0 && (
        <>
          {res.routes.length > 0 ? (
            <ol className="eg-routes">
              {res.routes.slice(0, 3).map((r, i) => (
                <GoalRouteCard key={i} route={r} index={i} canEdit={props.canEdit} onApply={props.onApply} />
              ))}
            </ol>
          ) : (
            <div className="empty eg-empty">{NO_ROUTE_TEXT}</div>
          )}
          <MissingCard missing={res.missing} text={props.text} canEdit={props.canEdit} onRequestEngine={props.onRequestEngine} />
        </>
      )}
    </section>
  );
}
