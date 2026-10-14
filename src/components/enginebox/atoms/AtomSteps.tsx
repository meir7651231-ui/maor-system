/**
 * 🧬 מנועים וחלקים — רכיבי-הצעדים הטהורים (בלי hooks). נבדקים ב-renderToStaticMarkup
 * ובהפעלת onClick ישירה על עץ-האלמנטים (אידיום-הפרויקט).
 *
 * המסלול של הבעלים: יש לך מנוע ⇒ בוחרים חלק קטן ⇒ הוא שואל שאלה אחת ("מה לחלק?") ומציע רק
 * מקומות מהסוג שלו, כל אחד עם התוצאה ⇒ פרטים ⇒ "חבר" ⇒ מנוע חדש.
 */
import { Btn } from '../../ui';
import type { AtomCard, Capability, Detail, EngineCard, Kind, Option } from '../../../lib/atoms/contract';
import { examplesOf, KIND_PLAIN } from '../../../lib/atoms/explain';
import type { AtomChain, AtomPreview } from './seam';
import { fromChip, type DetailValues } from './naming';

export const TAB_ATOMS_TEXT = '🧬 מנועים וחלקים';
export const ATOMS_EMPTY_TEXT = '🧬 החלקים בהרכבה — עוד מעט';
export const NO_PLACE_TEXT = 'החלק הזה לא מתחבר למנוע הזה';
export const PREVIEW_SOON_TEXT = 'התצוגה תגיע בקרוב';
export const HOST_TITLE = 'יש לך מנוע · איזה חלק לחבר אליו?';
export const CONNECT_TEXT = 'חבר';
export const REMOVE_TEXT = 'הסר';
export const REMOVE_ARMED_TEXT = 'בטוח? לחצו שוב';

export const MORE_EXAMPLES_TEXT = 'עוד דוגמאות';

// CHAIN 14.10: מנוע שנוצר חוזר לארגז — אפשר לבנות עליו
export const SAVE_CHAIN_TEXT = 'שמור כמנוע';
export const SAVED_CHAIN_TEXT = 'נשמר כמנוע ✓';
export const BUILD_ON_TEXT = 'בנה עליו';
export const BUILT_ON_TEXT = 'בנוי על';
export const ORPHAN_TEXT = 'המנוע שעליו הוא בנוי הוסר';
export const NOTHING_FITS_TEXT = 'עוד אין חלק שמתחבר למנוע הזה';
export const MAX_GEN_TEXT = 'על המנוע הזה כבר אי אפשר לבנות עוד — עד 3 מנועים בשרשרת';
export const CREATED_HOST_HINT = 'מנועים שיצרת — לחצו כדי לחבר אליהם עוד חלק';
/** "קודם הסירו את ✨ מנוע תורים באורך משתנה שבנוי עליו". */
/** FACTORY 14.10: הקבוצה של המנועים שהמפרק מצא, והחותמת של המאמת (אותם טקסטים כמו בחריצים של העיצוב). */
export const FOUND_TITLE = '🤖 מנועים שנמצאו אוטומטית';
export const VERIFIED_TEXT = '✅ מאומת';
export const verifiedLabel = (checks: number) => VERIFIED_TEXT + ' · ' + (checks === 1 ? 'בדיקה אחת' : checks + ' בדיקות');
export interface Verified { checks: number }
export function VerifiedStamp(props: { verified?: Verified | null }) {
  if (!props.verified || !(props.verified.checks > 0)) return null;
  return <span className="at-chip at-verified" data-verified={props.verified.checks}>{verifiedLabel(props.verified.checks)}</span>;
}

export const blockedText = (names: readonly string[]) => 'קודם הסירו את ' + names.map((n) => '✨ ' + n).join(', ') + ' ש' + (names.length > 1 ? 'בנויים' : 'בנוי') + ' עליו';

/** ATOMS-NAMES: שם-הסוג כמו שהמשתמש רואה אותו ("מ… עד…", "סכום") — לא התוויות הטכניות של החוזה. */
export const kindLabel = (k: Kind) => KIND_PLAIN[k] ?? k;

/** דוגמה אחת "קלט ← תוצאה" — החץ מודגש, הטקסט נשאר כמו שאושר. */
function ExampleLine(props: { text: string }) {
  const bits = props.text.split('←');
  return (
    <li className="at-ex">
      {bits.map((b, i) => (
        <span key={i}>
          {i > 0 && <span className="at-ex-arrow">←</span>}
          {b}
        </span>
      ))}
    </li>
  );
}

/**
 * שלוש הדוגמאות של חלק או מנוע: הראשונה גלויה, השתיים האחרות מאחורי "עוד דוגמאות"
 * (במובייל לא מעמיס על המסך). לא בתוך כפתור — details בתוך button אינו חוקי.
 */
export function Examples(props: { id: string }) {
  const ex = examplesOf(props.id);
  if (ex.length === 0) return null;
  return (
    <div className="at-examples" data-examples={props.id}>
      <ul className="at-ex-list" aria-label="דוגמה">
        <ExampleLine text={ex[0]} />
      </ul>
      {ex.length > 1 && (
        <details className="at-more">
          <summary>{MORE_EXAMPLES_TEXT}</summary>
          <ul className="at-ex-list">
            {ex.slice(1).map((t) => <ExampleLine key={t} text={t} />)}
          </ul>
        </details>
      )}
    </div>
  );
}

/**
 * רצף מספרי (שעות, טווחים, תאריכים, סכומים): "11:00–11:40" · "16/10 15:00" · "₪1,200 = 3 × ₪400". פסיק רק כמפריד-אלפים
 * (צמוד לספרה) — רשימת תאריכים "13/10, 14/10" נשארת שני רצפים בסדר-הקריאה העברי.
 */
export const NUM_RUN = /[₪\d](?:[\d:/.₪×=+\s–-]|,(?=\d))*\d/g;

/**
 * ATOMS 14.10: שורת-תוצאה בעברית עם רצפים מספריים — כל רצף מבודד משמאל-לימין (`<bdi dir="ltr">`), אחרת בשורה עברית
 * "11:00–11:40" מוצג הפוך ("11:40–11:00") ו"₪1,200 = 3 × ₪400" מתהפך. הטקסט עצמו לא משתנה.
 */
export function LtrNums(props: { text: string }) {
  const out: (string | ReturnType<typeof Bdi>)[] = [];
  let last = 0;
  for (const m of props.text.matchAll(NUM_RUN)) {
    const at = m.index ?? 0;
    if (at > last) out.push(props.text.slice(last, at));
    out.push(<Bdi key={at} t={m[0]} />);
    last = at + m[0].length;
  }
  if (last < props.text.length) out.push(props.text.slice(last));
  return <bdi>{out}</bdi>;
}
function Bdi(props: { t: string }) {
  return <bdi dir="ltr">{props.t}</bdi>;
}

// ——— 1 · המנועים ———
export function EnginesStep(props: { engines: EngineCard[]; atoms: AtomCard[]; open: string | null; onToggle: (id: string) => void }) {
  return (
    <section aria-labelledby="at-h-engines">
      <h3 id="at-h-engines" className="at-title">המנועים</h3>
      <p className="at-hint">כל מנוע גדול בנוי ממנועים קטנים. לחצו על מנוע כדי לראות ממה הוא בנוי.</p>
      <ul className="at-list">
        {props.engines.map((e) => {
          const isOpen = props.open === e.id;
          return (
            <li key={e.id} className={'at-engine' + (isOpen ? ' at-open' : '')}>
              <button
                type="button"
                className="at-engine-head"
                data-engine={e.id}
                aria-expanded={isOpen}
                onClick={() => props.onToggle(e.id)}
              >
                <span className="at-emoji" aria-hidden="true">{e.emoji}</span>
                <span className="at-engine-text">
                  <span className="at-name">{e.name}</span>
                  <span className="at-chip">{e.from}</span>
                  <span className="at-what">{e.computes}</span>
                </span>
              </button>
              <Examples id={e.id} />
              {isOpen && <Decomposition engine={e} atoms={props.atoms} />}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function Decomposition(props: { engine: EngineCard; atoms: AtomCard[] }) {
  return (
    <ol className="at-parts" data-parts={props.engine.id} aria-label={'ממה בנוי ' + props.engine.name}>
      {props.engine.parts.map((p) => {
        const a = p.atom ? props.atoms.find((x) => x.id === p.atom) : undefined;
        return (
          <li key={p.num} className="at-part" data-num={p.num}>
            <span className="at-num">{p.num}</span>
            <span className="at-part-text">
              <span className="at-part-name">
                {p.name}
                {p.atom && <span className="at-chip at-inbox"> בארגז {a?.emoji ?? '🧩'}</span>}
              </span>
              <span className="at-what">{p.computes}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// ——— 2 · יש לך מנוע ———
export function HostStep(props: {
  engines: EngineCard[];
  onHost: (id: string) => void;
  created?: readonly { id: string; card: EngineCard }[];
  /** FACTORY 14.10: המנועים שנמצאו אוטומטית (רק מה שאומת). */
  found?: readonly { id: string; card: EngineCard; verified?: Verified }[];
}) {
  const created = props.created ?? [];
  const found = props.found ?? [];
  return (
    <section aria-labelledby="at-h-host">
      <h3 id="at-h-host" className="at-title">{HOST_TITLE}</h3>
      <div className="at-grid at-grid-wide">
        {props.engines.map((e) => (
          <div key={e.id} className="at-card-wrap">
            <button type="button" className="at-card" data-host={e.id} onClick={() => props.onHost(e.id)}>
              <span className="at-emoji" aria-hidden="true">{e.emoji}</span>
              <span className="at-name">{e.name}</span>
              <span className="at-what">{e.computes}</span>
            </button>
            <Examples id={e.id} />
          </div>
        ))}
        {created.map((c) => (
          <div key={c.id} className="at-card-wrap">
            <button type="button" className="at-card at-card-made" data-host-cap={c.id} onClick={() => props.onHost(c.id)}>
              <span className="at-emoji" aria-hidden="true">✨</span>
              <span className="at-name">{c.card.name}</span>
              <span className="at-what"><LtrNums text={c.card.computes} /></span>
            </button>
          </div>
        ))}
      </div>
      {created.length > 0 && <p className="at-hint">{CREATED_HOST_HINT}</p>}
      {found.length > 0 && (
        <section aria-labelledby="at-h-found" data-found-group="1">
          <h4 id="at-h-found" className="at-sub">{FOUND_TITLE}</h4>
          <div className="at-grid at-grid-wide">
            {found.map((f) => (
              <div key={f.id} className="at-card-wrap">
                <button type="button" className="at-card" data-host-found={f.id} onClick={() => props.onHost(f.id)}>
                  <span className="at-emoji" aria-hidden="true">{f.card.emoji}</span>
                  <span className="at-name">{f.card.name}</span>
                  <span className="at-what">{f.card.computes}</span>
                  <VerifiedStamp verified={f.verified} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

export function AtomGrid(props: { host: EngineCard; atoms: AtomCard[]; engines: EngineCard[]; onAtom: (id: string) => void; emptyText?: string }) {
  return (
    <section aria-labelledby="at-h-atoms">
      <h3 id="at-h-atoms" className="at-title" tabIndex={-1}>איזה חלק לחבר אל {props.host.emoji} {props.host.name}?</h3>
      {props.atoms.length === 0 && props.emptyText && <div className="empty" data-atoms-none="1">{props.emptyText}</div>}
      <div className="at-grid at-grid-wide">
        {props.atoms.map((a) => (
          <div key={a.id} className="at-card-wrap">
            <button type="button" className="at-card" data-atom={a.id} onClick={() => props.onAtom(a.id)}>
              <span className="at-emoji" aria-hidden="true">{a.emoji}</span>
              <span className="at-name">{a.name}</span>
              <span className="at-what">{a.computes}</span>
              <span className="at-chip">{fromChip(a, props.engines)}</span>
            </button>
            <Examples id={a.id} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function ChainsList(props: { chains: AtomChain[]; atoms: AtomCard[]; canEdit?: boolean; onSave?: (index: number) => void }) {
  if (props.chains.length === 0) return null;
  const emo = (id: string) => props.atoms.find((a) => a.id === id)?.emoji ?? '🧩';
  return (
    <section className="at-chains" aria-labelledby="at-h-chains">
      <h4 id="at-h-chains" className="at-sub">שרשראות</h4>
      <ul className="at-list">
        {props.chains.map((c, i) => (
          <li key={c.atoms.join('>') + '|' + i} className="at-chain" data-chain={c.atoms.join('>')}>
            <span className="at-chain-emo" aria-hidden="true">{emo(c.atoms[0])} ← {emo(c.atoms[1])}</span>
            <span className="at-chain-text">
              <span className="at-name">{c.name}</span>
              <span className="at-what">{c.result}</span>
              {c.lines && c.lines.length > 0 && (
                <span className="at-preview at-preview-mini" data-preview="chain">
                  {c.lines.map((l, j) => (
                    <span key={j} className="at-preview-line"><LtrNums text={l} /></span>
                  ))}
                </span>
              )}
              {c.savedId ? (
                <span className="at-chip at-saved" data-chain-saved={c.savedId}>{SAVED_CHAIN_TEXT}</span>
              ) : (
                props.canEdit && c.canSave && props.onSave && (
                  <span className="at-actions">
                    <Btn onClick={() => props.onSave!(i)} title={SAVE_CHAIN_TEXT + ': ' + c.name}>
                      <span data-save-chain={c.atoms.join('>')}>{SAVE_CHAIN_TEXT}</span>
                    </Btn>
                  </span>
                )
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ——— 3 · השאלה האחת ———
/** ATOMS 14.10 (תוספתי): כמה שורות מהתוצאה האמיתית מוצגות ליד כל אפשרות בשאלה. */
export const OPTION_PREVIEW_LINES = 2;

/** התוצאה האמיתית בקטן (כותרת + עד `max` שורות). */
function PreviewMini(props: { preview: AtomPreview; max?: number }) {
  const lines = props.max ? props.preview.lines.slice(0, props.max) : props.preview.lines;
  return (
    <span className="at-preview at-preview-mini" data-preview="real">
      <span className="at-preview-title"><LtrNums text={props.preview.title} /></span>
      {lines.map((l, i) => (
        <span key={i} className="at-preview-line"><LtrNums text={l} /></span>
      ))}
    </span>
  );
}

export function QuestionStep(props: {
  atom: AtomCard;
  options: Option[];
  onOption: (place: string) => void;
  previews?: Readonly<Record<string, AtomPreview | null>>;
  /** FACTORY 14.10: "✅ מאומת" לכל אפשרות שהמפעל אימת. */
  verified?: Readonly<Record<string, Verified>>;
}) {
  return (
    <section aria-labelledby="at-h-q">
      <div className="at-asks"><span aria-hidden="true">{props.atom.emoji}</span> {props.atom.name} שואל:</div>
      <h3 id="at-h-q" className="at-question" tabIndex={-1}>{props.atom.question}</h3>
      <p className="at-what at-q-explain">{props.atom.computes}</p>
      <Examples id={props.atom.id} />
      {props.options.length === 0 ? (
        <div className="empty">{NO_PLACE_TEXT}</div>
      ) : (
        <ul className="at-list" aria-label="מה יש במנוע שלך">
          {props.options.map((o) => (
            <li key={o.place}>
              <button type="button" className="at-option" data-place={o.place} onClick={() => props.onOption(o.place)}>
                <span className="at-option-head">
                  <span className="at-place">{o.placeName}</span>
                  <span className="at-chip at-kind">{kindLabel(o.kind)}</span>
                  <VerifiedStamp verified={props.verified?.[o.place]} />
                </span>
                <span className="at-result">{o.result}</span>
                {props.previews?.[o.place] && <PreviewMini preview={props.previews[o.place]!} max={OPTION_PREVIEW_LINES} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ——— 4 · הפרטים ———
function DetailField(props: { d: Detail; value: number | string; canEdit: boolean; onValue: (id: string, v: number | string) => void }) {
  const { d } = props;
  const fid = 'at-d-' + d.id;
  if (d.type === 'choice') {
    return (
      <div className="at-field" role="group" aria-labelledby={fid}>
        <div id={fid} className="at-label">{d.label}</div>
        <div className="at-choices">
          {(d.choices ?? []).map((c) => (
            <button
              key={c.id}
              type="button"
              className={'at-choice' + (props.value === c.id ? ' at-on' : '')}
              aria-pressed={props.value === c.id}
              data-choice={d.id + ':' + c.id}
              disabled={!props.canEdit}
              onClick={() => props.onValue(d.id, c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="at-field">
      <label htmlFor={fid} className="at-label">{d.label}</label>
      <span className="at-input-row">
        <input
          id={fid}
          className="at-input"
          type="number"
          inputMode="numeric"
          dir="ltr"
          min={d.min}
          max={d.max}
          value={props.value}
          readOnly={!props.canEdit}
          data-detail={d.id}
          onChange={(ev) => props.onValue(d.id, ev.target.value)}
        />
        {d.type === 'minutes' && <span className="at-unit">דקות</span>}
      </span>
    </div>
  );
}

export function DetailsStep(props: {
  atom: AtomCard;
  option: Option;
  values: DetailValues;
  canEdit: boolean;
  onValue: (id: string, v: number | string) => void;
  onConnect: () => void;
  /** ATOMS 14.10 (תוספתי): התוצאה האמיתית עם הפרטים שבטופס, מתעדכנת בכל שינוי. undefined ⇒ בלי בלוק. */
  preview?: AtomPreview | null;
}) {
  return (
    <section aria-labelledby="at-h-details">
      <h3 id="at-h-details" className="at-title" tabIndex={-1}>{props.atom.emoji} {props.atom.name} · {props.option.placeName}</h3>
      <div className="at-result at-picked">{props.option.result}</div>
      {props.atom.details.length > 0 && (
        <div className="at-form">
          {props.atom.details.map((d) => (
            <DetailField key={d.id} d={d} value={props.values[d.id] ?? d.default} canEdit={props.canEdit} onValue={props.onValue} />
          ))}
        </div>
      )}
      {props.preview !== undefined && (props.preview ? <PreviewMini preview={props.preview} /> : <div className="at-preview at-soon">{PREVIEW_SOON_TEXT}</div>)}
      {props.canEdit && (
        <div className="at-actions">
          <Btn kind="primary" onClick={props.onConnect} title={'חבר: ' + props.option.result}>{CONNECT_TEXT}</Btn>
        </div>
      )}
    </section>
  );
}

// ——— 5 · המנוע החדש ———
export function CreatedCard(props: { capability: Capability; preview: AtomPreview | null }) {
  return (
    <section className="at-made" aria-labelledby="at-h-made" data-made={props.capability.id}>
      <h3 id="at-h-made" className="at-title" tabIndex={-1}>✨ נוצר מנוע חדש: {props.capability.name}</h3>
      {props.preview ? (
        <div className="at-preview">
          <div className="at-preview-title"><LtrNums text={props.preview.title} /></div>
          <ul className="at-preview-lines">
            {props.preview.lines.map((l, i) => (
              <li key={i}><LtrNums text={l} /></li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="at-preview at-soon">{PREVIEW_SOON_TEXT}</div>
      )}
    </section>
  );
}

export function CreatedList(props: {
  capabilities: Capability[];
  engines: EngineCard[];
  canEdit: boolean;
  armed: string | null;
  onRemoveTap: (id: string) => void;
  /** CHAIN 14.10 (תוספתי): פתיחת מנוע שנוצר כדי לבנות עליו · מצב בתוך הרשימה · שורת-חסימה להסרה. */
  onOpen?: (id: string) => void;
  canOpen?: (id: string) => boolean;
  stateOf?: (id: string) => 'ok' | 'orphan' | 'bad';
  blocked?: { id: string; text: string } | null;
  /** FACTORY 14.10: "✅ מאומת" למנוע שנוצר. */
  verifiedOf?: (id: string) => Verified | undefined;
}) {
  if (props.capabilities.length === 0) return null;
  const nameById = new Map(props.capabilities.map((c) => [c.id, c.name]));
  return (
    <section aria-labelledby="at-h-mine">
      <h4 id="at-h-mine" className="at-sub">המנועים שיצרת</h4>
      <ul className="at-list">
        {props.capabilities.map((c) => {
          const e = props.engines.find((x) => x.id === c.engine);
          const armed = props.armed === c.id;
          const state = props.stateOf ? props.stateOf(c.id) : 'ok';
          const parentName = c.parent ? nameById.get(c.parent) : undefined;
          return (
            <li key={c.id} className="at-mine" data-capability={c.id} data-cap-state={state}>
              <span className="at-mine-text">
                <span className="at-name">✨ {c.name}</span>
                <VerifiedStamp verified={props.verifiedOf?.(c.id)} />
                {state === 'ok' && parentName && <span className="at-what">{BUILT_ON_TEXT} ✨ {parentName}</span>}
                {state === 'ok' && !c.parent && e && <span className="at-what">{e.emoji} {e.name}</span>}
                {state !== 'ok' && <span className="at-what at-orphan" data-orphan="1">{ORPHAN_TEXT}</span>}
                {props.blocked?.id === c.id && <span className="at-what at-blocked" role="status" data-blocked={c.id}>{props.blocked.text}</span>}
              </span>
              {state === 'ok' && props.onOpen && (!props.canOpen || props.canOpen(c.id)) && (
                <Btn onClick={() => props.onOpen!(c.id)} title={BUILD_ON_TEXT + ': ' + c.name}>
                  <span data-open-cap={c.id}>{BUILD_ON_TEXT}</span>
                </Btn>
              )}
              {props.canEdit && (
                <Btn kind={armed ? 'danger' : undefined} onClick={() => props.onRemoveTap(c.id)} title={'הסר: ' + c.name}>
                  {armed ? REMOVE_ARMED_TEXT : REMOVE_TEXT}
                </Btn>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function AtomsHeader(props: { host: EngineCard; onBack: () => void; backLabel: string }) {
  return (
    <div className="at-head">
      <span className="at-head-host">
        <span className="at-emoji" aria-hidden="true">{props.host.emoji}</span>
        <span className="at-name">{props.host.name}</span>
      </span>
      <Btn onClick={props.onBack}>→ {props.backLabel}</Btn>
    </div>
  );
}
