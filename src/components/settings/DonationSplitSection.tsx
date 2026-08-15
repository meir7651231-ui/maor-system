/**
 * הגדרות ← מסלול-B: מיגרציית-פיצול-תרומות (חלון-בעלים) — מגודר למייל-על בלבד.
 * מפרק את כל התרומות לאוסף-ענן נפרד פר-ייעוד (אכיפת-הרשאה בשכבת-הנתונים). הפיך +
 * אידמפוטנטי + מגבה-מקומית-לפני; **אינו נוגע ב-donationSeq** (רצף §46).
 *
 * ⚠️ הבעלים מריץ. אחרי המיגרציה — מדליקים `donationSplit` בקונפיג-הארגון להפעלה.
 * מלא ב-knowledge/RUNBOOK-DONATION-SPLIT-2026-08-14.md.
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
  const toast = useApp((s) => s.toast);
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<number | null>(null);

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
      </div>

      {!cloudOn && <SectionNote>זמין רק כשהענן מחובר (התחברו לענן תחילה).</SectionNote>}

      {cloudOn && (
        <>
          <SectionNote>
            <b>לפני שמריצים:</b> ודאו שפרסמתם את כללי-ה-Firestore. בלחיצה יורד גיבוי מקומי מלא
            אוטומטית, ואז כל התרומות נכתבות לאוסף-הענן הנפרד (upsert לפי מספר-קבלה). הפעולה
            <b> הפיכה ואינה נוגעת ברצף-הקבלות</b>. אחרי-כן — הדליקו <code>donationSplit</code> בקונפיג-הארגון.
          </SectionNote>
          {done !== null ? (
            <SectionNote>
              ✓ הוגרו <b>{done}</b> תרומות לאוסף. כעת הדליקו <code>donationSplit: true</code> בקונפיג-הארגון להפעלה.
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
        </>
      )}

      <SectionNote>
        ⚠️ דורש פרסום כללי-Firestore (בעלים). מדריך מלא: <code>RUNBOOK-DONATION-SPLIT</code>. נסיגה: כבו את הדגל — הנתונים המקוננים לא נמחקו.
      </SectionNote>
    </Section>
  );
}
