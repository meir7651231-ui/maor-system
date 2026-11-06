# QA · אבטחה · סודות · CI — "גבי" (collect-agent)

> 6.11.2026 · ענף `claude/zen-keller-ont9jp` (מוזג עם `collect-agent` @ `966985a`: SMS ומייל, מנוע שיחה, integrations, landing, web). לא מוזג, לא פורסם, ולא נשלחה אף הודעה.
> היקף: בדיקות מקצה לקצה, סריקת אבטחה **הגנתית של המאגר המקומי בלבד** (ניתוח סטטי ובדיקות שלא פוגעות בכלום), הצפנת סודות, CI.
> לא נבדקה שום מערכת חיצונית ולא נוצלה שום חולשה. כל השליחות dry-run, ו-conftest חוסם כל socket.

## סטטוס בשורה אחת
✅ **302/302 בדיקות ירוקות** (134 מהן חדשות שלי). ruff (כולל כללי האבטחה S) ו-bandit נקיים. evals: 166/166 + holdout. `demo.sh --check`, בדיקת העשן והדמו עוברים.
נמצאו **2 באגים בהתנהגות המוצר**, **13 ממצאי אבטחה** ותקלת CI אחת, וכולם תוקנו. לכל אחד יש בדיקת שימור.
**6 בדיקות מוטציה:** הסרתי כל תיקון בנפרד, והבדיקות נפלו בכל אחד מהם.

## 0. סבב 2 · 6.11 לילה (הכרעות מאיר)
**סטטוס:** 620 בדיקות עוברות (45 חדשות ב-`tests/test_qa_round2.py` + 11 ב-`tests/test_qa_retention.py`). ruff ו-bandit נקיים. evals עוברים, `demo.sh --check`, בדיקת העשן ו-web ‏(`npm test`) עוברים. pip-audit על הנעילה: 0 פגיעויות. הנעילה הותקנה נקייה עם `--require-hashes` על Python 3.11 ועל 3.13, והבדיקות עברו בשתיהן.
**חלוקה:** ה-backend (`c9e1605`) כבר מימש את רשימת ההסרה המגובבת, את שער השליחה היחיד, את `customer_key`, את ר-4 (רענון שחוסם בכשל), את 3 התזכורות ואת חלון 08–20. **אצלי הן אומתו בבדיקות** (טבלה ב'). המימוש המקביל שלי לאותם דברים **נזנח** כדי שלא יהיו שתי טבלאות. ר-6, ר-7 ו-ר-10 אצל המשפטי.

**א. תוקן אצלי**
| # | ממצא | תיקון | בדיקה · מוטציה |
|---|---|---|---|
| R3 | **טוקני הסרה נשמרו כטקסט גלוי** ב-`customers.unsub_token`. דליפת DB הייתה מאפשרת להסיר כל לקוח | `link_tokens`: רק sha256. טוקן חדש (128 ביט) לכל הודעה, והישנים ממשיכים לעבוד. מיגרציה ממירה ל-hash ומרוקנת את העמודה. בעריכת טיוטה: קישור הסרה קיים מאומת **לפי תוקף ושייכות ללקוח**, לא לפי מחרוזת, כך שאין footer כפול ואין קישור `/u/` מזויף | 3 בדיקות + עדכון בדיקות של המשפטי וה-AI (‏`new_unsub_token`) · מוטציה ⇒ נופלת |
| R4 | **אין הגבלת קצב:** קוד `/p/` ו-`/pay/` של 7 תווים ניתן לניחוש. webhook של GI מפעיל sync מלא. ניחוש טוקן הבעלים | `app/ratelimit.py` (חלון זז, שעון מוזרק) + middleware: `/p/` `/u/` `/pay/` `/api/pay/` 60 לדקה ל-IP · webhooks 120 לדקה · webhook של GI 6 לדקה גלובלי · 30 כשלי אימות ב-5 דקות ⇒ 429 גם לטוקן נכון. `X-Forwarded-For` רק עם `TRUST_PROXY_HEADERS=1` (הכתובת הימנית) | 5 בדיקות (כולל 200 קריאות רגילות בלי חסימה) · מוטציה ⇒ נופלת |
| R5 | **סוד בלוג בקשות:** ‏httpx/httpx2 כותבים URL מלא ברמת INFO, כולל `?k=` | הפילטר הורחב ל-`httpx`, `httpx2`, `httpcore` ו-`uvicorn.error`, ולשמות `key`, `token`, `secret`, `password` ו-`sig` | זרימה מלאה עם לוג DEBUG ⇒ אף סוד לא מופיע · מוטציה ⇒ נופלת |
| R6 | **סודות עסק:** "כל עסק יחבר API key משלו" צריך דרך מוצפנת אחת **לפני** שנקלט סוד ראשון | `app/business_secrets.py`: הדרך היחידה. AES-GCM דרך `SecretBox`, הקשר `biz:{id}:{field}`, רשימת שדות סגורה, רוטציה. בלי מפתח ⇒ `SecretError`. ‏(`business_settings` של ה-backend נשאר לערכים שאינם סודיים) | הקובץ הפיזי לא מכיל את הסוד · העתקה בין עסקים נכשלת · רוטציה · שום קובץ אחר לא כותב לטבלה |
| R7 | **אין נעילת תלויות** | `requirements.lock` + `requirements-dev.lock` (‏`uv pip compile --universal --generate-hashes`, Python 3.11+). ה-CI מתקין עם `--require-hashes`, ו-pip-audit סורק את הנעילה | 3 בדיקות: כל תלות ישירה נעולה עם hash ועומדת ב-specifier · runtime ⊂ dev · ה-CI מתקין מהנעילה |

**ב. אומת אצלי (מימוש backend)**
| נושא | מה נבדק |
|---|---|
| הסרה פר-עסק | כרטיס כפול באותו טלפון ⇒ אין הודעה · שורד סנכרון וכרטיס חדש · בטבלה רק hash, ערוץ, סיבה ותאריך (בלי PII) · "מספר שגוי" ⇒ הטלפון ברשימה · השער מתיר רק אישור הסרה |
| איחוד לקוחות | מזהה ⇒ מייל ⇒ טלפון מנורמל ⇒ חשבונית · בלי מזהה ובלי טלפון ⇒ לא מתאחדים · אותו נייד בשני פורמטים = לקוח אחד |
| 3 תזכורות | 80 ימים מדומים ⇒ בדיוק 3 נשלחו, ואז **התראה אחת** לבעל העסק |
| חלון | 07:59 ✗ · 08:00 ✓ · 19:59 ✓ · 20:00 ✗ · שישי 11:59 ✓ / 12:00 ✗ · שבת ✗ · יום כיפור ✗ |
| ר-4 | כשל `get_document` ⇒ לא נשלח, `block_reason=refresh_failed` |
| אישור פרטני | 40 ימי `plan()` בלי בעלים ⇒ אין שום `approved` |
| סריקות | זיוף inbound (3 webhooks × מפתח חסר, ריק או שגוי) · סורקי קישורים: GET/HEAD על `/p/`, `/u/`, `/pay/`, `/api/pay/` ופעולות ⇒ אפס שינוי מצב · כפל טיוטת פריסה (`1327d6d`) נעול |

**ג. אימות ר-6/ר-7/ר-10 של המשפטי** (`tests/test_qa_retention.py`, 11 בדיקות, "קופסה שחורה": זרימה מלאה, ואחרי 91 יום `iterdump()` לא מכיל אף צורה של שם, טלפון או מייל)
| # | ממצא | תיקון | מוטציה |
|---|---|---|---|
| P1 | **המחיקה דילגה על `drafts`:** כתובת היעד, גוף התשובה (עם השם) וסיכום לבעל העסק נשארו לנצח | `purge_closed` מרוקן את `drafts` (to_addr/body/owner_summary/owner_actions), את `conversations.offered_plan` ואת `link_tokens` של הלקוח | נופלת |
| P2 | **הודעות משולח לא מוכר** (`customer_id=NULL`) לא נמחקו לעולם, וזה PII של מי שאינו לקוח בכלל | ריקון 90 יום מקבלת ההודעה | נופלת |
| P3 | **טקסט חופשי ב-`audit`:** הערת השהיה (ר-6) וסיבת legal hold נכתבו לתוך יומן שהוא הוספה-בלבד ולא נמחק לעולם (למשל "דנה נפטרה, אחיה 050-…") | הטקסט נשמר כהודעת `note` של הלקוח (נמחקת איתו). ב-audit נרשמים רק עובדה ו-`note_id` | נופלת |
| P4 | טוקני הסרה של לקוח שנמחק נשארו | נמחקים במחיקה | נופלת |
| ✔ | אומת: יום 89 לא מוחק · legal hold דורש סיבה ≥10 תווים, חוסם מחיקה, והשחרור מאפשר אותה · `suppressions` שורד ועדיין חוסם לקוח שחוזר בכרטיס חדש · ר-6: minor/deceased/insolvency עוצרים, סימון לא מוכר נדחה · ר-7: מעל 3 שנים ⇒ אין תזכורת + התראה **אחת** · `/maintenance/purge` ו-`/hold` דורשים בעלים | — | — |

**ד. CI (6.11 לילה)**
| # | ממצא | תיקון | הוכחה |
|---|---|---|---|
| C2 | **כל ריצות ה-CI נכשלו מיידית מאז `ac97abe` (ריצות 75–81).** היו שני ג'ובים בשם `web`. PyYAML לוקח בשקט את האחרון, אבל GitHub דוחה מפתח כפול, ולכן ה-workflow כולו לא תקין | הוסר הג'וב הכפול. `test_workflows_have_no_duplicate_keys` עם loader קפדני על כל קבצי ה-workflow | מוטציה ⇒ נופלת · ריצה 88 ירוקה |
| C3 | **ג'וב security אדום:** XML של תשובת 019 נפרסר ב-ElementTree בלי הקשחה (B314/B405), ותו RLM מילולי ב-`csv_import.py` (B613) | `Sms019.parse` דוחה DOCTYPE/ENTITY ותשובה מעל 64KB. ה-RLM הוחלף ב-escape. בדיקת Trojan Source הורחבה ל-RLM/LRM/ALM ולתתי-תיקיות | 3 בדיקות XML עוין · ריצות [88](https://github.com/meir7651231-ui/maor-system/actions/runs/42150456090) ו-90 ירוקות (test, web כולל `live.mjs`, security) |
| C4 | ג'וב ה-e2e התקין את השרת עם `pip install -e '..[dev]'`, מחוץ לנעילה | `--require-hashes` מהנעילה. בדיקת הרגרסיה תופסת כל התקנה לא נעולה | מוטציה ⇒ נופלת |

**עדכון הנעילה:** `cd collect-agent && uv pip compile pyproject.toml --universal --python-version 3.11 --generate-hashes -o requirements.lock` (ואותו דבר עם `--extra dev` ל-`requirements-dev.lock`). בדיקה נכשלת אם שכחתם.
**סיכון שנשאר (נמוך):** `POST /api/pay/{code}/{action}` ו-`/p/{code}/{action}` מוגנים רק בקוד עצמו (bearer). אין CSRF token, אבל תוקף צריך לדעת את הקוד, והגבלת הקצב חוסמת ניחוש.

### מדיניות מחיקה (ר-10, המימוש אצל המשפטי)
- **90 יום מסגירת החוב** (חשבונית `closed`, או סיום הסדר) ⇒ מחיקה של: חשבונית, תזכורות, הודעות, טיוטות, תוכן ה-payload, `link_tokens` של הלקוח, ופרטי הלקוח (שם, טלפון, מייל) אם אין לו חוב פתוח אחר.
- **חריג: hold מתועד.** חובת שימור (מחלוקת פתוחה, דרישת עו"ד, הליך) ⇒ עמודה או טבלת `legal_hold` עם סיבה, מי ומתי, ורישום ב-`audit`. כל עוד יש hold לא מוחקים, ובשחרור ה-hold השעון מתחיל מחדש.
- **נשאר אחרי מחיקה:** רק `suppressions` (מפתח מנורמל, סיבה, תאריך; בלי שם, סכום או חשבונית), כדי שלקוח שהוסר לא יקבל שוב הודעות.
- **יומן `audit`:** הוספה בלבד, בלי PII בתוכן (רק מזהים). ההחלטה על תקופת שמירה נפרדת היא של עו"ד.
- **לאימות QA אחרי המיזוג:** מחיקה ביום 91 ולא ביום 89 · hold חוסם · `suppressions` שורד · אין שארית PII ב-`iterdump()`.

### מייל — SPF/DKIM/DMARC (checklist בלבד, בלי שינוי DNS, עד שיהיה דומיין אמיתי)
1. דומיין שליחה ייעודי (למשל `mail.<domain>`), נפרד מהדומיין הראשי.
2. **SPF:** `v=spf1 include:<ספק> -all`, רק הספק (Resend/SES/SMTP). לא יותר מ-10 lookups.
3. **DKIM:** מפתח 2048 ביט מהספק, selector עם תאריך, ורוטציה שנתית.
4. **DMARC:** להתחיל ב-`p=none; rua=…`, ואחרי שבועיים נקיים לעבור ל-`quarantine` ואז ל-`reject`. `adkim=s; aspf=s`.
5. `List-Unsubscribe` + `List-Unsubscribe-Post` (כבר קיים), כי Gmail ו-Yahoo דורשים זאת לשולחים בנפח.
6. `Return-Path` ו-bounce על הדומיין שלנו. bounce קשה ⇒ `suppressions` (kind=email, reason=bounce, להוסיף ל-`REASONS`).
7. TLS בהגשה (כבר נאכף, S12). כתובת From תואמת לדומיין ה-DKIM (alignment).

### לאימות QA
- 3 תזכורות, חלון השעות, ר-4, אישור פרטני, ר-6, ר-7 ו-ר-10: ✅ אומתו (טבלאות ב' ו-ג'). ב-ר-10 נמצאו ותוקנו 4 פערים.

## 1. ממצאים ותיקונים
| # | חומרה | ממצא | תיקון | בדיקה |
|---|---|---|---|---|
| S1 | 🔴 גבוהה | **אף נקודת API לא דרשה אימות.** כל מי שמגיע לשרת יכול לאשר תזכורות, להפעיל שליחה ולקרוא PII (`/audit`, `/owner/inbox`, `/outbox`, `/reminders/{id}/preview`, ו-`/customers` ו-`/dashboard` החדשים) | `Authorization: Bearer <OWNER_API_TOKEN>` על כל הנקודות. ההשוואה בזמן קבוע. טוקן חסר או קצר מ-32 תווים ⇒ **השרת לא עולה**. דף `/ui` מבקש את הקוד פעם אחת ושומר אותו ב-`sessionStorage` בלבד | `test_every_owner_endpoint_requires_token` (65 שילובים). `test_route_inventory_is_fully_guarded`: נקודה חדשה שאינה ברשימת הציבוריות **מפילה את הבדיקה** |
| S2 | 🔴 גבוהה | **זיוף `/inbound`:** מי שמכיר טלפון או מייל של לקוח יכול לשלוח "הסר", "שילמתי" או "טעות" בשמו, ולעצור את הגבייה או לסמן מחלוקת | `/inbound` מקבל טוקן בעלים **או** חתימת HMAC-SHA256 (`X-Collect-Timestamp` + `X-Collect-Signature`) עם חלון replay של 5 דקות. `verify_twilio` מוכן ונבדק מול הווקטור הרשמי | `test_inbound_rejects_bad_signature` (5 מקרים), `test_spoofed_opt_out_does_not_change_state` |
| S3 | 🔴 גבוהה | **הסרה ב-GET:** `/u/{token}` הסיר את הלקוח כבר בפתיחת הקישור. סורקי קישורים (Outlook Safe Links, תצוגה מקדימה של SMS ואנטי-וירוס) פותחים כל URL, כך שלקוחות היו מוסרים בלי שביקשו, וגבייה לגיטימית הייתה נעצרת | GET מציג כפתור "כן, הסירו אותי" שעושה POST. One-Click לפי RFC 8058 (POST) נשאר. הדף נשלח עם `no-store`, `noindex` ו-`no-referrer` | `test_unsubscribe_get_does_not_unsubscribe` (3 פתיחות ב-GET לא מסירות), `test_unsubscribe_link_and_one_click` |
| S4 | 🟠 בינונית | **מניעת שירות דרך CR/LF במספר חשבונית:** המספר מגיע מחשבונית ירוקה ונכנס ל-Subject. `EmailMessage` זורק ValueError, ולכן `plan()` **נופל לכל הלקוחות**. RLO ושורות חדשות גם מאפשרים להסוות קישור ב-SMS | `sanitize_field` על שם הלקוח, מספר החשבונית ושם העסק: שורה אחת, בלי תווי בקרה או כיווניות, אורך מוגבל | `test_crlf_in_invoice_number_does_not_break_plan` (בלי התיקון: 2 בדיקות נופלות) |
| S5 | 🟠 בינונית | **מפתח ה-webhook של 019 דלף ללוג:** uvicorn כותב את ה-URL המלא, כולל `?k=<סוד>` | פילטר על `uvicorn.access` שמחליף את הערך ב-`k=***` | יחידה + **בדיקת העשן מול שרת אמיתי** (הלוג מכיל `k=***` והסוד לא מופיע בו) |
| S6 | 🟠 בינונית | `repr(Settings)` הדפיס את `GREENINVOICE_API_SECRET`, `SMS_TOKEN` ו-`SMS_WEBHOOK_KEY`, כך שהם היו דולפים ל-traceback וללוג | `field(repr=False)` לכל השדות הסודיים | `test_settings_repr_hides_secrets` ו-`_sms_secrets` |
| S7 | 🟡 נמוכה | `PAYMENT_LINK` עם `http://`, `user:pw@` או שבירת שורה התקבל בטעינה. הוא נדחה רק מאוחר יותר ב-`paylinks`, ובשקט | https בלבד, אחרת **השרת לא עולה** (הודעה ברורה במקום חסימה שקטה של כל התזכורות) | `test_payment_link_must_be_https` (6 וריאציות) |
| S8 | 🟡 נמוכה | אין מגבלת גודל לקלט: ב-webhook של 019 וב-`/inbound` | webhook עד 16KB (413). sender עד 254 תווים, text עד 4000 | `test_019_webhook_body_limit`, `test_inbound_payload_limits` |
| S9 | 🟡 נמוכה | קובץ ה-SQLite (PII) נוצר עם הרשאות ברירת המחדל (644) | נוצר ב-0600 | `test_db_file_is_owner_only` + בדיקת העשן |
| S10 | 🟡 נמוכה | `audit` הוגדר במפרט כ"לא נמחק", אבל זה לא נאכף | טריגרים ב-SQLite חוסמים UPDATE ו-DELETE | `test_audit_is_append_only` |
| S11 | 🟡 נמוכה | `/docs` ו-`/openapi.json` חשופים, ואין כותרות אבטחה | מוסתרים כברירת מחדל (`EXPOSE_DOCS=1` לפיתוח). נוספו `X-Frame-Options: DENY`, `nosniff` ו-`no-referrer` | `test_docs_hidden_by_default`, `test_security_headers` |
| B1 | 🔴 גבוהה (מוצר) | **"שילמתי" לא עצר באמת.** (נמצא במקביל גם ב-`866da93`. אומצה הגרסה של חבר הצוות, והבדיקות שלי מאמתות אותה.) הקוד ביטל רק את התזכורות הפעילות. אחרי שבוע `plan()` יצר את השלב הבא, ומכיוון שהלקוח כבר "אושר" התזכורת **יצאה אוטומטית, בלי אישור** אל מי שאמר ששילם. **התגלה בסימולציית 60 הימים** | `customers.paused_reason='paid_claim'` (עם מיגרציה לקובץ קיים) עוצר הכול עד `POST /customers/{id}/resume` של בעל העסק (מתועד ב-audit) | `test_paid_claim_pauses_until_owner_resumes` + 3 סיבובי סימולציה |
| B2 | 🟠 בינונית (מוצר/חוק) | **הסרה זוהתה רק בתחילת ההודעה:** "בבקשה הסירו אותי", "תסירו אותי" ו"לא מעוניין" לא נחשבו להסרה (§30א). גם "איך משלמים?" לא זוהה | ביטוי ההסרה מזוהה בכל מקום בהודעה, כולל ו׳ החיבור. נוספו "משלמים/משלם". "הסדר" עדיין לא נחשב להסרה | `test_opt_out_anywhere_in_message` (6), `test_how_to_pay_variants`, `test_plan_word_not_opt_out` |
| S12 | 🟠 בינונית | `SmtpEmail` מאפשר `login` עם `starttls=False` בפורט 25/587, כלומר סיסמת SMTP עוברת ברשת בטקסט גלוי | סירוב בבנייה, אלא אם יש STARTTLS או פורט 465 (SMTPS) | `test_smtp_login_requires_tls` |
| S13 | 🟡 נמוכה | `assert self.client is not None` שימש כבדיקה בזמן ריצה ב-`integrations/payments.py`. ב-`python -O` ה-assert נמחק ומתקבל AttributeError | `raise IntegrationError` מפורש | bandit B101 |
| C1 | 🟠 (CI) | **ה-CI של `collect-agent` היה אדום:** `ruff check` נכשל על 28 שגיאות (בעיקר שורות ארוכות בטבלאות העברית של `conversation.py`) | per-file-ignore מנומק ל-E501 ב-`conversation.py`, ותיקון סדר ה-imports | `ruff check .` נקי |
| T1 | 🟡 | **Trojan Source:** תווי כיווניות מילוליים (U+202E) נכנסו לקוד ולבדיקות דרך כלי העריכה. bandit B613 תפס | הוחלפו ב-escape | `test_no_trojan_source_bidi_chars` כבר תפסה את זה פעם נוספת |

**הוכחת מוטציה** (הוסר התיקון ⇒ מספר הבדיקות שנכשלו ⇒ התיקון הוחזר):
- חיטוי CR/LF: 2
- B1: 4
- אימות על `/audit`: 6
- הסרה ב-GET: 2
- B2: 3
- חלון ה-replay: 2

**נבדק ונמצא תקין:** ב-integrations יש הסוואת סודות בתצוגה מקדימה (`SECRET_HEADERS`/`SECRET_KEYS`), SMTP אמיתי חסום בשלב 1, וקיימת הגנת header-injection במייל. כל ה-SQL עם פרמטרים. ה-UI מחטא HTML (`esc`), והמייל מוצג ב-`iframe sandbox`. ב-019 ה-XML נבנה עם `escape`. ה-webhook של 019 משווה מפתח בזמן קבוע ומסנן כפילויות לפי hash. קישורי התשלום עוברים allowlist של דומיינים. טוקן ההסרה הוא `token_urlsafe(9)`, כלומר 72 ביט, וזה מספיק. `_mask` לא מציג סוד מלא בתצוגה מקדימה.

## 2. הצפנה וסודות: `app/secretbox.py`
- **AES-256-GCM** (ספריית `cryptography`). הפורמט: `v1.<kid>.<b64url(nonce‖ct+tag)>`. ה-nonce אקראי בכל הצפנה.
- **AAD = הקשר**, `context_for(business_id, "sms_token")` ⇒ `biz:12:sms_token`. צופן שהועתק לעסק אחר או לשדה אחר **לא נפתח**, וזה בידוד דיירים ברמת הקריפטו.
- **KEK מחוץ ל-DB:** `COLLECT_MASTER_KEYS="k2:<b64>,k1:<b64>"`. הראשון מצפין, כל המפתחות מפענחים. `needs_rotation`/`rotate` מאפשרים רוטציה הדרגתית. בשלב 2 המפתח עובר ל-KMS או Secret Manager, ועלינו להחליף רק את `from_env`.
- **נכשל סגור:** בלי מפתח, עם מפתח שאינו 32 בייט, kid כפול או צופן פגום, נזרק `SecretError`. ההודעות לא כוללות חומר סודי. `Secret` מסתיר את עצמו ב-repr וב-str.
- מפתח חדש: `python3 -m app.secretbox`. כל המשתנים מתועדים ב-`.env.example`.
- **עדיין לא מחובר:** בשלב 1 (עסק יחיד) הסודות של GI ו-SMS יושבים ב-env. ברגע שנוספת טבלת `businesses`, צריך לשמור בה `gi_secret`, `sms_token`, `sms_webhook_key` ו-`smtp_password` **רק** דרך `SecretBox.encrypt(..., context=context_for(id, field))`.

## 3. בדיקות מקצה לקצה: `tests/test_e2e.py`
1. **מסע מלא דרך HTTP:** סנכרון, תכנון, תור אישור, dispatch ב-**SMS ובמייל**, תשובות לקוח חתומות (בקשת קישור ⇒ מענה עם קישור התשלום של חשבונית ירוקה; בקשת פריסה ⇒ הצעה, בלי לאבד אף אגורה), אישור הסדר, סגירת חשבונית ב-GI ⇒ ביטול. בסוף נבדק שה-audit כולל את כל הפעולות ושלא יצא שום דבר ב-WhatsApp.
2. **סימולציה של 60 יום × 3 seeds:** 12 לקוחות עם התנהגויות שונות (שותק, משלם ביום 10, הסרה, מחלוקת, "שילמתי", מבקש קישור, פריסה, נדחה ע"י בעל העסק, בלי פרטי קשר), חג באמצע, ובעל עסק שמדלג על 15% מהימים. בסוף נבדקים אינווריאנטים על **כל** הודעה שיצאה:
   - אין שליחה מחוץ לחלון השעות, בשבת או בחג.
   - הודעה ראשונה והודעה אחרונה יוצאות רק אחרי אישור מפורש.
   - לפחות 72 שעות בין הודעות לאותו לקוח, ולא יותר מ-4 לחשבונית.
   - אין הודעה אחרי עצירה.
   - הערוצים הם SMS ומייל בלבד, והכול dry-run.
3. **בדיקת עשן לשרת אמיתי** (`scripts/smoke_server.sh`): uvicorn על 127.0.0.1.
   - השרת לא עולה בלי טוקן ולא עולה עם `SEND_MODE=live`.
   - `/health` מחזיר dry_run, ובלי טוקן מתקבל 401.
   - `/docs` מחזיר 404 ו-`/ui` מחזיר 200.
   - ה-webhook של 019 מחזיר 200 עם המפתח הנכון ו-403 עם מפתח שגוי.
   - ה-DB נוצר ב-0600, והטוקן ומפתח ה-webhook לא מופיעים בלוג הגישה.

## 4. CI: `.github/workflows/collect-agent.yml`
רץ רק כשמשהו תחת `collect-agent/` משתנה, על `collect-agent`, על `claude/**` ועל PR. ההרשאות `contents: read` בלבד, `persist-credentials: false`, ואין סודות.
- **test** (Python 3.11 ו-3.13): ruff (כולל S), pytest מלא, **evals של מנוע השיחה**, `demo.sh --check` (עכשיו עם טוקן; גם מוודא ש-`/dashboard` בלי טוקן מחזיר 401), בדיקת עשן לשרת. ה-workflow של חבר הצוות מוזג לתוך זה, לא הוחלף.
- **security:** bandit (SAST; `demo*.py` מוחרגים — asserts וטוקן-דמו מזויף), pip-audit (CVE ידועים בתלויות), סריקת סודות, Trojan Source ורשימת hosts.
- סריקות סטטיות שרצות כחלק מ-pytest:
  - SQL רק עם פרמטרים.
  - אין eval/exec/pickle/`shell=True`/`verify=False`.
  - **רשימה סגורה של hosts יוצאים** (GI, 019, InforU, Twilio, Resend, iCount). facebook/whatsapp אסורים. הסריקה כוללת את `app/integrations/`.
  - 10 תבניות סודות.
- **אומת מקומית:** ruff ✅, bandit ✅ (B406 סומן במפורש כ-false positive: `escape` רק בונה XML), pytest 302/302 ✅, evals ✅, `demo.sh --check` ✅, smoke ✅, demo ✅.
- ✅ **אומת ב-GitHub:** כל 4 הג'ובים (test 3.11, test 3.13, security, web) ירוקים. [ריצה 42139519553](https://github.com/meir7651231-ui/maor-system/actions/runs/42139519553).

## 5. לפני שליחה אמיתית (שלב 2): רשימה לצוות
1. **Webhook של 019:** הסוד ב-URL עדיף על כלום, אבל יש לו מגבלות (מופיע בלוגים של proxy ובהיסטוריה). לברר אם 019 תומכים בחתימה או ב-IP allowlist, ואם כן להוסיף. ל-Twilio משתמשים ב-`verify_twilio`.
2. **הסרה:** לשמור רשימת הסרה **לפי טלפון או מייל ברמת העסק**, ולא רק לפי `customer.id`. אחרת אותו אדם שמופיע תחת `external_id` אחר בחשבונית ירוקה יקבל שוב הודעות. ההסרה ב-blacklist של 019 כבר עובדת.
3. **מייל:** SPF, DKIM ו-DMARC על דומיין השולח. `sanitize_header_value` מוכן לכל כותרת חדשה.
4. **ריבוי עסקים:** `business_id` בכל טבלה ושאילתה, סודות רק דרך `SecretBox`, והטוקן היחיד מוחלף במשתמשים אמיתיים (session או OAuth, ו-MFA לבעלים).
5. **Rate limiting** על `/inbound`, `/u/*` ו-webhooks (ברמת ה-reverse proxy), TLS בלבד, והשרת מאזין ל-127.0.0.1 מאחורי proxy.
6. **שמירת נתונים:** מחיקה 90 יום אחרי סגירת חשבון (לפי המפרט) עדיין לא ממומשת. `messages` גדלה ללא הגבלה, וגם `DryRunSender.sent` בזיכרון.
7. **נעילת תלויות:** `pip-compile --generate-hashes` לפני פריסה.
8. **LLM:** טקסט הלקוח לא אמין (prompt injection). הסיווג כבר מוגבל ל-enum. לא לתת ל-LLM לנסח הודעה שיוצאת בלי אישור.
9. **UI:** כדאי להוסיף CSP כשה-JS יעבור לקובץ חיצוני. כרגע הוא inline.

## 6. הרצה
```bash
cd collect-agent && pip install -e '.[dev]'
ruff check . && bandit -q -r app scripts && python3 -m pytest -q
bash scripts/smoke_server.sh
```

## קבצים
**חדשים:**
- `app/secretbox.py`, `app/security.py`
- `tests/test_security.py` (118 בדיקות), `tests/test_e2e.py` (15 בדיקות)
- `scripts/smoke_server.sh`
- `team/qa.md`

**שונו (שינויים מינימליים):**
- `app/main.py`: אימות, הסרה בטוחה, כותרות, מגבלות, הסוואת הלוג
- `app/ui.html`: Bearer
- `app/config.py`: repr ו-https
- `app/db.py`: 0600, טריגרים, `paused_reason`
- `app/service.py`: `has_unsub_token`
- `app/assistant.py`: B2
- `app/templates.py`: חיטוי
- `app/channels.py`: הערת nosec
- `app/integrations/email.py` + `payments.py`: S12, S13
- `pyproject.toml`: cryptography, כלי dev, ruff + S
- `demo.sh`: טוקן חד-פעמי, בדיקת 401
- `.github/workflows/collect-agent.yml`: מוזג עם שלב security, smoke ו-evals
- `.env.example`
- `tests/conftest.py`, `tests/test_flow.py`, `scripts/demo_dry_run.py`: שימוש בטוקן; בדיקת ההסרה עודכנה ל-POST
