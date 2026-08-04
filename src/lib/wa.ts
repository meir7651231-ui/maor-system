/**
 * וואטסאפ (INTEGRATIONS גל א׳, הרחבת `whatsapp`) — בניית קישורי wa.me טהורים.
 * אפס API, אפס עלות-שוטפת: קישור click-to-chat רשמי של וואטסאפ שנפתח בדפדפן/
 * באפליקציה. הטלפונים במערכת שמורים בפורמט המקומי המעוצב (`0XX-XXXXXXX`,
 * ראה formatIsraeliPhone) — כאן ממירים לפורמט הבינלאומי ש-wa.me דורש.
 */

/**
 * ספרות-בינלאומי מטלפון שמור: '050-123-4567' → '972501234567'.
 * ‏00972/‏+972/‏972 מנורמלים; 0 מוביל (9–10 ספרות) → 972; מספר בינלאומי אחר
 * נשאר כמות-שהוא; ריק/קצר-מדי (<8 ספרות) ⇒ null (אין קישור).
 */
export function waDigits(phone: string): string | null {
  const d = (phone || '').replace(/\D/g, '');
  if (!d) return null;
  let out = d;
  if (out.startsWith('00972')) out = '972' + out.slice(5);
  if (out.startsWith('0') && (out.length === 9 || out.length === 10)) {
    out = '972' + out.slice(1);
  }
  if (out.length < 8) return null;
  return out;
}

/** קישור פתיחת-שיחה: https://wa.me/<digits>[?text=…]. בלי מספר תקין ⇒ null. */
export function waLink(phone: string, text = ''): string | null {
  const digits = waDigits(phone);
  if (!digits) return null;
  const t = text.trim();
  return 'https://wa.me/' + digits + (t ? '?text=' + encodeURIComponent(t) : '');
}
