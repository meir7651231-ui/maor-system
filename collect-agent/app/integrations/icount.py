"""iCount API v3 — מקור חשבוניות, קריאה בלבד.

תיעוד ציבורי (נקרא 7.11.2026, בלי חשבון ובלי קריאה מאומתת):
  • https://apiv3.icount.co.il/  — דף התיעוד (מבוסס JS)
  • https://apiv3.icount.co.il/api/v3.php/help/methods/doc?format=json&no_auth=1   — doc/search, doc/info
  • https://apiv3.icount.co.il/api/v3.php/help/methods/client?format=json&no_auth=1 — client/info
  • https://apiv3.icount.co.il/api/v3.php/help/methods/auth?format=json&no_auth=1   — auth/login
  • https://apiv3.icount.co.il/api/v3.php/help/methods/webhook?format=json&no_auth=1 — webhook/*

מה שמתועד ומשמש כאן:
  POST https://api.icount.co.il/api/v3.php/auth/login   {cid, user, pass} ⇒ {status, sid}
  POST …/doc/search  {doctype, status (0=open — כולל «נסגר חלקית»), offset, limit, detail_level}
                     ⇒ {status, results_count, results_list[]}; שגיאה «no_results_found» = אין תוצאות
  POST …/doc/info    {doctype, docnum} ⇒ {status, doc_info{doctype, docnum, dateissued, duedate,
                     client_id, client_name, currency_code, totalwithvat, remainingsum,
                     status (0 פתוח · 1 סגור · 2 נסגר חלקית), is_cancelled}}; doc_not_found
  POST …/client/info {client_id} ⇒ {status, client_info{email, phone, mobile, …}}
  תשובה: HTTP 200 גם בשגיאה; הצלחה = {"status": true}, אחרת {"status": false, "reason": …}.
  webhook: נרשם במערכת של iCount (webhook/add — **כתיבה, לא קוראים לה**). בעל העסק מגדיר בממשק.

«לאמת» (לא נבדק מול חשבון אמיתי):
  • אימות ב-Bearer api_token (מקובל; לא מופיע ב-help של auth) — לחלופין cid/user/pass ⇒ sid.
  • שמות הסוגים: invoice = חשבונית מס, deal = חשבון עסקה.
  • אילו שדות מוחזרים בחיפוש ב-detail_level=2 («+client details+detailed totals») — המיפוי סובלני;
    בלי remainingsum/balance למסמך «נסגר חלקית» ⇒ סכום 0 (לא מזכירים על סכום לא ידוע).
  • מבנה גוף ה-webhook — אצלנו הוא רק טריגר לסנכרון.
  • **זיכויים (critic 2.16 / סבב 20):** סוג המסמך `refund` = חשבונית זיכוי (לאמת). שם שדה הקישור
    לחשבונית המקורית **לא מתועד** בפומבי ⇒ קריאה סובלנית (`based_on` [{doctype, docnum}] ·
    `orig_doctype`+`orig_docnum`), לאמת. זיכוי בלי קישור מזוהה ⇒ **לא מקזזים** ⇒ הלקוח מושהה
    לבדיקת בעל העסק (`credit_review`), כמו `greeninvoice.net_credits`. זיכוי מבוטל (is_cancelled) ⇒
    לא נספר. חוב «נסגר חלקית» עם זיכוי מקושר ⇒ review (אולי הזיכוי כבר בתוך remainingsum).
  • המרת deal ⇒ invoice (אותו חוב פעמיים?) — לא ידוע אם iCount סוגרת את ה-deal; לא ממומש, לאמת.
"""
from __future__ import annotations

import dataclasses
from collections.abc import Iterator
from typing import Any

import httpx

from ..config import SafetyError
from ..greeninvoice import TYPE_CREDIT, Invoice, Netting, _to_agorot, net_credits
from .base import IntegrationError, ProviderError, classify_status, guard_transport, jstr
from .sources import credits_on_doc, due_or_estimate, parse_il_date

ICOUNT_BASE = "https://api.icount.co.il/api/v3.php"
ICOUNT_DEBT_DOCTYPES = ("invoice", "deal")   # חשבונית מס · חשבון עסקה (לאמת)
ICOUNT_CREDIT_DOCTYPES = ("refund",)          # חשבונית זיכוי (לאמת)
ICOUNT_DOCTYPE_CODES = {"invoice": 305, "deal": 300, "refund": TYPE_CREDIT}   # ⇒ קודי חשבונית ירוקה
PREFIX = "icount:"
STATUS_OPEN, STATUS_CLOSED, STATUS_PARTIAL = 0, 1, 2
SEARCH_DETAIL_LEVEL = 2   # 1 = רק תאריך+לקוח+סכום כולל; 2 = פרטי לקוח + סכומים מפורטים (לאמת)


def _amount(d: dict[str, Any], status: int) -> Any:
    for k in ("remainingsum", "balance", "total_due"):
        if d.get(k) not in (None, ""):
            return d[k]
    if status == STATUS_PARTIAL:
        return 0      # שמרני: שולם חלק ואין יתרה ידועה ⇒ לא מזכירים על הסכום המלא
    return d.get("totalwithvat", d.get("total", 0))


def _ref(doctype: Any, docnum: Any) -> str:
    return f"{PREFIX}{doctype}-{docnum}" if doctype and docnum not in (None, "") else ""


def _links(d: dict[str, Any]) -> tuple[str, ...]:
    """לאמת: שם שדה הקישור של זיכוי לחשבונית לא מתועד. סובלני לשתי צורות; כל דבר אחר ⇒ אין קישור."""
    out: list[str] = []
    for x in d.get("based_on") or []:
        if isinstance(x, dict):
            out.append(_ref(x.get("doctype"), x.get("docnum")))
    out.append(_ref(d.get("orig_doctype"), d.get("orig_docnum")))
    return tuple(dict.fromkeys(x for x in out if x))


def map_icount_doc(d: dict[str, Any]) -> Invoice:
    """מיפוי סובלני — שמות השדות לפי התיעוד הציבורי של iCount v3 (doc_info), לאמת מול חשבון אמיתי."""
    raw_status = int(d.get("status", 0) or 0)
    credit = str(d.get("doctype") or "") in ICOUNT_CREDIT_DOCTYPES
    # בזיכוי: סכום הזיכוי הוא סכום המסמך (לא «יתרה לתשלום»)
    amount = abs(float(d.get("totalwithvat", d.get("total", 0)) or 0)) if credit \
        else _amount(d, raw_status)
    gross = d.get("totalwithvat") if not credit and d.get("remainingsum") not in (None, "") \
        else None
    email = d.get("client_email") or d.get("email") or ""
    if isinstance(email, list):
        email = email[0] if email else ""
    phone = d.get("client_mobile") or d.get("client_phone") or d.get("mobile") \
        or d.get("phone") or ""
    doctype = str(d.get("doctype") or "")
    docnum = str(d.get("docnum") or d.get("doc_number") or "")
    ext = d.get("doc_id") or d.get("id") or (f"{doctype}-{docnum}" if docnum else "")
    issued = parse_il_date(d.get("dateissued") or d.get("doc_date"))
    due, estimated = due_or_estimate(parse_il_date(d.get("duedate") or d.get("due_date")), issued)
    # 0 פתוח ו-2 «נסגר חלקית» = עדיין חוב (היתרה בסכום). 1 סגור · מבוטל ⇒ לא חוב.
    status = 4 if d.get("is_cancelled") else (1 if raw_status == STATUS_CLOSED else 0)
    return Invoice(
        external_id=f"{PREFIX}{ext}",
        number=docnum,
        doc_type=ICOUNT_DOCTYPE_CODES.get(doctype, 0),
        amount_agorot=_to_agorot(amount),
        currency=str(d.get("currency_code") or d.get("currency") or "ILS"),
        issued=issued,
        due=due,
        client_external_id=f"{PREFIX}{d['client_id']}" if d.get("client_id") else "",
        client_name=str(d.get("client_name") or ""),
        client_phone=str(phone),
        client_email=str(email),
        status=status,
        due_estimated=estimated,
        linked_ids=_links(d) if credit else (),
        gross_agorot=_to_agorot(gross) if gross not in (None, "") else 0,
    )


class ICountClient:
    """iCount API v3. אימות: api_token (Bearer) — או cid+user+pass ⇒ auth/login ⇒ sid.

    שלב 1: אין sandbox ל-iCount ⇒ חיבור רק דרך httpx.MockTransport. בלי transport ⇒
    SafetyError בכל קריאה.
    """

    provider = "icount"

    def __init__(self, *, api_token: str = "", cid: str = "", user: str = "",
                 password: str = "", transport: httpx.BaseTransport | None = None,
                 page_size: int = 100, max_pages: int = 100) -> None:
        if not api_token and not (cid and user and password):
            raise IntegrationError("iCount: נדרש ICOUNT_API_TOKEN או ICOUNT_CID+USER+PASS")
        self.token, self.cid, self.user, self.password = api_token, cid, user, password
        self._transport = guard_transport(transport)
        self._http = httpx.Client(base_url=ICOUNT_BASE, transport=self._transport,
                                  timeout=20) if self._transport else None
        self._sid: str | None = None
        self.page_size, self.max_pages = page_size, max_pages
        self._index: dict[str, tuple[str, str]] = {}    # external_id ⇒ (doctype, docnum)
        self._clients: dict[str, dict[str, Any]] = {}

    def _call(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        if self._http is None:
            raise SafetyError("שלב 1: חיבור אמיתי ל-iCount חסום (אין sandbox) — רק MockTransport")
        headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
        r = self._http.post(path, json=payload, headers=headers)
        if r.status_code >= 400:
            raise classify_status(self.provider, r)
        b = r.json()
        if b.get("status") is not True:
            reason = b.get("reason") or b.get("error_description") or "status=false"
            raise ProviderError(self.provider, f"{path}: {reason}",
                                retryable=False)
        return b

    def _auth_payload(self) -> dict[str, Any]:
        if self.token:
            return {}
        if not self._sid:
            b = self._call("/auth/login", {"cid": self.cid, "user": self.user,
                                           "pass": self.password})
            sid = jstr(b.get("sid"), strip=True)
            if not sid:     # status:true בלי sid ⇒ לא שולחים "None" ולא קורסים ב-KeyError
                raise ProviderError(self.provider, "auth/login: תשובה בלי sid", retryable=False)
            self._sid = sid
        return {"sid": self._sid}

    def _authed(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        """קריאה מאומתת עם login מחדש פעם אחת כש-sid פג."""
        try:
            return self._call(path, {**self._auth_payload(), **payload})
        except ProviderError as e:
            if self._sid and "sid" in str(e).lower():
                self._sid = None
                return self._call(path, {**payload, **self._auth_payload()})
            raise

    def search_page(self, doctype: str, offset: int,
                    status: int | None = STATUS_OPEN) -> dict[str, Any]:
        payload = {"doctype": doctype, "limit": self.page_size, "offset": offset,
                   "detail_level": SEARCH_DETAIL_LEVEL}
        if status is not None:
            payload["status"] = status
        try:
            return self._authed("/doc/search", payload)
        except ProviderError as e:
            if "no_results_found" in str(e):      # מתועד כ-throw — אצלנו = עמוד ריק
                return {"status": True, "results_list": [], "results_count": 0}
            raise

    def _client_info(self, client_id: str) -> dict[str, Any]:
        if client_id not in self._clients:
            try:
                b = self._authed("/client/info", {"client_id": client_id})
                self._clients[client_id] = b.get("client_info") or {}
            except ProviderError:
                self._clients[client_id] = {}
        return self._clients[client_id]

    def _enrich(self, d: dict[str, Any]) -> dict[str, Any]:
        """doc_info לא כולל טלפון/מייל של הלקוח (לפי התיעוד) ⇒ משלימים מ-client/info, במטמון."""
        has = d.get("client_email") or d.get("email") or d.get("client_mobile") \
            or d.get("client_phone") or d.get("mobile") or d.get("phone")
        if has or not d.get("client_id") or self._http is None:
            return d
        ci = self._client_info(str(d["client_id"]))
        return {**d, "client_email": ci.get("email") or "",
                "client_mobile": ci.get("mobile") or ci.get("phone") or ""}

    def _remember(self, d: dict[str, Any], inv: Invoice) -> None:
        if d.get("doctype") and d.get("docnum") not in (None, ""):
            self._index[inv.external_id] = (str(d["doctype"]), str(d["docnum"]))

    def _rows(self, doctype: str, status: int | None = STATUS_OPEN) -> Iterator[dict[str, Any]]:
        offset = 0
        for _ in range(self.max_pages):
            b = self.search_page(doctype, offset, status)
            rows = b.get("results_list") or b.get("docs") or []
            if isinstance(rows, dict):
                rows = list(rows.values())
            yield from (r for r in rows if isinstance(r, dict))
            if len(rows) < self.page_size:
                return
            offset += self.page_size

    def iter_open_invoices(self) -> Iterator[Invoice]:
        """גולמי — **לפני** קיזוז זיכויים. הסנכרון משתמש ב-open_debts()."""
        self._clients = {}
        for doctype in ICOUNT_DEBT_DOCTYPES:
            for d in self._rows(doctype):
                d = self._enrich(d)
                inv = map_icount_doc(d)
                self._remember(d, inv)
                if inv.amount_agorot > 0 and inv.status == 0:
                    yield inv

    def iter_credits(self) -> Iterator[Invoice]:
        """חשבוניות זיכוי שלא בוטלו (כל סטטוס). הקישור מתורגם למזהה שבו החוב נשמר בסנכרון
        (ייתכן doc_id), כדי ש-net_credits ישייך לפי אותו external_id."""
        rev = {v: k for k, v in self._index.items()}
        for doctype in ICOUNT_CREDIT_DOCTYPES:
            for d in self._rows(doctype, status=None):
                inv = map_icount_doc(d)
                if inv.status == 4 or inv.amount_agorot <= 0:
                    continue
                links = []
                for lid in inv.linked_ids:
                    t, _, n = lid[len(PREFIX):].partition("-")
                    links.append(rev.get((t, n), lid))
                yield dataclasses.replace(inv, linked_ids=tuple(links))

    def open_debts(self) -> Netting:
        """החוב הפתוח **אחרי** קיזוז זיכויים — אותו כלל שמרני של חשבונית ירוקה (net_credits)."""
        debts = list(self.iter_open_invoices())
        if not debts:
            return Netting([])
        return net_credits(debts, list(self.iter_credits()))

    def credits_for(self, external_id: str, since=None, doc: Invoice | None = None) -> int:
        """רענון לפני שליחה: זיכויים עדכניים של המסמך הזה. ספק ⇒ CreditAmbiguous (לא מנחשים)."""
        self._locate(external_id)    # מזהה זר/לא מוכר ⇒ IntegrationError (השירות חוסם שליחה)
        return credits_on_doc(self.iter_credits(), doc if doc is not None else external_id)

    def _locate(self, external_id: str) -> tuple[str, str]:
        if not external_id.startswith(PREFIX):
            raise IntegrationError(f"iCount: מזהה של מקור אחר ({external_id[:20]})")
        if external_id in self._index:
            return self._index[external_id]
        ref = external_id[len(PREFIX):]
        doctype, sep, docnum = ref.partition("-")
        if sep and doctype in ICOUNT_DOCTYPE_CODES and docnum.isdigit():
            return doctype, docnum
        # מזהה שלא נבנה מ-doctype+docnum ולא נראה בסנכרון הזה ⇒ לא יודעים לרענן ⇒ חוסמים שליחה
        raise IntegrationError("iCount: אין doctype/docnum למסמך — נדרש סנכרון לפני רענון")

    def get_document(self, external_id: str) -> Invoice:
        """ר-4: doc/info. doc_not_found ⇒ KeyError. כל כשל אחר ⇒ חריגה (השירות חוסם שליחה)."""
        doctype, docnum = self._locate(external_id)
        try:
            b = self._authed("/doc/info", {"doctype": doctype, "docnum": int(docnum),
                                           "get_items": False, "get_payments": False})
        except ProviderError as e:
            if "doc_not_found" in str(e):
                raise KeyError(external_id) from None
            raise
        d = dict(b.get("doc_info") or {})
        if not d:
            raise ProviderError(self.provider, "doc/info: תשובה בלי doc_info")
        inv = map_icount_doc(self._enrich(d))
        # המזהה נשמר כפי שהיה בסנכרון (ייתכן doc_id היסטורי), כדי שהשירות ימצא את השורה
        return dataclasses.replace(inv, external_id=external_id)

    @staticmethod
    def webhook_ref(payload: dict[str, Any]) -> str:
        """מה שמזהה את המסמך בגוף ה-webhook (לאמת: מבנה הגוף לא מתועד). רק לרישום ב-audit."""
        return f"{jstr(payload.get('doctype'))}-{jstr(payload.get('docnum'))}"[:64]
