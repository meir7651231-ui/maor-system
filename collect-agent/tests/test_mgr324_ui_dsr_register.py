"""מנהל 324 · מרשם בקשות עיון/תיקון/מחיקה (חוק הגנת הפרטיות §13–14) גם בדשבורד הפשוט (/ui).

עד היום המרשם היה רק ב-/app/ (מנהל 321, critic 172). בעל עסק שעובד רק ב-/ui (גם demo.sh בלי build) קיבל התראת
«📄 בקשת עיון/מחיקה», ו«✓ טופל» סגר רק את ההודעה ⇒ הבקשה נשארה open, וההתראות «5 ימים לפני»/«באיחור» המשיכו.
עכשיו: כרטיס «בקשות פרטיות פתוחות» מ-GET /dsr, וסגירה עם תיעוד ≥5 תווים ב-POST /dsr/{id}/done.
ההתנהגות נבדקת בדפדפן מול שרת אמיתי ב-web/e2e/ui-dsr.mjs (רץ ב-CI); כאן הגנת-מקור + חוזה השרת שה-UI נשען עליו.
"""
from __future__ import annotations

import re
from datetime import timedelta
from pathlib import Path

from app import dsr

ROOT = Path(__file__).resolve().parent.parent
UI = (ROOT / "app/ui.html").read_text(encoding="utf-8")
WF = (ROOT.parent / ".github/workflows/collect-agent.yml").read_text(encoding="utf-8")


def test_dashboard_loads_dsr_register():
    m = re.search(r"async function loadDash\(ask\)\{(.*?)\n\}", UI, re.S)
    assert m and "await loadDsr()" in m.group(1), "/ui לא טוען את מרשם הבקשות עם הדשבורד"
    assert 'api("/dsr",{},false)' in UI and 'r.status==="open"' in UI


def test_close_posts_note_and_requires_min_length():
    assert "/dsr/${id}/done" in UI and "JSON.stringify({note})" in UI
    m = re.search(r"function btnsDsr\(\)\{(.*?)\n\$\(", UI, re.S)
    assert m and ".trim().length<DSR_MIN" in m.group(1), "«סגירה» לא כבויה בלי תיעוד"
    assert re.search(r"DSR_MIN=5\b", UI)


def test_typed_note_survives_redraw():
    assert re.search(r'a\.matches\("#dsList textarea"\)', UI), "רענון מצייר מחדש מעל תיעוד שמקלידים"
    assert "dsNote[r.id]??" in UI


def test_lock_clears_dsr_register():
    m = re.search(r"function lock\(had\)\{(.*?)\n  \$\(\"#lockMsg\"\)", UI, re.S)
    body = m.group(1) if m else ""
    assert '$("#dsList").innerHTML=""' in body and "dsItems=[]" in body and '$("#ds").hidden=' in body


def test_due_date_shown_as_israel_calendar_day():
    """critic 174: המסך מציג **תאריך** יעד בשעון ישראל — due_at ב-UTC ב-22:30 הוא כבר מחר בישראל."""
    assert 'timeZone:"Asia/Jerusalem"' in re.search(r"const ddmm=.*?\};", UI, re.S).group(0)


def test_days_left_wording_matches_server_contract(svc, clock):
    """ה-UI מציג days_left/overdue של השרת כמו שהם: 0 = «היום האחרון», שלילי = «באיחור»."""
    assert '"היום האחרון להשיב"' in UI and "באיחור של ${-d}" in UI
    rid = dsr.open_request(svc, None, "access", "owner")
    clock.now += timedelta(days=30)
    row = next(r for r in dsr.listing(svc) if r["id"] == rid)
    assert row["days_left"] == 0 and not row["overdue"]
    clock.now += timedelta(days=1)
    row = next(r for r in dsr.listing(svc) if r["id"] == rid)
    assert row["days_left"] == -1 and row["overdue"]


def test_browser_check_runs_in_ci():
    assert (ROOT / "web/e2e/ui-dsr.mjs").is_file()
    assert "node e2e/ui-dsr.mjs" in WF
