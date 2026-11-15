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
| 5 פוסטים | `marketing/posts.md` | כל טענה מגובה בבדיקה (`team/messaging.md` §2) | 1, 2 |
| 7 מיילים לניסיון | `marketing/emails-trial.md` | מיושר ל-`trial()`/`trial_ending`; שירות מופרד מפרסומת | 1, 2, 3, 4 |
| 6 מאמרי SEO | `marketing/seo/` | בלי מילים אסורות; «מתי לשלוח», «הצעת תשלומים», «שילמתי» ו«5 טעויות» נעולים לקוד, למנוע השיחה ולמסנן הניסוח (`test_seo_articles.py`) | 1, 2 |
| סרטון + סטוריבורד | `marketing/video/` | פריימים מהמערכת האמיתית במצב בדיקה | 1 (רינדור מחדש), 2 |
| מודעות לפי ענף (גבי עיצוב) | `marketing/ads/` | `check.mjs` של עיצוב; הדומיין מסונכרן מ-`set_domain.py` | 1 (רינדור מחדש), 2 |
| הצהרת נגישות (תקנה 35) | `marketing/accessibility.html` (+ עותק זהה ב-`/app/accessibility.html`) | קיימת, כל דף מקשר אליה, רכיבי חובה, בלי טענות שלא נבדקו (`test_accessibility_statement.py`); נגישות AA לכל 12 הדפים (`web/e2e/a11y.mjs`) | 2, 4 (שם רכז/ת נגישות, טלפון, מייל, תאריך בדיקה) |
| ערכת בטא + דף מסרים | `team/beta-kit.md`, `team/messaging.md` | — | 2 (פנייה לעסקים = אישור מאיר) |

## בדיקות שרצות על החבילה
`tests/test_launch_domain.py` (12) · `tests/test_vertical_pages.py` (10) · `tests/test_template_library.py` (3) · `tests/test_seo_articles.py` (5) · `tests/test_marketing_claims_match_code.py` (19: כל מספר בכל נכס = הקוד) · `test_designed_landing_*` · `web/tests/lib.check.ts` · `web/e2e/live.mjs`.
