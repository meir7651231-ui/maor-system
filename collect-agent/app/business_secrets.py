"""אחסון סודות של עסק (מפתח API של חשבונית ירוקה, טוקן 019/InforU, סיסמת SMTP, מפתחות webhook).

הדרך **היחידה** לשמור סוד של עסק ב-DB. כל ערך עובר `SecretBox` (AES-256-GCM, הקשר
`biz:{id}:{field}`), ובטבלה יש רק צופן. בלי `COLLECT_MASTER_KEYS` ⇒ `SecretError` (נכשל סגור:
אין שמירה בטקסט גלוי "זמנית"). נאכף בבדיקות: שום קובץ אחר לא כותב לטבלה הזו, והקובץ
הפיזי של ה-DB לא מכיל את הסוד.

שלב 1: אין קליטת סודות אמיתיים (אין UI/API לזה). המודול מוכן כדי שהחיבור העתידי
("כל עסק מחבר חשבון משלו ב-API key שלו") יעבור דרכו כבר מהיום הראשון.
"""
from __future__ import annotations

from .secretbox import Secret, SecretBox, SecretError, context_for

SCHEMA = """
CREATE TABLE IF NOT EXISTS business_secrets (
  business_id INTEGER NOT NULL,
  field TEXT NOT NULL,
  ciphertext TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (business_id, field)
);
"""

FIELDS = frozenset({"gi_api_id", "gi_api_secret", "sms_token", "sms_username", "smtp_password",
                    "email_api_key", "sms_webhook_key", "email_webhook_key", "gi_webhook_key",
                    # מקורות חשבוניות נוספים (app/integrations/sources.py) — קריאה בלבד
                    "icount_api_token", "rivhit_api_token", "ezcount_api_key",
                    "ezcount_developer_email", "source_webhook_key",
                    # סוד-המסירה מאורביט (app/orbit_connect.py) — פר-ארגון, מונפק ע״י בעל העסק
                    "orbit_handoff_secret"})


class BusinessSecrets:
    def __init__(self, db, box: SecretBox) -> None:
        if not isinstance(box, SecretBox):
            raise SecretError("נדרש SecretBox — אין שמירת סודות בלי הצפנה")
        self.db, self.box = db, box
        db.conn.executescript(SCHEMA)

    def _check(self, field: str) -> None:
        if field not in FIELDS:
            raise SecretError(f"שדה סוד לא מוכר: {field}")

    def put(self, business_id: int, field: str, value: str | Secret, *, at: str) -> None:
        self._check(field)
        raw = value.reveal() if isinstance(value, Secret) else value
        if not raw:
            raise SecretError("ערך ריק")
        ct = self.box.encrypt(raw, context=context_for(business_id, field))
        self.db.x("INSERT INTO business_secrets(business_id,field,ciphertext,updated_at) "
                  "VALUES(?,?,?,?) ON CONFLICT(business_id,field) DO UPDATE SET "
                  "ciphertext=excluded.ciphertext, updated_at=excluded.updated_at",
                  (business_id, field, ct, at))

    def get(self, business_id: int, field: str) -> Secret | None:
        self._check(field)
        row = self.db.one("SELECT ciphertext FROM business_secrets WHERE business_id=? "
                          "AND field=?", (business_id, field))
        return self.box.decrypt(row["ciphertext"], context=context_for(business_id, field)) \
            if row else None

    def fields(self, business_id: int) -> list[str]:
        """אילו סודות מוגדרים (לתצוגה בהגדרות) — שמות בלבד, לעולם לא ערכים."""
        return [r["field"] for r in self.db.q(
            "SELECT field FROM business_secrets WHERE business_id=? ORDER BY field",
            (business_id,))]

    def rotate_all(self, *, at: str) -> int:
        """אחרי הוספת מפתח חדש ל-COLLECT_MASTER_KEYS: הצפנה מחדש בהדרגה."""
        n = 0
        for r in self.db.q("SELECT business_id, field, ciphertext FROM business_secrets"):
            if self.box.needs_rotation(r["ciphertext"]):
                ctx = context_for(r["business_id"], r["field"])
                self.db.x("UPDATE business_secrets SET ciphertext=?, updated_at=? "
                          "WHERE business_id=? AND field=?",
                          (self.box.rotate(r["ciphertext"], context=ctx), at,
                           r["business_id"], r["field"]))
                n += 1
        return n

    def delete(self, business_id: int, field: str) -> None:
        """מחיקת סוד יחיד (ביטול קישור). שאר הסודות של העסק נשארים."""
        self._check(field)
        self.db.x("DELETE FROM business_secrets WHERE business_id=? AND field=?",
                  (business_id, field))

    def delete_business(self, business_id: int) -> None:
        self.db.x("DELETE FROM business_secrets WHERE business_id=?", (business_id,))
