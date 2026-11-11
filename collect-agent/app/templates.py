"""נוסחי תזכורת — SMS ומייל. מנומסים, עובדתיים, מזהים את העסק, עם קישור תשלום והסרה.

אין בהם שום תוכן שיווקי (מבצע/הנחה/מוצר) — אחרת ההודעה עלולה להפוך ל"דבר פרסומת"
לפי סעיף 30א לחוק התקשורת ולדרוש הסכמה מראש. נאכף בבדיקות (`MARKETING_WORDS`).
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from html import escape

from .security import clean_client_name, clean_doc_number, sanitize_field

MARKETING_WORDS = ("מבצע", "הנחה", "הטבה", "מתנה", "קופון", "חדש!", "הזדמנות", "במיוחד בשבילך")
THREAT_WORDS = ("הוצאה לפועל", "תביעה", "משטרה", "עונש", "עו\"ד", "עורך דין", "אחרונה!")

PRODUCT = "גבי"
SLOGAN = "גבי – תזכורות תשלום"
TAGLINE = "הכסף שלך חוזר. בלי שתצטרך לרדוף."   # לבעל העסק בלבד, לעולם לא בהודעה לחייב


@dataclass(frozen=True)
class Step:
    key: str
    sms: str
    subject: str
    email: str


# 3 שלבים בלבד (הכרעת מאיר): ידידותית +1 · פתוחה+פריסה +7 · אחרונה +14 ⇒ עצירה והתראה לבעל העסק.
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
    Step("plan_offer",
         "{biz}: {first}, חשבונית {num} ({amount}) פתוחה, אפשר בתשלומים. "
         "{plan_cta}: {short} {stop}",
         "חשבונית {num} מ-{biz} עדיין פתוחה",
         "שלום {name},\n\nחשבונית {num} על סך {amount} עדיין פתוחה.\n"
         "אם נוח לכם, אפשר לפרוס את הסכום לכמה תשלומים ללא כל תוספת — השיבו \"פריסה\".\n"
         "לתשלום מלא: {link}\n\nבברכה,\n{biz}"),
    Step("final",
         "{biz}: {first}, תזכורת אוטומטית אחרונה לחשבונית {num} ({amount}). "
         "לתשלום: {short} {stop}",
         "תזכורת אחרונה: חשבונית {num} מ-{biz}",
         "שלום {name},\n\nזו התזכורת האוטומטית האחרונה לגבי חשבונית {num} ({amount}).\n"
         "בעל העסק ייצור איתכם קשר אישית בהמשך.\nלתשלום: {link}\n\nבברכה,\n{biz}"),
)


@dataclass(frozen=True)
class MultiStep:
    """תזכורת מאוחדת ללקוח עם כמה חשבוניות פתוחות (critic 15.1/2.12, הכרעת מאיר 7.11.2026).
    שדות נוספים: {count} {nums} {lines}; {amount} = הסה״כ. ב-SMS: אם רשימת המספרים חורגת מ-2 חלקים
    (SMS_TARGET) ⇒ `sms_count` (כמה חשבוניות + סה״כ), והקישור הקצר מוביל לעמוד שמפרט את כולן."""
    key: str
    sms: str
    sms_count: str
    subject: str
    email: str


# אותו סולם (ידידותית ⇒ פריסה ⇒ אחרונה), אותו טון, אותם כללי ניסוח — בלשון רבים.
STEPS_MULTI: tuple[MultiStep, ...] = (
    MultiStep("friendly",
              "{biz}: שלום {first}, חשבוניות {nums} (סה\"כ {amount}) טרם סומנו כשולמו. "
              "לתשלום: {short} {stop}",
              "{biz}: שלום {first}, {count} חשבוניות (סה\"כ {amount}) טרם סומנו כשולמו. "
              "לתשלום: {short} {stop}",
              "תזכורת ידידותית: {count} חשבוניות מ-{biz}",
              "שלום {name},\n\nזו תזכורת ידידותית ש-{count} חשבוניות על סך כולל של {amount} טרם "
              "סומנו כשולמו:\n{lines}\nלפירוט ולתשלום: {link}\n\nאם כבר שילמתם — תודה רבה, ואפשר "
              "להתעלם מהודעה זו.\n\nבברכה,\n{biz}"),
    MultiStep("plan_offer",
              "{biz}: {first}, חשבוניות {nums} (סה\"כ {amount}) פתוחות, אפשר בתשלומים. "
              "{plan_cta}: {short} {stop}",
              "{biz}: {first}, {count} חשבוניות (סה\"כ {amount}) פתוחות, אפשר בתשלומים. "
              "{plan_cta}: {short} {stop}",
              "{count} חשבוניות מ-{biz} עדיין פתוחות",
              "שלום {name},\n\n{count} חשבוניות על סך כולל של {amount} עדיין פתוחות:\n{lines}\n"
              "אם נוח לכם, אפשר לפרוס את הסכום הכולל לכמה תשלומים ללא כל תוספת — השיבו \"פריסה\".\n"
              "לפירוט ולתשלום: {link}\n\nבברכה,\n{biz}"),
    MultiStep("final",
              "{biz}: {first}, תזכורת אוטומטית אחרונה לחשבוניות {nums} (סה\"כ {amount}). "
              "לתשלום: {short} {stop}",
              "{biz}: {first}, תזכורת אוטומטית אחרונה ל-{count} חשבוניות (סה\"כ {amount}). "
              "לתשלום: {short} {stop}",
              "תזכורת אחרונה: {count} חשבוניות מ-{biz}",
              "שלום {name},\n\nזו התזכורת האוטומטית האחרונה לגבי {count} חשבוניות על סך כולל של "
              "{amount}:\n{lines}\nבעל העסק ייצור איתכם קשר אישית בהמשך.\nלפירוט ולתשלום: {link}"
              "\n\nבברכה,\n{biz}"),
)
if [s.key for s in STEPS_MULTI] != ["friendly", "plan_offer", "final"]:  # לא assert: python -O מוחק
    raise RuntimeError("STEPS_MULTI: סדר השלבים השתנה")


def fmt_amount(agorot: int, currency: str = "ILS") -> str:
    sym = {"ILS": "₪", "USD": "$", "EUR": "€", "GBP": "£"}.get(currency, currency + " ")
    whole, frac = divmod(agorot, 100)
    s = f"{whole:,}" + (f".{frac:02d}" if frac else "")
    return f"{s} {sym}" if sym == "₪" else f"{sym}{s}"


SMS_TARGET = 134          # 2 חלקי UCS-2 (67×2) — יעד עלות (team/market.md)
SMS_HARD_MAX = 201        # 3 חלקים — תקרה משפטית (team/legal.md §3.1 סעיף 6)
STOP_REPLY = "להסרה השיבו הסר"      # רק כשיש מספר שמקבל תשובות (2-way)
STOP_LINK = "להפסקה: בקישור"         # שם שולח אלפאנומרי — ההפסקה בעמוד הקישור
_ORG = re.compile(r"בע[\"״]?מ|חברת|עמותת|מרפאת|משרד|סטודיו|קבוצת|ltd|inc|llc", re.I)


_TITLES = frozenset({"מר", "מרת", "גב'", "גב׳", "גברת", 'ד"ר', "ד״ר", "דר'", "דר׳", "הרב", "הרבנית",
                     'עו"ד', "עו״ד", 'רו"ח', "רו״ח", "פרופ'", "פרופ׳", "פרופסור",
                     "mr", "mr.", "mrs", "mrs.", "ms", "ms.", "dr", "dr.", "prof", "prof."})
FIRST_MAX = 20   # שם פרטי ארוך מזה ⇒ «שלום,» (אחרת SMS עובר ל-3 חלקים — הפעלה 115)


def first_name(name: str) -> str:
    """שם פרטי לפנייה (legal §3.1). שם של ארגון ⇒ השם המלא. ריק ⇒ ''.
    הפעלה 115: תואר מוביל ("מר דוד כהן") ⇒ «שלום דוד» ולא «שלום מר»; תואר + שם יחיד ⇒ שניהם
    ("מר כהן"); פיסוק נגרר ("Cohen,") מוסר; שם פרטי ארוך מ-FIRST_MAX ⇒ ''."""
    n = (name or "").strip()
    if not n:
        return ""
    if _ORG.search(n):
        return n
    parts = n.split()
    if parts[0].lower() in _TITLES and len(parts) >= 2:
        first = parts[1] if len(parts) >= 3 else f"{parts[0]} {parts[1]}"
    else:
        first = parts[0]
    first = first.strip(",;:.-")
    if first.lower() in _TITLES or len(first) > FIRST_MAX:
        return ""
    return first


def fields(*, biz: str, name: str, num: str, amount_agorot: int, currency: str,
           link: str, unsub: str, short: str = "", two_way: bool = False) -> dict[str, str]:
    # שם/מספר מגיעים מחשבונית ירוקה = קלט חיצוני. CR/LF ב-Subject היה מפיל את בניית
    # המייל (ValueError) ⇒ plan() כולו; RLO/שורות חדשות מאפשרים להסוות קישור ב-SMS.
    name = clean_client_name(name)
    return {"biz": sanitize_field(biz), "name": name or "לקוח/ה יקר/ה",
            "first": first_name(name) or "שלום",
            "num": sanitize_field(clean_doc_number(num), 30), "amount": fmt_amount(amount_agorot, currency),
            "link": link, "unsub": unsub, "short": short or link,
            "stop": STOP_REPLY if two_way else STOP_LINK,
            "ask": " שאלות? השיבו." if two_way else "",
            "plan_cta": "פריסה/תשלום"}   # העמוד מאפשר גם פריסה (גם בלי 2-way)


def fields_multi(*, biz: str, name: str, invoices: list[tuple[str, int]], currency: str,
                 link: str, unsub: str, short: str = "", two_way: bool = False) -> dict[str, str]:
    """invoices = [(מספר, סכום באגורות)] לפי מועד. {amount} = הסה״כ (מטבע אחד בלבד)."""
    nums = [sanitize_field(clean_doc_number(n), 30) for n, _ in invoices]
    joined = ", ".join(n for n in nums if n)    # הפעלה 116: מספר ריק לא משאיר ", ," ברשימה
    total = sum(a for _, a in invoices)
    f = fields(biz=biz, name=name, num=joined, amount_agorot=total, currency=currency,
               link=link, unsub=unsub, short=short, two_way=two_way)
    f["count"] = str(len(invoices))
    f["nums"] = f["num"] = joined
    f["lines"] = "\n".join(f"• חשבונית {n} — {fmt_amount(a, currency)}"
                           for n, (_, a) in zip(nums, invoices, strict=True))
    return f


_EMPTY_NUM_GAP = re.compile(r"(חשבוניו?ת) {2,}")


def _tidy(s: str) -> str:
    """הפעלה 116: מספר חשבונית ריק ⇒ «חשבונית  ע"ס» (רווח כפול) ⇒ «חשבונית ע"ס»."""
    return _EMPTY_NUM_GAP.sub(r"\1 ", s)


def render_sms(step: Step | MultiStep, f: dict[str, str]) -> str:
    out = _tidy(step.sms.format(**f))
    if isinstance(step, MultiStep) and len(out) > SMS_TARGET:
        out = _tidy(step.sms_count.format(**f))   # רשימה ארוכה ⇒ כמה + סה״כ; הפירוט בעמוד הקישור
    # "שלום שלום," כשאין שם — מנקים
    return out.replace("שלום שלום,", "שלום,").replace(": שלום, ", ": שלום, ")


def render_email(step: Step | MultiStep, f: dict[str, str]) -> tuple[str, str, str]:
    text = _tidy(step.email.format(**f)) + f"\n\nלהסרה מתזכורות: {f['unsub']}"
    esc = {k: escape(v) for k, v in f.items()}
    body_html = "<br>".join(escape(line) for line in _tidy(step.email.format(**f)).split("\n"))
    body_html = body_html.replace(escape(f["link"]),
                                  f'<a href="{esc["link"]}">{esc["link"]}</a>')
    html = (f'<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;'
            f'line-height:1.6;color:#1f2937">{body_html}'
            f'<p style="margin-top:24px"><a href="{esc["link"]}" style="background:#0f766e;'
            f'color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">לתשלום</a></p>'
            f'<p style="font-size:12px;color:#6b7280">הודעה אוטומטית מטעם {esc["biz"]}. '
            f'<a href="{esc["unsub"]}">להסרה מתזכורות</a></p></div>')
    return _tidy(step.subject.format(**f)), text, html


def template_version() -> str:
    """ר-12: טביעת הנוסחים (12 תווי sha256). כל שינוי בנוסח ⇒ גרסה חדשה ⇒ אישורים קודמים בטלים."""
    import hashlib
    import json

    src = json.dumps([s.__dict__ for s in STEPS] + [s.__dict__ for s in STEPS_MULTI],
                     ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(src.encode()).hexdigest()[:12]
