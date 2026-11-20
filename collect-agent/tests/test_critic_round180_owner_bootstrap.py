"""critic סבב 180 · 🟠 לתיקון בונה — רכיב: `app/users.py` → `Users._bootstrap_owner` (רץ **בכל** `Users(...)` = בכל
עליית שרת, לא רק במיגרציה) + `Users.deactivate` (בלי השמירה של `set_role`) — תיקון 179 ב-`f68e9ffa`.

`set_role` מסרב להוריד את הבעלים הפעיל האחרון («קודם מנו בעלים אחר»), אבל `deactivate` של אותו בעלים מותר —
ובעלייה הבאה `_bootstrap_owner` **מקדם בשקט את העובד הוותיק** לבעלים: בלי audit, בלי הודעה. [מאומת: owner+staff ⇒
deactivate(owner) ⇒ Users() ⇒ staff.role='owner', audit ריק.] עובד מקבל את ההרשאה היחידה שמוגבלת לבעלים (שחרור עצירת
שחזור — «החלתי מחדש הסרות») בלי שאיש החליט על כך; ואם הבעלים יופעל מחדש — שני בעלים.
הצעה: הבוטסטרפ רק במיגרציה (כשעמודת role נוספה עכשיו), `deactivate` של הבעלים האחרון ⇒ ValueError כמו `set_role`,
ו-audit לכל שינוי תפקיד. xfail(strict=True); הבקרה (הראשון = בעלים, השני = עובד) נשארת ירוקה."""
import pytest

from app.users import Users

PW = "correct-horse-battery-9"


@pytest.mark.xfail(strict=True, reason="critic 180: השבתת הבעלים ⇒ עובד מקודם לבעלים בשקט בעלייה הבאה")
def test_deactivating_owner_does_not_silently_promote_staff(svc):
    u = Users(svc.db, svc.clock)
    u.create("owner@s.example", "בעלים", PW)
    u.create("staff@s.example", "עובד", PW)
    try:
        u.deactivate("owner@s.example")
    except ValueError:
        return                                            # גם זה תיקון תקין: אין להשבית את הבעלים האחרון
    Users(svc.db, svc.clock)                              # עליית שרת
    assert svc.db.one("SELECT role FROM users WHERE email='staff@s.example'")["role"] == "staff"


def test_control_first_user_is_owner(svc):
    u = Users(svc.db, svc.clock)
    assert u.create("owner@s.example", "בעלים", PW)["role"] == "owner"
    assert u.create("staff@s.example", "עובד", PW)["role"] == "staff"
