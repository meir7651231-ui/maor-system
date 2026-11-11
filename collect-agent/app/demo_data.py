"""נתוני דמו + חיבור ל-mock של חשבונית ירוקה (app/gi_mock.py).

כל השמות, הטלפונים והמיילים בדויים (example.com · 050-000xxxx). אין כאן אדם אמיתי.
משמש את `scripts/demo.py` ואת `DEMO=1 uvicorn app.main:_lazy_app --factory`.
"""
from __future__ import annotations

import httpx

from .gi_mock import GreenInvoiceMock
from .greeninvoice import GreenInvoiceClient

SANDBOX = "https://sandbox.d.greeninvoice.co.il/api/v1"
DEMO_ID, DEMO_SECRET = "demo-id", "demo-secret"


def _doc(i: int, name: str, phone: str, email: str, amount: str, due: str,
         client: str = "") -> dict:
    return {"id": f"demo{i}", "number": str(2000 + i), "type": 305, "status": 0,
            "amount": amount, "currency": "ILS", "documentDate": "2026-09-01", "dueDate": due,
            "client": {"id": client or f"dcl{i}", "name": name, "phone": phone,
                       "emails": [email] if email else []}}


def demo_docs() -> list[dict]:
    """7 לקוחות בדויים (9 חשבוניות), כל אחד מדגים מסלול אחר בזרימה."""
    return [
        _doc(1, "דנה לוי (דמו)", "050-0000001", "dana@example.com", "1200.00", "2026-10-01"),
        _doc(2, "יוסי כהן (דמו)", "052-0000002", "yossi@example.com", "3450.50", "2026-10-10"),
        _doc(3, "קליניקה ירוקה (דמו)", "03-0000003", "clinic@example.com", "780.00",
             "2026-10-15"),                                         # קווי ⇒ מייל בלבד
        _doc(4, "רון אברהם (דמו)", "054-0000004", "", "450.00", "2026-10-20"),  # SMS בלבד
        _doc(5, "מיכל דוד (דמו)", "050-0000005", "michal@example.com", "2100.00",
             "2026-10-05"),                                         # תשלם ⇒ תיסגר בסנכרון
        _doc(6, "לקוח בלי פרטים (דמו)", "123", "", "300.00", "2026-10-01"),  # אין ערוץ
        # הפעלה 125: סכום חריג — מנוי חודשי של ~₪25, והשלישית הוקלדה 2,490 במקום 24.90 (נקודה
        # עשרונית שנשמטה) ⇒ תזכורת מאוחדת אחת שממתינה לאישור מפורש «הסכום נכון» + התראה לבעל העסק
        *(_doc(i, "גל שרון (דמו)", "053-0000007", "gal@example.com", amt, due, client="dcl7")
          for i, amt, due in ((7, "24.90", "2026-10-01"), (8, "29.90", "2026-10-08"),
                              (9, "2490.00", "2026-10-15"))),
    ]


class DemoBackend:
    """חשבונית ירוקה של ההדגמה = app/gi_mock.py. שני מצבים, אותו חוזה:
    - בתוך התהליך (MockTransport) — בדיקות ו-DEMO=1 בלי שרת mock.
    - שרת mock אמיתי על 127.0.0.1 (GREENINVOICE_ENV=mock) — ./demo.sh, כולל webhooks."""

    def __init__(self, mock: GreenInvoiceMock | None = None, url: str = ""):
        self.mock, self.url = mock, url.rstrip("/")

    def _admin(self, path: str, body: dict | None = None) -> dict:
        if self.mock is not None:
            status, out = self.mock.route("POST", path, {}, body)
        else:
            r = httpx.post(f"{self.url}{path}", json=body, timeout=5)
            status, out = r.status_code, r.json()
        if status != 200:
            raise RuntimeError(f"mock {path} נכשל: {status} {out}")
        return out

    def pay(self, doc_id: str) -> dict:
        """"הלקוח שילם": morning סוגרת את המסמך ויוצרת קבלה (⇒ webhook document.created)."""
        return self._admin(f"/_mock/documents/{doc_id}/pay")

    def credit(self, doc_id: str, amount_ils: float, *, link: bool = True) -> dict:
        """מסמך זיכוי (330) — מקושר לחשבונית, או בלי קישור (⇒ בדיקת בעל העסק)."""
        return self._admin(f"/_mock/documents/{doc_id}/credit", {"amount": amount_ils, "link": link})

    def convert(self, doc_id: str, *, close_source: bool = False, **extra) -> dict:
        """חשבון עסקה (300) ⇒ חשבונית מס (305) מקושרת."""
        return self._admin(f"/_mock/documents/{doc_id}/convert",
                           {"close_source": close_source, **extra})

    def partial(self, doc_id: str, paid_ils: float) -> dict:
        """תשלום חלקי: היתרה יורדת, המסמך נשאר פתוח (אימות סכום לפני שליחה)."""
        return self._admin(f"/_mock/documents/{doc_id}/partial", {"paid": paid_ils})


def demo_client(base_url: str = "") -> tuple[GreenInvoiceClient, DemoBackend]:
    if base_url:   # שרת mock חיצוני (127.0.0.1 בלבד — נאכף ב-config וב-GreenInvoiceClient)
        return GreenInvoiceClient(base_url, DEMO_ID, DEMO_SECRET), DemoBackend(url=base_url)
    mock = GreenInvoiceMock(api_id=DEMO_ID, api_secret=DEMO_SECRET, docs=demo_docs(),
                            deliver=lambda url, payload: None)
    return (GreenInvoiceClient(SANDBOX, DEMO_ID, DEMO_SECRET,
                               transport=httpx.MockTransport(mock.handler)), DemoBackend(mock))


def demo_source_factory():
    """הדגמה: בחירת iCount/רווחית/EZcount בהגדרות ⇒ adapter אמיתי מעל mock בתוך התהליך (בלי רשת),
    עם נתונים בדויים. מחזיר (factory, mocks) — ה-mocks חשופים לבדיקות ולהדגמת «שולם»."""
    from .ezcount_mock import EZcountMock
    from .ezcount_mock import demo_docs as ez_docs
    from .icount_mock import ICountMock, demo_clients
    from .icount_mock import demo_docs as ic_docs
    from .integrations.ezcount import EZcountClient
    from .integrations.icount import ICountClient
    from .integrations.rivhit import RivhitClient
    from .rivhit_mock import RivhitMock, demo_customers
    from .rivhit_mock import demo_docs as rv_docs

    mocks = {"icount": ICountMock(docs=ic_docs(), clients=demo_clients()),
             "rivhit": RivhitMock(docs=rv_docs(), customers=demo_customers()),
             "ezcount": EZcountMock(docs=ez_docs())}

    def factory(system: str):
        m = mocks.get(system)
        if m is None:
            return None
        t = httpx.MockTransport(m.handler)
        if system == "icount":
            return ICountClient(api_token=m.api_token, transport=t)
        if system == "rivhit":
            return RivhitClient(api_token=m.api_token, transport=t)
        return EZcountClient(api_key=m.api_key, developer_email=m.developer_email, transport=t)

    return factory, mocks
