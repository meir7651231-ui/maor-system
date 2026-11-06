"""מייל — SMTP (factory מדומה) ו-Resend (MockTransport)."""
import json
import smtplib
from typing import ClassVar

import httpx
import pytest

from app.config import SafetyError
from app.integrations.base import EmailMessageOut, IntegrationError
from app.integrations.email import ResendEmail, SmtpEmail, valid_email

MSG = EmailMessageOut(to="dana@example.com", subject="תזכורת: חשבונית 1001",
                      text="שלום דנה, חשבונית 1001 על סך 1,200 ₪ פתוחה.",
                      html="<p>שלום דנה</p>", reply_to="owner@studio.co.il",
                      idempotency_key="reminder:1",
                      unsubscribe_url="https://app.example/u/abc")


class FakeSMTP:
    is_mock = True
    instances: ClassVar[list["FakeSMTP"]] = []

    def __init__(self, host, port, timeout=None, *, fail=None, refuse=False):
        self.host, self.port, self.sent, self.logged = host, port, [], None
        self.tls = False
        self.fail, self.refuse = fail, refuse
        FakeSMTP.instances.append(self)

    def starttls(self, context=None):
        self.tls = True

    def login(self, u, p):
        if self.fail:
            raise self.fail
        self.logged = (u, p)

    def send_message(self, m):
        self.sent.append(m)
        return {"x@y.z": (550, b"no")} if self.refuse else {}

    def quit(self):
        pass


def factory(**kw):
    def f(host, port, timeout=None):
        return FakeSMTP(host, port, timeout, **kw)
    f.is_mock = True
    return f


@pytest.mark.parametrize("bad", ["", "dana", "a@b", "a@b.c\nBcc: x@y.z", "<a@b.co>"])
def test_invalid_email(bad):
    with pytest.raises(IntegrationError):
        valid_email(bad)


def test_smtp_real_factory_refused():
    with pytest.raises(SafetyError):
        SmtpEmail("smtp.gmail.com", 587, "u", "p", "a@b.co", factory=smtplib.SMTP)


def test_smtp_dry_run_builds_mime_without_password():
    s = SmtpEmail("smtp.example.com", 587, "u@ex.com", "APP-PASSWORD", "owner@studio.co.il",
                  from_name="סטודיו מאיר")
    r = s.send(MSG)
    assert r.ok and r.dry_run and r.message_id.startswith("<")
    h = r.preview["headers"]
    assert h["To"] == "dana@example.com" and h["Reply-To"] == "owner@studio.co.il"
    assert h["List-Unsubscribe"] == "<https://app.example/u/abc>"
    assert h["List-Unsubscribe-Post"] == "List-Unsubscribe=One-Click"
    assert "APP-PASSWORD" not in json.dumps(s.outbox, ensure_ascii=False)


def test_smtp_mime_multipart_and_hebrew_subject():
    s = SmtpEmail("h", 587, "", "", "owner@studio.co.il")
    m = s.build_message(MSG)
    assert m.is_multipart()
    assert m["Subject"] == "תזכורת: חשבונית 1001"
    assert "=?utf-8?" in m.as_string()      # נושא מקודד RFC 2047


def test_smtp_header_injection_blocked():
    s = SmtpEmail("h", 587, "", "", "owner@studio.co.il")
    with pytest.raises(IntegrationError):
        s.send(EmailMessageOut(to="a@b.co", subject="hi\r\nBcc: evil@x.co", text="t"))


def test_smtp_mock_send_starttls_login():
    FakeSMTP.instances.clear()
    s = SmtpEmail("smtp.example.com", 587, "u", "p", "owner@studio.co.il", factory=factory())
    r = s.send(MSG)
    conn = FakeSMTP.instances[-1]
    assert r.ok and not r.dry_run and conn.tls and conn.logged == ("u", "p")
    assert conn.sent[0]["To"] == "dana@example.com"


def test_smtp_idempotent():
    FakeSMTP.instances.clear()
    s = SmtpEmail("h", 587, "u", "p", "owner@studio.co.il", factory=factory())
    s.send(MSG)
    r2 = s.send(MSG)
    assert r2.duplicate and len(FakeSMTP.instances) == 1


def test_smtp_auth_error_not_retryable():
    err = smtplib.SMTPAuthenticationError(535, b"bad creds")
    r = SmtpEmail("h", 587, "u", "p", "o@s.co", factory=factory(fail=err)).send(MSG)
    assert not r.ok and not r.retryable


def test_smtp_temp_error_retryable():
    err = smtplib.SMTPResponseException(451, b"try later")
    r = SmtpEmail("h", 587, "u", "p", "o@s.co", factory=factory(fail=err)).send(MSG)
    assert not r.ok and r.retryable


def test_smtp_refused_recipient():
    r = SmtpEmail("h", 587, "u", "p", "o@s.co", factory=factory(refuse=True)).send(MSG)
    assert not r.ok and "נדחה" in r.error


def test_resend_request_and_idempotency_header():
    calls = []

    def h(req):
        calls.append(req)
        return httpx.Response(200, json={"id": "re-123"})
    a = ResendEmail("re_SECRET", "owner@studio.co.il", from_name="סטודיו",
                    transport=httpx.MockTransport(h))
    r = a.send(MSG)
    assert r.ok and r.message_id == "re-123"
    req = calls[0]
    body = json.loads(req.content)
    assert req.headers["idempotency-key"] == "reminder:1"
    assert req.headers["authorization"] == "Bearer re_SECRET"
    assert body["to"] == ["dana@example.com"] and body["from"] == "סטודיו <owner@studio.co.il>"
    assert body["reply_to"] == "owner@studio.co.il"
    assert body["headers"]["List-Unsubscribe"] == "<https://app.example/u/abc>"
    assert "re_SECRET" not in json.dumps(a.outbox, ensure_ascii=False)
    a.send(MSG)
    assert len(calls) == 1


def test_resend_dry_run():
    r = ResendEmail("re_x", "o@s.co").send(MSG)
    assert r.ok and r.dry_run and r.preview["url"] == ResendEmail.URL


def test_resend_errors():
    for code, retry in ((422, False), (429, True), (500, True)):
        t = httpx.MockTransport(lambda req, c=code: httpx.Response(c, json={"message": "x"}))
        r = ResendEmail("re_x", "o@s.co", transport=t).send(MSG)
        assert not r.ok and r.retryable is retry


def test_unsubscribe_must_be_https():
    with pytest.raises(IntegrationError):
        ResendEmail("re_x", "o@s.co").send(EmailMessageOut(
            to="a@b.co", subject="s", text="t", unsubscribe_url="http://x.co/u"))
