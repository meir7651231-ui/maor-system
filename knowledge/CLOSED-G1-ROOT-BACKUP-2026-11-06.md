# G1 · גיבוי-הלילה בשרת כולל את הלקוח-החי (6.11.2026)

**יעד:** O14 · G1. **הבאג:** `backupNightly` עבר רק על `platformOrgs` וקרא `orgs/{slug}/…`. הלקוח-החי
(`cloudRoot:true`) שומר בנתיבי-שורש ואינו ב-platformOrgs ⇒ **אפס צילומי-לילה** ללקוח המשלם.

**נתיבי-השורש (אומתו ב-`src/lib/cloud-diff.ts`):** אוספי-ישות `{col}` (23, ENTITY_COLLECTIONS) ·
meta `meta/org` · envelope `_enc/envelope` · donations-מפוצל `donations`.

**התיקון (`functions/index.js`):** `backupTargets()` — יעד-שורש קבוע `root` ⇒ `backups/root/{date}.json`,
אותה טבעת-30, אותם אוספים (+EXTRA_BACKUP). שורש בלי `meta/org` מדולג. ארגוני-פלטפורמה ללא-שינוי;
slug `root` שמור (מסונן מ-platformOrgs). BACKUP_COLLECTIONS≡ENTITY_COLLECTIONS נאכף (סט-שוויון חדש).

**הוכחות:** ratchet `src/lib/__tests__/root-backup.test.ts` (5) · אמולטור Firestore+Storage
`npm run test:backup-emu` (`functions/backup-root.emu.mjs`, נתונים סינתטיים) — ירוק בקוד-החדש,
נכשל בקוד-הישן (`No such object: backups/root/…`).

**דורש (מאיר):** מיזוג + פריסת Functions (`deploy-functions.yml`).

## 📏 קנה-מידה (בקשת «מעקב ביצוע»)
`npm run test:backup-scale` (אמולטור, 16,000 תורמים × 18 hist סינתטיים): צילום **33.7MB**, ריצה ~5s באמולטור,
heap ‏26⇒283MB (**+~257MB** לגיבוי עצמו), RSS שיא ~470MB ⇒ ברירת-המחדל של Functions v2 (256MiB/60s) הייתה
נכשלת בשקט. נקבע `memory:'1GiB', timeoutSeconds:540` ל-backupNightly (ratchet). כתיבה-בזרם לא נדרשת כעת (מרווח ~2×).
