"""גבי בדיקות · מריץ «זרימות CSV» לסטים מוחזקים: רצף ייבואים של קובץ CSV (+ בניית תזכורות) דרך `svc.import_csv`
האמיתי, ובדיקת התוצאה ב-DB: מה נקלט כחוב, איזה לקוח קיבל איזו חשבונית, מה שם הלקוח, אילו כרטיסים נפתחו לבעל העסק
ואילו תזכורות חיות. שירות במקור CSV (בלי חשבונית ירוקה), dry-run, socket חסום, שעון קבוע (ראשון 8.11.2026 10:00).

פורמט שורה: {id, critical, observe?, steps:[{csv:[שורות], header?, expect?} | {plan:true, expect?}]}.
ציפיות: imported · errors (מספר מדויק) · errors_min · open {מספר: bool} · absent [מספרים] · amount {מספר: אגורות} ·
customers · name_of {מספר: שם} · same_customer [[א,ב]] · diff_customer [[א,ב]] · cards {intent: n פתוחים} ·
cards_min {intent: n} · new_cards / new_cards_min (כרטיסים לבעל העסק שנפתחו בצעד הזה) · reminder_alive [מספרים] ·
not_same_reminder [[א,ב]].
`observe: true` = שאלת מדיניות — מודפס, לא נספר. ציפייה שהמריץ לא בודק ⇒ כישלון (לא עוברת בשקט).

הרצה: python -m evals.csv_flows evals/heldout/<קובץ>.jsonl
"""
from __future__ import annotations

import json
import socket
import sys
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path

HEADER = "מספר חשבונית,שם לקוח,טלפון,מייל,סכום,תאריך לתשלום"
LIVE = ("pending_approval", "approved", "sent_dry_run")
_CHECKED = {"imported", "errors", "errors_min", "open", "absent", "amount", "customers", "name_of", "same_customer",
            "diff_customer", "cards", "cards_min", "reminder_alive", "not_same_reminder", "new_cards", "new_cards_min"}


@contextmanager
def _service():
    import app.config as cfg
    from app.config import load_settings
    from app.db import DB
    from app.policy import TZ
    from app.service import CollectService
    from tests.conftest import Clock

    old_review, cfg.OPEN_REVIEW_DEFAULT = cfg.OPEN_REVIEW_DEFAULT, "0"
    real_cc = socket.create_connection

    def boom(*a, **k):
        raise AssertionError("חיבור רשת אמיתי בהרצת זרימות CSV")
    socket.create_connection = boom
    try:
        s = load_settings({"BUSINESS_NAME": "סטודיו מאיר", "SMS_SENDER_ID": "StudioMeir",
                           "PAYMENT_LINK": "https://www.greeninvoice.co.il/pay/studio",
                           "PUBLIC_BASE_URL": "https://gabi.example", "EMAIL_REPLY_TO": "owner@studio.example",
                           "REAL_DATA_ALLOWED": "1", "SOURCE_SYSTEM": "csv"})
        yield CollectService(s, DB(":memory:"), gi=None, clock=Clock(datetime(2026, 11, 8, 10, 0, tzinfo=TZ)))
    finally:
        socket.create_connection = real_cc
        cfg.OPEN_REVIEW_DEFAULT = old_review


def _inv(svc, number: str):
    return svc.db.one("SELECT * FROM invoices WHERE number=? ORDER BY id DESC LIMIT 1", (number,))


def _live_reminders(svc) -> list[set[str]]:
    """כל תזכורת חיה ⇒ קבוצת מספרי החשבוניות שבה (כולל מאוחדות)."""
    rows = svc.db.q("SELECT r.id, r.invoice_id, r.status, i.number FROM reminders r "
                    "JOIN invoices i ON i.id=r.invoice_id WHERE r.status IN (?, ?, ?)", LIVE)
    if not rows:
        return []
    ex = svc.reminder_extras_many(rows)
    return [set(ex[r["id"]].get("numbers") or [r["number"]]) for r in rows]


def run_flow(flow: dict) -> tuple[list[str], list[str]]:
    fails, notes = [], []
    with _service() as svc:
        for i, st in enumerate(flow["steps"], 1):
            tag, e = f"#{i}", st.get("expect", {})
            unknown = set(e) - _CHECKED
            if unknown:
                fails.append(f"{tag} ציפייה שהמריץ לא בודק: {sorted(unknown)}")
            out: dict = {}
            before = svc.db.one("SELECT COALESCE(MAX(id), 0) m FROM messages")["m"]
            if "csv" in st:
                raw = (st.get("header", HEADER) + "\n" + "\n".join(st["csv"]) + "\n").encode()
                try:
                    out = svc.import_csv(raw)
                except Exception as ex:   # noqa: BLE001 — כשל ייבוא = תוצאה שנמדדת, לא קריסת מריץ
                    out = {"imported": 0, "errors": [{"error": f"EXC {type(ex).__name__}: {ex}"}]}
                errs = [x.get("error") if isinstance(x, dict) else str(x) for x in out.get("errors", [])]
                notes.append(f"{tag} csv ⇒ imported={out.get('imported')} credits={out.get('credits')} errors={errs}")
            elif st.get("plan"):
                created = svc.plan()
                notes.append(f"{tag} plan ⇒ {len(created)} תזכורות")
            else:
                fails.append(f"{tag} צעד לא מוכר: {sorted(st)}")
                continue
            if "imported" in e and out.get("imported") != e["imported"]:
                fails.append(f"{tag} imported {out.get('imported')}≠{e['imported']}")
            n_err = len(out.get("errors", []))
            if "errors" in e and n_err != e["errors"]:
                fails.append(f"{tag} errors {n_err}≠{e['errors']}")
            if "errors_min" in e and n_err < e["errors_min"]:
                fails.append(f"{tag} errors {n_err}<{e['errors_min']}")
            for num, want in e.get("open", {}).items():
                inv = _inv(svc, num)
                got = bool(inv) and inv["status"] == "open"
                if got != want:
                    fails.append(f"{tag} open[{num}] {got}≠{want} (status={inv['status'] if inv else None})")
            for num in e.get("absent", []):
                inv = _inv(svc, num)
                if inv is not None and inv["status"] == "open":
                    fails.append(f"{tag} {num} נקלט כחוב פתוח (אסור)")
            for num, want in e.get("amount", {}).items():
                inv = _inv(svc, num)
                if not inv or inv["amount_agorot"] != want:
                    fails.append(f"{tag} amount[{num}] {inv['amount_agorot'] if inv else None}≠{want}")
            if "customers" in e:
                got = svc.db.one("SELECT COUNT(*) n FROM customers")["n"]
                if got != e["customers"]:
                    fails.append(f"{tag} customers {got}≠{e['customers']}")
            for num, want in e.get("name_of", {}).items():
                inv = _inv(svc, num)
                c = svc.db.one("SELECT name FROM customers WHERE id=?", (inv["customer_id"],)) if inv else None
                if not c or c["name"] != want:
                    fails.append(f"{tag} name_of[{num}] {c['name'] if c else None}≠{want}")
            for key, same in (("same_customer", True), ("diff_customer", False)):
                for a, b in e.get(key, []):
                    ia, ib = _inv(svc, a), _inv(svc, b)
                    if not ia or not ib:
                        fails.append(f"{tag} {key} {a}/{b}: חשבונית חסרה")
                    elif (ia["customer_id"] == ib["customer_id"]) != same:
                        fails.append(f"{tag} {key} {a}/{b}: customer {ia['customer_id']}/{ib['customer_id']}")
            for intent, want in e.get("cards", {}).items():
                got = svc.db.one("SELECT COUNT(*) n FROM messages WHERE intent=? AND needs_owner=1", (intent,))["n"]
                if got != want:
                    fails.append(f"{tag} cards[{intent}] {got}≠{want}")
            for intent, want in e.get("cards_min", {}).items():
                got = svc.db.one("SELECT COUNT(*) n FROM messages WHERE intent=? AND needs_owner=1", (intent,))["n"]
                if got < want:
                    fails.append(f"{tag} cards[{intent}] {got}<{want}")
            new = svc.db.q("SELECT intent FROM messages WHERE id>? AND needs_owner=1", (before,))
            if "new_cards" in e and len(new) != e["new_cards"]:
                fails.append(f"{tag} כרטיסים חדשים {len(new)}≠{e['new_cards']} ({[r['intent'] for r in new]})")
            if "new_cards_min" in e and len(new) < e["new_cards_min"]:
                fails.append(f"{tag} כרטיסים חדשים {len(new)}<{e['new_cards_min']}")
            live = _live_reminders(svc) if ("reminder_alive" in e or "not_same_reminder" in e) else []
            for num in e.get("reminder_alive", []):
                if not any(num in grp for grp in live):
                    fails.append(f"{tag} אין תזכורת חיה ל-{num}")
            for a, b in e.get("not_same_reminder", []):
                if any(a in grp and b in grp for grp in live):
                    fails.append(f"{tag} {a} ו-{b} באותה תזכורת (חוב של אחד נחשף לשני)")
        cards = svc.db.q("SELECT intent, COUNT(*) n FROM messages WHERE needs_owner=1 GROUP BY intent")
        notes.append("כרטיסים: " + (", ".join(f"{r['intent']}={r['n']}" for r in cards) or "—"))
    return fails, notes


def _run_file(path: Path, verbose: bool = False) -> int:
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
            if verbose:
                print("    " + " · ".join(notes))
    print(f"{path.name}: זרימות {ok}/{scored} ({100 * ok / max(scored, 1):.1f}%) · קריטיים {crit_ok}/{crit} · "
          f"תצפיות-מדיניות {len(flows) - scored}")
    return 0 if ok == scored else 1


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "-v"]
    sys.exit(max(_run_file(Path(p), "-v" in sys.argv) for p in args) if args else 2)
