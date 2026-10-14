/**
 * 🧱 מנוע קיר ההשפעה — נוצר אוטומטית ע״י המפרק — לא לערוך ידנית. להרצה מחדש: node scripts/atoms-decompose.mjs
 * מקור: src/components/wall · 5 חלקים · 0 מקומות · 0 פונקציות-גישה.
 */
import type { GenEngine } from '../../decompose/types';

export const GEN_WALL: GenEngine = {
  "id": "wall",
  "name": "מנוע קיר ההשפעה",
  "emoji": "🧱",
  "from": "src/components/wall",
  "computes": "מראה כמה גויס ולמה.",
  "entities": [],
  "parts": [
    {
      "num": 1,
      "name": "חלק בלי הסבר (fmtIls)",
      "computes": "‎₪12,345 — עברית עם מפרידי אלפים.",
      "fn": "wallData#fmtIls",
      "takes": [],
      "gives": null
    },
    {
      "num": 2,
      "name": "ספר הזהב",
      "computes": "ספר הזהב — top-3 לפי החודש, נפילה לשנה ואז לסה\"כ מצטבר.",
      "fn": "wallData#buildPodium",
      "takes": [],
      "gives": null
    },
    {
      "num": 3,
      "name": "7 הימים הבאים",
      "computes": "7 הימים הבאים — חגים, אירועים (כולל חזרה עברית) ומפגשי חוגים.",
      "fn": "wallData#buildWeek",
      "takes": [],
      "gives": null
    },
    {
      "num": 4,
      "name": "בני משפחה שיום הולדתם העברי חל היום",
      "computes": "בני משפחה שיום הולדתם העברי חל היום.",
      "fn": "wallData#birthdaysToday",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 5,
      "name": "בניית כל נתוני הקיר מה-Db",
      "computes": "בניית כל נתוני הקיר מה-Db — פונקציה טהורה (now ניתן להזרקה בבדיקות).",
      "fn": "wallData#buildWallData",
      "takes": [],
      "gives": null
    }
  ],
  "places": [],
  "fnPlaces": [],
  "unclassified": {
    "חלק בלי הערה בעברית — נשמר בשם הפונקציה": 1
  }
};
