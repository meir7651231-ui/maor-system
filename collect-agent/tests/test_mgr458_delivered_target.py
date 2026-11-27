"""מנהל 458 (מבקר 282🟡): `sent_to` מסמן את הכתובת שאליה ההודעה עם הקישור יצאה בפועל ([ערוץ, גיבוב, "to"]);
בהסרה מלאה (אחת מכתובות הלקוח עדיין נוכחית) — גם הכתובת הזו נחסמת, גם אם כבר אינה שלו."""
from __future__ import annotations

import json
import re
from datetime import timedelta

from fastapi.testclient import TestClient

from app.main import create_app
from app.ratelimit import RateLimiter
from tests.conftest import OWNER_TOKEN, gi_doc

OLD_MAIL, NEW_MAIL = "c1@example.com", "new@example.com"


def _sent(svc):
    svc.sync()
    rid = svc.plan()[0]
    svc.approve(rid, confirm_open=True)
    svc.dispatch()
    blob = " ".join(str(m) for m in svc.sender.sent)
    return re.findall(r"/u/([A-Za-z0-9_\-]{10,})", blob)[0], re.findall(r"/p/([A-Za-z0-9_\-]{4,})", blob)[0]


def _change_email(svc, clock, fake_gi):
    fake_gi.docs[0] = gi_doc(1)
    fake_gi.docs[0]["client"]["emails"] = [NEW_MAIL]
    clock.now += timedelta(hours=1)
    svc.sync()
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN, limiter=RateLimiter(rules={})))


def test_reminder_token_marks_email_as_delivered(svc):
    _sent(svc)
    rows = [json.loads(r["sent_to"]) for r in svc.db.q("SELECT sent_to FROM link_tokens WHERE kind='unsub'")]
    marked = [e for row in rows for e in row if len(e) >= 3]
    assert marked and all(e[0] == "email" and e[2] == "to" for e in marked)
    assert ["email", svc.addr_hash("email", OLD_MAIL), "to"] in marked
    # הגיבוב בלבד — בלי כתובת גלויה
    assert not any(OLD_MAIL in r["sent_to"] for r in svc.db.q("SELECT sent_to FROM link_tokens"))


def test_email_only_change_unsub_blocks_old_email_and_removes_customer(svc, clock, fake_gi):
    tok, _ = _sent(svc)
    _change_email(svc, clock, fake_gi).post(f"/u/{tok}")
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 1
    assert svc.suppressed("email", OLD_MAIL) and svc.suppressed("email", NEW_MAIL)


def test_old_email_not_double_written_to_ledger_when_current(svc):
    """בלי שינוי — הכתובת שאליה נשלח היא הנוכחית ⇒ נחסמת פעם אחת (דרך _opt_out), לא שורה כפולה."""
    tok, _ = _sent(svc)
    assert svc.unsubscribe(tok)
    h = svc.addr_hash("email", OLD_MAIL)
    assert svc.db.one("SELECT COUNT(*) n FROM suppressions WHERE hash=?", (h,))["n"] == 1
    assert not svc.db.one("SELECT 1 FROM suppressions WHERE reason='link' AND hash=? AND channel='sms'", (h,))


def test_paylink_stop_email_only_change_removes_customer_not_old_email(svc, clock, fake_gi):
    """/p/ יוצא ב-SMS בלבד ⇒ `to` = הטלפון (עדיין נוכחי) ⇒ הסרה מלאה; המייל הישן לא קיבל את הקישור — לא נחסם."""
    _, code = _sent(svc)
    assert not svc.db.one("SELECT 1 FROM messages WHERE channel='email' AND instr(body, ?) > 0", (f"/p/{code}",))
    api = _change_email(svc, clock, fake_gi)
    api.post(f"/p/{code}/stop", data={}, follow_redirects=False)
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 1
    assert svc.suppressed("email", NEW_MAIL) and not svc.suppressed("email", OLD_MAIL)


def test_legacy_457_token_without_mark_keeps_457_behavior(svc, clock, fake_gi):
    """טוקן מ-457 (רשומות [ערוץ, גיבוב] בלי סימון) ⇒ הסרה מלאה, בלי חסימה נוספת של המייל הישן."""
    tok, _ = _sent(svc)
    for r in svc.db.q("SELECT token_hash, sent_to FROM link_tokens"):
        legacy = [e[:2] for e in json.loads(r["sent_to"] or "[]")]
        svc.db.x("UPDATE link_tokens SET sent_to=? WHERE token_hash=?", (json.dumps(legacy), r["token_hash"]))
    _change_email(svc, clock, fake_gi).post(f"/u/{tok}")
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 1
    assert not svc.suppressed("email", OLD_MAIL)


def test_reply_token_marks_its_channel(svc):
    svc.sync()
    cust = svc.db.one("SELECT * FROM customers WHERE id=1")
    svc.new_unsub_token(1, "sms")
    row = json.loads(svc.db.one("SELECT sent_to FROM link_tokens ORDER BY rowid DESC LIMIT 1")["sent_to"])
    assert ["sms", svc.addr_hash("sms", cust["phone"]), "to"] in row
    assert ["sms", svc.addr_hash("sms", cust["phone"])] not in row   # אין כפילות של אותה כתובת
