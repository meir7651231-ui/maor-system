"""מקורות החשבוניות בנכסי השיווק = מה שהמוצר תומך בו (גבי שיווק, 15.11).

הבעיה שנמצאה: השאלות הנפוצות ענו «צריך חשבון בחשבונית ירוקה? — כן», אבל מאז נבנו מקורות iCount, רווחית
ו-EZcount (app/integrations), ומסך ההגדרות מציע אותם. המקור היחיד לרשימה: web/src/lib/settings.ts SOURCE_SYSTEMS.
נועל: (1) כל מקור שמוזכר בנכס שיווק קיים ב-SOURCE_SYSTEMS · (2) אף נכס לא מתנה את השימוש בחשבונית ירוקה
· (3) EZcount, כל עוד מסומן «בבדיקה», לא מוצג כנתמך בלי הסתייגות · (4) בשאלות הנפוצות מופיעים כל המקורות.
"""
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
SETTINGS = (ROOT / "web/src/lib/settings.ts").read_text(encoding="utf-8")
BLOCK = SETTINGS.split("SOURCE_SYSTEMS")[1].split("];")[0]
SOURCES = {k: (label, note) for k, label, note in re.findall(r"key: '(\w+)', label: '([^']+)', note: '([^']+)'", BLOCK)}
KNOWN_PRODUCTS = ("חשבשבת", "Priority", "פריוריטי", "SAP", "QuickBooks", "Xero", "Invoice4U", "SUMIT", "סאמיט")
ASSETS = [p for p in [*ROOT.glob("marketing/**/*.md"), *ROOT.glob("marketing/**/*.html"),
                      ROOT / "team/messaging.md", ROOT / "web/src/pages/Landing.tsx"]
          if "compose" not in p.parts and p.name != "transcript.html" and p.parent.name != "out"]


def test_sources_parsed():
    assert {"greeninvoice", "icount", "rivhit", "ezcount", "csv"} <= set(SOURCES)


@pytest.mark.parametrize("p", ASSETS, ids=lambda p: p.relative_to(ROOT).as_posix())
def test_asset_mentions_only_supported_sources_and_no_gi_requirement(p):
    t = p.read_text(encoding="utf-8")
    for prod in KNOWN_PRODUCTS:
        assert prod not in t, f"מקור שלא קיים במוצר: {prod}"
    gi_required = r"צריך חשבון ב[^?]*(?:חשבונית ירוקה|morning)[^?]*\?[^<'\"]{0,40}כן"
    assert not re.search(gi_required, t), "מתנה את השימוש בחשבונית ירוקה"
    if "בבדיקה" in SOURCES["ezcount"][1]:
        for m in re.finditer(r"EZcount", t):
            ctx = t[max(0, m.start() - 80): m.end() + 80]
            assert "בבדיקה" in ctx or "settings" in p.name, ("EZcount בלי הסתייגות", ctx)


@pytest.mark.parametrize("p", [ROOT / "marketing/landing/index.html", ROOT / "web/src/pages/Landing.tsx"],
                         ids=lambda p: p.name)
def test_faq_lists_every_source(p):
    t = p.read_text(encoding="utf-8")
    faq = t[t.index("עם אילו מערכות חשבוניות"):][:600]
    for k in ("icount", "rivhit", "ezcount", "csv"):
        assert SOURCES[k][0].split(" ")[0].replace("קובץ", "CSV") in faq or k == "csv" and "CSV" in faq, k
    assert "חשבונית ירוקה" in faq
