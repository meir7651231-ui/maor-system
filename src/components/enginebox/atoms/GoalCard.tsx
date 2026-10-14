/**
 * 🎯 מנועים וחלקים — "מה אתה רוצה לקבל?" (ATOMS-GOAL 14.10.2026): להתחיל מהסוף, כמו Waze.
 *
 * כותבים מה רוצים לקבל ⇒ הארגז מרכיב את זה לבד מהחלקים הקטנים (lib/atoms/goal.ts דרך התפר — `source.goal`) ⇒
 * עד 3 הרכבות, כל אחת עם המשפט שלה במילים, התוצאה האמיתית על הנתונים של הארגון ו"חבר".
 * לא ברור ⇒ שאלות סגורות כצ'יפים (לא מנחשים). אין הרכבה ⇒ שורה כנה.
 * בלי hooks של store: רק התפר. בלי `canEdit` ⇒ צפייה בלבד (בלי "חבר").
 */
import { useState, type FormEvent } from 'react';
import { Btn } from '../../ui';
import type { AtomsSource, GoalPickView, GoalView } from './seam';
import { LtrNums } from './AtomSteps';

export const GOAL_TITLE_TEXT = '🎯 מה אתה רוצה לקבל?';
export const GOAL_HINT_TEXT = 'כתבו במילים שלכם מה אתם רוצים לקבל, והארגז ירכיב את זה לבד מהחלקים — עם התוצאה על הנתונים שלכם.';
export const GOAL_PLACEHOLDER = 'למשל: תורים של 40 דקות בחלון הניקיון';
export const GOAL_ASK_TEXT = 'הרכב';
export const GOAL_CONNECT_TEXT = 'חבר';
export const GOAL_SAVED_TEXT = 'כבר מחובר ✓';
export const GOAL_MADE_TEXT = '✨ נוצר מנוע חדש';
export const GOAL_NONE_TEXT = 'לא מצאתי הרכבה שנותנת את זה מהמנועים שיש — נסה במילים אחרות או בחר חלק בעצמך';
export const GOAL_ASK_HINT = 'צריך לדעת עוד דבר אחד:';
export const GOAL_STEPS_TEXT = (n: number) => (n === 1 ? 'חלק אחד' : n + ' חלקים');

/** שש דוגמאות ממטרות אמיתיות. */
export const GOAL_EXAMPLES: readonly string[] = [
  'תורים של 40 דקות בחלון הניקיון',
  '3 לילות פנויים ברצף',
  'לחלק את היתרה ל-3 תשלומים',
  'תזכורת יום לפני כל הגעה',
  'אם המנקה לא עונה תוך שעה — להעביר לבאה',
  'השעות הזמניות של היום',
];

export function GoalCard(props: { source: AtomsSource; initialText?: string }) {
  const { source } = props;
  const [text, setText] = useState(props.initialText ?? '');
  const [asked, setAsked] = useState<string | null>(props.initialText ? props.initialText : null);
  const [picks, setPicks] = useState<GoalPickView[]>([]);
  const [made, setMade] = useState<string | null>(null);
  if (!source.goal) return null;

  const ask = (t: string) => {
    setText(t);
    setAsked(t.trim() ? t : null);
    setPicks([]);
    setMade(null);
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(text);
  };
  const view: GoalView | null = asked !== null ? source.goal(asked, picks) : null;
  const connect = (id: string) => {
    if (asked === null || !source.connectGoal) return;
    const r = source.connectGoal(asked, picks, id);
    if (r) setMade(r);
  };

  return (
    <section className="at-goal" aria-labelledby="at-h-goal" data-goal={view ? view.status : 'idle'}>
      <h3 id="at-h-goal" className="at-title">{GOAL_TITLE_TEXT}</h3>
      <p className="at-hint">{GOAL_HINT_TEXT}</p>
      <form className="at-goal-form" onSubmit={onSubmit} role="search">
        <input
          className="at-input at-goal-input"
          type="text"
          dir="rtl"
          value={text}
          placeholder={GOAL_PLACEHOLDER}
          aria-label={GOAL_TITLE_TEXT}
          maxLength={200}
          data-goal-input="1"
          onChange={(e) => setText(e.target.value)}
        />
        <Btn type="submit" kind="primary">{GOAL_ASK_TEXT}</Btn>
      </form>
      <div className="at-choices at-goal-examples" aria-label="דוגמאות">
        {GOAL_EXAMPLES.map((g) => (
          <button key={g} type="button" className="at-choice at-goal-ex" data-goal-example={g} onClick={() => ask(g)}>
            {g}
          </button>
        ))}
      </div>
      {view && <GoalAnswer view={view} canEdit={source.canEdit && !!source.connectGoal} made={made} onConnect={connect} onPick={(p) => { setPicks([...picks, p]); setMade(null); }} />}
    </section>
  );
}

/** התשובה: כרטיסי-ההרכבות, או השאלות הסגורות, או השורה הכנה. טהור (בלי hooks). */
export function GoalAnswer(props: { view: GoalView; canEdit: boolean; made: string | null; onConnect: (id: string) => void; onPick: (p: GoalPickView) => void }) {
  const { view } = props;
  return (
    <div className="at-goal-answer" aria-live="polite">
      {view.status === 'none' && <div className="empty at-goal-none" data-goal-none="1">{GOAL_NONE_TEXT}</div>}
      {view.results.length > 0 && (
        <ul className="at-list" aria-label="הרכבות">
          {view.results.map((r) => (
            <li key={r.id} className={'at-goal-res' + (props.made === r.id ? ' at-made' : '')} data-goal-result={r.id}>
              <span className="at-chip">{GOAL_STEPS_TEXT(r.steps)}</span>
              <span className="at-goal-sentence"><LtrNums text={r.sentence} /></span>
              <span className="at-preview at-preview-mini" data-preview="goal">
                <span className="at-preview-title"><LtrNums text={r.title} /></span>
                {r.lines.map((l, i) => (
                  <span key={i} className="at-preview-line"><LtrNums text={l} /></span>
                ))}
              </span>
              {props.made === r.id ? (
                <span className="at-chip at-saved" data-goal-made={r.id}>{GOAL_MADE_TEXT}</span>
              ) : r.saved ? (
                <span className="at-chip at-saved" data-goal-saved={r.id}>{GOAL_SAVED_TEXT}</span>
              ) : (
                props.canEdit && (
                  <span className="at-actions">
                    <Btn kind="primary" onClick={() => props.onConnect(r.id)} title={GOAL_CONNECT_TEXT + ': ' + r.sentence}>
                      {GOAL_CONNECT_TEXT}
                    </Btn>
                  </span>
                )
              )}
            </li>
          ))}
        </ul>
      )}
      {view.questions.map((q, i) => (
        <div key={q.text + '|' + i} className="at-goal-q" data-goal-question={q.text}>
          {view.status === 'ask' && <div className="at-asks">{GOAL_ASK_HINT}</div>}
          <div className="at-goal-q-text">{q.text}</div>
          <div className="at-choices">
            {q.chips.map((c) => (
              <button key={c.label} type="button" className="at-choice" data-goal-chip={c.pick.place ?? c.pick.atom ?? c.label} onClick={() => props.onPick(c.pick)}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
