# גבי – תזכורות תשלום (שלב 1, dry-run)

```bash
cd collect-agent
./demo.sh                                 # ⭐ הדגמה מקצה לקצה: mock חשבונית ירוקה + שרת + נתוני דמו
./demo.sh --check                         # אותו דבר, מאמת את כל השרשרת ויוצא (0 = הכול עובד; רץ ב-CI)
```

`demo.sh` לא דורש הכנה: אם לפייתון של המערכת חסרות תלויות הוא יוצר `.venv` מקומי ומתקין בו
(לא נוגע בחבילות המערכת), ואם יש Node הוא בונה פעם אחת את הממשק המעוצב (`web/`, מוגש ב-`/app/`;
`SKIP_WEB=1` מדלג). הכתובות וקוד הגישה מודפסים בהפעלה: `/app/` (הממשק), `/ui` (דשבורד פשוט),
`/pay/<קוד>` ו-`/p/<קוד>` (עמוד החייב מה-SMS). הכול dry-run — אף SMS/מייל לא יוצא, וחשבונית ירוקה
היא שרת mock מקומי (`app/gi_mock.py`).

פיתוח:

```bash
python3 -m pip install -e '.[dev]'        # או: source .venv/bin/activate אחרי ./demo.sh
python3 -m pytest -q                      # ~1,970 בדיקות, בלי רשת
python3 -I scripts/demo_dry_run.py        # התרחיש המלא בטרמינל, בלי שרת
OWNER_API_TOKEN=<32+ תווים> DEMO=1 uvicorn app.main:_lazy_app --factory   # שרת עם נתוני דמו; בלי טוקן לא עולה
cd web && npm ci && npm test && npm run typecheck   # הממשק; e2e ב-web/e2e/
```

מבנה: `app/main.py` (API + עמודי השרת) · `greeninvoice.py` (לקוח) + `gi_mock.py` (mock) · `policy.py` (מתי מותר) ·
`service.py` (תור+אישורים) · `channels.py` (SMS 019/InforU/Twilio + מייל, DryRunSender בלבד) · `paylinks.py` ·
`conversation.py`/`inbox.py` (תשובות ותיבת בעל העסק) · `plans.py` (פריסה) · `templates.py` · `demo.py`/`demo_data.py` (נתוני הדמו).
מסמכים: `docs/` (MVP-SPEC, PRICING, מחקר שוק), `DESIGN.md` (הממשק), `team/` (תפקידים). סטטוס: `STATUS.md`.
