/**
 * 📒 פרנסה׳לע — "אישורים" של המקור (עיצוב 6 · renderAdmin): הכרטיסים לניהול (acard — מדליון, שם, מקצוע · שער,
 * טלפון/עיר/אזור, תיאור, תגים, פעולות):
 *   · ממתינים לאישור (pendingApprovals — הוותיקים ראשונים): לדף · אישור · הסתרה · מחיקה; גם מודעות-לוח שממתינות
 *     (תוספת-הפורט): ללוח · אישור ותלייה · דחייה · מחיקה.
 *   · "דורש טיפול" (תוספת-הפורט, needsCare): בקשה שקטה בלי עסק בתחום · דחופה בלי מענה · פרסומת שלא שולמה/מסתיימת ·
 *     הדגשה שמסתיימת · ☎ קוד-חיוג כפול · עסק בלי קוד — כל שורה קופצת למקום.
 *   · "הוספת איש מקצוע ידנית" — "למי שאין לו אינטרנט או שיש לו טלפון כשר…": אותו עורך-דף בן 8 החלקים (מקור = הגבאי);
 *     "עריכה" מכרטיס שהוזן ידנית טוענת אותו לכאן ("שמירת שינויים" · "ביטול עריכה").
 *   · כרטיסים שהוזנו ידנית (לדף · עריכה · מחיקה) · כרטיסים מוסתרים (לדף · אישור · מחיקה).
 * 🛡 אישור/הסתרה רק במאשר/ת, מחיקה רק בהרשאה (נאכף גם ב-store); "דורש טיפול" לעולם לא שם/טלפון של מבקש (מושחר).
 */
import { useCallback, type ReactNode } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import type { PrListing, PrPost } from '../../types/domain';
import { useRemembered } from '../../lib/filterMemory';
import { useArmed } from '../useArmed';
import { categoryOf, isFeatured, listingStatus, needsCare, pendingApprovals, type PrCareItem } from './lib';
import { usePrPerms, type PrNow } from './hooks';
import { agoText, PR_NOTICE_KIND_LABELS, PR_POST_KIND_LABELS } from './labels';
import { adminLists } from './admin';
import { Editor, forgetEditorDraft } from './Editor';
import { Medal } from './Home';
import { cx, Ic, Seal, StPill, vars } from './skin';
import { TodayCard } from './TodayCard';

export type CareJump = { tab: 'directory'; id: string | null } | { tab: 'requests'; id: string } | { tab: 'ads' } | { tab: 'board' };

/** לאן קופצת שורת-טיפול. */
function jumpOf(item: PrCareItem): CareJump {
  switch (item.kind) {
    case 'quietNoBiz':
    case 'urgent':
    case 'unanswered':
      return { tab: 'requests', id: item.id };
    case 'adUnpaid':
    case 'adEnding':
      return { tab: 'ads' };
    case 'featuredEnding':
    case 'dupDialCode':
      return { tab: 'directory', id: item.id };
    default:
      return { tab: 'directory', id: null };
  }
}

const noop = (): void => {};

/** כרטיס-הניהול של המקור (adminCardHTML). */
export function AdminCard(props: { l: PrListing; now: PrNow; gabbai: string; children: ReactNode }) {
  const { l, now } = props;
  const feat = isFeatured(l, now.todayIso);
  const cat = categoryOf(l.category);
  const recs = l.recs.length;
  const st = l.status === 'approved' ? listingStatus(l, now.clock, now.closureAt) : null;
  return (
    <article className={cx('pn-acard', feat && 'pn-feat')}>
      <div className="pn-row1">
        <Medal l={l} feat={feat} />
        <div className="pn-who" style={{ display: 'block' }}>
          <h3>{l.name}</h3>
          <div className="pn-tr">{[l.title, cat.name].filter(Boolean).join(' · ')}</div>
        </div>
      </div>
      <div className="pn-info">
        <span className="pn-ltr">{l.phone}</span>
        {l.city ? <span>{l.city}</span> : null}
        {l.area ? <span>{l.area}</span> : null}
        {l.dialCode ? <span>{'☎ ' + l.dialCode}</span> : null}
      </div>
      {l.desc ? <div className="pn-d">{l.desc}</div> : null}
      <div className="pn-badges">
        {l.status === 'pending' ? <span className="pn-badge pn-warn">ממתין לאישור</span> : null}
        {l.status === 'rejected' ? <span className="pn-badge pn-danger">מוסתר</span> : null}
        {l.source === 'gabbai' ? <span className="pn-badge">{'הוזן ע״י ה' + props.gabbai}</span> : null}
        {feat ? <Seal>מודגש</Seal> : null}
        {recs ? <span className="pn-badge pn-gold">{'♥ ' + recs}</span> : null}
        {l.disc ? <span className="pn-badge pn-gold">הנחה</span> : null}
        {l.free ? <span className="pn-badge pn-ok">גמ״ח</span> : null}
        <StPill st={st} brief />
      </div>
      <div className="pn-actions">{props.children}</div>
    </article>
  );
}

export function CareTab(props: {
  now: PrNow;
  onJump: (j: CareJump) => void;
  canJump: (tab: CareJump['tab']) => boolean;
  /** "לדף" — הגיליון של העסק (null = האלפון כבוי ⇒ קפיצה לכרטיס). */
  onOpen?: ((id: string) => void) | null;
  /** "תצוגה" של העורך (הגיליון עם סרט "תצוגה מקדימה"). */
  onPreview?: (d: PrListing) => void;
}) {
  const config = useApp((s) => s.config);
  const listings = useApp((s) => s.db.prListings);
  const posts = useApp((s) => s.db.prPosts);
  const requests = useApp((s) => s.db.prRequests);
  const ads = useApp((s) => s.db.prAds);
  const setPrStatus = useApp((s) => s.setPrStatus);
  const deletePrListing = useApp((s) => s.deletePrListing);
  const deletePrPost = useApp((s) => s.deletePrPost);
  const toast = useApp((s) => s.toast);
  const { canApprove, canDelete } = usePrPerms();
  const { armed, confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  // הכרטיס-הידני שבעריכה (null = הוספה) + מונה-טופס-ריק — נזכרים במעבר-לשונית
  const [manId, setManId] = useRemembered<string | null>('parnasa.admin.man', null);
  const [newN, setNewN] = useRemembered<number>('parnasa.admin.newN', 0);

  const { now } = props;
  const pend = pendingApprovals({ prListings: listings, prPosts: posts }, now.todayIso);
  const care = needsCare({ prListings: listings, prRequests: requests, prAds: ads }, now.todayIso, now.nowMs, config);
  const { man, hid } = adminLists(listings);
  const gabbai = termOf(config, 'entity.prGabbai', 'גבאי');
  const editing = manId ? (listings.find((l) => l.id === manId) ?? null) : null;
  const edKey = editing ? 'adm-' + editing.id : 'adm-new-' + newN;
  const preview = props.onPreview;
  const onPreview = useCallback(
    (d: PrListing) => preview?.({ ...d, name: d.name || 'השם שלכם', title: d.title || 'במה אתם עובדים', phone: d.phone || '050-000-0000', category: d.category || 'other', status: 'approved' }),
    [preview],
  );

  function look(l: PrListing) {
    if (props.onOpen) props.onOpen(l.id);
    else props.onJump({ tab: 'directory', id: l.id });
  }
  function decide(l: PrListing, status: 'approved' | 'rejected') {
    if (setPrStatus('listing', l.id, status)) toast(status === 'approved' ? 'הכרטיס אושר ומופיע באלפון' : 'הכרטיס הוסתר');
  }
  function decidePost(p: PrPost, status: 'approved' | 'rejected') {
    if (setPrStatus('post', p.id, status)) toast(status === 'approved' ? 'נתלה בלוח' : 'נדחה — ירד מהלוח');
  }
  function del(key: string, run: () => boolean) {
    if (!confirmTwice(key, 'למחוק לצמיתות?')) return;
    if (run()) toast('הכרטיס נמחק');
  }
  function editMan(l: PrListing) {
    setManId(l.id);
    setTimeout(() => document.querySelector('.pn-admForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  }
  const delBtn = (key: string, run: () => boolean) =>
    canDelete ? (
      <button className="pn-btn pn-ghost2 pn-danger" type="button" onClick={() => del(key, run)}>
        {armed === key ? 'ללחוץ שוב למחיקה' : 'מחיקה'}
      </button>
    ) : null;
  const lookBtn = (l: PrListing) =>
    props.onOpen || props.canJump('directory') ? (
      <button className="pn-btn" type="button" onClick={() => look(l)}>
        <Ic n="eye" />
        לדף
      </button>
    ) : null;
  /** הפעולות לכרטיס (btn(e) במקור): ידני ⇒ עריכה · מחיקה; אחרת ⇒ אישור · הסתרה · מחיקה. */
  const actions = (l: PrListing) => (
    <>
      {lookBtn(l)}
      {l.source === 'gabbai' && canApprove ? (
        <button className="pn-btn" type="button" onClick={() => editMan(l)}>
          עריכה
        </button>
      ) : null}
      {canApprove && l.status !== 'approved' ? (
        <button className="pn-btn pn-primary" type="button" onClick={() => decide(l, 'approved')}>
          <Ic n="check" />
          אישור
        </button>
      ) : null}
      {canApprove && l.status !== 'rejected' && l.source !== 'gabbai' ? (
        <button className="pn-btn" type="button" onClick={() => decide(l, 'rejected')}>
          הסתרה
        </button>
      ) : null}
      {delBtn('cl-' + l.id, () => {
        const ok = deletePrListing(l.id);
        if (ok && manId === l.id) setManId(null);
        return ok;
      })}
    </>
  );
  const cards = (xs: PrListing[], empty: string) =>
    xs.length ? (
      <div className="pn-cards">
        {xs.map((l) => (
          <AdminCard key={l.id} l={l} now={now} gabbai={gabbai}>
            {actions(l)}
          </AdminCard>
        ))}
      </div>
    ) : (
      <p className="pn-note">{empty}</p>
    );

  return (
    <>
      {/* 🔌 המרכזייה (חיבור ד׳): ☀ תקציר-היום מכל הכלים — רק כשכלי נוסף זמין */}
      <TodayCard now={now} />
      <div className="pn-agrp">
        <h2>
          ממתינים לאישור <span className="pn-n">{pend.total}</span>
        </h2>
        {!canApprove && pend.total > 0 ? <p className="pn-note">{'רק ה' + gabbai + ' מאשר/ת — הכרטיסים יופיעו אחרי אישור.'}</p> : null}
        {pend.total ? (
          <div className="pn-cards">
            {pend.listings.map((l) => (
              <AdminCard key={l.id} l={l} now={now} gabbai={gabbai}>
                {actions(l)}
              </AdminCard>
            ))}
            {pend.posts.map((p) => (
              <article key={p.id} className="pn-acard">
                <div className="pn-row1">
                  <span className="pn-med pn-tic" style={vars({ c: '#7a5b12' })} aria-hidden="true">
                    <Ic n="tab-luach" />
                  </span>
                  <div className="pn-who" style={{ display: 'block' }}>
                    <h3>{p.title}</h3>
                    <div className="pn-tr">
                      {(p.kind === 'notice' ? 'מודעה · ' + (PR_NOTICE_KIND_LABELS[p.noticeKind] ?? 'כללי') : PR_POST_KIND_LABELS[p.kind]) + ' · ' + agoText(p.updatedAt || p.createdAt, now.nowMs)}
                    </div>
                  </div>
                </div>
                {p.text ? <div className="pn-d">{p.text}</div> : null}
                <div className="pn-badges">
                  <span className="pn-badge pn-warn">ממתין לאישור</span>
                </div>
                <div className="pn-actions">
                  {props.canJump('board') ? (
                    <button className="pn-btn" type="button" onClick={() => props.onJump({ tab: 'board' })}>
                      <Ic n="eye" />
                      ללוח
                    </button>
                  ) : null}
                  {canApprove ? (
                    <button className="pn-btn pn-primary" type="button" onClick={() => decidePost(p, 'approved')}>
                      <Ic n="check" />
                      אישור ותלייה
                    </button>
                  ) : null}
                  {canApprove ? (
                    <button className="pn-btn" type="button" onClick={() => decidePost(p, 'rejected')}>
                      דחייה
                    </button>
                  ) : null}
                  {delBtn('cp-' + p.id, () => deletePrPost(p.id))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="pn-note">אין כרטיסים שממתינים.</p>
        )}
      </div>

      {care.length ? (
        <div className="pn-agrp">
          <h2>
            דורש טיפול <span className="pn-n">{care.length}</span>
          </h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {care.map((c) => {
              const j = jumpOf(c);
              return (
                <div key={c.kind + c.id} className="pn-ritem">
                  <div style={{ minWidth: 0 }}>
                    <h4>{c.label}</h4>
                    <div className="pn-meta2">{c.hint}</div>
                  </div>
                  {props.canJump(j.tab) ? (
                    <div className="pn-actions">
                      <button className="pn-btn" type="button" onClick={() => props.onJump(j)}>
                        טיפול
                        <Ic n="chev" />
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {canApprove ? (
        <div className="pn-agrp pn-admForm">
          <h2>הוספת איש מקצוע ידנית</h2>
          <p className="pn-note">למי שאין לו אינטרנט או שיש לו טלפון כשר. רק אחרי שקיבלתם את הסכמתו.</p>
          <Editor
            key={edKey}
            memKey={edKey}
            listing={editing}
            seed={{ source: 'gabbai' }}
            focusSec={null}
            onDraft={noop}
            onSaved={() => {
              forgetEditorDraft(edKey);
              if (editing) setManId(null);
              else setNewN((n) => n + 1);
            }}
            onPreview={onPreview}
            onDeleted={() => {
              forgetEditorDraft(edKey);
              setManId(null);
            }}
            toast={toast}
            saveText={editing ? 'שמירת שינויים' : 'הוספה לאלפון'}
            onCancel={editing ? () => setManId(null) : undefined}
          />
        </div>
      ) : null}

      <div className="pn-agrp">
        <h2>
          כרטיסים שהוזנו ידנית <span className="pn-n">{man.length}</span>
        </h2>
        {cards(man, 'עוד לא הוזנו כרטיסים ידנית.')}
      </div>
      <div className="pn-agrp">
        <h2>
          כרטיסים מוסתרים <span className="pn-n">{hid.length}</span>
        </h2>
        {cards(hid, 'אין כרטיסים מוסתרים.')}
      </div>
    </>
  );
}
