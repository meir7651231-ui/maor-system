/**
 * 📤 בריאות תור-השליחות (ביקורת-האמון 24.8) — ה-Functions כותבות status:'error'
 * על כשל-שליחת SMS/מייל, ואף מסך לא קרא אותו: כשל היה בלתי-נראה למנהל.
 * המסך מציג כשלים + ממתינים ומאפשר 🔁 שליחה-חוזרת (החזרה ל-pending —
 * ה-Function הדקתית מרימה שוב). מגודר-עצמית: ענן + מנהל/מייל-על (Rules ממילא
 * מתירים קריאת-התורים למנהל בלבד).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { isSuperAdmin } from '../../lib/config';
import type { OutboxIssue } from '../../store/cloudSync';
import { Btn, Empty } from '../ui';
import { Section, SectionNote } from './lib';

// ⚡ bundle-light: מודול-הענן נטען דינמית בלבד — מסך-מנהל נדיר לא גורר Firebase
const cloudMod = () => import('../../store/cloudSync');

export function OutboxSection() {
  const cloud = useApp((s) => s.cloud);
  const toast = useApp((s) => s.toast);
  const canSee = cloud.enabled && !!cloud.user && (cloud.isManager || isSuperAdmin(cloud.user?.email));

  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [issues, setIssues] = useState<OutboxIssue[]>([]);
  const [pending, setPending] = useState({ sms: 0, mail: 0 });

  if (!canSee) return null;

  const load = async () => {
    setBusy(true);
    try {
      const m = await cloudMod();
      const r = await m.fetchOutboxIssues();
      setIssues(r.issues);
      setPending(r.pending);
      setLoaded(true);
    } catch {
      toast('⚠ קריאת תור-השליחות נכשלה — בדקו חיבור והרשאות');
    }
    setBusy(false);
  };

  const retry = async (it: OutboxIssue) => {
    setBusy(true);
    try {
      const m = await cloudMod();
      await m.retryOutboxItem(it.box, it.id);
      setIssues((xs) => xs.filter((x) => !(x.box === it.box && x.id === it.id)));
      toast('🔁 הוחזר לתור — יישלח בדקה הקרובה');
    } catch {
      toast('⚠ ההחזרה לתור נכשלה');
    }
    setBusy(false);
  };

  return (
    <Section id="sec-outbox" title="📤 תור-השליחות (SMS ומייל)">
      <SectionNote>
        כשלי-שליחה מהשרת מוצגים כאן — עד היום הם נרשמו בענן בלי שאף מסך הציג אותם.
        "שליחה-חוזרת" מחזירה את ההודעה לתור; היא תישלח בסבב הדקתי הבא.
      </SectionNote>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Btn sm onClick={() => void load()} disabled={busy}>
          {busy ? 'טוען…' : loaded ? '🔄 רענון' : '📥 טעינת סטטוס'}
        </Btn>
        {loaded && (
          <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
            ממתינים: {pending.sms} SMS · {pending.mail} מייל — כשלים: {issues.length}
          </span>
        )}
      </div>
      {loaded && issues.length === 0 && <Empty>אין כשלי-שליחה 🎉</Empty>}
      {issues.map((it) => (
        <div
          key={it.box + it.id}
          style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 11px', border: '1px solid var(--line)', borderRadius: 10, fontSize: 13 }}
        >
          <span aria-hidden>{it.box === 'sms' ? '📱' : '📧'}</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <b>{it.to || '—'}</b>
            {it.subject ? ' · ' + it.subject : ''}
            <span style={{ display: 'block', color: 'var(--danger, #c0392b)', fontSize: 12 }}>{it.error || 'שגיאה לא-ידועה'}</span>
          </span>
          {it.at && <span style={{ color: 'var(--ink-faint)', fontSize: 11.5 }}>{it.at.slice(0, 10)}</span>}
          <Btn sm onClick={() => void retry(it)} disabled={busy}>
            🔁 שליחה-חוזרת
          </Btn>
        </div>
      ))}
    </Section>
  );
}
