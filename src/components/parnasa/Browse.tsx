/**
 * 📒 פרנסה׳לע — "כל האלפון" של המקור (עיצוב 3, renderBrowse): "לשאלה" · "כל האלפון" · N אנשי מקצוע; שדה-סינון
 * (כל מילה חייבת להופיע); מפתח 15 השערים באותיות-גימטריה (קרנטינה) עם הספירה וכתר כשהשער בחסות — הנבחר
 * בקטיפה עם אות-זהב; המתגים (הנחה לקהילה · גמ״ח · פנויים לעבודה · מתאים ל) ותוספות-הפורט (פנוי עכשיו · חירום ·
 * כולל ממתינים — רק הגבאי); השערים עם אות ענקית, "N כרטיסים", חסות-השער (סבב-יומי של הפורט) והבאנרים — מודגשים
 * ראשונים, אח"כ השם; הודעות-הריק של המקור; "הורדת האלפון לאקסל (CSV)" דרך שער-הייצוא + יומן-הגישה.
 */
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import type { PrAd, PrListing } from '../../types/domain';
import { downloadCsv } from '../reports/csv';
import { adRotation, categoryOf, filterListings, listingsCsvRows, matchesAll, PR_CATEGORIES } from './lib';
import { Banner, hostOf, safeUrl } from './Home';
import { cx, Crown, Ic, Pm } from './skin';
import type { PnContact, PrNow } from './hooks';

export type PnAud = 'all' | 'men' | 'women';
export interface BrowseFilters {
  bq: string;
  setBq: (v: string) => void;
  disc: boolean;
  setDisc: (v: boolean) => void;
  free: boolean;
  setFree: (v: boolean) => void;
  seek: boolean;
  setSeek: (v: boolean) => void;
  emergency: boolean;
  setEmergency: (v: boolean) => void;
  openOnly: boolean;
  setOpenOnly: (v: boolean) => void;
  aud: PnAud;
  setAud: (v: PnAud) => void;
  showAll: boolean;
  setShowAll: (v: boolean) => void;
}

/** חסות-השער (sponsorHTML): "בחסות" · שם · שורה · חיוג · אתר. */
function GateSponsor(props: { ad: PrAd; contact: PnContact }) {
  const a = props.ad;
  const url = safeUrl(a.url);
  const tel = a.phone ? props.contact.tel(a.phone) : null;
  return (
    <div className="pn-spn">
      <span className="pn-k">
        <Crown />
        בחסות
      </span>
      <b>{a.advertiser}</b>
      {a.headline ? <span>{a.headline}</span> : null}
      {a.phone ? (
        <span className="pn-ph">
          {tel ? (
            <a className="pn-btn pn-ghost2" href={tel}>
              <Ic n="phone" f />
              חיוג
            </a>
          ) : (
            <span className="pn-ltr">{a.phone}</span>
          )}
        </span>
      ) : null}
      {url ? (
        <a className="pn-lk" href={url} target="_blank" rel="noopener noreferrer">
          {hostOf(url)}
        </a>
      ) : null}
    </div>
  );
}

export function Browse(props: {
  now: PrNow;
  cat: string;
  setCat: (c: string) => void;
  f: BrowseFilters;
  canApprove: boolean;
  brand: string;
  contact: PnContact;
  reduced: boolean;
  onBack: () => void;
  onOpen: (id: string, ev?: { x: number; y: number; art: Element | null; kb: boolean }) => void;
  onTouch: (id: string) => void;
  onCopy: (phone: string, id: string) => void;
  onPostReq: (() => void) | null;
  onAdd: (() => void) | null;
  toast: (m: string) => void;
}) {
  const config = useApp((s) => s.config);
  const listings = useApp((s) => s.db.prListings);
  const ads = useApp((s) => s.db.prAds);
  const logAccess = useApp((s) => s.logAccess);
  const { now, f, cat } = props;
  const words = termOf(config, 'entity.prListings', 'עסקים');
  const gabbai = termOf(config, 'entity.prGabbai', 'גבאי');
  const exportOn = featureOn(config, 'parnasa.export');
  const adsOn = featureOn(config, 'parnasa.ads');
  // סמן-מגע (FINE במקור): עם עכבר — בלי רמז-ההחלקה
  const [fine, setFine] = useState(false);
  useEffect(() => {
    try {
      setFine(window.matchMedia('(pointer:fine)').matches);
    } catch {
      /* */
    }
  }, []);

  const approved = useMemo(() => listings.filter((l) => l.status === 'approved'), [listings]);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of approved) m.set(categoryOf(l.category).key, (m.get(categoryOf(l.category).key) ?? 0) + 1);
    return m;
  }, [approved]);
  const q = f.bq.trim();
  const list = useMemo(
    () =>
      filterListings(listings, {
        disc: f.disc,
        free: f.free,
        seek: f.seek,
        emergency: f.emergency,
        aud: f.aud,
        includeAll: props.canApprove && f.showAll,
        openOnly: f.openOnly ? { clock: now.clock, closureAt: now.closureAt } : undefined,
        todayIso: now.todayIso,
      }).filter((l) => matchesAll(l, q)),
    [listings, f.disc, f.free, f.seek, f.emergency, f.aud, props.canApprove, f.showAll, f.openOnly, now, q],
  );
  const sponsorOf = (k: string): PrAd | null => (adsOn ? adRotation(ads, 'category', now.todayIso, k).today : null);
  const listC = cat ? list.filter((l: PrListing) => categoryOf(l.category).key === cat) : list;
  const groups = PR_CATEGORIES.map((c) => ({ c, L: c.num.replace(/[׳״]/g, ''), items: listC.filter((l: PrListing) => categoryOf(l.category).key === c.key) })).filter(
    (g) => g.items.length || (cat === g.c.key && !q),
  );

  function exportCsv(): void {
    logAccess('ייצוא מדריך ' + termOf(config, 'nav.parnasa', 'פרנסה׳לע') + ' (CSV)', approved.length + ' ' + words);
    downloadCsv('parnasa-directory.csv', listingsCsvRows(listings, now.todayIso));
    props.toast('האלפון ירד כקובץ CSV — מאושרים בלבד, בלי הערות פנימיות');
  }

  const tile = (k: string, label: string, letter: string, n: number) => {
    const sp = k ? sponsorOf(k) : null;
    return (
      <button
        key={k || 'all'}
        className={cx('pn-ix', !n && 'pn-zero', !k && 'pn-all')}
        type="button"
        aria-pressed={cat === k}
        title={sp ? 'בחסות ' + sp.advertiser : undefined}
        onClick={() => props.setCat(cat === k && k ? '' : k)}
      >
        {sp ? (
          <svg className="pn-ix-s" viewBox="0 0 24 16" role="img" aria-label={'בחסות ' + sp.advertiser}>
            <path d="M2 14 L3.4 4.5 L8 9 L12 2 L16 9 L20.6 4.5 L22 14Z" fill="currentColor" />
          </svg>
        ) : null}
        <span className="pn-ix-n">{n}</span>
        <span className="pn-ix-l">{letter}</span>
        <span className="pn-ix-t">{label}</span>
      </button>
    );
  };

  let body;
  if (!approved.length && !(props.canApprove && f.showAll && listings.length))
    body = (
      <div className="pn-empty">
        <Pm />
        <h3>האלפון מחכה לכרטיס הראשון</h3>
        <div>כאן יופיעו אנשי המקצוע של הקהילה, מסודרים לפי שערים, עם וואטסאפ, טלפון והמלצות.</div>
        {props.onAdd ? (
          <button className="pn-btn pn-primary" type="button" onClick={props.onAdd}>
            <Ic n="plus" />
            הוספת הכרטיס שלי
          </button>
        ) : null}
      </div>
    );
  else if (!groups.length || (!listC.length && !cat))
    body = (
      <div className="pn-empty">
        <h3>לא נמצא מתאים</h3>
        <div>נסו מילה אחרת, או פרסמו בקשה בלוח ואנשי הקהילה יענו.</div>
        {props.onPostReq ? (
          <button className="pn-btn pn-primary" type="button" onClick={props.onPostReq}>
            פרסום בקשה בלוח
          </button>
        ) : null}
      </div>
    );
  else
    body = (
      <>
        {groups.map((g) => {
          const sp = sponsorOf(g.c.key);
          return (
            <section key={g.c.key} className="pn-grp">
              <div className="pn-grp-h">
                <span className="pn-L pn-gold-t" aria-hidden="true">
                  {g.L}
                </span>
                <h2>{g.c.name}</h2>
                <span className="pn-n">{g.items.length ? (g.items.length === 1 ? 'כרטיס אחד' : g.items.length + ' כרטיסים') : ''}</span>
              </div>
              {sp ? <GateSponsor ad={sp} contact={props.contact} /> : null}
              {g.items.length ? (
                <div className="pn-bn-list" role="list" aria-label={g.c.name}>
                  {g.items.map((l, i) => (
                    <Banner
                      key={l.id}
                      l={l}
                      o={{ i, row: i > 0, code: true, st: props.canApprove, gabbai }}
                      now={now}
                      brand={props.brand}
                      contact={props.contact}
                      reduced={props.reduced}
                      onOpen={props.onOpen}
                      onTouch={props.onTouch}
                      onCopy={props.onCopy}
                    />
                  ))}
                </div>
              ) : (
                <div className="pn-empty">
                  <div>עוד אין אנשי מקצוע בשער הזה.</div>
                  {props.onPostReq ? (
                    <button className="pn-btn" type="button" onClick={props.onPostReq}>
                      פרסום בקשה בלוח
                    </button>
                  ) : null}
                </div>
              )}
            </section>
          );
        })}
        {fine ? null : (
          <p className="pn-swipehint">
            <Ic n="swipe" />
            החליקו באנר ימינה לוואטסאפ · שמאלה לחיוג
          </p>
        )}
      </>
    );

  return (
    <div className="pn-browse">
      <div className="pn-bhead">
        <button className="pn-back" type="button" onClick={props.onBack}>
          <Ic n="back" />
          לשאלה
        </button>
        <h2>כל האלפון</h2>
        <span className="pn-cnt">{approved.length ? (approved.length === 1 ? 'איש מקצוע אחד' : approved.length + ' אנשי מקצוע') : ''}</span>
      </div>
      <label className="pn-filter">
        <Ic n="search" />
        <span className="pn-sr">סינון</span>
        <input type="search" autoComplete="off" placeholder="סינון לפי שם, מקצוע או עיר" value={f.bq} onChange={(e) => f.setBq(e.target.value)} />
      </label>
      <div className="pn-idx" role="group" aria-label="שערי האלפון">
        {tile('', 'כל השערים', 'הכול', approved.length)}
        {PR_CATEGORIES.map((c) => tile(c.key, c.name, c.num.replace(/[׳״]/g, ''), counts.get(c.key) ?? 0))}
      </div>
      <div className="pn-toggles">
        <label>
          <input type="checkbox" checked={f.disc} onChange={(e) => f.setDisc(e.target.checked)} /> הנחה לקהילה
        </label>
        <label>
          <input type="checkbox" checked={f.free} onChange={(e) => f.setFree(e.target.checked)} /> גמ״ח
        </label>
        <label>
          <input type="checkbox" checked={f.seek} onChange={(e) => f.setSeek(e.target.checked)} /> פנויים לעבודה
        </label>
        <label>
          <input type="checkbox" checked={f.openOnly} onChange={(e) => f.setOpenOnly(e.target.checked)} /> פנוי עכשיו
        </label>
        <label>
          <input type="checkbox" checked={f.emergency} onChange={(e) => f.setEmergency(e.target.checked)} /> חירום 24/7
        </label>
        <label>
          מתאים ל:
          <select value={f.aud === 'all' ? '' : f.aud} onChange={(e) => f.setAud((e.target.value || 'all') as PnAud)}>
            <option value="">כולם</option>
            <option value="men">גברים</option>
            <option value="women">נשים</option>
          </select>
        </label>
        {props.canApprove ? (
          <label>
            <input type="checkbox" checked={f.showAll} onChange={(e) => f.setShowAll(e.target.checked)} /> כולל ממתינים ומוסתרים
          </label>
        ) : null}
      </div>
      <div className="pn-list" aria-live="polite">
        {body}
      </div>
      {exportOn && approved.length ? (
        <div className="pn-exportrow">
          <button className="pn-btn" type="button" onClick={exportCsv}>
            <Ic n="down" />
            הורדת האלפון לאקסל (CSV)
          </button>
          <span className="pn-note">להדפסה, לבית המדרש ולמי שיש לו טלפון כשר.</span>
        </div>
      ) : null}
    </div>
  );
}
