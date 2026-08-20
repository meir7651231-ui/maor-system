/**
 * בורר-מבטים מאוחד — רכיב-סגמנט אחד שמאגד את מבטי-מסך-התורמים (נתונים · חלון-עבודה ·
 * מודיעין · גלקסיה) במקום כפתורים מפוזרים. מקבל את המבטים-הזמינים (מגודרים פר-דגל
 * אצל ההורה) ומנתב בחירה. אם אין אף מבט-על (כל הדגלים כבויים) ⇒ לא-מרונדר כלל
 * (הלקוח-החי נשאר ביט-זהה).
 */
import type { CSSProperties } from 'react';

export interface ViewOption {
  key: string;
  label: string;
  title: string;
}

export function SupportersViewSwitcher(props: {
  options: ViewOption[];
  active: string;
  onSelect: (key: string) => void;
}) {
  // רק 'data' זמין ⇒ אין טעם בבורר.
  if (props.options.length <= 1) return null;

  const wrap: CSSProperties = {
    display: 'inline-flex', gap: 2, padding: 3, borderRadius: 12,
    background: 'var(--panel-2, #f7f2e8)', border: '1px solid var(--line, #e4dbc9)',
  };
  return (
    <div style={wrap} role="tablist" aria-label="מבט מסך-התורמים">
      {props.options.map((o) => {
        const on = o.key === props.active;
        return (
          <button
            key={o.key}
            type="button"
            role="tab"
            aria-selected={on}
            title={o.title}
            onClick={() => { if (!on) props.onSelect(o.key); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 9, cursor: on ? 'default' : 'pointer',
              border: 'none', fontSize: 13, fontWeight: on ? 800 : 600,
              background: on ? 'var(--panel, #fff)' : 'transparent',
              color: on ? 'var(--ink)' : 'var(--ink-soft)',
              boxShadow: on ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
