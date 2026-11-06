"""הצפנת סודות במנוחה (envelope פשוט, AES-256-GCM).

מה מוצפן כאן: סודות של כל עסק — מפתח/סוד Green Invoice, טוקן ספק ה-SMS,
סיסמת SMTP/מפתח ספק המייל. **לא** נתוני לקוחות (הם ב-DB, שמוגן בהרשאות קובץ
ובשלב 2 בהצפנת-דיסק של ספק הענן).

עקרונות:
  • המפתח הראשי (KEK) **מחוץ ל-DB** — משתנה סביבה `COLLECT_MASTER_KEYS`
    (בשלב 2: KMS / Secret Manager). אף פעם לא בריפו, לא בלוג.
  • כל צופן קשור להקשר (AAD), למשל "biz:12:gi_secret" ⇒ אי אפשר להעתיק
    צופן של עסק אחד לשורה של עסק אחר (או משדה לשדה) — הפענוח ייכשל.
  • רוטציה: `COLLECT_MASTER_KEYS="k2:<b64>,k1:<b64>"` — הראשון מצפין, כולם מפענחים.
    `needs_rotation` + `rotate` להצפנה מחדש בהדרגה.
  • נכשל סגור: מפתח חסר/קצר/פגום ⇒ SecretError, לעולם לא "ממשיכים בלי הצפנה".

פורמט הצופן: ``v1.<kid>.<base64url(nonce12 || ciphertext+tag)>``
"""
from __future__ import annotations

import base64
import os
import re
from dataclasses import dataclass

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ENV_VAR = "COLLECT_MASTER_KEYS"
VERSION = "v1"
_KID_RE = re.compile(r"^[A-Za-z0-9_-]{1,16}$")


class SecretError(RuntimeError):
    """כשל הצפנה/פענוח. ההודעה לעולם לא כוללת את הסוד או המפתח."""


def _b64d(s: str) -> bytes:
    s = s.strip()
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def _b64e(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode("ascii")


def generate_key() -> str:
    """מפתח חדש (base64url, 32 בייט). להדפסה חד-פעמית ולשמירה במנהל-סודות."""
    return _b64e(AESGCM.generate_key(bit_length=256))


class Secret:
    """עטיפה לסוד בזיכרון: repr/str לא חושפים אותו (מגן מפני דליפה ללוגים/traceback)."""

    __slots__ = ("_v",)

    def __init__(self, value: str) -> None:
        self._v = value

    def reveal(self) -> str:
        return self._v

    def __repr__(self) -> str:
        return "Secret('***')"

    __str__ = __repr__

    def __bool__(self) -> bool:
        return bool(self._v)


@dataclass(frozen=True)
class SecretBox:
    keys: tuple[tuple[str, bytes], ...]  # (kid, key) — הראשון = פעיל

    def __post_init__(self) -> None:
        if not self.keys:
            raise SecretError("אין מפתח הצפנה")
        seen: set[str] = set()
        for kid, key in self.keys:
            if not _KID_RE.match(kid):
                raise SecretError("מזהה מפתח לא תקין")
            if kid in seen:
                raise SecretError(f"מזהה מפתח כפול: {kid}")
            seen.add(kid)
            if len(key) != 32:
                raise SecretError(f"מפתח {kid}: נדרשים 32 בייט (AES-256)")

    def __repr__(self) -> str:  # לא להדפיס מפתחות
        return f"SecretBox(kids={[k for k, _ in self.keys]})"

    # ---------- construction ----------
    @classmethod
    def from_spec(cls, spec: str) -> SecretBox:
        """'k2:<b64>,k1:<b64>' ⇒ SecretBox. שגיאה לא חושפת את החומר."""
        pairs = []
        for part in (spec or "").split(","):
            part = part.strip()
            if not part:
                continue
            kid, sep, b64 = part.partition(":")
            if not sep:
                raise SecretError("פורמט מפתח: kid:base64")
            try:
                key = _b64d(b64)
            except ValueError:  # binascii.Error יורש מ-ValueError
                raise SecretError(f"מפתח {kid}: base64 לא תקין") from None
            pairs.append((kid.strip(), key))
        return cls(tuple(pairs))

    @classmethod
    def from_env(cls, env: dict[str, str] | None = None) -> SecretBox:
        e = os.environ if env is None else env
        spec = e.get(ENV_VAR, "")
        if not spec.strip():
            raise SecretError(f"{ENV_VAR} לא מוגדר — אין שמירת סודות בלי מפתח (נכשל סגור)")
        return cls.from_spec(spec)

    # ---------- API ----------
    @property
    def active_kid(self) -> str:
        return self.keys[0][0]

    def _key(self, kid: str) -> bytes:
        for k, v in self.keys:
            if k == kid:
                return v
        raise SecretError(f"מפתח לא מוכר: {kid}")

    def encrypt(self, plaintext: str | Secret, *, context: str) -> str:
        if not context:
            raise SecretError("חובה הקשר (AAD), למשל 'biz:12:gi_secret'")
        pt = plaintext.reveal() if isinstance(plaintext, Secret) else plaintext
        nonce = os.urandom(12)
        ct = AESGCM(self._key(self.active_kid)).encrypt(
            nonce, pt.encode("utf-8"), context.encode("utf-8"))
        return f"{VERSION}.{self.active_kid}.{_b64e(nonce + ct)}"

    def decrypt(self, token: str, *, context: str) -> Secret:
        ver, kid, blob = self._split(token)
        try:
            raw = _b64d(blob)
        except ValueError:  # binascii.Error יורש מ-ValueError
            raise SecretError("צופן פגום") from None
        if len(raw) < 12 + 16:
            raise SecretError("צופן קצר מדי")
        try:
            pt = AESGCM(self._key(kid)).decrypt(raw[:12], raw[12:], context.encode("utf-8"))
        except InvalidTag:
            raise SecretError("פענוח נכשל (מפתח/הקשר שגוי או שיבוש)") from None
        return Secret(pt.decode("utf-8"))

    def needs_rotation(self, token: str) -> bool:
        return self._split(token)[1] != self.active_kid

    def rotate(self, token: str, *, context: str) -> str:
        return self.encrypt(self.decrypt(token, context=context), context=context)

    @staticmethod
    def _split(token: str) -> tuple[str, str, str]:
        parts = (token or "").split(".")
        if len(parts) != 3 or parts[0] != VERSION:
            raise SecretError("פורמט צופן לא מוכר")
        return parts[0], parts[1], parts[2]


def context_for(business_id: int | str, field: str) -> str:
    """הקשר קנוני לשדה סוד של עסק. כל שינוי כאן = שבירת פענוח, לכן קבוע."""
    if not re.fullmatch(r"[a-z0-9_]{1,40}", field):
        raise SecretError("שם שדה לא תקין")
    return f"biz:{business_id}:{field}"


if __name__ == "__main__":  # python -m app.secretbox ⇒ מפתח חדש
    print(f"k1:{generate_key()}")
