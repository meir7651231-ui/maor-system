/**
 * 📒 פרנסה׳לע — "לוח בקשות" של המקור (עיצוב 5, renderReq): "בקשה חדשה" בקטיפה שפותח טופס בתוך הלוח, הסינון
 * "פתוחות · הצעות עבודה · הכול", הקבוצות "דחוף · פתוחות · נמצאו", וכל בקשה ככרטיס נפתח (details): תחום / "הצעת
 * עבודה" / "בקשה כללית", שתי שורות של הטקסט, "יום ג׳ · ב׳ חשוון · לפני …", תגים (בשקט · אצל העסקים · דחוף · משרה
 * מקודמת · הצעת עבודה · נמצא); בפנים — הפונה, הטקסט, שורת-המסלול, פנייה (וואטסאפ · חיוג · העתקת המספר, גם בהחלקה),
 * ו"⋯ ניהול · רק הגבאי רואה" (סמן שנמצא — מטבעות-זהב לפושקע · קידום המשרה · הסרת הבקשה).
 * תוספות-הפורט נשמרו בשפת-המקור: חיפוש + תחום, רישום-מענה בשם עסק, 📤 שליחה לעסקים, עריכה, מענים, וחשיפת פרטי
 * פונה בשקט — רק למאשר/ת, בלחיצה, ביומן-הגישה (logAccess).
 * 🛡 פרטיות-שקט: מה שיוצא לעסקים נבנה מ-businessView בלבד (בלי שם/טלפון, טלפון/מייל בטקסט מושחרים); בקשה שקטה
 * מוצגת גם לצוות בלי זהות, בלי החלקה ובלי כפתורי-פנייה.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, integrationOn, telephonyOn, termOf } from '../../lib/config';
import { useRemembered } from '../../lib/filterMemory';
import { smartFilter } from '../../lib/search';
import type { PrListing, PrRequest } from '../../types/domain';
import { Btn, Field, Modal, Select } from '../ui';
import { cx, Crown, Ic, OrbitLayer } from './skin';
import { useArmed } from '../useArmed';
import { WaBtn } from '../WaBtn';
import { CallBtn } from '../CallBtn';
import { businessView, categoryOf, inMinsText, isPromotedJob, isUrgent, PR_CATEGORIES, priceOf, routeRequest, type PrRequestView } from './lib';
import { boardRequests, PN_REQ_GROUPS, reqDateText, reqGroupOf, type PnReqFilter } from './requests';
import { RequestForm } from './RequestForm';
import { usePnContact, usePrBrand, usePrPerms, type PnContact, type PrNow } from './hooks';
import { agoText, pluralOf } from './labels';
import { reqMsg, Rsw } from './Home';
import { installBannerFx } from './bannerFx';
import { foundCoins } from './coinFx';

/** ההודעה לעסק — מתצוגת-העסקים בלבד (שקטה: בלי זהות, טקסט מושחר). */
export function businessMessage(v: PrRequestView, brand: string, word: string): string {
  const t = v.text.length > 140 ? v.text.slice(0, 139) + '…' : v.text;
  return 'שלום, יש ' + word + ' ב' + brand + (v.quiet ? ' (בשקט — בלי פרטי הפונה)' : '') + ': ״' + t + '״. אם זה מתאים לך — חזור אלינו ונחבר.';
}

const nis = (n: number): string => Math.round(n).toLocaleString('en-US') + ' ₪';

export function RequestsTab(props: {
  now: PrNow;
  focusId: string | null;
  onFocusConsumed: () => void;
  draft: Partial<PrRequest> | null;
  onDraftConsumed: () => void;
  onOpenListing: ((id: string) => void) | null;
  /** "לראות אותם" — שער ב"כל האלפון". */
  onSeeCat?: ((cat: string) => void) | null;
  /** הטוסט של הסקין (חסר — של אורביט). */
  toast?: (m: string) => void;
}) {
  const config = useApp((s) => s.config);
  const requests = useApp((s) => s.db.prRequests);
  const listings = useApp((s) => s.db.prListings);
  const orbitToast = useApp((s) => s.toast);
  const toast = props.toast ?? orbitToast;
  const [filter, setFilter] = useRemembered<PnReqFilter>('parnasa.req.filter', 'open');
  const [cat, setCat] = useRemembered<string>('parnasa.req.cat', '');
  const [q, setQ] = useRemembered<string>('parnasa.req.q', '');
  const [openIds, setOpenIds] = useRemembered<string[]>('parnasa.req.open', []);
  // הטופס פתוח (S.reqFormOpen) — שורד מעבר-לשונית; טיוטה מ"לא מצאתי" = טופס חדש
  const [form, setForm] = useRemembered<{ request: PrRequest | null; draft?: Partial<PrRequest> | null; key: string } | null>('parnasa.req.form', null);
  const [focus] = useState<string | null>(props.focusId);
  const { draft, focusId, onDraftConsumed, onFocusConsumed } = props;
  useEffect(() => {
    if (draft) {
      setForm({ request: null, draft, key: 'd' + Date.now() });
      onDraftConsumed();
      toast('ה' + termOf(config, 'entity.prRequest', 'בקשה') + ' מוכנה. הוסיפו טלפון לחזרה ופרסמו');
    }
    if (focusId) {
      setOpenIds((xs) => (xs.includes(focusId) ? xs : [...xs, focusId]));
      onFocusConsumed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- צריכה חד-פעמית של הטיוטה/המיקוד
  }, [draft, focusId]);
  useEffect(() => installBannerFx(toast), [toast]);
  // מיקוד מבחוץ (תור-הטיפול / הבית) ⇒ הכרטיס נפתח, נגלל אליו ומהבהב
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!focus) return;
    const t = setTimeout(() => {
      const el = listRef.current?.querySelector(`details[data-rid="${CSS.escape(focus)}"]`);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('pn-flash');
    }, 120);
    return () => clearTimeout(t);
  }, [focus]);

  const word = termOf(config, 'entity.prRequest', 'בקשה');
  const nowMs = props.now.nowMs;
  const shown = useMemo(() => {
    let list = boardRequests(requests, filter, nowMs);
    if (cat) list = list.filter((r) => r.category === cat);
    if (q.trim()) {
      // 🛡 שם-הפונה של בקשה שקטה לא נכנס לחיפוש (אחרת חיפוש-שם חושף אותה)
      const keep = new Set(smartFilter(q, list, (r) => [r.text, r.area, categoryOf(r.category).name, ...(r.quiet ? [] : [r.requester.name])]).map((r) => r.id));
      list = list.filter((r) => keep.has(r.id));
    }
    return list;
  }, [requests, filter, cat, q, nowMs]);
  const groups = filter !== 'jobs' && new Set(shown.map((r) => reqGroupOf(r, nowMs))).size > 1;
  const counts = groups ? shown.reduce<Record<string, number>>((m, r) => ((m[reqGroupOf(r, nowMs)] = (m[reqGroupOf(r, nowMs)] ?? 0) + 1), m), {}) : {};
  let lastG = '';

  const toggleOpen = (id: string, on: boolean): void => setOpenIds((xs) => (on ? (xs.includes(id) ? xs : [...xs, id]) : xs.filter((x) => x !== id)));
  const openNew = (): void => {
    setForm({ request: null, key: 'new' });
    setTimeout(() => document.querySelector('.pn-reqForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
  };

  return (
    <>
      {!form ? (
        <button className="pn-reqnew" type="button" aria-expanded="false" onClick={openNew}>
          <span className="pn-pl" aria-hidden="true">
            ＋
          </span>
          <span>
            <b>➕ הוספת {termOf(config, 'entity.prRequest', 'בקשה')}</b>
            <small>מחפשים בעל מקצוע או עובד? הקהילה תעזור</small>
          </span>
        </button>
      ) : (
        <RequestForm
          key={form.key + (form.request?.id ?? '')}
          memKey={form.key + (form.request?.id ?? '')}
          request={form.request}
          draft={form.draft}
          toast={toast}
          onClose={() => setForm(null)}
          onOpenListing={props.onOpenListing}
          onSeeCat={props.onSeeCat ?? null}
        />
      )}
      <div className="pn-reqfilter" role="group" aria-label={'סינון ה' + pluralOf(word)}>
        {(
          [
            ['open', 'פתוחות'],
            ['jobs', 'הצעות עבודה'],
            ['all', 'הכול'],
          ] as const
        ).map(([k, l]) => (
          <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>
            {l}
          </button>
        ))}
      </div>
      <label className="pn-filter pn-reqsearch">
        <Ic n="search" />
        <input type="search" autoComplete="off" aria-label={'חיפוש ' + word} placeholder="חיפוש — טקסט, אזור או תחום" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="תחום" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">כל התחומים</option>
          {PR_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.short}
            </option>
          ))}
        </select>
      </label>
      <div className="pn-reqList" ref={listRef} style={{ display: 'grid', gap: 12, marginTop: 14 }}>
        {!shown.length ? (
          <div className="pn-empty">
            <h3>{filter === 'jobs' ? 'אין כרגע הצעות עבודה' : 'אין ' + pluralOf(word) + ' פתוחות'}</h3>
            <div>{word + ' חדשה תופיע כאן לכל חברי הקהילה.'}</div>
          </div>
        ) : (
          shown.map((r) => {
            const g = reqGroupOf(r, nowMs);
            const head =
              groups && g !== lastG ? (
                <div key={'g-' + g} className={'pn-rq-grp pn-' + g}>
                  <b>{PN_REQ_GROUPS[g][0]}</b>
                  <span>{PN_REQ_GROUPS[g][1]}</span>
                  <i>{counts[g]}</i>
                </div>
              ) : null;
            lastG = g;
            return [
              head,
              <ReqCard
                key={r.id}
                request={r}
                listings={listings}
                now={props.now}
                open={openIds.includes(r.id)}
                onToggle={(on) => toggleOpen(r.id, on)}
                toast={toast}
                onEdit={() => {
                  setForm({ request: r, key: 'e' + Date.now() });
                  setTimeout(() => document.querySelector('.pn-reqForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
                }}
                onOpenListing={props.onOpenListing}
              />,
            ];
          })
        )}
      </div>
    </>
  );
}

/** שורת-המסלול (reqRoute במקור) — לצוות: בשקט · זמינים (שמות → דף-העסק) · אצל העסקים + הספירה · פתוחה לקהילה. */
function RouteLine(props: { r: PrRequest; listings: readonly PrListing[]; nowMs: number; onOpenListing: ((id: string) => void) | null }) {
  const { r } = props;
  if (r.status === 'closed') return null;
  const route = routeRequest(r, props.listings, props.nowMs);
  const n = route.recipients.length;
  const who = (Array.isArray(r.responses) ? r.responses : []).map((x) => props.listings.find((l) => l.id === x.listingId)).filter((l): l is PrListing => !!l);
  const nBiz = (k: number): string => (k === 1 ? 'עסק אחד' : '־' + k + ' עסקים');
  if (r.quiet && !r.responses.length)
    return (
      <div className="pn-rq-route pn-quiet">
        <Ic n="shield" />
        <span>
          <b>{'בקשה בשקט'}</b>
          {' · ' + (route.stage === 'gabbai' ? 'אין עדיין עסק בתחום באלפון, הגבאי יכוון באופן אישי' : 'נשלחה רק ל' + nBiz(n) + ' בתחום, בלי השם') + ' · לא תפורסם בלוח ולא תעבור לקהילה'}
        </span>
      </div>
    );
  if (r.responses.length)
    return (
      <div className="pn-rq-route pn-ok">
        <Ic n="check" />
        <span>
          <b>{r.responses.length === 1 ? 'עסק אחד זמין' : r.responses.length + ' עסקים זמינים'}</b> לבקשה הזו
        </span>
        {who.length ? (
          <span className="pn-rq-who">
            {who.map((l) => (
              <button key={l.id} className="pn-chipb" type="button" disabled={!props.onOpenListing} onClick={() => props.onOpenListing?.(l.id)}>
                {l.name}
              </button>
            ))}
          </span>
        ) : null}
      </div>
    );
  if (route.stage === 'biz')
    return (
      <div className="pn-rq-route">
        <Ic n="send" />
        <span>
          <b>{'נשלחה ל' + nBiz(n) + ' בתחום'}</b>
          {' · אם אף אחד לא יענה, תעבור לכל הקהילה בעוד ' + inMinsText(route.msLeft)}
        </span>
        {route.recipients.length ? (
          <span className="pn-rq-who">
            {route.recipients.map((l) => (
              <button key={l.id} className="pn-chipb" type="button" disabled={!props.onOpenListing} onClick={() => props.onOpenListing?.(l.id)}>
                {l.name}
              </button>
            ))}
          </span>
        ) : null}
      </div>
    );
  return (
    <div className="pn-rq-route pn-all">
      <Ic n="hand" />
      <span>
        <b>פתוחה לכל הקהילה</b>
        {r.job || !r.category ? '' : n ? ' · העסקים בתחום לא ענו בזמן' : ' · אין עדיין עסק בתחום הזה באלפון'}
      </span>
    </div>
  );
}

function ReqCard(props: {
  request: PrRequest;
  listings: PrListing[];
  now: PrNow;
  open: boolean;
  onToggle: (on: boolean) => void;
  toast: (m: string) => void;
  onEdit: () => void;
  onOpenListing: ((id: string) => void) | null;
}) {
  const config = useApp((s) => s.config);
  const prefs = useApp((s) => s.db.ui.parnasa);
  const addPrResponse = useApp((s) => s.addPrResponse);
  const closePrRequest = useApp((s) => s.closePrRequest);
  const deletePrRequest = useApp((s) => s.deletePrRequest);
  const setPrJobPromo = useApp((s) => s.setPrJobPromo);
  const logAccess = useApp((s) => s.logAccess);
  const brand = usePrBrand();
  const contact: PnContact = usePnContact();
  const { canApprove, canDelete } = usePrPerms();
  const { armed, confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  const [revealed, setRevealed] = useState(false);
  const [respondOpen, setRespondOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [resp, setResp] = useState({ listingId: '', text: '' });

  const r = props.request;
  const { toast } = props;
  const { nowMs, loc } = props.now;
  const word = termOf(config, 'entity.prRequest', 'בקשה');
  const lWord = termOf(config, 'entity.prListing', 'עסק');
  const gabbai = termOf(config, 'entity.prGabbai', 'גבאי');
  const waOn = integrationOn(config, 'whatsapp');
  const telOn = telephonyOn(config);
  const view = businessView(r, nowMs);
  const route = routeRequest(r, props.listings, nowMs);
  const closed = r.status === 'closed';
  const urgent = isUrgent(r, nowMs);
  const promo = isPromotedJob(r);
  const hidden = r.quiet && !revealed;
  // מי יכול לענות: מקבלי-הבקשה + רשומות-גבאי מאושרות באותו שער (הגבאי רושם בשמם)
  const responders = r.category ? props.listings.filter((l) => l.status === 'approved' && l.category === r.category) : [];
  const gabbaiOnly = responders.filter((l) => l.source === 'gabbai');
  const nameOf = (id: string): string => props.listings.find((l) => l.id === id)?.name ?? (id ? lWord + ' שהוסר' : 'מענה ידני של ה' + gabbai);
  const showText = hidden ? view.text : r.text;
  const title = r.category ? categoryOf(r.category).name : r.job ? 'הצעת עבודה' : 'בקשה כללית';
  const phone = hidden || closed ? '' : r.requester.phone;
  const msg = reqMsg(r, brand);
  const wa = phone ? contact.wa(phone, msg) : null;
  const tel = phone ? contact.tel(phone) : null;
  const rootOf = (el: Element | null): Element | null => el?.closest('.pn-root') ?? document.querySelector('.pn-root');

  function respond(): void {
    if (r.quiet && !resp.text.trim()) return toast('לבקשה בשקט — כתבו את התשובה (הפונה יראה אותה)');
    if (addPrResponse(r.id, { listingId: resp.listingId, text: resp.text.trim() || 'זמין' })) {
      toast('המענה נרשם');
      setRespondOpen(false);
      setResp({ listingId: '', text: '' });
    }
  }

  /** "סמן שנמצא" — מטבע-זהב לכל עסק שעזר (foundCoins); בשקט ⇒ נמחקת עם כל התשובות (שתי לחיצות). */
  function closeIt(btn: HTMLElement): void {
    if (r.quiet && !confirmTwice('prqc-' + r.id, 'למחוק את ה' + word + ' וכל התשובות?')) {
      toast('בקשה בשקט נמחקת בסגירה — לחיצה נוספת בתוך 3.5 שניות');
      return;
    }
    const from = btn.getBoundingClientRect();
    const root = rootOf(btn);
    const helpers = (Array.isArray(r.responses) ? r.responses : []).map((x) => props.listings.find((l) => l.id === x.listingId)?.name).filter((x): x is string => !!x);
    if (!closePrRequest(r.id)) return;
    toast(r.quiet ? 'נמצא! ה' + word + ' וכל התשובות נמחקו' : helpers.length ? 'נמצא! מטבע זהב ל' + helpers.join(', ') : 'סומן שנמצא. בהצלחה!');
    foundCoins(from, root, helpers.length);
  }

  function copyPhone(): void {
    void navigator.clipboard
      .writeText(r.requester.phone)
      .then(() => toast('המספר ' + r.requester.phone + ' הועתק'))
      .catch(() => toast('המספר: ' + r.requester.phone));
  }

  const card = (
    <details className={cx('pn-req', closed && 'pn-closed', promo && 'pn-promo', urgent && 'pn-urgent')} data-rid={r.id} open={props.open} onToggle={(e) => props.onToggle((e.currentTarget as HTMLDetailsElement).open)}>
      <summary className="pn-rq-sum">
        <span className="pn-rq-ttl">
          <b>{title}</b>
          {r.quiet && !canApprove ? (
            <span className="pn-rq-pv pn-q">
              <Ic n="shield" />
              {word + ' חסויה · פתחו כדי לקרוא'}
            </span>
          ) : (
            <span className="pn-rq-pv">{showText}</span>
          )}
          <span className="pn-rq-date">{[reqDateText(r.createdAt, loc.tz), agoText(r.createdAt, nowMs)].filter(Boolean).join(' · ')}</span>
        </span>
        <span className="pn-badges">
          {r.quiet ? (
            <span className="pn-badge pn-quiet">
              <Ic n="shield" />
              בשקט
            </span>
          ) : null}
          {!closed && route.stage === 'biz' && !r.responses.length ? <span className="pn-badge">אצל העסקים</span> : null}
          {urgent ? (
            <span className="pn-badge pn-urg">
              <i />
              דחוף
            </span>
          ) : null}
          {promo ? (
            <span className="pn-seal">
              <Crown />
              משרה מקודמת
            </span>
          ) : r.job ? (
            <span className="pn-badge pn-gold">הצעת עבודה</span>
          ) : null}
          {closed ? <span className="pn-badge pn-ok">נמצא</span> : null}
        </span>
        <span className="pn-rq-chev" aria-hidden="true" />
      </summary>
      <div className="pn-rq-body">
        <div className="pn-top">
          {hidden ? (
            <span className="pn-rq-anon">
              <Ic n="shield" />
              פונה בשקט · השם לא מוצג
            </span>
          ) : (
            <span>{r.requester.name || 'בלי שם'}</span>
          )}
          {r.area ? <span>{'📍 ' + r.area}</span> : null}
        </div>
        <p>{showText}</p>
        <RouteLine r={r} listings={props.listings} nowMs={nowMs} onOpenListing={props.onOpenListing} />
        {r.responses.length > 0 ? (
          <div className="pn-rq-resps">
            {r.responses.map((x, i) => (
              <div key={i} className="pn-rq-m">
                {'✋ ' + nameOf(x.listingId) + (x.text ? ' — ' + x.text : '') + ' · ' + agoText(x.at, nowMs)}
              </div>
            ))}
          </div>
        ) : null}
        {!closed ? (
          <div className="pn-rq-avail">
            <button className="pn-btn pn-primary" type="button" onClick={() => setRespondOpen(true)}>
              <Ic n="hand" />
              רישום מענה
            </button>
          </div>
        ) : null}
        {hidden ? (
          canApprove && (
            <div className="pn-contact">
              <button
                className="pn-btn pn-ghost2"
                type="button"
                onClick={() => {
                  logAccess('👁 חשיפת פרטי פונה — ' + word + ' בשקט', r.id);
                  setRevealed(true);
                }}
              >
                👁 הצגת פרטי הפונה
              </button>
            </div>
          )
        ) : phone ? (
          <div className="pn-contact">
            <span className="pn-phn">{phone}</span>
            {wa ? (
              <a className="pn-btn" href={wa.href} data-act="wa" {...(wa.app ? {} : { target: '_blank', rel: 'noopener' })}>
                <Ic n="wa" f />
                וואטסאפ
              </a>
            ) : null}
            {tel ? (
              <a className="pn-btn pn-ghost2" href={tel} data-act="call">
                <Ic n="phone" f />
                חיוג
              </a>
            ) : null}
            <button className="pn-btn pn-ghost2" type="button" onClick={copyPhone}>
              <Ic n="copy" />
              העתקת המספר
            </button>
          </div>
        ) : null}
        <details className="pn-rq-adm">
          <summary>
            <span aria-hidden="true">⋯</span> ניהול <small>{'רק ה' + gabbai + ' רואה'}</small>
          </summary>
          <div className="pn-rq-adm-b">
            {!closed ? (
              <button className={cx('pn-btn', r.quiet && 'pn-danger')} type="button" onClick={(e) => closeIt(e.currentTarget)}>
                <Ic n="check" />
                {r.quiet ? (armed === 'prqc-' + r.id ? 'בטוח? הכול יימחק' : 'נמצא, למחוק הכול') : 'סמן שנמצא'}
              </button>
            ) : null}
            {r.job && !closed && canApprove ? (
              promo ? (
                <button className="pn-btn pn-ghost2" type="button" onClick={() => setPrJobPromo(r.id, false) && toast('הקידום בוטל')}>
                  ביטול הקידום
                </button>
              ) : (
                <button className="pn-btn pn-gold" type="button" onClick={() => setPrJobPromo(r.id, true) && toast('המשרה קודמה לראש הלוח')}>
                  {'קידום המשרה · ' + nis(priceOf(prefs, 'job'))}
                </button>
              )
            ) : null}
            {!closed && responders.length > 0 ? (
              <button className="pn-btn pn-ghost2" type="button" onClick={() => setSendOpen(true)}>
                <Ic n="send" />
                שליחה לעסקים
              </button>
            ) : null}
            {!closed ? (
              <button className="pn-btn pn-ghost2" type="button" onClick={props.onEdit}>
                <Ic n="edit" />
                עריכה
              </button>
            ) : null}
            {canDelete ? (
              <button
                className="pn-btn pn-ghost2 pn-danger"
                type="button"
                onClick={() => {
                  if (!confirmTwice('prq-' + r.id, 'למחוק את ה' + word + '?')) {
                    toast('בטוחים? לחיצה נוספת בתוך 3.5 שניות תמחק לצמיתות');
                    return;
                  }
                  if (deletePrRequest(r.id)) toast('ה' + word + ' נמחקה');
                }}
              >
                {armed === 'prq-' + r.id ? 'ללחוץ שוב למחיקה' : 'הסרת ה' + word}
              </button>
            ) : null}
          </div>
        </details>
      </div>

      {respondOpen ? (
        <OrbitLayer>
          <Modal title={'✋ רישום מענה ל' + word} onClose={() => setRespondOpen(false)}>
            <Field label={'מי עונה'}>
              <Select
                value={resp.listingId}
                onChange={(v) => setResp({ ...resp, listingId: v })}
                options={[{ value: '', label: 'מענה ידני של ה' + gabbai }, ...responders.map((l) => ({ value: l.id, label: l.name + (l.source === 'gabbai' ? ' (דרך ה' + gabbai + ')' : '') }))]}
              />
            </Field>
            <Field label={r.quiet ? 'התשובה * (הפונה יראה אותה; ה' + lWord + ' לא יודע מי הפונה)' : 'הערה (רשות)'}>
              <textarea rows={3} value={resp.text} onChange={(e) => setResp({ ...resp, text: e.target.value.slice(0, 500) })} />
            </Field>
            <div className="modal-actions">
              <Btn kind="primary" onClick={respond}>
                רישום
              </Btn>
              <Btn onClick={() => setRespondOpen(false)}>ביטול</Btn>
            </div>
          </Modal>
        </OrbitLayer>
      ) : null}

      {sendOpen ? (
        <OrbitLayer>
          <Modal title={'📤 שליחה לעסקים בתחום'} onClose={() => setSendOpen(false)}>
            <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 8 }}>
              {r.quiet ? '🔒 בקשה בשקט — ההודעה בלי שם ובלי טלפון של הפונה (ופרטי-קשר שהוקלדו בטקסט מושחרים).' : 'ההודעה כוללת רק את תוכן ה' + word + '.'}
            </div>
            <div style={{ fontSize: 13, border: '1px dashed var(--line)', borderRadius: 8, padding: '6px 8px', marginBottom: 8 }}>{businessMessage(view, brand, word)}</div>
            {responders.map((l) => (
              <div key={l.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                <span style={{ fontWeight: 700 }}>{l.name}</span>
                {l.source === 'gabbai' && <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>טלפון כשר — להתקשר</span>}
                <span style={{ marginInlineStart: 'auto' }}>
                  <span dir="ltr">{l.phone}</span>
                </span>
                {telOn && l.phone ? <CallBtn phone={l.phone} title={'חיוג ל' + l.name} /> : null}
                {waOn && l.whatsapp ? <WaBtn phone={l.whatsapp} text={businessMessage(view, brand, word)} title={'וואטסאפ ל' + l.name} /> : null}
              </div>
            ))}
            {gabbaiOnly.length > 0 && !telOn && <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 6 }}>לרשומות שהוזנו ע״י ה{gabbai} — מתקשרים ומקריאים את ההודעה.</div>}
            <div className="modal-actions">
              <Btn onClick={() => setSendOpen(false)}>סגירה</Btn>
            </div>
          </Modal>
        </OrbitLayer>
      ) : null}
    </details>
  );
  // החלקה (rsw): רק לבקשה פתוחה עם טלפון שמוצג — לא לבקשה בשקט
  return phone ? (
    <Rsw r={r} msg={msg} contact={contact}>
      {card}
    </Rsw>
  ) : (
    card
  );
}
