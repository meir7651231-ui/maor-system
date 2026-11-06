<p align="right"><b>עברית</b> · <a href="#roadmap-english">English</a></p>

<div dir="rtl">

# מפת דרכים

מה מתוכנן, ובאיזה מצב זה נמצא. הרשימה נגזרת מהפריטים הפתוחים במסמכי התכנון שבריפו. אין כאן התחייבות לתאריכים.

**מצב נוכחי (2026-11-06): הקפאת פיצ'רים.** העבודה כרגע היא על יציבות, תיעוד והצגת הריפו.

## 🟢 קיים ודורש רק הפעלה מצד הארגון
| פריט | מה חסר |
|---|---|
| הצפנת העותק בענן | הקוד פרוס ורדום. מנהל-הארגון בוחר סיסמה ומריץ את ההעברה |
| סנכרון אנשי-קשר ל-Google | הקמת OAuth בחשבון Google של הארגון; הייצוא כקובץ vCard כבר עובד |
| שליחת מייל ו-SMS מהשרת | פריסת Firebase Functions ופרטי-שליחה של הארגון בכספת שלו |

## 🟡 מתוכנן
| פריט | הערה |
|---|---|
| אימות דו-שלבי (MFA) לכניסה לענן | היום: אימייל וסיסמה בלבד |
| אפליקציה בחנות Google Play (TWA) | ה-PWA כבר ניתן להתקנה; חסר רק חשבון מפתח |
| אחסון פר-רשומה ב-IndexedDB | שלב ב׳ של ביצועים, לארגונים עם עשרות אלפי רשומות |
| הרשמה עצמית לחוגים מהאתר הציבורי | דורש כללי-ענן ובדיקת פרטיות |
| היסטוריית דרגות-תורם | מעבר דרגות לאורך זמן דורש שמירת מצב היסטורי |

## ⚪ נבחן
- מעקב תלויות בין פרויקטים מעבר לגאנט הקיים (ורטיקל מסחרי).
- קידום הרחבות נוספות מ-"roadmap" ל-"live" לפי ביקוש.

הצעות: [Issue מסוג בקשת שיפור](.github/ISSUE_TEMPLATE/feature_request.md).

</div>

---

<a id="roadmap-english"></a>
## Roadmap (English)

**Current state (2026-11-06): feature freeze** — work is on stability, documentation and repository presentation. No dates are promised.

- **Built, needs activation by the organization:** encryption of the cloud copy · Google Contacts sync (OAuth setup; vCard export already works) · server-side e-mail/SMS (Functions + the organization's own credentials).
- **Planned:** MFA for cloud sign-in · Google Play app (TWA) · per-record IndexedDB storage for very large datasets · self-registration for classes from the public site · donor-tier history.
- **Exploring:** cross-project dependencies beyond the existing Gantt (commercial vertical) · promoting more integrations from roadmap to live.
