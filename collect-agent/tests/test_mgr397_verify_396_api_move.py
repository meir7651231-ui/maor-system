"""מנהל 397 — אימות מנהל 396 (התרחישים שביקשו מביקורת 234)
(סנכרון API בלי מזהה לקוח מעביר חשבונית לשם החדש בתוך אותו טלפון/מייל).

שלושה תרחישים שה-STATUS ביקש לאמת:
(1) API חלקי ואז מלא בשתי ריצות נפרדות של ה-cron, עם תכנון תזכורות בין הריצות — אין תזכורת כפולה, אין תזכורת
    בשם הישן אחרי האיחוד, והכרטיס יורד.
(2) API עם מייל במקום טלפון — אותו כלל (הבעלים במפתח הקשר הוא המייל).
(3) חשבונית שעברה ב-API ואז «שילמתי» מהטלפון — הטלפון משותף עכשיו לשני השמות (שני לקוחות); אין חשיפת חוב,
    אין תשובה אוטומטית שמנחשת, ותזכורת לא יוצאת לאף אחד מהשניים למחרת (כמו 233)."""
import json
from datetime import date, timedelta

from app.greeninvoice import Invoice

OLD, NEW = "דויד כהן", "דוד כהן-לוי"
PHONE = "0541112222"


def _inv(num, name, phone=PHONE, email=""):
    return Invoice(external_id=f"gi-{num}", number=num, doc_type=305, amount_agorot=50000, currency="ILS",
                   issued=date(2026, 10, 1), due=date(2026, 10, 15), client_external_id="",
                   client_name=name, client_phone=phone, client_email=email)


def _sync(svc, clock, *invs):
    clock.now += timedelta(hours=1)
    svc.ingest(list(invs), full=False)


def _owner(svc):
    return {r["number"]: r["name"] for r in svc.db.q(
        "SELECT i.number, c.name FROM invoices i JOIN customers c ON c.id=i.customer_id")}


def _open_cards(svc):
    return svc.db.q("SELECT body FROM messages WHERE intent='shared_contact' AND needs_owner=1")


def _active_reminders(svc):
    return svc.db.q("SELECT c.name, i.number FROM reminders r JOIN invoices i ON i.id=r.invoice_id "
                    "JOIN customers c ON c.id=i.customer_id WHERE r.status IN ('pending_approval','approved')")


# ---------- (1) שתי ריצות cron נפרדות ----------
def test_two_cron_runs_with_plan_between(svc, clock):
    svc.ingest([_inv("8001", OLD), _inv("8002", OLD)], full=False)
    svc.plan()
    _sync(svc, clock, _inv("8002", NEW))          # ריצה 1: חלקי
    clock.now += timedelta(days=1)
    svc.plan()
    mid = _active_reminders(svc)
    # כל חשבונית מופיעה בתזכורת פעילה אחת לכל היותר, ותחת הבעלים הנוכחי שלה
    nums = [r["number"] for r in mid]
    assert len(nums) == len(set(nums)), mid
    assert all(_owner(svc)[r["number"]] == r["name"] for r in mid), mid
    assert len(_open_cards(svc)) == 1
    _sync(svc, clock, _inv("8001", NEW), _inv("8002", NEW))   # ריצה 2: מלא
    clock.now += timedelta(days=1)
    svc.plan()
    assert _owner(svc) == {"8001": NEW, "8002": NEW}
    assert _open_cards(svc) == []
    after = _active_reminders(svc)
    assert all(r["name"] == NEW for r in after), after
    nums = [r["number"] for r in after]
    assert len(nums) == len(set(nums)), after


# ---------- (2) מייל במקום טלפון ----------
def test_email_only_moves_and_resolves(svc, clock):
    E = "david@x.example"
    svc.ingest([_inv("8001", OLD, phone="", email=E), _inv("8002", OLD, phone="", email=E)], full=False)
    _sync(svc, clock, _inv("8002", NEW, phone="", email=E))
    assert _owner(svc) == {"8001": OLD, "8002": NEW}
    assert len(_open_cards(svc)) == 1
    _sync(svc, clock, _inv("8001", NEW, phone="", email=E), _inv("8002", NEW, phone="", email=E))
    assert _owner(svc) == {"8001": NEW, "8002": NEW}
    assert _open_cards(svc) == []


def test_email_change_not_moved(svc, clock):
    """מייל אחר = שינוי פרטי קשר, מחוץ לתחום — ללא העברה."""
    svc.ingest([_inv("8001", OLD, phone="", email="a@x.example"),
                _inv("8002", OLD, phone="", email="a@x.example")], full=False)
    before = _owner(svc)
    _sync(svc, clock, _inv("8002", OLD, phone="", email="b@x.example"))
    assert _owner(svc) == before
    assert svc.db.one("SELECT COUNT(*) n FROM audit WHERE action='csv_contact_changed'")["n"] == 0


# ---------- (3) «שילמתי» מהטלפון אחרי מעבר ב-API ----------
def test_paid_claim_after_api_move_no_leak_no_reminders(svc, clock):
    svc.ingest([_inv("8001", OLD), _inv("8002", OLD)], full=False)
    _sync(svc, clock, _inv("8002", NEW))
    r = svc.inbound("sms", PHONE, "שילמתי אתמול")
    # הטלפון משותף עכשיו לשני שמות ⇒ מסלול הכרטיס המשותף (בחירה אצל בעל העסק), לא שיוך מנוחש
    assert r["intent"] in svc.inbox.SHARED_CARDS, r["intent"]
    # לא נשלחת תשובה אוטומטית ללקוח
    assert r.get("auto_reply") in (None, ""), r
    # טיוטה, אם נוצרה, לא חושפת חוב/שם של אחר
    if r.get("draft_id"):
        body = svc.db.one("SELECT body FROM drafts WHERE id=?", (r["draft_id"],))["body"] or ""
        for leak in ("8001", "8002", "500"):
            assert leak not in body, body
    clock.now += timedelta(days=1)
    reminded = [svc.db.one("SELECT i.number FROM reminders r JOIN invoices i ON i.id=r.invoice_id WHERE r.id=?",
                           (rid,))["number"] for rid in svc.plan()]
    assert reminded == [], reminded


def test_audit_detail_no_pii_email(svc, clock):
    E = "david@x.example"
    svc.ingest([_inv("8001", OLD, phone="", email=E), _inv("8002", OLD, phone="", email=E)], full=False)
    _sync(svc, clock, _inv("8002", NEW, phone="", email=E))
    blob = json.dumps([r["detail"] for r in svc.db.q(
        "SELECT detail FROM audit WHERE action='csv_contact_changed'")], ensure_ascii=False)
    assert "david" not in blob and "כהן" not in blob
