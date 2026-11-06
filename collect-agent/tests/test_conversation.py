"""מנוע השיחה: שער ה-eval, מעקות, LLM, הסדר, תאריכים, רב-תוריות."""
from dataclasses import replace
from datetime import date
from pathlib import Path

import pytest

from app import compliance
from app.conversation import (
    Context,
    Escalation,
    Intent,
    OpenInvoice,
    OwnerPolicy,
    State,
    Stop,
    check_reply,
    detect,
    extract_date,
    extract_installments,
    extract_paid_amount,
    propose_plan,
    redact_for_llm,
    respond,
)
from evals.harness import TODAY, build_ctx, report, run

EVALS = sorted((Path(__file__).parent.parent / "evals").glob("*.jsonl"))


# ═══════════ שער ה-eval ═══════════
@pytest.mark.parametrize("path", EVALS, ids=[p.name for p in EVALS])
def test_eval_suite_gate(path):
    res = run(path)
    rep = report(res, path.name)
    bad = [f"{r.case['id']} «{r.case['text']}»: {r.failures}" for r in res if not r.ok]
    # קריטיים (הסרה/טעות במספר/מחלוקת/עו"ד/מצוקה/שילמתי) — 100%, בלי פשרות
    assert rep["critical_pass"] == rep["critical"], bad
    assert rep["guardrail_violations"] == 0, bad
    assert rep["silent_critical"] == 0, bad
    assert rep["pass_rate"] >= 0.95, bad


def test_eval_suite_size():
    total = sum(len(p.read_text(encoding="utf-8").splitlines()) for p in EVALS)
    assert total >= 300


# ═══════════ אינווריאנטים על כל המקרים ═══════════
def _all_decisions():
    for p in EVALS:
        yield from run(p)


def test_no_auto_send_unless_safe_auto():
    for r in _all_decisions():
        if r.decision.auto_send:
            assert r.case.get("ctx", {}).get("approval_mode") == "safe_auto", r.case


def test_every_plan_preserves_total_and_has_no_interest():
    for r in _all_decisions():
        if r.decision.plan:
            ctx = build_ctx(r.case.get("ctx", {}))
            assert sum(i.amount_agorot for i in r.decision.plan) == ctx.total_agorot
            assert len(r.decision.plan) <= ctx.policy.max_installments
            assert all(i.amount_agorot >= ctx.policy.min_installment_agorot for i in r.decision.plan)


def test_safety_intents_always_urgent_and_stop():
    for r in _all_decisions():
        if set(r.decision.all_intents) & {Intent.DISPUTE, Intent.LEGAL, Intent.DISTRESS}:
            assert r.decision.escalate == Escalation.URGENT, r.case
            assert r.decision.stop != Stop.NONE, r.case


def test_replies_start_with_business_and_fit_sms():
    for r in _all_decisions():
        if r.decision.reply:
            assert r.decision.reply.startswith("סטודיו מאיר")
            assert len(r.decision.reply) <= compliance.SMS_TEMPLATE_MAX, r.decision.reply


def test_deterministic():
    ctx = build_ctx({})
    a = respond("אין לי כסף, אפשר תשלומים?", ctx)
    b = respond("אין לי כסף, אפשר תשלומים?", ctx)
    assert a == b


# ═══════════ מעקות ═══════════
@pytest.mark.parametrize("text,issue", [
    ("סטודיו מאיר: אחרת נאלץ לפנות להוצאה לפועל", "enforcement"),
    ('סטודיו מאיר: עו"ד שלנו ייצור קשר', "lawyer"),
    ("סטודיו מאיר: נעביר את הפרטים למעסיק שלך", "third_party"),
    ("סטודיו מאיר: תתווסף ריבית פיגורים", "fees"),
    ("סטודיו מאיר: יש לנו מבצע חדש!", "marketing"),
    ("סטודיו מאיר: נשמח לתת הנחה של 10%", "discount"),
    ("סטודיו מאיר: לתשלום https://evil.example/pay", "foreign_link"),
    ("שלום, תזכורת מסטודיו מאיר", "no_business_first"),
    ("סטודיו מאיר: דחוף!!", "pressure"),
])
def test_compliance_blocks(text, issue):
    assert issue in compliance.violations(text, compliance.Rules(
        business="סטודיו מאיר", payment_link="https://pay.example/x"))


def test_compliance_allows_normal_and_od_is_not_lawyer():
    t = "סטודיו מאיר: לא יישלחו אליכם עוד תזכורות. לתשלום: https://pay.example/x"
    assert compliance.violations(t, compliance.Rules(
        business="סטודיו מאיר", payment_link="https://pay.example/x")) == []


def test_conversation_guardrails_payment_confirmed_and_privacy():
    ctx = build_ctx({})
    assert "payment_confirmed" in check_reply("סטודיו מאיר: התשלום התקבל, תודה", ctx, Intent.PAID_CLAIM)
    assert "privacy_amount" in check_reply("סטודיו מאיר: סליחה, 1,200 ₪", ctx, Intent.WRONG_PERSON)
    assert "privacy_name" in check_reply("סטודיו מאיר: סליחה דנה", ctx, Intent.WRONG_PERSON)


def test_paid_claim_reply_never_confirms_payment():
    d = respond("שילמתי", build_ctx({}))
    assert "התקבל" not in d.reply and "בדוק" in d.reply


# ═══════════ LLM (שלב 2) — חוזה ═══════════
class FakeLLM:
    def __init__(self, out):
        self.out, self.seen = out, []

    def classify(self, text):
        self.seen.append(text)
        if isinstance(self.out, Exception):
            raise self.out
        return self.out


def test_llm_only_for_unknown_and_gets_redacted_text():
    ctx = build_ctx({})
    llm = FakeLLM("dispute")
    d = respond("שלום, דנה כהן כאן, 050-1234567, לגבי 1001 יש לי בעיה מסוימת", ctx, llm=llm)
    assert d.intent == Intent.DISPUTE and d.confidence == "llm"
    assert d.escalate == Escalation.URGENT
    seen = llm.seen[0]
    assert "דנה" not in seen and "050" not in seen and "1001" not in seen and "סטודיו" not in seen
    # כלל ברור ⇒ ה-LLM לא נקרא בכלל
    llm2 = FakeLLM("thanks")
    assert respond("הסר", ctx, llm=llm2).intent == Intent.OPT_OUT and llm2.seen == []


@pytest.mark.parametrize("out", ["garbage", "thanks", "plan_accept", RuntimeError("down")])
def test_llm_cannot_silence_or_crash(out):
    d = respond("משהו לא ברור לגמרי", build_ctx({}), llm=FakeLLM(out))
    assert d.intent == Intent.UNKNOWN and d.escalate != Escalation.NONE


def test_llm_classified_low_risk_still_escalates():
    d = respond("משהו לא ברור לגמרי", build_ctx({}), llm=FakeLLM("how_to_pay"))
    assert d.intent == Intent.HOW_TO_PAY and d.escalate == Escalation.NORMAL and not d.auto_send


class FakeDrafter:
    def __init__(self, out):
        self.out = out

    def draft(self, intent, base, ctx):
        return self.out


def test_drafter_output_blocked_by_guardrail_falls_back():
    ctx = build_ctx({})
    base = respond("איך אפשר לשלם?", ctx).reply
    d = respond("איך אפשר לשלם?", ctx, drafter=FakeDrafter("שלמו מייד אחרת נאלץ לפנות לעו\"ד"))
    assert d.reply == base and "llm_drafted" not in d.tags


def test_drafter_good_output_used_but_never_auto():
    ctx = replace(build_ctx({}), policy=OwnerPolicy(approval_mode="safe_auto"))
    d = respond("איך אפשר לשלם?", ctx, drafter=FakeDrafter("בשמחה, הנה הקישור: https://pay.example/x"))
    assert d.reply == "סטודיו מאיר: בשמחה, הנה הקישור: https://pay.example/x"
    assert "llm_drafted" in d.tags and d.auto_send is False


# ═══════════ הסדר ═══════════
def test_plan_math_and_owner_limits():
    ctx = build_ctx({"total": 100_001})
    p = propose_plan(ctx, 3)
    assert [i.amount_agorot for i in p] == [33_335, 33_333, 33_333]
    assert [i.due for i in p] == [date(2026, 11, 15), date(2026, 12, 15), date(2027, 1, 15)]
    assert len(propose_plan(ctx, 20)) == 6                 # תקרת בעלים
    assert propose_plan(build_ctx({"total": 15_000}), 3) == ()   # מתחת ל-100 ₪ לתשלום
    tight = replace(ctx, policy=OwnerPolicy(max_installments=2))
    assert len(propose_plan(tight, 5)) == 2


def test_plan_over_max_is_flagged_to_owner():
    d = respond("אפשר 12 תשלומים?", build_ctx({}))
    assert len(d.plan) == 6 and "מעל התקרה" in d.owner_summary


def test_monthly_amount_to_installments():
    d = respond("אני יכול 300 כל חודש", build_ctx({}))
    assert len(d.plan) == 4


def test_plan_covers_all_open_invoices():
    ctx = replace(build_ctx({}), invoices=(OpenInvoice("1001", 60_000), OpenInvoice("1002", 90_000)))
    d = respond("אפשר בתשלומים?", ctx)
    assert sum(i.amount_agorot for i in d.plan) == 150_000


def test_sensitive_hardship_gets_no_plan_offer():
    for t in ["אני במילואים", "אני מאושפז", "הוכרזתי פושט רגל, יש צו פתיחת הליכים"]:
        d = respond(t, build_ctx({}))
        assert d.plan == () and d.stop == Stop.PAUSE, t
    d = respond("יש לי צו פתיחת הליכים בחדלות פירעון", build_ctx({}))
    assert "insolvency" in d.tags and d.escalate == Escalation.URGENT


# ═══════════ ישויות ═══════════
@pytest.mark.parametrize("t,n", [("3 תשלומים", 3), ("בשלושה תשלומים", 3), ("ב-6 תשלומים", 6),
                                 ("לפרוס ל-4", 4), ("חצי עכשיו וחצי בחודש הבא", 2),
                                 ("שתים עשרה תשלומים", 12), ("ב-10 לחודש", None)])
def test_extract_installments(t, n):
    from app.conversation import normalize
    assert extract_installments(normalize(t)) == n


@pytest.mark.parametrize("t,days", [("מחר", 1), ("מחרתיים", 2), ("ביום חמישי", 4), ("ביום ראשון", 7),
                                    ("בעוד שבוע", 7), ("ב-10 לחודש", 2), ("ב-5 לחודש", 27),
                                    ("12/11", 4), ("בעוד 3 ימים", 3), ("עד סוף החודש", 22)])
def test_extract_date(t, days):
    from app.conversation import normalize
    d, _ = extract_date(normalize(t), TODAY)
    assert d is not None and (d - TODAY).days == days


@pytest.mark.parametrize("t,ag", [('העברתי 500 ש"ח', 50_000), ("שילמתי 1,200.50", 120_050),
                                  ("שילמתי 3 תשלומים", None), ("שילמתי", None)])
def test_extract_paid_amount(t, ag):
    from app.conversation import normalize
    assert extract_paid_amount(normalize(t)) == ag


def test_negation_and_questions():
    ctx = build_ctx({})
    assert Intent.PAID_CLAIM not in detect("עוד לא שילמתי", ctx)
    assert Intent.PAID_CLAIM not in detect("מתי שילמתי לכם בפעם האחרונה?", ctx)
    assert Intent.CANT_PAY not in detect("אין לי בעיה לשלם", ctx)


def test_nikud_and_final_letters():
    assert respond("שִׁלַּמְתִּי", build_ctx({})).intent == Intent.PAID_CLAIM
    assert respond("המחיר מוגזם", build_ctx({})).intent == Intent.DISPUTE


def test_wrong_person_by_customer_name_and_no_pii():
    d = respond("אין פה שום דנה", build_ctx({}))
    assert d.intent == Intent.WRONG_PERSON and d.stop == Stop.PERMANENT
    assert "דנה" not in d.reply and "₪" not in d.reply


# ═══════════ שיחה רב-תורית ═══════════
def test_multi_turn_hardship_to_plan_acceptance():
    ctx = build_ctx({})
    d1 = respond("אין לי כסף החודש", ctx)
    assert d1.next_state == State.AWAITING_PLAN_REPLY and len(d1.plan) == 3
    ctx = replace(ctx, state=d1.next_state, offered_plan=d1.plan, bot_turns=1)
    d2 = respond("אפשר 4?", ctx)
    assert d2.intent == Intent.PLAN_REQUEST and len(d2.plan) == 4
    ctx = replace(ctx, state=d2.next_state, offered_plan=d2.plan, bot_turns=2)
    d3 = respond("מאשר", ctx)
    assert d3.intent == Intent.PLAN_ACCEPT and d3.next_state == State.PLAN_PENDING_OWNER
    assert d3.plan == d2.plan and d3.escalate == Escalation.NORMAL


def test_vague_promise_then_date():
    ctx = build_ctx({})
    d1 = respond("אסדר את זה בקרוב", ctx)
    assert d1.next_state == State.AWAITING_DATE and "תאריך" in d1.reply
    d2 = respond("ביום רביעי", replace(ctx, state=d1.next_state))
    assert d2.intent == Intent.PROMISE and d2.promise_date == date(2026, 11, 11)
    assert d2.pause_until == date(2026, 11, 12)


def test_bot_turn_limit_hands_over():
    d = respond("איך אפשר לשלם?", replace(build_ctx({}), bot_turns=4))
    assert d.reply is None and "bot_turn_limit" in d.tags and d.escalate == Escalation.NORMAL


def test_email_channel_frame():
    ctx = replace(build_ctx({}), channel="email")
    d = respond("איך אפשר לשלם?", ctx)
    assert d.reply.startswith("סטודיו מאיר\n\n")


def test_redact_for_llm():
    ctx = Context(today=TODAY, business="סטודיו מאיר", customer_name="דנה כהן",
                  invoices=(OpenInvoice("1001", 1),))
    out = redact_for_llm("דנה כהן, 050-1234567, dana@x.co.il, ת.ז 012345678, חשבונית 1001", ctx)
    for leak in ("דנה", "כהן", "050", "dana@", "012345678", "1001"):
        assert leak not in out
