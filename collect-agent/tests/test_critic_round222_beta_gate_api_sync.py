"""מבקר סבב 222 · 🟡 — שער בטא 4 חל על ייבוא CSV בלבד; סנכרון API שומר נתוני קשר לא-סינתטיים.

רכיבים: `app/service.py` → `import_csv` (בודק `is_synthetic_contact` ⇒ `RealDataBlocked`)
מול `sync` / `ingest` (לא בודק).
`legal/BETA-GATE.md` שורת שער 4: «כשהוא כבוי, ייבוא CSV **וחיבור API** מקבלים רק נתוני דמו מסומנים, ואחרת 403».
בקוד: הסביבה מוגבלת (GREENINVOICE_ENV=sandbox/mock בלבד; iCount/רווחית/EZcount — MockTransport בלבד ⇒ SafetyError),
אבל בתוך sandbox/mock אין בדיקת סינתטיות. חשבון sandbox של עסק בבטא יכול להכיל לקוחות אמיתיים (הוקלדו לבדיקה) ⇒
נשמרים אצלנו. נבדק: `REAL_DATA_ALLOWED` כבוי ⇒ `sync()` ⇒ «דנה כהן · 050-1234567» נשמרה (לא בטווח 05X-000XXXX).
הצעה: או השער גם ב-`ingest` כש-`real_data_allowed` כבוי (כמו ב-CSV, fail-closed), או לתקן את הטענה במסמך
(«חיבור API מוגבל לסביבת sandbox/mock» — לא «רק נתוני דמו»). xfail(strict=True)."""
from dataclasses import replace
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


# מנהל 380: תוקן — השער נאכף ב-sync (RealDataBlocked לפני ingest); xfail הוסר
def test_api_sync_respects_beta_gate_or_doc_does_not_claim_it(svc):
    svc.s = replace(svc.s, real_data_allowed=False)
    try:
        svc.sync()
    except PermissionError:
        pass
    stored_real = svc.db.one("SELECT 1 FROM customers WHERE phone='050-1234567'")
    doc = (ROOT / "legal" / "BETA-GATE.md").read_text(encoding="utf-8")
    claims_api = "ייבוא CSV וחיבור API מקבלים רק נתוני דמו" in doc
    assert not (stored_real and claims_api)
