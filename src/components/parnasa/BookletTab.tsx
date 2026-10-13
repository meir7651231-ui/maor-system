/**
 * 📒 פרנסה׳לע — "חוברת להדפסה" של המקור (עיצוב 6 · renderBook): כריכה-זעירה (הפושקע, סימן-המילה, שם הקהילה, השנה),
 * תוכן-העניינים החי עם קווי-הנקודות (bookletPlan — הערכת עמודי-A5 ו"כפולה של 4" לחוברת מקופלת), נוסח ההקדשה,
 * "לכלול את המודעות" · "רק מודעות ששולמו" · "חיסכון בדיו", ו"הפקת חוברת להדפסה".
 * "הפקת חוברת להדפסה" = קובץ ‎.html לבית-הדפוס (כמו המקור). תוספות-הפורט: דף מספרי-חירום, דף זמני-השבוע
 * (parnasa.zmanim), **קוד-חיוג בן 3 ספרות** ליד כל עסק, ו-🖨 הדפסה / שמירה כ-PDF ישירות (iframe נסתר). רק עסקים מאושרים; הערות-פנימיות ובקשות-תושבים
 * לעולם לא בחוברת (המנוע). ההפקה מגודרת parnasa.export ועוברת את שער יציאת-המידע (guardExport), ונרשמת ביומן-הגישה
 * (logAccess) רק כשיצאה בפועל. מודעות — רק ב-parnasa.ads.
 */
import { useEffect, useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { hebcalParts } from '../../lib/telephony/engine';
import { gemYear } from '../../lib/hebrew';
import { bookletHtml, bookletPlan, type PrBookletOpts } from './booklet';
import { downloadHtmlDoc, printHtmlDoc } from './exportDoc';
import { usePrPerms, type PrNow } from './hooks';
import { pl } from './admin';
import { Wordmark } from './Shell';
import { Ic, Pm } from './skin';

export function BookletTab(props: { now: PrNow }) {
  const config = useApp((s) => s.config);
  const listings = useApp((s) => s.db.prListings);
  const ads = useApp((s) => s.db.prAds);
  const posts = useApp((s) => s.db.prPosts);
  const prefs = useApp((s) => s.db.ui.parnasa);
  const setParnasaPrefs = useApp((s) => s.setParnasaPrefs);
  const logAccess = useApp((s) => s.logAccess);
  const toast = useApp((s) => s.toast);
  const { canApprove } = usePrPerms();
  const adsOn = featureOn(config, 'parnasa.ads');
  const zmanimOn = featureOn(config, 'parnasa.zmanim');
  const exportOn = featureOn(config, 'parnasa.export');
  const [dedication, setDedication] = useState(() => String(prefs?.bookletDedication ?? prefs?.dedication ?? ''));
  const [includeAds, setIncludeAds] = useState(true);
  const [paidOnly, setPaidOnly] = useState(false);
  const [ink, setInk] = useState(false);
  const [withZmanim, setWithZmanim] = useState(true);
  const [done, setDone] = useState<'' | 'print' | 'file'>('');
  // סמל-הפושקע הווקטורי לכריכה — נטען עצל (צ'אנק נפרד), רק כשפותחים את "חוברת להדפסה"
  const [mark, setMark] = useState('');
  useEffect(() => {
    let live = true;
    import('./bookMark')
      .then((m) => {
        if (live) setMark(m.PN_BOOK_MARK);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const brand = termOf(config, 'nav.parnasa', 'פרנסה׳לע');
  const community = (prefs?.communityName ?? '').trim();
  const yr = gemYear(hebcalParts(props.now.todayIso).year);
  const opts: PrBookletOpts = {
    todayIso: props.now.todayIso,
    brand,
    dedication: dedication.trim(),
    includeAds: adsOn && includeAds,
    paidAdsOnly: paidOnly,
    ink,
    zmanimDays: zmanimOn && withZmanim ? 7 : 0,
    mark: mark || undefined,
  };
  const snap = { listings, ads, posts, prefs };
  const plan = bookletPlan(snap, opts);
  const words = termOf(config, 'entity.prListings', 'עסקים');
  const adCount = plan.ads.full.length + plan.ads.half.length + plan.ads.small.length;
  const pad = plan.spareFullPages;

  function produce(kind: 'print' | 'file') {
    const html = bookletHtml(snap, opts);
    const ok = kind === 'print' ? printHtmlDoc(html) : downloadHtmlDoc('parnasa-booklet-' + props.now.todayIso + '.html', html);
    if (!ok) return; // שער יציאת-המידע סירב (הטוסט — מהשער)
    logAccess('📖 הפקת חוברת ' + brand + (kind === 'print' ? ' (הדפסה)' : ' (קובץ)'), plan.listings + ' ' + words + ' · ' + adCount + ' מודעות');
    // נוסח-ההקדשה נשמר בהפקה (המקור) — לגבאי בלבד, ורק כשהשתנה
    const saved = String(prefs?.bookletDedication ?? prefs?.dedication ?? '').trim();
    if (canApprove && dedication.trim() !== saved) setParnasaPrefs({ bookletDedication: dedication.trim() || undefined });
    setDone(kind);
    if (kind === 'print') toast('נפתח חלון-ההדפסה — בחרו גודל נייר A5, או ״שמירה כ־PDF״');
  }
  const li = (t: string, n: string) => (
    <li key={t}>
      <span>{t}</span>
      <span className="pn-dots" />
      <b>{n}</b>
    </li>
  );

  return (
    <div className="pn-agrp">
      <h2>חוברת להדפסה</h2>
      <div className="pn-bk">
        <div className="pn-mini" aria-hidden="true">
          <Pm />
          <b className="pn-pwm">
            <Wordmark name={brand} />
          </b>
          <span>{community || 'אנשי המקצוע שלנו'}</span>
          <em>{yr ? 'שנת ' + yr : ''}</em>
        </div>
        <div style={{ display: 'grid', gap: 14, minWidth: 0 }}>
          <ol className="pn-toc">
            {li('כריכה', 'עמוד אחד')}
            {plan.hasDedication ? li('עמוד הקדשה', 'עמוד אחד') : null}
            {li('מפתח המקצועות', 'עמוד אחד')}
            {li(pl(plan.gates.length, 'שער אחד', 'שערים') + ' · ' + pl(plan.listings, 'איש מקצוע אחד', 'אנשי מקצוע'), plan.dirPages === 1 ? 'עמוד אחד' : 'כ־' + plan.dirPages + ' עמודים')}
            {li('מספרי חירום', 'עמוד אחד')}
            {plan.hasZmanim ? li('זמני השבוע', 'עמוד אחד') : null}
            {opts.includeAds && plan.adPages
              ? li('מודעות: ' + plan.ads.full.length + ' שלמות · ' + plan.ads.half.length + ' חצאים · ' + plan.ads.small.length + ' קטנות', pl(plan.adPages, 'עמוד אחד', 'עמודים'))
              : null}
            {li('סוף דבר', 'עמוד אחד')}
            <li style={{ borderTop: '1px solid var(--pn-line2)', marginTop: 4, paddingTop: 8 }}>
              <span>
                <b>{'סה״כ כ־' + plan.pages + ' עמודי A5'}</b>
              </span>
            </li>
            {pad ? <li className="pn-note">{'לחוברת מקופלת צריך כפולה של 4 עמודים: יש מקום לעוד ' + (pad === 1 ? 'מודעה אחת' : pad + ' מודעות') + ' של עמוד שלם.'}</li> : null}
            {plan.listings === 0 ? <li className="pn-note">{'האלפון עדיין ריק — רק ' + words + ' מאושרים נכנסים לחוברת.'}</li> : null}
          </ol>
          <label className="pn-fl">
            <span>
              נוסח ההקדשה בחוברת <small>(ריק = בלי עמוד הקדשה)</small>
            </span>
            <textarea maxLength={240} style={{ minHeight: 70 }} value={dedication} onChange={(e) => setDedication(e.target.value)} />
          </label>
          <div className="pn-checks">
            {adsOn ? (
              <label>
                <input type="checkbox" checked={includeAds} onChange={(e) => setIncludeAds(e.target.checked)} /> לכלול את המודעות
              </label>
            ) : null}
            {adsOn ? (
              <label>
                <input type="checkbox" checked={paidOnly} disabled={!includeAds} onChange={(e) => setPaidOnly(e.target.checked)} /> רק מודעות ששולמו
              </label>
            ) : null}
            {zmanimOn ? (
              <label>
                <input type="checkbox" checked={withZmanim} onChange={(e) => setWithZmanim(e.target.checked)} /> דף זמני השבוע
              </label>
            ) : null}
            <label>
              <input type="checkbox" checked={ink} onChange={(e) => setInk(e.target.checked)} /> חיסכון בדיו (כריכה לבנה)
            </label>
          </div>
          {exportOn ? (
            <div className="pn-actions">
              <button className="pn-btn pn-primary" type="button" disabled={plan.listings === 0} onClick={() => produce('file')}>
                <Ic n="down" />
                הפקת חוברת להדפסה
              </button>
              <button className="pn-btn" type="button" disabled={plan.listings === 0} onClick={() => produce('print')}>
                🖨 הדפסה / שמירה כ-PDF
              </button>
            </div>
          ) : (
            <p className="pn-note">הפקת החוברת כבויה באשף (תדפיס וייצוא).</p>
          )}
          {done === 'file' ? (
            <div className="pn-notice" role="status">
              החוברת נשמרה. פתחו את הקובץ בדפדפן, לחצו Ctrl+P, בחרו גודל נייר A5 והדפיסו, או בחרו ״שמירה כ־PDF״ ושלחו לבית הדפוס.
            </div>
          ) : done === 'print' ? (
            <div className="pn-notice" role="status">
              נפתח חלון-ההדפסה. בחרו גודל נייר A5 והדפיסו, או בחרו ״שמירה כ־PDF״ ושלחו לבית הדפוס.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
