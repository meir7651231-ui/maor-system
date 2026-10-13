/**
 * 📒 פרנסה׳לע — "אלפון" של המקור (עיצוב 2). שלושה מצבים על אותו מסך (section.pn-v-dir[data-mode], כמו המקור):
 *   · ask — הבמה ("מה צריך?", מטבעות-העונה, חיוג-מהיר/חיפושים-נפוצים) + מקטעי-הבית.
 *   · answer — הבמה מתכווצת (המטבעות נעשים גלולות) + התשובות: searchListings (מושגי-בעיה/תחיליות/גזע/שגיאת-כתיב,
 *     דירוג כיסוי ⇒ שכבה ⇒ מודגש ⇒ פתוח-עכשיו ⇒ המלצות) כבאנרי-תמונה; מטבע-הפלטינה מוצמד; אין תוצאה ⇒ "לא מצאתי":
 *     פרסום בלוח-הבקשות (בשקט כשהנושא רגיש) או בקשה ממולאת.
 *   · browse — "כל האלפון" לפי 15 השערים + מסננים (אשכול 3 מלביש אותו).
 * מסננים זכורים בין מסכים (useRemembered) + חזרה מהכרטיס למקום-הגלילה (useListScrollRestore).
 */
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { useRemembered } from '../../lib/filterMemory';
import { useListScrollRestore } from '../../lib/scrollMemory';
import { downloadCsv } from '../reports/csv';
import type { PrAd, PrListing, PrRequest } from '../../types/domain';
import { Btn, Chip, Empty } from '../ui';
import {
  adRotation,
  categoryOf,
  coinSponsor,
  filterListings,
  listingsCsvRows,
  PR_CATEGORIES,
  PR_CONCEPTS,
  priceOf,
  searchCount,
  searchListings,
  sensitiveTopic,
} from './lib';
import { ListingCard } from './ListingCard';
import { ListingDetail } from './ListingDetail';
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
import { Ic } from './skin';
import type { PnHebNow } from './shell';
import type { PrClosure } from './zmanimBoard';
import type { useQuickDial } from './skinPrefs';

type Aud = 'all' | 'men' | 'women';

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

/** תיבת-החסות בראש השער (התורנית של היום — סבב-יומי מהמנוע). */
function GateSponsor(props: { ad: PrAd | null }) {
  const a = props.ad;
  if (!a) return null;
  return (
    <div style={{ fontSize: 12.5, border: '1px dashed #b08d2e', borderRadius: 8, padding: '4px 10px' }}>
      {'👑 השער בחסות '}
      <b>{a.advertiser}</b>
      {[a.headline, a.phone].filter((x) => x && x.trim()).map((x) => ' · ' + x).join('')}
    </div>
  );
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
  setSelId: (id: string | null) => void;
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
  const logAccess = useApp((s) => s.logAccess);
  const upsertPrRequest = useApp((s) => s.upsertPrRequest);
  const toast = useApp((s) => s.toast);
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
  const [aud, setAud] = useRemembered<Aud>('parnasa.dir.aud', 'all');
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
  const sel = props.selId ? (listings.find((l) => l.id === props.selId) ?? null) : null;
  useListScrollRestore('parnasa.dir', !!sel);

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
    if (ctx.reduced || !ev || ev.kb) props.setSelId(id);
    else setTimeout(() => props.setSelId(id), 260);
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

  if (sel) return <ListingDetail listing={sel} now={now} onBack={() => props.setSelId(null)} />;

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
        <BrowseLegacy
          now={now}
          q={props.q}
          cat={cat}
          setCat={setCat}
          f={{ disc, setDisc, free, setFree, emergency, setEmergency, openOnly, setOpenOnly, aud, setAud, showAll, setShowAll }}
          canApprove={canApprove}
          onBack={() => setBrowse(false)}
          onOpen={(id) => openCard(id)}
          logAccess={logAccess}
          brand={brand}
          ads={ads}
          adsOn={adsOn}
        />
      ) : null}
    </section>
  );
}

/** "כל האלפון" (מצב browse) — הכותרת של המקור; הרשימה עצמה בסקין בעיצוב 3. */
function BrowseLegacy(props: {
  now: PrNow;
  q: string;
  cat: string;
  setCat: (c: string) => void;
  f: {
    disc: boolean;
    setDisc: (v: boolean) => void;
    free: boolean;
    setFree: (v: boolean) => void;
    emergency: boolean;
    setEmergency: (v: boolean) => void;
    openOnly: boolean;
    setOpenOnly: (v: boolean) => void;
    aud: Aud;
    setAud: (v: Aud) => void;
    showAll: boolean;
    setShowAll: (v: boolean) => void;
  };
  canApprove: boolean;
  onBack: () => void;
  onOpen: (id: string) => void;
  logAccess: (act: string, what: string) => void;
  brand: string;
  ads: PrAd[];
  adsOn: boolean;
}) {
  const config = useApp((s) => s.config);
  const listings = useApp((s) => s.db.prListings);
  const toast = useApp((s) => s.toast);
  const { now, f, cat } = props;
  const words = termOf(config, 'entity.prListings', 'עסקים');
  const exportOn = featureOn(config, 'parnasa.export');
  const filtered = useMemo(
    () =>
      filterListings(listings, {
        category: cat || undefined,
        disc: f.disc,
        free: f.free,
        emergency: f.emergency,
        aud: f.aud,
        includeAll: props.canApprove && f.showAll,
        openOnly: f.openOnly ? { clock: now.clock, closureAt: now.closureAt } : undefined,
        todayIso: now.todayIso,
      }),
    [listings, cat, f.disc, f.free, f.emergency, f.aud, props.canApprove, f.showAll, f.openOnly, now],
  );
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of listings) if (l.status === 'approved') m.set(categoryOf(l.category).key, (m.get(categoryOf(l.category).key) ?? 0) + 1);
    return m;
  }, [listings]);
  const approvedCount = [...counts.values()].reduce((a, b) => a + b, 0);
  const gates = PR_CATEGORIES.map((c) => ({ cat: c, items: filtered.filter((l: PrListing) => categoryOf(l.category).key === c.key) })).filter((g) => g.items.length);

  function exportCsv() {
    props.logAccess('ייצוא מדריך ' + termOf(config, 'nav.parnasa', 'פרנסה׳לע') + ' (CSV)', approvedCount + ' ' + words);
    downloadCsv('parnasa-directory.csv', listingsCsvRows(listings, now.todayIso));
    toast('האלפון ירד כקובץ CSV — מאושרים בלבד, בלי הערות פנימיות');
  }

  return (
    <div className="pn-browse" style={{ display: 'block' }}>
      <div className="pn-bhead">
        <button className="pn-back" type="button" onClick={props.onBack}>
          <Ic n="back" />
          לשאלה
        </button>
        <h2>כל האלפון</h2>
        <span className="pn-cnt">{filtered.length + ' ' + (filtered.length === 1 ? 'בעל מקצוע' : 'בעלי מקצוע')}</span>
      </div>
      <div className="pn-orbit" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Chip on={!cat} onClick={() => props.setCat('')}>
              {'הכול (' + approvedCount + ')'}
            </Chip>
            {PR_CATEGORIES.filter((c) => counts.has(c.key) || c.key === cat).map((c) => (
              <Chip key={c.key} on={cat === c.key} onClick={() => props.setCat(cat === c.key ? '' : c.key)}>
                {c.icon + ' ' + c.short + ' (' + (counts.get(c.key) ?? 0) + ')'}
              </Chip>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip on={f.openOnly} onClick={() => f.setOpenOnly(!f.openOnly)}>
              🟢 פתוח עכשיו
            </Chip>
            <Chip on={f.disc} onClick={() => f.setDisc(!f.disc)}>
              הנחה לקהילה
            </Chip>
            <Chip on={f.free} onClick={() => f.setFree(!f.free)}>
              גמ״ח
            </Chip>
            <Chip on={f.emergency} onClick={() => f.setEmergency(!f.emergency)}>
              🚨 חירום
            </Chip>
            <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>מתאים ל:</span>
            {(['all', 'men', 'women'] as const).map((a) => (
              <Chip key={a} on={f.aud === a} onClick={() => f.setAud(a)}>
                {a === 'all' ? 'כולם' : a === 'men' ? 'גברים' : 'נשים'}
              </Chip>
            ))}
            {props.canApprove && (
              <Chip on={f.showAll} onClick={() => f.setShowAll(!f.showAll)}>
                כולל ממתינים ומוסתרים
              </Chip>
            )}
            {exportOn && approvedCount > 0 && (
              <span style={{ marginInlineStart: 'auto' }}>
                <Btn sm onClick={exportCsv} title="להדפסה, לבית המדרש ולמי שיש לו טלפון כשר">
                  ⬇ הורדת האלפון לאקסל (CSV)
                </Btn>
              </span>
            )}
          </div>
        </div>
        {listings.length === 0 && (
          <Empty>
            <div style={{ fontWeight: 800 }}>האלפון מחכה לכרטיס הראשון…</div>
          </Empty>
        )}
        {listings.length > 0 && gates.length === 0 && <Empty>לא נמצא מתאים — נסו להסיר מסנן.</Empty>}
        {gates.map((g) => (
          <section key={g.cat.key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, borderBottom: '2px solid ' + g.cat.color, paddingBottom: 3 }}>
              {g.cat.num + ' · ' + g.cat.icon + ' ' + g.cat.name + ' — ' + g.items.length + ' כרטיסים'}
            </h2>
            {props.adsOn && <GateSponsor ad={adRotation(props.ads, 'category', now.todayIso, g.cat.key).today} />}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {g.items.map((l) => (
                <ListingCard key={l.id} listing={l} now={now} brand={props.brand} onOpen={() => props.onOpen(l.id)} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
