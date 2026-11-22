"""מנהל 375 (חיבורים «הבא» מ-372/374): עמודת «סטטוס» עם קוד מספרי (0/1/2/4 — כמו קודי-המסמך של morning
ומערכות שמייצאות קוד במקום מילה). קודם: קוד לא מוכר ⇒ נקלט כחוב פתוח בשקט ⇒ חשבונית שסומנה «1» (סגורה)
או «4» (מבוטלת) מקבלת תזכורת 🟠. לא מנחשים מה הקוד אומר (כל מערכת ממספרת אחרת, ו-374 הפך «סגור» לפעולה
שסוגרת חוב אמיתי) ⇒ שורה עם סכום חיובי וסטטוס-קוד = שגיאה גלויה. סכום 0 ⇒ עדיין נסגר (הסכום הוא האמת).
זיכוי (שלילי) ⇒ ממשיך לבדיקת זיכוי. קוד לא סוגר אף חשבונית קיימת."""
from dataclasses import replace
from datetime import timedelta

import pytest

from app.csv_import import STATUS_CODE_MSG, parse

H = "מספר מסמך,לקוח,טלפון,סכום,סטטוס\n"
HB = "מספר מסמך,לקוח,טלפון,יתרה לתשלום,סטטוס\n"


@pytest.mark.parametrize(("code", "want"), [("0", "0"), ("1", "1"), ("2", "2"), ("3", "3"), ("4", "4"),
                                             ("1.0", "1.0"), (" 2 ", "2"), ("«1»", "1"), ("10", "10"), ("100", "100")])
@pytest.mark.parametrize("head", [H, HB])
def test_numeric_status_code_rejected_visibly(head, code, want):
    r = parse(head + f"1001,דנה,0501234567,1200,{code}\n")
    assert r.invoices == [] and r.closed == []
    assert len(r.errors) == 1 and r.errors[0]["error"] == STATUS_CODE_MSG.format(want)


@pytest.mark.parametrize("code", ["1", "4"])
def test_zero_amount_with_code_still_closes(code):
    r = parse(H + f"1001,דנה,0501234567,0,{code}\n")
    assert r.closed == ["1001"] and r.errors == []


def test_credit_with_code_goes_to_review():
    r = parse(H + "1001,דנה,0501234567,-300,2\n")
    assert len(r.credits) == 1 and r.errors == []


@pytest.mark.parametrize("status", ["", "פתוח", "open", "שולם חלקית", "Open 2", "A1", "1-א"])
def test_word_statuses_unchanged(status):
    r = parse(HB + f"1001,דנה,0501234567,1200,{status}\n")
    assert len(r.invoices) == 1 and r.errors == []


@pytest.mark.parametrize("status", ["שולם", "Paid", "מבוטל"])
def test_closed_words_still_close(status):
    r = parse(H + f"1001,דנה,0501234567,1200,{status}\n")
    assert r.closed == ["1001"] and r.errors == []


def test_numeric_code_does_not_close_existing_invoice(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    assert svc.import_csv((H + "7001,רוני,0541112222,500,פתוח\n").encode())["imported"] == 1
    clock.now += timedelta(days=1)
    r = svc.import_csv((H + "7001,רוני,0541112222,500,1\n").encode())
    assert r["closed"] == 0 and r["imported"] == 0 and len(r["errors"]) == 1
    assert svc.db.one("SELECT status FROM invoices WHERE number='7001'")["status"] == "open"
