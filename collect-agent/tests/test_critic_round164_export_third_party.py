"""critic סבב 164 · 🟠 לתיקון בונה — רכיב: `app/service.py` → `CollectService.customer_data_export`
(`efa11277`, מנהל 309, זכות עיון — GET /customers/{cid}/data).

הייצוא שנמסר ללקוחה (דנה) כולל מידע על **אדם שלישי**: מי שקיבל SMS במספר שגוי וענה «טעות במספר, אני לא מכיר את דנה»:
  • `customer.blocked_phone` = '050-1234567' — הטלפון של הזר (כך גבי חוסמת אותו), לא של דנה;
  • `messages`: ההודעה שהזר כתב (intent=wrong_person);
  • `drafts`: «סליחה על ההטרדה!…» — טיוטת התשובה לזר.
בקשת עיון לפי סעיף 13 נותנת לאדם את המידע **עליו**; מסירת מספר הטלפון וההודעה של מי שאינו הלקוח = חשיפת PII של
צד שלישי (הקובץ נוסף כ-«⬇ ייצוא מידע (בקשת עיון)» ב-`a9f0c520` — מיועד למסירה ללקוח). [מאומת בהרצה]
הצעה: להחריג `blocked_phone`/`blocked_email` ואת ההודעות/הטיוטות של intent `wrong_person` (או להחליף בשורה
«התקבלה הודעה ממספר שאינו שלך; פרטיו לא נמסרים»). הבדיקות xfail(strict=True); הבקרה חייבת להישאר ירוקה.

תוקן במנהל 311: blocked_phone/blocked_email מוסתרים; ההודעה הנכנסת נשארת כשורה עם תוכן מוחלף;
טיוטת התשובה לזר וההודעה היוצאת אליו (לפי message_id של הטיוטה) לא נמסרות."""
import pytest

WRONG = "טעות במספר, אני לא מכיר את דנה"


@pytest.fixture
def exported(svc):
    svc.sync()
    svc.inbound("sms", "0501234567", WRONG)
    return svc.customer_data_export(1)


def test_export_has_no_third_party_phone(exported):
    assert "1234567" not in str(exported["customer"])


def test_export_has_no_wrong_person_messages(exported):
    assert WRONG not in str(exported["messages"])
    assert not [d for d in exported["drafts"] if d["intent"] == "wrong_person"]


def test_control_export_keeps_customers_own_data(svc):
    svc.sync()
    svc.inbound("sms", "0501234567", "אשלם ב-1.12")
    e = svc.customer_data_export(1)
    assert e["customer"]["name"] == "דנה כהן" and e["customer"]["email"] == "c1@example.com"
    assert "אשלם ב-1.12" in str(e["messages"]) and e["invoices"]


def test_export_keeps_wrong_number_event_without_content(exported):
    rows = [m for m in exported["messages"] if m["intent"] == "wrong_person"]
    assert len(rows) == 1 and "אינם של הלקוח" in rows[0]["body"] and "דנה" not in rows[0]["body"]
    assert "blocked_phone" not in exported["customer"] and "blocked_email" not in exported["customer"]
    assert "צד שלישי" in exported["note"]


def test_export_drops_sent_reply_to_stranger(svc):
    svc.sync()
    svc.inbound("sms", "0501234567", WRONG)
    d = svc.db.one("SELECT id FROM drafts WHERE customer_id=1 AND intent='wrong_person'")
    svc.inbox.approve_draft(d["id"])
    sent = svc.db.one("SELECT message_id FROM drafts WHERE id=?", (d["id"],))["message_id"]
    assert sent and svc.db.one("SELECT 1 FROM messages WHERE direction='out' AND message_id=?", (sent,))
    e = svc.customer_data_export(1)
    assert "סליחה על ההטרדה" not in str(e["messages"])
    assert not [x for x in e["drafts"] if x["intent"] == "wrong_person"]


def test_control_other_outbound_kept(svc):
    """בקרה: תזכורות שיצאו ללקוחה (גם אם הגיעו למספר השגוי) הן מידע עליה — נשארות."""
    svc.sync()
    for rid in svc.plan():
        if svc._reminder(rid)["invoice_id"] in {r["id"] for r in svc.db.q(
                "SELECT id FROM invoices WHERE customer_id=1")}:
            svc.approve(rid, confirm_open=True)
    svc.dispatch()
    before = [m for m in svc.customer_data_export(1)["messages"] if m["direction"] == "out"]
    svc.inbound("sms", "0501234567", WRONG)
    after = [m for m in svc.customer_data_export(1)["messages"] if m["direction"] == "out"]
    assert before, "בקרה ריקה — dispatch לא שלח תזכורת"
    assert after == before
