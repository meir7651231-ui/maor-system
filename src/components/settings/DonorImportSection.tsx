/**
 * 🔄 ייבוא תורמים ותורמות — מסך-מנהל (23.8, הכרעת-בעלים: "לצמצם את כל היבוא
 * תורמים ותורמות לכפתורים במסך מנהל בלבד ורק את התשלומים הנכנסים תשאיר
 * לצפייה במסך התורמים").
 *
 * כל פעולות-הייבוא שהיו פזורות במסך-התורמים רוכזו כאן, מגודרות-מנהל:
 *  · 🔄 סנכרון מנדרים (NedarimSyncModal — תורמים+עסקאות, תצוגה-מקדימה)
 *  · 🔄 משיכת סולה + 🧹 משיכה-מלאה-באיפוס (חמושה)
 *  · 🔁 זיהוי הו"ק מהיסטוריה (חמוש)
 * ‏CSV-תורמים ממשיך לחיות בסעיף-הייבוא הכללי באותה לשונית (ImportSection,
 * מסלול 'sup') — מסך-התורמים כבר לא מציע אותו.
 * מסך-התורמים נשאר עם 💰 תשלומים-נכנסים בלבד (צפייה/מיזוג — לא ייבוא).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { integrationOn, integrationSetting, isAdminAuthority, isSuperAdmin, termOf } from '../../lib/config';
import { Btn } from '../ui';
import { Section, SectionNote } from './lib';
import { NedarimSyncModal } from '../supporters/NedarimSyncModal';

type CloudMod = typeof import('../../store/cloudSync');

export function DonorImportSection() {
  const config = useApp((s) => s.config);
  const cloudUser = useApp((s) => s.cloud.user);
  const cloudOn = useApp((s) => s.cloud.enabled);
  const isManager = useApp((s) => s.cloud.isManager);
  const toast = useApp((s) => s.toast);
  const auditNote = useApp((s) => s.auditNote);
  const detectNedarimHok = useApp((s) => s.detectNedarimHok);
  const hasClearingHist = useApp((s) =>
    s.db.supporters.some((sp) => (sp.hist ?? []).some((h) => h.clearer === 'נדרים' || h.clearer === 'סולה')),
  );

  const [nedOpen, setNedOpen] = useState(false);
  const [pulling, setPulling] = useState(false);
  // חימוש-פוקע (3.5ש') לפעולות המסוכנות — אותו דפוס כמו במסך-התורמים ההיסטורי
  const [armed, setArmed] = useState<string | null>(null);
  function armOr(action: string, run: () => void) {
    if (armed !== action) {
      setArmed(action);
      setTimeout(() => setArmed((a) => (a === action ? null : a)), 3500);
      return;
    }
    setArmed(null);
    run();
  }

  const paymentsOn = integrationOn(config, 'payments') && cloudOn;
  const solaPullUrl = integrationSetting(config, 'payments', 'solaPullUrl');
  const canPullSola = !!solaPullUrl && (isSuperAdmin(cloudUser?.email) || isManager);

  // נחיל ב׳ 3.9 (F1): סמכות-מנהל אפקטיבית — בארגון-פלטפורמה בלי adminEmails עובד/ת אינו/ה מנהל
  if (!isAdminAuthority(config, cloudUser?.email, !!isManager)) return null;
  if (!paymentsOn && !hasClearingHist) return null;

  async function doSolaPull(reset: boolean) {
    setPulling(true);
    try {
      const m: CloudMod = await import('../../store/cloudSync');
      const r = await m.pullSola(solaPullUrl, { reset });
      auditNote(reset ? '🧹 משיכת-סולה מלאה (איפוס)' : '🔄 משיכת-סולה', 'נסרקו ' + (r.scanned ?? 0) + ' · נוספו ' + (r.added ?? 0));
      toast(r.scanned === 0 && r.debug
        ? '🔎 נסרקו 0 — ' + r.debug.slice(0, 220)
        : '🔄 נסרקו ' + (r.scanned ?? 0) + ' עסקאות · נוספו ' + (r.added ?? 0) + ' — לרישום: מסך התורמים ← 💰 תשלומים נכנסים');
    } catch (e) {
      toast('⚠ משיכה נכשלה: ' + String((e as Error)?.message || e));
    } finally {
      setPulling(false);
    }
  }

  return (
    <Section
      id="sec-donor-import"
      title={'🔄 ייבוא ' + termOf(config, 'nav.supporters', 'תורמים ותורמות')}
      sub="סנכרון-נדרים · משיכת-סולה · זיהוי הו״ק — פעולות-הייבוא רוכזו כאן (מסך-מנהל); הרישום עצמו נשאר בתור-האישור שבמסך התורמים"
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {paymentsOn && (
          <Btn onClick={() => setNedOpen(true)} title="ייבוא תורמים ועסקאות מנדרים לכרטיסים — התאמה לפי מפתחות, עם תצוגה-מקדימה">
            🔄 סנכרון מנדרים
          </Btn>
        )}
        {canPullSola && (
          <Btn onClick={() => void doSolaPull(false)} disabled={pulling} title="משיכת עסקאות חדשות מסולה לתור-האישור (רץ גם אוטומטית כל שעה)">
            {pulling ? 'מושך…' : '🔄 משיכה מסולה'}
          </Btn>
        )}
        {canPullSola && (
          <Btn
            kind={armed === 'sola-reset' ? 'danger' : undefined}
            disabled={pulling}
            onClick={() => armOr('sola-reset', () => void doSolaPull(true))}
            title="מחיקת הממתינות ומשיכת הכול מחדש מהשער (מטופלות נשמרות; הדדופ מגן על הכרטיסים)"
          >
            {armed === 'sola-reset' ? 'בטוח? מושך הכול מחדש' : '🧹 משיכה מלאה (איפוס)'}
          </Btn>
        )}
        {hasClearingHist && (
          <Btn
            kind={armed === 'hok' ? 'danger' : undefined}
            title="סורק חיובי-סליקה בהיסטוריה ומזהה הוראות-קבע לפי תבנית (3+ חודשים) — הו״ק ידני לא נדרס"
            onClick={() => armOr('hok', () => {
              const n = detectNedarimHok();
              toast(n ? '🔁 ' + n + ' הוראות-קבע זוהו ומולאו מהיסטוריה' : 'לא זוהו הוראות-קבע חדשות מהתבנית');
            })}
          >
            {armed === 'hok' ? 'לאשר זיהוי הו״ק?' : '🔁 זהה הו״ק מהיסטוריה'}
          </Btn>
        )}
      </div>
      <SectionNote>
        {'ייבוא-CSV נמצא בסעיף ״ייבוא נתונים״ שמעל (מסלול ״' + termOf(config, 'nav.supporters', 'תורמים') + ' (CSV)״). העסקאות שנמשכות'}
        ממתינות לרישום בתור-האישור — מסך התורמים ← 💰 תשלומים נכנסים.
      </SectionNote>
      {nedOpen && <NedarimSyncModal onClose={() => setNedOpen(false)} />}
    </Section>
  );
}
