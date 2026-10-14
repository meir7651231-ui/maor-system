/**
 * 🧬 מנועים וחלקים — רכיבי-הצעדים הטהורים (בלי hooks). נבדקים ב-renderToStaticMarkup
 * ובהפעלת onClick ישירה על עץ-האלמנטים (אידיום-הפרויקט).
 *
 * המסלול של הבעלים: יש לך מנוע ⇒ בוחרים חלק קטן ⇒ הוא שואל שאלה אחת ("מה לחלק?") ומציע רק
 * מקומות מהסוג שלו, כל אחד עם התוצאה ⇒ פרטים ⇒ "חבר" ⇒ מנוע חדש.
 *
 * DESIGN 14.10 (knowledge/DESIGN-ENGINEBOX-2026-10-14.md): מנוע גדול = "מכונה" (אריח מוצק), חלק קטן = "תקע" (אריח עם
 * שני פינים), מקום במנוע = "שקע" (מסגרת מקווקוות). מונה 1-2-3 גלוי, "חזור" בפס עליון דביק, "חבר" בפס תחתון דביק,
 * והתוצאה האמיתית כגיבור. אותם נתונים, אותן פעולות, אותם data-* — רק המראה והסדר.
 * חריצים לאינטגרציה (UI בלבד): `verified` ⇒ "✅ מאומת" · `found` ⇒ "🤖 מנועים שנמצאו אוטומטית".
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
// DESIGN 14.10: הכותרת של צעד 1 — שאלה אחת פשוטה (היה 'יש לך מנוע · איזה חלק לחבר אליו?' — המסך הראשון עכשיו מאוחד)
export const HOST_TITLE = 'איזה מנוע יש לך?';
export const HOST_HINT = 'כל מנוע עושה עבודה אחת גדולה. בוחרים אחד — ואז מוסיפים לו חלק קטן.';
// DESIGN 14.10: כל כפתור אומר מה יקרה (היה 'חבר')
export const CONNECT_TEXT = 'חבר וצור מנוע חדש';
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

// DESIGN 14.10: מונה השלבים, הגיבור, הצעד הבא, והחריצים לאינטגרציה
export const STEP_LABELS = ['בחר מנוע', 'בחר מה להוסיף', 'ראה תוצאה וחבר'] as const;
export const PARTS_TOGGLE_TEXT = 'ממה הוא בנוי';
export const PICK_ENGINE_TEXT = 'בחר';
export const PICK_OPTION_TEXT = 'בחר את זה';
export const RESULT_LABEL = 'התוצאה על הנתונים שלך';
export const TUNE_TITLE = 'אפשר לשנות (לא חובה)';
export const CONNECT_HINT = 'המנוע החדש יחזור לארגז';
export const MADE_HINT = 'המנוע החדש חזר לארגז — הוא מחכה ב"המנועים שיצרת".';
export const MORE_PARTS_TEXT = 'עוד חלק';
export const MINE_TITLE = 'המנועים שיצרת';
export const FOUND_TITLE = '🤖 מנועים שנמצאו אוטומטית';
export const VERIFIED_TEXT = '✅ מאומת';
export const verifiedLabel = (checks: number) => VERIFIED_TEXT + ' · ' + (checks === 1 ? 'בדיקה אחת' : checks + ' בדיקות');
export const partsCount = (n: number) => (n === 1 ? 'חלק אחד' : n + ' חלקים');
/** חריץ (DESIGN 14.10): חותמת "מאומת" — המפעל ימלא. בלי נתונים ⇒ כלום. */
export interface Verified { checks: number }
/** "קודם הסירו את ✨ מנוע תורים באורך משתנה שבנוי עליו". */
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

// ——— חריצים · מונה השלבים ———
/** "✅ מאומת · 12 בדיקות" (DESIGN 14.10, חריץ לאינטגרציה). undefined ⇒ כלום. */
export function VerifiedStamp(props: { verified?: Verified | null }) {
  if (!props.verified || !(props.verified.checks > 0)) return null;
  return <span className="at-verified" data-verified={props.verified.checks}>{verifiedLabel(props.verified.checks)}</span>;
}

/** 1 · בחר מנוע ← 2 · בחר מה להוסיף ← 3 · ראה תוצאה וחבר. `at` = 0..2, ו-3 = הכול בוצע (נוצר מנוע). */
export function StepIndicator(props: { at: number }) {
  return (
    <ol className="at-steps" aria-label="השלבים" data-steps-at={props.at}>
      {STEP_LABELS.map((l, i) => {
        const done = i < props.at;
        const now = i === props.at;
        return (
          <li key={l} className={'at-step' + (done ? ' at-step-done' : now ? ' at-step-now' : '')} aria-current={now ? 'step' : undefined}>
            <span className="at-step-n" aria-hidden="true">{done ? '✓' : i + 1}</span>
            <span className="at-step-l">{l}</span>
          </li>
        );
      })}
    </ol>
  );
}

// ——— 1 · המנועים (מכונות) ———
/** כרטיס-מכונה: הפנים לחיצות ("בחר ←"), דוגמה אחת, ומגירה "ממה הוא בנוי". */
function MachineCard(props: {
  engine: EngineCard;
  atoms: AtomCard[];
  open: boolean;
  onToggle: (id: string) => void;
  onHost?: (id: string) => void;
  found?: boolean;
  verified?: Verified;
}) {
  const e = props.engine;
  const attr = props.found ? { 'data-host-found': e.id } : { 'data-host': e.id };
  return (
    <li className={'at-machine' + (props.open ? ' at-open' : '') + (props.found ? ' at-machine-found' : '')} data-machine={e.id}>
      <button type="button" className="at-machine-main" {...attr} onClick={() => props.onHost?.(e.id)}>
        <span className="at-tile" aria-hidden="true">{e.emoji}</span>
        <span className="at-machine-text">
          <span className="at-machine-top">
            <span className="at-name">{e.name}</span>
            <span className="at-chip">{e.from}</span>
            <VerifiedStamp verified={props.verified} />
          </span>
          <span className="at-what">{e.computes}</span>
        </span>
        <span className="at-go">{PICK_ENGINE_TEXT} <span aria-hidden="true">←</span></span>
      </button>
      <Examples id={e.id} />
      {!props.found && e.parts.length > 0 && (
        <button
          type="button"
          className="at-parts-toggle"
          data-engine={e.id}
          aria-expanded={props.open}
          onClick={() => props.onToggle(e.id)}
        >
          <span aria-hidden="true">🔩</span> {PARTS_TOGGLE_TEXT}
          <span className="at-chip">{partsCount(e.parts.length)}</span>
          <span className="at-caret" aria-hidden="true">▾</span>
        </button>
      )}
      {props.open && <Decomposition engine={e} atoms={props.atoms} />}
    </li>
  );
}

/**
 * צעד 1 — המסך הראשון המאוחד (DESIGN 14.10): כל מנוע פעם אחת, ככרטיס-מכונה. "בחר" ⇒ צעד 2; "ממה הוא בנוי" ⇒ הפירוק.
 * (היה: רשימת "המנועים" ומתחתיה גריד "יש לך מנוע" עם אותם שלושה מנועים פעמיים.)
 * `found` — חריץ לאינטגרציה: "🤖 מנועים שנמצאו אוטומטית" (data-host-found), אותו כרטיס בלי הפירוק.
 */
export function EnginesStep(props: {
  engines: EngineCard[];
  atoms: AtomCard[];
  open: string | null;
  onToggle: (id: string) => void;
  onHost?: (id: string) => void;
  found?: readonly { id: string; card: EngineCard; verified?: Verified }[];
}) {
  const found = props.found ?? [];
  return (
    <section className="at-step-body" aria-labelledby="at-h-engines">
      <h3 id="at-h-engines" className="at-title">{HOST_TITLE}</h3>
      <p className="at-hint">{HOST_HINT}</p>
      <ul className="at-machines">
        {props.engines.map((e) => (
          <MachineCard key={e.id} engine={e} atoms={props.atoms} open={props.open === e.id} onToggle={props.onToggle} onHost={props.onHost} />
        ))}
      </ul>
      {found.length > 0 && (
        <section className="at-group" aria-labelledby="at-h-found" data-found-group="1">
          <h4 id="at-h-found" className="at-sub">{FOUND_TITLE}</h4>
          <ul className="at-machines">
            {found.map((f) => (
              <MachineCard key={f.id} engine={f.card} atoms={props.atoms} open={false} onToggle={() => {}} onHost={props.onHost ? () => props.onHost!(f.id) : undefined} found verified={f.verified} />
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}

export function Decomposition(props: { engine: EngineCard; atoms: AtomCard[] }) {
  return (
    <ol className="at-parts" data-parts={props.engine.id} aria-label={'ממה בנוי ' + props.engine.name}>
      {props.engine.parts.map((p) => {
        const a = p.atom ? props.atoms.find((x) => x.id === p.atom) : undefined;
        return (
          <li key={p.num} className={'at-part' + (p.atom ? ' at-part-inbox' : '')} data-num={p.num}>
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

// ——— 2 · התקעים (החלקים הקטנים) ———
export function AtomGrid(props: { host: EngineCard; atoms: AtomCard[]; engines: EngineCard[]; onAtom: (id: string) => void; emptyText?: string }) {
  return (
    <section className="at-step-body" aria-labelledby="at-h-atoms">
      <h3 id="at-h-atoms" className="at-title" tabIndex={-1}>איזה חלק לחבר אל {props.host.emoji} {props.host.name}?</h3>
      {props.atoms.length === 0 && props.emptyText && <div className="empty" data-atoms-none="1">{props.emptyText}</div>}
      <ul className="at-plugs">
        {props.atoms.map((a) => (
          <li key={a.id} className="at-plug-card">
            <button type="button" className="at-card" data-atom={a.id} onClick={() => props.onAtom(a.id)}>
              <span className="at-plug" aria-hidden="true"><span className="at-plug-face">{a.emoji}</span></span>
              <span className="at-card-text">
                <span className="at-name">{a.name}</span>
                <span className="at-what">{a.computes}</span>
                <span className="at-chip">{fromChip(a, props.engines)}</span>
              </span>
            </button>
            <Examples id={a.id} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ChainsList(props: { chains: AtomChain[]; atoms: AtomCard[]; canEdit?: boolean; onSave?: (index: number) => void }) {
  if (props.chains.length === 0) return null;
  const emo = (id: string) => props.atoms.find((a) => a.id === id)?.emoji ?? '🧩';
  return (
    <section className="at-chains at-group" aria-labelledby="at-h-chains">
      <h4 id="at-h-chains" className="at-sub">שרשראות</h4>
      <p className="at-hint">שני חלקים שכבר מחוברים זה לזה — אפשר לשמור כמנוע אחד.</p>
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

// ——— 3 · השאלה האחת (השקעים) ———
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
  /** חריץ (DESIGN 14.10): מקום ⇒ חותמת "✅ מאומת". */
  verified?: Readonly<Record<string, Verified>>;
}) {
  return (
    <section className="at-step-body" aria-labelledby="at-h-q">
      <div className="at-q-card">
        <div className="at-asks"><span aria-hidden="true">{props.atom.emoji}</span> {props.atom.name} שואל:</div>
        <h3 id="at-h-q" className="at-question" tabIndex={-1}>{props.atom.question}</h3>
        <p className="at-what at-q-explain">{props.atom.computes}</p>
        <Examples id={props.atom.id} />
      </div>
      {props.options.length === 0 ? (
        <div className="empty">{NO_PLACE_TEXT}</div>
      ) : (
        <ul className="at-list at-sockets" aria-label="מה יש במנוע שלך">
          {props.options.map((o) => (
            <li key={o.place}>
              <button type="button" className="at-option" data-place={o.place} onClick={() => props.onOption(o.place)}>
                <span className="at-option-head">
                  <span className="at-socket" aria-hidden="true" />
                  <span className="at-place">{o.placeName}</span>
                  <span className="at-chip at-kind">{kindLabel(o.kind)}</span>
                  <VerifiedStamp verified={props.verified?.[o.place]} />
                </span>
                <span className="at-result">{o.result}</span>
                {props.previews?.[o.place] && <PreviewMini preview={props.previews[o.place]!} max={OPTION_PREVIEW_LINES} />}
                <span className="at-go">{PICK_OPTION_TEXT} <span aria-hidden="true">←</span></span>
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

/** התוצאה כגיבור: תווית קטנה, כותרת, ושורות אמיתיות (או "התצוגה תגיע בקרוב"). */
function ResultHero(props: { preview: AtomPreview | null; live?: boolean }) {
  return (
    <div className="at-hero" aria-live={props.live ? 'polite' : undefined}>
      <div className="at-hero-label">{RESULT_LABEL}</div>
      {props.preview ? <PreviewMini preview={props.preview} /> : <div className="at-preview at-soon">{PREVIEW_SOON_TEXT}</div>}
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
  /** DESIGN 14.10 (תוספתי): המנוע שאליו מתחברים — לפס "התקע נכנס לשקע". */
  host?: EngineCard;
}) {
  return (
    <section className="at-step-body" aria-labelledby="at-h-details">
      <h3 id="at-h-details" className="at-title" tabIndex={-1}>{props.atom.emoji} {props.atom.name} · {props.option.placeName}</h3>
      <div className="at-snap" data-snap="1">
        <span className="at-plug at-plug-in" aria-hidden="true"><span className="at-plug-face">{props.atom.emoji}</span></span>
        <span className="at-snap-text">
          <span className="at-snap-into">מתחבר אל</span>
          <span className="at-snap-place">{props.host ? props.host.emoji + ' ' : ''}{props.option.placeName}</span>
        </span>
      </div>
      <div className="at-result at-picked">{props.option.result}</div>
      {props.preview !== undefined && <ResultHero preview={props.preview} live />}
      {props.atom.details.length > 0 && (
        <div className="at-form">
          <div className="at-form-title">{TUNE_TITLE}</div>
          {props.atom.details.map((d) => (
            <DetailField key={d.id} d={d} value={props.values[d.id] ?? d.default} canEdit={props.canEdit} onValue={props.onValue} />
          ))}
        </div>
      )}
      {props.canEdit && (
        <div className="at-actions at-sticky">
          <Btn kind="primary" onClick={props.onConnect} title={'חבר: ' + props.option.result}>{CONNECT_TEXT}</Btn>
          <span className="at-sticky-hint">{CONNECT_HINT}</span>
        </div>
      )}
    </section>
  );
}

// ——— 5 · המנוע החדש ———
export function CreatedCard(props: {
  capability: Capability;
  preview: AtomPreview | null;
  /** DESIGN 14.10 (תוספתי): הצעד הבא — "בנה עליו" (רק כשאפשר) · "עוד חלק". */
  onBuildOn?: () => void;
  onMore?: () => void;
}) {
  return (
    <section className="at-made" aria-labelledby="at-h-made" data-made={props.capability.id}>
      <h3 id="at-h-made" className="at-title" tabIndex={-1}>✨ נוצר מנוע חדש: {props.capability.name}</h3>
      <p className="at-hint at-made-hint">{MADE_HINT}</p>
      <div className="at-hero">
        <div className="at-hero-label">{RESULT_LABEL}</div>
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
      </div>
      {(props.onBuildOn || props.onMore) && (
        <div className="at-made-next">
          {props.onBuildOn && (
            <Btn kind="primary" onClick={props.onBuildOn} title={BUILD_ON_TEXT + ': ' + props.capability.name}>
              <span data-made-open={props.capability.id}>✨ {BUILD_ON_TEXT}</span>
            </Btn>
          )}
          {props.onMore && <Btn onClick={props.onMore}>{MORE_PARTS_TEXT}</Btn>}
        </div>
      )}
    </section>
  );
}

/**
 * "המנועים שיצרת" — המנועים שחזרו לארגז. מנוע שאפשר לבנות עליו: הפנים לחיצות (data-host-cap) + "בנה עליו" (data-open-cap);
 * DESIGN 14.10: זה המקום היחיד שלהם (היה גם כרטיס ✨ בגריד וגם שורה ברשימה — אותו מנוע פעמיים).
 */
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
  /** DESIGN 14.10 (תוספתי): כותרת בולטת בצעד 1 · חריץ "✅ מאומת". */
  lead?: boolean;
  verifiedOf?: (id: string) => Verified | undefined;
}) {
  if (props.capabilities.length === 0) return null;
  const nameById = new Map(props.capabilities.map((c) => [c.id, c.name]));
  return (
    <section className={'at-group at-mine-group' + (props.lead ? ' at-mine-lead' : '')} aria-labelledby="at-h-mine">
      <h4 id="at-h-mine" className="at-sub"><span aria-hidden="true">✨ </span>{MINE_TITLE}</h4>
      {props.lead && <p className="at-hint">{CREATED_HOST_HINT}</p>}
      <ul className="at-list">
        {props.capabilities.map((c) => {
          const e = props.engines.find((x) => x.id === c.engine);
          const armed = props.armed === c.id;
          const state = props.stateOf ? props.stateOf(c.id) : 'ok';
          const parentName = c.parent ? nameById.get(c.parent) : undefined;
          const canOpen = state === 'ok' && !!props.onOpen && (!props.canOpen || props.canOpen(c.id));
          const face = (
            <>
              <span className="at-tile at-tile-made" aria-hidden="true">✨</span>
              <span className="at-mine-text">
                <span className="at-machine-top">
                  <span className="at-name">✨ {c.name}</span>
                  <VerifiedStamp verified={props.verifiedOf?.(c.id)} />
                </span>
                {state === 'ok' && parentName && <span className="at-what">{BUILT_ON_TEXT} ✨ {parentName}</span>}
                {state === 'ok' && !c.parent && e && <span className="at-what">{e.emoji} {e.name}</span>}
                {state !== 'ok' && <span className="at-what at-orphan" data-orphan="1">{ORPHAN_TEXT}</span>}
              </span>
            </>
          );
          return (
            <li key={c.id} className={'at-mine' + (armed ? ' at-armed' : '')} data-capability={c.id} data-cap-state={state}>
              {canOpen ? (
                <button type="button" className="at-mine-face" data-host-cap={c.id} onClick={() => props.onOpen!(c.id)} aria-label={BUILD_ON_TEXT + ': ' + c.name}>
                  {face}
                </button>
              ) : (
                <div className="at-mine-face">{face}</div>
              )}
              {props.blocked?.id === c.id && <span className="at-what at-blocked" role="status" data-blocked={c.id}>{props.blocked.text}</span>}
              {(canOpen || props.canEdit) && (
                <span className="at-mine-actions">
                  {canOpen && (
                    <Btn onClick={() => props.onOpen!(c.id)} title={BUILD_ON_TEXT + ': ' + c.name}>
                      <span data-open-cap={c.id}>✨ {BUILD_ON_TEXT}</span>
                    </Btn>
                  )}
                  {props.canEdit && (
                    <Btn kind={armed ? 'danger' : undefined} onClick={() => props.onRemoveTap(c.id)} title={'הסר: ' + c.name}>
                      {armed ? REMOVE_ARMED_TEXT : REMOVE_TEXT}
                    </Btn>
                  )}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** הפס העליון הדביק: "חזור" (תמיד גלוי) + המנוע שעליו עובדים. */
export function AtomsHeader(props: { host: EngineCard; onBack: () => void; backLabel: string }) {
  return (
    <div className="at-head">
      <Btn onClick={props.onBack} title={'חזרה: ' + props.backLabel}>→ {props.backLabel}</Btn>
      <span className="at-head-host">
        <span className="at-tile at-tile-sm" aria-hidden="true">{props.host.emoji}</span>
        <span className="at-name">{props.host.name}</span>
      </span>
    </div>
  );
}
