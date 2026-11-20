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
    assert "resumeOwnerOnly(me, c.paused)" in dash and 'data-testid="resume-locked"' in dash
    assert "exportOwnerOnly(me)" in inv and 'data-testid="data-export-owner-only"' in inv   # 4d1f369


def test_ui_html_owner_holds_match_server_and_lock_is_wired():
    """/ui (מבקר 195ג): אותה רשימה כמו השרת, והכפתור מוחלף בתג לעובד/ת."""
    src = (ROOT / "app/ui.html").read_text("utf-8")
    m = re.search(r'const OWNER_HOLDS=new Set\(\[([^\]]*)\]\)', src)
    assert m and set(re.findall(r'"([a-z_]+)"', m.group(1))) == set(OWNER_HOLDS)
    assert "holdOwnerOnly(x.paused_reason)?" in src and 'data-testid="resume-owner-only"' in src
    assert 'ME=await api("/auth/me"' in src
