"""מבקר סבב 294 (🟡, גבי חיבורים): RateLimiter מעבר ל-max_keys — כל בקשה סורקת את כל החלונות (CPU), והזיכרון לא נחסם.

✓ אימות 293א/ב (מנהל 472): webhook עם מפתח ספק תקין בדלי נפרד («הסר» אחרי 120+ דיווחי מסירה = 200); ניחוש טוקנים לא נועל
   בעלים עם טוקן תקין (קבצי 293 בלי xfail).
[מאומת] `check()` רושם מפתח לכל כתובת; כש-`len(_hits) > max_keys` (50,000) הוא קורא ל-`gc()` — שמוחק **רק**
חלונות שפגו. תוקף שמסובב כתובות (IPv6 /64 = 2⁶⁴ כתובות) ממלא 50,001 מפתחות בתוך החלון (60 שנ׳ ל-/p/)
⇒ מאז **כל** בקשה (גם של לקוח
אמיתי) מריצה סריקה מלאה: 200 בקשות = 2.06 שנ׳ (~10ms לבקשה, וגדל), בתוך ה-middleware האסינכרוני ⇒ חוסם את לולאת
האירועים לכל המשתמשים. `len(_hits)` ממשיך לגדול (50,201) — «הגנת זיכרון» לא מגבילה. אין קיבוץ IPv6 לפי /64 ⇒ גם
ההגבלה פר-כתובת עצמה עקיפה בסיבוב.
ℹ️ (BACKLOG גבי חיבורים): `TRUST_PROXY_HEADERS` לא מופיע ב-.env.example / בתיעוד הפריסה — מאחורי proxy בלעדיו כל הלקוחות
   = כתובת אחת ⇒ /p/ = 60 לדקה **לכל הלקוחות יחד**.
מצופה: gc לא יותר מפעם בחלון (או LRU חסום), מפתחות IPv6 מקובצים ל-/64.
רכיב: app/ratelimit.py → RateLimiter.check / gc · app/main.py → client_ip.
"""
from __future__ import annotations

from app.ratelimit import RateLimiter


def _flood(rl, n):
    for i in range(n):
        rl.check("public_link", f"2001:db8::{i:x}")


def test_under_cap_no_gc_control():
    rl = RateLimiter(max_keys=1000)
    calls = {"n": 0}
    orig = rl.gc
    rl.gc = lambda: (calls.__setitem__("n", calls["n"] + 1), orig())[1]
    _flood(rl, 900)
    assert calls["n"] == 0


def test_over_cap_gc_not_on_every_request_and_bounded():
    rl = RateLimiter(max_keys=1000)
    calls = {"n": 0}
    orig = rl.gc
    rl.gc = lambda: (calls.__setitem__("n", calls["n"] + 1), orig())[1]
    _flood(rl, 1200)
    assert calls["n"] <= 5, f"gc רץ {calls['n']} פעמים על 200 בקשות"
    assert len(rl._hits) <= 1000
