"""critic סבב 72 (הרשאות): אין תפקידים — כל עובד מחובר שווה לבעלים, ובבטא אמיתית (REQUIRE_USER_LOGIN=1) הטוקן
המשותף סגור, כלומר **כולם** «עובדים». כל עובד (או סשן גנוב של עובד) יכול להחליף את **קישור התשלום** לעמוד שלו אצל
אותו ספק (הדומיין מותר) ⇒ חייבים משלמים לחשבון שלו; או את כתובת Reply-To ⇒ תשובות הלקוחות מגיעות אליו. ה-audit
רשם רק את **שמות** השדות (בלי ישן/חדש) ובעל העסק לא קיבל שום הודעה. תפקידים = הכרעת בעלים; רשת הביטחון כאן:
שינוי שדה רגיש ⇒ audit עם ישן→חדש ומי, **והודעה לבעל העסק** (`settings_changed`)."""
from __future__ import annotations

import json

from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

NEW_LINK = "https://www.greeninvoice.co.il/pay/someone-else"


def test_payment_link_change_is_audited_with_values_and_owner_is_told(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    old = svc.s.payment_link
    r = api.put("/api/settings", json={"payment_link": NEW_LINK, "email_reply_to": "x@evil.example"})
    assert r.status_code == 200, r.text
    rows = [json.loads(a["detail"]) for a in svc.db.q("SELECT * FROM audit WHERE action='settings_sensitive_changed'")]
    by = {d["field"]: d for d in rows}
    assert by["payment_link"]["from"] == old and by["payment_link"]["to"] == NEW_LINK, rows
    assert by["email_reply_to"]["to"] == "x@evil.example"
    notes = [m for m in api.get("/owner/inbox").json() if m["intent"] == "settings_changed"]
    assert len(notes) == 1, api.get("/owner/inbox").json()
    assert "קישור התשלום" in notes[0]["body"] and NEW_LINK in notes[0]["body"] and "owner" in notes[0]["body"]


def test_harmless_change_does_not_notify(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.put("/api/settings", json={"extra_holidays": ["2026-12-25"]})
    assert not [m for m in api.get("/owner/inbox").json() if m["intent"] == "settings_changed"]


# הפעלה 199 — המגבלה שסבב 72 השאיר פתוחה: מי שהחליף את קישור התשלום סימן את ההתראה «טופל» בעצמו.
import pytest  # noqa: E402

from app.users import Users  # noqa: E402

PW = "a-strong-pass-123"


def _change_as(svc, actor, link=NEW_LINK):
    svc.update_settings({"payment_link": link}, actor=actor)
    return svc.db.one("SELECT id FROM messages WHERE intent='settings_changed' AND needs_owner=1 "
                      "ORDER BY id DESC")["id"]


def test_changer_cannot_dismiss_own_alert_when_another_worker_exists(svc):
    users = Users(svc.db, svc.clock)
    users.create("a@example.co.il", "א", PW)
    users.create("b@example.co.il", "ב", PW)
    mid = _change_as(svc, "user:1")

    with pytest.raises(ValueError, match="עובד אחר"):
        svc.owner_message_done(mid, "user:1")
    assert svc.db.one("SELECT needs_owner FROM messages WHERE id=?", (mid,))["needs_owner"] == 1
    assert svc.db.q("SELECT 1 FROM audit WHERE action='owner_message_done_refused'")
    assert svc.owner_message_done(mid, "user:2")["done"]


def test_refusal_is_409_over_http_and_other_worker_closes_it(svc):
    from app import totp
    users = Users(svc.db, svc.clock)
    regs = [users.create(e, e[0], PW) for e in ("a@example.co.il", "b@example.co.il")]
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))

    def login(i, shift):
        code = totp.code_at(regs[i]["totp_secret"], svc.clock().timestamp() + shift)
        r = api.post("/auth/login", json={"email": ("a@example.co.il", "b@example.co.il")[i],
                                          "password": PW, "code": code})
        assert r.status_code == 200, r.text
        return {"Authorization": f"Bearer {r.json()['token']}"}

    ha, hb = login(0, 0), login(1, 0)
    assert api.put("/api/settings", json={"payment_link": NEW_LINK}, headers=ha).status_code == 200
    mid = [m for m in api.get("/owner/inbox", headers=ha).json() if m["intent"] == "settings_changed"][0]["id"]
    r = api.post(f"/owner/inbox/{mid}/done", headers=ha)
    assert r.status_code == 409 and "עובד אחר" in r.text, r.text
    assert api.post(f"/owner/inbox/{mid}/done", headers=hb).status_code == 200


def test_single_worker_and_shared_owner_token_can_dismiss(svc):
    users = Users(svc.db, svc.clock)
    users.create("a@example.co.il", "א", PW)
    mid = _change_as(svc, "user:1")
    assert svc.owner_message_done(mid, "user:1")["done"]  # עובד יחיד — לא ננעל לנצח
    mid2 = _change_as(svc, "owner", NEW_LINK + "-2")
    assert svc.owner_message_done(mid2, "owner")["done"]


def test_deactivated_other_worker_does_not_count(svc):
    users = Users(svc.db, svc.clock)
    users.create("a@example.co.il", "א", PW)
    users.create("b@example.co.il", "ב", PW)
    users.deactivate("b@example.co.il")
    mid = _change_as(svc, "user:1")
    assert svc.owner_message_done(mid, "user:1")["done"]


def test_other_notices_unaffected(svc):
    users = Users(svc.db, svc.clock)
    users.create("a@example.co.il", "א", PW)
    users.create("b@example.co.il", "ב", PW)
    svc.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,created_at) "
             "VALUES(NULL,'system','owner','x','max_reminders',1,'2026-11-14T10:00:00')")
    mid = svc.db.one("SELECT max(id) AS m FROM messages")["m"]
    assert svc.owner_message_done(mid, "user:1")["done"]


# הפעלה 200 («הבא» 2 מ-199): ההתראה בתוך המערכת לא מספיקה — מי שגנב סשן רואה אותה בתיבה. מייל לבעל העסק,
# לכתובת ה-Reply-To **הקודמת**: גם אם התוקף החליף אותה לשלו, ההודעה מגיעה לבעלים האמיתי ולא אליו.
from dataclasses import replace as _replace  # noqa: E402

from app.channels import sent_mark, sent_since  # noqa: E402
from app.integrations.base import IntegrationError  # noqa: E402


def _with_reply_to(svc, addr):
    svc.update_settings({"email_reply_to": addr}, actor="owner")
    return sent_mark(svc.sender.sent)


def _owner_mails(svc, mark):
    return [r for r in sent_since(svc.sender.sent, mark)
            if r["channel"] == "email" and "הגדרות רגישות" in r["body"]]


def test_reply_to_hijack_emails_the_previous_address_not_the_new_one(svc):
    mark = _with_reply_to(svc, "owner@biz.example")
    svc.update_settings({"email_reply_to": "x@evil.example", "payment_link": NEW_LINK}, actor="user:7")
    mails = _owner_mails(svc, mark)
    assert [m["to"] for m in mails] == ["owner@biz.example"], mails
    assert NEW_LINK in mails[0]["body"] and "x@evil.example" in mails[0]["body"] and "user:7" in mails[0]["body"]
    assert not [r for r in sent_since(svc.sender.sent, mark) if r["to"] == "x@evil.example"]
    assert svc.db.q("SELECT 1 FROM audit WHERE action='settings_changed_email_sent'")


def test_payment_link_change_emails_current_reply_to(svc):
    mark = _with_reply_to(svc, "owner@biz.example")
    svc.update_settings({"payment_link": NEW_LINK}, actor="user:3")
    assert [m["to"] for m in _owner_mails(svc, mark)] == ["owner@biz.example"]


def test_harmless_change_sends_no_mail(svc):
    mark = _with_reply_to(svc, "owner@biz.example")
    svc.update_settings({"extra_holidays": ["2026-12-25"]}, actor="user:3")
    assert not _owner_mails(svc, mark)


def test_no_owner_address_is_audited_and_save_still_succeeds(svc):
    svc.s = _replace(svc.s, email_reply_to="")
    mark = sent_mark(svc.sender.sent)
    svc.update_settings({"payment_link": NEW_LINK}, actor="user:3")
    assert svc.s.payment_link == NEW_LINK
    assert not _owner_mails(svc, mark)
    row = svc.db.one("SELECT detail FROM audit WHERE action='settings_changed_email_skipped'")
    assert row and json.loads(row["detail"])["reason"] == "no_owner_address"


def test_provider_failure_does_not_break_the_save(svc, monkeypatch):
    _with_reply_to(svc, "owner@biz.example")

    from app.channels import DryRunSender

    def boom(self, msg):
        raise IntegrationError("down")
    monkeypatch.setattr(DryRunSender, "send", boom)   # השמירה בונה sender חדש ⇒ על המחלקה
    svc.update_settings({"payment_link": NEW_LINK}, actor="user:3")
    assert svc.s.payment_link == NEW_LINK
    assert svc.db.q("SELECT 1 FROM audit WHERE action='settings_changed_email_failed'")
    assert [m for m in svc.db.q("SELECT intent FROM messages WHERE intent='settings_changed'")]


def test_demo_check_shows_owner_email_on_sensitive_change():
    """הפעלה 201 («הבא» 2 מ-200): ההדגמה מקצה לקצה (`demo.sh --check`, רצה ב-CI) משנה קישור תשלום + Reply-To
    ובודקת ב-/outbox מייל אחד לכתובת הקודמת ולא לחדשה. מוטציה (שליחה ל-self.s.email_reply_to) ⇒ demo.sh נופל."""
    from pathlib import Path
    demo = (Path(__file__).resolve().parent.parent / "demo.sh").read_text(encoding="utf-8")
    i = demo.index('"email_reply_to": "new-owner@example.com"')
    tail = demo[i:i + 1500]
    assert 'alert[0]["to"] == "owner@example.com"' in tail
    assert '"new-owner@example.com" for m in new' in tail
    assert "settings_changed_email_sent" in tail
    assert '"email_reply_to": "owner@example.com"' in tail, "ההדגמה מחזירה את ההגדרות"


def test_orbit_unlink_by_employee_tells_owner(svc, monkeypatch):
    """critic סבב 73: ניתוק מאורביט (אחרי 68–69 יכול לעצור את השירות) נרשם ב-audit אבל בעל העסק לא קיבל הודעה."""
    from app.orbit_connect import OrbitConnect
    from app.secretbox import generate_key as gk
    monkeypatch.setenv("COLLECT_MASTER_KEYS", f"k1:{gk()}")
    OrbitConnect(svc.db).issue_secret("acme", at=svc.clock().isoformat())
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    assert api.post("/orbit/link/unlink").json() == {"unlinked": True}
    notes = [m for m in api.get("/owner/inbox").json() if m["intent"] == "settings_changed"]
    assert notes and "אורביט" in notes[0]["body"] and "owner" in notes[0]["body"], notes


def test_purge_records_who_triggered_it(svc):
    """/maintenance/purge מעובד נרשם כ-«system» — אי אפשר לדעת מי מחק."""
    from datetime import timedelta
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.post("/sync")
    svc.db.x("UPDATE invoices SET status='closed', closed_at=? WHERE id=1",
             ((svc.clock() - timedelta(days=200)).isoformat(),))
    api.post("/maintenance/purge")
    rows = svc.db.q("SELECT actor FROM audit WHERE action='retention_purge'")
    assert rows and rows[-1]["actor"] == "owner", [r["actor"] for r in rows]


def test_unlinker_cannot_dismiss_own_unlink_alert(svc):
    """critic סבב 73: אותו כלל של הפעלה 199 גם להתראת הניתוק — מי שניתק לא סוגר אותה בעצמו כשיש עובד אחר."""
    users = Users(svc.db, svc.clock)
    users.create("a@example.co.il", "א", PW)
    users.create("b@example.co.il", "ב", PW)
    svc.notify_owner_sensitive("הקישור לאורביט נותק על ידי user:1", "user:1")
    mid = svc.db.one("SELECT id FROM messages WHERE intent='settings_changed' ORDER BY id DESC")["id"]
    with pytest.raises(ValueError, match="עובד אחר"):
        svc.owner_message_done(mid, "user:1")
    assert svc.owner_message_done(mid, "user:2")["done"]


def test_interactive_demo_shows_owner_email_step_8():
    """הפעלה 202 («הבא» 2 מ-201): ההדגמה האינטראקטיבית (./demo.sh, app/demo.py) — לא רק --check — מציגה בלוג
    את שלב ⑧: עובד מחליף קישור תשלום ⇒ מייל לבעל העסק ל-owner@ + התראה פתוחה בתיבה; בעל העסק מחזיר את הקישור
    (הקישורים ב-SMS ממשיכים לדף הדמו) וסוגר רק את ההתראה על השינוי שלו."""
    from app.demo import DEMO_OTHER_LINK, DEMO_PAY_LINK, DEMO_WORKER, build_demo_service, run_scenario
    svc, fake, _ = build_demo_service()
    lines: list[str] = []
    t = run_scenario(svc, fake, out=lines.append)
    assert t["owner_inbox"] == 2   # הסיכום של ⑦ לא השתנה
    assert any(x.startswith("⑧") and DEMO_OTHER_LINK in x for x in lines), lines[-5:]
    assert any("owner@example.com" in x and "שינוי בהגדרות רגישות" in x for x in lines)
    mails = [m for m in svc.sender.sent if "שינוי בהגדרות רגישות" in (m.get("subject") or "")]
    assert [m["to"] for m in mails] == ["owner@example.com", "owner@example.com"]
    assert svc.s.payment_link == DEMO_PAY_LINK
    open_ = svc.db.q("SELECT message_id FROM messages WHERE intent='settings_changed' AND needs_owner=1")
    assert [r["message_id"] for r in open_] == [f"settings_changed:{DEMO_WORKER}"]
    acts = [r["action"] for r in svc.db.q("SELECT action FROM audit")]
    assert acts.count("settings_changed_email_sent") == 2


def test_interactive_demo_step_8_source_guard():
    """מגן-מקור: השלב רץ מתוך run_scenario (ולכן גם בשרת ההדגמה), ומשנה רק את קישור התשלום — שינוי Reply-To
    והחזרתו היו שולחים את מייל ההחזרה לכתובת הזמנית."""
    import inspect

    from app import demo
    assert "show_sensitive_settings_notice(svc, out)" in inspect.getsource(demo.run_scenario)
    src = inspect.getsource(demo.show_sensitive_settings_notice)
    assert "email_reply_to\":" not in src and "\"email_reply_to\"" not in src


# הפעלה 203 («הבא» 2 מ-202): מונה «מיילים שנשלחו» בדשבורד ספר גם את המייל לבעל העסק ⇒ אחרי שלב ⑧ בהדגמה
# הוצג 7 במקום 5. עכשיו: הרשומה ביומן מסומנת audience='owner', נשארת ב-/outbox, ולא נספרת במונה הלקוחות.
from app.channels import SentLog  # noqa: E402


def test_owner_email_is_not_counted_as_customer_email_on_dashboard(svc):
    _with_reply_to(svc, "owner@biz.example")
    before = svc.dashboard()["totals"]["sent_email"]
    mark = sent_mark(svc.sender.sent)
    svc.update_settings({"payment_link": NEW_LINK}, actor="user:3")
    mails = _owner_mails(svc, mark)
    assert len(mails) == 1 and mails[0]["audience"] == "owner", mails
    assert svc.dashboard()["totals"]["sent_email"] == before, "מייל לבעלים נספר כמייל ללקוח"
    assert svc.sender.sent.by_channel["email"] >= 1, "היומן עצמו (/outbox) עדיין כולל את המייל"


def test_customer_records_have_no_audience_key(svc):
    """רשומות ללקוחות ביט-זהות לקודם (בלי מפתח audience)."""
    from app.channels import Message
    mid = svc.sender.send(Message("email", "c@example.com", "x", subject="s"))
    rec = next(r for r in svc.sender.sent if r["id"] == mid)
    assert "audience" not in rec


def test_mark_owner_counts_once_and_survives_cap():
    log = SentLog(maxlen=2)
    log.append({"id": "a", "channel": "email"})
    log.mark_owner("a")
    log.mark_owner("a")   # פעמיים ⇒ נספר פעם אחת
    assert log.owner_by_channel == {"email": 1}
    for i in range(3):    # «a» נדחק מהתקרה — המונה לכל חיי התהליך נשמר
        log.append({"id": f"c{i}", "channel": "email"})
    log.mark_owner("missing")
    assert log.by_channel["email"] == 4 and log.owner_by_channel == {"email": 1}
    # בנייה מחדש מרשומות קיימות שומרת את הסיווג
    assert SentLog([{"id": "o", "channel": "email", "audience": "owner"}]).owner_by_channel == {"email": 1}


def test_plain_list_outbox_excludes_owner_records():
    from app.service import _sent_count
    out = [{"channel": "email"}, {"channel": "email", "audience": "owner"}, {"channel": "sms"}]
    assert _sent_count(out, "email") == 1 and _sent_count(out, "sms") == 1


def test_demo_check_locks_sent_email_unchanged_by_owner_mail():
    """הפעלה 204 («הבא» 2 מ-203): `demo.sh --check` משווה את «מיילים שנשלחו» בדשבורד לפני ואחרי שינוי
    ההגדרות (והחזרתן) — 2 מיילים לבעלים ב-/outbox, אפס שינוי במונה. מוטציה (_sent_count סופר גם owner) ⇒ demo נופל."""
    from pathlib import Path
    demo = (Path(__file__).resolve().parent.parent / "demo.sh").read_text(encoding="utf-8")
    i_before = demo.index('se0 = json.loads(get("/dashboard"))["totals"]["sent_email"]')
    i_put = demo.index('put("/api/settings", {"payment_link": "https://pay.example/gabi-other"')
    i_revert = demo.index('put("/api/settings", {"payment_link": "https://pay.example/gabi-demo"')
    i_after = demo.index('se1 = json.loads(get("/dashboard"))["totals"]["sent_email"]')
    assert i_before < i_put < i_revert < i_after
    assert "assert se1 == se0" in demo
    assert '["messages"]) - n0 == 2' in demo
