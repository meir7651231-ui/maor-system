"""מבקר סבב 295 (🟠, גבי מנוע): אין מסלול לסובב את סודות-השדה (SecretBox) — הוצאת מפתח שדלף נועלת את כולם.

✓ אימות 294 (מנהל 473): gc עד סימן-מים + פינוי LRU (תקרה קשיחה), IPv6 ⇒ /64, IPv4-mapped ⇒ IPv4, «unknown» כפי שהוא;
   ההגבלה לכתובת אחת עדיין חוסמת אחרי 60. ✓ ℹ️ 292 (0ec446f8): הסרה ע״י עובדת נרשמת עם המבצע.
[מאומת] INCIDENT-RUNBOOK §2: «לסובב את מפתח secretbox — דורש הצפנה מחדש של business_secrets». ADR: «מוסיפים מפתח חדש
ראשון ב-COLLECT_MASTER_KEYS». אבל אף קוד/CLI לא קורא ל-`BusinessSecrets.rotate_all`, ולסוד ה-TOTP של העובדים
(`users.totp_secret` = `v1.k1.…`) אין מסלול סיבוב בכלל; `db_encrypt --rekey` מטפל רק בקובץ ה-DB. תרחיש: מפתח k1 דלף ⇒
`COLLECT_MASTER_KEYS=k2,k1` (כניסה עובדת) ⇒ הוצאת k1 ⇒ `Users.login` של בעל העסק ⇒ `SecretError: מפתח לא מוכר: k1`
(אף אחד לא נכנס), וסוד-המסירה של אורביט ⇒ `SecretError`. כלומר: או להשאיר את המפתח שדלף לתמיד, או לנעול את העסק.
מצופה: כלי/שלב עלייה שמצפין מחדש את כל טוקני SecretBox (business_secrets + TOTP) למפתח הפעיל, ואחריו הוצאת k1 בטוחה.
רכיב: app/business_secrets.py → rotate_all (לא נקרא) · app/users.py (TOTP בלי סיבוב) · app/db_encrypt.py ·
legal/INCIDENT-RUNBOOK.md.
"""
from __future__ import annotations

from datetime import timedelta

from app import totp
from app.main import create_app
from app.secretbox import generate_key
from app.users import Users
from tests.conftest import OWNER_TOKEN

PW = "correct-horse-battery-9"


def _owner_with_k1(svc, monkeypatch):
    k1, k2 = generate_key(), generate_key()
    monkeypatch.setenv("COLLECT_MASTER_KEYS", f"k1:{k1}")
    reg = Users(svc.db, svc.clock).create("owner@s.example", "בעלים", PW)
    monkeypatch.setenv("COLLECT_MASTER_KEYS", f"k2:{k2},k1:{k1}")
    return reg, k2


def test_login_works_while_both_keys_present_control(svc, clock, monkeypatch):
    reg, _ = _owner_with_k1(svc, monkeypatch)
    assert Users(svc.db, svc.clock).login("owner@s.example", PW, totp.code_at(reg["totp_secret"], clock().timestamp()))


def test_login_survives_dropping_old_key_after_rotation(svc, clock, monkeypatch):
    reg, k2 = _owner_with_k1(svc, monkeypatch)
    create_app(svc, owner_token=OWNER_TOKEN)   # עלייה עם המפתח החדש ראשון (הזדמנות לסיבוב)
    Users(svc.db, svc.clock).login("owner@s.example", PW, totp.code_at(reg["totp_secret"], clock().timestamp()))
    monkeypatch.setenv("COLLECT_MASTER_KEYS", f"k2:{k2}")
    clock.now += timedelta(seconds=31)
    assert Users(svc.db, svc.clock).login("owner@s.example", PW,
                                          totp.code_at(reg["totp_secret"], clock().timestamp()))


def _box(spec):
    from app.secretbox import SecretBox
    return SecretBox.from_spec(spec)


def test_business_secret_survives_dropping_old_key(svc, monkeypatch):
    """גבי מנוע 295: סוד-שדה (כולל סוד-המסירה של אורביט) עובר למפתח החדש ונקרא אחרי הוצאת הישן."""
    from app.business_secrets import BusinessSecrets
    from app.secret_rotation import rotate_secretbox_tokens
    k1, k2 = generate_key(), generate_key()
    BusinessSecrets(svc.db, _box(f"k1:{k1}")).put(1, "gi_api_secret", "s3cr3t", at="t")
    res = rotate_secretbox_tokens(svc.db, _box(f"k2:{k2},k1:{k1}"), at="t2")
    assert res == {"business_secrets": 1, "totp": 0, "failed": 0}
    assert BusinessSecrets(svc.db, _box(f"k2:{k2}")).get(1, "gi_api_secret").reveal() == "s3cr3t"
    # אידמפוטנטי — הרצה שנייה לא נוגעת
    assert rotate_secretbox_tokens(svc.db, _box(f"k2:{k2},k1:{k1}"))["business_secrets"] == 0


def test_undecryptable_token_left_untouched(svc):
    """טוקן במפתח שלא קיים — לא נמחק, לא עוצר את השאר, נספר ב-failed."""
    from app.business_secrets import BusinessSecrets
    from app.secret_rotation import rotate_secretbox_tokens
    k0, k1, k2 = generate_key(), generate_key(), generate_key()
    BusinessSecrets(svc.db, _box(f"k0:{k0}")).put(1, "sms_token", "lost", at="t")
    BusinessSecrets(svc.db, _box(f"k1:{k1}")).put(1, "gi_api_secret", "ok", at="t")
    before = svc.db.one("SELECT ciphertext FROM business_secrets WHERE field='sms_token'")["ciphertext"]
    res = rotate_secretbox_tokens(svc.db, _box(f"k2:{k2},k1:{k1}"))
    assert res == {"business_secrets": 1, "totp": 0, "failed": 1}
    assert svc.db.one("SELECT ciphertext FROM business_secrets WHERE field='sms_token'")["ciphertext"] == before


def test_boot_rotation_is_audited(svc, monkeypatch):
    _owner_with_k1(svc, monkeypatch)
    create_app(svc, owner_token=OWNER_TOKEN)
    import json
    rows = [json.loads(r["detail"]) for r in svc.db.q("SELECT detail FROM audit WHERE action='secretbox_rotated'")]
    assert rows and rows[0]["totp"] == 1
