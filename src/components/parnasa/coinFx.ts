/**
 * 📒 פרנסה׳לע — התנועה של המטבעות (עיצוב 2), מועתקת מ-parnasale.html L3547–3628: נגיעה ⇒ המטבע מתרומם, מתהפך, מתעופף
 * בקשת אל חריץ-הפושקע שבפס ונופל פנימה (נקישה · נפילה), ורק אז החיפוש; לחיצה-ארוכה או F ⇒ היפוך לגב (מספר בעלי-המקצוע)
 * עם שפת-מטבע תלת-ממדית, ניצוצות וקונפטי במהדורת-פורים; אור שעוקב אחרי האצבע; הברק נח כשהרשת מחוץ למסך.
 * DOM אימפרטיבי (כמו המקור) על אלמנטים שה-React מרנדר — מחלקות-מצב בקידומת pn- שה-React לא נוגע בהן.
 * תנועה-מופחתת / שבת ⇒ בלי מעוף/ניצוצות/קונפטי (רק זוהר בפושקע).
 */
import { PN_METALS, type PnMetal } from './coins';
import { clink, plink, wakeSound } from './sound';

const reduced = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** מצב-המטבעה המשותף (CN במקור). */
export const CN = { busy: false, calm: false, period: '', confetti: false };

interface TileState {
  t?: ReturnType<typeof setTimeout>;
  lpT?: ReturnType<typeof setTimeout>;
  lp?: boolean;
  x?: number;
  y?: number;
  anim?: Animation;
}
const TS = new WeakMap<Element, TileState>();
const st = (el: Element): TileState => {
  let s = TS.get(el);
  if (!s) {
    s = {};
    TS.set(el, s);
  }
  return s;
};

/** שכבת-המעוף (‎.pn-cn-fly — בתוך שורש-המודול; fixed מעל התוכן). */
function layerOf(el: Element): HTMLElement | null {
  return (el.closest('.pn-root')?.querySelector(':scope > .pn-cn-fly') as HTMLElement | null) ?? null;
}

/** שפת-המטבע התלת-ממדית (30 מקטעים) — נבנית רק להיפוך. */
function cnRim(spin: HTMLElement, coin: HTMLElement): void {
  if (spin.querySelector('.pn-cn-seg')) return;
  const M = PN_METALS[(coin.dataset.metal as PnMetal) || 'gold'] ?? PN_METALS.gold;
  const [lo, hi] = M.seg;
  const s = coin.offsetWidth;
  const r = s / 2;
  const th = Math.max(3, s * 0.075);
  const N = 30;
  const w = (2 * Math.PI * r) / N + 0.9;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < N; i++) {
    const a = (i * 360) / N;
    const d = document.createElement('i');
    d.className = 'pn-cn-seg';
    const L = 0.5 + 0.5 * Math.cos(((a - 315) * Math.PI) / 180);
    const c = (k: number): number => Math.round(lo[k] + (hi[k] - lo[k]) * L);
    Object.assign(d.style, {
      width: w + 'px',
      height: th + 'px',
      left: (s - w) / 2 + 'px',
      top: (s - th) / 2 + 'px',
      transform: `rotateZ(${a}deg) translateY(${-r + 0.4}px) rotateX(90deg)`,
      background: `repeating-linear-gradient(90deg,rgba(40,30,20,.38) 0 .9px,rgba(255,255,255,.18) .9px 1.5px,transparent 1.5px 2.4px),linear-gradient(180deg,rgba(255,255,255,.25),rgba(0,0,0,.25)),rgb(${c(0)},${c(1)},${c(2)})`,
    });
    frag.appendChild(d);
  }
  spin.appendChild(frag);
}

function cnSparkle(coin: HTMLElement): void {
  if (reduced() || CN.calm) return;
  for (let i = 0; i < 10; i++) {
    const s = document.createElement('i');
    s.className = 'pn-cn-spark';
    const a = (i / 10) * Math.PI * 2 + Math.random() * 0.4;
    const d = coin.offsetWidth * (0.62 + Math.random() * 0.25);
    s.style.setProperty('--pn-dx', (Math.cos(a) * d).toFixed(1) + 'px');
    s.style.setProperty('--pn-dy', (Math.sin(a) * d).toFixed(1) + 'px');
    s.style.setProperty('--pn-sc', (0.7 + Math.random() * 0.8).toFixed(2));
    s.style.animationDelay = ((Math.random() * 90) | 0) + 'ms';
    coin.appendChild(s);
    setTimeout(() => s.remove(), 900);
  }
}

const CONF = ['#b41d43', '#2f56b8', '#e2b75e', '#14895a', '#f8f0e4', '#ec5878'];
/** קונפטי (מהדורת-פורים; לא בשבת, לא בבין-המצרים, לא בתנועה-מופחתת). */
export function cnConfetti(layer: HTMLElement | null, x: number, y: number): void {
  if (!layer || reduced() || CN.calm || CN.period === 'bh') return;
  for (let i = 0; i < 26; i++) {
    const c = document.createElement('i');
    c.className = 'pn-cn-conf';
    c.style.left = x + 'px';
    c.style.top = y + 'px';
    c.style.background = CONF[i % CONF.length];
    layer.appendChild(c);
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6;
    const v = 60 + Math.random() * 80;
    const dx = Math.cos(a) * v;
    const dy = Math.sin(a) * v;
    if (typeof c.animate !== 'function') {
      c.remove();
      continue;
    }
    c.animate(
      [
        { transform: 'translate(0,0) rotate(0)', opacity: 1 },
        { transform: `translate(${dx}px,${dy}px) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${dx * 1.4}px,${dy + 130}px) rotate(${Math.random() * 720}deg)`, opacity: 0 },
      ],
      { duration: 1100 + Math.random() * 400, easing: 'cubic-bezier(.2,.6,.4,1)' },
    ).onfinish = () => c.remove();
  }
}

/** היפוך לגב (המספר) וחזרה אחרי רגע — לחיצה-ארוכה / F. */
export function cnFlip(tile: HTMLElement, toBack: boolean): void {
  const coin = tile.querySelector('.pn-cn') as HTMLElement | null;
  const spin = coin?.querySelector('.pn-cn-spin') as HTMLElement | null;
  if (!coin || !spin) return;
  const s = st(tile);
  if (s.t) clearTimeout(s.t);
  tile.classList.toggle('pn-flipped', toBack);
  if (reduced() || typeof spin.animate !== 'function') {
    spin.style.transform = `rotateY(${toBack ? 180 : 0}deg)`;
  } else {
    cnRim(spin, coin);
    coin.classList.add('pn-flipping', 'pn-lifted');
    s.anim?.cancel();
    const from = toBack ? 0 : 180;
    const to = toBack ? 180 : 360;
    const a = spin.animate(
      [
        { transform: `translateZ(0) rotateY(${from}deg)` },
        { transform: `translateZ(22px) translateY(-4px) rotateY(${from + 90}deg)`, offset: 0.45 },
        { transform: `translateZ(4px) rotateY(${to + 12}deg)`, offset: 0.8 },
        { transform: `translateZ(0) rotateY(${to}deg)` },
      ],
      { duration: 820, delay: 110, easing: 'cubic-bezier(.3,.6,.25,1)', fill: 'forwards' },
    );
    s.anim = a;
    setTimeout(clink, 150);
    a.onfinish = () => {
      spin.style.transform = `rotateY(${toBack ? 180 : 0}deg)`;
      a.cancel();
      coin.classList.remove('pn-flipping', 'pn-lifted');
      spin.querySelectorAll('.pn-cn-seg').forEach((x) => x.remove());
    };
    if (toBack) {
      setTimeout(() => cnSparkle(coin), 410);
      if (CN.confetti && !tile.classList.contains('pn-sp')) {
        const r = coin.getBoundingClientRect();
        setTimeout(() => cnConfetti(layerOf(tile), r.left + r.width / 2, r.top + r.height / 2), 380);
      }
    }
  }
  if (toBack) s.t = setTimeout(() => cnFlip(tile, false), 2600);
}

/** "פגיעה" בפושקע שבפס (bump/glow) — DOM ישיר, כמו pkHit במקור. */
export function pkHit(from: Element | null, kind: 'cn-bump' | 'cn-glow'): void {
  const pk = (from?.closest('.pn-root') ?? document).querySelector('.pn-brandMark');
  if (!pk) return;
  pk.classList.remove('pn-cn-bump', 'pn-cn-glow');
  void (pk as HTMLElement).offsetWidth;
  pk.classList.add('pn-' + kind);
  setTimeout(() => pk.classList.remove('pn-' + kind), 950);
}

const T3 = (x: number, y: number, s: number): string => `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${s.toFixed(3)})`;

/** המעוף: המטבע מתרומם, מתהפך, נע בקשת אל חריץ-הפושקע ונופל פנימה (חתוך בחריץ); אחר כך — החיפוש. */
async function cnFly(tile: HTMLElement, done: () => void): Promise<void> {
  CN.busy = true;
  tile.classList.remove('pn-pressed');
  let ran = false;
  const go = (): void => {
    if (!ran) {
      ran = true;
      done();
    }
  };
  const coin = tile.querySelector('.pn-cn') as HTMLElement | null;
  const layer = layerOf(tile);
  const slot = tile.closest('.pn-root')?.querySelector('.pn-cnSlot') as Element | null;
  try {
    if (reduced() || !coin || !layer || !slot || typeof layer.animate !== 'function') {
      pkHit(tile, 'cn-glow');
      plink();
      go();
      return;
    }
    const sr = slot.getBoundingClientRect();
    // הפושקע מחוץ למסך ⇒ זוהר + נפילה + המטבע "נולד מחדש" במקומו (כמו המקור)
    if (sr.bottom < 4 || sr.top > window.innerHeight - 4) {
      pkHit(tile, 'cn-glow');
      plink();
      coin.classList.add('pn-respawn');
      setTimeout(() => coin.classList.remove('pn-respawn'), 520);
      go();
      return;
    }
    const r = coin.getBoundingClientRect();
    const cl = coin.cloneNode(true) as HTMLElement;
    cl.classList.remove('pn-lifted', 'pn-flipping', 'pn-respawn');
    Object.assign(cl.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', transform: 'none' });
    cl.style.setProperty('--pn-s', r.width + 'px');
    layer.appendChild(cl);
    coin.classList.add('pn-cn-ghost');
    const S0 = r.width;
    const es = Math.max(0.12, (sr.width * 0.74) / S0);
    const slotMid = sr.top + sr.height / 2;
    const ex = sr.left + sr.width / 2 - (r.left + S0 / 2);
    const ey = slotMid - (S0 * es) / 2 - 1 - (r.top + S0 / 2);
    const cx = ex * 0.35 + (ex > 0 ? -30 : 30);
    const cy = Math.min(0, ey) - 70;
    const frames: Keyframe[] = [{ transform: T3(0, 0, 1) }, { transform: T3(0, -12, 1.08), offset: 0.12 }];
    for (let i = 1; i <= 16; i++) {
      const t = i / 16;
      const u = 1 - t;
      const x = 2 * u * t * cx + t * t * ex;
      const y = u * u * -12 + 2 * u * t * cy + t * t * ey;
      const s = 1.08 + (es - 1.08) * (t * t * (3 - 2 * t));
      frames.push({ transform: T3(x, y, s), offset: 0.12 + 0.88 * t });
    }
    const spin = cl.querySelector('.pn-cn-spin') as HTMLElement;
    spin.style.transform = '';
    cnRim(spin, cl);
    const sp = spin.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(360deg)' }], { duration: 380, delay: 120, easing: 'cubic-bezier(.4,0,.3,1)' });
    setTimeout(clink, 130);
    if (CN.confetti && !tile.classList.contains('pn-sp')) {
      setTimeout(() => {
        const b = cl.getBoundingClientRect();
        cnConfetti(layer, b.left + b.width / 2, b.top + b.height / 2);
      }, 260);
    }
    const a = cl.animate(frames, { duration: 560, easing: 'cubic-bezier(.4,.1,.35,1)', fill: 'forwards' });
    await a.finished;
    sp.cancel();
    spin.querySelectorAll('.pn-cn-seg').forEach((x) => x.remove());
    const clip = document.createElement('div');
    clip.className = 'pn-cn-clip';
    const cL = sr.left - 6;
    const cT = slotMid - 80;
    Object.assign(clip.style, { left: cL + 'px', top: cT + 'px', width: sr.width + 12 + 'px', height: '80px' });
    layer.appendChild(clip);
    Object.assign(cl.style, { left: r.left - cL + 'px', top: r.top - cT + 'px', transform: T3(ex, ey, es) });
    a.cancel();
    clip.appendChild(cl);
    const d = cl.animate([{ transform: T3(ex, ey, es) }, { transform: T3(ex, ey + S0 * es + 3, es) }], { duration: 170, easing: 'cubic-bezier(.55,0,.85,.5)', fill: 'forwards' });
    await d.finished;
    plink();
    pkHit(tile, 'cn-bump');
    clip.remove();
    go();
    coin.classList.remove('pn-cn-ghost');
    coin.classList.add('pn-respawn');
    setTimeout(() => coin.classList.remove('pn-respawn'), 520);
  } catch {
    layer?.querySelectorAll('.pn-cn,.pn-cn-clip').forEach((x) => x.remove());
    coin?.classList.remove('pn-cn-ghost');
    go();
  } finally {
    CN.busy = false;
  }
}

/**
 * "נמצא!" (foundCoins במקור): מטבעות-זהב (עד 5 — אחד לכל עסק שעזר) עפים בקשת מהכפתור אל חריץ-הפושקע, ובכל נחיתה —
 * נקישה והפושקע מקפץ; קונפטי מהכפתור. התנועה מחושבת מהמיקום שנמדד **לפני** שהבקשה נסגרה (הכפתור נעלם אחרי).
 * תנועה-מופחתת / שבת / בלי חריץ ⇒ רק זוהר בפושקע.
 */
export function foundCoins(from: DOMRect, root: Element | null, k: number): void {
  const slot = root?.querySelector('.pn-cnSlot');
  const layer = (root?.querySelector(':scope > .pn-cn-fly') as HTMLElement | null) ?? null;
  if (!slot || !layer || reduced() || CN.calm || typeof layer.animate !== 'function') {
    pkHit(root, 'cn-glow');
    return;
  }
  const to = slot.getBoundingClientRect();
  for (let i = 0; i < Math.min(Math.max(1, k), 5); i++)
    setTimeout(() => {
      const c = document.createElement('i');
      c.className = 'pn-pk-coin pn-big';
      const x0 = from.left + from.width / 2 - 14;
      const y0 = from.top;
      Object.assign(c.style, { left: x0 + 'px', top: y0 + 'px' });
      layer.appendChild(c);
      const dx = to.left + to.width / 2 - 14 - x0;
      const dy = to.top - y0 - 10;
      const cx = dx * 0.3 + (i % 2 ? -60 : 60);
      const cy = Math.min(dy, 0) - 80;
      const fr: Keyframe[] = [];
      for (let j = 0; j <= 14; j++) {
        const t = j / 14;
        const u = 1 - t;
        fr.push({ transform: `translate(${(2 * u * t * cx + t * t * dx).toFixed(1)}px,${(2 * u * t * cy + t * t * dy).toFixed(1)}px) rotateY(${t * 720}deg) scale(${(1.2 - 0.7 * t).toFixed(2)})`, offset: t });
      }
      const a = c.animate(fr, { duration: 1100, easing: 'cubic-bezier(.4,0,.3,1)' });
      a.onfinish = () => {
        c.remove();
        pkHit(root, 'cn-bump');
        clink();
      };
    }, i * 180);
  setTimeout(() => cnConfetti(layer, from.left + from.width / 2, from.top), 120);
}

/** נגיעה במטבע: אחרי לחיצה-ארוכה — כלום; הפוך — חוזר; אחרת — מעוף ואז run. */
export function coinTap(tile: HTMLElement, run: () => void): void {
  const s = st(tile);
  if (s.lp) {
    s.lp = false;
    return;
  }
  if (tile.classList.contains('pn-flipped')) {
    cnFlip(tile, false);
    return;
  }
  if (CN.busy) return;
  wakeSound();
  void cnFly(tile, run);
}

/** מטבעות "נטבעים" בעלייה הראשונה (נכנסים בזה אחר זה). */
export function cnMint(box: HTMLElement): void {
  const tiles = box.querySelectorAll('.pn-ct');
  tiles.forEach((b) => b.classList.add('pn-enter'));
  setTimeout(() => box.querySelectorAll('.pn-ct.pn-enter').forEach((b) => b.classList.remove('pn-enter')), 1400);
}

/** שלטי-הפליז: שם ארוך מתכווץ עד שנכנס (לא מתחת ל-10px; אחר כך שלוש-נקודות). */
export function cnFit(box: HTMLElement | null): void {
  if (!box) return;
  box.querySelectorAll<HTMLElement>('.pn-ct .pn-cn-lbl .pn-nm').forEach((n) => {
    n.style.fontSize = '';
    let f = parseFloat(getComputedStyle(n).fontSize) || 13.5;
    while (n.scrollWidth > n.clientWidth + 0.5 && f > 10) {
      f -= 0.5;
      n.style.fontSize = f + 'px';
    }
  });
}

/**
 * חיווט-הרשת: לחיצה-ארוכה (500ms) ⇒ היפוך; מצב-לחיצה; אור שעוקב אחרי האצבע (‎--pn-lx/ly/a/hot/rx/ry);
 * F / כ ⇒ היפוך; הברק נח כשהרשת מחוץ למסך או שהדף מוסתר. מחזיר ניקוי.
 */
export function wireCoinGrid(box: HTMLElement): () => void {
  let px: number | null = null;
  let py: number | null = null;
  let raf = 0;
  const paint = (): void => {
    raf = 0;
    box.querySelectorAll<HTMLElement>('.pn-ct .pn-cn').forEach((c) => {
      const r = c.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      let lx = 32;
      let ly = 24;
      let a = 20;
      let rx = 0;
      let ry = 0;
      let hot = 0;
      if (px != null && py != null) {
        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.hypot(dx, dy) || 1;
        const f = Math.max(0, 1 - dist / 260);
        const k = Math.min(1, dist / (r.width * 1.4));
        lx = 50 + (dx / dist) * 34 * k;
        ly = 50 + (dy / dist) * 34 * k;
        a = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        hot = 0.35 + 0.65 * f;
        if (!reduced()) {
          rx = (dy / dist) * 14 * f;
          ry = (-dx / dist) * 14 * f;
        }
      }
      const s = c.style;
      s.setProperty('--pn-lx', lx.toFixed(1) + '%');
      s.setProperty('--pn-ly', ly.toFixed(1) + '%');
      s.setProperty('--pn-a', a.toFixed(0) + 'deg');
      s.setProperty('--pn-hot', hot.toFixed(2));
      s.setProperty('--pn-rx', rx.toFixed(1) + 'deg');
      s.setProperty('--pn-ry', ry.toFixed(1) + 'deg');
    });
  };
  const track = (e: PointerEvent): void => {
    if (e.pointerType !== 'mouse' && e.type === 'pointermove' && e.pressure === 0) return;
    px = e.clientX;
    py = e.clientY;
    if (!raf) raf = requestAnimationFrame(paint);
  };
  const release = (): void => {
    px = py = null;
    if (!raf) raf = requestAnimationFrame(paint);
  };
  const cancel = (b: Element | null): void => {
    if (!b) return;
    const s = st(b);
    if (s.lpT) clearTimeout(s.lpT);
    b.classList.remove('pn-pressed');
  };
  const tileOf = (t: EventTarget | null, all = false): HTMLElement | null => (t instanceof Element ? (t.closest(all ? '.pn-ct' : '.pn-ct:not(.pn-ph)') as HTMLElement | null) : null);
  const onDown = (e: PointerEvent): void => {
    track(e);
    const b = tileOf(e.target);
    if (!b || e.button > 0) return;
    wakeSound();
    b.classList.add('pn-pressed');
    const s = st(b);
    s.lp = false;
    s.x = e.clientX;
    s.y = e.clientY;
    if (s.lpT) clearTimeout(s.lpT);
    if (b.classList.contains('pn-flipped') || CN.busy) return;
    s.lpT = setTimeout(() => {
      s.lp = true;
      b.classList.remove('pn-pressed');
      cnFlip(b, true);
    }, 500);
  };
  const onMove = (e: PointerEvent): void => {
    track(e);
    const b = tileOf(e.target, true);
    const s = b ? st(b) : null;
    if (s && s.x != null && s.y != null && Math.hypot(e.clientX - s.x, e.clientY - s.y) > 10 && s.lpT) clearTimeout(s.lpT);
  };
  const onUp = (e: PointerEvent): void => {
    cancel(tileOf(e.target, true));
    if (e.pointerType !== 'mouse') release();
  };
  const onCancel = (e: PointerEvent): void => {
    cancel(tileOf(e.target, true));
    release();
  };
  const onOut = (e: PointerEvent): void => {
    const b = tileOf(e.target, true);
    if (b && !b.contains(e.relatedTarget as Node | null)) cancel(b);
    if (!box.contains(e.relatedTarget as Node | null)) release();
  };
  const onCtx = (e: Event): void => {
    if (tileOf(e.target, true)) e.preventDefault();
  };
  const onKey = (e: KeyboardEvent): void => {
    const b = tileOf(e.target);
    if (!b) return;
    wakeSound();
    if (e.code === 'KeyF' || e.key === 'f' || e.key === 'F' || e.key === 'כ') {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      e.preventDefault();
      cnFlip(b, !b.classList.contains('pn-flipped'));
    }
  };
  let vis = true;
  const pause = (): void => {
    box.classList.toggle('pn-cn-paused', document.hidden || !vis);
  };
  let io: IntersectionObserver | null = null;
  try {
    io = new IntersectionObserver((es) => {
      for (const x of es) vis = x.isIntersecting;
      pause();
    });
    io.observe(box);
  } catch {
    io = null;
  }
  box.addEventListener('pointerdown', onDown);
  box.addEventListener('pointermove', onMove);
  box.addEventListener('pointerup', onUp);
  box.addEventListener('pointercancel', onCancel);
  box.addEventListener('pointerout', onOut);
  box.addEventListener('contextmenu', onCtx);
  box.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', pause);
  const onResize = (): void => {
    clearTimeout(fitT);
    fitT = setTimeout(() => cnFit(box), 150);
  };
  let fitT: ReturnType<typeof setTimeout> | undefined;
  window.addEventListener('resize', onResize);
  return () => {
    io?.disconnect();
    box.removeEventListener('pointerdown', onDown);
    box.removeEventListener('pointermove', onMove);
    box.removeEventListener('pointerup', onUp);
    box.removeEventListener('pointercancel', onCancel);
    box.removeEventListener('pointerout', onOut);
    box.removeEventListener('contextmenu', onCtx);
    box.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', pause);
    window.removeEventListener('resize', onResize);
    if (fitT) clearTimeout(fitT);
    if (raf) cancelAnimationFrame(raf);
  };
}
