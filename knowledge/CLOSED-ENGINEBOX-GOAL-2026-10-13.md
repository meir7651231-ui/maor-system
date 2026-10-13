# 🎯 ארגז-המנועים — "להתחיל מהסוף" מעל הקטלוג האמיתי (13.10.2026)

> **חזון-הבעלים:** "יש ארגז עם מנועים עם חיבור זכר ונקבה… הוא בוחר מנוע, ואז המערכת אומרת: אתה יכול לחבר את המנוע
> פה ופה ושם, והתוצאה תהיה זה וזה וזה." — וההפך הקיצוני: הלקוח כותב **את התוצאה** ("אני רוצה שאורחים יוכלו להזמין
> שבת גם מטלפון כשר"), והארגז עובד אחורה כמו Waze: אילו מנועים להוסיף, לאן לחבר כל אחד, הקצר ראשון — ואם חסר מנוע
> בדרך, אומר בדיוק איזה, כדי שהמחולל יבנה אותו.

ענף: `claude/enginebox-goal-261013` = `claude/enginebox-261013` (הליבה) + מיזוג `claude/enginebox-route-261013` (מנוע-המסלול)
+ המתאם והפאנל. **לא מוזג; שום קובץ קיים לא נערך; שום דבר באפליקציה עוד לא מייבא את הקבצים ⇒ הלקוח-החי לא זז.**

## 1. מה נבנה

| קובץ | תוכן |
|------|------|
| `src/lib/enginebox/goal/routeAdapter.ts` | המתאם הטהור: `goalRoutes` · `routePartsFor` · טיפוסים `GoalResult/GoalRoute/GoalMissing/MissingKind` · `MAX_GOAL_ROUTES=3` |
| `src/lib/enginebox/goal/__tests__/routeAdapter.test.ts` | 15 ratchets (המשפט של הבעלים · sanitizeLinks · אין-מתוכנן · כנות · דטרמיניזם · הגנות-מקור) |
| `src/components/enginebox/GoalPanel.tsx` | פאנל-תצוגה טהור (props בלבד, בלי hooks): `GoalPanel` · `GoalRouteCard` · `MissingCard` + קבועי-הטקסט |
| `src/components/enginebox/goal.css` | העיצוב — tokens בלבד, mobile-first 390px, RTL, יעדי-מגע ≥40px, כהה/ניגודיות חינם |
| `src/components/enginebox/__tests__/goal-panel.test.ts` | 8 בדיקות: ריק · דוגמאות/הקלדה · המשפט של הבעלים · onApply · onRequestEngine · קריאה-בלבד · ריק/חסר · מסלול-בלי-חיבורים |

### ⚠️ הכרעה: הנתיב `goal/` ולא `src/lib/enginebox/routeAdapter.ts`
בדיקת-הליבה `enginebox.test.ts` (ז) נועלת את רשימת `src/lib/enginebox/*.ts` ל**בדיוק 5 קבצים** — קובץ שישי שם היה מפיל
את השער, ואסור היה לי לערוך קובץ קיים. לכן המתאם ב-תת-תיקייה חדשה `src/lib/enginebox/goal/` (ה-glob `../*.ts` לא רואה
אותה). אותן בדיקות-טוהר ובידוד של הליבה מוחלות על המתאם בבדיקה שלו. אם הסשן הסופי מעדיף את הנתיב המקורי — להעביר
ולעדכן את הרשימה ל-6.

## 2. ה-API

```ts
goalRoutes({ text, start?, config, stored? }): GoalResult   // לעולם לא זורק; קלט זבל ⇒ ריק
interface GoalResult {
  plugs: string[];                                    // התקעים שהובנו, בסדר-ההופעה
  matched: { word: string; plug: string; label: string }[];   // המילים כפי שנכתבו + תווית-התקן
  routes: GoalRoute[];                                // עד 3, הקצר ראשון
  missing: GoalMissing[];                             // איחוד כל החוסרים (לכרטיס "חסר מנוע")
}
interface GoalRoute { steps: string[]; linkKeys: string[]; alreadyLinked: boolean; missing: GoalMissing[] }
interface GoalMissing { plug; label; kind: 'none' | 'planned' | 'off'; line; partNames: string[] }
```
- `start` = מזהה מוצר (`hosting`/`parnasa`) או מזהה מנוע (`pr.phone`); ריק/זר ⇒ מתחילים מכלום. רק מה שבקטלוג (`catalogFor(config)`).
- `linkKeys` ממוינים, כולם `giver>plug>needer` שעוברים `isValidLink`/`sanitizeLinks` של הליבה.
- `alreadyLinked` = כל המפתחות ב-`effectiveLinks(stored)` (חסר ⇒ ברירת-המחדל של היום).
- שורות-החוסר: `none` ⇒ **"חסר מנוע שנותן X"** · `planned` ⇒ **"X עוד לא זמין · בקרוב"** · `off` ⇒ "X נמצא ב-Y, שעוד לא הודלק אצלכם".

## 3. איך המיפוי עובד (ההכרעות)
1. **צדדים חיים בלבד** נכנסים ל-`RoutePart` — צד `live:false` לעולם לא במסלול שאפשר להחיל.
2. **חיבור = בין שני כלים** (כמו `VALID_LINKS`): צורך מקודד `תקע>המודול-שלי`; נתינה מקודדת `תקע` (ליעד) **וגם**
   `תקע>מודול-אחר` לכל מודול אחר בקטלוג. כך מנוע-המסלול לא סוגר צורך מתוך אותו כלי ולא מתוך עצמו (למשל
   `host.dash` נותן וצריך "תקציר היום" — הצורך שלו נסגר רק מפרנסה׳לע). המפתחות מפוענחים חזרה ל-`תקע`.
3. **יעד בלי נותן-חי** לא נשלח למנוע (אחרת `findRoutes` מחזיר רק "חסר" ומאבד את הדרך החלקית) — נרשם ב-`missing`
   והשאר ממשיך.
4. **עוגן:** יעד שרק מתוכנן, ובקטלוג יש מנוע שעתיד לתת אותו **ויש לו צורך-חי** (היום: הקו, שעתיד לתת "שלוחה בקו")
   ⇒ המסלול מביא את המנוע הזה ומחבר אליו את מה שכבר אפשר (מקום-פנוי מהאירוח). עוגן שכבר בהתחלה ⇒ היעד הוא הצרכים
   החיים שלו. מנוע שכל צדדיו מתוכננים (משפחות · חוברת · פרסומות) לעולם לא עוגן ⇒ לעולם לא צעד.
5. **סדר:** כמו המנוע (פחות חסר · פחות מנועים); בתיקו — זה שמתחבר ליותר ממה שיש. מסלול ש"רק חסר" לא מוצג כמסלול.
6. **סיווג חוסר-ביניים** (צורך-חי שאין לו נותן-חי מכלי אחר) — אותו סיווג none/planned/off, מנקודת-המבט של המודול הצורך.
7. הפאנל: **מסלול בלי מפתחות** (רק "הוסף את X — הוא נותן Y" / "כבר יש לך הכול") ⇒ בלי כפתור ובלי "✓ כבר מחובר"
   מטעה — שורת "אין כאן חיבור לבחור". כפתור "בקשו מהמחולל" רק ל-`none`/`planned` (לא לכלי שפשוט כבוי).

## 4. הפלט האמיתי למשפט של הבעלים

`goalRoutes({ text: 'אני רוצה שאורחים יוכלו להזמין שבת גם מטלפון כשר', start: 'hosting', config /* parnasa+hosting */ })`:
- **הבנתי:** להזמין · הזמנה — שבת · זמני שבת — מטלפון כשר · שלוחה בקו (`plugs = booking, times.shabbat, voice.menu`)
- **דרך 1** (✓ כבר מחובר — כל החיבורים חווטו כבר היום):
  1. הוסף את 📞 הקו (טלפון כשר)
  2. 📞 הקו (טלפון כשר) מקבל מקום פנוי מ-🛏️ יחידות ותפוסה
  3. הוסף את 🕯️ זמני היום והשבת וחבר אותו ל-📊 לוח הבקרה ול-🕯️ לשונית שבת ול-🧳 כרטיס השהייה — הוא נותן זמני שבת
  - `linkKeys`: `host.units>availability>pr.phone` · `pr.zmanim>day.summary>host.dash` · `pr.zmanim>times.shabbat>host.shabbat` · `pr.zmanim>times.shabbat>host.stay`
- **חסר:** "הזמנה עוד לא זמין · בקרוב" (יחידות ותפוסה) · "שלוחה בקו עוד לא זמין · בקרוב" (הקו) — כל אחד עם "בקשו מהמחולל לבנות אותו".
- עם `stored: []` (הכול מנותק) ⇒ אותה דרך, `alreadyLinked:false` ⇒ כפתור "חבר את כל הדרך".
- מ-`parnasa`: "הוסף את 🛏️ יחידות ותפוסה וחבר אותו ל-📞 הקו (טלפון כשר)" (`host.units>availability>pr.phone`).
- פרנסה׳לע כבויה: אין דרך; "זמני שבת נמצא ב-🕯️ זמני היום והשבת, שעוד לא הודלק אצלכם".
- דוגמאות נוספות: "בעל מקצוע לתקלה דחופה" מאירוח ⇒ מדריך-העסקים לתוך תחזוקה וניקיון · "חוברת להדפסה" ⇒ "דף להדפסה עוד לא זמין · בקרוב" · "תזכורת" ⇒ "חסר מנוע שנותן תזכורת".

## 5. איך הסשן הסופי מחווט את הלשונית "🎯 להתחיל מהסוף"

```tsx
// בתוך components/enginebox/ (ה-chunk העצל של המסך — לעולם לא מ-App/הבנדל-הראשי):
import { GoalPanel } from './GoalPanel';
import { goalRoutes } from '../../lib/enginebox/goal/routeAdapter';   // מותר כאן: הקובץ הזה כבר עצל
// …או, אם הקובץ המחווט נטען סטטית: const { goalRoutes } = await import('../../lib/enginebox/goal/routeAdapter')

const [goalText, setGoalText] = useState('');
const result = useMemo(
  () => (goalText.trim() ? goalRoutes({ text: goalText, start: startId, config, stored: db.ui.engineLinks }) : null),
  [goalText, startId, config, db.ui.engineLinks],
);

<GoalPanel
  text={goalText}
  result={result}
  canEdit={source.canEdit}                       // אותה הכרעת-הרשאה של "חבר"/"נתק" (מנהל)
  onText={setGoalText}
  onApply={(keys) => { for (const k of keys) linkEngine(k); }}   // פעולת-ה-store — לכל מפתח; צריכה להיות אידמפוטנטית
  onRequestEngine={(plug, text) => requestEngine(plug, text)}    // תור/בקשה למחולל — לפי מה שהסשן הסופי מגדיר
/>
```
- **`onApply`** מקבל **את כל** מפתחות-הדרך (גם המחוברים כבר) — `linkEngine` צריך להוסיף רק מה שחסר (set), או לסנן
  ב-`isLinked`. הכפתור מוצג רק כשלפחות מפתח אחד לא מחובר. אחרי ההחלה — `result` מחושב מחדש מ-`db.ui.engineLinks`
  ⇒ "✓ כבר מחובר".
- **`start`** = ההתחלה שהלקוח כבר בחר בצעד 1 של המסך (מוצר או מנוע); בלי התחלה — `null`.
- **`onRequestEngine(plug, text)`** — `plug` מהתקן, `text` המשפט המקורי. עד שיש מחולל: אפשר לפתוח הודעה/טופס עם שניהם.
- **ratchet:** `routeAdapter.test.ts` כבר נועל שאף קובץ-ייצור לא מייבא את המתאם סטטית (רק `import type` או `import()`)
  ושה-barrel `lib/enginebox/index.ts` לא מייצא אותו. **⚠️ ייבוא סטטי מתוך `EngineBoxScreen.tsx` ייתפס** — לכן או `import()`
  בתוך הקובץ, או קובץ-כניסה עצל (`EngineBoxEntry`) שמייבא את המתאם ב-`import()`; אם מחליטים שייבוא סטטי בתוך
  `components/enginebox/` מותר (הוא כבר chunk עצל) — להרחיב את ה-ratchet במפורש לתיקייה הזו בלבד, ולוודא ב-build שהמתאם לא בכניסה הראשית.
- להוסיף את `goal.css` — הפאנל מייבא אותו בעצמו (נגרר עם ה-chunk).

## 6. שערים
`npm run verify:fast` ✅ (434 קבצים · 3,656 בדיקות) · `npm run verify` ✅ (כולל build) לפני ה-push.
אפס כסף/קבלות/לוח-ראשי/חדרים · אפס Rules/Functions/store/domain · אפס עריכת קובץ קיים.

## 7. נותר
- חיווט הלשונית במסך + פעולות-store `linkEngine`/`requestEngine` (הסשן הסופי).
- הרחבת המילון (`GOAL_LEXICON`) מנתוני-אמת; ספירות-מתכונים (`rankByRecipes`) — הכרעת-בעלים על פרטיות.
