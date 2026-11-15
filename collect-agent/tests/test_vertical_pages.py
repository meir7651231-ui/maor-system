"""דפי נחיתה לפי ענף (marketing/landing/for/): הדוגמה בכל דף היא הודעת גבי האמיתית על חשבוניות הדוגמה של הענף.

נועל: הדפים קיימים ומעודכנים מול build.py · ה-SMS בדף = מה שהשירות היה מכין (לא נוסח שכתבנו ביד)
· ≤2 חלקי SMS · עובר את מסנן הניסוח · קליניקה: אף תיאור טיפול מהחשבוניות לא מופיע בדף · טיוטה + noindex
· בלי משאבים חיצוניים ובלי טופס ששולח · מחיר והכרעות מאיר · בלי טענות גורפות · הדומיין מ-launch.json.
"""
import html
import importlib.util
import re
from pathlib import Path

import pytest

from app import compliance
from app.beta_seeds import BETA_VERTICALS, beta_business, beta_docs

ROOT = Path(__file__).resolve().parents[1]
FOR = ROOT / "marketing/landing/for"
spec = importlib.util.spec_from_file_location("vbuild", FOR / "build.py")
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)
VERTICALS = list(BETA_VERTICALS)


def _page(v):
    p = build.out_path(v)
    assert p.is_file(), f"חסר דף לענף {v}: {p.name} (python3 marketing/landing/for/build.py)"
    return p.read_text(encoding="utf-8")


def _sms_in(text):
    return html.unescape(re.search(r"<div class=\"bubble\" data-sms>(.*?)</div>", text, re.S).group(1))


def test_every_beta_vertical_has_a_page_and_it_is_fresh():
    assert set(build.COPY) == set(BETA_VERTICALS)
    assert build.main(["--check"]) == 0


@pytest.mark.parametrize("v", VERTICALS)
def test_sample_sms_is_the_real_product_output(v):
    text = _page(v)
    sms = _sms_in(text)
    assert sms == build.sample_sms(v)
    assert sms.startswith(beta_business(v) + ":"), "ההודעה לא מזהה את העסק"
    assert compliance.sms_segments(sms) <= 2, sms
    assert compliance.violations(sms, compliance.Rules(
        business=beta_business(v), payment_link=re.search(r"https://\S+", sms).group(0),
        allow_debt_word=False)) == []
    assert f"https://{build.DOMAIN}/p/" in sms, "הקישור לא מהדומיין היחיד"


@pytest.mark.parametrize("v", VERTICALS)
def test_page_rules(v):
    text = _page(v)
    assert 'name="robots" content="noindex' in text and "טיוטה, לא לפרסום" in text
    assert "₪119" in text and "₪1,190" in text and "כולל מע״מ ככל שחל" in text
    assert "הכסף שלך חוזר. בלי שתצטרך לרדוף." in text
    assert not re.search(r'(src|href)="https?://', text), "משאב/קישור חיצוני בטיוטה"
    for bad in ("<form", "fetch(", "XMLHttpRequest", "sendBeacon", "localStorage", "<script"):
        assert bad not in text, bad
    low = re.sub(r"<style>.*?</style>", "", text, flags=re.S).lower()   # CSS (width:100%) אינו טענה
    for bad in ("whatsapp", "וואטסאפ", "העוזר לגביית", "מובטח", "מבטיח", "100%", "מוצפן", "חוקי"):
        assert bad not in low, bad


def test_clinic_page_leaks_no_treatment_words():
    """פרטיות: שום תיאור טיפול מהחשבוניות לא בהודעה; ותיאור מלא (אבחון/סוג טיפול) לא מופיע בשום מקום בדף.
    (המילה הכללית «טיפול» מותרת בקופי שפונה לבעל הקליניקה — לא בהודעה למטופל.)"""
    text = _page("clinic")
    sms = _sms_in(text)
    for d in beta_docs("clinic"):
        desc = d["description"]
        if desc:
            assert desc not in sms, desc
            if len(desc) > 6:
                assert desc not in text, desc
    assert "טיפול" not in sms
