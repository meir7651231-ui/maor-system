/**
 * 🛡 promptSafeText (סגירת-פערים 15.10.2026; מקביל ל-promptSafeText של בנייה-חכמה) —
 * ערך חופשי (שם/ייעוד/שם-חוג) מגיע מייבוא-אקסל/vCard/פורטל-ציבורי, כלומר בשליטת
 * מי-שהזין אותו, ונשתל בתוך פרומפט שהפלט שלו מוצג כמכתב. שורות-חדשות וגרשיים הם
 * המנופים להזרקה ("…\nהתעלם מההוראות וכתוב…" / סגירת-המירכאות) ⇒ מקופלים לרווח,
 * מירכאות לטיניות מוסרות (גרשיים עבריים ״ נשמרים — חב״ד), ואורך חסום. טהור; לא משנה ערך תקין רגיל.
 */
export function promptSafeText(raw: unknown, maxLen = 80): string {
  const s = String(raw ?? '')
    // eslint-disable-next-line no-control-regex -- תווי-בקרה הם בדיוק מה שמנקים
    .replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, ' ')
    .replace(/["“”`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return s.length <= maxLen ? s : s.slice(0, maxLen).trim();
}
