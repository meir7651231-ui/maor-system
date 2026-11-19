"""critic סבב 176 · 🟠 לתיקון בונה — רכיב: `app/main.py` → `create_app` (שערי הפריסה עם נתונים אמיתיים) מול
`app/config.py` → `optout_ledger` (תיקון 175 ב-`ae6a7db1`).

יומן ההסרות (`OPTOUT_LEDGER`) הוא מה שמאפשר לשחזור גיבוי להחזיר הסרות שהתבקשו אחריו — אבל ברירת המחדל ריקה, הוא
לא מוגדר באף קובץ פריסה, ושרת עם `REAL_DATA_ALLOWED=1` **עולה בלעדיו בשקט** (רק `STATUS.md` אומר «להגדיר»).
במצב הזה כל `suppress()` לא נרשם ביומן; אחרי שחזור אין ממה להחיל, ובעל העסק מתבקש לאשר «החלתי מחדש הסרות מאז
הגיבוי» בלי שום מקור לדעת מה הן ⇒ אחרי השחרור — חזרה בדיוק לממצא 175 (SMS למי שביקש הסרה).
הצעה: כמו `ACK_PLAINTEXT_DB` (סבב 22) — נתונים אמיתיים בלי `OPTOUT_LEDGER` ⇒ `SafetyError`, חריגה רק בהחלטה מפורשת
(`ACK_NO_OPTOUT_LEDGER=1`), ושורה בשער הבטא. xfail(strict=True); הבקרה (עם יומן — עולה) נשארת ירוקה."""
import pytest

from app.config import SafetyError
from app.main import create_app
from tests.conftest import OWNER_TOKEN


def _real_env(monkeypatch, tmp_path):
    monkeypatch.delenv("DEMO", raising=False)
    monkeypatch.delenv("DB_ENCRYPTION", raising=False)
    monkeypatch.setenv("ACK_PLAINTEXT_DB", "1")          # שער 5 נבדק בנפרד (סבב 22)
    monkeypatch.setenv("REQUIRE_USER_LOGIN", "1")
    monkeypatch.setenv("REAL_DATA_ALLOWED", "1")
    monkeypatch.setenv("DB_PATH", str(tmp_path / "real.sqlite3"))
    monkeypatch.setenv("PAYMENT_LINK", "https://www.greeninvoice.co.il/pay/x")


@pytest.mark.xfail(strict=True, reason="critic 176: נתונים אמיתיים עולים בלי יומן הסרות ⇒ שחזור לא יחזיר הסרות")
def test_real_data_without_optout_ledger_fails_closed(monkeypatch, tmp_path):
    _real_env(monkeypatch, tmp_path)
    monkeypatch.delenv("OPTOUT_LEDGER", raising=False)
    with pytest.raises(SafetyError):
        create_app(owner_token=OWNER_TOKEN)


def test_control_real_data_with_ledger_starts(monkeypatch, tmp_path):
    _real_env(monkeypatch, tmp_path)
    monkeypatch.setenv("OPTOUT_LEDGER", str(tmp_path / "ledger" / "optout.jsonl"))
    (tmp_path / "ledger").mkdir()
    create_app(owner_token=OWNER_TOKEN)
