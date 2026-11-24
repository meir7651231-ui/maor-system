"""מבקר סבב 224 · 🟡 — כרטיס «שילמתי — לבדוק מול הרישומים» נשאר פתוח אחרי שהמקור כבר אישר שהחשבונית נסגרה.

רכיבים: `app/service.py` → `sync` / `import_csv` (`_csv_close_paid`) — סגירת חשבונית לא מטפלת בכרטיס `paid_claim`
הפתוח של אותו לקוח (`messages.needs_owner=1, intent='paid_claim'`).
זרימת CSV מקצה לקצה (סבב 224): ייבוא ⇒ אישור עם confirm_open ⇒ תזכורת ⇒ הלקוח «שילמתי אתמול בהעברה» ⇒ השהיה + כרטיס
⇒ הקובץ למחרת עוד «פתוח» (ההשהיה נשמרת ✓) ⇒ הקובץ הבא «שולם» ⇒ החשבונית נסגרת, הבאנר יורד ✓ — אבל הכרטיס
«דנה כתבה ששילמה — בדקו מול הרישומים» **נשאר ב«דורש טיפול»**, אף שהמקור כבר אישר. אותו דבר בסנכרון API (עקבי,
לא ייחודי ל-CSV). בעל העסק בודק ידנית משהו שכבר נבדק. הצעה: כשכל החשבוניות הפתוחות של הלקוח נסגרו במקור ⇒ הכרטיס
יורד (או מתעדכן ל«אושר במקור»). xfail(strict=True) ×2 (CSV, API)."""
from dataclasses import replace
from datetime import timedelta

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"
ROW = "9001,דנה כהן,050-1234567,d@x.example,1200,{},01/10/26,15/10/26\n"


def _open_paid_claim(svc):
    return svc.db.one("SELECT 1 FROM messages WHERE needs_owner=1 AND intent='paid_claim'")


def test_csv_close_resolves_paid_claim_card(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv((H + ROW.format("פתוח")).encode())
    svc.inbound("sms", "050-1234567", "שילמתי אתמול בהעברה")
    assert _open_paid_claim(svc)
    clock.now += timedelta(days=1)
    svc.import_csv((H + ROW.format("שולם")).encode())
    assert svc.db.one("SELECT status FROM invoices WHERE number='9001'")["status"] == "closed"
    assert not _open_paid_claim(svc)


def test_api_close_resolves_paid_claim_card(svc, fake_gi):
    svc.sync()
    svc.inbound("sms", "050-1234567", "שילמתי אתמול בהעברה")
    assert _open_paid_claim(svc)
    fake_gi.docs[0]["amount"], fake_gi.docs[0]["status"] = "0.00", 2
    svc.sync()
    assert not _open_paid_claim(svc)


# בקרות (גבי מנוע, התיקון): הכרטיס יורד רק כשכל החשבוניות הפתוחות של הלקוח נסגרו במקור אחרי הכרטיס
ROW2 = "9002,דנה כהן,050-1234567,d@x.example,300,{},02/10/26,16/10/26\n"


def test_control_card_stays_while_another_invoice_open(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv((H + ROW.format("פתוח") + ROW2.format("פתוח")).encode())
    svc.inbound("sms", "050-1234567", "שילמתי אתמול בהעברה")
    clock.now += timedelta(days=1)
    svc.import_csv((H + ROW.format("שולם") + ROW2.format("פתוח")).encode())
    assert _open_paid_claim(svc)                                  # עוד חוב פתוח ⇒ בעל העסק בודק


def test_control_card_stays_when_nothing_closed(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv((H + ROW.format("פתוח")).encode())
    svc.inbound("sms", "050-1234567", "שילמתי אתמול בהעברה")
    clock.now += timedelta(days=1)
    svc.import_csv((H + ROW.format("פתוח")).encode())
    assert _open_paid_claim(svc)


def test_resolution_is_audited(svc, clock):
    test_csv_close_resolves_paid_claim_card(svc, clock)
    assert svc.db.one("SELECT 1 FROM audit WHERE action='paid_claim_confirmed_by_source'")
