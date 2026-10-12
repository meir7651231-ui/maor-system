/**
 * 📒 פרנסה׳לע — יציאת מסמך HTML מלא (החוברת) — הדפסה דרך iframe נסתר / הורדת קובץ (אשכול 8).
 * אותו דפוס כמו הדפסת-המסמך של הקבלה (iframe נסתר + srcdoc) ו-downloadTextFile (builder/handoff), בלי
 * לייבא אותם (בידוד: המודול לא נוגע בעולם-הקבלות). **כל נתיב עובר קודם את שער יציאת-המידע (guardExport — core.export
 * כבוי בכרטיס-העובד ⇒ אין הדפסה ואין הורדה)**. מחזיר האם המסמך יצא בפועל — הקורא רושם ליומן-הגישה
 * רק אז.
 */
import { guardExport } from '../../lib/exportGate';

/** הדפסה מבודדת (רק המסמך, לא כל העמוד): iframe נסתר עם srcdoc ⇒ חלון-ההדפסה ("שמירה כ-PDF"). */
export function printHtmlDoc(html: string): boolean {
  if (!guardExport()) return false; // 🔐 שער יציאת-מידע
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
      // הסרה מושהית — חלון-ההדפסה מחזיק את המסמך; הסרה מיידית מרוקנת אותו
      setTimeout(() => frame.remove(), 60_000);
    }
  };
  document.body.appendChild(frame);
  return true;
}

/** הורדת המסמך כקובץ ‎.html (נפתח בכל דפדפן ⇒ Ctrl+P / שמירה כ-PDF לבית-הדפוס). */
export function downloadHtmlDoc(filename: string, html: string): boolean {
  if (!guardExport()) return false; // 🔐 שער יציאת-מידע
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return true;
}
