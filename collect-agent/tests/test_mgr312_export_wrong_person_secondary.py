"""מנהל 312 · תיקון critic 165 — «מספר שגוי» ככוונה **משנית** (ליד הסרה/גיל) בייצוא בקשת העיון.

ה-intent הראשי נשאר opt_out/minor, ולכן הסינון של 164 (intent=='wrong_person') פספס. עכשיו:
  • ההודעה הנכנסת מסומנת ב-payload (`compliance.THIRD_PARTY_PAYLOAD`) ⇒ שורה בלי תוכן;
  • טיוטה שנוסחה לכתובת שנחסמה (blocked_phone/blocked_email = הכתובת של הזר) לא נמסרת, וגם ההודעה היוצאת שלה.
בקרות: «הסר» של הלקוחה עצמה (בלי «מספר שגוי») נמסר במלואו; ה-intent הראשי לא השתנה."""
import pytest

from app import compliance

MIXED = "wrong number, stop texting me"


def test_secondary_marked_in_payload_intent_unchanged(svc):
    svc.sync()
    svc.inbound("sms", "0501234567", MIXED)
    m = svc.db.one("SELECT intent, payload FROM messages WHERE customer_id=1 AND direction='in'")
    assert m["intent"] != "wrong_person" and m["payload"] == compliance.THIRD_PARTY_PAYLOAD
    rows = [x for x in svc.customer_data_export(1)["messages"] if x["direction"] == "in"]
    assert len(rows) == 1 and "אינם של הלקוח" in rows[0]["body"] and "payload" not in rows[0]


@pytest.mark.parametrize("msg", ["זה לא המספר של דנה, תפסיקו לשלוח לי", MIXED])
def test_secondary_reply_to_stranger_not_exported(svc, msg):
    svc.sync()
    svc.inbound("sms", "0501234567", msg)
    d = svc.db.one("SELECT id, body FROM drafts WHERE customer_id=1 ORDER BY id DESC LIMIT 1")
    if d and d["body"]:
        svc.inbox.approve_draft(d["id"])
        e = svc.customer_data_export(1)
        assert d["body"] not in str(e["messages"])
    e = svc.customer_data_export(1)
    assert not e["drafts"]
    assert "to_addr" not in str(e["drafts"]) and "1234567" not in str(e)


def test_control_customer_own_opt_out_kept(svc):
    svc.sync()
    svc.inbound("sms", "0501234567", "הסר אותי בבקשה")
    m = svc.db.one("SELECT payload FROM messages WHERE customer_id=1 AND direction='in'")
    assert m["payload"] is None
    assert "הסר אותי בבקשה" in str(svc.customer_data_export(1)["messages"])


def test_secondary_email_reply_to_stranger_not_exported(svc):
    svc.sync()
    svc.inbound("email", "C1@Example.com", "wrong person, please stop emailing me")
    assert svc.db.one("SELECT email FROM customers WHERE id=1")["email"] is None
    e = svc.customer_data_export(1)
    assert "stop emailing me" not in str(e) and "c1@example.com" not in str(e).lower()
    assert not e["drafts"]
