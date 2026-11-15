"""הממשק מתרגם קודים מהשרת לעברית. קוד בלי תווית מוצג לבעל העסק **כמו שהוא** («legal», «brand_bank»)
— נמצא ע״י גבי שיווק (15.11): בתיבת «תשובות לקוחות» חסרו 11 מתוך 19 כוונות המנוע, והסבר דחיית מסנן
הניסוח לא כיסה את קטגוריות המותגים/המוסדות. הבדיקה נועלת: כל ערך שהשרת מייצר ⇒ יש לו תווית בעברית.
"""
import re
from pathlib import Path

from app import compliance
from app.conversation import Intent

WEB = Path(__file__).resolve().parents[1] / "web" / "src"


def _keys(file: str, const: str) -> set[str]:
    src = (WEB / file).read_text(encoding="utf-8")
    body = re.search(rf"const {const}: Record<[^>]+> = \{{(.*?)\n\}};", src, re.S).group(1)
    return set(re.findall(r"(?:^|[\s,{])([a-z_]+):\s*['\[]", body))


def test_inbox_has_hebrew_label_for_every_engine_intent():
    missing = {i.value for i in Intent} - _keys("pages/Inbox.tsx", "INTENT")
    assert not missing, f"כוונות בלי תווית בתיבת התשובות: {sorted(missing)}"


def test_every_compliance_code_is_explained_to_the_owner():
    codes = {n for n, _ in compliance.LEGAL_BLACKLIST + compliance.MARKETING_BLACKLIST + compliance.BRANDS}
    codes |= {compliance.DEBT_WORD[0], "foreign_link", "no_business_first", "sms_too_long"}
    missing = codes - _keys("pages/Inbox.tsx", "VIOLATION")
    assert not missing, f"קודי מסנן בלי הסבר: {sorted(missing)}"
