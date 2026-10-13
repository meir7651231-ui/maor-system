/**
 * 📒 פרנסה׳לע — שלושת אזורי-הכסף של "ניהול" בעיצוב המקור (עיצוב 6 · renderRev / renderSpon / renderAds):
 *   · הכנסות — 4 אריחי-KPI ("הכנסה חודשית קבועה" בקטיפה · "חוברת {שנה}" · "ממתין לגבייה" · "צפי לשנה", ספירה-עולה),
 *     הפנקס עם פסי-הזהב (כרטיסים מודגשים · חסויות · הקדשה בראש האלפון · סה״כ לחודש · מודעות בחוברת · משרות
 *     מקודמות) ו"כרטיסים מודגשים" (הטופס + הרשימה: עריכה/חידוש · הסרת ההדגשה).
 *   · חסויות — "חסות על שערים N מתוך 15 · ודף הבית · ומטבע הפלטינה": שורת דף הבית, מטבע הפלטינה ו-15 השערים (כמה אנשי
 *     מקצוע — "שער עמוס שווה יותר", פנוי/בחסות, מחיר, "הגדרה"/"עריכה"); הטופס נפתח מתחת לשורה. תוספות-הפורט: סבב
 *     (כמה נותני-חסות למקום — "➕ לתור", מתחלפים כל יום), תקופה, ו"רשימת החסויות" עם סימון-תשלום וקישור-סליקה.
 *   · מודעות וחוברת — "מודעות לחוברת השנתית": אריחי-סיכום + מד-גבייה, הטופס בדף, והרשימה (סימון כשולם · עריכה ·
 *     מחיקה; 💳 קישור-סליקה מגודר-הרחבה).
 * **רישום בלבד** (הכרעה 4): מחיר + סימון-תשלום ידני; אפס קבלות/מונים/תרומות.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, integrationOn, integrationSetting } from '../../lib/config';
import { useRemembered } from '../../lib/filterMemory';
import type { PrAd, PrListing } from '../../types/domain';
import { useArmed } from '../useArmed';
import { WaBtn } from '../WaBtn';
import { hebcalParts } from '../../lib/telephony/engine';
import { gemYear } from '../../lib/hebrew';
import { adActiveOn, adPayLink, adRotation, categoryOf, coinSponsor, isFeatured, PR_CATEGORIES } from './lib';
import { bookletAdsOf, featuredOpen, featuredPrice, nis, pl, revenueOf } from './admin';
import { AdForm, dmy, FeaturedForm, PN_AD_SIZES, SpForm } from './AdForm';
import { usePrBrand, usePrPerms, type PrNow } from './hooks';
import { miniCoin, monoIcon, monoOf } from './coins';
import { useReducedMotion } from './skinPrefs';
import { cx, Ic, RawHtml } from './skin';

/** אזור-ניהול של המקור (seg) — חסר = הכול. */
export type AdsSection = 'rev' | 'spon' | 'ads';

const SIZE_ONE: Readonly<Record<string, string>> = { full: 'עמוד שלם אחד', half: 'חצי עמוד אחד', small: 'מודעה קטנה אחת' };
const SIZE_MANY: Readonly<Record<string, string>> = { full: 'עמודים שלמים', half: 'חצאי עמוד', small: 'מודעות קטנות' };
const SIZE_NAME: Readonly<Record<string, string>> = Object.fromEntries(PN_AD_SIZES);

/** ספירה-עולה (countUp במקור): 1 שנייה, ease-out; תנועה-מופחתת/אפס ⇒ מיד. */
function CountUp(props: { n: number; fmt: (n: number) => string }) {
  const reduced = useReducedMotion();
  const [v, setV] = useState(props.n);
  const first = useRef(true);
  useEffect(() => {
    const to = Math.round(props.n);
    if (!first.current || reduced || !to || typeof requestAnimationFrame === 'undefined') {
      first.current = false;
      setV(to);
      return;
    }
    first.current = false;
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number): void => {
      const k = Math.min(1, (t - t0) / 1000);
      setV(Math.round(to * (1 - Math.pow(1 - k, 4))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    setV(0);
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [props.n, reduced]);
  return <>{props.fmt(v)}</>;
}

/** מצב-הפרסומת היום (הפורט: פעילה / מושהית / לא בתקופה). */
function adState(a: PrAd, todayIso: string): string {
  return adActiveOn(a, todayIso) ? '' : a.active === false ? 'מושהית' : 'לא בתקופה';
}

/** כפתורי-הכסף של רשומה: סימון/ביטול תשלום · 💳 קישור-סליקה (+ וואטסאפ) — רישום בלבד. */
function PayActions(props: { a: PrAd; payUrl: string; waOn: boolean; brand: string }) {
  const upsertPrAd = useApp((s) => s.upsertPrAd);
  const toast = useApp((s) => s.toast);
  const { a, payUrl } = props;
  const href = payUrl && !a.paid && a.price > 0 ? adPayLink(a, payUrl) : null;
  return (
    <>
      <button
        className={cx('pn-btn', !a.paid && 'pn-primary')}
        type="button"
        onClick={() => {
          if (upsertPrAd({ ...a, paid: !a.paid }).ok) toast(a.paid ? 'הסימון בוטל' : 'התשלום נרשם. תזכו למצוות!');
        }}
      >
        {a.paid ? 'ביטול סימון התשלום' : 'סימון כשולם'}
      </button>
      {href ? (
        <a className="pn-btn pn-ghost2" href={href} target="_blank" rel="noopener noreferrer" aria-label={'קישור-תשלום ל' + a.advertiser + ' — עמוד-הסליקה של הארגון'} title="קישור-תשלום לעמוד-הסליקה (אינו מנפיק קבלה)">
          💳 קישור-תשלום
        </a>
      ) : null}
      {href && props.waOn && a.phone ? <WaBtn phone={a.phone} text={'שלום, לתשלום עבור הפרסום ב' + props.brand + ' (' + nis(a.price) + '): ' + href} title="שליחת קישור-התשלום בוואטסאפ" /> : null}
    </>
  );
}

export function AdsTab(props: { now: PrNow; section?: AdsSection; ftReq?: { key: string; n: number } | null; spReq?: { place: string; n: number } | null }) {
  const sec = props.section;
  return (
    <>
      {!sec || sec === 'rev' ? <RevPanel now={props.now} ftReq={props.ftReq ?? null} /> : null}
      {!sec || sec === 'spon' ? <SponPanel now={props.now} spReq={props.spReq ?? null} /> : null}
      {!sec || sec === 'ads' ? <BookletAdsPanel now={props.now} /> : null}
    </>
  );
}

/* ═══════════════ הכנסות ═══════════════ */

function RevPanel(props: { now: PrNow; ftReq: { key: string; n: number } | null }) {
  const config = useApp((s) => s.config);
  const listings = useApp((s) => s.db.prListings);
  const ads = useApp((s) => s.db.prAds);
  const requests = useApp((s) => s.db.prRequests);
  const prefs = useApp((s) => s.db.ui.parnasa);
  const upsertPrListing = useApp((s) => s.upsertPrListing);
  const toast = useApp((s) => s.toast);
  const { canApprove } = usePrPerms();
  const { armed, confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  const [ftReq, setFtReq] = useState(props.ftReq);
  useEffect(() => setFtReq(props.ftReq), [props.ftReq]);
  const today = props.now.todayIso;
  const R = revenueOf({ listings, ads, requests, prefs }, today);
  const yr = gemYear(hebcalParts(today).year);
  const paidN = R.ads.filter((a) => a.paid).length;
  const mx = Math.max(R.featSum, R.spSum, R.dedSum, 1);
  const row = (t: string, sub: string, amt: number, bar: boolean): ReactNode => (
    <div className="pn-lg-row" key={t}>
      <div className="pn-t">
        {t}
        <small>{sub}</small>
      </div>
      <div className="pn-amt">{nis(amt)}</div>
      {bar ? (
        <div className="pn-bar">
          <i style={{ width: Math.round((amt / mx) * 100) + '%' }} />
        </div>
      ) : null}
    </div>
  );
  function unfeature(l: PrListing) {
    if (!confirmTwice('ft-' + l.id, 'להסיר את ההדגשה של ' + l.name + '?')) return;
    const res = upsertPrListing({ ...l, featuredUntil: '', promoPrice: undefined, promoLine: undefined, promoUrl: undefined, promoNote: undefined });
    if (res.ok) toast('ההדגשה הוסרה');
  }

  return (
    <>
      <div className="pn-kpis">
        <div className="pn-kpi pn-lead">
          <span>הכנסה חודשית קבועה</span>
          <b>
            <CountUp n={R.monthly} fmt={nis} />
          </b>
          <small>מודגשים, חסויות והקדשה</small>
        </div>
        <div className="pn-kpi">
          <span>{'חוברת ' + yr}</span>
          <b>
            <CountUp n={R.adSum} fmt={nis} />
          </b>
          <small>{paidN + ' מתוך ' + R.ads.length + ' מודעות שולמו'}</small>
        </div>
        <div className={cx('pn-kpi', R.due > 0 && 'pn-due')}>
          <span>ממתין לגבייה</span>
          <b>
            <CountUp n={R.due} fmt={nis} />
          </b>
          <small>{R.due ? 'מודעות וחסויות שעוד לא שולמו' : 'הכול נגבה, ברוך ה׳'}</small>
        </div>
        <div className="pn-kpi">
          <span>צפי לשנה</span>
          <b>
            <CountUp n={R.year} fmt={nis} />
          </b>
          <small>לפי המצב היום</small>
        </div>
      </div>
      <div className="pn-ledger">
        <div className="pn-lg-h">הכנסה חודשית</div>
        {row('כרטיסים מודגשים', pl(R.featAct.length, 'כרטיס אחד פעיל', 'פעילים'), R.featSum, true)}
        {row('חסויות', R.gatesOn + ' מתוך ' + PR_CATEGORIES.length + ' שערים' + (R.homeOn ? ' · ודף הבית' : '') + (R.coinOn ? ' · ומטבע הפלטינה' : ''), R.spSum, true)}
        {row('הקדשה בראש האלפון', R.ded ? 'פעילה' : 'פנויה', R.dedSum, true)}
        <div className="pn-lg-row pn-sum">
          <div className="pn-t">סה״כ לחודש</div>
          <div className="pn-amt">{nis(R.monthly)}</div>
        </div>
        <div className="pn-lg-h">חוברת ופרסומים חד־פעמיים</div>
        {row('מודעות בחוברת', pl(R.ads.length, 'מודעה אחת', 'מודעות') + ' · נגבו ' + nis(R.adPaid), R.adSum, false)}
        {row('משרות מקודמות', pl(R.jobs.length, 'פרסום אחד', 'פרסומים'), R.jobSum, false)}
      </div>
      <div className="pn-agrp">
        <h2>
          כרטיסים מודגשים <span className="pn-n">{R.featAct.length}</span>
        </h2>
        <p className="pn-note">כרטיס מודגש מופיע ראשון בתוצאות ובשער שלו, עם טבעת זהב וחותם ״מומלץ״, ויכול להוסיף שורת פרסום וקישור לאתר.</p>
        {canApprove ? <FeaturedForm todayIso={today} req={ftReq} /> : null}
        <div style={{ display: 'grid', gap: 10 }}>
          {R.feats.length ? (
            R.feats.map((l) => {
              const on = isFeatured(l, today);
              return (
                <div key={l.id} className={cx('pn-ritem', on ? 'pn-gold' : 'pn-off')}>
                  <div style={{ minWidth: 0 }}>
                    <h4>{l.name}</h4>
                    <div className="pn-meta2">
                      {categoryOf(l.category).name +
                        (featuredOpen(l) ? ' · עד שיבוטל' : ' · ' + (on ? 'בתוקף עד' : 'פג תוקף ב־') + ' ' + dmy(l.featuredUntil)) +
                        (l.promoNote ? ' · ' + l.promoNote : '')}
                    </div>
                  </div>
                  <div className="pn-amt">{nis(featuredPrice(l, prefs))}</div>
                  {canApprove ? (
                    <div className="pn-actions">
                      <button className="pn-btn" type="button" onClick={() => setFtReq({ key: l.id, n: Date.now() })}>
                        {on ? 'עריכה' : 'חידוש'}
                      </button>
                      <button className="pn-btn pn-ghost2 pn-danger" type="button" onClick={() => unfeature(l)}>
                        {armed === 'ft-' + l.id ? 'ללחוץ שוב להסרה' : 'הסרת ההדגשה'}
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <p className="pn-note">עוד אין כרטיסים מודגשים. אפשר להדגיש גם ישירות מהאלפון, בכפתור ״הדגשה״ בפרטי כל כרטיס.</p>
          )}
        </div>
      </div>
    </>
  );
}

/* ═══════════════ חסויות ═══════════════ */

function SponPanel(props: { now: PrNow; spReq: { place: string; n: number } | null }) {
  const config = useApp((s) => s.config);
  const listings = useApp((s) => s.db.prListings);
  const ads = useApp((s) => s.db.prAds);
  const prefs = useApp((s) => s.db.ui.parnasa);
  const requests = useApp((s) => s.db.prRequests);
  const deletePrAd = useApp((s) => s.deletePrAd);
  const toast = useApp((s) => s.toast);
  const brand = usePrBrand();
  const { canApprove, canDelete } = usePrPerms();
  const { armed, confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  // הטופס הפתוח: מקום (home/coin/שער) + הרשומה (null = חדשה / לתור) — נזכר במעבר-לשונית
  const [edit, setEdit] = useRemembered<{ place: string; id: string | null } | null>('parnasa.admin.sp', null);
  // בקשה מבחוץ (מטבע-הפלטינה מדף הבית) ⇒ הטופס של המקום, עם הרשומה של היום אם יש
  const spN = props.spReq?.n ?? 0;
  useEffect(() => {
    const req = props.spReq;
    if (!req) return;
    const cur = req.place === 'coin' ? coinSponsor(ads, props.now.todayIso) : req.place === 'home' ? adRotation(ads, 'board', props.now.todayIso).today : adRotation(ads, 'category', props.now.todayIso, req.place).today;
    setEdit({ place: req.place, id: cur ? cur.id : null });
    const t = setTimeout(() => document.querySelector('.pn-spForm')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
    return () => clearTimeout(t);
    // רק בבקשה חדשה (n)
  }, [spN]);
  const today = props.now.todayIso;
  const R = revenueOf({ listings, ads, requests, prefs }, today);
  const payUrl = integrationOn(config, 'payments') ? integrationSetting(config, 'payments', 'payUrl') : '';
  const waOn = integrationOn(config, 'whatsapp');
  const counts = new Map<string, number>();
  for (const l of listings) if (l.status === 'approved') counts.set(categoryOf(l.category).key, (counts.get(categoryOf(l.category).key) ?? 0) + 1);
  const home = adRotation(ads, 'board', today);
  const coin = coinSponsor(ads, today);
  const coinsN = ads.filter((a) => a.slot === 'category' && a.coin === true && adActiveOn(a, today)).length;

  const open = (place: string, a: PrAd | null) => setEdit({ place, id: a ? a.id : null });
  const form = (place: string) =>
    canApprove && edit && edit.place === place ? (
      <SpForm
        key={place + '|' + (edit.id ?? 'new')}
        place={place}
        ad={edit.id ? (ads.find((a) => a.id === edit.id) ?? null) : null}
        onClose={() => setEdit(null)}
        onQueue={() => setEdit({ place, id: null })}
      />
    ) : null;
  /** סוף-השורה (כמו המקור): מחיר (כשבחסות) + "עריכה"/"הגדרה"; נותן-חסות נוסף לסבב — מתוך הטופס. */
  const end = (place: string, cur: PrAd | null) =>
    canApprove ? (
      <div className="pn-end">
        {cur ? <span className="pn-amt">{nis(cur.price)}</span> : null}
        <button className={cx('pn-btn', !cur && 'pn-ghost2')} type="button" onClick={() => open(place, cur)}>
          {cur ? 'עריכה' : 'הגדרה'}
        </button>
      </div>
    ) : cur ? (
      <div className="pn-end">
        <span className="pn-amt">{nis(cur.price)}</span>
      </div>
    ) : null;
  const rot = (n: number) => (n > 1 ? ' · ' + n + ' בסבב' : '');
  const sponsorships = ads
    .filter((a) => a.slot === 'category' || a.slot === 'board')
    .sort((a, b) => Number(adActiveOn(b, today)) - Number(adActiveOn(a, today)) || a.advertiser.localeCompare(b.advertiser, 'he') || a.id.localeCompare(b.id));
  const placeOf = (a: PrAd): string => (a.slot === 'board' ? 'home' : a.coin ? 'coin' : a.target);
  const placeName = (a: PrAd): string => (a.slot === 'board' ? 'דף הבית' : a.coin ? 'מטבע פלטינה · ' + categoryOf(a.target).short : 'שער ' + categoryOf(a.target).name);
  function remove(a: PrAd) {
    if (!confirmTwice('spd-' + a.id, 'להסיר את החסות של ' + a.advertiser + '?')) return;
    if (deletePrAd(a.id)) toast('החסות הוסרה');
  }

  return (
    <>
      <div className="pn-agrp">
        <h2>
          חסות על שערים <span className="pn-n">{R.gatesOn + ' מתוך ' + PR_CATEGORIES.length + (R.homeOn ? ' · ודף הבית' : '') + (R.coinOn ? ' · ומטבע הפלטינה' : '')}</span>
        </h2>
        <p className="pn-note">
          החסות מופיעה בראש השער באלפון המלא, בסימן כתר במפתח, ובחוברת המודפסת. חסות על דף הבית מופיעה כשורה אחת אלגנטית בעמוד הפתיחה, לכל מי שנכנס (וגם בראש לוח הקהילה). מטבע
          הפלטינה הוא מטבע מלא ברוחב המסך בין מטבעות העונה: לחיצה עליו פותחת את התחום, והכרטיס של נותן החסות מוצמד ראשון. מספר אנשי המקצוע בכל שער עוזר לתמחר: שער עמוס שווה יותר.
          כמה נותני-חסות לאותו מקום מתחלפים כל יום.
        </p>
        <div className="pn-splist">
          <div className={cx('pn-sprow pn-home', home.today && 'pn-on')} data-cat="home">
            <span className="pn-L">
              <Ic n="house" />
            </span>
            <div style={{ minWidth: 0 }}>
              <b>דף הבית</b>
              <span className="pn-meta2">
                {'שורה אחת בעמוד הפתיחה, לכל מי שנכנס · '}
                {home.today ? (
                  <>
                    בחסות <strong>{home.today.advertiser}</strong>
                    {rot(home.active.length)}
                  </>
                ) : (
                  'פנוי לחסות'
                )}
              </span>
            </div>
            {end('home', home.today)}
          </div>
          {form('home')}
          <div className={cx('pn-sprow pn-coin', coin && 'pn-on')} data-cat="coin">
            <span className="pn-L pn-cnw">
              <RawHtml html={miniCoin(null, 'plat', monoIcon(coin ? monoOf(coin.mono, coin.advertiser) : '◆'))} />
            </span>
            <div style={{ minWidth: 0 }}>
              <b>מטבע פלטינה</b>
              <span className="pn-meta2">
                {'במסך הפתיחה, נפתח לתחום עם הכרטיס מוצמד ראשון · '}
                {coin ? (
                  <>
                    בחסות <strong>{coin.advertiser}</strong>
                    {' · ' + categoryOf(coin.target).short + rot(coinsN)}
                  </>
                ) : (
                  'פנוי לחסות'
                )}
              </span>
            </div>
            {end('coin', coin)}
          </div>
          {form('coin')}
          {PR_CATEGORIES.map((c) => {
            const r = adRotation(ads, 'category', today, c.key);
            const n = counts.get(c.key) ?? 0;
            return (
              <div key={c.key}>
                <div className={cx('pn-sprow', r.today && 'pn-on')} data-cat={c.key}>
                  <span className="pn-L">{c.num.replace(/[׳״]/g, '')}</span>
                  <div style={{ minWidth: 0 }}>
                    <b>{c.name}</b>
                    <span className="pn-meta2">
                      {(n === 0 ? 'אין עדיין אנשי מקצוע' : pl(n, 'איש מקצוע אחד', 'אנשי מקצוע')) + ' · '}
                      {r.today ? (
                        <>
                          בחסות <strong>{r.today.advertiser}</strong>
                          {rot(r.active.length)}
                        </>
                      ) : (
                        'פנוי לחסות'
                      )}
                    </span>
                  </div>
                  {end(c.key, r.today)}
                </div>
                {form(c.key)}
              </div>
            );
          })}
        </div>
      </div>
      {sponsorships.length ? (
        <div className="pn-agrp">
          <h2>
            רשימת החסויות <span className="pn-n">{sponsorships.length}</span>
          </h2>
          <p className="pn-note">כל נותני-החסות, עם התקופה וסימון התשלום. רישום בלבד — בלי קבלות.</p>
          <div style={{ display: 'grid', gap: 10 }}>
            {sponsorships.map((a) => {
              const st = adState(a, today);
              return (
                <div key={a.id} className={cx('pn-ritem', st && 'pn-off')}>
                  <div style={{ minWidth: 0 }}>
                    <h4>{a.advertiser}</h4>
                    <div className="pn-meta2">
                      {placeName(a) + (a.from || a.to ? ' · ' + (a.from ? dmy(a.from) : '…') + '–' + (a.to ? dmy(a.to) : '…') : '') + (st ? ' · ' + st : '')}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>{a.paid ? <span className="pn-badge pn-ok">שולם</span> : <span className="pn-badge pn-warn">טרם שולם</span>}</div>
                  </div>
                  <div className="pn-amt">{nis(a.price)}</div>
                  {canApprove ? (
                    <div className="pn-actions">
                      <PayActions a={a} payUrl={payUrl} waOn={waOn} brand={brand} />
                      <button className="pn-btn" type="button" onClick={() => open(placeOf(a), a)}>
                        עריכה
                      </button>
                      {canDelete ? (
                        <button className="pn-btn pn-ghost2 pn-danger" type="button" onClick={() => remove(a)}>
                          {armed === 'spd-' + a.id ? 'ללחוץ שוב להסרה' : 'הסרת החסות'}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </>
  );
}

/* ═══════════════ מודעות לחוברת ═══════════════ */

function BookletAdsPanel(props: { now: PrNow }) {
  const config = useApp((s) => s.config);
  const ads = useApp((s) => s.db.prAds);
  const deletePrAd = useApp((s) => s.deletePrAd);
  const toast = useApp((s) => s.toast);
  const brand = usePrBrand();
  const { canApprove, canDelete } = usePrPerms();
  const { armed, confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  const [editId, setEditId] = useRemembered<string | null>('parnasa.admin.ad', null);
  const [formN, setFormN] = useState(0);
  const today = props.now.todayIso;
  const payUrl = integrationOn(config, 'payments') ? integrationSetting(config, 'payments', 'payUrl') : '';
  const waOn = integrationOn(config, 'whatsapp');
  const order = PN_AD_SIZES.map(([k]) => k as string);
  const all = ads
    .filter((a) => a.slot === 'booklet')
    .sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || a.advertiser.localeCompare(b.advertiser, 'he') || a.id.localeCompare(b.id));
  const live = bookletAdsOf(ads, today);
  const sum = live.reduce((t, a) => t + (a.price > 0 ? a.price : 0), 0);
  const paid = live.filter((a) => a.paid).reduce((t, a) => t + (a.price > 0 ? a.price : 0), 0);
  const due = sum - paid;
  const unpaid = live.filter((a) => !a.paid).length;
  const cnt = (k: string): number => live.filter((a) => a.kind === k).length;
  const pct = sum ? Math.round((paid / sum) * 100) : 0;
  const editing = editId ? (ads.find((a) => a.id === editId) ?? null) : null;
  function remove(a: PrAd) {
    if (!confirmTwice('ad-' + a.id, 'למחוק את המודעה של ' + a.advertiser + '?')) return;
    if (deletePrAd(a.id)) {
      toast('המודעה נמחקה');
      if (editId === a.id) setEditId(null);
    }
  }

  return (
    <div className="pn-agrp">
      <h2>
        מודעות לחוברת השנתית <span className="pn-n">{all.length}</span>
      </h2>
      {live.length ? (
        <div>
          <div className="pn-kpis">
            <div className="pn-kpi">
              <span>סה״כ מודעות</span>
              <b>{nis(sum)}</b>
              <small>
                {PN_AD_SIZES.filter(([k]) => cnt(k))
                  .map(([k]) => pl(cnt(k), SIZE_ONE[k], SIZE_MANY[k]))
                  .join(' · ')}
              </small>
            </div>
            <div className="pn-kpi">
              <span>נגבה</span>
              <b style={{ color: 'var(--pn-ok)' }}>{nis(paid)}</b>
              <small>{pct + '% מהסכום'}</small>
            </div>
            <div className={cx('pn-kpi', due > 0 && 'pn-due')}>
              <span>ממתין לגבייה</span>
              <b>{nis(due)}</b>
              <small>{unpaid ? pl(unpaid, 'מודעה אחת', 'מודעות') : 'הכול נגבה'}</small>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 6, marginTop: 12 }}>
            <div className="pn-meter" role="img" aria-label={'נגבו ' + pct + ' אחוז מהסכום'}>
              <i style={{ width: pct + '%' }} />
            </div>
            <div className="pn-legend">
              <span>{'שולם ' + nis(paid)}</span>
              <span className="pn-u">{'ממתין ' + nis(due)}</span>
            </div>
          </div>
        </div>
      ) : null}
      {canApprove ? (
        <AdForm
          key={(editing ? editing.id : 'new') + '|' + formN}
          ad={editing}
          onDone={() => {
            setEditId(null);
            setFormN((n) => n + 1);
          }}
        />
      ) : null}
      <div style={{ display: 'grid', gap: 10 }}>
        {all.length ? (
          all.map((a) => {
            const st = adState(a, today);
            return (
              <div key={a.id} className={cx('pn-ritem', st && 'pn-off')}>
                <div style={{ minWidth: 0 }}>
                  <h4>{a.advertiser}</h4>
                  <div className="pn-meta2">
                    {a.headline}
                    {a.phone ? (
                      <>
                        {a.headline ? ' · ' : ''}
                        <span dir="ltr">{a.phone}</span>
                      </>
                    ) : null}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    <span className="pn-badge">{SIZE_NAME[a.kind] ?? ''}</span>
                    {a.paid ? <span className="pn-badge pn-ok">שולם</span> : <span className="pn-badge pn-warn">טרם שולם</span>}
                    {st ? <span className="pn-badge">{st}</span> : null}
                  </div>
                </div>
                <div className="pn-amt">{nis(a.price)}</div>
                {canApprove ? (
                  <div className="pn-actions">
                    <PayActions a={a} payUrl={payUrl} waOn={waOn} brand={brand} />
                    <button
                      className="pn-btn"
                      type="button"
                      onClick={() => {
                        setEditId(a.id);
                        setTimeout(() => document.querySelector('.pn-adForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
                      }}
                    >
                      עריכה
                    </button>
                    {canDelete ? (
                      <button className="pn-btn pn-ghost2 pn-danger" type="button" onClick={() => remove(a)}>
                        {armed === 'ad-' + a.id ? 'ללחוץ שוב למחיקה' : 'מחיקה'}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="pn-empty">
            <h3>עוד אין מודעות</h3>
            <div>מוכרים מודעה לחוברת? רשמו אותה בטופס למעלה, והיא תסודר בחוברת לפי הגודל.</div>
          </div>
        )}
      </div>
    </div>
  );
}
