/**
 * 📒 פרנסה׳לע — הגיליון של דף-העסק (עיצוב 3): קפיץ-עלייה/ירידה (animSheet של המקור), גרירה מהכריכה או מהידית
 * למטה (סגירה), החלקה הצידה (חזרה), כותרת-מיני כשגוללים, מלכודת-מיקוד (Tab) והחזרת-המיקוד בסגירה. DOM
 * אימפרטיבי כמו המקור — מצבי-הקלאסים (pn-on / pn-scrolled) אינם בבעלות React; נעילת-גלילת-הדף =
 * html.pn-scroll-lock. תנועה-מופחתת ⇒ בלי קפיץ.
 */

export interface SheetCtl {
  /** סגירה מונפשת (v = מהירות-הגרירה; dir = ±1 החלקה הצידה); בסוף — onClosed. */
  close(v?: number, dir?: number): void;
  /** הגיליון נפתח מחדש לעסק אחר: גלילה לראש. */
  reset(): void;
  destroy(): void;
}

const FOCUSABLE = 'a[href],button:not([disabled]),input,textarea,select,summary';

/** מלכודת-המיקוד של המקור (trap): Tab/Shift+Tab מסתובבים בתוך התיבה. */
export function trapTab(box: HTMLElement, e: KeyboardEvent): void {
  const f = [...box.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((x) => x.offsetParent || x.getClientRects().length);
  if (!f.length) return;
  const a = f[0];
  const z = f[f.length - 1];
  if (e.shiftKey && document.activeElement === a) {
    e.preventDefault();
    z.focus();
  } else if (!e.shiftKey && document.activeElement === z) {
    e.preventDefault();
    a.focus();
  }
}

export function mountSheet(o: { sheet: HTMLElement; scrim: HTMLElement; body: HTMLElement; grab: HTMLElement; reduced: () => boolean; onClosed: () => void }): SheetCtl {
  const { sheet, scrim, body } = o;
  const SP = { y: 0, v: 0, to: 0, run: 0 };
  let SH = 800;
  let closing = false;
  const lastFocus = document.activeElement as HTMLElement | null;
  const root = document.documentElement;

  const setY = (y: number): void => {
    sheet.style.transform = 'translateY(' + y + 'px)';
    scrim.style.opacity = String(Math.max(0, Math.min(1, 1 - y / SH)));
  };
  const anim = (to: number, cb?: () => void): void => {
    SP.to = to;
    cancelAnimationFrame(SP.run);
    if (o.reduced()) {
      SP.y = to;
      SP.v = 0;
      setY(to);
      cb?.();
      return;
    }
    let last = performance.now();
    const K = to > 0 ? 260 : 380;
    const C = to > 0 ? 32 : 30;
    const f = (t: number): void => {
      const dt = Math.min(0.032, (t - last) / 1000);
      last = t;
      for (let s = 0; s < 4; s++) {
        const a = -K * (SP.y - SP.to) - C * SP.v;
        SP.v += (a * dt) / 4;
        SP.y += (SP.v * dt) / 4;
      }
      setY(SP.y);
      // יורד לסגירה: ברגע שהגיליון כולו מתחת לחלון — סוף (הזנב של הקפיץ ממילא בלתי-נראה)
      if ((to > SH && SP.y >= SH) || (Math.abs(SP.y - SP.to) < 0.5 && Math.abs(SP.v) < 5)) {
        SP.y = to;
        setY(to);
        cb?.();
      } else SP.run = requestAnimationFrame(f);
    };
    f(last);
  };

  // כותרת-המיני: מופיעה כשהכריכה נגללת מעלה
  const onScroll = (): void => {
    const t = body.querySelector('.pn-bptop');
    const c = body.querySelector('.pn-bpc') as HTMLElement | null;
    if (t && c) {
      const on = body.scrollTop > c.offsetHeight - 64;
      t.classList.toggle('pn-on', on);
      sheet.classList.toggle('pn-scrolled', on);
    }
  };
  body.addEventListener('scroll', onScroll, { passive: true });

  // פתיחה
  root.classList.add('pn-scroll-lock');
  sheet.style.transition = '';
  sheet.classList.add('pn-on');
  scrim.classList.add('pn-on');
  SH = sheet.offsetHeight || 800;
  SP.y = SH;
  SP.v = 0;
  setY(SH);
  anim(0);
  const focusT = window.setTimeout(() => {
    try {
      ((sheet.querySelector('.pn-bpwa') ?? sheet.querySelector('[data-act="close"]')) as HTMLElement | null)?.focus({ preventScroll: true });
    } catch {
      /* */
    }
  }, 60);

  const fin = (): void => {
    sheet.classList.remove('pn-on');
    sheet.style.transition = '';
    o.onClosed();
  };
  const close = (v?: number, dir?: number): void => {
    if (closing) return;
    closing = true;
    root.classList.remove('pn-scroll-lock');
    scrim.classList.remove('pn-on');
    if (dir) {
      if (o.reduced()) {
        setY(SH);
        fin();
      } else {
        sheet.style.transition = 'transform .3s var(--pn-ease)';
        sheet.style.transform = 'translateX(' + dir * innerWidth + 'px)';
        scrim.style.opacity = '0';
        window.setTimeout(fin, 300);
      }
    } else {
      SP.v = v || SP.v;
      anim(SH + 40, fin);
    }
    if (lastFocus && document.contains(lastFocus))
      try {
        lastFocus.focus({ preventScroll: true });
      } catch {
        /* */
      }
  };

  // גרירה: מטה מהכריכה/הידית ⇒ סגירה; הצידה ⇒ חזרה (רק כשהגוף בראשו)
  let drag = 0;
  let y0 = 0;
  let x0 = 0;
  let t0 = 0;
  let lastY = 0;
  let vel = 0;
  let dx = 0;
  const down = (e: PointerEvent): void => {
    const t = e.target as Element | null;
    if (!t || closing) return;
    if (t.closest('a,input,textarea') || (t.closest('button') && !t.closest('.pn-grab'))) return;
    if (!t.closest('.pn-grab,.pn-bpc')) return;
    if (body.scrollTop > 2) return;
    drag = 1;
    y0 = e.clientY;
    x0 = e.clientX;
    lastY = y0;
    t0 = performance.now();
    vel = 0;
    dx = 0;
    cancelAnimationFrame(SP.run);
    try {
      sheet.setPointerCapture(e.pointerId);
    } catch {
      /* */
    }
  };
  const move = (e: PointerEvent): void => {
    if (!drag) return;
    const now = performance.now();
    const dy = e.clientY - y0;
    dx = e.clientX - x0;
    if (drag === 1 && Math.abs(dx) > 16 && Math.abs(dx) > Math.abs(dy) * 1.3) drag = 2;
    if (drag === 2) {
      sheet.style.transform = 'translateX(' + dx + 'px)';
      scrim.style.opacity = String(Math.max(0, 1 - Math.abs(dx) / innerWidth));
      return;
    }
    vel = ((e.clientY - lastY) / Math.max(1, now - t0)) * 1000;
    lastY = e.clientY;
    t0 = now;
    SP.y = dy > 0 ? dy : dy * 0.2;
    setY(SP.y);
  };
  const up = (): void => {
    if (!drag) return;
    const d = drag;
    drag = 0;
    if (d === 2) {
      if (Math.abs(dx) > 90) close(0, Math.sign(dx));
      else {
        sheet.style.transition = 'transform .45s var(--pn-spring)';
        setY(0);
        window.setTimeout(() => {
          sheet.style.transition = '';
        }, 460);
      }
      return;
    }
    SP.v = vel;
    if (SP.y > SH * 0.22 || vel > 900) close(vel);
    else anim(0);
  };
  const onGrab = (): void => {
    if (Math.abs(SP.y) < 4) close();
  };
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Tab') trapTab(sheet, e);
  };
  sheet.addEventListener('pointerdown', down);
  sheet.addEventListener('pointermove', move);
  sheet.addEventListener('pointerup', up);
  sheet.addEventListener('pointercancel', up);
  sheet.addEventListener('keydown', onKey);
  o.grab.addEventListener('click', onGrab);
  o.scrim.addEventListener('click', onScrim);
  function onScrim(): void {
    close();
  }

  return {
    close,
    reset() {
      body.scrollTop = 0;
      onScroll();
    },
    destroy() {
      window.clearTimeout(focusT);
      cancelAnimationFrame(SP.run);
      body.removeEventListener('scroll', onScroll);
      sheet.removeEventListener('pointerdown', down);
      sheet.removeEventListener('pointermove', move);
      sheet.removeEventListener('pointerup', up);
      sheet.removeEventListener('pointercancel', up);
      sheet.removeEventListener('keydown', onKey);
      o.grab.removeEventListener('click', onGrab);
      o.scrim.removeEventListener('click', onScrim);
      root.classList.remove('pn-scroll-lock');
    },
  };
}
