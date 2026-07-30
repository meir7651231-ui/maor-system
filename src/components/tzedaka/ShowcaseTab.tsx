/**
 * 🏆 מסך הראווה של הקופות (קופות 7, feature tzedaka.showcase) — המבצע
 * הפעיל + טבעת התקדמות (דפוס RING מ-ImpactWall), סה"כ שנאסף (fmtIls —
 * ייבוא, לא שכפול), לוח מובילים עם 🥇🥈🥉, ומצב מסך-מלא בדפוס הקיר:
 * overlay פנימי בלבד, בלי hash חדש (בידוד מהצוהר הראשי), Escape/✕ ליציאה.
 */
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { Btn } from '../ui';
import { fmtIls } from '../wall/wallData';
import { campaignProgress, grandTotal, leaderboard } from './lib';

const RING_R = 88;
const RING_C = 2 * Math.PI * RING_R;
const MEDALS = ['🥇', '🥈', '🥉'] as const;

function ShowcaseContent(props: { wall?: boolean }) {
  const db = useApp((s) => s.db);
  const campaign = db.tzCampaigns.find((c) => c.active);
  const prog = campaign ? campaignProgress(campaign, db.tzBoxes) : null;
  const rows = useMemo(() => leaderboard(db.tzCoordinators, db.tzBoxes).slice(0, 7), [db.tzCoordinators, db.tzBoxes]);
  const activeBoxes = db.tzBoxes.filter((b) => b.status === 'home' || b.status === 'office').length;
  const ringP = prog && prog.goal > 0 ? prog.pct / 100 : 0;
  const dash = `${(RING_C * ringP).toFixed(1)} ${RING_C.toFixed(1)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      {campaign && <h2 style={{ fontSize: props.wall ? 30 : 19, fontWeight: 800 }}>{'🎯 ' + campaign.name}</h2>}
      <div style={{ position: 'relative', width: 200, height: 200 }}>
        <svg viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="100" cy="100" r={RING_R} fill="none" stroke="rgba(217,119,6,.18)" strokeWidth="10" />
          <circle
            cx="100"
            cy="100"
            r={RING_R}
            fill="none"
            stroke="#d97706"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={dash}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{fmtIls(campaign && prog ? prog.sum : grandTotal(db.tzBoxes))}</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{campaign ? 'נאסף במבצע' : 'נאסף סה"כ'}</div>
          {prog && prog.goal > 0 && <div style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>{prog.pct + '% מהיעד'}</div>}
        </div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-faint)' }}>
        {'🪙 ' + activeBoxes + ' קופות פעילות · סה"כ מאז ומעולם ' + fmtIls(grandTotal(db.tzBoxes))}
      </div>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>לוח המובילים</h3>
        {rows.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', textAlign: 'center' }}>עדיין אין רכזים פעילים</div>}
        {rows.map((r, i) => (
          <div key={r.coordinator.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderBottom: '1px solid var(--line)', fontSize: props.wall ? 17 : 13.5 }}>
            <span style={{ width: 28, textAlign: 'center' }}>{MEDALS[i] ?? i + 1}</span>
            <span style={{ flex: 1, fontWeight: 700 }}>{r.coordinator.name}</span>
            <span style={{ fontWeight: 800 }}>{'🏆 ' + r.coordinator.score}</span>
            <span style={{ color: 'var(--ink-faint)' }}>{fmtIls(r.total) + ' · ' + r.boxCount + ' קופות'}</span>
          </div>
        ))}
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
      <div className="tz-wall" style={{ position: 'fixed', inset: 0, zIndex: 95, overflow: 'auto', padding: '32px 16px' }}>
        <style>{`
          .tz-wall { background: radial-gradient(1200px 700px at 50% -10%, #38322a 0%, #211d17 55%, #16130f 100%); color: #f5f1e8; cursor: none; }
          .tz-wall * { cursor: none; }
          .tz-wall button { cursor: pointer !important; }
          .tz-wall .tz-clock { color: #f3c76b; font-weight: 800; font-size: 22px; text-align: center; }
        `}</style>
        <button
          type="button"
          onClick={() => setWallOpen(false)}
          style={{ position: 'fixed', top: 14, left: 14, background: 'transparent', border: '1px solid rgba(243,199,107,.4)', color: '#f3c76b', borderRadius: 99, padding: '6px 14px', fontSize: 13, fontWeight: 800 }}
        >
          ✕ יציאה (Esc)
        </button>
        <div className="tz-clock">{clock.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</div>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
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
