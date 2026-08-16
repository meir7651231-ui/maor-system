/**
 * הגדרות ← "חבר את מאור" (בקשת-בעלים 15.8) — הפעלת ניהול-עובדות ללקוח-שורש.
 * מגודר למייל-על בלבד. בקליק אחד מוודא מסמך `platformOrgs/{slug}` עם
 * `manager`=הבעלים, כך ש-`👥 ניהול העובדות` (#manage) נפתח, ושם מקצים
 * ייעודים-פר-עובד (memberConfigs.designations) שנאכפים בסינון-התצוגה.
 *
 * אינו נוגע בקונפיג/בנתונים — רק שדות ניהול-העובדות (merge, לא הרסני).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { isSuperAdmin } from '../../lib/config';
import { Btn } from '../ui';
import { Section, SectionNote } from './lib';

export function EmployeeMgmtSection() {
  const cloudUser = useApp((s) => s.cloud.user);
  const cloudOn = useApp((s) => s.cloud.enabled);
  const isManager = useApp((s) => s.cloud.isManager);
  const enableMgmt = useApp((s) => s.enableEmployeeManagement);
  const toast = useApp((s) => s.toast);
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  // מגודר למייל-על בלבד — לא נחשף לאף לקוח.
  if (!isSuperAdmin(cloudUser?.email)) return null;

  const go = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await enableMgmt();
      setArmed(false);
    } catch (e) {
      toast(e instanceof Error ? '⚠ ' + e.message : '⚠ ההפעלה נכשלה — נסו שוב');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section
      id="sec-employee-mgmt"
      title="👥 ניהול-עובדות + ייעודים (חבר את מאור)"
      sub="מאפשר להקצות לכל עובדת רק את הייעודים שמותר לה לראות — גם ללקוח-שורש"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            padding: '2px 10px',
            borderRadius: 999,
            border: '1px solid var(--line)',
            color: isManager ? 'var(--green)' : 'var(--ink-faint)',
          }}
        >
          {isManager ? '✓ ניהול-עובדות פעיל' : 'ניהול-עובדות כבוי'}
        </span>
      </div>

      {!cloudOn && <SectionNote>זמין רק כשהענן מחובר (התחברו לענן תחילה).</SectionNote>}

      {cloudOn && !isManager && (
        <>
          <SectionNote>
            בלחיצה תוקמו כ<b>מנהל/ת-הארגון</b> (merge, בלי לגעת בנתונים/בקונפיג). אחר-כך
            ייפתח הצ׳יפ <b>„👥 ניהול העובדות"</b> — שם מוסיפים עובדות ומקציעים לכל אחת את
            הייעודים שהיא רשאית לראות. עובדת בלי הקצאה רואה רק תורמים ללא-ייעוד (משותפים).
          </SectionNote>
          {!armed ? (
            <Btn kind="primary" sm onClick={() => setArmed(true)}>
              הפעלת ניהול-העובדות
            </Btn>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13 }}>להקים אתכם כמנהל/ת ולפתוח ניהול-עובדות?</span>
              <Btn kind="primary" sm onClick={() => void go()} disabled={busy}>
                {busy ? 'מפעיל…' : 'כן, הפעל'}
              </Btn>
              <Btn sm onClick={() => setArmed(false)} disabled={busy}>
                ביטול
              </Btn>
            </div>
          )}
        </>
      )}

      {cloudOn && isManager && (
        <SectionNote>
          ניהול-העובדות פעיל. פתחו <b>„👥 ניהול העובדות"</b> (בהגדרות) כדי להוסיף עובדות
          ולהקצות לכל אחת ייעודים. ⚠️ דורש פרסום כללי-Firestore (בעלים) לאכיפה מלאה בשרת.
        </SectionNote>
      )}
    </Section>
  );
}
