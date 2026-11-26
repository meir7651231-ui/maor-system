"""מבקר 195: רשימת השהיות-הבעלים במסך (web/src/lib/roles.ts — מנהל 348: ownerOnly.ts אוחד לשם)
זהה ל-app/policy.py OWNER_HOLDS — אחרת עובד/ת
יראה כפתור «חידוש» שהשרת דוחה (או להפך, כפתור נעול שהשרת מתיר)."""
import re
from pathlib import Path

from app.policy import OWNER_HOLDS

ROOT = Path(__file__).resolve().parents[1]


def test_web_owner_holds_match_server():
    src = (ROOT / "web/src/lib/roles.ts").read_text("utf-8")
    m = re.search(r"OWNER_HOLDS = \[([^\]]*)\]", src)
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


def test_single_owner_only_module_and_notice_lock():
    """מנהל 348: חוב העיצוב מ-347 — שני מודולים לאותו כלל (ownerOnly.ts ⇄ roles.ts). אוחד; והתראת-הביטחון נעולה
    לעובד/ת ב-/app/ (מבקר 195א) עם אותה רשימת intents כמו השרת."""
    assert not (ROOT / "web/src/lib/ownerOnly.ts").exists()
    src = (ROOT / "web/src/lib/roles.ts").read_text("utf-8")
    m = re.search(r"OWNER_ONLY_NOTICES = \[([^\]]*)\]", src)
    from app.service import _OWNER_ONLY_NOTICES
    # מנהל 422 (מבקר 253🟡): אותה רשימה בשרת ובמסך — כולל api_mass_vanish
    assert m and set(re.findall(r"'([a-z_]+)'", m.group(1))) == set(_OWNER_ONLY_NOTICES)
    assert {"settings_changed", "api_mass_vanish", "inherited_optout"} <= set(_OWNER_ONLY_NOTICES)
    svc_src = (ROOT / "app/service.py").read_text("utf-8")
    assert 'row["intent"] in _OWNER_ONLY_NOTICES and not self._actor_is_owner(actor)' in svc_src
    dash = (ROOT / "web/src/pages/Dashboard.tsx").read_text("utf-8")
    assert "noticeDoneLocked(me, n.intent)" in dash and 'data-testid="notice-done-locked"' in dash
