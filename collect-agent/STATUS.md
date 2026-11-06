# STATUS — גבי, העוזר לגביית חובות · שלב 1 · עודכן 6.11.2026 (סבב אינטגרציה)

ענף אינטגרציה: `collect-agent` (לא מוזג ל-main, ולא ימוזג בלי אישור מפורש של מאיר). תיקייה: `collect-agent/`.

## 🎯 הדגמה מקצה לקצה: עובדת
```bash
cd collect-agent && ./demo.sh          # ואז http://127.0.0.1:8000/ui  (PORT=… לשינוי)
./demo.sh --check                      # מרים, מאמת API ודשבורד, יוצא. רץ ב-CI
```
השרת עולה עם 6 חשבוניות פתוחות בדויות (sandbox מדומה של חשבונית ירוקה, בלי רשת) ומריץ תרחיש: סנכרון ⇒ 6 תזכורות ⇒ אישור 4 (אחת נחסמת `no_contact`, ואחת של יוסי נשארת לאישור בממשק) ⇒ שליחה ב-dry-run. **כל SMS וכל מייל מודפסים ללוג** עם קישור תשלום דמו `https://pay.example/gabi-demo?invoice=…`. אחר כך 3 תשובות לקוחות (שילמתי ⇒ מושהה ועובר לבעל העסק, הסר, שאלה במייל ⇒ מענה אוטומטי) ⇒ מיכל משלמת ⇒ הסנכרון סוגר את החשבונית.
**הדשבורד ב-`/ui` (חדש):** 8 כרטיסי סיכום (חוב פתוח, באיחור, ממתינות לאישורך, SMS ומיילים שנשלחו, דורש טיפול, נסגרו) + טבלת חובות עם מועד, ימי איחור, מספר תזכורות וסטטוס אחרון. מתחת: תור האישורים הקיים. **אומת בדפדפן:** אישור התזכורת של יוסי ואז «שליחה» מעדכנים את הדשבורד. 0 שגיאות קונסולה, ואין גלילה אופקית במובייל (iPhone 13). השעון בהדגמה קבוע על ראשון 8.11.2026 10:00, כדי שכללי שבת ושעות לא יחסמו.

## מה נוסף בסבב האינטגרציה
| מה | הוכחה |
|---|---|
| `demo.sh` + `app/demo.py` + `app/demo_data.py` (מצב `DEMO=1`) | `test_demo_scenario_end_to_end` · `./demo.sh --check` ירוק |
| `GET /dashboard` + דשבורד ב-`/ui` | `test_dashboard_totals_and_rows` · צילומי מסך בדפדפן |
| **באג שנתפס בהדגמה:** אחרי «שילמתי» הסבב הבא שלח ללקוח תזכורת שוב. עכשיו הלקוח מושהה (`paused_reason`) עד `POST /customers/{id}/resume` או עד שהחשבונית נסגרת | `test_paid_claim_pauses…` + **מוטציה:** ביטול ההשהיה ⇒ הבדיקה נופלת |
| `pip install -e` היה שבור (התיקייה `team/` שברה את ה-flat-layout) ⇒ תוקן ב-`pyproject.toml` (+ `ui.html` ב-package-data) + תצורת ruff מקומית | ההתקנה עוברת, ruff נקי |
| CI: `.github/workflows/collect-agent.yml` רץ על push ו-PR לענף `collect-agent` בלבד: ruff, pytest, `demo.sh --check`, על Python 3.11 ו-3.13. בלי סודות ובלי deploy | — |
| **בדיקות: 167/167 פייתון + 7/7 web** (אחרי כל המיזוגים) · ruff נקי · `npm run build` עובר | `pytest -q` · `cd web && npm test` |

## ענפי צוות שמוזגו לסבב הזה
| ענף | תוכן | הערות מיזוג |
|---|---|---|
| `claude/bold-bell-xom3mc` | מכירות: `team/sales.md`, `gtm.md` | נקי |
| `claude/gallant-brown-ien8fb` | שיווק: `team/marketing.md` (מסרים, דף נחיתה, תסריט דמו, SEO) | נקי |
| `claude/stoic-mccarthy-23f03p` | מבקר: `team/critic.md` | נקי. ממצא 3 («שילמתי» ⇒ תזכורת נוספת) **תוקן בסבב הזה** |
| `claude/dazzling-archimedes-66mq2d` | עיצוב: `web/` (React+Tailwind RTL, מיתוג, DESIGN.md) | קונפליקט ב-`pyproject`/`.gitignore`: אוחד. נוסף ג'וב `web` ל-CI |
| `origin/collect-agent` (24c6fbf) | מנוע שיחה: `app/conversation.py` (18 כוונות) + `compliance.py` + `evals/` | נקי. evals: **315/315**, 0 טעויות שקטות. נוסף ל-CI. ⚠️ **עדיין לא מחובר ל-`service.py`**, שמשתמש ב-`assistant.py` הישן |
| `claude/funny-euler-kfq3b6` | `app/integrations/` (SMS/מייל/iCount/תשלומים, mock) | קונפליקט סמנטי: יובא `app.whatsapp` שנמחק, והופנה ל-`app.channels`. **שתי שכבות SMS במקביל** (`channels.py` ו-`integrations/sms.py`). צריך לאחד, ראו «פיתוח» למטה |

## ⏭ הצעד הבא לכל תפקיד
| תפקיד | הצעד הבא |
|---|---|
| **פיתוח** | (00) **לחבר את `conversation.py` ו-`compliance.py` ל-`service.inbound`** במקום `assistant.py`, עם ריצה של `demo.sh` לפני ואחרי. (0) **לאחד את `app/channels.py` עם `app/integrations/`**: היום יש שני adapters ל-019/InforU/Twilio, ו-`service.py` משתמש רק ב-channels. (1) קיצור ה-SMS ל-≤2 חלקים. **הורד בעדיפות:** לפי `team/market.md` §4.1 החיסכון הוא 2–3 אג׳ בלבד, כך שהקיצור לא חוסם מבחינת עלות. עדיין רצוי בגלל הקריאוּת. (2) מספר תשלומים מתוך הטקסט («ל-3 תשלומים»). ~~(3) כפתור «חידוש» ללקוח מושהה~~ ✅ בדשבורד, עם אישור בלחיצה כפולה (`test_dashboard_exposes_paused_customer_and_resume_button`, נבדק בדפדפן ונרשם ב-audit). (4) מייל נכנס |
| **עיצוב (web/)** | לחבר את `web/` ל-API האמיתי (`/dashboard`, `/reminders`, `/reminders/{id}/preview`) במקום נתוני mock. אחר כך להגיש את ה-build מ-FastAPI, כדי ש-`demo.sh` יציג אותו |
| **מוצר** | להכריע על הכלל «עצירה אחרי 3 תזכורות בלי מענה» (היום 4) ועל תמחור (ראו חסמים) |
| **תשתית** | לוודא ריצה ירוקה ראשונה של ה-workflow ב-GitHub. ה-`ci.yml` של מאור מופעל על כל `pull_request`, כולל PR לענף הזה, ולכן כדאי לסנן |
| **מחקר שוק** | ✅ **נסגר (6.11):** מחירוני SMS ציבוריים הם **2–5 אג׳ לסגמנט** (SMS4Free, TextMe, Vibrate, סקירות), כלומר תזכורת של 3 סגמנטים עולה 6–15 אג׳. ההנחה הקודמת הייתה ₪0.20–0.30. 019 ו-InforU לא מפרסמים מחיר. התמחור יושר להחלטת המנהל (₪119 + 14 יום, 300 תזכורות כלולות) ב-`team/market.md` §4. **נשאר:** מחיר מספר וירטואלי ל-2-way (לא פורסם אצל אף ספק; הצעה = מאיר) |
| **מכירות / GTM** | ✅ דף נחיתה כטיוטה: `GET /landing` (₪119 + 14 יום, מוביל ל-`/ui`, noindex, לא פורסם; `team/marketing.md` §10). טיוטות הפנייה ב-`team/sales.md` מחכות לאישור מאיר |
| **משפטי** | ✅ מיפוי 14 הדרישות לבדיקות: `tests/test_legal_requirements.py` (26 עוברות, 11 פערים בסימון xfail strict, פירוט ב-legal.md §10). **לפיתוח, דחוף:** לחבר את `conversation.respond` ל-`service.inbound`. זה סוגר את "מספר שגוי" ואת "מצוקה" בזרימה החיה. אחר כך ר-4 (סכום מעודכן לפני שליחה) |

## ⛔ חסמים (אצל מאיר)
sandbox של חשבונית ירוקה + חשבון בדיקה ב-019 · עו"ד (§81א1, DPA, 30א) · ~~סתירת תמחור~~ **הוכרע (המנהל):** ₪119 לחודש + 14 יום ניסיון. פירוט ב-`team/market.md` §4. ✅ `team/marketing.md`, `MVP-SPEC §5` ודף הנחיתה מיושרים.

## 🎨 עיצוב + ממשק (סשן מקביל, ענף `claude/dazzling-archimedes-66mq2d` מעל `collect-agent`) — ראו `DESIGN.md`
- ✅ מיתוג: לוגו SVG (בועה+₪+וי), פלטה, Rubik/Heebo, design-tokens (`web/src/brand/`).
- ✅ `web/` React+Tailwind RTL: דף נחיתה+מחירון מוצע, הרשמה, דשבורד, טבלת חשבוניות, תצוגה מקדימה SMS/מייל + "אשר ושלח" (דמו), הגדרות עסק (ספק 019/InforU/Twilio). נתוני דמו בלבד.
- ✅ נוסחי הממשק = מראה של `app/templates.py`; בדיקת סנכרון נכשלת על כל סטייה. 7/7 בדיקות + e2e Playwright (0 שגיאות קונסולה, מובייל 390px).
- ✅ `pyproject.toml`: `packages=["app"]` — בלי זה `pip install -e` נשבר (web/ ו-team/ התגלו כחבילות).
- ↩ השינויים שלי בבקאנד (SMS adapter מקביל) נגנזו ב-`git stash` — הגרסה שלכם (3a79777a) מלאה יותר; לא נגעתי ב-`app/`.

## 🔄 סבב 2 — וואטסאפ יורד, SMS + מייל (החלטת מאיר)
| מה | סטטוס | הוכחה |
|---|---|---|
| הסרת וואטסאפ | ✅ `whatsapp.py` נמחק; ערוץ `whatsapp` בקונפיג ⇒ קריסה בטעינה | `test_whatsapp_channel_refused`, `test_ui_page_has_slogan_and_no_whatsapp` |
| SMS עם adapter ניתן-להחלפה | ✅ `channels.py`: **019** (ברירת מחדל, endpoint בדיקה `/api/test`) · InforU · Twilio. כל adapter בונה את הבקשה המדויקת; סודות ממוסכים | `test_adapters_build_requests_and_mask_secrets` |
| מייל | ✅ טקסט + HTML ‏RTL (escaped) + `List-Unsubscribe` One-Click | `test_email_one_click_unsubscribe_header`, `test_email_html_escapes_and_rtl` |
| קישור תשלום בכל תזכורת | ✅ דף תשלום של חשבונית ירוקה (`POST /payments/form`, sandbox, פעם אחת לחשבונית) ⇒ נפילה לקישור קבוע ⇒ בלי קישור בטוח התזכורת **נחסמת**. רשימת דומיינים מותרים, https בלבד (נגד פישינג) | 4 בדיקות `payment_*` + 7 מקרי דומיין מתחזה |
| חוק התקשורת 30א | ✅ אפס מילות שיווק ואיום (נבדק על כל נוסח), זיהוי השולח, הסרה בכל הודעה, חלון שעות | `test_templates_polite_identified_no_marketing` ×4 (נוסחים ≤3 חלקי SMS) |
| תשובות SMS | ✅ webhook של 019 (incoming_sms / dlr / blacklist), אידמפוטנטי, **סגור בלי סוד** | 3 בדיקות `019_webhook_*` |
| הסרה בקישור | ✅ `GET/POST /u/{token}` ⇒ ביטול כל התזכורות | `test_unsubscribe_link_and_one_click` |
| ממשק `/ui` | ✅ תור אישורים: תצוגה מקדימה של SMS (מונה תווים/חלקים) ושל המייל, אישור/דחייה, סלוגן, תג "מצב בדיקה" | צילומים: `docs/screens/gabi-desktop.png`, `gabi-mobile.png` — אין גלילה אופקית, 0 שגיאות קונסולה |
| מחקר ערוצים | ✅ `docs/CHANNELS-RESEARCH.md` (ספקים, מחירים, inbound, 30א, מייל) | — |
| אפיון | ✅ `docs/MVP-SPEC.md` עודכן: §0 החלטה, §2.3א ערוצים, §4א סעיף 30א | — |

**בדיקות:** ‏`pytest` **84/84 ירוק**, בלי רשת (כל socket אמיתי ⇒ כישלון). בדיקות מוטציה: כיבוי בדיקת הדומיין או בדיקת הנייד ⇒ בדיקות נופלות. ruff נקי. `scripts/demo_dry_run.py` מריץ את כל הזרימה.

## 🔒 מעקות (ללא שינוי + חדשים)
dry-run בלבד · GI sandbox בלבד · רק DryRunSender · אין שום קוד שליחה אמיתי לאף ספק · webhook דורש סוד · סודות ממוסכים בתצוגה. לא נרשמתי לשום שירות, לא נשלחה הודעה, לא היה תשלום ולא היה פרסום.

## ⚖️ / ❓ פתוח להכרעה או לבירור
1. **019 — הודעות חוזרות:** לשם שולח אלפאנומרי אי אפשר להשיב. לברר מול 019 מספר וירטואלי ל-2-way. עד אז "הסר" עובד בקישור בלבד. מחיר ל-SMS — לקבל הצעה (שלך).
2. **אורך:** תזכורת = 3 חלקי SMS (≈168–198 תווים בעברית). קישור תשלום ארוך מחשבונית ירוקה עלול להוסיף חלק. המלצה לשלב 2: קישור קצר על דומיין שלנו (לא bit.ly).
3. **עו"ד:** האם קישור תשלום הוא "עידוד הוצאת כספים" לפי 30א (הערכתנו: לא) · התראה לפי סעיף 81א1 · הסכם עיבוד נתונים (DPA) לפי תיקון 13 · פריסה בלי ריבית.
4. **Green Invoice:** שמות השדות של `/payments/form` ושל `/documents/search` — לאמת ב-sandbox אחרי שתירשם (MVP-SPEC §6).

## ⏭ שלב 2 (דורש אותך)
הרשמה ל-sandbox של חשבונית ירוקה ולחשבון בדיקה ב-019 · אחר כך adapter שולח אמיתי מאחורי אישור מפורש · inbound למייל · DLR · הצפנת סודות · ריבוי עסקים.

## הרצה
```bash
cd collect-agent && pip install -e '.[dev]' && python3 -m pytest -q
./demo.sh                              # הדגמה מלאה + דשבורד: http://127.0.0.1:8000/ui
python3 -I scripts/demo_dry_run.py     # ההדגמה הישנה (טקסט בלבד)
uvicorn app.main:_lazy_app --factory   # שרת אמיתי (dry-run; sync דורש מפתחות sandbox)
```
