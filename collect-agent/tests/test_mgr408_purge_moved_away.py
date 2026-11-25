"""מנהל 408 · מבקר 242🟠 (ר-10): לקוחה שהחשבוניות שלה עברו בקובץ ללקוחה אחרת מותממת כשכל מה שעבר ממנה נמחק.

`service._moved_away_all_purged` — שומרים: חשבונית שעברה ועדיין פתוחה/נסגרה לפני פחות מ-90 יום ⇒ דנה נשארת;
legal_hold על דנה ⇒ נשארת; לקוח שמעולם לא היו לו חשבוניות ⇒ לא נוגעים (ההתנהגות הקודמת)."""
from datetime import timedelta

from tests.test_critic_round239_inherited_optout import DANA, MICHAL, H, _row, _sent_to_dana


def _moved(svc, clock):
    _sent_to_dana(svc, clock)
    svc.inbound("sms", DANA, "מתי מגיע מועד התשלום?")
    clock.now += timedelta(days=1)
    svc.import_csv(_row("מיכל לוי", MICHAL))


def _paid(svc, clock):
    clock.now += timedelta(days=1)
    svc.import_csv((H + f"9001,מיכל לוי,{MICHAL},,1200,שולם,01/10/26,15/10/26\n").encode())


def _dana(svc):
    return svc.db.one("SELECT name, phone, purged_at FROM customers WHERE id=1")


def test_moved_invoice_still_open_keeps_previous(svc, clock):
    _moved(svc, clock)
    clock.now += timedelta(days=200)
    svc.purge_closed()
    assert _dana(svc)["name"] == "דנה כהן" and not _dana(svc)["purged_at"]


def test_moved_invoice_closed_recently_keeps_previous(svc, clock):
    _moved(svc, clock)
    _paid(svc, clock)
    clock.now += timedelta(days=30)
    svc.purge_closed()
    assert _dana(svc)["phone"] and not _dana(svc)["purged_at"]


def test_legal_hold_on_previous_blocks_purge(svc, clock):
    _moved(svc, clock)
    svc.set_legal_hold(1, "תיק 123/26 — בקשת עו״ד")
    _paid(svc, clock)
    clock.now += timedelta(days=100)
    svc.purge_closed()
    assert _dana(svc)["phone"] and not _dana(svc)["purged_at"]


def test_customer_without_any_history_untouched(svc, clock):
    _moved(svc, clock)
    svc.db.x("INSERT INTO customers (name, phone) VALUES ('רינה', '050-7777777')")
    rina = svc.db.one("SELECT id FROM customers WHERE phone='050-7777777'")["id"]
    _paid(svc, clock)
    clock.now += timedelta(days=100)
    svc.purge_closed()
    assert svc.db.one("SELECT name, purged_at FROM customers WHERE id=?", (rina,))["name"] == "רינה"
    assert _dana(svc)["purged_at"]
