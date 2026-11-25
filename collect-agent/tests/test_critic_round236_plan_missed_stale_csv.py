"""מבקר סבב 236 · 🟡 — הסדר במקור CSV מסומן «הוחמץ — לא התקבל» לפי קובץ ישן, ולא חוזר כשקובץ חדש מראה שהתשלום שולם.

רכיבים: `app/service.py` → `plan_progress` (missed: «שולם» = סכום ההסדר − יתרה פתוחה **ב-DB**, בלי לבדוק את גיל
הקובץ — `_csv_freshness` קיים ומשמש את סיכום הבוקר ו-`_refresh_invoice`) + כרטיס `plan_missed` («תשלום 1 מתוך 3
… לא התקבל»). תרחיש: 9001 דנה 1,200 ₪ ⇒ הסדר 3×400 (16.11/16.12/16.1) אושר ו«מאשר». הקובץ האחרון הועלה 9.11.
24.11 (אחרי חסד 8 ימים) ⇒ ההסדר «הוחמץ», כרטיס «תשלום 1 … לא התקבל», ותזכורת רגילה על 1,200 ₪ לאישור — אף
שאין מידע חדש מאז 9.11 (לפני מועד התשלום). 30.11 בעל העסק מעלה קובץ: יתרה 800 (התשלום שולם) ⇒ ההסדר נשאר
«הוחמץ», הכרטיס לא מתוקן, והתזכורת הרגילה מתעדכנת ל-800 ₪ וממתינה — ללקוחה שעמדה בהסדר.
✓ נבדק בלי ממצא (סנכרון רגיל): תשלום חלקי 200/400 ⇒ «התקבלו רק 200 ₪ מתוכו», הוחמץ אחרי החסד; השלמה בתוך החסד ⇒
לא הוחמץ; תשלום-יתר 900 ⇒ שני התשלומים הראשונים מכוסים, «הוחמץ» רק ב-24.1 על 100 ₪ חסרים.
הצעה: במקור CSV — לא לסמן «הוחמץ» כשהקובץ האחרון ישן ממועד התשלום (או לנסח «לפי הקובץ מ-9.11»), וקובץ חדש
שמכסה את התשלומים שהגיע מועדם ⇒ ההסדר חוזר ל-approved והכרטיס יורד. xfail(strict=True)."""
from dataclasses import replace
from datetime import timedelta

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"
DANA = "050-1234567"


def _row(amt):
    return (H + f"9001,דנה כהן,{DANA},d@x.example,{amt},פתוח,01/10/26,15/10/26\n").encode()


def _plan_accepted(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv(_row(1200))
    clock.now += timedelta(days=1)
    rids = svc.plan()
    svc.approve(rids[0], confirm_open=True)
    svc.dispatch()
    r = svc.inbound("sms", DANA, "אפשר בשלושה תשלומים?")
    svc.inbox.approve_draft(r["draft_id"], confirm_amount=True)
    r = svc.inbound("sms", DANA, "מאשר")
    svc.inbox.approve_draft(r["draft_id"], confirm_amount=True)
    assert svc.db.one("SELECT status FROM plans")["status"] == "approved"


def _until(svc, clock, day, upload=None):
    while clock.now.date().isoformat() < day:
        clock.now += timedelta(days=1)
        if upload and clock.now.date().isoformat() == upload[0]:
            svc.import_csv(_row(upload[1]))
        svc.plan()


def test_partial_within_grace_is_not_missed(svc, clock):
    """שומר: 200 לפני המועד + 200 בתוך החסד ⇒ לא הוחמץ."""
    _plan_accepted(svc, clock)
    _until(svc, clock, "2026-11-14")
    svc.import_csv(_row(1000))
    _until(svc, clock, "2026-11-20")
    svc.import_csv(_row(800))
    _until(svc, clock, "2026-12-01")
    assert svc.db.one("SELECT status FROM plans")["status"] == "approved"


def test_stale_csv_missed_is_restored_by_fresh_file(svc, clock):
    _plan_accepted(svc, clock)
    _until(svc, clock, "2026-11-30", upload=("2026-11-30", 800))
    status = svc.db.one("SELECT status FROM plans")["status"]
    card = svc.db.one("SELECT body, needs_owner FROM messages WHERE intent='plan_missed'")
    assert status == "approved" and (card is None or not card["needs_owner"]), (status, card and card["body"])
