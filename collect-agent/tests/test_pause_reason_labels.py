"""סבב 10ב — השהיה בגלל העדפת ערוץ / שפה זרה נשמרה כ-paused_reason='unknown' ⇒ בעל העסק ראה
"מושהה עד שתבדקו" בלי לדעת למה. עכשיו סיבה ייעודית + תווית בעברית בשני הממשקים."""
from pathlib import Path

import pytest

from app.inbox import ConversationInbox

ROOT = Path(__file__).parent.parent
DANA = "050-1234567"


@pytest.fixture
def inbox(svc):
    svc.sync()
    return ConversationInbox(svc, llm=None)


@pytest.mark.parametrize("text,reason", [("לא במייל בבקשה, רק SMS", "channel_pref"),
                                         ("Я уже оплатил счёт", "foreign_language")])
def test_specific_pause_reason(inbox, svc, text, reason):
    inbox.handle("sms", DANA, text)
    assert svc.db.one("SELECT paused_reason FROM customers WHERE name='דנה כהן'")["paused_reason"] == reason


@pytest.mark.parametrize("ui", ["web/src/pages/Dashboard.tsx", "app/ui.html"])
@pytest.mark.parametrize("key", ["channel_pref", "foreign_language"])
def test_both_dashboards_label_the_reason(ui, key):
    assert f"{key}:" in (ROOT / ui).read_text(encoding="utf-8")
