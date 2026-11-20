import { useState } from 'react';
import { useApp } from '../store.tsx';
import { api } from '../api.ts';
import { failPrefix } from '../lib/failure.ts';
import { HOLD_NOTE_MIN, holdCanRelease, holdOwnerOnly, holdText } from '../lib/restoreHold.ts';
import { Button } from './ui.tsx';

/** critic סבב 177: המערכת שוחזרה מגיבוי ⇒ כל השליחה עצורה. באנר קבוע (לא נסגר ב«טופל») עם טופס חידוש מתועד.
 *  צבעים: ink-900/critical-ink על red-50 — כמו באנר לוח החגים שפג (tests/contrast.check.ts). */
export function RestoreHoldBanner() {
  const { restoreHold, me, reload, showToast, showFail } = useApp();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  if (!restoreHold) return null;
  const userOnly = holdOwnerOnly(me);
  const release = async () => {
    setBusy(true);
    try { await api.releaseRestoreHold(note.trim()); } catch (e) {
      showFail(failPrefix('השליחה לא חודשה', (e as Error).message)); setBusy(false); return;
    }
    setNote(''); setBusy(false);
    await reload().catch(() => { /* stale מטופל ב-store */ });
    showToast('✓ השליחה חודשה ותועדה. תזכורות מאושרות ייצאו בחלון השליחה הבא');
  };
  return (
    <div role="alert" id="restore-hold" data-testid="restore-hold"
      className="rounded-2xl border border-red-300 bg-red-50 text-ink-900 p-4 space-y-2">
      <p className="font-extrabold text-critical-ink"><span aria-hidden>🛑</span> המערכת שוחזרה מגיבוי — השליחה ללקוחות עצורה</p>
      <p className="text-sm">{holdText(restoreHold)}</p>
      {userOnly ? (
        <p className="text-sm font-bold" data-testid="restore-hold-owner-only">רק בעל העסק יכול לחדש את השליחה — בקשו ממנו להיכנס עם החשבון שלו.</p>
      ) : (
        <>
          <label className="block">
            <span className="text-xs font-bold">מה החלתם מחדש? (לפחות {HOLD_NOTE_MIN} תווים, נשמר בתיעוד)</span>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} maxLength={500} data-testid="restore-hold-note"
              placeholder="למשל: עברתי על בקשות ההסרה מאז 12.11 והסרתי שוב את דנה ואת יוסי"
              aria-label="תיעוד ההסרות והמחיקות שהוחלו מחדש מאז הגיבוי"
              className="mt-1 w-full rounded-xl border border-ink-200 bg-white p-2.5 text-sm focus:border-brand focus:ring-2 focus:ring-brand/30 outline-none" />
          </label>
          <div className="flex justify-end">
            <Button size="sm" data-testid="restore-hold-release" disabled={busy || !holdCanRelease(note)}
              onClick={() => void release()}>חידוש השליחה</Button>
          </div>
        </>
      )}
    </div>
  );
}
