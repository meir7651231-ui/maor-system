"""מבקר סבב 293 (🟡 ×2): הגבלת קצב (app/ratelimit.py, DEFAULT_RULES) מול שימוש אמיתי.

293א (גבי חיבורים) — webhook 019 = 120 בקשות לדקה **לכתובת IP**. כל ה-push-ים של 019
   (dlr / incoming_sms / blacklist) מגיעים
   מאותם שרתים ⇒ דלי אחד. אחרי שליחת בוקר ל-150+ לקוחות, 120 דיווחי מסירה בתוך דקה ממלאים את הדלי, ו«הסר» של לקוחה
   באותה דקה ⇒ **429** [מאומת]. ההערה ב-`sms019_webhook` עצמה: «עונים 200 מהר ותמיד (אחרת 019 מנסים שוב ובסוף
   מפסיקים)» — בקשת הסרה תלויה בנסיונות החוזרים של הספק. ה-webhook מאומת במפתח (k=) — ההגבלה פר-IP לא מגינה מניחוש.
293ב (גבי חיבורים) — `auth_fail` = 30 כשלים ל-5 דק׳ **לכתובת IP**, ו-`rl.blocked` חוסם **כל** בקשה מאותה כתובת — גם עם
   טוקן תקין [מאומת: 31 בקשות עם טוקן שגוי ⇒ בעל העסק עם OWNER_TOKEN תקין ⇒ 429, Retry-After 300]. מאחורי NAT משותף
   (משרד, CGNAT סלולרי) מי שמנחש טוקנים נועל את בעל העסק ואת העובדות.
✓ /p/ ציבורי: 60 לדקה לכתובת — מספיק ל-50 לקוחות (כל אחד מכתובת אחרת).
רכיב: app/ratelimit.py → DEFAULT_RULES / group_for · app/main.py → rate_limit middleware.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

BAD = {"Authorization": "Bearer wrong-token-xxxxxxxxxxxxxxxxxxxxxxxxxxxx"}


def test_valid_owner_ok_without_failures_control(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    assert api.get("/dashboard", headers=AUTH).status_code == 200


def test_guessing_is_throttled_control(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    codes = [api.get("/dashboard", headers=BAD).status_code for _ in range(31)]
    assert codes[-1] == 429


@pytest.mark.xfail(strict=True, reason="מבקר 293ב🟡: ניחוש טוקנים מאותה כתובת נועל גם את בעל העסק עם טוקן תקין")
def test_valid_owner_not_locked_out_by_guessing_on_same_ip(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    for _ in range(31):
        api.get("/dashboard", headers=BAD)
    assert api.get("/dashboard", headers=AUTH).status_code == 200


@pytest.mark.xfail(strict=True, reason="מבקר 293א🟡: «הסר» מ-019 נחסם ב-429 אחרי 120 דיווחי מסירה בדקה")
def test_optout_webhook_not_throttled_after_dlr_burst(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    for i in range(120):
        api.post("/webhooks/sms/019?k=whk-test&type=dlr", data={"status": "1", "messageId": f"m{i}"})
    r = api.post("/webhooks/sms/019?k=whk-test&type=incoming_sms",
                 data={"message": "הסר", "phone": "0501234567", "dest": "x"})
    assert r.status_code == 200
