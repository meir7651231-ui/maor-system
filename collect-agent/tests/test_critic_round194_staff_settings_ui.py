"""מבקר סבב 194 — מסך ההגדרות ב-/app/ לא מבחין בין עובד/ת לבעל העסק.

רכיב: web/src/pages/Settings.tsx → Settings (הטופס כולו).
d081d0d2 נעל בשרת את השדות הרגישים לבעל העסק (pay.page_url, reply_email, sms.sender, source.system,
vat_id) — ובשרת זה עובד (403, שום דבר לא נשמר). אבל עובדת שנכנסת ל-/app/#/settings רואה את כל השדות
פתוחים לעריכה, בלי סימון «בעל העסק בלבד», משנה את מייל התשובה, לוחצת «שמירה בשרת» — ורק אז מקבלת
«לא נשמר: רק בעל העסק יכול לשנות: כתובת התשובה (Reply-To)». גם שינויים מותרים (חגים) באותה שמירה
נדחים יחד איתה. מסע דפדפן כעובדת: docs/screens/critic-194-staff-settings.png (+ ‎-save-403.png).

הדפוס כבר קיים בפרויקט (lib/restoreHold.ts holdOwnerOnly, lib/team.ts teamVisible — לפי /auth/me):
המסך צריך לקרוא את תפקיד המחובר ולנעול/לסמן את השדות של בעל העסק לפני השמירה.
"""
import re
from pathlib import Path

import pytest

SRC = Path(__file__).resolve().parents[1] / "web" / "src" / "pages" / "Settings.tsx"


def _code() -> str:
    lines = []
    for ln in SRC.read_text(encoding="utf-8").splitlines():
        s = ln.strip()
        if s.startswith("//") or s.startswith("*") or s.startswith("/*") or s.startswith("{/*"):
            continue
        lines.append(ln)
    return "\n".join(lines)


@pytest.mark.xfail(strict=True, reason="194🟡: Settings.tsx לא יודע מי מחובר — עובדת נדחית רק בשמירה")
def test_settings_screen_knows_owner_only_fields():
    code = _code()
    knows_role = re.search(r"me\??\.owner\b|ownerOnly|OwnerOnly|isOwner|teamVisible", code)
    assert knows_role, "מסך ההגדרות לא קורא את תפקיד המחובר (/auth/me owner) ולא נועל/מסמן שדות בעל-העסק"
