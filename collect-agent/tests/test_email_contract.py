"""חוזה המייל היוצא (RFC 5322 / MIME / Gmail-Yahoo bulk-sender) — על מייל תזכורת אמיתי מהדמו.

מייל = ערוץ הגיבוי (אין נייד) וערוץ התשובה לצד /p. מה שנבדק כאן הוא מה ששרת דואר רואה,
לא מה שהממשק מציג. באג שנתפס: לא היה Date (שדה חובה ב-RFC 5322 §3.6 יחד עם From).
"""
from __future__ import annotations

import email
import re
from email import policy
from email.utils import parsedate_to_datetime

import pytest

from app.demo import build_demo_service
from app.integrations.base import EmailMessageOut
from app.integrations.email import SmtpEmail


@pytest.fixture
def mail():
    """מייל התזכורת הראשון של הדמו, כפי שה-adapter בונה אותו, אחרי סבב דרך bytes (כמו ב-SMTP)."""
    svc, _, _ = build_demo_service()
    svc.sync()
    for rid in svc.plan():
        msgs = [m for m in svc.preview(rid)["messages"] if m["channel"] == "email"]
        if msgs:
            break
    m = msgs[0]
    built = svc.sender.email.build_message(EmailMessageOut(
        to=m["to"], subject=m["subject"], text=m["body"], html=m["html"],
        reply_to=svc.sender.reply_to,
        unsubscribe_url=m["request"]["headers"]["List-Unsubscribe"][1:-1]))
    return email.message_from_bytes(built.as_bytes(), policy=policy.default)


def test_mandatory_headers_rfc5322(mail):
    for h in ("Date", "From", "To", "Subject", "Message-ID", "MIME-Version"):
        assert mail[h], f"חסר {h}"
    assert parsedate_to_datetime(mail["Date"]).tzinfo is not None      # תאריך תקין עם אזור זמן


def test_message_id_unique_and_on_sender_domain():
    s = SmtpEmail("smtp.gabi.example", 587, "", "", "gabi@example.com")
    out = EmailMessageOut(to="a@b.co", subject="s", text="t")
    ids = {s.build_message(out)["Message-ID"] for _ in range(5)}
    assert len(ids) == 5 and all(re.fullmatch(r"<[^<>@\s]+@example\.com>", i) for i in ids)


def test_mime_structure_text_and_rtl_html(mail):
    assert mail.get_content_type() == "multipart/alternative"
    parts = {p.get_content_type(): p for p in mail.iter_parts()}
    assert set(parts) == {"text/plain", "text/html"}
    for p in parts.values():
        assert p.get_content_charset() == "utf-8"
    html = parts["text/html"].get_content()
    assert 'dir="rtl"' in html                                       # עברית מוצגת נכון
    assert "<script" not in html.lower()


def test_one_click_unsubscribe_gmail_yahoo(mail):
    lu = mail["List-Unsubscribe"]
    assert re.fullmatch(r"<https?://[^>]+>", lu), lu
    assert mail["List-Unsubscribe-Post"] == "List-Unsubscribe=One-Click"
    url = lu[1:-1]
    text = next(p for p in mail.iter_parts() if p.get_content_type() == "text/plain").get_content()
    assert url in text                                               # הסרה גם בגוף, לא רק בכותרת


def test_reply_to_owner_and_hebrew_subject_roundtrip(mail):
    assert mail["Reply-To"] == "owner@example.com"
    assert re.search(r"[֐-׿]", str(mail["Subject"]))       # נושא בעברית שרד את הקידוד
