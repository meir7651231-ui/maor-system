"""critic סבב 129 · באג: מפתח האידמפוטנטיות של מייל נכנס **בלי message_id** = sha256(sender|text) — הנושא לא
נכלל. מאז סבב 125 הנושא משמש כשהגוף ריק, אז שני מיילים שונים בגוף ריק («שילמתי» ואז «הסר» בשורת הנושא)
⇒ אותו מפתח ⇒ השני «duplicate» ⇒ **ההסרה נבלעה**. התיקון: הנושא נכנס למפתח (רק כשקיים — מפתח של מייל בלי
נושא ביט-זהה לקודם)."""
import hashlib

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN
from tests.test_flow import first_cycle


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _post(api, subject, text=""):
    return api.post("/webhooks/email?k=ewk-test",
                    json={"sender": "C1@Example.com", "text": text, "subject": subject}).json()


def test_two_subject_only_mails_without_message_id_both_processed(api, svc):
    first_cycle(api)
    assert _post(api, "שילמתי אתמול").get("intent") == "paid_claim"
    r = _post(api, "הסר")
    assert r.get("duplicate") is not True, r
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 1


def test_true_retry_still_duplicate(api, svc):
    first_cycle(api)
    _post(api, "הסר")
    assert _post(api, "הסר").get("duplicate") is True


def test_key_without_subject_unchanged(svc):
    """מייל בלי נושא ⇒ אותו מפתח כמו לפני השינוי (ניסיון חוזר של הספק אחרי פריסה עדיין מזוהה)."""
    svc.email_webhook("c1@example.com", "שילמתי", "")
    key = "mail:" + hashlib.sha256("c1@example.com|שילמתי".encode()).hexdigest()
    assert svc.db.one("SELECT 1 FROM messages WHERE message_id=?", (key,))
