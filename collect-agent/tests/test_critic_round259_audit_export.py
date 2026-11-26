"""מבקר סבב 259 · 🟡 — התנאים מבטיחים ייצוא בסיום ההתקשרות («30 יום לייצוא», «היומן מיוצא לעסק לפני המחיקה»), אבל אין
במוצר דרך לייצא את יומן הביקורת המלא: `GET /audit` מחזיר תמיד 200 שורות אחרונות, ואין ייצוא של העסק כולו.

רכיבים: `app/main.py` → `audit()` (`SELECT * FROM audit ORDER BY id DESC LIMIT 200`, בלי פרמטרים/דפדוף) · אין נתיב
ייצוא עסקי (`/export`, `/audit.csv` ⇒ 404); קיים רק ייצוא פר-לקוח לבקשת עיון (`GET /customers/{cid}/data`, DPA 9.1א).
מסמכים: `legal/TERMS.md` §9 «אחרי הסיום תוכלו לייצא את הנתונים שלכם במשך 30 יום» ו-§9 (DPA) «היומן מיוצא לעסק לפני
המחיקה»; `legal/DPA.md` 4.3 «בסיום ההתקשרות: 30 יום לייצוא, ואז מחיקה תוך 90 יום».
תרחיש: 350 שורות audit ⇒ `/audit`, `/audit?limit=10000`, `?all=1`, `?page=2`, `?before=100` ⇒ כולם 200 שורות.
✓ 258 (מנהל 428) תוקן — dsr.sweep לפני שער הניסיון; קובצי המבקר לא נמחקו (153). ℹ️ שירות שה-cron שלו לא רץ — אין
מסלול אחר ל-dsr.sweep (`/maintenance/purge` מריץ רק התממה).
הצעה: ייצוא עסקי לבעל העסק בלבד (יומן מלא + לקוחות/חשבוניות/הודעות, בלי סודות) עם audit, או תיקון הנוסח במסמכים אם
הייצוא נעשה ע״י המפעיל. xfail(strict=True)."""
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN


def test_owner_can_export_full_audit_log(svc):
    for i in range(350):
        svc.audit("system", "probe", {"i": i})
    total = svc.db.one("SELECT COUNT(*) n FROM audit")["n"]
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    seen = set()
    for q in ("", "?limit=100000", "?all=1"):
        r = api.get("/audit" + q, headers=AUTH)
        if r.status_code == 200:
            seen |= {row["id"] for row in r.json()}
    assert len(seen) == total, (len(seen), total)
