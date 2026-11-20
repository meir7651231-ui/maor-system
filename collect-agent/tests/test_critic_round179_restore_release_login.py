"""critic סבב 179 · 🔴 לתיקון בונה — רכיב: `app/main.py` → `restore_hold_release`
(`if request.state.actor != "owner": 403`) מול `owner()` כש-`REQUIRE_USER_LOGIN=1`.

בבטא אמיתית (`REAL_DATA_ALLOWED=1`) השער מחייב `REQUIRE_USER_LOGIN=1` (שער 6), ואז הטוקן המשותף **סגור** ⇒ כל בקשה
מאומתת היא של עובד מחובר, ו-`request.state.actor` הוא **המייל שלו**, אף פעם לא `"owner"`. לכן אחרי שחזור גיבוי
**אף אחד** לא יכול לשחרר את עצירת השליחה: בעל העסק נכנס עם שם משתמש+2FA ומקבל 403 «רק בעל העסק…», ובמסך
(`RestoreHoldBanner` / `holdOwnerOnly`) מוצג לו «רק בעל העסק (בכניסה עם קוד הגישה של העסק)» — קוד שבבטא סגור.
התוצאה בפרודקשן: אחרי כל שחזור הגבייה נעצרת **לתמיד**. [מאומת בהרצה: REQUIRE_USER_LOGIN=1, כניסה+TOTP ⇒ 403.]
הצעה: תפקיד בעלים לעובד (`users.role='owner'`, או מייל בעל העסק בהגדרות) ו-`actor` שמכבד אותו; השער בודק תפקיד ולא
מחרוזת. xfail(strict=True); הבקרה (בלי REQUIRE_USER_LOGIN, הטוקן המשותף ⇒ owner ⇒ שחרור עובד) נשארת ירוקה."""
import pytest
from fastapi.testclient import TestClient

from app import restore_guard, totp
from app.main import create_app
from app.users import Users
from tests.conftest import AUTH, OWNER_TOKEN

PW = "correct-horse-battery-9"


def _hold(svc):
    restore_guard.mark_restored(svc.db.conn, at="2026-11-08T10:00:00+02:00", source="b.gbk", ledger_rows=1, applied=0)


@pytest.mark.xfail(strict=True, reason="critic 179: בבטא (REQUIRE_USER_LOGIN=1) אף אחד לא יכול לשחרר עצירת שחזור")
def test_business_owner_can_release_with_login(svc, clock, monkeypatch):
    reg = Users(svc.db, svc.clock).create("owner@studio.example", "בעל העסק", PW)
    _hold(svc)
    monkeypatch.setenv("REQUIRE_USER_LOGIN", "1")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    code = totp.code_at(reg["totp_secret"], clock().timestamp())
    tok = api.post("/auth/login", json={"email": "owner@studio.example", "password": PW, "code": code}).json()["token"]
    r = api.post("/owner/restore-hold/release", json={"note": "עברתי על ההסרות מאז הגיבוי"},
                 headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 200, r.text


def test_control_shared_token_owner_can_release(svc, monkeypatch):
    _hold(svc)
    monkeypatch.delenv("REQUIRE_USER_LOGIN", raising=False)
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    assert api.post("/owner/restore-hold/release", json={"note": "עברתי על ההסרות מאז הגיבוי"},
                    headers=AUTH).status_code == 200
