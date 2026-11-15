"""הפעלה 214 · שער «אישור רשימת הפתוחות» בלי משטח ב-/ui.

critic סבב 79 בנה כרטיס אישור רק ב-/app/ (OpenListCard). בעל עסק שעובד בדשבורד הפשוט (/ui — גם מה ש-demo.sh
פותח כשאין build של web) לא ראה כלום: חשבונית חדשה מסנכרון/CSV ממתינה לאישור, גבי לא מתזכר עליה, ושום דבר
במסך לא אומר למה. עכשיו: open_unreviewed>0 ⇒ כרטיס עם הממתינות מ-/open-list, «עדיין פתוח»/«כבר שולם» ו«אישור»
⇒ POST /open-list/confirm. ההתנהגות נבדקת בדפדפן מול שרת אמיתי ב-web/e2e/ui-openlist.mjs (רץ ב-CI);
כאן הגנת-מקור שרצה גם בלי דפדפן.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UI = (ROOT / "app/ui.html").read_text(encoding="utf-8")
WF = (ROOT.parent / ".github/workflows/collect-agent.yml").read_text(encoding="utf-8")


def test_ui_loads_open_list_when_dashboard_counts_pending():
    assert re.search(r"loadOpen\(t\.open_unreviewed", UI), "/ui לא בודק את open_unreviewed מ-/dashboard"
    assert 'api("/open-list"' in UI


def test_ui_confirms_with_both_lists():
    assert 'api("/open-list/confirm",{method:"POST"' in UI
    assert "still_open:open,paid" in UI, "/ui לא שולח still_open+paid"


def test_ui_card_markup_and_buttons():
    for s in ('id="ol"', 'id="olList"', 'id="olOk"', 'id="olAll"', "עדיין פתוח", "כבר שולם",
              "על מה שלא סימנתם לא תצא תזכורת"):
        assert s in UI, s


def test_lock_clears_open_list():
    """401 ⇒ lock() מוריד את הנתונים מהמסך — גם את שמות הלקוחות והסכומים בכרטיס."""
    m = re.search(r"function lock\(had\)\{(.*?)\n  \$\(\"#lockMsg\"\)", UI, re.S)
    assert m and '$("#olList").innerHTML=""' in m.group(1) and '$("#ol").hidden=' in m.group(1)


def test_browser_check_runs_in_ci():
    assert (ROOT / "web/e2e/ui-openlist.mjs").is_file()
    assert "node e2e/ui-openlist.mjs" in WF
