/**
 * היקום התלת-ממדי — ענן-כוכבים מסתובב מעל מנוע universe3d (מעל constellation).
 *
 * כל תורם = כוכב במרחב (x,y,z): גודל=ערך · צבע=דרגה · מרחק-מהמרכז=טריות · בוהק
 * אדום=סיכון. סיבוב-אוטומטי + גרירה-לסיבוב · פרספקטיבה (קרוב=גדול) · מיון-עומק.
 * הכל נגזרת טהורה (donorUniverse); ה-canvas רק מקרין. cap-render + מכבד
 * prefers-reduced-motion (עוצר · גרירה עדיין עובדת). מגודר opt-in `supporters.universe3d`.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { OrgConfig } from '../../types/config';
import { termOf } from '../../lib/config';
import type { Supporter } from '../../types/domain';
import { Btn } from '../ui';
import { isoToday } from '../../lib/date-util';
import type { TierKey } from './constellation';
import { donorUniverse, project, type UniverseNode } from './universe3d';

const TIER_COLOR: Record<TierKey, string> = { gold: '#f3c76b', silver: '#c9d2dd', bronze: '#e0a24e', dormant: '#8a8272' };
const TIER_LABEL: Record<TierKey, string> = { gold: 'זהב', silver: 'כסף', bronze: 'ארד', dormant: 'רדומה' };
const RENDER_CAP = 400;

export function SupportersUniverse3D(props: {
  supporters: Supporter[];
  config: OrgConfig;
  usdRate: number;
  onOpen: (id: string) => void;
  onExit?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; node: UniverseNode } | null>(null);
  const [tierHi, setTierHi] = useState<TierKey | null>(null);
  // 🐛 (21.8): toISOString = UTC ⇒ בין חצות מקומי ל-02:00/03:00 "היום" היה אתמול.
  const today = isoToday();
  const rate = props.usdRate || 3.7;

  const nodes = useMemo(() => donorUniverse(props.supporters, today, { rate }), [props.supporters, today, rate]);
  const shown = useMemo(() => {
    const arr = [...nodes].sort((a, b) => (b.atRisk ? 1 : 0) - (a.atRisk ? 1 : 0) || b.size - a.size);
    return arr.slice(0, RENDER_CAP);
  }, [nodes]);

  const hoverRef = useRef<{ mx: number; my: number }>({ mx: -9e9, my: -9e9 });
  const posRef = useRef<{ id: string; x: number; y: number; r: number; node: UniverseNode }[]>([]);
  // מצב-הסיבוב — יציב בין רינדורים, נשלט בגרירה.
  const rotRef = useRef<{ yaw: number; pitch: number; drag: boolean; px: number; py: number; downX: number; downY: number; auto: boolean }>({
    yaw: 0.5, pitch: 0.35, drag: false, px: 0, py: 0, downX: 0, downY: 0, auto: true,
  });

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, W = 0, H = 0, DPR = 1;

    const resize = () => {
      const w = wrapRef.current?.clientWidth || 800;
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = w; H = 460;
      cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
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

    let t = 0;
    const frame = () => {
      // מכבד prefers-reduced-motion: הקפאת-המונה עוצרת גם את פעימת-הסיכון (כמו הגלקסיה).
      t += reduce ? 0 : 1;
      const R = rotRef.current;
      if (R.auto && !R.drag && !reduce) R.yaw += 0.0035;
      ctx.clearRect(0, 0, W, H);
      // core glow
      glow(W / 2, H / 2, 40, 'rgba(243,199,107,0.30)', 0.8);
      ctx.fillStyle = '#fff5e0'; ctx.beginPath(); ctx.arc(W / 2, H / 2, 4, 0, 6.2832); ctx.fill();

      // הקרנה + מיון-עומק (רחוק→קרוב) כדי שהקרובים מציירים אחרונים.
      const proj = shown.map((n) => ({ n, p: project(n, R.yaw, R.pitch, W, H) }));
      proj.sort((a, b) => a.p.depth - b.p.depth);
      const pos = posRef.current; pos.length = 0;
      for (const { n, p } of proj) {
        const sz = Math.max(1.2, (2 + n.size * 6) * p.scale);
        const c = TIER_COLOR[n.tier];
        const fade = 0.5 + 0.5 * Math.min(1, Math.max(0, p.scale - 0.5));
        if (n.atRisk) {
          const fl = 0.5 + 0.5 * Math.sin(t * 0.12 + n.x * 9);
          glow(p.sx, p.sy, sz * 4, rgba('#ff6f5e', 0.35 + 0.4 * fl), 0.8 * fade);
          ctx.fillStyle = '#ff8f80';
        } else {
          glow(p.sx, p.sy, sz * 2.4, rgba(c, 0.4), 0.6 * fade);
          ctx.fillStyle = c;
        }
        ctx.globalAlpha = fade;
        ctx.beginPath(); ctx.arc(p.sx, p.sy, sz, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = 1;
        pos.push({ id: n.id, x: p.sx, y: p.sy, r: sz, node: n });
      }

      const { mx, my } = hoverRef.current;
      let best: typeof pos[number] | null = null, bd = 16;
      for (const p of pos) { const d = Math.hypot(p.x - mx, p.y - my); if (d < bd + p.r) { bd = d; best = p; } }
      if (best) {
        setHover((h) => (h && h.node.id === best!.id ? h : { x: best!.x, y: best!.y, node: best!.node }));
        cv.style.cursor = R.drag ? 'grabbing' : 'pointer';
      } else {
        setHover((h) => (h ? null : h));
        cv.style.cursor = R.drag ? 'grabbing' : 'grab';
      }
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      hoverRef.current = { mx: e.clientX - r.left, my: e.clientY - r.top };
      const R = rotRef.current;
      if (R.drag) {
        R.yaw += (e.clientX - R.px) * 0.008;
        R.pitch = Math.max(-1.3, Math.min(1.3, R.pitch + (e.clientY - R.py) * 0.008));
        R.px = e.clientX; R.py = e.clientY;
      }
    };
    const onDown = (e: PointerEvent) => {
      const R = rotRef.current; R.drag = true; R.px = e.clientX; R.py = e.clientY; R.downX = e.clientX; R.downY = e.clientY;
      hoverRef.current.mx = -9e9; // מדכא hover בזמן גרירה
    };
    const onUp = () => { rotRef.current.drag = false; };
    const onLeave = () => { hoverRef.current = { mx: -9e9, my: -9e9 }; rotRef.current.drag = false; };
    // מיקום-ה-hit-test מקואורדינטות אירוע-הלחיצה עצמו (לא hoverRef) — תמיכת-מגע.
    // אבחנת גרירה-מול-קליק לפי מרחק-מהנקודת-לחיצה (pointerup מאפס drag לפני click,
    // לכן הבדיקה על תזוזה ולא על הדגל) — שחרור-גרירה לא פותח כרטיס.
    const onClick = (e: MouseEvent) => {
      const R = rotRef.current;
      if (Math.hypot(e.clientX - R.downX, e.clientY - R.downY) > 6) return;
      const r = cv.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      let best: string | null = null, bd = 18;
      for (const p of posRef.current) { const d = Math.hypot(p.x - mx, p.y - my); if (d < bd + p.r) { bd = d; best = p.id; } }
      if (best) props.onOpen(best);
    };
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    cv.addEventListener('pointerleave', onLeave);
    cv.addEventListener('click', onClick);
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      cv.removeEventListener('pointermove', onMove);
      cv.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      cv.removeEventListener('pointerleave', onLeave);
      cv.removeEventListener('click', onClick);
      window.removeEventListener('resize', resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  const atRiskCount = nodes.reduce((a, n) => a + (n.atRisk ? 1 : 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>היקום התלת-ממדי</h1>
        <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
          {nodes.length} כוכבים · {atRiskCount} מתקררים · גררו לסובב · לחיצה לכרטיס
        </span>
        {props.onExit ? <Btn onClick={props.onExit} title="חזרה למסך-הנתונים">☰ מסך הנתונים</Btn> : null}
      </div>

      <div
        ref={wrapRef}
        style={{
          position: 'relative', borderRadius: 18, overflow: 'hidden',
          border: '1px solid rgba(243,199,107,.18)', touchAction: 'none',
          background: 'radial-gradient(120% 90% at 50% 40%, #1a1626 0%, #07060c 60%)',
        }}
      >
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 460 }} />

        <div style={{ position: 'absolute', insetBlockEnd: 12, insetInlineEnd: 12, display: 'flex', flexDirection: 'column', gap: 4, background: 'rgba(14,12,22,.6)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '9px 11px', fontSize: 11 }}>
          {(['gold', 'silver', 'bronze', 'dormant'] as TierKey[]).map((k) => (
            <button key={k} type="button" onClick={() => setTierHi(tierHi === k ? null : k)}
              title={'סינון הרשימה לדרגת ' + TIER_LABEL[k]}
              style={{ display: 'flex', alignItems: 'center', gap: 7, color: tierHi === k ? '#fff' : '#c8bea8', background: tierHi === k ? 'rgba(255,255,255,.12)' : 'none', border: 'none', borderRadius: 7, padding: '2px 5px', cursor: 'pointer', font: 'inherit', fontSize: 11 }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: TIER_COLOR[k], boxShadow: '0 0 7px ' + TIER_COLOR[k] }} />{TIER_LABEL[k]}
            </button>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#c8bea8' }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: '#ff6f5e', boxShadow: '0 0 7px #ff6f5e' }} />מתקרר
          </div>
        </div>

        {nodes.length > RENDER_CAP ? (
          <div style={{ position: 'absolute', insetBlockStart: 12, insetInlineStart: 12, fontSize: 11, color: '#c8bea8', background: 'rgba(14,12,22,.6)', borderRadius: 8, padding: '4px 9px' }}>
            מוצגים {RENDER_CAP} הכוכבים המובילים · הרשימה המלאה מתחת
          </div>
        ) : null}

        {hover ? (
          <div style={{ position: 'absolute', left: hover.x, top: hover.y, transform: 'translate(-50%, -130%)', pointerEvents: 'none', background: 'rgba(8,7,12,.94)', border: '1px solid rgba(243,199,107,.25)', borderRadius: 11, padding: '8px 11px', minWidth: 140, boxShadow: '0 10px 30px rgba(0,0,0,.6)' }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#fff' }}>{hover.node.name || 'ללא שם'}</div>
            <div style={{ fontSize: 11, color: '#8f8571', marginTop: 1 }}>{TIER_LABEL[hover.node.tier]} · ₪{hover.node.val.toLocaleString('he-IL')}</div>
            <div style={{ marginTop: 5, fontSize: 10.5, fontWeight: 700, display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: hover.node.atRisk ? 'rgba(255,111,94,.18)' : 'rgba(111,206,122,.16)', color: hover.node.atRisk ? '#ff8f80' : '#6fce7a' }}>
              {hover.node.atRisk ? '⚠ מתקרר · ' + hover.node.churn + '%' : '● פעיל'}
            </div>
          </div>
        ) : null}
      </div>

      {/* רשימת-הכוכבים — הנתונים לצד התמונה */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr .7fr .8fr .7fr auto', gap: 8, padding: '9px 14px', fontSize: 11, fontWeight: 800, color: 'var(--ink-faint)', borderBottom: '1px solid var(--line, #e4dbc9)', alignItems: 'center' }}>
          <span>תורם/ת {tierHi ? <button type="button" onClick={() => setTierHi(null)} style={{ marginInlineStart: 6, fontSize: 10.5, color: 'var(--accent-deep, #a05008)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>· {TIER_LABEL[tierHi]} ✕</button> : null}</span><span>דרגה</span><span>ערך</span><span>סיכון</span><span></span>
        </div>
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {shown.filter((n) => !tierHi || n.tier === tierHi).map((n) => (
            <div key={n.id} onClick={() => props.onOpen(n.id)}
              style={{ display: 'grid', gridTemplateColumns: '1.6fr .7fr .8fr .7fr auto', gap: 8, padding: '8px 14px', alignItems: 'center', borderBottom: '1px solid var(--line-soft, #efe8d9)', cursor: 'pointer', fontSize: 13 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{ width: 9, height: 9, borderRadius: 99, flex: 'none', background: n.atRisk ? '#ff6f5e' : TIER_COLOR[n.tier] }} />
                <span style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.name || 'ללא שם'}</span>
              </span>
              <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{TIER_LABEL[n.tier]}</span>
              <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>₪{n.val.toLocaleString('he-IL')}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: n.atRisk ? 'var(--red, #b3261e)' : 'var(--good, #2e7d32)' }}>{n.atRisk ? '⚠ ' + n.churn + '%' : '●'}</span>
              <Btn sm onClick={() => props.onOpen(n.id)} title="פתיחת כרטיס">פתח</Btn>
            </div>
          ))}
          {shown.filter((n) => !tierHi || n.tier === tierHi).length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--ink-faint)' }}>אין {termOf(props.config, 'nav.supporters', 'תורמים')} להצגה.</div> : null}
        </div>
      </div>
    </div>
  );
}
