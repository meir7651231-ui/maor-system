# ruff: noqa: E501 — הקובץ הוא קופי עברי ותבנית HTML; שבירת שורות בטקסט שיווקי פוגעת בקריאות ובעריכה
"""דפי נחיתה לפי ענף (בטא: מספרה · מוסך · קליניקה · לקוח רו״ח) — טיוטות, לא לפרסום.

דוגמת ה-SMS בכל דף **אינה כתובה ביד**: היא יוצאת מהמוצר עצמו — שירות גבי אמיתי (dry-run) רץ על
חשבוניות הדוגמה של אותו ענף (app/beta_seeds.py, אותן ש«גבי מכירות» בנו), מסנכרן מ-gi_mock (בלי רשת),
מתכנן, ומחזיר את התזכורת הראשונה כפי שהייתה נשלחת. הדומיין: marketing/launch/launch.json.

    python3 marketing/landing/for/build.py          # בונה את 4 הדפים
    python3 marketing/landing/for/build.py --check  # נכשל אם דף לא מעודכן (ל-CI/בדיקות)
"""
from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]                                       # collect-agent/
sys.path.insert(0, str(ROOT))

import httpx  # noqa: E402

from app.beta_seeds import BETA_VERTICALS, beta_business, beta_docs  # noqa: E402
from app.config import load_settings  # noqa: E402
from app.db import DB  # noqa: E402
from app.demo import DEMO_NOW, DEMO_PAY_LINK, FixedClock  # noqa: E402
from app.demo_data import DEMO_ID, DEMO_SECRET, SANDBOX  # noqa: E402
from app.gi_mock import GreenInvoiceMock  # noqa: E402
from app.greeninvoice import GreenInvoiceClient  # noqa: E402
from app.service import CollectService  # noqa: E402

LAUNCH = json.loads((ROOT / "marketing/launch/launch.json").read_text(encoding="utf-8"))
DOMAIN = LAUNCH["domain"]

# תוכן לכל ענף — לפי team/messaging.md §4. בלי הבטחת תשואה, בלי "גבייה", בלי WhatsApp.
# הקוד בקישור הקצר אקראי בכוונה (אבטחה) ⇒ בדף מציגים קוד דוגמה קבוע באותו אורך (7), כדי שהדף יהיה דטרמיניסטי
DEMO_CODES = {"barber": "brb7Kq2", "garage": "grg4Tm9", "clinic": "cln8Wd3", "cpa": "cpa5Hx6"}

COPY: dict[str, dict] = {
    "barber": {
        "slug": "barbers", "title": "גבי למספרות · תזכורות תשלום",
        "h1": "«תרשום לי» הפך לחשבונית פתוחה?",
        "lead": "לקוח קבוע, יתרה אחרי אירוע, מלון שמשלם בשוטף. גבי מכין תזכורת מנומסת בשם המספרה, עם קישור לתשלום, ואתה מאשר כל הודעה.",
        "pains": ["לא נעים להזכיר ללקוח קבוע", "יתרות של כלות ואירועים נשכחות", "לקוח עסקי משלם רק כשמזכירים"],
        "faq": [("זה לא יפגע בלקוחות הקבועים?", "הנוסח קצר, עובדתי וחם, ויוצא בשם המספרה. אתה רואה ומאשר כל הודעה, ואפשר לערוך."),
                ("ולקוח עסקי עם טלפון קווי?", "גבי שולח לו מייל במקום SMS. בלי טלפון נייד ובלי מייל, התזכורת נחסמת ולא מנחשים.")],
    },
    "garage": {
        "slug": "garages", "title": "גבי למוסכים · תזכורות תשלום",
        "h1": "שחררת רכב על אמון. ועכשיו?",
        "lead": "כל בוקר תזכורת מוכנה, עם קישור לתשלום, בשם המוסך. לחיצה אחת לאישור, וההודעה יוצאת בשעה סבירה.",
        "pains": ["«אעביר מחר» שהפך לשבועיים", "ציים ועסקים בשוטף+", "אין זמן לשבת על הטלפון"],
        "faq": [("מה עם לקוח עסקי (צי רכב)?", "התזכורת יכולה לצאת במייל למנהלת החשבונות שלו, עם מספר החשבונית והסכום."),
                ("אפשר לחשבונית אחת יותר מ-3 תזכורות?", "לא. אחרי 3 גבי עוצר ומעדכן אותך, וההמשך אצלך.")],
    },
    "clinic": {
        "slug": "clinics", "title": "גבי לקליניקות · תזכורות תשלום",
        "h1": "תזכורת על החשבונית. בלי מילה על הטיפול.",
        "lead": "קלינאיות, מטפלים, מרפאות בעיסוק: גבי מזכיר רק מספר חשבונית וסכום, עם קישור לתשלום. אתה רואה כל מילה לפני שהיא יוצאת.",
        "pains": ["לא נעים לערבב כסף בטיפול", "הורים שמשלמים אחרי סדרה", "פרטיות המטופלים"],
        "faq": [("מה מופיע בהודעה?", "שם הקליניקה, מספר החשבונית, הסכום וקישור לתשלום. שום תיאור טיפול מהחשבונית לא יוצא ללקוח."),
                ("ההורה רשום במערכת החשבוניות כ«הורי איתי»?", "הפנייה נשמרת כמו שהיא: «שלום הורי איתי», ולא «שלום הורי».")],
    },
    "cpa": {
        "slug": "accountants-clients", "title": "גבי לעסקים של רו״ח · תזכורות תשלום",
        "h1": "₪15K פתוחים מעל 30 יום, ואין זמן לעקוב?",
        "lead": "יועצים, בעלי מקצוע וחוגים: רשימה אחת של מה שפתוח, ותזכורות מוכנות לאישור. מחיר קבוע, בלי אחוז מהגבייה.",
        "pains": ["חשבוניות גדולות שנמרחות", "הרבה חשבוניות קטנות", "אין מי שיעקוב"],
        "faq": [("ואם הלקוח מבקש תשלומים?", "גבי מכין הצעה בלי ריבית ובלי תוספת, ומחכה לאישור שלך."),
                ("ומה עם רואה החשבון שלי?", "גבי הוא כלי של העסק. הוא קורא ממערכת החשבוניות בלבד, ולא משנה מסמכים.")],
    },
}


def sample_sms(vertical: str) -> str:
    """התזכורת הראשונה (SMS) שגבי היה מכין לענף הזה — מהשירות האמיתי, על חשבוניות הדוגמה."""
    mock = GreenInvoiceMock(api_id=DEMO_ID, api_secret=DEMO_SECRET, docs=beta_docs(vertical),
                            deliver=lambda url, payload: None)
    gi = GreenInvoiceClient(SANDBOX, DEMO_ID, DEMO_SECRET, transport=httpx.MockTransport(mock.handler))
    s = load_settings({"BUSINESS_NAME": beta_business(vertical), "SMS_SENDER_ID": "GabiDemo",
                       "PAYMENT_LINK_MODE": "static", "PAYMENT_LINK": DEMO_PAY_LINK,
                       "PAYMENT_DOMAINS": "pay.example", "EMAIL_FROM": "gabi@example.com",
                       "EMAIL_REPLY_TO": "owner@example.com", "TRIAL_START": "2026-11-03",
                       "PUBLIC_BASE_URL": f"https://{DOMAIN}"})
    svc = CollectService(s, DB(":memory:"), gi=gi, clock=FixedClock(DEMO_NOW))
    svc.sync()
    # כמו בעל העסק ביום הראשון: עובר על רשימת הפתוחות ומאשר שהן עדיין פתוחות (שער open_review נשאר דלוק)
    svc.confirm_open_list([x["id"] for x in svc.open_list()["pending"]], [])
    for rid in svc.plan():
        p = svc.preview(rid)
        for m in p["messages"]:
            if m["channel"] == "sms" and not p["block_reason"]:
                return re.sub(r"/p/[A-Za-z0-9]{7}\b", f"/p/{DEMO_CODES[vertical]}", m["body"])
    raise RuntimeError(f"{vertical}: אין SMS לדוגמה")


def _style() -> str:
    src = (ROOT / "marketing/landing/index.html").read_text(encoding="utf-8")
    return re.search(r"<style>(.*?)</style>", src, re.S).group(1)


def page(vertical: str) -> str:
    c, e = COPY[vertical], html.escape
    sms = sample_sms(vertical)
    pains = "".join(f'<div class="card"><h3>{e(p)}</h3></div>' for p in c["pains"])
    faq = "".join(f"<details><summary>{e(q)}</summary><p>{e(a)}</p></details>" for q, a in c["faq"])
    sender = sms.split(":")[0]
    return f"""<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>{e(c['title'])}</title>
<meta name="description" content="{e(c['lead'])}">
<style>{_style()}</style>
</head>
<body>
<!-- נוצר אוטומטית: marketing/landing/for/build.py · אל תערכו ידנית -->
<div class="draft" role="note">טיוטה, לא לפרסום · דף לענף: {e(BETA_VERTICALS[vertical]['label'])} · «טיוטה – לבדיקת עו״ד»</div>
<header><div class="wrap">
  <a class="brand" href="../index.html" aria-label="גבי – תזכורות תשלום, לדף הראשי">
    <svg width="38" height="38" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d="M22 13h12a4 4 0 0 1 4 4v20" fill="none" stroke="#10B981" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M38 37l-11 9" fill="none" stroke="#10B981" stroke-width="7" stroke-linecap="round"/>
      <path d="M14 50q18 12 36 0" fill="none" stroke="#10B981" stroke-width="5" stroke-linecap="round"/>
      <circle cx="48" cy="21" r="4.5" fill="#0F172A"/>
    </svg>
    <span><b>גבי</b><small>תזכורות תשלום</small></span>
  </a>
  <a class="btn primary" href="../index.html#price">14 ימי ניסיון</a>
</div></header>
<main>
<section class="hero"><div class="wrap">
  <div>
    <h1>{e(c['h1'])}</h1>
    <p class="lead">{e(c['lead'])}</p>
    <div class="cta"><a class="btn primary" href="../index.html#price">התחילו 14 ימי ניסיון</a></div>
    <p class="trust">הכסף שלך חוזר. בלי שתצטרך לרדוף. · ₪119 לחודש או ₪1,190 לשנה, כולל מע״מ ככל שחל · בלי כרטיס אשראי לניסיון</p>
  </div>
  <div class="phone" aria-label="דוגמה לתזכורת SMS, נוצרה על ידי גבי מחשבוניות דוגמה בדויות">
    <div class="sender">SMS מאת: {e(sender)}</div>
    <div class="bubble" data-sms>{e(sms)}</div>
    <div class="paid">ההודעה הזו נוצרה על ידי גבי עצמו, מחשבוניות דוגמה בדויות של {e(BETA_VERTICALS[vertical]['label'])}. היא יוצאת רק אחרי שתאשר.</div>
  </div>
</div></section>
<section class="block"><div class="wrap">
  <h2 class="center">מכירים את זה?</h2>
  <div class="grid">{pains}</div>
</div></section>
<section class="block alt"><div class="wrap">
  <h2 class="center">אתה בשליטה</h2>
  <ul class="checks">
    <li>שום הודעה לא יוצאת בלי שאישרת אותה</li>
    <li>עד 3 תזכורות לחשבונית (יום 1, יום 7 עם אפשרות לתשלומים, יום 14), ואז גבי עוצר ומעדכן אותך</li>
    <li>בין 08:00 ל-20:00. לא בשישי אחה״צ, לא בשבת ולא בחג</li>
    <li>הכסף עובר לעמוד התשלום שלך. אנחנו לא מחזיקים כסף</li>
  </ul>
</div></section>
<section class="block"><div class="wrap" style="max-width:780px">
  <h2 class="center">שאלות</h2>
  {faq}
</div></section>
</main>
<footer><div class="wrap">
  <span>© 2026 גבי – תזכורות תשלום · [שם החברה בע״מ · ח.פ. ___ · כתובת: ימולאו לפני השקה]</span>
  <span>חשבונית ירוקה ו-morning הם סימנים מסחריים של בעליהם. גבי הוא מוצר עצמאי ואינו קשור אליהם.</span>
  <span><a href="../../terms.html" style="color:inherit">תנאי שימוש</a> · <a href="../../privacy.html" style="color:inherit">מדיניות פרטיות</a> · <a href="../../accessibility.html" style="color:inherit">הצהרת נגישות</a> (טיוטה – לבדיקת עו״ד)</span>
</div></footer>
</body>
</html>
"""


def out_path(vertical: str) -> Path:
    return HERE / f"{COPY[vertical]['slug']}.html"


def main(argv: list[str]) -> int:
    stale = []
    for v in BETA_VERTICALS:
        text = page(v)
        p = out_path(v)
        if "--check" in argv:
            if not p.is_file() or p.read_text(encoding="utf-8") != text:
                stale.append(p.name)
        else:
            p.write_text(text, encoding="utf-8")
            print(f"✓ {p.relative_to(ROOT)}")
    if stale:
        print("✗ דפים לא מעודכנים (הריצו build.py):", ", ".join(stale))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
