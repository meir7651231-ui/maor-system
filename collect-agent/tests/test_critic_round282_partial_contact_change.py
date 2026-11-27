"""מבקר סבב 282 (🟡, גבי מנוע): קישור /u/ מהמייל הישן אחרי שהוחלף **רק** המייל (הטלפון נשאר) — הכתובת שביקשה לא נחסמת.

✓ אימות 281 (מנהל 457) [מאומת]: טלפון+מייל הוחלפו ⇒ חוסמים את הכתובת שאליה נשלח, הלקוח לא מוסר, כרטיס
`optout_old_address`. ✓ לקוח שנמחק (purge): `link_tokens` נמחקים איתו ו-short_code מתאפס ⇒ /u/ ו-/p/ ישנים ⇒ 404.
ℹ️ «שילמתי»/«פריסה» מקישור /p/ ישן אחרי החלפת טלפון ⇒ נרשם ללקוח הנוכחי (השהיה + כרטיס) — מגן ולא שולח, נשאר ℹ️.
🟡 282: `new_unsub_token` שומר ב-`sent_to` את **כל** הכתובות של הלקוח ברגע ההנפקה (SMS + מייל), לא את הכתובת שאליה
יצאה ההודעה שבה הקישור. הוחלף רק המייל (c1@example.com ⇒ new@example.com, הטלפון זהה) ⇒ «אחת הכתובות עדיין שלו» ⇒
הסרת הלקוח (שמרני — בסדר), אבל החסימה חלה על הכתובות **הנוכחיות** (new@ + הטלפון), ו-`suppressed(c1@example.com)`
= False: הכתובת שממנה ביקשו הסרה לא חסומה, ואם תשויך ללקוח אחר — תקבל מיילים.
מצופה: `sent_to` = הכתובת שבה הקישור נשלח בפועל (מייל ⇒ רק המייל), והיא נחסמת בכל מקרה.
רכיב: app/service.py → new_unsub_token (sent_to) / unsubscribe.
✓ מנהל 458: xfail הוסר (ראו test_mgr458_delivered_target.py).
"""
from __future__ import annotations

import re
from datetime import timedelta

from fastapi.testclient import TestClient

from app.main import create_app
from app.ratelimit import RateLimiter
from tests.conftest import OWNER_TOKEN, gi_doc


def _email_changed_only(svc, clock, fake_gi):
    svc.sync()
    rid = svc.plan()[0]
    svc.approve(rid, confirm_open=True)
    svc.dispatch()
    tok = re.findall(r"/u/([A-Za-z0-9_\-]{10,})", " ".join(str(m) for m in svc.sender.sent))[0]
    fake_gi.docs[0] = gi_doc(1)                       # אותו טלפון
    fake_gi.docs[0]["client"]["emails"] = ["new@example.com"]
    clock.now += timedelta(hours=1)
    svc.sync()
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN, limiter=RateLimiter(rules={})))
    api.post(f"/u/{tok}")


def test_customer_still_opted_out_conservatively_control(svc, clock, fake_gi):
    _email_changed_only(svc, clock, fake_gi)
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 1



def test_old_email_that_unsubscribed_is_suppressed(svc, clock, fake_gi):
    _email_changed_only(svc, clock, fake_gi)
    assert svc.suppressed("email", "c1@example.com")
