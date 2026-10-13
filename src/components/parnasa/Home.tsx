/**
 * 📒 פרנסה׳לע — "מה צריך?" של המקור (עיצוב 2): הבמה (ברכה · "מה צריך?" ענק · תיבת-השאלה · חיוג-מהיר או חיפושים-נפוצים ·
 * "בעונה הזו" · ששת מטבעות-העונה + מטבע-הפלטינה בחסות), מקטעי-הבית (שבוע טוב · החודש בקהילה · מבקשים עכשיו · מומלצי
 * השבוע · שורת-החסות · כל האלפון / עוד באלפון: כל התחומים + חדש בפרנסה׳לע · לבעלי עסקים · שורת-הסיכום) והתשובות
 * (שורת-ההבנה עם ההדגשות והמושגים · באנרי-תמונה — הראשון מלא, השאר שורות · "לא מצאתי" / "פרסום בלוח הבקשות").
 * המבנה והמחלקות = המקור (parnasale.html L2164–2207, L3249–3790) בקידומת pn-; הנוסח מילה במילה.
 * וואטסאפ מגודר-הרחבה (integrationOn(config, 'whatsapp') דרך usePnContact) · חיוג מגודר-טלפוניה (telephonyOn(config)).
 */
import { useRef, type CSSProperties, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import type { PrAd, PrListing, PrRequest } from '../../types/domain';
import { categoryOf, isFeatured, listingStatus, PR_CATEGORIES, PR_CONCEPTS, prNorm, type PrSearchHit, type PrSearchResult } from './lib';
import { agoText } from './labels';
import { cx, Crown, Ic, Pm, RawHtml, Seal, vars } from './skin';
import { coinHTML, miniCoin, monoIcon, monoOf } from './coins';
import { medalColor, PN_EDITIONS, shortName, TRADE_COIN, tradeIcon, type PnEdition, type PnGreeting, type PnSeason } from './home';
import { nameFit, photoOf, photoUrl, PN_PBC, sceneSvg } from './banners';
import type { PrNow, PnContact } from './hooks';

const nis = (n: number): string => Math.round(n || 0).toLocaleString('en-US') + ' ₪';
const isImg = (s: unknown): s is string => typeof s === 'string' && /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/.test(s);

/* ═══════════════ מדליון (medal) ═══════════════ */

export function Medal(props: { l: PrListing; feat?: boolean; extra?: ReactNode }) {
  const l = props.l as PrListing & { logo?: string; palette?: string };
  const style = vars({ c: medalColor(l) });
  if (isImg(l.logo))
    return (
      <span className={cx('pn-med pn-logo', props.feat && 'pn-gold')} style={style} aria-hidden="true">
        <img src={l.logo} alt="" decoding="async" />
        {props.extra}
      </span>
    );
  return (
    <span className={cx('pn-med pn-tic', props.feat && 'pn-gold')} style={style} aria-hidden="true">
      <Ic n={tradeIcon(l)} />
      {props.extra}
    </span>
  );
}

/* ═══════════════ באנר-התמונה (bnHTML) ═══════════════ */

/** מילים שנמצאו ⇒ <mark> בשם (hiName במקור). */
function HiName(props: { name: string; words: readonly string[] }) {
  if (!props.words.length) return <>{props.name}</>;
  const parts = String(props.name).split(' ');
  return (
    <>
      {parts.map((w, i) => {
        const nw = prNorm(w);
        const hit = !!nw && props.words.some((t) => t.length >= 2 && nw.startsWith(t));
        return (
          <span key={i}>
            {i ? ' ' : ''}
            {hit ? <mark>{w}</mark> : w}
          </span>
        );
      })}
    </>
  );
}

const PB_PIN = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
    <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

/** מבצע פעיל (offerOn במקור) — טקסט ותוקף (כולל) מול היום. */
export function offerOf(l: PrListing, todayIso: string): { text: string; until: string } | null {
  const o = (l as PrListing & { offer?: { text?: string; until?: string } }).offer;
  if (!o || typeof o.text !== 'string' || !o.text.trim()) return null;
  const until = typeof o.until === 'string' ? o.until : '';
  return !until || until >= todayIso ? { text: o.text.trim(), until } : null;
}
const dm = (iso: string): string => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? Number(iso.slice(8, 10)) + '.' + Number(iso.slice(5, 7)) : '');

export interface BannerOpts {
  i: number;
  words?: readonly string[];
  qtext?: string;
  sel?: boolean;
  anim?: boolean;
  spon?: boolean;
  row?: boolean;
  sm?: boolean;
  why?: string;
}

export function Banner(props: {
  l: PrListing;
  o: BannerOpts;
  now: PrNow;
  brand: string;
  contact: PnContact;
  reduced: boolean;
  onOpen: (id: string, ev: { x: number; y: number; art: Element | null; kb: boolean }) => void;
  onTouch: (id: string) => void;
  onCopy: (phone: string, id: string) => void;
}) {
  const { l, o } = props;
  const ext = l as PrListing & { palette?: string; logo?: string; tagline?: string };
  const feat = isFeatured(l, props.now.todayIso);
  const of = offerOf(l, props.now.todayIso);
  const waMsg = 'שלום, הגעתי אליך דרך ' + props.brand + '.' + (o.qtext ? ' צריך עזרה: ' + o.qtext : '');
  const wa = l.whatsapp ? props.contact.wa(l.whatsapp, waMsg) : null;
  const tel = props.contact.tel(l.phone);
  const ph = photoOf(ext);
  const c = ph ? PN_PBC[ph] : undefined;
  const cat = categoryOf(l.category);
  const tg = l.title || cat.name;
  const wh = l.area || l.city || cat.name;
  const vb = c ? (c.vb ?? '0 0 1408 765') : '0 0 1408 768';
  const badges = [l.disc && 'disc', l.free && 'free'].filter(Boolean).slice(0, 2) as string[];
  const cls = cx(
    'pn-bn pn-pbn',
    c && !c.r && 'pn-left',
    c?.warm && 'pn-warm',
    c?.cool && 'pn-cool',
    !c && 'pn-nophoto',
    o.sm && 'pn-sm',
    feat && 'pn-feat',
    o.spon && 'pn-spon',
    of && 'pn-has-of',
    o.sel && 'pn-sel',
    o.anim && 'pn-in',
    o.row && 'pn-row',
  );
  const label =
    l.name + (tg ? ' · ' + tg : '') + (wh ? ' · ' + wh : '') + (of ? ' · מבצע: ' + of.text : '') + '. לדף העסק' + (l.phone ? '. החלקה ימינה או W: ' + (wa ? 'וואטסאפ' : 'העתקת המספר') + (tel ? '. החלקה שמאלה: חיוג' : '') : '');
  return (
    <article
      role="listitem"
      className={cls}
      data-pal={ext.palette || 'velvet'}
      data-ph={ph || 'brand'}
      data-fx={c ? c.fx : ''}
      data-key={l.id}
      style={vars({ i: Math.min(o.i, 8), pw: c ? c.pw : '60%', pin: c?.pin ?? '#f3c98a' })}
    >
      <div className="pn-pbn-box">
        <div className="pn-pbn-rv" aria-hidden="true">
          <Ic n={wa ? 'wa' : 'copy'} f={!!wa} />
          <span>{wa ? 'וואטסאפ' : 'העתקת המספר'}</span>
        </div>
        {tel ? (
          <div className="pn-pbn-rv pn-call" aria-hidden="true">
            <Ic n="phone" f />
            <span>חיוג</span>
          </div>
        ) : null}
        <div className="pn-pbn-sl">
          <div className="pn-pbn-fr">
            {c ? (
              <svg className="pn-pbn-sc" viewBox={vb} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
                <RawSvgG className="pn-pbn-kb" style={{ transformOrigin: c.o }} html={sceneSvg(c, photoUrl(ph), props.reduced)} />
              </svg>
            ) : (
              <span className="pn-pbn-brand" aria-hidden="true">
                <i />
              </span>
            )}
            <span className="pn-pbn-sh" aria-hidden="true" />
            <svg className="pn-pbn-rp" viewBox={vb} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
              <g />
            </svg>
            <button
              className="pn-bn-hit"
              type="button"
              aria-keyshortcuts="W"
              aria-label={label}
              onClick={(e) => props.onOpen(l.id, { x: e.clientX, y: e.clientY, art: e.currentTarget.closest('.pn-pbn'), kb: !e.detail })}
            >
              <span className="pn-pbn-in">
                <span className="pn-pbn-top">
                  <span className="pn-bn-med">
                    {isImg(ext.logo) ? (
                      <img src={ext.logo} alt="" decoding="async" />
                    ) : (
                      <b className="pn-tic">
                        <Ic n={tradeIcon(l)} />
                      </b>
                    )}
                  </span>
                  <span className={cx('pn-bn-nm', nameFit(l.name) && 'pn-' + nameFit(l.name))}>
                    <HiName name={l.name} words={o.words ?? []} />
                  </span>
                </span>
                {tg ? <span className="pn-bn-tg">{tg}</span> : null}
                {wh ? (
                  <span className="pn-bn-ar">
                    {PB_PIN}
                    <span>{wh}</span>
                  </span>
                ) : null}
                {badges.length ? (
                  <span className="pn-bn-bs">
                    {badges.map((b) => (
                      <span key={b} className={cx('pn-bn-b', b === 'free' && 'pn-ok')}>
                        {b === 'disc' ? 'הנחה לקהילה' : 'גמ״ח'}
                      </span>
                    ))}
                  </span>
                ) : null}
              </span>
              {of ? (
                <span className="pn-bn-of">
                  <span className="pn-fold" />
                  <span className="pn-txt">
                    <span className="pn-eye">מבצע</span>
                    <span className="pn-t">{of.text}</span>
                  </span>
                  {of.until ? (
                    <span className="pn-u">
                      עד<b>{dm(of.until)}</b>
                    </span>
                  ) : null}
                </span>
              ) : null}
            </button>
            {o.spon || feat ? (
              <span className="pn-pbn-tr">
                {o.spon ? (
                  <span className="pn-badge pn-spon pn-pbn-mk">
                    <Crown />
                    בחסות · מוצמד ראשון
                  </span>
                ) : (
                  <span className="pn-bn-seal pn-pbn-mk" aria-label="מומלץ פרנסה׳לע (כרטיס מודגש)">
                    <Crown />
                    מומלץ
                  </span>
                )}
              </span>
            ) : null}
            {wa ? (
              <a
                className="pn-bn-wa"
                href={wa.href}
                {...(wa.app ? {} : { target: '_blank', rel: 'noopener' })}
                data-act="wa"
                aria-label={'וואטסאפ ל' + l.name}
                onClick={() => props.onTouch(l.id)}
              >
                <Ic n="wa" f />
              </a>
            ) : l.phone ? (
              <button className="pn-bn-wa pn-cp" type="button" data-act="copy" aria-label={'העתקת המספר של ' + l.name} onClick={() => props.onCopy(l.phone, l.id)}>
                <Ic n="copy" />
              </button>
            ) : null}
            {tel ? <a className="pn-bn-call" href={tel} data-act="call" tabIndex={-1} aria-hidden="true" hidden onClick={() => props.onTouch(l.id)} /> : null}
          </div>
        </div>
      </div>
      {o.why ? (
        <span className="pn-bn-why">
          <Ic n="ai" />
          {o.why}
        </span>
      ) : null}
    </article>
  );
}

/** <g> עם תוכן-SVG סטטי (שכבות-החיים) — דרך RawHtml של skin.tsx בלבד. */
function RawSvgG(props: { className: string; style: CSSProperties; html: string }) {
  return <RawHtml tag="g" className={props.className} style={props.style} html={props.html} />;
}

/* ═══════════════ הבמה: "מה צריך?" + מטבעות-העונה ═══════════════ */

export interface CoinTileData {
  label: string;
  coin: string;
  n: number | null;
  pressed: boolean;
}

export interface SponsorCoin {
  ad: PrAd;
  label: string;
  n: number | null;
}

export function AskStage(props: {
  mode: 'ask' | 'answer';
  q: string;
  onInput: (v: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onClear: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
  calm: boolean;
  greeting: PnGreeting;
  season: PnSeason;
  edition: PnEdition;
  tiles: CoinTileData[];
  sponsor: SponsorCoin | null;
  placeholderPrice: number | null;
  dial: PrListing[];
  favs: readonly string[];
  now: PrNow;
  gridRef: RefObject<HTMLDivElement | null>;
  onTile: (i: number, el: HTMLElement) => void;
  onSponsor: (el: HTMLElement) => void;
  onCoinAdmin: () => void;
  onTry: (q: string) => void;
  onOpen: (id: string) => void;
}) {
  const E = PN_EDITIONS[props.edition];
  const g = props.greeting;
  return (
    <div className="pn-stage">
      <p className="pn-greet">
        <span className="pn-g">{g.g}</span>
        {g.hd ? <span className="pn-hd">{g.hd}</span> : null}
        {g.notes.map((n, i) => (
          <span key={i} className={'pn-shabn ' + n.cls.split(' ').map((c) => 'pn-' + c).join(' ')}>
            {n.icon ? <Ic n={n.icon} /> : null}
            {n.text}
          </span>
        ))}
      </p>
      <h2 className="pn-q">
        מה צריך<span className="pn-qm">?</span>
      </h2>
      <p className="pn-sub">{props.calm ? 'שבת שלום. לשעת צורך, האדם הנכון כאן.' : 'כותבים את הבעיה במילים שלכם, ומקבלים את האדם הנכון.'}</p>
      <div className="pn-box" role="search">
        <label className="pn-field">
          <Ic n="search" className="pn-lens" />
          <span className="pn-sr">מה צריך?</span>
          <input
            ref={props.inputRef}
            className="pn-ask"
            type="search"
            autoComplete="off"
            enterKeyHint="go"
            placeholder="נזילה, קצר בחשמל, מלמד…"
            aria-controls="pn-answers"
            value={props.q}
            onChange={(e) => props.onInput(e.target.value)}
            onKeyDown={props.onKeyDown}
          />
          <span className="pn-kbd" aria-hidden="true">
            /
          </span>
          <button className="pn-clear" type="button" aria-label="ניקוי וחזרה לשאלה" onClick={props.onClear}>
            <Ic n="x" />
          </button>
        </label>
      </div>
      {props.dial.length ? (
        <div className="pn-dial">
          <h2 className="pn-sec-h">חיוג מהיר</h2>
          <div className="pn-row">
            {props.dial.map((l) => {
              const st = listingStatus(l, props.now.clock, props.now.closureAt);
              return (
                <button key={l.id} className="pn-qd" type="button" aria-label={l.name} onClick={() => props.onOpen(l.id)}>
                  <Medal
                    l={l}
                    feat={isFeatured(l, props.now.todayIso)}
                    extra={
                      <>
                        {props.favs.includes(l.id) ? (
                          <span className="pn-fs">
                            <Ic n="star" f />
                          </span>
                        ) : null}
                        {st && st.k === 'open' ? <span className="pn-live" /> : null}
                      </>
                    }
                  />
                  <span className="pn-n">{shortName(l.name)}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="pn-pop" role="group" aria-label="חיפושים נפוצים">
          <span className="pn-pk">חיפושים נפוצים</span>
          {props.season.pop.map((q) => (
            <button key={q} className="pn-chipb" type="button" onClick={() => props.onTry(q)}>
              {q}
            </button>
          ))}
        </div>
      )}
      <div className="pn-seah">
        <h2>
          <span className="pn-k">{E.name ? 'בעונה הזו · ' + E.name : 'בעונה הזו'}</span>
          {props.season.t}
        </h2>
      </div>
      <div className="pn-probs pn-cn-on" data-ed={props.edition} ref={props.gridRef}>
        {props.tiles.map((t, i) => {
          const n = [...t.label].length;
          return (
            <button
              key={t.coin + i}
              className="pn-pb pn-ct"
              type="button"
              style={vars({ i })}
              aria-pressed={props.mode === 'answer' && t.pressed}
              aria-label={
                t.label + (t.n == null ? '' : ' · ' + (t.n === 1 ? 'בעל מקצוע אחד' : t.n + ' בעלי מקצוע')) + '. לחיצה: חיפוש. לחיצה ארוכה או F: מספר בעלי המקצוע'
              }
              data-n={t.n ?? ''}
              onClick={(e) => props.onTile(i, e.currentTarget)}
            >
              <RawHtml className="pn-cn-nest" html={coinHTML(t.coin, E.metal, E.rim, { n: t.n })} />
              <span className={cx('pn-cn-lbl', n > 11 ? 'pn-xlong' : n > 9 && 'pn-long')}>
                <span className="pn-nm">{t.label}</span>
                <span className="pn-cta" aria-hidden="true">
                  לחצו לחיפוש ←
                </span>
              </span>
            </button>
          );
        })}
        {props.sponsor ? (
          <button
            className="pn-ct pn-sp"
            type="button"
            style={vars({ i: 6 })}
            aria-label={props.sponsor.label + ', בחסות ' + props.sponsor.ad.advertiser + (props.sponsor.n == null ? '' : ' · ' + props.sponsor.n + ' בעלי מקצוע')}
            onClick={(e) => props.onSponsor(e.currentTarget)}
          >
            <RawHtml
              className="pn-cn-nest"
              html={
                coinHTML(null, 'plat', 'beads', { ic: monoIcon(monoOf((props.sponsor.ad as PrAd & { mono?: string }).mono, props.sponsor.ad.advertiser)), n: props.sponsor.n }) +
                '<span class="pn-cn-ribbon" aria-hidden="true">בחסות</span>'
              }
            />
            <span className="pn-cn-sptx">
              <span className="pn-cn-lbl">
                <span className="pn-nm">{props.sponsor.label + ' ◆ בחסות ' + props.sponsor.ad.advertiser}</span>
                <span className="pn-cta" aria-hidden="true">
                  לחצו לחיפוש ←
                </span>
              </span>
              <span className="pn-cn-sub">{props.sponsor.ad.headline || 'מוצג ראשון בתוצאות'}</span>
            </span>
          </button>
        ) : props.placeholderPrice != null ? (
          <button className="pn-ct pn-sp pn-ph" type="button" onClick={props.onCoinAdmin}>
            <span className="pn-cn-ghost" aria-hidden="true">
              ◆
            </span>
            <span style={{ minWidth: 0 }}>
              <b>כאן יופיע מטבע פלטינה בחסות</b>
              <small>{'למכירה · ' + nis(props.placeholderPrice) + ' לחודש · רק הגבאי רואה'}</small>
            </span>
            <Ic n="chev" />
          </button>
        ) : null}
        <p className="pn-cn-hint" aria-hidden="true">
          לחיצה: חיפוש · לחיצה ארוכה: כמה בעלי מקצוע יש
        </p>
      </div>
    </div>
  );
}

/* ═══════════════ מקטעי-הבית ═══════════════ */

function Hs(props: { id: string; title: ReactNode; k?: string; link?: ReactNode }) {
  return (
    <div className="pn-hs">
      <h2 id={props.id}>{props.title}</h2>
      {props.k ? <span className="pn-hk">{props.k}</span> : null}
      {props.link}
    </div>
  );
}

/** הודעת-הפנייה למבקש (reqMsg במקור). */
export function reqMsg(r: PrRequest, brand: string): string {
  return 'שלום, ראיתי את הבקשה שלך ב' + brand + ': ״' + String(r.text || '').slice(0, 140) + '״. יש לי מישהו בשבילך:';
}

/**
 * החלקת שורת-בקשה (rsw במקור): ימינה ⇒ וואטסאפ, שמאלה ⇒ חיוג — המספר עצמו לא מוצג בשורה. רק לבקשה פתוחה עם
 * טלפון, ורק הכיוונים שהארגון הדליק (וואטסאפ = הרחבה, חיוג = טלפוניה); בלי אף אחד ⇒ השורה כמות-שהיא.
 */
export function Rsw(props: { r: PrRequest; msg: string; contact: PnContact; children: ReactNode }) {
  const { r } = props;
  const phone = r.requester.phone;
  const wa = phone && r.status !== 'closed' ? props.contact.wa(phone, props.msg) : null;
  const tel = phone && r.status !== 'closed' ? props.contact.tel(phone) : null;
  if (!wa && !tel) return <>{props.children}</>;
  return (
    <div className="pn-rsw" data-rid={r.id}>
      <div className="pn-rsw-rv pn-wa" aria-hidden="true">
        <Ic n="wa" f />
        <span>וואטסאפ</span>
      </div>
      <div className="pn-rsw-rv pn-call" aria-hidden="true">
        <Ic n="phone" f />
        <span>חיוג</span>
      </div>
      {wa ? <a className="pn-rsw-a pn-wa" href={wa.href} {...(wa.app ? {} : { target: '_blank', rel: 'noopener' })} tabIndex={-1} aria-hidden="true" hidden /> : null}
      {tel ? <a className="pn-rsw-a pn-call" href={tel} tabIndex={-1} aria-hidden="true" hidden /> : null}
      <div className="pn-rsw-sl">{props.children}</div>
    </div>
  );
}

/** שורת-בקשה בבית (rqHTML): דחוף · הטקסט · "שם-המבקש (או חבר הקהילה) · לפני… · תחום/הצעת עבודה" · "מכיר מישהו?" — בתוך ההחלקה. */
export function RqRow(props: { r: PrRequest; urgent: boolean; nowMs: number; brand: string; contact: PnContact; onSee: (id: string) => void }) {
  const r = props.r;
  const msg = reqMsg(r, props.brand);
  const wa = r.requester.phone ? props.contact.wa(r.requester.phone, msg) : null;
  const cat = r.category ? categoryOf(r.category) : null;
  return (
    <Rsw r={r} msg={msg} contact={props.contact}>
      <div className={cx('pn-rq', props.urgent && 'pn-urgent')}>
        <div className="pn-rq-tx">
          {props.urgent ? (
            <span className="pn-badge pn-urg">
              <i />
              דחוף
            </span>
          ) : null}
          <p>{r.text}</p>
          <span className="pn-rq-m">
            <span className="pn-nm">{r.requester.name.trim() || 'חבר הקהילה'}</span>
            {' · ' + agoText(r.createdAt, props.nowMs)}
            {r.job ? (
              <>
                {' · '}
                <b>הצעת עבודה</b>
              </>
            ) : cat ? (
              ' · ' + cat.short
            ) : null}
          </span>
        </div>
        {wa ? (
          <a className="pn-rq-b" href={wa.href} {...(wa.app ? {} : { target: '_blank', rel: 'noopener' })}>
            <Ic n="wa" f />
            מכיר מישהו?
          </a>
        ) : (
          <button className="pn-rq-b pn-bd" type="button" onClick={() => props.onSee(r.id)}>
            <Ic n="hand" />
            מכיר מישהו?
          </button>
        )}
      </div>
    </Rsw>
  );
}

export interface HomeData {
  empty: boolean;
  week: PrRequest[] | null;
  pulse: { found: number; answered: number; thanks: number };
  asking: PrRequest[];
  feats: { shown: PrListing[]; total: number };
  sponsorLine: PrAd | null;
  trades: Array<{ k: string; n: number }>;
  newbies: Array<{ l: PrListing; t: number }>;
  stats: { n: number; cats: number; reqs: number };
}

export function HomeSections(props: {
  d: HomeData;
  now: PrNow;
  brand: string;
  contact: PnContact;
  reduced: boolean;
  canApprove: boolean;
  featuredPrice: number;
  edition: PnEdition;
  moreOpen: boolean;
  setMoreOpen: (on: boolean) => void;
  weekOff: () => void;
  isUrgent: (r: PrRequest) => boolean;
  onBrowse: (cat?: string) => void;
  onOpen: (id: string, ev?: { x: number; y: number; art: Element | null; kb: boolean }) => void;
  onTouch: (id: string) => void;
  onCopy: (phone: string, id: string) => void;
  onSeeReq: (id?: string) => void;
  onAdminRev: () => void;
  onJoin: () => void;
  canJoin: boolean;
  statsRef: RefObject<HTMLParagraphElement | null>;
}) {
  const { d } = props;
  const featRef = useRef<HTMLElement>(null);
  const metal = PN_EDITIONS[props.edition].metal;
  return (
    <div className={cx('pn-home', d.empty && 'pn-is-empty')}>
      {d.week ? (
        <section className="pn-hsec pn-week pn-hWeek" aria-label="שבוע טוב">
          <div className="pn-wk-h">
            <span className="pn-wk-c" aria-hidden="true">
              <Ic n="candle" />
            </span>
            <div>
              <b>שבוע טוב!</b>
              <small>{d.week.length ? (d.week.length === 1 ? 'בקשה אחת חיכתה' : d.week.length + ' בקשות חיכו') + ' לכם מהשבת' : 'שבוע של פרנסה טובה ובשורות טובות'}</small>
            </div>
            <button className="pn-wk-x" type="button" aria-label="סגירה" onClick={props.weekOff}>
              ✕
            </button>
          </div>
          {d.week.length ? (
            <div className="pn-rqs">
              {d.week.slice(0, 4).map((r) => (
                <RqRow key={r.id} r={r} urgent={props.isUrgent(r)} nowMs={props.now.nowMs} brand={props.brand} contact={props.contact} onSee={props.onSeeReq} />
              ))}
            </div>
          ) : null}
          {d.week.length > 4 ? (
            <button className="pn-hl" type="button" onClick={() => props.onSeeReq()}>
              {'לכל ' + d.week.length + ' הבקשות'}
              <Ic n="chev" />
            </button>
          ) : null}
        </section>
      ) : null}
      {d.pulse.found || d.pulse.answered || d.pulse.thanks ? (
        <p className="pn-pulse">
          <span className="pn-pk">
            <Ic n="heart" f />
            החודש בקהילה
          </span>
          {d.pulse.found ? (
            <span>
              <b>{d.pulse.found}</b> {d.pulse.found === 1 ? 'בקשה נמצאה' : 'בקשות נמצאו'}
            </span>
          ) : null}
          {d.pulse.answered ? (
            <span>
              <b>{d.pulse.answered}</b> {d.pulse.answered === 1 ? 'פעם' : 'פעמים'} בעלי מקצוע ענו
            </span>
          ) : null}
          {d.pulse.thanks ? (
            <span>
              <b>{d.pulse.thanks}</b> {d.pulse.thanks === 1 ? 'תודה' : 'תודות'} מהקהילה
            </span>
          ) : null}
        </p>
      ) : null}
      {d.asking.length ? (
        <section className="pn-hsec pn-hReq" aria-labelledby="pn-hReqH">
          <Hs
            id="pn-hReqH"
            title="מבקשים עכשיו"
            link={
              <button className="pn-hl" type="button" onClick={() => props.onSeeReq()}>
                לכל הבקשות
                <Ic n="chev" />
              </button>
            }
          />
          <div className="pn-rqs">
            {d.asking.map((r) => (
              <RqRow key={r.id} r={r} urgent={props.isUrgent(r)} nowMs={props.now.nowMs} brand={props.brand} contact={props.contact} onSee={props.onSeeReq} />
            ))}
          </div>
        </section>
      ) : null}
      {d.feats.shown.length || props.canApprove ? (
        <section className="pn-hsec pn-hFeat" aria-labelledby="pn-hFeatH" ref={featRef}>
          <Hs
            id="pn-hFeatH"
            title={
              <>
                <span className="pn-crn">
                  <Crown />
                </span>
                מומלצי השבוע
              </>
            }
            k={d.feats.shown.length ? '' : 'רק הגבאי רואה'}
          />
          {d.feats.shown.length ? (
            <>
              <div className="pn-bn-list" role="list" aria-label="מומלצי השבוע">
                {d.feats.shown.map((l, i) => (
                  <Banner key={l.id} l={l} o={{ i }} now={props.now} brand={props.brand} contact={props.contact} reduced={props.reduced} onOpen={props.onOpen} onTouch={props.onTouch} onCopy={props.onCopy} />
                ))}
              </div>
              {d.feats.total > 3 ? (
                <button className="pn-ghost" type="button" style={{ justifyContent: 'center', marginTop: 10 }} onClick={() => props.onBrowse()}>
                  {'עוד ' + (d.feats.total - 3) + ' מומלצים באלפון'}
                </button>
              ) : null}
            </>
          ) : (
            <button className="pn-fc-ph" type="button" onClick={props.onAdminRev}>
              <b>כאן יופיעו כרטיסים מודגשים</b>
              <span>{'למכירה · ' + nis(props.featuredPrice) + ' לחודש · להגדרה בניהול'}</span>
              <Ic n="chev" />
            </button>
          )}
        </section>
      ) : null}
      {d.sponsorLine ? <SponsorLine ad={d.sponsorLine} contact={props.contact} /> : null}
      <div className="pn-hmore-r">
        <button className="pn-hmore-all" type="button" onClick={() => props.onBrowse()}>
          <Ic n="book" />
          כל האלפון
        </button>
        <button className="pn-hmore-b" type="button" aria-expanded={props.moreOpen} aria-controls="pn-hMore" onClick={() => props.setMoreOpen(!props.moreOpen)}>
          <span>
            <b>עוד באלפון</b>
            <small>כל התחומים · מצטרפים חדשים</small>
          </span>
          <Ic n="chev" />
        </button>
      </div>
      {props.moreOpen ? (
        <div className="pn-hmore" id="pn-hMore">
          <section className="pn-hsec pn-hTrades" aria-labelledby="pn-hTrH">
            <Hs id="pn-hTrH" title="כל התחומים" k={d.stats.n ? PR_CATEGORIES.length + ' שערים' : 'השערים מחכים לבעלי מקצוע'} />
            <div className="pn-trail">
              {d.trades.map(({ k, n }) => {
                const c = categoryOf(k);
                return (
                  <button key={k} className={cx('pn-tc', !n && 'pn-zero')} type="button" aria-label={c.name + (n ? ': ' + n : '')} onClick={() => props.onBrowse(k)}>
                    <RawHtml className="pn-tc-i pn-cnw" html={miniCoin(TRADE_COIN[k] ?? 'other', metal)} />
                    <span className="pn-tc-l">{c.short}</span>
                    {n ? <span className="pn-tc-n">{n}</span> : null}
                  </button>
                );
              })}
              <button className="pn-tc pn-all" type="button" onClick={() => props.onBrowse()}>
                <span className="pn-tc-i">
                  <Ic n="tab-alfon" />
                </span>
                <span className="pn-tc-l">לכל האלפון</span>
                <Ic n="chev" className="pn-ch" />
              </button>
            </div>
          </section>
          {d.newbies.length ? (
            <section className="pn-hsec pn-hNew" aria-labelledby="pn-hNewH">
              <Hs id="pn-hNewH" title={'חדש ב' + props.brand.split(' של ')[0]} k="הצטרפו או עודכנו לאחרונה" />
              <div className="pn-nrail">
                {d.newbies.map(({ l, t }) => (
                  <button key={l.id} className="pn-nc" type="button" onClick={() => props.onOpen(l.id)}>
                    <Medal l={l} feat={isFeatured(l, props.now.todayIso)} />
                    <span className="pn-nc-n">{l.name}</span>
                    <span className="pn-nc-t">{l.title || categoryOf(l.category).short}</span>
                    <span className="pn-nc-a">{agoText(new Date(t).toISOString(), props.now.nowMs)}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
      <div className="pn-cta">
        <Pm c="lg" />
        <div className="pn-cta-tx">
          <span className="pn-k">לבעלי עסקים</span>
          <h3>יש לך עסק?</h3>
          <p>{'הצטרפו ל' + props.brand.split(' של ')[0] + ' בחינם: דף עסק מלא, וואטסאפ בלחיצה והמלצות מהקהילה.'}</p>
        </div>
        {props.canJoin ? (
          <button className="pn-ghost pn-goldb" type="button" onClick={props.onJoin}>
            <Ic n="plus" />
            הצטרפות בחינם
          </button>
        ) : null}
      </div>
      {d.stats.n || d.stats.reqs ? (
        <p className="pn-statl" ref={props.statsRef}>
          {d.stats.n ? (
            <span>
              <b data-to={d.stats.n}>{d.stats.n.toLocaleString('he-IL')}</b> <span>{d.stats.n === 1 ? 'בעל מקצוע' : 'בעלי מקצוע'}</span>
            </span>
          ) : null}
          {d.stats.n ? (
            <span>
              <b data-to={d.stats.cats}>{d.stats.cats.toLocaleString('he-IL')}</b> <span>{d.stats.cats === 1 ? 'תחום' : 'תחומים'}</span>
            </span>
          ) : null}
          {d.stats.reqs ? (
            <span>
              <b data-to={d.stats.reqs}>{d.stats.reqs.toLocaleString('he-IL')}</b> <span>{d.stats.reqs === 1 ? 'בקשה פתוחה' : 'בקשות פתוחות'}</span>
            </span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

/** שורת-החסות של דף-הבית ("פרנסה׳לע השבוע בחסות"). */
function SponsorLine(props: { ad: PrAd; contact: PnContact }) {
  const a = props.ad as PrAd & { url?: string };
  const url = safeUrl(a.url);
  const tel = a.phone ? props.contact.tel(a.phone) : null;
  return (
    <div className="pn-hsp">
      <span className="pn-hsp-k">
        <Crown />
        פרנסה׳לע השבוע בחסות
      </span>
      <b className="pn-hsp-n">{a.advertiser}</b>
      {a.headline ? <span className="pn-hsp-l">{a.headline}</span> : null}
      {tel || url ? (
        <span className="pn-hsp-a">
          {tel ? (
            <a className="pn-hsp-b" href={tel}>
              <Ic n="phone" f />
              חיוג
            </a>
          ) : null}
          {url ? (
            <a className="pn-hsp-b" href={url} target="_blank" rel="noopener noreferrer">
              <span className="pn-ltr">{hostOf(url)}</span>
            </a>
          ) : null}
        </span>
      ) : a.phone ? (
        <span className="pn-hsp-a">
          <span className="pn-hsp-b pn-ltr">{a.phone}</span>
        </span>
      ) : null}
    </div>
  );
}

/**
 * קישור-אתר בטוח (safeUrl במקור): כתובת בלי סכמה ⇒ https://; http ⇒ משודרג ל-https (מוסכמת אורביט — קישור
 * שמגיע מהנתונים/הענן רק https); כל סכמה אחרת (javascript:, data: …) ⇒ ריק.
 */
export function safeUrl(u: unknown): string {
  if (typeof u !== 'string') return '';
  let s = u.trim();
  if (!s) return '';
  if (/^http:\/\//i.test(s)) s = 'https://' + s.slice(7);
  else if (/^[a-z][a-z0-9+.-]*:(?!\d)/i.test(s) && !/^https:\/\//i.test(s)) return '';
  else if (!/^https:\/\//i.test(s)) s = 'https://' + s;
  try {
    const x = new URL(s);
    return x.protocol === 'https:' && x.hostname ? x.href : '';
  } catch {
    return '';
  }
}
export function hostOf(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return u;
  }
}

/* ═══════════════ התשובות ═══════════════ */

/** שורת-ההבנה (echoHTML): השאלה עם ההדגשות · ← צ'יפי-המושגים (צבע-השער) · שם · אזור · רמזי-המקלדת. */
export function Understood(props: { res: PrSearchResult; qtext: string }) {
  const a = props.res.analysis;
  const hitW = new Set<string>([...a.conHit].map((i) => a.toks[i]));
  for (const w of props.res.words) hitW.add(w);
  const words = props.qtext.split(/\s+/);
  const chips: Array<{ l: string; c?: string }> = a.cons.slice(0, 2).flatMap((c) => {
    const C = PR_CONCEPTS.find((x) => x.k === c.k);
    return C ? [{ l: C.l, c: categoryOf(C.c).color }] : [];
  });
  if (!chips.length && props.res.nameHit) chips.push({ l: 'שם' });
  if (props.res.locHit) chips.push({ l: 'אזור', c: '#5a6878' });
  return (
    <div className="pn-understood">
      <span className="pn-echo">
        {'״'}
        {words.map((w, i) => {
          const hit = prNorm(w)
            .split(' ')
            .some((t) => t && hitW.has(t));
          return (
            <span key={i}>
              {i ? ' ' : ''}
              {hit ? <mark>{w}</mark> : w}
            </span>
          );
        })}
        {'״'}
      </span>
      {chips.length ? <span className="pn-arrow">←</span> : null}
      {chips.map((c, i) => (
        <span key={i} className="pn-cchip" style={c.c ? vars({ c: c.c }) : undefined}>
          <i />
          {c.l}
        </span>
      ))}
      <span className="pn-kbhint">
        <span className="pn-kbd">↑↓</span>בחירה<span className="pn-kbd">Enter</span>וואטסאפ<span className="pn-kbd">Esc</span>ניקוי
      </span>
    </div>
  );
}

/** "לא מצאתי" / "פרסום בלוח הבקשות" (nfHTML). */
export function NotFound(props: { qtext: string; primary: boolean; anim: boolean; few: number; posted: boolean; canPost: boolean; onPostNow: () => void; onPrefill: () => void }) {
  return (
    <div className={cx('pn-nf', props.anim && 'pn-in', props.few && 'pn-few')} style={vars({ i: 6 })}>
      <div className="pn-tx">
        <b>{props.primary ? 'פרסום בלוח הבקשות' : props.few ? (props.few === 1 ? 'רק תוצאה אחת? בקשו מהקהילה' : 'רק ' + props.few + ' תוצאות? בקשו מהקהילה') : 'לא מצאתי'}</b>
        {props.primary ? '״' + props.qtext + '״ יופיע לכל הקהילה, ומי שמכיר יחזור אליכם.' : 'בקשה בלוח, ואנשי הקהילה יעזרו.'}
      </div>
      <div className="pn-acts">
        {props.posted ? (
          <button className="pn-post" type="button" disabled>
            <Ic n="check" />
            פורסם
          </button>
        ) : props.canPost ? (
          <>
            <button className="pn-post" type="button" data-act="postNow" onClick={props.onPostNow}>
              <Ic n="send" />
              פרסום
            </button>
            <button className="pn-post pn-lite" type="button" data-act="postPrefill" onClick={props.onPrefill}>
              <Ic n="edit" />
              עם טלפון
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

/** כרטיס-הנותן בחסות (spCardHTML) — כשמטבע-הפלטינה מוצמד ואין לו עסק באלפון. */
export function SponsorCard(props: { ad: PrAd; contact: PnContact; brand: string }) {
  const a = props.ad as PrAd & { url?: string; mono?: string };
  const url = safeUrl(a.url);
  const wa = a.phone ? props.contact.wa(a.phone, 'שלום, הגעתי אליך דרך ' + props.brand + '.') : null;
  return (
    <div className="pn-spc">
      <RawHtml html={miniCoin(null, 'plat', monoIcon(monoOf(a.mono, a.advertiser)))} />
      <div style={{ minWidth: 0 }}>
        <span className="pn-spc-k">
          <Crown />
          בחסות · מוצמד ראשון
        </span>
        <b>{a.advertiser}</b>
        {a.headline ? <span className="pn-spc-l">{a.headline}</span> : null}
      </div>
      {a.phone || url ? (
        <div className="pn-spc-a">
          {wa ? (
            <a className="pn-hsp-b" href={wa.href} {...(wa.app ? {} : { target: '_blank', rel: 'noopener' })}>
              <Ic n="wa" f />
              וואטסאפ
            </a>
          ) : null}
          {a.phone ? <span className="pn-hsp-b pn-ltr">{a.phone}</span> : null}
          {url ? (
            <a className="pn-hsp-b" href={url} target="_blank" rel="noopener noreferrer">
              <span className="pn-ltr">{hostOf(url)}</span>
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** האזור כולו (drawAnswers). */
export function Answers(props: {
  res: PrSearchResult | null;
  hits: PrSearchHit[];
  qtext: string;
  anyListings: boolean;
  sel: number;
  kb: boolean;
  anim: boolean;
  edition: PnEdition;
  pinnedSponsor: { ad: PrAd; matchId: string | null } | null;
  now: PrNow;
  brand: string;
  contact: PnContact;
  reduced: boolean;
  posted: boolean;
  canPost: boolean;
  boxRef: RefObject<HTMLDivElement | null>;
  onOpen: (id: string, ev?: { x: number; y: number; art: Element | null; kb: boolean }) => void;
  onTouch: (id: string) => void;
  onCopy: (phone: string, id: string) => void;
  onBrowse: () => void;
  onPostNow: () => void;
  onPrefill: () => void;
}) {
  // מטבע-הפלטינה מוצמד: המקור לא מדרג (pinRes) ⇒ אין מילות-שם/אזור — רק מושגי-השאלה מודגשים
  const res = props.res && props.pinnedSponsor ? { ...props.res, words: [], nameHit: false, locHit: false } : props.res;
  const shown = props.hits.slice(0, 12);
  const left = (props.pinnedSponsor ? props.hits.length : (res?.total ?? props.hits.length)) - shown.length;
  const head = (
    <>
      {res ? <Understood res={res} qtext={props.qtext} /> : null}
      {props.pinnedSponsor && !props.pinnedSponsor.matchId ? <SponsorCard ad={props.pinnedSponsor.ad} contact={props.contact} brand={props.brand} /> : null}
    </>
  );
  const nf = (primary: boolean, few = 0) => (
    <NotFound qtext={props.qtext} primary={primary} anim={props.anim} few={few} posted={props.posted} canPost={props.canPost} onPostNow={props.onPostNow} onPrefill={props.onPrefill} />
  );
  let body: ReactNode;
  if (!props.anyListings)
    body = (
      <div className={cx('pn-zero', props.anim && 'pn-in')}>
        <Pm />
        <div className="pn-big">האלפון עוד מתמלא</div>
        <p>עוד אין כרטיסים באלפון. פרסמו בקשה בלוח, ואנשי הקהילה יענו.</p>
        {nf(true)}
      </div>
    );
  else if (!shown.length)
    body = (
      <div className={cx('pn-zero', props.anim && 'pn-in')}>
        <div className="pn-big">
          עוד אין לנו
          <br />
          תשובה לזה.
        </div>
        <p>אבל הקהילה כן. בקשה אחת בלוח, וכולם רואים.</p>
        {nf(true)}
      </div>
    );
  else
    body = (
      <div className="pn-bns">
        <div className="pn-bn-list" role="list" aria-label="בעלי מקצוע שמתאימים">
          {shown.map((h, i) => (
            <Banner
              key={h.listing.id}
              l={h.listing}
              o={{ i, words: res?.words ?? [], qtext: props.qtext, sel: props.sel === i, anim: props.anim && !props.reduced, spon: i === 0 && !!props.pinnedSponsor && props.pinnedSponsor.matchId === h.listing.id, row: i > 0 }}
              now={props.now}
              brand={props.brand}
              contact={props.contact}
              reduced={props.reduced}
              onOpen={props.onOpen}
              onTouch={props.onTouch}
              onCopy={props.onCopy}
            />
          ))}
          {left > 0 ? (
            <button className="pn-ghost" type="button" style={{ justifyContent: 'center' }} onClick={props.onBrowse}>
              {'עוד ' + left + ' באלפון המלא'}
            </button>
          ) : null}
        </div>
        <div className="pn-bn-side">{nf(false, shown.length <= 2 ? shown.length : 0)}</div>
      </div>
    );
  return (
    <div id="pn-answers" className={cx('pn-answers', props.kb && 'pn-kb')} aria-live="polite" ref={props.boxRef} data-ed={props.edition}>
      {head}
      {body}
    </div>
  );
}

export { Seal };
