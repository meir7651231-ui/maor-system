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
    "amount": ("יתרה לתשלום", "יתרה", "סכום", "סה\"כ", "amount", "balance", "total"),
    "issued": ("תאריך", "תאריך מסמך", "date", "issued"),
    "due": ("תאריך לתשלום", "מועד תשלום", "due", "due date"),
    "currency": ("מטבע", "currency"),
    "status": ("סטטוס", "status"),
}
CLOSED_STATUSES = {"סגור", "שולם", "נסגר", "מבוטל", "closed", "paid", "cancelled", "canceled"}


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
    if not (v or "").replace("\u200f", "").strip():
        raise ValueError(f"סכום לא תקין: {v}")   # תא ריק = שגיאה, לא 0
    return parse_amount_agorot(v, max_agorot=10_000_000_000)


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


def _columns(cells: list[str]) -> dict[str, int]:
    head = [h.strip().lower() for h in cells]
    idx: dict[str, int] = {}
    for key, names in COLUMNS.items():
        # מבקר סבב 3: עדיפות לפי סדר השמות ב-COLUMNS (יתרה לפני סה"כ), לא לפי סדר העמודות בקובץ
        for name in names:
            if name.lower() in head:
                idx[key] = head.index(name.lower())
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
        raise ValueError(f"חסרות עמודות חובה: {', '.join(missing)} — "
                         f"שורת שמות העמודות צריכה להיות באחת מ-{HEADER_SCAN} השורות הראשונות בקובץ")
    if len(rows) - 1 > MAX_ROWS:
        raise ValueError(f"יותר מדי שורות (מקס׳ {MAX_ROWS})")
    out = CsvResult()
    seen: set[str] = set()
    date_cells = [r[idx[k]] for r in rows[1:] for k in ("issued", "due")
                  if k in idx and idx[k] < len(r)]
    order = detect_date_order(date_cells)
    out.date_order = order
    for n, row in enumerate(rows[1:], start=skip + 2):
        def cell(k: str, row=row) -> str:
            i = idx.get(k)
            return row[i].strip() if i is not None and i < len(row) else ""
        if not any(c.strip() for c in row):
            continue
        try:
            raw_num = cell("number")
            if not raw_num:
                raise ValueError("חסר מספר מסמך")
            # הפעלה 116: אותו ניקוי כמו ב-Invoice (מפתח `csv:{מספר}` ואיחוד מול ה-API). "None"/קישור ⇒
            # שגיאה גלויה; "1234.0" מ-Excel ⇒ "1234"; RLM/רווחים כפולים לא מפצלים מסמך.
            num = clean_doc_number(raw_num)
            if not num:
                raise ValueError(f"מספר מסמך לא תקין: {raw_num[:30]!r}")
            if len(num) > DOC_NUMBER_MAX:
                raise ValueError(f"מספר מסמך ארוך מדי (מעל {DOC_NUMBER_MAX} תווים)")
            if num in seen:
                raise ValueError(f"מספר מסמך כפול: {num}")
            if cell("status").strip().lower() in CLOSED_STATUSES:
                continue                                   # מסמך סגור/מבוטל ⇒ לא חוב
            amount = _agorot(cell("amount"))
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
                raise ValueError("אין טלפון ואין מייל")
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
                currency=parse_currency(cell("currency")), issued=issued, due=due,
                client_external_id="", client_name=cell("client"), client_phone=phone,
                client_email=cell("email"), due_estimated=est))
        except ValueError as e:
            out.errors.append({"row": n, "error": str(e)})
    return out
