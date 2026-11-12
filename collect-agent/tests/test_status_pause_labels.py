"""critic סבב 52: מגן חוצה-משטחים לממשק השני (/ui, app/ui.html) ולסיבות השהיה.
באגים שנמצאו:
  • /ui הציג סטטוס תזכורת `send_unknown` (שליחה נקטעה, אולי יצאה, לבדוק ביומן) ו-`sending` כקוד גולמי.
  • /ui הציג סיבת השהיה של לקוח כקוד גולמי («promise:until=2026-11-20», «deceased», «legal»…),
    כי BLOCK כיסה רק חלק מהכוונות.
  • /app/ (PAUSE_LABEL): השהיות שבעל העסק עצמו סימן (minor/deceased/insolvency) קיבלו את הנוסח הכללי
    «מושהה עד שתבדקו», שלא אומר כלום."""
from __future__ import annotations

import re
from pathlib import Path

from app.conversation import Intent
from app.policy import OWNER_HOLDS

ROOT = Path(__file__).resolve().parent.parent
SRC = "\n".join(p.read_text(encoding="utf-8") for p in (ROOT / "app").glob("*.py"))
UI = (ROOT / "app/ui.html").read_text(encoding="utf-8")
DASH = (ROOT / "web/src/pages/Dashboard.tsx").read_text(encoding="utf-8")
# כוונות שלעולם לא משהות לקוח (opt_out = הסרה, מוצג כ-opted_out; unknown ⇒ נוסח כללי מכוון)
NEVER_PAUSE = {"thanks", "how_to_pay", "who_is_this", "copy_request", "opt_out", "unknown"}


def _js_keys(src: str, name: str) -> set[str]:
    m = re.search(r"(?:const|let)\s+" + name + r"(?::[^=]+)?\s*=\s*\{(.*?)\};", src, re.S)
    assert m, name
    return set(re.findall(r"\b([a-z_]+)\s*:\s*['\"]", m.group(1)))


def _reminder_statuses() -> set[str]:
    s = set(re.findall(r"reminders SET status='([a-z_]+)'", SRC))
    s |= {"pending_approval"}
    return s


def _pause_reasons() -> set[str]:
    return ({i.value for i in Intent} - NEVER_PAUSE) | set(OWNER_HOLDS) | {"credit_review"}


def test_ui_html_shows_every_reminder_status():
    st = _reminder_statuses()
    assert {"sending", "send_unknown", "sent_dry_run", "cancelled"} <= st, st
    missing = sorted(st - _js_keys(UI, "STATUS"))
    assert not missing, f"/ui מציג קוד סטטוס גולמי: {missing}"


def test_ui_html_hard_and_reapprove_match_server():
    hb = set(re.findall(r'"([a-z_]+)"', re.search(r"^HARD_BLOCKS = \{([^}]*)\}", SRC, re.M).group(1)))
    hard = set(re.findall(r'"([a-z_]+)"', re.search(r"const HARD=\[([^\]]*)\]", UI).group(1)))
    assert hard == hb, (hard, hb)
    re_reasons = set(re.findall(r'_invalidate\(\w+, "([a-z_]+)"\)', SRC)) | {"amount_changed", "amount_check"}
    missing = sorted(re_reasons - _js_keys(UI, "REAPPROVE"))
    assert not missing, missing


def test_every_pause_reason_has_a_label_in_both_uis():
    need = _pause_reasons()
    miss_web = sorted(need - _js_keys(DASH, "PAUSE_LABEL"))
    assert not miss_web, f"/app/ PAUSE_LABEL: {miss_web}"
    miss_ui = sorted(need - _js_keys(UI, "PAUSE"))
    assert not miss_ui, f"/ui PAUSE: {miss_ui}"
    # /ui מפרק ':until=' ולא מציג קוד גולמי
    assert re.search(r"split\(\":until=\"\)", UI), "/ui לא מפרק :until="
