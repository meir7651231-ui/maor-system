"""הפעלה 117 — מייל לקוח מקלט חיצוני (CSV/GI/iCount/EZcount/רווחית) מול הנמען בפועל, מפתח הלקוח וההסרה.

באגים שנמצאו (בדיקה דרך clean/valid ודרך /import/csv ⇒ /plan ⇒ /dispatch):
- "mailto:dan@x.com" / "<dan@x.com>" / "dan@x.com\\u200f" עברו את valid_email ⇒ המייל נשלח לכתובת שלא קיימת.
- " dan@x.com " (רווח בתא) / "דן כהן <dan@x.com>" / "dan@x.com; ruth@y.com" ⇒ valid_email=False ⇒ החייב «בלי מייל»
  בשקט (ובלי טלפון נייד — אף תזכורת לא יצאה; ב-CSV השורה נדחתה «אין מייל תקין»).
- "Dan@Example.COM" מול "dan@example.com" ⇒ שתי כתובות שונות במסד ⇒ חסימת «מספר שגוי» (blocked_email,
  השוואה תלוית-רישיות) חזרה אחרי סנכרון.
- מי שביקש הסרה במייל קיבל שוב תזכורת כשאותה כתובת הגיעה עם "mailto:"/RLM (מפתח-הסרה אחר).
- GI emails=["", "real@x.com"] ⇒ נלקח emails[0] הריק ⇒ החייב «בלי מייל».
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.contact import clean_email, valid_email
from app.csv_import import parse as parse_csv
from app.greeninvoice import Invoice, map_document
from app.main import create_app
from app.service import CollectService
from tests.conftest import AUTH, OWNER_TOKEN, gi_doc


@pytest.mark.parametrize("raw,clean", [
    ("dan@example.com", "dan@example.com"),
    ("Dan@Example.COM", "dan@example.com"),
    ("  dan@example.com ", "dan@example.com"),
    ("mailto:dan@example.com", "dan@example.com"),
    ("MAILTO:Dan@example.com?subject=hi", "dan@example.com"),
    ("<dan@example.com>", "dan@example.com"),
    ("דן כהן <dan@example.com>", "dan@example.com"),
    ('"Dan" <dan@example.com>', "dan@example.com"),
    ("dan@example.com; ruth@example.com", "dan@example.com"),
    ("dan@example.com,ruth@example.com", "dan@example.com"),
    ("dan@example.com / ruth@example.com", "dan@example.com"),
    ("dan@example.com\u200f", "dan@example.com"),
    ("\u202bdan@example.com\u202c", "dan@example.com"),
    ("dan\u200b@example.com", "dan@example.com"),
    ("dan\uff20example.com", "dan@example.com"),
    ("dan@example.com.", "dan@example.com"),
    ("(dan@example.com)", "dan@example.com"),
    ("dan.cohen+bills@mail.co.il", "dan.cohen+bills@mail.co.il"),
    (["", "None", "b@example.co.il"], "b@example.co.il"),
    (("X@Y.co",), "x@y.co"),
])
def test_clean_email_extracts_one_address(raw, clean):
    assert clean_email(raw) == clean


@pytest.mark.parametrize("raw", [None, True, "", "  ", "None", "null", "-", "אין", "dan",
                                 "dan@", "@example.com", "dan@example", "dan@ex ample.com",
                                 "a..b@example.com", ".a@example.com", "a@.example.com",
                                 "a@example..com", [], [None, ""], "050-1234567"])
def test_clean_email_rejects_non_addresses(raw):
    assert clean_email(raw) == ""


@pytest.mark.parametrize("bad", ["mailto:dan@example.com", "<dan@example.com>",
                                 "dan@example.com\u200f", "a,b@example.com", "a;b@example.com",
                                 "a..b@example.com", "a@example.com.", "a@-example.com"])
def test_valid_email_rejects_structural_junk(bad):
    """הכתובת שנשלחת לספק חייבת להיות כתובת אמיתית — לא "תקינה" לפי regex רופף."""
    assert not valid_email(bad)


def test_valid_email_still_accepts_plain():
    for ok in ("a@b.co", "x@y.z", "dan.cohen+x@mail.co.il", "owner@studio.example"):
        assert valid_email(ok)


def test_invoice_dataclass_cleans_email_for_every_source():
    inv = Invoice(external_id="x:1", number="1", doc_type=305, amount_agorot=1, currency="ILS",
                  issued=None, due=None, client_external_id="", client_name="", client_phone="",
                  client_email=" mailto:Dan@Example.COM ")
    assert inv.client_email == "dan@example.com"
    assert CollectService.customer_key(inv) == "email:dan@example.com"


def test_gi_takes_first_valid_email_not_blind_first():
    d = gi_doc(1)
    d["client"]["emails"] = ["", "None", "Real@Example.com"]
    assert map_document(d).client_email == "real@example.com"
    d["client"]["emails"] = "Solo@Example.com"   # מחרוזת במקום רשימה
    assert map_document(d).client_email == "solo@example.com"
    d["client"]["emails"] = None
    assert map_document(d).client_email == ""


_HDR = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,תאריך,תאריך לתשלום\n"


@pytest.mark.parametrize("cell", ['" dan@example.com "', '"דן כהן <dan@example.com>"',
                                  '"dan@example.com; ruth@example.com"', "mailto:Dan@Example.com"])
def test_csv_reachable_by_email_is_not_rejected(cell):
    """נייח (אין SMS) + מייל בפורמט נפוץ ⇒ קודם: «טלפון לא מזוהה ואין מייל תקין» או נקלט «בלי מייל»."""
    res = parse_csv((_HDR + f"17,דן,abc,{cell},100,2026-09-01,2026-09-02\n").encode())
    assert not res.errors, res.errors
    assert res.invoices[0].client_email == "dan@example.com"


def _send_all(api, svc):
    for i in api.post("/plan").json()["created"]:
        api.post(f"/reminders/{i}/approve", json={"confirm_open": True})
    api.post("/dispatch")
    return [m for m in svc.sender.sent if m["channel"] == "email"]


def test_csv_end_to_end_email_goes_to_clean_address(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    csv = _HDR + '17,דן כהן,03-1234567,"דן כהן <Dan@Example.COM>",100,2026-09-01,2026-09-02\n'
    assert api.post("/import/csv", content=csv.encode()).json()["imported"] == 1
    [m] = _send_all(api, svc)
    assert m["to"] == "dan@example.com"


def test_unsubscribed_email_not_resurrected_by_format(svc):
    """מי שביקש הסרה ב-"dan@example.com" לא מקבל שוב כשהכתובת מגיעה עם mailto/RLM/רישיות."""
    svc.suppress("email", "dan@example.com", "unsubscribe")
    for variant in ("mailto:DAN@example.com", "dan@example.com\u200f", "<Dan@Example.com>"):
        assert svc.suppressed("email", variant), variant


def test_case_variants_are_one_customer_and_block_sticks(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    csv = (_HDR + "17,דן כהן,,Dan@Example.COM,100,2026-09-01,2026-09-02\n"
           "18,דן כהן,,dan@example.com,200,2026-09-01,2026-09-02\n")
    assert api.post("/import/csv", content=csv.encode()).json()["imported"] == 2
    rows = svc.db.q("SELECT email FROM customers")
    assert [r["email"] for r in rows] == ["dan@example.com"]
