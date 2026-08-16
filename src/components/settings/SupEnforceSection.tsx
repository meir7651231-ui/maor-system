/**
 * הגדרות ← אכיפת-תומכים בשכבת-הנתונים (15.8, ארגוני-פלטפורמה בלבד) — מגודר מייל-על.
 * שני שלבים: (1) מיגרציה שזורעת `skey`=forWho לכל התומכים בענן ⇒ (2) כפתור שמדליק
 * `supporterEnforce:true` בקונפיג-הענן. אחרי-כן עובדת מוגבלת לא יכולה אפילו *לקרוא*
 * תומכים מחוץ לייעוד שלה (Rules פר-skey). ⚠️ לא-נתמך בלקוח-שורש (cloudRoot).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { isSuperAdmin, supEnforceOn } from '../../lib/config';
import { Btn } from '../ui';
import { Section, SectionNote } from './lib';

export function SupEnforceSection() {
  const cloudUser = useApp((s) => s.cloud.user);
  const cloudOn = useApp((s) => s.cloud.enabled);
  const config = useApp((s) => s.config);
  const runMigration = useApp((s) => s.runSupEnforceMigration);
  const enableEnforce = useApp((s) => s.enableSupEnforce);
  const toast = useApp((s) => s.toast);
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [armedOn, setArmedOn] = useState(false);
  const [busyOn, setBusyOn] = useState(false);

  // מגודר למייל-על בלבד.
  if (!isSuperAdmin(cloudUser?.email)) return null;

  const active = supEnforceOn(config);
  const isRoot = config.cloudRoot === true || config.slug === 'default';

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
      await enableEnforce();
      setArmedOn(false);
    } catch (e) {
      toast(e instanceof Error ? '⚠ ' + e.message : '⚠ ההפעלה נכשלה — נסו שוב');
    } finally {
      setBusyOn(false);
    }
  };

  return (
    <Section
      id="sec-sup-enforce"
      title="🔒 אכיפת-תומכים בשרת (פר-ייעוד)"
      sub="עובדת מוגבלת לא יכולה אפילו לקרוא תומכים מחוץ לייעוד שלה — לא רק בממשק (ארגון-פלטפורמה)"
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
          {active ? '✓ אכיפת-תומכים פעילה' : 'אכיפת-שרת כבויה (ממשק בלבד)'}
        </span>
      </div>

      {isRoot && (
        <SectionNote>
          ⚠️ אכיפת-השרת אינה נתמכת בלקוח-שורש (מאור) — מודל-ההרשאות שלו הוא allowlist מלא,
          בלי מושג של „עובדת מוגבלת" בשרת. האכיפה כאן ברמת-הממשק. זמין לארגוני-פלטפורמה.
        </SectionNote>
      )}
      {!cloudOn && <SectionNote>זמין רק כשהענן מחובר (התחברו לענן תחילה).</SectionNote>}

      {cloudOn && !isRoot && (
        <>
          <SectionNote>
            <b>לפני שמריצים:</b> ודאו שפרסמתם את כללי-ה-Firestore (הם שאוכפים בפועל). בלחיצה יורד
            גיבוי מקומי, ואז כל מסמכי-התומכים נכתבים מחדש עם ייעוד (skey). הפעולה <b>הפיכה ולא-הרסת</b>.
            אחר-כך הדליקו את האכיפה בכפתור שלב 2.
          </SectionNote>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>שלב 1 — מיגרציה (סימון ייעוד)</div>
            {done !== null ? (
              <SectionNote>✓ סומנו <b>{done}</b> תומכים. כעת עברו לשלב 2 והדליקו את האכיפה.</SectionNote>
            ) : !armed ? (
              <Btn kind="primary" sm onClick={() => setArmed(true)}>הרצת מיגרציית-האכיפה</Btn>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 13 }}>לגבות ולסמן ייעוד לכל התומכים?</span>
                <Btn kind="primary" sm onClick={() => void go()} disabled={busy}>{busy ? 'מגבה ומסמן…' : 'כן, הרץ'}</Btn>
                <Btn sm onClick={() => setArmed(false)} disabled={busy}>ביטול</Btn>
              </div>
            )}
          </div>

          {!active && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>שלב 2 — הדלקת האכיפה</div>
              <SectionNote>
                בקליק מדליק את <code>supporterEnforce</code> בקונפיג-הענן. הריצו קודם את שלב 1.
                לנסיגה — כבו את הדגל בלוח-הבקרה (הנתונים לא נמחקים).
              </SectionNote>
              {!armedOn ? (
                <Btn kind="primary" sm onClick={() => setArmedOn(true)}>הדלקת אכיפת-התומכים</Btn>
              ) : (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 13 }}>להדליק את האכיפה בארגון?</span>
                  <Btn kind="primary" sm onClick={() => void turnOn()} disabled={busyOn}>{busyOn ? 'מדליק…' : 'כן, הדלק'}</Btn>
                  <Btn sm onClick={() => setArmedOn(false)} disabled={busyOn}>ביטול</Btn>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <SectionNote>⚠️ דורש פרסום כללי-Firestore (בעלים) לאכיפה בפועל. נסיגה: כבו את הדגל — הנתונים נשמרים.</SectionNote>
    </Section>
  );
}
