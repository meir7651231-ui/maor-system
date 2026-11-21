"""גבי בדיקות · מריץ «זרימות» לסטים מוחזקים שאינם שיחה: מייל שחזר (DSN), תלונת ספאם (ARF), תיקון כתובת במקור,
והרשאות עובד (staff) מול בעל העסק — דרך ה-API האמיתי (create_app + כניסה עם סיסמה+TOTP, REQUIRE_USER_LOGIN=1).

`evals/sequences.py` מזין רק טקסט של לקוח ופעולות בעלים בודדות; כאן כל צעד הוא אירוע מערכת או בקשת HTTP בתפקיד.
אין רשת (socket חסום), אין ספק אמיתי (dry-run), אותו שעון כמו הרצפים (ראשון 8.11.2026 10:00).

פורמט שורה: {id, critical, observe?, steps:[{<פעולה>, expect?}]}. `observe: true` = שאלת מדיניות פתוחה — מודפס, לא נספר.
פעולות: cycle (plan+אישור+שליחה, עם advance_days) · advance_days · dsn · arf · email_in · inbound · source_email · http.
ציפיות (אחרי הצעד): status · mails {כתובת: 0 | ">0"} (מיילים מאז הצעד הקודם) · sms (">0"/0, מאז הצעד הקודם) ·
bounced {כתובת: bool} · suppressed {כתובת: bool} · cards {intent: n פתוחים} · role {מייל: תפקיד} · payment_link.

הרצה: python -m evals.flows evals/heldout/<קובץ>.jsonl
"""
from __future__ import annotations

import json
import os
import socket
import sys
from contextlib import contextmanager
from datetime import datetime, timedelta
from pathlib import Path

import httpx

PW = "correct-horse-battery-9"
TOKEN = "flows-owner-token-0123456789abcdefXYZ"  # noqa: S105 — טוקן בדיקה מקומי (במצב כניסה הוא מושבת)
USERS = {"owner": ("owner@biz.example", "בעל העסק"), "staff": ("staff@biz.example", "דנה עובדת"),
         "staff2": ("staff2@biz.example", "רון עובד")}


@contextmanager
def _world():
    from fastapi.testclient import TestClient

    import app.config as cfg
    from app import totp
    from app.config import load_settings
    from app.db import DB
    from app.greeninvoice import GreenInvoiceClient
    from app.main import create_app
    from app.policy import TZ
    from app.service import CollectService
    from app.users import Users
    from tests.conftest import SANDBOX, Clock, FakeGreenInvoice, gi_doc

    old_review, cfg.OPEN_REVIEW_DEFAULT = cfg.OPEN_REVIEW_DEFAULT, "0"
    old_env = os.environ.get("REQUIRE_USER_LOGIN")
    real_cc = socket.create_connection

    def boom(*a, **k):
        raise AssertionError("חיבור רשת אמיתי בהרצת זרימות")
    socket.create_connection = boom
    try:
        fake = FakeGreenInvoice([gi_doc(1), gi_doc(2, phone="052-7654321", name="יוסי לוי")])
        gi = GreenInvoiceClient(SANDBOX, "test-id", "test-secret", transport=httpx.MockTransport(fake.handler))
        s = load_settings({"BUSINESS_NAME": "סטודיו מאיר", "SMS_SENDER_ID": "StudioMeir",
                           "PAYMENT_LINK": "https://www.greeninvoice.co.il/pay/studio",
                           "PUBLIC_BASE_URL": "https://gabi.example", "SMS_WEBHOOK_KEY": "whk-test",
                           "EMAIL_REPLY_TO": "owner@studio.example", "EMAIL_WEBHOOK_KEY": "ewk-test",
                           "REAL_DATA_ALLOWED": "1"})
        svc = CollectService(s, DB(":memory:"), gi=gi, clock=Clock(datetime(2026, 11, 8, 10, 0, tzinfo=TZ)))
        svc.sync()
        u = Users(svc.db, svc.clock)
        regs = {k: u.create(e, n, PW) for k, (e, n) in USERS.items()}   # הראשון = בעלים, השאר עובדים
        os.environ["REQUIRE_USER_LOGIN"] = "1"   # אחרי היצירה (כמו tests/test_mgr328_team_screen: בלי מפתח הצפנה)
        api = TestClient(create_app(svc, owner_token=TOKEN))
        def login(k: str) -> dict:
            """כניסה בזמן הצעד (סשן פג כשהשעון מתקדם — עובד אמיתי נכנס באותו יום)."""
            if k == "token":
                return {"Authorization": f"Bearer {TOKEN}"}
            if k == "anon":
                return {}
            code = totp.code_at(regs[k]["totp_secret"], svc.clock().timestamp())
            r = api.post("/auth/login", json={"email": USERS[k][0], "password": PW, "code": code})
            if r.status_code != 200:   # עובד מושבת ⇒ אין סשן חדש; ממשיכים בלי (צפוי 401)
                return {}
            return {"Authorization": "Bearer " + r.json()["token"]}
        ids = {k: row["id"] for k in USERS for row in u.listing() if row["email"] == USERS[k][0]}
        yield {"svc": svc, "fake": fake, "api": api, "login": login, "sess": {}, "ids": ids, "users": u}
    finally:
        socket.create_connection = real_cc
        cfg.OPEN_REVIEW_DEFAULT = old_review
        if old_env is None:
            os.environ.pop("REQUIRE_USER_LOGIN", None)
        else:
            os.environ["REQUIRE_USER_LOGIN"] = old_env


def _cycle(svc) -> None:
    for rid in svc.plan():
        try:
            svc.approve(rid, confirm_open=True)
        except (ValueError, PermissionError):
            pass
    svc.dispatch()


def _last_mid(svc, addr: str) -> str:
    sent = [m for m in svc.sender.sent if m.get("to") == addr and m.get("provider_message_id")]
    return sent[-1]["provider_message_id"] if sent else "none@nowhere"


def _ref_line(svc, d: dict) -> str:
    """ref=last ⇒ שורת Message-ID של המייל האחרון שיצא לנמען (כמו ב-DSN/ARF אמיתי); ref=none ⇒ בלי."""
    return f"Message-ID: <{_last_mid(svc, d['to'])}>\n" if d.get("ref", "last") == "last" else ""


def _path(w, p: str) -> str:
    svc = w["svc"]
    for k, v in w["ids"].items():
        p = p.replace("{%s_id}" % k, str(v))
    while "{card:" in p:
        a = p.index("{card:")
        b = p.index("}", a)
        row = svc.db.one("SELECT id FROM messages WHERE intent=? AND needs_owner=1 ORDER BY id DESC LIMIT 1",
                         (p[a + 6:b],))
        p = p[:a] + (str(row["id"]) if row else "0") + p[b + 1:]
    while "{cust:" in p:
        a = p.index("{cust:")
        b = p.index("}", a)
        row = svc.db.one("SELECT id FROM customers WHERE lower(email)=?", (p[a + 6:b].lower(),))
        p = p[:a] + (str(row["id"]) if row else "0") + p[b + 1:]
    return p


def _do(w, st: dict):
    svc = w["svc"]
    if st.get("advance_days"):
        svc.clock.now += timedelta(days=st["advance_days"])
    if st.get("cycle"):
        svc.sync()
        _cycle(svc)
        return None
    if "dsn" in st:
        d = st["dsn"]
        body = d.get("raw") or (f"Reporting-MTA: dns; mx.example\n\nFinal-Recipient: rfc822; {d['to']}\n"
                                f"Action: failed\nStatus: {d.get('status', '5.1.1')}\n\n"
                                + _ref_line(svc, d))
        return svc.email_webhook(d.get("sender", "MAILER-DAEMON@mx.example"), body, d.get("id", ""),
                                 subject=d.get("subject", "Undelivered Mail Returned to Sender"))
    if "arf" in st:
        a = st["arf"]
        body = a.get("raw") or (f"Feedback-Type: {a.get('type', 'abuse')}\nUser-Agent: fbl/1.0\nVersion: 1\n"
                                f"Original-Rcpt-To: {a['to']}\n"
                                + _ref_line(svc, a))
        return svc.email_webhook(a.get("sender", "fbl@mailbox-provider.example"), body, a.get("id", ""),
                                 auth_results=a.get("auth", "mx.example; spf=pass; dkim=pass; dmarc=pass"))
    if "email_in" in st:
        e = st["email_in"]
        return svc.email_webhook(e["from"], e["text"], e.get("id", ""), auth_results=e.get("auth", ""),
                                 subject=e.get("subject", ""))
    if "inbound" in st:   # הודעת לקוח (מנוע השיחה) — למשל הבטחה שמעבר ל-14 יום שפותחת «בדוק ואשר»
        m = st["inbound"]
        return svc.inbound(m.get("channel", "sms"), m.get("from", "050-1234567"), m["text"])
    if "source_email" in st:
        s = st["source_email"]
        for doc in w["fake"].docs:
            if doc["id"] == f"doc{s['doc']}":
                doc["client"]["emails"] = [s["email"]] if s["email"] else []
        svc.sync()
        return None
    if "http" in st:
        h = st["http"]
        who = h.get("as", "owner")
        if h.get("fresh") or who not in w["sess"] or w["sess"][who][0] != svc.clock().date():
            w["sess"][who] = (svc.clock().date(), w["login"](who))   # סשן פתוח נשמר באותו יום (שינוי תפקיד חי)
        return w["api"].request(h.get("method", "GET"), _path(w, h["path"]), headers=w["sess"][who][1],
                                json=h.get("json"))
    raise ValueError(f"צעד לא מוכר: {sorted(st)}")


_CHECKED = {"status", "mails", "sms", "bounced", "suppressed", "cards", "role", "payment_link"}


def _count_ok(got: int, want) -> bool:
    return got > 0 if want == ">0" else got == want


def run_flow(flow: dict) -> tuple[list[str], list[str]]:
    """מחזיר (כשלים, תצפיות)."""
    fails, notes = [], []
    with _world() as w:
        svc = w["svc"]
        seen = len(svc.sender.sent)
        for i, st in enumerate(flow["steps"], 1):
            out = _do(w, st)
            new = svc.sender.sent[seen:]
            seen = len(svc.sender.sent)
            tag = f"#{i}"
            e = st.get("expect", {})
            unknown = set(e) - _CHECKED
            if unknown:
                fails.append(f"{tag} ציפייה שהמריץ לא בודק: {sorted(unknown)}")
            if "status" in e and "http" not in st:
                fails.append(f"{tag} status בצעד שאינו http")
            # TestClient מחזיר Response של httpx2 (לא httpx) — isinstance דילג בשקט על כל בדיקות ה-status (מדידה
            # ראשונה של סט #22 פסולה). duck-typing + שער «ציפייה שלא נבדקה» למטה.
            if "http" in st:
                if not hasattr(out, "status_code"):
                    fails.append(f"{tag} http בלי תשובה ({type(out).__name__})")
                    continue
                notes.append(f"{tag} {st['http'].get('as', 'owner')} {st['http'].get('method', 'GET')} "
                             f"{st['http']['path']} ⇒ {out.status_code}")
                if "status" in e and out.status_code not in (e["status"] if isinstance(e["status"], list)
                                                            else [e["status"]]):
                    fails.append(f"{tag} status {out.status_code}≠{e['status']} {out.text[:120]}")
            elif st.get("cycle"):
                to = sorted({m.get("to") for m in new if m.get("channel") == "email"})
                sms = sum(m.get("channel") == "sms" for m in new)
                notes.append(f"{tag} cycle ⇒ מייל: {', '.join(to) or '—'} · sms: {sms}")
            elif "dsn" in st or "arf" in st:
                res = json.dumps({k: v for k, v in (out or {}).items() if k != "ok"}, ensure_ascii=False)[:160]
                notes.append(f"{tag} ⇒ {res} · c1 bounced={svc.email_bounced('c1@example.com')}")
            elif isinstance(out, dict):
                res = json.dumps({k: v for k, v in out.items() if k != "ok"}, ensure_ascii=False)[:160]
                notes.append(f"{tag} ⇒ {res}")
            for addr, want in e.get("mails", {}).items():
                got = sum(m.get("to") == addr for m in new)
                if not _count_ok(got, want):
                    fails.append(f"{tag} mails→{addr} {got}≠{want}")
            if "sms" in e:
                got = sum(m.get("channel") == "sms" for m in new)
                if not _count_ok(got, e["sms"]):
                    fails.append(f"{tag} sms {got}≠{e['sms']}")
            for addr, want in e.get("bounced", {}).items():
                if svc.email_bounced(addr) != want:
                    fails.append(f"{tag} bounced[{addr}] {not want}≠{want}")
            for addr, want in e.get("suppressed", {}).items():
                if bool(svc.suppressed("email", addr)) != want:
                    fails.append(f"{tag} suppressed[{addr}] {not want}≠{want}")
            for intent, want in e.get("cards", {}).items():
                got = svc.db.one("SELECT COUNT(*) n FROM messages WHERE intent=? AND needs_owner=1", (intent,))["n"]
                if got != want:
                    fails.append(f"{tag} cards[{intent}] {got}≠{want}")
            for email, want in e.get("role", {}).items():
                got = {r["email"]: r["role"] for r in w["users"].listing()}.get(email)
                if got != want:
                    fails.append(f"{tag} role[{email}] {got}≠{want}")
            if "payment_link" in e and svc.s.payment_link != e["payment_link"]:
                fails.append(f"{tag} payment_link {svc.s.payment_link}≠{e['payment_link']}")
    return fails, notes


def _run_file(path: Path) -> int:
    flows = [json.loads(x) for x in path.read_text(encoding="utf-8").splitlines() if x.strip()]
    ok = crit = crit_ok = scored = 0
    for f in flows:
        fails, notes = run_flow(f)
        if f.get("observe"):
            print(f"◦ {f['id']} [מדיניות פתוחה]: " + " · ".join(notes))
            continue
        scored += 1
        ok += not fails
        crit += bool(f.get("critical"))
        crit_ok += bool(f.get("critical")) and not fails
        if fails:
            print(f"✗ {f['id']}{' [critical]' if f.get('critical') else ''}: {'; '.join(fails)}")
    print(f"{path.name}: זרימות {ok}/{scored} ({100 * ok / max(scored, 1):.1f}%) · קריטיים {crit_ok}/{crit} · "
          f"תצפיות-מדיניות {len(flows) - scored}")
    return 0 if ok == scored else 1


if __name__ == "__main__":
    sys.exit(max(_run_file(Path(p)) for p in sys.argv[1:]) if sys.argv[1:] else 2)
