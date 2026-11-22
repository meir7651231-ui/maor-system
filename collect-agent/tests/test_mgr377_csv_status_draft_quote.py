"""מנהל 377 (חיבורים «הבא» מ-375/376): עמודת «סטטוס» עם «טיוטה» / «הצעת מחיר» / «Draft» / «Quote» / «Estimate».
קודם: נקלט כחוב פתוח ⇒ תזכורת «טרם שולמה» על הצעת מחיר שהלקוח מעולם לא אישר 🟠 (אומת על הקוד הקודם).
עכשיו: שגיאה גלויה בכל סכום (גם 0 — טיוטה לא סוגרת חשבונית קיימת באותו מספר). «חשבון עסקה»/«Proforma» —
דרישת תשלום לכל דבר ⇒ ללא שינוי. מילים דומות («Drafting»? «quotes»? «estimated») — לא נתפסות."""
from dataclasses import replace
from datetime import timedelta

import pytest

from app.csv_import import DRAFT_MSG, parse

H = "מספר מסמך,לקוח,טלפון,סכום,סטטוס\n"
HB = "מספר מסמך,לקוח,טלפון,יתרה לתשלום,סטטוס\n"

DRAFTS = ["טיוטה", "טיוטא", "  טיוטה ", "«טיוטה»", "טיוטה - לא נשלחה", "הצעת מחיר", "הצעת-מחיר", "הצ\"מ", "הצ״מ",
          "Draft", "DRAFT", "draft.", "Drafted", "Quote", "Quotation", "Estimate", "Price Quote", "Draft invoice"]


@pytest.mark.parametrize("status", DRAFTS)
@pytest.mark.parametrize("head", [H, HB])
def test_draft_or_quote_rejected_visibly(head, status):
    r = parse(head + f"1001,דנה,0501234567,1200,{status}\n")
    assert r.invoices == [] and r.closed == [] and r.credits == []
    assert len(r.errors) == 1 and r.errors[0]["error"] == DRAFT_MSG.format(status.strip()[:30])


@pytest.mark.parametrize("amount", ["0", "-300"])
def test_draft_zero_or_negative_neither_closes_nor_credits(amount):
    r = parse(H + f"1001,דנה,0501234567,{amount},טיוטה\n")
    assert r.closed == [] and r.credits == [] and len(r.errors) == 1


@pytest.mark.parametrize("status", ["", "פתוח", "open", "חשבון עסקה", "Proforma", "estimated", "Unquoted",
                                    "הצעה לפריסה", "באיחור", "Overdue"])
def test_other_statuses_unchanged(status):
    r = parse(HB + f"1001,דנה,0501234567,1200,{status}\n")
    assert len(r.invoices) == 1 and r.errors == []


def test_other_rows_in_file_still_imported():
    r = parse(H + "1001,דנה,0501234567,1200,טיוטה\n1002,רוני,0541112222,500,פתוח\n")
    assert [i.number for i in r.invoices] == ["1002"] and len(r.errors) == 1 and r.errors[0]["row"] == 2


def test_draft_does_not_close_existing_invoice(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    assert svc.import_csv((H + "7001,רוני,0541112222,500,פתוח\n").encode())["imported"] == 1
    clock.now += timedelta(days=1)
    r = svc.import_csv((H + "7001,רוני,0541112222,0,טיוטה\n").encode())
    assert r["closed"] == 0 and r["imported"] == 0 and len(r["errors"]) == 1
    assert svc.db.one("SELECT status FROM invoices WHERE number='7001'")["status"] == "open"


def test_draft_only_file_imports_nothing(svc):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    r = svc.import_csv((H + "8001,רוני,0541112222,500,Draft\n").encode())
    assert r["imported"] == 0 and len(r["errors"]) == 1
    assert svc.db.one("SELECT COUNT(*) n FROM invoices")["n"] == 0
