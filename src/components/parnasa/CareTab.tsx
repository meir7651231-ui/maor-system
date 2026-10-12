/**
 * 📒 פרנסה׳לע — לשונית 🏠 טיפול ואישורים (אשכול 5): "המערכת מסדרת את היום" לגבאי —
 *   · ⏳ ממתינים לאישור (pendingApprovals — הוותיקים ראשונים): עסקים חדשים/שנערכו + מודעות-לוח;
 *     אישור/דחייה/מחיקה רק בהרשאה (prCan — נאכף גם ב-store); לא-מאשר רואה מה ממתין.
 *   · 🔔 דורש טיפול (needsCare): בקשה שקטה בלי עסק בתחום · דחופה בלי מענה · פתוחה לקהילה בלי מענה ·
 *     פרסומת שלא שולמה/מסתיימת · הדגשה שמסתיימת · עסקים בלי קוד-חיוג — כל שורה קופצת למקום.
 * 🛡 לעולם לא שם/טלפון של מבקש (needsCare בונה מתצוגה מושחרת).
 */
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import type { PrListing, PrPost } from '../../types/domain';
import { Btn, Empty } from '../ui';
import { useArmed } from '../useArmed';
import { categoryOf, needsCare, pendingApprovals, type PrCareItem } from './lib';
import { usePrPerms, type PrNow } from './hooks';
import { agoText, PR_NOTICE_KIND_LABELS, PR_POST_KIND_LABELS } from './labels';

export type CareJump = { tab: 'directory'; id: string | null } | { tab: 'requests'; id: string } | { tab: 'ads' } | { tab: 'board' };

const ROW = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '6px 0', borderBottom: '1px solid var(--line)', fontSize: 13 } as const;

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
      return { tab: 'directory', id: item.id };
    default:
      return { tab: 'directory', id: null };
  }
}

export function CareTab(props: { now: PrNow; onJump: (j: CareJump) => void; canJump: (tab: CareJump['tab']) => boolean }) {
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

  const { now } = props;
  const pend = pendingApprovals({ prListings: listings, prPosts: posts }, now.todayIso);
  const care = needsCare({ prListings: listings, prRequests: requests, prAds: ads }, now.todayIso, now.nowMs, config);
  const gabbai = termOf(config, 'entity.prGabbai', 'גבאי');
  const word = termOf(config, 'entity.prListing', 'עסק');

  function decideListing(l: PrListing, status: 'approved' | 'rejected') {
    if (setPrStatus('listing', l.id, status)) toast(status === 'approved' ? l.name + ' אושר/ה — מופיע/ה במדריך' : l.name + ' הוסתר/ה');
  }
  function decidePost(p: PrPost, status: 'approved' | 'rejected') {
    if (setPrStatus('post', p.id, status)) toast(status === 'approved' ? 'נתלה בלוח' : 'נדחה — ירד מהלוח');
  }
  function del(key: string, label: string, run: () => boolean) {
    if (!confirmTwice(key, 'למחוק את ' + label + '?')) {
      toast('בטוחים? לחיצה נוספת בתוך 3.5 שניות תמחק לצמיתות');
      return;
    }
    if (run()) toast(label + ' נמחק/ה');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <section className="card">
        <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>{'⏳ ממתינים לאישור ה' + gabbai + ' (' + pend.total + ')'}</h2>
        {pend.total === 0 && <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>אין ממתינים לאישור.</div>}
        {!canApprove && pend.total > 0 && (
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 4 }}>{'רק ה' + gabbai + ' מאשר/ת — הפריטים יופיעו אחרי אישור.'}</div>
        )}
        {pend.listings.map((l) => (
          <div key={l.id} style={ROW}>
            <span aria-hidden>{categoryOf(l.category).icon}</span>
            <b>{l.name}</b>
            <span style={{ color: 'var(--ink-faint)' }}>
              {categoryOf(l.category).short + ' · ' + (l.reviewedAt ? 'נערך — לבדיקה חוזרת' : 'חדש') + ' · ' + agoText(l.updatedAt || l.createdAt, now.nowMs)}
            </span>
            <span style={{ marginInlineStart: 'auto', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {props.canJump('directory') && (
                <Btn sm onClick={() => props.onJump({ tab: 'directory', id: l.id })}>
                  לכרטיס ←
                </Btn>
              )}
              {canApprove && (
                <Btn sm kind="primary" onClick={() => decideListing(l, 'approved')}>
                  ✓ אישור
                </Btn>
              )}
              {canApprove && (
                <Btn sm onClick={() => decideListing(l, 'rejected')}>
                  ✕ הסתרה
                </Btn>
              )}
              {canDelete && (
                <Btn sm kind="danger" onClick={() => del('cl-' + l.id, l.name, () => deletePrListing(l.id))}>
                  {armed === 'cl-' + l.id ? 'בטוח?' : '🗑'}
                </Btn>
              )}
            </span>
          </div>
        ))}
        {pend.posts.map((p) => (
          <div key={p.id} style={ROW}>
            <span>{p.kind === 'notice' ? '📌 ' + (PR_NOTICE_KIND_LABELS[p.noticeKind] ?? 'הודעה') : PR_POST_KIND_LABELS[p.kind]}</span>
            <b>{p.title}</b>
            <span style={{ color: 'var(--ink-faint)' }}>{agoText(p.updatedAt || p.createdAt, now.nowMs)}</span>
            <span style={{ marginInlineStart: 'auto', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {props.canJump('board') && (
                <Btn sm onClick={() => props.onJump({ tab: 'board' })}>
                  ללוח ←
                </Btn>
              )}
              {canApprove && (
                <Btn sm kind="primary" onClick={() => decidePost(p, 'approved')}>
                  ✓ אישור ותלייה
                </Btn>
              )}
              {canApprove && (
                <Btn sm onClick={() => decidePost(p, 'rejected')}>
                  ✕ דחייה
                </Btn>
              )}
              {canDelete && (
                <Btn sm kind="danger" onClick={() => del('cp-' + p.id, p.title, () => deletePrPost(p.id))}>
                  {armed === 'cp-' + p.id ? 'בטוח?' : '🗑'}
                </Btn>
              )}
            </span>
          </div>
        ))}
      </section>

      <section className="card">
        <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>{'🔔 דורש טיפול (' + care.length + ')'}</h2>
        {care.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>אין מה לטפל — הכול מסודר.</div>}
        {care.map((c) => {
          const j = jumpOf(c);
          return (
            <div key={c.kind + c.id} style={ROW}>
              <b>{c.label}</b>
              <span style={{ color: 'var(--ink-faint)', flex: 1, minWidth: 160 }}>{c.hint}</span>
              {props.canJump(j.tab) && (
                <Btn sm onClick={() => props.onJump(j)}>
                  טיפול ←
                </Btn>
              )}
            </div>
          );
        })}
      </section>

      {pend.total === 0 && care.length === 0 && listings.length === 0 && (
        <Empty>{'מתחילים: מוסיפים ' + word + ' ראשון במדריך, ומגדירים את מיקום-הזמנים בלוח הקהילה.'}</Empty>
      )}
    </div>
  );
}
