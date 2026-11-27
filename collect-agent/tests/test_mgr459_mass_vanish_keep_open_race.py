"""מנהל 459 (check-then-update שנשאר מסבב 276): «השאר פתוחות» ‖ «כולן שולמו» על אותו כרטיס api_mass_vanish.

`accept_mass_close` קרא את הכרטיס (needs_owner=1) ואז, בטרנזקציה נפרדת, סגר את כל החשבוניות בלי תנאי. «השאר פתוחות»
(owner_message_done) ממכשיר שני שרץ ביניהם ⇒ בעל העסק בחר להשאיר — והחשבוניות נסגרו בכל זאת, ושתי ההכרעות ביומן.
עכשיו: התפיסה (`UPDATE … WHERE needs_owner=1`) היא הצעד הראשון בתוך הטרנזקציה; המאוחר מקבל 409 «כבר טופל» עם
מה הוכרע, מי ומתי, ולא נוגע בדבר.
"""
from __future__ import annotations

import pytest

from tests.test_mgr416_api_mass_vanish import _card, _docs, _open_count, _setup
from tests.test_mgr451_concurrent_promise_and_shared import _after_read


def _vanished(svc, clock, fake_gi):
    _setup(svc, clock, fake_gi)
    fake_gi.docs[:] = []
    svc.sync()
    return _card(svc)["id"]


def _actions(svc):
    return [r["action"] for r in svc.db.q("SELECT action FROM audit WHERE action IN "
                                          "('api_mass_close_accepted','owner_message_done') ORDER BY id")]


def test_keep_open_between_read_and_close_wins(svc, clock, fake_gi):
    mid = _vanished(svc, clock, fake_gi)
    undo = _after_read(svc, "FROM messages WHERE id=? AND intent='api_mass_vanish'",
                       lambda: svc.owner_message_done(mid, actor="owner"))
    try:
        with pytest.raises(ValueError, match="כבר טופל \\(נבחר «השאר פתוחות»\\) — על ידי בעל העסק"):
            svc.accept_mass_close(mid)
    finally:
        undo()
    assert _open_count(svc) == 20            # בעל העסק בחר להשאיר — אף חשבונית לא נסגרה
    assert _actions(svc) == ["owner_message_done"]
    assert not svc.db.one("SELECT 1 FROM invoices WHERE status='closed'")


def test_close_between_read_and_keep_open_is_reported(svc, clock, fake_gi):
    mid = _vanished(svc, clock, fake_gi)
    undo = _after_read(svc, "SELECT intent, message_id FROM messages WHERE id=? AND needs_owner=1",
                       lambda: svc.accept_mass_close(mid))
    try:
        with pytest.raises(ValueError, match="כבר טופל \\(סומנו כשולמו\\)"):
            svc.owner_message_done(mid, actor="owner")
    finally:
        undo()
    assert _open_count(svc) == 0
    assert _actions(svc) == ["api_mass_close_accepted"]   # «השאר פתוחות» לא נרשם כאילו קרה


def test_keep_open_then_close_sequential_409(svc, clock, fake_gi):
    mid = _vanished(svc, clock, fake_gi)
    assert svc.owner_message_done(mid)["done"]
    with pytest.raises(ValueError, match="נבחר «השאר פתוחות»"):
        svc.accept_mass_close(mid)
    assert _open_count(svc) == 20


def test_close_sequential_still_works(svc, clock, fake_gi):
    mid = _vanished(svc, clock, fake_gi)
    assert svc.accept_mass_close(mid)["closed"] == 20
    assert _actions(svc) == ["api_mass_close_accepted"] and _open_count(svc) == 0
    fake_gi.docs[:] = _docs(20)   # הסנכרון הבא מחזיר אותן ⇒ נפתחות מחדש (415), לא מתרסק על הכרטיס שנסגר
    svc.sync()


def test_plain_done_race_logs_once(svc, clock, fake_gi):
    """«טופל» כפול על כרטיס רגיל במקביל ⇒ שתיהן «בוצע», שורת יומן אחת (לא שתיים)."""
    svc.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,created_at) "
             "VALUES(NULL,'system','owner','x','doc_malformed',1,'2026-11-27T09:00:00+02:00')")
    mid = svc.db.one("SELECT MAX(id) m FROM messages")["m"]
    undo = _after_read(svc, "SELECT intent, message_id FROM messages WHERE id=? AND needs_owner=1",
                       lambda: svc.owner_message_done(mid, actor="user:3"))
    try:
        assert svc.owner_message_done(mid, actor="owner")["done"]
    finally:
        undo()
    assert len(svc.db.q("SELECT 1 FROM audit WHERE action='owner_message_done'")) == 1
