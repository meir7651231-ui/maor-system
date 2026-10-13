/**
 * עמודת פרנסה׳לע (מודול parnasa — knowledge/BUILD-ORDER-PARNASA-2026-10-12.md) — עיצוב 1: השלד של המקור.
 *
 * המודול **opt-in** (הכרעה 1): כבוי כשחסר — נדלק רק ב-modules.parnasa === true (העוזר moduleEnabledIn
 * ב-types/config); כבוי ⇒ אין קישור ואין מסך, וכל parnasa.* כבויים (שרשור featureOn).
 * הסקין המקורי מוגבל-שורש (‎.pn, parnasa.css בצ'אנק העצל הזה): הפס הבורדו עם הפושקע, סימן-המילה, ב״ה והתאריך
 * העברי, ההקדשה, באנר-השבת, הקולופון ופס-הלשוניות הצף — הניווט של המקור, כל לשונית מגודרת בתת-הדגל שלה
 * (החוזה הרגיל בתוך מודול דלוק — חסר = פעיל):
 *   אלפון (parnasa.directory) · לוח בקשות (parnasa.requests) · לוח הקהילה (parnasa.board) ·
 *   העסק שלי (parnasa.directory — הכרטיסים) · ניהול — כשיש בו אזור דלוק: אישורים (parnasa.care) · הכנסות/חסויות
 *   (parnasa.ads) · מודעות וחוברת (parnasa.ads / parnasa.booklet) · 📞 הקו (parnasa.phone — סימולטור, לא קו חי) ·
 *   הגדרות — גבאי בלבד (prCan parnasa.approve). אף לשונית של הפורט לא אבדה — כולן בתוך הניווט של המקור.
 * העדפות-הצופה (אותיות גדולות · מצב לילה/יום · צלילים) — פר-אדם במכשיר (skinPrefs), לא ב-DB.
 * הניווט בין הלשוניות (קפיצה מטיפול לכרטיס/לבקשה, "לא מצאתי" ⇒ בקשה, צ'יפ-עזרה בלוח ⇒ חיפוש) — מצב
 * מקומי בלבד (בידוד: אין ניווט חוצה-מסכים דרך ה-store). הכניסה היחידה מבחוץ: תוצאת-עסק בפלטת-החיפוש
 * (אשכול 7) ⇒ requestOpenListing (paletteLink — תיבה בלי store) ⇒ כאן נפתח דף-העסק.
 * עיצוב 3: דף-העסק = הגיליון של המקור (BizSheet) — נפתח מעל כל לשונית (אלפון, בקשות, העסק שלי, ניהול), כמו במקור.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { useRemembered } from '../../lib/filterMemory';
import type { PrListing, PrRequest } from '../../types/domain';
import { needsCare, pendingApprovals } from './lib';
import { usePrNow, usePrPerms } from './hooks';
import { prOpenBox } from './paletteLink';
import type { CareJump } from './CareTab';
import { DirectoryTab, type DirCtx } from './DirectoryTab';
import { BizSheet, type BizCtx } from './BizSheet';
import { RequestsTab } from './RequestsTab';
import { BoardTab } from './BoardTab';
import { MeTab } from './MeTab';
import { AdminTab, adminSegsOf, type AdminSeg } from './AdminTab';
import { Band, CalmBanner, Colophon, Page, TabBar } from './Shell';
import { cx, PnDefs, PnPortal, PnSkinCtx, skinAttrs, vars, type PnSkin } from './skin';
import { useDeviceDark, useHintsOff, useQuickDial, useReducedMotion, useSkinPrefs } from './skinPrefs';
import { dedicationOf, eveOf, hebMonthStartIso, hebNow, helpCount, periodOf, pushkeFill, pushkeText } from './shell';
import { clink, setSoundState, wakeSound } from './sound';
import { pkHit } from './coinFx';
import { hm } from './home';
import './parnasa.css';

type PrTab = 'directory' | 'requests' | 'board' | 'me' | 'admin';

export function ParnasaView() {
  const config = useApp((s) => s.config);
  const listings = useApp((s) => s.db.prListings);
  const posts = useApp((s) => s.db.prPosts);
  const requests = useApp((s) => s.db.prRequests);
  const ads = useApp((s) => s.db.prAds);
  const prefs = useApp((s) => s.db.ui.parnasa);
  const toast = useApp((s) => s.toast);
  const { canApprove } = usePrPerms();
  const now = usePrNow();
  const sp = useSkinPrefs();
  const deviceDark = useDeviceDark();
  const reduced = useReducedMotion();
  const hintsOff = useHintsOff();
  const [tab, setTab] = useRemembered<PrTab>('parnasa.tab', 'directory');
  const [seg, setSeg] = useRemembered<AdminSeg>('parnasa.admin.seg', 'appr');
  const [dirQ, setDirQ] = useRemembered<string>('parnasa.dir.q', '');
  const [selListing, setSelListing] = useRemembered<string | null>('parnasa.dir.sel', null);
  // עיצוב 4: הדף שבעריכה ב"העסק שלי" (null = עסק חדש) + התצוגה-המקדימה של העורך (טיוטה בגיליון)
  const [meSel, setMeSel] = useRemembered<string | null>('parnasa.me.sel', null);
  const [prevDraft, setPrevDraft] = useState<PrListing | null>(null);
  // השאלה שממנה נפתח הדף (להודעת-הוואטסאפ המוכנה "צריך עזרה: …")
  const [selQ, setSelQ] = useState('');
  const openBiz = useCallback(
    (id: string | null, q = '') => {
      setSelQ(q);
      setSelListing(id);
      // דף אמיתי נפתח (גם מהפלטה) ⇒ התצוגה-המקדימה של העורך נסגרת — לא שני גיליונות זה על זה
      if (id) setPrevDraft(null);
    },
    [setSelListing],
  );
  const [focusReq, setFocusReq] = useState<string | null>(null);
  const [meAdd, setMeAdd] = useState(0);
  const meAddDone = useCallback(() => setMeAdd(0), []);
  const [reqDraft, setReqDraft] = useState<Partial<PrRequest> | null>(null);
  // "לראות אותם" מלוח-הבקשות ⇒ השער ב"כל האלפון"
  const [seeCat, setSeeCat] = useState<{ cat: string; n: number } | null>(null);
  // "הדגשה" מדף-העסק ⇒ ניהול · הכנסות עם טופס-ההדגשה ממולא (featGo במקור)
  const [ftReq, setFtReq] = useState<{ key: string; n: number } | null>(null);
  // "כאן יופיע מטבע פלטינה בחסות" ⇒ חסויות עם טופס-המטבע פתוח (coinAdmin במקור)
  const [spReq, setSpReq] = useState<{ place: string; n: number } | null>(null);
  const quick = useQuickDial();
  const rootRef = useRef<HTMLDivElement>(null);
  const [focusTick, setFocusTick] = useState(0);
  // טוסט-עם-פעולה של המקור ("לצפייה", "שעת צורך, להמשיך") — שכבת-פורטל בסקין; הודעות רגילות — הטוסט של אורביט
  const [pnToast, setPnToast] = useState<{ msg: string; action?: { label: string; run: () => void }; n: number } | null>(null);
  const toastAct = useCallback((msg: string, action?: { label: string; run: () => void }) => setPnToast((t) => ({ msg, action, n: (t?.n ?? 0) + 1 })), []);
  useEffect(() => {
    if (!pnToast) return;
    const t = setTimeout(() => setPnToast(null), 4500);
    return () => clearTimeout(t);
  }, [pnToast]);

  const name = termOf(config, 'nav.parnasa', 'פרנסה׳לע');
  const segs = adminSegsOf(config, canApprove);
  const tabs: { key: PrTab; label: string; icon: string; on: boolean }[] = [
    { key: 'directory', label: 'אלפון', icon: 'tab-alfon', on: featureOn(config, 'parnasa.directory') },
    { key: 'requests', label: 'לוח בקשות', icon: 'tab-board', on: featureOn(config, 'parnasa.requests') },
    { key: 'board', label: 'לוח הקהילה', icon: 'tab-luach', on: featureOn(config, 'parnasa.board') },
    { key: 'me', label: 'העסק שלי', icon: 'tab-card', on: featureOn(config, 'parnasa.directory') },
    { key: 'admin', label: 'ניהול', icon: 'tab-admin', on: segs.some((s) => s.on) },
  ];
  const isOn = (k: PrTab) => tabs.some((t) => t.key === k && t.on);
  const segOn = (k: AdminSeg) => segs.some((s) => s.key === k && s.on);
  const active: PrTab | null = isOn(tab) ? tab : (tabs.find((t) => t.on)?.key ?? null);
  const directoryOn = isOn('directory');

  // 🔎 פלטת-החיפוש ביקשה עסק (אשכול 7): צורכים מהתיבה בעלייה, ותולים צלצול לבקשות בזמן שהמסך פתוח.
  //    הבקשה נצרכת פעם אחת; אלפון כבוי ⇒ נזרקת.
  useEffect(() => {
    const open = (): void => {
      const id = prOpenBox.id;
      prOpenBox.id = '';
      if (!id || !directoryOn) return;
      openBiz(id);
    };
    open();
    prOpenBox.ring = open;
    return () => {
      if (prOpenBox.ring === open) prOpenBox.ring = undefined;
    };
  }, [directoryOn, openBiz]);

  // מוני-הלשוניות (‎.bdg במקור) ומוני-האזורים (‎.sc)
  const pend = useMemo(() => pendingApprovals({ prListings: listings, prPosts: posts }, now.todayIso), [listings, posts, now.todayIso]);
  const careCount = useMemo(
    () => pend.total + needsCare({ prListings: listings, prRequests: requests, prAds: ads }, now.todayIso, now.nowMs, config).length,
    [pend, listings, requests, ads, now, config],
  );
  const openReqs = requests.filter((r) => r.status !== 'closed').length;
  const unpaidAds = ads.filter((a) => a.slot === 'booklet' && a.active !== false && a.price > 0 && !a.paid).length;
  const badges: Partial<Record<PrTab, number>> = {
    requests: openReqs,
    board: canApprove ? pend.posts.length : 0,
    admin: segOn('appr') ? careCount : 0,
  };

  // הפס: התאריך העברי (מתחלף בשקיעה) · תקופת-השנה · שבת/חג · גוון ערב-שבת · הפושקע של החודש
  const heb = useMemo(() => hebNow(now.clock, now.loc), [now.clock, now.loc]);
  const period = periodOf(heb.m, heb.d);
  const closure = useMemo(() => now.closureAt(now.clock.iso, now.clock.hhmm), [now]);
  const calm = closure.closed;
  const eve = eveOf(now.clock, now.loc);
  const monthStart = useMemo(() => hebMonthStartIso(now.clock, now.loc), [now.clock, now.loc]);
  const helped = useMemo(() => helpCount({ prRequests: requests, prListings: listings }, monthStart, now.loc.tz), [requests, listings, monthStart, now.loc.tz]);
  const approvedN = listings.filter((l) => l.status === 'approved').length;

  // הערכה: בחירת-הצופה ⇐ "היכל" של אורביט (כהה) ⇐ המכשיר
  const theme = sp.theme ?? (config.theme === 'heichal' ? 'dark' : null);
  const dark = theme ? theme === 'dark' : deviceDark;
  const skin: PnSkin = useMemo(() => ({ theme, big: sp.big, calm, period: period.k }), [theme, sp.big, calm, period.k]);
  useEffect(() => setSoundState(sp.mute, period.k), [sp.mute, period.k]);

  function go(k: PrTab) {
    if (k !== active && typeof window !== 'undefined') window.scrollTo({ top: 0 });
    setTab(k);
  }

  function jump(j: CareJump) {
    if (j.tab === 'ads') {
      setSeg('rev');
      return;
    }
    if (j.tab === 'directory') {
      if (j.id) {
        openBiz(j.id);
        return;
      }
      setDirQ('');
    }
    if (j.tab === 'requests') setFocusReq(j.id);
    go(j.tab);
  }

  function tapPushke() {
    pkHit(rootRef.current, 'cn-bump');
    toast(pushkeText(helped));
  }

  // "/" מכל מקום (לא בתוך שדה) ⇒ לאלפון, מיקוד בתיבת-השאלה (המקור)
  useEffect(() => {
    if (!directoryOn) return;
    const onKey = (e: KeyboardEvent): void => {
      const a = document.activeElement as HTMLElement | null;
      if (e.key !== '/' || e.ctrlKey || e.metaKey || (a && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable))) return;
      if (document.querySelector('.modal-back')) return;
      e.preventDefault();
      setTab('directory');
      setSelListing(null);
      setFocusTick((n) => n + 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [directoryOn, setTab, setSelListing]);

  // 🕯 שבת: פנייה נחה בעדינות — וואטסאפ/חיוג/פרסום ננעלים, עם "שעת צורך, להמשיך" (15 דקות) — המקור
  const shabOk = useRef(0);
  useEffect(() => {
    if (!calm) return;
    // SHAB_LOCK של המקור (גם העתקת-המספר — .bn-wa.cp — נחה) + "מכיר מישהו?" של הבית; על המסמך (כמו במקור) —
    // דף-העסק והטוסטים בשכבות-פורטל מחוץ לשורש-המודול; רק בתוך הסקין (‎.pn)
    const LOCK = 'a[data-act="wa"],a[data-act="call"],.pn-bpwa,.pn-bn-wa,.pn-rsw-a,[data-act="postNow"],.pn-reqSubmit,[data-act="qrSend"],[data-act="imAvail"],[data-act="postPrefill"],a.pn-rq-b';
    const onClick = (e: MouseEvent): void => {
      if (shabOk.current > Date.now()) return;
      const t = (e.target as Element | null)?.closest?.(LOCK) as HTMLElement | null;
      if (!t || !t.closest('.pn')) return;
      e.preventDefault();
      e.stopPropagation();
      toastAct('שבת קודש. האלפון נח עד ' + hm(closure.endTime), {
        label: 'שעת צורך, להמשיך',
        run: () => {
          shabOk.current = Date.now() + 15 * 60_000;
          t.click();
        },
      });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [calm, closure.endTime, toastAct]);
  // 🕯 כניסת-השבת: "שבת שלום" פעם אחת לכל שבת (במכשיר)
  const [shabOv, setShabOv] = useState<'' | 'on' | 'out'>('');
  useEffect(() => {
    if (!calm) return;
    const key = 'maor_pn_shab_' + (closure.endIso || now.clock.iso);
    let seen = false;
    try {
      seen = localStorage.getItem(key) === '1';
      localStorage.setItem(key, '1');
    } catch {
      seen = true;
    }
    if (seen) return;
    setShabOv('on');
    const t = setTimeout(() => setShabOv('out'), 7000);
    return () => clearTimeout(t);
  }, [calm, closure.endIso, now.clock.iso]);
  useEffect(() => {
    if (shabOv !== 'out') return;
    const t = setTimeout(() => setShabOv(''), 600);
    return () => clearTimeout(t);
  }, [shabOv]);

  const bizCtx: BizCtx = { now, calm, reduced, quick, monthStartIso: monthStart, toastAct };
  const dirCtx: DirCtx = {
    now,
    heb,
    closure,
    reduced,
    focusTick,
    quick,
    toastAct,
    goReq: isOn('requests')
      ? (id?: string) => {
          if (id) setFocusReq(id);
          go('requests');
        }
      : null,
    goAdmin:
      segOn('rev') || segOn('spon')
        ? (sg: AdminSeg, open?: 'coin') => {
            setSeg(sg);
            if (open) setSpReq({ place: open, n: Date.now() });
            go('admin');
          }
        : null,
    goJoin: isOn('me')
      ? () => {
          setMeAdd((n) => n + 1);
          go('me');
        }
      : null,
  };

  let body: ReactNode = null;
  if (active === null) body = <div className="pn-notice">{'כל הלשוניות של ' + name + ' כבויות באשף — הדליקו לפחות אחת.'}</div>;
  else if (active === 'directory')
    body = (
      <DirectoryTab
        ctx={dirCtx}
        q={dirQ}
        setQ={setDirQ}
        selId={selListing}
        setSelId={openBiz}
        seeCat={seeCat}
        onNewRequest={
          isOn('requests')
            ? (draft) => {
                setReqDraft(draft);
                go('requests');
              }
            : null
        }
      />
    );
  else if (active === 'requests')
    body = (
      <section className="pn-view pn-on pn-v-req" aria-label="לוח בקשות">
        <Page k="הקהילה עוזרת" title="לוח בקשות" sub="לא מצאתם באלפון? כתבו כאן. מחפשים עובד? גם כאן. אנשי הקהילה יראו ויחזרו אליכם.">
          <RequestsTab
            now={now}
            focusId={focusReq}
            onFocusConsumed={() => setFocusReq(null)}
            draft={reqDraft}
            onDraftConsumed={() => setReqDraft(null)}
            onOpenListing={directoryOn ? (id) => openBiz(id) : null}
            onSeeCat={
              directoryOn
                ? (cat) => {
                    setSeeCat((x) => ({ cat, n: (x?.n ?? 0) + 1 }));
                    go('directory');
                  }
                : null
            }
            toast={toastAct}
          />
        </Page>
      </section>
    );
  else if (active === 'board')
    body = (
      <section className="pn-view pn-on pn-v-luach" aria-label="לוח הקהילה">
        <BoardTab
          now={now}
          calm={calm}
          toast={toastAct}
          onSearch={
            directoryOn
              ? (q) => {
                  setDirQ(q);
                  setSelListing(null);
                  go('directory');
                }
              : null
          }
        />
      </section>
    );
  else if (active === 'me')
    body = (
      <section className="pn-view pn-on pn-v-me" aria-label="העסק שלי">
        <MeTab ctx={bizCtx} sel={meSel} setSel={setMeSel} addTick={meAdd} onAddConsumed={meAddDone} onOpen={directoryOn ? (id) => openBiz(id) : null} onPreview={setPrevDraft} />
      </section>
    );
  else
    body = (
      <section className="pn-view pn-on pn-v-admin" aria-label="ניהול">
        <AdminTab
          now={now}
          segs={segs}
          seg={seg}
          setSeg={setSeg}
          counts={{ appr: careCount, ads: unpaidAds }}
          onJump={jump}
          canJump={(k) => (k === 'ads' ? segOn('rev') : isOn(k))}
          adsOn={featureOn(config, 'parnasa.ads')}
          bookletOn={featureOn(config, 'parnasa.booklet')}
          onOpen={directoryOn ? (id) => openBiz(id) : null}
          onPreview={setPrevDraft}
          ftReq={ftReq}
          spReq={spReq}
        />
      </section>
    );

  const shown = tabs.filter((t) => t.on);
  return (
    <PnSkinCtx.Provider value={skin}>
      <div
        ref={rootRef}
        className={cx('pn pn-root', sp.big && 'pn-big', hintsOff && 'pn-hints-off')}
        {...skinAttrs(skin)}
        style={vars({ eve: eve.toFixed(3), omer: period.k === 'omer' ? String((period.n ?? 0) / 49) : '0' })}
        onPointerDownCapture={wakeSound}
        onKeyDownCapture={wakeSound}
      >
        <PnDefs />
        <div className="pn-dusk" aria-hidden="true" />
        <div className="pn-cn-fly" aria-hidden="true" />
        <Band
          brand={name}
          community={(prefs?.communityName ?? '').trim()}
          hebDate={heb.text}
          dedication={dedicationOf(prefs?.dedication)}
          calm={calm}
          reducedMotion={reduced}
          pushke={{ goldH: pushkeFill(helped, approvedN), title: pushkeText(helped), bump: '', onTap: tapPushke }}
          tools={{
            big: sp.big,
            dark,
            mute: sp.mute,
            onBig: () => {
              const on = !sp.big;
              sp.setBig(on);
              toast(on ? 'אותיות גדולות' : 'אותיות רגילות');
            },
            onTheme: () => sp.setTheme(dark ? 'light' : 'dark'),
            onMute: () => {
              const m = !sp.mute;
              sp.setMute(m);
              setSoundState(m, period.k);
              if (!m) {
                wakeSound();
                setTimeout(clink, 40);
              }
            },
          }}
        />
        <div className="pn-wrap pn-mainw">
          {calm && <CalmBanner kind={closure.kind} reason={closure.reason} brand={name} />}
          {body}
          <Colophon brand={name} contactPhone={prefs?.contactPhone ?? ''} />
        </div>
        {shown.length > 0 && active && (
          <TabBar tabs={shown.map((t) => ({ key: t.key, label: t.label, icon: t.icon, badge: badges[t.key] }))} active={active} onGo={go} />
        )}
        {selListing && directoryOn ? (
          <BizSheet
            id={selListing}
            qtext={selQ}
            ctx={bizCtx}
            onClose={() => openBiz(null)}
            onOpen={(id) => openBiz(id)}
            onEdit={
              isOn('me')
                ? (id) => {
                    openBiz(null);
                    setMeSel(id);
                    go('me');
                  }
                : undefined
            }
            onFeature={
              segOn('rev') && canApprove
                ? (id) => {
                    openBiz(null);
                    setSeg('rev');
                    setFtReq({ key: id, n: Date.now() });
                    go('admin');
                  }
                : undefined
            }
          />
        ) : null}
        {prevDraft ? <BizSheet draft={prevDraft} qtext="" ctx={bizCtx} onClose={() => setPrevDraft(null)} onOpen={() => {}} /> : null}
        <PnPortal>
          <div className={cx('pn-toast', pnToast && 'pn-on')} role="status" aria-live="polite">
            {pnToast ? (
              <>
                {pnToast.msg}
                {pnToast.action ? (
                  <>
                    {' '}
                    <button
                      type="button"
                      onClick={() => {
                        const a = pnToast.action;
                        setPnToast(null);
                        a?.run();
                      }}
                    >
                      {pnToast.action.label}
                    </button>
                  </>
                ) : null}
              </>
            ) : null}
          </div>
          {shabOv ? (
            <div className={cx('pn-shab-ov', shabOv === 'out' && 'pn-out')} role="dialog" aria-label="שבת שלום">
              <div className="pn-so-in">
                <div className="pn-so-c" aria-hidden="true">
                  <span className="pn-so-candle">
                    <i />
                  </span>
                  <span className="pn-so-candle">
                    <i />
                  </span>
                </div>
                <h2>{closure.kind === 'yomtov' ? 'חג שמח' : 'שבת שלום'}</h2>
                <p>{(closure.kind === 'yomtov' ? 'האלפון נח עד צאת החג · ' : 'האלפון נח עד צאת השבת · ') + hm(closure.endTime)}</p>
                <p className="pn-so-k">{closure.kind === 'yomtov' ? 'בעלי המקצוע חוזרים במוצאי ' + closure.reason : 'בעלי המקצוע חוזרים במוצאי שבת קודש'}</p>
                <button type="button" className="pn-so-b" onClick={() => setShabOv('out')}>
                  {closure.kind === 'yomtov' ? 'חג שמח' : 'שבת שלום'}
                </button>
              </div>
            </div>
          ) : null}
        </PnPortal>
      </div>
    </PnSkinCtx.Provider>
  );
}
