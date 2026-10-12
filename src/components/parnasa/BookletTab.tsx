/**
 * 📒 פרנסה׳לע — לשונית 📖 חוברת (אשכול 5): אפשרויות-ההפקה + תוכן-העניינים החי (bookletPlan) והערכת
 * עמודי-A5 — כולל "כפולה של 4" לחוברת מקופלת. רק עסקים מאושרים; הערות-פנימיות ובקשות-תושבים לעולם
 * לא נכנסות לחוברת (המנוע). זמני-השבוע — רק כשהדגל parnasa.zmanim דלוק; מודעות — רק כש-parnasa.ads.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { Chip, Field } from '../ui';
import { bookletPlan, type PrBookletOpts } from './booklet';
import type { PrNow } from './hooks';

export function BookletTab(props: { now: PrNow }) {
  const config = useApp((s) => s.config);
  const listings = useApp((s) => s.db.prListings);
  const ads = useApp((s) => s.db.prAds);
  const posts = useApp((s) => s.db.prPosts);
  const prefs = useApp((s) => s.db.ui.parnasa);
  const adsOn = featureOn(config, 'parnasa.ads');
  const zmanimOn = featureOn(config, 'parnasa.zmanim');
  const [dedication, setDedication] = useState(() => String(prefs?.bookletDedication ?? prefs?.dedication ?? ''));
  const [includeAds, setIncludeAds] = useState(true);
  const [paidOnly, setPaidOnly] = useState(false);
  const [ink, setInk] = useState(false);
  const [withZmanim, setWithZmanim] = useState(true);

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
