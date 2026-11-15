"""SIGN-OFF.md (מה שמאיר חותם עליו) מפרט את הבדיקות שמגבות את החבילה — הרשימה חייבת להיות אמת:
כל קובץ שמופיע בה קיים, וכל קובץ בדיקה של חבילת השיווק מופיע בה (גבי שיווק, 15.11: הרשימה התיישנה)."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SIGN = (ROOT / "marketing/SIGN-OFF.md").read_text(encoding="utf-8")
SECTION = SIGN[SIGN.index("## בדיקות שרצות על החבילה"):]
MARKETING_TESTS = ["test_launch_domain", "test_vertical_pages", "test_template_library", "test_seo_articles",
                   "test_marketing_claims_match_code", "test_marketing_sources", "test_footer_legal_links",
                   "test_accessibility_statement", "test_video_transcript", "test_web_labels_cover_backend",
                   "test_customer_facing_no_time_promises", "test_compliance_lawyer_final_kaf",
                   "test_compliance_hebrew_forms", "test_compliance_debt_word_steps", "test_signoff_lists_marketing_tests"]


def test_every_listed_file_exists():
    for path in re.findall(r"`((?:tests|web)/[^`\s]+)`", SECTION):
        assert (ROOT / path).is_file(), path


def test_every_marketing_test_is_listed():
    for name in MARKETING_TESTS:
        assert (ROOT / f"tests/{name}.py").is_file(), name
        assert f"tests/{name}.py" in SECTION, f"{name} לא מופיע ב-SIGN-OFF"
