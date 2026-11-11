"""הפעלה 113: מטבע מקלט חיצוני.
ה-CSV שמר את תא המטבע כמו שהוא (`.upper()` בלבד), ו-GI/iCount לא נרמלו בכלל. לכן 'ש"ח' / 'NIS' /
'ils' / '₪' נשמרו כמטבעות שונים מ-ILS:
  • התזכורת לחייב הציגה 'ש"ח 1,200' / 'NIS 1,200' במקום '1,200 ₪'.
  • שתי חשבוניות של אותו לקוח (ILS + 'ש"ח') נחשבו «מטבעות שונים» ⇒ בקשת פריסה הגיעה לבעל העסק
    ככרטיס «מטבעות שונים» במקום הצעה רגילה.
  • טקסט חופשי בתא (קישור, שורה חדשה) נכנס כמו שהוא לגוף ה-SMS.
עכשיו: `parse_currency` אחד לכל המקורות. כינוי מוכר ⇒ קוד ISO · קוד של 3 אותיות ⇒ כמו שהוא ·
כל השאר ⇒ ValueError (CSV: השורה נדחית עם הודעה · API: המסמך מסומן פגום, critic 44)."""
from __future__ import annotations

import pytest

from app import csv_import
from app.greeninvoice import map_document
from app.integrations.base import parse_currency
from app.integrations.ezcount import map_ezcount_doc
from app.integrations.icount import map_icount_doc
from app.templates import fmt_amount


@pytest.mark.parametrize("raw,code", [
    (None, "ILS"), ("", "ILS"), ("  ", "ILS"), ("ILS", "ILS"), ("ils", "ILS"), ("NIS", "ILS"),
    ("nis", "ILS"), ("₪", "ILS"), ('ש"ח', "ILS"), ("ש״ח", "ILS"), ("שח", "ILS"), ("שקל", "ILS"),
    ("\u200fש\"ח", "ILS"), ("$", "USD"), ("usd", "USD"), ("US$", "USD"), ("דולר", "USD"),
    ("€", "EUR"), ("eur", "EUR"), ("יורו", "EUR"), ("£", "GBP"), ("chf", "CHF"),
])
def test_known_aliases_normalized(raw, code):
    assert parse_currency(raw) == code


@pytest.mark.parametrize("raw", ["https://evil.example/pay", "ILS\nשלמו כאן", "שקלים חדשים בערך",
                                 "IL", "ILSS", "12", "ש״ח!", 5, True, ["ILS"], "ÉUR"])
def test_unknown_currency_rejected(raw):
    with pytest.raises(ValueError):
        parse_currency(raw)


def _csv(cur_cells: list[str]) -> str:
    rows = "".join(f"{n},דנה כהן,050-1234567,100,2026-09-01,2026-10-01,{c}\n"
                   for n, c in enumerate(cur_cells, start=1))
    return "מספר מסמך,שם לקוח,טלפון,סכום,תאריך,תאריך לתשלום,מטבע\n" + rows


def test_csv_aliases_become_one_currency():
    r = csv_import.parse(_csv(['ש"ח', "NIS", "₪", "ils", ""]))
    assert not r.errors
    assert {i.currency for i in r.invoices} == {"ILS"}


def test_csv_free_text_currency_row_rejected_not_sent():
    r = csv_import.parse(_csv(["ILS", "https://evil.example/pay"]))
    assert [i.number for i in r.invoices] == ["1"]
    assert r.errors and r.errors[0]["row"] == 3 and "מטבע" in r.errors[0]["error"]


def test_reminder_amount_shows_shekel_sign_for_alias():
    [inv] = csv_import.parse(_csv(['ש"ח'])).invoices
    assert fmt_amount(inv.amount_agorot, inv.currency) == "100 ₪"
    assert fmt_amount(120000, "GBP") == "£1,200"


def test_csv_alias_and_ils_same_customer_not_mixed(svc):
    """ILS + 'ש"ח' לאותו לקוח ⇒ מטבע אחד במסד (קודם: «מטבעות שונים» ⇒ אין הצעת פריסה)."""
    svc.import_csv(_csv(["ILS", 'ש"ח']).encode())
    assert {r["currency"] for r in svc.db.q("SELECT currency FROM invoices")} == {"ILS"}


def _gi_doc(cur):
    return {"id": "d1", "number": "1", "type": 305, "status": 0, "amount": "100", "currency": cur,
            "documentDate": "2026-09-01", "dueDate": "2026-10-01",
            "client": {"id": "c1", "name": "דנה", "phone": "0501234567"}}


def test_api_sources_normalize_currency():
    assert map_document(_gi_doc("ils")).currency == "ILS"
    assert map_document(_gi_doc(None)).currency == "ILS"
    ic = {"doc_id": "9", "docnum": "9", "doctype": "invoice", "client_id": "1", "client_name": "א",
          "dateissued": "2026-09-01", "duedate": "2026-10-01", "currency_code": "nis",
          "totalwithvat": "100", "remainingsum": "100"}
    assert map_icount_doc(ic).currency == "ILS"
    ez = {"doc_uuid": "u1", "doc_number": "1", "doc_type": 305, "date": "2026-09-01",
          "pay_until": "2026-10-01", "main_currency_iso": "usd", "price_total": 100, "balance": 100}
    assert map_ezcount_doc(ez).currency == "USD"


def test_api_unknown_currency_is_malformed_not_sent():
    with pytest.raises(ValueError):
        map_document(_gi_doc("http://x"))
