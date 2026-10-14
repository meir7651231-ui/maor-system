/**
 * 💵 מנוע הקופה הרושמת — נוצר אוטומטית ע״י המפרק — לא לערוך ידנית. להרצה מחדש: node scripts/atoms-decompose.mjs
 * מקור: src/components/timer · 9 חלקים · 0 מקומות · 0 פונקציות-גישה.
 */
import type { GenEngine } from '../../decompose/types';

export const GEN_TIMER: GenEngine = {
  "id": "timer",
  "name": "מנוע הקופה הרושמת",
  "emoji": "💵",
  "from": "src/components/timer",
  "computes": "סופר כסף במשמרת ומוציא אישורים.",
  "entities": [],
  "parts": [
    {
      "num": 1,
      "name": "פירוט-עודף חמדני",
      "computes": "פירוט-עודף חמדני: כמה מכל שטר/מטבע להחזיר עבור סכום.",
      "fn": "cashLib#changeBreakdown",
      "takes": [
        "amount"
      ],
      "gives": null
    },
    {
      "num": 2,
      "name": "צבע-רקע לזיהוי-מהיר של הערך",
      "computes": "צבע-רקע לזיהוי-מהיר של הערך — מקורב לצבעי המטבע הישראלי (שטר ₪20 אדום, ₪50 ירוק, ₪100 כתום, ₪200 כחול; מטבעות בכסוף/זהב).",
      "fn": "cashLib#denomTint",
      "takes": [],
      "gives": null
    },
    {
      "num": 3,
      "name": "תווית ערך",
      "computes": "תווית ערך: '₪20' לשטרות/מטבעות שלמים, '₪0.5' לאגורות.",
      "fn": "cashLib#denomLabel",
      "takes": [],
      "gives": null
    },
    {
      "num": 4,
      "name": "סך-כספי של ספירת-מטבעות",
      "computes": "סך-כספי של ספירת-מטבעות (denom×count), מעוגל-אגורה.",
      "fn": "cashLib#countsTotal",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 5,
      "name": "צפי-המגירה בסגירה = קופת-פתיחה + סך-הגבייה במשמרת",
      "computes": "צפי-המגירה בסגירה = קופת-פתיחה + סך-הגבייה במשמרת (מעוגל-אגורה).",
      "fn": "cashLib#expectedDrawer",
      "takes": [],
      "gives": null
    },
    {
      "num": 6,
      "name": "הפרש-סגירה = נספר בפועל − צפוי",
      "computes": "הפרש-סגירה = נספר בפועל − צפוי.",
      "fn": "cashLib#drawerDiff",
      "takes": [],
      "gives": null
    },
    {
      "num": 7,
      "name": "מקורות-ההצעה לעגלת-הקופה",
      "computes": "מקורות-ההצעה לעגלת-הקופה — חוגים (שם+מחיר).",
      "fn": "cashLib#cashSuggestions",
      "takes": [],
      "gives": null
    },
    {
      "num": 8,
      "name": "סינון-חכם רב-מילתי",
      "computes": "סינון-חכם רב-מילתי (כל מילה נכללת בשם, בלי תלות-סדר).",
      "fn": "cashLib#filterCashSuggest",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 9,
      "name": "מקורות-ההצעה למשלם",
      "computes": "מקורות-ההצעה למשלם — לכל משפחה: שם-המשפחה (hint 'משפחה') ואז כל בן-משפחה (ילד/הורה, בשם-פרטי + שם-משפחה); בסוף התורמים (hint 'תורם').",
      "fn": "cashLib#payerSuggestions",
      "takes": [],
      "gives": null
    }
  ],
  "places": [],
  "fnPlaces": [],
  "unclassified": {}
};
