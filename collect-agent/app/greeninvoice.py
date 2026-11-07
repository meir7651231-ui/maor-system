"""לקוח Green Invoice (morning) — קריאה בלבד.

שלב 1 משתמש רק ב:
  POST /account/token     {id, secret, grant_type} -> {token, expires}
                           (grant_type="client_credentials" נדרש מ-2026 לפי הודעת morning
                            "עדכונים חשובים בתשתית ממשק ה-API"; לאמת ב-sandbox)
  POST /documents/search  פילטר סטטוס/סוג + עימוד

שמות שדות לפי התיעוד הציבורי; יש לאמת מול sandbox אמיתי לפני שימוש
(ראו docs/MVP-SPEC.md §6). המיפוי סובלני לשדות חסרים.
"""
from __future__ import annotations

import time
from collections.abc import Iterator
from dataclasses import dataclass, field, replace
from datetime import date
from typing import Any

import httpx

# סוגי מסמכים שמייצגים חוב פתוח (לאמת): 300 חשבון עסקה, 305 חשבונית מס
OPEN_DEBT_TYPES = (300, 305)
STATUS_OPEN = 0
# ממצא מבקר 2.16: זיכוי (330) מקטין חוב, ו-300 שהומר ל-305/320 הוא אותו חוב פעמיים.
# הקישור בין מסמכים לפי linkedDocumentIds / linkedDocuments (לאמת שם-שדה ב-sandbox).
TYPE_PROFORMA, TYPE_TAX_INVOICE, TYPE_CREDIT = 300, 305, 330
CREDIT_TYPES = (TYPE_CREDIT,)
CREDIT_STATUSES = (0, 1, 2)          # לא 3/4: זיכוי שבוטל לא מקטין כלום
SUCCESSOR_TYPES = (305, 320)         # מה ש-300 יכול להפוך אליו (חשבונית מס · חשבונית מס/קבלה)
SUCCESSOR_CLOSED_STATUSES = (1, 2)   # ה-305 כבר שולם/נסגר, וה-300 נשאר «פתוח» אצל morning


def token_body(api_id: str, api_secret: str) -> dict[str, str]:
    """גוף בקשת הטוקן. מ-2026 morning דורשת גם grant_type (ראו team/market.md §1.4)."""
    return {"id": api_id, "secret": api_secret, "grant_type": "client_credentials"}


class GreenInvoiceError(RuntimeError):
    pass


def is_loopback_url(url: str) -> bool:
    from urllib.parse import urlparse

    u = urlparse(url)
    return u.scheme == "http" and u.hostname in ("127.0.0.1", "localhost")


@dataclass(frozen=True)
class Invoice:
    external_id: str
    number: str
    doc_type: int
    amount_agorot: int
    currency: str
    issued: date | None
    due: date | None
    client_external_id: str
    client_name: str
    client_phone: str
    client_email: str
    payment_url: str = ""   # אם המסמך כבר מחזיר קישור תשלום (לאמת שם-שדה ב-sandbox)
    status: int = 0         # 0 פתוח · 1 סגור · 2 נסגר ידנית · 3 מבטל · 4 מבוטל
    due_estimated: bool = False   # אין dueDate במסמך ⇒ תאריך המסמך + DEFAULT_TERMS_DAYS
    linked_ids: tuple[str, ...] = ()   # מסמכים מקושרים (זיכוי ⇒ החשבונית; 305 ⇒ ה-300 שממנו הומר)
    gross_agorot: int = 0         # סכום המסמך המלא, כשיש גם amountDueVat (0 = לא ידוע)
    credit_agorot: int = 0        # זיכוי שקוזז מהיתרה (amount_agorot כבר נטו)


def _parse_date(v: Any) -> date | None:
    if not v:
        return None
    try:
        return date.fromisoformat(str(v)[:10])
    except ValueError:
        return None


def _to_agorot(v: Any) -> int:
    # עיגול חצי-למעלה על מחרוזת עשרונית — בלי שגיאות float
    from decimal import ROUND_HALF_UP, Decimal

    return int((Decimal(str(v or 0)) * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


DEFAULT_TERMS_DAYS = 30   # ממצא מבקר 2.9: בלי dueDate, תאריך ההנפקה ≠ מועד תשלום (שוטף+30 שמרני)


def _linked_ids(doc: dict[str, Any]) -> tuple[str, ...]:
    """סובלני לשתי צורות (לאמת): linkedDocumentIds=[id] · linkedDocuments=[{id}|id]."""
    raw = list(doc.get("linkedDocumentIds") or []) + list(doc.get("linkedDocuments") or [])
    out = [str(x.get("id", "")) if isinstance(x, dict) else str(x) for x in raw]
    return tuple(dict.fromkeys(x for x in out if x))


def map_document(doc: dict[str, Any]) -> Invoice:
    from datetime import timedelta

    client = doc.get("client") or {}
    emails = client.get("emails") or []
    due = _parse_date(doc.get("dueDate"))
    issued = _parse_date(doc.get("documentDate"))
    due_estimated = due is None and issued is not None
    if due is None and issued is not None:
        due = issued + timedelta(days=DEFAULT_TERMS_DAYS)
    return Invoice(
        external_id=str(doc.get("id", "")),
        number=str(doc.get("number", "")),
        doc_type=int(doc.get("type", 0) or 0),
        amount_agorot=_to_agorot(doc.get("amountDueVat", doc.get("amount", 0))),
        currency=str(doc.get("currency") or "ILS"),
        issued=_parse_date(doc.get("documentDate")),
        due=due,
        client_external_id=str(client.get("id", "")),
        client_name=str(client.get("name", "")),
        client_phone=str(client.get("phone") or client.get("mobile") or ""),
        client_email=str(emails[0]) if emails else "",
        payment_url=str(doc.get("paymentUrl") or doc.get("paymentLink") or ""),
        status=int(doc.get("status", 0) or 0),
        due_estimated=due_estimated,
        linked_ids=_linked_ids(doc),
        gross_agorot=(_to_agorot(doc.get("amount")) if "amountDueVat" in doc and "amount" in doc
                      else 0),
    )


@dataclass(frozen=True)
class Netting:
    """תוצאת קיזוז: החוב הנטו + מה שלא ניתן לשייך בביטחון (⇒ בדיקת בעל העסק, לא ניחוש)."""
    invoices: list[Invoice]
    review: list[tuple[Invoice, str]] = field(default_factory=list)   # (מסמך הלקוח, סיבה)


def net_credits(debts: list[Invoice], credits: list[Invoice],
                successors: list[Invoice] = ()) -> Netting:
    """טהור. ממצא מבקר 2.16 — שמרני: מקזזים רק כשהשיוך חד-משמעי. כל ספק ⇒ review ללקוח
    (גבי לא מזכירה ללקוח הזה עד שבעל העסק בודק), ולעולם לא מקטינים חוב לפי ניחוש.

    1. 300 שיש 305/320 שמצביע עליו (פתוח או שכבר נסגר) ⇒ ה-300 יוצא (אותו חוב פעמיים).
       סכום שונה (הומר חלקית?) ⇒ גם review.
    2. זיכוי שמצביע על חוב פתוח אחד ⇒ היתרה יורדת בסכום הזיכוי; ≤0 ⇒ החוב יוצא.
       מצביע על כמה חובות · גדול מהיתרה · היתרה כבר הוקטנה (amountDueVat<amount, אולי הזיכוי
       כבר נכלל) ⇒ review. זיכוי בלי קישור ⇒ review ללקוח. זיכוי שמצביע רק על מסמכים שאינם
       פתוחים ⇒ אין מה לקזז (ואין גם תזכורת על המסמך הסגור)."""
    review: list[tuple[Invoice, str]] = []
    by_id = {d.external_id: d for d in debts}
    replaced: dict[str, str] = {}   # 300 ⇒ המסמך שהחליף אותו
    for succ in [d for d in debts if d.doc_type != TYPE_PROFORMA] + list(successors):
        for lid in succ.linked_ids:
            src = by_id.get(lid)
            if src is None or src.doc_type != TYPE_PROFORMA or lid in replaced:
                continue
            replaced[lid] = succ.external_id
            src_total = src.gross_agorot or src.amount_agorot
            if (succ.gross_agorot or succ.amount_agorot) != src_total:
                review.append((src, "conversion_amount_mismatch"))
    open_ids = {d.external_id for d in debts if d.external_id not in replaced}
    credit_on: dict[str, int] = {}
    for c in credits:
        if c.amount_agorot <= 0:
            continue
        if not c.linked_ids:
            review.append((c, "credit_unlinked"))
            continue
        targets = {replaced.get(lid, lid) for lid in c.linked_ids}
        hit = sorted(t for t in targets if t in open_ids)
        if not hit:
            continue
        if len(hit) > 1:
            review.append((c, "credit_multi_invoice"))
            continue
        d = by_id[hit[0]]
        if d.gross_agorot and d.amount_agorot < d.gross_agorot:
            review.append((d, "credit_after_partial"))
            continue
        credit_on[d.external_id] = credit_on.get(d.external_id, 0) + c.amount_agorot
    out: list[Invoice] = []
    for d in debts:
        if d.external_id in replaced:
            continue
        cr = credit_on.get(d.external_id, 0)
        if cr > d.amount_agorot:
            review.append((d, "credit_exceeds_balance"))   # העודף שייך אולי לחשבונית אחרת
        if cr:
            d = replace(d, amount_agorot=max(0, d.amount_agorot - cr), credit_agorot=cr)
        if d.amount_agorot > 0:
            out.append(d)
    return Netting(out, review)


class GreenInvoiceClient:
    # מממש את InvoiceSource (app/integrations/sources.py): iter_open_invoices + get_document
    provider = "greeninvoice"

    def __init__(
        self,
        base_url: str,
        api_id: str,
        api_secret: str,
        *,
        transport: httpx.BaseTransport | None = None,
        clock=time.time,
    ) -> None:
        if "sandbox" not in base_url and not is_loopback_url(base_url):
            # מעקה כפול מעבר ל-config: שלב 1 = sandbox, או mock מקומי (app/gi_mock.py)
            raise GreenInvoiceError("שלב 1: רק כתובת sandbox (או mock מקומי) מותרת")
        self._http = httpx.Client(base_url=base_url, transport=transport, timeout=20)
        self._id = api_id
        self._secret = api_secret
        self._token: str | None = None
        self._token_exp = 0.0
        self._clock = clock

    def close(self) -> None:
        self._http.close()

    def _auth(self) -> str:
        if self._token and self._clock() < self._token_exp - 60:
            return self._token
        if not self._id or not self._secret:
            raise GreenInvoiceError("חסרים GREENINVOICE_API_ID/SECRET")
        r = self._http.post("/account/token", json=token_body(self._id, self._secret))
        if r.status_code != 200:
            raise GreenInvoiceError(f"token נכשל: {r.status_code}")
        body = r.json()
        self._token = body["token"]
        exp = body.get("expires")
        self._token_exp = float(exp) if exp else self._clock() + 3600
        return self._token

    def post(self, path: str, payload: dict[str, Any], *, what: str = "") -> dict[str, Any]:
        """POST מאומת עם חידוש-טוקן חד-פעמי על 401."""
        what = what or path
        for attempt in range(2):
            r = self._http.post(path, json=payload,
                                headers={"Authorization": f"Bearer {self._auth()}"})
            if r.status_code == 401 and attempt == 0:
                self._token = None  # טוקן פג — לחדש פעם אחת
                continue
            if r.status_code != 200:
                raise GreenInvoiceError(f"{what} נכשל: {r.status_code}")
            return r.json()
        raise GreenInvoiceError(f"{what} נכשל: 401 חוזר")

    def search_documents(self, *, page: int = 1, page_size: int = 50,
                         statuses=(STATUS_OPEN,), types=OPEN_DEBT_TYPES,
                         from_date: date | None = None) -> dict[str, Any]:
        payload: dict[str, Any] = {"page": page, "pageSize": page_size,
                                   "status": list(statuses), "type": list(types)}
        if from_date is not None:
            payload["fromDate"] = from_date.isoformat()   # לאמת: שם השדה ב-sandbox
        return self.post("/documents/search", payload, what="search")

    def _request(self, method: str, path: str, payload: Any = None, *, what: str = "") -> Any:
        """GET/PUT/DELETE מאומת, אותו חידוש-טוקן כמו post()."""
        for attempt in range(2):
            r = self._http.request(method, path, json=payload,
                                   headers={"Authorization": f"Bearer {self._auth()}"})
            if r.status_code == 401 and attempt == 0:
                self._token = None
                continue
            if r.status_code == 404:
                raise KeyError(path)
            if r.status_code != 200:
                raise GreenInvoiceError(f"{what or path} נכשל: {r.status_code}")
            return r.json()
        raise GreenInvoiceError(f"{what or path} נכשל: 401 חוזר")

    def get_document(self, doc_id: str) -> Invoice:
        """ר-4: רענון מסמך יחיד לפני שליחה. KeyError ⇒ המסמך לא קיים (נמחק)."""
        return map_document(self._enrich_client(
            self._request("GET", f"/documents/{doc_id}", what="documents/get")))

    # ---------- לקוחות ----------
    def get_client(self, client_id: str) -> dict[str, Any]:
        return self._request("GET", f"/clients/{client_id}", what="clients/get")

    def search_clients(self, *, name: str = "", active: bool | None = None, page: int = 1,
                       page_size: int = 50) -> dict[str, Any]:
        body: dict[str, Any] = {"page": page, "pageSize": page_size}
        if name:
            body["name"] = name
        if active is not None:
            body["active"] = active
        return self.post("/clients/search", body, what="clients/search")

    def me(self) -> dict[str, Any]:
        return self._request("GET", "/users/me", what="users/me")

    def create_payment_form(self, inv: Invoice, *, notify_url: str = "") -> str:
        """**חסום.** POST /payments/form (type 400) יוצר בחשבונית ירוקה דף תשלום שמנפיק **קבלה** בשם העסק.
        הכרעת מאיר (6.11): לא יוצרים קבלות ולא כותבים ל-GI. «גבי רק קורא» (דף הנחיתה, ה-FAQ, התנאים).
        critic סבב 19: אף אחד כבר לא קרא לפונקציה, אבל היא נשארה מוכנה לכתיבה, ו-PR אחד היה מחזיר אותה.
        עכשיו נכשלת סגור, בלי שום קריאת רשת."""
        from .config import SafetyError
        raise SafetyError("create_payment_form חסום: גבי לא יוצר קבלות ולא כותב לחשבונית ירוקה "
                          "(הכרעת מאיר 6.11). קישור התשלום = PAYMENT_LINK של העסק")

    def _enrich_client(self, doc: dict[str, Any]) -> dict[str, Any]:
        """אם במסמך אין טלפון ואין מייל ללקוח (ייתכן ב-API האמיתי — לאמת), משלימים מ-/clients/{id}.
        מטמון לכל סנכרון, כדי לא לקרוא פעמיים לאותו לקוח."""
        cl = doc.get("client") or {}
        if cl.get("phone") or cl.get("mobile") or cl.get("emails") or not cl.get("id"):
            return doc
        cache = self.__dict__.setdefault("_client_cache", {})
        if cl["id"] not in cache:
            try:
                cache[cl["id"]] = self.get_client(str(cl["id"]))
            except (KeyError, GreenInvoiceError):
                cache[cl["id"]] = {}
        full = cache[cl["id"]]
        merged = {**cl, **{k: full[k] for k in ("phone", "mobile", "emails") if full.get(k)}}
        return {**doc, "client": merged}

    def _iter_docs(self, *, types, statuses, from_date: date | None, page_size: int,
                   max_pages: int) -> Iterator[Invoice]:
        page = 1
        while page <= max_pages:
            body = self.search_documents(page=page, page_size=page_size, statuses=statuses,
                                         types=types, from_date=from_date)
            for doc in body.get("items", []):
                inv = map_document(self._enrich_client(doc))
                # סינון כפול בצד שלנו (כמו 2.10): לא סומכים על פילטר השרת
                if inv.doc_type not in types or inv.status not in statuses:
                    continue
                # בזיכוי היתרה לתשלום (amountDueVat) לא רלוונטית — סכום הזיכוי הוא סכום המסמך
                total = _to_agorot(doc.get("amount", doc.get("total", 0)))
                yield replace(inv, amount_agorot=abs(total)) if inv.doc_type == TYPE_CREDIT else inv
            if page >= int(body.get("pages") or 1):
                return
            page += 1

    def credits_for(self, doc_id: str, since=None) -> int:
        """סך הזיכויים (330, לא מבוטלים) שמקושרים למסמך הזה, מתאריך המסמך. משמש ברענון שלפני שליחה
        (critic סבב 20: זיכוי שהונפק אחרי הסנכרון לא נראה). זיכוי שמקושר לכמה מסמכים לא נספר כאן:
        הוא ב-review מהסנכרון, והלקוח מושהה ממילא."""
        total = 0
        for c in self._iter_docs(types=CREDIT_TYPES, statuses=CREDIT_STATUSES, from_date=since,
                                 page_size=50, max_pages=200):
            if c.amount_agorot > 0 and tuple(c.linked_ids) == (doc_id,):
                total += c.amount_agorot
        return total

    def open_debts(self, page_size: int = 50, max_pages: int = 200) -> Netting:
        """החוב הפתוח **אחרי קיזוז** (ממצא מבקר 2.16) — זה מה שהסנכרון קולט.
        זיכויים ומסמכי-המשך נשלפים רק מתאריך החוב הפתוח הוותיק (לא כל ההיסטוריה)."""
        debts = list(self.iter_open_invoices(page_size=page_size, max_pages=max_pages))
        dates = [d.issued for d in debts if d.issued]
        if not debts:
            return Netting([])
        start = min(dates) if dates else None
        credits = list(self._iter_docs(types=CREDIT_TYPES, statuses=CREDIT_STATUSES,
                                       from_date=start, page_size=page_size, max_pages=max_pages))
        successors: list[Invoice] = []
        pro = [d.issued for d in debts if d.doc_type == TYPE_PROFORMA]
        if pro:
            pstart = min((x for x in pro if x), default=None)
            successors = list(self._iter_docs(
                types=SUCCESSOR_TYPES, statuses=SUCCESSOR_CLOSED_STATUSES, from_date=pstart,
                page_size=page_size, max_pages=max_pages))
        return net_credits(debts, credits, successors)

    def iter_open_invoices(self, page_size: int = 50, max_pages: int = 200) -> Iterator[Invoice]:
        """גולמי — **לפני** קיזוז זיכויים והמרות 300⇒305. הסנכרון משתמש ב-open_debts()."""
        self.__dict__["_client_cache"] = {}
        page = 1
        while page <= max_pages:
            body = self.search_documents(page=page, page_size=page_size)
            for doc in body.get("items", []):
                doc = self._enrich_client(doc)
                inv = map_document(doc)
                # ממצא מבקר 2.10: רק מסמך בסטטוס «פתוח» הוא חוב, גם אם החיפוש החזיר אחר
                if inv.amount_agorot > 0 and inv.status == STATUS_OPEN:
                    yield inv
            pages = int(body.get("pages") or 1)
            if page >= pages:
                return
            page += 1
