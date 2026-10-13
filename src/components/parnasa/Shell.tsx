/**
 * 📒 פרנסה׳לע — השלד של המקור (עיצוב 1): פס-הסאטן הבורדו עם תפר-הזהב, הפושקע שמתמלא בעזרת-החודש, סימן-המילה
 * פרנסה◆לע (גרש-יהלום זוהר), "ב״ה" והתאריך העברי, שם-הקהילה, תפריט-התצוגה (אותיות גדולות · מצב לילה · צלילים),
 * שורת-ההקדשה הגוללת, באנר-השבת עם הנרות, פס-הלשוניות הצף עם המחוון-הזהב והמונים, והקולופון. הנוסח מילה במילה
 * מהמקור (parnasale.html L2134–2158, L2160–2161, L2400–2410). מבנה ה-DOM והמחלקות = המקור בקידומת pn-.
 */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { cx, Ic, Pm, vars } from './skin';
import { PN_BRAND, PN_TAGLINE } from './shell';

/** סימן-המילה: הגרש כיהלום-זהב (רק כשבשם יש גרש — שם מותאם בלי גרש ⇒ טקסט רגיל באותו סגנון). */
export function Wordmark(props: { name: string; className?: string }) {
  const i = props.name.indexOf('׳');
  if (i <= 0) return <>{props.name}</>;
  return (
    <>
      {props.name.slice(0, i)}
      <i className="pn-gm" />
      {props.name.slice(i + 1)}
    </>
  );
}

/** הפושקע שבפס (svg של המקור L2137–2145): הזהב עולה לפי עזרת-החודש; לחיצה ⇒ ההודעה של החודש. */
function HeaderPushke(props: { goldH: number; bump: string; title: string; onTap: () => void }) {
  return (
    <span
      className={cx('pn-pm pn-pk pn-brandMark', props.bump && 'pn-' + props.bump)}
      role="button"
      tabIndex={0}
      aria-label="הפושקע של הקהילה"
      title={props.title}
      onClick={props.onTap}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          props.onTap();
        }
      }}
    >
      <svg viewBox="20 46 80 64" focusable="false" aria-hidden="true">
        <ellipse cx="60" cy="105" rx="36" ry="2.6" fill="#000" opacity=".35" />
        <rect x="28" y="70" width="64" height="32" fill="#9b1d38" />
        <rect x="28" y="70" width="64" height="32" fill="url(#pn-c-pkShade)" />
        <rect className="pn-pkGold" x="28" y={102 - props.goldH} width="64" height={props.goldH} fill="url(#pn-c-pkPlate)" opacity=".92" />
        <rect x="32.5" y="74.5" width="55" height="23" rx="2.5" fill="none" stroke="#f0d48a" strokeWidth="1.2" strokeDasharray="2 1.2" />
        <path d="M36 54 H84 L94 64 H26 Z" fill="url(#pn-c-pkLid)" />
        <path d="M26 64 L36 54 H84 L94 64" fill="none" stroke="#f0d48a" strokeWidth="1.4" strokeLinejoin="round" />
        <rect x="38" y="55.6" width="44" height="7.2" rx="3.6" fill="url(#pn-c-pkPlate)" />
        <rect className="pn-cnSlot" x="41.5" y="57.2" width="37" height="4" rx="2" fill="#140207" />
        <rect x="24" y="63.5" width="72" height="6.5" rx="1.5" fill="url(#pn-c-pkPlate)" />
        <rect x="24" y="101" width="72" height="5.5" rx="1.5" fill="url(#pn-c-pkPlate)" />
        <g transform="rotate(-4 60 86)">
          <rect x="44" y="78.5" width="32" height="15" rx="1" fill="#f6eedd" />
          <path d="M48 87.5 C55 89 64 89 71 87" stroke="#2b2742" strokeWidth="1.2" fill="none" opacity=".5" strokeLinecap="round" />
        </g>
        <circle cx="74" cy="80" r="3.6" fill="url(#pn-c-pkWax)" />
      </svg>
    </span>
  );
}

/** שורת-ההקדשה: שורה דקה; גוללת לאט רק כשלא נכנסת (נעצרת בריחוף/מיקוד; עומדת בתנועה-מופחתת ובשבת). */
function Dedication(props: { text: string; tnzvh: boolean; still: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLSpanElement>(null);
  const [run, setRun] = useState<{ on: boolean; dur: number }>({ on: false, dur: 30 });
  useLayoutEffect(() => {
    const fit = (): void => {
      const dd = box.current;
      const c = first.current;
      if (!dd || !c) return;
      // מודדים בלי "run" (התוכן ברוחב-מלא) — tickFit במקור
      const over = c.scrollWidth > dd.clientWidth - 8;
      setRun({ on: over && !props.still, dur: Math.max(14, Math.round(c.scrollWidth / 34)) });
    };
    fit();
    if (typeof ResizeObserver === 'undefined' || !box.current) return;
    const ro = new ResizeObserver(fit);
    ro.observe(box.current);
    return () => ro.disconnect();
  }, [props.text, props.still]);
  const chunk = (hidden: boolean) => (
    <span className="pn-tk-c" aria-hidden={hidden || undefined} ref={hidden ? undefined : first}>
      {props.text}
      {props.tnzvh ? <small>ת.נ.צ.ב.ה.</small> : null}
    </span>
  );
  return (
    <div ref={box} className={cx('pn-dedic', run.on && 'pn-run')} title={props.text} tabIndex={run.on ? 0 : -1}>
      <div className="pn-tk" style={run.on ? vars({ tkd: run.dur + 's' }) : undefined}>
        {chunk(false)}
        {chunk(true)}
      </div>
    </div>
  );
}

export interface BandProps {
  brand: string;
  community: string;
  hebDate: string;
  dedication: { text: string; tnzvh: boolean };
  calm: boolean;
  reducedMotion: boolean;
  pushke: { goldH: number; title: string; bump: string; onTap: () => void };
  tools: {
    big: boolean;
    dark: boolean;
    mute: boolean;
    onBig: () => void;
    onTheme: () => void;
    onMute: () => void;
  };
}

/** הפס (header.band) — ב״ה + תאריך · פושקע + סימן-המילה + קהילה · כלי-התצוגה; ההקדשה; תפר-הזהב. */
export function Band(props: BandProps) {
  const [open, setOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent): void => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  const t = props.tools;
  return (
    <header className="pn-band">
      <div className="pn-band-in">
        <div className="pn-side">
          <span className="pn-bh">ב״ה</span>
          <span className="pn-hdate">{props.hebDate}</span>
        </div>
        <div className="pn-brand">
          <HeaderPushke {...props.pushke} />
          <div className="pn-bt">
            <h1 className="pn-wm">
              <span className="pn-sr">{props.brand}</span>
              <span className="pn-pwm pn-t" aria-hidden="true">
                <Wordmark name={props.brand} />
              </span>
              <span className="pn-s" aria-hidden="true">
                <Wordmark name={props.brand} />
              </span>
            </h1>
            <div className="pn-comm">{props.community || PN_TAGLINE}</div>
          </div>
        </div>
        <div className="pn-tools" ref={toolsRef}>
          <button className="pn-tb pn-tmenu" type="button" aria-expanded={open} aria-label="הגדרות תצוגה" onClick={() => setOpen(!open)}>
            <Ic n="dots" />
          </button>
          <div className={cx('pn-tools-pop', open && 'pn-open')}>
            <button className="pn-tb" type="button" aria-pressed={t.big} aria-label="אותיות גדולות" title="אותיות גדולות" onClick={t.onBig}>
              <span className="pn-aa">
                א<small>א</small>
              </span>
              <span className="pn-tl">אותיות גדולות</span>
            </button>
            <button
              className="pn-tb"
              type="button"
              aria-pressed={t.dark}
              aria-label={t.dark ? 'תצוגה בהירה' : 'תצוגה כהה'}
              title="תצוגה בהירה או כהה"
              onClick={t.onTheme}
            >
              <Ic n={t.dark ? 'sun' : 'moon'} />
              <span className="pn-tl">{t.dark ? 'מצב יום' : 'מצב לילה'}</span>
            </button>
            <button
              className="pn-tb pn-mute"
              type="button"
              aria-pressed={t.mute}
              aria-label={t.mute ? 'הפעלת צלילים' : 'השתקת צלילים'}
              title="צלילי המטבעות"
              onClick={t.onMute}
            >
              <svg className="pn-i" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" fillOpacity=".25" />
                <g className="pn-on">
                  <path d="M15.5 9a4 4 0 0 1 0 6" />
                  <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
                </g>
                <g className="pn-off">
                  <path d="M16 9.5l5 5M21 9.5l-5 5" />
                </g>
              </svg>
              <span className="pn-tl">צלילים</span>
            </button>
          </div>
        </div>
      </div>
      {props.dedication.text ? <Dedication text={props.dedication.text} tnzvh={props.dedication.tnzvh} still={props.calm || props.reducedMotion} /> : null}
      <div className="pn-edge" aria-hidden="true" />
    </header>
  );
}

/** באנר-השבת (div.calm): שני נרות + "שבת שלום" — בשבת/יו״ט (סגירת-המנוע, באזור-הזמן של הקהילה). */
export function CalmBanner(props: { kind: 'shabbat' | 'yomtov' | ''; reason: string; brand: string }) {
  const chag = props.kind === 'yomtov';
  return (
    <div className="pn-calm" role="status">
      <div className="pn-candles" aria-hidden="true">
        <span className="pn-candle" />
        <span className="pn-candle" />
      </div>
      <div>
        <b className="pn-gold-t">{chag ? 'חג שמח' : 'שבת שלום'}</b>
        <span>
          {chag
            ? 'האלפון במנוחה. בעלי המקצוע חוזרים במוצאי ' + props.reason + '. אפשר לשמור מספרים ולחזור אחר כך.'
            : 'האלפון במנוחה. בעלי המקצוע חוזרים במוצאי שבת קודש. אפשר לשמור מספרים ולחזור אחר כך.'}
        </span>
      </div>
    </div>
  );
}

export interface TabDef<K extends string> {
  key: K;
  label: string;
  icon: string;
  badge?: number;
}

/** פס-הלשוניות הצף (nav.tabbar): מחוון-זהב שקופץ בין הלשוניות (--n / --i), אייקונים, מונים בקטיפה. */
export function TabBar<K extends string>(props: { tabs: TabDef<K>[]; active: K; onGo: (k: K) => void }) {
  const i = Math.max(
    0,
    props.tabs.findIndex((t) => t.key === props.active),
  );
  return (
    <nav className="pn-tabbar" role="tablist" aria-label="ניווט">
      <span className="pn-ind" aria-hidden="true" style={vars({ n: props.tabs.length, i })} />
      {props.tabs.map((t) => (
        <button
          key={t.key}
          className="pn-tab"
          role="tab"
          type="button"
          aria-selected={t.key === props.active}
          data-tab={t.key}
          onClick={() => props.onGo(t.key)}
        >
          <Ic n={t.icon} />
          <span>{t.label}</span>
          <b className="pn-bdg">{t.badge ? String(t.badge) : ''}</b>
        </button>
      ))}
    </nav>
  );
}

/** הקולופון (footer.colophon) — המותג, "נבנה לתועלת הקהילה", ושורת-הפרסום לגבאי. */
export function Colophon(props: { brand: string; contactPhone: string }) {
  const ph = props.contactPhone.trim();
  return (
    <footer className="pn-colophon">
      <div className="pn-fbrand">
        <Pm />
        <span>
          <b>{props.brand}</b>
          {' · ' + PN_TAGLINE}
        </span>
      </div>
      <span>נבנה לתועלת הקהילה · לחיזוק הפרנסה של אנשינו</span>
      <span className="pn-adv">
        {'לחסות על שער, להקדשה ולפרסום בחוברת השנתית: פנו לגבאי'}
        {ph ? (
          <>
            {' בטלפון '}
            <span className="pn-ltr">{ph}</span>
          </>
        ) : null}
      </span>
    </footer>
  );
}

/** עמוד-פנימי (div.page / div.pagew) עם כותרת-המקור (div.ph: kicker · h1 · p). */
export function Page(props: { k?: string; title?: string; sub?: string; wide?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={cx(props.wide ? 'pn-pagew' : 'pn-page', props.className)}>
      {props.title ? (
        <div className="pn-ph">
          {props.k ? <div className="pn-k">{props.k}</div> : null}
          <h1>{props.title}</h1>
          {props.sub ? <p>{props.sub}</p> : null}
        </div>
      ) : null}
      {props.children}
    </div>
  );
}

export { PN_BRAND };
