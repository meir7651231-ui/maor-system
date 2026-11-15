"""שער המעבר לשליחה אמיתית: מה עוד חסר כדי ש«גבי» ישלח SMS/מייל אמיתי. טהור, בלי רשת.

היום השער **סגור**, וכל תנאי שלא מתקיים מופיע ברשימה עם מה צריך לעשות. השער לא פותח שום דבר
בעצמו: גם כשהרשימה ריקה, המעבר לשליחה אמיתית הוא שינוי קוד מכוון (ALLOWED_SEND_MODES,
CONTRACT_VERIFIED_019) באישור מאיר. התפקיד שלו: שאף אחד לא ישכח תנאי ביום המעבר.

    python3 -m app.golive [--gi-report sandbox-report.json] [--sms-report 019-report.json]
קוד יציאה: 0 = אין חוסמים · 1 = יש חוסמים.
"""
from __future__ import annotations

import argparse
import json
import sys
from collections.abc import Mapping
from pathlib import Path
from typing import Any

from . import config, legal
from .integrations import sms


def _report_blocker(path: str | None, *, name: str, want_target: str, how: str) -> str | None:
    if not path:
        return f"{name}: אין דוח. {how}"
    p = Path(path)
    if not p.is_file():
        return f"{name}: הקובץ {path} לא קיים. {how}"
    try:
        rep: dict[str, Any] = json.loads(p.read_text("utf-8"))
    except (OSError, ValueError) as e:
        return f"{name}: הדוח לא קריא ({e})"
    if want_target not in str(rep.get("target", "")):
        return f"{name}: הדוח רץ מול {rep.get('target')!r}, לא מול {want_target}. {how}"
    fails = [c.get("id") for c in rep.get("checks", []) if c.get("status") == "FAIL"]
    if fails:
        return f"{name}: יש FAIL בדוח: {', '.join(map(str, fails))}"
    return None


def real_send_blockers(settings: config.Settings, *, gi_report: str | None = None,
                       sms_report: str | None = None,
                       operator: Mapping[str, str] | None = None,
                       verified_019: bool | None = None,
                       allowed_send_modes: set[str] | None = None) -> list[str]:
    """רשימת החוסמים. ריקה ⇒ אפשר להתחיל את שינוי הקוד המכוון למעבר (באישור מאיר)."""
    out: list[str] = []
    modes = config.ALLOWED_SEND_MODES if allowed_send_modes is None else allowed_send_modes
    if modes <= {"dry_run"}:
        out.append("קוד: שליחה אמיתית חסומה (config.ALLOWED_SEND_MODES = dry_run בלבד). "
                   "פותחים רק בשינוי קוד מכוון, אחרי שכל השאר סגור")
    v019 = sms.CONTRACT_VERIFIED_019 if verified_019 is None else verified_019
    if not v019:
        out.append("019: החוזה לא מאומת (CONTRACT_VERIFIED_019=False). צריך מסמך API רשמי, "
                   "חשבון בדיקה, והרצה נקייה של scripts/sms019_contract_check.py --test-endpoint")
    op = legal.OPERATOR if operator is None else operator
    ph = [k for k, v in op.items() if "placeholder" in v.lower() or not v.strip()]
    if ph:
        out.append(f"משפטי: פרטי החברה המפעילה הם placeholder ({', '.join(ph)}). "
                   "צריך ישות מפעילה ואישור עו״ד (app/legal.py)")
    if ".example" in settings.public_base_url or not settings.public_base_url.startswith("https://"):
        out.append(f"דומיין: PUBLIC_BASE_URL={settings.public_base_url}. צריך דומיין אמיתי ב-https "
                   "(הקישור הקצר ב-SMS והסרה במייל עוברים דרכו)")
    b = _report_blocker(gi_report, name="חשבונית ירוקה", want_target="sandbox",
                        how="מריצים scripts/gi_contract_check.py --sandbox --json <קובץ>")
    if b:
        out.append(b)
    b = _report_blocker(sms_report, name="019", want_target="019 האמיתי",
                        how="מריצים scripts/sms019_contract_check.py --test-endpoint --json <קובץ>")
    if b:
        out.append(b)
    return out


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="שער המעבר לשליחה אמיתית — מה חסר")
    ap.add_argument("--gi-report", default="")
    ap.add_argument("--sms-report", default="")
    a = ap.parse_args(argv)
    blockers = real_send_blockers(config.load_settings(), gi_report=a.gi_report or None,
                                  sms_report=a.sms_report or None)
    if not blockers:
        print("✅ אין חוסמים. המעבר עצמו = שינוי קוד מכוון באישור מאיר.")
        return 0
    print(f"🔒 השער סגור. {len(blockers)} חוסמים:")
    for i, b in enumerate(blockers, 1):
        print(f"  {i}. {b}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
