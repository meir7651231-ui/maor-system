"""בדיקת חוזה מול 019 SMS — מה ה-adapter שלנו שולח ומה הוא מבין מהתשובה. **חוזה לא מאומת.**

יעדים:
    python3 -I scripts/sms019_contract_check.py                              # mock בתוך התהליך
    python3 -I scripts/sms019_contract_check.py --mock-url http://127.0.0.1:8095
    SMS019_USERNAME=… SMS019_TOKEN=… SMS019_SENDER=… SMS019_TEST_PHONE=05… \\
        python3 -I scripts/sms019_contract_check.py --test-endpoint          # 019 האמיתי, /api/test בלבד

--test-endpoint (ביום שיש חשבון בדיקה, באישור מאיר): בקשה אחת ל-https://019sms.co.il/api/test עם
בקשה שה-adapter בנה (endpoint הבדיקה של 019 לא שולח SMS — לפי התיעוד הציבורי, לאמת), ועוד בקשה
אחת עם טוקן שגוי. שום בקשה ל-/api עצמו. בלי ארבעת המשתנים ⇒ יציאה 2 בלי שום בקשה.
אחרי הרצה נקייה: מסמך רשמי + הדוח ⇒ החלטה על CONTRACT_VERIFIED_019 (שינוי קוד מכוון, לא כאן).
קוד יציאה: 0 = אין FAIL · 1 = יש FAIL · 2 = שגיאת שימוש. הטוקן לא מודפס.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import xml.etree.ElementTree as ET  # noqa: S405  # nosec B405 — מפענח רק בקשות שאנחנו בנינו
from collections.abc import Callable
from dataclasses import asdict, dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import httpx  # noqa: E402

from app.config import SafetyError  # noqa: E402
from app.greeninvoice import is_loopback_url  # noqa: E402
from app.integrations.base import IntegrationError, SmsMessage, request_preview  # noqa: E402
from app.integrations.notifier import Notification, Notifier  # noqa: E402
from app.integrations.sms import (  # noqa: E402
    CONTRACT_VERIFIED_019,
    InforUSms,
    Sms019,
    parse_019_dlr,
)
from app.sms019_mock import Sms019Mock  # noqa: E402

REAL_TEST_URL = "https://019sms.co.il/api/test"
HEB = 'שלום דנה, חשבונית 2001 ע"ס 1,200 ₪ & <פתוחה>. לתשלום: https://gabi.example/p/abc'


class CheckFailed(Exception):
    """לא assert: ב-python -O כל assert נמחק והבדיקות היו "עוברות" בשקט."""


def need(cond: object, msg: str) -> None:
    if not cond:
        raise CheckFailed(msg)


@dataclass
class Check:
    id: str
    title: str
    status: str = "PASS"
    detail: str = ""


@dataclass
class Report:
    target: str
    contract_verified: bool = CONTRACT_VERIFIED_019
    checks: list[Check] = field(default_factory=list)

    def counts(self) -> dict[str, int]:
        out = dict.fromkeys(("PASS", "GAP", "FAIL", "SKIP"), 0)
        for c in self.checks:
            out[c.status] += 1
        return out


def _forward_to_loopback(base: str) -> httpx.MockTransport:
    """MockTransport שמעביר כל בקשה של ה-adapter לשרת mock מקומי (127.0.0.1 בלבד)."""
    if not is_loopback_url(base):
        raise SystemExit(f"סירוב: {base} אינו 127.0.0.1/localhost")
    client = httpx.Client(timeout=10)

    def h(req: httpx.Request) -> httpx.Response:
        url = base.rstrip("/") + req.url.path
        r = client.post(url, content=req.content, headers=dict(req.headers))
        return httpx.Response(r.status_code, content=r.content, headers=r.headers)
    return httpx.MockTransport(h)


def run_mock(make_transport: Callable[[], httpx.MockTransport], mock: Sms019Mock | None,
             user: str, token: str, target: str) -> Report:
    rep = Report(target)

    def check(cid: str, title: str) -> Callable:
        def deco(fn: Callable[[], tuple[str, str] | str | None]) -> None:
            c = Check(cid, title)
            try:
                out = fn()
                if isinstance(out, tuple):
                    c.status, c.detail = out
                elif isinstance(out, str):
                    c.detail = out
            except CheckFailed as e:
                c.status, c.detail = "FAIL", str(e)
            except (httpx.HTTPError, IntegrationError, ValueError, ET.ParseError) as e:
                c.status, c.detail = "FAIL", f"{type(e).__name__}: {e}"
            rep.checks.append(c)
        return deco

    def adapter(tok: str = token, transport: httpx.MockTransport | None = None) -> Sms019:
        return Sms019(user, tok, "StudioDemo", transport=transport or make_transport())

    req = Sms019(user, token, "StudioDemo").build_request(SmsMessage("+972-50-123-4567", HEB))

    # ── הבקשה שה-adapter בונה ─────────────────────────────────────────────
    @check("xml_shape", "XML: <sms><user><username/></user><source/><destinations><phone/>…<message/>")
    def _():
        root = ET.fromstring(req.content.decode("utf-8"))  # noqa: S314  # nosec B314 — בקשה שלנו
        need(root.tag == "sms", f"root={root.tag}")
        for path in ("user/username", "source", "destinations/phone", "message"):
            need(root.find(path) is not None, f"חסר {path}")
        return "כל השדות קיימים"

    @check("xml_escape", "עברית + & < > עוברים הלוך-חזור בלי שינוי")
    def _():
        root = ET.fromstring(req.content.decode("utf-8"))  # noqa: S314  # nosec B314
        need(root.findtext("message") == HEB, "ההודעה השתנתה בדרך")
        return f"{len(HEB)} תווים"

    @check("phone_local", "נמען בפורמט מקומי 05XXXXXXXX")
    def _():
        root = ET.fromstring(req.content.decode("utf-8"))  # noqa: S314  # nosec B314
        need(root.findtext("destinations/phone") == "0501234567", root.findtext("destinations/phone"))
        return "0501234567"

    @check("headers", "Authorization: Bearer · Content-Type: application/xml; charset=utf-8")
    def _():
        need(req.headers["authorization"] == f"Bearer {token}", "Authorization")
        need(req.headers["content-type"].startswith("application/xml"), req.headers["content-type"])
        need(token not in json.dumps(request_preview(req, secrets=(token,)), ensure_ascii=False),
             "הטוקן מופיע בתצוגה")
        return "וטוקן מצונזר בתצוגה"

    @check("test_endpoint", "ברירת המחדל = /api/test (לא שולח)")
    def _():
        need(str(req.url) == REAL_TEST_URL, str(req.url))
        return str(req.url)

    # ── מול השרת ──────────────────────────────────────────────────────────
    @check("test_ok", "/api/test ⇒ status 0, בלי שליחה")
    def _():
        before = len(mock.sent) if mock else 0
        r = adapter().send(SmsMessage("0501234567", HEB))
        need(r.ok, r.error)
        if mock:
            need(len(mock.sent) == before, "endpoint הבדיקה שלח בפועל")
        return "status 0"

    @check("send_ok", "/api ⇒ status 0 + shipment_id")
    def _():
        a = Sms019(user, token, "StudioDemo", test_endpoint=False, transport=make_transport())
        r = a.send(SmsMessage("0501234567", HEB))
        need(r.ok and r.message_id, r.error or "אין shipment_id")
        rep.__dict__["_sid"] = r.message_id
        return f"shipment_id={r.message_id}"

    @check("two_segments", "הודעה בת 2 חלקי SMS (134 תווים בעברית) מתקבלת")
    def _():
        r = adapter().send(SmsMessage("0501234567", "א" * 134))
        need(r.ok, r.error)
        return "OK"

    @check("bad_token", "טוקן שגוי ⇒ status≠0, לא חוזרים (לא retryable)")
    def _():
        r = adapter(tok="wrong-token").send(SmsMessage("0501234567", "x"))
        need(not r.ok and not r.retryable, f"ok={r.ok} retryable={r.retryable}")
        return r.error

    for code in (503, 429):
        @check(f"http_{code}", f"HTTP {code} ⇒ retryable (עוברים ל-InforU)")
        def _(code=code):
            if mock is None:
                return "SKIP", "רק מול mock"
            mock.fail_next = [code]
            r = adapter().send(SmsMessage("0501234567", "x"))
            need(not r.ok and r.retryable, f"ok={r.ok} retryable={r.retryable}")
            return r.error

    @check("failover", "019 נופל זמנית ⇒ Notifier שולח דרך InforU")
    def _():
        if mock is None:
            return "SKIP", "רק מול mock"
        mock.fail_next = [503]
        inforu = InforUSms("u", "t", "StudioDemo", transport=httpx.MockTransport(
            lambda r: httpx.Response(200, json={"StatusId": 1, "Data": {"MessageId": "i-1"}})))
        rep_ = Notifier([adapter(), inforu]).send(Notification("k1", phone="0501234567",
                                                               sms_text="x"))
        need(rep_.delivered and rep_.final.provider == "inforu",
             str(rep_.as_dict()["attempts"]))
        return "019 ⇒ inforu"

    @check("no_failover_permanent", "שגיאה קבועה (טוקן שגוי) ⇒ לא עוברים ל-InforU")
    def _():
        if mock is None:
            return "SKIP", "רק מול mock"
        calls: list[int] = []
        inforu = InforUSms("u", "t", "StudioDemo", transport=httpx.MockTransport(
            lambda r: calls.append(1) or httpx.Response(500)))
        Notifier([adapter(tok="wrong-token"), inforu]).send(
            Notification("k2", phone="0501234567", sms_text="x"))
        need(not calls, "InforU נקרא אחרי שגיאה קבועה")
        return "InforU לא נקרא"

    @check("local_rejects", "נייח / שם-שולח פסול ⇒ נדחה לפני שליחה (אפס בקשות)")
    def _():
        n = len(mock.requests) if mock else 0
        for bad in (lambda: adapter().send(SmsMessage("02-6234567", "x")),
                    lambda: Sms019(user, token, "שם בעברית", transport=make_transport())):
            try:
                bad()
                need(False, "לא נדחה")
            except IntegrationError:
                pass
        if mock:
            need(len(mock.requests) == n, "נשלחה בקשה למרות דחייה מקומית")
        return "נדחו מקומית"

    @check("dlr", "DLR של המוק ⇒ parse_019_dlr מבין delivered / failed")
    def _():
        sid = rep.__dict__.get("_sid") or "019-x"
        from urllib.parse import parse_qsl
        for raw, want in ((Sms019Mock.dlr(sid), "delivered"),
                          (Sms019Mock.dlr(sid, "UNDELIV"), "failed")):
            pid, st = parse_019_dlr(dict(parse_qsl(raw.decode())))
            need((pid, st) == (sid, want), f"{pid},{st}")
        return "OK"

    @check("live_guard", "transport אמיתי ⇒ SafetyError (חוזה לא מאומת)")
    def _():
        try:
            Sms019(user, token, "StudioDemo", transport=httpx.HTTPTransport())
            need(False, "לא נחסם")
        except SafetyError:
            pass
        return f"CONTRACT_VERIFIED_019={CONTRACT_VERIFIED_019}"

    rep.__dict__.pop("_sid", None)
    return rep


def run_real_test_endpoint(user: str, token: str, sender: str, phone: str) -> Report:
    """019 האמיתי, /api/test בלבד: בקשה תקינה אחת + אחת עם טוקן שגוי. לא דרך adapter.send."""
    rep = Report("019 האמיתי — /api/test")
    a = Sms019(user, token, sender)              # dry-run: רק build_request
    req = a.build_request(SmsMessage(phone, "בדיקת חוזה גבי — endpoint בדיקה, לא נשלח"))
    if str(req.url) != REAL_TEST_URL:
        raise SystemExit(f"סירוב: {req.url} אינו {REAL_TEST_URL}")
    with httpx.Client(timeout=15) as c:
        for cid, title, tok, want_ok in (("real_test_ok", "בקשה תקינה ⇒ status 0", token, True),
                                         ("real_bad_token", "טוקן שגוי ⇒ status≠0", "wrong", False)):
            ch = Check(cid, title)
            try:
                h = dict(req.headers)
                h["authorization"] = f"Bearer {tok}"
                r = c.post(REAL_TEST_URL, content=req.content, headers=h)
                try:
                    sid = a.parse(r)
                    ok, info = True, f"HTTP {r.status_code} shipment_id={sid or '—'}"
                except Exception as e:  # noqa: BLE001 — כל צורת תשובה מתועדת בדוח
                    ok, info = False, f"HTTP {r.status_code} {type(e).__name__}: {e}"
                ch.detail = info + f" · גוף: {r.text[:200]}"
                if ok != want_ok:
                    ch.status = "FAIL"
            except httpx.HTTPError as e:
                ch.status, ch.detail = "FAIL", f"{type(e).__name__}: {e}"
            rep.checks.append(ch)
    return rep


def print_report(rep: Report) -> None:
    icon = {"PASS": "✅", "GAP": "⚠️ ", "FAIL": "❌", "SKIP": "⏭ "}  # nosec B105 — מילון אייקונים לסטטוס, לא סיסמה
    print(f"בדיקת חוזה 019 · יעד: {rep.target} · CONTRACT_VERIFIED_019={rep.contract_verified}")
    for c in rep.checks:
        print(f"{icon[c.status]} {c.status:4} {c.id:22} {c.title}")
        if c.detail:
            print(f"         {c.detail}")
    n = rep.counts()
    print(f"\nסיכום: {n['PASS']} עברו · {n['GAP']} פערים · {n['FAIL']} נכשלו · {n['SKIP']} דולגו")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--mock-url", default="", help="שרת mock מקומי, למשל http://127.0.0.1:8095")
    g.add_argument("--test-endpoint", action="store_true", help="019 האמיתי, /api/test בלבד")
    ap.add_argument("--json", default="")
    a = ap.parse_args(argv)
    if a.test_endpoint:
        env = {k: os.environ.get(k, "") for k in ("SMS019_USERNAME", "SMS019_TOKEN",
                                                   "SMS019_SENDER", "SMS019_TEST_PHONE")}
        if not all(env.values()):
            print("חסרים SMS019_USERNAME / SMS019_TOKEN / SMS019_SENDER / SMS019_TEST_PHONE — "
                  "לא נשלחה אף בקשה.", file=sys.stderr)
            return 2
        rep = run_real_test_endpoint(*env.values())
    elif a.mock_url:
        m = Sms019Mock()
        rep = run_mock(lambda: _forward_to_loopback(a.mock_url), None, m.username, m.token,
                       f"019 mock HTTP ({a.mock_url})")
    else:
        mock = Sms019Mock()
        rep = run_mock(lambda: httpx.MockTransport(mock.handler), mock, mock.username, mock.token,
                       "019 mock בתוך התהליך")
    print_report(rep)
    if a.json:
        Path(a.json).write_text(json.dumps(asdict(rep), ensure_ascii=False, indent=1), "utf-8")
    return 1 if rep.counts()["FAIL"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
