"""מבקר סבב 292 (שמירה, ללא ממצא): יומן ה-audit — בלי מידע אישי, ופעולות עובדת נרשמות על שמה.

✓ אימות 291 (מנהל 470): התראות אבטחה נוקבות בשם המבצע (בדיקות הצוות + 291 בלי xfail).
[מאומת]
  · אחרי זרימה מלאה (תזכורות, 6 תשובות לקוח, מייל «תמחקו», השהיית קטין עם הערה שמכילה טלפון, עצירה משפטית עם שם,
    «שולם מחוץ למערכת», plan אחרי 100 יום) — 0 רשומות ביומן עם טלפון/מייל/שם לקוח (הערות נשמרות בלקוח, לא ביומן).
  · עובדת (REQUIRE_USER_LOGIN+TOTP): אישור/דחייה/«שולם»/הסרה/DSR נרשמים `user:N`.
ℹ️ (BACKLOG גבי מנוע): הסרה ע״י עובדת/בעלים נרשמת פעמיים — `customer opt_out {"via": "owner"}` **וגם** `user:N
   owner_opt_out`; השורה הראשונה מייחסת ללקוח פעולה שלא עשה (ראיה מטעה במחלוקת «לא ביקשתי הסרה»). ℹ️ POST /sync /plan
   /dispatch ידניים לא נרשמים עם המבצע (רק `system sync`).
רכיב: app/service.py → audit / _opt_out / owner_opt_out · app/main.py → /audit.
"""
from __future__ import annotations

import re
from datetime import timedelta

from fastapi.testclient import TestClient

from app import totp
from app.main import create_app
from app.secretbox import generate_key
from app.users import Users
from tests.conftest import OWNER_TOKEN

PW = "correct-horse-battery-9"
PH = re.compile(r"0?5\d[- ]?\d{7}|9725\d{8}|\+972")
EM = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+")


def test_audit_has_no_customer_pii(svc, clock):
    svc.sync()
    for rid in svc.plan():
        svc.approve(rid, confirm_open=True)
    svc.dispatch()
    for t in ["שילמתי אתמול", "אשלם ב-20 לחודש", "אפשר לשלם ב-3 תשלומים?", "מספר שגוי", "הסר", "אני לא חייב, טעות"]:
        svc.inbound("sms", "+972-52-7654321", t)
    svc.email_webhook("c1@example.com", "תמחקו את המידע שלי", "<m@x>")
    svc.set_hold(1, "minor", "אמא אמרה בטלפון 050-9999999")
    svc.set_legal_hold(1, "תביעה נגד דנה כהן")
    svc.mark_paid_outside(1)
    clock.now += timedelta(days=100)
    svc.plan()
    for a in svc.db.q("SELECT action, detail FROM audit"):
        d = a["detail"] or ""
        assert not PH.search(d) and not EM.search(d), (a["action"], d)
        assert not any(n in d for n in ("דנה", "יוסי", "כהן", "לוי")), (a["action"], d)


def test_staff_actions_recorded_under_user(svc, clock, monkeypatch):
    monkeypatch.setenv("COLLECT_MASTER_KEYS", f"k1:{generate_key()}")
    u = Users(svc.db, svc.clock)
    u.create("owner@s.example", "בעלים", PW)
    reg = u.create("s@s.example", "רחל", PW)
    monkeypatch.setenv("REQUIRE_USER_LOGIN", "1")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    tok = api.post("/auth/login", json={"email": "s@s.example", "password": PW,
                                        "code": totp.code_at(reg["totp_secret"], clock().timestamp())}).json()["token"]
    h = {"Authorization": f"Bearer {tok}"}
    svc.sync()
    rids = svc.plan()
    start = svc.db.one("SELECT MAX(id) m FROM audit")["m"]
    seen = api.get(f"/reminders/{rids[0]}/preview", headers=h).json().get("body_hash")
    api.post(f"/reminders/{rids[0]}/approve", json={"confirm_open": True, "seen_hash": seen}, headers=h)
    api.post(f"/reminders/{rids[1]}/reject", headers=h)
    api.post("/invoices/1/mark-paid", headers=h)
    api.post("/customers/2/dsr", json={"kind": "access", "note": "טלפון"}, headers=h)
    got = {a["action"]: a["actor"] for a in svc.db.q("SELECT actor, action FROM audit WHERE id>?", (start,))}
    for act in ("approve", "reject", "invoice_marked_paid", "dsr_opened"):
        assert got.get(act, "").startswith("user:"), (act, got)
