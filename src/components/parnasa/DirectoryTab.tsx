/**
 * 📒 פרנסה׳לע — "אלפון" של המקור (עיצוב 2). שלושה מצבים על אותו מסך (section.pn-v-dir[data-mode], כמו המקור):
 *   · ask — הבמה ("מה צריך?", מטבעות-העונה, חיוג-מהיר/חיפושים-נפוצים) + מקטעי-הבית.
 *   · answer — הבמה מתכווצת (המטבעות נעשים גלולות) + התשובות: searchListings (מושגי-בעיה/תחיליות/גזע/שגיאת-כתיב,
 *     דירוג כיסוי ⇒ שכבה ⇒ מודגש ⇒ פתוח-עכשיו ⇒ המלצות) כבאנרי-תמונה; מטבע-הפלטינה מוצמד; אין תוצאה ⇒ "לא מצאתי":
 *     פרסום בלוח-הבקשות (בשקט כשהנושא רגיש) או בקשה ממולאת.
 *   · browse — "כל האלפון" של המקור (Browse.tsx, עיצוב 3): מפתח-השערים, המתגים, השערים כבאנרים.
 * דף-העסק = גיליון מעל המסך (BizSheet, בשלד) — הרשימה נשארת מתחת. מסננים זכורים בין מסכים (useRemembered).
 */
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn } from '../../lib/config';
import { useRemembered } from '../../lib/filterMemory';
import { useListScrollRestore } from '../../lib/scrollMemory';
import type { PrRequest } from '../../types/domain';
import { adRotation, categoryOf, coinSponsor, PR_CATEGORIES, PR_CONCEPTS, priceOf, searchCount, searchListings, sensitiveTopic } from './lib';
import { Browse, type PnAud } from './Browse';
import { usePnContact, usePrBrand, usePrPerms, type PrNow } from './hooks';
import {
  askingNow,
  coinOfTile,
  dayIndexOf,
  editionOf,
  featuredRotation,
  greetingOf,
  homeStats,
  isUrgentNow,
  newJoiners,
  pinnedHits,
  pulseOf,
  quickDialList,
  seasonOf,
  tradeRail,
  weekWaiting,
  PN_EDITIONS,
} from './home';
import { AskStage, Answers, HomeSections, type CoinTileData } from './Home';
import { CN, coinTap, cnFit, cnMint, wireCoinGrid } from './coinFx';
import { installBannerFx, pbJustSwiped, pbMount, pbNudge, pbRipple, pbWA } from './bannerFx';
import type { PnHebNow } from './shell';
import type { PrClosure } from './zmanimBoard';
import type { useQuickDial } from './skinPrefs';


/** הקשר-המסך מהשלד (ParnasaView): שעון, תאריך עברי, שבת, חיוג-מהיר, טוסט-עם-פעולה, וקפיצות בין-לשוניות. */
export interface DirCtx {
  now: PrNow;
  heb: PnHebNow;
  closure: PrClosure;
  reduced: boolean;
  /** מונה — "/" בכל מקום ⇒ מיקוד בתיבת-השאלה. */
  focusTick: number;
  quick: ReturnType<typeof useQuickDial>;
  toastAct: (msg: string, action?: { label: string; run: () => void }) => void;
  goReq: ((id?: string) => void) | null;
  goAdmin: ((seg: 'rev' | 'spon') => void) | null;
  goJoin: (() => void) | null;
}

const WEEK_KEY = 'maor_pn_week';
function readWeekOff(): string {
  try {
    return sessionStorage.getItem(WEEK_KEY) ?? '';
  } catch {
    return '';
  }
}

export function DirectoryTab(props: {
  ctx: DirCtx;
  q: string;
  setQ: (q: string) => void;
  selId: string | null;
  /** פתיחת דף-העסק (הגיליון בשלד); q = השאלה שממנה נפתח (להודעת-הוואטסאפ המוכנה). */
  setSelId: (id: string | null, q?: string) => void;
  /** "לא מצאתי" ⇒ פתיחת בקשה ממולאת (null = לשונית-הבקשות כבויה). */
  onNewRequest: ((draft: Partial<PrRequest>) => void) | null;
  /** פתיחה ישר ב"כל האלפון" (מצב browse) — לרינדור-שרת/בדיקות; אחרת הזיכרון. */
  initialBrowse?: boolean;
}) {
  const config = useApp((s) => s.config);
  const listings = useApp((s) => s.db.prListings);
  const ads = useApp((s) => s.db.prAds);
  const requests = useApp((s) => s.db.prRequests);
  const prefs = useApp((s) => s.db.ui.parnasa);
  const upsertPrRequest = useApp((s) => s.upsertPrRequest);
  const toastAct = props.ctx.toastAct;
  const toast = useCallback((m: string): void => toastAct(m), [toastAct]);
  const brand = usePrBrand();
  const contact = usePnContact();
  const { canApprove } = usePrPerms();
  const { ctx } = props;
  const { now } = ctx;
  const [browse, setBrowse] = useRemembered<boolean>('parnasa.dir.browse', props.initialBrowse ?? false);
  const [cat, setCat] = useRemembered<string>('parnasa.dir.cat', '');
  const [disc, setDisc] = useRemembered<boolean>('parnasa.dir.disc', false);
  const [free, setFree] = useRemembered<boolean>('parnasa.dir.free', false);
  const [emergency, setEmergency] = useRemembered<boolean>('parnasa.dir.emergency', false);
  const [openOnly, setOpenOnly] = useRemembered<boolean>('parnasa.dir.open', false);
  const [aud, setAud] = useRemembered<PnAud>('parnasa.dir.aud', 'all');
  const [seek, setSeek] = useRemembered<boolean>('parnasa.dir.seek', false);
  const [bq, setBq] = useRemembered<string>('parnasa.dir.bq', '');
  const [showAll, setShowAll] = useRemembered<boolean>('parnasa.dir.all', false);
  const [pin, setPin] = useState<{ q: string; cat: string } | null>(null);
  const [selIdx, setSelIdx] = useState(0);
  const [kb, setKb] = useState(false);
  const [posted, setPosted] = useState<ReadonlySet<string>>(() => new Set());
  const [moreOpen, setMoreOpen] = useState(false);
  const [weekOff, setWeekOff] = useState(readWeekOff);
  const inputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const answersRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLParagraphElement>(null);
  const lastKey = useRef('');
  useListScrollRestore('parnasa.dir', !!props.selId);

  const query = props.q.trim();
  const mode: 'ask' | 'answer' | 'browse' = browse ? 'browse' : query ? 'answer' : 'ask';
  const adsOn = featureOn(config, 'parnasa.ads');
  const sctx = useMemo(() => ({ todayIso: now.todayIso, clock: now.clock, closureAt: now.closureAt }), [now]);
  const calm = ctx.closure.closed;

  // העונה, המהדורה, המטבעות עם הספירה האמיתית (מה שנגיעה תמצא)
  const season = useMemo(() => seasonOf(ctx.heb.m, ctx.heb.d), [ctx.heb.m, ctx.heb.d]);
  const edition = editionOf(season.k);
  const tiles: CoinTileData[] = useMemo(
    () => season.tiles.map((t) => ({ label: t.l, coin: coinOfTile(t), n: searchCount(t.q, listings, sctx), pressed: t.q === query && !pin })),
    [season, listings, sctx, query, pin],
  );
  const coinAd = adsOn ? coinSponsor(ads, now.todayIso) : null;
  const sponsor = coinAd
    ? { ad: coinAd, label: categoryOf(coinAd.target).short, n: listings.filter((l) => l.status === 'approved' && categoryOf(l.category).key === coinAd.target).length }
    : null;

  // התשובות (חיפוש רגיל, או מטבע-הפלטינה מוצמד)
  const search = useMemo(() => (query ? searchListings(query, listings, sctx, 12) : null), [query, listings, sctx]);
  const pinned = useMemo(() => (pin && pin.q === query && coinAd ? pinnedHits(listings, pin.cat, coinAd, sctx) : null), [pin, query, coinAd, listings, sctx]);
  const hits = pinned ? pinned.hits : (search?.hits ?? []);
  const anyApproved = listings.some((l) => l.status === 'approved');
  const resKey = hits.map((h) => h.listing.id).join(',');
  const anim = resKey !== lastKey.current;
  useEffect(() => {
    lastKey.current = resKey;
  });
  const topCat = search ? (PR_CONCEPTS.find((c) => c.k === search.analysis.cons[0]?.k)?.c ?? '') : '';

  // הבית
  const homeData = useMemo(() => {
    const week = weekWaiting(requests, listings, now.clock, now.loc, now.nowMs);
    return {
      empty: !anyApproved,
      week: week && weekOff !== now.clock.iso ? week : null,
      pulse: pulseOf(requests, listings, now.nowMs),
      asking: askingNow(requests, listings, now.nowMs),
      feats: featuredRotation(listings, now.todayIso, dayIndexOf(now.todayIso)),
      sponsorLine: adsOn ? adRotation(ads, 'board', now.todayIso).today : null,
      trades: tradeRail(
        listings,
        PR_CATEGORIES.map((c) => c.key as string),
      ),
      newbies: newJoiners(listings, now.nowMs),
      stats: homeStats(listings, requests),
    };
  }, [requests, listings, ads, adsOn, now, weekOff, anyApproved]);
  const greeting = useMemo(() => greetingOf(now.clock, now.loc, ctx.closure, ctx.heb), [now.clock, now.loc, ctx.closure, ctx.heb]);
  const dial = quickDialList(ctx.quick.favs, ctx.quick.recents, listings);

  // מצב-המטבעה (שבת · תקופה · קונפטי) ותנועת-המטבעות/הבאנרים
  CN.calm = calm;
  CN.confetti = !!PN_EDITIONS[edition].confetti;
  useEffect(() => installBannerFx(toast), [toast]);
  useEffect(() => {
    const box = gridRef.current;
    if (!box || mode === 'browse') return;
    const off = wireCoinGrid(box);
    try {
      if (!sessionStorage.getItem('maor_pn_minted')) {
        sessionStorage.setItem('maor_pn_minted', '1');
        cnMint(box);
      }
    } catch {
      /* */
    }
    return off;
  }, [mode]);
  useEffect(() => {
    if (mode !== 'ask') return;
    const run = (): void => cnFit(gridRef.current);
    run();
    void document.fonts?.ready.then(run);
  }, [mode, tiles]);
  useEffect(() => {
    pbMount(viewRef.current);
    if (mode === 'answer') pbNudge(answersRef.current);
  });
  // "/" מכל מקום (השלד מעלה את המונה) ⇒ מיקוד וסימון
  useEffect(() => {
    if (!ctx.focusTick) return;
    setBrowse(false);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [ctx.focusTick, setBrowse]);
  // W על באנר ממוקד ⇒ וואטסאפ
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent): void => {
      const a = document.activeElement;
      if (e.code === 'KeyW' && !e.ctrlKey && !e.metaKey && !e.altKey && a instanceof HTMLElement && a.classList.contains('pn-bn-hit')) {
        e.preventDefault();
        pbWA(a.closest('.pn-pbn'));
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  // שורת-הסיכום סופרת-עולה פעם אחת, כשהיא נכנסת למסך
  useEffect(() => {
    const el = statsRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    let done = false;
    const io = new IntersectionObserver(
      (es) => {
        if (done || !es.some((x) => x.isIntersecting)) return;
        done = true;
        io.disconnect();
        if (ctx.reduced) return;
        el.querySelectorAll<HTMLElement>('b[data-to]').forEach((b) => {
          const to = Number(b.dataset.to) || 0;
          const t0 = performance.now();
          const step = (t: number): void => {
            const k = Math.min(1, (t - t0) / 1000);
            b.textContent = Math.round(to * (1 - Math.pow(1 - k, 4))).toLocaleString('he-IL');
            if (k < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mode, ctx.reduced]);

  /* ───── פעולות ───── */
  function setQuery(v: string): void {
    props.setQ(v);
    if (!v.trim()) setPin(null);
    setSelIdx(0);
    setKb(false);
  }
  function openCard(id: string, ev?: { x: number; y: number; art: Element | null; kb: boolean }): void {
    if (pbJustSwiped()) return;
    if (ev?.art && !ev.kb) pbRipple(ev.art, ev.x, ev.y);
    const i = hits.findIndex((h) => h.listing.id === id);
    if (i > -1) setSelIdx(i);
    ctx.quick.touch(id);
    const q = mode === 'answer' ? query : '';
    if (ctx.reduced || !ev || ev.kb) props.setSelId(id, q);
    else setTimeout(() => props.setSelId(id, q), 260);
  }
  async function copyPhone(phone: string, id: string): Promise<void> {
    let ok = false;
    try {
      await navigator.clipboard.writeText(phone);
      ok = true;
    } catch {
      ok = false;
    }
    ctx.quick.touch(id);
    toast(ok ? 'המספר ' + phone + ' הועתק' : 'המספר: ' + phone);
  }
  function onKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'ArrowDown' && mode === 'answer' && hits.length) {
      e.preventDefault();
      setKb(true);
      setSelIdx((i) => (i + 1) % Math.min(12, hits.length));
    } else if (e.key === 'ArrowUp' && mode === 'answer' && hits.length) {
      e.preventDefault();
      setKb(true);
      setSelIdx((i) => (i - 1 + Math.min(12, hits.length)) % Math.min(12, hits.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const h = hits[selIdx];
      if (h) {
        const w = answersRef.current?.querySelector(`.pn-pbn[data-key="${CSS.escape(h.listing.id)}"] .pn-bn-wa`) as HTMLElement | null;
        if (w) w.click();
        else openCard(h.listing.id);
      } else if (query && props.onNewRequest) props.onNewRequest({ text: query, category: topCat });
    } else if (e.key === 'Escape' && props.q) {
      e.stopPropagation();
      setQuery('');
    }
  }
  useEffect(() => {
    if (!kb) return;
    const el = answersRef.current?.querySelectorAll('.pn-bn-list>.pn-bn')[selIdx];
    el?.scrollIntoView({ block: 'nearest', behavior: ctx.reduced ? 'auto' : 'smooth' });
  }, [kb, selIdx, ctx.reduced]);
  function postNow(): void {
    if (!query || posted.has(query)) return;
    const quiet = !!sensitiveTopic(query);
    const res = upsertPrRequest({
      id: '', text: query, category: topCat, area: '', urgent: false, quiet, job: false, requester: { name: '', phone: '' }, status: 'open', responses: [], createdAt: '', updatedAt: '',
    });
    if (!res.ok) return;
    setPosted(new Set([...posted, query]));
    const rid = res.request?.id;
    ctx.toastAct(quiet ? 'נשלח בשקט, רק לבעלי המקצוע בתחום' : 'פורסם בלוח הבקשות', ctx.goReq ? { label: 'לצפייה', run: () => ctx.goReq?.(rid) } : undefined);
  }
  function goBrowse(c?: string): void {
    setBrowse(true);
    setCat(c ?? '');
    window.scrollTo({ top: 0 });
  }

  return (
    <section className="pn-view pn-on pn-v-dir" data-mode={mode} aria-label="אלפון" ref={viewRef}>
      {mode !== 'browse' ? (
        <AskStage
          mode={mode === 'answer' ? 'answer' : 'ask'}
          q={props.q}
          onInput={setQuery}
          onKeyDown={onKeyDown}
          onClear={() => {
            setQuery('');
            inputRef.current?.focus();
          }}
          inputRef={inputRef}
          calm={calm}
          greeting={greeting}
          season={season}
          edition={edition}
          tiles={tiles}
          sponsor={sponsor}
          placeholderPrice={!coinAd && canApprove && adsOn && ctx.goAdmin ? priceOf(prefs, 'sponsor') : null}
          dial={dial}
          favs={ctx.quick.favs}
          now={now}
          gridRef={gridRef}
          onTile={(i, el) =>
            coinTap(el, () => {
              setPin(null);
              setQuery(season.tiles[i].q);
            })
          }
          onSponsor={(el) =>
            coinTap(el, () => {
              if (!coinAd) return;
              const q = categoryOf(coinAd.target).short;
              setPin({ q, cat: coinAd.target });
              props.setQ(q);
              setSelIdx(0);
            })
          }
          onCoinAdmin={() => ctx.goAdmin?.('spon')}
          onTry={(q) => {
            setQuery(q);
            inputRef.current?.focus({ preventScroll: true });
          }}
          onOpen={(id) => openCard(id)}
        />
      ) : null}
      {mode === 'ask' ? (
        <HomeSections
          d={homeData}
          now={now}
          brand={brand}
          contact={contact}
          reduced={ctx.reduced}
          canApprove={canApprove && adsOn && !!ctx.goAdmin}
          featuredPrice={priceOf(prefs, 'featured')}
          edition={edition}
          moreOpen={moreOpen}
          setMoreOpen={setMoreOpen}
          weekOff={() => {
            try {
              sessionStorage.setItem(WEEK_KEY, now.clock.iso);
            } catch {
              /* */
            }
            setWeekOff(now.clock.iso);
          }}
          isUrgent={(r) => isUrgentNow(r, now.nowMs)}
          onBrowse={goBrowse}
          onOpen={openCard}
          onTouch={ctx.quick.touch}
          onCopy={(p, id) => void copyPhone(p, id)}
          onSeeReq={(id) => ctx.goReq?.(id)}
          onAdminRev={() => ctx.goAdmin?.('rev')}
          onJoin={() => ctx.goJoin?.()}
          canJoin={!!ctx.goJoin}
          statsRef={statsRef}
        />
      ) : null}
      {mode === 'answer' ? (
        <Answers
          res={search}
          hits={hits}
          qtext={query}
          anyListings={anyApproved}
          sel={selIdx}
          kb={kb}
          anim={anim}
          edition={edition}
          pinnedSponsor={pinned && coinAd ? { ad: coinAd, matchId: pinned.matchId } : null}
          now={now}
          brand={brand}
          contact={contact}
          reduced={ctx.reduced}
          posted={posted.has(query)}
          canPost={!!props.onNewRequest}
          boxRef={answersRef}
          onOpen={openCard}
          onTouch={ctx.quick.touch}
          onCopy={(p, id) => void copyPhone(p, id)}
          onBrowse={() => goBrowse()}
          onPostNow={postNow}
          onPrefill={() => props.onNewRequest?.({ text: query, category: topCat })}
        />
      ) : null}
      {mode === 'browse' ? (
        <Browse
          now={now}
          cat={cat}
          setCat={setCat}
          f={{ bq, setBq, disc, setDisc, free, setFree, seek, setSeek, emergency, setEmergency, openOnly, setOpenOnly, aud, setAud, showAll, setShowAll }}
          canApprove={canApprove}
          brand={brand}
          contact={contact}
          reduced={ctx.reduced}
          onBack={() => {
            setBrowse(false);
            window.scrollTo({ top: 0 });
          }}
          onOpen={openCard}
          onTouch={ctx.quick.touch}
          onCopy={(p, id) => void copyPhone(p, id)}
          onPostReq={ctx.goReq ? () => ctx.goReq?.() : null}
          onAdd={ctx.goJoin}
          toast={toast}
        />
      ) : null}
    </section>
  );
}
