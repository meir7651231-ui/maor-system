"""critic סבב 170 · 🟠 לתיקון בונה — רכיב: `app/greeninvoice.py` → `GreenInvoiceClient.receipts_for` (`870b8091`)
→ `_iter_docs(..., page_size=50, max_pages=200)`.

הרענון שלפני שליחה עובר עכשיו על **כל** הקבלות בחשבון מאז תאריך החשבונית (לא רק של הלקוח), ונעצר בשקט אחרי
200 עמודים × 50 = 10,000 קבלות. בעסק עם יותר קבלות מאז תאריך החשבונית, קבלה של הלקוח שנמצאת אחרי הגבול **לא
נראית** ⇒ `receipts_for` מחזיר «אין» ⇒ התזכורת יוצאת למי ששילם (fail-open — הפוך מר-4, שבו כל ספק = לא שולחים).
[מאומת בהרצה: 10,000 קבלות של לקוחות אחרים + קבלה מקושרת של דנה ⇒ התזכורת יצאה לדנה.]
גם עלות: כל רענון = עמוד לכל 50 קבלות בחשבון (נמדד: 400 קבלות זרות ⇒ 9 קריאות search לרענון אחד), ובשליחה של
N תזכורות — N×עמודים.
הצעה: הגעה ל-max_pages ⇒ חריגה (כשל רענון ⇒ לא שולחים, כמו credits_unverifiable), ובנוסף לצמצם את החיפוש ללקוח
(סינון לפי לקוח אם ה-API תומך) או מטמון קבלות לכל ריצת dispatch. xfail(strict=True); הבקרה נשארת ירוקה."""

from tests.conftest import gi_doc
from tests.test_paid_never_reminded import _approve_all, _receipt, _to_dana


def _others(n):
    out = []
    for i in range(n):
        d = gi_doc(50_000 + i, amount="10.00", client_id=f"o{i}", name="אחר", phone="052-0000000")
        d["type"], d["status"] = 400, 1
        out.append(d)
    return out



def test_receipt_beyond_page_cap_still_holds(svc, fake_gi):
    svc.sync()
    _approve_all(svc, svc.plan())
    fake_gi.docs.extend(_others(10_000))
    fake_gi.docs.append(_receipt(9, linked=["doc1"]))   # הקבלה של דנה — אחרי 10,000 קבלות זרות
    svc.dispatch()
    assert _to_dana(svc) == []


def test_control_receipt_within_cap_holds(svc, fake_gi):
    svc.sync()
    _approve_all(svc, svc.plan())
    fake_gi.docs.extend(_others(120))
    fake_gi.docs.append(_receipt(9, linked=["doc1"]))
    svc.dispatch()
    assert _to_dana(svc) == []
