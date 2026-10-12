/**
 * עמודת פרנסה׳לע (מודול parnasa — knowledge/BUILD-ORDER-PARNASA-2026-10-12.md), אשכול 5.
 *
 * המודול **opt-in** (הכרעה 1): כבוי כשחסר — נדלק רק ב-modules.parnasa === true (העוזר moduleEnabledIn
 * ב-types/config); כבוי ⇒ אין קישור ואין מסך, וכל parnasa.* כבויים (שרשור featureOn).
 * צ'יפ-לשוניות, כל אחת מגודרת בתת-הדגל שלה (החוזה הרגיל בתוך מודול דלוק — חסר = פעיל):
 *   🏠 טיפול ואישורים (parnasa.care) · 📇 מדריך (parnasa.directory) · 🙋 בקשות (parnasa.requests) ·
 *   📌 לוח קהילה (parnasa.board) · 📖 חוברת (parnasa.booklet) · 📣 פרסומות (parnasa.ads) ·
 *   ⚙ הגדרות — גבאי בלבד (prCan parnasa.approve).
 * הניווט בין הלשוניות (קפיצה מטיפול לכרטיס/לבקשה, "לא מצאתי" ⇒ בקשה, צ'יפ-עזרה בלוח ⇒ חיפוש) — מצב
 * מקומי בלבד (בידוד: אין ניווט חוצה-מסכים דרך ה-store).
 */
import { useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { useRemembered } from '../../lib/filterMemory';
import type { PrRequest } from '../../types/domain';
import { Chip, Empty, PageHead } from '../ui';
import { needsCare, pendingApprovals } from './lib';
import { usePrNow, usePrPerms } from './hooks';
import { CareTab, type CareJump } from './CareTab';
import { DirectoryTab } from './DirectoryTab';
import { RequestsTab } from './RequestsTab';
import { BoardTab } from './BoardTab';
import { BookletTab } from './BookletTab';
import { AdsTab } from './AdsTab';
import { SettingsTab } from './SettingsTab';

type PrTab = 'care' | 'directory' | 'requests' | 'board' | 'booklet' | 'ads' | 'settings';

export function ParnasaView() {
  const config = useApp((s) => s.config);
  const listings = useApp((s) => s.db.prListings);
  const posts = useApp((s) => s.db.prPosts);
  const requests = useApp((s) => s.db.prRequests);
  const ads = useApp((s) => s.db.prAds);
  const community = useApp((s) => s.db.ui.parnasa?.communityName);
  const { canApprove } = usePrPerms();
  const now = usePrNow();
  const [tab, setTab] = useRemembered<PrTab>('parnasa.tab', 'care');
  const [dirQ, setDirQ] = useRemembered<string>('parnasa.dir.q', '');
  const [selListing, setSelListing] = useRemembered<string | null>('parnasa.dir.sel', null);
  const [focusReq, setFocusReq] = useState<string | null>(null);
  const [reqDraft, setReqDraft] = useState<Partial<PrRequest> | null>(null);

  const name = termOf(config, 'nav.parnasa', 'פרנסה׳לע');
  const listingsWord = termOf(config, 'entity.prListings', 'עסקים');
  const tabs: { key: PrTab; label: string; on: boolean }[] = [
    { key: 'care', label: '🏠 טיפול ואישורים', on: featureOn(config, 'parnasa.care') },
    { key: 'directory', label: '📇 מדריך', on: featureOn(config, 'parnasa.directory') },
    { key: 'requests', label: '🙋 בקשות', on: featureOn(config, 'parnasa.requests') },
    { key: 'board', label: '📌 לוח קהילה', on: featureOn(config, 'parnasa.board') },
    { key: 'booklet', label: '📖 חוברת', on: featureOn(config, 'parnasa.booklet') },
    { key: 'ads', label: '📣 פרסומות', on: featureOn(config, 'parnasa.ads') },
    { key: 'settings', label: '⚙ הגדרות', on: canApprove },
  ];
  const isOn = (k: PrTab) => tabs.some((t) => t.key === k && t.on);
  const active: PrTab | null = isOn(tab) ? tab : (tabs.find((t) => t.on)?.key ?? null);

  // מונה-הטיפול על הצ'יפ (ממתינים + דורש-טיפול)
  const careCount = useMemo(
    () =>
      pendingApprovals({ prListings: listings, prPosts: posts }, now.todayIso).total +
      needsCare({ prListings: listings, prRequests: requests, prAds: ads }, now.todayIso, now.nowMs, config).length,
    [listings, posts, requests, ads, now, config],
  );

  function jump(j: CareJump) {
    if (j.tab === 'directory') {
      setSelListing(j.id);
      if (!j.id) setDirQ('');
    }
    if (j.tab === 'requests') setFocusReq(j.id);
    setTab(j.tab);
  }

  return (
    <div>
      <PageHead
        title={'📒 ' + name + (community?.trim() ? ' · ' + community.trim() : '')}
        sub={'מדריך ' + listingsWord + ' שכונתי · מה צריך? · לוח קהילה · חוברת'}
      />
      <div style={{ display: 'flex', gap: 6, margin: '12px 0', flexWrap: 'wrap' }}>
        {tabs
          .filter((t) => t.on)
          .map((t) => (
            <Chip key={t.key} on={active === t.key} onClick={() => setTab(t.key)}>
              {t.label + (t.key === 'care' && careCount ? ' (' + careCount + ')' : '')}
            </Chip>
          ))}
      </div>
      {active === null && <Empty>{'כל הלשוניות של ' + name + ' כבויות באשף — הדליקו לפחות אחת.'}</Empty>}
      {active === 'care' && <CareTab now={now} onJump={jump} canJump={(k) => isOn(k)} />}
      {active === 'directory' && (
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
                  setTab('requests');
                }
              : null
          }
        />
      )}
      {active === 'requests' && (
        <RequestsTab
          now={now}
          focusId={focusReq}
          onFocusConsumed={() => setFocusReq(null)}
          draft={reqDraft}
          onDraftConsumed={() => setReqDraft(null)}
          onOpenListing={
            isOn('directory')
              ? (id) => {
                  setSelListing(id);
                  setTab('directory');
                }
              : null
          }
        />
      )}
      {active === 'board' && (
        <BoardTab
          now={now}
          onSearch={
            isOn('directory')
              ? (q) => {
                  setDirQ(q);
                  setSelListing(null);
                  setTab('directory');
                }
              : null
          }
        />
      )}
      {active === 'booklet' && <BookletTab now={now} />}
      {active === 'ads' && <AdsTab now={now} />}
      {active === 'settings' && <SettingsTab />}
    </div>
  );
}
