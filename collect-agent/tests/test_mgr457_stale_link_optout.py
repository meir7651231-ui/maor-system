"""מנהל 457 (מבקר 281🟠): /u/ ו-«הפסיקו» ב-/p/ שנשלחו לכתובת קודמת — חוסמים את הכתובת שאליה נשלח הקישור,
הלקוח לא מוסר, כרטיס לבעל העסק; עמודי התוצאה אומרים «הוסרתם» למי שלחץ."""
from __future__ import annotations

import json

from tests.conftest import gi_doc
from tests.test_critic_round281_unsub_after_contact_change import (
    NEW_MAIL,
    NEW_SMS,
    OLD_MAIL,
    OLD_SMS,
    _sent_then_contact_changed,
)


def _card(svc):
    return svc.db.q("SELECT * FROM messages WHERE customer_id=1 AND intent='optout_old_address' AND needs_owner=1")


def test_old_unsub_card_audit_and_done_page(svc, clock, fake_gi):
    api, tok, _ = _sent_then_contact_changed(svc, clock, fake_gi)
    r = api.post(f"/u/{tok}", headers={"accept": "text/html"}, follow_redirects=False)
    assert r.status_code == 303
    done = api.get(f"/u/{tok}/done", follow_redirects=False)
    assert done.status_code == 200 and "הוסרתם" in done.text
    assert len(_card(svc)) == 1
    a = svc.db.one("SELECT detail FROM audit WHERE action='optout_old_address'")
    assert json.loads(a["detail"])["customer"] == 1
    assert not svc.db.one("SELECT 1 FROM audit WHERE action='opt_out'")
    api.post(f"/u/{tok}")                       # לחיצה שנייה ⇒ כרטיס אחד
    assert len(_card(svc)) == 1
    # התזכורות ממשיכות לכתובות החדשות
    assert svc.db.one("SELECT COUNT(*) n FROM invoices WHERE customer_id=1 AND status='open'")["n"] >= 1


def test_old_paylink_stop_done_page(svc, clock, fake_gi):
    api, _, code = _sent_then_contact_changed(svc, clock, fake_gi)
    api.post(f"/p/{code}/stop", data={}, follow_redirects=False)
    done = api.get(f"/p/{code}/done?a=stop", follow_redirects=False)
    assert done.status_code == 200
    assert svc.suppressed("sms", OLD_SMS) and not svc.suppressed("email", NEW_MAIL)
    assert len(_card(svc)) == 1


def test_only_email_changed_still_full_opt_out(svc, clock, fake_gi):
    """הטלפון לא השתנה ⇒ ייתכן שהלוחץ הוא הלקוח עצמו (הקישור יצא גם ל-SMS שלו) ⇒ הסרה מלאה, כמו קודם."""
    svc.sync()
    rid = svc.plan()[0]
    svc.approve(rid, confirm_open=True)
    svc.dispatch()
    import re
    tok = re.findall(r"/u/([A-Za-z0-9_\-]{10,})", " ".join(str(m) for m in svc.sender.sent))[0]
    fake_gi.docs[0]["client"]["emails"] = [NEW_MAIL]
    svc.sync()
    assert svc.unsubscribe(tok)
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 1
    assert svc.suppressed("sms", OLD_SMS) and svc.suppressed("email", NEW_MAIL)


def test_legacy_token_without_sent_to_keeps_old_behavior(svc, clock, fake_gi):
    api, tok, _ = _sent_then_contact_changed(svc, clock, fake_gi)
    svc.db.x("UPDATE link_tokens SET sent_to=NULL")
    assert svc.unsubscribe(tok)
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 1
    assert not _card(svc)


def test_old_address_now_belongs_to_other_customer_is_opted_out(svc, clock, fake_gi):
    """הכתובת הישנה עברה ללקוח אחר (משק בית) ⇒ הוא מוסר — הכתובת שלו ביקשה.
    מנהל 458: קישור /u/ בתזכורת יוצא במייל בלבד ⇒ «הכתובת שביקשה» = המייל הישן (היה: הטלפון — הנחה שגויה)."""
    api, tok, _ = _sent_then_contact_changed(svc, clock, fake_gi)
    fake_gi.docs[1] = gi_doc(2, phone="050-2222222", name="יוסי לוי")
    fake_gi.docs[1]["client"]["emails"] = [OLD_MAIL]
    svc.sync()
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=2")["opted_out"] == 0
    api.post(f"/u/{tok}")
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=2")["opted_out"] == 1
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 0
    assert not svc.suppressed("sms", NEW_SMS)


def test_old_phone_holder_not_touched_by_email_only_unsub(svc, clock, fake_gi):
    """מנהל 458 (מבקר 282): הקישור יצא במייל ⇒ מי שמחזיק עכשיו בטלפון הישן לא ביקש — לא מוסר ולא נחסם."""
    api, tok, _ = _sent_then_contact_changed(svc, clock, fake_gi)
    fake_gi.docs[1] = gi_doc(2, phone="050-1234567", name="יוסי לוי")
    svc.sync()
    api.post(f"/u/{tok}")
    assert svc.suppressed("email", OLD_MAIL)
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=2")["opted_out"] == 0
    assert not svc.suppressed("sms", OLD_SMS)


def test_new_link_after_change_opts_out_normally(svc, clock, fake_gi):
    """טוקן שנוצר אחרי ההחלפה (נשלח לכתובות החדשות) ⇒ הסרה רגילה."""
    _sent_then_contact_changed(svc, clock, fake_gi)
    tok = svc.new_unsub_token(1)
    assert svc.unsubscribe(tok)
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 1
    assert svc.suppressed("email", NEW_MAIL)


def test_sent_to_stores_hashes_not_addresses(svc):
    svc.sync()
    svc.new_unsub_token(1)
    raw = svc.db.one("SELECT sent_to FROM link_tokens WHERE customer_id=1")["sent_to"]
    assert OLD_MAIL not in raw and "0501234567" not in raw and "972501234567" not in raw
    assert ["email", svc.addr_hash("email", OLD_MAIL)] in json.loads(raw)
