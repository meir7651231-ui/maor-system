# יומן שינויים

הפרויקט לא מפרסם גרסאות ממוספרות — הוא נפרס ברציפות מ-`main`.
היומן מקובץ לפי חודש ומבוסס על היסטוריית ה-git ועל דוחות הסגירה בתיקייה [`knowledge/`](knowledge/) (שם כל דוח מופיע בסוגריים).

## 2026-11
- גיבוי-הלילה בשרת כולל גם ארגונים בנתיבי-השורש; משאבי הפונקציה הותאמו לקנה-מידה (`CLOSED-G1-ROOT-BACKUP`).
- אתר ציבורי חי לארגון וקישור-תשלום עם פרטים מלאים (`CLOSED-SITE-LIVE`, `CLOSED-PAYLINK-FULL-DETAILS`).
- אפליקציית PWA נוספת בחנות-האפליקציות של אורביט, עם כניסה בקוד גישה.

## 2026-10
- עורך אתר ציבורי, תרגום לספרדית/צרפתית, דומיין וליטוש (`CLOSED-SITE-EDITOR`, `CLOSED-SITE-ES-FR-SOLA`, `CLOSED-PUBLIC-SITE-*`).
- קופות צדקה: כפתורים ותזכורות (`CLOSED-TZEDAKA-BUTTONS`, `CLOSED-TZEDAKA-REMINDERS`); התראות הרשמה (`CLOSED-SIGNUP-NOTIFY`).
- ביצועי מסך התורמים בקנה-מידה גדול — התמדה, סינון ומיון בלי שינוי פלט (`CLOSED-PERF-SUPPORTERS-A`).
- סידור כרטיס-התורם (`CLOSED-CARDLAYOUT`); כתיבת קונפיג לענן כ-diff שדה-שדה במקום תצלום מלא (`CLOSED-SEGULA-CLOUDCFG-MERGE`).
- טלפונים מרובים למשפחה, כפילויות לפי כל הטלפונים, מסלולי-תזכורת עבריים/לועזיים (`CLOSED-OWNER-LIST-2026-10-13`).

## 2026-09
- ביקורות-עומק לקוד (סנכרון, כסף, אבטחה, עמידות) ולמסכים (`CLOSED-E2E-AUDIT`, `CLOSED-DEEP-AUDIT`, `CLOSED-SWARM-B`).
- לוח מעקב-טיפול, תזכורות חוזרות, זיכרון סינון וגלילה (`CLOSED-AYIN-BOARD`, `CLOSED-RECUR-REMINDERS`, `CLOSED-FILTER-MEMORY`, `CLOSED-CARE-BACK`).
- הסרה סלקטיבית של נתוני-דמו (`CLOSED-DEMO-PURGE`); שם-תצוגה לעובדים (`CLOSED-MEMBER-NAMES`); ייצוא מורות ל-CSV.

## 2026-08
- לולאת-אמון: אטימת מידע אישי, PBKDF2 לנעילת PIN, מצבות-מחיקה בסנכרון, בריאות תורי SMS/מייל, CI אבטחה ל-Rules (`CLOSED-TRUST`).
- שכבות עבודה לתורמים: חלון-עבודה, מרכז-מודיעין, גלקסיה (`CLOSED-COCKPIT`, `CLOSED-NEXTGEN`); שמונה שיפורי-תפעול לחוגים.
- שער-הצטרפות, צ'אט-צוות ותצוגת-מורה (`CLOSED-PORTAL-CHAT`); צרור-Roadmap: הו"ק המוני, גאנט, מלאי-מחסן (`CLOSED-ROADMAP-BATCH`).
- ורטיקל הסטודיו (דיגיטל/בנייה), ייבוא vCard, זהות חזותית פר-תחום (`CLOSED-STUDIO`); אתר ציבורי (`CLOSED-PUBLICSITE`).
- הרחבות: WhatsApp, מפות, יומן ICS, קישורי תשלום, Functions בשרת (גיבוי-לילה, תורי מייל/SMS); PWA ניתן להתקנה.
- פישוט ממשק בשבעה סבבים (`CLOSED-UX-SIMPLE`); הצטרפות ארגונים (`CLOSED-ONBOARD`); צרור-לילה (`CLOSED-NIGHT`).

## 2026-07
- בנייה מחדש ב-React 19 + TypeScript + Vite של אב-הטיפוס, וסגירת פערי-יכולת מול הגרסה הקודמת (`CLOSED-P0` … `CLOSED-P3`).
- פלטפורמת SaaS: הרשמה, אישור ואתר לכל ארגון (`CLOSED-PLATFORM`, `CLOSED-CLOUD2`); מסך הרשמה ואשף (`CLOSED-SIGNUP`, `CLOSED-SIGNUP2`).
- מודולים מבודדים: קופות צדקה וחנות (`CLOSED-TZEDAKA`, `CLOSED-SHOP` … `CLOSED-SHOP6`); חיבורי מערכת וסינון (`CLOSED-CONNECT`, `CLOSED-UX`).
