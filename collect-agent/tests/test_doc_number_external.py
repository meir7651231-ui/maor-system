"""הפעלה 116 — מספר חשבונית מקלט חיצוני (CSV/API) מול גוף ה-SMS/המייל ומפתח המסמך.

באגים שנמצאו (בדיקה דרך fields/render ודרך /import/csv ⇒ /plan ⇒ /dispatch):
- מספר "None" / "null" / "-" ⇒ «חשבונית None ע"ס…» לחייב.
- מספר ריק (GI number=null) ⇒ «חשבונית  ע"ס» (רווח כפול) ב-SMS, בנושא ובמייל.
- קישור/דומיין בשדה המספר ("http://evil.co/x") נכנס כמו שהוא לגוף ה-SMS ⇒ קישור שני לא שלנו.
- Excel: "1234.0" נשמר כמספר אחר מ-"1234" ⇒ מפתח `csv:1234.0` לא מתאחד עם ה-API ⇒ שתי תזכורות.
- RLM/רווח כפול בתא המספר ⇒ אותו מסמך פוצל לשני חובות.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.csv_import import parse as parse_csv
from app.greeninvoice import Invoice, map_document
from app.main import create_app
from app.security import clean_doc_number
from app.templates import STEPS, STEPS_MULTI, fields, fields_multi, render_email, render_sms
from tests.conftest import AUTH, OWNER_TOKEN, gi_doc


@pytest.mark.parametrize("raw,clean", [
    ("1234", "1234"),
    ("  1234 ", "1234"),
    ("1234.0", "1234"),
    ("1234.00", "1234"),
    (1234, "1234"),
    (1234.0, "1234"),
    ("12\u200f34", "1234"),
    ("INV  2026\n-17", "INV 2026 -17"),
    ("חש-55", "חש-55"),
    ("0012", "0012"),
    ("1234.5", "1234.5"),
])
def test_clean_keeps_real_numbers(raw, clean):
    assert clean_doc_number(raw) == clean


@pytest.mark.parametrize("raw", [None, "", "  ", "None", "null", "NaN", "-", "--", "N/A", "0",
                                 "http://evil.co/x", "www.pay-here.com", "evil.co.il/pay", "a@b.co",
                                 "...", True, "\u200f"])
def test_placeholder_or_link_numbers_become_empty(raw):
    assert clean_doc_number(raw) == ""


def _f(num):
    return fields(biz="עסק", name="דוד כהן", num=num, amount_agorot=120000, currency="ILS",
                  link="https://gabi.example/p/x", unsub="https://gabi.example/u/x")


@pytest.mark.parametrize("num", [None, "", "None", "-", "http://evil.co/x", "www.pay-here.com"])
def test_bad_number_not_in_sms_subject_or_email(num):
    for step in STEPS:
        f = _f(num or "")
        sms = render_sms(step, f)
        subj, text, html = render_email(step, f)
        for out in (sms, subj, text, html):
            assert "None" not in out and "evil" not in out and "pay-here" not in out
            assert "חשבונית  " not in out and "לחשבונית  " not in out   # בלי רווח כפול


def test_excel_float_number_shown_clean():
    assert "חשבונית 1234 " in render_sms(STEPS[0], _f("1234.0"))


def test_multi_skips_empty_numbers():
    f = fields_multi(biz="עסק", name="דוד", invoices=[("None", 100), ("17", 200), ("", 300)],
                     currency="ILS", link="https://l/x", unsub="u")
    assert f["nums"] == "17"
    assert ", ," not in render_sms(STEPS_MULTI[0], f) and "None" not in f["lines"]
    f2 = fields_multi(biz="עסק", name="דוד", invoices=[("None", 100), ("-", 200)],
                      currency="ILS", link="https://l/x", unsub="u")
    assert "חשבוניות  " not in render_sms(STEPS_MULTI[0], f2)


def test_invoice_dataclass_cleans_number_for_every_source():
    inv = Invoice(external_id="x:1", number="1234.0", doc_type=305, amount_agorot=1, currency="ILS",
                  issued=None, due=None, client_external_id="", client_name="", client_phone="",
                  client_email="")
    assert inv.number == "1234"


def test_gi_null_number_maps_to_empty():
    d = gi_doc(1)
    d["number"] = None
    assert map_document(d).number == ""


_HDR = "מספר מסמך,שם לקוח,טלפון,סכום,תאריך,תאריך לתשלום\n"


def test_csv_excel_float_and_plain_are_same_document():
    res = parse_csv((_HDR + "1234.0,דוד,050-1234567,100,2026-09-01,2026-09-02\n"
                     "1234,דוד,050-1234567,100,2026-09-01,2026-09-02\n").encode())
    assert [i.external_id for i in res.invoices] == ["csv:1234"]
    assert len(res.errors) == 1 and "כפול" in res.errors[0]["error"]


def test_csv_bidi_number_same_key():
    res = parse_csv((_HDR + "12\u200f34,דוד,050-1234567,100,2026-09-01,2026-09-02\n").encode())
    assert res.invoices[0].external_id == "csv:1234"


@pytest.mark.parametrize("bad", ["None", "-", "http://evil.co/x", "x" * 70])
def test_csv_bad_number_rejected_visibly(bad):
    res = parse_csv((_HDR + f"{bad},דוד,050-1234567,100,2026-09-01,2026-09-02\n").encode())
    assert not res.invoices and len(res.errors) == 1
    assert "מספר מסמך" in res.errors[0]["error"]


def test_csv_end_to_end_sms_has_clean_number(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    csv = _HDR + "1234.0,דוד כהן,050-1234567,100,2026-09-01,2026-09-02\n"
    assert api.post("/import/csv", content=csv.encode()).json()["imported"] == 1
    for i in api.post("/plan").json()["created"]:
        api.post(f"/reminders/{i}/approve", json={"confirm_open": True})
    api.post("/dispatch")
    [m] = svc.sender.sent
    assert "חשבונית 1234 " in m["body"] and "1234.0" not in m["body"]


def test_multi_reminder_with_unnamed_invoice_does_not_misattribute_total():
    """critic סבב 46: אחרי הפעלה 116 מספר ריק נשמט מהרשימה ⇒ SMS מאוחד «חשבוניות 1002 (סה"כ 1,200 ₪)»
    כש-1002 היא 200 ₪ והשאר (1,000 ₪) בלי מספר ⇒ נראה שחשבונית 1002 היא 1,200 ₪. ובמייל «• חשבונית  —».
    עכשיו: חסר מספר ⇒ נוסח הספירה («2 חשבוניות, סה״כ») ובשורות «ללא מספר»."""
    from app import templates as t
    fm = t.fields_multi(biz="סטודיו", name="דנה", invoices=[("None", 100000), ("1002", 20000)],
                        currency="ILS", link="https://x/p/a", unsub="https://x/u/b")
    sms = t.render_sms(t.STEPS_MULTI[0], fm)
    assert "1002 (" not in sms and "2 חשבוניות" in sms and "1,200" in sms
    assert "• חשבונית  —" not in fm["lines"] and "ללא מספר" in fm["lines"]
