"""מבקר סבב 201 · 🟠 — עובד/ת מכריע/ה על הבטחה מעבר ל-14 יום, והלקוח מקבל «בעל העסק אישר».

רכיבים: `app/main.py` → `promise_request_decide` (POST /customers/{cid}/promise-request) + `app/service.py` →
`decide_promise_request` / `_promise_decision_notice` + `web/src/pages/Inbox.tsx` (כפתורי `promise-approve/refuse`).
הכרעת ראש צוות q21-19: מעבר ל-14 יום גבי מקבל עד 14 ו«כרטיס «בדוק ואשר» **לבעל העסק**, שמאשר או מסרב». בפועל:
**[REQUIRE_USER_LOGIN=1 + TOTP]** עובד/ת ⇒ 200, ההשהיה מוארכת למועד המבוקש (בלי תקרה — גם 25.11.2027, 382 יום), ו-
`_promise_decision_notice` מנסח ללקוח «סטודיו מאיר: שלום דנה, **בעל העסק אישר**: התשלום צפוי עד…» — לא נכון; ה-audit
רושם `user:2` (העובד/ת). אין כרטיס לבעל העסק. במסך — הכפתורים מוצגים לעובד/ת כמו לבעלים.
המגבלה של 14 יום (`max_defer_days`) נועדה בדיוק לכך שדחייה ארוכה תהיה החלטת בעל העסק.
הצעה (כמו 191א / #22b): הכרעה = בעל העסק בלבד (403 + audit `promise_request_refused_staff`) + נעילה במסך
(`isStaff` מ-`lib/ownerOnly.ts`). xfail(strict=True); בקרה ירוקה."""
import re
from pathlib import Path

from fastapi.testclient import TestClient

from app import totp
from app.main import create_app
from app.secretbox import generate_key
from app.users import Users
from tests.conftest import OWNER_TOKEN

PW = "correct-horse-battery-9"
ROOT = Path(__file__).resolve().parents[1]


def _api(svc, clock, monkeypatch):
    monkeypatch.setenv("COLLECT_MASTER_KEYS", f"k1:{generate_key()}")
    u = Users(svc.db, svc.clock)
    regs = {"owner": u.create("owner@s.example", "בעלים", PW), "staff": u.create("staff@s.example", "עובד", PW)}
    svc.sync()
    svc.inbound("sms", "050-1234567", "I'll pay on November 25")
    monkeypatch.setenv("REQUIRE_USER_LOGIN", "1")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))

    def hdr(who):
        tok = api.post("/auth/login", json={"email": f"{who}@s.example", "password": PW,
                                            "code": totp.code_at(regs[who]["totp_secret"], clock().timestamp())})
        return {"Authorization": f"Bearer {tok.json()['token']}"}
    cid = svc.db.one("SELECT id FROM customers WHERE external_id='cl1'")["id"]
    return api, hdr, cid


def test_staff_cannot_decide_far_promise(svc, clock, monkeypatch):
    api, hdr, cid = _api(svc, clock, monkeypatch)
    staff = hdr("staff")
    r = api.post(f"/customers/{cid}/promise-request", json={"approve": True}, headers=staff)
    assert r.status_code == 403, r.text
    row = svc.db.one("SELECT paused_reason FROM customers WHERE id=?", (cid,))
    assert row["paused_reason"] == "promise:until=2026-11-23"
    # מנהל 354: ניסיון העובד/ת נרשם על שמו/ה, ולא נחשב הכרעה — בעל העסק עדיין מכריע אחר כך
    who = svc.db.one("SELECT actor FROM audit WHERE action='promise_request_refused_staff'")["actor"]
    assert who.startswith("user:")
    assert not svc.db.one("SELECT 1 FROM audit WHERE action IN ('promise_request_approved','promise_request_refused')")
    r2 = api.post(f"/customers/{cid}/promise-request", json={"approve": False}, headers=staff)
    assert r2.status_code == 403
    r3 = api.post(f"/customers/{cid}/promise-request", json={"approve": True}, headers=hdr("owner"))
    assert r3.status_code == 200 and r3.json()["paused_until"] == "2026-11-26"


def test_inbox_locks_promise_decision_for_staff():
    src = (ROOT / "web" / "src" / "pages" / "Inbox.tsx").read_text(encoding="utf-8")
    code = "\n".join(ln for ln in src.splitlines() if not ln.strip().startswith(("//", "*", "/*", "{/*")))
    assert re.search(r"isStaff|promiseLocked|[pP]romise\w*OwnerOnly|OWNER_ONLY_TAG", code)


def test_control_owner_decides(svc, clock, monkeypatch):
    api, hdr, cid = _api(svc, clock, monkeypatch)
    r = api.post(f"/customers/{cid}/promise-request", json={"approve": True}, headers=hdr("owner"))
    assert r.status_code == 200 and r.json()["paused_until"] == "2026-11-26"
