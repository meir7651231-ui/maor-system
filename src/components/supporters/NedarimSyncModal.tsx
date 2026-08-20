/**
 * 🔄 סנכרון מנדרים — הכיוון-הנכנס המלא ("דו-כווני דרך המפתחות, כל סוגי-התרומות").
 * קורא את רשימת-התורמים (nedarimDonors) והעסקאות (incomingPayments) ששוגרו
 * מנדרים, מריץ את המנוע-הטהור `planNedarimSync` (התאמה לפי ToremId/ת"ז/טלפון/
 * אימייל/שם+עיר), ומציג **תצוגה-מקדימה** של מה-ייווצר/יעודכן/כמה-חיובים — לפני
 * כתיבה כלשהי. הכתיבה מתבצעת רק אחרי אישור-מפורש (שני-שלבים).
 *
 * הכרעת-רו"ח: העסקאות נרשמות כ-hist[] (היסטוריית-חיוב) — נדרים מנפיק את קבלת
 * ה-§46, לכן מוני-הקבלות במאור אינם נוגעים.
 */
import { useEffect, useState } from 'react';
import { useApp } from '../../store/useApp';
import { planNedarimSync, type SyncPlan } from '../../lib/nedarimSync';
import { integrationSetting, isSuperAdmin, termOf } from '../../lib/config';
import { Btn, Empty, Modal } from '../ui';

type CloudMod = typeof import('../../store/cloudSync');

export function NedarimSyncModal(props: { onClose: () => void }) {
  const supporters = useApp((s) => s.db.supporters);
  const config = useApp((s) => s.config);
  const applyNedarimSync = useApp((s) => s.applyNedarimSync);
  const resetNedarimImport = useApp((s) => s.resetNedarimImport);
  const toast = useApp((s) => s.toast);
  const cloudEmail = useApp((s) => s.cloud.user?.email);
  // 🔄 משיכה-בקליק (ייעול 20.8) — מגודר מייל-על + כתובת-פונקציה מוגדרת (payments.pullUrl).
  const pullUrl = integrationSetting(config, 'payments', 'pullUrl');
  const canPull = isSuperAdmin(cloudEmail) && !!pullUrl;
  const [pulling, setPulling] = useState(false);
  // כל מה שנכנס מנדרים: כרטיסים שנוצרו (id 'sup-ned-') + מקוריים עם extId/hist-נדרים
  const nedCount = useApp((s) =>
    s.db.supporters.filter((sp) => sp.id.startsWith('sup-ned-') || sp.extId || (sp.hist ?? []).some((h) => h.clearer === 'נדרים')).length,
  );
  // כרטיסים שיימחקו בפועל (רק אלה שנוצרו מנדרים, 'sup-ned-'); היתר רק **ינוקו** (hist).
  const createdCount = useApp((s) => s.db.supporters.filter((sp) => sp.id.startsWith('sup-ned-')).length);
  const cleanedCount = Math.max(0, nedCount - createdCount);
  const [wipeArmed, setWipeArmed] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<SyncPlan | null>(null);
  const [armed, setArmed] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const m: CloudMod = await import('../../store/cloudSync');
        const [donors, charges] = await Promise.all([m.fetchNedarimDonors(), m.fetchIncomingPayments()]);
        if (!alive) return;
        setPlan(planNedarimSync(supporters, donors, charges));
      } catch (e) {
        if (alive) setError(String((e as Error)?.message || e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // רענון-התוכנית אחרי משיכה (מושך תורמים+עסקאות טריים ומריץ מחדש את התצוגה-המקדימה).
  async function reloadPlan() {
    setLoading(true);
    setError(null);
    try {
      const m: CloudMod = await import('../../store/cloudSync');
      const [donors, charges] = await Promise.all([m.fetchNedarimDonors(), m.fetchIncomingPayments()]);
      setPlan(planNedarimSync(supporters, donors, charges));
    } catch (e) {
      setError(String((e as Error)?.message || e));
    } finally {
      setLoading(false);
    }
  }

  // 🔄 משיכה-בקליק: קורא ל-Function (טוקן-כניסה, בלי סוד) — תורמים+עסקאות — ואז מרענן.
  async function pullNow() {
    if (!pullUrl) return;
    setPulling(true);
    try {
      const m: CloudMod = await import('../../store/cloudSync');
      const r = await m.pullNedarim(pullUrl);
      toast('🔄 נמשכו ' + (r.donors ?? 0) + ' תורמים · ' + (r.added ?? 0) + ' עסקאות');
      await reloadPlan();
    } catch (e) {
      toast('⚠ משיכה נכשלה: ' + String((e as Error)?.message || e));
    } finally {
      setPulling(false);
    }
  }

  const s = plan?.summary;
  const nothing = s && s.newSupporters === 0 && s.updatedSupporters === 0 && s.chargesAdded === 0;

  function apply() {
    if (!plan) return;
    if (!armed) { setArmed(true); return; }
    const note =
      plan.summary.newSupporters + ' חדשים · ' +
      plan.summary.updatedSupporters + ' עודכנו · ' +
      plan.summary.chargesAdded + ' חיובים';
    applyNedarimSync(plan.supporters, note);
    // סימון handled — **רק** את plan.handledChargeIds (מה שחובר/דדופ בפועל), לא את כל
    // הממתינים. חיוב מבוטל/זיכוי (amount≤0) שהמנוע דילג **נשאר pending** לפאזה-מודעת-הכסף
    // העתידית (עקבי עם החיבור-החי). ⚠️ סימון **במנות** (תקרית 19.8 — אלפי כתיבות בבת-אחת).
    const toMark = plan.handledChargeIds;
    if (toMark.length) {
      void import('../../store/cloudSync').then(async (m) => {
        for (let i = 0; i < toMark.length; i += 300) {
          await Promise.all(toMark.slice(i, i + 300).map((id) => m.markIncomingPayment(id).catch(() => {})));
        }
      });
    }
    setDone(true);
    setArmed(false);
  }

  const nav = termOf(config, 'nav.supporters', 'תורמים');

  return (
    <Modal title={'🔄 סנכרון מנדרים — ' + nav} onClose={props.onClose} wide>
      {/* 🔄 משיכה-בקליק (ייעול) — מושך תורמים+עסקאות מנדרים בלי כתובות ידניות (מייל-על) */}
      {canPull && (
        <div style={{ border: '1px solid var(--accent)', borderRadius: 10, padding: 10, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: 'var(--accent-bg, #f0f6ff)' }}>
          <div style={{ flex: 1, minWidth: 180, fontSize: 12.5 }}>
            <b>משיכה-בקליק</b> — מושך את רשימת-התורמים והעסקאות ישירות מנדרים (בלי כתובות ידניות), ואז מרענן את התצוגה-המקדימה למטה.
          </div>
          <Btn kind="primary" disabled={pulling || loading} onClick={() => void pullNow()}>
            {pulling ? 'מושך…' : '🔄 משוך וסנכרן עכשיו'}
          </Btn>
        </div>
      )}
      {/* 🔁 זיהוי-הו"ק — הוסר מכאן (20.8): הכפתור חשוף כעת במסך-התורמים עצמו (SupportersView,
          מגודר hasNedarimHist) — משטח-יחיד, בלי כפילות. אותה פעולה בדיוק. */}
      {nedCount > 0 && (
        <div style={{ border: '1px solid var(--danger, #e05252)', background: 'var(--bg)', borderRadius: 10, padding: 10, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>🔄 איפוס מלא של ייבוא-נדרים</div>
          <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 6 }}>
            <b>יימחקו {createdCount.toLocaleString('he-IL')}</b> כרטיסים שנוצרו מנדרים
            {cleanedCount ? <> · <b>ינוקו {cleanedCount.toLocaleString('he-IL')}</b> כרטיסים מקוריים (רק היסטוריית-החיוב)</> : null} —
            חזרה למצב שלפני-הייבוא. <b>הקבלות והתרומות המקוריות לא נגעות.</b> אחר-כך: משוך מחדש (<code>reset=1</code>) ובצע סנכרון נקי.
          </div>
          <Btn
            kind={wipeArmed ? 'danger' : undefined}
            sm
            onClick={() => {
              if (!wipeArmed) { setWipeArmed(true); return; }
              resetNedarimImport();
              setWipeArmed(false);
            }}
          >
            {wipeArmed ? `לאשר מחיקת ${createdCount.toLocaleString('he-IL')} כרטיסים?` : `🔄 אפס הכל מנדרים (${createdCount.toLocaleString('he-IL')} יימחקו)`}
          </Btn>
          {wipeArmed && <Btn sm onClick={() => setWipeArmed(false)}>ביטול</Btn>}
        </div>
      )}
      {loading && <div className="empty">טוען נתונים מנדרים…</div>}

      {!loading && error && (
        <Empty>שגיאת-קריאה: {error}. (דורש חיבור-ענן פעיל + נתונים ששוגרו מנדרים.)</Empty>
      )}

      {!loading && !error && s && (
        <>
          {done ? (
            <div style={{ padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 40 }}>✅</div>
              <div style={{ fontWeight: 800, margin: '8px 0' }}>הסנכרון הושלם ונשמר.</div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                {s.newSupporters} כרטיסים חדשים · {s.updatedSupporters} עודכנו · {s.chargesAdded} חיובים נרשמו ב-hist.
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 12 }}>
                התאמה לפי מפתחות: מזהה-תורם (ToremId) → ת"ז → טלפון → אימייל → שם+עיר. העסקאות נרשמות כהיסטוריית-חיוב
                (נדרים מנפיק את קבלת ה-§46 — מוני-הקבלות במאור לא משתנים). אין כתיבה עד לאישור.
              </div>

              {/* לוח-מונים */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginBottom: 12 }}>
                <Stat n={s.donorsIn} label="תורמים בנדרים" />
                <Stat n={s.chargesIn} label="עסקאות בנדרים" />
                <Stat n={s.newSupporters} label={'כרטיסים חדשים'} accent />
                <Stat n={s.updatedSupporters} label="כרטיסים שיעודכנו" accent />
                <Stat n={s.chargesAdded} label="חיובים חדשים" accent />
                <Stat n={s.chargesDup} label="כבר-קיימים (דילוג)" />
                {s.refundsApplied > 0 && <Stat n={s.refundsApplied} label="זיכויים (קוזזו)" accent />}
                {s.chargesNonPositive > 0 && <Stat n={s.chargesNonPositive} label="ביטולים (סומנו)" />}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 12 }}>
                סכומים שיירשמו: ₪{s.ilsAdded.toLocaleString('he-IL')}
                {s.usdAdded ? ' · $' + s.usdAdded.toLocaleString('he-IL') : ''}
                {s.recurring ? ' · 🔁 ' + s.recurring + ' חיובי הו״ק' : ''}
                {s.chargesNoTxn ? ' · ' + s.chargesNoTxn + ' בלי מס׳-עסקה' : ''}
              </div>

              {nothing ? (
                <Empty>הכול מסונכרן — אין מה להוסיף 🎉</Empty>
              ) : (
                <>
                  {plan.newNames.length > 0 && (
                    <Sample title={'כרטיסים חדשים (' + s.newSupporters + ')'} names={plan.newNames} total={s.newSupporters} />
                  )}
                  {plan.updatedNames.length > 0 && (
                    <Sample title={'כרטיסים שיעודכנו (' + s.updatedSupporters + ')'} names={plan.updatedNames} total={s.updatedSupporters} />
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <Btn kind={armed ? 'danger' : 'primary'} onClick={apply}>
                      {armed ? 'לאשר סנכרון סופי?' : '🔄 בצע סנכרון'}
                    </Btn>
                    {armed && <Btn onClick={() => setArmed(false)}>ביטול</Btn>}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      <div className="modal-actions">
        <Btn onClick={props.onClose}>סגירה</Btn>
      </div>
    </Modal>
  );
}

function Stat({ n, label, accent }: { n: number; label: string; accent?: boolean }) {
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: accent ? 'var(--accent-deep, var(--accent))' : 'var(--ink)' }}>
        {n.toLocaleString('he-IL')}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{label}</div>
    </div>
  );
}

function Sample({ title, names, total }: { title: string; names: string[]; total: number }) {
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 10, marginBottom: 8 }}>
      <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.7 }}>
        {names.join(' · ')}
        {total > names.length ? ' … ועוד ' + (total - names.length) : ''}
      </div>
    </div>
  );
}
