/**
 * 📒 פרנסה׳לע — דף-העסק של המקור (עיצוב 3): גיליון בגובה-מלא מעל כל לשונית (bizHTML + barHTML): כריכה — תמונת-
 * המקצוע בגוון-הדף (8 פלטות) או קטיפה עם הפושקע, חבל-זהב; לוגו בדיסק-שנהב עם טבעת-זהב או מונוגרמת-מקצוע; שם,
 * משפט-מפתח, גלולת-מבצע, מקצוע · שער · אזור, מצב כשסגור. גוף — תגי-אמון, שורת-הטלפון עם "העתקה", בלוק-ההדגשה,
 * "איך פונים", על העסק, שירותים ומחירים, מהעבודות שלנו (עד 4 + לייטבוקס), שעות, פרטים, שאלות נפוצות, המלצות,
 * המעטפת (רק הגבאי), הקופה של העסק, עובדים לצידו, חסות-השער, והקולופון. הסרגל — וואטסאפ עכשיו / חיוג / העתקה + ★.
 * תוספות-הפורט נשמרות בשפת-המקור: קוד-החיוג, מצב-האישור, טלפון נוסף, חלונות-שעות, הערה-פנימית (רק למאשר),
 * בקשות-בתחום בתצוגת-העסקים (בקשה שקטה — בלי זהות), ופעולות-הגבאי. וואטסאפ מגודר-הרחבה, חיוג מגודר-טלפוניה.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import type { IsoDate, PrListing } from '../../types/domain';
import { Btn, Field, Modal } from '../ui';
import { useArmed } from '../useArmed';
import { adRotation, categoryOf, isFeatured, listingStatus, requestsForListing } from './lib';
import { ListingForm } from './ListingForm';
import { usePnContact, usePrBrand, usePrPerms, type PrNow } from './hooks';
import { agoText } from './labels';
import { cx, Crown, Ic, OrbitLayer, Pm, PnPortal, StPill, vars } from './skin';
import { Medal, hostOf, offerOf, safeUrl } from './Home';
import { photoOf, photoUrl } from './banners';
import { tradeIcon } from './home';
import { fmtPrice, howtoOf, kupaOf, offerUntilText, shareLine, tilesOf, trustOf, weekRows, hasHours } from './biz';
import { envSummary, nearOf } from './envelope';
import { EnvMap } from './EnvMap';
import { mountSheet, trapTab, type SheetCtl } from './sheetFx';
import type { useQuickDial } from './skinPrefs';

const isImg = (s: unknown): s is string => typeof s === 'string' && /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/.test(s);
const digits = (s: string): string => String(s || '').replace(/\D/g, '');

/** הקשר-הגיליון מהשלד. */
export interface BizCtx {
  now: PrNow;
  calm: boolean;
  reduced: boolean;
  quick: ReturnType<typeof useQuickDial>;
  monthStartIso: IsoDate;
  toastAct: (msg: string, action?: { label: string; run: () => void }) => void;
}

/** שני מטבעות-המיקרו של הקופה (KP_IC במקור). */
function KpIc(props: { k: 'ans' | 'th' }) {
  return props.k === 'ans' ? (
    <svg viewBox="0 0 24 24">
      <path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12M11 11V5a1.5 1.5 0 0 1 3 0v6M14 11V6.5a1.5 1.5 0 0 1 3 0V14c0 3.6-2.4 6-6 6-2.6 0-4-1.2-5.3-3.2L4 13.6a1.4 1.4 0 0 1 2.3-1.6L8 14" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24">
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
    </svg>
  );
}

/** סעיף בגוף-הדף (sec במקור): כותרת קרנטינה בצבע-הפלטה + משנה. */
function Sec(props: { t: string; sm?: string; className?: string; children: ReactNode }) {
  return (
    <section className={cx('pn-bps', props.className)}>
      <h3>
        {props.t}
        {props.sm ? <small>{props.sm}</small> : null}
      </h3>
      {props.children}
    </section>
  );
}

export function BizSheet(props: { id: string; qtext: string; ctx: BizCtx; onClose: () => void; onOpen: (id: string) => void }) {
  const l = useApp((s) => s.db.prListings.find((x) => x.id === props.id) ?? null);
  // העסק נמחק בזמן שהגיליון פתוח ⇒ סוגרים
  useEffect(() => {
    if (!l) props.onClose();
  });
  if (!l) return null;
  return <BizSheetInner key="sheet" l={l} {...props} />;
}

function BizSheetInner(props: { l: PrListing; qtext: string; ctx: BizCtx; onClose: () => void; onOpen: (id: string) => void }) {
  const { l, ctx } = props;
  const { now } = ctx;
  const config = useApp((s) => s.config);
  const listings = useApp((s) => s.db.prListings);
  const requests = useApp((s) => s.db.prRequests);
  const ads = useApp((s) => s.db.prAds);
  const setPrStatus = useApp((s) => s.setPrStatus);
  const deletePrListing = useApp((s) => s.deletePrListing);
  const upsertPrListing = useApp((s) => s.upsertPrListing);
  const addPrResponse = useApp((s) => s.addPrResponse);
  const toast = (m: string): void => ctx.toastAct(m);
  const brand = usePrBrand();
  const contact = usePnContact();
  const { canApprove, canDelete } = usePrPerms();
  const { armed, confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  const name = termOf(config, 'nav.parnasa', 'פרנסה׳לע');
  const word = termOf(config, 'entity.prListing', 'עסק');
  const gabbai = termOf(config, 'entity.prGabbai', 'גבאי');
  const reqWord = termOf(config, 'entity.prRequest', 'בקשה');
  const requestsOn = featureOn(config, 'parnasa.requests');
  const adsOn = featureOn(config, 'parnasa.ads');

  const sheetRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const grabRef = useRef<HTMLButtonElement>(null);
  const ctl = useRef<SheetCtl | null>(null);
  const reducedRef = useRef(ctx.reduced);
  reducedRef.current = ctx.reduced;
  const onCloseRef = useRef(props.onClose);
  onCloseRef.current = props.onClose;
  const [editOpen, setEditOpen] = useState(false);
  const [rec, setRec] = useState({ by: '', text: '' });
  const [respondTo, setRespondTo] = useState<{ id: string; quiet: boolean } | null>(null);
  const [respText, setRespText] = useState('');
  const [lb, setLb] = useState<{ list: string[]; i: number } | null>(null);
  const [env, setEnv] = useState(false);
  const [copied, setCopied] = useState(false);
  const lbRef = useRef<HTMLDivElement>(null);
  const lbLast = useRef<HTMLElement | null>(null);

  // הגיליון: עלייה בקפיץ פעם אחת; עסק אחר באותו גיליון ⇒ גלילה לראש (וגם "אחרונים" — touch)
  useEffect(() => {
    const sheet = sheetRef.current;
    const scrim = scrimRef.current;
    const body = bodyRef.current;
    const grab = grabRef.current;
    if (!sheet || !scrim || !body || !grab) return;
    ctl.current = mountSheet({ sheet, scrim, body, grab, reduced: () => reducedRef.current, onClosed: () => onCloseRef.current() });
    return () => {
      ctl.current?.destroy();
      ctl.current = null;
    };
  }, []);
  const quickTouch = ctx.quick.touch;
  useEffect(() => {
    ctl.current?.reset();
    quickTouch(l.id);
  }, [l.id, quickTouch]);
  const close = (): void => {
    if (ctl.current) ctl.current.close();
    else props.onClose();
  };
  // Esc: לייטבוקס ⇒ המעטפת ⇒ הגיליון (מודאל של אורביט מעליו — הוא מטפל בעצמו)
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (document.querySelector('.modal-back')) return;
      if (lb) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setLb(null);
        } else if (e.key === 'ArrowLeft') setLb((x) => (x && x.list.length > 1 ? { ...x, i: (x.i + 1) % x.list.length } : x));
        else if (e.key === 'ArrowRight') setLb((x) => (x && x.list.length > 1 ? { ...x, i: (x.i - 1 + x.list.length) % x.list.length } : x));
        return;
      }
      if (e.key !== 'Escape') return;
      if (env) {
        e.stopPropagation();
        setEnv(false);
        return;
      }
      close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });
  // לייטבוקס: מיקוד על הסגירה, חזרה למקור בסגירה
  const lbOpen = lb !== null;
  useEffect(() => {
    if (!lbOpen) return;
    lbLast.current = (document.activeElement as HTMLElement | null) ?? null;
    const t = setTimeout(() => (lbRef.current?.querySelector('.pn-x') as HTMLElement | null)?.focus({ preventScroll: true }), 30);
    return () => {
      clearTimeout(t);
      const f = lbLast.current;
      if (f && document.contains(f)) f.focus({ preventScroll: true });
    };
  }, [lbOpen]);

  const cat = categoryOf(l.category);
  const feat = isFeatured(l, now.todayIso);
  const st = listingStatus(l, now.clock, now.closureAt);
  const of = offerOf(l, now.todayIso);
  const ph = photoOf(l);
  const pal = l.palette || 'velvet';
  const fav = ctx.quick.favs.includes(l.id);
  const photos = (Array.isArray(l.photos) ? l.photos : []).filter(isImg).slice(0, 4);
  const faq = (Array.isArray(l.faq) ? l.faq : []).filter((f) => f && (f.q || '').trim());
  const trust = trustOf(l, now.todayIso, name);
  const tiles = tilesOf(l);
  const where2 = [l.city, l.area].filter((x) => x && x.trim());
  const waMsg = 'שלום, הגעתי אליך דרך ' + brand + '.' + (props.qtext ? ' צריך עזרה: ' + props.qtext : '');
  const wa = l.whatsapp ? contact.wa(l.whatsapp, waMsg) : null;
  const tel = contact.tel(l.phone);
  const promoUrl = feat ? safeUrl(l.promoUrl) : '';
  const promoLine = feat ? (l.promoLine ?? '').trim() : '';
  const sameWa = !!l.whatsapp && digits(l.whatsapp).slice(-9) === digits(l.phone).slice(-9);
  const kupa = useMemo(() => kupaOf(l, requests, ctx.monthStartIso, now.loc.tz), [l, requests, ctx.monthStartIso, now.loc.tz]);
  const near = useMemo(() => nearOf(l, listings), [l, listings]);
  const envS = useMemo(() => (canApprove ? envSummary(l, listings) : null), [canApprove, l, listings]);
  const inTrade = requestsOn && l.status === 'approved' ? requestsForListing(l, requests, listings, now.nowMs) : [];
  const gateSp = adsOn ? adRotation(ads, 'category', now.todayIso, cat.key).today : null;

  async function copy(v: string, ok: string, fail: string): Promise<boolean> {
    let done = false;
    try {
      await navigator.clipboard.writeText(v);
      done = true;
    } catch {
      done = false;
    }
    toast(done ? ok : fail);
    return done;
  }
  function copyPhone(p: string): void {
    void copy(p, 'המספר ' + p + ' הועתק', 'המספר: ' + p).then((ok) => {
      ctx.quick.touch(l.id);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    });
  }
  function toggleFav(): void {
    const on = ctx.quick.toggleFav(l.id);
    toast(on ? 'נוסף לחיוג המהיר' : 'הוסר מהחיוג המהיר');
  }
  function decide(status: 'approved' | 'rejected'): void {
    if (setPrStatus('listing', l.id, status)) toast(status === 'approved' ? 'אושר — מופיע באלפון' : 'הוסתר מהאלפון');
  }
  function addRec(): void {
    const text = rec.text.trim();
    if (!text) return toast('כתבו את ההמלצה');
    // המלצה = שינוי לא-תוכני ⇒ מכונת-האישור משאירה את הסטטוס כמות-שהוא
    const res = upsertPrListing({ ...l, recs: [{ by: rec.by.trim(), text: text.slice(0, 240), at: new Date().toISOString() }, ...l.recs] });
    if (res.ok) {
      setRec({ by: '', text: '' });
      toast('תודה! ההמלצה נשמרה');
    }
  }
  function removeRec(i: number): void {
    if (upsertPrListing({ ...l, recs: l.recs.filter((_, j) => j !== i) }).ok) toast('ההמלצה נמחקה');
  }
  function respond(): void {
    if (!respondTo) return;
    if (respondTo.quiet && !respText.trim()) return toast('לבקשה בשקט — כתבו תשובה (המבקש יראה אותה, ואתם לא תדעו מי הוא)');
    if (addPrResponse(respondTo.id, { listingId: l.id, text: respText.trim() || 'זמין' })) {
      toast(respondTo.quiet ? 'שלחת תשובה. אתה לא יודע מי ביקש…' : 'נרשם שה' + word + ' זמין/ה');
      setRespondTo(null);
      setRespText('');
    }
  }
  function del(): void {
    if (!confirmTwice('prl-' + l.id, 'למחוק את ' + l.name + ' מהאלפון?')) {
      toast('בטוחים? לחיצה נוספת בתוך 3.5 שניות תמחק לצמיתות');
      return;
    }
    if (deletePrListing(l.id)) {
      toast(l.name + ' נמחק/ה מהאלפון');
      close();
    }
  }

  const star = (
    <button className="pn-ib" type="button" aria-pressed={fav} aria-label="חיוג מהיר" onClick={toggleFav}>
      <Ic n="star" />
    </button>
  );
  const logo = isImg(l.logo) ? (
    <span className="pn-bplogo">
      <img src={l.logo} alt={'הלוגו של ' + l.name} decoding="async" />
    </span>
  ) : (
    <span className="pn-bplogo pn-mono" aria-hidden="true">
      <b className="pn-tic">
        <Ic n={tradeIcon(l)} />
      </b>
    </span>
  );
  const hasStory = !!l.desc.trim();

  return (
    <PnPortal>
      <div className="pn-scrim" ref={scrimRef} />
      <div className="pn-sheet" ref={sheetRef} role="dialog" aria-modal="true" aria-labelledby="pn-sname" data-pal={pal}>
        <button className="pn-grab" ref={grabRef} type="button" aria-label="סגירה">
          <i />
        </button>
        <div className="pn-sbody" ref={bodyRef}>
          <div className="pn-bptop">
            <div>
              <button className="pn-ib" type="button" data-act="close" aria-label="חזרה" onClick={close}>
                <Ic n="back" />
              </button>
              <span className="pn-bmini" aria-hidden="true">
                {isImg(l.logo) ? (
                  <img src={l.logo} alt="" />
                ) : (
                  <b className="pn-tic">
                    <Ic n={tradeIcon(l)} />
                  </b>
                )}
              </span>
              <b>{l.name}</b>
              {star}
            </div>
          </div>
          <header className="pn-bpc" data-ph={ph || 'brand'}>
            {ph ? <span className="pn-bpc-ph" aria-hidden="true" style={{ backgroundImage: 'url(' + photoUrl(ph) + ')' }} /> : <span className="pn-bpc-ph pn-brand" aria-hidden="true" />}
            <span className="pn-cx">
              <button className="pn-ib" type="button" data-act="close" aria-label="חזרה" onClick={close}>
                <Ic n="back" />
              </button>
            </span>
            <span className="pn-cs">{star}</span>
            {logo}
            <h2 id="pn-sname">{l.name}</h2>
            {l.tagline?.trim() ? <p className="pn-tg">{l.tagline.trim()}</p> : null}
            {of ? (
              <p className="pn-bpof">
                <Ic n="tag" />
                <span>{of.text}</span>
                {of.until ? <small>{offerUntilText(of.until)}</small> : null}
              </p>
            ) : null}
            {l.title ? (
              <div className="pn-tr">
                <span>{l.title}</span>
              </div>
            ) : null}
            <div className="pn-tr">
              <span>{cat.name}</span>
              {where2.length ? <span>{where2.join(' · ')}</span> : null}
            </div>
            <StPill st={st && st.k !== 'open' ? st : null} />
          </header>
          <div className="pn-bpm">
            <div className="pn-tbs">
              {trust.map((t, i) => (
                <span key={i} className={cx('pn-tb2', t.k && 'pn-' + t.k)}>
                  {t.i === 'crown' ? <Crown /> : <Ic n={t.i} />}
                  {t.t}
                </span>
              ))}
              {l.dialCode ? (
                <span className="pn-tb2" title="קוד-החיוג בקו (מודפס בחוברת)">
                  <Ic n="phone" />
                  {'קוד חיוג ' + l.dialCode}
                </span>
              ) : null}
              {l.status === 'pending' ? (
                <span className="pn-tb2 pn-em">
                  <Ic n="clock" />
                  {'ממתין לאישור ה' + gabbai}
                </span>
              ) : l.status === 'rejected' ? (
                <span className="pn-tb2 pn-em">
                  <Ic n="eye" />
                  מוסתר מהאלפון
                </span>
              ) : null}
            </div>
            {l.phone ? (
              <div className="pn-bpcall">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="pn-k">{'טלפון' + (sameWa ? ' · וואטסאפ' : '')}</span>
                  <span className="pn-num pn-ltr">{l.phone}</span>
                </div>
                <button className={cx('pn-copy', copied && 'pn-ok')} type="button" data-act="copy" onClick={() => copyPhone(l.phone)}>
                  <Ic n="copy" />
                  <span className="pn-cl">העתקה</span>
                </button>
              </div>
            ) : null}
            {l.whatsapp && !sameWa ? (
              <div className="pn-bpcall">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="pn-k">וואטסאפ</span>
                  <span className="pn-num pn-ltr">{l.whatsapp}</span>
                </div>
                <button className="pn-copy" type="button" data-act="copy" onClick={() => copyPhone(l.whatsapp)}>
                  <Ic n="copy" />
                  <span className="pn-cl">העתקה</span>
                </button>
              </div>
            ) : null}
            {l.phone2 ? (
              <div className="pn-bpcall">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="pn-k">טלפון נוסף</span>
                  <span className="pn-num pn-ltr">{l.phone2}</span>
                </div>
                <button className="pn-copy" type="button" data-act="copy" onClick={() => copyPhone(l.phone2)}>
                  <Ic n="copy" />
                  <span className="pn-cl">העתקה</span>
                </button>
              </div>
            ) : null}
            {feat && (promoLine || promoUrl) ? (
              <div className="pn-bpfeat">
                <span className="pn-seal">
                  <Crown />
                  {'מומלץ ' + name}
                </span>
                {promoLine ? <p>{promoLine}</p> : null}
                {promoUrl ? (
                  <a href={promoUrl} target="_blank" rel="noopener noreferrer">
                    {hostOf(promoUrl)}
                  </a>
                ) : null}
              </div>
            ) : null}
            {!hasStory && !l.services.length && !photos.length ? (
              <Sec t="איך פונים">
                <div className="pn-howto">
                  {howtoOf(!!wa).map(([t, d], i) => (
                    <div key={i} className="pn-how">
                      <b aria-hidden="true">{'אבג'[i]}</b>
                      <span>
                        <strong>{t}</strong>
                        {d}
                      </span>
                    </div>
                  ))}
                </div>
              </Sec>
            ) : null}
            {hasStory ? (
              <Sec t="על העסק">
                <div className="pn-story">{l.desc.trim()}</div>
              </Sec>
            ) : null}
            {l.services.length ? (
              <Sec t="שירותים ומחירים" sm="המחירים להמחשה. סופי בתיאום">
                <div className="pn-svcs">
                  {l.services.map((s, i) => (
                    <div key={i} className="pn-svc">
                      <div className="pn-r">
                        <span className="pn-n">{s.name}</span>
                        {s.price ? (
                          <>
                            <span className="pn-d" />
                            <span className="pn-p">{fmtPrice(s.price)}</span>
                          </>
                        ) : null}
                      </div>
                      {s.note ? <div className="pn-o">{s.note}</div> : null}
                    </div>
                  ))}
                </div>
              </Sec>
            ) : null}
            {photos.length ? (
              <Sec t="מהעבודות שלנו">
                <div className={'pn-gal pn-n' + photos.length}>
                  {photos.map((u, i) => (
                    <button key={i} type="button" data-act="gal" aria-label={'תמונה ' + (i + 1) + ' מתוך ' + photos.length} onClick={() => setLb({ list: photos, i })}>
                      <img src={u} alt="" loading="lazy" decoding="async" />
                      {i === 0 && photos.length > 1 ? <span className="pn-cnt">{photos.length + ' תמונות'}</span> : null}
                    </button>
                  ))}
                </div>
              </Sec>
            ) : null}
            {hasHours(l) ? (
              <Sec t="שעות פעילות">
                {l.always || l.hours.length ? (
                  <div className="pn-hours">
                    {weekRows(l, now.clock.dow).map((r) => (
                      <div key={r.d} className={r.today ? 'pn-today' : undefined}>
                        <span>{r.label}</span>
                        <span>{r.v}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                {l.hoursNote.trim() ? (
                  <div className="pn-hnote">
                    <Ic n="clock" />
                    {l.hoursNote.trim()}
                  </div>
                ) : null}
                {l.emergency ? (
                  <div className="pn-hnote" style={{ color: 'var(--pn-danger)', fontWeight: 800 }}>
                    <Ic n="siren" />
                    זמינים גם לקריאות חירום, 24/7
                  </div>
                ) : null}
              </Sec>
            ) : null}
            <Sec t={hasStory || l.services.length ? 'פרטים' : 'פרטי העסק'}>
              <div className="pn-tiles">
                {tiles.map((t) => (
                  <div key={t.k} className={cx('pn-tile', t.chips && 'pn-w')}>
                    <span className="pn-k">
                      <Ic n={t.i} />
                      {t.k}
                    </span>
                    <span className="pn-v">
                      {t.chips ? (
                        <span className="pn-paychips">
                          {t.chips.map((c) => (
                            <span key={c}>{c}</span>
                          ))}
                        </span>
                      ) : (
                        t.v
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </Sec>
            {faq.length ? (
              <Sec t="שאלות נפוצות">
                {faq.map((f, i) => (
                  <details key={i} className="pn-faq" open={i === 0}>
                    <summary>
                      <Ic n="q" />
                      {f.q}
                    </summary>
                    <div>{f.a}</div>
                  </details>
                ))}
              </Sec>
            ) : null}
            <Sec t="המלצות מהקהילה" sm={l.recs.length ? (l.recs.length === 1 ? 'המלצה אחת' : l.recs.length + ' המלצות') : ''}>
              {l.recs.length ? (
                <div className="pn-wall">
                  {l.recs.map((r, i) => (
                    <div key={i} className="pn-rec">
                      {r.text}
                      <span className="pn-by">
                        {'— '}
                        <span className="pn-nm">{r.by || 'חבר הקהילה'}</span>
                        {' · ' + agoText(r.at, now.nowMs)}
                        {canApprove ? (
                          <button type="button" className="pn-rec-x" aria-label="הסרת ההמלצה" onClick={() => removeRec(i)} style={{ marginInlineStart: 8, border: 0, background: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>
                            ✕
                          </button>
                        ) : null}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pn-reccta">
                  <b>עוד אין המלצות</b>
                  <span>עבדתם איתו? מילה טובה עוזרת לכל הקהילה לבחור.</span>
                </div>
              )}
              <div className="pn-rec-form">
                <input type="text" className="pn-rec-input" maxLength={240} aria-label="המלצה" placeholder="למשל: הגיע בזמן, עבודה נקייה ומחיר הוגן" value={rec.text} onChange={(e) => setRec({ ...rec, text: e.target.value })} />
                <input type="text" className="pn-rec-input" maxLength={60} aria-label="שם הממליץ" placeholder="שם הממליץ (רשות)" value={rec.by} onChange={(e) => setRec({ ...rec, by: e.target.value })} />
                <button className="pn-btn pn-primary" type="button" onClick={addRec}>
                  הוספת המלצה
                </button>
              </div>
            </Sec>
            {canApprove && l.notes.trim() ? (
              <Sec t="הערה פנימית" sm={'רק ה' + gabbai + ' רואה'}>
                <div className="pn-hnote">
                  <Ic n="shield" />
                  {l.notes.trim()}
                </div>
              </Sec>
            ) : null}
            {envS ? (
              <button className="pn-ev-row" type="button" onClick={() => setEnv(true)}>
                <span className="pn-ev-rg" style={vars({ pct: envS.pct })}>
                  <b className="pn-ltr">{envS.pct + '%'}</b>
                </span>
                <span className="pn-tx">
                  <b>המעטפת של העסק</b>
                  <small>{envS.have + ' קשרים בקהילה' + (envS.miss ? ' · ' + envS.miss + ' מקומות פנויים' : '') + ' · רק ה' + gabbai + ' רואה'}</small>
                </span>
                <Ic n="chev" />
              </button>
            ) : null}
            {kupa.n ? (
              <section className="pn-bps pn-kupa" title="זה לא דירוג. כל מטבע הוא פעם שמישהו מהקהילה נעזר">
                <div className="pn-kp-art">
                  <span className="pn-kp-3d">
                    <span className="pn-kp-halo" />
                    <img src={'./parnasa/kupa/' + kupa.art + '.webp'} alt="" width={236} height={275} decoding="async" />
                  </span>
                </div>
                <div className="pn-kp-tx">
                  <span className="pn-kp-k">הקופה של העסק</span>
                  <span className="pn-kp-big">
                    <b className="pn-kp-n">{kupa.n}</b>
                    <span className="pn-kp-l">{(kupa.n === 1 ? 'פעם אחת' : 'פעמים') + ' עזר לקהילה'}</span>
                  </span>
                  <span className="pn-kp-sub">
                    {kupa.ans ? (
                      <span className="pn-kp-m">
                        <KpIc k="ans" />
                        {kupa.ans + ' ' + (kupa.ans === 1 ? 'תשובה' : 'תשובות')}
                      </span>
                    ) : null}
                    {kupa.th ? (
                      <span className="pn-kp-m pn-th">
                        <KpIc k="th" />
                        {kupa.th + ' ' + (kupa.th === 1 ? 'תודה' : 'תודות')}
                      </span>
                    ) : null}
                    {kupa.mo ? <span className="pn-kp-mo">{kupa.mo + ' החודש'}</span> : null}
                  </span>
                </div>
              </section>
            ) : null}
            {near.length ? (
              <section className="pn-bps pn-nearrow">
                <h3>
                  עובדים לצידו<small>מי שפונה אליו צריך בדרך כלל גם</small>
                </h3>
                <div className="pn-nr-l">
                  {near.map((x) => (
                    <button key={x.e.id} className="pn-nr-c" type="button" onClick={() => props.onOpen(x.e.id)}>
                      <Medal l={x.e} feat={isFeatured(x.e, now.todayIso)} />
                      <span>
                        <b>{x.e.name}</b>
                        <small>{x.why || x.e.title}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
            {inTrade.length || (requestsOn && l.status === 'approved') ? (
              <Sec t="מה מבקשים בתחום" sm={inTrade.length ? String(inTrade.length) : ''}>
                <p className="pn-note" style={{ margin: '0 0 8px', fontSize: 13, opacity: 0.8 }}>
                  {l.source === 'gabbai'
                    ? 'הוזן ע״י ה' + gabbai + ' — לא מקבל ניתוב אוטומטי (טלפון כשר); ה' + gabbai + ' מתקשר/ת כשמתאים.'
                    : 'כך ה' + word + ' רואה כל ' + reqWord + ': ' + reqWord + ' בשקט — בלי שם ובלי טלפון של הפונה.'}
                </p>
                {inTrade.length ? (
                  <div className="pn-rqs">
                    {inTrade.map((v) => (
                      <div key={v.id} className={cx('pn-rq', v.urgent && 'pn-urgent')}>
                        <div className="pn-rq-tx">
                          {v.urgent ? (
                            <span className="pn-badge pn-urg">
                              <i />
                              דחוף
                            </span>
                          ) : null}
                          <p style={{ whiteSpace: 'pre-line' }}>{v.text}</p>
                          <span className="pn-rq-m">
                            {agoText(v.createdAt, now.nowMs)}
                            {v.quiet ? (
                              <>
                                {' · '}
                                <b className="pn-q-m">
                                  <Ic n="shield" />
                                  בשקט, לא יודעים מי ביקש
                                </b>
                              </>
                            ) : v.contact && (v.contact.name || v.contact.phone) ? (
                              <>
                                {' · ' + v.contact.name + ' '}
                                <bdi dir="ltr">{v.contact.phone}</bdi>
                              </>
                            ) : null}
                          </span>
                        </div>
                        <button className="pn-rq-b pn-bd" type="button" data-act="imAvail" onClick={() => setRespondTo({ id: v.id, quiet: v.quiet })}>
                          <Ic n="hand" />
                          אני זמין
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pn-reccta">
                    <span>{'אין כרגע ' + reqWord + ' פתוחה בתחום.'}</span>
                  </div>
                )}
              </Sec>
            ) : null}
            {gateSp ? (
              <div className="pn-bpspn">
                <Crown />
                <span>
                  {'שער ״' + cat.name + '״ בחסות '}
                  <b>{gateSp.advertiser}</b>
                </span>
              </div>
            ) : null}
            <div className="pn-colo">
              <Pm c="sm" />
              <span>{'חבר ב' + brand}</span>
              <span style={{ fontSize: 12, opacity: 0.75 }}>{l.source === 'gabbai' ? 'הוזן ע״י ה' + gabbai : 'נמסר ע״י בעל ה' + word}</span>
              <div className="pn-acts">
                <button className="pn-btn pn-ghost2" type="button" onClick={() => void copy(shareLine(l, brand), 'הכרטיס הועתק לשיתוף', 'לא הצלחנו להעתיק')}>
                  <Ic n="copy" />
                  העתקת הפרטים כטקסט
                </button>
                {canApprove ? (
                  <button className="pn-btn pn-ghost2" type="button" onClick={() => setEditOpen(true)}>
                    <Crown style={{ width: 18, height: 12 }} />
                    {feat ? 'ניהול ההדגשה' : 'הדגשה'}
                  </button>
                ) : null}
                <button className="pn-btn pn-ghost2" type="button" onClick={() => setEditOpen(true)}>
                  <Ic n="edit" />
                  עריכה
                </button>
                {canApprove && l.status !== 'approved' ? (
                  <button className="pn-btn pn-primary" type="button" onClick={() => decide('approved')}>
                    <Ic n="check" />
                    אישור
                  </button>
                ) : null}
                {canApprove && l.status !== 'rejected' ? (
                  <button className="pn-btn pn-ghost2" type="button" onClick={() => decide('rejected')}>
                    <Ic n="eye" />
                    הסתרה
                  </button>
                ) : null}
                {canDelete ? (
                  <button className="pn-btn pn-ghost2 pn-danger" type="button" onClick={del}>
                    <Ic n="trash" />
                    {armed === 'prl-' + l.id ? 'בטוח?' : 'מחיקה'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div className="pn-bpbar">
          {wa ? (
            <a className="pn-bpwa" href={wa.href} {...(wa.app ? {} : { target: '_blank', rel: 'noopener' })} data-act="wa" onClick={() => ctx.quick.touch(l.id)}>
              <Ic n="wa" f />
              <span>
                {'וואטסאפ' + (ctx.calm ? ' במוצ״ש' : ' עכשיו')}
                <small>{props.qtext ? 'ההודעה מוכנה: ״' + props.qtext + '״' : 'ההודעה כבר כתובה בשבילכם'}</small>
              </span>
            </a>
          ) : tel ? (
            <a className="pn-bpwa pn-tel" href={tel} data-act="call" onClick={() => ctx.quick.touch(l.id)}>
              <Ic n="phone" f />
              <span>
                חיוג<small className="pn-ltr">{l.phone}</small>
              </span>
            </a>
          ) : l.phone ? (
            <button className="pn-bpwa pn-tel" type="button" data-act="copy" onClick={() => copyPhone(l.phone)}>
              <Ic n="copy" />
              <span>
                העתקת המספר<small className="pn-ltr">{l.phone}</small>
              </span>
            </button>
          ) : (
            <span />
          )}
          {wa && tel ? (
            <a className="pn-bpib pn-call" href={tel} data-act="call" aria-label={'חיוג ל' + l.name} onClick={() => ctx.quick.touch(l.id)}>
              <Ic n="phone" f />
            </a>
          ) : null}
          <button className="pn-bpib pn-star" type="button" aria-pressed={fav} aria-label="חיוג מהיר" onClick={toggleFav}>
            <Ic n="star" />
          </button>
        </div>
      </div>
      {lb ? (
        <div
          className="pn-lbox"
          ref={lbRef}
          role="dialog"
          aria-modal="true"
          aria-label="תמונות מהעסק"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLb(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Tab' && lbRef.current) trapTab(lbRef.current, e.nativeEvent);
          }}
          onPointerDown={(e) => {
            (lbRef.current as HTMLDivElement & { x0?: number }).x0 = e.clientX;
          }}
          onPointerUp={(e) => {
            const x0 = (lbRef.current as HTMLDivElement & { x0?: number }).x0;
            if (x0 == null) return;
            (lbRef.current as HTMLDivElement & { x0?: number }).x0 = undefined;
            const dx = e.clientX - x0;
            if (Math.abs(dx) > 50 && lb.list.length > 1) setLb({ ...lb, i: (lb.i + (dx < 0 ? 1 : -1) + lb.list.length) % lb.list.length });
          }}
        >
          <img src={lb.list[lb.i]} alt="" />
          <button className="pn-lbb pn-x" type="button" aria-label="סגירה" onClick={() => setLb(null)}>
            <Ic n="x" />
          </button>
          {lb.list.length > 1 ? (
            <>
              <button className="pn-lbb pn-nx" type="button" aria-label="התמונה הבאה" onClick={() => setLb({ ...lb, i: (lb.i + 1) % lb.list.length })}>
                <Ic n="chev" />
              </button>
              <button className="pn-lbb pn-pv" type="button" aria-label="התמונה הקודמת" onClick={() => setLb({ ...lb, i: (lb.i - 1 + lb.list.length) % lb.list.length })}>
                <Ic n="back" />
              </button>
            </>
          ) : null}
          <div className="pn-lbn">{lb.list.length > 1 ? lb.i + 1 + ' מתוך ' + lb.list.length : ''}</div>
        </div>
      ) : null}
      {env ? (
        <div
          className="pn-ev-ov"
          role="dialog"
          aria-modal="true"
          aria-label={'המעטפת של ' + l.name}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEnv(false);
          }}
        >
          <div className="pn-ev-sheet">
            <div className="pn-ev-top">
              <b>{'המעטפת של ' + l.name}</b>
              <button className="pn-ib" type="button" aria-label="סגירה" autoFocus onClick={() => setEnv(false)}>
                <Ic n="x" />
              </button>
            </div>
            <EnvMap
              b={l}
              listings={listings}
              brand={brand}
              inSheet
              onOpen={(id) => {
                setEnv(false);
                props.onOpen(id);
              }}
              onCopy={(t) => void copy(t, 'ההזמנה הועתקה. שלחו אותה למי שאתם מכירים', 'לא הצלחנו להעתיק')}
            />
          </div>
        </div>
      ) : null}
      {editOpen ? <ListingForm listing={l} onClose={() => setEditOpen(false)} /> : null}
      {respondTo ? (
        <OrbitLayer>
          <Modal title={respondTo.quiet ? 'שליחת תשובה (בשקט)' : '✋ סימון זמין'} onClose={() => setRespondTo(null)}>
            {respondTo.quiet ? (
              <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 8 }}>המבקש יראה את התשובה ואת הכרטיס שלך. אתה לא תדע מי הוא, עד שהוא יבחר לפנות.</div>
            ) : null}
            <Field label={respondTo.quiet ? 'התשובה *' : 'הערה (רשות)'}>
              <textarea
                rows={3}
                value={respText}
                onChange={(e) => setRespText(e.target.value.slice(0, 500))}
                placeholder={respondTo.quiet ? 'למשל: אני מטפלת רגשית מוסמכת, מקבלת בבית, הפגישה הראשונה בחינם. אפשר להתקשר בכל ערב.' : 'זמין מחר בבוקר'}
              />
            </Field>
            <div className="modal-actions">
              <Btn kind="primary" onClick={respond}>
                שליחה
              </Btn>
              <Btn onClick={() => setRespondTo(null)}>ביטול</Btn>
            </div>
          </Modal>
        </OrbitLayer>
      ) : null}
    </PnPortal>
  );
}
