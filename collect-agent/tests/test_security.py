"""אבטחה: הצפנת סודות, אימות API/webhook, חיטוי, הסוואת PII, וסריקות סטטיות של הקוד.

כל בדיקה כאן = מעקה שנשבר אם מישהו "מקל" בטעות. תיעוד הסיבה בעברית ליד כל אחת.
"""
from __future__ import annotations

import ast
import json
import os
import pathlib
import re
import stat
import time

import pytest
from fastapi.testclient import TestClient

from app import security
from app.config import SafetyError, load_settings
from app.db import DB
from app.main import create_app
from app.secretbox import Secret, SecretBox, SecretError, context_for, generate_key
from tests.conftest import OWNER_TOKEN

ROOT = pathlib.Path(__file__).resolve().parents[1]
APP_FILES = sorted((ROOT / "app").rglob("*.py"))  # כולל app/integrations/


# ======================= SecretBox =======================
@pytest.fixture
def box():
    return SecretBox.from_spec(f"k1:{generate_key()}")


def test_roundtrip_and_no_plaintext_in_token(box):
    tok = box.encrypt("gi-secret-ABC", context=context_for(7, "gi_secret"))
    assert tok.startswith("v1.k1.") and "gi-secret-ABC" not in tok
    assert box.decrypt(tok, context="biz:7:gi_secret").reveal() == "gi-secret-ABC"


def test_nonce_is_random(box):
    a = box.encrypt("x", context="biz:1:a")
    b = box.encrypt("x", context="biz:1:a")
    assert a != b  # אותו סוד ⇒ צופן שונה (אין דליפת שוויון)


def test_ciphertext_bound_to_tenant_and_field(box):
    tok = box.encrypt("s", context=context_for(1, "gi_secret"))
    # העתקת צופן של עסק 1 לשורה של עסק 2 — חייבת להיכשל
    with pytest.raises(SecretError):
        box.decrypt(tok, context=context_for(2, "gi_secret"))
    with pytest.raises(SecretError):
        box.decrypt(tok, context=context_for(1, "sms_token"))


def test_tamper_detected(box):
    tok = box.encrypt("s", context="biz:1:a")
    head, blob = tok.rsplit(".", 1)
    flipped = blob[:-2] + ("A" if blob[-2] != "A" else "B") + blob[-1]
    with pytest.raises(SecretError):
        box.decrypt(f"{head}.{flipped}", context="biz:1:a")
    for bad in ("", "v1.k1", "v0.k1.AAAA", "v1.k1.!!!", "v1.k1.AAAA"):
        with pytest.raises(SecretError):
            box.decrypt(bad, context="biz:1:a")


def test_rotation():
    k1, k2 = generate_key(), generate_key()
    old = SecretBox.from_spec(f"k1:{k1}")
    tok = old.encrypt("s", context="biz:1:a")
    new = SecretBox.from_spec(f"k2:{k2},k1:{k1}")
    assert new.decrypt(tok, context="biz:1:a").reveal() == "s"
    assert new.needs_rotation(tok)
    tok2 = new.rotate(tok, context="biz:1:a")
    assert tok2.startswith("v1.k2.") and not new.needs_rotation(tok2)
    # אחרי הוצאת k1 משימוש — הצופן הישן כבר לא נפתח, החדש כן
    only2 = SecretBox.from_spec(f"k2:{k2}")
    assert only2.decrypt(tok2, context="biz:1:a").reveal() == "s"
    with pytest.raises(SecretError):
        only2.decrypt(tok, context="biz:1:a")


def test_fail_closed_on_bad_keys():
    with pytest.raises(SecretError):
        SecretBox.from_env({})  # אין מפתח ⇒ לא ממשיכים בלי הצפנה
    with pytest.raises(SecretError):
        SecretBox.from_spec("k1:" + "QUJD")  # 3 בייט
    with pytest.raises(SecretError):
        SecretBox.from_spec(f"k1:{generate_key()},k1:{generate_key()}")  # kid כפול
    with pytest.raises(SecretError):
        SecretBox.from_spec(f"bad kid!:{generate_key()}")
    with pytest.raises(SecretError):
        SecretBox.from_spec("nocolon")
    with pytest.raises(SecretError):
        context_for(1, "Bad Field")


def test_errors_and_reprs_never_leak_material():
    key = generate_key()
    box = SecretBox.from_spec(f"k1:{key}")
    assert key not in repr(box)
    s = Secret("hunter2")
    assert "hunter2" not in repr(s) and "hunter2" not in str(s) and "hunter2" not in f"{s}"
    try:
        SecretBox.from_spec(f"k1:{key[:10]}")
    except SecretError as e:
        assert key[:10] not in str(e)


def test_settings_repr_hides_secrets():
    s = load_settings({"GREENINVOICE_API_SECRET": "gi-SECRET-1", "OWNER_API_TOKEN": "own-TOKEN-1",
                       "INBOUND_WEBHOOK_SECRET": "wh-SECRET-1"})
    r = repr(s)
    for v in ("gi-SECRET-1", "own-TOKEN-1", "wh-SECRET-1"):
        assert v not in r


# ======================= הגדרות =======================
@pytest.mark.parametrize("link", ["http://pay.example/x", "javascript:alert(1)",
                                  "https://user:pw@pay.example/", "https://pay.example/\nX",
                                  "https:///nohost", "ftp://x.example"])
def test_payment_link_must_be_https(link):
    with pytest.raises(SafetyError):
        load_settings({"PAYMENT_LINK": link})


def test_payment_link_ok():
    assert load_settings({"PAYMENT_LINK": "https://pay.example/x?a=1"}).payment_link


# ======================= API: אימות בעלים =======================
@pytest.fixture
def raw_api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN, webhook_secret="wh-secret"))


PROTECTED = [("post", "/sync"), ("post", "/plan"), ("get", "/reminders"),
             ("get", "/reminders/1/preview"), ("post", "/customers/1/resume"),
             ("post", "/reminders/1/approve"), ("post", "/reminders/1/reject"),
             ("post", "/dispatch"), ("get", "/outbox"), ("get", "/owner/inbox"),
             ("get", "/plans"), ("post", "/plans/1/approve"), ("get", "/audit")]


@pytest.mark.parametrize("method,path", PROTECTED)
@pytest.mark.parametrize("hdr", [None, "Bearer wrong", "Basic " + OWNER_TOKEN, "Bearer ",
                                 OWNER_TOKEN])
def test_every_owner_endpoint_requires_token(raw_api, method, path, hdr):
    headers = {"Authorization": hdr} if hdr is not None else {}
    r = getattr(raw_api, method)(path, headers=headers)
    assert r.status_code == 401, (method, path, hdr)


# ציבוריים במכוון: בריאות, דף ה-UI ודף הנחיתה (סטטיים, בלי נתונים), דף הסרה (טוקן אקראי לכל לקוח),
# webhook של 019 (מפתח משלו ב-URL). כל תוספת כאן = החלטה מודעת.
# + webhook מייל (מפתח משלו, 403 בלי) ועמודי החייב מקישור ה-SMS (/p, /pay — קוד אקראי לכל חשבונית,
# בלי נתוני בעל העסק; 404 על קוד לא קיים).
PUBLIC_ROUTES = {"/health", "/", "/ui", "/landing", "/u/{token}", "/webhooks/sms/019", "/webhooks/greeninvoice",
                 "/webhooks/email", "/p/{code}", "/p/{code}/pay", "/p/{code}/{action}",
                 "/pay/{code}", "/pay/{code}/{action}", "/api/pay/{code}"}


def test_route_inventory_is_fully_guarded(svc):
    """נקודה חדשה שנוספה בלי אימות ⇒ הבדיקה נופלת (מלבד /health)."""
    app = create_app(svc, owner_token=OWNER_TOKEN)
    c = TestClient(app)
    for route in app.routes:
        path = getattr(route, "path", "")
        if path in PUBLIC_ROUTES or not getattr(route, "methods", None):
            continue
        for m in route.methods - {"HEAD", "OPTIONS"}:
            url = re.sub(r"\{[^}]+\}", "1", path)
            r = c.request(m, url, json={"sender": "0501234567", "text": "x"})
            assert r.status_code == 401, f"{m} {path} פתוח בלי אימות"


def test_health_is_public_and_leaks_nothing(raw_api):
    r = raw_api.get("/health")
    assert r.status_code == 200
    assert OWNER_TOKEN not in r.text and "secret" not in r.text.lower()


def test_docs_hidden_by_default(raw_api):
    assert raw_api.get("/docs").status_code == 404
    assert raw_api.get("/openapi.json").status_code == 404


@pytest.mark.parametrize("tok", ["", "short", "a" * 40])
def test_app_refuses_to_start_with_weak_token(svc, tok):
    with pytest.raises(SafetyError):
        create_app(svc, owner_token=tok)


def test_inbound_payload_limits(raw_api):
    h = {"Authorization": f"Bearer {OWNER_TOKEN}"}
    assert raw_api.post("/inbound", headers=h,
                        json={"sender": "0" * 300, "text": "x"}).status_code == 422
    assert raw_api.post("/inbound", headers=h,
                        json={"sender": "050", "text": "x" * 5000}).status_code == 422


# ======================= webhook חתום =======================
def _signed(secret, body: bytes, ts=None):
    ts = int(time.time()) if ts is None else ts
    return {"X-Collect-Timestamp": str(ts),
            "X-Collect-Signature": security.sign_webhook(secret, ts, body),
            "Content-Type": "application/json"}


def test_inbound_accepts_valid_signature(raw_api):
    body = json.dumps({"sender": "054-0000000", "text": "שלום"}).encode()
    r = raw_api.post("/inbound", content=body, headers=_signed("wh-secret", body))
    assert r.status_code == 200 and r.json()["intent"] == "unknown_sender"


@pytest.mark.parametrize("case", ["wrong_secret", "tampered", "old", "future", "no_ts"])
def test_inbound_rejects_bad_signature(raw_api, case):
    body = json.dumps({"sender": "050-1234567", "text": "הסר"}).encode()
    h = _signed("wh-secret", body)
    if case == "wrong_secret":
        h = _signed("other", body)
    elif case == "tampered":
        body = json.dumps({"sender": "050-1234567", "text": "שילמתי"}).encode()
    elif case == "old":
        h = _signed("wh-secret", body, ts=int(time.time()) - 3600)
    elif case == "future":
        h = _signed("wh-secret", body, ts=int(time.time()) + 3600)
    else:
        h.pop("X-Collect-Timestamp")
    r = raw_api.post("/inbound", content=body, headers=h)
    assert r.status_code == 401


def test_spoofed_opt_out_does_not_change_state(raw_api, svc):
    """תוקף שמכיר מספר טלפון לא יכול לבטל תזכורות/לסמן 'מחלוקת' בלי חתימה."""
    svc.ingest(list(svc.gi.iter_open_invoices()))
    r = raw_api.post("/inbound", json={"sender": "050-1234567", "text": "הסר"})
    assert r.status_code == 401
    assert svc.db.one("SELECT opted_out FROM customers WHERE phone='050-1234567'")[0] == 0


def test_webhook_secret_missing_means_closed(svc):
    c = TestClient(create_app(svc, owner_token=OWNER_TOKEN, webhook_secret=""))
    body = b'{"sender":"050","text":"x"}'
    assert c.post("/inbound", content=body, headers=_signed("", body)).status_code == 401


def test_twilio_signature_vector():
    # וקטור מהתיעוד הרשמי של Twilio (Security → Validating requests)
    token = "12345"
    url = "https://mycompany.com/myapp.php?foo=1&bar=2"
    params = {"CallSid": "CA1234567890ABCDE", "Caller": "+12349013030", "Digits": "1234",
              "From": "+12349013030", "To": "+18005551212"}
    assert security.twilio_signature(token, url, params) == "0/KCTR6DLpKmkAf8muzZqo1nDgQ="
    assert security.verify_twilio(token, url, params, "0/KCTR6DLpKmkAf8muzZqo1nDgQ=")
    assert not security.verify_twilio(token, url, {**params, "Digits": "9"},
                                      "0/KCTR6DLpKmkAf8muzZqo1nDgQ=")
    assert not security.verify_twilio(None, url, params, "x")


# ======================= חיטוי ו-PII =======================
def test_header_injection_blocked():
    v = security.sanitize_header_value("דנה\r\nBcc: evil@x.com")
    assert "\r" not in v and "\n" not in v


def test_bidi_controls_stripped():
    # RLO יכול להפוך "moc.evil" ל-"evil.com" בתצוגה
    assert security.sanitize_field("abc\u202egnp.exe") == "abcgnp.exe"


def test_sanitize_field_length():
    assert len(security.sanitize_field("א" * 500)) == 80


def test_html_escape():
    assert security.html_escape('<a href="x">') == "&lt;a href=&quot;x&quot;&gt;"


def test_redact():
    t = security.redact('to 050-1234567 and +972 52 7654321, dana@example.com, '
                        'Authorization: Bearer abc.def-123 "secret": "s3cr3t" token=xyz')
    for leak in ("050-1234567", "7654321 ", "dana@", "abc.def-123", "s3cr3t", "xyz"):
        assert leak not in t, leak
    assert "***4567" in t and "d***@example.com" in t


def test_token_ok_constant_time_semantics():
    assert security.token_ok("a" * 32, "a" * 32)
    assert not security.token_ok("a" * 32, "")
    assert not security.token_ok("", "")
    assert not security.token_ok(None, None)


# ======================= DB =======================
@pytest.mark.skipif(os.name != "posix", reason="הרשאות POSIX")
def test_db_file_is_owner_only(tmp_path):
    p = tmp_path / "x.sqlite3"
    DB(str(p))
    assert stat.S_IMODE(p.stat().st_mode) == 0o600


# ======================= סריקות סטטיות =======================
def _calls(tree):
    for n in ast.walk(tree):
        if isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute):
            yield n


def test_no_dynamic_sql():
    """כל SQL עם פרמטרים (?) — אסור f-string/format/+ בתוך execute/q/one/x."""
    for f in APP_FILES:
        tree = ast.parse(f.read_text(encoding="utf-8"))
        for n in _calls(tree):
            if n.func.attr in ("execute", "executescript", "q", "one", "x") and n.args:
                a = n.args[0]
                assert not isinstance(a, ast.JoinedStr), f"{f.name}:{n.lineno} f-string ב-SQL"
                if isinstance(a, ast.Call) and isinstance(a.func, ast.Attribute):
                    assert a.func.attr != "format", f"{f.name}:{n.lineno} format ב-SQL"


def test_no_dangerous_calls():
    banned = {"eval", "exec", "compile", "__import__"}
    for f in APP_FILES:
        tree = ast.parse(f.read_text(encoding="utf-8"))
        for n in ast.walk(tree):
            if isinstance(n, ast.Call) and isinstance(n.func, ast.Name):
                assert n.func.id not in banned, f"{f.name}:{n.lineno} {n.func.id}"
        src = f.read_text(encoding="utf-8")
        for pat in (r"\bpickle\b", r"\bmarshal\b", r"shell\s*=\s*True", r"\bos\.system\(",
                    r"verify\s*=\s*False", r"yaml\.load\("):
            assert not re.search(pat, src), f"{f.name}: {pat}"


ALLOWED_HOSTS = {
    "sandbox.d.greeninvoice.co.il", "api.greeninvoice.co.il",          # הנהלת חשבונות
    # ספקי SMS — נוספו במודע 6.11.2026 (adapters שרק *בונים* בקשה; שליחה = DryRunSender)
    "019sms.co.il", "capi.inforu.co.il", "api.twilio.com",
    "api.resend.com",                    # מייל (adapter, dry-run)
    "api.icount.co.il",                  # הנהלת חשבונות חלופית (adapter, קריאה)
}


def test_no_unexpected_outbound_hosts():
    """רשימה סגורה של יעדי רשת. כתובת חדשה = החלטה מפורשת ⇒ מעדכנים כאן במודע.
    WhatsApp (graph.facebook.com) אסור בהחלטת מוצר — מדיניות Meta."""
    for f in APP_FILES:
        for host in re.findall(r"https?://([A-Za-z0-9.-]+)", f.read_text(encoding="utf-8")):
            assert (host in ALLOWED_HOSTS or host.endswith(".example")
                    or host in ("127.0.0.1", "localhost")), f"{f.name}: {host}"
            assert "facebook" not in host and "whatsapp" not in host


SECRET_PATTERNS = [
    (r"AKIA[0-9A-Z]{16}", "AWS key"),
    (r"sk-ant-[A-Za-z0-9_-]{20,}", "Anthropic key"),
    (r"sk_live_[A-Za-z0-9]{16,}", "Stripe live key"),
    (r"AIza[0-9A-Za-z_-]{35}", "Google API key"),
    (r"xox[abposr]-[A-Za-z0-9-]{10,}", "Slack token"),
    (r"gh[pousr]_[A-Za-z0-9]{36}", "GitHub token"),
    (r"SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}", "SendGrid key"),
    (r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----", "private key"),
    (r"\bAC[0-9a-f]{32}\b", "Twilio SID"),
    (r"k\d+:[A-Za-z0-9_-]{43}\b", "COLLECT_MASTER_KEYS"),
]


def test_no_secrets_committed():
    skip = {".git", "__pycache__", ".pytest_cache", "collect_agent.egg-info", ".venv"}
    hits = []
    for p in ROOT.rglob("*"):
        if not p.is_file() or set(p.parts) & skip or p.suffix in (".pyc", ".sqlite3"):
            continue
        txt = p.read_text(encoding="utf-8", errors="ignore")
        for pat, name in SECRET_PATTERNS:
            if re.search(pat, txt):
                hits.append(f"{p.relative_to(ROOT)}: {name}")
    assert not hits, hits
    assert not (ROOT / ".env").exists() or ".env" in (ROOT / ".gitignore").read_text()


def test_gitignore_covers_sensitive_files():
    gi = (ROOT / ".gitignore").read_text()
    for entry in (".env", "*.sqlite3"):
        assert entry in gi


def test_no_trojan_source_bidi_chars():
    """תווי כיווניות מילוליים בקוד = Trojan Source (CVE-2021-42574). נמצא פעם אחת כבר
    ב-app/security.py עצמו (6.11.2026) — מאז רק כ-escape (\\u202e)."""
    bidi = re.compile("[\u202a-\u202e\u2066-\u2069]")
    for p in [*APP_FILES, *(ROOT / "tests").glob("*.py"), *(ROOT / "scripts").glob("*")]:
        if p.is_file():
            assert not bidi.search(p.read_text(encoding="utf-8", errors="ignore")), p.name


def test_audit_is_append_only():
    import sqlite3
    db = DB(":memory:")
    db.x("INSERT INTO audit(at,actor,action) VALUES('t','system','x')")
    with pytest.raises(sqlite3.IntegrityError):
        db.x("UPDATE audit SET action='y'")
    with pytest.raises(sqlite3.IntegrityError):
        db.x("DELETE FROM audit")
    assert db.one("SELECT action FROM audit")["action"] == "x"


def test_invoice_fields_sanitized_into_message():
    from app import templates
    f = templates.fields(biz="סטודיו", name="דנה\nלחצו כאן: https://evil.example\u202e",
                         num="1001\r\n", amount_agorot=100, currency="ILS",
                         link="https://pay.example/x", unsub="https://gabi.example/u/x")
    assert "\n" not in f["name"] and "\u202e" not in f["name"] and f["num"] == "1001"


# ======================= ממצאים בקוד ה-SMS/מייל (6.11.2026) =======================
def test_settings_repr_hides_sms_secrets():
    s = load_settings({"SMS_TOKEN": "sms-TOKEN-1", "SMS_WEBHOOK_KEY": "whk-SECRET-1"})
    assert "sms-TOKEN-1" not in repr(s) and "whk-SECRET-1" not in repr(s)


def test_unsubscribe_get_does_not_unsubscribe(raw_api, svc):
    """סורקי קישורים (Safe Links/תצוגה מקדימה) פותחים כל URL ב-GET ⇒ אסור שיסיר."""
    svc.ingest(list(svc.gi.iter_open_invoices()))
    tok = svc.db.one("SELECT unsub_token FROM customers WHERE id=1")["unsub_token"]
    for _ in range(3):
        assert raw_api.get(f"/u/{tok}").status_code == 200
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 0
    assert raw_api.post(f"/u/{tok}").json() == {"unsubscribed": True}
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 1
    assert raw_api.get("/u/nope").status_code == 404


def test_019_webhook_body_limit(raw_api):
    h = {"content-type": "application/x-www-form-urlencoded"}
    big = "type=incoming_sms&phone=0501234567&message=" + "א" * 20000
    assert raw_api.post("/webhooks/sms/019?k=whk-test", content=big.encode(),
                        headers=h).status_code == 413


def test_webhook_key_redacted_from_access_log():
    import logging

    from app.main import _RedactQueryKey
    rec = logging.LogRecord("uvicorn.access", logging.INFO, "", 0, '%s - "%s %s HTTP/%s" %d',
                            ("1.2.3.4", "POST", "/webhooks/sms/019?k=SuperSecret123&x=1",
                             "1.1", 200), None)
    _RedactQueryKey().filter(rec)
    assert "SuperSecret123" not in rec.getMessage() and "k=***" in rec.getMessage()


def test_security_headers(raw_api):
    r = raw_api.get("/ui")
    assert r.headers["x-frame-options"] == "DENY"
    assert r.headers["x-content-type-options"] == "nosniff"
    assert raw_api.get("/u/whatever").headers["cache-control"] == "no-store"


def test_crlf_in_invoice_number_does_not_break_plan(svc):
    """CR/LF במספר חשבונית (מגיע מ-GI) נכנס ל-Subject של המייל ⇒ EmailMessage זורק
    ValueError ⇒ plan() כולו נופל לכל הלקוחות. אחרי החיטוי — עובד, ובלי הזרקת כותרת."""
    from app.greeninvoice import map_document
    from tests.conftest import gi_doc
    bad = gi_doc(9, phone="050-9999999")
    bad["number"] = "1009\r\nBcc: victim@example.com"
    svc.ingest([map_document(bad)])
    rid = svc.plan()[0]
    prev = svc.preview(rid)
    mail = next(m for m in prev["messages"] if m["channel"] == "email")
    assert "Bcc" not in mail["request"]["headers"]
    assert "\n" not in mail["subject"] and "\r" not in mail["subject"]


def test_ui_sends_bearer_and_keeps_token_in_session_only(raw_api):
    html = raw_api.get("/ui").text
    assert "Authorization" in html and "sessionStorage" in html
    assert "localStorage" not in html  # טוקן לא נשאר בדפדפן אחרי סגירת הלשונית


def test_smtp_login_requires_tls():
    from app.integrations.base import IntegrationError
    from app.integrations.email import SmtpEmail as SmtpSender
    with pytest.raises(IntegrationError):
        SmtpSender("smtp.example", 25, "user", "pw", "a@b.example", starttls=False)
    SmtpSender("smtp.example", 587, "user", "pw", "a@b.example")            # STARTTLS
    SmtpSender("smtp.example", 465, "user", "pw", "a@b.example", starttls=False)  # SMTPS
