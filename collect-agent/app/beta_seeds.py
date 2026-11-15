"""ערכת בטא: נתוני דמו לכל ענף בבטא (מספרה, מוסך, קליניקה, לקוח רו״ח).

הכרעת מאיר 6.11: בטא של 10 עסקים (3 מספרות · 2 מוסכים · 2 קליניקות · 3 לקוחות רו״ח). כאן יש
לכל ענף «ספר חשבוניות» בדוי שמדמה את המקרים שהעסק הזה באמת יראה ביום הראשון. אותם נתונים
משמשים את gi_mock (`--seed barber|garage|clinic|cpa`), את tests/test_beta_kit.py ואת
web/e2e/beta.mjs (צילום לכל ענף). כל השמות, הטלפונים והמיילים בדויים (example.com ·
050-000xxxx). אין כאן אדם אמיתי ואין כאן פרטי קשר שנאספו.

בכל ענף יש גם מקרי קצה שמכירות צריכות לדעת להסביר: חשבונית שעוד לא הגיע מועדה (אין תזכורת),
לקוח בלי פרטי קשר (no_contact), טלפון קווי (מייל בלבד), ובקליניקה: תיאור טיפול במסמך, שאסור
שיופיע באף הודעה ללקוח (פרטיות).
"""
from __future__ import annotations

# שעון ההדגמה: ראשון 8.11.2026 (app/demo.py DEMO_NOW). מועדים לפני ⇒ באיחור; אחרי ⇒ טרם הגיע.
NOT_DUE = "2026-12-15"


def _d(v: str, i: int, name: str, phone: str, email: str, amount: str, due: str, *,
       client: str = "", desc: str = "", currency: str = "ILS", issued: str = "2026-09-20") -> dict:
    return {"id": f"{v}{i}", "number": str(3000 + i), "type": 305, "status": 0,
            "amount": amount, "currency": currency, "documentDate": issued, "dueDate": due,
            "description": desc,
            "client": {"id": client or f"{v}cl{i}", "name": name, "phone": phone,
                       "emails": [email] if email else []}}


BETA_VERTICALS: dict[str, dict] = {
    "barber": {
        "label": "מספרה", "business": "מספרת הדמו",
        "docs": lambda: [
            _d("barber", 1, "אבי לקוח קבוע (דמו)", "050-0000101", "", "120.00", "2026-10-31",
               client="barbercl1", desc="תספורת + זקן, חודש אוקטובר"),
            _d("barber", 2, "אבי לקוח קבוע (דמו)", "050-0000101", "", "120.00", "2026-11-05",
               client="barbercl1", desc="תספורת"),
            _d("barber", 3, "נועה כלה (דמו)", "052-0000102", "noa@example.com", "1800.00",
               "2026-10-20", desc="יתרה: איפור ושיער לחתונה"),
            _d("barber", 4, "מלון הדמו בע״מ", "03-0000103", "billing@example.com", "2400.00",
               "2026-10-25", desc="שירותי עיצוב שיער לאירוע"),          # קווי ⇒ מייל
            _d("barber", 5, "לקוח בלי פרטים (דמו)", "", "", "90.00", "2026-10-15"),  # no_contact
            _d("barber", 6, "שירה מנוי (דמו)", "054-0000106", "shira@example.com", "350.00",
               NOT_DUE, desc="כרטיסייה"),                               # טרם הגיע ⇒ אין תזכורת
        ],
    },
    "garage": {
        "label": "מוסך", "business": "מוסך הדמו",
        "docs": lambda: [
            _d("garage", 1, "משה נהג (דמו)", "050-0000201", "moshe@example.com", "1450.00",
               "2026-10-28", desc="טיפול 30,000 + רפידות"),
            _d("garage", 2, "צי רכב הדמו בע״מ", "03-0000202", "fleet@example.com", "8900.00",
               "2026-10-15", client="garagecl2", desc="טיפולים לשלושה רכבים"),
            _d("garage", 3, "צי רכב הדמו בע״מ", "03-0000202", "fleet@example.com", "3200.00",
               NOT_DUE, client="garagecl2", desc="שוטף+60"),          # טרם הגיע
            _d("garage", 4, "רינה (דמו)", "053-0000204", "", "680.00", "2026-11-01",
               desc="תיקון פנצ׳ר וטסט"),
            _d("garage", 5, "לקוח בלי פרטים (דמו)", "", "", "250.00", "2026-10-10"),
        ],
    },
    "clinic": {
        "label": "קליניקה", "business": "קליניקת הדמו",
        "docs": lambda: [
            _d("clinic", 1, "הורי איתי (דמו)", "050-0000301", "parents@example.com", "1200.00",
               "2026-10-30", desc="4 טיפולי ריפוי בעיסוק — אבחון קשב"),
            _d("clinic", 2, "דנה מטופלת (דמו)", "052-0000302", "dana.c@example.com", "450.00",
               "2026-11-02", desc="פגישת טיפול רגשי"),
            _d("clinic", 3, "הורי מאיה (דמו)", "054-0000303", "", "900.00", "2026-10-20",
               desc="3 טיפולי קלינאות תקשורת — גמגום"),
            _d("clinic", 4, "לקוח בלי פרטים (דמו)", "", "", "300.00", "2026-10-12",
               desc="טיפול"),
            _d("clinic", 5, "הורי נועם (דמו)", "050-0000305", "noam@example.com", "1600.00",
               NOT_DUE, desc="סדרת טיפולים נובמבר"),
        ],
    },
    "cpa": {
        "label": "לקוח רו״ח", "business": "סטודיו הייעוץ דמו",
        "docs": lambda: [
            _d("cpa", 1, "חברת לקוח דמו בע״מ", "03-0000401", "ap@example.com", "12000.00",
               "2026-10-05", client="cpacl1", desc="ריטיינר ספטמבר"),  # B2B, קווי ⇒ מייל
            _d("cpa", 2, "עמית עצמאי (דמו)", "050-0000402", "amit@example.com", "3500.00",
               "2026-10-25", desc="אפיון ושלב א׳"),
            _d("cpa", 3, "Client Abroad (דמו)", "", "abroad.c@example.com", "800.00",
               "2026-10-18", currency="USD", desc="consulting"),       # דולר ⇒ בנפרד
            _d("cpa", 4, "חברת לקוח דמו בע״מ", "03-0000401", "ap@example.com", "12000.00",
               NOT_DUE, client="cpacl1", desc="ריטיינר נובמבר"),
            _d("cpa", 5, "לקוח בלי פרטים (דמו)", "", "", "1500.00", "2026-10-01"),
        ],
    },
}


def beta_docs(vertical: str) -> list[dict]:
    return BETA_VERTICALS[vertical]["docs"]()


def beta_business(vertical: str) -> str:
    return BETA_VERTICALS[vertical]["business"]
