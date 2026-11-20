"""מנהל 325 · critic סבב 177 (🟠×2): עצירת שליחה אחרי שחזור מגיבוי (restore_hold, `ae6a7db1`) — שקטה ובלי מסך שחרור.

א. «✓ טופל» על הכרטיס «🛑 המערכת שוחזרה מגיבוי» הוריד אותו — והעצירה נשארה, בלי סימן בדשבורד ⇒ גבייה
   עצורה לתמיד בשקט. עכשיו: כל עוד העצירה פעילה הכרטיס **לא נסגר** ב«טופל» (done=False + audit, לא חריגה),
   ו-`/dashboard` (גם `view=list` של /ui) מחזיר `restore_hold` לבאנר קבוע.
ב. השחרור היה API בלבד. עכשיו: באנר אדום + תיעוד ≥5 + «חידוש השליחה» ב-/app/ (`RestoreHoldBanner`) וב-/ui (`#rh`).
"""
from __future__ import annotations

import re
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN
from tests.test_restore_guard import _restored

ROOT = Path(__file__).resolve().parent.parent
UI = (ROOT / "app/ui.html").read_text(encoding="utf-8")


def _card(s):
    return s.db.one("SELECT id, needs_owner FROM messages WHERE intent='restore_hold' ORDER BY id DESC LIMIT 1")


def test_done_keeps_card_while_hold_active(svc, clock, tmp_path):
    s2, _ = _restored(svc, clock, tmp_path)
    out = s2.owner_message_done(_card(s2)["id"])
    assert out["done"] is False and out["restore_hold"] is True
    assert _card(s2)["needs_owner"] == 1 and s2.restore_hold()
    assert s2.db.one("SELECT 1 FROM audit WHERE action='owner_message_done_refused' AND detail LIKE '%restore_hold%'")


def test_release_clears_card_and_dashboard(svc, clock, tmp_path):
    s2, _ = _restored(svc, clock, tmp_path)
    assert s2.dashboard()["restore_hold"]["restored_at"]
    assert s2.dashboard("list")["restore_hold"]["restored_at"], "/ui (view=list) לא רואה את העצירה"
    s2.release_restore_hold("החלתי מחדש את ההסרות")
    assert _card(s2)["needs_owner"] == 0
    assert s2.dashboard()["restore_hold"] is None and s2.dashboard("list")["restore_hold"] is None


def test_dashboard_carries_ledger_count(svc, clock, tmp_path):
    s2, rep = _restored(svc, clock, tmp_path)
    assert rep["reapplied"] >= 1
    assert s2.dashboard()["restore_hold"]["ledger_applied"] == rep["reapplied"]


def test_fresh_db_dashboard_has_no_hold(svc):
    assert svc.dashboard()["restore_hold"] is None and svc.dashboard("list")["restore_hold"] is None


def test_other_cards_still_close(svc, clock, tmp_path):
    s2, _ = _restored(svc, clock, tmp_path)
    s2.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,message_id,created_at) "
            "VALUES(NULL,'system','owner','x','max_reminders',1,'mx:1','2026-11-19T10:00:00+00:00')")
    mid = s2.db.one("SELECT id FROM messages WHERE message_id='mx:1'")["id"]
    assert s2.owner_message_done(mid)["done"] is True


def test_http_done_then_release(svc, clock, tmp_path):
    s2, _ = _restored(svc, clock, tmp_path)
    api = TestClient(create_app(s2, owner_token=OWNER_TOKEN), headers=AUTH)
    r = api.post(f"/owner/inbox/{_card(s2)['id']}/done")
    assert r.status_code == 200 and r.json()["done"] is False
    assert api.get("/dashboard?view=list").json()["restore_hold"]
    assert api.post("/owner/restore-hold/release", json={"note": "בדקתי את כל ההסרות"}).status_code == 200
    assert api.get("/dashboard?view=list").json()["restore_hold"] is None


# ---------- /ui (הגנת מקור; ההתנהגות בדפדפן: web/e2e/ui-restore-hold.mjs) ----------
def test_ui_draws_hold_from_dashboard():
    m = re.search(r"async function loadDash\(ask\)\{(.*?)\n\}", UI, re.S)
    assert m and "rhHold=d.restore_hold||null;drawHold()" in m.group(1)


def test_ui_release_posts_note_with_min():
    assert 'api("/owner/restore-hold/release",{method:"POST"' in UI and "JSON.stringify({note})" in UI
    assert re.search(r"RH_MIN=5\b", UI)
    m = re.search(r"function btnHold\(\)\{(.*?)\}\n", UI)
    assert m and ".trim().length<RH_MIN" in m.group(1)


def test_ui_lock_clears_hold():
    m = re.search(r"function lock\(had\)\{(.*?)\n  \$\(\"#lockMsg\"\)", UI, re.S)
    assert m and 'rhHold=null' in m.group(1) and '$("#rhNote").value=""' in m.group(1)


def test_app_banner_wired():
    dash = (ROOT / "web/src/pages/Dashboard.tsx").read_text(encoding="utf-8")
    assert "<RestoreHoldBanner />" in dash
    assert "n.intent === 'restore_hold'" in dash, "כרטיס restore_hold ב-/app/ עדיין מציג «✓ טופל»"
