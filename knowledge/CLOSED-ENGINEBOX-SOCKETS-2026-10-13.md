# 🔌 שקעים חדשים לארגז-המנועים — הלוח העברי של אורביט (ENGINEBOX-SOCKETS, 13.10.2026)

**ענף:** `claude/enginebox-sockets-261013` (מ-`claude/community-os-261013` ‏@7073c4b). לא מוזג.
**חזון-הבעלים:** "יש ארגז עם מנועים עם חיבור זכר ונקבה. הלקוח בוחר מנוע, ואז המערכת אומרת: אתה יכול לחבר את המנוע פה
ופה ושם, והתוצאה תהיה זה וזה וזה."
**המשימה כאן:** להוסיף לארגז חיבורים **אמיתיים** חדשים מעבר ל-8 של סיפור משפחת לוי — כולל מנוע מ**ליבת-אורביט** (הלוח
העברי). כל צרכן **כבוי כברירת-מחדל** (prop/אופציה `false`) — הלקוח-החי, הדמו וכל ארגון ביט-זהים. המשלב יחווט את המתגים
מתוך כרטיסי-הארגז.

---

## 1. טבלת-הכרטיסים (למשלב — שורה = כרטיס)

| # | הנותן (חלק · יכולת) | תקע מוצע | הצרכן — קובץ · סמן ייחודי בקובץ | המתג (ברירה `false`) | התוצאה, כפי שהמשתמש חווה |
|---|---|---|---|---|---|
| 1 | 📅 הלוח העברי (מודול `calendar`, ליבה) · `calendar.dayInfo` | `times.blocked` | `src/components/hosting/BookingModal.tsx` · `props.shabbatGuard === true && nights > 0 ? <ShabbatGuard` | `<BookingDialog … shabbatGuard />` (מרונדר ב-`HostingView.tsx`: `return <BookingDialog key={key} id={x.id} pre={x.pre} />;`) | כשקובעים הזמנה שהכניסה או היציאה שלה נופלת בשבת או בחג — מופיעה אזהרה ברורה עם התאריך העברי: "⚠ הכניסה נופלת בשבת · ו׳ חשוון". |
| 2 | 📅 הלוח העברי · `calendar.dayInfo` | `date.hebrew` | `src/components/hosting/BookingsTab.tsx` · `{props.hebDates === true && <StayHebDates b={b} />}` | `<BookingsTab hebDates />` (מרונדר ב-`HostingView.tsx`: `body = <BookingsTab />;`) | ליד התאריכים של כל שהייה רואים גם את התאריך העברי: "16/10 – 18/10 · ה׳–ז׳ חשוון". |
| 3 | 📅 הלוח העברי · `calendar.dayInfo` | `date.hebrew` | `src/components/parnasa/phoneLine.ts` · `input.hebDateGreeting === true ? hebTodaySentence(` | `buildPhoneMenu({ …, hebDateGreeting: true })` ב-`src/components/parnasa/PhoneTab.tsx` **וגם** `'calendar.dayInfo'` ב-`LINE_ABILITIES` של אותו קובץ (רשימת-הטעינה של הלשונית) | מי שמתקשר לקו שומע בברכה גם את התאריך העברי ואת החג: "היום כ״ז כסלו, חנוכה." (אחרי השקיעה: "הלילה ה׳ חשוון."). |

**תנאי-הארגז לכל שורה:** הנותן — מודול `calendar` (דלוק כברירת-מחדל בכל ארגון; `modules.calendar=false` או
`features.calendar=false` ⇒ היכולת `off` והצרכן נשאר כמו היום). הצרכן — שורות 1–2: מודול `hosting` דלוק; שורה 3: מודול
`parnasa` דלוק (מסך הקו). כשהנותן לא זמין, הצרכן **לא מאבד דבר**: שורה 1 נופלת לאזהרה המקומית הקיימת ("🕯️ צ׳ק-אין בשבת"),
שורות 2–3 פשוט לא מוסיפות.

### המנוע עצמו — `calendar.dayInfo` (כרטיס-מנוע)

| שדה | ערך |
|---|---|
| ספק | `src/components/calendar/abilities.ts` (נטען דרך `CalendarView.tsx`: `export * as calendarProvider from './abilities';`) |
| שורת-רישום | `src/lib/switchboard/registry.ts` — `module: 'calendar'`, `reads: []`, תווית "יום בלוח העברי", **`quiet: true`** |
| קלט | `{ iso?: 'YYYY-MM-DD' }` — חסר ⇒ היום בשעון-ישראל (`ctx.nowMs`) |
| פלט | `iso · valid · hebDate ("ה׳ חשוון תשפ״ז") · hebDayMonth ("ה׳ חשוון") · hebDay · hebMonth ("אדר א׳") · hebYear · holiday (או null) · dayName · isShabbat · isYomTov · closed` |
| תקעים שהוא מספק | `date.hebrew` (התאריך העברי) · `times.blocked` (שבת/יו״ט — "סגור") |

---

## 2. מה נבנה

- **מנוע** `calendar.dayInfo` — טהור מעל המנוע הקיים בלבד (`lib/hebrew` hebParts/holidayOf/gem · `lib/hebdate` monthHeOf ·
  `calLib.FULL_HOLIDAYS`); אפס חשבון-תאריכים חדש. תאריך פגום (לא-מחרוזת, `2026-02-31`, טקסט) ⇒ `valid:false` — לעולם לא זורק.
- **שקע 1 · `ShabbatGuard`** (`hosting/SwitchPanels.tsx`) + עזר טהור `sacredGuardLines` (`hosting/switchLinks.ts`).
  כשהלוח זמין — מחליף את האזהרה המקומית בגרסה עם התאריך העברי (וגם עזיבה ביו״ט: "⚠ העזיבה נופלת ביום טוב · יום כיפור ·
  י׳ תשרי"); כשלא — מרנדר את האזהרה המקומית כמות-שהיא (`fallback`).
- **שקע 2 · `StayHebDates`** + עזר `hebRangeText`: אותו חודש "ה׳–ז׳ חשוון" · חודשים "כ״ט תשרי – ב׳ חשוון" · שנים
  "כ״ח אלול תשפ״ו – ב׳ תשרי תשפ״ז" · שנה מעוברת "כ״ח אדר א׳ – א׳ אדר ב׳".
- **שקע 3 · `hebDateGreeting`** + עזר `hebTodaySentence` (מיוצא): משפט אחד בסוף ברכת התפריט הראשי. היום-העברי מתחלף
  **בשקיעה** לפי שעון-הקו (`hebDateAt` של זמני-הקהילה): אחרי השקיעה נשאל הלוח על מחר האזרחי ונאמר "הלילה …". בשבת/יו״ט
  השורש נשאר הודעת-הסגירה — היא לא זזה.

## 3. הכרעות (כל אחת — השארת ההתנהגות הקיימת זהה)

1. **`quiet` — שירות-רקע שקט.** הלוח הוא מודול-ליבה דלוק-כברירת-מחדל; בלי הסימון כל ארגון-אירוח-בלבד היה "מגלה כלי נוסף"
   (`hasOtherTool`) ומקבל פתאום את כרטיס "☀ תקציר היום". `AbilityMeta.quiet?` + `AbilityInfo.quiet` (תוספת), `hasOtherTool`
   מדלג על שקטים, ו-`voiceIds(config)` (חדש ב-summary) = רשימת-הטעינה של כרטיסי-התקציר (שלא ייטען מסך-הלוח לחינם).
2. **`useSwitchCtx` טוען לפי `idsKey`** (לא `keys.length`): ספק בלי `reads` (הלוח לא קורא מה-db) חייב להיטען. `loadProviders`
   מסנן לזמינות בעצמו ⇒ ids שאף אחת מהן לא זמינה = אפס טעינה, בדיוק כמו קודם.
3. **מנהג ארץ-ישראל** — יו״ט אחד (כמו כל לוח-אורביט); חול-המועד, צומות וט׳ באב אינם יו״ט (כמו `hosting.sacredDayOf`).
4. **`dayInfo` אזרחי** (חצות-לחצות, כמו כל המערכת); השקיעה — אחריות הצרכן שיודע מיקום (הקו).
5. **משקל-הפעלה:** הספק מייבא מהחוזה **טיפוסים בלבד** — ייבוא-ריצה פיצל את `contract` ל-chunk נפרד (+65B gzip בבנדל-הראשי,
   58⇒59 קבצים). אחרי התיקון: 58 קבצים, אותה רשימת-ייצוא של הבנדל-הראשי, הפרש-גולמי 6B (ערבוב שמות-מקוצרים), תקציב 88%.
6. **שקע 3 דורש שני מתגים** (האופציה + `LINE_ABILITIES`): הוספת היכולת לרשימת-הטעינה כבר היום הייתה טוענת את מסך-הלוח בכל
   פתיחת לשונית-הקו ("שוקל רק מה שהדלקת"). ה-ratchet של כיסוי-הטעינה מחריג אותה במפורש כ"מאחורי אופציה כבויה".

## 4. בדיקות (vitest)

- `src/components/calendar/__tests__/calendar-ability.test.ts` (23) — רישום · quiet (hasOtherTool/voiceIds/תקציר ריק) ·
  מודול-הלוח כבוי ⇒ off · זבל ⇒ valid:false/‏error מטופס · יום-חול/שבת/יוה״כ/סוכות-בשבת/ר״ה ב׳/חוה״מ/שבת-חנוכה/אדר א׳-ב׳/פסח ·
  "היום" בשעון-ישראל = `contract.isoAt` · ייבוא-טיפוסים-בלבד מהחוזה.
- `src/components/hosting/__tests__/hosting-calendar-sockets.test.ts` (12) — העזרים · **כבוי ⇒ גיבוב-HTML זהה לזה שנלקח
  מ-7073c4b באותה רתמה** (מרכז-ההזמנות + שני כרטיסי-הזמנה שנכנסים בשבת) · דלוק-בלי-לוח ⇒ זהה · דלוק ⇒ שבת/יוה״כ/יום-חול/טווח.
- `src/components/parnasa/__tests__/phoneLine-hebdate.test.ts` (18) — 7 רגעים × כבוי⇒JSON-זהה · דלוק⇒משפט-אחד-בסוף בלבד ·
  אחרי-שקיעה · שבת/יוה״כ (השורש סגור) · חנוכה · אדר א׳/ב׳.
- עודכנו (הרחבה, לא הקלטה-מחדש): `switchboard-registry.test` (שורת-רישום שלישית, glob 3 ספקים, reads ריק ⇒ אפס db,
  ייצוא-מסך שלישי) · `switchboard-ui.test` (CAL_IDS, שקע-הקו, שער-הטעינה החדש).
- **זהב-המסכים (`ui-golden`) וזהב-הקו (`phoneLine-golden`) — ירוקים בלי הקלטה-מחדש.**

## 5. קבצים משותפים שנגעתי בהם (שינוי מינימלי)

- `src/lib/switchboard/registry.ts` — שורת-רישום + `quiet` אופציונלי ב-AbilityMeta/AbilityInfo.
- `src/lib/switchboard/summary.ts` — `hasOtherTool` מדלג על quiet; `voiceIds` חדש.
- `src/components/switchboard/useSwitchCtx.ts` — שער-הטעינה (`idsKey`).
- `src/components/parnasa/TodayCard.tsx` — `voiceIds(config)` במקום `listAbilities(...).map(id)` (שורה אחת + import).
- `src/components/calendar/CalendarView.tsx` — שורת-ייצוא אחת.
- **לא נגעתי:** enginebox/engineroute, store, domain/features, Rules/Functions, כסף/קבלות/לוח-ראשי/חדרים.
