# 🙏 שמות לתפילה בכרטיס-התורם + זיכרון-גלילה בחזרה (5.9.2026)

## בקשות-הבעלים
1. "יכולת חדשה לשמור בתורמים שמות לתפילה עם הערות בתוך כרטיס התורם."
2. "כפתור חוזר — שיחזור בדיוק למיקום הקודם ולא לתחילת העמוד."

## 1 · שמות לתפילה (`supporters.prayernames`, חסר = פעיל)
- **נתונים:** `Supporter.prayerNames?: PrayerName[]` — `{id, name, note, addedAt, done?}`; additive, אין מיגרציה; **נפרד** ממעקב-הטיפול (ayin — שמות-לטיפול עם מונה/שלבים). מסתנכרן עם התומך (ENTITY supporters), נכלל בגיבוי, ומאוחד במיזוג-כפולים (`dedup.mergeSupporterInto` — לפי id).
- **מנוע טהור** `components/supporters/prayer.ts`: `planAddPrayerName` (דדופ לפי שם מנורמל, הערה מנוקה, addedAt מוזרק) · `setPrayerNote` · `togglePrayerName` · `removePrayerName` · `prayerOpenCount` · `prayerListText` (טקסט-להעתקה "שם — הערה", הוזכרו בסוף עם ✓).
- **store:** `addPrayerName/setPrayerNote/togglePrayerName/removePrayerName` (setDb map; toast; דדופ ⇒ false).
- **UI** `PrayerNames.tsx` בכרטיס-התורם (מעל מעקב-הטיפול): שם + הערה + "+ הוספה" (Enter) · שורה לשם: ✓ הוזכר (aria-pressed) · הערה עריכה-במקום · תאריך-הוספה · ✕ הסרה בשתי-לחיצות (2.5s) · "📋 העתקת הרשימה" · מונה "פתוחים · סה"כ".
- **לא נגע:** כסף/קבלות · ayin · לגאסי (אין יכולת כזו בקובץ-החי — תוספת).
- ratchet: `prayer-names.test.ts` (5).

## 2 · זיכרון-גלילה (`lib/scrollMemory.ts`)
- הגלילה של האתר היא על ה-window. **רשימה⇄כרטיס:** `useListScrollRestore(key, inDetail)` — כל עוד ברשימה עוקב אחרי `scroll` (passive); כשנפתח כרטיס שומר את המיקום האחרון (לפני שהדפדפן מקצץ כי הכרטיס קצר); בחזרה משחזר בשתי `requestAnimationFrame`. מחווט בתורמים (`selId`), משפחות (`selFamilyId`), חוגים (`selCourseId`) — לפני כל return-מוקדם (hooks-order-guard).
- **מסך⇄מסך (↩ חזרה / ניווט):** `useViewScrollMemory(view)` ב-App — שומר את גלילת המסך שעוזבים, משחזר את זו של המסך שחוזרים אליו (מסך חדש ⇒ 0).
- ratchet: `scroll-memory.test.ts` (3).

## הוכחות
typecheck · lint · יחידה · e2e: launch-readiness · ayin-names-smoke · toggle-matrix · full-audit (ראה סיכום-סוללה בסשן).
