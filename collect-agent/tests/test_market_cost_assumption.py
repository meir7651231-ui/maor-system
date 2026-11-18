"""שומר: הנחת העלות ב-team/market.md §4.1 (מספר מקטעי SMS לתזכורת) תואמת את הקוד.

רקע (ביקורת סבב 1574): market.md הניח 2–3 מקטעים בזמן שהקוד שלח 4 ⇒ תחשיב המרווח היה שגוי
בשקט. מעכשיו: אם נוסח תזכורת מתארך מעבר להנחה הכתובה, הבדיקה נכשלת — מעדכנים את התחשיב או מקצרים.
"""
import re
from pathlib import Path

from app import templates as t
from app.channels import sms_segments

MARKET = (Path(__file__).resolve().parents[1] / "team" / "market.md").read_text(encoding="utf-8")
# שמות עסק באורכים ריאליים (9–26 תווים) — לפי פרופילי הבטא (team/beta-profiles-30.md)
NAMES = ["מספרת דני", "סלון הכלות של מיכל", "מוסך אחים כהן", "קליניקה לקלינאות תקשורת",
         "מרכז חוגי ספורט פתח תקווה", "יועץ עסקי - רון", "אינסטלציה ושיפוצים בע\"מ"]
BASES = ["https://gabi.example", "https://gabi.co.il"]


def _stated() -> tuple[int, int]:
    m = re.search(r"cost-assumption: typical_segments=(\d) worst_segments=(\d)", MARKET)
    assert m, "חסר סימון cost-assumption ב-market.md §4.1"
    return int(m.group(1)), int(m.group(2))


def _measure() -> list[int]:
    segs = []
    for base in BASES:
        for biz in NAMES:
            kw = dict(biz=biz, name="דנה לוי", currency="ILS", link="https://pay.example/x",
                      unsub=f"{base}/u/t", short=f"{base}/p/AbC12xY")
            for st in t.STEPS:
                f = t.fields(num="2001", amount_agorot=120000, **kw)
                segs.append(sms_segments(t.render_sms(st, f))["segments"])
            for st in t.STEPS_MULTI:
                f = t.fields_multi(invoices=[("2001", 120000), ("2002", 50000)], **kw)
                segs.append(sms_segments(t.render_sms(st, f))["segments"])
    return segs


def test_reminder_segments_within_market_cost_assumption():
    typical, worst = _stated()
    segs = _measure()
    assert max(segs) <= worst, f"תזכורת של {max(segs)} מקטעים > {worst} שב-market.md"
    share_typ = sum(s <= typical for s in segs) / len(segs)
    assert share_typ >= 0.8, f"רק {share_typ:.0%} ב-{typical} מקטעים — התחשיב 'טיפוסי' לא נכון"
