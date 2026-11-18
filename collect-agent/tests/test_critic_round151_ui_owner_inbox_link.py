"""critic סבב 151 · פער /ui מול /app/: ב-/ui מוצג KPI «דורש טיפול שלך: N» (ספירת `messages.needs_owner` — התראת
«הגדרות רגישות שונו», זיכוי לבדיקה, פניות דחופות משולח לא מוכר / כתובת משותפת…) — אבל **אין רשימה ואין קישור**:
בעל עסק שעובד ב-/ui רואה מספר שאי אפשר לפעול עליו. עכשיו: כש-N>0 מוצגת הערה עם קישור ל-/app/#/dashboard
(אותו origin ואותו מפתח sessionStorage ⇒ בלי כניסה מחדש)."""
from pathlib import Path

UI = (Path(__file__).resolve().parents[1] / "app" / "ui.html").read_text(encoding="utf-8")


def test_ui_links_owner_inbox_to_app():
    assert 'id="oiNote"' in UI, "אין הערת «דורש טיפול שלך» עם קישור ב-/ui"
    assert 'href="/app/#/dashboard"' in UI
    assert "t.owner_inbox" in UI.split('id="oiNote"')[0] or "oiNote" in UI.split("t.owner_inbox", 1)[1]
