"""נוסחי תזכורת — SMS ומייל. מנומסים, עובדתיים, מזהים את העסק, עם קישור תשלום והסרה.

אין בהם שום תוכן שיווקי (מבצע/הנחה/מוצר) — אחרת ההודעה עלולה להפוך ל"דבר פרסומת"
לפי סעיף 30א לחוק התקשורת ולדרוש הסכמה מראש. נאכף בבדיקות (`MARKETING_WORDS`).
"""
from __future__ import annotations

from dataclasses import dataclass
from html import escape

MARKETING_WORDS = ("מבצע", "הנחה", "הטבה", "מתנה", "קופון", "חדש!", "הזדמנות", "במיוחד בשבילך")
THREAT_WORDS = ("הוצאה לפועל", "תביעה", "משטרה", "עונש", "עו\"ד", "עורך דין", "אחרונה!")

SLOGAN = "גבי – העוזר לגביית חובות"


@dataclass(frozen=True)
class Step:
    key: str
    sms: str
    subject: str
    email: str


# שדות: {biz} {name} {num} {amount} {link} {unsub}
STEPS: tuple[Step, ...] = (
    Step("friendly",
         "{biz}: שלום {name}, תזכורת ידידותית - חשבונית {num} על {amount} טרם שולמה. "
         "לתשלום: {link} להסרה: {unsub}",
         "תזכורת ידידותית: חשבונית {num} מ-{biz}",
         "שלום {name},\n\nזו תזכורת ידידותית שחשבונית {num} על סך {amount} טרם סומנה כשולמה.\n"
         "אפשר לשלם בקישור: {link}\n\nאם כבר שילמתם — תודה רבה, ואפשר להתעלם מהודעה זו.\n\n"
         "בברכה,\n{biz}"),
    Step("second",
         "{biz}: שלום {name}, חשבונית {num} על {amount} עדיין פתוחה. לתשלום: {link} "
         "לשאלות השיבו להודעה. להסרה: {unsub}",
         "חשבונית {num} מ-{biz} עדיין פתוחה",
         "שלום {name},\n\nחשבונית {num} על סך {amount} עדיין פתוחה.\nלתשלום: {link}\n\n"
         "אם יש שאלה, או אם נוח לכם לפרוס את הסכום — פשוט השיבו למייל הזה.\n\nבברכה,\n{biz}"),
    Step("plan_offer",
         "{biz}: שלום {name}, אפשר לפרוס את חשבונית {num} ({amount}) לתשלומים ללא תוספת - "
         "השיבו פריסה. לתשלום: {link} להסרה: {unsub}",
         "אפשרות פריסה לחשבונית {num}",
         "שלום {name},\n\nרצינו לוודא שהכול בסדר לגבי חשבונית {num} ({amount}).\n"
         "אם נוח לכם, אפשר לפרוס את הסכום לכמה תשלומים ללא כל תוספת — השיבו \"פריסה\".\n"
         "לתשלום מלא: {link}\n\nבברכה,\n{biz}"),
    Step("final",
         "{biz}: שלום {name}, תזכורת אוטומטית אחרונה לחשבונית {num} ({amount}). "
         "נחזור אליכם אישית. לתשלום: {link} להסרה: {unsub}",
         "תזכורת אחרונה: חשבונית {num} מ-{biz}",
         "שלום {name},\n\nזו התזכורת האוטומטית האחרונה לגבי חשבונית {num} ({amount}).\n"
         "בעל העסק ייצור איתכם קשר אישית בהמשך.\nלתשלום: {link}\n\nבברכה,\n{biz}"),
)


def fmt_amount(agorot: int, currency: str = "ILS") -> str:
    sym = {"ILS": "₪", "USD": "$", "EUR": "€"}.get(currency, currency + " ")
    whole, frac = divmod(agorot, 100)
    s = f"{whole:,}" + (f".{frac:02d}" if frac else "")
    return f"{s} {sym}" if sym == "₪" else f"{sym}{s}"


def fields(*, biz: str, name: str, num: str, amount_agorot: int, currency: str,
           link: str, unsub: str) -> dict[str, str]:
    return {"biz": biz, "name": name or "לקוח/ה יקר/ה",
            "num": num, "amount": fmt_amount(amount_agorot, currency),
            "link": link, "unsub": unsub}


def render_sms(step: Step, f: dict[str, str]) -> str:
    return step.sms.format(**f)


def render_email(step: Step, f: dict[str, str]) -> tuple[str, str, str]:
    text = step.email.format(**f) + f"\n\nלהסרה מתזכורות: {f['unsub']}"
    esc = {k: escape(v) for k, v in f.items()}
    body_html = "<br>".join(escape(line) for line in step.email.format(**f).split("\n"))
    body_html = body_html.replace(escape(f["link"]),
                                  f'<a href="{esc["link"]}">{esc["link"]}</a>')
    html = (f'<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;'
            f'line-height:1.6;color:#1f2937">{body_html}'
            f'<p style="margin-top:24px"><a href="{esc["link"]}" style="background:#0f766e;'
            f'color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">לתשלום</a></p>'
            f'<p style="font-size:12px;color:#6b7280">הודעה אוטומטית מטעם {esc["biz"]}. '
            f'<a href="{esc["unsub"]}">להסרה מתזכורות</a></p></div>')
    return step.subject.format(**f), text, html
