"""מנהל 454 (מבקר 275/276ℹ️): «כבר הוכרעה / כבר טופל» אומר **מי** הכריע ומתי (ולמה — אושרה/נדחתה, שויך ל…).

היה: העובדת השנייה קיבלה 409 «הבקשה כבר הוכרעה» בלי לדעת אם אושרה, ע״י מי — והייתה צריכה לחפש ביומן.
"""
from __future__ import annotations

import pytest

from app.users import SCHEMA
from tests.test_critic_round276_more_concurrent_decisions import _promise_pending, _shared_paid_card


def _staff(svc, uid: int, name: str):
    svc.db.conn.executescript(SCHEMA)
    svc.db.x("INSERT INTO users(id,email,name,pw_hash,totp_secret,created_at) VALUES (?,?,?,?,?,?)",
             (uid, f"u{uid}@studio.example", name, "x", "x", "2026-01-01T00:00:00"))


def test_promise_second_decision_says_who_and_what(svc):
    _staff(svc, 3, "רחל")
    cid = _promise_pending(svc)
    svc.decide_promise_request(cid, True, actor="user:3")
    with pytest.raises(ValueError) as e:
        svc.decide_promise_request(cid, False, actor="owner")
    msg = str(e.value)
    assert msg.startswith("הבקשה כבר הוכרעה (אושרה) — על ידי רחל ב-"), msg
    assert ":" in msg.split(" ב-")[-1]   # שעה


def test_promise_refused_by_owner_label(svc):
    cid = _promise_pending(svc)
    svc.decide_promise_request(cid, False, actor="owner")
    with pytest.raises(ValueError, match=r"^הבקשה כבר הוכרעה \(נדחתה\) — על ידי בעל העסק ב-"):
        svc.decide_promise_request(cid, True, actor="user:3")


def test_shared_card_second_assign_says_whom_and_who(svc):
    _staff(svc, 2, "מיכל")
    card, ids = _shared_paid_card(svc)
    svc.inbox.assign_shared_card(card, ids[1], actor="user:2")
    name = svc.db.one("SELECT name FROM customers WHERE id=?", (ids[1],))["name"].strip()
    with pytest.raises(ValueError) as e:
        svc.inbox.assign_shared_card(card, ids[0], actor="owner")
    assert str(e.value).startswith(f"הכרטיס כבר טופל (שויך ל{name}) — על ידי מיכל ב-"), str(e.value)


def test_shared_card_nobody_and_unknown_user(svc):
    card, _ = _shared_paid_card(svc)
    svc.inbox.assign_shared_card(card, None, actor="user:99")   # אין טבלת/שורת users ⇒ «עובד/ת»
    with pytest.raises(ValueError, match=r"^הכרטיס כבר טופל \(«אף אחד מהם»\) — על ידי עובד/ת ב-"):
        svc.inbox.assign_shared_card(card, None, actor="owner")


def test_labels_fallbacks(svc):
    assert svc.actor_label_he("owner") == "בעל העסק"
    assert svc.actor_label_he(None) == "בעל העסק"
    assert svc.actor_label_he("user:abc") == "עובד/ת"
    assert svc.already_decided_he("X", None) == "X"
    assert svc.already_decided_he("X", {"at": "garbage", "actor": "owner"}) == "X — על ידי בעל העסק"
