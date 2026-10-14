/**
 * 🏠 מנוע מסך הבית — נוצר אוטומטית ע״י המפרק — לא לערוך ידנית. להרצה מחדש: node scripts/atoms-decompose.mjs
 * מקור: src/components/home · 2 חלקים · 0 מקומות · 0 פונקציות-גישה.
 */
import type { GenEngine } from '../../decompose/types';

export const GEN_HOME: GenEngine = {
  "id": "home",
  "name": "מנוע מסך הבית",
  "emoji": "🏠",
  "from": "src/components/home",
  "computes": "אוסף מכל המערכת מה חשוב היום.",
  "entities": [],
  "parts": [
    {
      "num": 1,
      "name": "חלק בלי הסבר (morningBrief)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "morningBrief#morningBrief",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 2,
      "name": "נוסח-הקראה עברי",
      "computes": "נוסח-הקראה עברי (speechSynthesis) — משפט פר-מדור, בלי שמות (צנעה בקול רם).",
      "fn": "morningBrief#briefSpeechText",
      "takes": [],
      "gives": null
    }
  ],
  "places": [],
  "fnPlaces": [],
  "unclassified": {
    "חלק בלי הערה בעברית — נשמר בשם הפונקציה": 1,
    "קובץ לא טהור (ממשק/אחסון/דפדפן) — לא נקרא": 1
  }
};
