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

from .greeninvoice import DEFAULT_TERMS_DAYS, Invoice
from .integrations.base import parse_amount_agorot, parse_currency

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


def parse(raw: bytes | str) -> CsvResult:
    if isinstance(raw, bytes):
        if len(raw) > MAX_BYTES:
            raise ValueError("הקובץ גדול מדי (מקס׳ 2MB)")
        raw = raw.decode("utf-8-sig", errors="strict")
    rows = list(csv.reader(io.StringIO(raw)))
    if not rows:
        raise ValueError("קובץ ריק")
    head = [h.strip().lower() for h in rows[0]]
    idx: dict[str, int] = {}
    for key, names in COLUMNS.items():
        # מבקר סבב 3: עדיפות לפי סדר השמות ב-COLUMNS (יתרה לפני סה"כ), לא לפי סדר העמודות בקובץ
        for name in names:
            if name.lower() in head:
                idx[key] = head.index(name.lower())
                break
    missing = [k for k in ("number", "client", "amount") if k not in idx]
    if missing:
        raise ValueError(f"חסרות עמודות חובה: {', '.join(missing)}")
    if len(rows) - 1 > MAX_ROWS:
        raise ValueError(f"יותר מדי שורות (מקס׳ {MAX_ROWS})")
    out = CsvResult()
    seen: set[str] = set()
    date_cells = [r[idx[k]] for r in rows[1:] for k in ("issued", "due")
                  if k in idx and idx[k] < len(r)]
    order = detect_date_order(date_cells)
    out.date_order = order
    for n, row in enumerate(rows[1:], start=2):
        def cell(k: str, row=row) -> str:
            i = idx.get(k)
            return row[i].strip() if i is not None and i < len(row) else ""
        if not any(c.strip() for c in row):
            continue
        try:
            num = cell("number")
            if not num:
                raise ValueError("חסר מספר מסמך")
            if num in seen:
                raise ValueError(f"מספר מסמך כפול: {num}")
            if cell("status").strip().lower() in CLOSED_STATUSES:
                continue                                   # מסמך סגור/מבוטל ⇒ לא חוב
            amount = _agorot(cell("amount"))
            if amount == 0:
                continue                                   # שולמה / אפס ⇒ לא חוב
            issued = _parse_date(cell("issued"), order)
            due = _parse_date(cell("due"), order)
            est = due is None and issued is not None
            if due is None and issued is not None:
                due = issued + timedelta(days=DEFAULT_TERMS_DAYS)
            if not cell("phone") and not cell("email"):
                raise ValueError("אין טלפון ואין מייל")
            seen.add(num)
            # critic סבב 35: יתרה שלילית = זיכוי ללקוח. היה `<= 0 ⇒ continue` (נבלע בשקט, כמו רווחית ב-21.1)
            # ⇒ תזכורת על הסכום המלא. עכשיו: לא חוב, אבל הלקוח עובר לבדיקת זיכוי (בלי ניחוש סכום).
            (out.credits if amount < 0 else out.invoices).append(Invoice(
                external_id=f"csv:{num}", number=num, doc_type=330 if amount < 0 else 305,
                amount_agorot=abs(amount),
                currency=parse_currency(cell("currency")), issued=issued, due=due,
                client_external_id="", client_name=cell("client"), client_phone=cell("phone"),
                client_email=cell("email"), due_estimated=est))
        except ValueError as e:
            out.errors.append({"row": n, "error": str(e)})
    return out
