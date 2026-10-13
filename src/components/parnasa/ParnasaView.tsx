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
 * (אשכול 7) ⇒ requestOpenListing (paletteLink — תיבה בלי store) ⇒ כאן נפתח כרטיס-העסק באלפון.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { useRemembered } from '../../lib/filterMemory';
import type { PrRequest } from '../../types/domain';
import { needsCare, pendingApprovals } from './lib';
import { usePrNow, usePrPerms } from './hooks';
import { prOpenBox } from './paletteLink';
import type { CareJump } from './CareTab';
import { DirectoryTab } from './DirectoryTab';
import { RequestsTab } from './RequestsTab';
import { BoardTab } from './BoardTab';
import { MeTab } from './MeTab';
import { AdminTab, adminSegsOf, type AdminSeg } from './AdminTab';
import { Band, CalmBanner, Colophon, Page, TabBar } from './Shell';
import { cx, PnDefs, PnSkinCtx, skinAttrs, vars, type PnSkin } from './skin';
import { useDeviceDark, useHintsOff, useReducedMotion, useSkinPrefs } from './skinPrefs';
import { dedicationOf, eveOf, hebMonthStartIso, hebNow, helpCount, periodOf, pushkeFill, pushkeText } from './shell';
import { clink, setSoundState, wakeSound } from './sound';
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
  const [focusReq, setFocusReq] = useState<string | null>(null);
  const [reqDraft, setReqDraft] = useState<Partial<PrRequest> | null>(null);
  const [bump, setBump] = useState('');
  const bumpT = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (bumpT.current) clearTimeout(bumpT.current);
  }, []);

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
      setSelListing(id);
      setTab('directory');
    };
    open();
    prOpenBox.ring = open;
    return () => {
      if (prOpenBox.ring === open) prOpenBox.ring = undefined;
    };
  }, [directoryOn, setSelListing, setTab]);

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
      setSelListing(j.id);
      if (!j.id) setDirQ('');
    }
    if (j.tab === 'requests') setFocusReq(j.id);
    go(j.tab);
  }

  function tapPushke() {
    if (bumpT.current) clearTimeout(bumpT.current);
    setBump('cn-bump');
    bumpT.current = setTimeout(() => setBump(''), 950);
    toast(pushkeText(helped));
  }

  let body: ReactNode = null;
  if (active === null) body = <div className="pn-notice">{'כל הלשוניות של ' + name + ' כבויות באשף — הדליקו לפחות אחת.'}</div>;
  else if (active === 'directory')
    body = (
      <section className="pn-view pn-on pn-v-dir" data-mode="ask" aria-label="אלפון">
        <div className="pn-orbit">
          <DirectoryTab
            now={now}
            q={dirQ}
            setQ={setDirQ}
            selId={selListing}
            setSelId={setSelListing}
            onNewRequest={
              isOn('requests')
                ? (draft) => {
                    setReqDraft(draft);
                    go('requests');
                  }
                : null
            }
          />
        </div>
      </section>
    );
  else if (active === 'requests')
    body = (
      <section className="pn-view pn-on pn-v-req" aria-label="לוח בקשות">
        <Page k="הקהילה עוזרת" title="לוח בקשות" sub="לא מצאתם באלפון? כתבו כאן. מחפשים עובד? גם כאן. אנשי הקהילה יראו ויחזרו אליכם.">
          <div className="pn-orbit">
            <RequestsTab
              now={now}
              focusId={focusReq}
              onFocusConsumed={() => setFocusReq(null)}
              draft={reqDraft}
              onDraftConsumed={() => setReqDraft(null)}
              onOpenListing={
                directoryOn
                  ? (id) => {
                      setSelListing(id);
                      go('directory');
                    }
                  : null
              }
            />
          </div>
        </Page>
      </section>
    );
  else if (active === 'board')
    body = (
      <section className="pn-view pn-on pn-v-luach" aria-label="לוח הקהילה">
        <div className="pn-luwrap pn-orbit">
          <BoardTab
            now={now}
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
        </div>
      </section>
    );
  else if (active === 'me')
    body = (
      <section className="pn-view pn-on pn-v-me" aria-label="העסק שלי">
        <MeTab
          onOpen={(id) => {
            setSelListing(id);
            go('directory');
          }}
        />
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
        />
      </section>
    );

  const shown = tabs.filter((t) => t.on);
  return (
    <PnSkinCtx.Provider value={skin}>
      <div
        className={cx('pn pn-root', sp.big && 'pn-big', hintsOff && 'pn-hints-off')}
        {...skinAttrs(skin)}
        style={vars({ eve: eve.toFixed(3), omer: period.k === 'omer' ? String((period.n ?? 0) / 49) : '0' })}
        onPointerDownCapture={wakeSound}
        onKeyDownCapture={wakeSound}
      >
        <PnDefs />
        <div className="pn-dusk" aria-hidden="true" />
        <Band
          brand={name}
          community={(prefs?.communityName ?? '').trim()}
          hebDate={heb.text}
          dedication={dedicationOf(prefs?.dedication)}
          calm={calm}
          reducedMotion={reduced}
          pushke={{ goldH: pushkeFill(helped, approvedN), title: pushkeText(helped), bump, onTap: tapPushke }}
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
      </div>
    </PnSkinCtx.Provider>
  );
}
