"""מבקר סבב 263 · 🟡 — לקוחה שירשה הסרה בקובץ (219א/239) מוצגת בטבלת החובות «הלקוח ביקש הסרה» — ב-/app/ וב-/ui — בעוד
שכרטיס `inherited_optout` באותו מסך אומר «הלקוח כתב עכשיו ולא ביקש הסרה».

רכיבים: `app/service.py` → `_customer_block` / `dashboard()["invoices"][*]["customer_block"]`
(opted_out=1 ⇒ `"opted_out"`,
בלי הבחנה בין בקשה לירושה) · `web/src/api.ts:257` (`opted_out: 'הלקוח ביקש הסרה'`) · `app/ui.html:183` (BLOCK.opted_out
«הלקוח ביקש הסרה»).
תרחיש: דנה «הסר אותי» ⇒ קובץ: 9001 על מיכל לוי ⇒ `dashboard()` ⇒ 9001 · מיכל לוי · customer_block=`opted_out` ⇒ «הלקוח
ביקש הסרה».
✓ 262 (מנהל 433) תוקן — «הסר» ראשון של מי שירשה ⇒ טיוטת אישור. ℹ️ /ui לא מציג כרטיסי «דורש טיפול» בכלל (לא חדשים ולא
ישנים) — עיצוב קיים (238); הכרעות inherited_optout/api_mass_vanish/שיוך 👥 רק ב-/app/.
הצעה: block נפרד `inherited_optout` («הסרה שעברה מפרטי קשר קודמים — הלקוח לא ביקש») כש-`_inherited_optout(cid)`.
xfail(strict=True)."""
from datetime import timedelta

from tests.test_critic_round239_inherited_optout import DANA, MICHAL, _row, _sent_to_dana


def test_inherited_optout_not_labeled_as_customer_request(svc, clock):
    _sent_to_dana(svc, clock)
    svc.inbound("sms", DANA, "הסר אותי")
    clock.now += timedelta(days=1)
    svc.import_csv(_row("מיכל לוי", MICHAL))
    row = next(r for r in svc.dashboard()["invoices"] if r["number"] == "9001")
    assert row["customer"] == "מיכל לוי"
    assert row["customer_block"] != "opted_out", row["customer_block"]


def test_inherited_label_and_real_optout_unchanged(svc, clock):
    """בקרות (גבי מנוע, 263): הירושה ⇒ inherited_optout (גם בגרסה המקובצת); דנה שביקשה בעצמה ⇒ opted_out."""
    _sent_to_dana(svc, clock)
    svc.inbound("sms", DANA, "הסר אותי")
    dana = svc.db.one("SELECT id FROM customers WHERE phone=?", (DANA,))["id"]
    assert svc._customer_block(dana) == "opted_out"
    clock.now += timedelta(days=1)
    svc.import_csv(_row("מיכל לוי", MICHAL))
    michal = svc.db.one("SELECT id FROM customers WHERE phone=?", (MICHAL,))["id"]
    assert svc._customer_block(michal) == "inherited_optout"
    assert svc._customer_blocks()[michal] == "inherited_optout"
    assert svc._customer_blocks()[dana] == "opted_out"
