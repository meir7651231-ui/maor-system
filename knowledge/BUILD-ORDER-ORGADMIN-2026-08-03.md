# BUILD-ORDER · היררכיית ניהול 3-שכבתית (מנהל-ארגון + עובדות)

**מנדט-בעלים (3.8.2026):** "חשבון מנהל וחשבון עובדות. המנהל נרשם, אני ממנה אותו,
הוא מפעיל הרשמת-עובדים ונותן קישור, מאשר ומנהל אותן. אני מעל כולם."

**הכרעות-בעלים:**
1. **מינוי מנהל** = ידני ע"י מייל-העל (בעת אישור הארגון ב-#platform).
2. **הצטרפות עובדות** = קישור-הזמנה + אישור-מנהל.
3. **הרשאות עובדת** = **כרטיס-עובד** (הכרעה מעודכנת 3.8): לא "מלא/מוגבל" נוקשה,
   אלא **דריסת-קונפיג אישית פר-מייל דרך אותו אשף** — המנהל מדליק/מכבה לכל
   עובד/ת מודולים ודגלים. `memberConfigs[email] = { modules?, features? }`;
   הקונפיג-האפקטיבי = קונפיג-הארגון בניכוי מה שכובה (רק הגבלה). מנהל = מלא.

## 🔴 אילוץ-על (הכרעת-בעלים ממתינה): מסמך-יחיד
מבנה-הנתונים = מסמך-ענן אחד לארגון ⇒ Firestore מגדר ברמת-המסמך בלבד. לכן
"עובדת מוגבלת" = **הגבלת-ממשק** (תפקיד-מורה קיים `config.roles.teachers`),
**לא** בידוד-נתונים קריפטוגרפי. בידוד-אמת = פיצול מבנה-הנתונים = פרויקט נפרד.
**מומלץ ומאושר-לבנייה:** רמות ברמת-הממשק מהיום.

## 🔑 הזרימה המלאה (הכרעת-בעלים 3.8, מדויקת)
1. מאור מתקשר; המנהל נרשם וממתין.
2. **בעלים+מנהל בלייב יחד:** בעלים על אשף-ההקמה (#platform), מנהל על האתר החי
   (onSnapshot — כל מתג מיידי). בעלים מדליק/מכבה, סוגר מחיר, **מוסר**.
3. **מנהל נכנס** → מפעיל הרשמת-עובדים → מדליק/מכבה לעובדות **רק את הכפתורים
   שהבעלים הדליק לארגון**. מה שלא-הודלק (לא-שודרג/לא-נקנה) — **המנהל לא רואה כלל**.
4. **המנהל לא רואה את אשף-ההקמה** — יש לו **אשף ייחודי** מצומצם ל-`orgEnabledModules`.

**עקרון-הסיפון (3 קומות ceiling):** בעלים קובע את תקרת-הארגון (מה נקנה) →
מנהל מחלק **בתוך התקרה** בין העובדות → עובדת ⊆ מה שהמנהל נתן לה ⊆ תקרת-הארגון.
`orgEnabledModules(orgConfig)` = טווח-האשף-הייחודי של המנהל. `effectiveConfigFor`
= הקונפיג של העובדת (רק הגבלה, לעולם לא חריגה).

## שכבות (3 שכבות היררכיה)
- **מייל-על (אתה)** — `SUPER_ADMIN_EMAILS`. מאשר ארגונים, ממנה מנהל, מעל הכל.
- **מנהל-ארגון** — `platformOrgs/{slug}.manager` (מייל יחיד). מנהל את העובדות
  של הארגון שלו בלבד.
- **עובדת** — ב-`members[]` של הארגון, עם `memberConfigs[email]` = כרטיס-עובד
  (דריסות אישיות דרך האשף). חבר בלי כרטיס = רואה כמו הארגון (מלא).

## מודל-נתונים (Firestore)
`platformOrgs/{slug}` — שדות חדשים (additive, backward-safe):
- `manager: string` — מייל המנהל (lowercase). מוגדר ע"י מייל-על באישור.
- `memberRoles: { [email]: 'full' | 'limited' }` — רמת-הרשאה פר-עובדת. מנהל=full.
- `joinOpen: boolean` — מתג "הרשמת-עובדים" של המנהל.
- `joinCode: string` — טוקן בקישור-ההזמנה (`?org=slug&join=<code>`).
- (קיימים: `config`, `members[]`, `provisioned`, `orgName`, `createdAt`.)

`platformOrgs/{slug}/joinRequests/{uid}` — בקשת-עובדת (create-only ע"י המבקש):
- `email`, `name`, `at`, `code` (מהקישור, נבדק מול `joinCode`).

## Firestore Rules v3 (הרחבת v2 — additive)
- `isOrgManager(slug)` = `auth.email.lower() == get(platformOrgs/{slug}).data.manager`.
- `platformOrgs/{slug}`:
  - read: `superAdmin() || orgMember(slug)` (כמו v2).
  - write **מלא**: `superAdmin()` (כולל קביעת `manager`/`config`/`provisioned`).
  - update **חלקי למנהל**: `isOrgManager(slug)` **רק** לשדות
    `members`/`memberRoles`/`joinOpen`/`joinCode`
    (‏`diff().affectedKeys().hasOnly([...])`) — המנהל לא נוגע ב-config/manager.
- `platformOrgs/{slug}/joinRequests/{uid}`:
  - create: `auth.uid == uid` (עובדת מבקשת להצטרף — כל מאומת).
  - read, delete: `superAdmin() || isOrgManager(slug)`.
- `orgs/{slug}/{col}/{doc}`: read/write `superAdmin() || orgMember(slug)` (כמו v2;
  ה-'limited' נאכף בממשק, לא ב-Rules — ראה אילוץ-העל).

## שלבי-בנייה (כל שלב = שער verify:fast; סוף-אשכול = 3 סוויטות)
1. **ליבה טהורה + טיפוסים** — `platform/lib.ts`: `genJoinCode`, `orgJoinLink`,
   `canManage`, `roleOf`, נירמול memberRoles; טיפוסי `PlatformOrg` מורחבים.
   ratchet: ליבה נבדקת ביחידה.
2. **Rules v3** בריפו (`firestore.rules`) + בדיקת-מבנה. (פרסום = חלון-בעלים.)
3. **מייל-על #platform** — באישור ארגון: בורר "מי המנהל" (מתוך המבקש/הזנה);
   כותב `manager` + `memberRoles[manager]='full'`.
4. **פאנל-מנהל** (בתוך האפליקציה, מגודר isOrgManager) — מתג "הרשמת-עובדים"
   (joinOpen) + הצגת קישור-ההזמנה + רשימת בקשות-ממתינות (אישור→members+role,
   דחייה) + ניהול-עובדות קיימות (רמת-הרשאה, הסרה).
5. **זרימת-עובדת** — קישור `?org=slug&join=code` → הרשמה → כתיבת joinRequest →
   מסך-המתנה "הבקשה נשלחה למנהל"; אחרי אישור → כניסה לפי memberRole.
6. **אכיפת רמת-הרשאה בממשק** — 'limited' ⇒ מסלול תפקיד-המורה הקיים (או הסתרת
   מסכים לפי דגל); מנהל/full = הכל.
7. **תיעוד + 3 סוויטות + פריסה** (app-side). Rules v3 publish = הבעלים.

## ✅ סטטוס יישום (3.8.2026) — הושלם והופץ
כל 7 השלבים נבנו, אומתו (1072 בדיקות + 3 סוויטות דפדפן) והופצו:
- **1-2 · תשתית:** `EmployeeOverride`/`memberConfigs`, ליבה טהורה (normEmail/genJoinCode/
  orgJoinLink/isOrgManager/isMember/roleOf→effectiveConfigFor/approveMember/
  setEmployeeOverride/removeMember/orgEnabledModules), Rules v3, cloud API
  (writeOrgJoinRequest/fetchOrgJoinRequests/deleteOrgJoinRequest).
- **3 · מייל-על:** שדה מייל-מנהל באישור (PlatformPanel) → manager+members.
- **4 · פאנל-מנהל:** `ManagerPanel` (#manage, cloud.isManager) — אשף ייחודי מצומצם
  ל-orgEnabledModules + הרשמת-עובדים + קישור + אישורים + כרטיס-עובד + הסרה.
- **5 · עובדת:** `?join=code` ⇒ writeOrgJoinRequest ב-membership block; מסך-המתנה קיים.
- **6 · אכיפה:** applyCloudDoc מחיל effectiveConfigFor; cloud.isManager + כפתורי 👥.

**נותר לבעלים (חלון-בעלים):** לפרסם Rules v3 בקונסולה (הדבקה→Publish). בדיקת-אמת
חיה של הזרימה (שני-דפדפנים) = הבעלים, כמו ב-CLOUD2 (סביבת-הבנייה חוסמת Firebase TLS).

## אינווריאנטים
- כל שדה חדש **additive** — ארגון קיים (מאור, cloudRoot) בלי השדות = התנהגות היום.
- מאור = אתר-השורש (cloudRoot) — ההיררכיה החדשה חלה על **ארגוני-פלטפורמה**;
  למאור-עצמה הגישה נשארת allowlist-שורש (או תהפוך לארגון-פלטפורמה בהחלטת-בעלים).
- מייל-על מעל הכל תמיד; מנהל מוגבל לארגון-שלו (נאכף ב-Rules v3).
