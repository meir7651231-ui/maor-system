# מדיניות אבטחה · Security policy

## דיווח על חולשה · Reporting a vulnerability

**נא לא לפתוח issue ציבורי על חולשת אבטחה.**
דווחו בפרטיות דרך GitHub: לשונית **Security** ← **Report a vulnerability** (Private vulnerability reporting).
אם האפשרות אינה זמינה, פתחו issue קצר **בלי פרטים טכניים** ובקשו ערוץ פרטי.

Please do not open a public issue for a security vulnerability. Report it privately via the repository's
**Security → Report a vulnerability** tab. If that is unavailable, open a short issue without technical details and ask for a private channel.

## מה בתחום · Scope

- קוד האפליקציה (`src/`), כללי Firestore (`firestore.rules`), ה-Functions (`functions/`) וה-service worker (`public/sw.js`).
- שיטות הצפנה ונעילה: `src/lib/crypto.ts`, `src/lib/lock.ts`, `src/lib/cloudCrypto.ts`.

## גרסאות נתמכות · Supported versions

הפרויקט נפרס ברציפות מ-`main`; תיקוני אבטחה ניתנים רק לגרסה הנוכחית.
Only the current `main` is supported.

## מה כבר קיים · Existing safeguards

- כללי Firestore נבדקים ב-CI מול אמולטור (סוויטת red-team, `npm run test:rules`).
- `npm audit` ו-Dependabot לעדכוני תלויות.
- הצפנה במנוחה (opt-in): AES-GCM 256, מפתח-נתונים עטוף ב-PBKDF2 ובמפתח-שחזור.
