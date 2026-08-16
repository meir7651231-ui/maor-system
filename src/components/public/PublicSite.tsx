/**
 * האתר-הציבורי (דף-תרומות) — **מוזן ישירות מהקונפיג של הארגון**.
 * ציבורי לגמרי: מוצג ב-App לפני שער-הענן/ההתחברות (המבקר לא צריך חשבון).
 * מגודר shell.publicsite + ‎?site‎.
 *
 * שחזור High-Fidelity של design_handoff (Chesed Landing) — סגנונות inline מדויקים
 * מקובץ-המקור, לוגיקה מפורטת ל-React (קנבס-חלקיקים+לבבות · זוהר-עכבר · פס-גלילה ·
 * טיקר-תרומות · מילה-מתחלפת · count-up · סליידר-מחשבון · בוחר-תרומה). מוזן מ-config.site,
 * מכבד prefers-reduced-motion. כל טקסט/מספר מגיע מהקונפיג — אין תוכן קשיח.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useApp } from '../../store/useApp';
import { campaignProgress, isRtlLang, resolveLocalized, siteDonateUrl, siteLangs, sitePalette, siteUi, siteVocab } from '../../lib/publicSite';
import { featureOn } from '../../lib/config';
import type { LocalizedText, SiteLang } from '../../types/config';
import './public-site.css';
import heroVideo from './assets/hero.mp4';

const LANG_LABEL: Record<SiteLang, string> = { he: 'עב', en: 'EN', yi: 'ייִדיש' };
const reduce = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const fmt = (n: number) => n.toLocaleString('he-IL');
function waHref(phone: string): string | null {
  const d = phone.replace(/\D/g, '');
  return d ? `https://wa.me/${d.startsWith('0') ? '972' + d.slice(1) : d}` : null;
}
// גרדיאנט-המותג דרך משתני-ה-CSS שנקבעים על השורש מ-pal (⇒ מתאים לכל ורטיקל).
const GRAD = 'linear-gradient(135deg,var(--c1),var(--c2))';
const TNUM: CSSProperties = { fontFeatureSettings: "'tnum' 1" };

/** לב-SVG (מהעיצוב) — משמש בלוגו ובעיגולים המרחפים. */
const HeartSvg = ({ s = 14, stroke = 'var(--cp)' }: { s?: number; stroke?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.5-1.5 3-3.2 3-5.2A4 4 0 0 0 15 6l-3 3-3-3a4 4 0 0 0-7 2.8c0 2 1.5 3.7 3 5.2l7 6.8z" />
  </svg>
);
/** מדליון-אמון — 4 אייקונים מתחלפים כמו בעיצוב (מגן · 46 · עמודות · כוכב). color=מהפלטה. */
function TrustIcon({ i, color }: { i: number; color: string }) {
  const st = { width: 36, height: 36, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (i % 4 === 1) return <span style={{ fontFamily: "'Rubik'", fontWeight: 800, fontSize: 24, color }}>46</span>;
  if (i % 4 === 2) return <svg {...st}><path d="M4 20h16" /><path d="M7 16V9" /><path d="M12 16V5" /><path d="M17 16v-6" /></svg>;
  if (i % 4 === 3) return <svg {...st}><path d="M12 2l2.6 6.2L21 9l-5 4.4L17.2 20 12 16.6 6.8 20 8 13.4 3 9l6.4-.8z" /></svg>;
  return <svg {...st}><path d="M12 2l7 4v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>;
}

export function PublicSite({ onEnter }: { onEnter: () => void }) {
  const config = useApp((s) => s.config);
  const site = config.site ?? {};
  const langs = useMemo(() => siteLangs(config.site), [config.site]);
  const [lang, setLang] = useState<SiteLang>(langs[0]);
  const rtl = isRtlLang(lang);
  const t = (v: LocalizedText | undefined) => resolveLocalized(v, lang);
  const ui = (k: string) => siteUi(lang, k);
  const he = (heTxt: string, enTxt: string) => (rtl ? heTxt : enTxt); // מיקרו-קופי-שלד דו-לשוני
  const orgName = config.orgName || 'מאור';
  const donate = siteDonateUrl(config);
  const donateHref = donate || '#donate';
  const donateAttrs = donate ? { target: '_blank', rel: 'noopener noreferrer' as const } : {};
  const camp = useMemo(() => campaignProgress(site.campaign, Date.now()), [site.campaign]);
  const goal = camp.goal || 500000;
  /* ── זהות-צבע פר-ורטיקל: הפלטה נגזרת מ-config.accent (חסר ⇒ קורל מקורי, chesed ביט-זהה);
     שפה תלוית-סוג-ארגון: מסחרי (בלי §46) ⇒ "צרו קשר" במקום "לתרומה". ── */
  const pal = useMemo(() => sitePalette(config.accent), [config.accent]);
  const commercial = !featureOn(config, 'core.taxreceipt');
  const voc = siteVocab(commercial, lang);
  const palRef = useRef(pal); palRef.current = pal; // לקנבס-החלקיקים (אפקט חד-פעמי)
  // CTA ראשי: עמותתי ⇒ קישור-התרומה; מסחרי ⇒ טופס-הקשר (אין "תרומה").
  const primaryHref = commercial ? '#contact' : donateHref;
  const primaryAttrs = commercial ? {} : donateAttrs;
  const paletteVars = useMemo<Record<string, string>>(() => ({
    '--c1': pal.c1, '--c2': pal.c2, '--c3': pal.c3, '--cw': pal.word, '--ci': pal.ink,
    '--cp': pal.paper, '--ck': pal.cream, '--cb': pal.blush, '--cm': pal.marquee,
    '--r1': pal.rgb1, '--r2': pal.rgb2, '--ri': pal.inkRgb,
    // משתני ה-.ps הקיימים (לסקשנים מבוססי-מחלקה) — מוזנים מאותה פלטה
    '--c-coral': pal.c3, '--c-coral2': pal.c2, '--c-coral3': pal.c1, '--c-ink': pal.ink,
    '--c-paper': pal.paper, '--c-cream': pal.cream, '--c-blush': pal.blush,
    '--c-line': `rgba(${pal.rgb1},.28)`, '--c-soft': `rgba(${pal.inkRgb},.72)`, '--c-faint': `rgba(${pal.inkRgb},.5)`,
  }), [pal]);

  /* ── לוגיקה מהעיצוב (Component → hooks) ── */
  const starRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [sp, setSp] = useState(0); // scroll progress 0..1
  const [bump, setBump] = useState(0); // ticker
  const words = useMemo(() => {
    const w = (site.heroWords ?? []).map((x) => t(x)).filter(Boolean);
    if (w.length) return w;
    const acc = t(site.titleAccent);
    return acc ? [acc.replace(/\.$/, '')] : ['האלמנות', 'היתומים', 'המשפחות', 'התקווה'];
  }, [site.heroWords, site.titleAccent, lang]);
  const [wi, setWi] = useState(0);

  useEffect(() => {
    if (reduce()) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; const el = document.documentElement; const max = el.scrollHeight - el.clientHeight || 1; setSp(Math.min(1, el.scrollTop / max)); });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    const cont = rootRef.current;
    const onC = () => { const el = cont!; const max = el.scrollHeight - el.clientHeight || 1; setSp(Math.min(1, el.scrollTop / max)); };
    cont?.addEventListener('scroll', onC, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cont?.removeEventListener('scroll', onC); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setBump((b) => b + Math.floor(18 + Math.random() * 102)), 3200);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    if (words.length < 2 || reduce()) return;
    const id = window.setInterval(() => setWi((i) => (i + 1) % words.length), 2600);
    return () => window.clearInterval(id);
  }, [words.length]);

  // זוהר-עכבר + קנבס-חלקיקים (rAF יחיד)
  useEffect(() => {
    if (reduce()) return;
    let mx = -9999, my = -9999;
    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    window.addEventListener('mousemove', onMove, { passive: true });
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    type P = { x: number; y: number; r: number; v: number; w: number; hr: boolean };
    const parts: P[] = [];
    for (let i = 0; i < 46; i++) parts.push({ x: Math.random(), y: Math.random(), r: 2 + Math.random() * 5, v: 0.00018 + Math.random() * 0.00042, w: Math.random() * 6.28, hr: Math.random() < 0.22 });
    let ti = 0, raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop); ti += 0.008;
      const g = glowRef.current; if (g) g.style.transform = `translate(${mx - 150}px,${my - 150}px)`;
      const sc = starRef.current; if (sc) {
        const w = innerWidth, h = innerHeight, W = Math.round(w * DPR), H = Math.round(h * DPR);
        if (sc.width !== W || sc.height !== H) { sc.width = W; sc.height = H; }
        const c = sc.getContext('2d'); if (c) {
          c.setTransform(DPR, 0, 0, DPR, 0, 0); c.clearRect(0, 0, w, h);
          for (const p of parts) {
            p.y -= p.v; if (p.y < -0.04) { p.y = 1.04; p.x = Math.random(); }
            const x = p.x * w + Math.sin(ti + p.w) * 14, y = p.y * h;
            c.globalAlpha = 0.1 + 0.12 * Math.sin(ti * 1.4 + p.w) ** 2; c.fillStyle = palRef.current.c1;
            if (p.hr) { c.font = p.r * 4 + 8 + 'px serif'; c.fillText('♥', x, y); }
            else { c.beginPath(); c.arc(x, y, p.r, 0, 6.284); c.fill(); }
          }
          c.globalAlpha = 1;
        }
      }
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('mousemove', onMove); };
  }, []);

  const raised = (camp.raised || 342180) + bump;
  const pct = Math.min(100, (raised / goal) * 100);

  /* ── מחשבון + בוחר-תרומה ── */
  const unit = site.calc?.unitAmount && site.calc.unitAmount > 0 ? site.calc.unitAmount : 9;
  const [calc, setCalc] = useState(180);
  const meals = Math.round(calc / unit);
  const baskets = Math.max(1, Math.round(calc / 90));
  const [mode, setMode] = useState<'monthly' | 'once'>('monthly');
  const [amt, setAmt] = useState(180);
  const [form, setForm] = useState({ name: '', phone: '', email: '', msg: '' });
  const [sent, setSent] = useState(false);
  const [nl, setNl] = useState('');
  const [nlSent, setNlSent] = useState(false);

  const submitForm = () => {
    const body = [form.msg, form.name && `שם: ${form.name}`, form.phone && `טלפון: ${form.phone}`, form.email && `אימייל: ${form.email}`].filter(Boolean).join('\n');
    const wa = site.contact?.whatsapp ? waHref(site.contact.whatsapp) : null;
    if (wa) window.open(`${wa}?text=${encodeURIComponent(`פנייה מהאתר של ${orgName}\n${body}`)}`, '_blank', 'noopener');
    else if (site.contact?.email) window.location.href = `mailto:${site.contact.email}?body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  // reveal-on-scroll (fallback ל-animation-timeline של העיצוב)
  useEffect(() => {
    const root = rootRef.current; if (!root) return;
    const els = Array.from(root.querySelectorAll('.ps-rev'));
    if (reduce() || typeof IntersectionObserver === 'undefined') { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [lang]);

  // count-up למספרים (מופעל בכניסה לצג)
  const numsRef = useRef<HTMLDivElement>(null);
  const statsArr = site.stats ?? [];
  const [nums, setNums] = useState<number[]>(() => statsArr.map(() => 0));
  const targets = useMemo(() => statsArr.map((s) => { const v = parseInt((s.value || '').replace(/[^\d]/g, ''), 10); return Number.isFinite(v) ? v : 0; }), [statsArr]);
  useEffect(() => {
    const el = numsRef.current; if (!el) return;
    if (reduce() || typeof IntersectionObserver === 'undefined') { setNums(targets); return; }
    let done = false;
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting && !done) {
        done = true; const t0 = performance.now(), d = 1500;
        const step = (n: number) => { const k = Math.min(1, (n - t0) / d), ez = 1 - Math.pow(1 - k, 3); setNums(targets.map((v) => Math.round(v * ez))); if (k < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step); io.disconnect();
      }
    }), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [targets]);

  /* ── נגזרות-קונפיג ── */
  const stats = statsArr;
  const services = site.services ?? [];
  const tiers = site.tiers ?? [];
  const testimonials = site.testimonials ?? [];
  const faq = site.faq ?? [];
  const events = site.events ?? [];
  const gallery = site.gallery ?? [];
  const timeline = site.timeline ?? [];
  const payMethods = site.paymentMethods ?? [];
  const badges = site.transparency?.badges ?? [];
  const marquee = (site.marquee ?? []).map((m) => t(m)).filter(Boolean);
  // נפילה ניטרלית פר-ורטיקל: אין marquee בקונפיג ⇒ נגזר מהמספרים (במקום נוסח-חסד קשיח).
  const marqueeText = marquee.length ? marquee : (site.stats ?? []).map((s) => `${s.value} · ${t(s.label)}`).filter((x) => x.trim() !== '·');
  const tagline = t(site.tagline);
  const heroTitle = t(site.heroTitle) || 'הבית של';
  const storyTitle = t(site.storyTitle) || t(site.story) || '';
  const storyAccent = t(site.storyTitleAccent);
  const storyText = t(site.storyTitle) ? t(site.story) : '';
  const founder = site.founder;
  const contact = site.contact ?? {};
  const impact = he(
    `${fmt(Math.max(1, Math.round(amt / 90)))} סלים שבועיים למשפחה${mode === 'monthly' ? ', כל חודש' : ''}`,
    `${fmt(Math.max(1, Math.round(amt / 90)))} weekly baskets${mode === 'monthly' ? ', every month' : ''}`,
  );

  /* ── סגנונות משותפים (מהעיצוב) ── */
  const navLink: CSSProperties = { textDecoration: 'none', color: 'rgba(var(--ri),.72)', fontSize: 15, fontWeight: 600 };
  const sec: CSSProperties = { position: 'relative', zIndex: 2, maxWidth: 1360, margin: '0 auto', padding: 'clamp(70px,11vh,130px) clamp(20px,4vw,64px) 0', boxSizing: 'border-box' };
  const kicker: CSSProperties = { fontFamily: "'Playpen Sans Hebrew'", fontSize: 17, color: 'var(--c3)', margin: 0 };
  const h2S: CSSProperties = { fontFamily: "'Varela Round'", fontSize: 'clamp(32px,3.8vw,54px)', letterSpacing: '-0.01em', lineHeight: 1.15, margin: '12px 0 0', color: 'var(--ci)' };
  const cardS: CSSProperties = { borderRadius: 28, background: '#fff', border: '1.5px solid rgba(var(--r1),.3)', boxShadow: '0 16px 40px rgba(var(--r2),.13)' };
  const pill = (on: boolean): CSSProperties => ({ fontFamily: "'Varela Round'", fontSize: 15, padding: '12px 22px', borderRadius: 999, cursor: 'pointer', border: on ? '1.5px solid var(--ci)' : '1.5px solid rgba(var(--r1),.45)', background: on ? 'var(--ci)' : '#fff', color: on ? 'var(--cp)' : 'var(--c3)' });
  const amtBtn = (on: boolean): CSSProperties => ({ fontFamily: "'Varela Round'", fontSize: 'clamp(16px,1.3vw,20px)', padding: '16px 10px', borderRadius: 16, cursor: 'pointer', ...TNUM, border: on ? '1.5px solid transparent' : '1.5px solid rgba(var(--r1),.45)', background: on ? GRAD : '#fff', color: on ? 'var(--cp)' : 'var(--c3)', boxShadow: on ? '0 10px 26px rgba(var(--r2),.45)' : '0 4px 12px rgba(var(--r2),.1)' });

  const marqRow = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 40, padding: '13px 22px', fontFamily: "'Varela Round'", fontSize: 14.5, color: 'var(--c3)' }}>
      {marqueeText.map((m, i) => <span key={i} style={{ display: 'inline-flex', gap: 40 }}><span>{m}</span><span>♡</span></span>)}
    </span>
  );

  // גרף-הצמיחה — נקודות 0..1 → viewBox 1200×240
  const growth = site.growth;
  const gPts = (growth?.points ?? []).length >= 2 ? growth!.points! : [0.15, 0.23, 0.2, 0.36, 0.44, 0.4, 0.58, 0.68, 0.64, 0.83, 0.9, 1];
  const gCoords = gPts.map((p, i) => { const x = 20 + (1160 * i) / (gPts.length - 1); const y = 230 - Math.max(0, Math.min(1, p)) * 222; return [Math.round(x), Math.round(y)]; });
  const gLine = gCoords.map(([x, y]) => `${x},${y}`).join(' ');
  const gArea = `${gLine} ${gCoords[gCoords.length - 1][0]},230 20,230`;
  const gEnd = gCoords[gCoords.length - 1];

  const SecHead = ({ k, h, light, children }: { k: string; h?: ReactNode; light?: boolean; children?: ReactNode }) => (
    <>
      <p style={{ ...kicker, color: light ? 'var(--cb)' : 'var(--c3)' }}>{k}</p>
      {h && <h2 style={{ ...h2S, color: light ? 'var(--cp)' : 'var(--ci)' }}>{h}</h2>}
      {children}
    </>
  );

  return (
    <div ref={rootRef} dir={rtl ? 'rtl' : 'ltr'} lang={lang}
      style={{ ...paletteVars, position: 'fixed', inset: 0, zIndex: 250, overflowY: 'auto', overflowX: 'clip', background: 'var(--cp)', color: 'var(--ci)', fontFamily: "'Assistant',system-ui,sans-serif", minHeight: '100vh' } as CSSProperties}>
      {/* רקע-גרדיאנטים קבוע */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: 'radial-gradient(700px 500px at 88% -6%, rgba(var(--r1),.18), transparent 70%), radial-gradient(600px 460px at 4% 30%, rgba(var(--r1),.12), transparent 70%)' }} />
      <canvas ref={starRef} aria-hidden style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />
      <div ref={glowRef} aria-hidden style={{ position: 'fixed', top: 0, left: 0, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(var(--r1),.16) 0%, rgba(var(--r1),0) 62%)', zIndex: 1, pointerEvents: 'none', transform: 'translate(-999px,-999px)' }} />
      <div aria-hidden style={{ position: 'fixed', top: 0, right: 0, height: 4, background: GRAD, borderRadius: '0 0 0 6px', zIndex: 100, width: `${(sp * 100).toFixed(2)}%` }} />

      {/* ── ניווט ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 60, display: 'flex', alignItems: 'center', gap: 'clamp(12px,1.8vw,26px)', padding: '0 clamp(20px,4vw,64px)', height: 78, background: 'rgba(255,252,250,.82)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(var(--r1),.25)' }}>
        <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: 12, marginInlineEnd: 'auto', textDecoration: 'none' }}>
          {config.logoDataUri ? <img src={config.logoDataUri} alt="" style={{ height: 40, borderRadius: 10 }} /> : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 15, height: 15, borderRadius: '50%', background: 'var(--c1)' }} />
              <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--c1)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'ps-beat 2.6s infinite' }}><HeartSvg /></span>
              <span style={{ width: 15, height: 15, borderRadius: '50%', background: 'var(--c1)' }} />
            </span>
          )}
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{ fontFamily: "'Varela Round'", fontSize: 21, color: 'var(--cw)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{orgName}</span>
            {t(site.brandLine) && <span style={{ fontFamily: "'Playpen Sans Hebrew'", fontSize: 11.5, color: 'var(--ci)', marginTop: 3 }}>{t(site.brandLine)}</span>}
          </span>
        </a>
        <a href="#pillars" className="ps-navlink" style={navLink}>{he('מה אנחנו עושות', 'What we do')}</a>
        <a href="#story" className="ps-navlink" style={navLink}>{he('הסיפור', 'Story')}</a>
        <a href="#numbers" className="ps-navlink" style={navLink}>{he('מספרים', 'Numbers')}</a>
        <a href="#calc" className="ps-navlink" style={navLink}>{he('מחשבון', 'Calculator')}</a>
        <a href="#faq" className="ps-navlink" style={navLink}>{he('שאלות', 'FAQ')}</a>
        <button type="button" onClick={onEnter} style={{ ...navLink, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>{ui('enter')}</button>
        {langs.length > 1 && (
          <span dir="ltr" style={{ display: 'inline-flex', alignItems: 'center', border: '1.5px solid rgba(var(--r1),.45)', borderRadius: 999, overflow: 'hidden', fontSize: 12, fontWeight: 700 }}>
            {langs.map((l) => <button key={l} type="button" onClick={() => setLang(l)} style={{ padding: '7px 12px', background: l === lang ? 'var(--c1)' : 'transparent', color: l === lang ? 'var(--cp)' : 'var(--c3)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>{LANG_LABEL[l]}</button>)}
          </span>
        )}
        <a href={primaryHref} {...primaryAttrs} style={{ fontFamily: "'Varela Round'", fontSize: 15, color: 'var(--cp)', textDecoration: 'none', padding: '12px 28px', borderRadius: 999, background: GRAD, boxShadow: '0 8px 22px rgba(var(--r2),.35)' }}>{voc.navCta}</a>
      </nav>

      {/* ── HERO ── */}
      <header id="top" style={{ position: 'relative', zIndex: 2, maxWidth: 1360, margin: '0 auto', padding: 'clamp(44px,7vh,84px) clamp(20px,4vw,64px) clamp(40px,6vh,64px)', boxSizing: 'border-box' }}>
        <div className="ps-hero-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,6.3fr) minmax(0,5.7fr)', gap: 'clamp(32px,5vw,80px)', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '9px 20px', borderRadius: 999, border: '1.5px solid rgba(var(--r1),.5)', background: '#fff', boxShadow: '0 6px 18px rgba(var(--r2),.14)' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#7FC8A9', boxShadow: '0 0 0 4px rgba(127,200,169,.2)' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--c3)', ...TNUM }}>{t(site.ticker) || `קמפיין החגים · ₪${fmt(raised)} נאספו · מתעדכן חי`}</span>
              </div>
              {t(site.heroBadge) && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '9px 20px', borderRadius: 999, background: 'var(--ck)' }}>
                  <span style={{ fontSize: 16 }}>{site.icon || '🕯️'}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--c3)', ...TNUM }}>{t(site.heroBadge)}</span>
                </div>
              )}
            </div>
            <h1 style={{ fontFamily: "'Varela Round'", fontWeight: 400, fontSize: 'clamp(44px,5.6vw,84px)', lineHeight: 1.14, letterSpacing: '-0.015em', margin: '26px 0 0', color: 'var(--ci)' }}>
              <span style={{ display: 'block' }}>{heroTitle}</span>
              <span style={{ display: 'block' }}>
                <span style={{ position: 'relative', display: 'inline-block' }}>
                  <span key={wi} style={{ display: 'inline-block', color: 'var(--cw)', animation: 'ps-pop .55s both' }}>{words[wi % words.length]}.</span>
                  <svg viewBox="0 0 220 26" aria-hidden style={{ position: 'absolute', right: 0, bottom: -14, width: '100%', height: 'auto', overflow: 'visible' }}>
                    <path d="M8 18 C 60 6, 150 4, 212 14" fill="none" stroke={pal.c1} strokeWidth="5" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} style={{ animation: 'ps-draw .9s .9s ease-out both' }} />
                  </svg>
                </span>
              </span>
            </h1>
            {tagline && <p style={{ fontSize: 'clamp(16px,1.4vw,19.5px)', fontWeight: 400, lineHeight: 1.8, maxWidth: '46ch', margin: '30px 0 0', color: 'rgba(var(--ri),.7)' }}>{tagline}</p>}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 34 }}>
              <a href={primaryHref} {...primaryAttrs} style={{ fontFamily: "'Varela Round'", fontSize: 17, color: 'var(--cp)', textDecoration: 'none', padding: '17px 38px', borderRadius: 999, background: GRAD, boxShadow: '0 12px 30px rgba(var(--r2),.4)' }}>{voc.heroCta}</a>
              <a href="#contact" style={{ fontFamily: "'Varela Round'", fontSize: 17, color: 'var(--c3)', textDecoration: 'none', padding: '17px 38px', borderRadius: 999, border: '1.5px solid rgba(var(--r1),.6)', background: '#fff' }}>{ui('contact')}</a>
            </div>
            {t(site.microCopy) && (
              <div style={{ position: 'relative', display: 'inline-block', marginTop: 26 }}>
                <span style={{ fontFamily: "'Playpen Sans Hebrew'", fontSize: 16.5, color: 'var(--ci)' }}>{t(site.microCopy)}</span>
                <svg viewBox="0 0 90 46" aria-hidden style={{ position: 'absolute', right: -96, top: -8, width: 82, height: 'auto', transform: 'scaleX(-1)' }}>
                  <path d="M6 40 C 26 36, 56 28, 74 10" fill="none" stroke={pal.ink} strokeWidth="2" strokeLinecap="round" />
                  <path d="M62 10 L 76 8 L 72 22" fill="none" stroke={pal.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <div aria-hidden style={{ position: 'absolute', top: -26, right: 34, display: 'flex', gap: 7, zIndex: 3 }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--c1)', animation: 'ps-float 5s infinite' }} />
              <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--c1)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'ps-float 5s .4s infinite' }}><HeartSvg s={17} /></span>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--c1)', animation: 'ps-float 5s .8s infinite' }} />
            </div>
            <div style={{ position: 'relative', borderRadius: '36px 120px 36px 36px', overflow: 'hidden', boxShadow: '0 30px 70px rgba(var(--r2),.35), 0 8px 24px rgba(var(--ri),.12)', border: '6px solid #fff' }}>
              <video src={site.heroImage && /\.(mp4|webm)(\?|$)/i.test(site.heroImage) ? site.heroImage : heroVideo} autoPlay muted loop playsInline style={{ display: 'block', width: '100%', height: 'clamp(320px,44vw,560px)', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', insetInlineEnd: 14, bottom: 14, display: 'flex', alignItems: 'center', gap: 9, padding: '9px 18px', borderRadius: 999, background: 'rgba(255,252,250,.9)', backdropFilter: 'blur(8px)', boxShadow: '0 6px 16px rgba(var(--ri),.15)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--c2)' }} />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ci)' }}>{commercial ? he('עכשיו', 'Live') : he('מהשטח, השבוע', 'From the field')}</span>
              </div>
            </div>
            <div style={{ position: 'absolute', insetInlineStart: -14, bottom: -20, background: '#fff', borderRadius: 24, padding: '16px 22px', boxShadow: '0 16px 40px rgba(var(--r2),.3)', display: 'flex', alignItems: 'center', gap: 14, animation: 'ps-float 6s 1s infinite' }}>
              <span style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--ck)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={pal.c2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11h18" /><path d="M5 11a7 7 0 0 1 14 0" /><path d="M4 11l1.5 8a2 2 0 0 0 2 1.7h9a2 2 0 0 0 2-1.7L20 11" /></svg>
              </span>
              <span style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontFamily: "'Rubik'", fontWeight: 800, fontSize: 22, color: 'var(--ci)', ...TNUM }}>{fmt(stats[0]?.value ? parseInt(stats[0].value.replace(/[^\d]/g, ''), 10) || 1204 : 1204)}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(var(--ri),.6)' }}>{commercial ? (t(stats[0]?.label) || he('פעילים', 'active')) : he('סלים יצאו השבוע', 'baskets this week')}</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── מרקיזה ── */}
      {marqueeText.length > 0 && (
      <div dir="ltr" style={{ position: 'relative', zIndex: 2, background: 'var(--cm)', borderTop: '1px solid rgba(var(--r1),.35)', borderBottom: '1px solid rgba(var(--r1),.35)', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: 'clamp(20px,4vh,40px)' }}>
        <div className="ps-marq" style={{ display: 'inline-flex' }}>{marqRow}{marqRow}</div>
      </div>
      )}

      {/* ── מה אנחנו עושות (עמודי-תווך) ── */}
      {services.length > 0 && (
        <section id="pillars" className="ps-rev" style={{ ...sec, textAlign: 'center' }}>
          <SecHead k={he('מה אנחנו עושות ♡', 'What we do ♡')} h={t(site.servicesHeading) || he('שישה דרכים לחבק משפחה', 'Six ways to hold a family')} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'clamp(16px,2vw,28px)', marginTop: 'clamp(34px,5vh,52px)' }}>
            {services.map((s, i) => (
              <div className="ps-lift" key={i} style={{ ...cardS, borderColor: 'rgba(var(--r1),.3)', boxShadow: '0 18px 44px rgba(var(--r2),.14)', padding: 'clamp(28px,3vw,40px) clamp(22px,2.4vw,32px)' }}>
                <div style={{ width: 84, height: 84, margin: '0 auto', borderRadius: '50%', background: 'var(--ck)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, animation: `ps-float ${5 + (i % 3) * 0.4}s ${(i % 3) * 0.3}s infinite` }} aria-hidden>{s.icon || '♡'}</div>
                <h3 style={{ fontFamily: "'Varela Round'", fontSize: 22, margin: '22px 0 0', color: 'var(--ci)' }}>{t(s.title)}</h3>
                {t(s.text) && <p style={{ fontSize: 15.5, lineHeight: 1.8, margin: '12px 0 0', color: 'rgba(var(--ri),.62)' }}>{t(s.text)}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── מספרים (רצועה) + גרף-צמיחה ── */}
      {stats.length > 0 && (
        <section id="numbers" className="ps-rev" style={{ position: 'relative', zIndex: 2, marginTop: 'clamp(70px,11vh,130px)', background: 'linear-gradient(135deg,var(--c1),#DE8888)', padding: 'clamp(60px,9vh,100px) 0' }}>
          <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 clamp(20px,4vw,64px)', boxSizing: 'border-box', textAlign: 'center' }}>
            <SecHead light k={he('שנה אחת, במספרים', 'One year, in numbers')} h={he('האהבה הזאת נספרת', 'This love is counted')} />
            <div ref={numsRef} style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(4, stats.length)},1fr)`, gap: 'clamp(14px,2vw,26px)', marginTop: 'clamp(34px,5vh,52px)' }}>
              {stats.slice(0, 4).map((s, i) => {
                const hasNum = /\d/.test(s.value);
                return (
                  <div key={i} style={{ borderRadius: 26, background: 'rgba(255,252,250,.16)', border: '1.5px solid rgba(255,252,250,.35)', backdropFilter: 'blur(6px)', padding: '30px 16px' }}>
                    <p style={{ fontFamily: "'Rubik'", fontWeight: 800, fontSize: 'clamp(38px,3.8vw,62px)', lineHeight: 1, margin: 0, color: 'var(--cp)', ...TNUM }}>{hasNum ? fmt(nums[i] ?? 0) + s.value.replace(/[\d,]/g, '') : s.value}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: '12px 0 0', color: 'rgba(255,252,250,.85)' }}>{t(s.label)}</p>
                  </div>
                );
              })}
            </div>
            <div style={{ borderRadius: 26, background: 'rgba(255,252,250,.94)', marginTop: 'clamp(20px,3vh,30px)', padding: 'clamp(22px,3vw,36px)', textAlign: 'start', boxShadow: '0 20px 50px rgba(150,70,70,.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--c3)', margin: 0 }}>{t(growth?.label) || he('סלים שבועיים · 12 חודשים אחרונים', 'Weekly baskets · last 12 months')}</p>
                {growth?.delta && <span style={{ fontFamily: "'Rubik'", fontSize: 14, fontWeight: 700, color: '#7FA98F' }}>{growth.delta}</span>}
              </div>
              <svg viewBox="0 0 1200 240" aria-hidden style={{ width: '100%', height: 'auto', display: 'block', marginTop: 16 }}>
                <defs>
                  <linearGradient id="ps-pl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={pal.c1} /><stop offset="1" stopColor={pal.c2} /></linearGradient>
                  <linearGradient id="ps-pa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={`rgba(${pal.rgb1},.3)`} /><stop offset="1" stopColor={`rgba(${pal.rgb1},0)`} /></linearGradient>
                </defs>
                <line x1="0" y1="230" x2="1200" y2="230" stroke={`rgba(${pal.rgb2},.35)`} strokeWidth="1.5" />
                <line x1="0" y1="120" x2="1200" y2="120" stroke={`rgba(${pal.rgb2},.14)`} strokeWidth="1" />
                <polygon points={gArea} fill="url(#ps-pa)" />
                <polyline points={gLine} fill="none" stroke="url(#ps-pl)" strokeWidth="4" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} style={{ animation: 'ps-draw 1.1s .2s ease-out both' }} />
                <circle cx={gEnd[0]} cy={gEnd[1]} r="7" fill={pal.c2}><animate attributeName="r" values="7;9;7" dur="1.6s" repeatCount="indefinite" /></circle>
              </svg>
            </div>
          </div>
        </section>
      )}

      {/* ── אמון ושקיפות (מדליונים) ── */}
      {(t(site.transparency?.heading) || badges.length > 0) && (
        <section className="ps-rev" style={{ ...sec, textAlign: 'center' }}>
          <SecHead k={he('שקוף כמו אור ♡', 'Transparent as light ♡')} h={t(site.transparency?.heading) || he('כל שקל מתועד. כל הדו״חות פתוחים.', 'Every shekel tracked.')} />
          {t(site.transparency?.text) && <p style={{ fontSize: 16, lineHeight: 1.8, maxWidth: '62ch', margin: '18px auto 0', color: 'rgba(var(--ri),.65)' }}>{t(site.transparency?.text)}</p>}
          {badges.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(18px,3.4vw,48px)', flexWrap: 'wrap', marginTop: 'clamp(32px,5vh,48px)' }}>
              {badges.map((b, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: 150 }}>
                  <div style={{ width: 92, height: 92, borderRadius: '50%', background: '#fff', border: '1.5px solid rgba(var(--r1),.4)', boxShadow: '0 12px 30px rgba(var(--r2),.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrustIcon i={i} color={pal.c2} /></div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(var(--ri),.75)' }}>{t(b)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── הסיפור שלנו ── */}
      {(storyTitle || founder) && (
        <section id="story" className="ps-rev" style={sec}>
          <div className="ps-story-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,5fr) minmax(0,7fr)', gap: 'clamp(28px,4.5vw,72px)', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <figure style={{ margin: 0, borderRadius: '36px 36px 120px 36px', overflow: 'hidden', border: '6px solid #fff', boxShadow: '0 26px 60px rgba(var(--r2),.28)' }}>
                {founder?.photo
                  ? <img src={founder.photo} alt={t(founder.name) || ''} style={{ width: '100%', height: 'clamp(300px,36vw,460px)', objectFit: 'cover', display: 'block' }} />
                  : <div style={{ width: '100%', height: 'clamp(300px,36vw,460px)', background: 'linear-gradient(160deg,var(--ck),var(--cm))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 90 }} aria-hidden>{site.icon || '🕯️'}</div>}
              </figure>
              {founder?.quote && (
                <div style={{ position: 'absolute', insetInlineStart: -12, bottom: -18, maxWidth: '78%', background: '#fff', borderRadius: 22, padding: '14px 20px', boxShadow: '0 14px 34px rgba(var(--r2),.3)' }}>
                  <p style={{ fontFamily: "'Playpen Sans Hebrew'", fontSize: 15, margin: 0, color: 'var(--ci)' }}>{t(founder.quote)}</p>
                  {t(founder.name) && <p style={{ fontSize: 12.5, fontWeight: 700, margin: '6px 0 0', color: 'var(--c3)' }}>{t(founder.name)}</p>}
                </div>
              )}
            </div>
            <div>
              <p style={kicker}>{he('הסיפור שלנו', 'Our story')} 🕯️</p>
              <h2 style={{ fontFamily: "'Varela Round'", fontSize: 'clamp(30px,3.6vw,50px)', letterSpacing: '-0.01em', lineHeight: 1.18, margin: '12px 0 0', color: 'var(--ci)' }}>{storyTitle}{storyAccent && <><br /><span style={{ color: 'var(--cw)' }}>{storyAccent}</span></>}</h2>
              {storyText && <p style={{ fontSize: 16, lineHeight: 1.9, maxWidth: '58ch', margin: '20px 0 0', color: 'rgba(var(--ri),.68)' }}>{storyText}</p>}
              {t(site.storyBadge) && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 18, padding: '8px 18px', borderRadius: 999, background: 'var(--ck)', fontSize: 13.5, fontWeight: 700, color: 'var(--c3)' }}>{t(site.storyBadge)}</span>}
              {timeline.length > 0 && (
                <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column' }}>
                  {timeline.map((m, i) => (
                    <div key={i} style={{ display: 'flex', gap: 16 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--c1)', flexShrink: 0, marginTop: 5 }} />
                        {i < timeline.length - 1 && <span style={{ width: 2, flex: 1, background: 'rgba(var(--r1),.35)' }} />}
                      </div>
                      <p style={{ margin: 0, paddingBottom: i < timeline.length - 1 ? 16 : 0, fontSize: 15, color: 'rgba(var(--ri),.7)' }}>
                        <span style={{ fontFamily: "'Rubik'", fontWeight: 700, color: 'var(--c2)' }}>{m.year}</span> · <b>{t(m.title)}</b>{t(m.note) && <> — {t(m.note)}</>}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── מחשבון + בוחר-תרומה — עמותתי בלבד (מסחרי ⇒ אין תרומה; ה-CTA הוא "צרו קשר") ── */}
      {!commercial && (<>
      <section id="calc" className="ps-rev" style={sec}>
        <div className="ps-calc-grid" style={{ ...cardS, border: '1.5px solid rgba(var(--r1),.35)', boxShadow: '0 26px 60px rgba(var(--r2),.18)', borderRadius: 32, padding: 'clamp(28px,4vw,54px)', display: 'grid', gridTemplateColumns: 'minmax(0,6fr) minmax(0,6fr)', gap: 'clamp(28px,4vw,64px)', alignItems: 'center' }}>
          <div>
            <p style={kicker}>{he('בואו נשחק רגע ↓', "Let's play ↓")}</p>
            <h2 style={{ fontFamily: "'Varela Round'", fontSize: 'clamp(28px,3.2vw,46px)', letterSpacing: '-0.01em', lineHeight: 1.2, margin: '12px 0 0', color: 'var(--ci)' }}>{he('כמה חסד יוצא משקל אחד?', 'What one shekel does?')}</h2>
            <p style={{ fontFamily: "'Rubik'", fontWeight: 800, fontSize: 'clamp(46px,4.6vw,76px)', lineHeight: 1, margin: '26px 0 0', color: 'var(--cw)', ...TNUM }}>₪{fmt(calc)}</p>
            <input type="range" min={18} max={1000} step={1} value={calc} onChange={(e) => setCalc(+e.target.value)} aria-label={he('סכום תרומה', 'Donation amount')} style={{ width: '100%', accentColor: 'var(--c2)', height: 36, cursor: 'pointer', marginTop: 16 }} />
            <p style={{ fontSize: 13.5, color: 'rgba(var(--ri),.5)', margin: '8px 0 0' }}>{t(site.calc?.note) || he('גררו את הלב · לפי ₪9 לארוחה חמה ו־₪90 לסל שבועי מלא', 'Drag the heart · ₪9 per meal, ₪90 per weekly basket')}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(16px,2vw,26px)' }}>
            <div style={{ borderRadius: 26, background: 'var(--ck)', padding: 'clamp(22px,2.6vw,34px)', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Rubik'", fontWeight: 800, fontSize: 'clamp(42px,4.4vw,72px)', lineHeight: 1, margin: 0, color: 'var(--ci)', ...TNUM }}>{fmt(meals)}</p>
              <p style={{ fontSize: 14.5, fontWeight: 700, margin: '12px 0 0', color: 'var(--c3)' }}>{t(site.calc?.unit) || he('ארוחות חמות', 'warm meals')}</p>
            </div>
            <div style={{ borderRadius: 26, background: 'linear-gradient(160deg,var(--c1),var(--c2))', padding: 'clamp(22px,2.6vw,34px)', textAlign: 'center', boxShadow: '0 16px 36px rgba(var(--r2),.35)' }}>
              <p style={{ fontFamily: "'Rubik'", fontWeight: 800, fontSize: 'clamp(42px,4.4vw,72px)', lineHeight: 1, margin: 0, color: 'var(--cp)', ...TNUM }}>{fmt(baskets)}</p>
              <p style={{ fontSize: 14.5, fontWeight: 700, margin: '12px 0 0', color: 'rgba(255,252,250,.9)' }}>{he('סלים שבועיים למשפחה', 'weekly baskets')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── בוחר-תרומה ── */}
      <section id="donate" className="ps-rev" style={sec}>
        <div style={{ textAlign: 'center' }}>
          <p style={kicker}>{he('הרגע הזה ששקל הופך לחיבוק', 'The moment a shekel becomes a hug')}</p>
          <h2 style={h2S}>{t(site.campaign?.title) || he('בחרו את התרומה שלכם', 'Choose your gift')}</h2>
        </div>
        <div className="ps-donate-grid" style={{ ...cardS, border: '1.5px solid rgba(var(--r1),.35)', boxShadow: '0 26px 60px rgba(var(--r2),.2)', borderRadius: 32, marginTop: 'clamp(30px,5vh,46px)', display: 'grid', gridTemplateColumns: 'minmax(0,7fr) minmax(0,5fr)', overflow: 'hidden' }}>
          <div style={{ padding: 'clamp(26px,3.4vw,46px)' }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setMode('monthly')} style={pill(mode === 'monthly')}>{he('הוראת קבע חודשית', 'Monthly')}</button>
              <button type="button" onClick={() => setMode('once')} style={pill(mode === 'once')}>{he('תרומה חד־פעמית', 'One-time')}</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 24 }}>
              {[50, 180, 360, 720].map((a) => <button key={a} type="button" onClick={() => setAmt(a)} style={amtBtn(amt === a)}>₪{a}</button>)}
            </div>
            <label style={{ display: 'block', marginTop: 20 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c3)' }}>{he('סכום אחר', 'Other amount')}</span>
              <input type="number" min={1} placeholder="₪" onChange={(e) => setAmt(Math.max(1, +e.target.value || 0))} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 8, padding: '14px 18px', borderRadius: 16, border: '1.5px solid rgba(var(--r1),.45)', background: 'var(--cp)', color: 'var(--ci)', fontFamily: "'Rubik'", fontWeight: 700, fontSize: 18, outline: 'none' }} />
            </label>
            {payMethods.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
                {payMethods.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 16px', borderRadius: 16, background: 'var(--ck)' }}>
                    <span style={{ flexShrink: 0, marginTop: 2, color: 'var(--c2)', fontSize: 18 }} aria-hidden>{i === 0 ? '💳' : i === 1 ? '🏦' : '✉️'}</span>
                    <span dir={p.ltr ? 'ltr' : undefined} style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(var(--ri),.75)', textAlign: p.ltr ? 'left' : 'start' }}><b style={{ color: 'var(--c3)' }}>{t(p.label)}</b> · {t(p.detail)}</span>
                  </div>
                ))}
              </div>
            )}
            {t(site.donateNote) && <p style={{ fontSize: 13, color: 'rgba(var(--ri),.5)', margin: '18px 0 0' }}>{t(site.donateNote)}</p>}
          </div>
          <div style={{ padding: 'clamp(26px,3.4vw,46px)', display: 'flex', flexDirection: 'column', gap: 'clamp(20px,3vh,32px)', background: 'var(--ck)' }}>
            <div>
              <p style={{ fontFamily: "'Playpen Sans Hebrew'", fontSize: 16, color: 'var(--c3)', margin: 0 }}>{voc.giveLabel} =</p>
              <p style={{ fontFamily: "'Varela Round'", fontSize: 'clamp(24px,2.3vw,38px)', lineHeight: 1.2, margin: '10px 0 0', color: 'var(--ci)' }}>{impact} ♡</p>
            </div>
            <div style={{ marginTop: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 13.5, ...TNUM }}>
                <span style={{ fontWeight: 700, color: 'var(--ci)' }}>{he('נאספו', 'Raised')} ₪{fmt(raised)}</span>
                <span style={{ color: 'rgba(var(--ri),.55)' }}>{he('יעד', 'Goal')} ₪{fmt(goal)}</span>
              </div>
              <div style={{ height: 16, borderRadius: 999, background: '#fff', border: '1.5px solid rgba(var(--r1),.4)', marginTop: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,var(--c1),var(--c2))', width: `${pct.toFixed(1)}%`, transition: 'width .6s' }} />
              </div>
              <p style={{ fontSize: 13, margin: '10px 0 0', color: 'var(--c3)', fontWeight: 700, ...TNUM }}>{pct.toFixed(1)}% {he('מהיעד · מתעדכן חי', 'of goal · live')}</p>
              {camp.daysLeft !== null && <p style={{ fontSize: 12.5, margin: '6px 0 0', color: 'rgba(var(--ri),.5)' }}>{he(`הקמפיין נסגר בעוד ${camp.daysLeft} ימים`, `${camp.daysLeft} days left`)}</p>}
            </div>
            <a href={donateHref} {...donateAttrs} style={{ display: 'block', textAlign: 'center', fontFamily: "'Varela Round'", fontSize: 17, color: 'var(--cp)', textDecoration: 'none', padding: '18px 24px', borderRadius: 999, background: GRAD, boxShadow: '0 14px 34px rgba(var(--r2),.45)' }}>{he(`לתרומה של ₪${fmt(amt)} ${mode === 'monthly' ? 'בכל חודש' : ''}`, `Donate ₪${fmt(amt)}`)} ←</a>
          </div>
        </div>
      </section>
      </>)}

      {/* ── גלריה ── */}
      {gallery.length > 0 && (
        <section id="gallery" className="ps-rev" style={{ ...sec, textAlign: 'center' }}>
          <SecHead k={he('רגעים אמיתיים מהשבוע ♡', 'Real moments ♡')} h={he('מהשטח, בגובה הלב', 'From the field')} />
          <div className="ps-gal6" style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gridAutoRows: 'clamp(105px,14vw,190px)', gap: 'clamp(12px,1.4vw,18px)', marginTop: 'clamp(30px,5vh,48px)' }}>
            {gallery.slice(0, 6).map((src, i) => {
              const spans = [[3, 2], [2, 1], [1, 2], [2, 1], [2, 1], [4, 1]][i] || [2, 1];
              return (
                <figure key={i} style={{ margin: 0, gridColumn: `span ${spans[0]}`, gridRow: `span ${spans[1]}`, borderRadius: 28, overflow: 'hidden', border: '5px solid #fff', boxShadow: '0 18px 44px rgba(var(--r2),.22)' }}>
                  <img src={src} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </figure>
              );
            })}
          </div>
        </section>
      )}

      {/* ── חדשות + אירועים ── */}
      {(t(site.news) || events.length > 0) && (
        <section className="ps-rev" style={sec}>
          <div className="ps-news-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,5fr) minmax(0,7fr)', gap: 'clamp(16px,2vw,28px)' }}>
            <div style={{ borderRadius: 28, background: 'var(--ck)', padding: 'clamp(24px,2.8vw,36px)' }}>
              <p style={{ fontFamily: "'Playpen Sans Hebrew'", fontSize: 16, color: 'var(--c3)', margin: 0 }}>{he('מה חדש ✎', "What's new ✎")}</p>
              <p style={{ fontFamily: "'Varela Round'", fontSize: 'clamp(19px,1.8vw,24px)', lineHeight: 1.5, margin: '14px 0 0', color: 'var(--ci)' }}>{t(site.news)}</p>
            </div>
            <div style={{ ...cardS, padding: 'clamp(24px,2.8vw,36px)' }}>
              <p style={{ fontFamily: "'Playpen Sans Hebrew'", fontSize: 16, color: 'var(--c3)', margin: 0 }}>{he('אירועים קרובים ♡', 'Upcoming ♡')}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
                {events.map((e, i) => (
                  <div key={i}>
                    {i > 0 && <div style={{ height: 1.5, background: 'var(--ck)', marginBottom: 14 }} />}
                    <a href={e.url || '#contact'} {...(e.url ? { target: '_blank', rel: 'noopener noreferrer' } : {})} style={{ display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none' }}>
                      {e.date && <span style={{ width: 58, height: 58, borderRadius: 18, background: i === 0 ? 'linear-gradient(150deg,var(--c1),var(--c2))' : 'var(--ck)', color: i === 0 ? 'var(--cp)' : 'var(--c3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, whiteSpace: 'pre-line', fontFamily: "'Rubik'", fontWeight: 800, fontSize: 15, lineHeight: 1.1, textAlign: 'center' }}>{e.date}</span>}
                      <span><span style={{ display: 'block', fontFamily: "'Varela Round'", fontSize: 17, color: 'var(--ci)' }}>{t(e.title)}</span>{t(e.meta) && <span style={{ display: 'block', fontSize: 13.5, color: 'rgba(var(--ri),.6)', marginTop: 3 }}>{t(e.meta)}</span>}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── עדויות ── */}
      {testimonials.length > 0 && (
        <section className="ps-rev" style={sec}>
          <div style={{ textAlign: 'center' }}>
            <p style={kicker}>{he('מילים שקיבלנו באמת', 'Words we received')}</p>
            <h2 style={h2S}>{he('מילים מהלב', 'From the heart')}</h2>
          </div>
          <div className="ps-tst3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'clamp(16px,2vw,28px)', marginTop: 'clamp(32px,5vh,48px)' }}>
            {testimonials.map((tt, i) => (
              <blockquote key={i} style={{ margin: 0, borderRadius: 28, background: i % 2 === 1 ? 'var(--ck)' : '#fff', border: i % 2 === 1 ? 'none' : '1.5px solid rgba(var(--r1),.3)', padding: 'clamp(24px,2.6vw,36px)', boxShadow: '0 16px 40px rgba(var(--r2),.13)' }}>
                <span aria-hidden style={{ fontFamily: "'Playpen Sans Hebrew'", fontSize: 44, lineHeight: 0.7, color: i % 2 === 1 ? 'var(--c2)' : 'var(--c1)', display: 'block' }}>&ldquo;</span>
                <p style={{ fontSize: 16.5, lineHeight: 1.75, margin: '8px 0 16px', color: 'var(--ci)' }}>{t(tt.quote)}</p>
                {tt.author && <footer style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--c3)' }}>{tt.author}{t(tt.role) && <span style={{ color: 'rgba(var(--ri),.5)', fontWeight: 600 }}> · {t(tt.role)}</span>}</footer>}
              </blockquote>
            ))}
          </div>
        </section>
      )}

      {/* ── מסלולי-שותפות ── */}
      {tiers.length > 0 && (
        <section id="tiers" className="ps-rev" style={sec}>
          <div style={{ textAlign: 'center' }}>
            <p style={kicker}>{he('מסלולי שותפות ♡', 'Partnership ♡')}</p>
            <h2 style={h2S}>{he('בחרו איך להיות בפנים', 'Choose your way in')}</h2>
          </div>
          <div className="ps-tst3" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, tiers.length)},1fr)`, gap: 'clamp(16px,2vw,28px)', marginTop: 'clamp(32px,5vh,48px)', alignItems: 'stretch' }}>
            {tiers.map((tr, i) => (
              <div key={i} style={{ position: 'relative', borderRadius: 28, background: '#fff', border: tr.featured ? '2px solid var(--c2)' : '1.5px solid rgba(var(--r1),.3)', boxShadow: tr.featured ? '0 26px 60px rgba(var(--r2),.22)' : '0 16px 40px rgba(var(--r2),.13)', padding: 'clamp(28px,3vw,40px) clamp(22px,2.4vw,30px)', display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
                {tr.featured && <span style={{ position: 'absolute', top: -13, insetInline: 0, margin: 'auto', width: 'fit-content', background: 'var(--c2)', color: '#fff', fontSize: 12, fontWeight: 800, padding: '4px 14px', borderRadius: 999 }}>{he('הכי אהוב ♡', 'Most loved ♡')}</span>}
                <h3 style={{ fontFamily: "'Varela Round'", fontSize: 20, margin: '0 0 8px', color: 'var(--ci)' }}>{t(tr.name)}</h3>
                {tr.amount !== undefined && <div style={{ fontFamily: "'Rubik'", fontWeight: 800, fontSize: 38, color: 'var(--cw)', marginBottom: 16, ...TNUM }}>₪{fmt(tr.amount)}<small style={{ fontSize: 15, color: 'rgba(var(--ri),.45)', fontWeight: 700 }}>{t(tr.period) || he('/ חודש', '/ mo')}</small></div>}
                {tr.perks && <ul style={{ listStyle: 'none', margin: '0 0 22px', padding: 0, textAlign: 'start', fontSize: 14, color: 'rgba(var(--ri),.72)', display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>{tr.perks.map((p, j) => <li key={j}>♡ {t(p)}</li>)}</ul>}
                <a href={tr.url || donateHref} {...(tr.url || donate ? { target: '_blank', rel: 'noopener noreferrer' } : {})} style={{ fontFamily: "'Varela Round'", fontSize: 15, textDecoration: 'none', padding: '13px 24px', borderRadius: 999, background: tr.featured ? GRAD : 'transparent', color: tr.featured ? 'var(--cp)' : 'var(--c3)', border: tr.featured ? 'none' : '1.6px solid rgba(var(--r1),.6)' }}>{he('להצטרפות', 'Join')}</a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── שאלות נפוצות ── */}
      {faq.length > 0 && (
        <section id="faq" className="ps-rev" style={{ ...sec, maxWidth: 920 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={kicker}>{he('שאלו אותנו הכול', 'Ask us anything')}</p>
            <h2 style={h2S}>{he('שאלות נפוצות', 'FAQ')}</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 'clamp(30px,5vh,46px)' }}>
            {faq.map((f, i) => (
              <details key={i} className="ps-faqd" style={{ borderRadius: 22, background: '#fff', border: '1.5px solid rgba(var(--r1),.3)', padding: '0 clamp(20px,2.4vw,30px)', boxShadow: '0 10px 26px rgba(var(--r2),.1)' }}>
                <summary style={{ fontFamily: "'Varela Round'", fontSize: 'clamp(16.5px,1.5vw,20px)', padding: '22px 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, color: 'var(--ci)', listStyle: 'none' }}>
                  <span>{t(f.q)}</span>
                  <span className="ps-faqmark" style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--ck)', color: 'var(--c2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20, lineHeight: 1 }}>+</span>
                </summary>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(var(--ri),.7)', margin: '0 0 22px', whiteSpace: 'pre-line' }}>{t(f.a)}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* ── יצירת קשר ── */}
      <section id="contact" className="ps-rev" style={sec}>
        <div className="ps-contact-grid" style={{ ...cardS, border: '1.5px solid rgba(var(--r1),.35)', boxShadow: '0 26px 60px rgba(var(--r2),.18)', borderRadius: 32, display: 'grid', gridTemplateColumns: 'minmax(0,7fr) minmax(0,5fr)', overflow: 'hidden' }}>
          <div style={{ padding: 'clamp(26px,3.4vw,46px)' }}>
            <h2 style={{ fontFamily: "'Varela Round'", fontSize: 'clamp(26px,2.6vw,40px)', letterSpacing: '-0.01em', margin: '0 0 4px', color: 'var(--ci)' }}>{he('דברו איתנו ♡', 'Talk to us ♡')}</h2>
            <p style={{ fontSize: 14, margin: '0 0 18px', color: 'rgba(var(--ri),.55)' }}>{t(site.contactForm?.note) || he('מענה תוך יום עסקים · דיסקרטיות מלאה', 'Reply within a business day')}</p>
            {sent ? (
              <p style={{ fontFamily: "'Varela Round'", fontSize: 17, color: '#7FA98F', margin: 0 }}>♡ {he('התקבל! נחזור אליכם תוך יום עסקים.', 'Received! We will reply within a business day.')}</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <label><span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c3)' }}>{he('שם מלא', 'Full name')}</span><input className="ps-in2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={he('ישראל ישראלי', 'Full name')} /></label>
                <label><span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c3)' }}>{he('טלפון', 'Phone')}</span><input className="ps-in2" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="050-0000000" /></label>
                <label style={{ gridColumn: 'span 2' }}><span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c3)' }}>{he('אימייל', 'Email')}</span><input className="ps-in2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@mail.com" /></label>
                <label style={{ gridColumn: 'span 2' }}><span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c3)' }}>{he('במה מדובר?', 'How can we help?')}</span><textarea className="ps-in2" rows={4} value={form.msg} onChange={(e) => setForm({ ...form, msg: e.target.value })} placeholder={he('תרומה / התנדבות / בקשת סיוע / אחר', 'Donation / volunteering / help / other')} style={{ resize: 'vertical' }} /></label>
                <button type="button" onClick={submitForm} style={{ gridColumn: 'span 2', justifySelf: 'start', fontFamily: "'Varela Round'", fontSize: 16, color: 'var(--cp)', padding: '15px 40px', borderRadius: 999, border: 'none', background: GRAD, boxShadow: '0 12px 30px rgba(var(--r2),.4)', cursor: 'pointer' }}>{he('שליחה ♡', 'Send ♡')}</button>
              </div>
            )}
          </div>
          <div style={{ padding: 'clamp(26px,3.4vw,46px)', display: 'flex', flexDirection: 'column', gap: 22, background: 'var(--ck)' }}>
            {(contact.phones ?? []).length > 0 && (
              <div><p style={{ fontFamily: "'Playpen Sans Hebrew'", fontSize: 14.5, color: 'var(--c3)', margin: 0 }}>{he('טלפונים', 'Phones')}</p>
                {(contact.phones ?? []).map((p, i) => <p key={i} dir="ltr" style={{ fontFamily: "'Rubik'", fontWeight: i === 0 ? 800 : 600, fontSize: i === 0 ? 24 : 15, margin: i === 0 ? '6px 0 0' : '4px 0 0', textAlign: 'start', color: i === 0 ? 'var(--ci)' : 'rgba(var(--ri),.7)', ...TNUM }}>{p}</p>)}
              </div>
            )}
            {contact.whatsapp && waHref(contact.whatsapp) && (
              <a href={waHref(contact.whatsapp)!} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, alignSelf: 'flex-start', padding: '11px 22px', borderRadius: 999, background: '#fff', border: '1.5px solid rgba(127,169,143,.5)', textDecoration: 'none', color: '#5E8F72', fontWeight: 700, fontSize: 14.5 }}>💬 {ui('whatsapp')}</a>
            )}
            {t(contact.hours) && <div><p style={{ fontFamily: "'Playpen Sans Hebrew'", fontSize: 14.5, color: 'var(--c3)', margin: 0 }}>{he('שעות פעילות', 'Hours')}</p><p style={{ fontWeight: 600, fontSize: 15, margin: '6px 0 0', color: 'rgba(var(--ri),.75)' }}>{t(contact.hours)}</p></div>}
            {contact.email && <div><p style={{ fontFamily: "'Playpen Sans Hebrew'", fontSize: 14.5, color: 'var(--c3)', margin: 0 }}>{he('אימייל', 'Email')}</p><a href={'mailto:' + contact.email} style={{ fontWeight: 700, fontSize: 18, margin: '6px 0 0', color: 'var(--ci)', display: 'block' }}>{contact.email}</a></div>}
            {t(contact.address) && <div><p style={{ fontFamily: "'Playpen Sans Hebrew'", fontSize: 14.5, color: 'var(--c3)', margin: 0 }}>{he('כתובת', 'Address')}</p><p style={{ fontWeight: 400, fontSize: 15.5, margin: '6px 0 0', color: 'rgba(var(--ri),.8)' }}>{t(contact.address)}</p></div>}
            {t(contact.taxNote) && <div style={{ borderTop: '1.5px solid rgba(var(--r1),.35)', paddingTop: 16, marginTop: 'auto' }}><p style={{ fontSize: 12.5, lineHeight: 1.7, color: 'rgba(var(--ri),.45)', margin: 0 }}>{t(contact.taxNote)}</p></div>}
          </div>
        </div>
      </section>

      {/* ── קריאה אחרונה ── */}
      <section className="ps-rev" style={{ position: 'relative', zIndex: 2, maxWidth: 1360, margin: '0 auto', padding: 'clamp(70px,11vh,140px) clamp(20px,4vw,64px)', boxSizing: 'border-box' }}>
        <div style={{ position: 'relative', borderRadius: 40, background: 'linear-gradient(150deg,var(--c1),var(--c2))', boxShadow: '0 34px 80px rgba(var(--r2),.45)', padding: 'clamp(44px,8vh,90px) clamp(24px,4vw,64px)', textAlign: 'center', overflow: 'hidden' }}>
          <div aria-hidden style={{ position: 'absolute', top: -70, left: -70, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,252,250,.14)' }} />
          <div aria-hidden style={{ position: 'absolute', bottom: -90, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,252,250,.1)' }} />
          <div aria-hidden style={{ display: 'flex', justifyContent: 'center', gap: 7, marginBottom: 22 }}>
            <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(255,252,250,.85)' }} />
            <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--cp)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'ps-beat 2.6s infinite' }}><HeartSvg stroke={pal.c2} /></span>
            <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(255,252,250,.85)' }} />
          </div>
          <h2 style={{ position: 'relative', fontFamily: "'Varela Round'", fontSize: 'clamp(34px,4.8vw,72px)', lineHeight: 1.15, letterSpacing: '-0.015em', margin: 0, color: 'var(--cp)' }}>{he('כל שקל. כל שבוע. כל משפחה.', 'Every shekel. Every week. Every family.')}</h2>
          <p style={{ position: 'relative', fontFamily: "'Playpen Sans Hebrew'", fontSize: 'clamp(16px,1.6vw,21px)', margin: '18px 0 0', color: 'var(--cb)' }}>{t(site.microCopy) || he('בואו להאיר יחד איתנו ♡', 'Bring light with us ♡')}</p>
          <div style={{ position: 'relative', display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', marginTop: 32 }}>
            <a href={primaryHref} {...primaryAttrs} style={{ fontFamily: "'Varela Round'", fontSize: 17, color: 'var(--c3)', textDecoration: 'none', padding: '17px 44px', borderRadius: 999, background: 'var(--cp)', boxShadow: '0 14px 34px rgba(150,70,70,.35)' }}>{voc.heroCta}</a>
            <span style={{ fontFamily: "'Rubik'", fontWeight: 700, fontSize: 14.5, color: 'var(--cb)', ...TNUM }}>₪{fmt(raised)} / ₪{fmt(goal)} · {pct.toFixed(0)}%</span>
          </div>
        </div>
      </section>

      {/* ── ניוזלטר ── */}
      <section className="ps-rev" style={{ position: 'relative', zIndex: 2, maxWidth: 940, margin: '0 auto', padding: '0 clamp(20px,4vw,64px) clamp(60px,9vh,100px)', boxSizing: 'border-box' }}>
        <div style={{ ...cardS, border: '1.5px solid rgba(var(--r1),.35)', boxShadow: '0 18px 44px rgba(var(--r2),.16)', padding: 'clamp(22px,3vw,34px)', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 220, flex: 1 }}>
            <span style={{ fontFamily: "'Varela Round'", fontSize: 19, color: 'var(--ci)' }}>{he('נשארים מחוברים ♡', 'Stay connected ♡')}</span>
            <span style={{ fontSize: 13.5, color: 'rgba(var(--ri),.55)' }}>{he('עדכון חודשי קצר מהשטח — בלי ספאם, מבטיחות', 'A short monthly update — no spam')}</span>
          </span>
          {nlSent ? <span style={{ fontFamily: "'Varela Round'", color: '#7FA98F', fontSize: 16 }}>♡ {he('נרשמת! נתראה במייל.', 'Subscribed!')}</span> : (
            <span style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flex: 1, minWidth: 280 }}>
              <input className="ps-in2" type="email" value={nl} onChange={(e) => setNl(e.target.value)} placeholder={he('האימייל שלך', 'Your email')} style={{ flex: 1, minWidth: 180, borderRadius: 999 }} />
              <button type="button" onClick={() => nl && setNlSent(true)} style={{ fontFamily: "'Varela Round'", fontSize: 15, color: 'var(--cp)', padding: '13px 30px', borderRadius: 999, border: 'none', background: GRAD, cursor: 'pointer', boxShadow: '0 10px 26px rgba(var(--r2),.4)' }}>{he('הרשמה', 'Subscribe')}</button>
            </span>
          )}
        </div>
      </section>

      {/* ── פוטר ── */}
      <footer style={{ position: 'relative', zIndex: 2, background: 'var(--ck)', borderTop: '1.5px solid rgba(var(--r1),.3)' }}>
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '30px clamp(20px,4vw,64px)', boxSizing: 'border-box', display: 'flex', gap: 26, flexWrap: 'wrap', alignItems: 'center', fontSize: 14 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Varela Round'", color: 'var(--cw)', fontSize: 17 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--c1)' }} />
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--c1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><HeartSvg s={10} /></span>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--c1)' }} />
            </span>
            {orgName}
          </span>
          <a href="#pillars" className="ps-navlink" style={{ textDecoration: 'none', color: 'rgba(var(--ri),.6)', fontWeight: 600 }}>{he('מה אנחנו עושות', 'What we do')}</a>
          <a href="#donate" className="ps-navlink" style={{ textDecoration: 'none', color: 'rgba(var(--ri),.6)', fontWeight: 600 }}>{he('תרומה', 'Donate')}</a>
          <a href="#faq" className="ps-navlink" style={{ textDecoration: 'none', color: 'rgba(var(--ri),.6)', fontWeight: 600 }}>{he('שאלות נפוצות', 'FAQ')}</a>
          <a href="#contact" className="ps-navlink" style={{ textDecoration: 'none', color: 'rgba(var(--ri),.6)', fontWeight: 600 }}>{he('צרו קשר', 'Contact')}</a>
          <span style={{ marginInlineStart: 'auto', color: 'rgba(var(--ri),.5)', fontSize: 12.5 }}>{he('נבנה באהבה', 'Built with love')} · {ui('poweredBy')} ♡</span>
        </div>
      </footer>
    </div>
  );
}
