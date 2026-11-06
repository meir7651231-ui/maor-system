from datetime import date, datetime

import pytest

from app import assistant, paylinks, plans, templates
from app.assistant import Intent
from app.channels import (
    InforUSms,
    Message,
    Sms019,
    SmtpEmail,
    TwilioSms,
    is_il_mobile,
    normalize_il_phone,
    sms_segments,
)
from app.config import SafetyError, load_settings
from app.policy import TZ, Policy

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
                     unsub="https://gabi.example/u/AbCdEfGhIjKl",
                     short="https://gabi.co.il/p/Ab3dE9x")


@pytest.mark.parametrize("step", templates.STEPS, ids=lambda s: s.key)
def test_templates_polite_identified_no_marketing(step):
    sms = templates.render_sms(step, F)
    subj, text, html = templates.render_email(step, F)
    for t in (sms, subj, text):
        for bad in templates.MARKETING_WORDS + templates.THREAT_WORDS:
            assert bad not in t, (step.key, bad)
    assert sms.startswith("סטודיו מאיר:")             # זיהוי השולח
    assert F["short"] in sms and "להפסקה" in sms       # קישור קצר אחד (תשלום+הסרה) + הוראת הפסקה
    assert F["link"] in text and F["unsub"] in text     # מייל: קישור ישיר + הסרה
    assert sms_segments(sms)["segments"] <= 2          # יעד עלות: ≤2 חלקים (team/market.md)


@pytest.mark.parametrize("two_way", [False, True])
@pytest.mark.parametrize("step", templates.STEPS, ids=lambda s: s.key)
def test_sms_two_segments_worst_typical_case(step, two_way):
    """שם עסק עד 12 תווים, חשבונית 5 ספרות, סכום עד 99,999.99 ⇒ עדיין 2 חלקים."""
    f = templates.fields(biz="סטודיו מאיר", name="אלכסנדרה", num="10234",
                         amount_agorot=9_999_999, currency="ILS", link="x", unsub="u",
                         short="https://gabi.co.il/p/Ab3dE9x", two_way=two_way)
    assert len(templates.render_sms(step, f)) <= templates.SMS_TARGET


@pytest.mark.parametrize("step", templates.STEPS, ids=lambda s: s.key)
def test_sms_templates_pass_compliance_filter(step):
    """ר-1 (team/legal.md): כל תבנית SMS עוברת את מסנן הניסוח — גם עם שם עסק ארוך (≤3 חלקים)."""
    from app import compliance
    for biz in ("סטודיו מאיר", "מרפאת השיניים של ד\"ר לוי"):
        f = {**F, "biz": biz}
        sms = templates.render_sms(step, f)
        assert compliance.violations(sms, compliance.Rules(
            business=biz, payment_link=F["short"], max_sms_chars=templates.SMS_HARD_MAX,
            allow_debt_word=step.key not in ("friendly", "second"))) == []


@pytest.mark.parametrize("name,exp", [("דנה כהן", "דנה"), ("מרפאת שקד בע\"מ", "מרפאת שקד בע\"מ"),
                                      ("", ""), ("  יוסי  ", "יוסי"), ("Acme Ltd", "Acme Ltd")])
def test_first_name(name, exp):
    assert templates.first_name(name) == exp


def test_stop_wording_depends_on_two_way():
    one = templates.render_sms(templates.STEPS[0], F)
    two = templates.render_sms(templates.STEPS[0], {**F, **templates.fields(
        biz="סטודיו מאיר", name="דנה כהן", num="1001", amount_agorot=120000, currency="ILS",
        link=F["link"], unsub=F["unsub"], short=F["short"], two_way=True)})
    assert one.endswith(templates.STOP_LINK) and two.endswith(templates.STOP_REPLY)


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


@pytest.mark.parametrize("raw,exp", [("דנה <Dana@Example.com>", "dana@example.com"),
                                     ("c1@example.com", "c1@example.com"), ("no address", "")])
def test_parse_address(raw, exp):
    from app.channels import parse_address
    assert parse_address(raw) == exp


def test_strip_reply_drops_quote():
    from app.channels import strip_reply
    t = "שילמתי אתמול\nתודה\n\nOn Sun, Nov 8, 2026 Studio wrote:\n> שלום דנה, חשבונית 1001"
    assert strip_reply(t) == "שילמתי אתמול\nתודה"
    assert strip_reply("הסר\n\nבתאריך יום א׳ סטודיו מאיר כתב:\n> לתשלום") == "הסר"
    assert strip_reply("> רק ציטוט") == ""


def test_compliance_ignores_url_contents():
    """באג (בדיקה מהבהבת): קוד אקראי עם 4+ אותיות גדולות בקישור סומן 'pressure' ⇒ תזכורת נחסמה."""
    from app import compliance
    for code in ("XKQZWBT", "aBDIxyz", "DAHUF22"):
        link = f"https://gabi.example/p/{code}"
        sms = f"סטודיו מאיר: שלום דנה, חשבונית 1 ע\"ס 5 ₪ טרם סומנה כשולמה. לתשלום: {link} להפסקה: בקישור"
        assert compliance.violations(sms, compliance.Rules(business="סטודיו מאיר",
                                                           payment_link=link)) == [], code
    # צעקה אמיתית בגוף ההודעה עדיין נחסמת, וקישור זר עדיין נתפס
    assert "pressure" in compliance.violations("סטודיו מאיר: PAYMENT URGENT", compliance.Rules("סטודיו מאיר"))
    assert "foreign_link" in compliance.violations("סטודיו מאיר: https://evil.example/x",
                                                   compliance.Rules("סטודיו מאיר"))


def test_short_code_alphabet_is_lowercase_readable():
    from app.service import _B62
    assert _B62 == _B62.lower() and not set("0o1l") & set(_B62)
