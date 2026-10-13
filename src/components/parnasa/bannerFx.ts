/**
 * 📒 פרנסה׳לע — הבמה של באנרי-התמונה (עיצוב 2), מועתקת מ-parnasale.html L2814–2934: באנר שמתקרב לחלון מקבל את
 * התמונה (data-h ⇒ href); הקרוב למרכז "נדלק" (‎--pn-on); לכל היותר ארבעה מונפשים בבת-אחת (חלקיקים בשכבת-החיים —
 * מים, אבק באור, ניצוצות, אדים, בועות; הבזק-מצלמה; קו-דופק); נגיעה ⇒ אדווה במקום האצבע; החלקה ימינה ⇒ וואטסאפ
 * (או העתקת-המספר), שמאלה ⇒ חיוג (רק גרירה אופקית — גלילה נשארת לדפדפן); הנחיה עדינה פעם בסשן. + החלקת שורות-בקשה
 * (‎.pn-rsw-sl). DOM אימפרטיבי כמו המקור; מאזינים גלובליים נרשמים פעם אחת (מונה-הפניות) ומוסרים ביציאה מהמסך.
 */

const PB_NS = 'http://www.w3.org/2000/svg';
const reduced = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

interface Part {
  c: SVGElement;
  reset: (d: Part) => void;
  kind: string;
  x: number;
  y: number;
  r: number;
  v: number;
  vx: number;
  life: number;
}
interface Steam {
  e: SVGPathElement;
  x: number;
  y: number;
  ph: number;
}
interface Stage {
  parts: Part[];
  rings: SVGEllipseElement[];
  t0: number;
  bulb?: SVGElement | null;
  wisps?: SVGPathElement[];
  steam?: Steam[];
  flash?: SVGElement | null;
  next?: number;
  fl?: number;
  ecg?: SVGPathElement | null;
  ecgL?: number;
}
interface Art extends HTMLElement {
  _ld?: 1;
  _fit?: 1;
  _pz?: 0 | 1;
  _st?: Stage;
  _nudge?: number;
}
interface Drag {
  art: Art;
  box: HTMLElement;
  sx: number;
  sy: number;
  dx: number;
  id: number;
  drag: boolean;
  dir?: number;
}

const PBS = {
  io: null as IntersectionObserver | null,
  near: new Set<Art>(),
  live: new Set<Art>(),
  raf: 0,
  q: 0,
  swiped: 0,
  d: null as Drag | null,
  nudged: false,
  fw: 0,
  refs: 0,
  toast: (_m: string): void => {},
};

/** תמונה רק כשהבאנר מתקרב (חוסך הורדות). */
function pbLoad(art: Art): void {
  if (art._ld) return;
  art._ld = 1;
  art.querySelectorAll('image[data-h]').forEach((im) => {
    im.setAttribute('href', im.getAttribute('data-h') ?? '');
    im.removeAttribute('data-h');
  });
}

/** רישום באנרים חדשים בתוך root (אידמפוטנטי — data-m). */
export function pbMount(root: Element | null): void {
  if (!root) return;
  const arts = root.querySelectorAll<Art>('.pn-pbn:not([data-m])');
  if (!arts.length) {
    pbQueue();
    return;
  }
  if (!PBS.io && 'IntersectionObserver' in window) {
    try {
      PBS.io = new IntersectionObserver(
        (es) => {
          for (const x of es) {
            const a = x.target as Art;
            if (x.isIntersecting) {
              pbLoad(a);
              PBS.near.add(a);
            } else {
              PBS.near.delete(a);
              pbLive(a, false);
            }
          }
          pbQueue();
        },
        { rootMargin: '360px 0px' },
      );
    } catch {
      PBS.io = null;
    }
  }
  arts.forEach((art) => {
    art.dataset.m = '1';
    if (reduced()) art.style.setProperty('--pn-on', '1');
    if (PBS.io) PBS.io.observe(art);
    else {
      pbLoad(art);
      PBS.near.add(art);
    }
  });
  pbQueue();
}

function pbQueue(): void {
  if (!PBS.q && typeof requestAnimationFrame === 'function') PBS.q = requestAnimationFrame(pbStage);
}

function pbStage(): void {
  PBS.q = 0;
  const vh = window.innerHeight || 800;
  const mid = vh / 2;
  const cand: Array<[number, Art, number]> = [];
  const rm = reduced();
  for (const art of Array.from(PBS.near)) {
    if (!art.isConnected) {
      PBS.near.delete(art);
      PBS.io?.unobserve(art);
      pbLive(art, false);
      continue;
    }
    const r = ((art.firstElementChild as HTMLElement | null) ?? art).getBoundingClientRect();
    if (!r.height || r.bottom < 0 || r.top > vh) {
      pbLive(art, false);
      continue;
    }
    const d = Math.abs(r.top + r.height / 2 - mid) / (vh / 2);
    const on = rm ? 1 : Math.max(0, Math.min(1, 1.2 - d * 1.7));
    if (!art.closest('.pn-mebn')) art.style.setProperty('--pn-on', rm ? '1' : on.toFixed(3));
    pbFit(art);
    cand.push([d, art, on]);
  }
  for (const art of Array.from(PBS.live)) if (!art.isConnected) pbLive(art, false);
  cand.sort((a, b) => a[0] - b[0]);
  const keep = new Set(rm ? [] : cand.slice(0, 4).map((x) => x[1]));
  for (const [, art, on] of cand) {
    pbLive(art, keep.has(art));
    if (art._nudge === 1 && (on > 0.85 || art.closest('.pn-mebn'))) {
      art._nudge = 2;
      setTimeout(() => pbNudgePlay(art), 600);
    }
  }
  if (rm)
    for (const [, art] of cand)
      if (!art._st) {
        pbSetup(art);
        pbFrame(art, performance.now() + 800);
      }
  const defs = document.getElementById('pn-pbnDefs') as unknown as SVGSVGElement | null;
  if (defs && typeof defs.pauseAnimations === 'function') {
    try {
      if (PBS.live.size) defs.unpauseAnimations();
      else defs.pauseAnimations();
    } catch {
      /* דפדפן בלי SMIL */
    }
  }
  if (PBS.live.size && !PBS.raf && !rm) PBS.raf = requestAnimationFrame(pbLoop);
}

/** הקטנה-אוטומטית של השם עד שנכנס בשתי שורות של הפאנל (יחידות-מכולה ⇒ התאמה אחת לכל רוחב). */
function pbFit(art: Art): void {
  if (art._fit) return;
  const n = art.querySelector('.pn-bn-nm') as HTMLElement | null;
  if (!n) {
    art._fit = 1;
    return;
  }
  if (!n.clientHeight) return;
  if (document.fonts && document.fonts.status !== 'loaded') {
    if (!PBS.fw) {
      PBS.fw = 1;
      void document.fonts.ready.then(() => {
        PBS.fw = 0;
        pbQueue();
      });
    }
    return;
  }
  art._fit = 1;
  const C = ['', 'pn-long', 'pn-xlong', 'pn-xxlong'];
  let i = Math.max(0, C.indexOf(n.classList.contains('pn-xlong') ? 'pn-xlong' : n.classList.contains('pn-long') ? 'pn-long' : ''));
  const over = (): boolean => n.scrollHeight > n.clientHeight + 2 || n.scrollWidth > n.clientWidth + 2;
  while (over() && i < C.length - 1) {
    if (C[i]) n.classList.remove(C[i]);
    i++;
    n.classList.add(C[i]);
  }
}

function pbLive(art: Art, on: boolean): void {
  const sv = art.querySelector('.pn-pbn-sc') as unknown as SVGSVGElement | null;
  const ps = (f: 'pauseAnimations' | 'unpauseAnimations'): void => {
    try {
      if (sv && typeof sv[f] === 'function') sv[f]();
    } catch {
      /* בלי SMIL */
    }
  };
  if (on === PBS.live.has(art)) {
    if (!on && !art._pz) {
      art._pz = 1;
      ps('pauseAnimations');
    }
    return;
  }
  if (on) {
    PBS.live.add(art);
    art.classList.add('pn-pbn-live');
    if (!art._st) pbSetup(art);
    art._pz = 0;
    ps('unpauseAnimations');
  } else {
    PBS.live.delete(art);
    art.classList.remove('pn-pbn-live');
    art._pz = 1;
    ps('pauseAnimations');
  }
}

function pbLoop(now: number): void {
  PBS.raf = 0;
  for (const art of PBS.live) pbFrame(art, now);
  if (PBS.live.size && !reduced()) PBS.raf = requestAnimationFrame(pbLoop);
}

const R = Math.random;
function mkC(g: Element | null, fill: string): SVGElement {
  const c = document.createElementNS(PB_NS, 'circle');
  c.setAttribute('fill', fill);
  g?.appendChild(c);
  return c;
}
const part = (c: SVGElement, kind: string, reset: (d: Part) => void): Part => ({ c, reset, kind, x: 0, y: 0, r: 0, v: 0, vx: 0, life: 0 });

/** החלקיקים לכל שכבת-חיים (מהגלריה שאושרה). */
function pbSetup(art: Art): void {
  const fx = art.dataset.fx;
  const stg: Stage = { parts: [], rings: [], t0: performance.now() };
  art._st = stg;
  if (!fx) return;
  const q = (s: string): Element | null => art.querySelector('.pn-pbn-sc ' + s);
  const motesIn = (sel: string, n: number, fn: (d: Part) => void): Part[] => {
    const g = q(sel);
    return g ? [...Array(n)].map(() => part(mkC(g, 'url(#pn-pbn-mote)'), 'mote', fn)) : [];
  };
  let parts: Part[] = [];
  if (fx === 'water') {
    const pool = q('.pn-pool');
    const mist = q('.pn-mist');
    stg.rings = [...Array(4)].map(() => {
      const e = document.createElementNS(PB_NS, 'ellipse');
      e.setAttribute('class', 'pn-pbn-ring');
      e.setAttribute('cx', '905');
      e.setAttribute('cy', '605');
      pool?.appendChild(e);
      return e;
    });
    parts = [...Array(14)].map(() =>
      part(mkC(mist, 'url(#pn-pbn-mistG)'), 'mist', (d) => {
        d.x = 880 + R() * 90;
        d.y = 590 + R() * 20;
        d.r = 8 + R() * 16;
        d.v = 0.25 + R() * 0.5;
        d.vx = 0;
        d.life = 0;
      }),
    );
  }
  if (fx === 'stam')
    parts = motesIn('.pn-motes', 26, (d) => {
      const t = R();
      d.x = 1000 + R() * 330 - t * 120;
      d.y = 60 + t * 480;
      d.r = 2 + R() * 4.5;
      d.v = -0.08 - R() * 0.12;
      d.vx = (R() - 0.5) * 0.25;
      d.life = 0;
    });
  if (fx === 'move') {
    const g = q('.pn-petals');
    parts = [...Array(16)].map(() =>
      part(mkC(g, '#e2559a'), 'petal', (d) => {
        d.x = 540 + R() * 120;
        d.y = 80 + R() * 260;
        d.r = 3 + R() * 3;
        d.v = 0.35 + R() * 0.4;
        d.vx = -0.15 + R() * 0.5;
        d.life = 0;
      }),
    );
  }
  if (fx === 'elec') {
    const gs = q('.pn-sparks');
    parts = motesIn('.pn-motes', 16, (d) => {
      d.x = 640 + R() * 260;
      d.y = 150 + R() * 320;
      d.r = 1.5 + R() * 3;
      d.v = -0.05 - R() * 0.08;
      d.vx = (R() - 0.5) * 0.2;
      d.life = 0;
    }).concat(
      [...Array(8)].map(() =>
        part(mkC(gs, '#ffe9a8'), 'spark', (d) => {
          d.x = 890 + R() * 190;
          d.y = 120 + R() * 90;
          d.r = 1.6 + R() * 1.8;
          d.v = 1.2 + R() * 1.4;
          d.vx = (R() - 0.5) * 0.6;
          d.life = 0;
        }),
      ),
    );
    stg.bulb = q('.pn-bulb') as SVGElement | null;
  }
  if (fx === 'ac') {
    const g = q('.pn-flakes');
    const gw = q('.pn-wisps');
    parts = [...Array(22)].map(() =>
      part(mkC(g, 'url(#pn-pbn-mote)'), 'flake', (d) => {
        d.x = 620 + R() * 220;
        d.y = 210 + R() * 30;
        d.r = 2 + R() * 3.5;
        d.v = 0.35 + R() * 0.4;
        d.vx = 0.25 + R() * 0.45;
        d.life = 0;
      }),
    );
    stg.wisps = [...Array(5)].map((_, i) => {
      const e = document.createElementNS(PB_NS, 'path');
      e.setAttribute('fill', 'none');
      e.setAttribute('stroke', 'rgba(225,244,255,.55)');
      e.setAttribute('stroke-width', String(10 + i * 3));
      e.setAttribute('stroke-linecap', 'round');
      e.setAttribute('style', 'filter:blur(6px)');
      gw?.appendChild(e);
      return e;
    });
  }
  const steam = (pts: Array<[number, number]>, w: number, op: number): Steam[] => {
    const gw = q('.pn-steam');
    return pts.flatMap(([x, y], k) =>
      [0, 1].map((j) => {
        const e = document.createElementNS(PB_NS, 'path');
        e.setAttribute('fill', 'none');
        e.setAttribute('stroke', `rgba(255,255,255,${op})`);
        e.setAttribute('stroke-width', String(w - j * 4));
        e.setAttribute('stroke-linecap', 'round');
        e.setAttribute('style', 'filter:blur(7px)');
        gw?.appendChild(e);
        return { e, x, y, ph: k * 0.9 + j * 0.5 };
      }),
    );
  };
  const drift = (x0: number, xs: number, y0: number, ys: number, r0: number, rs: number, v0: number, vs: number, vxs: number) => (d: Part) => {
    d.x = x0 + R() * xs;
    d.y = y0 + R() * ys;
    d.r = r0 + R() * rs;
    d.v = v0 - R() * vs;
    d.vx = (R() - 0.5) * vxs;
    d.life = 0;
  };
  if (fx === 'learn') parts = motesIn('.pn-motes', 18, drift(980, 320, 260, 260, 1.5, 3, -0.06, 0.08, 0.2));
  if (fx === 'build')
    parts = motesIn('.pn-motes', 30, (d) => {
      const t = R();
      d.x = 1250 - t * 380 + R() * 120;
      d.y = 110 + t * 560;
      d.r = 1.5 + R() * 3.5;
      d.v = -0.05 - R() * 0.1;
      d.vx = (R() - 0.5) * 0.25;
      d.life = 0;
    });
  if (fx === 'cater') stg.steam = steam([[920, 295], [1048, 275], [1135, 265], [1175, 262]], 14, 0.6);
  if (fx === 'acct') parts = motesIn('.pn-motes', 16, drift(780, 450, 150, 350, 1.5, 3, -0.05, 0.08, 0.2));
  if (fx === 'estate') parts = motesIn('.pn-motes', 22, drift(600, 500, 200, 350, 1.5, 3, -0.04, 0.08, 0.2));
  if (fx === 'garden')
    parts = motesIn('.pn-motes', 26, (d) => {
      d.x = 820 + R() * 260;
      d.y = 150 + R() * 250;
      d.r = 1.5 + R() * 2.5;
      d.v = 0.25 + R() * 0.4;
      d.vx = -0.2 + R() * 0.2;
      d.life = 0;
    });
  if (fx === 'bake') {
    parts = motesIn('.pn-motes', 20, drift(850, 450, 500, 180, 1.5, 2.5, -0.08, 0.1, 0.2));
    stg.steam = steam([[780, 450], [880, 470], [960, 480]], 12, 0.55);
  }
  if (fx === 'clean') {
    const g = q('.pn-bubbles');
    parts = [...Array(12)].map(() => {
      const c = document.createElementNS(PB_NS, 'circle');
      c.setAttribute('fill', 'rgba(255,255,255,.12)');
      c.setAttribute('stroke', 'rgba(255,255,255,.75)');
      c.setAttribute('stroke-width', '1.6');
      g?.appendChild(c);
      return part(c, 'bubble', (d) => {
        d.x = 640 + R() * 300;
        d.y = 430 + R() * 120;
        d.r = 5 + R() * 9;
        d.v = -0.25 - R() * 0.3;
        d.vx = (R() - 0.5) * 0.3;
        d.life = 0;
      });
    });
  }
  if (fx === 'photog') {
    stg.flash = q('.pn-flash') as SVGElement | null;
    stg.next = performance.now() + 2500;
  }
  if (fx === 'health') {
    stg.ecg = q('.pn-ecg') as SVGPathElement | null;
    if (stg.ecg) {
      try {
        const L = stg.ecg.getTotalLength();
        stg.ecg.setAttribute('stroke-dasharray', L + ' ' + L);
        stg.ecgL = L;
      } catch {
        stg.ecg = null;
      }
    }
  }
  parts.forEach((p) => {
    p.reset(p);
    p.life = R();
  });
  stg.parts = parts;
}

function pbFrame(art: Art, now: number): void {
  const s = art._st;
  if (!s) return;
  const t = (now - s.t0) / 1000;
  const rm = reduced();
  s.rings.forEach((e, i) => {
    const p = (t * 0.45 + i / s.rings.length) % 1;
    e.setAttribute('rx', (20 + p * 190).toFixed(1));
    e.setAttribute('ry', (6 + p * 48).toFixed(1));
    e.setAttribute('opacity', ((1 - p) * 0.55).toFixed(2));
  });
  s.parts.forEach((d) => {
    d.life += d.kind === 'mote' ? 0.0025 : 0.006;
    if (d.kind === 'mist') {
      d.y -= d.v;
      d.x += Math.sin((t + d.r) * 1.3) * 0.25;
    } else if (d.kind === 'mote') {
      d.y += d.v;
      d.x += d.vx + Math.sin(t * 0.7 + d.r) * 0.15;
    } else if (d.kind === 'spark') {
      d.life += 0.03;
      d.y += d.v;
      d.x += d.vx;
    } else if (d.kind === 'bubble') {
      d.life += 0.002;
      d.y += d.v;
      d.x += d.vx + Math.sin(t * 1.2 + d.r) * 0.35;
    } else if (d.kind === 'flake') {
      d.y += d.v;
      d.x += d.vx + Math.sin(t * 1.5 + d.r) * 0.3;
    } else {
      d.y += d.v;
      d.x += d.vx + Math.sin(t * 2 + d.r) * 0.4;
    }
    if (d.life >= 1) d.reset(d);
    d.c.setAttribute('cx', d.x.toFixed(1));
    d.c.setAttribute('cy', d.y.toFixed(1));
    d.c.setAttribute('r', (d.kind === 'mist' ? d.r * (0.6 + d.life) : d.r).toFixed(1));
    const peak = d.kind === 'mist' ? 0.55 : d.kind === 'mote' ? 0.9 : d.kind === 'spark' ? (rm ? 0.6 : Math.random() < 0.5 ? 1 : 0.3) : 0.85;
    d.c.setAttribute('opacity', (Math.sin(d.life * Math.PI) * peak).toFixed(2));
  });
  if (s.flash) {
    if (!rm && now > (s.next ?? 0)) {
      s.fl = now;
      s.next = now + 6500 + Math.random() * 3000;
    }
    const fp = (now - (s.fl ?? -1e9)) / 420;
    s.flash.setAttribute('opacity', fp < 1 ? (Math.pow(1 - fp, 2) * 0.7).toFixed(2) : '0');
  }
  if (s.ecg && s.ecgL) {
    const k = (t * 0.45) % 1;
    s.ecg.setAttribute('stroke-dashoffset', (s.ecgL * (1 - k * 1.6)).toFixed(0));
    s.ecg.setAttribute('opacity', (Math.sin(Math.min(1, k * 1.25) * Math.PI) * 0.75).toFixed(2));
  }
  s.steam?.forEach((o) => {
    const k = (t * 0.28 + o.ph) % 1;
    const y1 = o.y - 40 - k * 170;
    const sway = Math.sin(t * 1.3 + o.ph * 3) * 18;
    o.e.setAttribute('d', `M${o.x} ${(o.y - k * 40).toFixed(1)} C ${(o.x + sway).toFixed(1)} ${(o.y - 60 - k * 80).toFixed(1)}, ${(o.x - sway).toFixed(1)} ${(y1 + 40).toFixed(1)}, ${(o.x + sway * 0.6).toFixed(1)} ${y1.toFixed(1)}`);
    o.e.setAttribute('opacity', (Math.sin(k * Math.PI) * 0.45).toFixed(2));
  });
  if (s.bulb) {
    const f = Math.sin(t * 2.1) * 0.06 + Math.sin(t * 13.7) * 0.04 + (!rm && Math.random() < 0.012 ? -0.35 : 0);
    s.bulb.setAttribute('opacity', Math.max(0.2, 0.78 + f).toFixed(2));
  }
  s.wisps?.forEach((e, i) => {
    const k = (t * 0.35 + i / 5) % 1;
    const x0 = 650 + i * 40;
    const y0 = 225;
    const x1 = x0 + 80 + k * 220;
    const y1 = y0 + 120 + k * 260;
    e.setAttribute('d', `M${x0} ${y0} C ${x0 + 30} ${(y0 + 60 + Math.sin(t + i) * 20).toFixed(1)}, ${(x1 - 60).toFixed(1)} ${(y1 - 80).toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`);
    e.setAttribute('opacity', (Math.sin(k * Math.PI) * 0.5).toFixed(2));
    e.setAttribute('stroke-dasharray', `${(40 + k * 120).toFixed(0)} 900`);
    e.setAttribute('stroke-dashoffset', (-k * 200).toFixed(0));
  });
}

/** נגיעה: אדווה במקום שהאצבע נחתה. */
export function pbRipple(art: Element | null, cx: number, cy: number): void {
  if (!art || reduced()) return;
  const svg = art.querySelector('.pn-pbn-rp') as SVGSVGElement | null;
  const g = svg?.firstElementChild;
  if (!svg || !g) return;
  let p: DOMPoint;
  try {
    const m = svg.getScreenCTM();
    if (!m) return;
    p = new DOMPoint(cx, cy).matrixTransform(m.inverse());
  } catch {
    return;
  }
  const els = [0, 1, 2].map(() => {
    const e = document.createElementNS(PB_NS, 'ellipse');
    e.setAttribute('class', 'pn-pbn-ring');
    e.setAttribute('cx', p.x.toFixed(1));
    e.setAttribute('cy', p.y.toFixed(1));
    g.appendChild(e);
    return e;
  });
  const t0 = performance.now();
  const step = (now: number): void => {
    const q = (now - t0) / 1400;
    if (q >= 1 || !art.isConnected) {
      els.forEach((e) => e.remove());
      return;
    }
    els.forEach((e, j) => {
      const k = Math.max(0, q - j * 0.12);
      e.setAttribute('rx', (k * 260).toFixed(1));
      e.setAttribute('ry', (k * 150).toFixed(1));
      e.setAttribute('opacity', ((1 - k) * 0.9).toFixed(2));
    });
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** החלקה אחרונה (ms) — לחיצה מיד אחרי החלקה לא פותחת את הדף. */
export function pbJustSwiped(): boolean {
  return performance.now() - PBS.swiped < 450;
}

function vibrate(): void {
  try {
    navigator.vibrate?.(12);
  } catch {
    /* אין רטט */
  }
}
function pbCall(art: Element): void {
  const c = art.querySelector('.pn-bn-call') as HTMLElement | null;
  if (!c) {
    PBS.toast('אין מספר טלפון לעסק הזה');
    return;
  }
  vibrate();
  c.click();
}
/** וואטסאפ (או העתקת-המספר) של באנר — גם W במקלדת. */
export function pbWA(art: Element | null): void {
  if (!art) return;
  const w = art.querySelector('.pn-bn-wa') as HTMLElement | null;
  if (!w) {
    PBS.toast('אין מספר טלפון לעסק הזה');
    return;
  }
  vibrate();
  w.click();
}

function onDown(ev: PointerEvent): void {
  const t = ev.target as Element | null;
  const box = t?.closest?.('.pn-pbn-box') as HTMLElement | null;
  if (!box || ev.button > 0 || t?.closest('.pn-bn-wa') || box.closest('[inert]')) return;
  PBS.d = { art: box.parentNode as Art, box, sx: ev.clientX, sy: ev.clientY, dx: 0, id: ev.pointerId, drag: false };
}
function onMove(ev: PointerEvent): void {
  const d = PBS.d;
  if (!d || ev.pointerId !== d.id) return;
  const mx = ev.clientX - d.sx;
  const my = ev.clientY - d.sy;
  if (!d.drag) {
    const neg = mx < -8 && !!d.art.querySelector('.pn-bn-call');
    if ((mx > 8 || neg) && Math.abs(mx) > Math.abs(my) * 1.2) {
      d.drag = true;
      d.dir = mx > 0 ? 1 : -1;
      d.art.classList.add('pn-drag');
      d.art.classList.toggle('pn-neg', d.dir < 0);
      try {
        d.box.setPointerCapture(d.id);
      } catch {
        /* */
      }
    } else if (Math.abs(my) > 10 || mx < -10) {
      PBS.d = null;
      return;
    } else return;
  }
  const w = d.box.clientWidth || 1;
  const dir = d.dir ?? 1;
  d.dx = Math.max(0, Math.min(w * 0.55, mx * dir));
  const r = d.dx / (w * 0.32);
  d.art.style.setProperty('--pn-dx', (dir * d.dx * (r > 1 ? 1 - (r - 1) * 0.25 : 1)).toFixed(1) + 'px');
  d.art.style.setProperty('--pn-p', Math.min(1, r).toFixed(2));
  d.art.classList.toggle('pn-go', r >= 1);
}
function onEnd(ev: PointerEvent): void {
  const d = PBS.d;
  if (!d || ev.pointerId !== d.id) return;
  PBS.d = null;
  if (!d.drag) return;
  const art = d.art;
  PBS.swiped = performance.now();
  art.classList.remove('pn-drag', 'pn-go');
  art.style.setProperty('--pn-dx', '0px');
  art.style.setProperty('--pn-p', '0');
  if (ev.type === 'pointerup' && d.dx > (d.box.clientWidth || 1) * 0.32) (d.dir && d.dir < 0 ? pbCall : pbWA)(art);
  setTimeout(() => art.classList.remove('pn-neg'), 460);
}

/* ═══ החלקת שורות-בקשה (‎.pn-rsw-sl): ימינה ⇒ וואטסאפ, שמאלה ⇒ חיוג ═══ */
interface RDrag {
  w: HTMLElement;
  sl: HTMLElement;
  sx: number;
  sy: number;
  dx: number;
  dir: number;
  id: number;
  drag: boolean;
  th?: number;
}
const RSW = { d: null as RDrag | null, t: 0 };
function rDown(ev: PointerEvent): void {
  const t = ev.target as Element | null;
  const sl = t?.closest?.('.pn-rsw-sl') as HTMLElement | null;
  if (!sl || ev.button > 0 || t?.closest('input,textarea,select')) return;
  RSW.d = { w: sl.parentNode as HTMLElement, sl, sx: ev.clientX, sy: ev.clientY, dx: 0, dir: 0, id: ev.pointerId, drag: false };
}
function rMove(ev: PointerEvent): void {
  const d = RSW.d;
  if (!d || ev.pointerId !== d.id) return;
  const mx = ev.clientX - d.sx;
  const my = ev.clientY - d.sy;
  if (!d.drag) {
    if (Math.abs(mx) > 8 && Math.abs(mx) > Math.abs(my) * 1.2) {
      // בפורט וואטסאפ/חיוג מגודרי-הרחבה — כיוון בלי פעולה לא נגרר
      if (!d.w.querySelector(mx > 0 ? '.pn-rsw-a.pn-wa' : '.pn-rsw-a.pn-call')) {
        RSW.d = null;
        return;
      }
      d.drag = true;
      d.dir = mx > 0 ? 1 : -1;
      d.w.classList.add('pn-drag');
      d.w.classList.toggle('pn-neg', d.dir < 0);
      try {
        d.sl.setPointerCapture(d.id);
      } catch {
        /* */
      }
    } else if (Math.abs(my) > 10) {
      RSW.d = null;
      return;
    } else return;
  }
  const w = d.sl.clientWidth || 1;
  const lim = Math.min(w * 0.5, 220);
  const th = Math.min(w * 0.3, 120);
  d.dx = Math.max(0, Math.min(lim, mx * d.dir));
  const r = d.dx / th;
  d.th = th;
  d.w.style.setProperty('--pn-dx', (d.dir * d.dx * (r > 1 ? 1 - (r - 1) * 0.25 : 1)).toFixed(1) + 'px');
  d.w.style.setProperty('--pn-p', Math.min(1, r).toFixed(2));
  d.w.classList.toggle('pn-go', r >= 1);
}
function rEnd(ev: PointerEvent): void {
  const d = RSW.d;
  if (!d || ev.pointerId !== d.id) return;
  RSW.d = null;
  if (!d.drag) return;
  RSW.t = performance.now();
  const w = d.w;
  w.classList.remove('pn-drag', 'pn-go');
  w.style.setProperty('--pn-dx', '0px');
  w.style.setProperty('--pn-p', '0');
  setTimeout(() => w.classList.remove('pn-neg'), 460);
  if (ev.type === 'pointerup' && d.dx >= (d.th ?? 1e9)) {
    const a = w.querySelector(d.dir < 0 ? '.pn-rsw-a.pn-call' : '.pn-rsw-a.pn-wa') as HTMLElement | null;
    vibrate();
    a?.click();
  }
}
function rClick(ev: MouseEvent): void {
  const t = ev.target as Element | null;
  if (performance.now() - RSW.t < 350 && t?.closest?.('.pn-rsw-sl')) {
    ev.preventDefault();
    ev.stopPropagation();
  }
}

/** הנחיה עדינה פעם בסשן: הבאנר הראשון של התוצאות הראשונות מציץ ימינה, עם רמז. */
export function pbNudge(box: Element | null): void {
  if (PBS.nudged || !box) return;
  let seen = false;
  try {
    seen = sessionStorage.getItem('maor_pn_nudge') === '1';
  } catch {
    /* */
  }
  if (seen) {
    PBS.nudged = true;
    return;
  }
  const art = box.querySelector('.pn-bn-list>.pn-pbn') as Art | null;
  if (!art || !art.querySelector('a.pn-bn-wa')) return;
  PBS.nudged = true;
  try {
    sessionStorage.setItem('maor_pn_nudge', '1');
  } catch {
    /* */
  }
  const fr = art.querySelector('.pn-pbn-fr');
  if (!fr) return;
  let tr = fr.querySelector('.pn-pbn-tr');
  if (!tr) {
    tr = document.createElement('span');
    tr.className = 'pn-pbn-tr';
    fr.appendChild(tr);
  }
  tr.insertAdjacentHTML(
    'beforeend',
    '<span class="pn-pbn-hint" aria-hidden="true">ימינה לוואטסאפ · שמאלה לחיוג<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h13M13 6l6 6-6 6"/></svg></span>',
  );
  art._nudge = 1;
  pbQueue();
}
function pbNudgePlay(art: Art): void {
  if (!art.isConnected) return;
  const h = art.querySelector('.pn-pbn-hint');
  setTimeout(() => h?.classList.add('pn-off'), 6000);
  if (reduced() || art.classList.contains('pn-drag')) return;
  art.style.setProperty('--pn-dx', '16%');
  art.style.setProperty('--pn-p', '.6');
  setTimeout(() => {
    if (!art.classList.contains('pn-drag')) {
      art.style.setProperty('--pn-dx', '0px');
      art.style.setProperty('--pn-p', '0');
    }
  }, 650);
}

/** רישום המאזינים הגלובליים (פעם אחת — מונה-הפניות); מחזיר ניקוי. */
export function installBannerFx(toast: (m: string) => void): () => void {
  PBS.toast = toast;
  if (PBS.refs++ === 0) {
    window.addEventListener('scroll', pbQueue, { passive: true });
    window.addEventListener('resize', pbQueue);
    document.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerup', onEnd);
    document.addEventListener('pointercancel', onEnd);
    document.addEventListener('pointerdown', rDown, { passive: true });
    document.addEventListener('pointermove', rMove, { passive: true });
    document.addEventListener('pointerup', rEnd);
    document.addEventListener('pointercancel', rEnd);
    document.addEventListener('click', rClick, true);
  }
  return () => {
    if (--PBS.refs > 0) return;
    window.removeEventListener('scroll', pbQueue);
    window.removeEventListener('resize', pbQueue);
    document.removeEventListener('pointerdown', onDown);
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onEnd);
    document.removeEventListener('pointercancel', onEnd);
    document.removeEventListener('pointerdown', rDown);
    document.removeEventListener('pointermove', rMove);
    document.removeEventListener('pointerup', rEnd);
    document.removeEventListener('pointercancel', rEnd);
    document.removeEventListener('click', rClick, true);
    if (PBS.raf) cancelAnimationFrame(PBS.raf);
    if (PBS.q) cancelAnimationFrame(PBS.q);
    PBS.raf = PBS.q = 0;
    PBS.io?.disconnect();
    PBS.io = null;
    PBS.near.clear();
    PBS.live.clear();
  };
}
