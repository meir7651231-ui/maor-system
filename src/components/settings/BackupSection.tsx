/**
 * הגדרות ← גיבוי ושחזור — הסקשן הקריטי:
 * חיווי שמירה אוטומטית (אדום כשנכשלת), הורדת גיבוי מלא, שחזור מקובץ,
 * וצילומים יומיים (30 אחרונים) עם שחזור לכל צילום.
 */
import { useEffect, useState, type ChangeEvent } from 'react';
import type { Db } from '../../types/domain';
import { useApp } from '../../store/useApp';
import {
  listSnapshots,
  loadSnapshot,
  parseBackupFile,
  isEncryptedBackup,
  decryptBackupFile,
  isCryptoActive,
} from '../../store/persist';
import { Btn, Field, FormError, Modal, TextInput } from '../ui';
import { featureOn, termOf } from '../../lib/config';
import { Section, SectionNote } from './lib';
import { fmtDate, fmtDateTime } from './helpers';

/** UX סבב-ז׳ — זרימת-השחזור עברה מ-window.confirm/prompt (שבורים בטאבלט,
 *  ובלתי-נגישים) למודאל פנימי דו-שלבי: פענוח (לקובץ מוצפן) ← אישור-דריסה
 *  עם אותו סיכום בדיוק. אותן יכולות: סיסמה או מפתח-שחזור, אזהרת-גלוי
 *  כשההצפנה כבויה במכשיר. */
type RestoreStage =
  | { stage: 'password'; encText: string; fail: boolean }
  | { stage: 'confirm'; parsed: Db; sourceLabel: string; plainWarn: boolean };

export function BackupSection() {
  const saveOk = useApp((s) => s.saveOk);
  const savedAt = useApp((s) => s.db.savedAt);
  const exportBackup = useApp((s) => s.exportBackup);
  const restoreDb = useApp((s) => s.restoreDb);
  const toast = useApp((s) => s.toast);

  const [error, setError] = useState('');
  const [snaps, setSnaps] = useState<string[]>([]);
  const [restore, setRestore] = useState<RestoreStage | null>(null);
  const [pw, setPw] = useState('');

  useEffect(() => {
    void listSnapshots().then(setSnaps);
  }, []);

  async function onRestoreFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // מאפשר לבחור שוב את אותו קובץ
    if (!file) return;
    setError('');
    setPw('');
    try {
      const text = await file.text();
      // קובץ גיבוי מוצפן — שלב פענוח במודאל (סיסמה או מפתח-שחזור)
      if (isEncryptedBackup(text)) {
        setRestore({ stage: 'password', encText: text, fail: false });
        return;
      }
      const parsed = parseBackupFile(text);
      setRestore({ stage: 'confirm', parsed, sourceLabel: 'מקובץ הגיבוי', plainWarn: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בקריאת הקובץ');
    }
  }

  /** שלב הפענוח: מנסים את הקלט כסיסמה, ואם נכשל — כמפתח-שחזור (שתי היכולות נשמרו).
   *  חוזה decryptBackupFile כפול: null = סוד שגוי; חריגה = הסוד נכון אך התוכן
   *  פגום/גרסה-חדשה — חייבים לתפוס ולהציג, אחרת המודאל קופא בשקט (ביקורת 6.8).
   *  busy: ‏PBKDF2 ×600K רץ עד פעמיים — בלי חיווי, טאבלט מקבל דאבל-טאפ וריצות כפולות. */
  const [busy, setBusy] = useState(false);
  const [decErr, setDecErr] = useState('');
  async function tryDecrypt() {
    if (restore?.stage !== 'password' || !pw.trim() || busy) return;
    setBusy(true);
    setDecErr('');
    try {
      const parsed =
        (await decryptBackupFile(restore.encText, pw, 'pass')) ??
        (await decryptBackupFile(restore.encText, pw.trim().toUpperCase(), 'rec'));
      if (!parsed) {
        setRestore({ ...restore, fail: true });
        return;
      }
      setPw('');
      // הקובץ מוצפן אך ההצפנה כבויה במכשיר — restoreDb יכתוב את הנתונים הרגישים
      // בגלוי. מזהירים במודאל-האישור, שכן ה-store לבדו אינו יודע שהמקור היה מוצפן.
      setRestore({ stage: 'confirm', parsed, sourceLabel: 'מקובץ גיבוי מוצפן', plainWarn: !isCryptoActive() });
    } catch (err) {
      setDecErr(err instanceof Error ? err.message : 'הפענוח נכשל — הקובץ פגום');
    } finally {
      setBusy(false);
    }
  }

  async function onRestoreSnapshot(key: string) {
    setError('');
    const parsed = await loadSnapshot(key);
    if (!parsed) {
      toast('⚠ הצילום היומי לא נטען — נסו גיבוי אחר');
      return;
    }
    setRestore({ stage: 'confirm', parsed, sourceLabel: 'מצילום יומי ' + fmtDate(key), plainWarn: false });
  }

  /** שלב האישור: הדריסה מתבצעת רק מהכפתור המפורש במודאל. */
  function applyRestore() {
    if (restore?.stage !== 'confirm') return;
    restoreDb(restore.parsed);
    setRestore(null);
    void listSnapshots().then(setSnaps);
  }

  return (
    <Section id="sec-backup" title="💾 גיבוי ושחזור" sub="הסקשן החשוב ביותר במערכת — אל תדלגו עליו">
      {/* חיווי מצב שמירה */}
      {saveOk ? (
        <div
          style={{
            background: '#e4f5ea',
            color: 'var(--green)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 14,
            marginBottom: 12,
          }}
        >
          ✓ שמירה אוטומטית פעילה — כל שינוי נשמר במחשב זה (נשמר לאחרונה: {fmtDateTime(savedAt)})
        </div>
      ) : (
        <div
          style={{
            background: '#fdecea',
            color: 'var(--red)',
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          ⚠ השמירה האוטומטית נכשלה! ייתכן שאין מקום פנוי בדפדפן או שהאחסון חסום — הורידו גיבוי מלא
          עכשיו לפני שממשיכים לעבוד.
        </div>
      )}

      <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 14, lineHeight: 1.6 }}>
        כל הנתונים חיים <b>בדפדפן הזה בלבד</b> — אין שרת ואין ענן. ניקוי היסטוריית הדפדפן, תקלה
        במחשב או מעבר למחשב אחר עלולים למחוק הכל. לכן חשוב להוריד קובץ גיבוי מלא באופן קבוע ולשמור
        אותו במקום נוסף (דוא"ל, החסן נייד). המערכת גם מורידה גיבוי אוטומטי פעם ביום בסוף היום.
      </p>

      <FormError error={error} />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {/* 🔐 הוצאת-מידע חסומה לעובד ⇒ אין כפתור-גיבוי (שחזור=ייבוא, נשאר) */}
        {featureOn(useApp.getState().config, 'core.export') && (
          <Btn kind="primary" onClick={exportBackup}>
            ⬇ הורדת גיבוי מלא
          </Btn>
        )}
        <label className="btn" style={{ cursor: 'pointer' }}>
          ⬆ שחזור מקובץ גיבוי
          <input
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={(e) => void onRestoreFile(e)}
          />
        </label>
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>צילומים יומיים בדפדפן זה</h3>
      {snaps.length === 0 ? (
        <p style={{ fontSize: 13.5, color: 'var(--ink-faint)' }}>
          עדיין אין צילומים יומיים — המערכת שומרת צילום אוטומטי אחד בכל יום עבודה (עד 30 ימים אחורה).
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ maxWidth: 480 }}>
            <thead>
              <tr>
                <th>תאריך הצילום</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {snaps.map((k) => (
                <tr key={k}>
                  <td>{fmtDate(k)}</td>
                  <td>
                    <Btn sm onClick={() => void onRestoreSnapshot(k)}>
                      שחזור מצילום זה
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <SectionNote>
        הצילומים היומיים נשמרים בתוך הדפדפן (IndexedDB) — הם לא מגנים מפני מחיקת נתוני הדפדפן. לגיבוי
        אמיתי השתמשו ב"הורדת גיבוי מלא".
      </SectionNote>

      {/* שלב פענוח — קובץ גיבוי מוצפן */}
      {restore?.stage === 'password' && (
        <Modal title="🔐 קובץ גיבוי מוצפן" onClose={() => setRestore(null)}>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginBottom: 10 }}>
            הזינו את סיסמת ההצפנה, או את מפתח-השחזור שקיבלתם בהפעלת ההצפנה.
          </p>
          <Field label="סיסמה או מפתח-שחזור">
            {/* הקלדה מנקה את חיווי-הכישלון — אחרת כשל-שני לא נבדל מהראשון */}
            <TextInput value={pw} onChange={(v) => { setPw(v); if (restore.fail) setRestore({ ...restore, fail: false }); }} type="password" dir="ltr" />
          </Field>
          {restore.fail && (
            <div style={{ color: 'var(--red)', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              הפענוח נכשל — סיסמה או מפתח שחזור שגויים
            </div>
          )}
          {decErr && (
            <div style={{ color: 'var(--red)', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{decErr}</div>
          )}
          <div className="modal-actions">
            <Btn kind="primary" onClick={() => void tryDecrypt()} disabled={!pw.trim() || busy}>
              {busy ? 'מפענח…' : 'פענוח והמשך'}
            </Btn>
            <Btn onClick={() => setRestore(null)}>ביטול</Btn>
          </div>
        </Modal>
      )}

      {/* שלב אישור-הדריסה — אותו סיכום בדיוק כמו ה-confirm ההיסטורי */}
      {restore?.stage === 'confirm' && (
        <Modal title="⚠ אישור שחזור — דריסת הנתונים" onClose={() => setRestore(null)}>
          {(() => {
            const cur = useApp.getState().db;
            const cfg = useApp.getState().config;
            const inc = restore.parsed;
            return (
              <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 10 }}>
                {`שחזור ${restore.sourceLabel} ידרוס את כל הנתונים הנוכחיים במחשב זה `}
                <b>{`(${cur.families.length} ${termOf(cfg, 'nav.families', 'משפחות')}, ${cur.courses.length} ${termOf(cfg, 'nav.courses', 'חוגים')}, ${cur.supporters.length} ${termOf(cfg, 'nav.supporters', 'תורמים')})`}</b>
                {`. במקומם ייכנסו הנתונים מהגיבוי: `}
                <b>{`${inc.families.length} ${termOf(cfg, 'nav.families', 'משפחות')}, ${inc.courses.length} ${termOf(cfg, 'nav.courses', 'חוגים')}`}</b>
                {inc.savedAt ? ` (נשמר ב-${fmtDateTime(inc.savedAt)})` : ''}.
              </p>
            );
          })()}
          {restore.plainWarn && (
            <div
              style={{
                background: '#fdf1d4',
                color: '#9a6414',
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 10,
              }}
            >
              {'⚠ קובץ הגיבוי מוצפן, אך ההצפנה כבויה במכשיר זה — הנתונים הרגישים (בריאות, ת"ז, טלפונים, ' +
                termOf(useApp.getState().config, 'nav.supporters', 'תורמים') +
                ') ייכתבו גלויים ללא הצפנה.'}
            </div>
          )}
          <div className="modal-actions">
            <Btn kind="danger" onClick={applyRestore}>
              אישור השחזור — דריסת הנתונים
            </Btn>
            <Btn onClick={() => setRestore(null)}>ביטול</Btn>
          </div>
        </Modal>
      )}
    </Section>
  );
}
