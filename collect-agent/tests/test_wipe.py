"""מחיקה מלאה בסוף בטא (שער 8): אין PII אחרי, suppressions ו-audit נשארים, נכשל סגור."""
from __future__ import annotations

import sqlite3

from app.db import DB
from app.wipe import main, wipe_all


def _seed(path):
    db = DB(str(path))
    db.x("INSERT INTO customers(name,phone,email) VALUES('דנה כהן','050-0001234','a@example.com')")
    db.x("INSERT INTO business_settings(key,value,updated_at) VALUES('biz','סטודיו שמיר','t')")
    db.x("INSERT INTO suppressions(hash,channel,reason,created_at) VALUES('h1','sms','stop','t')")
    db.x("INSERT INTO audit(at,actor,action,detail) VALUES('t','owner','x',NULL)")
    db.conn.close()


def test_wipe_removes_pii_keeps_suppressions_and_audit(tmp_path):
    p = tmp_path / "live.db"
    _seed(p)
    conn = sqlite3.connect(p)
    counts = wipe_all(conn)
    assert counts["customers"] == 1 and counts["business_settings"] == 1
    assert conn.execute("SELECT COUNT(*) FROM customers").fetchone()[0] == 0
    assert conn.execute("SELECT COUNT(*) FROM suppressions").fetchone()[0] == 1
    acts = [r[0] for r in conn.execute("SELECT action FROM audit ORDER BY id")]
    assert acts == ["x", "business_wipe"]
    conn.close()
    raw = p.read_bytes()
    assert "דנה".encode() not in raw and b"050-0001234" not in raw
    assert "סטודיו".encode() not in raw


def test_cli_requires_confirmation(tmp_path):
    p = tmp_path / "live.db"
    _seed(p)
    assert main(["wipe", str(p)]) == 2
    assert main(["wipe", str(p), "--confirm", "yes"]) == 2
    assert main(["wipe", str(tmp_path / "nope.db"), "--confirm", "WIPE"]) == 1
    assert sqlite3.connect(p).execute("SELECT COUNT(*) FROM customers").fetchone()[0] == 1
    assert main(["wipe", str(p), "--confirm", "WIPE"]) == 0
    assert sqlite3.connect(p).execute("SELECT COUNT(*) FROM customers").fetchone()[0] == 0


def test_wipe_leaves_no_employee_identity_in_append_only_logs(clock, gi_client):
    """critic סבב 10 (שוחזר על 2625071): אחרי app.wipe לא נשאר מידע של חייבים, אבל **המייל של העובדת**
    נשאר ב-audit וב-access_log (הוספה-בלבד, טריגרים), בניגוד ל-«תוכן ללא PII» ב-docstring.
    עכשיו היומנים רושמים user:<id>, והמיפוי נמחק עם users."""
    from fastapi.testclient import TestClient

    from app import totp
    from app.config import load_settings
    from app.db import DB
    from app.main import create_app
    from app.service import CollectService
    from app.users import Users
    from app.wipe import wipe_all
    from tests.conftest import OWNER_TOKEN
    s = load_settings({"PAYMENT_LINK": "https://www.greeninvoice.co.il/pay/x"})
    svc = CollectService(s, DB(":memory:"), gi=gi_client, clock=clock)
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    reg = Users(svc.db, svc.clock).create("yael.worker@studio.example", "יעל", "correct-horse-1")
    code = totp.code_at(reg["totp_secret"], clock.now.timestamp())
    tok = api.post("/auth/login", json={"email": "yael.worker@studio.example",
                                        "password": "correct-horse-1", "code": code}).json()["token"]
    h = {"Authorization": f"Bearer {tok}"}
    api.post("/sync", headers=h)
    api.post("/plan", headers=h)
    api.get("/dashboard", headers=h)
    rid = svc.db.one("SELECT id FROM reminders")["id"]
    api.post(f"/reminders/{rid}/approve", headers=h)
    wipe_all(svc.db.conn)
    dump = "\n".join(svc.db.conn.iterdump())
    assert "yael.worker" not in dump and "studio.example" not in dump
    assert svc.db.one("SELECT COUNT(*) c FROM audit WHERE actor LIKE 'user:%'")["c"] >= 1   # ראיה נשמרת
