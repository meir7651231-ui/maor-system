from datetime import date, datetime

import pytest

from app import assistant, plans, templates
from app.assistant import Intent
from app.config import SafetyError, load_settings
from app.policy import TZ, Policy
from app.whatsapp import build_template_payload, normalize_il_phone

P = Policy(frozenset({"2026-12-25"}))


def at(y, m, d, h, mi=0):
    return datetime(y, m, d, h, mi, tzinfo=TZ)


# ---------- מעקות בטיחות ----------
def test_send_mode_live_refused():
    with pytest.raises(SafetyError):
        load_settings({"SEND_MODE": "live"})


def test_production_env_refused():
    with pytest.raises(SafetyError):
        load_settings({"GREENINVOICE_ENV": "production"})


def test_dry_run_always_true():
    assert load_settings({}).dry_run is True


# ---------- מדיניות זמנים ----------
@pytest.mark.parametrize("dt,ok", [
    (at(2026, 11, 8, 10), True),    # ראשון
    (at(2026, 11, 8, 8, 59), False),
    (at(2026, 11, 8, 19), False),
    (at(2026, 11, 13, 11), True),   # שישי בבוקר
    (at(2026, 11, 13, 12, 30), False),
    (at(2026, 11, 14, 10), False),  # שבת
    (at(2026, 12, 25, 10), False),  # חג מוגדר
])
def test_can_send(dt, ok):
    assert P.can_send_at(dt) is ok


def test_next_allowed_skips_shabbat():
    assert P.next_allowed(at(2026, 11, 13, 14)) == at(2026, 11, 15, 9)


def test_next_allowed_morning():
    assert P.next_allowed(at(2026, 11, 9, 6)) == at(2026, 11, 9, 9)


# ---------- טלפונים ----------
@pytest.mark.parametrize("raw,exp", [
    ("050-1234567", "972501234567"), ("+972 52 765 4321", "972527654321"),
    ("00972501234567", "972501234567"), ("03-1234567", "97231234567"),
    ("12345", None), ("", None),
])
def test_phone(raw, exp):
    assert normalize_il_phone(raw) == exp


# ---------- הסדר ----------
def test_plan_sum_exact_and_no_interest():
    items = plans.propose(100_001, date(2026, 1, 31), 3)
    assert sum(i.amount_agorot for i in items) == 100_001
    assert [i.due.isoformat() for i in items] == ["2026-01-31", "2026-02-28", "2026-03-31"]


def test_plan_respects_min_installment():
    assert len(plans.propose(150_00, date(2026, 1, 1), 6)) == 1
    assert len(plans.propose(10_000_00, date(2026, 1, 1), 12)) == plans.MAX_INSTALLMENTS


# ---------- תבניות ----------
def test_templates_polite_and_opt_out():
    for t in templates.STEPS:
        assert templates.OPT_OUT_LINE in t.body
        for bad in ("הוצאה לפועל", "תביעה", "משטרה", "עונש"):
            assert bad not in t.body


def test_amount_format():
    assert templates.fmt_amount(123456) == "1,234.56 ₪"
    assert templates.fmt_amount(100000) == "1,000 ₪"


def test_payload_shape():
    p = build_template_payload("972501234567", "payment_reminder_friendly", ["a", "b"])
    assert p["type"] == "template" and p["template"]["language"]["code"] == "he"
    assert [x["text"] for x in p["template"]["components"][0]["parameters"]] == ["a", "b"]


# ---------- מסווג ----------
@pytest.mark.parametrize("text,intent", [
    ("הסר", Intent.OPT_OUT), ("STOP", Intent.OPT_OUT),
    ("שילמתי אתמול בהעברה", Intent.PAID_CLAIM),
    ("אפשר פריסה ל-3 תשלומים?", Intent.PLAN_REQUEST),
    ("איך אפשר לשלם?", Intent.HOW_TO_PAY),
    ("לא הזמנתי את זה, זו טעות", Intent.DISPUTE),
    ("תודה!", Intent.THANKS),
    ("מה שלומך היום", Intent.UNKNOWN),
])
def test_classify(text, intent):
    assert assistant.classify(text) == intent


def test_dispute_beats_paid():
    assert assistant.classify("שילמתי, וחוץ מזה זו טעות") == Intent.DISPUTE


def test_unknown_escalates_no_auto_reply():
    d = assistant.decide("שאלה מורכבת על המע\"מ", business="x", payment_link="")
    assert d.escalate and d.auto_reply is None


def test_llm_garbage_falls_back():
    class Bad:
        def classify(self, t):
            return "pay_me_now"
    assert assistant.classify("משהו", Bad()) == Intent.UNKNOWN
