"""מנהל 417 (ביקורת 250🟠) — ההחזקה של 416ב (api_mass_vanish) נעקפה ברענון לפני שליחה.
באג: סנכרון החזיר 0 מסמכים (חיבור לחשבון אחר/טוקן אחר) ⇒ 416ב החזיקה את 20 החשבוניות פתוחות + כרטיס. אבל ב-dispatch
הבא, הרענון לפני שליחה (ר-4) קיבל 404 על כל מסמך (`get_document` ⇒ KeyError ⇒ None) — וסגר את כל ה-20 בשקט
(«refresh_closed», 20 תזכורות בוטלו), כשהכרטיס עדיין אומר «הן נשארות פתוחות». אותו דבר אחרי «השאר פתוחות».
עכשיו: 404 על חשבונית מוחזקת ⇒ לא נסגרת ולא נשלחת (refresh_failed); מסמך שנמצא ונסגר במקור — נסגר כרגיל;
ההחזקה מסתיימת רק בסנכרון תקין או ב«כולן שולמו»."""
from tests.test_mgr416_api_mass_vanish import _card, _docs, _open_count, _setup


def _approve_all(svc, planned):
    for r in planned:
        svc.approve(r)


def _dispatch_morning(svc, clock):
    clock.now = clock.now.replace(hour=10)
    return svc.dispatch()


def test_404_refresh_does_not_close_held(svc, clock, fake_gi):
    planned = _setup(svc, clock, fake_gi)
    _approve_all(svc, planned)
    fake_gi.docs[:] = []
    assert svc.sync()["vanish_held"] == 20
    sent = _dispatch_morning(svc, clock)
    assert sent == [] and _open_count(svc) == 20 and _card(svc)
    assert not svc.db.one("SELECT 1 FROM audit WHERE action='refresh_closed'")
    rows = svc.db.q("SELECT status, block_reason FROM reminders")
    assert {(r["status"], r["block_reason"]) for r in rows} == {("approved", "refresh_failed")}


def test_hold_survives_owner_dismiss(svc, clock, fake_gi):
    planned = _setup(svc, clock, fake_gi)
    _approve_all(svc, planned)
    fake_gi.docs[:] = []
    svc.sync()
    svc.owner_message_done(_card(svc)["id"])          # «השאר פתוחות — אבדוק את החיבור»
    assert not _card(svc)
    _dispatch_morning(svc, clock)
    assert _open_count(svc) == 20 and not svc.db.one("SELECT 1 FROM audit WHERE action='refresh_closed'")


def test_really_closed_at_source_still_closes(svc, clock, fake_gi):
    """המסמך נמצא במקור וסגור (שולם — מאומת) ⇒ נסגר כרגיל גם בזמן החזקה."""
    planned = _setup(svc, clock, fake_gi)
    _approve_all(svc, planned)
    docs = _docs(20)
    fake_gi.docs[:] = []
    svc.sync()
    for d in docs:
        d["status"] = 1
    fake_gi.docs[:] = docs                             # get_document מוצא אותם, סגורים
    held = {r["external_id"] for r in svc.db.q("SELECT external_id FROM invoices")}
    _dispatch_morning(svc, clock)
    assert held and _open_count(svc) == 0


def test_good_sync_ends_hold(svc, clock, fake_gi):
    """סנכרון תקין מסיים את ההחזקה (גם לכרטיס שהורד) ⇒ 404 אחר כך = נמחק במקור, נסגר כמו תמיד."""
    planned = _setup(svc, clock, fake_gi)
    _approve_all(svc, planned)
    fake_gi.docs[:] = []
    svc.sync()
    svc.owner_message_done(_card(svc)["id"])
    fake_gi.docs[:] = _docs(20)
    svc.sync()
    assert not svc._vanish_held(svc.db.one("SELECT id FROM invoices")["id"])


def test_accept_marks_resolved(svc, clock, fake_gi):
    _setup(svc, clock, fake_gi)
    fake_gi.docs[:] = []
    svc.sync()
    mid = _card(svc)["id"]
    iid = svc.db.one("SELECT id FROM invoices")["id"]
    assert svc._vanish_held(iid)
    svc.accept_mass_close(mid)
    assert not svc._vanish_held(iid)
