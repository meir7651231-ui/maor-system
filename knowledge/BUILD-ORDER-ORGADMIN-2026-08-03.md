# BUILD-ORDER · היררכיית ניהול 3-שכבתית (מנהל-ארגון + עובדות)

**מנדט-בעלים (3.8.2026):** "חשבון מנהל וחשבון עובדות. המנהל נרשם, אני ממנה אותו,
הוא מפעיל הרשמת-עובדים ונותן קישור, מאשר ומנהל אותן. אני מעל כולם."

**הכרעות-בעלים (AskUserQuestion):**
1. **מינוי מנהל** = ידני ע"י מייל-העל (בעת אישור הארגון ב-#platform).
2. **הצטרפות עובדות** = קישור-הזמנה + אישור-מנהל.
3. **הרשאות עובדת** = רמות-הרשאה מהיום (מלא / מוגבל).

## 🔴 אילוץ-על (הכרעת-בעלים ממתינה): מסמך-יחיד
מבנה-הנתונים = מסמך-ענן אחד לארגון ⇒ Firestore מגדר ברמת-המסמך בלבד. לכן
"עובדת מוגבלת" = **הגבלת-ממשק** (תפקיד-מורה קיים `config.roles.teachers`),
**לא** בידוד-נתונים קריפטוגרפי. בידוד-אמת = פיצול מבנה-הנתונים = פרויקט נפרד.
**מומלץ ומאושר-לבנייה:** רמות ברמת-הממשק מהיום.

## שכבות (3 שכבות היררכיה)
- **מייל-על (אתה)** — `SUPER_ADMIN_EMAILS`. מאשר ארגונים, ממנה מנהל, מעל הכל.
- **מנהל-ארגון** — `platformOrgs/{slug}.manager` (מייל יחיד). מנהל את העובדות
  של הארגון שלו בלבד.
- **עובדת** — ב-`members[]` של הארגון, עם `memberRoles[email] = 'full' | 'limited'`.

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

## אינווריאנטים
- כל שדה חדש **additive** — ארגון קיים (מאור, cloudRoot) בלי השדות = התנהגות היום.
- מאור = אתר-השורש (cloudRoot) — ההיררכיה החדשה חלה על **ארגוני-פלטפורמה**;
  למאור-עצמה הגישה נשארת allowlist-שורש (או תהפוך לארגון-פלטפורמה בהחלטת-בעלים).
- מייל-על מעל הכל תמיד; מנהל מוגבל לארגון-שלו (נאכף ב-Rules v3).
