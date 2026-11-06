# Collect Agent — סוכן גבייה לעסקים קטנים (שלב 1, dry-run)

```bash
cd collect-agent
pip install -e '.[dev]'
python3 -m pytest -q                      # 56 בדיקות, בלי רשת
python3 -I scripts/demo_dry_run.py        # הדגמה מלאה אופליין
uvicorn app.main:_lazy_app --factory      # שרת (dry-run; sync דורש מפתחות sandbox ב-.env)
```

מבנה: `app/greeninvoice.py` (לקוח sandbox) · `policy.py` (מתי מותר) · `service.py` (תור+אישורים) ·
`whatsapp.py` (DryRunSender בלבד) · `assistant.py` (סיווג תשובות) · `plans.py` (פריסה) · `templates.py`.
מסמכים: `docs/MARKET-RESEARCH.md`, `docs/MVP-SPEC.md`. סטטוס: `STATUS.md`.
