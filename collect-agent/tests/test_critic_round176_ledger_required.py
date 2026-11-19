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


def test_explicit_ack_allows_start_without_ledger(monkeypatch, tmp_path):
    """חריגה רק בהחלטה מפורשת — כמו ACK_PLAINTEXT_DB."""
    _real_env(monkeypatch, tmp_path)
    monkeypatch.delenv("OPTOUT_LEDGER", raising=False)
    monkeypatch.setenv("ACK_NO_OPTOUT_LEDGER", "1")
    create_app(owner_token=OWNER_TOKEN)


def test_ack_value_must_be_exactly_1(monkeypatch, tmp_path):
    _real_env(monkeypatch, tmp_path)
    monkeypatch.delenv("OPTOUT_LEDGER", raising=False)
    monkeypatch.setenv("ACK_NO_OPTOUT_LEDGER", "true")
    with pytest.raises(SafetyError, match="OPTOUT_LEDGER"):
        create_app(owner_token=OWNER_TOKEN)


def test_ledger_dir_missing_fails_closed(monkeypatch, tmp_path):
    """תיקייה שלא קיימת ⇒ כל הסרה הייתה נכשלת ביומן. לא עולים (ולא מגלים רק בשחזור)."""
    _real_env(monkeypatch, tmp_path)
    monkeypatch.setenv("OPTOUT_LEDGER", str(tmp_path / "nope" / "optout.jsonl"))
    with pytest.raises(SafetyError, match="לכתיבה"):
        create_app(owner_token=OWNER_TOKEN)


def test_demo_and_injected_service_unaffected(monkeypatch, tmp_path):
    """הדמו (בלי REAL_DATA_ALLOWED) עולה בלי יומן — השער רק לנתונים אמיתיים."""
    monkeypatch.delenv("REAL_DATA_ALLOWED", raising=False)
    monkeypatch.delenv("OPTOUT_LEDGER", raising=False)
    monkeypatch.setenv("DB_PATH", str(tmp_path / "demo.sqlite3"))
    create_app(owner_token=OWNER_TOKEN)


def test_ledger_write_failure_reaches_owner_once(svc, tmp_path):
    """חלק ב׳: כשל כתיבה ליומן ⇒ כרטיס אחד ב«דורש טיפול» (בלי כתובת), ולא כפול כל עוד פתוח; ההסרה ב-DB נשמרת."""
    import dataclasses
    svc.s = dataclasses.replace(svc.s, optout_ledger=str(tmp_path / "missing-dir" / "optout.jsonl"))
    svc.suppress("sms", "0521234567", "opt_out")
    svc.suppress("email", "dana@example.com", "opt_out")
    rows = svc.db.q("SELECT body, customer_id FROM messages WHERE intent='optout_ledger_failed' AND needs_owner=1")
    assert len(rows) == 1
    assert rows[0]["customer_id"] is None
    assert "0521234567" not in rows[0]["body"] and "dana@" not in rows[0]["body"]
    assert svc.db.one("SELECT count(*) FROM suppressions")[0] == 2
    assert svc.db.one("SELECT count(*) FROM audit WHERE action='optout_ledger_failed'")[0] == 2


def test_ledger_ok_no_card(svc, tmp_path):
    import dataclasses
    svc.s = dataclasses.replace(svc.s, optout_ledger=str(tmp_path / "optout.jsonl"))
    svc.suppress("sms", "0521234567", "opt_out")
    assert not svc.db.one("SELECT 1 FROM messages WHERE intent='optout_ledger_failed'")
    assert (tmp_path / "optout.jsonl").exists()
