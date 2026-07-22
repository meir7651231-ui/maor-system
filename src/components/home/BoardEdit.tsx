/**
 * מצב עריכת לוח הבית — סרגל עריכה כהה, מסגרות מקווקוות סביב כל ווידג'ט,
 * ידית גרירה ⋮⋮ (HTML5 drag&drop), חצים ▲/▼ (fallback אמין למקלדת/מובייל),
 * ✕ להסרה, ומגש מקווקו "+ הוספת ווידג'ט" להחזרת ווידג'טים שהוסרו.
 *
 * העריכה עובדת על draft מקומי בלבד — "שמירת הלוח ✓" מתמידה ל-db.ui.homeLayout,
 * "ביטול" זורק את ה-draft, "איפוס לברירת המחדל" מחזיר את ה-draft לסדר המקורי.
 */
import { Fragment, useState, type CSSProperties, type DragEvent } from 'react';
import { Btn } from '../ui';
import { HOME_WIDGETS, WIDGET_LIBRARY, type HomeCtx, type WidgetId } from './widgets';

/* ── סגנונות — לפי המוקאפ (סרגל לילה + זהב, מסגרות מקווקוות) ── */

const editBar: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 12,
  background: '#211d17',
  color: '#efe7d6',
  borderRadius: 14,
  padding: '11px 18px',
  marginBottom: 14,
};

const barBtn: CSSProperties = {
  background: '#f3c76b',
  color: '#211d17',
  borderRadius: 10,
  border: 'none',
  padding: '7px 16px',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
};

const barBtnGhost: CSSProperties = {
  ...barBtn,
  background: 'transparent',
  color: '#cfc4ac',
  border: '1px solid #4a4234',
};

const resetLink: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#cfc4ac',
  fontSize: 12.5,
  textDecoration: 'underline',
  cursor: 'pointer',
  padding: 0,
};

const frameStyle = (dragging: boolean): CSSProperties => ({
  position: 'relative',
  outline: '1.5px dashed var(--accent-deep, #a05008)',
  outlineOffset: 3,
  borderRadius: 14,
  opacity: dragging ? 0.45 : 1,
});

const ctlBtn = (disabled: boolean): CSSProperties => ({
  width: 26,
  height: 26,
  borderRadius: 8,
  border: '1px solid var(--line, #e7dfd0)',
  background: 'var(--card, #fffdf8)',
  color: 'var(--ink-soft, #57503f)',
  fontSize: 11,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: disabled ? 'default' : 'pointer',
  opacity: disabled ? 0.35 : 1,
});

export function BoardEditor(props: {
  ctx: HomeCtx;
  /** הפריסה בעריכה — כוללת רק ווידג'טים visible; hero תמיד באינדקס 0. */
  draft: WidgetId[];
  setDraft: (next: WidgetId[]) => void;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
}) {
  const { ctx, draft, setDraft, onSave, onCancel, onReset } = props;
  const [dragId, setDragId] = useState<WidgetId | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  /* ── פעולות סידור ── */

  /** הזזת ווידג'ט לאינדקס הכנסה (לפני הפריט שבמקום הזה); hero נעול ב-0. */
  const moveTo = (id: WidgetId, insertAt: number) => {
    const from = draft.indexOf(id);
    if (from < 1) return;
    const at = Math.max(1, Math.min(insertAt, draft.length));
    const next = draft.filter((x) => x !== id);
    next.splice(from < at ? at - 1 : at, 0, id);
    setDraft(next);
  };

  /** חצים ▲/▼ — החלפה עם השכן; לא חוצים את hero (אינדקס 0). */
  const shift = (id: WidgetId, dir: 1 | -1) => {
    const from = draft.indexOf(id);
    const to = from + dir;
    if (from < 1 || to < 1 || to >= draft.length) return;
    const next = [...draft];
    next[from] = next[to];
    next[to] = id;
    setDraft(next);
  };

  const remove = (id: WidgetId) => setDraft(draft.filter((x) => x !== id));
  const add = (id: WidgetId) => setDraft([...draft, id]);

  /* ── גרירה (HTML5) — הידית ⋮⋮ נגררת, אזורי שחרור בין הווידג'טים ── */

  const onHandleDragStart = (id: WidgetId) => (e: DragEvent<HTMLSpanElement>) => {
    setDragId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    // תמונת הגרירה — כל המסגרת, לא רק הידית
    const frame = (e.currentTarget as HTMLElement).closest('[data-widget-frame]');
    if (frame instanceof HTMLElement) e.dataTransfer.setDragImage(frame, frame.offsetWidth / 2, 24);
  };
  const onHandleDragEnd = () => {
    setDragId(null);
    setOverIdx(null);
  };

  /** אזור שחרור בין ווידג'טים — משמש גם כריווח האנכי (18px) של הלוח. */
  const zone = (insertAt: number) => {
    const hot = dragId !== null && overIdx === insertAt;
    return (
      <div
        aria-hidden
        onDragOver={(e) => {
          if (!dragId) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          if (overIdx !== insertAt) setOverIdx(insertAt);
        }}
        onDragLeave={() => {
          if (overIdx === insertAt) setOverIdx(null);
        }}
        onDrop={(e) => {
          if (!dragId) return;
          e.preventDefault();
          moveTo(dragId, insertAt);
          onHandleDragEnd();
        }}
        style={{
          height: 18,
          borderRadius: 9,
          border: '2px dashed ' + (hot ? 'var(--accent-deep, #a05008)' : 'transparent'),
          background: hot ? 'rgba(243, 199, 107, .3)' : 'transparent',
          transition: 'background .1s',
        }}
      />
    );
  };

  // ספריית אבני הבניין — כל ווידג'ט שאינו על הלוח מוצע ככרטיס "+ הוספה"
  // (רק כאלה שה-config מציג — ווידג'ט של מודול/פיצ'ר כבוי מוסתר מהספרייה)
  const removed = WIDGET_LIBRARY.filter(
    (id) => HOME_WIDGETS[id].removable && HOME_WIDGETS[id].visible(ctx.config) && !draft.includes(id),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* סרגל העריכה */}
      <div style={editBar}>
        <span aria-hidden>✏️</span>
        <b style={{ color: '#f3c76b' }}>עריכת הלוח</b>
        <span style={{ fontSize: 13, color: '#cfc4ac' }}>גררו כרטיס כדי להזיז · ▲▼ להזזה בלי עכבר</span>
        <button type="button" style={resetLink} onClick={onReset} title="חזרה לסדר ולתוכן המקוריים של הלוח">
          איפוס לברירת המחדל
        </button>
        <span style={{ marginInlineStart: 'auto', display: 'flex', gap: 8 }}>
          <button type="button" style={barBtnGhost} onClick={onCancel} title="יציאה בלי לשמור — הלוח חוזר למצבו הקודם">
            ביטול
          </button>
          <button type="button" style={barBtn} onClick={onSave} title="שמירת הפריסה ללוח הבית של הארגון">
            שמירת הלוח ✓
          </button>
        </span>
      </div>

      {/* hero — קבוע בראש הלוח, בלי מסגרת ובלי פקדים */}
      <div style={{ pointerEvents: 'none' }}>{HOME_WIDGETS.hero.render(ctx)}</div>
      {zone(1)}

      {draft
        .filter((id) => id !== 'hero')
        .map((id, i) => {
          const w = HOME_WIDGETS[id];
          const idx = i + 1; // האינדקס האמיתי ב-draft (hero תופס את 0)
          return (
            <Fragment key={id}>
              <div data-widget-frame style={frameStyle(dragId === id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px 8px' }}>
                  <span
                    role="button"
                    draggable
                    onDragStart={onHandleDragStart(id)}
                    onDragEnd={onHandleDragEnd}
                    title="גרירה להזזת הווידג'ט"
                    aria-label={`גרירת "${w.label}" למיקום אחר`}
                    style={{ cursor: 'grab', color: 'var(--ink-faint)', fontWeight: 700, letterSpacing: 1, userSelect: 'none' }}
                  >
                    ⋮⋮
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)' }}>
                    <span aria-hidden>{w.icon}</span> {w.label}
                  </span>
                  <span style={{ marginInlineStart: 'auto', display: 'flex', gap: 4 }}>
                    <button
                      type="button"
                      style={ctlBtn(idx <= 1)}
                      disabled={idx <= 1}
                      onClick={() => shift(id, -1)}
                      title="הזזה למעלה"
                      aria-label={`הזזת "${w.label}" למעלה`}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      style={ctlBtn(idx >= draft.length - 1)}
                      disabled={idx >= draft.length - 1}
                      onClick={() => shift(id, 1)}
                      title="הזזה למטה"
                      aria-label={`הזזת "${w.label}" למטה`}
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      style={{ ...ctlBtn(false), background: '#f4e3dd', color: '#a8321e', border: 'none' }}
                      onClick={() => remove(id)}
                      title="הסרה מהלוח (אפשר להחזיר מהמגש למטה)"
                      aria-label={`הסרת "${w.label}" מהלוח`}
                    >
                      ✕
                    </button>
                  </span>
                </div>
                {/* התוכן מוצג כתצוגה בלבד בזמן עריכה — בלי ניווט בטעות */}
                <div style={{ pointerEvents: 'none' }}>{w.render(ctx)}</div>
              </div>
              {zone(idx + 1)}
            </Fragment>
          );
        })}

      {/* ספריית הווידג'טים — אבני בניין ככרטיסים עם "+ הוספה" (כמו במוקאפ) */}
      <div
        style={{
          border: '2px dashed var(--line, #d8ccb4)',
          borderRadius: 14,
          minHeight: 64,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          padding: '14px 16px',
          color: 'var(--ink-faint)',
          fontSize: 13,
          background: 'rgba(243, 199, 107, .05)',
        }}
      >
        {removed.length ? (
          <>
            <span style={{ fontWeight: 700, color: 'var(--ink-soft)' }}>➕ ספריית הווידג'טים — הוסיפו אבני בניין ללוח:</span>
            <div className="hm-lib">
              {removed.map((id) => (
                <div key={id} className="hm-lib-card">
                  <b>
                    <span aria-hidden>{HOME_WIDGETS[id].icon}</span> {HOME_WIDGETS[id].label}
                  </b>
                  <Btn sm onClick={() => add(id)} title={`הוספת "${HOME_WIDGETS[id].label}" לסוף הלוח`}>
                    + הוספה
                  </Btn>
                </div>
              ))}
            </div>
          </>
        ) : (
          <span style={{ textAlign: 'center' }}>כל הווידג'טים מוצגים על הלוח — ✕ מסיר ווידג'ט לכאן</span>
        )}
      </div>
    </div>
  );
}
