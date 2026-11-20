"""בונה קובץ HTML אחד (RTL, להדפסה/PDF) מכל הטיוטות המשפטיות — המצורף למייל לעו״ד.

    python3 scripts/legal_bundle.py          # כותב legal/dist/gabi-legal-package.html
    python3 scripts/legal_bundle.py --check  # 1 אם הקובץ לא מעודכן (CI / בדיקה)

stdlib בלבד, פלט דטרמיניסטי (בלי תאריך בנייה) — כדי שבדיקה תוכל לוודא שהמצורף = הטיוטות.
"""
from __future__ import annotations

import re
import sys
from html import escape
from pathlib import Path

LEGAL = Path(__file__).resolve().parents[1] / "legal"
OUT = LEGAL / "dist" / "gabi-legal-package.html"
ORDER = ("LAWYER-BRIEF.md", "LAWYER-QUESTIONS.md", "TERMS.md", "PRIVACY.md", "DPA.md",
         "INCIDENT-RUNBOOK.md", "BETA-GATE.md", "DATABASE-DEFINITION.md")
DRAFT = "טיוטה – לבדיקת עו״ד"


def _inline(t: str) -> str:
    t = escape(t, quote=False)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    return re.sub(r"(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)", r"<i>\1</i>", t)


def md_to_html(md: str) -> str:
    out: list[str] = []
    lines = md.splitlines()
    i = 0
    while i < len(lines):
        ln = lines[i]
        s = ln.strip()
        if not s or s == "---":
            out.append("<hr>" if s == "---" else "")
            i += 1
            continue
        if s.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r":?-{2,}:?", c) for c in cells):
                    rows.append(cells)
                i += 1
            html = "<table>"
            for n, r in enumerate(rows):
                tag = "th" if n == 0 else "td"
                html += "<tr>" + "".join(f"<{tag}>{_inline(c)}</{tag}>" for c in r) + "</tr>"
            out.append(html + "</table>")
            continue
        if s.startswith(">"):
            buf = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                buf.append(lines[i].strip().lstrip(">").strip())
                i += 1
            out.append("<blockquote>" + md_to_html("\n".join(buf)) + "</blockquote>")
            continue
        m = re.match(r"(#{1,4})\s+(.*)", s)
        if m:
            n = len(m.group(1)) + 1   # h1 שמור לכותרת כל מסמך
            out.append(f"<h{min(n, 5)}>{_inline(m.group(2))}</h{min(n, 5)}>")
            i += 1
            continue
        if re.match(r"(\d+\.|[-*·])\s", s):
            ordered = bool(re.match(r"\d+\.", s))
            items = []
            while i < len(lines) and re.match(r"\s*(\d+(\.\d+)*\.|[-*·])\s", lines[i]):
                items.append(re.sub(r"^\s*(\d+(\.\d+)*\.|[-*·])\s+", "", lines[i]))
                i += 1
            tag = "ol" if ordered else "ul"
            out.append(f"<{tag}>" + "".join(f"<li>{_inline(x)}</li>" for x in items) + f"</{tag}>")
            continue
        buf = []
        while i < len(lines) and lines[i].strip() and not re.match(r"\s*(#|\||>|---|\d+\.\s|[-*·]\s)",
                                                                       lines[i]):
            buf.append(lines[i].strip())
            i += 1
        if buf:
            out.append("<p>" + "<br>".join(_inline(b) for b in buf) + "</p>")
        else:
            i += 1
    return "\n".join(x for x in out if x)


def build() -> str:
    parts = []
    toc = []
    for n, name in enumerate(ORDER, 1):
        md = (LEGAL / name).read_text("utf-8")
        if DRAFT not in md:
            raise SystemExit(f"{name} לא מסומן «{DRAFT}» — לא בונים חבילה")
        title = md.splitlines()[0].lstrip("# ").strip()
        body = md_to_html("\n".join(md.splitlines()[1:]))
        toc.append(f'<li><a href="#d{n}">{escape(title)}</a> <small>({name})</small></li>')
        parts.append(f'<section id="d{n}"><h1>{n}. {escape(title)}</h1>{body}</section>')
    css = ("body{font-family:Heebo,Rubik,Arial,sans-serif;max-width:860px;margin:24px auto;padding:0 16px;"
           "line-height:1.6;color:#0F172A;background:#fff;overflow-wrap:anywhere}"
           "table{border-collapse:collapse;width:100%;margin:8px 0;display:block;overflow-x:auto}"
           "@media print{table{display:table}}"
           "th,td{border:1px solid #cbd5e1;padding:4px 6px;vertical-align:top;font-size:14px}"
           "th{background:#f1f5f9}blockquote{border-inline-start:4px solid #10B981;margin:8px 0;"
           "padding:4px 12px;background:#FBF8F1}code{background:#f1f5f9;padding:0 3px}"
           ".draft{border:2px solid #b91c1c;color:#b91c1c;padding:8px;font-weight:700;text-align:center}"
           "section{page-break-before:always}h1{font-size:22px;border-bottom:2px solid #10B981}")
    return ("<!doctype html>\n<html lang=\"he\" dir=\"rtl\"><head><meta charset=\"utf-8\">"
            "<meta name=\"viewport\" content=\"width=device-width\">"
            f"<title>גבי — חבילה לעו״ד ({DRAFT})</title><style>{css}</style></head><body>\n"
            f'<p class="draft">{DRAFT} · לא מאושר · פרטי המפעיל placeholder</p>\n'
            "<h1>גבי — תזכורות תשלום · חבילה לעו״ד</h1>\n<p>מתחילים מהתקציר (מסמך 1).</p>\n"
            f"<ol>{''.join(toc)}</ol>\n" + "\n".join(parts) + "\n</body></html>\n")


def main(argv: list[str]) -> int:
    html = build()
    if "--check" in argv:
        ok = OUT.is_file() and OUT.read_text("utf-8") == html
        print("✅ החבילה מעודכנת" if ok else "❌ החבילה לא מעודכנת: python3 scripts/legal_bundle.py")
        return 0 if ok else 1
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, "utf-8")
    print(f"נכתב {OUT.relative_to(LEGAL.parent)} ({len(html):,} תווים, {len(ORDER)} מסמכים)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
