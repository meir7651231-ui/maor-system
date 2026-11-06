"""נוסחי תזכורת. מנומסים, בלי איום, בלי שיווק (שיווק ⇒ "דבר פרסומת" + קטגוריית Marketing).

כל נוסח ממופה לתבנית WhatsApp (Utility) שתוגש לאישור Meta בשלב 2.
הפרמטרים ממוספרים כמו בתבניות WhatsApp: {{1}}, {{2}} ...
"""
from __future__ import annotations

from dataclasses import dataclass

OPT_OUT_LINE = "להפסקת תזכורות השיבו \"הסר\"."


@dataclass(frozen=True)
class Template:
    key: str
    wa_name: str
    body: str  # עם {{n}}


STEPS: tuple[Template, ...] = (
    Template("friendly", "payment_reminder_friendly",
             "שלום {{1}}, תזכורת ידידותית מ-{{2}}: חשבונית {{3}} על סך {{4}} "
             "טרם סומנה כשולמה. לתשלום: {{5}}. אם כבר שילמתם — תודה, ואפשר להתעלם. "
             + OPT_OUT_LINE),
    Template("second", "payment_reminder_second",
             "שלום {{1}}, חשבונית {{3}} מ-{{2}} על סך {{4}} עדיין פתוחה. "
             "אפשר לשלם כאן: {{5}}, או להשיב להודעה הזו אם יש שאלה או צורך בפריסה. "
             + OPT_OUT_LINE),
    Template("plan_offer", "payment_reminder_plan",
             "שלום {{1}}, רצינו לוודא שהכול בסדר לגבי חשבונית {{3}} ({{4}}). "
             "אם נוח לכם, {{2}} יכולים לפרוס את הסכום לכמה תשלומים ללא תוספת. "
             "השיבו \"פריסה\" ונציע הסדר. " + OPT_OUT_LINE),
    Template("final", "payment_reminder_final",
             "שלום {{1}}, זו תזכורת אחרונה בהודעה אוטומטית לגבי חשבונית {{3}} ({{4}}). "
             "בעל העסק {{2}} ייצור איתכם קשר אישית. לתשלום: {{5}}. " + OPT_OUT_LINE),
)


def fmt_amount(agorot: int, currency: str = "ILS") -> str:
    sym = {"ILS": "₪", "USD": "$", "EUR": "€"}.get(currency, currency + " ")
    whole, frac = divmod(agorot, 100)
    s = f"{whole:,}" + (f".{frac:02d}" if frac else "")
    return f"{s} {sym}" if sym == "₪" else f"{sym}{s}"


def params_for(*, client_name: str, business: str, number: str,
               amount_agorot: int, currency: str, payment_link: str) -> list[str]:
    return [client_name or "לקוח/ה יקר/ה", business, number,
            fmt_amount(amount_agorot, currency), payment_link or "פרטי תשלום יישלחו בהמשך"]


def render(t: Template, params: list[str]) -> str:
    out = t.body
    for i, p in enumerate(params, start=1):
        out = out.replace("{{%d}}" % i, p)
    return out
