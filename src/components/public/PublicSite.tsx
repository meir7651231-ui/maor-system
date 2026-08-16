/**
 * האתר-הציבורי (dashboard-נחיתה) — **מוזן ישירות מהקונפיג של הארגון**.
 * ציבורי לגמרי: מוצג ב-App לפני שער-הענן/ההתחברות (המבקר לא צריך חשבון).
 * קורא רק את config (מיתוג + config.site) ואופציונלית את מונה-המשפחות המקומי
 * (מספר בלבד, בלי PII). מגודר shell.publicsite + ‎?site‎ בכתובת.
 *
 * רב-לשוני (עברית/אנגלית/אידיש), ערכת-נושא-מודעת (יורש --accent מהערכה),
 * ומכבד prefers-reduced-motion (בלי ספירה/החלפת-מילים כשמבקשים פחות-תנועה).
 */
import { useEffect, useMemo, useState } from 'react';
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

/** מונה עולה מ-0 ליעד; מכבד reduced-motion (קפיצה מיידית). */
function useCountUp(target: number, active: boolean): number {
  const [val, setVal] = useState(active ? 0 : target);
  useEffect(() => {
    if (!active) {
      setVal(target);
      return;
    }
    if (prefersReducedMotion()) {
      setVal(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 1100;
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

function StatCard({ value, label, lang }: { value: string; label: string; lang: SiteLang }) {
  const { num, prefix, suffix } = useMemo(() => splitStat(value), [value]);
  const shown = useCountUp(num ?? 0, num !== null);
  void lang;
  return (
    <div className="psite-stat">
      <div className="psite-stat-num">
        {num !== null ? prefix + shown.toLocaleString('he-IL') + suffix : value}
      </div>
      <div className="psite-stat-label">{label}</div>
    </div>
  );
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
    const id = window.setInterval(() => setWordIdx((i) => (i + 1) % words.length), 2600);
    return () => window.clearInterval(id);
  }, [words.length]);

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

  return (
    <div className="psite" dir={rtl ? 'rtl' : 'ltr'} lang={lang}>
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
        <div className="psite-hero-bg" aria-hidden />
        <div className="psite-hero-inner">
          {config.emoji && <div className="psite-hero-emoji" aria-hidden>{config.emoji}</div>}
          <h1 className="psite-hero-title">{orgName}</h1>
          {words.length > 0 && (
            <div className="psite-hero-word" aria-live="off">{words[wordIdx % words.length]}</div>
          )}
          {tagline && <p className="psite-hero-tagline">{tagline}</p>}
          <div className="psite-hero-cta">
            {donate && (
              <a className="psite-cta" href={donate} target="_blank" rel="noopener noreferrer">
                💛 {ui('donate')}
              </a>
            )}
            <a className="psite-cta ghost" href="#psite-contact">{ui('contact')}</a>
          </div>
        </div>
      </section>

      {/* ── מוני-השפעה ── */}
      {(stats.length > 0 || liveStat) && (
        <section className="psite-stats">
          {liveStat && <StatCard value={liveStat.value} label={liveStat.label} lang={lang} />}
          {stats.map((s, i) => (
            <StatCard key={i} value={s.value} label={t(s.label)} lang={lang} />
          ))}
        </section>
      )}

      {/* ── קמפיין ── */}
      {camp.show && (
        <section className="psite-campaign">
          <div className="psite-campaign-card">
            {t(site.campaign?.title) && <h2 className="psite-h2">{t(site.campaign?.title)}</h2>}
            <div className="psite-bar-track" role="img" aria-label={`${camp.pct}%`}>
              <div className="psite-bar-fill" style={{ width: camp.pct + '%' }} />
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
          <h2 className="psite-h2 center">{ui('services')}</h2>
          <div className="psite-services">
            {services.map((s, i) => (
              <div className="psite-service" key={i}>
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
        <section className="psite-section psite-story">
          <h2 className="psite-h2 center">{ui('story')}</h2>
          <p className="psite-story-text">{story}</p>
        </section>
      )}

      {/* ── מה חדש ── */}
      {news && (
        <section className="psite-section">
          <div className="psite-news">
            <span className="psite-news-badge">{ui('news')}</span>
            <p>{news}</p>
          </div>
        </section>
      )}

      {/* ── גלריה ── */}
      {gallery.length > 0 && (
        <section className="psite-section">
          <h2 className="psite-h2 center">{ui('gallery')}</h2>
          <div className="psite-gallery">
            {gallery.map((src, i) => (
              <img key={i} src={src} alt="" loading="lazy" className="psite-gimg" />
            ))}
          </div>
        </section>
      )}

      {/* ── קשר ── */}
      <section className="psite-section psite-contact" id="psite-contact">
        <h2 className="psite-h2 center">{ui('contact')}</h2>
        <div className="psite-contact-grid">
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
          <div className="psite-contact-cta">
            <a className="psite-cta" href={donate} target="_blank" rel="noopener noreferrer">💛 {ui('donate')}</a>
          </div>
        )}
      </section>

      <footer className="psite-foot">
        <span>{orgName}{config.orgTaxId ? ` · ${config.orgTaxId}` : ''}</span>
        <span className="psite-foot-by">{ui('poweredBy')}</span>
      </footer>
    </div>
  );
}
