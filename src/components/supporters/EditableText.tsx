/**
 * ✏ טקסט-עריך במקום (בקשת-בעלים 9.9 "שיהיה עריכה כמו במיזוג"): תצוגה + ✏ ⇒ שדה-קלט;
 * Enter/יציאה שומרים, Escape מבטל; ריק לא נשמר. עוצר את הקלקה של השורה-ההורה.
 */
import { useState, type KeyboardEvent } from 'react';

export function EditableText(props: { value: string; onSave: (v: string) => void; title?: string; style?: React.CSSProperties }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(props.value);
  function commit() {
    setEditing(false);
    const v = draft.trim();
    if (v && v !== props.value) props.onSave(v);
    else setDraft(props.value);
  }
  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { e.preventDefault(); setDraft(props.value); setEditing(false); }
  }
  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={onKey}
        onClick={(e) => e.stopPropagation()}
        aria-label="עריכת שם"
        style={{ flex: 1, minWidth: 90, padding: '3px 6px', fontSize: 13, ...props.style }}
      />
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0, ...props.style }}>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{props.value}</span>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setDraft(props.value); setEditing(true); }}
        title={props.title ?? 'עריכת השם'}
        aria-label={'עריכת ' + props.value}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontSize: 12, opacity: 0.7 }}
      >
        ✏
      </button>
    </span>
  );
}
