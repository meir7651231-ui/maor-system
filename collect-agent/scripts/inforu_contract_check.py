"""בדיקת חוזה מול InforU (ספק ה-SMS לגיבוי) — דרך ה-adapter עצמו, מול app/inforu_mock.py.

    python3 -I scripts/inforu_contract_check.py [--json report.json]

אין כאן מצב "אמיתי": InforU הוא גיבוי, והחוזה שלו (כמו של 019) לא מאומת — CONTRACT_VERIFIED_INFORU=False.
ביום שיהיה חשבון: מסמך רשמי ⇒ מעדכנים את המוק ⇒ הבדיקות האלה מראות מה נשבר ב-adapter.
קוד יציאה: 0 = אין FAIL · 1 = יש FAIL. הטוקן לא מודפס.
"""
from __future__ import annotations

import argparse
import json
import sys
from collections.abc import Callable
from dataclasses import asdict, dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import httpx  # noqa: E402

from app.config import SafetyError  # noqa: E402
from app.inforu_mock import InforUMock  # noqa: E402
from app.integrations.base import IntegrationError, SmsMessage, request_preview  # noqa: E402
from app.integrations.notifier import Notification, Notifier  # noqa: E402
from app.integrations.sms import CONTRACT_VERIFIED_INFORU, InforUSms, Sms019  # noqa: E402

HEB = 'שלום דנה, חשבונית 2001 ע"ס 1,200 ₪ & <פתוחה>. לתשלום: https://gabi.example/p/abc'


class CheckFailed(Exception):
    """לא assert: ב-python -O כל assert נמחק."""


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
    target: str = "InforU mock בתוך התהליך"
    contract_verified: bool = CONTRACT_VERIFIED_INFORU
    checks: list[Check] = field(default_factory=list)

    def counts(self) -> dict[str, int]:
        out = dict.fromkeys(("PASS", "GAP", "FAIL", "SKIP"), 0)
        for c in self.checks:
            out[c.status] += 1
        return out


def run() -> Report:
    mock = InforUMock()
    rep = Report()

    def check(cid: str, title: str) -> Callable:
        def deco(fn: Callable[[], str | None]) -> None:
            c = Check(cid, title)
            try:
                c.detail = fn() or ""
            except CheckFailed as e:
                c.status, c.detail = "FAIL", str(e)
            except (httpx.HTTPError, IntegrationError, ValueError, KeyError) as e:
                c.status, c.detail = "FAIL", f"{type(e).__name__}: {e}"
            rep.checks.append(c)
        return deco

    def ad(tok: str = mock.token) -> InforUSms:
        return InforUSms(mock.username, tok, "StudioDemo", transport=httpx.MockTransport(mock.handler))

    req = InforUSms(mock.username, mock.token, "StudioDemo").build_request(
        SmsMessage("+972-52-765-4321", HEB, "reminder:7"))

    @check("json_shape", "JSON: Data.Message · Data.Recipients[].Phone · Data.Settings.Sender")
    def _():
        d = json.loads(req.content)["Data"]
        need(d["Message"] == HEB, "Message השתנה")
        need(d["Recipients"] == [{"Phone": "0527654321"}], str(d["Recipients"]))
        need(d["Settings"]["Sender"] == "StudioDemo", str(d["Settings"]))
        return "עברית + & < > עוברים כמו שהם (JSON)"

    @check("idempotency_field", "מזהה הודעה שלנו ב-Settings.CustomerMessageId (מניעת כפילות אצל הספק)")
    def _():
        need(json.loads(req.content)["Data"]["Settings"].get("CustomerMessageId") == "reminder:7",
             "חסר CustomerMessageId")
        return "reminder:7"

    @check("auth", "Authorization: Basic user:token, מצונזר בתצוגה")
    def _():
        need(req.headers["authorization"].startswith("Basic "), "לא Basic")
        prev = json.dumps(request_preview(req, secrets=(mock.token,)), ensure_ascii=False)
        need(mock.token not in prev and req.headers["authorization"] not in prev, "סוד בתצוגה")
        return "OK"

    @check("send_ok", "StatusId 1 ⇒ MessageId")
    def _():
        r = ad().send(SmsMessage("0501234567", HEB))
        need(r.ok and r.message_id == mock.sent[-1]["MessageId"], r.error or r.message_id)
        return r.message_id

    @check("bad_token", "טוקן שגוי ⇒ StatusId שלילי, לא retryable")
    def _():
        r = ad("wrong").send(SmsMessage("0501234567", "x"))
        need(not r.ok and not r.retryable, f"ok={r.ok} retryable={r.retryable}")
        return r.error

    for code in (503, 429):
        @check(f"http_{code}", f"HTTP {code} ⇒ retryable")
        def _(code=code):
            mock.fail_next = [code]
            r = ad().send(SmsMessage("0501234567", "x"))
            need(not r.ok and r.retryable, f"ok={r.ok} retryable={r.retryable}")
            return r.error

    @check("backup_after_019", "019 ראשי נופל זמנית ⇒ ההודעה יוצאת דרך InforU (שרשרת המוצר)")
    def _():
        s019 = Sms019("u", "t", "StudioDemo", transport=httpx.MockTransport(
            lambda r: httpx.Response(503)))
        rep_ = Notifier([s019, ad()]).send(Notification("k9", phone="0501234567", sms_text=HEB))
        need(rep_.delivered and rep_.final.provider == "inforu"
             and rep_.final.message_id == mock.sent[-1]["MessageId"],
             str(rep_.as_dict()["attempts"]))
        return "019 ⇒ inforu"

    @check("local_rejects", "נייח / שם-שולח פסול ⇒ נדחה לפני בקשה")
    def _():
        n = len(mock.requests)
        for bad in (lambda: ad().send(SmsMessage("03-6234567", "x")),
                    lambda: InforUSms("u", "t", "שם בעברית")):
            try:
                bad()
                need(False, "לא נדחה")
            except IntegrationError:
                pass
        need(len(mock.requests) == n, "נשלחה בקשה")
        return "OK"

    @check("live_guard", "transport אמיתי ⇒ SafetyError (חוזה לא מאומת)")
    def _():
        try:
            InforUSms("u", "t", "StudioDemo", transport=httpx.HTTPTransport())
            need(False, "לא נחסם")
        except SafetyError:
            pass
        return f"CONTRACT_VERIFIED_INFORU={CONTRACT_VERIFIED_INFORU}"

    return rep


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--json", default="")
    a = ap.parse_args(argv)
    rep = run()
    icon = {"PASS": "✅", "GAP": "⚠️ ", "FAIL": "❌", "SKIP": "⏭ "}  # nosec B105 — אייקונים לסטטוס
    print(f"בדיקת חוזה InforU · יעד: {rep.target} · CONTRACT_VERIFIED_INFORU={rep.contract_verified}")
    for c in rep.checks:
        print(f"{icon[c.status]} {c.status:4} {c.id:18} {c.title}")
        if c.detail:
            print(f"         {c.detail}")
    n = rep.counts()
    print(f"\nסיכום: {n['PASS']} עברו · {n['GAP']} פערים · {n['FAIL']} נכשלו · {n['SKIP']} דולגו")
    if a.json:
        Path(a.json).write_text(json.dumps(asdict(rep), ensure_ascii=False, indent=1), "utf-8")
    return 1 if n["FAIL"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
