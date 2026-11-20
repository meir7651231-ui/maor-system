"""מבקר 195: רשימת השהיות-הבעלים במסך (web/src/lib/ownerOnly.ts) זהה ל-app/policy.py OWNER_HOLDS — אחרת עובד/ת
יראה כפתור «חידוש» שהשרת דוחה (או להפך, כפתור נעול שהשרת מתיר)."""
import re
from pathlib import Path

from app.policy import OWNER_HOLDS

ROOT = Path(__file__).resolve().parents[1]


def test_web_owner_holds_match_server():
    src = (ROOT / "web/src/lib/ownerOnly.ts").read_text("utf-8")
    m = re.search(r"OWNER_HOLDS: readonly string\[\] = \[([^\]]*)\]", src)
    assert m and set(re.findall(r"'([a-z_]+)'", m.group(1))) == set(OWNER_HOLDS)


def test_screens_use_the_locks():
    dash = (ROOT / "web/src/pages/Dashboard.tsx").read_text("utf-8")
    inv = (ROOT / "web/src/pages/Invoices.tsx").read_text("utf-8")
    assert "resumeLocked(me, c.paused)" in dash and 'data-testid="resume-locked"' in dash
    assert "exportOwnerOnly(me)" in inv and 'data-testid="data-export-owner-only"' in inv   # 4d1f369
