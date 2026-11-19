"""critic סבב 163 · 🟠 לתיקון בונה — רכיב: `app/inbox.py` → `ConversationInbox._apply_effects` (ענף WRONG_PERSON:
`_opt_out(cid, "wrong_number")` + מחיקת הטלפון) מול `app/service.py` → `landing` / `landing_action` (/p/{code}).

מי שקיבל SMS במספר שגוי וענה «טעות במספר, אני לא מכיר את דנה» ⇒ הטלפון נמחק והלקוח מוסר ✓, אבל **הקוד הקצר
שנשלח למספר הזר נשאר חי**: `/p/{code}` עדיין מציג לזר את שם העסק, מספר החשבונית, הסכום (1,200 ₪) וכפתור תשלום,
ו-`POST /p/{code}/paid` או `/plan` של הזר נרשם **בשם הלקוחה האמיתית** — «דנה כהן טוען/ת ששילם/ה 1,200 ₪.
התזכורות הושהו עד שתבדקו» / «דנה כהן ביקש/ה פריסה ל-3 תשלומים» + טיוטת הסדר. בעל העסק רואה טענת תשלום
שקרית של לקוחה שלא כתבה דבר. [מאומת בהרצה]
הצעה: WRONG_PERSON ⇒ לבטל את הקודים הקצרים של חשבוניות הלקוח (`short_code=NULL`; הלקוחה האמיתית תקבל קוד חדש
במייל/בטלפון המתוקן), או ש-`landing`/`landing_action` יסרבו לקוד שנשלח למספר שסומן שגוי.
הבדיקות xfail(strict=True); בדיקת הבקרה (לקוח רגיל — הקישור עובד) חייבת להישאר ירוקה."""
import pytest

WRONG = "טעות במספר, אני לא מכיר את דנה"


def _code(svc):
    svc.sync()
    return svc._short_code(svc._invoice(svc.db.one("SELECT id FROM invoices WHERE customer_id=1")["id"]))


def test_wrong_number_link_no_longer_shows_debt(svc):
    code = _code(svc)
    svc.inbound("sms", "0501234567", WRONG)
    with pytest.raises(KeyError):
        svc.landing(code)


@pytest.mark.parametrize("action", ["paid", "plan"])
def test_stranger_cannot_act_for_customer(svc, action):
    code = _code(svc)
    svc.inbound("sms", "0501234567", WRONG)
    before = svc.db.one("SELECT COUNT(*) n FROM messages WHERE customer_id=1 AND channel='web'")["n"]
    try:
        svc.landing_action(code, action, installments=3 if action == "plan" else None)
    except (KeyError, ValueError, PermissionError):
        pass
    after = svc.db.one("SELECT COUNT(*) n FROM messages WHERE customer_id=1 AND channel='web'")["n"]
    assert after == before


def test_control_regular_customer_link_works(svc):
    code = _code(svc)
    info = svc.landing(code)
    assert info["open"] and info["pay_url"]
    assert svc.landing_action(code, "paid")["intent"] == "paid_claim"


# מנהל 309 · התיקון: הלקוחה האמיתית מקבלת קוד חדש שעובד; כתובת משותפת ⇒ כל המקושרים; audit בלי תוכן
def test_real_customer_gets_fresh_working_code(svc):
    old = _code(svc)
    svc.inbound("sms", "0501234567", WRONG)
    inv = svc._invoice(svc.db.one("SELECT id FROM invoices WHERE customer_id=1")["id"])
    new = svc._short_code(inv)
    assert new != old and svc.landing(new)["number"]
    aud = svc.db.q("SELECT detail FROM audit WHERE action='short_codes_revoked'")
    assert len(aud) == 1 and "דנה" not in aud[0]["detail"]


def test_shared_address_wrong_person_revokes_all_linked(svc, fake_gi):
    fake_gi.docs[1]["client"]["phone"] = "050-1234567"          # דנה ויוסי על אותו טלפון
    svc.sync()
    codes = [svc._short_code(svc._invoice(r["id"])) for r in
             svc.db.q("SELECT id FROM invoices WHERE amount_agorot>0 ORDER BY id")]
    assert len(codes) == 2
    svc.inbound("sms", "0501234567", "טעות במספר, אני לא מכיר אותם")
    for c in codes:
        with pytest.raises(KeyError):
            svc.landing(c)
