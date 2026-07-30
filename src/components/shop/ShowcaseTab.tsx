/**
 * 🖼 מסך הראווה של החנות (חנות 7, feature shop.showcase — דפוס
 * tzedaka/ShowcaseTab בלי לוח מובילים, אין גיימיפיקציה — הכרעת בעלים 8):
 * כרטיסי הקטלוג בתצוגה גדולה + סיכומי נתינה, ומצב מסך-מלא בדפוס הקיר:
 * overlay פנימי בלבד, בלי hash חדש (בידוד מהצוהר הראשי), Escape/✕ ליציאה.
 */
import { useEffect, useState } from 'react';
import { useApp } from '../../store/useApp';
import { Btn } from '../ui';
import { fmtIls } from '../wall/wallData';
import { componentCounts, givenValue, subsidyTotal } from './lib';

function ShowcaseContent(props: { wall?: boolean }) {
  const db = useApp((s) => s.db);
  const products = db.shopProducts.filter((p) => p.active);
  const helpedFamilies = new Set(db.shopAssignments.map((a) => a.famId)).size;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <h2 style={{ fontSize: props.wall ? 30 : 19, fontWeight: 800 }}>🛍 מוצרי השירות שלנו</h2>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', fontWeight: 800, fontSize: props.wall ? 22 : 15 }}>
        <span>{'🎁 ' + fmtIls(givenValue(db.shopAssignments)) + ' שווי שניתן'}</span>
        <span>{'🤲 ' + fmtIls(subsidyTotal(db.shopAssignments)) + ' סובסידיה'}</span>
        <span>{'👨‍👩‍👧‍👦 ' + helpedFamilies + ' משפחות נהנות'}</span>
        <span>{'🛍 ' + products.length + ' מוצרים'}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(' + (props.wall ? 280 : 230) + 'px, 1fr))', gap: 12, width: '100%', maxWidth: 980 }}>
        {products.length === 0 && <div style={{ fontSize: 13, color: 'var(--ink-faint)', textAlign: 'center' }}>עדיין אין מוצרים פעילים בקטלוג</div>}
        {products.map((p) => {
          const counts = componentCounts(p);
          return (
            <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: props.wall ? 17 : 13.5 }}>
              <b style={{ fontSize: props.wall ? 21 : 15 }}>{p.name}</b>
              {p.desc && <span style={{ color: 'var(--ink-faint)' }}>{p.desc}</span>}
              <span style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontWeight: 700 }}>
                {counts.meeting > 0 && <span>{'🤝 ' + counts.meeting}</span>}
                {counts.coupon > 0 && <span>{'🎟 ' + counts.coupon}</span>}
                {counts.gift > 0 && <span>{'🎁 ' + counts.gift}</span>}
                {counts.holidayGift > 0 && <span>{'🕎 ' + counts.holidayGift}</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ShowcaseTab() {
  const [wallOpen, setWallOpen] = useState(false);
  const [clock, setClock] = useState(() => new Date());

  // שעון חי (30 שנ׳) — רק במצב הקיר
  useEffect(() => {
    if (!wallOpen) return;
    const t = setInterval(() => setClock(new Date()), 30_000);
    return () => clearInterval(t);
  }, [wallOpen]);

  // יציאה ב-Escape
  useEffect(() => {
    if (!wallOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setWallOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [wallOpen]);

  if (wallOpen) {
    return (
      <div className="shop-wall" style={{ position: 'fixed', inset: 0, zIndex: 95, overflow: 'auto', padding: '32px 16px' }}>
        <style>{`
          .shop-wall { background: radial-gradient(1200px 700px at 50% -10%, #38322a 0%, #211d17 55%, #16130f 100%); color: #f5f1e8; cursor: none; }
          .shop-wall * { cursor: none; }
          .shop-wall button { cursor: pointer !important; }
          .shop-wall .shop-clock { color: #f3c76b; font-weight: 800; font-size: 22px; text-align: center; }
          .shop-wall .card { background: rgba(255,255,255,.06); border-color: rgba(243,199,107,.25); color: #f5f1e8; }
        `}</style>
        <button
          type="button"
          onClick={() => setWallOpen(false)}
          style={{ position: 'fixed', top: 14, left: 14, background: 'transparent', border: '1px solid rgba(243,199,107,.4)', color: '#f3c76b', borderRadius: 99, padding: '6px 14px', fontSize: 13, fontWeight: 800 }}
        >
          ✕ יציאה (Esc)
        </button>
        <div className="shop-clock">{clock.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</div>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <ShowcaseContent wall />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <Btn onClick={() => setWallOpen(true)} title="מצב ראווה למסך גדול">🖥 מסך מלא</Btn>
      </div>
      <ShowcaseContent />
    </div>
  );
}
