/**
 * 🧩 ארגז המנועים — המסך (13.10.2026, חזון-הבעלים: "ארגז עם מנועים עם חיבור זכר
 * ונקבה. הלקוח בוחר מנוע, והמערכת אומרת: אפשר לחבר פה ופה ושם, והתוצאה תהיה זה").
 *
 * שלושה צעדים: (1) במה מתחילים — מוצר או מנוע אחד · (2) איזה מנוע להוסיף —
 * גריד-כרטיסים בלי מנועי-ההתחלה · (3) איפה אפשר לחבר — שורה לכל מקום-חיבור,
 * התוצאה הכי גדולה, "חבר" / "✓ מחובר"+"נתק". מתחת: "בקרוב" מושתק ולא-לחיץ.
 *
 * המסך מדבר רק עם התפר (`EngineBoxSource`, ./types) — לא עם הליבה. `source=null`
 * ⇒ מצב-ריק כן ("הארגז בהרכבה"). אין כאן נתוני-דוגמה: הם חיים רק בבדיקות.
 * מגודר opt-in `shell.enginebox` (אצל הפותח — App/הגדרות), נטען lazy.
 *
 * רכיבי-הצעדים טהורים (בלי hooks) — כך הם נבדקים ב-renderToStaticMarkup ובהפעלת
 * onClick ישירה על עץ-האלמנטים (אידיום הפרויקט; אין testing-library בריפו).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Btn, Modal } from '../ui';
import { GoalPanel } from './GoalPanel';
import type { BoxFuture, BoxImpact, BoxOption, BoxPart, BoxProduct, EngineBoxSource } from './types';
import { linksLabel, pickableParts, resolveStart, type BoxStart } from './model';
import { AtomsBody } from './atoms/AtomsBody';
import { TAB_ATOMS_TEXT } from './atoms/AtomSteps';
import type { AtomsSource } from './atoms/seam';
import './enginebox.css';

export type BoxStep = 'start' | 'pick' | 'plug';
export type BoxTab = 'plug' | 'goal' | 'atoms';

export const TAB_PLUG_TEXT = '🔌 לחבר מנוע';
export const TAB_GOAL_TEXT = '🎯 להתחיל מהסוף';
export const IMPACT_TITLE = '📊 מה היה קורה בחודש האחרון';

export const EMPTY_SOURCE_TEXT = 'הארגז בהרכבה — עוד מעט';
export const NO_FIT_TEXT = 'המנוע הזה עוד לא מתחבר למוצר הזה';

// ——— צעד 1 · במה מתחילים? ———
export function StartStep(props: { products: BoxProduct[]; parts: BoxPart[]; onStart: (id: string) => void }) {
  return (
    <section aria-labelledby="eb-h-start">
      <h3 id="eb-h-start" className="eb-step-title" tabIndex={-1}>במה מתחילים?</h3>
      {props.products.length > 0 && (
        <div className="eb-grid">
          {props.products.map((p) => (
            <button
              key={p.id}
              type="button"
              className="eb-card eb-product"
              data-start={p.id}
              onClick={() => props.onStart(p.id)}
            >
              <span className="eb-emoji" aria-hidden="true">{p.emoji}</span>
              <span className="eb-name">{p.name}</span>
              <span className="eb-what">{p.parts.length === 1 ? 'מנוע אחד' : p.parts.length + ' מנועים'}</span>
            </button>
          ))}
        </div>
      )}
      {props.parts.length > 0 && (
        <>
          <h4 className="eb-sub-title">או ממנוע אחד</h4>
          <PartGrid parts={props.parts} onPick={props.onStart} attr="data-start" />
        </>
      )}
      {props.products.length === 0 && props.parts.length === 0 && (
        <div className="empty">{EMPTY_SOURCE_TEXT}</div>
      )}
    </section>
  );
}

function PartGrid(props: { parts: BoxPart[]; onPick: (id: string) => void; attr: 'data-start' | 'data-pick' }) {
  return (
    <div className="eb-grid">
      {props.parts.map((p) => (
        <button
          key={p.id}
          type="button"
          className="eb-card"
          {...{ [props.attr]: p.id }}
          onClick={() => props.onPick(p.id)}
        >
          <span className="eb-emoji" aria-hidden="true">{p.emoji}</span>
          <span className="eb-name">{p.name}</span>
          <span className="eb-from">{p.from}</span>
          <span className="eb-what">{p.what}</span>
        </button>
      ))}
    </div>
  );
}

// ——— צעד 2 · איזה מנוע להוסיף? ———
export function PickStep(props: { parts: BoxPart[]; onPick: (id: string) => void }) {
  return (
    <section aria-labelledby="eb-h-pick">
      <h3 id="eb-h-pick" className="eb-step-title" tabIndex={-1}>איזה מנוע להוסיף?</h3>
      {props.parts.length === 0 ? (
        <div className="empty">אין עוד מנועים בארגז להוסיף</div>
      ) : (
        <PartGrid parts={props.parts} onPick={props.onPick} attr="data-pick" />
      )}
    </section>
  );
}

// ——— צעד 3 · איפה אפשר לחבר? ———
export function OptionRow(props: {
  option: BoxOption;
  canEdit: boolean;
  onConnect: (key: string) => void;
  onDisconnect: (key: string) => void;
}) {
  const o = props.option;
  return (
    <li className={'eb-option' + (o.linked ? ' eb-linked' : '')} data-option={o.key}>
      <div className="eb-result">{o.result}</div>
      {o.impact && <ImpactLine impact={o.impact} optionKey={o.key} />}
      <div className="eb-plug">
        <span className="eb-end">
          <span className="eb-role">🔌 נותן</span>
          <span>{o.giver.emoji} {o.giver.name}</span>
        </span>
        <span className="eb-arrow" aria-hidden="true">←</span>
        <span className="eb-plug-chip">{o.plugLabel}</span>
        <span className="eb-arrow" aria-hidden="true">←</span>
        <span className="eb-end">
          <span className="eb-role">🔘 מקבל</span>
          <span>{o.needer.emoji} {o.needer.name}</span>
        </span>
      </div>
      {props.canEdit && (
        <div className="eb-actions">
          {o.linked ? (
            <>
              <span className="eb-on" role="status">✓ מחובר</span>
              <Btn onClick={() => props.onDisconnect(o.key)} title={'נתק: ' + o.result}>נתק</Btn>
            </>
          ) : (
            <Btn kind="primary" onClick={() => props.onConnect(o.key)} title={'חבר: ' + o.result}>חבר</Btn>
          )}
        </div>
      )}
      {!props.canEdit && o.linked && <div className="eb-actions"><span className="eb-on">✓ מחובר</span></div>}
    </li>
  );
}

/** 📊 "מה היה קורה בחודש האחרון" — קטן מהתוצאה; 0 = מידע כן בצבע ניטרלי. null לא מגיע לכאן. */
export function ImpactLine(props: { impact: BoxImpact; optionKey: string }) {
  const im = props.impact;
  return (
    <div className={'eb-impact' + (im.count === 0 ? ' eb-impact-zero' : '')} data-impact={props.optionKey}>
      <div className="eb-impact-title">{IMPACT_TITLE}</div>
      <div className="eb-impact-text">{im.headline}</div>
      {im.examples.length > 0 && (
        <ul className="eb-impact-ex">
          {im.examples.slice(0, 3).map((ex, i) => (
            <li key={i}>{ex}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function FutureList(props: { items: BoxFuture[] }) {
  if (props.items.length === 0) return null;
  return (
    <section className="eb-future" aria-labelledby="eb-h-future">
      <h4 id="eb-h-future" className="eb-sub-title">בקרוב <span className="eb-soon">עוד לא זמין</span></h4>
      <ul className="eb-future-list">
        {props.items.map((f, i) => (
          <li key={f.giver.id + '|' + f.needer.id + '|' + i} className="eb-future-item" aria-disabled="true">
            <div className="eb-future-result">{f.result}</div>
            <div className="eb-future-plug">
              {f.giver.emoji} {f.giver.name} ← {f.plugLabel} ← {f.needer.emoji} {f.needer.name}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PlugStep(props: {
  picked: BoxPart;
  options: BoxOption[];
  future: BoxFuture[];
  canEdit: boolean;
  onConnect: (key: string) => void;
  onDisconnect: (key: string) => void;
}) {
  return (
    <section aria-labelledby="eb-h-plug">
      <h3 id="eb-h-plug" className="eb-step-title" tabIndex={-1}>איפה אפשר לחבר את {props.picked.emoji} {props.picked.name}?</h3>
      {props.options.length === 0 ? (
        <div className="empty">{NO_FIT_TEXT}</div>
      ) : (
        <ul className="eb-options">
          {props.options.map((o) => (
            <OptionRow key={o.key} option={o} canEdit={props.canEdit} onConnect={props.onConnect} onDisconnect={props.onDisconnect} />
          ))}
        </ul>
      )}
      <FutureList items={props.future} />
    </section>
  );
}

export function BoxHeader(props: { start: BoxStart; linked: number; onBack: () => void; backLabel: string }) {
  return (
    <div className="eb-head">
      <div className="eb-head-start">
        <span className="eb-emoji" aria-hidden="true">{props.start.emoji}</span>
        <div>
          <div className="eb-name">{props.start.name}</div>
          <div className="eb-what">{linksLabel(props.linked)} עכשיו</div>
        </div>
      </div>
      <Btn onClick={props.onBack}>→ {props.backLabel}</Btn>
    </div>
  );
}

// ——— הלשוניות: (מנועים וחלקים) / לחבר מנוע / להתחיל מהסוף ———
/** ATOMS 14.10: `atoms` ⇒ "🧬 מנועים וחלקים" ראשונה; `goal:false` ⇒ בלי "להתחיל מהסוף". בלי שניהם ⇒ ביט-זהה לקודם. */
export function BoxTabs(props: { tab: BoxTab; onTab: (tab: BoxTab) => void; atoms?: boolean; goal?: boolean }) {
  const tabs: [BoxTab, string][] = [['plug', TAB_PLUG_TEXT], ['goal', TAB_GOAL_TEXT]];
  if (props.goal === false) tabs.pop();
  if (props.atoms) tabs.unshift(['atoms', TAB_ATOMS_TEXT]);
  return (
    <div className="eb-tabs" role="tablist" aria-label="איך מתחילים">
      {tabs.map(([id, label]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={props.tab === id}
          className={'eb-tab' + (props.tab === id ? ' eb-tab-on' : '')}
          data-tab={id}
          onClick={() => props.onTab(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** 🎯 הלשונית: המשפט ⇒ goalRoutes (דרך המקור) ⇒ GoalPanel. canEdit=false ⇒ מסלולים בלי כפתורים. */
export function GoalTab(props: { source: EngineBoxSource; start: string | null; text: string; onText: (text: string) => void }) {
  const { source, start, text } = props;
  const result = useMemo(() => (source.goal ? source.goal(text, start) : null), [source, text, start]);
  return (
    <GoalPanel
      text={text}
      result={result}
      canEdit={source.canEdit}
      onText={props.onText}
      onApply={(keys) => source.applyRoute?.(keys)}
      onRequestEngine={(plug, t) => source.requestEngine?.(plug, t)}
    />
  );
}

// ——— המסך המלא ———
export function EngineBoxBody(props: {
  source: EngineBoxSource | null;
  initial?: { start?: string; picked?: string; tab?: BoxTab; goal?: string };
  /** ATOMS 14.10: undefined ⇒ אין לשונית "מנועים וחלקים" (ביט-זהה לקודם); null ⇒ הלשונית עם מצב-ריק כן. */
  atoms?: AtomsSource | null;
}) {
  const { source } = props;
  const [tab, setTab] = useState<BoxTab>(props.initial?.tab ?? 'plug');
  const [goalText, setGoalText] = useState(props.initial?.goal ?? '');
  const [startId, setStartId] = useState<string | null>(props.initial?.start ?? null);
  const [pickedId, setPickedId] = useState<string | null>(props.initial?.picked ?? null);
  // מונה-רענון: connect/disconnect משנים את הליבה מחוץ ל-React — מרנדרים מחדש.
  const [, setTick] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);

  const start = source && startId ? resolveStart(source, startId) : null;
  const picked = source && start && pickedId ? source.parts().find((p) => p.id === pickedId) ?? null : null;
  const step: BoxStep = !start ? 'start' : !picked ? 'pick' : 'plug';
  const hasGoal = !!source?.goal;
  const goalOn = hasGoal && tab === 'goal';
  const hasAtoms = props.atoms !== undefined;
  const atomsOn = hasAtoms && tab === 'atoms';

  // פוקוס לכותרת-הצעד בכל מעבר — קורא-מסך שומע איפה הוא
  useEffect(() => {
    if (!goalOn) bodyRef.current?.querySelector<HTMLElement>('.eb-step-title')?.focus();
  }, [step, goalOn]);

  if (atomsOn) {
    return (
      <div ref={bodyRef} className="eb-body" data-tab="atoms">
        <BoxTabs tab="atoms" onTab={setTab} atoms goal={hasGoal} />
        <AtomsBody source={props.atoms ?? null} />
      </div>
    );
  }

  if (!source) {
    const empty = <div className="empty eb-empty">🧩 {EMPTY_SOURCE_TEXT}</div>;
    if (!hasAtoms) return empty;
    return (
      <div ref={bodyRef} className="eb-body">
        <BoxTabs tab={tab} onTab={setTab} atoms goal={false} />
        {empty}
      </div>
    );
  }

  if (goalOn) {
    return (
      <div ref={bodyRef} className="eb-body" data-tab="goal">
        <BoxTabs tab="goal" onTab={setTab} atoms={hasAtoms} />
        {start && (
          <div className="eb-goal-from">
            מתחילים מ: <span aria-hidden="true">{start.emoji}</span> {start.name}
          </div>
        )}
        <GoalTab source={source} start={start ? start.id : null} text={goalText} onText={setGoalText} />
      </div>
    );
  }

  const back = () => {
    if (step === 'plug') setPickedId(null);
    else { setPickedId(null); setStartId(null); }
  };
  const act = (fn: (key: string) => void) => (key: string) => {
    fn(key);
    setTick((t) => t + 1);
  };

  return (
    <div ref={bodyRef} className="eb-body" data-step={step}>
      {(hasGoal || hasAtoms) && <BoxTabs tab="plug" onTab={setTab} atoms={hasAtoms} goal={hasGoal} />}
      {start && (
        <BoxHeader
          start={start}
          linked={source.linkedCount(start.id)}
          onBack={back}
          backLabel={step === 'plug' ? 'מנוע אחר' : 'התחלה אחרת'}
        />
      )}
      {step === 'start' && <StartStep products={source.products()} parts={source.parts()} onStart={setStartId} />}
      {step === 'pick' && start && <PickStep parts={pickableParts(source, start)} onPick={setPickedId} />}
      {step === 'plug' && start && picked && (
        <PlugStep
          picked={picked}
          options={source.options(start.id, picked.id)}
          future={source.future(start.id, picked.id)}
          canEdit={source.canEdit}
          onConnect={act((k) => source.connect(k))}
          onDisconnect={act((k) => source.disconnect(k))}
        />
      )}
    </div>
  );
}

export function EngineBoxScreen(props: {
  source: EngineBoxSource | null;
  onClose: () => void;
  initial?: { start?: string; picked?: string; tab?: BoxTab; goal?: string };
  /** ATOMS 14.10 — ראו EngineBoxBody. */
  atoms?: AtomsSource | null;
}) {
  return (
    <Modal title="🧩 ארגז המנועים" onClose={props.onClose} wide>
      <p className="eb-intro">כל מנוע נותן משהו ומקבל משהו. בוחרים במה מתחילים, מוסיפים מנוע — ורואים איפה הוא מתחבר ומה יוצא מזה.</p>
      <EngineBoxBody source={props.source} initial={props.initial} atoms={props.atoms} />
      <div className="modal-actions">
        <Btn onClick={props.onClose}>סגירה</Btn>
      </div>
    </Modal>
  );
}
