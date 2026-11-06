# צוות · אינטגרציות (SMS · מייל · הנהלת חשבונות · קישורי תשלום)

> 6.11.2026 · קוד: `app/integrations/` · בדיקות: `tests/test_integrations_*.py` · הדגמה: `python3 -I scripts/demo_integrations.py`

## 1. סטטוס
| רכיב | ספקים | מצב |
|---|---|---|
| SMS | InforU (API v2 JSON) · 019 SMS (JSON) · Twilio (Messages API) | ✅ בנוי, dry-run + mock, נבדק |
| מייל | SMTP (smtplib) · Resend (HTTP API) | ✅ בנוי, dry-run + mock, נבדק |
| הנהלת חשבונות | חשבונית ירוקה (עוטף את `app/greeninvoice.py` הקיים) · iCount v3 | ✅ קריאה בלבד, mock. iCount מזין את אותו `CollectService.ingest` |
| קישורי תשלום | קבוע (Bit/PayBox/עמוד סליקה) · תבנית URL · טופס תשלום של חשבונית ירוקה | ✅. טופס GI = כתיבה, כבוי (ראו §5) |
| גיבוי ערוצים | `Notifier`: SMS ראשי ⇒ SMS משני ⇒ מייל | ✅ |
| WhatsApp | — | ❌ לא נבנה במכוון (מדיניות Meta, MVP-SPEC §0) |

**הוכחה:** `pytest` **136/136** (56 קיימות + 80 חדשות), בלי רשת: כל socket אמיתי בבדיקות נכשל (conftest). `ruff` נקי על הקוד החדש. **בדיקת מוטציה**: ביטלתי כל אחד מ-6 מעקות (חסימת transport אמיתי, צנזור סודות, מניעת כפילות, חסימת SMTP אמיתי, אי-גיבוי בשגיאה קבועה, כתיבה ל-GI כבויה כברירת מחדל). בכל אחד בדיקה נפלה.

## 2. מעקות בטיחות (בקוד)
- **בלי transport ⇒ dry-run.** נבנית בקשת HTTP מדויקת, היא נשמרת ב-`adapter.outbox` ומוחזר `SendResult(dry_run=True)`. אין שום קריאת רשת.
- **transport מותר רק כ-`httpx.MockTransport`.** כל transport אחר ⇒ `SafetyError` (`base.guard_transport`). SMTP: מותר רק factory שמסומן `is_mock=True`, ו-`smtplib.SMTP` נדחה.
- **iCount:** אין לו sandbox, ולכן בלי MockTransport כל קריאה ⇒ `SafetyError`.
- **טופס תשלום GI:** `registry` בונה אותו תמיד עם `allow_write=False`. ההפעלה דורשת שינוי קוד מכוון.
- **סודות לעולם לא בתצוגה.** ה-preview מצונזר: כותרות Authorization, ומפתחות token/secret/password/api_key/sid/pass בגוף ה-JSON או ה-form, וגם בתוך ה-URL. הדגמה ובדיקות מוודאות שהטוקן לא מופיע ב-outbox.
- **אידמפוטנטיות:** `idempotency_key` (למשל `reminder:42`) ⇒ שליחה שנייה מחזירה `duplicate=True` בלי קריאה. ב-Resend המפתח נשלח גם ככותרת `Idempotency-Key`.
- **קלט:** נייד ישראלי בלבד (`9725XXXXXXXX`). מספר נייח נדחה, כי SMS לנייח לא מגיע. שם-שולח עד 11 תווים לטיניים. מייל: אימות כתובת וחסימת header-injection (CRLF). קישורי תשלום ו-unsubscribe מותרים ב-https בלבד. תבנית URL מקבלת רק שדות מותרים, וכולם מקודדים.
- **תקרת עלות:** הודעה של יותר מ-4 חלקי SMS נדחית (`MAX_SEGMENTS`).

## 3. ממשק לשילוב ב-`CollectService` (למי שמחזיק את service.py)
```python
from app.integrations.registry import build_notifier, build_payment_links, build_accounting
from app.integrations.notifier import Notification
from app.integrations.payments import PaymentRequest

notifier = build_notifier(os.environ)          # dry-run בשלב 1
links    = build_payment_links(os.environ, gi_client=gi)
source   = build_accounting(os.environ, gi_client=gi)   # greeninvoice | icount
svc.ingest(list(source.iter_open_invoices()))

url = links.link_for(PaymentRequest(inv.external_id, inv.number, inv.amount_agorot)).url
rep = notifier.send(Notification(key=f"reminder:{rid}", phone=c.phone, email=c.email,
                                 sms_text=..., email_subject=..., email_text=...,
                                 unsubscribe_url=...))
rep.as_dict()   # ⇒ audit / messages.payload (בלי סודות)
```
**כללי הגיבוי (`Notifier`):** אם השגיאה זמנית (429, 5xx, שגיאת רשת), עוברים לספק ה-SMS הבא ואחריו למייל. אם השגיאה קבועה (4xx, מספר לא תקין, שגיאת הרשאה), מדלגים על שאר ספקי ה-SMS ועוברים ישר למייל. **ב-timeout עוצרים** ולא עוברים לערוץ אחר, כי ייתכן שההודעה כבר נשלחה ועדיף לא להציק פעמיים. אפשר לשנות את זה עם `failover_on_timeout=True`.
**לא מומש בתוך Notifier (שייך ל-service):** opt-out, חלון שעות, שבת/חג, פער 72 שעות ואישור בעלים. ה-Notifier רק מוסר הודעות.

## 4. ⚠️ לאמת מול חשבון אמיתי (שלב 2, אחרי הרשמה של מאיר)
השדות נכתבו לפי תיעוד ציבורי, ולא בדקתי אותם מול API חי:
| ספק | מה לאמת |
|---|---|
| InforU | כתובת `capi.inforu.co.il/api/v2/SMS/SendSms` · Basic `user:token` · `StatusId==1` = הצלחה · שם השדה `CustomerMessageId` · שדה מזהה ההודעה בתשובה |
| 019 | כתובת `019sms.co.il/api` · Bearer · מבנה `{"sms":{user,source,destinations,message}}` · `status==0` = הצלחה · שם שדה המזהה (`shipment_id`?) |
| Twilio | יציב ומתועד היטב. לאמת שליחה עם alphanumeric sender לישראל ומחיר להודעה |
| Resend | יציב. דורש דומיין מאומת (SPF/DKIM) לכתובת ה-From של כל עסק, ⇒ שאלת מוצר: דומיין משותף או דומיין של העסק |
| iCount | `auth/login` → `sid`, או API token · `doc/search` עם `doctype`/`status`/`limit`/`offset` · שדות `balance`/`totalwithvat`/`duedate`/`client_mobile`. **המיפוי סובלני**, אבל צריך דגימה אמיתית |
| GI payments/form | נתיב, `type` המסמך שייווצר (400/320), `pluginId`, מבנה התשובה `{errorCode,url}` |
| ישראל | **רישום שמות-שולח אלפאנומריים** אצל הספק (דרישה רגולטורית נגד הונאות, לאמת) |

## 5. 🔴 ממצאים להכרעת מאיר
1. **עלות SMS ×3.** כל 4 הנוסחים ב-`templates.py` הם 185–201 תווים בעברית (UCS-2), כלומר **3 חלקי SMS** להודעה, ולכן המחיר משולש. **המלצה:** נוסח SMS מקוצר נפרד, עד 134 תווים (2 חלקים) ועדיף עד 70 (חלק אחד), עם קישור מקוצר. הנוסח המלא יישלח במייל.
2. **טופס תשלום של חשבונית ירוקה = כתיבה.** בעת תשלום נוצרת קבלה, וזה סותר את עיקרון "קריאה בלבד" (MVP-SPEC §1.4). הוא גם דורש תוסף סליקה בתשלום. **המלצה ל-MVP:** קישור קבוע או תבנית URL של העסק, וטופס GI כשדרוג בשלב 2.
3. **בחירת ספק SMS ראשי.** InforU ו-019 ישראליים וזולים יותר לישראל, ותומכים בשמות-שולח מקומיים. Twilio יקר יותר אבל יציב ומתועד היטב. **המלצה:** ‏019 או InforU כראשי ו-Twilio כגיבוי. ההכרעה תלויה בהצעת מחיר, וזו פעולה של מאיר.
4. **מייל:** Resend פשוט יותר, יש לו API נקי ואידמפוטנטיות מובנית. SMTP (סיסמת-אפליקציה של העסק) שולח "מהעסק עצמו" בלי אימות דומיין. **המלצה:** SMTP של העסק ב-MVP (המייל מגיע מכתובת שהלקוח מכיר), ו-Resend לשכבות גבוהות.
5. **סיווג משפטי:** תזכורת על חוב קיים היא הודעה עסקית ולא "דבר פרסומת" (חוק התקשורת §30א). בכל זאת שורת "הסר" ו-List-Unsubscribe נשארים חובה בקוד שלנו. ⚖️ לאשר עם העו"ד.

## 6. קבצים
```
app/integrations/base.py        טיפוסים, מעקות transport, צנזור, סיווג שגיאות
app/integrations/http.py        HttpAdapter: dry-run, אידמפוטנטיות, timeout/5xx
app/integrations/sms.py         InforUSms · Sms019 · TwilioSms · נרמול נייד · חישוב חלקים · שם-שולח
app/integrations/email.py       SmtpEmail · ResendEmail · List-Unsubscribe · הגנת CRLF
app/integrations/accounting.py  GreenInvoiceSource · ICountClient · map_icount_doc
app/integrations/payments.py    StaticPaymentLink · TemplatePaymentLink · GreenInvoicePaymentForm
app/integrations/notifier.py    Notifier (גיבוי ערוצים) · DeliveryReport
app/integrations/registry.py    בנייה ממשתני סביבה (SMS_PROVIDER=inforu,019,twilio …)
app/greeninvoice.py             + מתודה ציבורית post() (רפקטור של search_documents; התנהגות זהה)
```
משתני סביבה: `SMS_PROVIDER` `SMS_SENDER` `INFORU_USERNAME/TOKEN` `SMS019_USERNAME/TOKEN` `TWILIO_ACCOUNT_SID/AUTH_TOKEN/FROM/MESSAGING_SERVICE_SID` `EMAIL_PROVIDER` `SMTP_HOST/PORT/USER/PASSWORD/STARTTLS` `RESEND_API_KEY` `MAIL_FROM` `MAIL_FROM_NAME` `ACCOUNTING_PROVIDER` `ICOUNT_API_TOKEN` / `ICOUNT_CID/USER/PASS` `PAYMENT_LINK_MODE` `PAYMENT_LINK` `PAYMENT_LINK_TEMPLATE` `GI_PAYMENT_PLUGIN_ID` `GI_PAYMENT_SUCCESS_URL`. כולם ב-`.env` שנמצא ב-gitignore, ואף פעם לא בריפו.

## 7. הצעד הבא
- לשלב את `Notifier` ב-`CollectService.dispatch` במקום `DryRunSender` של WhatsApp. את זה עושה בעל service.py, והממשק מוכן (§3).
- נוסחי SMS קצרים (§5.1).
- webhooks נכנסים: SMS (InforU/019/Twilio כולם תומכים בהודעות נכנסות ובדוחות מסירה) עם אימות חתימה. ב-Twilio זה `X-Twilio-Signature`.
