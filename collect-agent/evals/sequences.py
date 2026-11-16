"""הרצת סט רצפים (רב-הודעתי) דרך השירות האמיתי — `svc.inbound`, לא המנוע הבודד.

    python3 -m evals.sequences evals/heldout/external-2026-11-16-qa9-seq.jsonl

כל רצף = לקוח אחד (דנה כהן, 1,200 ₪ פתוח) בשירות טרי (DB בזיכרון, חשבונית ירוקה מדומה, dry-run).
כל הודעה נכנסת ב-`inbound` ⇒ ההקשר (מצב, הצעה שנשלחה, מונה תורות) נבנה מה-DB כמו בפרודקשן.
ציפיות לכל הודעה: intent · state (מצב השיחה ב-DB אחרי ההודעה) · promise (ISO / null) · stop ·
escalate · not (כוונות שאסור שיופיעו). רצף critical חייב לעבור במלואו.
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


def run_seq(seq: dict) -> list[str]:
    fails: list[str] = []
    with _service() as (svc, seen):
        for i, turn in enumerate(seq["turns"], 1):
            seen.clear()
            out = svc.inbound(seq["channel"], ADDR[seq["channel"]], turn["text"])
            d = seen[-1] if seen else None
            conv = svc.db.one("SELECT state FROM conversations WHERE customer_id=1")
            e, tag = turn["expect"], f"#{i}"
            if "intent" in e and out["intent"] != e["intent"]:
                fails.append(f"{tag} intent {out['intent']}≠{e['intent']}")
            if "state" in e and (conv["state"] if conv else "idle") != e["state"]:
                fails.append(f"{tag} state {conv['state'] if conv else 'idle'}≠{e['state']}")
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


def main(argv: list[str]) -> int:
    path = Path(argv[0]) if argv else Path("evals/heldout/external-2026-11-16-qa9-seq.jsonl")
    seqs = [json.loads(x) for x in path.read_text(encoding="utf-8").splitlines() if x.strip()]
    ok = crit_ok = crit = turns = 0
    for s in seqs:
        f = run_seq(s)
        turns += len(s["turns"])
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
