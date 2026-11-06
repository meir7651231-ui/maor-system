# STATUS — גבי – העוזר לגביית חובות · שלב 1 · 6.11.2026

ענף: `collect-agent` (לא מוזג ל-main). תיקייה: `collect-agent/` (בקאנד). העיצוב — `collect-agent/web/` (סשן מקביל).

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
python3 -I scripts/demo_dry_run.py
uvicorn app.main:_lazy_app --factory   # ואז http://127.0.0.1:8000/ui
```
