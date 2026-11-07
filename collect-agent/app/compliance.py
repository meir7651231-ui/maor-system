"""מסנן ניסוח לכל טקסט יוצא (דרישה ר-1 ב-team/legal.md, כללים §3.1).

טהור. מחזיר רשימת הפרות; רשימה ריקה = מותר לשלוח. זו **חסימה**, לא אזהרה:
הקוד שקורא לזה לא שולח טקסט עם הפרה (מנוע השיחה חוזר לנוסח קבוע / לבעל העסק).

מה נבדק:
  • רשימה שחורה משפטית ולחץ (§3.1 סעיף 4)
  • רשימה שחורה שיווקית (§3.1 סעיף 5) — אחרת ההודעה עלולה להיחשב "דבר פרסומת" (30א)
  • מותגים/בנקים/רשויות (critic 3.6.5) — אחרת הודעה "מטעם" בנק/ביט/רשות המסים = התחזות
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
# critic 3.6.5 (הכרעת מאיר 7.11.2026): שמות בנקים, אפליקציות תשלום ורשויות חסומים בניסוח — הודעת
# גבייה שמזכירה "בנק לאומי"/"ביט"/"רשות המסים" נראית כהודעה מטעמם (התחזות/פישינג).
# שמרני מול חיובי-שווא: נחסמים **צירופי בנק** ("בנק ירושלים", "בנק מזרחי") ולא מילים כלליות — "ירושלים"
# בכתובת, "מזרחי"/"פפר" כשם משפחה של לקוח, "לאומי" ב"ביטוח לאומי" ו"מביט"/"הביט" (פעלים) מותרים.
# שמות ייחודיים (מזרחי טפחות, אוצר החייל, פאג״י, מרכנתיל, וואן זירו, פייבוקס) נחסמים גם לבד.
# הוצאה לפועל / משטרה / בית משפט כבר חסומים ב-LEGAL_BLACKLIST (enforcement/police/court) — כאן משלימים
# "משטרת", "בית דין" ו"רשות המסים".
# **שם העסק עצמו** (המדויק, כפי שהוגדר) מותר גם אם מכיל מילה מהרשימה ("Pepper Grill", "ביט סטודיו") —
# הוא מוסר מהטקסט לפני הבדיקה הזו בלבד (לא לפני הרשימה המשפטית). אבל שם עסק שמכיל **צירוף מוסד**
# (בנק/רשות — `INSTITUTION`) נחסם כבר בהגדרות (`business_name_violations`), כי זו בדיוק ההתחזות
# שהמבקר הדגים ("בנק לאומי - מחלקת גבייה").
_HEB_BANKS = (r"ה?פועלים|לאומי|דיסקונט|מזרחי|טפחות|ה?בינלאומי|מרכנתיל|ירושלים|יהב|מסד|אוצר החייל|"
              r"פאג[\"״']?י|פועלי אגודת ישראל|ה?דואר|פפר|ישראל|וואן\s?זירו")
INSTITUTION: tuple[tuple[str, str], ...] = (
    ("brand_bank", r"(?<![\w])[מלבו]?ה?בנק\s+(?:" + _HEB_BANKS + r")(?![\w])"
                   r"|מזרחי[\s\-]+טפחות|אוצר החייל|פאג[\"״']י(?![\w])|פועלי אגודת ישראל|מרכנתיל"
                   r"|ה?בינלאומי הראשון|וואן\s?זירו|פפר\s+(?:בנק|פיי)"
                   r"|(?i:\b(?:bank\s+(?:hapoalim|leumi|discount|mizrahi|tefahot|jerusalem|yahav|massad|"
                   r"otsar|otzar|pagi|pepper|of\s+israel|of\s+jerusalem)|hapoalim|leumi|mizrahi[\s\-]?tefahot|"
                   r"discount\s+bank|mercantile\s+bank|first\s+international\s+bank|"
                   r"one\s?zero(?:\s+bank)?|pepper\s+bank)\b)"),
    ("brand_authority", r"רשות ה?מי?סים|משטרת|(?<![\w])בית ה?דין|לשכת ההוצאה לפועל"
                        r"|(?i:\b(?:police|tax\s+authority)\b)"),
)
PAYMENT_APPS: tuple[tuple[str, str], ...] = (
    # "ביט" כמילה (גם "בביט"/"לביט"/"וביט"), לא "ביטוח"/"מביט"/"הביט"
    ("brand_payapp", r"(?<![\w])[בלו]?ביט(?![\w])|פיי\s?בוקס|(?i:\bpay\s?box\b|\bbit\b|\bpepper\b)"),
)
BRANDS = INSTITUTION + PAYMENT_APPS
# שם שולח (Sender ID, לטיני עד 11 תווים): "BankLeumi"/"PayBox" = התחזות. ללא גבולות מילה (אין רווחים)
_SENDER_BRANDS = re.compile(r"bank|leumi|poalim|discount|mizrahi|tefahot|mercantile|otsar|otzar|"
                            r"yahav|massad|pagi|onezero|paybox|pepper|police|misim|^bit$|^bitpay", re.I)


def business_name_violations(name: str) -> list[str]:
    """שם העסק (בהגדרות): צירוף בנק/רשות ⇒ חסום (התחזות). אפליקציות תשלום בשם העסק — מותרות."""
    return [n for n, pat in INSTITUTION if re.search(pat, name or "")]


def sender_id_violations(sender: str) -> list[str]:
    return ["brand_sender"] if sender and _SENDER_BRANDS.search(sender) else []


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
    subject: str = ""                # במייל: שם העסק בנושא = "בתחילת ההודעה"
    own_name: str = ""               # שם העסק המדויק שמותר גם אם מכיל מותג (ברירת מחדל: business)


def sms_segments(text: str) -> int:
    n = len(text)
    return 1 if n <= 70 else -(-n // SMS_SEGMENT)


def violations(text: str, r: Rules) -> list[str]:
    out: list[str] = []
    # הרשימות השחורות נבדקות על הטקסט בלי הקישורים: קוד אקראי בקישור ("…/p/XKQZWbt") אינו
    # "צעקה" ו-"BDI" בתוך טוקן אינו אשראי. (באג שנתפס כבדיקה מהבהבת: 0.26% מהקודים נחסמו.)
    # הקישורים עצמם נבדקים בנפרד מול רשימת המותרים.
    prose = _URL.sub(" ", text)
    for name, pat in LEGAL_BLACKLIST:
        if re.search(pat, prose):
            out.append(name)
    own = r.own_name or r.business
    branded = prose.replace(own, " ") if own else prose
    for name, pat in BRANDS:
        if re.search(pat, branded):
            out.append(name)
    if not r.allow_debt_word and re.search(DEBT_WORD[1], prose):
        out.append(DEBT_WORD[0])
    for name, pat in MARKETING_BLACKLIST:
        if name == "discount" and r.allow_discount:
            continue
        if re.search(pat, prose):
            out.append(name)
    allowed = {u.rstrip(".,)") for u in (r.payment_link, r.unsubscribe_url) if u}
    for m in _URL.finditer(text):
        if m.group(0).rstrip(".,)") not in allowed:
            out.append("foreign_link")
            break
    in_subject = r.channel == "email" and r.business and r.business in r.subject
    if r.business and not in_subject and not text.lstrip().startswith(r.business):
        out.append("no_business_first")
    if r.channel == "sms" and len(text) > r.max_sms_chars:
        out.append("sms_too_long")
    return out
