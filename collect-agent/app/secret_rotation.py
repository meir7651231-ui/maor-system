"""מבקר סבב 295🟠: סיבוב סודות-השדה של SecretBox אחרי הוספת מפתח ראשי חדש.

ה-ADR: «מוסיפים מפתח חדש ראשון ב-COLLECT_MASTER_KEYS» — אבל עד עכשיו אף קוד לא הצפין מחדש את הטוקנים הקיימים
(`business_secrets` — כולל סוד-המסירה של אורביט, ו-`users.totp_secret` — 2FA של העובדים). הוצאת המפתח שדלף אחרי
הוספת החדש ⇒ `SecretError: מפתח לא מוכר` בכל כניסה (אף אחד לא נכנס) ובכל קריאת סוד. עכשיו:
  · `rotate_secretbox_tokens(db, box)` — כל טוקן שמוצפן במפתח שאינו הפעיל מפוענח ומוצפן מחדש במפתח הפעיל, באותו
    הקשר (AAD). אידמפוטנטי: טוקן שכבר במפתח הפעיל לא נוגעים. טוקן שלא מפוענח (מפתח חסר/פגום) ⇒ לא נוגעים ונספר
    ב-`failed` — לא מוחקים סוד, לא עוצרים את השאר.
  · רץ בעליית השירות (`main.create_app`) כשיש `COLLECT_MASTER_KEYS`, ובשורת פקודה:
    `python -m app.secret_rotation` (אותה פונקציה על ה-DB של ההגדרות).
סדר בטוח לסיבוב: k2 ראשון + k1 ⇒ עלייה/הרצה (הכול עובר ל-k2) ⇒ רק אז להוציא את k1.
"""
from __future__ import annotations

from .secretbox import VERSION, SecretBox, SecretError, context_for


def _table(db, name: str) -> bool:
    return bool(db.one("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (name,)))


def _stale(box: SecretBox, token: str) -> bool:
    try:
        return box.needs_rotation(token)
    except SecretError:
        return False   # לא טוקן SecretBox (סוד גלוי בדמו) — לא שלנו


def rotate_secretbox_tokens(db, box: SecretBox, *, at: str = "") -> dict:
    """מחזיר {"business_secrets": n, "totp": n, "failed": n}."""
    out = {"business_secrets": 0, "totp": 0, "failed": 0}
    rows: list[tuple[str, str, str, tuple]] = []   # (סוג, טוקן, הקשר, מפתח-שורה)
    if _table(db, "business_secrets"):
        for r in db.q("SELECT business_id, field, ciphertext FROM business_secrets"):
            rows.append(("business_secrets", r["ciphertext"], context_for(r["business_id"], r["field"]),
                         (r["business_id"], r["field"])))
    if _table(db, "users"):
        for r in db.q("SELECT id, email, totp_secret FROM users"):
            if (r["totp_secret"] or "").startswith(VERSION + "."):
                rows.append(("totp", r["totp_secret"], f"user:{r['email']}:totp", (r["id"],)))
    for kind, token, ctx, key in rows:
        if not _stale(box, token):
            continue
        try:
            new = box.rotate(token, context=ctx)
        except SecretError:
            out["failed"] += 1
            continue
        # UPDATE מותנה בטוקן שנקרא — אם בינתיים נכתב ערך חדש (שינוי סוד/רישום מחדש של 2FA) לא דורסים אותו
        if kind == "business_secrets":
            db.x("UPDATE business_secrets SET ciphertext=?, updated_at=COALESCE(NULLIF(?, ''), updated_at) "
                 "WHERE business_id=? AND field=? AND ciphertext=?", (new, at, *key, token))
        else:
            db.x("UPDATE users SET totp_secret=? WHERE id=? AND totp_secret=?", (new, *key, token))
        out[kind] += 1
    return out


def main() -> None:   # pragma: no cover — עטיפת CLI דקה
    from datetime import datetime

    from .config import load_settings
    from .db import DB
    from .policy import TZ

    s = load_settings()
    res = rotate_secretbox_tokens(DB(s.db_path), SecretBox.from_env(), at=datetime.now(TZ).isoformat())
    print(res)
    if res["failed"]:
        raise SystemExit("חלק מהטוקנים לא פוענחו — אל תוציאו את המפתח הישן עד שזה מטופל")


if __name__ == "__main__":   # pragma: no cover
    main()
