"""critic סבב 150 · התראת פקיעת לוח החגים (58b7f964) נבנתה רק ל-/app/. `/ui` מבקש `/dashboard?view=list` — שמשמיט את
`send_window` כולו — ולכן בעל עסק שעובד ב-/ui (לשם מוביל המייל הדחוף ללקוח משויך) לא רואה שהלוח עומד לפוג/פג ושגבי
עצרה את **כל** השליחות. עכשיו: `view=list` מחזיר `holidays` ({until, expiring}) ו-/ui מציג באנר כשהלוח פג/עומד לפוג."""
import re
from datetime import datetime, timedelta
from pathlib import Path

from app.policy import Policy

UI = (Path(__file__).resolve().parents[1] / "app" / "ui.html").read_text(encoding="utf-8")


def test_list_view_carries_holidays(svc, clock):
    svc.sync()
    last = max(Policy().builtin)
    h = svc.dashboard(view="list")["holidays"]
    assert h == {"until": last, "expiring": False}
    clock.now = datetime.fromisoformat(last + "T10:00:00").replace(tzinfo=clock.now.tzinfo) - timedelta(days=30)
    assert svc.dashboard(view="list")["holidays"]["expiring"] is True


def test_ui_renders_holiday_banner():
    assert 'id="holWarn"' in UI, "אין באנר חגים ב-/ui"
    assert re.search(r"d\.holidays", UI), "/ui לא קורא את holidays מ-view=list"


# ═══ critic סבב 150 (2): שיוך כרטיס כתובת משותפת ללקוח שנמחק בינתיים (purge) ⇒ 500 (TypeError), ולפני הקריסה
# הכרטיס כבר נסגר וההשהיות שוחררו. עכשיו: בדיקה לפני כל שינוי ⇒ 409 ברור, הכרטיס נשאר פתוח.
from tests.test_shared_contact_urgent import _inbound, api  # noqa: E402,F401


def test_assign_to_deleted_customer_is_409_and_card_stays(api, svc):  # noqa: F811
    card = _inbound(api, "אני בן 15")["card_id"]
    yossi = svc.db.one("SELECT id FROM customers WHERE name='יוסי לוי'")["id"]
    svc.db.x("DELETE FROM invoices WHERE customer_id=?", (yossi,))
    svc.db.x("DELETE FROM customers WHERE id=?", (yossi,))
    r = api.post(f"/owner/shared-cards/{card}/assign", json={"customer_id": yossi})
    assert r.status_code == 409, (r.status_code, r.text)
    assert svc.db.one("SELECT needs_owner FROM messages WHERE id=?", (card,))["needs_owner"] == 1
