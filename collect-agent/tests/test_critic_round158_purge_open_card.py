"""critic סבב 158 — שני ממצאים לתיקון בונה, אחרי תיקון 157 (`29790716`, closed_at בכל מסלולי הסגירה).

🟠 א. רכיב: `app/service.py` → `CollectService._purge_rows` (ר-10, מחיקה אחרי 90 יום).
לקוח שכתב «העברתי לעורך הדין שלי» (כרטיס דחוף legal, `messages.needs_owner=1` + טיוטה needs_owner) ובעל העסק
עוד לא טיפל; החשבונית נסגרה («✓ שולם מחוץ למערכת») ⇒ אחרי 91 יום ה-purge מתמם את הלקוח ומרוקן את ההודעה
ואת הטיוטה — **הכרטיס נשאר ב«דורש טיפול שלך» (`/owner/inbox`) ריק: בלי שם, בלי טלפון, בלי תוכן**. בעל העסק
רואה כרטיס דחוף «עו״ד» שאי אפשר לדעת ממי ועל מה. הצעה (שמרנית): לדחות את התממת הלקוח כל עוד יש לו כרטיס
פתוח (`messages.needs_owner=1` / טיוטה pending_approval|needs_owner), ולרשום audit `purge_deferred_open_card`;
ה-purge ימשיך אחרי «טופל». (חלופה להכרעת ראש צוות: intent=legal ⇒ legal_hold אוטומטי.)

🟡 ב. רכיב: `app/service.py` → `_purge_rows`, הריפוי `closed_at=COALESCE(owner_paid_at, now)`.
חשבונית שנסגרה לפני התיקון ברענון (בלי owner_paid_at) מקבלת closed_at=«עכשיו» ⇒ בגרף «גבייה לפי שבוע»
(`_collection_series`) ובמדדי הבטא (`closed_after_reminder`, ימים עד גבייה) היא מופיעה כ**גבייה של השבוע**,
אף שנסגרה לפני חודשים — קפיצה חד-פעמית מזויפת אחרי העלאת הגרסה. הצעה: `COALESCE(owner_paid_at, synced_at, now)`
(synced_at ≤ מועד הסגירה ⇒ קרוב לאמת), או לסמן את הריפוי ולהחריג מהגרף/מהמדדים.

תוקנו במנהל 304 (ה-xfail הוסרו); בדיקות הבקרה חייבות להישאר ירוקות."""
from datetime import timedelta

DANA = 1   # 0501234567 = doc1 = לקוח 1 ב-conftest


def _legal_then_paid(svc, clock):
    svc.sync()
    svc.inbound("sms", "0501234567", "העברתי לעורך הדין שלי")
    svc.mark_paid_outside(svc.db.one("SELECT id FROM invoices WHERE customer_id=?", (DANA,))["id"])
    clock.now += timedelta(days=91)


def test_purge_does_not_blank_unhandled_urgent_card(svc, clock):
    _legal_then_paid(svc, clock)
    svc.purge_closed()
    card = svc.db.one("SELECT body FROM messages WHERE customer_id=? AND needs_owner=1", (DANA,))
    assert card is not None
    name = svc.db.one("SELECT name FROM customers WHERE id=?", (DANA,))["name"]
    assert card["body"] and name, (card["body"], name)


def test_control_purge_proceeds_after_card_handled(svc, clock):
    _legal_then_paid(svc, clock)
    for m in svc.db.q("SELECT id FROM messages WHERE customer_id=? AND needs_owner=1", (DANA,)):
        svc.owner_message_done(m["id"])
    svc.db.x("UPDATE drafts SET status='rejected' WHERE customer_id=?", (DANA,))
    assert svc.purge_closed()["customers"] == 1
    assert svc.db.one("SELECT name FROM customers WHERE id=?", (DANA,))["name"] is None


def test_healed_old_close_not_counted_as_this_weeks_collection(svc, clock):
    svc.sync()
    iid = svc.db.one("SELECT id FROM invoices WHERE customer_id=?", (DANA,))["id"]
    # נסגרה ברענון לפני התיקון (closed_at חסר, בלי owner_paid_at)
    svc.db.x("UPDATE invoices SET status='closed', closed_at=NULL WHERE id=?", (iid,))
    clock.now += timedelta(days=60)
    svc.purge_closed()                                  # הריפוי רץ כאן
    assert svc.dashboard()["series"][-1]["collected_agorot"] == 0


def test_control_paid_outside_counted_in_its_week(svc, clock):
    """בקרה: «שולם מחוץ» אחרי התיקון נספר בשבוע שבו סומן."""
    svc.sync()
    svc.mark_paid_outside(svc.db.one("SELECT id FROM invoices WHERE customer_id=?", (DANA,))["id"])
    assert svc.dashboard()["series"][-1]["collected_agorot"] == 120000


def test_purge_deferral_audited_once(svc, clock):
    """מנהל 304: הדחייה נרשמת ב-audit פעם אחת, לא בכל ריצת purge."""
    _legal_then_paid(svc, clock)
    svc.purge_closed()
    svc.purge_closed()
    n = svc.db.one("SELECT COUNT(*) n FROM audit WHERE action='purge_deferred_open_card'")["n"]
    assert n == 1


def test_invoice_still_purged_while_card_open(svc, clock):
    """מנהל 304: הדחייה חלה רק על התממת הלקוח — החשבונית עצמה (קישור תשלום, קוד /p/) נמחקת בזמן."""
    _legal_then_paid(svc, clock)
    assert svc.purge_closed()["invoices"] == 1
    assert svc.db.one("SELECT payment_url FROM invoices WHERE customer_id=?", (DANA,))["payment_url"] is None


def test_deferral_capped_for_abandoned_urgent_card(svc, clock):
    """מנהל 304: כרטיס דחוף שננטש לא שומר PII לנצח — אחרי 180 יום מהכרטיס ה-purge מתמם."""
    _legal_then_paid(svc, clock)
    svc.purge_closed()
    assert svc.db.one("SELECT name FROM customers WHERE id=?", (DANA,))["name"]
    clock.now += timedelta(days=90)
    assert svc.purge_closed()["customers"] == 1
    assert svc.db.one("SELECT name FROM customers WHERE id=?", (DANA,))["name"] is None


@pytest.mark.xfail(strict=True, reason="critic 159: «טופל» ב-/owner/inbox לא סוגר את הטיוטה הדחופה ⇒ ה-purge נדחה עד 180 יום")
def test_owner_done_alone_releases_purge(svc, clock):
    """critic סבב 159 · 🟡 רכיב: `app/service.py` → `_has_open_card` (מ-`802744f2`) מול `owner_message_done`.
    בעל העסק לחץ «טופל» על הכרטיס (messages.needs_owner=0), אבל הטיוטה הדחופה נשארת needs_owner ⇒ `_has_open_card`
    עדיין True ⇒ ההתממה נדחית עד תקרת 180 יום, אף שבעל העסק סיים. הצעה: «טופל» סוגר גם טיוטות דחופות פתוחות של
    אותה הודעה/לקוח (status=superseded/decided_by=owner), או ש-`_has_open_card` יבדוק גם `messages.needs_owner=1`."""
    _legal_then_paid(svc, clock)
    for m in svc.db.q("SELECT id FROM messages WHERE customer_id=? AND needs_owner=1", (DANA,)):
        svc.owner_message_done(m["id"])
    assert svc.purge_closed()["customers"] == 1
