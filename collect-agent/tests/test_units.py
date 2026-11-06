from datetime import date, datetime

import pytest

from app import paylinks, plans, templates
from app.channels import (
    DryRunSender,
    Message,
    build_adapters,
    is_il_mobile,
    normalize_il_phone,
    sms_segments,
)
from app.config import SafetyError, load_settings
from app.conversation import Intent, respond
from app.policy import TZ, Policy
from evals.harness import build_ctx

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
    (at(2026, 11, 8, 8), True),     # 08:00 — פתיחת החלון (הכרעת מאיר)
    (at(2026, 11, 8, 7, 59), False),
    (at(2026, 11, 8, 19, 59), True),
    (at(2026, 11, 8, 20), False),   # 20:00 — סגירה
    (at(2026, 11, 13, 11), True),   # שישי בבוקר
    (at(2026, 11, 13, 12), False),  # שישי אחה"צ — אסור
    (at(2026, 11, 14, 10), False),  # שבת
    (at(2026, 12, 25, 10), False),  # חג מוגדר בהגדרות העסק
    (at(2026, 9, 21, 10), False),   # יום כיפור — מובנה (ממצא מבקר 2.8)
    (at(2026, 9, 20, 11), True),    # ערב יום כיפור בבוקר
    (at(2026, 9, 20, 13), False),   # ערב חג אחה"צ — כמו שישי
    (at(2027, 4, 22, 10), False),   # פסח
])
def test_can_send(dt, ok):
    assert P.can_send_at(dt) is ok


def test_next_allowed_skips_shabbat():
    assert P.next_allowed(at(2026, 11, 13, 14)) == at(2026, 11, 15, 8)


def test_next_allowed_morning():
    assert P.next_allowed(at(2026, 11, 9, 6)) == at(2026, 11, 9, 8)


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


def _preview(provider, msg=MSG):
    sms, email = build_adapters(provider=provider, username="u", token="supersecret",
                                sender="Studio", email_from="a@b.co")
    return DryRunSender(sms=sms, email=email).preview(msg)


def test_adapters_build_requests_and_mask_secrets():
    """שכבה אחת: DryRunSender מציג את הבקשה של adapter ה-integrations, בלי סודות.
    019 = XML של המימוש הקיים, נשמר מחרוזת-מלאה כ-fixture תאימות (חוזה לא מאומת)."""
    inf = _preview("inforu")
    assert inf["provider"] == "inforu"
    assert inf["request"]["body"]["Data"]["Recipients"][0]["Phone"] == "0501234567"
    x = _preview("019", Message("sms", "972501234567", "a<b&c"))
    assert x["request"]["body"] == (
        '<?xml version="1.0" encoding="UTF-8"?><sms><user><username>u</username></user>'
        '<source>Studio</source><destinations><phone>0501234567</phone></destinations>'
        '<message>a&lt;b&amp;c</message></sms>')
    assert x["request"]["url"] == "https://019sms.co.il/api/test"   # שלב 1: endpoint הבדיקה
    for p in (inf, x):
        assert "supersecret" not in str(p) and p["length"]["segments"] == 1


def test_default_chain_is_019_then_inforu():
    chain, _ = build_adapters()
    assert [a.provider for a in chain] == ["019", "inforu"] and all(a.dry_run for a in chain)
    chain, _ = build_adapters(provider="inforu")
    assert [a.provider for a in chain] == ["inforu", "019"]
    with pytest.raises(ValueError):
        load_settings({"SMS_PROVIDER": "twilio"})                    # Twilio יצא (לא נדרש ל-MVP)


def test_email_one_click_unsubscribe_header():
    m = _preview("019", Message("email", "c@d.co", "x", subject="s",
                                unsubscribe_url="https://g.example/u/t"))
    assert m["request"]["headers"]["List-Unsubscribe"] == "<https://g.example/u/t>"
    assert m["request"]["headers"]["List-Unsubscribe-Post"] == "List-Unsubscribe=One-Click"


def test_single_provider_layer():
    """אין יותר מימוש ספק כפול ב-channels.py — הכול מגיע מ-app/integrations."""
    import app.channels as ch
    from app.integrations import sms as isms

    assert ch.SMS_ADAPTERS["019"] is isms.Sms019 and ch.SmtpEmail.__module__ == "app.integrations.email"
    src = open(ch.__file__, encoding="utf-8").read()
    assert "build_request(self" not in src and "019sms.co.il" not in src


def test_dry_sender_refuses_live_adapter():
    import httpx
    import pytest as _pt

    from app.integrations.base import IntegrationError
    from app.integrations.sms import Sms019

    live = Sms019("u", "t", "Studio", transport=httpx.MockTransport(lambda r: httpx.Response(200)))
    _, email = build_adapters()
    with _pt.raises(IntegrationError):
        DryRunSender(sms=live, email=email)
    with _pt.raises(IntegrationError):
        DryRunSender(sms=[Sms019("u", "t", "Studio"), live], email=email)   # גם הגיבוי נבדק


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


# ---------- מסווג (הועבר מ-assistant.py שהוסר ל-conversation.py; ראו docs/MIGRATION-assistant.md) ----------
def classify(text, llm=None):
    return respond(text, build_ctx({}), llm=llm).intent


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
    assert classify(text) == intent


def test_dispute_beats_paid():
    assert classify("שילמתי, וחוץ מזה זו טעות") == Intent.DISPUTE


def test_unknown_escalates_no_auto_reply():
    d = respond("שאלה מורכבת על המע\"מ", build_ctx({}))
    assert d.escalate.value != "none" and d.reply is None and not d.auto_send


def test_llm_garbage_falls_back():
    class Bad:
        def classify(self, t):
            return "pay_me_now"
    assert classify("משהו", Bad()) == Intent.UNKNOWN


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



def test_holiday_table_matches_hebrew_calendar_and_is_current():
    """הלוח המובנה חושב מלוח עברי. נכשלת חצי שנה לפני שהטבלה נגמרת — להאריך."""
    from app.policy import HOLIDAYS, HOLIDAYS_VALID_UNTIL
    assert {"2026-09-21", "2027-10-11", "2028-09-30"} <= set(HOLIDAYS)   # יום כיפור ×3
    assert date.today() < HOLIDAYS_VALID_UNTIL - __import__("datetime").timedelta(days=180)
    try:
        from pyluach import dates as hd
    except ImportError:
        return
    for iso, name in HOLIDAYS.items():
        y, m, d = map(int, iso.split("-"))
        h = hd.GregorianDate(y, m, d).to_heb()
        assert (h.month, h.day) in {(7, 1), (7, 2), (7, 10), (7, 15), (7, 22), (1, 15), (1, 21),
                                    (3, 6)}, (iso, name)


def test_reason_closed_explains():
    assert P.reason_closed(at(2026, 11, 14, 10)) == "שבת"
    assert "חג" in P.reason_closed(at(2026, 9, 21, 10))
    assert P.reason_closed(at(2026, 11, 8, 10)) is None
