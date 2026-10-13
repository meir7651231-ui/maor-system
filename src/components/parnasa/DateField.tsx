/**
 * 📒 פרנסה׳לע — בורר-התאריך של המקור (dateUI): "השדה הטבעי מראה mm/dd/yyyy בהרבה טלפונים" — ולכן כפתור עם התאריך
 * במילים ("יום ד׳, 11 בנובמבר 2026 · א׳ כסלו") שפותח את הבורר הטבעי, ו-✕ לניקוי. השדה הטבעי נשאר (מוסתר-ויזואלית,
 * ערך ISO) — לנגישות ולבדיקות.
 */
import { useRef } from 'react';
import { dateWords } from './zmanimBoard';
import { cx, Ic } from './skin';

export function PnDate(props: { value: string; onChange: (v: string) => void; label: string; min?: string; /** תווית במקום התאריך במילים (הדגשה "עד שיבוטל"). */ text?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const open = (): void => {
    const el = ref.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
      el.click();
    }
  };
  return (
    <span className="pn-dpick">
      <input ref={ref} className="pn-dhid" type="date" tabIndex={-1} aria-label={props.label} min={props.min} value={props.value} onChange={(e) => props.onChange(e.target.value)} />
      <button type="button" className={cx('pn-dbtn', !props.value && 'pn-empty')} onClick={open}>
        <Ic n="clock" />
        <span>{props.value ? (props.text ?? dateWords(props.value)) : 'בחירת תאריך'}</span>
      </button>
      <button type="button" className="pn-dclr" aria-label="ניקוי התאריך" hidden={!props.value} onClick={() => props.onChange('')}>
        ✕
      </button>
    </span>
  );
}
