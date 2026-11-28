"""מנהל 465 (מבקר 287🟠): שחזור מגיבוי מחזיר את שורת הזכאות מאורביט כפי שהייתה ברגע הגיבוי — מנוי שבוטל אחריו
חזר ל-active ⇒ אחרי שחרור העצירה גבי תכנן תזכורות לעסק מבוטל. עכשיו: בשחזור הזכאות «לא מאומתת מאז השחזור»
(`restore_floor`) ⇒ עצירה + הודעה לבעל העסק, עד שמגיעה זכאות שנחתמה **אחרי** השחזור; טוקן ישן שנלכד לפני
השחזור (בתוך 300 השניות) נדחה."""
from __future__ import annotations

from datetime import timedelta

import pytest

from app import orbit_entitlement as oe
from app import restore_guard
from app.backup import create_backup, restore_backup
from app.db import DB
from app.secretbox import SecretBox, generate_key
from app.service import CollectService
from tests.test_orbit_entitlement import _ent, _ingest, _now, keys  # noqa: F401
from tests.test_orbit_unlink_not_free import _link


def _restore(svc, clock, tmp_path, *, cancel_after: bool):
    box = SecretBox.from_spec(f"k1:{generate_key()}")
    svc.sync()
    _link(svc)
    _ingest(svc, _ent(svc, status="active", paid_until="2027-01-01"))
    bk = create_backup(svc.db.conn, tmp_path / "b.gbk", box)
    clock.now += timedelta(hours=3)
    if cancel_after:
        _ingest(svc, _ent(svc, status="cancelled", paid_until=""))
    s2 = CollectService(svc.s, DB(str(restore_backup(bk, tmp_path / "r.db", box))), gi=svc.gi, clock=clock)
    return s2


def _release(s2, clock):
    restore_guard.release(s2.db, actor="owner", note="בדקתי הסרות", at=clock().isoformat())


def test_restored_entitlement_is_unverified_and_stops(svc, clock, tmp_path):
    s2 = _restore(svc, clock, tmp_path, cancel_after=False)
    _release(s2, clock)
    t = s2.trial()
    assert t["active"] is False and t["state"] == "unverified" and t["restored_status"] == "active"
    assert s2.plan() == []
    a = s2.db.one("SELECT detail FROM audit WHERE action='restore_orbit_unverified'")
    assert a is not None


def test_hold_message_mentions_orbit_reverify(svc, clock, tmp_path):
    s2 = _restore(svc, clock, tmp_path, cancel_after=False)
    body = s2.db.one("SELECT body FROM messages WHERE intent='restore_hold'")["body"]
    assert "אורביט" in body and "פעם אחת" in body


def test_unverified_owner_notice_once(svc, clock, tmp_path):
    s2 = _restore(svc, clock, tmp_path, cancel_after=False)
    _release(s2, clock)
    t = s2.trial()
    s2._notify_orbit_billing(t)
    s2._notify_orbit_billing(t)
    rows = s2.db.q("SELECT body FROM messages WHERE intent='orbit_billing' AND needs_owner=1")
    assert len(rows) == 1 and "אימות מחדש" in rows[0]["body"]


def test_fresh_entitlement_after_restore_resumes(svc, clock, tmp_path):
    s2 = _restore(svc, clock, tmp_path, cancel_after=True)
    _release(s2, clock)
    clock.now += timedelta(minutes=1)
    _ingest(s2, _ent(s2, status="active", paid_until="2027-01-01"))
    t = s2.trial()
    assert t["active"] is True and t["state"] == "active"
    assert s2.db.one("SELECT restore_floor FROM orbit_entitlements")[0] is None
    s2._notify_orbit_billing(t)   # כרטיס «אימות מחדש» (אם נפתח) יורד
    assert not s2.db.q("SELECT 1 FROM messages WHERE intent='orbit_billing' AND needs_owner=1")


def test_token_minted_before_restore_rejected(svc, clock, tmp_path):
    """טוקן active שנלכד לפני השחזור (iat אחרי הגיבוי, עדיין בתוך החלון) לא מחזיר שליחה."""
    s2 = _restore(svc, clock, tmp_path, cancel_after=False)
    old = _ent(s2, status="active", paid_until="2027-01-01")   # iat = עכשיו (אחרי הגיבוי)
    floor = _now(s2) + 30                                       # השחזור קרה 30 שנ׳ אחרי שהטוקן נחתם
    s2.db.x("UPDATE orbit_entitlements SET restore_floor=?", (floor,))
    with pytest.raises(oe.EntitlementRejected) as e:
        _ingest(s2, old, now=floor + 10)
    assert e.value.reason == "stale"
    assert s2.trial()["state"] == "unverified"


def test_unlinked_business_restore_unchanged(svc, clock, tmp_path):
    """עסק שלא מקושר לאורביט: אין זכאות ⇒ השחזור לא נוגע במנוי ואין שורת אורביט בהודעה."""
    box = SecretBox.from_spec(f"k1:{generate_key()}")
    svc.sync()
    bk = create_backup(svc.db.conn, tmp_path / "b.gbk", box)
    s2 = CollectService(svc.s, DB(str(restore_backup(bk, tmp_path / "r.db", box))), gi=svc.gi, clock=clock)
    body = s2.db.one("SELECT body FROM messages WHERE intent='restore_hold'")["body"]
    assert "אורביט" not in body
    _release(s2, clock)
    assert s2.trial()["active"] is True


def test_pre_465_table_gets_column(tmp_path):
    """DB ישן בלי restore_floor ⇒ ensure_schema מוסיף; mark_restored עובד."""
    import sqlite3
    c = sqlite3.connect(":memory:")
    c.execute("CREATE TABLE orbit_entitlements (business_id INTEGER PRIMARY KEY, org TEXT NOT NULL, plan TEXT "
              "NOT NULL, status TEXT NOT NULL, trial_start TEXT NOT NULL, paid_until TEXT NOT NULL, billing_url "
              "TEXT NOT NULL, iat INTEGER NOT NULL, received_at TEXT NOT NULL)")
    c.execute("INSERT INTO orbit_entitlements VALUES(1,'o','monthly','active','','2027-01-01','',1,'t')")
    assert oe.mark_restored(c, 123) is True
    assert c.execute("SELECT restore_floor FROM orbit_entitlements").fetchone()[0] == 123
