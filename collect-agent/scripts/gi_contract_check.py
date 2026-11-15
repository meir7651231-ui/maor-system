"""בדיקת חוזה מול חשבונית ירוקה (morning) — **קריאה בלבד**. מריצים ביום שמאיר מאשר sandbox.

מה זה: אותו חוזה ש-tests/test_gi_contract.py נועל מול ה-mock (28 בדיקות), אבל בגרסה שאפשר להריץ
מול שרת אמיתי: רק בקשות קריאה (טוקן, users/me, documents/search, documents/{id}, clients/search,
clients/{id}) + שלוש בקשות-שלילה (בלי grant_type / סוד שגוי / בלי טוקן) שלא משנות כלום.
כל מה שכותב (payments/form, יצירת/עדכון/מחיקת לקוח, webhook) מסומן SKIP עם הסבר.

יעדים:
    python3 -I scripts/gi_contract_check.py                      # mock בתוך התהליך (ברירת מחדל)
    python3 -I scripts/gi_contract_check.py --mock-url http://127.0.0.1:8791/api/v1
    GREENINVOICE_API_ID=… GREENINVOICE_API_SECRET=… python3 -I scripts/gi_contract_check.py --sandbox
    --json report.json   ⇒ דוח מלא לקובץ (בלי סודות)

מעקות: אין מפתחות בקוד. --sandbox בלי שני משתני הסביבה ⇒ יציאה בלי שום בקשה. כתובת שאינה
sandbox.d.greeninvoice.co.il או 127.0.0.1/localhost ⇒ סירוב (גם GreenInvoiceClient אוכף). הסוד
והטוקן לא מודפסים ולא נכתבים לדוח. קוד יציאה: 0 = אין FAIL · 1 = יש FAIL · 2 = שגיאת שימוש.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from collections.abc import Callable
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import httpx  # noqa: E402

from app.greeninvoice import (  # noqa: E402
    OPEN_DEBT_TYPES,
    STATUS_OPEN,
    GreenInvoiceClient,
    GreenInvoiceError,
    is_loopback_url,
    map_document,
    token_body,
)

SANDBOX = "https://sandbox.d.greeninvoice.co.il/api/v1"
WRITE_SKIPS = {
    "payments_form": "POST /payments/form — כתיבה (יוצר טופס תשלום). לבדוק ידנית באישור מאיר",
    "clients_crud": "POST/PUT/DELETE /clients — כתיבה. לבדוק ידנית בחשבון בדיקה ריק",
    "webhook": "webhook על תשלום — דורש כתובת ציבורית + תשלום בדיקה. לא בשלב קריאה",
}


class CheckFailed(Exception):
    """בדיקה נכשלה. לא assert: ב-python -O כל assert נמחק והבדיקות היו "עוברות" בשקט."""


def need(cond: object, msg: str) -> None:
    if not cond:
        raise CheckFailed(msg)


@dataclass
class Check:
    id: str
    title: str
    status: str = "PASS"          # PASS | GAP | FAIL | SKIP
    detail: str = ""
    mirrors: str = ""             # הבדיקה המקבילה ב-tests/test_gi_contract.py


@dataclass
class Report:
    target: str
    started: str
    checks: list[Check] = field(default_factory=list)

    def counts(self) -> dict[str, int]:
        out = {"PASS": 0, "GAP": 0, "FAIL": 0, "SKIP": 0}  # nosec B105 — "PASS" = סטטוס בדיקה / טוקן ריק בהתחלה, לא סוד
        for c in self.checks:
            out[c.status] += 1
        return out


class Probe:
    """בקשות HTTP גולמיות (לבדיקות-שלילה) + GreenInvoiceClient (לנתיב האמיתי של המוצר)."""

    def __init__(self, base: str, api_id: str, secret: str,
                 transport: httpx.BaseTransport | None = None) -> None:
        if base != SANDBOX and not is_loopback_url(base):
            raise SystemExit(f"סירוב: {base} אינו sandbox ואינו mock מקומי")
        self.base, self._id, self._secret = base.rstrip("/"), api_id, secret
        self.raw = httpx.Client(base_url=self.base, transport=transport, timeout=20)
        self.gi = GreenInvoiceClient(self.base, api_id, secret, transport=transport)
        self._token = ""  # nosec B105 — "PASS" = סטטוס בדיקה / טוקן ריק בהתחלה, לא סוד

    def token(self) -> str:
        if not self._token:
            r = self.raw.post("/account/token", json=token_body(self._id, self._secret))
            r.raise_for_status()
            self._token = r.json()["token"]
        return self._token

    def get(self, path: str, *, auth: bool = True, **kw) -> httpx.Response:
        h = {"Authorization": f"Bearer {self.token()}"} if auth else {}
        return self.raw.get(path, headers=h, **kw)

    def post(self, path: str, body: Any, *, auth: bool = True) -> httpx.Response:
        h = {"Authorization": f"Bearer {self.token()}"} if auth else {}
        return self.raw.post(path, json=body, headers=h)


def run(p: Probe, target: str) -> Report:
    rep = Report(target=target, started=time.strftime("%Y-%m-%d %H:%M:%S"))
    ctx: dict[str, Any] = {}

    def check(cid: str, title: str, mirrors: str = "") -> Callable:
        def deco(fn: Callable[[], tuple[str, str] | str | None]) -> None:
            c = Check(cid, title, mirrors=mirrors)
            try:
                out = fn()
                if isinstance(out, tuple):
                    c.status, c.detail = out
                elif isinstance(out, str):
                    c.detail = out
            except CheckFailed as e:
                c.status, c.detail = "FAIL", str(e)
            except (httpx.HTTPError, GreenInvoiceError, KeyError, ValueError) as e:
                c.status, c.detail = "FAIL", f"{type(e).__name__}: {e}"
            rep.checks.append(c)
        return deco

    # ── אימות ─────────────────────────────────────────────────────────────
    @check("token_ok", "POST /account/token עם grant_type ⇒ 200 {token, expires}", "test_token_contract")
    def _():
        r = p.raw.post("/account/token", json=token_body(p._id, p._secret))
        need(r.status_code == 200, f"HTTP {r.status_code}")
        b = r.json()
        need("token" in b, f"אין token בתשובה (שדות: {sorted(b)})")
        if not isinstance(b.get("expires"), int):
            return "GAP", f"expires אינו int epoch (קיבלנו {type(b.get('expires')).__name__}) — לעדכן _auth"
        left = b["expires"] - time.time()
        return f"שדות {sorted(b)} · תוקף ≈ {int(left // 60)} דק׳ (הנחה בקוד: ~60)"

    @check("token_no_grant", "בלי grant_type ⇒ 400 (שינוי morning 2026)", "test_token_contract")
    def _():
        r = p.raw.post("/account/token", json={"id": p._id, "secret": p._secret})
        if r.status_code == 200:
            return "GAP", "השרת מקבל גם בלי grant_type — ההנחה בקוד מחמירה, לא שוברת"
        need(r.status_code in (400, 401), f"HTTP {r.status_code}")
        return f"HTTP {r.status_code}"

    @check("token_bad_secret", "סוד שגוי ⇒ 401", "test_bad_credentials_raise")
    def _():
        r = p.raw.post("/account/token", json=token_body(p._id, "definitely-wrong"))
        need(r.status_code in (400, 401, 403), f"HTTP {r.status_code}")
        return f"HTTP {r.status_code}"

    @check("auth_required", "בלי טוקן ⇒ 401", "test_api_prefix_and_auth_required")
    def _():
        r = p.get("/users/me", auth=False)
        need(r.status_code in (401, 403), f"HTTP {r.status_code}")
        return f"HTTP {r.status_code}"

    @check("me", "GET /users/me ⇒ 200", "test_client_clients_and_me")
    def _():
        b = p.gi.me()
        return f"שדות: {sorted(b)[:8]}"

    # ── מסמכים ────────────────────────────────────────────────────────────
    @check("search_shape", "POST /documents/search ⇒ {items, page, pages, total, pageSize}",
           "test_documents_search_shape_filters_and_paging")
    def _():
        b = p.gi.search_documents(page=1, page_size=50)
        missing = {"items", "pages", "total"} - set(b)
        need(not missing, f"חסר: {sorted(missing)} (שדות: {sorted(b)})")
        ctx["total"] = int(b["total"])
        ctx["docs"] = list(b["items"])
        return f"total={b['total']} pages={b['pages']} (סטטוס {STATUS_OPEN}, סוגים {OPEN_DEBT_TYPES})"

    @check("search_paging", "עימוד: pageSize=1 ⇒ pages ≥ total", "test_documents_search_shape_filters_and_paging")
    def _():
        b = p.gi.search_documents(page=1, page_size=1)
        if ctx.get("total", 0) == 0:
            return "SKIP", "אין מסמכים פתוחים בחשבון — ליצור 2–3 חשבוניות בדיקה ב-sandbox"
        need(int(b["pages"]) >= ctx["total"], f"pages={b['pages']} total={ctx['total']}")
        need(len(b["items"]) <= 1, f"pageSize=1 החזיר {len(b['items'])}")
        return f"pages={b['pages']}"

    @check("search_page_cap", "תקרת pageSize (הקוד מניח 100)", "test_documents_search_shape_filters_and_paging")
    def _():
        r = p.post("/documents/search", {"page": 1, "pageSize": 500, "status": [STATUS_OPEN]})
        if r.status_code in (400, 422):
            return f"pageSize=500 ⇒ HTTP {r.status_code}: התקרה נאכפת (הקוד שולח 50 ⇒ בטוח)"
        need(r.status_code == 200, f"HTTP {r.status_code}")
        n = len(r.json().get("items", []))
        return "GAP", f"pageSize=500 התקבל ({n} פריטים) — התקרה במוק (100) מחמירה מהשרת; לעדכן"

    @check("search_invalid", "סוג מסמך לא קיים ⇒ 400", "test_documents_search_rejects_invalid")
    def _():
        r = p.post("/documents/search", {"page": 1, "pageSize": 10, "type": [999]})
        if r.status_code == 200:
            return "GAP", "השרת מקבל type=999 בלי שגיאה (ה-mock מחמיר — לעדכן את ה-mock)"
        return f"HTTP {r.status_code}"

    @check("doc_fields", "שדות מסמך שהמיפוי צריך: id/number/type/status/amount|amountDueVat/currency/"
           "documentDate/client", "test_map_document_on_mock_output")
    def _():
        docs = ctx.get("docs") or []
        if not docs:
            return "SKIP", "אין מסמכים פתוחים"
        required = {"id", "number", "type", "status", "currency", "documentDate", "client"}
        gaps = []
        for d in docs[:20]:
            miss = required - set(d)
            if "amount" not in d and "amountDueVat" not in d:
                miss.add("amount|amountDueVat")
            if miss:
                gaps.append(f"{d.get('id', '?')}: {sorted(miss)}")
        need(not gaps, "; ".join(gaps[:5]))
        notes = []
        if not any("dueDate" in d for d in docs):
            notes.append("אין dueDate באף מסמך ⇒ הקוד נופל ל-documentDate")
        if not any("amountDueVat" in d for d in docs):
            notes.append("אין amountDueVat ⇒ תשלום חלקי לא ייראה (משתמשים ב-amount)")
        if not any("linkedDocumentIds" in d or "linkedDocuments" in d for d in docs):
            notes.append("אין linkedDocumentIds/linkedDocuments ⇒ לבדוק זיכויים/המרות ידנית")
        return ("GAP", " · ".join(notes)) if notes else "כל השדות קיימים"

    @check("doc_contact", "פרטי קשר: client.phone/mobile/emails במסמך, או השלמה מ-/clients/{id}",
           "test_client_enriches_missing_contact_from_clients_endpoint")
    def _():
        docs = ctx.get("docs") or []
        if not docs:
            return "SKIP", "אין מסמכים פתוחים"
        bare = [d for d in docs if not any((d.get("client") or {}).get(k)
                                           for k in ("phone", "mobile", "emails"))]
        if not bare:
            return "כל המסמכים כוללים פרטי קשר"
        cid = (bare[0].get("client") or {}).get("id")
        need(cid, "מסמך בלי client.id ובלי פרטי קשר — אין דרך להגיע ללקוח")
        c = p.gi.get_client(str(cid))
        ok = any(c.get(k) for k in ("phone", "mobile", "emails"))
        return ("GAP" if not ok else "PASS",
                f"{len(bare)}/{len(docs)} מסמכים בלי פרטי קשר; השלמה מ-/clients/{{id}} "
                f"{'עובדת' if ok else 'לא מחזירה טלפון/מייל'}")

    @check("doc_get", "GET /documents/{id} (רענון לפני שליחה, ר-4) ⇒ אותו מסמך, פתוח",
           "test_closed_document_disappears_from_open_sync")
    def _():
        docs = ctx.get("docs") or []
        if not docs:
            return "SKIP", "אין מסמכים פתוחים"
        inv = p.gi.get_document(str(docs[0]["id"]))
        need(inv.external_id == str(docs[0]["id"]), f"id={inv.external_id}")
        need(inv.status == STATUS_OPEN, f"status={inv.status}")
        return f"סכום {inv.amount_agorot / 100:.2f} {inv.currency}"

    @check("doc_get_404", "GET /documents/<לא קיים> ⇒ 404 (מסמך שנמחק ⇒ ביטול תזכורת)")
    def _():
        r = p.get("/documents/gabi-contract-check-nonexistent")
        if r.status_code == 404:
            return "HTTP 404"
        return "GAP", f"HTTP {r.status_code} — הקוד מתרגם רק 404 ל'נמחק'; לעדכן את get_document"

    @check("map_all", "map_document על כל המסמכים הפתוחים ⇒ סכום > 0, מטבע, מספר",
           "test_map_document_on_mock_output")
    def _():
        docs = ctx.get("docs") or []
        if not docs:
            return "SKIP", "אין מסמכים פתוחים"
        bad = []
        for d in docs:
            inv = map_document(d)
            if not inv.number or not inv.currency:
                bad.append(str(d.get("id")))
        need(not bad, f"מיפוי חסר ב: {bad[:5]}")
        zero = sum(1 for d in docs if map_document(d).amount_agorot <= 0)
        return f"{len(docs)} מופו" + (f" · {zero} בסכום 0 (מסוננים בסנכרון)" if zero else "")

    @check("iter_open", "iter_open_invoices (נתיב הסנכרון של המוצר) עובר את כל העמודים",
           "test_client_reads_all_open_invoices_across_pages")
    def _():
        invs = list(p.gi.iter_open_invoices(page_size=2))
        return f"{len(invs)} חשבוניות פתוחות בסכום > 0 (total בחיפוש: {ctx.get('total', '?')})"

    # ── לקוחות (קריאה) ────────────────────────────────────────────────────
    @check("clients_search", "POST /clients/search ⇒ {items, ...}", "test_clients_crud_and_search")
    def _():
        b = p.gi.search_clients(page=1, page_size=5)
        need("items" in b, f"שדות: {sorted(b)}")
        ctx["clients"] = b["items"]
        return f"{len(b['items'])} לקוחות בעמוד"

    @check("client_get", "GET /clients/{id} ⇒ name", "test_client_clients_and_me")
    def _():
        cl = ctx.get("clients") or []
        if not cl:
            return "SKIP", "אין לקוחות בחשבון"
        c = p.gi.get_client(str(cl[0]["id"]))
        need(c.get("name"), f"אין name (שדות: {sorted(c)})")
        return "name קיים"

    # ── כתיבה: לא בשלב הזה ────────────────────────────────────────────────
    for cid, why in WRITE_SKIPS.items():
        rep.checks.append(Check(cid, why.split(" — ")[0], "SKIP", why))
    return rep


def print_report(rep: Report) -> None:
    icon = {"PASS": "✅", "GAP": "⚠️ ", "FAIL": "❌", "SKIP": "⏭ "}  # nosec B105 — "PASS" = סטטוס בדיקה / טוקן ריק בהתחלה, לא סוד
    print(f"בדיקת חוזה חשבונית ירוקה · יעד: {rep.target} · {rep.started}")
    for c in rep.checks:
        print(f"{icon[c.status]} {c.status:4} {c.id:16} {c.title}")
        if c.detail:
            print(f"         {c.detail}")
    n = rep.counts()
    print(f"\nסיכום: {n['PASS']} עברו · {n['GAP']} פערים · {n['FAIL']} נכשלו · {n['SKIP']} דולגו")
    if n["GAP"] or n["FAIL"]:
        print("כל GAP/FAIL ⇒ עדכון app/gi_mock.py ו/או app/greeninvoice.py, ואז pytest tests/test_gi_contract.py")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--sandbox", action="store_true", help="ה-sandbox האמיתי (מפתחות מהסביבה)")
    g.add_argument("--mock-url", default="", help="שרת gi_mock מקומי, למשל http://127.0.0.1:8791/api/v1")
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
        base, target = SANDBOX, "sandbox"
    else:
        from app.demo_data import DEMO_ID, DEMO_SECRET, demo_docs
        api_id, secret = DEMO_ID, DEMO_SECRET
        if a.mock_url:
            base, target = a.mock_url, f"gi_mock HTTP ({a.mock_url})"
        else:
            from app.gi_mock import GreenInvoiceMock
            mock = GreenInvoiceMock(api_id=api_id, api_secret=secret, docs=demo_docs(),
                                    deliver=lambda url, payload: None)
            transport = httpx.MockTransport(mock.handler)
            base, target = SANDBOX, "gi_mock בתוך התהליך"
    rep = run(Probe(base, api_id, secret, transport), target)
    print_report(rep)
    if a.json:
        Path(a.json).write_text(json.dumps(asdict(rep), ensure_ascii=False, indent=1), "utf-8")
    return 1 if rep.counts()["FAIL"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
