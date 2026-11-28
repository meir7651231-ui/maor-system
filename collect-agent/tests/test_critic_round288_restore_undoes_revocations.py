"""מבקר סבב 288: שחזור מגיבוי מבטל **שלילות הרשאה** שנעשו אחרי הגיבוי.

✓ אימות 287 (מנהל 465): אחרי שחזור הזכאות «unverified» ⇒ לא פעיל עד זכאות טרייה; זכאות חדשה מתקבלת ✓.
288א (🟠, גבי מנוע) [מאומת] — מצב אבטחה שחי רק ב-DB חוזר לאחור:
  · עובדת שהושבתה אחרי הגיבוי (`Users.deactivate_id`) ⇒ שחזור ⇒ `POST /auth/login` (סיסמה+TOTP) = 200
    ו-/dashboard = 200 — גישה מלאה למידע אישי של הלקוחות. עצירת השחזור חוסמת **שליחה**, לא כניסה,
    והודעת העצירה לא מזכירה משתמשים.
  · סוד-המסירה של אורביט שהוחלף אחרי הגיבוי (רוטציה = דליפה) ⇒ שחזור ⇒ טוקן שנחתם בסוד **הישן** מתקבל שוב.
288ב (🟡, גבי מנוע) [מאומת] — טוקן זכאות `active` שנלכד **לפני** הביטול (iat לפני השחזור, בתוך חלון ה-300 שנ׳) מתקבל
  אחרי השחזור ⇒ המנוי חוזר ל-active. `restore_floor` (465) לא חוסם iat שקדם לשחזור.
מצופה: בשחזור — שלילות מאז הגיבוי לא חוזרות (יומן שלילות מחוץ ל-DB כמו OPTOUT_LEDGER, או כל המשתמשים/הסודות «נדרש אישור
מחדש» עד שבעל העסק מאשר), והודעת העצירה מזכירה זאת; זכאות עם iat קודם לשחזור נדחית.
רכיב: app/backup.py → restore_backup · app/restore_guard.py · app/users.py · app/orbit_connect.py ·
app/orbit_entitlement.py.
"""
from __future__ import annotations

from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app import orbit_entitlement as oe
from app import restore_guard, totp
from app.backup import create_backup, restore_backup
from app.db import DB
from app.main import create_app
from app.orbit_connect import HandoffRejected, OrbitConnect, make_token
from app.secretbox import SecretBox, generate_key
from app.service import CollectService
from app.users import Users
from tests.conftest import OWNER_TOKEN
from tests.test_orbit_entitlement import ORG, _ent, keys  # noqa: F401
from tests.test_orbit_unlink_not_free import _link

PW = "correct-horse-battery-9"


def _restore(svc, clock, tmp_path, box, bk):
    return CollectService(svc.s, DB(str(restore_backup(bk, tmp_path / "r.db", box))), gi=svc.gi, clock=clock)


def _staff_login_after_restore(svc, clock, tmp_path, monkeypatch, deactivate: bool):
    box = SecretBox.from_spec(f"k1:{generate_key()}")
    u = Users(svc.db, svc.clock)
    u.create("owner@s.example", "בעלים", PW)
    reg = u.create("fired@s.example", "עובדת", PW)
    bk = create_backup(svc.db.conn, tmp_path / "b.gbk", box)
    clock.now += timedelta(hours=1)
    if deactivate:
        u.deactivate_id(svc.db.one("SELECT id FROM users WHERE email='fired@s.example'")["id"], actor="owner")
    s2 = _restore(svc, clock, tmp_path, box, bk)
    monkeypatch.setenv("REQUIRE_USER_LOGIN", "1")
    api = TestClient(create_app(s2, owner_token=OWNER_TOKEN))
    clock.now += timedelta(seconds=31)
    return api.post("/auth/login", json={"email": "fired@s.example", "password": PW,
                                         "code": totp.code_at(reg["totp_secret"], clock().timestamp())}).status_code


def test_active_staff_can_login_after_restore_control(svc, clock, tmp_path, monkeypatch):
    assert _staff_login_after_restore(svc, clock, tmp_path, monkeypatch, deactivate=False) == 200



def test_deactivated_staff_stays_out_after_restore(svc, clock, tmp_path, monkeypatch):
    assert _staff_login_after_restore(svc, clock, tmp_path, monkeypatch, deactivate=True) != 200



def test_rotated_handoff_secret_stays_revoked(svc, clock, tmp_path):
    box = SecretBox.from_spec(f"k1:{generate_key()}")
    old = OrbitConnect(svc.db).issue_secret(ORG, at=clock().isoformat())
    bk = create_backup(svc.db.conn, tmp_path / "b.gbk", box)
    OrbitConnect(svc.db).issue_secret(ORG, at=clock().isoformat())
    now = int(clock().timestamp())
    tok = make_token(old, org=ORG, email="m@a.example", iat=now, exp=now + 120, nonce="n" * 22)
    with pytest.raises(HandoffRejected):
        OrbitConnect(svc.db).verify(tok, now)
    s2 = _restore(svc, clock, tmp_path, box, bk)
    with pytest.raises(HandoffRejected):
        OrbitConnect(s2.db).verify(tok, now)



def test_captured_entitlement_rejected_after_restore(svc, clock, tmp_path):
    box = SecretBox.from_spec(f"k1:{generate_key()}")
    svc.sync()
    _link(svc)
    ent = oe.OrbitEntitlements(svc.db)
    ent.ingest(_ent(svc, status="active", paid_until="2027-01-01"), int(clock().timestamp()), org=ORG, at="t")
    bk = create_backup(svc.db.conn, tmp_path / "b.gbk", box)
    clock.now += timedelta(seconds=30)
    captured = _ent(svc, status="active", paid_until="2027-01-01")
    clock.now += timedelta(seconds=30)
    ent.ingest(_ent(svc, status="cancelled", paid_until=""), int(clock().timestamp()), org=ORG, at="t")
    s2 = _restore(svc, clock, tmp_path, box, bk)
    restore_guard.release(s2.db, actor="owner", note="בדקתי הסרות", at=clock().isoformat())
    with pytest.raises(oe.EntitlementRejected):
        oe.OrbitEntitlements(s2.db).ingest(captured, int(clock().timestamp()), org=ORG, at="t")
