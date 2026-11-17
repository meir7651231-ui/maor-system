"""מנהל הפעלה 264 · «הבא» AI מ-263: בקשת שינוי בהסדר שכבר הוצע/אושר (q14-19).

היה: «can we move the first payment ל-20? לא ל-10», «אפשר להזיז את התשלום הראשון ל-20?», «להוריד את התשלום החודשי
ל-200» ⇒ «לא ברור» (כרטיס בלי הקשר); «אפשר שהתשלום השני יהיה בתחילת החודש?» ⇒ הבטחה ⇒ «עד איזה תאריך?» ללקוח
שכבר יש לו הסדר. ועוד: הצעה מעודכנת שאושרה השאירה את ההסדר הקודם 'approved' ⇒ שני הסדרים בתוקף.

עכשיו: כשיש הסדר בשיחה (AWAITING_PLAN_REPLY / PLAN_PENDING_OWNER) —
  · מועד התשלום הראשון (בגבולות first_installment_in_days + max_defer_days) ⇒ הצעה מעודכנת, אותו מספר תשלומים,
    החלופה שנדחתה («לא ל-10») לא נלקחת. עדיין טיוטה לאישור בעל העסק.
  · סכום חודשי ⇒ הצעה מחושבת מהסכום (בתוך תקרת התשלומים).
  · תשלום שאינו הראשון / מועד מחוץ לגבולות / «בתחילת החודש» ⇒ כרטיס לבעל העסק עם ההסדר הנוכחי, בלי ניחוש.
  · אישור הצעה מעודכנת ⇒ ההסדר הקודם 'superseded'.
"""
from __future__ import annotations

from dataclasses import replace
from datetime import date, timedelta

import pytest

from app.conversation import Intent, State, change_date, detect, normalize, plan_change, plan_change_amount, respond
from evals.harness import TODAY, build_ctx

CH = pytest.mark.parametrize("ch", ["sms", "email"])
PLAN_STATES = pytest.mark.parametrize("state", ["awaiting_plan_reply", "plan_pending_owner"])


def _ctx(state="plan_pending_owner", ch="sms", n=4):
    return build_ctx({"state": state, "channel": ch, "offered_n": n})


# ── זיהוי ──
@pytest.mark.parametrize("text,n,kind", [
    ("can we move the first payment ל-20? לא ל-10", 1, "date"),
    ("אפשר להזיז את התשלום הראשון ל-20?", 1, "date"),
    ("התשלום הראשון ב-20 ולא ב-10 בבקשה", 1, "date"),
    ("מאשרת, רק שהתשלום הראשון יהיה ב-25", 1, "date"),
    ("can we push the plan to start on the 1st?", None, "date"),
    ("אפשר שהתשלום השני יהיה בתחילת החודש?", 2, "other"),
    ("אפשר להוריד את התשלום החודשי ל-200?", None, "amount"),
    ("אפשר לשנות ל4 תשלומים במקום 3?", None, "count"),
])
def test_plan_change_detected(text, n, kind):
    assert plan_change(normalize(text)) == (n, kind)


@pytest.mark.parametrize("text", ["תודה", "אפשר ב-4?", "אשלם ב-20", "אפשר בתשלומים?", "אני רוצה לשנות את שם הלקוח",
                                  "מאשרת", "ok"])
def test_plan_change_traps(text):
    assert plan_change(normalize(text)) is None


def test_change_date_drops_rejected_alternative():
    today = date(2026, 11, 9)
    assert change_date(normalize("can we move the first payment ל-20? לא ל-10"), today) == date(2026, 11, 20)
    assert change_date(normalize("התשלום הראשון ב-20 ולא ב-10"), today) == date(2026, 11, 20)
    assert change_date(normalize("move the first payment to the 20th, not the 10th"), today) == date(2026, 11, 20)
    assert plan_change_amount(normalize("להוריד את התשלום החודשי ל-200")) == 200_00


# ── החלטה ──
@CH
@PLAN_STATES
@pytest.mark.parametrize("text", ["can we move the first payment ל-20? לא ל-10", "אפשר להזיז את התשלום הראשון ל-20?",
                                  "התשלום הראשון ב-20 ולא ב-10 בבקשה"])
def test_move_first_payment_reoffers(text, state, ch):
    c = _ctx(state, ch)
    d = respond(text, c)
    assert d.intent == Intent.PLAN_REQUEST and d.next_state == State.AWAITING_PLAN_REPLY
    assert len(d.plan) == len(c.offered_plan)
    assert d.plan[0].due == date(2026, 11, 20)
    assert sum(i.amount_agorot for i in d.plan) == c.total_agorot
    assert "plan_change" in d.tags and "שינוי בהסדר" in d.owner_summary
    assert d.promise_date is None


@CH
@PLAN_STATES
def test_monthly_amount_change(state, ch):
    c = _ctx(state, ch)
    d = respond("אפשר להוריד את התשלום החודשי ל-200?", c)
    assert d.intent == Intent.PLAN_REQUEST and d.plan
    assert max(i.amount_agorot for i in d.plan) <= 200_00 + c.total_agorot % len(d.plan)
    assert len(d.plan) <= c.policy.max_installments


@CH
@PLAN_STATES
@pytest.mark.parametrize("text", ["אפשר שהתשלום השני יהיה בתחילת החודש?", "אפשר לדחות את התשלום ב-20 בפברואר?",
                                  "אפשר להזיז את התשלום השלישי ל-5?"])
def test_unsafe_change_is_owner_card(text, state, ch):
    d = respond(text, _ctx(state, ch))
    assert d.intent == Intent.PLAN_REQUEST and not d.plan
    assert d.next_state == State.AWAITING_OWNER and d.promise_date is None
    assert "🔁" in d.owner_summary and "עד איזה תאריך" not in (d.reply or "")


def test_no_plan_in_conversation_unchanged():
    """בלי הסדר בשיחה — אותה התנהגות כמו קודם (אין plan_change)."""
    for st in ("idle", "promised", "awaiting_date"):
        c = build_ctx({"state": st})
        for text in ("אפשר להזיז את התשלום הראשון ל-20?", "אשלם ב-20"):
            assert "plan_change" not in respond(text, c).tags


def test_counter_offer_digit_unchanged():
    """«אפשר ב-4?» כתגובה להצעה = מספר תשלומים (לא מועד ה-4)."""
    d = respond("אפשר ב-4?", _ctx("awaiting_plan_reply", n=3))
    assert d.intent == Intent.PLAN_REQUEST and len(d.plan) == 4 and "plan_change" not in d.tags


@pytest.mark.parametrize("text,intent", [
    ("תפסיקו לשלוח לי הודעות, ואל תזיזו כלום", Intent.OPT_OUT),
    ("אני לא חייבת לכם כלום, אל תשנו שום תשלום", Intent.DISPUTE),
])
def test_protective_wins(text, intent):
    assert detect(text, _ctx())[0] == intent


def test_date_out_of_bounds_card():
    c = _ctx()
    far = c.today + timedelta(days=c.policy.first_installment_in_days + c.policy.max_defer_days + 5)
    d = respond(f"אפשר להזיז את התשלום הראשון ל-{far.day}.{far.month}?", replace(c))
    assert not d.plan and d.next_state == State.AWAITING_OWNER


# ── שירות: הצעה מעודכנת מחליפה את ההסדר הקודם ──
def test_approved_replacement_supersedes_old():
    from evals.sequences import ADDR, _service
    with _service() as (svc, _seen):
        svc.inbound("sms", ADDR["sms"], "אפשר לחלק ל-4 תשלומים?")
        svc.inbound("sms", ADDR["sms"], "מאשרת")
        p1 = svc.db.one("SELECT id FROM plans WHERE customer_id=1 AND status='proposed'")["id"]
        svc.approve_plan(p1)
        svc.clock.now += timedelta(days=1)
        out = svc.inbound("sms", ADDR["sms"], "can we move the first payment ל-20? לא ל-10")
        assert out["intent"] == "plan_request" and out["plan_id"] and out["plan_id"] != p1
        # עד שבעל העסק מאשר — ההסדר הקודם נשאר בתוקף
        assert svc.db.one("SELECT status FROM plans WHERE id=?", (p1,))["status"] == "approved"
        svc.approve_plan(out["plan_id"])
        rows = {r["id"]: r["status"] for r in svc.db.q("SELECT id, status FROM plans WHERE customer_id=1")}
        assert rows[p1] == "superseded" and rows[out["plan_id"]] == "approved"
        assert list(rows.values()).count("approved") == 1
        import json
        new = json.loads(svc.db.one("SELECT installments FROM plans WHERE id=?", (out["plan_id"],))["installments"])
        assert new[0]["due"] == "2026-11-20" and len(new) == 4
        assert svc.db.one("SELECT 1 FROM audit WHERE action='plan_replaced'") is not None


assert TODAY == date(2026, 11, 8)
