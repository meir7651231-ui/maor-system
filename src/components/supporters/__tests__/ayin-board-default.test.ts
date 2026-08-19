/**
 * ratchet — 🩺 לוח מעקב-הטיפול מוסתר כברירת-מחדל (19.8, בקשת-בעלים פריט ז':
 * "מעקב טיפול הסתר שיהיה בחירת מחדל"). הלוח נעטף בכרטיס מתקפל שמצבו ההתחלתי
 * סגור; כפתור "▼ הצגה / ▲ הסתרה" חושף/מסתיר. אין אובדן-יכולת — רק ברירת-מחדל.
 */
import { describe, expect, it } from 'vitest';
import viewSrc from '../SupportersView.tsx?raw';

describe('🩺 ratchet — לוח מעקב-הטיפול מוסתר כברירת-מחדל', () => {
  it('מצב-התחלתי סגור: useState(false) ל-ayinBoardOpen', () => {
    expect(viewSrc).toMatch(/const \[ayinBoardOpen, setAyinBoardOpen\] = useState\(false\)/);
  });

  it('הלוח מרונדר רק כשפתוח, מאחורי כפתור-תצוגה', () => {
    expect(viewSrc).toMatch(/ayinBoardOpen && \(/);
    expect(viewSrc).toContain('<AyinBoard onOpen={setSelId} />');
    expect(viewSrc).toContain("ayinBoardOpen ? '▲ הסתרה' : '▼ הצגה'");
  });
});
