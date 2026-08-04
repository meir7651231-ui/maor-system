/**
 * וואטסאפ (INTEGRATIONS גל א׳, הרחבת `whatsapp`) — בניית קישורי wa.me טהורים.
 * אפס API, אפס עלות-שוטפת: קישור click-to-chat רשמי של וואטסאפ שנפתח בדפדפן/
 * באפליקציה. הטלפונים במערכת שמורים בפורמט המקומי המעוצב (`0XX-XXXXXXX`,
 * ראה formatIsraeliPhone) — כאן ממירים לפורמט הבינלאומי ש-wa.me דורש.
 */

/**
 * ספרות-בינלאומי מטלפון שמור: '050-123-4567' → '972501234567'.
 * הוקשח בביקורת האדוורסרית (4.8.2026): ‏wa.me דוחה 0-מוביל ⇒ עדיף null
 * (אין כפתור) מקישור-שבור. מטפל גם ב-'+972 050…' (ה-0 המקומי נשמר בטעות),
 * ‏'00…' (קידומת חיוג בינ"ל), וישראלי-בלי-0 (כמו formatIsraeliPhone).
 */
export function waDigits(phone: string): string | null {
  let d = (phone || '').replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('00972')) d = '972' + d.slice(5);
  else if (d.startsWith('00')) d = d.slice(2); // קידומת חיוג בינ"ל כללית
  if (d.startsWith('9720')) d = '972' + d.slice(4); // ‎+972 שנשמר עם ה-0 המקומי
  if (!d.startsWith('972') && !d.startsWith('0') && (d.length === 8 || d.length === 9)) {
    d = '0' + d; // ישראלי בלי 0 מוביל — אותו דין כמו formatIsraeliPhone
  }
  if (d.startsWith('0')) {
    if (d.length === 9 || d.length === 10) d = '972' + d.slice(1);
    else return null; // 0-מוביל באורך אחר = לא-תקין ל-wa.me — עדיף בלי כפתור
  }
  if (d.length < 8 || d.length > 15) return null; // גבולות E.164
  return d;
}

/** קישור פתיחת-שיחה: https://wa.me/<digits>[?text=…]. בלי מספר תקין ⇒ null. */
export function waLink(phone: string, text = ''): string | null {
  const digits = waDigits(phone);
  if (!digits) return null;
  const t = text.trim();
  return 'https://wa.me/' + digits + (t ? '?text=' + encodeURIComponent(t) : '');
}
