/**
 * 💡 מנוע ההצעות — נוצר אוטומטית ע״י המפרק — לא לערוך ידנית. להרצה מחדש: node scripts/atoms-decompose.mjs
 * מקור: src/components/shop8 · 2 חלקים · 0 מקומות · 0 פונקציות-גישה.
 */
import type { GenEngine } from '../../decompose/types';

export const GEN_SHOP8: GenEngine = {
  "id": "shop8",
  "name": "מנוע ההצעות",
  "emoji": "💡",
  "from": "src/components/shop8",
  "computes": "מציע מראש מה משפחה תצטרך.",
  "entities": [],
  "parts": [
    {
      "num": 1,
      "name": "כל ההצעות",
      "computes": "כל ההצעות (לפני סינון ביטולים).",
      "fn": "lib#suggestions",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 2,
      "name": "ההצעות החיות",
      "computes": "ההצעות החיות — בלי אלה שסומנו \"טופל\" (attnDone).",
      "fn": "lib#liveSuggestions",
      "takes": [
        "times"
      ],
      "gives": null
    }
  ],
  "places": [],
  "fnPlaces": [],
  "unclassified": {}
};
