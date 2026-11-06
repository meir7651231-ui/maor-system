"""גיבוי ערוצים + registry ממשתני סביבה."""
import httpx
import pytest

from app.integrations.base import IntegrationError
from app.integrations.email import ResendEmail
from app.integrations.notifier import Notification, Notifier
from app.integrations.payments import GreenInvoicePaymentForm, StaticPaymentLink
from app.integrations.registry import (
    build_accounting,
    build_notifier,
    build_payment_links,
    build_sms,
)
from app.integrations.sms import InforUSms, Sms019, TwilioSms

N = Notification(key="reminder:5", phone="0501234567", email="d@example.com",
                 sms_text="תזכורת: חשבונית 1001", email_subject="תזכורת",
                 email_text="שלום, חשבונית 1001 פתוחה")


def counting(status=200, json=None, exc=None):
    calls = []

    def h(req):
        calls.append(req)
        if exc:
            raise exc("x", request=req)
        return httpx.Response(status, json=json or {})
    return httpx.MockTransport(h), calls


OK_INFORU = {"StatusId": 1, "Data": {"MessageId": "i1"}}
OK_019 = {"status": 0, "shipment_id": "s1"}


def test_primary_sms_ok_no_email():
    t1, _ = counting(json=OK_INFORU)
    te, ce = counting(json={"id": "e1"})
    n = Notifier([InforUSms("u", "t", "S1", transport=t1)],
                 ResendEmail("re", "o@s.co", transport=te))
    rep = n.send(N)
    assert rep.delivered and rep.final.provider == "inforu" and len(ce) == 0


def test_retryable_fails_over_to_second_sms():
    t1, _ = counting(status=503)
    t2, _ = counting(json=OK_019)
    rep = Notifier([InforUSms("u", "t", "S1", transport=t1),
                    Sms019("u", "t", "S1", transport=t2)]).send(N)
    assert rep.delivered and [a.provider for a in rep.attempts] == ["inforu", "019"]


def test_permanent_sms_error_skips_other_sms_goes_email():
    t1, _ = counting(status=400)
    t2, c2 = counting(json=OK_019)
    te, _ = counting(json={"id": "e1"})
    rep = Notifier([InforUSms("u", "t", "S1", transport=t1), Sms019("u", "t", "S1", transport=t2)],
                   ResendEmail("re", "o@s.co", transport=te)).send(N)
    assert rep.delivered and len(c2) == 0
    assert [a.channel for a in rep.attempts] == ["sms", "email"]


def test_landline_goes_to_email():
    te, _ = counting(json={"id": "e1"})
    rep = Notifier([InforUSms("u", "t", "S1")], ResendEmail("re", "o@s.co", transport=te)).send(
        Notification(**{**N.__dict__, "phone": "02-6234567"}))
    assert rep.delivered and rep.attempts[0].error.startswith("מספר נייד")
    assert rep.final.channel == "email"


def test_timeout_does_not_double_contact():
    t1, _ = counting(exc=httpx.ReadTimeout)
    te, ce = counting(json={"id": "e1"})
    rep = Notifier([InforUSms("u", "t", "S1", transport=t1)],
                   ResendEmail("re", "o@s.co", transport=te)).send(N)
    assert not rep.delivered and len(ce) == 0


def test_timeout_failover_opt_in():
    t1, _ = counting(exc=httpx.ReadTimeout)
    te, _ = counting(json={"id": "e1"})
    rep = Notifier([InforUSms("u", "t", "S1", transport=t1)],
                   ResendEmail("re", "o@s.co", transport=te), failover_on_timeout=True).send(N)
    assert rep.delivered


def test_all_dry_run_default():
    n = Notifier([InforUSms("u", "t", "S1")], ResendEmail("re", "o@s.co"))
    assert n.dry_run
    rep = n.send(N)
    assert rep.delivered and rep.final.dry_run
    d = rep.as_dict()
    assert d["attempts"][0]["dry_run"] is True


def test_no_channels():
    with pytest.raises(IntegrationError):
        Notifier([], None)


# ------------------------------------------------------------------ registry
ENV = {"SMS_PROVIDER": "inforu, 019,twilio", "SMS_SENDER": "Studio",
       "INFORU_USERNAME": "u", "INFORU_TOKEN": "t", "SMS019_USERNAME": "u", "SMS019_TOKEN": "t",
       "TWILIO_ACCOUNT_SID": "AC1", "TWILIO_AUTH_TOKEN": "t", "TWILIO_FROM": "Studio",
       "EMAIL_PROVIDER": "resend", "RESEND_API_KEY": "re_x", "MAIL_FROM": "o@s.co"}


def test_registry_builds_all_dry_run():
    n = build_notifier(ENV)
    assert [type(a) for a in n.sms] == [InforUSms, Sms019, TwilioSms]
    assert isinstance(n.email, ResendEmail) and n.dry_run


def test_registry_smtp():
    n = build_notifier({"EMAIL_PROVIDER": "smtp", "SMTP_HOST": "smtp.ex.com",
                        "MAIL_FROM": "o@s.co"})
    assert n.email.provider == "smtp" and n.email.dry_run and n.sms == []


def test_registry_errors():
    with pytest.raises(IntegrationError, match="INFORU_TOKEN"):
        build_sms("inforu", {"INFORU_USERNAME": "u", "SMS_SENDER": "S"})
    with pytest.raises(IntegrationError):
        build_sms("whatsapp", {})
    with pytest.raises(IntegrationError):
        build_notifier({})


def test_registry_accounting_and_payments(gi_client):
    assert build_accounting({}, gi_client=gi_client).provider == "greeninvoice"
    assert build_accounting({"ACCOUNTING_PROVIDER": "icount",
                             "ICOUNT_API_TOKEN": "x"}).provider == "icount"
    assert isinstance(build_payment_links({"PAYMENT_LINK": "https://p.co/x"}), StaticPaymentLink)
    f = build_payment_links({"PAYMENT_LINK_MODE": "greeninvoice",
                             "PAYMENT_LINK": "https://p.co/x"}, gi_client=gi_client)
    assert isinstance(f, GreenInvoicePaymentForm) and f.allow_write is False
    with pytest.raises(IntegrationError):
        build_payment_links({})
