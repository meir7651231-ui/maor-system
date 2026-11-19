"""הרכב הבטא (הכרעת מאיר 6.11: 3 מספרות · 2 מוסכים · 2 קליניקות · 3 לקוחות רו״ח) מוגדר בכמה מקומות:
team/sales.md, team/beta-kit.md (שיווק), team/beta-profiles-30.md (מחקר), sales/PACKAGE.md, sales/beta-channels.md.
שינוי באחד בלי האחרים = מכירות פונות לעסק שלא במשבצת. כאן: כולם אומרים אותו הרכב, ל-30 הפרופילים יש
בדיוק 3 מועמדים לכל משבצת, ואת המשבצות שבטבלת המעקב של המכירות אפשר למלא מתוך הפרופילים (קישור בשני הכיוונים)."""
from __future__ import annotations

import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SLOTS = {"מספרה": 3, "מוסך": 2, "קליניקה": 2, 'לקוח רו"ח': 3}
COMPOSITION = re.compile(r"3 מספרות[ ,·]+2 מוסכים[ ,·]+2 קליניקות[ ,·]+3 לקוחות (?:של )?(?:רו[״\"]ח|רואי חשבון)")
DOCS = ["team/sales.md", "team/beta-kit.md", "team/beta-profiles-30.md", "sales/PACKAGE.md", "sales/beta-channels.md"]


def _read(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")


def test_every_doc_states_the_same_composition():
    missing = [d for d in DOCS if not COMPOSITION.search(_read(d))]
    assert not missing, missing


def test_thirty_profiles_three_per_slot():
    slots = re.findall(r"^\| \d+ \| ([^|]+?) \d \|", _read("team/beta-profiles-30.md"), re.M)
    rows = Counter(re.findall(r"^\| \d+ \| ([^|]+? \d) \|", _read("team/beta-profiles-30.md"), re.M))
    assert sum(rows.values()) == 30, sum(rows.values())
    assert set(rows.values()) == {3}, rows
    assert Counter(slots) == Counter({k: v * 3 for k, v in SLOTS.items()}), Counter(slots)


def test_sales_tracker_slots_match_profiles_and_link_both_ways():
    tracker = _read("sales/beta-channels.md").split("## מעקב")[1]
    tracked = re.findall(r"^\| ((?:מספרה|מוסך|קליניקה) \d|לקוח רו״ח \d) \|", tracker, re.M)
    profiles = {s.replace('"', "״") for s in
                re.findall(r"^\| \d+ \| ([^|]+? \d) \|", _read("team/beta-profiles-30.md"), re.M)}
    assert len(tracked) == 10 and set(tracked) == profiles, (tracked, sorted(profiles))
    assert "beta-profiles-30.md" in tracker, "טבלת המעקב לא מפנה ל-30 המועמדים"
    assert "beta-profiles-30.md" in _read("sales/PACKAGE.md"), "חתימה S6 לא מפנה ל-30 המועמדים"


def test_tracker_candidate_ranges_point_at_the_right_slot():
    prof = {int(n): s.replace('"', "״") for n, s in
            re.findall(r"^\| (\d+) \| ([^|]+? \d) \|", _read("team/beta-profiles-30.md"), re.M)}
    tracker = _read("sales/beta-channels.md").split("## מעקב")[1]
    rows = re.findall(r"^\| ([^|]+? \d) \| #(\d+)–#(\d+) \|", tracker, re.M)
    assert len(rows) == 10, rows
    for slot, a, b in rows:
        assert all(prof[i] == slot for i in range(int(a), int(b) + 1)), (slot, a, b)
