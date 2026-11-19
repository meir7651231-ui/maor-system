"""critic סבב 166 · 🟡 לתיקון בונה — רכיב: `app/service.py` → `landing` / `landing_action` (/p/{code}).

לקוח שסומן `paused_reason=minor` («אני בן 14») — העמוד /p/ של קישור שכבר נשלח עדיין מציג כפתור תשלום
(`pay_url`) ופריסה, ו-`landing_action(code, "plan")` יוצר טיוטת הסדר. ברוח 153 (אין קישור תשלום לקטין בלי עין
אנושית) — העמוד לא מכיר את ההשהיה המגינה. הצעה: `paused_reason` מגן (minor/distress/deceased/…) ⇒ `pay_url=None`
ו-plan/paid לא זמינים (או שורה «פנו אלינו טלפונית»). xfail(strict=True); הבקרה (לקוח רגיל) נשארת ירוקה."""



def _code(svc):
    svc.sync()
    return svc._short_code(svc._invoice(svc.db.one("SELECT id FROM invoices WHERE customer_id=1")["id"]))


def test_minor_landing_has_no_pay_button(svc):
    code = _code(svc)
    svc.inbound("sms", "0501234567", "אני בן 14")
    assert svc.landing(code)["pay_url"] is None


def test_control_regular_landing_has_pay_button(svc):
    assert svc.landing(_code(svc))["pay_url"]
