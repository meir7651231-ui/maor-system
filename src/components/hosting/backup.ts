/**
 * 🏡 גיבוי ושחזור של המודול (exportBackup/importBackup של המקור, ⬆): גיבוי-JSON של נתוני-המודול בלבד (הורדה/העתקה —
 * דרך שער-הייצוא, נרשם ביומן-הגישה), ושחזור מקובץ — גם מגיבוי-המודול וגם מגיבוי האפליקציה המקורית (hosp_pms_v1, כולל
 * ריפוי-קידוד cp1255) — אחרי אישור in-app; מחליף את נתוני-המודול בלבד (restoreHosting — hosting.manage).
 */
import { useApp } from '../../store/useApp';
import { isoToday } from '../../lib/date-util';
import type { HostData } from './hooks';
import type { HostUi } from './hui';
import type { HostTerms } from './transitions';
import { moduleBackupOf, parseHostingBackup } from './importer';
import { copyText, downloadFile, readFileText } from './exportDoc';

const FLAG_NAMES: Readonly<Record<string, string>> = { 'hosting.kitchen': 'צוות מטבח', 'hosting.shabbat': 'צוות שבת', 'hosting.maint': 'צוות תחזוקה' };

function backupJson(d: HostData): string {
  return JSON.stringify(moduleBackupOf({ hostUnits: d.units, hostBookings: d.bookings, hostRecords: d.records, prefs: d.prefs }, new Date().toISOString()), null, 2);
}
function counts(d: HostData, t: HostTerms): string {
  return d.units.length + ' ' + t.units + ' · ' + d.bookings.length + ' ' + t.bookings + ' · ' + d.records.length + ' רשומות';
}

/** ⬇️ הורדת קובץ-גיבוי. */
export function downloadBackup(d: HostData, t: HostTerms): void {
  if (downloadFile('hosting-backup-' + isoToday() + '.json', backupJson(d), 'application/json')) {
    useApp.getState().logAccess('⬇️ גיבוי ' + t.nav + ' (JSON)', counts(d, t));
  }
}

/** ⧉ העתקת הגיבוי ללוח (כמו "ייצוא גיבוי" במקור). */
export async function copyBackup(d: HostData, t: HostTerms): Promise<void> {
  if (await copyText(backupJson(d))) {
    useApp.getState().logAccess('⧉ גיבוי ' + t.nav + ' (העתקה)', counts(d, t));
    useApp.getState().toast('הגיבוי הועתק ללוח — הדביקו לקובץ .json ושמרו');
  }
}

/** ⤵️ שחזור מקובץ — בחירת-קובץ ⇒ פענוח ⇒ אישור ⇒ החלפת נתוני-המודול. */
export function pickRestore(ui: HostUi, t: HostTerms): void {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.json,application/json';
  inp.onchange = async () => {
    const file = inp.files?.[0];
    if (!file) return;
    const st = useApp.getState();
    let raw: unknown;
    try {
      raw = JSON.parse(await readFileText(file));
    } catch {
      st.toast('שגיאת קריאה — הקובץ אינו JSON תקין');
      return;
    }
    const res = parseHostingBackup(raw, new Date().toISOString());
    if (!res.ok) {
      st.toast(res.error);
      return;
    }
    const x = res.data;
    const msg =
      'לשחזר מהקובץ' +
      (x.source === 'app' ? ' (גיבוי האפליקציה המקורית)' : '') +
      '? נתוני-המודול הנוכחיים יוחלפו: ' +
      x.units.length +
      ' ' +
      t.units +
      ' · ' +
      x.bookings.length +
      ' ' +
      t.bookings +
      ' · ' +
      x.records.length +
      ' רשומות. שאר אורביט לא משתנה.';
    ui.confirm(
      msg,
      () => {
        if (!useApp.getState().restoreHosting({ units: x.units, bookings: x.bookings, records: x.records, prefs: x.prefs })) return;
        const off = x.flagsOff.map((k) => FLAG_NAMES[k] ?? k);
        useApp.getState().toast('שוחזר מהקובץ ✓' + (off.length ? ' · במקור היו כבויים: ' + off.join(', ') + ' (הפעלה/כיבוי — באשף)' : ''));
        ui.go('dash');
      },
      'שחזור',
    );
  };
  inp.click();
}
