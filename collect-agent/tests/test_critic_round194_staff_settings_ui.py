"""מבקר סבב 194 — מסך ההגדרות ב-/app/ לא מבחין בין עובד/ת לבעל העסק.

רכיב: web/src/pages/Settings.tsx → Settings (הטופס כולו).
d081d0d2 נעל בשרת את השדות הרגישים לבעל העסק (pay.page_url, reply_email, sms.sender, source.system,
vat_id) — ובשרת זה עובד (403, שום דבר לא נשמר). אבל עובדת שנכנסת ל-/app/#/settings רואה את כל השדות
פתוחים לעריכה, בלי סימון «בעל העסק בלבד», משנה את מייל התשובה, לוחצת «שמירה בשרת» — ורק אז מקבלת
«לא נשמר: רק בעל העסק יכול לשנות: כתובת התשובה (Reply-To)». גם שינויים מותרים (חגים) באותה שמירה
נדחים יחד איתה. מסע דפדפן כעובדת: docs/screens/critic-194-staff-settings.png (+ -save-403.png).

הדפוס כבר קיים בפרויקט (lib/restoreHold.ts holdOwnerOnly, lib/team.ts teamVisible — לפי /auth/me):
המסך צריך לקרוא את תפקיד המחובר ולנעול/לסמן את השדות של בעל העסק לפני השמירה.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "web" / "src" / "pages" / "Settings.tsx"
LIB = ROOT / "web" / "src" / "lib" / "settings.ts"


def _code() -> str:
    lines = []
    for ln in SRC.read_text(encoding="utf-8").splitlines():
        s = ln.strip()
        if s.startswith("//") or s.startswith("*") or s.startswith("/*") or s.startswith("{/*"):
            continue
        lines.append(ln)
    return "\n".join(lines)


def test_settings_screen_knows_owner_only_fields():
    code = _code()
    knows_role = re.search(r"me\??\.owner\b|ownerOnly|OwnerOnly|isOwner|teamVisible", code)
    assert knows_role, "מסך ההגדרות לא קורא את תפקיד המחובר (/auth/me owner) ולא נועל/מסמן שדות בעל-העסק"


# תיקון (מנהל 345): כל שדה טופס שהשרת חוסם לעובד/ת — נעול במסך. מיפוי שדה-טופס ⇒ מפתח-שרת (settings_api.from_design).
FORM_TO_SERVER = {"business_name": "business_name", "owner_name": "owner_name", "vat_id": "vat_id",
                  "reply_email": "email_reply_to", "sender": "sms_sender_id", "pay_provider": "payment_provider",
                  "pay_url": "payment_link", "source_system": "source_system"}


def test_ui_owner_only_fields_match_server():
    from app.service import CollectService
    m = re.search(r"OWNER_ONLY_FIELDS[^=]*=\s*\[(.*?)\]", LIB.read_text(encoding="utf-8"), re.S)
    assert m, "OWNER_ONLY_FIELDS לא נמצא ב-lib/settings.ts"
    ui = set(re.findall(r"'(\w+)'", m.group(1)))
    assert ui <= set(FORM_TO_SERVER), ui - set(FORM_TO_SERVER)
    assert {FORM_TO_SERVER[k] for k in ui} == set(CollectService._OWNER_ONLY_LABELS), \
        "רשימת השדות הנעולים במסך לא תואמת את מה שהשרת חוסם לעובד/ת"


def test_every_owner_field_input_is_locked_and_save_blocked():
    code = _code()
    for k in FORM_TO_SERVER:
        assert f"lk('{k}')" in code, f"השדה {k} לא נעול לעובד/ת במסך"
    assert re.search(r"disabled=\{busy \|\| !dirty \|\| ownerOnly", code), "«שמירה» לא נחסמת לעובד/ת"
    assert 'data-testid="settings-owner-only"' in code
