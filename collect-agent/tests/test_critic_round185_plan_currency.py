"""critic סבב 185 · 🔴 לתיקון בונה — רכיב: `app/service.py` → `_approve_plan_claimed`
(כל `templates.fmt_amount(...)` בלי
מטבע ⇒ ברירת מחדל ILS) ו-`plan_missed_text`/`_sweep_plans` (אותו דבר).

חשבונית בדולר ($500) ⇒ ההצעה בשיחה נכונה («$250 ב-15.11, $250 ב-15.12»), אבל ההודעה שיוצאת ללקוח מ-`approve_plan`
אומרת **«2 תשלומים של 250 ₪»** (וגם בנוסח המלא «1. 2026-11-15 — 250 ₪»), וכרטיס «הוחמץ» לבעל העסק: «(250 ₪…) היתרה
הפתוחה: 500 ₪». [מאומת בהרצה.] לקוח שמשלם לפי ההודעה משלם 500 ₪ במקום $500 — הודעת כסף שגויה שיוצאת ללקוח בשם
העסק, ובעל העסק מאשר אותה מתוך כרטיס שמציג את אותו סכום שגוי. הצעה: להעביר את מטבע החשבוניות (`invs[0]["currency"]`)
לכל `fmt_amount` במסלולי ההסדר. xfail(strict=True); הבקרה (שקל) נשארת ירוקה."""
from datetime import timedelta

import pytest


def _usd(fake_gi):
    fake_gi.docs[0]["currency"] = "USD"
    fake_gi.docs[0]["amount"] = "500.00"


@pytest.mark.xfail(strict=True, reason="critic 185: אישור הסדר בדולר נשלח ללקוח בשקלים (לתיקון בונה)")
def test_usd_plan_offer_sent_in_dollars(svc, fake_gi):
    _usd(fake_gi)
    svc.sync()
    r = svc.approve_plan(svc.propose_plan(1, 2), confirm_amount=True)
    sent = svc.sender.sent[-1]["body"]
    assert "₪" not in r["text"] and "$" in r["text"], r["text"]
    assert "₪" not in sent and "$" in sent, sent


@pytest.mark.xfail(strict=True, reason="critic 185: כרטיס «הוחמץ» להסדר בדולר מציג שקלים (לתיקון בונה)")
def test_usd_plan_missed_card_in_dollars(svc, fake_gi, clock):
    _usd(fake_gi)
    svc.sync()
    svc.approve_plan(svc.propose_plan(1, 2), confirm_amount=True)
    clock.now += timedelta(days=20)
    svc.sync()
    svc.plan()
    body = svc.db.one("SELECT body FROM messages WHERE intent='plan_missed'")["body"]
    assert "₪" not in body and "$" in body, body


def test_control_ils_plan_offer_in_shekels(svc):
    svc.sync()
    r = svc.approve_plan(svc.propose_plan(1, 3), confirm_amount=True)
    assert "400 ₪" in r["text"]
