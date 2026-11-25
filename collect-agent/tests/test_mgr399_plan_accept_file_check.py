"""מנהל 399 (מבקר 235א/ב🟡): «מאשר» על הסדר שאושר ונשלח — בקרות סביב `inbox._plan_accept_file_check`.

(א) הקובץ סימן את החשבונית כשולמה ⇒ בלי טיוטה, כרטיס «סומנה כשולמה».
(ב) הקובץ שינה את פרטי הקשר (כרטיס csv_contact_plan פתוח) ⇒ בלי טיוטה לפרטים הישנים, כרטיס «פרטי הקשר השתנו».
בקרה: בלי שינוי בקובץ ⇒ טיוטת «ההסדר בתוקף» כרגיל; כרטיס csv_contact_plan שטופל ⇒ חוזר לרגיל.
"""
from tests.test_critic_round235_plan_accept_after_csv_change import DANA, H, _accept, _plan_sent


def _drafts(svc):
    return svc.db.q("SELECT status, to_addr, body FROM drafts WHERE intent='plan_accept'")


def test_normal_accept_still_drafts(svc, clock):
    _plan_sent(svc, clock)
    r, body = _accept(svc)
    assert "400" in body and "בתוקף" in r["owner_summary"]
    assert "plan_accept_closed" not in r["tags"] and "plan_accept_contact_changed" not in r["tags"]


def test_closed_in_file_card_no_draft(svc, clock):
    _plan_sent(svc, clock)
    svc.import_csv((H + f"9001,דנה כהן,{DANA},d@x.example,1200,שולם,01/10/26,15/10/26\n").encode())
    r, body = _accept(svc)
    assert body == "" and "plan_accept_closed" in r["tags"]
    assert "סומנה כשולמה" in r["owner_summary"] and "9001" in r["owner_summary"]
    assert all(d["status"] != "pending_approval" for d in _drafts(svc))
    assert svc.db.one("SELECT 1 FROM audit WHERE action='plan_accept_held_closed'")


def test_contact_changed_no_draft_to_old_phone(svc, clock):
    _plan_sent(svc, clock)
    svc.import_csv((H + "9001,מיכל לוי,050-0000999,m@x.example,1200,פתוח,01/10/26,15/10/26\n").encode())
    r, body = _accept(svc)
    assert body == "" and "plan_accept_contact_changed" in r["tags"]
    assert "פרטי הקשר" in r["owner_summary"] and "מיכל" not in r["owner_summary"]
    assert not [d for d in _drafts(svc) if d["status"] in ("pending_approval", "approved")]


def test_contact_card_handled_back_to_normal(svc, clock):
    _plan_sent(svc, clock)
    svc.import_csv((H + "9001,מיכל לוי,050-0000999,m@x.example,1200,פתוח,01/10/26,15/10/26\n").encode())
    svc.db.x("UPDATE messages SET needs_owner=0 WHERE intent='csv_contact_plan'")
    r, body = _accept(svc)
    assert "plan_accept_contact_changed" not in r["tags"] and "400" in body
