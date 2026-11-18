"""מנהל הפעלה 290 · בקשת פריסה חדשה כשהשיחה אצל בעל העסק וההסדר שבשיחה כבר אושר («הבא» פיתוח מ-288 (א)).

היה (1): AWAITING_OWNER + הסדר מאושר (למשל אחרי «אין לי כסף» על הסדר שבתוקף) ⇒ «אפשר 6 תשלומים?» = הצעה רגילה
(«ביקש/ה פריסה»), בלי plan_change ובלי שבעל העסק יודע שיש הסדר בתוקף; «אפשר 3 תשלומים?» כשבתוקף 3 ⇒ proposed
זהה ליד ה-approved.
היה (2, באג שנמצא בדרך — גם במסלול 267): `plan_approved` חושב כ«יש ללקוח הסדר approved כלשהו». אחרי הצעה מעודכנת
ליד הסדר שבתוקף, «מאשרת» ⇒ plan_confirmed: ללקוח «ההסדר בתוקף, התשלום הראשון 200 ₪…» ולבעל העסק «אישר/ה את
ההסדר שאישרת (6 תשלומים)» — על הצעה שבעל העסק מעולם לא אישר.
עכשיו: (1) כמו 267 — plan_change, «הצעה מעודכנת», בכרטיס «ההסדר שבתוקף… נשאר בתוקף עד שתאשר/י את החדש»; זהה ⇒
«זה בדיוק ההסדר שבתוקף» בלי הסדר חדש. (2) plan_approved = ההסדר האחרון הפעיל הוא המאושר.
"""
from __future__ import annotations

import json
from dataclasses import replace
from datetime import timedelta
from pathlib import Path

import pytest

from app.conversation import Intent, State, respond
from evals.harness import build_ctx
from evals.sequences import ADDR, _owner_turn, _service, run_seq

CHANGE = ["אפשר 6 תשלומים?", "אין לי כסף, אפשר 6 תשלומים?", "can we do 6 payments?", "אפשר 200 בחודש?",
          "אפשר לחלק ל-4 תשלומים?", "אפשר לפרוס ל-5 תשלומים?"]


def _d(text, approved=True, offered=3):
    ctx = build_ctx({"state": "awaiting_owner", "channel": "sms", "total": 120000, "offered_n": offered})
    if approved:
        ctx = replace(ctx, plan_approved=True)
    return respond(text, ctx)


@pytest.mark.parametrize("text", CHANGE)
def test_new_request_next_to_approved_is_plan_change(text):
    d = _d(text)
    assert d.intent is Intent.PLAN_REQUEST and d.plan and len(d.plan) != 3
    assert "plan_change" in d.tags
    assert d.next_state is State.AWAITING_PLAN_REPLY
    assert "הצעה מעודכנת" in d.reply
    assert "ביקש/ה שינוי בהסדר" in d.owner_summary
    assert "🔁 ההסדר שבתוקף: 3 תשלומים" in d.owner_summary
    assert "נשאר בתוקף עד שתאשר/י את החדש" in d.owner_summary


@pytest.mark.parametrize("text", ["אפשר 3 תשלומים?", "אפשר 400 בחודש?", "can we do 3 payments?"])
def test_same_as_approved_no_new_plan(text):
    d = _d(text)
    assert not d.plan and "plan_same" in d.tags
    assert d.next_state is State.AWAITING_OWNER
    assert "זה בדיוק ההסדר שבתוקף" in d.reply
    assert "לא נוצר הסדר חדש" in d.owner_summary


@pytest.mark.parametrize("text", ["אפשר 6 תשלומים?", "אפשר 3 תשלומים?"])
def test_not_approved_unchanged(text):
    """AWAITING_OWNER עם הסדר שלא אושר (למשל אחרי דחייה) — כמו קודם: הצעה רגילה, בלי plan_change."""
    d = _d(text, approved=False)
    assert d.plan and "plan_change" not in d.tags and "plan_same" not in d.tags
    assert "ביקש/ה פריסה" in d.owner_summary


def test_without_plan_unchanged():
    d = _d("אפשר 6 תשלומים?", approved=False, offered=0)
    assert len(d.plan) == 6 and "plan_change" not in d.tags


def test_sensitive_no_offer():
    d = _d("אני בבית חולים, אפשר 6 תשלומים?")
    assert not d.plan and "plan_change" not in d.tags


def _walk(turns):
    """מריץ רצף דרך השירות ומחזיר את ההחלטה האחרונה + מצב ההסדרים."""
    with _service() as (svc, seen):
        last = None
        for t in turns:
            seen.clear()
            if isinstance(t, tuple):
                svc.clock.now += timedelta(days=t[1])
                t = t[0]
            if t == "OWNER":
                assert _owner_turn(svc, {"owner": "approve_plan"})[0]
                continue
            svc.inbound("sms", ADDR["sms"], t)
            last = seen[-1]
        plans = [r["status"] for r in svc.db.q("SELECT status FROM plans WHERE customer_id=1 ORDER BY id")]
        return last, plans


BASE = ["אפשר לחלק ל-3 תשלומים?", "מאשרת", "OWNER"]


@pytest.mark.parametrize("change", [[("אין לי כסף", 1), ("אפשר 6 תשלומים?", 1)],   # 290: AWAITING_OWNER
                                    [("אולי 6 תשלומים?", 1)]],                         # 267: PLAN_PENDING_OWNER
                         ids=["awaiting_owner", "pending_owner_267"])
def test_accept_of_new_proposal_is_not_treated_as_approved(change):
    d, plans = _walk(BASE + change + ["מאשרת"])
    assert d.intent is Intent.PLAN_ACCEPT
    assert "plan_confirmed" not in d.tags
    assert "ההסדר בתוקף" not in (d.reply or "")
    assert "אישר/ה את ההסדר שאישרת" not in d.owner_summary
    assert "נדרש אישור סופי שלך" in d.owner_summary
    assert plans == ["approved", "proposed"]        # הישן נשאר בתוקף עד שבעל העסק מאשר את החדש


def test_owner_approves_new_supersedes_old():
    _, plans = _walk(BASE + [("אין לי כסף", 1), ("אפשר 6 תשלומים?", 1), "מאשרת", "OWNER"])
    assert plans == ["superseded", "approved"]


def test_reconfirm_of_approved_still_confirmed():
    """מסלול 265 לא נשבר: «מאשרת» על ההסדר שבתוקף (בלי הצעה חדשה) ⇒ עדיין plan_confirmed."""
    d, plans = _walk(BASE + [("מאשרת", 1)])
    assert d.intent is Intent.PLAN_ACCEPT and "plan_confirmed" in d.tags
    assert plans == ["approved"]


SEQ = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr290.jsonl"


@pytest.mark.parametrize("seq", [json.loads(x) for x in SEQ.read_text(encoding="utf-8").splitlines() if x.strip()],
                         ids=lambda s: s["id"])
def test_sequences(seq):
    assert run_seq(seq) == []
