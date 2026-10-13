/**
 * 🏡 אירוח משפחתי — יציאות: הדפסת מסמך (iframe נסתר — "הדפסה / PDF"), הורדת קובץ (HTML/JSON), העתקה ללוח.
 * אותו דפוס כמו פרנסה׳לע (exportDoc) — בלי לייבא את עולם-הקבלות (בידוד). **כל נתיב עובר קודם את שער
 * יציאת-המידע (guardExport — core.export כבוי בכרטיס-העובד ⇒ אין הדפסה/הורדה/העתקה)**; מחזיר האם יצא בפועל —
 * הקורא רושם ליומן-הגישה רק אז. CSV — דרך downloadCsv של אורביט (BOM + הגנת-נוסחאות, אותו שער).
 */
import { guardExport } from '../../lib/exportGate';

/** הדפסה מבודדת — רק המסמך (repPrint של המקור). */
export function printHtmlDoc(html: string): boolean {
  if (!guardExport()) return false;
  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.insetInlineEnd = '-9999px';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.setAttribute('aria-hidden', 'true');
  frame.srcdoc = html;
  frame.onload = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } finally {
      setTimeout(() => frame.remove(), 60_000);
    }
  };
  document.body.appendChild(frame);
  return true;
}

/** הורדת קובץ (downloadFile/blobDownload של המקור). */
export function downloadFile(filename: string, content: string, mime: string): boolean {
  if (!guardExport()) return false;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return true;
}

/** העתקה ללוח (copyText של המקור) — עם נפילה ל-execCommand; מחזיר האם הועתק. */
export async function copyText(text: string): Promise<boolean> {
  if (!guardExport()) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* נפילה לשיטה הישנה */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/** קריאת קובץ שנבחר כטקסט (שחזור-גיבוי). */
export function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const rd = new FileReader();
    rd.onload = () => resolve(String(rd.result ?? ''));
    rd.onerror = () => reject(rd.error ?? new Error('read'));
    rd.readAsText(file);
  });
}
