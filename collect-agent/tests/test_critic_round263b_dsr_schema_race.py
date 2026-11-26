"""מבקר סבב 263ב · 🟠 — `dsr.ensure_schema` מריץ `db.conn.executescript(SCHEMA)` **בלי `db.lock`**. `executescript` של
sqlite מבצע COMMIT לטרנזקציה הפתוחה על אותו חיבור ⇒ `GET /dsr` (או כל open/close/sweep) בזמן ש-thread אחר בתוך
`db.batch()` (סנכרון/ייבוא CSV — «הכול או כלום», critic 37/38) מתחייב בחצי-טרנזקציה של ה-thread האחר.

רכיבים: `app/dsr.py` → `ensure_schema` (נקרא מ-`listing`/`open_request`/`close_request`/`sweep`) ·
`app/db.py` → `DB.lock` (RLock שכל `q`/`one`/`x`/`update`/`batch` לוקחים) ·
השוואה: `orbit_connect`/`orbit_entitlement`/`users`/`inbox` עוטפים
את ה-executescript ב-`with db.lock`. גם `business_secrets.__init__` בלי נעילה (לא נבדק בהרצה).
תרחיש (הבדיקה): thread A בתוך `db.batch()` מוסיף שורת audit; thread B קורא `dsr.listing(svc)`; A זורק ⇒ rollback — השורה
**נשארת** (B ביצע COMMIT באמצע). FastAPI מריץ נקודות קצה סינכרוניות ב-threadpool ⇒ `/dsr` מהמסך במקביל לסנכרון.
בשטח (e2e): «500 GET /dsr» ב-`live` (סבב 263) ו-500 ב-`app-staff-owner-only` (262) — חולפים, תחת עומס.
✓ 263 (הסרה בירושה מוצגת «ביקש») — ממצא נפרד בקובץ test_critic_round263_inherited_optout_label.
הצעה: `with db.lock:` + `db.conn.commit()` כמו `orbit_entitlement.ensure_schema`, ועדיף להריץ את הסכמה פעם אחת באתחול
ולא בכל בקשה. xfail(strict=True)."""
import threading

import pytest

from app import dsr


def test_dsr_listing_does_not_commit_another_threads_batch(svc):
    svc.sync()
    started, done = threading.Event(), threading.Event()
    errs: list[str] = []

    def other():
        started.wait()
        try:
            dsr.listing(svc)
        except Exception as e:  # noqa: BLE001
            errs.append(repr(e))
        done.set()

    t = threading.Thread(target=other)
    t.start()
    with pytest.raises(RuntimeError):
        with svc.db.batch():
            svc.db.x("INSERT INTO audit(at,actor,action,detail) VALUES('x','x','probe263b','{}')")
            started.set()
            done.wait(1)   # B מבצע COMMIT לפני שהוא נחסם על ה-lock (ש-A מחזיק)
            raise RuntimeError("rollback")
    t.join()
    assert not svc.db.one("SELECT 1 FROM audit WHERE action='probe263b'"), ("rollback לא בוטל", errs)
