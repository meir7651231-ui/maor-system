# ruff: noqa: E501 — קופי עברי ותבנית HTML
"""«ספריית נוסחים» — כלי חינמי (טיוטה, לא לפרסום): כל נוסח בדף מיוצר מ-app/templates.py, כלומר
**בדיוק** מה שגבי שולח, ונבדק במסנן הניסוח (compliance) ובאורך SMS. אין נוסח שנכתב ביד.

    python3 marketing/library/build.py          # בונה את index.html
    python3 marketing/library/build.py --check  # נכשל אם הדף לא מעודכן מול הנוסחים בקוד
"""
from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT))

from app import compliance, templates  # noqa: E402

DOMAIN = json.loads((ROOT / "marketing/launch/launch.json").read_text(encoding="utf-8"))["domain"]
BIZ, NAME = "סטודיו נועה", "דני כהן"
SHORT = f"https://{DOMAIN}/p/AbC1234"           # קוד דוגמה קבוע באורך אמיתי (7)
LINK = "https://pay.example/studio-noa/1043"     # עמוד התשלום של העסק (דוגמה)
UNSUB = f"https://{DOMAIN}/u/example"
STEP_TITLE = {"friendly": "תזכורת 1 · יום אחרי המועד", "plan_offer": "תזכורת 2 · יום 7, עם אפשרות לתשלומים",
              "final": "תזכורת 3 · יום 14, אחרונה"}


def variants() -> list[dict]:
    """כל הנוסחים בדף: לכל שלב — חשבונית אחת וכמה חשבוניות; SMS ומייל."""
    out = []
    for step, multi in zip(templates.STEPS, templates.STEPS_MULTI, strict=True):
        f1 = templates.fields(biz=BIZ, name=NAME, num="1043", amount_agorot=180000, currency="ILS",
                              link=LINK, unsub=UNSUB, short=SHORT)
        fm = templates.fields_multi(biz=BIZ, name=NAME, invoices=[("1043", 180000), ("1051", 64000)],
                                    currency="ILS", link=LINK, unsub=UNSUB, short=SHORT)
        for kind, st, f in (("חשבונית אחת", step, f1), ("כמה חשבוניות", multi, fm)):
            subj, text, _ = templates.render_email(st, f)
            out.append({"key": step.key, "kind": kind, "sms": templates.render_sms(st, f),
                        "subject": subj, "email": text})
    return out


def check_variant(v: dict) -> list[str]:
    """אותם כללים שהשירות אוכף לפני שליחה (service.py: compliance.violations על כל SMS)."""
    bad = compliance.violations(v["sms"], compliance.Rules(
        business=BIZ, payment_link=SHORT, max_sms_chars=templates.SMS_HARD_MAX,
        allow_debt_word=templates.debt_word_allowed(v["key"])))
    if compliance.sms_segments(v["sms"]) > 2:
        bad.append(f"sms_segments>{2}")
    return bad


def page() -> str:
    e = html.escape
    src = (ROOT / "marketing/landing/index.html").read_text(encoding="utf-8")
    style = re.search(r"<style>(.*?)</style>", src, re.S).group(1)
    cards = []
    for i, v in enumerate(variants()):
        n = compliance.sms_segments(v["sms"])
        cards.append(f"""<div class="card">
  <h3>{e(STEP_TITLE[v['key']])} <small style="color:var(--muted);font-weight:400">· {e(v['kind'])}</small></h3>
  <p style="margin:10px 0 4px;color:var(--muted);font-size:14px">SMS · {len(v['sms'])} תווים · {n} חלקים</p>
  <pre class="tpl" id="sms{i}" data-sms>{e(v['sms'])}</pre>
  <button class="btn ghost copy" type="button" data-copy="sms{i}" style="color:var(--green-dark)">העתקה</button>
  <details><summary>מייל</summary><p><b>נושא:</b> {e(v['subject'])}</p><pre class="tpl" id="mail{i}">{e(v['email'])}</pre>
  <button class="btn ghost copy" type="button" data-copy="mail{i}" style="color:var(--green-dark)">העתקה</button></details>
</div>""")
    return f"""<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>ספריית נוסחים לתזכורת תשלום · גבי</title>
<meta name="description" content="נוסחי תזכורת תשלום מנומסים ל-SMS ולמייל, להעתקה חופשית. כל נוסח עובדתי, קצר, בלי איומים ובלי שיווק.">
<style>{style}
pre.tpl{{white-space:pre-wrap;background:var(--soft);border-radius:12px;padding:12px;font:inherit;font-size:15px;margin:0 0 10px;overflow-wrap:anywhere}}
.copy{{min-height:40px;padding:6px 16px}}</style>
</head>
<body>
<!-- נוצר אוטומטית: marketing/library/build.py · אל תערכו ידנית -->
<div class="draft" role="note">טיוטה, לא לפרסום · הנוסחים מיוצרים מהקוד של גבי ונבדקים אוטומטית</div>
<main>
<section class="hero"><div class="wrap" style="grid-template-columns:1fr">
  <div>
    <h1>ספריית נוסחים<br><span>לתזכורת תשלום מנומסת</span></h1>
    <p class="lead">נוסחים קצרים ועובדתיים ל-SMS ולמייל, להעתקה חופשית. החליפו את השם, המספר והסכום. אלה בדיוק הנוסחים שגבי שולח, אחרי שבעל העסק מאשר.</p>
    <p class="trust">בלי איומים · בלי שיווק · עם קישור לתשלום · עד 2 הודעות SMS</p>
  </div>
</div></section>
<section class="block"><div class="wrap">
  <h2 class="center">3 שלבים, ואז שיחה אישית</h2>
  <div class="grid">{''.join(cards)}</div>
</div></section>
<section class="block alt"><div class="wrap center">
  <h2>רוצה שזה יקרה לבד?</h2>
  <p>גבי מתחבר לחשבונית ירוקה ומכין את התזכורות האלה כל בוקר. אתה מאשר כל הודעה. ₪119 לחודש או ₪1,190 לשנה, כולל מע״מ ככל שחל. 14 ימי ניסיון בלי כרטיס אשראי.</p>
  <a class="btn primary" href="../landing/index.html#price">לפרטים</a>
</div></section>
</main>
<footer><div class="wrap"><span>© 2026 גבי – תזכורות תשלום · [שם החברה בע״מ · ח.פ. ___ · כתובת: ימולאו לפני השקה]</span>
<span>מידע כללי, לא ייעוץ משפטי.</span>
<span><a href="../accessibility.html" style="color:inherit">הצהרת נגישות</a> (טיוטה – לבדיקת עו״ד)</span></div></footer>
<script>
// העתקה ללוח בלבד (מקומי). אין שליחה ואין שמירה.
document.querySelectorAll('button.copy').forEach(function (b) {{
  b.addEventListener('click', function () {{
    var t = document.getElementById(b.dataset.copy).textContent;
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(
      function () {{ b.textContent = 'הועתק ✓'; }}, function () {{ b.textContent = 'סמנו והעתיקו ידנית'; }});
  }});
}});
</script>
</body>
</html>
"""


def main(argv: list[str]) -> int:
    bad = {f"{v['key']}/{v['kind']}": check_variant(v) for v in variants()}
    bad = {k: x for k, x in bad.items() if x}
    if bad:
        print("✗ נוסח שלא עובר את מסנן הניסוח:", bad)
        return 1
    out, text = HERE / "index.html", page()
    if "--check" in argv:
        if not out.is_file() or out.read_text(encoding="utf-8") != text:
            print("✗ ספריית הנוסחים לא מעודכנת (הריצו build.py)")
            return 1
        return 0
    out.write_text(text, encoding="utf-8")
    print(f"✓ {out.relative_to(ROOT)} · {len(variants())} נוסחים")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
