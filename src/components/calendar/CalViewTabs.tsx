/**
 * 🗓 בורר-מצב-תצוגה משותף ללוחות — יומי / שבועי / חודשי (בקשת-בעלים 30.8
 * "תצוגה יומי שבועי חודשי לכל הלוחות שנה"). רכיב-תצוגה טהור; המנוע ב-monthGrid.
 */
import { CAL_VIEW_LABEL, CAL_VIEW_MODES, type CalViewMode } from '../../lib/monthGrid';

export function CalViewTabs({ mode, onMode }: { mode: CalViewMode; onMode: (m: CalViewMode) => void }) {
  return (
    <div role="tablist" aria-label="מצב תצוגה" style={{ display: 'inline-flex', border: '1px solid var(--line)', borderRadius: 999, overflow: 'hidden' }}>
      {CAL_VIEW_MODES.map((m) => {
        const on = m === mode;
        return (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onMode(m)}
            style={{
              border: 'none',
              padding: '5px 12px',
              fontSize: 12.5,
              fontWeight: on ? 800 : 600,
              cursor: 'pointer',
              background: on ? 'var(--accent)' : 'transparent',
              color: on ? '#fff' : 'var(--ink-soft)',
            }}
          >
            {CAL_VIEW_LABEL[m]}
          </button>
        );
      })}
    </div>
  );
}
