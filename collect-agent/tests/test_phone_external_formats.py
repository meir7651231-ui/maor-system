"""הפעלה 114 — טלפון מקלט חיצוני (CSV/API) מול נרמול השליחה ב-SMS.

באגים שנמצאו:
- '+972 (0)50-1234567' / '972-050-1234567' (קידומת + אפס-חיוג, נפוץ בכרטיסי ביקור ובייצוא CRM) ⇒ None
  ⇒ החייב לא קיבל SMS בשקט.
- ספרות ערביות-הודיות / רוחב-מלא (הקלדה ממקלדת ערבית/יפנית) ⇒ None.
- Excel שומר טלפון כמספר ⇒ האפס המוביל נמחק ('501234567', '501234567.0') ⇒ None.
- שורת CSV עם טלפון לא-מזוהה ובלי מייל נקלטה בשקט ⇒ חוב שאף תזכורת לא יוצאת עליו.
"""
from __future__ import annotations

import pytest

from app import csv_import
from app.contact import is_il_mobile, normalize_il_phone
from app.integrations.sms import il_mobile_intl


@pytest.mark.parametrize("raw,norm", [
    ("+972 (0)50-1234567", "972501234567"),
    ("972-050-1234567", "972501234567"),
    ("+9720501234567", "972501234567"),
    ("00972 050 1234567", "972501234567"),
    ("0097203 1234567", "97231234567"),           # נייח עם אפס-חיוג ⇒ נייח תקין (קודם 12 ספרות שגויות)
    ("٠٥٠١٢٣٤٥٦٧", "972501234567"),               # ערביות-הודיות
    ("０５０-１２３４５６７", "972501234567"),      # רוחב-מלא
    ("\u200f050-1234567\u200f", "972501234567"),   # RLM
    # ללא שינוי:
    ("050-1234567", "972501234567"),
    ("+972 50 1234567", "972501234567"),
    ("03-1234567", "97231234567"),
])
def test_external_formats_normalized(raw, norm):
    assert normalize_il_phone(raw) == norm


@pytest.mark.parametrize("raw", [
    "", "123", "+1 (972) 512-3456",        # דאלאס (קידומת 972 אמריקאית) — לא ישראלי
    "972-555-1234", "+44 20 7946 0958", "050-1234567, 052-7654321",
    "9.72501E+11", "97200501234567", "+972 0 0 501234567",
])
def test_non_israeli_or_garbage_rejected(raw):
    assert normalize_il_phone(raw) is None


def test_sms_sender_accepts_trunk_zero_format():
    assert il_mobile_intl("+972 (0)50-1234567") == "972501234567"
    assert is_il_mobile(normalize_il_phone("972-050-1234567"))


def _csv(phone: str, email: str = "") -> str:
    return ("מספר מסמך,שם לקוח,טלפון,מייל,סכום,תאריך,תאריך לתשלום\n"
            f"1,דנה כהן,{phone},{email},100,2026-09-01,2026-10-01\n")


@pytest.mark.parametrize("cell,norm", [
    ("501234567", "972501234567"),
    ("501234567.0", "972501234567"),
    ("31234567", "97231234567"),
    ("972501234567", "972501234567"),
    ("972501234567.0", "972501234567"),
    ("771234567", "972771234567"),
])
def test_csv_excel_numeric_phone_restored(cell, norm):
    r = csv_import.parse(_csv(cell))
    assert not r.errors
    assert normalize_il_phone(r.invoices[0].client_phone) == norm


@pytest.mark.parametrize("cell", ["123456789", "61234567", "1234567"])
def test_csv_numeric_non_phone_not_guessed(cell):
    """לא מנחשים: 9 ספרות שלא מתחילות ב-5/7 (למשל ת״ז) לא הופכות לטלפון."""
    r = csv_import.parse(_csv(cell))
    assert not r.invoices and r.errors and "טלפון" in r.errors[0]["error"]


def test_csv_unreachable_row_is_visible_error():
    r = csv_import.parse(_csv("לא ידוע"))
    assert not r.invoices
    assert r.errors[0]["row"] == 2 and "טלפון לא מזוהה" in r.errors[0]["error"]


def test_csv_bad_phone_with_valid_email_still_imported():
    r = csv_import.parse(_csv("לא ידוע", "dana@example.com"))
    assert not r.errors and r.invoices[0].client_email == "dana@example.com"


def test_csv_trunk_zero_phone_reaches_sms(svc):
    """מקצה לקצה: '+972 (0)50…' ב-CSV ⇒ הלקוח במסד מזוהה כנייד (ערוץ SMS זמין)."""
    svc.import_csv(_csv("+972 (0)50-1234567").encode())
    [c] = svc.db.q("SELECT phone FROM customers")
    assert is_il_mobile(normalize_il_phone(c["phone"]))
