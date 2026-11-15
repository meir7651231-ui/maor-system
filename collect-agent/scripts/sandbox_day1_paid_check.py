"""יום ראשון של ה-sandbox: «האם פתוח בחשבונית ירוקה = לא שולם?» — **קריאה בלבד**.

היעד של גבייה סוכן (מאיר, 15.11): אף לקוח שכבר שילם לא מקבל תזכורת. מבקר סבב 1 #2: עסקים קטנים
גובים בביט/העברה ולא סוגרים את המסמך, או מפיקים קבלה בלי לקשר אותה. הסקריפט הזה מריץ על הנתונים
האמיתיים את אותו מנגנון שהסנכרון מריץ (`open_debts` ⇒ `net_credits` עם קבלות) ומדווח:

  1. כמה חשבוניות פתוחות, ובכמה מהן יש סימן שכבר שולמו (קבלה מקושרת / קבלה באותו סכום ולקוח)
     ⇒ אלה לקוחות שגבי **עוצרת** ל-review ולא מזכירה להם.
  2. שדות שהזיהוי תלוי בהם, ושלא אומתו מול השרת האמיתי (מסומנים «לאמת» בקוד):
     status במסמך · linkedDocumentIds/linkedDocuments בקבלה · dueDate · amountDueVat (יתרה).
  3. מסקנה: כמה תזכורות *היו* יוצאות ללקוחות ששילמו בלי השערים (אישור רשימת הפתוחות + קבלות).

שום דבר לא נכתב (אין payments/form, אין עדכון/סגירת מסמך, אין webhook). אין מפתחות בקוד.

    python3 -I scripts/sandbox_day1_paid_check.py                 # gi_mock בתוך התהליך (היום)
    GREENINVOICE_API_ID=… GREENINVOICE_API_SECRET=… python3 -I scripts/sandbox_day1_paid_check.py --sandbox
    --json report.json                                             # דוח בלי סודות ובלי פרטי לקוח

קוד יציאה: 0 = הזיהוי עובד והשדות קיימים · 1 = שדה קריטי חסר (הזיהוי לא אמין — לא להשיק) ·
2 = שימוש שגוי (למשל --sandbox בלי מפתחות; לא נשלחה אף בקשה).
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import httpx  # noqa: E402

from app.greeninvoice import (  # noqa: E402
    OPEN_DEBT_TYPES,
    RECEIPT_STATUSES,
    RECEIPT_TYPES,
    STATUS_OPEN,
    GreenInvoiceClient,
)

SANDBOX = "https://sandbox.d.greeninvoice.co.il/api/v1"


def _raw(gi: GreenInvoiceClient, types, statuses) -> list[dict]:
    out, page = [], 1
    while page <= 50:
        body = gi.search_documents(page=page, page_size=50, statuses=statuses, types=types)
        out += list(body.get("items", []))
        if page >= int(body.get("pages") or 1):
            break
        page += 1
    return out


def run(gi: GreenInvoiceClient, target: str) -> dict:
    open_raw = _raw(gi, OPEN_DEBT_TYPES, (STATUS_OPEN,))
    receipts_raw = _raw(gi, RECEIPT_TYPES, RECEIPT_STATUSES)
    net = gi.open_debts()
    held = {}
    for doc, why in net.review:
        if why.startswith("receipt"):
            held[doc.external_id] = why
    fields = {
        "status_on_open_docs": all("status" in d for d in open_raw) if open_raw else None,
        "dueDate_on_open_docs": sum(1 for d in open_raw if d.get("dueDate")),
        "balance_field_amountDueVat": sum(1 for d in open_raw if "amountDueVat" in d),
        "receipts_with_link_field": sum(1 for d in receipts_raw
                                        if "linkedDocumentIds" in d or "linkedDocuments" in d),
    }
    n_open = len(open_raw)
    critical = []
    if open_raw and not fields["status_on_open_docs"]:
        critical.append("אין status במסמכים הפתוחים — אי אפשר לדעת מה נסגר")
    if receipts_raw and fields["receipts_with_link_field"] == 0:
        critical.append("לקבלות אין שדה קישור למסמך — הזיהוי נשען רק על התאמת סכום+לקוח")
    return {
        "target": target,
        "open_invoices": n_open,
        "receipts_seen": len(receipts_raw),
        "suspected_paid": len(held),
        "suspected_paid_pct": round(100 * len(held) / n_open, 1) if n_open else 0.0,
        "suspect_reasons": sorted(set(held.values())),
        "would_have_reminded_paid_without_gates": len(held),
        "fields": fields,
        "critical": critical,
        "verdict": ("לא להשיק: " + "; ".join(critical)) if critical else
                   (f"{len(held)} מתוך {n_open} חשבוניות «פתוחות» כנראה שולמו ⇒ גבי עוצרת אותן "
                    "ל-review. שער «אישור רשימת הפתוחות» נשאר דלוק."),
    }


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--sandbox", action="store_true", help="ה-sandbox האמיתי (מפתחות מהסביבה)")
    ap.add_argument("--json", default="", help="כתיבת דוח JSON לקובץ")
    a = ap.parse_args(argv)
    transport = None
    if a.sandbox:
        api_id = os.environ.get("GREENINVOICE_API_ID", "")
        secret = os.environ.get("GREENINVOICE_API_SECRET", "")
        if not api_id or not secret:
            print("חסרים GREENINVOICE_API_ID / GREENINVOICE_API_SECRET בסביבה — לא נשלחה אף בקשה.",
                  file=sys.stderr)
            return 2
        target = "sandbox"
    else:
        from app.demo_data import DEMO_ID, DEMO_SECRET, demo_docs
        from app.gi_mock import GreenInvoiceMock
        api_id, secret = DEMO_ID, DEMO_SECRET
        mock = GreenInvoiceMock(api_id=api_id, api_secret=secret, docs=demo_docs(),
                                deliver=lambda url, payload: None)
        # תרחיש היום הראשון: לקוח שילם, הופקה קבלה מקושרת, אבל החשבונית לא נסגרה
        mock.route("POST", "/_mock/documents", {},
                   {"type": 400, "status": 1, "amount": mock.docs["demo1"]["amount"],
                    "currency": "ILS", "client": dict(mock.docs["demo1"]["client"]),
                    "linkedDocumentIds": ["demo1"]})
        transport = httpx.MockTransport(mock.handler)
        target = "gi_mock בתוך התהליך"
    gi = GreenInvoiceClient(SANDBOX, api_id, secret, transport=transport)
    rep = run(gi, target)
    for k in ("target", "open_invoices", "receipts_seen", "suspected_paid", "suspected_paid_pct",
              "suspect_reasons", "fields", "verdict"):
        print(f"{k}: {rep[k]}")
    if a.json:
        Path(a.json).write_text(json.dumps(rep, ensure_ascii=False, indent=1), "utf-8")
    return 1 if rep["critical"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
