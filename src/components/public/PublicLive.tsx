/**
 * 📡 «שידור חי — מה קורה עכשיו בבית» באתר-הציבורי (3.11.2026, בקשת-בעלים; עיצוב לפי ההדמיה שאושרה).
 * מציג רק את מה שהמנהל פרסם בעריכת-האתר (site.live): כרטיסים · טבעת «גויסו השנה» (רק כשסימן «מוצג») ·
 * פס «היום» · «השבוע בבית» · פס-עדכונים. מספרים כוללים בלבד — הנתונים נבחרו ואושרו בעורך, אין כאן חישוב.
 */
import type { CSSProperties } from 'react';
import type { LocalizedText, PublicSiteLive } from '../../types/config';

const TNUM: CSSProperties = { fontFeatureSettings: "'tnum' 1" };
const RING_C = 2 * Math.PI * 84;

/** האם יש מה להציג (מופעל + לפחות פריט גלוי אחד). טהור. */
export function liveVisible(live: PublicSiteLive | undefined): boolean {
  if (!live?.enabled) return false;
  const cards = (live.cards ?? []).filter((c) => !c.hidden).length;
  const today = (live.today ?? []).filter((c) => !c.hidden).length;
  const raised = !!live.raised?.show && (live.raised.value ?? 0) > 0;
  return cards + today > 0 || raised || (live.week?.length ?? 0) > 0 || (live.ticker?.length ?? 0) > 0;
}

export function PublicLive(props: {
  live: PublicSiteLive;
  t: (v: LocalizedText | undefined) => string;
  he: (heTxt: string, enTxt: string, esTxt?: string, frTxt?: string) => string;
  sec: CSSProperties;
  cardS: CSSProperties;
  grad: string;
  donateHref: string;
  donateAttrs: { target?: string; rel?: string };
  give: string;
  commercial: boolean;
}) {
  const { live, t, he, sec, cardS, grad } = props;
  const cards = (live.cards ?? []).filter((c) => !c.hidden);
  const today = (live.today ?? []).filter((c) => !c.hidden);
  const week = live.week ?? [];
  const ticker = (live.ticker ?? []).map((x) => t(x)).filter(Boolean);
  const raisedOn = !!live.raised?.show && (live.raised?.value ?? 0) > 0;
  const raised = live.raised?.value ?? 0;
  const goal = live.raised?.goal ?? 0;
  const pct = goal > 0 ? Math.min(1, raised / goal) : null;
  const ils = (n: number) => '₪' + Math.round(n).toLocaleString('he-IL');
  const asOf = live.asOf ? live.asOf.split('-').reverse().join('/') : '';
  const title = t(live.title) || he('מה קורה עכשיו בבית.', "What's happening at home now.");
  const tRow = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 46, padding: '13px 23px', fontWeight: 600, fontSize: 14.5, color: 'var(--c3)' }}>
      {ticker.map((m, i) => <span key={i}>{m}</span>)}
    </span>
  );
  return (
    <section id="live" className="ps-rev" style={sec}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid rgba(var(--r1),.35)', borderRadius: 999, padding: '7px 14px', fontWeight: 700, fontSize: 14, color: 'var(--c3)' }}>
        <span className="ps-live-dot" aria-hidden />
        {he('שידור חי · מתעדכן מהמערכת', 'Live · updated from our system')}
      </span>
      <h2 style={{ fontFamily: "'Varela Round'", fontWeight: 400, fontSize: 'clamp(32px,4.6vw,54px)', lineHeight: 1.12, margin: '16px 0 6px', color: 'var(--ci)' }}>{title}</h2>
      {asOf && <p style={{ margin: '0 0 30px', color: 'rgba(var(--ri),.6)', fontSize: 15.5 }}>{he(`נכון ל-${asOf} · כל מספר נספר מהפעילות האמיתית של הבית`, `As of ${asOf} · every number is counted from the home's real activity`, `Al ${asOf} · cada número se cuenta de la actividad real del hogar`, `Au ${asOf} · chaque chiffre est compté à partir de l'activité réelle du foyer`)}</p>}

      {(raisedOn || cards.length > 0) && (
        <div className={raisedOn && cards.length ? 'ps-live-top' : undefined} style={{ display: 'grid', gridTemplateColumns: raisedOn && cards.length ? 'minmax(0,1.05fr) minmax(0,1.6fr)' : '1fr', gap: 22 }}>
          {raisedOn && (
            <div style={{ ...cardS, padding: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              {pct !== null ? (
                <svg viewBox="0 0 200 200" role="img" aria-label={he(`גויסו השנה ${ils(raised)} מתוך ${ils(goal)}`, `Raised this year ${ils(raised)} of ${ils(goal)}`, `Recaudado este año ${ils(raised)} de ${ils(goal)}`, `Collecté cette année ${ils(raised)} sur ${ils(goal)}`)} style={{ width: 'min(230px,60vw)', height: 'auto' }}>
                  <defs><linearGradient id="ps-live-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style={{ stopColor: 'var(--c1)' }} /><stop offset="1" style={{ stopColor: 'var(--c2)' }} /></linearGradient></defs>
                  <circle cx="100" cy="100" r="84" fill="none" stroke="var(--ck)" strokeWidth="16" />
                  <circle cx="100" cy="100" r="84" fill="none" stroke="url(#ps-live-g)" strokeWidth="16" strokeLinecap="round" strokeDasharray={RING_C} strokeDashoffset={RING_C * (1 - pct)} transform="rotate(-90 100 100)" />
                  <text x="100" y="98" textAnchor="middle" style={{ fontFamily: "'Rubik'", fontWeight: 800, fontSize: 34, fill: 'var(--ci)' }}>{Math.round(pct * 100)}%</text>
                  <text x="100" y="124" textAnchor="middle" style={{ fontSize: 13, fill: 'rgba(var(--ri),.55)' }}>{he('מהיעד השנתי', 'of the yearly goal')}</text>
                </svg>
              ) : (
                <p style={{ fontFamily: "'Rubik'", fontWeight: 800, fontSize: 'clamp(36px,4vw,52px)', margin: 0, color: 'var(--ci)', direction: 'ltr', ...TNUM }}>{ils(raised)}</p>
              )}
              <p style={{ margin: '10px 0 0', color: 'rgba(var(--ri),.65)', fontSize: 15 }}>
                {he('גויסו השנה', 'Raised this year')}
                {/* בלי יעד הסכום כבר מוצג בגדול מעל — לא חוזרים עליו */}
                {pct !== null && <> <b style={{ color: 'var(--c3)', ...TNUM }}>{ils(raised)}</b> {he('מתוך', 'of')} <span style={TNUM}>{ils(goal)}</span></>}
              </p>
            </div>
          )}
          {cards.length > 0 && (
            <div className="ps-live-kpis" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(2, cards.length)},minmax(0,1fr))`, gap: 16 }}>
              {cards.map((c, i) => (
                <div key={i} style={{ ...cardS, padding: '22px 22px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  {c.icon && <div aria-hidden style={{ width: 50, height: 50, flex: 'none', borderRadius: 16, background: 'var(--cb)', display: 'grid', placeItems: 'center', fontSize: 24 }}>{c.icon}</div>}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "'Rubik'", fontWeight: 800, fontSize: 'clamp(28px,2.6vw,36px)', lineHeight: 1, direction: 'ltr', unicodeBidi: 'isolate', textAlign: 'start', color: 'var(--ci)', ...TNUM }}>{c.value}</div>
                    <div style={{ fontSize: 15, color: 'rgba(var(--ri),.7)', marginTop: 6 }}>{t(c.label)}</div>
                    {t(c.badge) && <span style={{ display: 'inline-block', marginTop: 8, fontSize: 12, fontWeight: 700, color: 'var(--c3)', background: 'var(--cb)', borderRadius: 999, padding: '3px 10px' }}>{t(c.badge)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {today.length > 0 && (
        <div className="ps-live-today" style={{ ...cardS, marginTop: 22, display: 'grid', gridTemplateColumns: `repeat(${today.length},minmax(0,1fr))`, overflow: 'hidden' }}>
          {today.map((c, i) => (
            <div key={i} style={{ padding: 18, textAlign: 'center', borderInlineStart: i ? '1px solid rgba(var(--r1),.25)' : 'none', background: i === 0 ? grad : 'transparent', color: i === 0 ? '#fff' : 'inherit' }}>
              <div style={{ fontFamily: "'Rubik'", fontWeight: 800, fontSize: 26, direction: 'ltr', unicodeBidi: 'isolate', ...TNUM }}>{c.value}</div>
              <div style={{ fontSize: 13.5, opacity: 0.8 }}>{t(c.label)}</div>
            </div>
          ))}
        </div>
      )}

      {(week.length > 0 || !props.commercial) && (
        <div className="ps-live-row2" style={{ display: 'grid', gridTemplateColumns: week.length ? 'minmax(0,1.6fr) minmax(0,1fr)' : '1fr', gap: 22, marginTop: 22 }}>
          {week.length > 0 && (
            <div style={{ ...cardS, padding: 24 }}>
              <h3 style={{ fontFamily: "'Varela Round'", fontWeight: 400, fontSize: 22, margin: '0 0 14px', color: 'var(--ci)' }}>{he('השבוע בבית ♡', 'This week at home ♡')}</h3>
              {week.map((w, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '11px 0', borderTop: i ? '1px dashed rgba(var(--r1),.3)' : 'none' }}>
                  {w.when && <div style={{ minWidth: 70, textAlign: 'center', flex: 'none', background: 'var(--cb)', borderRadius: 14, padding: '7px 6px', fontWeight: 700, color: 'var(--c3)', fontSize: 13.5 }}>{w.when}</div>}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }}>{t(w.title)}</div>
                    {t(w.note) && <div style={{ fontSize: 13.5, color: 'rgba(var(--ri),.6)' }}>{t(w.note)}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!props.commercial && (
            <div style={{ ...cardS, padding: 26, background: grad, color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 18 }}>
              <div>
                <h3 style={{ fontFamily: "'Varela Round'", fontWeight: 400, fontSize: 22, margin: '0 0 10px' }}>{he('גם אתם יכולים להיות במספר הבא ♡', 'You can be part of the next number ♡')}</h3>
                <p style={{ margin: 0, opacity: 0.92, lineHeight: 1.6 }}>{he('כל תרומה נכנסת ישר לספירה — ומדליקה אור אצל יתום או אלמנה.', 'Every gift goes straight into the count — and brings light to an orphan or a widow.')}</p>
              </div>
              <a href={props.donateHref} {...props.donateAttrs} className="ps-btn" style={{ display: 'block', textAlign: 'center', background: '#fff', color: 'var(--c3)', fontFamily: "'Varela Round'", fontSize: 18, textDecoration: 'none', padding: 15, borderRadius: 999 }}>{props.give}</a>
            </div>
          )}
        </div>
      )}

      {ticker.length > 0 && (
        <div dir="ltr" aria-label={he('עדכונים', 'Updates')} style={{ marginTop: 22, background: 'var(--cm)', borderRadius: 999, overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <div className="ps-marq" style={{ display: 'inline-flex' }}>{tRow}{tRow}</div>
        </div>
      )}
      <p style={{ marginTop: 14, textAlign: 'center', fontSize: 12.5, color: 'rgba(var(--ri),.45)' }}>{he('בלי שמות ובלי פרטים אישיים — רק מספרים כוללים', 'No names or personal details — totals only')}</p>
    </section>
  );
}
