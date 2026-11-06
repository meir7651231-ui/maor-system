"""נוסחי תזכורת — SMS ומייל. מנומסים, עובדתיים, מזהים את העסק, עם קישור תשלום והסרה.

אין בהם שום תוכן שיווקי (מבצע/הנחה/מוצר) — אחרת ההודעה עלולה להפוך ל"דבר פרסומת"
לפי סעיף 30א לחוק התקשורת ולדרוש הסכמה מראש. נאכף בבדיקות (`MARKETING_WORDS`).
"""
from __future__ import annotations

import re
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


# שדות: {biz} {name} {first} {num} {amount} {link} {unsub} {short} {stop}
# SMS: קישור קצר אחד על הדומיין שלנו ({short} ⇒ עמוד תשלום + הפסקת תזכורות) ⇒ ≤2 חלקי SMS.
# מייל: קישור התשלום הישיר + קישור הסרה (One-Click).
STEPS: tuple[Step, ...] = (
    Step("friendly",
         "{biz}: שלום {first}, חשבונית {num} ע\"ס {amount} טרם סומנה כשולמה. "
         "לתשלום: {short} {stop}",
         "תזכורת ידידותית: חשבונית {num} מ-{biz}",
         "שלום {name},\n\nזו תזכורת ידידותית שחשבונית {num} על סך {amount} טרם סומנה כשולמה.\n"
         "אפשר לשלם בקישור: {link}\n\nאם כבר שילמתם — תודה רבה, ואפשר להתעלם מהודעה זו.\n\n"
         "בברכה,\n{biz}"),
    Step("second",
         "{biz}: שלום {first}, חשבונית {num} ע\"ס {amount} פתוחה. "
         "לתשלום: {short}{ask} {stop}",
         "חשבונית {num} מ-{biz} עדיין פתוחה",
         "שלום {name},\n\nחשבונית {num} על סך {amount} עדיין פתוחה.\nלתשלום: {link}\n\n"
         "אם יש שאלה, או אם נוח לכם לפרוס את הסכום — פשוט השיבו למייל הזה.\n\nבברכה,\n{biz}"),
    Step("plan_offer",
         "{biz}: {first}, אפשר לפרוס את חשבונית {num} ({amount}) ללא תוספת. "
         "{plan_cta}: {short} {stop}",
         "אפשרות פריסה לחשבונית {num}",
         "שלום {name},\n\nרצינו לוודא שהכול בסדר לגבי חשבונית {num} ({amount}).\n"
         "אם נוח לכם, אפשר לפרוס את הסכום לכמה תשלומים ללא כל תוספת — השיבו \"פריסה\".\n"
         "לתשלום מלא: {link}\n\nבברכה,\n{biz}"),
    Step("final",
         "{biz}: {first}, תזכורת אוטומטית אחרונה לחשבונית {num} ({amount}). "
         "לתשלום: {short} {stop}",
         "תזכורת אחרונה: חשבונית {num} מ-{biz}",
         "שלום {name},\n\nזו התזכורת האוטומטית האחרונה לגבי חשבונית {num} ({amount}).\n"
         "בעל העסק ייצור איתכם קשר אישית בהמשך.\nלתשלום: {link}\n\nבברכה,\n{biz}"),
)


def fmt_amount(agorot: int, currency: str = "ILS") -> str:
    sym = {"ILS": "₪", "USD": "$", "EUR": "€"}.get(currency, currency + " ")
    whole, frac = divmod(agorot, 100)
    s = f"{whole:,}" + (f".{frac:02d}" if frac else "")
    return f"{s} {sym}" if sym == "₪" else f"{sym}{s}"


SMS_TARGET = 134          # 2 חלקי UCS-2 (67×2) — יעד עלות (team/market.md)
SMS_HARD_MAX = 201        # 3 חלקים — תקרה משפטית (team/legal.md §3.1 סעיף 6)
STOP_REPLY = "להסרה השיבו הסר"      # רק כשיש מספר שמקבל תשובות (2-way)
STOP_LINK = "להפסקה: בקישור"         # שם שולח אלפאנומרי — ההפסקה בעמוד הקישור
_ORG = re.compile(r"בע[\"״]?מ|חברת|עמותת|מרפאת|משרד|סטודיו|קבוצת|ltd|inc|llc", re.I)


def first_name(name: str) -> str:
    """שם פרטי לפנייה (legal §3.1). שם של ארגון ⇒ השם המלא. ריק ⇒ ''."""
    n = (name or "").strip()
    if not n:
        return ""
    return n if _ORG.search(n) else n.split()[0]


def fields(*, biz: str, name: str, num: str, amount_agorot: int, currency: str,
           link: str, unsub: str, short: str = "", two_way: bool = False) -> dict[str, str]:
    return {"biz": biz, "name": name or "לקוח/ה יקר/ה", "first": first_name(name) or "שלום",
            "num": num, "amount": fmt_amount(amount_agorot, currency),
            "link": link, "unsub": unsub, "short": short or link,
            "stop": STOP_REPLY if two_way else STOP_LINK,
            "ask": " שאלות? השיבו." if two_way else "",
            "plan_cta": "פריסה/תשלום"}   # העמוד מאפשר גם פריסה (גם בלי 2-way)


def render_sms(step: Step, f: dict[str, str]) -> str:
    out = step.sms.format(**f)
    # "שלום שלום," כשאין שם — מנקים
    return out.replace("שלום שלום,", "שלום,").replace(": שלום, ", ": שלום, ")


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
