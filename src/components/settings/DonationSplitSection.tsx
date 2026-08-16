/**
 * הגדרות ← מסלול-B: מיגרציית-פיצול-תרומות (חלון-בעלים) — מגודר למייל-על בלבד.
 * מפרק את כל התרומות לאוסף-ענן נפרד פר-ייעוד (אכיפת-הרשאה בשכבת-הנתונים). הפיך +
 * אידמפוטנטי + מגבה-מקומית-לפני; **אינו נוגע ב-donationSeq** (רצף §46).
 *
 * ⚠️ הבעלים מריץ. זרימת-שני-שלבים: (1) מיגרציה חד-פעמית ⇒ (2) כפתור "הדלקת
 * פיצול-התרומות" שכותב `donationSplit:true` לקונפיג-הענן בקליק (בלי עריכת-Firestore
 * ידנית) דרך `enableDonationSplit` שב-store. מלא ב-knowledge/RUNBOOK-DONATION-SPLIT-2026-08-14.md.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { isSuperAdmin, donationSplitOn } from '../../lib/config';
import { Btn } from '../ui';
import { Section, SectionNote } from './lib';

export function DonationSplitSection() {
  const cloudUser = useApp((s) => s.cloud.user);
  const cloudOn = useApp((s) => s.cloud.enabled);
  const config = useApp((s) => s.config);
  const runMigration = useApp((s) => s.runDonationSplitMigration);
  const enableSplit = useApp((s) => s.enableDonationSplit);
  const disableSplit = useApp((s) => s.disableDonationSplit);
  const toast = useApp((s) => s.toast);
  const [busyOff, setBusyOff] = useState(false);
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [armedOn, setArmedOn] = useState(false);
  const [busyOn, setBusyOn] = useState(false);

  // מגודר למייל-על בלבד (isSuperAdmin) — לא נחשף לאף לקוח.
  if (!isSuperAdmin(cloudUser?.email)) return null;

  const active = donationSplitOn(config); // כבר דלוק בקונפיג?

  const go = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const n = await runMigration();
      setDone(n);
      setArmed(false);
    } catch (e) {
      toast(e instanceof Error ? '⚠ ' + e.message : '⚠ המיגרציה נכשלה — נסו שוב');
    } finally {
      setBusy(false);
    }
  };

  const turnOn = async () => {
    if (busyOn) return;
    setBusyOn(true);
    try {
      await enableSplit(); // כותב donationSplit:true לקונפיג-הענן (merge) + תוקף-מיידי
      setArmedOn(false);
      // הבאדג' יתעדכן חי דרך onSnapshot (applyCloudDoc) — active יהפוך ל-✓
    } catch (e) {
      toast(e instanceof Error ? '⚠ ' + e.message : '⚠ ההפעלה נכשלה — נסו שוב');
    } finally {
      setBusyOn(false);
    }
  };

  return (
    <Section
      id="sec-donation-split"
      title="🔀 פיצול-תרומות פר-ייעוד (מסלול-B)"
      sub="אכיפת-הרשאת-ייעוד לעובדות בשכבת-הנתונים — מיגרציה חד-פעמית (חלון-בעלים)"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            padding: '2px 10px',
            borderRadius: 999,
            border: '1px solid var(--line)',
            color: active ? 'var(--green)' : 'var(--ink-faint)',
          }}
        >
          {active ? '✓ פיצול פעיל בארגון' : 'פיצול כבוי (תרומות מקוננות)'}
        </span>
        {/* כיבוי-בקליק (בקשת-בעלים — "לא מתכבה" בטלפון): מנקה גם מטמון-קונפיג תקוע */}
        {active && (
          <Btn
            sm
            onClick={() => {
              if (busyOff) return;
              setBusyOff(true);
              void disableSplit().finally(() => setTimeout(() => window.location.reload(), 400));
            }}
            disabled={busyOff}
          >
            {busyOff ? 'מכבה…' : '🧹 כיבוי הפיצול'}
          </Btn>
        )}
      </div>

      {!cloudOn && <SectionNote>זמין רק כשהענן מחובר (התחברו לענן תחילה).</SectionNote>}

      {cloudOn && (
        <>
          <SectionNote>
            <b>לפני שמריצים:</b> ודאו שפרסמתם את כללי-ה-Firestore. בלחיצה יורד גיבוי מקומי מלא
            אוטומטית, ואז כל התרומות נכתבות לאוסף-הענן הנפרד (upsert לפי מספר-קבלה). הפעולה
            <b> הפיכה ואינה נוגעת ברצף-הקבלות</b>. אחרי-כן — הדליקו את הפיצול בכפתור שלב 2 (בלי עריכת-Firestore).
          </SectionNote>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>שלב 1 — מיגרציה (חד-פעמי)</div>
            {done !== null ? (
              <SectionNote>
                ✓ הוגרו <b>{done}</b> תרומות לאוסף. כעת עברו לשלב 2 והדליקו את הפיצול.
              </SectionNote>
            ) : !armed ? (
              <Btn kind="primary" sm onClick={() => setArmed(true)}>
                הרצת מיגרציית-הפיצול
              </Btn>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 13 }}>לגבות ולהגר את כל התרומות?</span>
                <Btn kind="primary" sm onClick={() => void go()} disabled={busy}>
                  {busy ? 'מגבה ומגר…' : 'כן, הרץ'}
                </Btn>
                <Btn sm onClick={() => setArmed(false)} disabled={busy}>
                  ביטול
                </Btn>
              </div>
            )}
          </div>

          {!active && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>שלב 2 — הדלקת הפיצול</div>
              <SectionNote>
                בקליק אחד מדליק את <code>donationSplit</code> בקונפיג-הענן בשבילכם (בלי עריכת-Firestore ידנית).
                הריצו קודם את שלב 1. הפיצול נכנס לתוקף מיד; לנסיגה — כבו את הדגל בלוח-הבקרה.
              </SectionNote>
              {!armedOn ? (
                <Btn kind="primary" sm onClick={() => setArmedOn(true)}>
                  הדלקת פיצול-התרומות
                </Btn>
              ) : (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 13 }}>להדליק את הפיצול בארגון?</span>
                  <Btn kind="primary" sm onClick={() => void turnOn()} disabled={busyOn}>
                    {busyOn ? 'מדליק…' : 'כן, הדלק'}
                  </Btn>
                  <Btn sm onClick={() => setArmedOn(false)} disabled={busyOn}>
                    ביטול
                  </Btn>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <SectionNote>
        ⚠️ דורש פרסום כללי-Firestore (בעלים). מדריך מלא: <code>RUNBOOK-DONATION-SPLIT</code>. נסיגה: כבו את הדגל — הנתונים המקוננים לא נמחקו.
      </SectionNote>
    </Section>
  );
}
