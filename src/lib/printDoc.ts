/**
 * הדפסת מסמך-HTML מסודר דרך iframe נסתר — המשתמש בוחר "שמירה כ-PDF" או מדפסת.
 * אותו דפוס כמו printReceipt (lib/receipt), כללי לכל מסמך (שמות לתפילה, 13.10).
 * עובר בשער יציאת-המידע (core.export) — עובד/ת שהייצוא חסום לה לא מוציאה מסמך.
 */
import { guardExport } from './exportGate';

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
