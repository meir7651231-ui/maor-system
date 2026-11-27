"""מבקר סבב 284 (שמירה, ללא ממצא): מתי הודעה נכנסת יורדת מ«דורש טיפול» (totals.owner_inbox / KPI ב-/ui).

✓ אימות 283 (מנהל 460): בקשת פריסה יורדת כשההסדר אושר ויצא. מנהל 459 («השאר פתוחות»‖«כולן שולמו» — 409) — בדיקות הצוות.
[מאומת] לכל כוונה: תשובה מאושרת ונשלחת, ואז «שולם מחוץ למערכת» ותכנון למחרת —
  · יורדות מיד (אין מה לעשות): promise, how_to_pay, thanks, opt_out, plan_request (אחרי 460).
  · נשארות בצדק (נדרשת פעולה ידנית של בעל העסק): copy_request (לשלוח העתק), callback (להתקשר), dispute, wrong_person
    (לתקן פרטי קשר במקור), unknown (אין טיוטה — לכתוב תשובה).
  · paid_claim: נשארת אחרי «שולם מחוץ למערכת» ויורדת רק בסנכרון/ייבוא הבא (224). ℹ️ (BACKLOG גבי מנוע): בעסק CSV —
    עד הייבוא הבא; בעל העסק סימן «שולם» בעצמו = הבדיקה נעשתה.
רכיב: app/service.py → _resolve_paid_claims_closed_at_source (sync/import_csv בלבד) · _resolve_plan_cards.
"""
from __future__ import annotations

from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.ratelimit import RateLimiter
from tests.conftest import AUTH, OWNER_TOKEN

GONE = {"promise": "אשלם ביום חמישי", "how_to_pay": "איך אפשר לשלם?", "thanks": "תודה רבה",
        "opt_out": "הסר אותי", "plan_request": "אפשר לשלם ב-3 תשלומים?"}
STAYS = {"copy_request": "אפשר לקבל העתק של החשבונית?", "callback": "תחזרו אליי בטלפון בבקשה",
         "dispute": "אני לא חייב את הסכום הזה, יש טעות", "wrong_person": "מספר שגוי, אני לא מכיר אותכם"}


def _handled(svc, clock, text):
    svc.sync()
    r = svc.inbound("sms", "050-1234567", text)
    if r.get("draft_id") and svc.db.one("SELECT status FROM drafts WHERE id=?", (r["draft_id"],))["status"] \
            == "pending_approval":
        svc.inbox.approve_draft(r["draft_id"])
    svc.mark_paid_outside(1)
    clock.now += timedelta(days=1)
    svc.plan()
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN, limiter=RateLimiter(rules={})), headers=AUTH)
    return r["intent"], api.get("/dashboard").json()["totals"]["owner_inbox"]


@pytest.mark.parametrize("intent", list(GONE))
def test_resolved_intents_leave_owner_inbox(svc, clock, intent):
    got, n = _handled(svc, clock, GONE[intent])
    assert got == intent and n == 0


@pytest.mark.parametrize("intent", list(STAYS))
def test_action_required_intents_stay(svc, clock, intent):
    got, n = _handled(svc, clock, STAYS[intent])
    assert got == intent and n == 1


def test_paid_claim_resolves_on_next_sync(svc, clock):
    svc.sync()
    r = svc.inbound("sms", "050-1234567", "שילמתי אתמול בהעברה")
    svc.inbox.approve_draft(r["draft_id"])
    clock.now += timedelta(minutes=5)
    svc.mark_paid_outside(1)
    assert svc.db.one("SELECT needs_owner FROM messages WHERE intent='paid_claim'")["needs_owner"] == 1
    clock.now += timedelta(hours=1)
    svc.sync()
    assert svc.db.one("SELECT needs_owner FROM messages WHERE intent='paid_claim'")["needs_owner"] == 0
