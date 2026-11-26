"""מנהל 429 (מבקר 259🟡): TERMS §9 / DPA 4.3 מבטיחים «30 יום לייצוא» ו«היומן מיוצא לעסק לפני המחיקה».
נוסף: `GET /audit?all=1` (היומן המלא) ו-`GET /export` (כל נתוני העסק) — בעל העסק בלבד, עובד/ת ⇒ 403 + audit;
כל ייצוא נרשם ביומן. בלי סודות/טוקנים/גיבובי הסרה/פרטי צד שלישי."""
import json

from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN
from tests.test_staff_owner_only_qa import _api


def _probe(svc, n=350):
    for i in range(n):
        svc.audit("system", "probe", {"i": i})


def test_owner_full_audit_all_rows_and_logged(svc):
    _probe(svc)
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    before = svc.db.one("SELECT COUNT(*) n FROM audit")["n"]
    rows = api.get("/audit?all=1", headers=AUTH).json()
    assert len(rows) == before and rows[0]["id"] > rows[-1]["id"]          # מלא, החדש ראשון
    assert len(api.get("/audit", headers=AUTH).json()) == 200               # ברירת המחדל לא השתנתה
    a = svc.db.one("SELECT detail FROM audit WHERE action='audit_export'")
    assert a and json.loads(a["detail"])["rows"] == before


def test_business_export_contents_without_secrets(svc):
    svc.sync()
    _probe(svc, 250)
    svc.db.x("UPDATE customers SET unsub_token='SECRET-TOK', blocked_phone='0529999999' WHERE id=1")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    r = api.get("/export", headers=AUTH)
    assert r.status_code == 200
    d = r.json()
    n_audit = svc.db.one("SELECT COUNT(*) n FROM audit WHERE action != 'business_export'")["n"]
    assert len(d["audit"]) == n_audit > 250                                 # היומן המלא, לא 200
    assert len(d["customers"]) == svc.db.one("SELECT COUNT(*) n FROM customers")["n"] > 0
    assert len(d["invoices"]) == svc.db.one("SELECT COUNT(*) n FROM invoices")["n"] > 0
    for k in ("reminders", "messages", "plans", "drafts", "dsr", "business_settings", "access_log"):
        assert isinstance(d[k], list), k
    text = r.text
    assert "SECRET-TOK" not in text and "0529999999" not in text            # טוקן הסרה / צד שלישי
    assert all("unsub_token" not in c and "blocked_phone" not in c for c in d["customers"])
    assert all("payload" not in m for m in d["messages"]) and all("payload" not in x for x in d["reminders"])
    assert not {"users", "link_tokens", "suppressions", "orbit_links"} & set(d)
    a = svc.db.one("SELECT actor, detail FROM audit WHERE action='business_export'")
    assert a and json.loads(a["detail"])["invoices"] == len(d["invoices"])


def test_staff_refused_full_audit_and_business_export(svc, clock, monkeypatch):
    api, h = _api(svc, clock, monkeypatch)
    assert api.get("/audit?all=1", headers=h["staff"]).status_code == 403
    assert api.get("/export", headers=h["staff"]).status_code == 403
    for act in ("audit_export_refused", "business_export_refused"):
        a = svc.db.one("SELECT actor FROM audit WHERE action=?", (act,))
        assert a and a["actor"] != "owner", act
    assert len(api.get("/audit", headers=h["staff"]).json()) <= 200       # הצפייה הרגילה נשארת לעובד/ת
    assert api.get("/export", headers=h["owner"]).status_code == 200
    assert api.get("/audit?all=1", headers=h["owner"]).status_code == 200
    assert not svc.db.one("SELECT 1 FROM audit WHERE action='business_export' AND actor='owner'")  # השחקן האמיתי


def test_export_is_pii_read_logged(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    api.get("/export", headers=AUTH)
    assert svc.db.one("SELECT 1 FROM access_log WHERE route='/export'")
