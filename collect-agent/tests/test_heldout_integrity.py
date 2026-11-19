"""גבי בדיקות: נעילת הסטים המוחזקים החיצוניים בשער ה-CI.

השער (`test_engine_round4.test_external_blind_sets_have_no_silent_critical_error`) אוסף **במשתמע** כל סט
שיש לו כותרת `## <שם>` ב-RESULTS.md. שני סיכונים שאיש לא בדק:
  1. כותרת שנמחקה/שונתה ⇒ הסט נשמט מהשער בשקט (למשל סט המשפט 2425167 — «הזוויות המשפטיות»).
  2. עריכת קובץ הסט אחרי המסירה (כוונון הציפיות לפי המנוע) ⇒ הסט כבר לא עיוור, והשער «עובר» על משהו אחר.
כאן: כל סט שנכתב מחוץ למנוע חייב להיות בשער, והתוכן שלו = בדיוק ה-sha256 שנרשם בהודעת ה-commit של המסירה.
סט חדש = שורה חדשה כאן (עם ה-hash מהודעת ה-commit).
"""
from __future__ import annotations

import hashlib
from pathlib import Path

import pytest

from tests import test_engine_round4 as gate

HELDOUT = Path(__file__).resolve().parents[1] / "evals" / "heldout"

# שם קובץ ⇒ (מי כתב, commit החתימה, sha256). commit החתימה = המסירה, או תיקון מבני מתועד אחריה:
# qa6 ⇒ acdca3a4 (תוויות intent ל-5 מלכודות כשה-harness התחיל לחייב intent), qa10 ⇒ 87ae5325 (advance_days
# הועבר לרמת התור — המריץ התעלם). כל השאר = המסירה עצמה (תואם ל-sha בהודעת ה-commit, חוץ מ-self4 של המנוע).
SEALED = {
    "external-2026-11-15-critic.jsonl": ("גבי מבקר", "5cd26e8",
                                        "cbed0c0fc37462025120e0aaa9d3a6c47dff971567e626acd69260837238c6dd"),
    "external-2026-11-15-legal.jsonl": ("גבי משפט", "2425167",
                                       "6c5f519ed6dab0dcf09833378e0ae0000b33742b7562375f59b8343b323a5911"),
    "external-2026-11-15-qa.jsonl": ("גבי בדיקות", "2a2444d",
                                    "498bdc55400027bada10a33b746f23d56aaa7a65c14ab85786650f480f8bdb34"),
    "external-2026-11-15-qa2.jsonl": ("גבי בדיקות", "c858444",
                                     "b2bdeec2180c6a022b544d29b940969e420534775fdcc53d708ae39737f37cb4"),
    "external-2026-11-15-qa3.jsonl": ("גבי בדיקות", "1ca5d8c",
                                     "58249add69b1cee9de33f20175707f6fd0e726a8662b4c84faa06ea88c510dfb"),
    "external-2026-11-16-qa6.jsonl": ("גבי בדיקות", "acdca3a",
                                     "4feef7aadbd5db5343cc8b784595de7f70ca9c01a14bf70a796e03976a4e4695"),
    "external-2026-11-16-qa7.jsonl": ("גבי בדיקות", "478c10d",
                                     "90264718e62b1cb9ed5aa1363f1aa8d93f8d6a109ebc9f2ef9006b08daca8da4"),
    "external-2026-11-16-qa8.jsonl": ("גבי בדיקות", "9792aea",
                                     "51f886ccf8940bc0ed73e2eeee1caefb852fc0c313d276111b32c9cfbd0413b0"),
    "external-2026-11-16-qa9-seq.jsonl": ("גבי בדיקות", "af1c52d",
                                         "486ff4d2eb97e1ae4896abb2a43d410c972aac4e06952f5a760c3e9b14b0561e"),
    "external-2026-11-16-self4.jsonl": ("גבי מנוע", "444ccee",
                                       "c75f957296aec029d12c966b5b0b97cc21473b081c89af8d669b84a391ae8bab"),
    "external-2026-11-17-qa10-seq.jsonl": ("גבי בדיקות", "87ae532",
                                          "17acfb8381723423487af8eecbd6adabbf2acc0fab0edebcf9e1cf73f098142a"),
    "external-2026-11-17-qa11-seq.jsonl": ("גבי בדיקות", "74c7e91",
                                          "2a2281556bf84bf0ebb8424d8df09e2edc3b824608d06b51c7b70691cd4cd197"),
    "external-2026-11-17-qa12-seq.jsonl": ("גבי בדיקות", "216a158",
                                          "ccfc065677b86032815f88142103920aa267ef18975427d266da6480847033ce"),
    "external-2026-11-17-qa13-seq.jsonl": ("גבי בדיקות", "4d49432",
                                          "fcd7da3a8db86fed6b231db8af98a93f60def6ec73aeca89f633d62935cfab55"),
    "external-2026-11-17-qa14-seq.jsonl": ("גבי בדיקות", "c08bd89",
                                          "571049541c2c55ea2d3eb7755bb02157441f0ac3e210a666b84238574c7476ad"),
    "external-2026-11-17-qa15-seq.jsonl": ("גבי בדיקות", "64149bc",
                                          "9c2caff021b72caa26d725049f1566b7754c64e155c6570c9fecaed97dac883b"),
    "external-2026-11-17-qa16-seq.jsonl": ("גבי בדיקות", "3a72a19",
                                          "babd510a7437d240f58872ab941b3e5645f536d9c7df3181cad6b27b160acfb9"),
    "external-2026-11-17-qa17-seq.jsonl": ("גבי בדיקות", "e42854b",
                                          "b81882345ac6445b52ad0c6b3b45dc385a3dfae488d8aa3a3aa4e161ad333388"),
    "external-2026-11-18-qa18-seq.jsonl": ("גבי בדיקות", "466fc60",
                                          "f86f487b8ab63fa07bde409ac25f78389c2f42eca94483f7db6a3f336f53cfe3"),
}


@pytest.mark.parametrize("name", sorted(SEALED))
def test_external_set_is_unchanged_since_handover(name):
    author, commit, sha = SEALED[name]
    got = hashlib.sha256((HELDOUT / name).read_bytes()).hexdigest()
    assert got == sha, (f"{name} ({author}, {commit}) שונה אחרי המסירה — הסט כבר לא עיוור. "
                        "תיקון ציפייה = סט חדש, לא עריכה של הישן")


# שער ה-CI של המנוע (round4) בודק סטים של הודעות בודדות שנמדדו. סטי רצפים (-seq) לא בשער בכוונה (לא מכווננים
# לפיהם — ממצאיהם עוברים ל-evals/seq/ כרגרסיה), ולכן כאן רק נעילת תוכן.
GATED = sorted(n for n in SEALED if not n.endswith("-seq.jsonl") and SEALED[n][0] != "גבי מנוע")


def test_every_external_set_is_sealed():
    """סט חיצוני חדש בלי שורה ב-SEALED ⇒ נכשל (אחרת אפשר לערוך אותו בשקט)."""
    on_disk = {p.name for p in HELDOUT.glob("external-*.jsonl")}
    assert on_disk - set(SEALED) == set(), sorted(on_disk - set(SEALED))


@pytest.mark.parametrize("name", GATED)
def test_external_set_is_in_the_ci_gate(name):
    gated = {p.name for p in gate.EXTERNAL}
    assert name in gated, (f"{name} נשמט משער ה-CI (אין לו כותרת ב-RESULTS.md?) — "
                           "השער היה עובר בלי לבדוק אותו")


def test_legal_set_covers_the_legal_angles():
    """סט המשפט (הכרעת גבי משפט): עו״ד/תביעה, «החוב לא שלי», פרטיות, חדלות, מספר שגוי, קטין/נפטר, הסרה."""
    import json
    rows = [json.loads(x) for x in (HELDOUT / "external-2026-11-15-legal.jsonl").read_text("utf-8").splitlines() if x]
    intents = {r["expect"]["intent"] for r in rows}
    assert len(rows) == 30 and sum(r.get("critical", False) for r in rows) >= 20
    assert {"legal", "dispute", "wrong_person", "opt_out", "minor"} <= intents, intents
