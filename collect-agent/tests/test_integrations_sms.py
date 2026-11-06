"""SMS adapters — InforU / 019 / Twilio. אפס רשת: dry-run או MockTransport בלבד."""
import json
from urllib.parse import parse_qs

import httpx
import pytest

from app.config import SafetyError
from app.integrations.base import IntegrationError, SmsMessage
from app.integrations.sms import (
    InforUSms,
    Sms019,
    TwilioSms,
    il_mobile_intl,
    il_mobile_local,
    sms_segments,
    validate_sender,
)

HEB = "שלום דנה, תזכורת ידידותית: חשבונית 1001 על סך 1,200 ₪ טרם שולמה."


def mock(handler):
    calls = []

    def h(req):
        calls.append(req)
        return handler(req)
    return httpx.MockTransport(h), calls


# ---------- עזרי טלפון / קידוד
@pytest.mark.parametrize("raw", ["050-1234567", "+972 50 1234567", "00972501234567",
                                 "0501234567", "972-50-123-4567"])
def test_mobile_normalize(raw):
    assert il_mobile_intl(raw) == "972501234567"
    assert il_mobile_local(raw) == "0501234567"


@pytest.mark.parametrize("raw", ["02-6234567", "03-1234567", "", "12345", "+1 202 555 0100"])
def test_landline_or_foreign_rejected(raw):
    with pytest.raises(IntegrationError):
        il_mobile_intl(raw)


def test_segments():
    assert sms_segments("a" * 160) == ("GSM-7", 1)
    assert sms_segments("a" * 161) == ("GSM-7", 2)
    assert sms_segments("א" * 70) == ("UCS-2", 1)
    assert sms_segments("א" * 71) == ("UCS-2", 2)
    assert sms_segments("א" * 134) == ("UCS-2", 2)
    assert sms_segments("€" * 80) == ("GSM-7", 1)       # תו הרחבה = 2 יחידות
    assert sms_segments("€" * 81) == ("GSM-7", 2)


@pytest.mark.parametrize("bad", ["", "VeryLongSender", "דנה", "12", "a!b"])
def test_sender_invalid(bad):
    with pytest.raises(IntegrationError):
        validate_sender(bad)


def test_sender_valid():
    assert validate_sender("Studio1") == "Studio1"
    assert validate_sender("0501234567") == "0501234567"


# ---------- מעקות
def test_real_transport_refused():
    with pytest.raises(SafetyError):
        InforUSms("u", "t", "Studio", transport=httpx.HTTPTransport())


def test_too_long_refused():
    a = InforUSms("u", "t", "Studio")
    with pytest.raises(IntegrationError):
        a.send(SmsMessage("0501234567", "א" * 300))


def test_missing_credentials():
    with pytest.raises(IntegrationError):
        InforUSms("", "t", "Studio")
    with pytest.raises(IntegrationError):
        TwilioSms("AC1", "tok")   # בלי From/MSS


# ---------- InforU
def test_inforu_dry_run_preview_no_secret():
    a = InforUSms("meir", "SECRET-TOKEN", "Studio")
    r = a.send(SmsMessage("+972501234567", HEB, "reminder:1"))
    assert r.ok and r.dry_run and r.message_id.startswith("dryrun.inforu")
    p = r.preview
    assert p["url"] == InforUSms.URL
    assert p["body"]["Data"]["Recipients"] == [{"Phone": "0501234567"}]
    assert p["body"]["Data"]["Message"] == HEB
    assert p["headers"]["authorization"] == "***"
    assert "SECRET-TOKEN" not in json.dumps(a.outbox)


def test_inforu_mock_success_and_auth():
    t, calls = mock(lambda r: httpx.Response(200, json={
        "StatusId": 1, "StatusDescription": "Success", "Data": {"MessageId": "m-77"}}))
    a = InforUSms("meir", "tok", "Studio", transport=t)
    r = a.send(SmsMessage("050-1234567", HEB))
    assert r.ok and not r.dry_run and r.message_id == "m-77"
    assert calls[0].headers["authorization"] == "Basic bWVpcjp0b2s="  # meir:tok


def test_inforu_status_error_not_retryable():
    t, _ = mock(lambda r: httpx.Response(200, json={"StatusId": -2,
                                                    "StatusDescription": "Bad credentials"}))
    r = InforUSms("u", "t", "Studio", transport=t).send(SmsMessage("0501234567", "hi"))
    assert not r.ok and not r.retryable and "Bad credentials" in r.error


def test_inforu_5xx_retryable():
    t, _ = mock(lambda r: httpx.Response(503))
    r = InforUSms("u", "t", "Studio", transport=t).send(SmsMessage("0501234567", "hi"))
    assert not r.ok and r.retryable


def test_inforu_429_retryable_400_not():
    t, _ = mock(lambda r: httpx.Response(429))
    assert InforUSms("u", "t", "S1", transport=t).send(SmsMessage("0501234567", "x")).retryable
    t, _ = mock(lambda r: httpx.Response(400))
    assert not InforUSms("u", "t", "S1", transport=t).send(
        SmsMessage("0501234567", "x")).retryable


def test_idempotency_no_double_send():
    t, calls = mock(lambda r: httpx.Response(200, json={"StatusId": 1, "Data": {"MessageId": "1"}}))
    a = InforUSms("u", "t", "Studio", transport=t)
    r1 = a.send(SmsMessage("0501234567", "x", "reminder:9"))
    r2 = a.send(SmsMessage("0501234567", "x", "reminder:9"))
    assert len(calls) == 1 and r2.duplicate and r2.message_id == r1.message_id


def test_timeout_retryable_and_not_marked_seen():
    def boom(req):
        raise httpx.ConnectTimeout("slow", request=req)
    a = InforUSms("u", "t", "Studio", transport=httpx.MockTransport(boom))
    r = a.send(SmsMessage("0501234567", "x", "k1"))
    assert not r.ok and r.retryable and "Timeout" in r.error
    assert not a.send(SmsMessage("0501234567", "x", "k1")).duplicate


def test_unexpected_body_handled():
    t, _ = mock(lambda r: httpx.Response(200, text="<html>oops</html>"))
    r = InforUSms("u", "t", "Studio", transport=t).send(SmsMessage("0501234567", "x"))
    assert not r.ok and "לא צפויה" in r.error


# ---------- 019
def test_019_request_shape_and_success():
    t, calls = mock(lambda r: httpx.Response(200, json={"status": 0, "message": "ok",
                                                        "shipment_id": "s-1"}))
    a = Sms019("meir", "TOK019", "Studio", transport=t)
    r = a.send(SmsMessage("+972-52-7654321", HEB))
    assert r.ok and r.message_id == "s-1"
    body = json.loads(calls[0].content)["sms"]
    assert body["destinations"] == {"phone": ["0527654321"]}
    assert body["source"] == "Studio" and body["user"] == {"username": "meir"}
    assert calls[0].headers["authorization"] == "Bearer TOK019"
    assert "TOK019" not in json.dumps(a.outbox)


def test_019_error_status():
    t, _ = mock(lambda r: httpx.Response(200, json={"status": 3, "message": "no credit"}))
    r = Sms019("u", "t", "Studio", transport=t).send(SmsMessage("0501234567", "x"))
    assert not r.ok and "no credit" in r.error


# ---------- Twilio
def test_twilio_form_and_sid():
    t, calls = mock(lambda r: httpx.Response(201, json={"sid": "SM123", "status": "queued"}))
    a = TwilioSms("AC9", "TWTOKEN", from_="Studio", transport=t)
    r = a.send(SmsMessage("0501234567", HEB))
    assert r.ok and r.message_id == "SM123"
    req = calls[0]
    assert req.url.path == "/2010-04-01/Accounts/AC9/Messages.json"
    form = parse_qs(req.content.decode())
    assert form["To"] == ["+972501234567"] and form["From"] == ["Studio"]
    assert form["Body"] == [HEB]
    assert "TWTOKEN" not in json.dumps(a.outbox)


def test_twilio_messaging_service():
    a = TwilioSms("AC9", "tok", messaging_service_sid="MG1")
    r = a.send(SmsMessage("0501234567", "x"))
    assert r.preview["body"]["MessagingServiceSid"] == "MG1"
    assert "From" not in r.preview["body"]


def test_twilio_error_body():
    t, _ = mock(lambda r: httpx.Response(400, json={"code": 21211, "message": "invalid To"}))
    r = TwilioSms("AC9", "tok", from_="S1", transport=t).send(SmsMessage("0501234567", "x"))
    assert not r.ok and not r.retryable and r.error == "twilio: HTTP 400"
