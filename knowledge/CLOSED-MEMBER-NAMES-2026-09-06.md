# 🪪 שם-תצוגה לעובד/ת (6.9.2026)

**בקשת-הבעלים:** "בכל מייל בעובדים אני רוצה בכרטיס לרשום את שם [העובד/ת] — שיראו בחוץ מי זה."

## עיצוב
- **נתון:** `memberConfigs[email].displayName` (‏`EmployeeOverride.displayName?: string`, `lib/cloudConfig.ts`). יושב בתוך `memberConfigs` ⇒ **Rules v3 מכסים אותו בלי שינוי** (מנהל-ארגון מעדכן `members/memberConfigs/joinOpen/joinCode`). חסר ⇒ המייל.
- **מנוע טהור** (`platform/lib.ts`): `memberDisplayName(org, email)` · `memberNamesOf(org)` (מייל⇒שם) · `whoLabel(names, who)` (שם/מייל/—).
- **store:** `cloud.memberNames` נטען משני מסלולי-הקונפיג של ארגון-פלטפורמה (`applyCloudDoc` החי + `fetchOrgCloudConfig` בהתחברות).
- **UI:**
  - **כרטיס-העובד** (`ManagerPanel`, ‏👥 ניהול העובדות): שדה "🪪 שם להצגה" (שמירה ב-blur/Enter); בכותרת-הכרטיס השם ראשון והמייל קטן מתחת.
  - **אישור בקשת-הצטרפות** זורע את השם שהעובד/ת מילא/ה בבקשה (`joinRequests.name`) — אפשר לשנות בכרטיס.
  - **לוג-הפעולות** (הגדרות ← 🧾): עמודת "מי" מציגה שם (המייל ב-title).
  - **צ׳אט-הצוות:** שם-השולח מהכרטיס (גם ההודעות שלי נשלחות עם השם).
- **לא נגע:** ‏audit `who` נשאר מייל ב-DB (מפתח-יציב; הצגה בלבד) · Rules · לקוח-שורש (בלי כרטיסי-עובד; adminEmails).

## ratchet
`platform/__tests__/member-display-name.test.ts` (5). ‏`audit-trail.test.ts` חלון-הגנת-המקור הורחב ל-900.
