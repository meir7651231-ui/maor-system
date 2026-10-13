/**
 * 📒 פרנסה׳לע — האווירה של המקור (עיצוב 6ב):
 *   · GoldDust — "אבק הזהב" (dust במקור): קנבס קבוע מאחורי הדף, ניצוצות-זהב שעולים לאט ומנצנצים; בלילה — זוהר (lighter),
 *     ביום — עדין. כבוי בתנועה-מופחתת ובשבת/חג (calm), נעצר כשהלשונית מוסתרת; burst = פרץ-ניצוצות (מטבעות שנמצאו, הפתיחה).
 *     במשקל-נוצה: ≤46 חלקיקים, ספרייט אחד, devicePixelRatio ≤1.5.
 *   · PnIntro — "רגע הפושקע" (intro במקור), פעם אחת בסשן, ≤2.1 שניות, נגיעה/מקש מדלגים, לעולם לא חוסם: הפושקע קופץ,
 *     אותיות סימן-המילה נוחתות אחת-אחת, הגרש-יהלום מבזיק, השורה "א פרנסה׳לע פאר יעדן איד" — והפושקע "נוחת" לתוך
 *     הסמל שבפס (FLIP). זה מסלול-הגיבוי של המקור (CSS) — את גרסת ה-three.js שנטענה מ-cdnjs לא טוענים (אפס CDN).
 *     מדולג בתנועה-מופחתת ובדפדפן-אוטומציה (navigator.webdriver — כמו רישום ה-PWA), כך שהבדיקות לא נחסמות.
 */
import { useEffect, useRef, useState } from 'react';
import { cx, PnPortal, vars } from './skin';
import { PN_TAGLINE } from './shell';

/* ═══════════════ אבק הזהב ═══════════════ */

interface Part {
  x: number;
  y: number;
  vx: number;
  vy: number;
  z: number;
  r: number;
  ph: number;
  life: number;
  b: boolean;
}

export function GoldDust(props: { on: boolean; dark: boolean; burst: number; /** "מעל" — בתוך הפתיחה (dust.over במקור). */ over?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const dark = useRef(props.dark);
  const api = useRef<{ burst: () => void } | null>(null);
  useEffect(() => {
    dark.current = props.dark;
  }, [props.dark]);
  useEffect(() => {
    const cv = ref.current;
    const ctx = props.on && cv ? cv.getContext('2d') : null;
    if (!cv || !ctx) return;
    const spr = document.createElement('canvas');
    spr.width = spr.height = 32;
    const g = spr.getContext('2d');
    if (g) {
      const r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
      r.addColorStop(0, 'rgba(255,240,190,1)');
      r.addColorStop(0.25, 'rgba(246,206,120,.8)');
      r.addColorStop(1, 'rgba(200,140,40,0)');
      g.fillStyle = r;
      g.fillRect(0, 0, 32, 32);
    }
    let parts: Part[] = [];
    let w = 0;
    let h = 0;
    let raf = 0;
    let lt = 0;
    const mk = (b: boolean): Part => {
      const z = Math.random();
      if (b) {
        const a = Math.random() * Math.PI * 2;
        const s = 40 + Math.random() * 240;
        return { x: w / 2, y: h * 0.45, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7 - 30, z: 0.4 + z * 0.8, r: 1 + Math.random() * 2, ph: Math.random() * 6, life: 1 + Math.random() * 0.8, b: true };
      }
      return { x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 5, vy: -3 - Math.random() * 8, z, r: 0.5 + z * 1.5, ph: Math.random() * 6, life: 0, b: false };
    };
    const size = (): void => {
      const d = Math.min(1.5, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      cv.width = w * d;
      cv.height = h * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      const n = Math.round(Math.min(46, (w * h) / 14000));
      parts = parts.filter((p) => p.b);
      while (parts.filter((p) => !p.b).length < n) parts.push(mk(false));
    };
    const loop = (t: number): void => {
      raf = 0;
      if (document.hidden) return;
      const dt = Math.min(0.05, (t - lt) / 1000);
      lt = t;
      ctx.clearRect(0, 0, w, h);
      const light = !dark.current;
      ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.ph += dt * (1.4 + p.z);
        if (p.b) {
          p.life -= dt;
          p.vx *= 0.985;
          p.vy = p.vy * 0.985 + 12 * dt;
          if (p.life <= 0) {
            parts.splice(i, 1);
            continue;
          }
        } else {
          if (p.y < -10) {
            p.y = h + 10;
            p.x = Math.random() * w;
          }
          if (p.x < -10) p.x = w + 10;
          if (p.x > w + 10) p.x = -10;
        }
        const tw = 0.45 + 0.55 * Math.sin(p.ph);
        const a = (p.b ? Math.min(1, p.life) : 0.2 + 0.5 * p.z) * tw * (light ? 0.5 : 0.9);
        const s = p.r * (p.b ? 3.2 : 3);
        ctx.globalAlpha = Math.max(0, a);
        ctx.drawImage(spr, p.x - s, p.y - s, s * 2, s * 2);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(loop);
    };
    const start = (): void => {
      if (raf || document.hidden) return;
      lt = performance.now();
      raf = requestAnimationFrame(loop);
    };
    size();
    start();
    window.addEventListener('resize', size);
    document.addEventListener('visibilitychange', start);
    api.current = {
      burst: () => {
        for (let i = 0; i < 90; i++) parts.push(mk(true));
        start();
      },
    };
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', size);
      document.removeEventListener('visibilitychange', start);
      ctx.clearRect(0, 0, w, h);
      api.current = null;
    };
  }, [props.on]);
  useEffect(() => {
    if (props.burst) api.current?.burst();
  }, [props.burst]);
  return <canvas ref={ref} className={props.over ? 'pn-dust pn-over' : 'pn-dust'} aria-hidden="true" hidden={!props.on} />;
}

/* ═══════════════ רגע הפושקע ═══════════════ */

const INTRO_KEY = 'maor_pn_intro';
const CAP = 2050;
const EXIT = 460;
const FB_AT = 600;

/** האם להראות את הפתיחה עכשיו (פעם בסשן; לא בתנועה-מופחתת ולא בדפדפן-אוטומציה) — ומסמן שהוצגה. */
export function claimIntro(reduced: boolean): boolean {
  if (typeof window === 'undefined' || reduced) return false;
  try {
    if (navigator.webdriver) return false;
    // useReducedMotion מתעדכן רק אחרי הרינדור הראשון — כאן קוראים את ההעדפה ישירות
    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if (sessionStorage.getItem(INTRO_KEY) === '1') return false;
    sessionStorage.setItem(INTRO_KEY, '1');
    return true;
  } catch {
    return false;
  }
}

/** סימן-המילה באותיות נוחתות (letterIn): הגרש (׳) — יהלום. */
function introLetters(brand: string): Array<{ ch: string; gm: boolean }> {
  return [...brand].map((ch) => ({ ch, gm: ch === '׳' }));
}

export function PnIntro(props: { brand: string; onBurst: () => void; onDone: () => void }) {
  const [phase, setPhase] = useState<'' | 'out' | 'gone'>('');
  // קו-האור קודם (iGlow), ואחרי 600ms מסלול ה-CSS (fallback במקור — כשאין three.js)
  const [fb, setFb] = useState(false);
  // פרץ-הניצוצות של הפתיחה (dust.burst במקור) — על קנבס של הפתיחה עצמה, מעליה
  const [burst, setBurst] = useState(0);
  const pmRef = useRef<HTMLSpanElement>(null);
  const done = useRef(false);
  const onDone = useRef(props.onDone);
  const onBurst = useRef(props.onBurst);
  useEffect(() => {
    onDone.current = props.onDone;
    onBurst.current = props.onBurst;
  }, [props.onDone, props.onBurst]);
  useEffect(() => {
    const tm: Array<ReturnType<typeof setTimeout>> = [];
    const later = (f: () => void, ms: number): void => {
      tm.push(setTimeout(f, Math.max(0, ms)));
    };
    const finish = (): void => onDone.current();
    const skip = (): void => {
      if (done.current) return;
      done.current = true;
      setPhase('gone');
      later(finish, 170);
    };
    const onVis = (): void => {
      if (document.hidden) skip();
    };
    /** FLIP: הפושקע של הפתיחה "נוחת" לתוך הסמל שבפס בזמן שמסך-האור נעלם (land במקור). */
    const land = (): void => {
      if (done.current) return;
      done.current = true;
      const node = pmRef.current;
      const bm = document.querySelector('.pn-root .pn-brandMark');
      const to = bm?.getBoundingClientRect();
      const from = node?.getBoundingClientRect();
      if (node && to && from && from.height > 0 && to.height > 0) {
        const k = to.height / from.height;
        const tx = to.left + to.width / 2 - (from.left + from.width / 2);
        const ty = to.top + to.height / 2 - (from.top + from.height / 2);
        setPhase('out');
        requestAnimationFrame(() => {
          node.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + k + ')';
          node.style.opacity = '0';
          node.style.transitionDelay = '0s,' + ((EXIT * 0.62) | 0) + 'ms';
          node.style.transitionDuration = EXIT + 'ms,' + ((EXIT * 0.38) | 0) + 'ms';
        });
      } else setPhase('gone');
      later(() => {
        if (!bm) return;
        bm.classList.remove('pn-land');
        void (bm as HTMLElement).offsetWidth;
        bm.classList.add('pn-land');
      }, EXIT - 140);
      later(finish, EXIT + 30);
    };
    window.addEventListener('keydown', skip, true);
    window.addEventListener('resize', skip);
    document.addEventListener('visibilitychange', onVis);
    later(() => setFb(true), FB_AT);
    later(() => {
      setBurst((n) => n + 1);
      onBurst.current();
    }, FB_AT + 520);
    later(land, FB_AT + 850);
    later(skip, CAP);
    return () => {
      tm.forEach(clearTimeout);
      window.removeEventListener('keydown', skip, true);
      window.removeEventListener('resize', skip);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);
  let i = 0;
  return (
    <PnPortal>
      <div
        className={cx('pn-intro', fb && 'pn-fb', phase === 'out' && 'pn-out', phase === 'gone' && 'pn-gone')}
        aria-hidden="true"
        onPointerDown={() => {
          if (done.current) return;
          done.current = true;
          setPhase('gone');
          setTimeout(() => onDone.current(), 170);
        }}
      >
        <div className="pn-i-bg" />
        <div className="pn-i-glow" />
        <div className="pn-i-fb">
          <span className="pn-i-halo" />
          <span className="pn-pm pn-i-pm" ref={pmRef} />
          <div className="pn-pwm pn-i-wm">
            {introLetters(props.brand).map((x, j) =>
              x.gm ? (
                <i key={j} className="pn-gm" />
              ) : (
                <span key={j} style={vars({ i: i++ })}>
                  {x.ch}
                </span>
              ),
            )}
          </div>
          <div className="pn-i-tag">{PN_TAGLINE}</div>
        </div>
        <GoldDust on dark over burst={burst} />
        <div className="pn-iskip">הקישו לדילוג</div>
      </div>
    </PnPortal>
  );
}
