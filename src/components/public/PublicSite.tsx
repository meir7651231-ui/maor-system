/**
 * האתר-הציבורי (דף-תרומות) — **מוזן ישירות מהקונפיג של הארגון**.
 * ציבורי לגמרי: מוצג ב-App לפני שער-הענן/ההתחברות (המבקר לא צריך חשבון).
 * קורא רק את config (מיתוג + config.site). מגודר shell.publicsite + ‎?site‎.
 *
 * עיצוב "חסד חם" (לפי העיצוב שהתקבל 16.8): פלטת-קורל, כפתור-פיל כהה, מוטיב ♡,
 * כרטיסים מעוגלים. סקשנים: רצועת-קמפיין · hero · מרקיזה · שירותים · מונים ·
 * שקיפות · סיפור · מחשבון · קמפיין · גלריה · עדויות · מסלולי-שותפות · אירועים ·
 * חדשות · שותפים · שאלות · טופס-קשר · פוטר. רב-לשוני, מכבד prefers-reduced-motion.
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

const LANG_LABEL: Record<SiteLang, string> = { he: 'עב', en: 'EN', yi: 'ייִדיש' };
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function waHref(phone: string): string | null {
  const d = phone.replace(/\D/g, '');
  if (!d) return null;
  return `https://wa.me/${d.startsWith('0') ? '972' + d.slice(1) : d}`;
}
function splitStat(value: string): { num: number | null; prefix: string; suffix: string } {
  const m = value.match(/^(\D*)([\d,]+)(.*)$/);
  if (!m) return { num: null, prefix: '', suffix: value };
  const num = parseInt(m[2].replace(/,/g, ''), 10);
  return Number.isFinite(num) ? { num, prefix: m[1], suffix: m[3] } : { num: null, prefix: '', suffix: value };
}
function useCountUp(target: number, active: boolean): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (prefersReducedMotion()) { setVal(target); return; }
    let raf = 0; const start = performance.now(); const dur = 1300;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, active]);
  return val;
}
function useInView<T extends Element>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') { setSeen(true); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (setSeen(true), io.disconnect())), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen];
}

function StatNum({ value }: { value: string }) {
  const { num, prefix, suffix } = useMemo(() => splitStat(value), [value]);
  const [ref, seen] = useInView<HTMLDivElement>();
  const shown = useCountUp(num ?? 0, seen && num !== null);
  return <div className="ps-statnum" ref={ref}>{num !== null ? prefix + shown.toLocaleString('he-IL') + suffix : value}</div>;
}

export function PublicSite({ onEnter }: { onEnter: () => void }) {
  const config = useApp((s) => s.config);
  const site = config.site ?? {};
  const langs = useMemo(() => siteLangs(config.site), [config.site]);
  const [lang, setLang] = useState<SiteLang>(langs[0]);
  const rtl = isRtlLang(lang);
  const t = (v: LocalizedText | undefined) => resolveLocalized(v, lang);
  const ui = (k: string) => siteUi(lang, k);

  const orgName = config.orgName || 'מאור';
  const heroIcon = site.icon || config.emoji;
  const donate = siteDonateUrl(config);
  const camp = useMemo(() => campaignProgress(site.campaign, Date.now()), [site.campaign]);

  // reveal-on-scroll
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current; if (!root) return;
    const els = Array.from(root.querySelectorAll('.ps-rev'));
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [lang]);

  // מחשבון-תרומה
  const calcUnit = site.calc?.unitAmount && site.calc.unitAmount > 0 ? site.calc.unitAmount : 0;
  const [calcAmt, setCalcAmt] = useState(180);
  const calcQty = calcUnit ? Math.max(0, Math.round(calcAmt / calcUnit)) : 0;

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // טופס-קשר → wa/mailto (בלי backend)
  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: '' });
  const submitForm = () => {
    const lines = [
      form.subject && `נושא: ${form.subject}`,
      form.name && `שם: ${form.name}`,
      form.phone && `טלפון: ${form.phone}`,
      form.email && `אימייל: ${form.email}`,
    ].filter(Boolean).join('\n');
    const msg = `פנייה מהאתר של ${orgName}\n${lines}`;
    const wa = site.contact?.whatsapp ? waHref(site.contact.whatsapp) : null;
    if (wa) window.open(`${wa}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    else if (site.contact?.email) window.location.href = `mailto:${site.contact.email}?subject=${encodeURIComponent('פנייה מהאתר')}&body=${encodeURIComponent(msg)}`;
  };

  const stats = site.stats ?? [];
  const services = site.services ?? [];
  const tiers = site.tiers ?? [];
  const testimonials = site.testimonials ?? [];
  const faq = site.faq ?? [];
  const events = site.events ?? [];
  const partners = site.partners ?? [];
  const gallery = site.gallery ?? [];
  const marquee = (site.marquee ?? []).map((m) => t(m)).filter(Boolean);
  const story = t(site.story);
  const newsSingle = typeof site.news === 'string' || (site.news && !Array.isArray(site.news)) ? t(site.news as LocalizedText) : '';
  const tagline = t(site.tagline);
  const titleAccent = t(site.titleAccent);
  const donateLabel = `💗 ${ui('donate')}`;

  const DonateBtn = ({ big, cls }: { big?: boolean; cls?: string }) =>
    donate ? <a className={`ps-btn ${big ? 'lg' : ''} ${cls || ''}`} href={donate} target="_blank" rel="noopener noreferrer">{donateLabel}</a> : null;

  return (
    <div className="ps" dir={rtl ? 'rtl' : 'ltr'} lang={lang} ref={rootRef}>
      {/* רצועת-קמפיין עליונה */}
      {t(site.ticker) && (
        <div className="ps-ticker"><span>🎗 {t(site.ticker)}</span></div>
      )}

      {/* ניווט */}
      <header className="ps-nav">
        <div className="ps-brand">
          {config.logoDataUri ? <img src={config.logoDataUri} alt="" className="ps-logo" /> : heroIcon ? <span className="ps-brand-ic" aria-hidden>{heroIcon}</span> : null}
          <span className="ps-org">{orgName}</span>
        </div>
        <div className="ps-nav-tools">
          {langs.length > 1 && (
            <div className="ps-langs" role="group" aria-label="שפה">
              {langs.map((l) => <button key={l} type="button" className={'ps-lang' + (l === lang ? ' on' : '')} onClick={() => setLang(l)} aria-pressed={l === lang}>{LANG_LABEL[l]}</button>)}
            </div>
          )}
          <button type="button" className="ps-enter" onClick={onEnter}>{ui('enter')}</button>
          <DonateBtn />
        </div>
      </header>

      {/* HERO */}
      <section className="ps-hero">
        <div className="ps-hero-txt ps-rev">
          {(heroIcon || t(site.heroBadge)) && (
            <div className="ps-badge">{heroIcon && <span aria-hidden>{heroIcon}</span>}{t(site.heroBadge)}</div>
          )}
          <h1 className="ps-h1">
            {t(site.heroTitle) || orgName}
            {titleAccent && <><br /><span className="ps-accentword">{titleAccent}</span></>}
          </h1>
          {tagline && <p className="ps-lead">{tagline}</p>}
          <div className="ps-hero-cta">
            <DonateBtn big />
            <a className="ps-btn lg ghost" href="#ps-contact">{ui('contact')}</a>
          </div>
          {t(site.microCopy) && <div className="ps-micro">{t(site.microCopy)}</div>}
        </div>
        <div className="ps-hero-media ps-rev">
          {site.heroImage
            ? <img src={site.heroImage} alt="" loading="eager" />
            : <div className="ps-hero-ph" aria-hidden><span>{heroIcon || '💗'}</span></div>}
        </div>
      </section>

      {/* מרקיזה */}
      {marquee.length > 0 && (
        <div className="ps-marquee" aria-hidden>
          <div className="ps-marquee-row">
            {[...marquee, ...marquee].map((m, i) => <span className="ps-marquee-item" key={i}>{m}<i>♡</i></span>)}
          </div>
        </div>
      )}

      {/* שירותים */}
      {services.length > 0 && (
        <section className="ps-sec" id="ps-services">
          <div className="ps-ey ps-rev">{ui('services')} ♡</div>
          <h2 className="ps-h2 ps-rev">{t(site.servicesHeading) || (rtl ? 'דרכים לחבק משפחה' : 'How we help')}</h2>
          <div className="ps-cards">
            {services.map((s, i) => (
              <div className="ps-card ps-rev" key={i} style={{ transitionDelay: `${(i % 3) * 70}ms` }}>
                {s.icon && <div className="ps-card-ic" aria-hidden>{s.icon}</div>}
                <h3 className="ps-card-t">{t(s.title)}</h3>
                {t(s.text) && <p className="ps-card-x">{t(s.text)}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* מונים — רצועת-קורל */}
      {stats.length > 0 && (
        <section className="ps-band ps-rev">
          <div className="ps-ey light">{rtl ? 'האהבה הזאת נספרת' : 'Love, counted'}</div>
          <div className="ps-stats">
            {stats.map((s, i) => (
              <div className="ps-stat" key={i}>
                <StatNum value={s.value} />
                <div className="ps-stat-l">{t(s.label)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* שקיפות */}
      {(t(site.transparency?.heading) || t(site.transparency?.text)) && (
        <section className="ps-sec center ps-rev">
          <h2 className="ps-h2">{t(site.transparency?.heading) || (rtl ? 'כל שקל מתועד' : 'Every shekel tracked')}</h2>
          {t(site.transparency?.text) && <p className="ps-body">{t(site.transparency?.text)}</p>}
          {site.transparency?.reportsUrl && <a className="ps-btn ghost" href={site.transparency.reportsUrl} target="_blank" rel="noopener noreferrer">{rtl ? 'לדו״חות הפתוחים' : 'Open reports'} ←</a>}
        </section>
      )}

      {/* סיפור */}
      {story && (
        <section className="ps-sec center ps-story ps-rev">
          <div className="ps-quote" aria-hidden>❝</div>
          <h2 className="ps-h2">{ui('story')}</h2>
          <p className="ps-body big">{story}</p>
        </section>
      )}

      {/* מחשבון-תרומה */}
      {calcUnit > 0 && (
        <section className="ps-sec center ps-rev">
          <h2 className="ps-h2">{rtl ? 'כמה חסד יוצא משקל אחד?' : 'What one shekel does'}</h2>
          <div className="ps-calc">
            <div className="ps-calc-amts">
              {[54, 100, 180, 360].map((a) => (
                <button key={a} type="button" className={'ps-calc-b' + (calcAmt === a ? ' on' : '')} onClick={() => setCalcAmt(a)}>₪{a}</button>
              ))}
            </div>
            <div className="ps-calc-out">
              <span className="ps-calc-eq">₪{calcAmt.toLocaleString('he-IL')} =</span>
              <span className="ps-calc-qty">{calcQty.toLocaleString('he-IL')}</span>
              <span className="ps-calc-unit">{t(site.calc?.unit) || (rtl ? 'ארוחות' : 'meals')} ♡</span>
            </div>
            {t(site.calc?.note) && <div className="ps-calc-note">{t(site.calc?.note)}</div>}
            <DonateBtn big />
          </div>
        </section>
      )}

      {/* קמפיין */}
      {camp.show && (
        <section className="ps-sec ps-rev">
          <div className="ps-camp">
            {t(site.campaign?.title) && <h2 className="ps-h2 center">{t(site.campaign?.title)}</h2>}
            <div className="ps-track"><div className="ps-fill" style={{ width: camp.pct + '%' }}><i /></div></div>
            <div className="ps-camp-row">
              <span>{rtl ? 'נאספו' : 'Raised'} <b>{camp.currency}{camp.raised.toLocaleString('he-IL')}</b></span>
              <span className="ps-camp-pct">{camp.pct}%</span>
              <span className="ps-camp-goal">{rtl ? 'יעד' : 'Goal'} {camp.currency}{camp.goal.toLocaleString('he-IL')}</span>
            </div>
            {camp.daysLeft !== null && <div className="ps-camp-days">⏳ {rtl ? `הקמפיין נסגר בעוד ${camp.daysLeft} ימים` : `${camp.daysLeft} days left`}</div>}
            <div className="center"><DonateBtn big /></div>
          </div>
        </section>
      )}

      {/* גלריה */}
      {gallery.length > 0 && (
        <section className="ps-sec ps-rev">
          <div className="ps-ey center">{rtl ? 'מהשטח, בגובה הלב' : 'From the field'} ♡</div>
          <div className="ps-gal">
            {gallery.map((src, i) => <div className="ps-gcell" key={i}><img src={src} alt="" loading="lazy" /></div>)}
          </div>
        </section>
      )}

      {/* עדויות */}
      {testimonials.length > 0 && (
        <section className="ps-sec ps-rev">
          <div className="ps-ey center">{rtl ? 'מילים מהלב' : 'From the heart'} ♡</div>
          <div className="ps-tst">
            {testimonials.map((tt, i) => (
              <figure className="ps-tst-c" key={i}>
                <div className="ps-tst-q" aria-hidden>❝</div>
                <blockquote>{t(tt.quote)}</blockquote>
                <figcaption>{tt.author}{t(tt.role) && <span> · {t(tt.role)}</span>}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* מסלולי-שותפות */}
      {tiers.length > 0 && (
        <section className="ps-sec ps-rev" id="ps-tiers">
          <div className="ps-ey center">{rtl ? 'מסלולי שותפות' : 'Partnership'} ♡</div>
          <h2 className="ps-h2 center">{rtl ? 'בחרו איך להיות בפנים' : 'Choose your way in'}</h2>
          <div className="ps-tiers">
            {tiers.map((tr, i) => (
              <div className={'ps-tier' + (tr.featured ? ' feat' : '')} key={i}>
                {tr.featured && <div className="ps-tier-tag">{rtl ? 'הכי אהוב ♡' : 'Most loved ♡'}</div>}
                <h3 className="ps-tier-n">{t(tr.name)}</h3>
                {tr.amount !== undefined && <div className="ps-tier-p">₪{tr.amount.toLocaleString('he-IL')}<small>{t(tr.period) || (rtl ? '/ חודש' : '/mo')}</small></div>}
                {tr.perks && <ul className="ps-tier-perks">{tr.perks.map((p, j) => <li key={j}>♡ {t(p)}</li>)}</ul>}
                <a className={'ps-btn ' + (tr.featured ? '' : 'ghost')} href={tr.url || donate || '#ps-contact'} target={tr.url || donate ? '_blank' : undefined} rel="noopener noreferrer">{rtl ? 'להצטרפות' : 'Join'}</a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* אירועים */}
      {events.length > 0 && (
        <section className="ps-sec ps-rev">
          <div className="ps-ey center">{rtl ? 'אירועים קרובים' : 'Upcoming'} ♡</div>
          <div className="ps-events">
            {events.map((e, i) => (
              <a className="ps-event" key={i} href={e.url || '#ps-contact'} target={e.url ? '_blank' : undefined} rel="noopener noreferrer">
                {e.date && <div className="ps-event-d">{e.date}</div>}
                <div className="ps-event-b"><div className="ps-event-t">{t(e.title)}</div>{t(e.meta) && <div className="ps-event-m">{t(e.meta)}</div>}</div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* מה חדש */}
      {newsSingle && (
        <section className="ps-sec ps-rev">
          <div className="ps-news"><span className="ps-news-b">{ui('news')} ✎</span><p>{newsSingle}</p></div>
        </section>
      )}

      {/* שותפים */}
      {partners.length > 0 && (
        <section className="ps-sec ps-rev">
          <div className="ps-ey center">{rtl ? 'שותפים לדרך' : 'Our partners'} ♡</div>
          <div className="ps-partners">
            {partners.map((p, i) => p.logo
              ? <a key={i} href={p.url || '#'} target="_blank" rel="noopener noreferrer" title={p.name}><img src={p.logo} alt={p.name} loading="lazy" /></a>
              : <span className="ps-partner-n" key={i}>{p.name}</span>)}
          </div>
        </section>
      )}

      {/* שאלות */}
      {faq.length > 0 && (
        <section className="ps-sec ps-rev">
          <div className="ps-ey center">{rtl ? 'שאלו אותנו הכול' : 'Ask us anything'} ♡</div>
          <h2 className="ps-h2 center">{rtl ? 'שאלות נפוצות' : 'FAQ'}</h2>
          <div className="ps-faq">
            {faq.map((f, i) => (
              <div className={'ps-faq-i' + (openFaq === i ? ' open' : '')} key={i}>
                <button type="button" className="ps-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i}>
                  <span>{t(f.q)}</span><i aria-hidden>{openFaq === i ? '−' : '+'}</i>
                </button>
                {openFaq === i && <div className="ps-faq-a">{t(f.a)}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* טופס-קשר */}
      <section className="ps-sec ps-rev" id="ps-contact">
        <div className="ps-ey center">{ui('contact')} ♡</div>
        <h2 className="ps-h2 center">{rtl ? 'דברו איתנו' : 'Talk to us'}</h2>
        {t(site.contactForm?.note) && <p className="ps-body center">{t(site.contactForm?.note)}</p>}
        <div className="ps-form">
          <div className="ps-form-row">
            <input className="ps-in" placeholder={rtl ? 'שם מלא' : 'Full name'} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="ps-in" placeholder={rtl ? 'טלפון' : 'Phone'} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="ps-form-row">
            <input className="ps-in" placeholder={rtl ? 'אימייל' : 'Email'} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="ps-in" placeholder={rtl ? 'במה מדובר?' : 'Subject'} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
          <button type="button" className="ps-btn lg" onClick={submitForm}>{rtl ? 'שליחה' : 'Send'} 💗</button>
        </div>
        <div className="ps-contact-chips">
          {(site.contact?.phones ?? []).map((p, i) => <a className="ps-chip" key={i} href={'tel:' + p.replace(/\s/g, '')}>📞 {p}</a>)}
          {site.contact?.whatsapp && waHref(site.contact.whatsapp) && <a className="ps-chip" href={waHref(site.contact.whatsapp)!} target="_blank" rel="noopener noreferrer">💬 {ui('whatsapp')}</a>}
          {site.contact?.email && <a className="ps-chip" href={'mailto:' + site.contact.email}>✉️ {site.contact.email}</a>}
          {t(site.contact?.address) && <span className="ps-chip">📍 {t(site.contact?.address)}</span>}
        </div>
      </section>

      {/* פוטר */}
      <footer className="ps-foot">
        <div className="ps-foot-cta ps-rev">
          <h2 className="ps-h2">{rtl ? 'כל שקל. כל שבוע. כל משפחה.' : 'Every shekel. Every family.'}</h2>
          <DonateBtn big />
        </div>
        <div className="ps-foot-b">
          <span>{orgName}{config.orgTaxId ? ` · ${config.orgTaxId}` : ''}</span>
          <span>{ui('poweredBy')}</span>
        </div>
      </footer>
    </div>
  );
}
