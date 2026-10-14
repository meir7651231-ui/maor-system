/**
 * ☎️ מנוע הטלפון — נוצר אוטומטית ע״י המפרק — לא לערוך ידנית. להרצה מחדש: node scripts/atoms-decompose.mjs
 * מקור: src/components/telephony · 6 חלקים · 0 מקומות · 0 פונקציות-גישה.
 */
import type { GenEngine } from '../../decompose/types';

export const GEN_TELEPHONY: GenEngine = {
  "id": "telephony",
  "name": "מנוע הטלפון",
  "emoji": "☎️",
  "from": "src/components/telephony",
  "computes": "יודע מי התקשר, למה ומה ענו לו.",
  "entities": [],
  "parts": [
    {
      "num": 1,
      "name": "תצורת-ברירת-מחדל שמישה",
      "computes": "תצורת-ברירת-מחדל שמישה — קו-ראשי אחד, שעות 09:00–17:00 א׳–ה׳.",
      "fn": "lib#emptyTelephonyConfig",
      "takes": [],
      "gives": null
    },
    {
      "num": 2,
      "name": "slug תקין ל-tenantId",
      "computes": "slug תקין ל-tenantId (אותיות-קטנות/ספרות/מקף, 3–40) מתוך שם-הארגון/slug.",
      "fn": "lib#toTenantId",
      "takes": [],
      "gives": null
    },
    {
      "num": 3,
      "name": "ממיר תצורת-אשף ל-raw-tenant שהמנוע מקבל",
      "computes": "ממיר תצורת-אשף ל-raw-tenant שהמנוע מקבל.",
      "fn": "lib#telephonyToTenant",
      "takes": [],
      "gives": null
    },
    {
      "num": 4,
      "name": "תצוגה-מקדימה חיה",
      "computes": "תצוגה-מקדימה חיה: בונה tenant, מריץ סימולטור-שיחה על תרחישים מייצגים (בשעות/ אחרי-שעות/שבת), ומחשב דוח-אמון.",
      "fn": "lib#previewTelephony",
      "takes": [],
      "gives": null
    },
    {
      "num": 5,
      "name": "הסגירה ההלכתית הבאה",
      "computes": "הסגירה ההלכתית הבאה (שבת/יו״ט) בחלון 10 הימים הקרובים — לווידג'ט-הבית \"זמני שבת/חג\".",
      "fn": "lib#nextClosure",
      "takes": [
        "times"
      ],
      "gives": "span"
    },
    {
      "num": 6,
      "name": "מריץ תיאור-שיחה יחיד",
      "computes": "מריץ תיאור-שיחה יחיד (למשתמש שמנסה מספר/שעה ספציפיים).",
      "fn": "lib#explainOne",
      "takes": [],
      "gives": null
    }
  ],
  "places": [],
  "fnPlaces": [],
  "unclassified": {}
};
