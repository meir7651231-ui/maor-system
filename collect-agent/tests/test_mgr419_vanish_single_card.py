"""מנהל 419 (ביקורת 251🟡): תקלת API שנמשכת כמה ימים ⇒ כרטיס `api_mass_vanish` **פתוח אחד** לתקלה (מתעדכן), לא כרטיס
חדש כל יום. «כולן באמת שולמו» מוריד גם כרטיסים ישנים (ממסד שנוצר לפני 419) שכל החשבוניות שלהם כבר נסגרו; כרטיס
שעדיין יש בו חשבונית פתוחה — נשאר. «השאר פתוחות» היום ⇒ לא מציקים שוב היום; מחר, אם התקלה נמשכת ⇒ כרטיס אחד חדש."""
import json
from datetime import timedelta

from tests.conftest import gi_doc


def _setup(svc, clock, fake_gi, n=6):
    fake_gi.docs[:] = [gi_doc(i, phone=f"050-00001{i:02d}") for i in range(1, n + 1)]
    svc.sync()
    fake_gi.docs[:] = []
    clock.now += timedelta(hours=2)
    svc.sync()


def _open_cards(svc):
    return svc.db.q("SELECT id, payload FROM messages WHERE intent='api_mass_vanish' AND needs_owner=1")


def _open_invoices(svc):
    return svc.db.one("SELECT COUNT(*) n FROM invoices WHERE status='open'")["n"]


def test_multi_day_outage_single_card_then_accept(svc, clock, fake_gi):
    _setup(svc, clock, fake_gi)
    for _ in range(4):
        clock.now += timedelta(days=1)
        svc.sync()
    cards = _open_cards(svc)
    assert len(cards) == 1
    assert json.loads(cards[0]["payload"])["gone"] == 6
    assert svc.accept_mass_close(cards[0]["id"])["closed"] == 6
    assert _open_cards(svc) == [] and _open_invoices(svc) == 0


def test_dismissed_today_no_new_card_today_but_tomorrow(svc, clock, fake_gi):
    _setup(svc, clock, fake_gi)
    svc.owner_message_done(_open_cards(svc)[0]["id"])     # «השאר פתוחות»
    clock.now += timedelta(hours=1)
    svc.sync()
    assert _open_cards(svc) == []                         # לא מציקים שוב באותו יום
    clock.now += timedelta(days=1)
    svc.sync()
    assert len(_open_cards(svc)) == 1                     # יום חדש, התקלה נמשכת ⇒ כרטיס אחד
    assert _open_invoices(svc) == 6                       # ועדיין לא נסגר דבר


def test_legacy_duplicate_cards_settled_by_accept(svc, clock, fake_gi):
    """מסד מלפני 419: שני כרטיסים פתוחים על אותן חשבוניות. «כולן שולמו» על אחד ⇒ גם השני יורד."""
    _setup(svc, clock, fake_gi)
    first = _open_cards(svc)[0]
    svc.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,payload,message_id,"
             "created_at) "
             "SELECT customer_id,direction,channel,body,intent,1,payload,'mass_vanish:legacy',created_at "
             "FROM messages WHERE id=?", (first["id"],))
    assert len(_open_cards(svc)) == 2
    svc.accept_mass_close(first["id"])
    assert _open_cards(svc) == []
    for row in svc.db.q("SELECT payload FROM messages WHERE intent='api_mass_vanish'"):
        assert json.loads(row["payload"]).get("resolved") == 1


def test_legacy_card_with_still_open_invoice_stays(svc, clock, fake_gi):
    """בקרה: כרטיס ישן שיש בו חשבונית שלא נסגרה ב«כולן שולמו» — נשאר (לא סוגרים חוב בלי הכרעה)."""
    _setup(svc, clock, fake_gi)
    first = _open_cards(svc)[0]
    cols = [r["name"] for r in svc.db.q("PRAGMA table_info(invoices)") if r["name"] not in ("id", "external_id")]
    c = ",".join(cols)
    # עמודות מ-PRAGMA של הסכמה עצמה (לא קלט) — העתק של חשבונית קיימת במזהה חיצוני חדש
    svc.db.x(f"INSERT INTO invoices(external_id,{c}) SELECT 'X-extra',{c} FROM invoices LIMIT 1")  # noqa: S608
    extra = svc.db.one("SELECT id FROM invoices WHERE external_id='X-extra'")["id"]
    svc.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,payload,message_id,"
             "created_at) "
             "VALUES(NULL,'system','owner','x','api_mass_vanish',1,?,'mass_vanish:legacy','2026-01-01')",
             (json.dumps({"invoice_ids": [extra], "gone": 1, "base": 7, "got": 0}),))
    svc.accept_mass_close(first["id"])
    assert len(_open_cards(svc)) == 1
