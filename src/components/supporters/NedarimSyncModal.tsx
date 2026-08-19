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
import { termOf } from '../../lib/config';
import { Btn, Empty, Modal } from '../ui';

type CloudMod = typeof import('../../store/cloudSync');

export function NedarimSyncModal(props: { onClose: () => void }) {
  const supporters = useApp((s) => s.db.supporters);
  const config = useApp((s) => s.config);
  const applyNedarimSync = useApp((s) => s.applyNedarimSync);
  const resetNedarimImport = useApp((s) => s.resetNedarimImport);
  const detectNedarimHok = useApp((s) => s.detectNedarimHok);
  const toast = useApp((s) => s.toast);
  const [hokArmed, setHokArmed] = useState(false);
  // כל מה שנכנס מנדרים: כרטיסים שנוצרו (id 'sup-ned-') + מקוריים עם extId/hist-נדרים
  const nedCount = useApp((s) =>
    s.db.supporters.filter((sp) => sp.id.startsWith('sup-ned-') || sp.extId || (sp.hist ?? []).some((h) => h.clearer === 'נדרים')).length,
  );
  const [wipeArmed, setWipeArmed] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<SyncPlan | null>(null);
  const [chargeIds, setChargeIds] = useState<string[]>([]);
  const [armed, setArmed] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const m: CloudMod = await import('../../store/cloudSync');
        const [donors, charges] = await Promise.all([m.fetchNedarimDonors(), m.fetchIncomingPayments()]);
        if (!alive) return;
        setChargeIds(charges.map((c) => c.id));
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
    // סימון החיובים כ-handled ⇒ יוצאים מרשימת-הממתינים ולא ייקלטו שוב בחיבור-החי.
    // ⚠️ בגיבוי-מלא יש אלפי חיובים — סימון **במנות** (300 במקביל, ממתין בין מנה
    // למנה) במקום אלפי כתיבות-ענן בו-זמנית שמציפות את הדפדפן (תקרית 19.8).
    if (chargeIds.length) {
      void import('../../store/cloudSync').then(async (m) => {
        for (let i = 0; i < chargeIds.length; i += 300) {
          await Promise.all(chargeIds.slice(i, i + 300).map((id) => m.markIncomingPayment(id).catch(() => {})));
        }
      });
    }
    setDone(true);
    setArmed(false);
  }

  const nav = termOf(config, 'nav.supporters', 'תורמים');

  return (
    <Modal title={'🔄 סנכרון מנדרים — ' + nav} onClose={props.onClose} wide>
      {/* 🔁 זיהוי-רטרואקטיבי של הו"ק — לחיובים שסונכרו לפני מנגנון-ההו"ק */}
      <div style={{ border: '1px solid var(--accent)', borderRadius: 10, padding: 10, marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>🔁 זיהוי הוראות-קבע מהיסטוריה</div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 6 }}>
          סורק את חיובי-הנדרים שכבר בכרטיסים, ומזהה הוראות-קבע לפי תבנית (אותו סכום ב-3+ חודשים) —
          וממלא אוטומטית את משבצת-ההו"ק. לחיובים ותיקים שסונכרו לפני הפיצ'ר. <b>הו"ק ידני לא נדרס.</b>
        </div>
        <Btn
          kind={hokArmed ? 'danger' : undefined}
          sm
          onClick={() => {
            if (!hokArmed) { setHokArmed(true); return; }
            const n = detectNedarimHok();
            toast(n ? '🔁 ' + n + ' הוראות-קבע זוהו ומולאו' : 'לא זוהו הוראות-קבע חדשות מהתבנית');
            setHokArmed(false);
          }}
        >
          {hokArmed ? 'לאשר זיהוי הו"ק?' : '🔁 זהה הוראות-קבע מנדרים'}
        </Btn>
        {hokArmed && <Btn sm onClick={() => setHokArmed(false)}>ביטול</Btn>}
      </div>
      {nedCount > 0 && (
        <div style={{ border: '1px solid var(--danger, #e05252)', background: 'var(--bg)', borderRadius: 10, padding: 10, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>🔄 איפוס מלא של ייבוא-נדרים</div>
          <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 6 }}>
            מוחק את <b>כל</b> הכרטיסים שנכנסו מנדרים (~{nedCount.toLocaleString('he-IL')}) ומנקה את היסטוריות-החיוב מנדרים —
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
            {wipeArmed ? `לאשר איפוס ~${nedCount.toLocaleString('he-IL')} כרטיסים?` : `🔄 אפס הכל מנדרים (~${nedCount.toLocaleString('he-IL')})`}
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
