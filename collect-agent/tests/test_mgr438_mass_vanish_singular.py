"""מנהל 438 (ℹ️ QA, e2e mode=hide): כרטיס «נעלמו» כשהמקור החזיר מסמך אחד אמר «1 מסמכים פתוחים». עכשיו יחיד;
0 ו-N נשארים כמו קודם."""
import json

import pytest


@pytest.mark.parametrize(("got", "text"), [
    (1, "בסנכרון מסמך פתוח אחד, ו-5 מתוך 6"),
    (0, "בסנכרון 0 מסמכים פתוחים, ו-5 מתוך 6"),
    (3, "בסנכרון 3 מסמכים פתוחים, ו-5 מתוך 6"),
])
def test_mass_vanish_card_count_wording(svc, got, text):
    svc._hold_mass_vanish([1, 2, 3, 4, 5], 6, got)
    row = svc.db.one("SELECT body, payload FROM messages WHERE intent='api_mass_vanish'")
    assert json.loads(row["payload"])["got"] == got
    assert text in row["body"]
    assert "1 מסמכים" not in row["body"]
