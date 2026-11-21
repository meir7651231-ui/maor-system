"""ייבוא חשבוניות פתוחות מ-CSV — חלופה ל-API (הכרעת מאיר 6.11: «API תחילה ו-CSV חלופה»).

טהור (בלי DB). מקבל ייצוא של morning/Excel בעברית או באנגלית. כל שורה נבדקת לבד; שורה פסולה
לא מפילה את הקובץ אלא מוחזרת כשגיאה עם מספר השורה. חשבונית מ-CSV מסומנת source='csv'
⇒ ר-4: אין לה רענון API, ולכן היא תקפה לשליחה רק 24 שעות מהייבוא (service._refresh_before_send).
"""
from __future__ import annotations

import csv
import io
import re
from dataclasses import dataclass, field
from datetime import date, timedelta

from .contact import clean_email, normalize_il_phone
from .greeninvoice import DEFAULT_TERMS_DAYS, MAX_TERMS_DAYS, Invoice, issued_in_far_future
from .integrations.base import parse_amount_agorot, parse_currency
from .security import DOC_NUMBER_MAX, clean_doc_number

MAX_BYTES = 2_000_000
MAX_ROWS = 5_000

COLUMNS: dict[str, tuple[str, ...]] = {
    "number": ("מספר מסמך", "מספר חשבונית", "מס' מסמך", "number", "invoice", "invoice number"),
    "client": ("שם לקוח", "לקוח", "client", "customer", "name"),
    "phone": ("טלפון", "נייד", "phone", "mobile"),
    "email": ("מייל", "אימייל", "דוא\"ל", "email", "e-mail"),
    "amount": ("יתרה לתשלום", "יתרה", "amount due", "balance", "סכום", "סה\"כ", "amount", "total"),
    "issued": ("תאריך", "תאריך מסמך", "date", "issued"),
    "due": ("תאריך לתשלום", "מועד תשלום", "due", "due date"),
    "currency": ("מטבע", "currency"),
    "status": ("סטטוס", "status"),
    # מנהל 370: סכום ששולם לצד סכום ברוטו (בלי עמודת יתרה) ⇒ לא דורשים את מה ששולם (ראו `_paid_conflict`)
    # מבקר 215: גם «שולם עד כה» / «התקבל» / «Amount Received» / «Payments» וכו׳; שמות אחרים ⇒ `_paid_like`
    "paid": ("סכום ששולם", "שולם", "תקבולים", "זכות", "paid", "amount paid", "paid amount",
             "שולם עד כה", "שולם עד היום", "התקבל", "נתקבל", "סכום שהתקבל", "סכום שנתקבל", "תקבול",
             "amount received", "received", "paid to date", "payments", "payments received", "total paid"),
}
# שמות עמודת סכום שהם כבר נטו (אחרי תשלומים) — עמודת «שולם» לצידם לא משנה דבר
BALANCE_NAMES = ("יתרה לתשלום", "יתרה", "amount due", "balance")
DEBIT_CREDIT_HINT = (" — בקובץ יש עמודות חובה/זכות: צריך עמודת «יתרה לתשלום» לכל חשבונית"
                     " (ייצוא «חשבוניות פתוחות», לא כרטסת)")
CLOSED_STATUSES = {"סגור", "שולם", "נסגר", "מבוטל", "closed", "paid", "cancelled", "canceled",
                   # מנהל 372: נקבה/מלא/void — היו נקלטים כחוב פתוח ⇒ תזכורת על חשבונית ששולמה
                   "סגורה", "נסגרה", "שולמה", "מבוטלת", "בוטל", "בוטלה", "שולם במלואו", "שולמה במלואה",
                   "שולם במלואה", "paid in full", "fully paid", "paid-in-full", "void", "voided", "settled"}
PARTIAL_MSG = ("החשבונית מסומנת «{}» ועמודת הסכום היא סכום המסמך, לא היתרה — לא נקלטה, כדי לא לדרוש"
               " סכום ששולם. ייצאו עם עמודת «יתרה לתשלום»")


@dataclass
class CsvResult:
    invoices: list[Invoice] = field(default_factory=list)
    errors: list[dict] = field(default_factory=list)
    credits: list[Invoice] = field(default_factory=list)   # critic סבב 35: יתרה שלילית = זיכוי ⇒ לבדיקה
    date_order: str = "dmy"                                # הפעלה 112: dmy / mdy / mixed (זוהה מהקובץ)


_DMY = re.compile(r"^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4}|\d{2})$")
_ISO = re.compile(r"^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T].*)?$")
MIN_YEAR, MAX_YEAR = 2000, 2099      # הפעלה 112: "01/10/0226" (שגיאת הקלדה) היה חוב "באיחור" של 1,800 שנה


def _day_month(v: str) -> tuple[int, int] | None:
    """שני השדות הראשונים של תאריך עם לוכסן/נקודה/מקף (בלי לפרש מי יום ומי חודש)."""
    m = _DMY.match((v or "").strip())
    return (int(m.group(1)), int(m.group(2))) if m else None


def detect_date_order(values: list[str]) -> str:
    """הפעלה 112: קובץ מ-Excel באנגלית (MM/DD) נקרא בשקט כ-DD/MM ⇒ "03/05/2026" (5 במרץ)
    נקלט כ-3 במאי ⇒ תזכורת יוצאת חודשיים לפני/אחרי המועד. ההחלטה פר-קובץ, לפי ראיה חד-משמעית:
    שדה ראשון > 12 ⇒ DMY · שדה שני > 12 ⇒ MDY · שתיהן ⇒ "mixed" (תאריך דו-משמעי נדחה).
    בלי ראיה ⇒ DMY (ברירת המחדל הישראלית)."""
    dmy = mdy = False
    for v in values:
        dm = _day_month(v)
        if not dm:
            continue
        a, b = dm
        if a > 12 >= b:
            dmy = True
        elif b > 12 >= a:
            mdy = True
    if dmy and mdy:
        return "mixed"
    return "mdy" if mdy else "dmy"


def _parse_date(v: str, order: str = "dmy") -> date | None:
    v = (v or "").strip()
    if not v:
        return None
    try:
        m = _ISO.match(v)
        if m:
            y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
        else:
            m = _DMY.match(v)
            if not m:
                raise ValueError
            a, b, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
            if len(m.group(3)) == 2:
                y += 2000
            if order == "mixed" and a <= 12 and b <= 12 and a != b:
                raise ValueError(f"תאריך דו-משמעי: {v} (בקובץ יש גם DD/MM וגם MM/DD) — "
                                 "כתבו אותו כ-YYYY-MM-DD")
            d, mo = (b, a) if order == "mdy" else (a, b)
            if order == "mixed" and b > 12:
                d, mo = b, a
        if not MIN_YEAR <= y <= MAX_YEAR:
            raise ValueError(f"שנה לא סבירה בתאריך: {v}")
        return date(y, mo, d)
    except ValueError as e:
        if str(e).startswith(("תאריך דו-משמעי", "שנה לא סבירה")):
            raise
        raise ValueError(f"תאריך לא תקין: {v}") from None


def _agorot(v: str) -> int:
    # מבקר סבב 3: "Infinity"/"NaN" הפילו את הייבוא; סכום לא סביר (מעל 100 מיליון ₪) נדחה.
    # הפעלה 111: אותו מפענח כמו במקורות ה-API. קודם כל פסיק נמחק ⇒ "1200,50" יובא כ-120,050 ₪
    # ו-"1.200,50" כ-1.20 ₪. עכשיו פסיק מותר רק כמפריד אלפים, אחרת השורה נדחית עם הודעה.
    return _amount_cell(v)[0]


# הפעלה 369 (חיבורים): ייצוא חשבונאי (Excel «חשבונאות», חשבשבת, פריוריטי) כותב שלילי כ-«(500)» או «500-»,
# ולפעמים מטבע בתוך התא («1,200 ש"ח», «$500»). קודם: «(500)»/«500-»/«ש"ח» ⇒ «סכום לא תקין» ⇒ זיכוי נעלם
# מרשימת הבדיקה, וקובץ שכולו בפורמט הזה נדחה כולו. וגם: «₪500» בשורה שעמודת המטבע שלה USD נקלט בשקט
# כ-500 דולר. עכשיו: סוגריים / מינוס בסוף = שלילי ⇒ זיכוי (לבדיקה, אף פעם לא חוב); סימן כפול
# («(-500)», «-500-») ⇒ שגיאה; סימן מטבע בתא נבדק מול עמודת המטבע — סתירה ⇒ שגיאה גלויה, בלי ניחוש.
_CELL_INVISIBLE = ("\u200f", "\u200e", "\u202a", "\u202b", "\u202c", "\ufeff", "\u2066", "\u2067", "\u2068",
                   "\u2069", "\u061c")
# מנהל 370: Excel ב-Mac / Numbers / העתקה מ-Word כותבים מינוס כ-U+2212 או מקף לא-ASCII («−500», «500–»).
# קודם ⇒ «סכום לא תקין» ⇒ הזיכוי נעלם מרשימת הבדיקה (כמו 369). מקף ארוך «—» לא כלול: משמש כ«אין ערך».
_MINUS_LIKE = str.maketrans({"\u2212": "-", "\u2010": "-", "\u2011": "-", "\u2012": "-", "\u2013": "-",
                             "\ufe63": "-", "\uff0d": "-"})
_CUR_MARK = re.compile(r'^([+-]?)\s*(?:US\$|₪|\$|€|£|ש["״\'׳]?ח|NIS|ILS|USD|EUR|GBP)', re.I)
_CUR_MARK_END = re.compile(r'(?:US\$|₪|\$|€|£|ש["״\'׳]?ח|NIS|ILS|USD|EUR|GBP)$', re.I)


def _mark_currency(m: str) -> str:
    m = m.upper() if m.isascii() else m
    return parse_currency(m.replace("׳", "'"))


def _amount_cell(v: str) -> tuple[int, str | None]:
    """תא סכום ⇒ (אגורות, מטבע שהופיע בתא או None)."""
    t = v or ""
    for ch in _CELL_INVISIBLE:
        t = t.replace(ch, "")
    t = t.translate(_MINUS_LIKE).replace("\u00a0", " ").replace("\u202f", " ").strip()
    if not t:
        raise ValueError(f"סכום לא תקין: {v}")   # תא ריק = שגיאה, לא 0
    marks: set[str] = set()
    neg = False

    def strip_marks(t: str) -> str:
        while True:
            m = _CUR_MARK.match(t) or _CUR_MARK_END.search(t)
            if not m:
                return t
            if m.re is _CUR_MARK:
                marks.add(_mark_currency(m.group(0)[len(m.group(1)):].strip()))
                t = m.group(1) + t[m.end():].strip()
            else:
                marks.add(_mark_currency(m.group(0)))
                t = t[:m.start()].strip()

    t = strip_marks(t)
    if t.startswith("(") and t.endswith(")"):
        neg = True
        t = strip_marks(t[1:-1].strip())
    # גבי חיבורים (xfail של גבי בדיקות 21.11): «500.-» / «1,200.- ש״ח» = כתיב ישראלי לסכום **שלם** (אין אגורות),
    # לא מינוס בסוף. מאז 369 נקרא כזיכוי ⇒ החשבונית נעלמה מהתזכורות. נקודה מיד לפני המקף, אחרי ספרה ⇒ שלם.
    if re.fullmatch(r"\d[\d,]*\.-", t):
        t = t[:-2]
    elif t.endswith("-") and len(t) > 1:
        if neg:
            raise ValueError(f"סכום לא תקין (סימן שלילי כפול): {v}")
        neg = True
        t = strip_marks(t[:-1].strip())
    if not t or not any(c.isdigit() for c in t):
        raise ValueError(f"סכום לא תקין: {v}")   # «()», «₪», «-» לבד ⇒ שגיאה, לא 0
    if neg and t[0] in "+-":
        raise ValueError(f"סכום לא תקין (סימן שלילי כפול): {v}")
    if "(" in t or ")" in t or t.endswith("-"):
        raise ValueError(f"סכום לא תקין: {v}")
    if len(marks) > 1:
        raise ValueError(f"שני מטבעות שונים בתא הסכום: {v}")
    out = parse_amount_agorot(t, max_agorot=10_000_000_000)
    return (-out if neg else out), (next(iter(marks)) if marks else None)


# הפעלה 114: Excel שומר טלפון כמספר ⇒ האפס המוביל נמחק ('0501234567' ⇒ 501234567, לפעמים '501234567.0').
# קודם המספר נדחה בשקט ⇒ החייב לא קיבל SMS. רק תא של ספרות בלבד, באורך ובקידומת של מספר ישראלי
# בלי האפס (נייד 5X/VoIP 7X = 9 ספרות, נייח 2/3/4/8/9 = 8 ספרות) — ובעמודת טלפון בלבד.
_EXCEL_NUM_PHONE = re.compile(r"(?:[57]\d{8}|[23489]\d{7}|972[2-9]\d{7,8})")


def _csv_phone(v: str) -> str:
    s = v.strip()
    m = re.fullmatch(r"(\d+)\.0+", s)
    if m:
        s = m.group(1)
    if _EXCEL_NUM_PHONE.fullmatch(s):
        return s if s.startswith("972") else "0" + s
    return v.strip()


def decode(raw: bytes) -> tuple[str, str]:
    """גבי חיבורים (שוק: 30%–50% מהבטא ב-CSV): «שמירה בשם ← CSV» ב-Excel עברי שומר **Windows-1255**,
    ו«טקסט Unicode» שומר UTF-16 עם טאבים. קודם רק UTF-8 נקרא, וכל השאר נדחה עם שגיאת Python באנגלית
    ("'utf-8' codec can't decode byte 0xee"). סדר: BOM ⇒ UTF-8 קפדני ⇒ cp1255 (רק אם יש בו עברית;
    או ₪; אחרת ייתכן שזה קידוד אחר ⇒ שגיאה ברורה בעברית, בלי ניחוש)."""
    if raw.startswith((b"\xff\xfe", b"\xfe\xff")):
        try:
            return raw.decode("utf-16"), "utf-16"
        except UnicodeDecodeError:
            pass
    else:
        try:
            return raw.decode("utf-8-sig"), "utf-8"
        except UnicodeDecodeError:
            try:
                txt = raw.decode("cp1255")
            except UnicodeDecodeError:
                txt = ""
            if re.search(r"[\u05d0-\u05ea\u20aa]", txt):   # עברית או ₪
                return txt, "cp1255"
    raise ValueError("קידוד הקובץ לא מזוהה. ב-Excel: «שמירה בשם» ← «CSV UTF-8 (מופרד בפסיקים)»")


HEADER_SCAN = 5   # מבקר 211: ייצוא «דוח חשבוניות פתוחות» מתחיל לעיתים בשורת כותרת-דוח / שורה ריקה
REQUIRED = ("number", "client", "amount")


def _delim(line: str) -> str:
    """המפריד שמופיע בשורה הכי הרבה פעמים (מחוץ למירכאות); תיקו ⇒ פסיק."""
    line = line.rstrip("\r")
    counts = {d: len(next(csv.reader([line], delimiter=d), [])) - 1 for d in (",", ";", "\t")}
    return max(counts, key=lambda d: (counts[d], d == ","))


# מבקר 215🟠 (הפעלה 371): רשימה סגורה של שמות «שולם» פספסה ניסוחים נפוצים ⇒ סכום ברוטו נקלט כחוב מלא.
# שם עמודה שלא זוהה, שיש בו מילת תשלום-שהתקבל ⇒ עמודת «שולם». לא: שלילה («לא שולם», «unpaid» = יתרה),
# תאריך («תאריך תשלום», «date paid»), מספר/כמות («מספר תשלומים», «# payments»), ולא «תשלום» לבד (דו-משמעי).
_PAID_TOKENS = ("שולם", "התקבל", "נתקבל", "תקבול", "paid", "received", "payments")
_PAID_NOT = ("לא שולם", "טרם", "unpaid", "not paid", "un-paid", "תאריך", "date", "מספר", "כמות", "count",
             "number", "no.", "#", "אמצעי", "method", "via", "by")


def _paid_like(h: str) -> bool:
    t = re.sub(r"\s+", " ", h).replace("to date", "")      # «paid to date» = מצטבר, לא עמודת תאריך
    if not any(k in t for k in _PAID_TOKENS):
        return False
    return not any(re.search(rf"(?<![a-z\u05d0-\u05ea]){re.escape(k)}(?![a-z\u05d0-\u05ea])", t)
                   if k.isalpha() else k in t for k in _PAID_NOT)


def _columns(cells: list[str]) -> dict[str, int]:
    head = [h.strip().lower() for h in cells]
    idx: dict[str, int] = {}
    for key, names in COLUMNS.items():
        # מבקר סבב 3: עדיפות לפי סדר השמות ב-COLUMNS (יתרה לפני סה"כ), לא לפי סדר העמודות בקובץ
        for name in names:
            if name.lower() in head:
                idx[key] = head.index(name.lower())
                break
    if "paid" not in idx:
        used = set(idx.values())
        for i, h in enumerate(head):
            if i not in used and _paid_like(h):
                idx["paid"] = i
                break
    return idx


def _find_header(text: str) -> tuple[int, str]:
    """(מספר השורה של שורת העמודות, המפריד). מחפש ב-HEADER_SCAN השורות הראשונות את השורה הראשונה
    שיש בה כל עמודות החובה; לא נמצאה ⇒ השורה הראשונה (וההודעה «חסרות עמודות חובה» כמו קודם)."""
    lines = text.split("\n", HEADER_SCAN)[:HEADER_SCAN]
    for i, line in enumerate(lines):
        d = _delim(line)
        cells = next(csv.reader([line.rstrip("\r")], delimiter=d), [])
        if all(k in _columns(cells) for k in REQUIRED):
            return i, d
    return 0, _delim(lines[0] if lines else "")


# הפעלה 368 (BACKLOG חיבורים): ייצוא Excel מסתיים לעיתים בשורת «סה״כ» / «סיכום». קודם נדחתה בהודעה מטעה
# («אין טלפון ואין מייל» / «חסר מספר מסמך») ⇒ בעל העסק חיפש חייב חסר. עכשיו: שגיאה גלויה וברורה.
# תווית בעמודת המספר ⇒ תמיד סיכום; בעמודת הלקוח ⇒ רק בלי מספר, טלפון ומייל (לקוח «סיכום בע״מ» לא נפגע).
_SUMMARY = re.compile(r'^(?:סה["\u05f4\'\u2019]?כ|סך\s*הכ[ו]?ל|סיכום|total|totals|grand\s+total|subtotal|sum)'
                      r'(?:\s+(?:לתשלום|כללי|כולל|חובות|יתרות|יתרה|פתוחות|amount|due|balance|open))?$',
                      re.IGNORECASE)
# מבקר 214🟠 (הפעלה 371): הרשימה המעוגנת ב-$ פספסה «סה"כ לגבייה», «*** סה"כ ***», «סכום כולל», «Sub-total»,
# «Total (ILS)» ⇒ חשבונית בשקט. בעמודת המספר: **תחילית** (אחרי עיטורים) מספיקה — שגיאה גלויה עדיפה על חוב מזויף.
# בעמודת הלקוח נשאר המעוגן (לקוח «Total Solutions» / «סיכום בע״מ»).
_DECOR = " \t*=#_~•·:.|>-–—«»\"'()[]"
_SUMMARY_PREFIX = re.compile(r'^(?:סה["\u05f4\'\u2019]?כ|סך\s*ה?כ[ו]?ל|סיכום|סכום\s+כולל|grand\s+total|'
                             r'sub[\s-]?totals?|totals?|sum|summary)(?![a-z\u05d0-\u05ea])', re.IGNORECASE)
SUMMARY_MSG = "שורת סיכום (סה״כ) — לא חשבונית, לא נקלטה"
NO_DIGIT_MSG = "מספר מסמך בלי ספרות ({!r}) — אולי שורת סיכום או הערה? לא נקלט"
MERGED_HINT = " (אם התא ממוזג עם השורה שמעל ב-Excel — בטלו את המיזוג ומלאו את הערך בכל שורה)"


_PAID_NO = {"לא", "no", "n", "false", "0", "-", "—"}
_PAID_YES = {"כן", "yes", "y", "true", "v", "✓", "✔", "שולם", "paid", "x"}


def _paid_conflict(v: str) -> None:
    """מנהל 370: עמודת «סכום/סה״כ» (ברוטו) + עמודת «שולם», בלי עמודת יתרה. קודם: «סכום 1,200 · שולם 800»
    נקלט כחוב של 1,200 ⇒ תזכורת דורשת 800 ₪ ששולמו. לא מחסרים (ניחוש — אולי «שולם» כבר בניכוי זיכוי,
    אולי במטבע אחר): שורה עם תשלום שאינו אפס ⇒ שגיאה גלויה; תשלום ריק/0 ⇒ הסכום הוא היתרה ⇒ נקלט."""
    t = v.strip().lower()
    if not t or t in _PAID_NO:
        return
    if t in _PAID_YES:
        raise ValueError("החשבונית מסומנת «שולם» — לא נקלטה (אם נשארה יתרה, ייצאו עם עמודת «יתרה לתשלום»)")
    try:
        paid, _ = _amount_cell(v)
    except ValueError:
        raise ValueError(f"עמודת «שולם» לא קריאה ({v[:20]!r}) — לא נקלט, כי לא ברור כמה נשאר לתשלום") from None
    if paid != 0:
        raise ValueError(f"בשורה רשום תשלום ({v.strip()}) ועמודת הסכום היא סכום המסמך, לא היתרה"
                         " — לא נקלט, כדי לא לדרוש סכום ששולם. ייצאו עם עמודת «יתרה לתשלום»")


def _status_norm(v: str) -> str:
    return re.sub(r"\s+", " ", v.strip().strip(_DECOR).strip().lower())


# מנהל 372 (BACKLOG חיבורים): סטטוס «שולם חלקית» / «Partially Paid» ליד עמודת סכום ברוטו (בלי יתרה) ⇒
# נקלט חוב מלא ⇒ תזכורת דורשת סכום ששולם 🟠. לא מחסרים (אין לנו את היתרה) ⇒ שגיאה גלויה; לצד עמודת יתרה ⇒ תקין.
_PARTIAL = re.compile(r"חלקי|(?<![a-z])(?:partial(?:ly)?|part[\s-]?paid|partly)(?![a-z])")
_PARTIAL_NOT = re.compile(r"לא שולם|טרם|unpaid|not paid")


def _status_partial(v: str) -> bool:
    t = _status_norm(v)
    return bool(t) and bool(_PARTIAL.search(t)) and not _PARTIAL_NOT.search(t)


def _is_summary(label: str) -> bool:
    return bool(_SUMMARY.match(label.strip().rstrip(":").strip()))


def _is_summary_number(label: str) -> bool:
    """תווית בעמודת **מספר המסמך**: מספיק שמתחילה (אחרי עיטורים) בסה״כ/סך הכל/סיכום/סכום כולל/total/sum."""
    return _is_summary(label) or bool(_SUMMARY_PREFIX.match(label.strip(_DECOR)))


def parse(raw: bytes | str, today: date | None = None) -> CsvResult:
    if isinstance(raw, bytes):
        if len(raw) > MAX_BYTES:
            raise ValueError("הקובץ גדול מדי (מקס׳ 2MB)")
        raw, _ = decode(raw)
    text = raw.lstrip("\ufeff")
    skip, delim = _find_header(text)
    if skip:   # שורות כותרת-דוח / ריקות מעל שורת העמודות — מדלגים; מספרי השורות בשגיאות נשארים של הקובץ
        text = text.split("\n", skip)[skip]
    rows = list(csv.reader(io.StringIO(text), delimiter=delim))
    if not rows:
        raise ValueError("קובץ ריק")
    idx = _columns(rows[0])
    missing = [k for k in REQUIRED if k not in idx]
    if missing:
        head = {h.strip().lower() for h in rows[0]}
        dc = "amount" in missing and ({"חובה", "debit"} & head)
        raise ValueError(f"חסרות עמודות חובה: {', '.join(missing)} — "
                         f"שורת שמות העמודות צריכה להיות באחת מ-{HEADER_SCAN} השורות הראשונות בקובץ"
                         + (DEBIT_CREDIT_HINT if dc else ""))
    amount_is_balance = rows[0][idx["amount"]].strip().lower() in BALANCE_NAMES
    gross = "paid" in idx and not amount_is_balance
    if len(rows) - 1 > MAX_ROWS:
        raise ValueError(f"יותר מדי שורות (מקס׳ {MAX_ROWS})")
    out = CsvResult()
    seen: set[str] = set()
    date_cells = [r[idx[k]] for r in rows[1:] for k in ("issued", "due")
                  if k in idx and idx[k] < len(r)]
    order = detect_date_order(date_cells)
    out.date_order = order
    prev: dict[str, str] = {}
    for n, row in enumerate(rows[1:], start=skip + 2):
        def cell(k: str, row=row) -> str:
            i = idx.get(k)
            return row[i].strip() if i is not None and i < len(row) else ""
        if not any(c.strip() for c in row):
            continue
        last, prev = prev, {k: cell(k) for k in ("number", "client", "phone", "email")}
        try:
            raw_num = cell("number")
            # «סה״כ» בעמודת המספר הוא אף פעם לא מספר מסמך (גם אם יש בשורה טלפון של העסק) ⇒ תמיד סיכום
            if _is_summary_number(raw_num) or (not raw_num and _is_summary(cell("client"))
                                        and not cell("phone") and not cell("email")):
                raise ValueError(SUMMARY_MSG)
            if not raw_num:
                raise ValueError("חסר מספר מסמך" + (MERGED_HINT if last.get("number") else ""))
            # הפעלה 116: אותו ניקוי כמו ב-Invoice (מפתח `csv:{מספר}` ואיחוד מול ה-API). "None"/קישור ⇒
            # שגיאה גלויה; "1234.0" מ-Excel ⇒ "1234"; RLM/רווחים כפולים לא מפצלים מסמך.
            num = clean_doc_number(raw_num)
            if not num:
                raise ValueError(f"מספר מסמך לא תקין: {raw_num[:30]!r}")
            if not any(ch.isdigit() for ch in num):     # מבקר 214: אין מספר מסמך בלי אף ספרה
                raise ValueError(NO_DIGIT_MSG.format(raw_num[:30]))
            if len(num) > DOC_NUMBER_MAX:
                raise ValueError(f"מספר מסמך ארוך מדי (מעל {DOC_NUMBER_MAX} תווים)")
            if num in seen:
                raise ValueError(f"מספר מסמך כפול: {num}")
            if _status_norm(cell("status")) in CLOSED_STATUSES:
                continue                                   # מסמך סגור/מבוטל ⇒ לא חוב
            amount, cell_cur = _amount_cell(cell("amount"))
            currency = parse_currency(cell("currency")) if cell("currency").strip() else (cell_cur or "ILS")
            if cell_cur and cell_cur != currency:
                raise ValueError(f"המטבע בתא הסכום ({cell_cur}) שונה מעמודת המטבע ({currency})"
                                 " — לא נקלט, כדי לא לשלוח תזכורת בסכום שגוי")
            if gross and amount > 0:
                _paid_conflict(cell("paid"))
            if not amount_is_balance and amount > 0 and _status_partial(cell("status")):
                raise ValueError(PARTIAL_MSG.format(cell("status").strip()[:30]))
            if amount == 0:
                continue                                   # שולמה / אפס ⇒ לא חוב
            issued = _parse_date(cell("issued"), order)
            due = _parse_date(cell("due"), order)
            # הפעלה 121: תאריך מסמך מעל שנה בעתיד = טעות בשנה ⇒ שגיאה גלויה (קודם: «אולי העמודות הפוכות?» מטעה,
            # או מועד 2062 מוערך ⇒ אין תזכורת לעולם, בשקט).
            if issued_in_far_future(issued, today):
                raise ValueError(f"תאריך המסמך ({issued:%d/%m/%Y}) רחוק בעתיד — אולי טעות בשנה?")
            # הפעלה 119: מועד לפני תאריך המסמך = עמודות הפוכות / הקלדה ⇒ שגיאה גלויה בייבוא
            # (קודם: החוב נראה באיחור כבר ביום ההנפקה ⇒ תזכורת «טרם שולמה» מיידית). יום זהה = תקין.
            if due is not None and issued is not None and due < issued:
                raise ValueError(f"מועד התשלום ({due:%d/%m/%Y}) לפני תאריך המסמך ({issued:%d/%m/%Y})"
                                 " — אולי העמודות הפוכות?")
            # הפעלה 120: מועד מעל שנתיים אחרי המסמך = טעות בשנה ⇒ החוב לא היה מקבל תזכורת לעולם, בשקט.
            if due is not None and issued is not None and (due - issued).days > MAX_TERMS_DAYS:
                raise ValueError(f"מועד התשלום ({due:%d/%m/%Y}) יותר משנתיים אחרי תאריך המסמך"
                                 f" ({issued:%d/%m/%Y}) — אולי טעות בשנה?")
            est = due is None and issued is not None
            if due is None and issued is not None:
                due = issued + timedelta(days=DEFAULT_TERMS_DAYS)
            if not cell("phone") and not cell("email"):
                raise ValueError("אין טלפון ואין מייל"
                                 + (MERGED_HINT if (last.get("phone") or last.get("email"))
                                    and cell("client") in ("", last.get("client")) else ""))
            phone = _csv_phone(cell("phone"))
            # הפעלה 114: טלפון שלא מזוהה ובלי מייל תקין = חייב שאי אפשר להגיע אליו ⇒ שגיאה גלויה בייבוא
            # (קודם נקלט בשקט ואף תזכורת לא יצאה).
            if not normalize_il_phone(phone) and not clean_email(cell("email")):
                raise ValueError(f"טלפון לא מזוהה ואין מייל תקין: {cell('phone')[:30]!r}")
            seen.add(num)
            # critic סבב 35: יתרה שלילית = זיכוי ללקוח. היה `<= 0 ⇒ continue` (נבלע בשקט, כמו רווחית ב-21.1)
            # ⇒ תזכורת על הסכום המלא. עכשיו: לא חוב, אבל הלקוח עובר לבדיקת זיכוי (בלי ניחוש סכום).
            (out.credits if amount < 0 else out.invoices).append(Invoice(
                external_id=f"csv:{num}", number=num, doc_type=330 if amount < 0 else 305,
                amount_agorot=abs(amount),
                currency=currency, issued=issued, due=due,
                client_external_id="", client_name=cell("client"), client_phone=phone,
                client_email=cell("email"), due_estimated=est))
        except ValueError as e:
            out.errors.append({"row": n, "error": str(e)})
    return out
