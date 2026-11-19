"""critic סבב 172 · 🟠 לתיקון בונה (גבייה עיצוב) — רכיב: `web/src` (/app/) ו-`app/ui.html` (/ui) מול
`GET /dsr` + `POST /dsr/{id}/done` (`dc10bdfc`).

למרשם בקשות העיון/התיקון/המחיקה **אין מסך**: אין רשימה ואין כפתור סגירה עם תיעוד — רק API. בעל העסק מקבל כרטיס
«📄 בקשת עיון/תיקון/מחיקה — יש מועד להשיב»; «✓ טופל» על הכרטיס סוגר את ההודעה בלבד, והבקשה במרשם נשארת `open`
⇒ `dsr.sweep` ממשיך להתריע «5 ימים לפני» ו«באיחור» על בקשה שכבר טופלה, ו-`listing` מסמן אותה `overdue` לנצח.
[מאומת: אחרי `owner_message_done` על הכרטיס, 31 יום אחר כך — הבקשה open+overdue ונוספה התראת איחור.]
הצעה: מסך מרשם ב-/app/ (רשימה, ימים שנותרו, סגירה עם תיעוד ≥5 תווים), וקישור אליו מהכרטיס. xfail(strict=True)."""
from datetime import timedelta
from pathlib import Path

import pytest

from app import dsr

ROOT = Path(__file__).resolve().parents[1]


@pytest.mark.xfail(strict=True, reason="critic 172: אין מסך למרשם DSR (רשימה+סגירה) — לתיקון גבייה עיצוב")
def test_web_has_dsr_screen_with_close():
    src = "\n".join(p.read_text(encoding="utf-8") for p in (ROOT / "web" / "src").rglob("*.ts*"))
    assert "/dsr" in src and "/done" in src


def test_control_ticket_done_leaves_request_open_and_late(svc, clock):
    """מתעד את המצב היום (בקרה, לא באג נפרד): «טופל» על הכרטיס לא סוגר את הבקשה ⇒ התראת איחור."""
    svc.sync()
    svc.inbound("sms", "0501234567", "מחקו את המידע שלי")
    for m in svc.db.q("SELECT id FROM messages WHERE intent='dsr' AND needs_owner=1"):
        svc.owner_message_done(m["id"])
    clock.now += timedelta(days=31)
    dsr.sweep(svc)
    row = dsr.listing(svc)[0]
    assert row["status"] == "open" and row["overdue"]
