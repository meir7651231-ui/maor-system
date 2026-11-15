"""בדיקת המקשר (כל שעתיים): מי מעובדי גבי עבד מאז הבדיקה הקודמת, ומי צריך להעיר.

python3 -I scripts/team_watch.py [--since ISO] [--state FILE]
פלט JSON: לכל עובד — commits מאז, האחרון, wall, ו-wake=true אם יש לו שורה פתוחה ב-BACKLOG,
הוא לא מול קיר, ואין לו commit מאז. all_walled=true ⇒ לכבות את הבדיקה ולדווח למאיר.
קורא רק git (בלי רשת מעבר ל-fetch שהמקשר מריץ לפני). לא שולח כלום בעצמו.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
from datetime import UTC, datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def open_rows(backlog: str, worker: str) -> int:
    m = re.search(rf"^## {re.escape(worker)}\n(.*?)(?=^## |\Z)", backlog, re.S | re.M)
    return len(re.findall(r"^- \[ \]", m.group(1), re.M)) if m else 0


def commits_since(session: str, since: str) -> list[dict]:
    git = shutil.which("git") or "git"
    # ארגומנטים קבועים בלבד (since מעוצב כ-ISO ע"י המקשר); בלי shell
    out = subprocess.run([git, "log", "--all", f"--since={since}",  # noqa: S603
                          "--format=%h|%cI|%s|%b%x00", "--", "collect-agent/"],
                         cwd=ROOT.parent, capture_output=True, text=True).stdout
    rows = []
    for e in out.split("\0"):
        if session in e:
            h, t, s, _ = (e.strip().split("|", 3) + ["", "", "", ""])[:4]
            if not s.startswith(("Merge", "מיזוג")):
                rows.append({"hash": h, "at": t, "subject": s[:90]})
    return rows


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--since")
    ap.add_argument("--state", default=str(Path.home() / ".gabi_team_watch.json"))
    a = ap.parse_args()
    state = Path(a.state)
    since = a.since or (json.loads(state.read_text())["last"] if state.exists()
                        else (datetime.now(UTC) - timedelta(hours=2)).isoformat())
    workers = json.loads((ROOT / "team/workers.json").read_text(encoding="utf-8"))["workers"]
    backlog = (ROOT / "team/BACKLOG.md").read_text(encoding="utf-8")
    report, wake = {}, []
    for name, w in workers.items():
        c = commits_since(w["session"], since)
        rows = open_rows(backlog, name)
        need = bool(rows) and not w.get("wall") and not c
        report[name] = {"commits": len(c), "last": c[0] if c else None, "open_rows": rows,
                        "wall": w.get("wall", False), "wake": need}
        if need:
            wake.append(name)
    all_walled = all(r["wall"] or r["open_rows"] == 0 for r in report.values())
    now = datetime.now(UTC).isoformat()
    state.write_text(json.dumps({"last": now}))
    print(json.dumps({"since": since, "now": now, "wake": wake, "all_walled": all_walled,
                      "workers": report}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
