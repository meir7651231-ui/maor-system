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
} from '../../store/persist';
import { Btn, FormError } from '../ui';
import { Section, SectionNote } from './lib';
import { fmtDate, fmtDateTime } from './helpers';

/** אישור דריסה עם סיכום מה נדרס ומה נכנס. */
function confirmRestore(incoming: Db, sourceLabel: string): boolean {
  const cur = useApp.getState().db;
  return window.confirm(
    `שחזור ${sourceLabel} ידרוס את כל הנתונים הנוכחיים במחשב זה ` +
      `(${cur.families.length} משפחות, ${cur.courses.length} חוגים, ${cur.supporters.length} תורמים).\n` +
      `במקומם ייכנסו הנתונים מהגיבוי: ${incoming.families.length} משפחות, ${incoming.courses.length} חוגים` +
      (incoming.savedAt ? ` (נשמר ב-${fmtDateTime(incoming.savedAt)})` : '') +
      `.\n\nלהמשיך בשחזור?`,
  );
}

export function BackupSection() {
  const saveOk = useApp((s) => s.saveOk);
  const savedAt = useApp((s) => s.db.savedAt);
  const exportBackup = useApp((s) => s.exportBackup);
  const restoreDb = useApp((s) => s.restoreDb);
  const toast = useApp((s) => s.toast);

  const [error, setError] = useState('');
  const [snaps, setSnaps] = useState<string[]>([]);

  useEffect(() => {
    void listSnapshots().then(setSnaps);
  }, []);

  async function onRestoreFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // מאפשר לבחור שוב את אותו קובץ
    if (!file) return;
    setError('');
    try {
      const text = await file.text();
      // קובץ גיבוי מוצפן — מבקשים סיסמה, ובכשל מציעים מפתח שחזור
      if (isEncryptedBackup(text)) {
        const pw = window.prompt('קובץ גיבוי מוצפן — הזינו את סיסמת ההצפנה (בטלו כדי להשתמש במפתח שחזור):');
        let parsed = pw ? await decryptBackupFile(text, pw, 'pass') : null;
        if (!parsed) {
          const rec = window.prompt('הזינו מפתח שחזור (או בטלו):');
          parsed = rec ? await decryptBackupFile(text, rec.trim().toUpperCase(), 'rec') : null;
        }
        if (!parsed) {
          setError('הפענוח נכשל — סיסמה או מפתח שחזור שגויים');
          return;
        }
        if (!confirmRestore(parsed, 'מקובץ גיבוי מוצפן')) return;
        restoreDb(parsed);
        void listSnapshots().then(setSnaps);
        return;
      }
      const parsed = parseBackupFile(text);
      if (!confirmRestore(parsed, 'מקובץ הגיבוי')) return;
      restoreDb(parsed);
      void listSnapshots().then(setSnaps);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בקריאת הקובץ');
    }
  }

  async function onRestoreSnapshot(key: string) {
    setError('');
    const parsed = await loadSnapshot(key);
    if (!parsed) {
      toast('⚠ הצילום היומי לא נטען — נסו גיבוי אחר');
      return;
    }
    if (!confirmRestore(parsed, 'מצילום יומי ' + fmtDate(key))) return;
    restoreDb(parsed);
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
        <Btn kind="primary" onClick={exportBackup}>
          ⬇ הורדת גיבוי מלא
        </Btn>
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
    </Section>
  );
}
