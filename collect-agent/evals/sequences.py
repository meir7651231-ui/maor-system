"""הרצת סט רצפים (רב-הודעתי) דרך השירות האמיתי — `svc.inbound`, לא המנוע הבודד.

    python3 -m evals.sequences                       # כל סטי הרגרסיה ב-evals/seq/ (רץ ב-CI)
    python3 -m evals.sequences evals/heldout/external-2026-11-16-qa9-seq.jsonl   # סט מוחזק, ידני

כל רצף = לקוח אחד (דנה כהן, 1,200 ₪ פתוח) בשירות טרי (DB בזיכרון, חשבונית ירוקה מדומה, dry-run).
כל הודעה נכנסת ב-`inbound` ⇒ ההקשר (מצב, הצעה שנשלחה, מונה תורות) נבנה מה-DB כמו בפרודקשן.
ציפיות לכל הודעה: intent · state (מצב השיחה ב-DB אחרי ההודעה) · promise (ISO / null) · stop ·
escalate · not (כוונות שאסור שיופיעו) · draft (סטטוס הטיוטה שנוצרה: pending_approval/needs_owner/…;
null = לא נוצרה). רצף critical חייב לעבור במלואו.

מנהל 256 — רצפים ארוכים עם בעל העסק באמצע:
  {"owner": "approve_plan"}             בעל העסק מאשר את הצעת הפריסה האחרונה (שולחת אותה ללקוח)
  {"owner": "approve_draft"[, "body"]}  מאשר את הטיוטה האחרונה שממתינה (needs_owner ⇒ חובה body)
  {"owner": "reject_draft"}             סוגר את הטיוטה האחרונה בלי מענה
  ציפיות לתור בעלים: ok (הפעולה הצליחה) · state · plan_status.
  "advance_days": N בכל תור ⇒ השעון מתקדם N ימים לפני התור (הבטחה שעברה, השהיה שפגה).
"""
from __future__ import annotations

import json
import sys
from contextlib import contextmanager
from pathlib import Path

import httpx

ADDR = {"sms": "0501234567", "email": "c1@example.com"}


@contextmanager
def _service():
    import socket
    from datetime import datetime

    import app.config as cfg
    from app import inbox as inbox_mod
    from app.config import load_settings
    from app.db import DB
    from app.greeninvoice import GreenInvoiceClient
    from app.policy import TZ
    from app.service import CollectService
    from tests.conftest import SANDBOX, Clock, FakeGreenInvoice, gi_doc
    old_review, cfg.OPEN_REVIEW_DEFAULT = cfg.OPEN_REVIEW_DEFAULT, "0"
    def boom(*a, **k):
        raise AssertionError("חיבור רשת אמיתי בהרצת רצפים")
    old_cc, socket.create_connection = socket.create_connection, boom
    seen: list = []
    real = inbox_mod.respond

    def spy(*a, **k):
        d = real(*a, **k)
        seen.append(d)
        return d
    inbox_mod.respond = spy
    try:
        gi = GreenInvoiceClient(SANDBOX, "test-id", "test-secret",
                                transport=httpx.MockTransport(FakeGreenInvoice([gi_doc(1)]).handler))
        s = load_settings({"BUSINESS_NAME": "סטודיו מאיר", "SMS_SENDER_ID": "StudioMeir",
                           "PAYMENT_LINK": "https://www.greeninvoice.co.il/pay/studio",
                           "PUBLIC_BASE_URL": "https://gabi.example", "SMS_WEBHOOK_KEY": "whk-test",
                           "EMAIL_REPLY_TO": "owner@studio.example", "EMAIL_WEBHOOK_KEY": "ewk-test",
                           "REAL_DATA_ALLOWED": "1"})
        svc = CollectService(s, DB(":memory:"), gi=gi,
                             clock=Clock(datetime(2026, 11, 8, 10, 0, tzinfo=TZ)))
        svc.sync()
        yield svc, seen
    finally:
        inbox_mod.respond = real
        socket.create_connection = old_cc
        cfg.OPEN_REVIEW_DEFAULT = old_review


def _owner_turn(svc, turn: dict) -> tuple[bool, str]:
    """פעולת בעל העסק באמצע רצף. מחזיר (הצליח, הודעת שגיאה)."""
    act = turn["owner"]
    try:
        if act == "approve_plan":
            p = svc.db.one("SELECT id FROM plans WHERE customer_id=1 AND status='proposed' "
                           "ORDER BY id DESC LIMIT 1")
            if not p:
                return False, "אין הסדר מוצע"
            svc.approve_plan(p["id"])
            return True, ""
        dr = svc.db.one("SELECT id FROM drafts WHERE customer_id=1 AND status IN "
                        "('pending_approval','needs_owner') ORDER BY id DESC LIMIT 1")
        if not dr:
            return False, "אין טיוטה ממתינה"
        if act == "approve_draft":
            svc.inbox.approve_draft(dr["id"], body=turn.get("body"))
        elif act == "reject_draft":
            svc.inbox.reject_draft(dr["id"])
        else:
            raise ValueError(f"פעולת בעלים לא מוכרת: {act}")
        return True, ""
    except ValueError as e:   # סירוב עסקי (סכום השתנה, טיוטה הוכרעה…) — לא קריסה
        return False, str(e)


def _state(svc) -> str:
    conv = svc.db.one("SELECT state FROM conversations WHERE customer_id=1")
    return conv["state"] if conv else "idle"


def run_seq(seq: dict) -> list[str]:
    from datetime import timedelta
    fails: list[str] = []
    with _service() as (svc, seen):
        for i, turn in enumerate(seq["turns"], 1):
            seen.clear()
            if turn.get("advance_days"):
                svc.clock.now += timedelta(days=turn["advance_days"])
            e, tag = turn.get("expect", {}), f"#{i}"
            if "owner" in turn:
                ok, err = _owner_turn(svc, turn)
                if "ok" in e and ok != e["ok"]:
                    fails.append(f"{tag} owner {turn['owner']} ok={ok}≠{e['ok']} {err}".rstrip())
                if "state" in e and _state(svc) != e["state"]:
                    fails.append(f"{tag} state {_state(svc)}≠{e['state']}")
                if "plan_status" in e:
                    p = svc.db.one("SELECT status FROM plans WHERE customer_id=1 ORDER BY id DESC LIMIT 1")
                    got = p["status"] if p else None
                    if got != e["plan_status"]:
                        fails.append(f"{tag} plan_status {got}≠{e['plan_status']}")
                continue
            ch = turn.get("channel", seq["channel"])  # מנהל 254: מעבר ערוץ באמצע רצף (SMS⇄מייל, אותו לקוח)
            out = svc.inbound(ch, ADDR[ch], turn["text"])
            d = seen[-1] if seen else None
            if "intent" in e and out["intent"] != e["intent"]:
                fails.append(f"{tag} intent {out['intent']}≠{e['intent']}")
            if "state" in e and _state(svc) != e["state"]:
                fails.append(f"{tag} state {_state(svc)}≠{e['state']}")
            if "draft" in e:
                dr = (svc.db.one("SELECT status FROM drafts WHERE id=?", (out["draft_id"],))
                      if out.get("draft_id") else None)
                got = dr["status"] if dr else None
                if got != e["draft"]:
                    fails.append(f"{tag} draft {got}≠{e['draft']}")
            if "promise" in e:
                got = d.promise_date.isoformat() if d and d.promise_date else None
                if got != e["promise"]:
                    fails.append(f"{tag} promise {got}≠{e['promise']}")
            for k in ("stop", "escalate"):
                key = "escalation" if k == "escalate" else k
                if k in e and out[key] != e[k]:
                    fails.append(f"{tag} {k} {out[key]}≠{e[k]}")
            all_i = [out["intent"], *out.get("secondary", [])]
            for n in e.get("not", []):
                if n in all_i:
                    fails.append(f"{tag} unexpected {n}")
    return fails


HERE = Path(__file__).parent


def main(argv: list[str]) -> int:
    """בלי ארגומנטים ⇒ כל סטי הרגרסיה ב-`evals/seq/` (מנהל 254: שער CI). סט מוחזק רץ רק בהעברה מפורשת."""
    paths = [Path(p) for p in argv] or sorted((HERE / "seq").glob("*.jsonl"))
    if not paths:
        print("אין סטי רצפים ב-evals/seq/")
        return 1
    return max(_run_file(p) for p in paths)


def _run_file(path: Path) -> int:
    seqs = [json.loads(x) for x in path.read_text(encoding="utf-8").splitlines() if x.strip()]
    ok = crit_ok = crit = turns = 0
    for s in seqs:
        f = run_seq(s)
        turns += sum("owner" not in t for t in s["turns"])
        ok += not f
        crit += bool(s.get("critical"))
        crit_ok += bool(s.get("critical")) and not f
        if f:
            print(f"✗ {s['id']}{' [critical]' if s.get('critical') else ''}: {'; '.join(f)}")
    print(f"{path.name}: רצפים {ok}/{len(seqs)} ({100 * ok / len(seqs):.1f}%) · "
          f"קריטיים {crit_ok}/{crit} · הודעות {turns}")
    return 0 if ok == len(seqs) else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
