/**
 * 🧬 מנועים וחלקים — רכיבי-הצעדים הטהורים (בלי hooks). נבדקים ב-renderToStaticMarkup
 * ובהפעלת onClick ישירה על עץ-האלמנטים (אידיום-הפרויקט).
 *
 * המסלול של הבעלים: יש לך מנוע ⇒ בוחרים חלק קטן ⇒ הוא שואל שאלה אחת ("מה לחלק?") ומציע רק
 * מקומות מהסוג שלו, כל אחד עם התוצאה ⇒ פרטים ⇒ "חבר" ⇒ מנוע חדש.
 */
import { Btn } from '../../ui';
import { KINDS, type AtomCard, type Capability, type Detail, type EngineCard, type Kind, type Option } from '../../../lib/atoms/contract';
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

export const kindLabel = (k: Kind) => KINDS.find((x) => x.id === k)?.label ?? k;

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
export function HostStep(props: { engines: EngineCard[]; onHost: (id: string) => void }) {
  return (
    <section aria-labelledby="at-h-host">
      <h3 id="at-h-host" className="at-title">{HOST_TITLE}</h3>
      <div className="at-grid">
        {props.engines.map((e) => (
          <button key={e.id} type="button" className="at-card" data-host={e.id} onClick={() => props.onHost(e.id)}>
            <span className="at-emoji" aria-hidden="true">{e.emoji}</span>
            <span className="at-name">{e.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function AtomGrid(props: { host: EngineCard; atoms: AtomCard[]; engines: EngineCard[]; onAtom: (id: string) => void }) {
  return (
    <section aria-labelledby="at-h-atoms">
      <h3 id="at-h-atoms" className="at-title" tabIndex={-1}>איזה חלק לחבר אל {props.host.emoji} {props.host.name}?</h3>
      <div className="at-grid">
        {props.atoms.map((a) => (
          <button key={a.id} type="button" className="at-card" data-atom={a.id} onClick={() => props.onAtom(a.id)}>
            <span className="at-emoji" aria-hidden="true">{a.emoji}</span>
            <span className="at-name">{a.name}</span>
            <span className="at-chip">{fromChip(a, props.engines)}</span>
            <span className="at-what">{a.computes}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function ChainsList(props: { chains: AtomChain[]; atoms: AtomCard[] }) {
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
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ——— 3 · השאלה האחת ———
export function QuestionStep(props: { atom: AtomCard; options: Option[]; onOption: (place: string) => void }) {
  return (
    <section aria-labelledby="at-h-q">
      <div className="at-asks"><span aria-hidden="true">{props.atom.emoji}</span> {props.atom.name} שואל:</div>
      <h3 id="at-h-q" className="at-question" tabIndex={-1}>{props.atom.question}</h3>
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
                </span>
                <span className="at-result">{o.result}</span>
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
          <div className="at-preview-title">{props.preview.title}</div>
          <ul className="at-preview-lines">
            {props.preview.lines.map((l, i) => (
              <li key={i}><bdi>{l}</bdi></li>
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
}) {
  if (props.capabilities.length === 0) return null;
  return (
    <section aria-labelledby="at-h-mine">
      <h4 id="at-h-mine" className="at-sub">המנועים שיצרת</h4>
      <ul className="at-list">
        {props.capabilities.map((c) => {
          const e = props.engines.find((x) => x.id === c.engine);
          const armed = props.armed === c.id;
          return (
            <li key={c.id} className="at-mine" data-capability={c.id}>
              <span className="at-mine-text">
                <span className="at-name">✨ {c.name}</span>
                {e && <span className="at-what">{e.emoji} {e.name}</span>}
              </span>
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
