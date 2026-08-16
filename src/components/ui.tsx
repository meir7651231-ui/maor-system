/**
 * רכיבי UI משותפים — כל המודולים משתמשים אך ורק ברכיבים האלה
 * לטפסים, מודאלים וכפתורים, כדי לשמור על שפה עיצובית אחת.
 */
import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

export function Btn(props: {
  children: ReactNode;
  onClick?: () => void;
  kind?: 'primary' | 'danger' | 'plain';
  sm?: boolean;
  type?: 'button' | 'submit';
  title?: string;
  disabled?: boolean;
}) {
  const cls = ['btn', props.kind === 'primary' && 'primary', props.kind === 'danger' && 'danger', props.sm && 'sm']
    .filter(Boolean)
    .join(' ');
  return (
    <button
      type={props.type ?? 'button'}
      className={cls}
      onClick={props.onClick}
      title={props.title}
      disabled={props.disabled}
    >
      {props.children}
    </button>
  );
}

export function Chip(props: { children: ReactNode; on?: boolean; onClick?: () => void }) {
  return (
    <button type="button" className={'chip' + (props.on ? ' on' : '')} onClick={props.onClick}>
      {props.on ? '✓ ' : ''}
      {props.children}
    </button>
  );
}

export function Modal(props: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const focusables = () =>
    Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      ) ?? []
    );
  // פוקוס פנימה בפתיחה + החזרתו לפותח בסגירה — פעם אחת בלבד (mount/unmount).
  // חשוב שזה לא יהיה תלוי ב-props: אובייקט props הוא reference חדש בכל render,
  // ואפקט עם [props] היה מריץ מחדש refocus בכל הקלדה וגונב את הפוקוס מהשדה.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    (focusables()[0] ?? dialogRef.current)?.focus();
    return () => opener?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // מאזין Escape + מלכודת Tab — נקשר מחדש רק כש-onClose משתנה, לא בכל render.
  useEffect(() => {
    const onClose = props.onClose;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const items = focusables();
        if (items.length === 0) {
          e.preventDefault();
          dialogRef.current?.focus();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === dialogRef.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [props.onClose]);
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && props.onClose()}>
      <div
        ref={dialogRef}
        className="modal"
        style={{ position: 'relative', ...(props.wide ? { maxWidth: 880 } : {}) }}
        role="dialog"
        aria-modal="true"
        aria-label={props.title}
        tabIndex={-1}
      >
        {/* UX סבב-ב׳ (5.8): ✕ סגירה גלוי — במגע אין Escape, ולחיצת-רקע לא מוכרת */}
        <button
          type="button"
          onClick={props.onClose}
          aria-label="סגירה"
          title="סגירה"
          style={{
            position: 'absolute',
            top: 10,
            insetInlineStart: 10,
            width: 32,
            height: 32,
            borderRadius: 99,
            border: '1px solid var(--line)',
            background: 'var(--panel)',
            cursor: 'pointer',
            fontSize: 14,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
        {/* 🐛 נחיל-עמוק (13.8): רווח-פנימי בצד-ההתחלה כדי שהכותרת לא תחפוף לכפתור ה-✕ ב-RTL */}
        <h2 style={{ paddingInlineStart: 40 }}>{props.title}</h2>
        {props.children}
      </div>
    </div>
  );
}

export function Field(props: { label: string; children: ReactNode }) {
  // קושרים label לפקד דרך id ייחודי (htmlFor) — כך שדות בלי placeholder (טלפון 2,
  // מין, הערות) מקבלים שם נגיש לקורא-מסך. מזריקים את ה-id לפקד הבודד ב-cloneElement.
  const id = useId();
  // 🐛 נחיל-עמוק (13.8): כשיש יותר מילד אחד (או ילד לא-אלמנט) לא מזריקים id — ולכן
  // אסור ש-htmlFor יצביע ל-id שלא קיים (תווית מנותקת). מקשרים htmlFor רק כשהוזרק.
  const single = isValidElement(props.children);
  const child = single
    ? cloneElement(props.children as ReactElement<{ id?: string }>, { id })
    : props.children;
  return (
    <div className="field">
      <label {...(single ? { htmlFor: id } : {})}>{props.label}</label>
      {child}
    </div>
  );
}

export function TextInput(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  dir?: 'rtl' | 'ltr';
  id?: string;
  readOnly?: boolean;
  ariaLabel?: string;
}) {
  return (
    <input
      id={props.id}
      type={props.type ?? 'text'}
      value={props.value}
      dir={props.dir}
      placeholder={props.placeholder}
      readOnly={props.readOnly}
      aria-label={props.ariaLabel}
      onChange={(e) => props.onChange(e.target.value)}
    />
  );
}

export function Select(props: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  id?: string;
}) {
  return (
    <select id={props.id} value={props.value} onChange={(e) => props.onChange(e.target.value)}>
      {props.options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function FormError(props: { error: string }) {
  if (!props.error) return null;
  // role="alert" (מרמז aria-live=assertive) — ההודעה נכנסת ל-DOM דינמית ותוקרא
  // ע"י קורא-מסך ברגע ההוספה.
  return (
    <div className="form-error" role="alert">
      {props.error}
    </div>
  );
}

export function Empty(props: { children: ReactNode }) {
  return <div className="empty">{props.children}</div>;
}

export function PageHead(props: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <h1 className="page-title">{props.title}</h1>
        {props.sub && <p className="page-sub">{props.sub}</p>}
      </div>
      {props.actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{props.actions}</div>}
    </div>
  );
}

/**
 * ⋯ תפריט-פעולות (UX סבב-ד׳, 5.8.2026): כפתור אחד שמקנן את הפעולות המשניות
 * של כותרת-מסך — **אפס אובדן-יכולת**: כל פריט נשאר בקליק-אחד-נוסף, עם אותה
 * תווית ואותו handler. פריט falsy מדולג (גידור-דגלים נשאר אצל הקורא).
 */
export function ActionsMenu(props: {
  title?: string;
  items: Array<{ label: string; onClick: () => void; title?: string } | null | false | undefined>;
}) {
  const [open, setOpen] = useState(false);
  const items = props.items.filter((x): x is { label: string; onClick: () => void; title?: string } => !!x);
  if (items.length === 0) return null;
  return (
    <>
      <Btn onClick={() => setOpen(true)} title="עוד פעולות">
        ⋯ עוד
      </Btn>
      {open && (
        <Modal title={props.title ?? 'עוד פעולות'} onClose={() => setOpen(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((it, i) => (
              <button
                key={i}
                type="button"
                title={it.title}
                onClick={() => {
                  setOpen(false);
                  it.onClick();
                }}
                style={{
                  textAlign: 'start',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--line)',
                  background: 'var(--panel)',
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {it.label}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}
