# 🧬 ארגז-המנועים · מסך "מנועים וחלקים" — מול תפר (ATOMS-SCREEN, 14.10.2026)

> **חזון-הבעלים (כפי שלימד צעד-צעד):** הארגז הקיים מחבר *מוצרים גמורים* ("זמני שבת לתוך כרטיס-השהייה"). הוא רוצה לחבר
> *מנועים* — על-ידי פירוק. כל מנוע גדול בנוי ממנועים קטנים (מנוע הזמנים = 15 חלקים, למשל #7 "חלק לשווים", #13 "מיזוג רצפים").
> חלק קטן לא יודע למה משתמשים בו. יש לי מנוע (ההזמנות) ⇒ בוחרים חלק (#7) ⇒ הוא שואל **שאלה אחת** ("מה לחלק?") ומציע רק
> את מה שבמנוע שלי מהסוג שלו, כל אחד עם התוצאה ⇒ פרטים ⇒ "חבר" ⇒ **מנוע חדש** ("מנוע תורים") שחוזר לארגז; חלקים גם משתרשרים.

ענף: `claude/atoms-screen-261014` (מ-`claude/enginebox-int-261013` @ fb2c6a1). **לא מוזג.** סשן-בונה אחד מתוך צוות מקביל —
סשנים אחרים בונים את החלקים האמיתיים (`src/lib/atoms/parts`, `cards.ts`, `engines`); כאן נבנה **רק המסך, מול ממשק**.

## 1. הזרימה (לשונית ראשונה חדשה "🧬 מנועים וחלקים" במודאל הקיים)
1. **המנועים** — כרטיס לכל מנוע (אימוג׳י · שם · צ׳יפ "מאיזה כלי" · שורת `computes`). לחיצה ⇒ **הפירוק**: החלקים הממוספרים
   עם שורת `computes`; חלק שהוא חלק-ארגז מקבל צ׳יפ "בארגז ✂️" (האימוג׳י של החלק).
2. **יש לך מנוע · איזה חלק לחבר אליו?** — בוחרים מנוע-בית ⇒ גריד **כל** החלקים מכל המנועים (אימוג׳י · שם · "מתוך מנוע הזמנים · 7" ·
   `computes`) + מתחתיו **שרשראות** (`chains(engineId)`: שני אימוג׳י-חלקים · שם · משפט-תוצאה).
3. **השאלה האחת** — `atom.question` בגדול (28px/24px במובייל); מתחתיה האפשרויות מ-`optionsFor(atom, engine)` **של החוזה**:
   שם-המקום · צ׳יפ-סוג קטן · **התוצאה** (הטקסט הבולט). אין ⇒ "החלק הזה לא מתחבר למנוע הזה".
4. **הפרטים** — טופס שנוצר מ-`atom.details` (מספר / דקות / בחירה-בצ׳יפים), עם ברירות-המחדל ⇒ "חבר".
5. **המנוע החדש** — "✨ נוצר מנוע חדש: <שם>" + שורות `preview(capability)`; null ⇒ "התצוגה תגיע בקרוב". "המנועים שיצרת" —
   כל יכולת עם "הסר" **בשתי לחיצות** ("בטוח? לחצו שוב", פג אחרי 3.5ש׳ — כמו `useArmed`).
- `canEdit=false` ⇒ צפייה בלבד: הניווט עובד, אין "חבר"/"הסר", שדות-הטופס readOnly/disabled.
- מקור null (או ריק) ⇒ "🧬 החלקים בהרכבה — עוד מעט".
- מובייל-ראשון 390px (אומת: אין גלילה אופקית), RTL, tokens בלבד, יעדי-מגע ≥44px, פוקוס לכותרת-הצעד בכל מעבר.

## 2. התפר (`src/components/enginebox/atoms/seam.ts`)
```ts
export interface AtomPreview { title: string; lines: string[] }
export interface AtomChain { atoms: [string, string]; name: string; result: string }
export interface AtomsSource {
  engines(): EngineCard[]; atoms(): AtomCard[]; capabilities(): Capability[];
  preview(c: Capability): AtomPreview | null; chains(engineId: string): AtomChain[];
  create(c: Capability): void; remove(id: string): void; canEdit: boolean;
}
```
ההתאמה **לא משוכפלת**: המסך קורא רק ל-`optionsFor` של `src/lib/atoms/contract.ts` (נעול ב-ratchet).

## 3. הקבצים
| קובץ | מה |
|---|---|
| `src/lib/atoms/contract.ts` | החוזה המשותף — העתק מדויק, md5 `d1633928cab86f6d2b0e9c3f8c7de598` (נעול ב-ratchet). |
| `components/enginebox/atoms/seam.ts` | התפר. |
| `components/enginebox/atoms/naming.ts` | טהור: `capabilityName` (טבלה קצרה `NAME_RULES` חלק+מילה-בשם-המקום ⇒ שם; נפילה "<מנוע> + <חלק>") · `detailDefaults` · `cleanParams` (מספר בגבולות, לא-מספר ⇒ ברירת-מחדל, בחירה רק מהרשימה) · `buildCapability` (id = `capabilityId`) · `connectCapability` (רק כש-canEdit) · `removeTap` · `fromChip`. |
| `components/enginebox/atoms/AtomSteps.tsx` | רכיבי-הצעדים הטהורים (בלי hooks): EnginesStep/Decomposition/HostStep/AtomGrid/ChainsList/QuestionStep/DetailsStep/CreatedCard/CreatedList/AtomsHeader + הטקסטים. |
| `components/enginebox/atoms/AtomsBody.tsx` | המצב (מנוע-בית/חלק/מקום/ערכים/נוצר/חימוש) — `initial` לבדיקות. |
| `components/enginebox/atoms/atoms.css` | קידומת `at-`; tokens בלבד. |
| `EngineBoxScreen.tsx` (תוספתי) | `BoxTab += 'atoms'`; `BoxTabs` קיבל `atoms?`/`goal?` (בלי שניהם ⇒ ביט-זהה); `EngineBoxBody`/`EngineBoxScreen` קיבלו `atoms?: AtomsSource \| null`. |
| `EngineBoxEntry.tsx` (תוספתי) | `atoms={null}`. |

## 4. ההכרעות
1. **`atoms` undefined ⇒ אין לשונית בכלל** (המסך ביט-זהה לתצלום שנלקח לפני השינוי — `__tests__/old-flow-markup.json`, 9 מצבים).
   `null` ⇒ הלשונית קיימת עם מצב-ריק כן. הכניסה מעבירה `null` כפי שהוגדר ⇒ **בפרודקשן (מאחורי `shell.enginebox===true`) מופיעה
   לשונית שלישית עם "החלקים בהרכבה"**.
2. **ברירת-המחדל לא השתנתה** — הלשונית הפעילה בפתיחה נשארת "🔌 לחבר מנוע" (המסע 54/54 עובר); הסשן הסופי יחליט.
3. מקור **בלי `goal`** + עם `atoms` ⇒ שתי לשוניות (מנועים וחלקים · לחבר מנוע), בלי "להתחיל מהסוף". מקור-ארגז null + atoms ⇒ פס-לשוניות
   + מצב-הריק הישן.
4. "אין כפתורים בקריאה-בלבד" פורש כמו בארגז הקיים: **אין כפתורי-פעולה** (חבר/הסר); הניווט (כרטיסים/אפשרויות) נשאר כדי לצפות.
5. השם נגזר ממילים בשם-המקום (ולא ממזהה-המקום), כי מזהי-המקומות האמיתיים עוד לא קיימים; הטבלה קצרה ונופלת בכנות ל-"<מנוע> + <חלק>".
6. `params` מנוקים לפני `create` (מספר בגבולות min/max, choice רק מהרשימה) — הצד-המקור מקבל ערכים תקינים בלבד.
7. מצב-כהה: אין ערכה כהה בריפו מעבר ל-tokens; ה-CSS משתמש רק ב-tokens (כמו `enginebox.css`) ולכן יורש כל ערכה/ניגודיות.

## 5. בדיקות
- `atoms-screen.test.ts` (16) — עם `atoms-fixtures.ts` (3 מנועים: זמנים/"מה צריך?"/הזמנות; חלקים divide/merge/next; מקומות כמו בדוגמת
  הבעלים + מקום-רצף עם משפט ל-divide שחייב **לא** להופיע, ומקום-טקסט בלי משפטים): כרטיסים+פירוק+צ׳יפ "בארגז" · השאלה + רק
  המתאימים בסדר-המקומות (זהה ל-optionsFor) · ברירות-מחדל בטופס · "חבר" ⇒ create עם `capabilityId` ו-params מנוקים · שמות ·
  כרטיס-נוצר + null ⇒ "בקרוב" · "הסר" בשתי לחיצות · שרשראות · קריאה-בלבד · מצב-ריק.
- `atoms-ratchet.test.ts` (5): (א) בלי atoms ⇒ ביט-זהה לתצלום · (ב) עם atoms ⇒ ["atoms","plug","goal"], ברירת-מחדל plug, תוכן הלשוניות
  הקיימות זהה לתצלום (בניכוי פס-הלשוניות) · (ג) קוד-ייצור לא מייבא fixtures/תצלום · (ד) md5 של החוזה + שורה-חדשה אחת · (ה) אין שכפול-התאמה.
- **שינוי-נעילה מכוון:** `enginebox-guards.test (ג)` — הכניסה עכשיו `<EngineBoxScreen source={source} atoms={null} onClose={props.onClose} />`.

## 6. מה הסשן הסופי צריך לעשות (לחבר מקור אמיתי)
1. לבנות `AtomsSource` אמיתי (מומלץ `components/enginebox/atoms/source.ts` או בכניסה): `engines()`/`atoms()` מ-`lib/atoms/engines` + `cards.ts`;
   `capabilities()` — היכן שהן נשמרות (למשל `db.ui.atomCaps`, עם ריפוי-צורה ב-persist כמו `engineLinks`); `create`/`remove` דרך פעולת-store
   עם הרשאה (`canEditEngineLinks`) ושורת-לוג; `preview(c)` = הפלט האמיתי על נתוני-הארגון (`nowMs` מהכניסה, טהור); `chains(id)`.
2. ב-`EngineBoxEntry.tsx`: להחליף `atoms={null}` ב-`atoms={atomsSource}` (useMemo על אותם תלויים) **ולעדכן את `enginebox-guards.test (ג)`**.
3. להחליט על **ברירת-המחדל** של הלשונית (היום `'plug'`): אם `'atoms'` — לשנות את `useState<BoxTab>(props.initial?.tab ?? 'plug')`
   ולעדכן את `e2e/enginebox-smoke.mjs` (לחיצה על `[data-tab="plug"]` לפני צעד 1) ואת `atoms-ratchet (ב)`.
4. להרחיב את המסע בדפדפן: לשונית 🧬 ⇒ מנוע ההזמנות ⇒ ✂️ ⇒ "מה לחלק?" ⇒ שעות-הפתיחה ⇒ "חבר" ⇒ "✨ נוצר מנוע חדש: מנוע תורים" + צילומים.
5. אם `NAME_RULES` צריך להתבסס על מזהי-המקומות האמיתיים — להחליף את מילות-המפתח (נבדק ב-`atoms-screen.test`).
6. לעדכן את CLAUDE.md (שורת ארגז-המנועים) — מחוץ לבעלות של הסשן הזה.

**בקשות-שינוי לחוזה:** אין. (הערה בלבד: `AtomChain.atoms` הוא `[string, string]` ולא `[AtomId, AtomId]` — המסך מטפל במזהה לא-ידוע ב-🧩.)

## 7. שערים
- `npm run verify:fast` ✅ — 444 קבצים / 3822 בדיקות.
- `npm run verify` ✅ — build + bundle-budget (הבנדל-הראשי 88% מהתקרה; המסך חי ב-chunk העצל של הארגז).
- `npm run e2e` (toggle-matrix) ✅ — "המטריצה כולה ירוקה".
- `node e2e/enginebox-smoke.mjs` ✅ — **54/54**, אפס שגיאות קונסולה (הצילומים 01–14 של 13.10 לא הוקלטו מחדש — הוחזרו לגרסה המחויבת).

## 8. צילומים (`knowledge/shots/atoms-screen-2026-10-14/`, 390px, מנתוני-הדוגמה של הבדיקות — המסך עצמו בפרודקשן מציג עדיין מצב-ריק)
`01-engines-decomposition` · `02-host-atoms-chains` · `03-one-question` ("מה לחלק?") · `04-details` · `05-new-engine` ("✨ נוצר מנוע חדש: מנוע תורים").
אין גלילה אופקית באף אחד. שורות-התצוגה עטופות ב-`<bdi>` (טווחי-שעות "08:00–10:00" לא מתהפכים ב-RTL).
