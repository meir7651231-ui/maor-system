/**
 * 📒 פרנסה׳לע — לשונית 📖 חוברת (אשכולות 5+8): אפשרויות-ההפקה, תוכן-העניינים החי (bookletPlan) והערכת
 * עמודי-A5 (כולל "כפולה של 4" לחוברת מקופלת), והפקה: 🖨 הדפסה / שמירה כ-PDF (iframe נסתר) או ⬇ קובץ
 * ‎.html לבית-הדפוס. רק עסקים מאושרים, עם **קוד-חיוג בן 3 ספרות** ליד כל עסק; הערות-פנימיות ובקשות-תושבים
 * לעולם לא בחוברת (המנוע). ההפקה מגודרת parnasa.export ועוברת את שער יציאת-המידע (guardExport), ונרשמת
 * ביומן-הגישה (logAccess) רק כשיצאה בפועל. זמני-השבוע — רק ב-parnasa.zmanim; מודעות — רק ב-parnasa.ads.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { Btn, Chip, Field } from '../ui';
import { bookletHtml, bookletPlan, type PrBookletOpts } from './booklet';
import { downloadHtmlDoc, printHtmlDoc } from './exportDoc';
import { usePrPerms, type PrNow } from './hooks';

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

  const brand = termOf(config, 'nav.parnasa', 'פרנסה׳לע');
  const opts: PrBookletOpts = {
    todayIso: props.now.todayIso,
    brand,
    dedication: dedication.trim(),
    includeAds: adsOn && includeAds,
    paidAdsOnly: paidOnly,
    ink,
    zmanimDays: zmanimOn && withZmanim ? 7 : 0,
  };
  const snap = { listings, ads, posts, prefs };
  const plan = bookletPlan(snap, opts);
  const words = termOf(config, 'entity.prListings', 'עסקים');
  const adCount = plan.ads.full.length + plan.ads.half.length + plan.ads.small.length;

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800 }}>חוברת להדפסה — A5</h2>
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
          {'ספר המקצועות של הקהילה: מפתח לפי שער, ' + words + ' בשני טורים עם קוד-חיוג בן 3 ספרות, מספרי חירום' + (zmanimOn ? ', זמני השבוע' : '') + (adsOn ? ' ומודעות' : '') + '.'}
        </div>
        <Field label="נוסח ההקדשה בחוברת (ריק = בלי עמוד הקדשה)">
          <textarea rows={2} value={dedication} onChange={(e) => setDedication(e.target.value.slice(0, 240))} />
        </Field>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {adsOn && (
            <Chip on={includeAds} onClick={() => setIncludeAds(!includeAds)}>
              לכלול את המודעות
            </Chip>
          )}
          {adsOn && includeAds && (
            <Chip on={paidOnly} onClick={() => setPaidOnly(!paidOnly)}>
              רק מודעות ששולמו
            </Chip>
          )}
          {zmanimOn && (
            <Chip on={withZmanim} onClick={() => setWithZmanim(!withZmanim)}>
              דף זמני השבוע
            </Chip>
          )}
          <Chip on={ink} onClick={() => setInk(!ink)}>
            חיסכון בדיו (כריכה לבנה)
          </Chip>
        </div>
        {exportOn ? (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
            <Btn kind="primary" onClick={() => produce('print')} disabled={plan.listings === 0}>
              🖨 הדפסה / שמירה כ-PDF
            </Btn>
            <Btn onClick={() => produce('file')} disabled={plan.listings === 0}>
              ⬇ הורדת החוברת (קובץ HTML)
            </Btn>
          </div>
        ) : (
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>הפקת החוברת כבויה באשף (תדפיס וייצוא).</div>
        )}
        {done === 'file' && (
          <div role="status" style={{ fontSize: 12.5, border: '1px solid var(--line)', borderRadius: 8, padding: '6px 8px' }}>
            החוברת נשמרה. פתחו את הקובץ בדפדפן, לחצו Ctrl+P, בחרו גודל נייר A5 והדפיסו, או בחרו ״שמירה כ־PDF״ ושלחו לבית הדפוס.
          </div>
        )}
      </section>

      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13.5 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800 }}>תוכן החוברת</h2>
        <div>כריכה</div>
        {plan.hasDedication && <div>עמוד הקדשה</div>}
        <div>מפתח המקצועות</div>
        <div>{plan.gates.length + ' שערים · ' + plan.listings + ' אנשי מקצוע'}</div>
        {plan.gates.map((g) => (
          <div key={g.key} style={{ fontSize: 12.5, color: 'var(--ink-faint)', paddingInlineStart: 12 }}>
            {g.num + ' · ' + g.name + ' — ' + g.count + (g.sponsor ? ' · בחסות ' + g.sponsor : '')}
          </div>
        ))}
        <div>מספרי חירום</div>
        {plan.hasZmanim && <div>זמני השבוע</div>}
        {opts.includeAds && <div>{'מודעות: ' + plan.ads.full.length + ' שלמות · ' + plan.ads.half.length + ' חצאים · ' + plan.ads.small.length + ' קטנות'}</div>}
        <div>סוף דבר</div>
        <div style={{ fontWeight: 800, marginTop: 4 }}>{'סה״כ כ־' + plan.pages + ' עמודי A5'}</div>
        {plan.spareFullPages > 0 && (
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
            {'לחוברת מקופלת צריך כפולה של 4 עמודים: יש מקום לעוד ' + plan.spareFullPages + ' מודעות של עמוד שלם.'}
          </div>
        )}
        {plan.listings === 0 && <div style={{ fontSize: 12.5, color: '#a16207' }}>המדריך עדיין ריק — רק עסקים מאושרים נכנסים לחוברת.</div>}
      </section>
    </div>
  );
}
