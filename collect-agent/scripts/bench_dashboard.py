"""מדידת `/dashboard` על קובץ DB אמיתי (וגם SQLCipher), לפני ואחרי הפעלה 175.

הפעלה 175 מדדה רק DB בזיכרון. כאן: קובץ על דיסק (WAL כמו בשרת), עם/בלי DB_ENCRYPTION=sqlcipher.
הנתונים מדומים לגמרי (FakeGreenInvoice מהבדיקות, בלי רשת): N חשבוניות על N*2/5 לקוחות, סנכרון ותכנון
אמיתיים דרך השירות ⇒ תזכורות מאוחדות כמו בשטח.

«לפני» = השאילתות-לכל-חשבונית של המימוש הקודם (`_reference` מהבדיקה, אותו קוד בדיוק) על כל השורות.
«אחרי» = `svc.dashboard()` הנוכחי. כל מדידה: חציון של --repeat ריצות, אחרי ריצת חימום.

    python scripts/bench_dashboard.py                    # 5,000 חשבוניות, קובץ גלוי
    python scripts/bench_dashboard.py --encrypted        # אותו דבר עם SQLCipher (דורש sqlcipher3)
    python scripts/bench_dashboard.py --invoices 200 --json
    python scripts/bench_dashboard.py --sent             # אחרי אישור ושליחה (dry-run) של כל התזכורות
"""
from __future__ import annotations

import argparse
import json
import os
import statistics
import sys
import tempfile
import time
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import httpx  # noqa: E402

from app.config import load_settings  # noqa: E402
from app.db import DB  # noqa: E402
from app.greeninvoice import GreenInvoiceClient  # noqa: E402
from app.policy import TZ  # noqa: E402
from app.service import CollectService  # noqa: E402
from tests.conftest import SANDBOX, Clock, FakeGreenInvoice, gi_doc  # noqa: E402
from tests.test_dashboard_batched import _reference  # noqa: E402

SETTINGS = {"BUSINESS_NAME": "עסק לדוגמה", "SMS_SENDER_ID": "Demo",
            "PAYMENT_LINK": "https://www.greeninvoice.co.il/pay/demo",
            "PUBLIC_BASE_URL": "https://gabi.example", "REAL_DATA_ALLOWED": "1"}


def build(path: str, n: int, env: dict[str, str], sent: bool = False) -> CollectService:
    customers = max(1, n * 2 // 5)
    docs = [gi_doc(k, client_id=f"cl{k % customers}", name=f"לקוח {k % customers}",
                   phone=f"050-{1000000 + k % customers}", amount=f"{100 + k % 900}.00",
                   due=f"2026-{9 + k % 2:02d}-{1 + k % 28:02d}") for k in range(n)]
    fake = FakeGreenInvoice(docs, page_size=500)
    gi = GreenInvoiceClient(SANDBOX, "test-id", "test-secret", transport=httpx.MockTransport(fake.handler))
    svc = CollectService(load_settings({**SETTINGS, **env}), DB(path, env=env), gi=gi,
                         clock=Clock(datetime(2026, 11, 8, 10, 0, tzinfo=TZ)))
    svc.sync()
    svc.plan()
    if sent:
        send_all(svc)
    return svc


def send_all(svc: CollectService) -> int:
    """הפעלה 177: מאשרים את כל התזכורות הממתינות ומריצים dispatch (DryRunSender, בלי רשת) ⇒ שורות עם
    `last_sent` — הנתיב של `_sent_channels`, שב-176 לא נמדד."""
    for r in svc.db.q("SELECT id FROM reminders WHERE status='pending_approval'"):
        svc.approve(r["id"], confirm_open=True, confirm_amount=True)
    return len(svc.dispatch())


def median_ms(fn, repeat: int) -> float:
    fn()                                   # חימום (מטמון דפים)
    times = []
    for _ in range(repeat):
        t = time.perf_counter()
        fn()
        times.append((time.perf_counter() - t) * 1000)
    return round(statistics.median(times), 1)


def count_queries(svc: CollectService, fn) -> int:
    real, n = svc.db.q, [0]

    def spy(sql, args=()):
        n[0] += 1
        return real(sql, args)
    svc.db.q = spy
    try:
        fn()
    finally:
        svc.db.q = real
    return n[0]


def run(n: int, encrypted: bool, repeat: int, sent: bool = False) -> dict:
    env = dict(os.environ)
    env["DB_ENCRYPTION"] = "sqlcipher" if encrypted else "off"
    if encrypted and not env.get("COLLECT_MASTER_KEYS"):
        from app import secretbox
        env["COLLECT_MASTER_KEYS"] = f"k1:{secretbox.generate_key()}"   # חד-פעמי, לא נשמר
    with tempfile.TemporaryDirectory() as d:
        path = str(Path(d) / "bench.sqlite3")
        t0 = time.perf_counter()
        svc = build(path, n, env, sent)
        seed = time.perf_counter() - t0
        rows = svc.dashboard()["invoices"]

        def before():
            for x in rows:
                _reference(svc, x["invoice_id"], x["customer_id"])
        out = {
            "invoices": len(rows),
            "customers": svc.db.one("SELECT COUNT(*) n FROM customers")["n"],
            "reminders": svc.db.one("SELECT COUNT(*) n FROM reminders")["n"],
            "sent_rows": sum(1 for x in rows if x["last_sent"]),
            "encrypted": bool(svc.db.encrypted),
            "file_mb": round(os.path.getsize(path) / 1e6, 2),
            "seed_s": round(seed, 1),
            "after_ms": median_ms(svc.dashboard, repeat),
            "after_list_ms": median_ms(lambda: svc.dashboard(view="list"), repeat),
            "before_per_invoice_ms": median_ms(before, max(1, repeat // 2)),
            "after_queries": count_queries(svc, svc.dashboard),
        }
        svc.db.conn.close()
        return out


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--invoices", type=int, default=5000)
    p.add_argument("--encrypted", action="store_true", help="DB_ENCRYPTION=sqlcipher (דורש sqlcipher3)")
    p.add_argument("--repeat", type=int, default=5)
    p.add_argument("--sent", action="store_true", help="לאשר ולשלוח (dry-run) את כל התזכורות לפני המדידה")
    p.add_argument("--json", action="store_true")
    a = p.parse_args(argv)
    r = run(a.invoices, a.encrypted, a.repeat, a.sent)
    if a.json:
        print(json.dumps(r, ensure_ascii=False))
    else:
        kind = "SQLCipher" if r["encrypted"] else "קובץ גלוי"
        print(f"{kind} · {r['invoices']} חשבוניות · {r['customers']} לקוחות · {r['reminders']} תזכורות · "
              f"{r['sent_rows']} שורות שיצאו · "
              f"{r['file_mb']}MB")
        print(f"  לפני (שאילתות לכל חשבונית): {r['before_per_invoice_ms']} ms")
        print(f"  אחרי /dashboard: {r['after_ms']} ms · {r['after_queries']} שאילתות")
        print(f"  אחרי /dashboard?view=list: {r['after_list_ms']} ms")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
