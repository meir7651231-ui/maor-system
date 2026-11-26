"""מבקר סבב 250 · 🟡 — עסק קטן (2–4 חובות פתוחים): סנכרון API שמחזיר **רשימה ריקה** עדיין סוגר את כולם בשקט, כי הסף של
מנהל 416ב הוא ≥5 ו-≥50%.

רכיבים: `app/service.py` → `_ingest_rows` / סף `api_mass_vanish` (מנהל 416ב: נעלמו ≥5 **וגם** ≥50% ⇒ לא סוגרים + כרטיס).
רשימה ריקה כשיש חובות פתוחים היא האות החזק ביותר לתקלה (פילטר/חשבון/ספק), אבל אצל עסק עם 4 חובות היא מתחת לסף.
תרחיש (fake_gi): 4 חשבוניות פתוחות ⇒ סנכרון עם 0 מסמכים ⇒ `{'open': 0, 'closed': 4}`, אין כרטיס. רוב עסקי הבטא קטנים.
✓ 249 תוקן: 10⇒5 ⇒ `vanish_held: 5` + כרטיס אחד (לא כפול בסנכרון חוזר), החזרה ל-10 ⇒ הכרטיס יורד; ירידה הדרגתית
10⇒6⇒3⇒1⇒0 ⇒ סגירות רגילות (בתוך הסף — עיצוב). ℹ️ `greeninvoice.iter_open_invoices` לא strict (עוצר בשקט ב-200 עמודים
⇒ חשבוניות אחרי 10,000 «נעלמות»), ותשובה בלי שדה `pages` נקראת כעמוד אחד — שניהם לא נבדקו בהרצה.
הצעה: 0 מסמכים כשיש ≥2 פתוחות ⇒ אותו כרטיס `api_mass_vanish` (עם «כולן באמת שולמו»); חשבונית יחידה שנעלמה — סגירה
כרגיל (לא לחסום סגירה לגיטימית). xfail(strict=True)."""
from datetime import timedelta

from tests.conftest import gi_doc


def test_empty_response_small_business_held(svc, clock, fake_gi):
    fake_gi.docs[:] = [gi_doc(i, phone=f"050-00001{i:02d}") for i in range(1, 5)]
    svc.sync()
    fake_gi.docs[:] = []
    clock.now += timedelta(hours=2)
    svc.sync()
    still_open = svc.db.one("SELECT COUNT(*) n FROM invoices WHERE status='open'")["n"]
    card = svc.db.one("SELECT 1 FROM messages WHERE intent='api_mass_vanish' AND needs_owner=1")
    assert still_open == 4 and card, (still_open, bool(card))


def test_single_invoice_vanish_closes(svc, clock, fake_gi):
    """שומר: חשבונית יחידה שנעלמה (שולמה) נסגרת — אסור לחסום סגירה לגיטימית."""
    fake_gi.docs[:] = [gi_doc(1)]
    svc.sync()
    fake_gi.docs[:] = []
    clock.now += timedelta(hours=2)
    svc.sync()
    assert svc.db.one("SELECT status FROM invoices")["status"] == "closed"


def test_two_invoices_empty_response_held(svc, clock, fake_gi):
    """מנהל 418: הגבול התחתון — 2 פתוחות + תשובה ריקה ⇒ מוחזקות + כרטיס."""
    fake_gi.docs[:] = [gi_doc(i, phone=f"050-00001{i:02d}") for i in (1, 2)]
    svc.sync()
    fake_gi.docs[:] = []
    clock.now += timedelta(hours=2)
    out = svc.sync()
    assert out["vanish_held"] == 2
    assert svc.db.one("SELECT COUNT(*) n FROM invoices WHERE status='open'")["n"] == 2


def test_threshold_unit():
    """יחידה: ריק+≥2 ⇒ חשוד · ריק+1 ⇒ לא · לא-ריק מתחת לסף ⇒ לא."""
    from app.service import CollectService
    assert CollectService._mass_vanish(2, 2, 0) and not CollectService._mass_vanish(1, 1, 0)
    assert not CollectService._mass_vanish(4, 4, 1)

