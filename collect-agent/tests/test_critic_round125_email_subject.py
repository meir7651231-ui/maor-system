"""critic סבב 125 · פער בערוץ המייל: נושא המייל לא מגיע לשירות בכלל (EmailIn = from/text/message_id).
לקוח שכתב «הסר» / «שילמתי» בשורת הנושא עם גוף ריק (או גוף שהוא רק ציטוט) ⇒ `strip_reply` מחזיר ""
⇒ `{"ignored": True}` — **ההסרה נבלעת בשקט** (בלי עצירה, בלי כרטיס לבעל העסק), והתזכורות ממשיכות.
התיקון: שדה `subject` אופציונלי. משמש **רק** כשהגוף ריק אחרי הסרת הציטוט; קידומות Re:/Fwd:/השב: ושם העסק
מוסרים; אם הנושא לא אומר כלום (unknown) — כמו קודם, מתעלמים. גוף קיים ⇒ הנושא לא משנה דבר."""
import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN
from tests.test_flow import first_cycle


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _post(api, subject, text="", mid="<s1@mail>"):
    body = {"sender": "Dana Cohen <C1@Example.com>", "message_id": mid, "text": text, "subject": subject}
    return api.post("/webhooks/email?k=ewk-test", json=body).json()


def test_subject_only_opt_out_is_honored(api, svc):
    first_cycle(api)
    r = _post(api, "הסר")
    assert r.get("intent") == "opt_out", r
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 1


def test_subject_with_reply_prefix_and_quote_only_body(api, svc):
    first_cycle(api)
    r = _post(api, "Re: RE: הסר", text="\n\nOn Sun wrote:\n> שלום, נשמח לתשלום")
    assert r.get("intent") == "opt_out", r


def test_subject_paid_claim(api, svc):
    first_cycle(api)
    assert _post(api, "שילמתי אתמול").get("intent") == "paid_claim"


def test_empty_reply_to_our_subject_still_ignored(api, svc):
    """«Re: תשובה מ-<העסק>» עם גוף ריק — אין מה לסווג ⇒ כמו קודם."""
    first_cycle(api)
    r = _post(api, f"Re: תשובה מ-{svc.s.business_name}")
    assert r.get("ignored") is True, r


def test_subject_ignored_when_body_present(api, svc):
    first_cycle(api)
    r = _post(api, "Re: הסר", text="שילמתי בהעברה")
    assert r.get("intent") == "paid_claim", r
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 0


def test_old_payload_without_subject_still_works(api, svc):
    first_cycle(api)
    r = api.post("/webhooks/email?k=ewk-test", json={"sender": "C1@Example.com", "message_id": "<o@m>",
                                                     "text": "שילמתי"}).json()
    assert r.get("intent") == "paid_claim", r
