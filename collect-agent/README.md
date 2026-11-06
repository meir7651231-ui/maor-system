# גבי – תזכורות תשלום (שלב 1, dry-run)

```bash
cd collect-agent
pip install -e '.[dev]'
python3 -m pytest -q                      # 84 בדיקות, בלי רשת
./demo.sh                                 # ⭐ הדגמה מקצה לקצה: שרת + נתוני דמו + דשבורד ב-/ui
python3 -I scripts/demo_dry_run.py        # הדגמה מלאה אופליין
uvicorn app.main:_lazy_app --factory      # שרת (dry-run; ממשק אישורים ב-/ui; sync דורש מפתחות sandbox ב-.env)
```

מבנה: `app/greeninvoice.py` (לקוח sandbox) · `policy.py` (מתי מותר) · `service.py` (תור+אישורים) ·
`channels.py` (SMS 019/InforU/Twilio + מייל, DryRunSender בלבד) · `paylinks.py` (קישורי תשלום) · `assistant.py` (סיווג תשובות) · `plans.py` (פריסה) · `templates.py`.
מסמכים: `docs/MARKET-RESEARCH.md`, `docs/MVP-SPEC.md`. סטטוס: `STATUS.md`.
