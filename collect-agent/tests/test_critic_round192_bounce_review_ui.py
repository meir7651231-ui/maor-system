"""critic סבב 192 · 🟠 לתיקון בונה — רכיבים: `app/service.py` → `owner_message_done` (לא מגן על כרטיס
`email_bounce_review`) + `web/src` / `app/ui.html` (אין כפתור «אשר חסימה / החזר מיילים» ל-POST
/customers/{cid}/email-bounce, ואין תווית ב-notices.ts).

אחרי הכרעת q22-04 (`2ddf4a71`): DSN שלא אומת ⇒ השהיית מייל + כרטיס «בדוק ואשר». **[מאומת]** DSN מזויף מ-
`MAILER-DAEMON@evil.example` (DMARC fail) ⇒ כרטיס `email_bounce_review` + השהיה; הפעולה היחידה במסך היא «✓ טופל» ⇒
`owner_message_done` ⇒ `done: True`, הכרטיס יורד — **וההשהיה נשארת**: בסבב הבא 0 מיילים לדנה, ואין שום דבר במסך שמזכיר.
אותו דפוס כמו 177א (כרטיס עצירת שחזור). ה-API להכרעה (`confirm_email_bounce`) קיים — אבל אף מסך לא קורא לו.
הצעה: «טופל» על email_bounce_review לא סוגר בלי הכרעה (כמו restore_hold, `done: false` + הסבר), וכפתורי «זה נכון —
חסום» / «הכתובת תקינה — החזר מיילים» בכרטיס (/app/ + /ui). xfail(strict=True); הבקרה (הכרעה דרך ה-API) ירוקה."""
from datetime import timedelta
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
FAIL = "mx.example; spf=fail; dkim=fail; dmarc=fail"


def _forged(svc, clock):
    svc.sync()
    clock.now += timedelta(days=3)
    for rid in svc.plan():
        try:
            svc.approve(rid, confirm_open=True)
        except (ValueError, PermissionError):
            pass
    svc.dispatch()
    svc.email_webhook("MAILER-DAEMON@evil.example", "Final-Recipient: rfc822; c1@example.com\nStatus: 5.1.1\n", "fb1",
                      subject="Undelivered Mail Returned to Sender", auth_results=FAIL)
    return [c["id"] for c in svc.db.q("SELECT id FROM messages WHERE needs_owner=1 AND intent='email_bounce_review'")]


def test_done_on_bounce_review_does_not_hide_pause(svc, clock):
    for cid in _forged(svc, clock):
        svc.owner_message_done(cid)
    still_card = svc.db.one("SELECT 1 FROM messages WHERE needs_owner=1 AND intent='email_bounce_review'")
    assert not svc.email_bounce_pending("c1@example.com") or still_card


def test_ui_offers_bounce_decision():
    files = [*(ROOT / "web" / "src").rglob("*.ts*"), ROOT / "app" / "ui.html"]
    code = [ln for f in files for ln in f.read_text(encoding="utf-8").splitlines()
            if not ln.strip().startswith(("//", "*", "/*"))]
    assert any("/email-bounce" in ln for ln in code)


def test_control_api_decision_releases(svc, clock):
    _forged(svc, clock)
    assert svc.confirm_email_bounce(1, False)["email"] == "resumed"
    assert not svc.email_bounce_pending("c1@example.com")


# ── מנהל 343: התיקון ──────────────────────────────────────────────────────────────────────────────────────
def test_done_refused_while_pending_with_reason_and_audit(svc, clock):
    cards = _forged(svc, clock)
    assert cards
    r = svc.owner_message_done(cards[0])
    assert r["done"] is False and r["email_bounce_review"] and "החזר מיילים" in r["reason"]
    assert svc.db.one("SELECT needs_owner FROM messages WHERE id=?", (cards[0],))["needs_owner"] == 1
    assert svc.db.one("SELECT 1 FROM audit WHERE action='owner_message_done_refused'"
                      " AND detail LIKE '%email_bounce_pending%'")


@pytest.mark.parametrize("confirm,state", [(True, "blocked"), (False, "resumed")])
def test_decision_closes_card(svc, clock, confirm, state):
    cards = _forged(svc, clock)
    assert svc.confirm_email_bounce(1, confirm)["email"] == state
    assert all(svc.db.one("SELECT needs_owner FROM messages WHERE id=?", (c,))["needs_owner"] == 0 for c in cards)
    assert svc.email_bounce_confirmed("c1@example.com") is confirm


def test_stale_card_after_address_change_can_be_done(svc, clock):
    cards = _forged(svc, clock)
    svc.db.x("UPDATE customers SET email='new@example.com' WHERE id=1")
    assert svc.owner_message_done(cards[0])["done"] is True


def test_dashboard_wires_both_decisions():
    src = (ROOT / "web/src/pages/Dashboard.tsx").read_text(encoding="utf-8")
    assert "api.emailBounce(n.customerId!, false)" in src and "api.emailBounce(n.customerId!, true)" in src
