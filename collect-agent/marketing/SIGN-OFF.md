# גבי – תזכורות תשלום · חבילת שיווק לחתימה

> **מצב: מוכן לחתימה.** הוכחה: `python3 marketing/launch/check_launch.py --readiness` ⇒ ✓, ננעל ב-`tests/test_launch_domain.py::test_package_ready_for_signature_only_meir_walls_left`.
> **הכול טיוטות. שום דבר לא פורסם, לא נשלח, ולא נרשמנו לשום שירות.** הכרעות המקור: `docs/PRICING.md`, `team/messaging.md`.

## מה מאיר חותם (4 דברים, ורק הם)
| # | החלטה | מה קורה אחרי החתימה | זמן |
|---|---|---|---|
| 1 | **דומיין** (למשל `gabi.co.il`) | `python3 marketing/launch/set_domain.py <דומיין>` ⇒ רינדור מחדש (סרטונים, `node marketing/ads/render.mjs`, `build.py` בדפי הענף ובספריית הנוסחים) ⇒ `check_launch.py --release` ירוק | בערך 10 דקות |
| 2 | **אישור פרסום**, לכל נכס בנפרד (טבלה למטה) | העלאה לערוץ שאושר | — |
| 3 | **מערכת דיוור + SPF/DKIM** (הרשמה לשירות) | רצף מיילי הניסיון יוצא לאוויר | — |
| 4 | **עו״ד:** §30א (שירות מול פרסומת), פרטי החברה בתחתית (placeholder היום), הניסוח «כולל מע״מ ככל שחל» | מחליפים את ה-placeholders בטקסט שאושר | — |

## הנכסים
| נכס | קובץ | מה בדוק אוטומטית | ממתין ל- |
|---|---|---|---|
| דף נחיתה מעוצב | `web/src/pages/Landing.tsx` (`/app/`) | `test_designed_landing_final_decisions`, מחשבון «שווי הזמן» בלי הבטחת תשואה (`tests/lib.check.ts`), `live.mjs` | 1, 2, 4 |
| דף נחיתה סטטי | `marketing/landing/index.html` | 0 בקשות רשת, טופס שלא שולח, מובייל | 1, 2, 4 |
| 4 דפי ענף (מספרות, מוסכים, קליניקות, לקוחות רו״ח) | `marketing/landing/for/` | ה-SMS בכל דף = פלט השירות האמיתי, ≤2 חלקים, מסנן ניסוח, קליניקה בלי טיפול (`test_vertical_pages.py`) | 1, 2, 4 |
| ספריית נוסחים (כלי חינמי) | `marketing/library/index.html` | 6 נוסחים מ-`app/templates.py`, מסנן ניסוח, סנכרון לקוד (`test_template_library.py`) | 1, 2 |
| שאלות נפוצות (10 ההתנגדויות מתסריט השיחה) | `marketing/faq/index.html` (מחולל: `faq/build.py`) | כל מספר נקרא מהקוד, כל טענה רצה מול הפונקציה האמיתית (מוטציה ⇒ הבנייה נכשלת), כיסוי כל ההתנגדויות בתסריט (`test_faq_page.py`), a11y | 2 |
| 5 פוסטים | `marketing/posts.md` | כל טענה מגובה בבדיקה (`team/messaging.md` §2) | 1, 2 |
| 7 מיילים לניסיון | `marketing/emails-trial.md` | מיושר ל-`trial()`/`trial_ending`; שירות מופרד מפרסומת | 1, 2, 3, 4 |
| 6 מאמרי SEO | `marketing/seo/` | בלי מילים אסורות; «מתי לשלוח», «הצעת תשלומים», «שילמתי» ו«5 טעויות» נעולים לקוד, למנוע השיחה ולמסנן הניסוח (`test_seo_articles.py`) | 1, 2 |
| סרטון + סטוריבורד | `marketing/video/` | פריימים מהמערכת האמיתית במצב בדיקה | 1 (רינדור מחדש), 2 |
| מודעות לפי ענף (גבי עיצוב) | `marketing/ads/` | `check.mjs` של עיצוב; הדומיין מסונכרן מ-`set_domain.py` | 1 (רינדור מחדש), 2 |
| תמליל הסרטונים | `marketing/video/transcript.html` (+ `/app/video/`) | מחולל מהכתוביות ומכרטיס הסיום, מעודכן (`test_video_transcript.py`), a11y | 2 |
| הצהרת נגישות (תקנה 35) | `marketing/accessibility.html` (+ עותק זהה ב-`/app/accessibility.html`) | קיימת, כל דף מקשר אליה, רכיבי חובה, בלי טענות שלא נבדקו (`test_accessibility_statement.py`); נגישות AA לכל דפי השיווק ועמודי הלקוח (`web/e2e/a11y.mjs`; כל דף HTML חדש חייב להיכנס אליה: `test_a11y_covers_marketing_pages.py`) | 2, 4 (שם רכז/ת נגישות, טלפון, מייל, תאריך בדיקה) |
| תנאי שימוש + מדיניות פרטיות (דפים) | `marketing/{terms,privacy}.html` (מחוללים מ-`legal/*.md`, + `/app/`) | מעודכנים מול המקור של המשפטי, קישורים מכל התחתיות (`test_footer_legal_links.py`), a11y | 4 (עו״ד: התוכן עצמו), 2 |
| ערכת בטא + דף מסרים | `team/beta-kit.md`, `team/messaging.md` | — | 2 (פנייה לעסקים = אישור מאיר) |

## בדיקות שרצות על החבילה
`tests/test_launch_domain.py` · `tests/test_vertical_pages.py` · `tests/test_template_library.py` · `tests/test_seo_articles.py` · `tests/test_marketing_claims_match_code.py` · `tests/test_marketing_sources.py` · `tests/test_footer_legal_links.py` · `tests/test_accessibility_statement.py` · `tests/test_video_transcript.py` · `tests/test_web_labels_cover_backend.py` · `tests/test_customer_facing_no_time_promises.py` · `tests/test_compliance_lawyer_final_kaf.py` · `tests/test_compliance_hebrew_forms.py` · `tests/test_compliance_debt_word_steps.py` · `tests/test_a11y_covers_marketing_pages.py` · `tests/test_faq_page.py` · `tests/test_differentiation_claims.py` · `tests/test_marketing_approval_claim_vs_safe_auto.py` · `web/e2e/a11y.mjs` · `web/tests/lib.check.ts` · `web/e2e/live.mjs` · `python3 marketing/launch/check_launch.py --readiness`
(הרשימה נבדקת: `tests/test_signoff_lists_marketing_tests.py`, כולל עצמה)
