"""critic סבב 192 · 🟠 לתיקון בונה (גבייה עיצוב) — רכיב: `web/e2e/app-email-state.mjs` (רץ ב-CI: `.github/workflows/
collect-agent.yml:224`).

ה-e2e שולח DSN **בלי** Message-ID של מייל ששלחנו (`Final-Recipient …\\nStatus: 5.1.1`) ומצפה ל-`bounce: "failed"`. מאז
תיקון 190א (`ceb012d8`) + הכרעת q22-04 (`2ddf4a71`) DSN כזה = `unverified` (השהיה + כרטיס) ⇒ **[מאומת]** המסע נופל:
`ה-bounce לא נקלט: 200 {"ok":true,"bounce":"unverified","reason":"no_message_id","review":true}` ⇒ **CI של collect-agent
אדום**. (בחלק התלונה באותו קובץ זה כבר תוקן ב-`18a771c2` — שולחים `provider_message_id` של המייל שיצא.) הצעה: גם ב-DSN
לשלוח `Original-Message-ID: <provider_message_id>` של המייל שיצא ללקוח. xfail(strict=True) על מקור ה-e2e."""
from pathlib import Path

import pytest

E2E = Path(__file__).resolve().parents[1] / "web" / "e2e" / "app-email-state.mjs"


@pytest.mark.xfail(strict=True, reason="critic 192: e2e app-email-state שולח DSN בלי Message-ID ⇒ CI אדום")
def test_e2e_bounce_carries_our_message_id():
    src = E2E.read_text(encoding="utf-8")
    start = src.index("MAILER-DAEMON@")
    dsn_call = src[start:src.index("ה-bounce לא נקלט", start)]
    assert "Message-ID" in dsn_call
