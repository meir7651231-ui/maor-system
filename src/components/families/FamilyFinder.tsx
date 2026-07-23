/**
 * מאתר המשפחות — גלגל סינון חי בתוך הדף (כמו famWheel במקור): צוללים ציר
 * אחרי ציר (עיר → קהילה → מצב משפחתי → …), המונה במרכז והטבלה למטה
 * מסתננים חי, וכפתור החלה ממפה את הבחירות למסנני הטבלה הרגילים.
 */
import type { Db } from '../../types/domain';
import { FINDER_AXES, finderAxisValue } from './lib';

const WHEEL_COLORS = ['#f3c76b', '#b45309', '#7c3aed', '#0f766e', '#be185d'];

export function FamilyFinder(props: {
  db: Db;
  locks: Record<string, string>;
  rot: number;
  onLocks: (locks: Record<string, string>, spin: number) => void;
  onApply: () => void;
  onClose: () => void;
  onOpenFamily: (id: string) => void;
}) {
  const { db, locks, rot } = props;

  // צלילה ציר-אחרי-ציר: ציר נעול מסנן ומוצג כצ'יפ; הציר הפתוח הראשון
  // עם 2+ אפשרויות עולה על הגלגל; ציר עם אפשרות אחת מדולג.
  let matched = db.families.slice();
  const chips: { label: string; key: string | null }[] = [];
  let axis: { key: string; label: string } | null = null;
  let wheelOpts: { label: string; value: string }[] = [];

  for (const [key, label] of FINDER_AXES) {
    if (locks[key] !== undefined) {
      matched = matched.filter((f) => finderAxisValue(db, f, key) === locks[key]);
      chips.push({ label: label + ': ' + locks[key], key });
      continue;
    }
    const counts = new Map<string, number>();
    for (const f of matched) {
      const v = finderAxisValue(db, f, key);
      if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    const opts = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    if (opts.length < 2) {
      if (opts.length === 1) chips.push({ label: label + ': ' + opts[0][0] + ' · דולג', key: null });
      continue;
    }
    if (!axis) {
      axis = { key, label };
      wheelOpts = opts.slice(0, 8).map(([v, n]) => ({ label: v + ' · ' + n, value: v }));
    }
  }

  const removeLock = (key: string) => {
    // שחרור צ'יפ מפיל גם את כל הנעילות שאחריו — הצלילה חוזרת לאותה נקודה.
    const next: Record<string, string> = {};
    for (const [k] of FINDER_AXES) {
      if (k === key) break;
      if (locks[k] !== undefined) next[k] = locks[k];
    }
    props.onLocks(next, 90);
  };

  const seg = Math.max(wheelOpts.length, 1);
  const stops = Array.from({ length: seg }, (_, i) =>
    `${WHEEL_COLORS[i % WHEEL_COLORS.length]} ${(i * 100) / seg}% ${((i + 1) * 100) / seg}%`,
  );
  const ring = `conic-gradient(from -90deg, ${stops.join(', ')})`;

  const results = matched.slice(0, 8);

  return (
    <div
      className="card"
      style={{ border: '1.5px solid var(--accent)', marginBottom: 14, animation: 'fadeUp .2s ease' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 14, fontWeight: 800 }}>
          <span style={{ color: 'var(--accent)' }}>✦</span> מאתר המשפחות — הטבלה למטה מסתננת חי
        </div>
        <div style={{ display: 'flex', gap: 7 }}>
          <button type="button" className="btn sm" onClick={() => props.onLocks({}, 137)}>איפוס</button>
          {Object.keys(locks).length > 0 && (
            <button type="button" className="btn sm primary" onClick={props.onApply}>
              ⏷ החלה על המסננים
            </button>
          )}
          <button type="button" className="btn sm" onClick={props.onClose}>✕ סגירה</button>
        </div>
      </div>

      {chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 9, justifyContent: 'center' }}>
          {chips.map((c, i) => (
            <span
              key={i}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                fontSize: 11.5, fontWeight: 700, padding: '4px 12px', borderRadius: 99,
                background: c.key ? 'var(--dark)' : 'var(--hover-bg)',
                color: c.key ? 'var(--amber)' : 'var(--ink-faint)',
                whiteSpace: 'nowrap',
              }}
            >
              {c.label}
              {c.key && (
                <button
                  type="button"
                  onClick={() => removeLock(c.key!)}
                  title="שחרור"
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'inherit', padding: 0, fontSize: 11, fontWeight: 800 }}
                >
                  ✕
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {axis && (
        <div style={{ textAlign: 'center', fontSize: 13.5, fontWeight: 800, marginTop: 6 }}>
          סובבו ובחרו: <span style={{ color: 'var(--accent)' }}>{axis.label}</span>
        </div>
      )}

      <div style={{ position: 'relative', width: 250, height: 250, margin: '10px auto 4px' }}>
        <div
          style={{
            position: 'absolute', inset: 13, borderRadius: 999, background: ring,
            transform: `rotate(${rot}deg)`,
            transition: 'transform .65s cubic-bezier(.2,.8,.3,1)',
            boxShadow: '0 14px 34px rgba(33,29,23,.24)',
          }}
        />
        <div
          style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 124, height: 124, borderRadius: 999, background: 'var(--panel)',
            boxShadow: 'inset 0 0 0 2px var(--accent), 0 4px 14px rgba(33,29,23,.15)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1 }}>{matched.length}</div>
          <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', fontWeight: 700, marginTop: 3 }}>משפחות תואמות</div>
        </div>
        {wheelOpts.map((o, i) => {
          const ang = Math.round(-90 + (i * 360) / wheelOpts.length);
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => axis && props.onLocks({ ...locks, [axis.key]: o.value }, 137)}
              className="wheel-opt"
              style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: `translate(-50%,-50%) rotate(${ang}deg) translateY(-108px) rotate(${-ang}deg)`,
                background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 99,
                padding: '5px 13px', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(33,29,23,.2)', whiteSpace: 'nowrap', color: 'var(--ink)',
              }}
            >
              {o.label}
            </button>
          );
        })}
        {!axis && (
          <div
            style={{
              position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)',
              fontSize: 11.5, fontWeight: 700, color: 'var(--ink-faint)', whiteSpace: 'nowrap',
            }}
          >
            אין עוד צירים לצלילה — זו התוצאה
          </div>
        )}
      </div>

      {results.length > 0 && Object.keys(locks).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center', marginTop: 8 }}>
          {results.map((f) => (
            <button
              key={f.id}
              type="button"
              className="chip"
              onClick={() => props.onOpenFamily(f.id)}
              title={[f.city, f.community, f.phone].filter(Boolean).join(' · ') || undefined}
            >
              משפחת {f.name}
            </button>
          ))}
          {matched.length > 8 && (
            <span style={{ fontSize: 11.5, color: 'var(--ink-faint)', alignSelf: 'center' }}>
              +{matched.length - 8} נוספות בטבלה למטה
            </span>
          )}
        </div>
      )}
    </div>
  );
}
