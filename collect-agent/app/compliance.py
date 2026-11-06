"""מסנן ניסוח לכל טקסט יוצא (דרישה ר-1 ב-team/legal.md, כללים §3.1).

טהור. מחזיר רשימת הפרות; רשימה ריקה = מותר לשלוח. זו **חסימה**, לא אזהרה:
הקוד שקורא לזה לא שולח טקסט עם הפרה (מנוע השיחה חוזר לנוסח קבוע / לבעל העסק).

מה נבדק:
  • רשימה שחורה משפטית ולחץ (§3.1 סעיף 4)
  • רשימה שחורה שיווקית (§3.1 סעיף 5) — אחרת ההודעה עלולה להיחשב "דבר פרסומת" (30א)
  • קישורים: רק קישור התשלום של העסק או קישור ההסרה
  • זיהוי: שם העסק בתחילת ההודעה (§3.1 סעיף 1)
  • אורך SMS (UCS-2, 67 תווים למקטע)
"""
from __future__ import annotations

import re
from dataclasses import dataclass

LEGAL_BLACKLIST: tuple[tuple[str, str], ...] = (
    ("enforcement", r"הוצאה לפועל|הוצל\"?פ"),
    ("lawyer", r"עו[\"״']ד|עוה[\"״']ד|עורכ\w* ה?דין|משרד עורכי"),   # "עוד" ≠ עו"ד
    ("court", r"תביע|בית ה?משפט|הליכים משפטיים|צעדים משפטיים|הליך משפטי"),
    ("warning_letter", r"התראה לפני נקיטת|מכתב דרישה"),
    ("seizure", r"עיקול"),
    ("police", r"משטרה"),
    ("credit", r"רשימה שחורה|BDI|דירוג אשראי|נתוני אשראי"),
    ("third_party", r"מעסיק|מקום העבודה|ה?משפחה שלך|לבני המשפחה"),
    ("shaming", r"נפרסם|פרסום (?:שמ|ה?חוב)"),
    ("fees", r"ריבית|דמי פיגורים|דמי טיפול|קנס"),
    ("threat", r"אחרת ני?אלץ|נאלץ ל|לא תהיה (?:לנו )?ברירה"),
    ("judgmental", r"(?<![\w])חייב(?:ת|ים)?(?![\w])|בפיגור|התעלמת|לא שילמת"),
    ("pressure", r"!!|דחוף|מיידי|מייד(?![\w])|ללא דיחוי|\b[A-Z]{4,}\b"),
)
DEBT_WORD = ("debt_word", r"(?<![\w])(?:ה|ו|ב|ל)?חוב(?:ות)?(?![\w])")
MARKETING_BLACKLIST: tuple[tuple[str, str], ...] = (
    ("marketing", r"מבצע|קופון|הצטרפו|הירשמו|הרשמו|נשלח באמצעות|מוצר חדש|שירות חדש|(?<![\w])חדש(?![\w])"),
    ("discount", r"הנחה|מחילה|נוותר|לוותר על|נמחק את|פטור מ"),
)
_URL = re.compile(r"https?://\S+|www\.\S+", re.IGNORECASE)
SMS_SEGMENT = 67
SMS_TEMPLATE_MAX = 201      # תזכורות יזומות (§3.1 סעיף 6)
SMS_REPLY_MAX = 268         # תשובות בשיחה — עד 4 מקטעים


@dataclass(frozen=True)
class Rules:
    business: str
    payment_link: str = ""
    unsubscribe_url: str = ""
    channel: str = "sms"
    allow_debt_word: bool = True     # False בתזכורת 1–2 (§3.1 סעיף 4)
    allow_discount: bool = False     # רק הנחה שבעל העסק אישר על החשבונית עצמה
    max_sms_chars: int = SMS_REPLY_MAX


def sms_segments(text: str) -> int:
    n = len(text)
    return 1 if n <= 70 else -(-n // SMS_SEGMENT)


def violations(text: str, r: Rules) -> list[str]:
    out: list[str] = []
    for name, pat in LEGAL_BLACKLIST:
        if re.search(pat, text):
            out.append(name)
    if not r.allow_debt_word and re.search(DEBT_WORD[1], text):
        out.append(DEBT_WORD[0])
    for name, pat in MARKETING_BLACKLIST:
        if name == "discount" and r.allow_discount:
            continue
        if re.search(pat, text):
            out.append(name)
    allowed = {u.rstrip(".,)") for u in (r.payment_link, r.unsubscribe_url) if u}
    for m in _URL.finditer(text):
        if m.group(0).rstrip(".,)") not in allowed:
            out.append("foreign_link")
            break
    if r.business and not text.lstrip().startswith(r.business):
        out.append("no_business_first")
    if r.channel == "sms" and len(text) > r.max_sms_chars:
        out.append("sms_too_long")
    return out
