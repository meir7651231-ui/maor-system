"""ייבוא חשבוניות פתוחות מ-CSV — חלופה ל-API (הכרעת מאיר 6.11: «API תחילה ו-CSV חלופה»).

טהור (בלי DB). מקבל ייצוא של morning/Excel בעברית או באנגלית. כל שורה נבדקת לבד; שורה פסולה
לא מפילה את הקובץ אלא מוחזרת כשגיאה עם מספר השורה. חשבונית מ-CSV מסומנת source='csv'
⇒ ר-4: אין לה רענון API, ולכן היא תקפה לשליחה רק 24 שעות מהייבוא (service._refresh_before_send).
"""
from __future__ import annotations

import csv
import io
from dataclasses import dataclass, field
from datetime import date, timedelta
from decimal import Decimal, InvalidOperation

from .greeninvoice import DEFAULT_TERMS_DAYS, Invoice

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


def _parse_date(v: str) -> date | None:
    v = (v or "").strip()
    if not v:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d.%m.%Y", "%d/%m/%y"):
        try:
            from datetime import datetime
            return datetime.strptime(v, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"תאריך לא תקין: {v}")


def _agorot(v: str) -> int:
    t = (v or "").replace("\u20aa", "").replace(",", "").replace("\u200f", "")  # RLM מהעתקה מאקסל.strip()
    try:
        d = Decimal(t)
    except InvalidOperation:
        raise ValueError(f"סכום לא תקין: {v}") from None
    # מבקר סבב 3: "Infinity"/"NaN" הפילו את הייבוא (OverflowError). גם סכום לא סביר נדחה
    if not d.is_finite() or abs(d) > Decimal("100000000"):
        raise ValueError(f"סכום לא תקין: {v}")
    return int((d * 100).to_integral_value())


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
            issued = _parse_date(cell("issued"))
            due = _parse_date(cell("due"))
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
                currency=(cell("currency") or "ILS").upper(), issued=issued, due=due,
                client_external_id="", client_name=cell("client"), client_phone=cell("phone"),
                client_email=cell("email"), due_estimated=est))
        except ValueError as e:
            out.errors.append({"row": n, "error": str(e)})
    return out
