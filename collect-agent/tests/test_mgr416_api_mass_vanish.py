"""מנהל 416 (מבקר 249🟠) — סנכרון API מלא שמחזיר רשימה ריקה/מקוצרת (HTTP 200) סגר את כל החובות הפתוחים בשקט כ«שולמו».
עכשיו: נעלמו ≥5 שהן ≥50% מהפתוחות של המקור ⇒ לא נסגרות, תזכורות לא מבוטלות, כרטיס `api_mass_vanish` לבעל העסק.
«כולן באמת שולמו» (`accept_mass_close`, בעל העסק בלבד) ⇒ נסגרות. סנכרון תקין אחר כך ⇒ הכרטיס יורד.
בקרות: עסק קטן (3 פתוחות, 2 נגבו, התשובה לא ריקה) ⇒ נסגרות כרגיל
תשובה ריקה עם ≥2 שנעלמו ⇒ כרטיס (מנהל 418) · מיעוט שנעלם (25%) ⇒ נסגר כרגיל · CSV לא מושפע (full=False ממילא)."""
import json
from datetime import timedelta

import pytest

from app.secretbox import generate_key
from app.service import OwnerOnly
from app.users import Users
from tests.conftest import gi_doc


def _docs(n, start=1):
    return [gi_doc(i, phone=f"050-00001{i:02d}") for i in range(start, start + n)]


def _setup(svc, clock, fake_gi, n=20):
    fake_gi.docs[:] = _docs(n)
    svc.sync()
    clock.now += timedelta(days=1)
    planned = svc.plan()
    clock.now += timedelta(hours=2)
    return planned


def _open_count(svc):
    return svc.db.one("SELECT COUNT(*) n FROM invoices WHERE status='open'")["n"]


def _card(svc):
    return svc.db.one("SELECT * FROM messages WHERE intent='api_mass_vanish' AND needs_owner=1")


def test_empty_sync_holds_and_carded(svc, clock, fake_gi):
    planned = _setup(svc, clock, fake_gi)
    fake_gi.docs[:] = []
    out = svc.sync()
    assert out["closed"] == 0 and out["vanish_held"] == 20
    assert _open_count(svc) == 20
    assert svc.db.one("SELECT COUNT(*) n FROM reminders WHERE status='cancelled'")["n"] == 0
    c = _card(svc)
    assert c and "20 מתוך 20" in c["body"] and "לא סימנה אותן כשולמו" in c["body"]
    assert len(json.loads(c["payload"])["invoice_ids"]) == 20
    assert svc.db.one("SELECT 1 FROM audit WHERE action='api_mass_vanish'")
    # סנכרון ריק נוסף באותו יום ⇒ אותו כרטיס, לא שניים
    svc.sync()
    assert svc.db.one("SELECT COUNT(*) n FROM messages WHERE intent='api_mass_vanish'")["n"] == 1
    assert len(planned) == 20


def test_majority_vanish_held_too(svc, clock, fake_gi):
    _setup(svc, clock, fake_gi)
    fake_gi.docs[:] = _docs(8)          # 12 מתוך 20 נעלמו (60%)
    out = svc.sync()
    assert out["closed"] == 0 and out["vanish_held"] == 12 and _open_count(svc) == 20


def test_minority_vanish_closes_normally(svc, clock, fake_gi):
    _setup(svc, clock, fake_gi)
    fake_gi.docs[:] = _docs(15)         # 5 מתוך 20 (25%) ⇒ גבייה רגילה
    out = svc.sync()
    assert out["closed"] == 5 and "vanish_held" not in out and _open_count(svc) == 15
    assert not _card(svc)


def test_small_business_partial_vanish_closes(svc, clock, fake_gi):
    """עסק קטן (3 פתוחות), 2 נגבו והשלישית עדיין במקור ⇒ סגירה רגילה (מתחת לסף, התשובה לא ריקה)."""
    _setup(svc, clock, fake_gi, n=3)
    fake_gi.docs[:] = _docs(1, start=3)
    out = svc.sync()
    assert out["closed"] == 2 and _open_count(svc) == 1 and not _card(svc)


def test_small_business_empty_response_held_then_owner_closes(svc, clock, fake_gi):
    """מנהל 418 (ביקורת 250🟡): היה «3 פתוחות + תשובה ריקה ⇒ נסגרות בשקט». עכשיו תשובה ריקה עם ≥2 שנעלמו ⇒ כרטיס;
    בעל העסק מאשר «כולן שולמו» ⇒ נסגרות (אותו מסלול כמו בעסק גדול)."""
    _setup(svc, clock, fake_gi, n=3)
    fake_gi.docs[:] = []
    out = svc.sync()
    assert out["closed"] == 0 and out["vanish_held"] == 3 and _open_count(svc) == 3
    c = _card(svc)
    assert c and "3 מתוך 3" in c["body"]
    r = svc.accept_mass_close(c["id"])
    assert r["closed"] == 3 and _open_count(svc) == 0 and not _card(svc)


def test_normal_sync_after_resolves_card(svc, clock, fake_gi):
    _setup(svc, clock, fake_gi)
    fake_gi.docs[:] = []
    svc.sync()
    assert _card(svc)
    fake_gi.docs[:] = _docs(20)
    clock.now += timedelta(hours=1)
    out = svc.sync()
    assert out["closed"] == 0 and not _card(svc) and _open_count(svc) == 20
    assert svc.db.one("SELECT 1 FROM audit WHERE action='api_mass_vanish_resolved'")


def test_owner_accepts_mass_close(svc, clock, fake_gi):
    _setup(svc, clock, fake_gi)
    fake_gi.docs[:] = []
    svc.sync()
    mid = _card(svc)["id"]
    r = svc.accept_mass_close(mid)
    assert r["closed"] == 20 and _open_count(svc) == 0 and not _card(svc)
    assert svc.db.one("SELECT COUNT(*) n FROM reminders WHERE status IN ('pending_approval','approved')")["n"] == 0
    assert svc.db.one("SELECT 1 FROM audit WHERE action='api_mass_close_accepted'")
    with pytest.raises(KeyError):   # כבר טופל ⇒ 404
        svc.accept_mass_close(mid)


def test_staff_cannot_accept(svc, clock, fake_gi, monkeypatch):
    monkeypatch.setenv("COLLECT_MASTER_KEYS", f"k1:{generate_key()}")
    u = Users(svc.db, svc.clock)
    u.create("owner@s.example", "בעלים", "correct-horse-battery-9")
    u.create("staff@s.example", "עובד", "correct-horse-battery-9")
    sid = svc.db.one("SELECT id FROM users WHERE role='staff'")["id"]
    _setup(svc, clock, fake_gi)
    fake_gi.docs[:] = []
    svc.sync()
    mid = _card(svc)["id"]
    with pytest.raises(OwnerOnly):
        svc.accept_mass_close(mid, actor=f"user:{sid}")
    assert _open_count(svc) == 20 and _card(svc)
    assert svc.db.one("SELECT 1 FROM audit WHERE action='api_mass_close_refused'")


def test_http_route(svc, clock, fake_gi):
    from fastapi.testclient import TestClient

    from app.main import create_app
    from tests.conftest import AUTH, OWNER_TOKEN
    _setup(svc, clock, fake_gi)
    fake_gi.docs[:] = []
    svc.sync()
    mid = _card(svc)["id"]
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    assert api.post(f"/owner/inbox/{mid}/accept-close").status_code == 401
    r = api.post(f"/owner/inbox/{mid}/accept-close", headers=AUTH)
    assert r.status_code == 200 and r.json()["closed"] == 20
    assert api.post(f"/owner/inbox/{mid}/accept-close", headers=AUTH).status_code == 404
