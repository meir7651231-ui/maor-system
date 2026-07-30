# 🏗 פקודת בנייה — PLATFORM: חיבור העמודות החדשות למכונת ה-white-label

**מאת:** הארכיטקט · 30.7.2026 · **ענף:** `claude/what-do-you-see-bcxttj` · רץ אחרי CONNECT. קידומות: `אשף 1 ·`–`אשף 4 ·`.
**הרקע (הכרעת בעלים):** מאור = פלטפורמה, לא אפליקציה. יכולת שלא מחוברת לאשף — לא גמורה. הממצא: אף אחת מ-8 חבילות הוורטיקל לא מתייחסת ל-tzedaka/shop ⇒ לפי חוזה "חסר=דלוק" מוסך מקבל עמודת קופות צדקה.

## אשף 1 · מטריצה מפורשת ב-8 החבילות הקיימות (`אשף 1 ·`)
**קובץ:** `src/lib/verticalPacks.ts`.
1. כל pack מקבל עמדה מפורשת (ברירות הארכיטקט — הבעלים רשאי לדרוס):

| pack | tzedaka | shop |
|---|---|---|
| עמותת חסד | ✅ (חסר=דלוק — השאר בלי מפתח, אבל **תעד בהערה** שזה מכוון) | ✅ (כנ"ל) |
| קליניקה · שירותים/פרילנסר · השכרת חללים · צי רכב · מוסך/מעבדה · אירוח/צימרים | `tzedaka: false` | `shop: false` |
| חנות/קמעונאות (ה-pack הוותיק 'shop') | `tzedaka: false` | ✅ דלוק + מונחים קמעונאיים: nav.shop='מוצרים', entity.shopProduct='מוצר', entity.shopAssignment='הזמנה', entity.shopCriterion='מועדון' |

2. **התנגשות השמות** (pack id 'shop' מול מודול 'shop') — לא משנים id (שבירת configs קיימים); הוסף הערת-קוד מפורשת על ההבחנה.

## אשף 2 · שני ורטיקלים חדשים — 8→10 (`אשף 2 ·`)
3. **גמ"ח** (id: 'gemach'): ‏modules: courses:false, diary:false, tzedaka:false; ‏shop דלוק. מונחים: nav.shop='גמ"ח', entity.shopProduct='חבילת השאלה', entity.shopItem='פריט', entity.shopAssignment='השאלה', entity.tzCoordinator לא רלוונטי; nav.families='משפחות', nav.supporters='תורמים'. תווית: 'גמ"ח (השאלת ציוד)'.
4. **מבצעי התרמה** (id: 'tzedakot'): ‏modules: courses:false, diary:false, shop:false; ‏tzedaka דלוק. מונחים: nav.tzedaka='מבצעים', entity.tzCoordinator='רכז', entity.tzBox='קופה', entity.tzCampaign='מבצע'. תווית: 'ארגון מבצעי התרמה'.
5. שני ה-packs עם עמדה מפורשת לכל 8 ה-ModuleKeys (המטריצה המלאה).

## אשף 3 · ‏ratchet כיסוי-מלא (`אשף 3 ·`)
6. בדיקה חדשה (verticalPacks.test.ts): **לכל pack, לכל ModuleKey — קיימת עמדה מוגדרת** (מפתח ב-modules או רישום ברשימת ON-מכוון בהערת ה-pack). מימוש מעשי: קבוע `INTENTIONAL_ON: Record<packId, ModuleKey[]>` בקובץ הבדיקה — הבדיקה נכשלת אם מודול לא מופיע לא ב-modules ולא ב-INTENTIONAL_ON. ⇒ **המודול הבא שיתווסף ישבור את הבדיקה עד שכל ורטיקל יקבל עמדה.** תעד בעברית: "הבאג של 30.7 — מוסך עם קופות צדקה — לא חוזר".
7. בדיקת מונחים: לכל pack עם shop/tzedaka דלוק — קיימים לפחות מונחי ה-nav (לא מסך ריק-שם).

## אשף 4 · סגירה (`אשף 4 ·`)
8. עדכן את מסך הוורטיקלים באשף (BuilderWizard 'wz-vertical') — שני החדשים מופיעים אוטומטית מ-VERTICAL_PACKS; ודא תצוגה תקינה של 10 (גריד).
9. **הכרעת הלקוח החי:** ‏`public/c/maor-hachesed/config.json` — הבעלים הכריע להשאיר את שתי העמודות דלוקות אצלו? **אל תיגע בקובץ בלי אישור מפורש בדוח** — רשום את השאלה בדוח המסירה עם המצב הנוכחי (חסר=דלוק ⇒ דלוקות היום).
10. שלוש הסוויטות (toggle-matrix פרופיל מונחים — הרחב לוורטיקל gemach: הקישור "גמ"ח" מופיע במקום "חנות") · CLOSED-PLATFORM · CLAUDE.md ("8 חבילות ורטיקל"→10) · DECISIONS.
