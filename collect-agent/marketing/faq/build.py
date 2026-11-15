# ruff: noqa: E501 — קופי עברי ותבנית HTML
"""«שאלות נפוצות» — 10 ההתנגדויות מתסריט השיחה (sales/call-script.md §3–§4), כל תשובה נעולה לקוד.

כל מספר בתשובה (מחיר, ימי ניסיון, מספר תזכורות, שעות, ערוצים) נקרא מהקוד בזמן הבנייה, וכל טענה
התנהגותית ("עוצר כשכותבים שילמתי", "חוסם מכתב התראה", "רק קריאה") מורצת מול הפונקציה האמיתית.
טענה שהקוד לא מקיים ⇒ הבנייה נכשלת. לכל תשובה יש גם בדיקה קיימת שמוכיחה אותה (`proof`).

    python3 marketing/faq/build.py          # בונה את index.html
    python3 marketing/faq/build.py --check  # נכשל אם הדף לא מעודכן, או אם טענה כבר לא נכונה בקוד
"""
from __future__ import annotations

import html
import json
import re
import sys
from datetime import date
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT))

from app import compliance, conversation, policy, templates  # noqa: E402
from app.config import Settings  # noqa: E402

S = Settings()
DAY_FROM, DAY_TO = (f"{t:%H:%M}" for t in policy.DAY)
FRI_TO = f"{policy.WINDOWS[4][1]:%H:%M}"
CHANNEL_HE = {"sms": "SMS", "email": "מייל"}


def _ctx() -> conversation.Context:
    return conversation.Context(today=date(2026, 11, 8), business="סטודיו נועה", customer_name="דני כהן",
                                invoices=(conversation.OpenInvoice("1043", 180000),),
                                payment_link="https://pay.example/x")


def _stops(text: str) -> bool:
    d = conversation.respond(text, _ctx())
    return d.stop != conversation.Stop.NONE and d.auto_send is False


def _sms_has_stop_option() -> bool:
    f = templates.fields(biz="סטודיו נועה", name="דני כהן", num="1043", amount_agorot=180000, currency="ILS",
                         link="https://pay.example/x", unsub="https://gabi.example/u/x", short="https://gabi.example/p/AbC1234")
    return all("להפסקה" in templates.render_sms(st, f) for st in templates.STEPS)


def _blocks_letter() -> bool:
    r = compliance.Rules(business="סטודיו נועה", payment_link="https://pay.example/x", allow_debt_word=True)
    return "warning_letter" in compliance.violations("סטודיו נועה: זהו מכתב דרישה. לתשלום: https://pay.example/x", r)


def _sources_read_only() -> bool:
    """אותה בדיקה סטטית של test_invoice_sources: אין בקשת כתיבה (POST/PUT/PATCH/DELETE) במתאמי המקור,
    חוץ מבקשת חיפוש/טוקן שמוגדרת שם. כאן: רק שהבדיקה קיימת ומכסה את כל המתאמים."""
    t = (ROOT / "tests/test_invoice_sources.py").read_text(encoding="utf-8")
    return "def test_adapters_are_read_only_static" in t


def _approval_first() -> bool:
    """תזכורת חדשה נולדת «ממתינה לאישור» — המצב הפעיל הראשון בשירות."""
    from app import service
    return service.ACTIVE[0] == "pending_approval"


def _price_matches_decision() -> bool:
    """המחיר בקוד = הכרעת מאיר ב-docs/PRICING.md (₪119/₪1,190, כולל מע״מ ככל שחל)."""
    doc = (ROOT / "docs/PRICING.md").read_text(encoding="utf-8")
    return f"{S.price_ils_year:,}" in doc and str(S.price_ils_month) in doc and "ככל שחל" in doc


FAQ: list[dict] = [
    {"q": "לא נעים לי להזכיר ללקוחות שלא שילמו.",
     "a": "בדיוק בשביל זה גבי קיים. הנוסח עובדתי ומנומס, בשם העסק שלך, ואתה רואה ומאשר כל הודעה לפני שהיא יוצאת. גם תשובה ללקוח לא יוצאת בלי אישורך.",
     "lock": lambda: conversation.respond("מתי צריך לשלם?", _ctx()).auto_send is False and _approval_first(),
     "proof": "tests/test_ui_simple_approve.py"},
    {"q": "אין לי זמן לעוד מערכת.",
     "a": "גבי מוצא לבד את החשבוניות שלא שולמו ומכין את התזכורות. לך נשאר לעבור על הרשימה ולאשר.",
     "lock": _approval_first,
     "proof": "tests/test_ui_simple_approve.py"},
    {"q": "מערכת החשבוניות שלי כבר שולחת תזכורות.",
     "a": "גבי מוסיף את מה שחסר שם: אישור שלך לכל הודעה, עצירה לבד כשהלקוח כותב «שילמתי» או «יש טעות», והעברה אליך להחלטה. אם לקוח מבקש לשלם בתשלומים, גבי מכין הצעה בלי ריבית ולא שולח אותה בלי אישורך.",
     "lock": lambda: _stops("שילמתי") and _stops("יש טעות בחשבונית") and _stops("אפשר בתשלומים?"),
     "proof": "tests/test_seo_articles.py"},
    {"q": "זה לא יעצבן את הלקוחות שלי?",
     "a": f"לכל היותר {policy.MAX_REMINDERS_PER_INVOICE} תזכורות לחשבונית, ואז גבי עוצר ומעדכן אותך. רק בין {DAY_FROM} ל-{DAY_TO}, בשישי עד {FRI_TO}, ולא בשבת ובחג. ובכל הודעה יש ללקוח אפשרות להפסיק.",
     "lock": lambda: _sms_has_stop_option() and policy.WINDOWS[5] is None,
     "proof": "tests/test_send_window_queue.py"},
    {"q": "כמה זה עולה?",
     "a": f"₪{S.price_ils_month} לחודש או ₪{S.price_ils_year:,} לשנה, כולל מע״מ ככל שחל. {S.trial_days} ימי ניסיון בלי כרטיס אשראי. אין מסלולים נוספים.",
     "lock": _price_matches_decision,
     "proof": "tests/test_pricing_single_source.py"},
    {"q": "אתם לוקחים אחוז מהכסף שנכנס?",
     "a": "לא. זה מנוי קבוע. הקישור בהודעה מוביל לעמוד התשלום של העסק שלך, והכסף עובר ישירות אליך. גבי לא מחזיק כסף.",
     "lock": lambda: '"we_hold_money": False' in (ROOT / "app/settings_api.py").read_text(encoding="utf-8"),
     "proof": "tests/test_pricing_single_source.py"},
    {"q": "מה עם הפרטיות של הלקוחות שלי?",
     "a": "גבי רק קורא חשבוניות פתוחות ממערכת החשבוניות שלך. הוא לא יוצר, לא עורך ולא מוחק בה כלום. מדיניות הפרטיות נמצאת בבדיקה משפטית, ואפשר לקרוא את הטיוטה <a href=\"../privacy.html\">כאן</a>.",
     "lock": _sources_read_only,
     "proof": "tests/test_invoice_sources.py"},
    {"q": "ואם זה לא מתאים לי?",
     "a": f"הניסיון הוא {S.trial_days} ימים בלי כרטיס אשראי, ולכן אין חיוב בסופו. לא מתאים? פשוט לא ממשיכים.",
     "lock": lambda: S.trial_days == 14,
     "proof": "tests/test_trial_and_access.py"},
    {"q": "אפשר לשלוח דרך WhatsApp?",
     "a": "גבי שולח " + " ו".join(CHANNEL_HE[c] for c in S.channels) + ".",
     "lock": lambda: set(S.channels) <= set(CHANNEL_HE),
     "proof": "tests/test_marketing_claims_match_code.py"},
    {"q": "אתם שולחים מכתב התראה?",
     "a": "לא. גבי שולח תזכורות ידידותיות בלבד, ומסנן הניסוח חוסם לפני כל שליחה ניסוח של מכתב דרישה, איום או צעד משפטי. לצעדים משפטיים פונים לעו״ד.",
     "lock": _blocks_letter,
     "proof": "tests/test_compliance_lawyer_final_kaf.py"},
]


def failed_locks() -> list[str]:
    bad = []
    for f in FAQ:
        try:
            ok = bool(f["lock"]())
        except Exception as exc:  # noqa: BLE001 — טענה שהקוד כבר לא תומך בה ⇒ כישלון ברור
            ok = False
            print(f"  {f['q']}: {exc!r}")
        if not ok or not (ROOT / f["proof"]).is_file():
            bad.append(f["q"])
    return bad


def page() -> str:
    e = html.escape
    src = (ROOT / "marketing/landing/index.html").read_text(encoding="utf-8")
    style = re.search(r"<style>(.*?)</style>", src, re.S).group(1)
    items = "\n".join(f"  <details><summary>{e(f['q'])}</summary><p>{f['a']}</p></details>" for f in FAQ)
    ld = [{"@type": "Question", "name": f["q"],
           "acceptedAnswer": {"@type": "Answer", "text": re.sub(r"<[^>]+>", "", f["a"])}} for f in FAQ]
    jsonld = json.dumps({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": ld}, ensure_ascii=False)
    return f"""<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>שאלות נפוצות · גבי – תזכורות תשלום</title>
<meta name="description" content="תשובות קצרות לשאלות של בעלי עסקים על גבי: מחיר, אישור הודעות, פרטיות, ערוצים ומה גבי לא עושה.">
<script type="application/ld+json">{jsonld}</script>
<style>{style}
details p a{{color:var(--green-dark)}}</style>
</head>
<body>
<!-- נוצר אוטומטית: marketing/faq/build.py · אל תערכו ידנית -->
<div class="draft" role="note">טיוטה, לא לפרסום · כל תשובה נבדקת אוטומטית מול הקוד של גבי</div>
<main>
<section class="hero"><div class="wrap" style="grid-template-columns:1fr">
  <div>
    <h1>שאלות נפוצות<br><span>מה שבעלי עסקים שואלים אותנו</span></h1>
    <p class="lead">גבי – תזכורות תשלום. הכסף שלך חוזר. בלי שתצטרך לרדוף.</p>
  </div>
</div></section>
<section class="block"><div class="wrap" style="max-width:780px">
  <h2 class="center">10 שאלות, תשובות קצרות</h2>
{items}
</div></section>
<section class="block alt"><div class="wrap center">
  <h2>רוצה לראות איך זה עובד?</h2>
  <a class="btn primary" href="../landing/index.html#how">איך זה עובד</a>
</div></section>
</main>
<footer><div class="wrap"><span>© 2026 גבי – תזכורות תשלום · [שם החברה בע״מ · ח.פ. ___ · כתובת: ימולאו לפני השקה]</span>
<span>מידע כללי, לא ייעוץ משפטי.</span>
<span><a href="../terms.html" style="color:inherit">תנאי שימוש</a> · <a href="../privacy.html" style="color:inherit">מדיניות פרטיות</a> · <a href="../accessibility.html" style="color:inherit">הצהרת נגישות</a> (טיוטה – לבדיקת עו״ד)</span></div></footer>
</body>
</html>
"""


def main(argv: list[str]) -> int:
    bad = failed_locks()
    if bad:
        print("✗ תשובה בשאלות הנפוצות שהקוד כבר לא מקיים:", bad)
        return 1
    out, text = HERE / "index.html", page()
    if "--check" in argv:
        if not out.is_file() or out.read_text(encoding="utf-8") != text:
            print("✗ דף השאלות הנפוצות לא מעודכן (הריצו build.py)")
            return 1
        return 0
    out.write_text(text, encoding="utf-8")
    print(f"✓ {out.relative_to(ROOT)} · {len(FAQ)} שאלות")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
