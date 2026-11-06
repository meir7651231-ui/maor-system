from datetime import date, datetime

import pytest

from app import assistant, plans, templates
from app.assistant import Intent
from app.config import SafetyError, load_settings
from app.policy import TZ, Policy
from app.channels import (InforUSms, Message, Sms019, SmtpEmail, TwilioSms, is_il_mobile,
                          normalize_il_phone, sms_segments)
from app import paylinks

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
F = templates.fields(biz="סטודיו מאיר", name="דנה כהן", num="1001", amount_agorot=120000,
                     currency="ILS", link="https://www.greeninvoice.co.il/pay/x?invoice=1001",
                     unsub="https://gabi.example/u/AbCdEfGhIjKl")


@pytest.mark.parametrize("step", templates.STEPS, ids=lambda s: s.key)
def test_templates_polite_identified_no_marketing(step):
    sms = templates.render_sms(step, F)
    subj, text, html = templates.render_email(step, F)
    for t in (sms, subj, text):
        for bad in templates.MARKETING_WORDS + templates.THREAT_WORDS:
            assert bad not in t, (step.key, bad)
    assert sms.startswith("סטודיו מאיר:")             # זיהוי השולח
    assert F["link"] in sms and F["unsub"] in sms      # קישור תשלום + הסרה
    assert F["link"] in text and F["unsub"] in text
    assert sms_segments(sms)["segments"] <= 3          # עלות סבירה


def test_email_html_escapes_and_rtl():
    f = {**F, "name": "<script>x</script>"}
    _, _, html = templates.render_email(templates.STEPS[0], f)
    assert "<script>" not in html and 'dir="rtl"' in html


def test_amount_format():
    assert templates.fmt_amount(123456) == "1,234.56 ₪"
    assert templates.fmt_amount(100000) == "1,000 ₪"


# ---------- SMS ----------
def test_segments_hebrew_ucs2():
    assert sms_segments("א" * 70) == {"chars": 70, "encoding": "UCS-2", "segments": 1}
    assert sms_segments("א" * 71)["segments"] == 2
    assert sms_segments("a" * 160)["encoding"] == "GSM-7"


def test_mobile_only():
    assert is_il_mobile("972501234567") and not is_il_mobile("97231234567")


MSG = Message("sms", "972501234567", "שלום")


def test_adapters_build_requests_and_mask_secrets():
    inf = InforUSms(username="u", token="supersecret", sender="Studio").build_request(MSG)
    assert inf["json"]["Data"]["Recipients"][0]["Phone"] == "0501234567"
    assert "supersecret" not in str(inf)
    x = Sms019(username="u", token="supersecret", sender="Studio").build_request(
        Message("sms", "972501234567", "a<b&c"))
    assert "<message>a&lt;b&amp;c</message>" in x["body"] and "supersecret" not in str(x)
    t = TwilioSms(token="supersecret", sender="Studio").build_request(MSG)
    assert t["form"]["To"] == "+972501234567" and "supersecret" not in str(t)


def test_email_one_click_unsubscribe_header():
    m = SmtpEmail(sender="a@b.co").build_message(
        Message("email", "c@d.co", "x", subject="s", unsubscribe_url="https://g.example/u/t"))
    assert m["List-Unsubscribe"] == "<https://g.example/u/t>"
    assert m["List-Unsubscribe-Post"] == "List-Unsubscribe=One-Click"


def test_whatsapp_channel_refused():
    with pytest.raises(SafetyError):
        load_settings({"CHANNELS": "sms,whatsapp"})


def test_sender_id_validated():
    with pytest.raises(ValueError):
        load_settings({"SMS_SENDER_ID": "שם עברי ארוך"})


# ---------- קישורי תשלום ----------
ALLOWED = ("greeninvoice.co.il", "morning.co")


@pytest.mark.parametrize("url,ok", [
    ("https://www.greeninvoice.co.il/pay/x", True),
    ("https://greeninvoice.co.il/pay/x", True),
    ("http://www.greeninvoice.co.il/pay/x", False),            # לא https
    ("https://greeninvoice.co.il.evil.com/x", False),          # דומיין מתחזה
    ("https://evilgreeninvoice.co.il/x", False),
    ("https://user@greeninvoice.co.il/x", False),
    ("javascript:alert(1)", False),
])
def test_payment_domain_allowlist(url, ok):
    assert paylinks.domain_allowed(url, ALLOWED) is ok


def test_resolve_prefers_doc_link_then_static():
    assert paylinks.resolve(doc_link="https://pay.greeninvoice.co.il/f/1", static_link="",
                            number="1", allowed=ALLOWED) == "https://pay.greeninvoice.co.il/f/1"
    assert paylinks.resolve(doc_link="https://evil.com", static_link=
                            "https://www.greeninvoice.co.il/pay/s", number="7",
                            allowed=ALLOWED) == "https://www.greeninvoice.co.il/pay/s?invoice=7"
    assert paylinks.resolve(doc_link="", static_link="", number="1", allowed=ALLOWED) is None


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
