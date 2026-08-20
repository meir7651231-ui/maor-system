/**
 * גלקסיית-התורמים — canvas חי מעל מנוע constellation.
 *
 * הארגון בליבה, כל תורם ככוכב (גודל=ערך · צבע=דרגה · מרחק=טריות · בסיכון=בוהק
 * אדום). ריחוף מציג טוליטיפ · לחיצה פותחת את הכרטיס. הפריסה נגזרת טהורה
 * (donorConstellation); ה-canvas רק מקרין. cap-render לביצועים · מכבד
 * prefers-reduced-motion. מגודר opt-in (`supporters.galaxy === true`).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { OrgConfig } from '../../types/config';
import type { Supporter } from '../../types/domain';
import { Btn } from '../ui';
import { donorConstellation, type ConstellationNode, type TierKey } from './constellation';

const TIER_COLOR: Record<TierKey, string> = {
  gold: '#f3c76b', silver: '#c9d2dd', bronze: '#e0a24e', dormant: '#8a8272',
};
const TIER_LABEL: Record<TierKey, string> = { gold: 'זהב', silver: 'כסף', bronze: 'ארד', dormant: 'רדומה' };
/** תקרת-רינדור — הכוכבים המשמעותיים ביותר נשארים חלקים גם על עשרות-אלפים. */
const RENDER_CAP = 400;

export function SupportersGalaxy(props: {
  supporters: Supporter[];
  config: OrgConfig;
  usdRate: number;
  onOpen: (id: string) => void;
  onExit?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; node: ConstellationNode } | null>(null);
  // מכונת-הזמן החיה — הזזת-האופק קדימה (0=היום). הכוכבים נסחפים ומאדימים.
  const [offsetDays, setOffsetDays] = useState(0);
  const today = new Date().toISOString().slice(0, 10);
  const rate = props.usdRate || 3.7;

  const nodes = useMemo(
    () => donorConstellation(props.supporters, today, { rate, offsetDays }),
    [props.supporters, today, rate, offsetDays],
  );
  // בסיס (היום) — למונה "כמה יגלשו-לסכנה עד האופק".
  const baseRisk = useMemo(
    () => donorConstellation(props.supporters, today, { rate }).reduce((a, n) => a + (n.atRisk ? 1 : 0), 0),
    [props.supporters, today, rate],
  );
  // cap: בסיכון קודם, ואז לפי גודל — הכוכבים החשובים תמיד מרונדרים.
  const shown = useMemo(() => {
    const arr = [...nodes].sort((a, b) => (b.atRisk ? 1 : 0) - (a.atRisk ? 1 : 0) || b.size - a.size);
    return arr.slice(0, RENDER_CAP);
  }, [nodes]);

  const hoverRef = useRef<{ mx: number; my: number }>({ mx: -9e9, my: -9e9 });
  const posRef = useRef<{ id: string; x: number; y: number; r: number; node: ConstellationNode }[]>([]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const TILT = 0.6; // דיסק-מוטה = פסאודו-תלת-ממד (ציר-y דחוס)
    let raf = 0, t = 0, W = 0, H = 0, cx = 0, cy = 0, maxR = 0, DPR = 1;

    const resize = () => {
      const w = wrapRef.current?.clientWidth || 800;
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = w; H = 460;
      cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cx = W / 2; cy = H / 2; maxR = Math.min(W, H) * 0.46;
    };
    resize();

    const glow = (x: number, y: number, r: number, c: string, a: number) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = a; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill(); ctx.globalAlpha = 1;
    };
    const rgba = (hex: string, a: number) => {
      const n = parseInt(hex.slice(1), 16);
      return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
    };

    const frame = () => {
      t += reduce ? 0 : 1;
      ctx.clearRect(0, 0, W, H);
      // rings (אליפסות = דיסק-מוטה)
      ctx.strokeStyle = 'rgba(243,199,107,0.06)'; ctx.lineWidth = 1;
      for (const b of [0.3, 0.5, 0.7, 0.9]) { ctx.beginPath(); ctx.ellipse(cx, cy, maxR * b, maxR * b * TILT, 0, 0, 6.2832); ctx.stroke(); }
      // core
      const pulse = 1 + 0.06 * Math.sin(t * 0.05);
      glow(cx, cy, 58 * pulse, 'rgba(243,199,107,0.42)', 0.9);
      glow(cx, cy, 22 * pulse, 'rgba(255,242,214,0.95)', 1);
      ctx.fillStyle = '#fff5e0'; ctx.beginPath(); ctx.arc(cx, cy, 7.5, 0, 6.2832); ctx.fill();

      const pos = posRef.current; pos.length = 0;
      const rot = reduce ? 0 : t * 0.0009;
      for (const n of shown) {
        const ang = n.angle * 6.2832 + rot + n.radius * 0.4;
        const x = cx + Math.cos(ang) * n.radius * maxR;
        const y = cy + Math.sin(ang) * n.radius * maxR * TILT;
        // עומק: כוכבים ב"חצי-האחורי" של הדיסק קצת קטנים/עמומים יותר.
        const depth = 0.72 + 0.28 * ((Math.sin(ang) + 1) / 2);
        const sz = (2 + n.size * 6) * depth;
        const c = TIER_COLOR[n.tier];
        if (n.atRisk) {
          const fl = 0.5 + 0.5 * Math.sin(t * 0.12 + n.radius * 9);
          glow(x, y, sz * 4, rgba('#ff6f5e', (0.4 + 0.4 * fl)), 0.85);
          ctx.fillStyle = '#ff8f80';
        } else {
          glow(x, y, sz * 2.6, rgba(c, 0.45), 0.7);
          ctx.fillStyle = c;
        }
        ctx.beginPath(); ctx.arc(x, y, sz, 0, 6.2832); ctx.fill();
        pos.push({ id: n.id, x, y, r: sz, node: n });
      }

      // hover detection
      const { mx, my } = hoverRef.current;
      let best: typeof pos[number] | null = null, bd = 16;
      for (const p of pos) { const d = Math.hypot(p.x - mx, p.y - my); if (d < bd + p.r) { bd = d; best = p; } }
      if (best) {
        setHover((h) => (h && h.node.id === best!.id ? h : { x: best!.x, y: best!.y, node: best!.node }));
        cv.style.cursor = 'pointer';
      } else {
        setHover((h) => (h ? null : h));
        cv.style.cursor = 'default';
      }

      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      hoverRef.current = { mx: e.clientX - r.left, my: e.clientY - r.top };
    };
    const onLeave = () => { hoverRef.current = { mx: -9e9, my: -9e9 }; };
    const onClick = () => {
      const { mx, my } = hoverRef.current;
      let best: string | null = null, bd = 18;
      for (const p of posRef.current) { const d = Math.hypot(p.x - mx, p.y - my); if (d < bd + p.r) { bd = d; best = p.id; } }
      if (best) props.onOpen(best);
    };
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerleave', onLeave);
    cv.addEventListener('click', onClick);
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      cv.removeEventListener('pointermove', onMove);
      cv.removeEventListener('pointerleave', onLeave);
      cv.removeEventListener('click', onClick);
      window.removeEventListener('resize', resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  const atRiskCount = nodes.reduce((a, n) => a + (n.atRisk ? 1 : 0), 0);
  const offsetLabel = offsetDays === 0 ? 'היום' : offsetDays % 365 === 0 ? 'בעוד ' + offsetDays / 365 + ' שנה' : 'בעוד ' + offsetDays + ' ימים';
  const newlyAtRisk = Math.max(0, atRiskCount - baseRisk);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>גלקסיית התורמים</h1>
        <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
          {nodes.length} כוכבים · {atRiskCount} מתקררים · ריחוף לפרטים · לחיצה לכרטיס
        </span>
        {props.onExit ? <Btn onClick={props.onExit} title="חזרה למסך-הנתונים">☰ מסך הנתונים</Btn> : null}
      </div>

      {/* מכונת-הזמן החיה — סרגל-אופק שמריץ את התיק קדימה */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '10px 14px', borderRadius: 12, background: 'var(--panel-2, #f7f2e8)', border: '1px solid var(--line, #e4dbc9)' }}>
        <span style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>⏳ מכונת-הזמן</span>
        <input
          type="range" min={0} max={365} step={5} value={offsetDays}
          onChange={(e) => setOffsetDays(+e.target.value)}
          aria-label="הזזת-אופק קדימה בימים"
          style={{ flex: 1, minWidth: 140, accentColor: 'var(--gold-deep, #a05008)', cursor: 'pointer' }}
        />
        <span style={{ fontSize: 12.5, fontWeight: 800, minWidth: 92, textAlign: 'center', color: offsetDays ? 'var(--gold-deep, #a05008)' : 'var(--ink-soft)' }}>{offsetLabel}</span>
        {offsetDays > 0 ? (
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--red, #b3261e)', whiteSpace: 'nowrap' }} title="כמה תורמים יגלשו-לסכנה עד האופק אם לא תעשה כלום">+{newlyAtRisk} יגלשו-לסכנה</span>
        ) : <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>גררו קדימה — "אם לא תעשה כלום"</span>}
        {offsetDays > 0 ? <button type="button" onClick={() => setOffsetDays(0)} className="chip" style={{ cursor: 'pointer' }}>↺ היום</button> : null}
      </div>

      <div
        ref={wrapRef}
        style={{
          position: 'relative', borderRadius: 18, overflow: 'hidden',
          border: '1px solid rgba(243,199,107,.18)',
          background: 'radial-gradient(120% 90% at 50% 0%, #241d12 0%, #0c0a07 60%)',
        }}
      >
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 460 }} />

        {/* legend */}
        <div style={{ position: 'absolute', insetBlockEnd: 12, insetInlineEnd: 12, display: 'flex', flexDirection: 'column', gap: 4, background: 'rgba(20,16,10,.6)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '9px 11px', fontSize: 11 }}>
          {(['gold', 'silver', 'bronze', 'dormant'] as TierKey[]).map((k) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#c8bea8' }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: TIER_COLOR[k], boxShadow: '0 0 7px ' + TIER_COLOR[k] }} />{TIER_LABEL[k]}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#c8bea8' }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: '#ff6f5e', boxShadow: '0 0 7px #ff6f5e' }} />מתקרר
          </div>
        </div>

        {nodes.length > RENDER_CAP ? (
          <div style={{ position: 'absolute', insetBlockStart: 12, insetInlineStart: 12, fontSize: 11, color: '#c8bea8', background: 'rgba(20,16,10,.6)', borderRadius: 8, padding: '4px 9px' }}>
            מוצגים {RENDER_CAP} הכוכבים המובילים · הרשימה המלאה במסך-הנתונים
          </div>
        ) : null}

        {/* tooltip */}
        {hover ? (
          <div style={{ position: 'absolute', left: hover.x, top: hover.y, transform: 'translate(-50%, -130%)', pointerEvents: 'none', background: 'rgba(10,8,6,.94)', border: '1px solid rgba(243,199,107,.25)', borderRadius: 11, padding: '8px 11px', minWidth: 140, boxShadow: '0 10px 30px rgba(0,0,0,.6)' }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#fff' }}>{hover.node.name || 'ללא שם'}</div>
            <div style={{ fontSize: 11, color: '#8f8571', marginTop: 1 }}>
              {TIER_LABEL[hover.node.tier]} · ₪{hover.node.val.toLocaleString('he-IL')}
            </div>
            <div style={{ marginTop: 5, fontSize: 10.5, fontWeight: 700, display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: hover.node.atRisk ? 'rgba(255,111,94,.18)' : 'rgba(111,206,122,.16)', color: hover.node.atRisk ? '#ff8f80' : '#6fce7a' }}>
              {hover.node.atRisk ? '⚠ מתקרר · ' + hover.node.churn + '%' : '● פעיל'}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
