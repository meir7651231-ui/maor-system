"""הפעלה 232 · critic סבב 95: /ui בלי דרך לקרוא/לענות להודעת לקוח.

לקוח כתב משהו ⇒ טיוטה/כרטיס בתור ⇒ awaiting_owner עוצר את התזכורות אליו. /ui הציג רק «הלקוח כתב לכם» — בלי
ההודעה, בלי מענה ובלי סגירה ⇒ בעל עסק שעובד רק ב-/ui (גם demo.sh בלי build) תקוע, והלקוח בלי טיפול.
עכשיו: כרטיס «הודעות מלקוחות» מ-/conversation/drafts, עם אישור (נוסח ערוך + אישור סכום חריג) וסגירה.
ההתנהגות נבדקת בדפדפן מול שרת אמיתי ב-web/e2e/ui-messages.mjs (רץ ב-CI); כאן הגנת-מקור שרצה גם בלי דפדפן.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UI = (ROOT / "app/ui.html").read_text(encoding="utf-8")
WF = (ROOT.parent / ".github/workflows/collect-agent.yml").read_text(encoding="utf-8")


def test_dashboard_loads_customer_messages():
    m = re.search(r"async function loadDash\(ask\)\{(.*?)\n\}", UI, re.S)
    assert m and "await loadMsgs()" in m.group(1), "/ui לא טוען את הודעות הלקוחות עם הדשבורד"
    assert 'api("/conversation/drafts"' in UI


def test_card_has_approve_and_close_without_blind_resume():
    for s in ('id="cm"', 'id="cmList"', 'id="cmDone"', "אישור ושליחה", "סגירה בלי מענה",
              "/conversation/drafts/${id}/${a}", "owner_summary", "confirm_amount:true"):
        assert s in UI, s
    m = re.search(r'\$\("#cmList"\)\.addEventListener\("click".*?\n// הפעלה 167', UI, re.S)
    assert m and "/resume" not in m.group(0), "אין «חידוש» עיוור מכרטיס ההודעה (critic 95)"


def test_approve_disabled_without_body_or_amount_confirmation():
    m = re.search(r"function btnsMsgs\(\)\{(.*?)\n\$\(", UI, re.S)
    assert m and "!body" in m.group(1) and "odd&&!cmAmt[id]" in m.group(1)


def test_edits_survive_redraw():
    assert re.search(r'a\.matches\("#cmList textarea"\)', UI), "רענון מצייר מחדש מעל טקסט שמקלידים"
    assert "cmBody[d.id]??" in UI


def test_awaiting_owner_points_to_card():
    assert re.search(r'awaiting_owner:"[^"]*«הודעות מלקוחות»', UI)


def test_lock_clears_customer_messages():
    """401 ⇒ lock() מוריד מהמסך גם את טקסט ההודעות ושמות הלקוחות."""
    m = re.search(r"function lock\(had\)\{(.*?)\n  \$\(\"#lockMsg\"\)", UI, re.S)
    body = m.group(1) if m else ""
    assert '$("#cmList").innerHTML=""' in body and "cmItems=[]" in body and '$("#cm").hidden=' in body


def test_browser_check_runs_in_ci():
    assert (ROOT / "web/e2e/ui-messages.mjs").is_file()
    assert "node e2e/ui-messages.mjs" in WF
