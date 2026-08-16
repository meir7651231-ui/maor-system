/**
 * האתר-הציבורי (dashboard-נחיתה) — **מוזן ישירות מהקונפיג של הארגון**.
 * ציבורי לגמרי: מוצג ב-App לפני שער-הענן/ההתחברות (המבקר לא צריך חשבון).
 * קורא רק את config (מיתוג + config.site) ואופציונלית את מונה-המשפחות המקומי
 * (מספר בלבד, בלי PII). מגודר shell.publicsite + ‎?site‎ בכתובת.
 *
 * עיצוב "אור" (editorial): hero במסך-מלא עם קנבס חלקיקי-אור + הילה זוהרת + ברק-
 * זהב בכותרת, חשיפה-בגלילה (IntersectionObserver), כרטיסים מוגבהים. רב-לשוני
 * (עברית/אנגלית/אידיש), ערכת-נושא-מודע (יורש --accent), ומכבד prefers-reduced-motion
 * (בלי קנבס/ספירה/חשיפה כשמבקשים פחות-תנועה — נופל לתצוגה סטטית מלאה).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../store/useApp';
import {
  campaignProgress,
  isRtlLang,
  resolveLocalized,
  siteDonateUrl,
  siteLangs,
  siteUi,
} from '../../lib/publicSite';
import type { LocalizedText, SiteLang } from '../../types/config';
import './public-site.css';

const LANG_LABEL: Record<SiteLang, string> = { he: 'עברית', en: 'English', yi: 'אידיש' };
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** קישור wa.me מטלפון שמור (0-מוביל ⇒ 972); ריק ⇒ null. */
function waHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  const intl = digits.startsWith('0') ? '972' + digits.slice(1) : digits;
  return `https://wa.me/${intl}`;
}

/** מונה עולה מ-0 ליעד; מכבד reduced-motion (קפיצה מיידית). מתחיל כשגלוי (active). */
function useCountUp(target: number, active: boolean): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (prefersReducedMotion()) {
      setVal(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 1300;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, active]);
  return val;
}

/** מפריד ערך-סטטיסטיקה למספר-מוביל (לספירה) ולשארית (יחידה/סיומת). */
function splitStat(value: string): { num: number | null; prefix: string; suffix: string } {
  const m = value.match(/^(\D*)([\d,]+)(.*)$/);
  if (!m) return { num: null, prefix: '', suffix: value };
  const num = parseInt(m[2].replace(/,/g, ''), 10);
  return Number.isFinite(num) ? { num, prefix: m[1], suffix: m[3] } : { num: null, prefix: '', suffix: value };
}

/** כרטיס-סטטיסטיקה — ספירה מתחילה כשהכרטיס נכנס לצג (IntersectionObserver). */
function StatCard({ value, label, delay }: { value: string; label: string; delay: number }) {
  const { num, prefix, suffix } = useMemo(() => splitStat(value), [value]);
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && (setSeen(true), io.disconnect())),
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const shown = useCountUp(num ?? 0, seen && num !== null);
  return (
    <div className="psite-stat psite-reveal" ref={ref} style={{ transitionDelay: `${delay}ms` }}>
      <div className="psite-stat-num">
        {num !== null ? prefix + shown.toLocaleString('he-IL') + suffix : value}
      </div>
      <div className="psite-stat-label">{label}</div>
    </div>
  );
}

/** קנבס חלקיקי-אור מרחפים מאחורי ה-hero — מדולג ב-reduced-motion. */
function useLightCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>, accent: string) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion()) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = 0;
    let h = 0;
    let raf = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    type Mote = { x: number; y: number; r: number; vy: number; vx: number; a: number; tw: number };
    let motes: Mote[] = [];
    const rnd = (min: number, max: number) => min + Math.random() * (max - min);
    const seed = () => {
      const n = Math.round(Math.min(64, (w * h) / 22000));
      motes = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: rnd(0.6, 2.6),
        vy: rnd(-0.28, -0.05),
        vx: rnd(-0.12, 0.12),
        a: rnd(0.12, 0.6),
        tw: rnd(0.005, 0.02),
      }));
    };
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };
    let phase = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      phase += 0.02;
      for (const m of motes) {
        m.y += m.vy;
        m.x += m.vx + Math.sin(phase + m.y * 0.01) * 0.15;
        if (m.y < -6) {
          m.y = h + 6;
          m.x = Math.random() * w;
        }
        if (m.x < -6) m.x = w + 6;
        if (m.x > w + 6) m.x = -6;
        const alpha = m.a * (0.6 + 0.4 * Math.sin(phase * 8 * m.tw * 40));
        const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 4);
        g.addColorStop(0, accent.replace('ALPHA', String(Math.max(0, Math.min(1, alpha)))));
        g.addColorStop(1, accent.replace('ALPHA', '0'));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    resize();
    draw();
    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(draw);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [canvasRef, accent]);
}

export function PublicSite({ onEnter }: { onEnter: () => void }) {
  const config = useApp((s) => s.config);
  const liveFamilies = useApp((s) => s.db.families.length);
  const site = config.site ?? {};
  const langs = useMemo(() => siteLangs(config.site), [config.site]);
  const [lang, setLang] = useState<SiteLang>(langs[0]);
  const rtl = isRtlLang(lang);
  const t = (v: LocalizedText | undefined) => resolveLocalized(v, lang);
  const ui = (k: string) => siteUi(lang, k);

  const orgName = config.orgName || 'מאור';
  const donate = siteDonateUrl(config);
  const words = (site.heroWords ?? []).map((w) => t(w)).filter(Boolean);
  const [wordIdx, setWordIdx] = useState(0);
  useEffect(() => {
    if (words.length < 2 || prefersReducedMotion()) return;
    const id = window.setInterval(() => setWordIdx((i) => (i + 1) % words.length), 2800);
    return () => window.clearInterval(id);
  }, [words.length]);

  // צבע-הדגשה מהערכה — לגוון את חלקיקי-האור (rgba עם ALPHA להחלפה בריצה).
  const accentRgba = useMemo(() => {
    try {
      const raw = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#c98a2b';
      const el = document.createElement('span');
      el.style.color = raw;
      document.body.appendChild(el);
      const rgb = getComputedStyle(el).color; // "rgb(r, g, b)"
      document.body.removeChild(el);
      const m = rgb.match(/(\d+),\s*(\d+),\s*(\d+)/);
      const [r, g, b] = m ? [m[1], m[2], m[3]] : ['201', '138', '43'];
      // מבהיר מעט לכיוון-אור (מיזוג עם לבן) כדי שהמוטות ייראו כניצוצות
      const lift = (c: string) => Math.round(Math.min(255, +c * 0.55 + 255 * 0.45));
      return `rgba(${lift(r)}, ${lift(g)}, ${lift(b)}, ALPHA)`;
    } catch {
      return 'rgba(247, 223, 160, ALPHA)';
    }
  }, [config.accent, config.theme]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useLightCanvas(canvasRef, accentRgba);

  // חשיפה-בגלילה — כל .psite-reveal מקבל .in כשנכנס לצג (reduced-motion ⇒ מיד).
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll('.psite-reveal'));
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      els.forEach((e) => e.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('in');
            io.unobserve(en.target);
          }
        }),
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [lang]);

  const camp = useMemo(() => campaignProgress(site.campaign, Date.now()), [site.campaign]);
  const stats = site.stats ?? [];
  const liveStat =
    site.liveFamilies && liveFamilies > 0
      ? { value: String(liveFamilies), label: t(site.liveFamiliesLabel) || (rtl ? 'משפחות בקהילה' : 'families') }
      : null;
  const phones = site.contact?.phones ?? [];
  const wa = site.contact?.whatsapp ? waHref(site.contact.whatsapp) : null;
  const email = site.contact?.email;
  const address = t(site.contact?.address);
  const services = site.services ?? [];
  const gallery = site.gallery ?? [];
  const story = t(site.story);
  const news = t(site.news);
  const tagline = t(site.tagline);
  const allStats = [...(liveStat ? [liveStat] : []), ...stats];

  return (
    <div className="psite" dir={rtl ? 'rtl' : 'ltr'} lang={lang} ref={rootRef}>
      {/* ── סרגל-על ── */}
      <header className="psite-bar">
        <div className="psite-brand">
          {config.logoDataUri ? (
            <img src={config.logoDataUri} alt="" className="psite-logo" />
          ) : config.emoji ? (
            <span className="psite-emoji" aria-hidden>{config.emoji}</span>
          ) : null}
          <span className="psite-org">{orgName}</span>
        </div>
        <div className="psite-bar-tools">
          {langs.length > 1 && (
            <div className="psite-langs" role="group" aria-label="שפה">
              {langs.map((l) => (
                <button
                  key={l}
                  type="button"
                  className={'psite-lang' + (l === lang ? ' on' : '')}
                  onClick={() => setLang(l)}
                  aria-pressed={l === lang}
                >
                  {LANG_LABEL[l]}
                </button>
              ))}
            </div>
          )}
          <button type="button" className="psite-enter" onClick={onEnter}>
            {ui('enter')}
          </button>
          {donate && (
            <a className="psite-cta sm" href={donate} target="_blank" rel="noopener noreferrer">
              💛 {ui('donate')}
            </a>
          )}
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="psite-hero">
        <canvas className="psite-canvas" ref={canvasRef} aria-hidden />
        <div className="psite-aurora" aria-hidden />
        <div className="psite-hero-inner">
          {(site.icon || config.emoji || config.logoDataUri) && (
            <div className="psite-halo" aria-hidden>
              <span className="psite-halo-ring" />
              {config.logoDataUri && !site.icon ? (
                <img src={config.logoDataUri} alt="" />
              ) : (
                <span className="psite-halo-emoji">{site.icon || config.emoji}</span>
              )}
            </div>
          )}
          <h1 className="psite-hero-title">{orgName}</h1>
          {words.length > 0 && (
            <div className="psite-hero-word-wrap" aria-live="off">
              <span key={wordIdx} className="psite-hero-word">{words[wordIdx % words.length]}</span>
            </div>
          )}
          {tagline && <p className="psite-hero-tagline">{tagline}</p>}
          <div className="psite-hero-cta">
            {donate && (
              <a className="psite-cta lg" href={donate} target="_blank" rel="noopener noreferrer">
                💛 {ui('donate')}
              </a>
            )}
            <a className="psite-cta ghost lg" href="#psite-contact">{ui('contact')}</a>
          </div>
        </div>
        <a className="psite-scroll" href="#psite-body" aria-label="גלול למטה"><span /></a>
      </section>

      <div id="psite-body">
        {/* ── מוני-השפעה ── */}
        {allStats.length > 0 && (
          <section className="psite-stats">
            {allStats.map((s, i) => (
              <StatCard key={i} value={s.value} label={t(s.label)} delay={i * 90} />
            ))}
          </section>
        )}

        {/* ── קמפיין ── */}
        {camp.show && (
          <section className="psite-campaign">
            <div className="psite-campaign-card psite-reveal">
              {t(site.campaign?.title) && <h2 className="psite-h2">{t(site.campaign?.title)}</h2>}
              <div className="psite-bar-track" role="img" aria-label={`${camp.pct}%`}>
                <div className="psite-bar-fill" style={{ width: camp.pct + '%' }}><i /></div>
              </div>
              <div className="psite-campaign-row">
                <span><b>{camp.currency}{camp.raised.toLocaleString('he-IL')}</b> {ui('raised')}</span>
                <span className="psite-campaign-goal">{ui('goal')}: {camp.currency}{camp.goal.toLocaleString('he-IL')}</span>
              </div>
              {camp.daysLeft !== null && (
                <div className="psite-countdown">⏳ {camp.daysLeft} {ui('daysLeft')}</div>
              )}
              {donate && (
                <a className="psite-cta" href={donate} target="_blank" rel="noopener noreferrer">💛 {ui('donate')}</a>
              )}
            </div>
          </section>
        )}

        {/* ── שירותים ── */}
        {services.length > 0 && (
          <section className="psite-section">
            <h2 className="psite-h2 center psite-reveal">{ui('services')}</h2>
            <div className="psite-services">
              {services.map((s, i) => (
                <div className="psite-service psite-reveal" key={i} style={{ transitionDelay: `${(i % 3) * 80}ms` }}>
                  {s.icon && <div className="psite-service-ico" aria-hidden>{s.icon}</div>}
                  <h3 className="psite-service-title">{t(s.title)}</h3>
                  {t(s.text) && <p className="psite-service-text">{t(s.text)}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── סיפור ── */}
        {story && (
          <section className="psite-section psite-story psite-reveal">
            <div className="psite-quote" aria-hidden>״</div>
            <h2 className="psite-h2 center">{ui('story')}</h2>
            <p className="psite-story-text">{story}</p>
          </section>
        )}

        {/* ── מה חדש ── */}
        {news && (
          <section className="psite-section">
            <div className="psite-news psite-reveal">
              <span className="psite-news-badge">{ui('news')}</span>
              <p>{news}</p>
            </div>
          </section>
        )}

        {/* ── גלריה ── */}
        {gallery.length > 0 && (
          <section className="psite-section">
            <h2 className="psite-h2 center psite-reveal">{ui('gallery')}</h2>
            <div className="psite-gallery">
              {gallery.map((src, i) => (
                <div className="psite-gwrap psite-reveal" key={i} style={{ transitionDelay: `${(i % 4) * 70}ms` }}>
                  <img src={src} alt="" loading="lazy" className="psite-gimg" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── קשר ── */}
        <section className="psite-section psite-contact" id="psite-contact">
          <h2 className="psite-h2 center psite-reveal">{ui('contact')}</h2>
          <div className="psite-contact-grid psite-reveal">
            {phones.map((p, i) => (
              <a className="psite-contact-item" key={'p' + i} href={'tel:' + p.replace(/\s/g, '')}>
                <span aria-hidden>📞</span>{p}
              </a>
            ))}
            {wa && (
              <a className="psite-contact-item" href={wa} target="_blank" rel="noopener noreferrer">
                <span aria-hidden>💬</span>{ui('whatsapp')}
              </a>
            )}
            {email && (
              <a className="psite-contact-item" href={'mailto:' + email}>
                <span aria-hidden>✉️</span>{email}
              </a>
            )}
            {address && (
              <div className="psite-contact-item">
                <span aria-hidden>📍</span>{address}
              </div>
            )}
          </div>
          {donate && (
            <div className="psite-contact-cta psite-reveal">
              <a className="psite-cta lg" href={donate} target="_blank" rel="noopener noreferrer">💛 {ui('donate')}</a>
            </div>
          )}
        </section>

        <footer className="psite-foot">
          <span>{orgName}{config.orgTaxId ? ` · ${config.orgTaxId}` : ''}</span>
          <span className="psite-foot-by">{ui('poweredBy')}</span>
        </footer>
      </div>
    </div>
  );
}
