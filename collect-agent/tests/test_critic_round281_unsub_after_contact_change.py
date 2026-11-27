"""מבקר סבב 281 (🟠, גבי מנוע): קישור הסרה (/u/) או «הפסיקו» (/p/) שנשלח לכתובת **ישנה** — אחרי שהמקור עדכן ללקוח
טלפון ומייל (אותו לקוח, סנכרון API) — מסיר את הלקוח וחוסם את הכתובות **החדשות**, והכתובת שביקשה לא נחסמת.

✓ אימות: 279א (קריסה BaseException אחרי תפיסת כרטיס משותף ⇒ הכרטיס חוזר, ניסיון חוזר מצליח, אין תזכורות למחרת) ·
279ב (מנהל 455) · 280 (16165654: קוד /p/ מתחלף במעבר חשבונית; הקישור הישן פועל על הנמען המקורי) · ℹ️ 275 (מנהל 456:
«התזכורת כבר אושרה — על ידי רחל ב-8.11 10:00»).
[מאומת] תזכורת יצאה ל-050-1234567 + c1@example.com (עם /u/<טוקן> במייל ו-/p/<קוד> ב-SMS). סנכרון: אותו לקוח (cl1) עם
050-7777777 + new@example.com. מי שקיבל את ההודעה הישנה לוחץ «הסירו אותי» ⇒ `unsubscribe` ⇒ `_opt_out(customer)` ⇒
opted_out=1 + suppression על **050-7777777 / new@example.com**; `suppressed(c1@example.com)` = False.
אותו דבר ב-/p/«הפסיקו».
אותה משפחה כמו 265 (DLR 201 חסם את הטלפון החדש — תוקן: חוסמים את הכתובת שאליה נשלח, מסירים רק אם זו עדיין הכתובת).
מצופה: חסימת הכתובת שאליה נשלח הקישור; הסרת הלקוח רק אם זו עדיין הכתובת שלו, אחרת כרטיס לבעל העסק.
רכיב: app/service.py → unsubscribe / landing_action('stop') ⇒ _opt_out (לפי הלקוח, לא לפי הנמען); link_tokens בלי כתובת.
"""
from __future__ import annotations

import re
from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.ratelimit import RateLimiter
from tests.conftest import OWNER_TOKEN, gi_doc

OLD_SMS, OLD_MAIL = "972501234567", "c1@example.com"
NEW_SMS, NEW_MAIL = "972507777777", "new@example.com"


def _sent_then_contact_changed(svc, clock, fake_gi):
    svc.sync()
    rid = svc.plan()[0]
    svc.approve(rid, confirm_open=True)
    svc.dispatch()
    tok = re.findall(r"/u/([A-Za-z0-9_\-]{10,})", " ".join(str(m) for m in svc.sender.sent))[0]
    code = svc.db.one("SELECT short_code FROM invoices WHERE id=1")["short_code"]
    fake_gi.docs[0] = gi_doc(1, phone="050-7777777")
    fake_gi.docs[0]["client"]["emails"] = [NEW_MAIL]
    clock.now += timedelta(hours=1)
    svc.sync()
    assert svc.db.one("SELECT email FROM customers WHERE id=1")["email"] == NEW_MAIL
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN, limiter=RateLimiter(rules={})))
    return api, tok, code


def test_unsub_without_change_blocks_current_control(svc):
    svc.sync()
    tok = svc.new_unsub_token(1)
    assert svc.unsubscribe(tok)
    assert svc.suppressed("email", OLD_MAIL) and svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"]


@pytest.mark.xfail(strict=True, reason="מבקר 281🟠: /u/ ישן אחרי החלפת מייל — חוסם את החדש ומסיר, הישן לא נחסם")
def test_old_unsub_link_blocks_old_address_only(svc, clock, fake_gi):
    api, tok, _ = _sent_then_contact_changed(svc, clock, fake_gi)
    api.post(f"/u/{tok}")
    assert svc.suppressed("email", OLD_MAIL)
    assert not svc.suppressed("email", NEW_MAIL)
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 0


@pytest.mark.xfail(strict=True, reason="מבקר 281🟠: «הפסיקו» ב-/p/ ישן אחרי החלפת טלפון — חוסם את החדש ומסיר")
def test_old_paylink_stop_blocks_old_phone_only(svc, clock, fake_gi):
    api, _, code = _sent_then_contact_changed(svc, clock, fake_gi)
    api.post(f"/p/{code}/stop", data={}, follow_redirects=False)
    assert svc.suppressed("sms", OLD_SMS)
    assert not svc.suppressed("sms", NEW_SMS)
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 0
