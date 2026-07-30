# 🪙 פקודת בנייה — עמודת "קופות צדקה" (מודול tzedaka)

**מאת:** הארכיטקט · 30.7.2026 · **ענף:** `claude/what-do-you-see-bcxttj`
**כללי עבודה:** שערים מדורגים (verify:fast בכל commit — אוטומטי ב-pre-commit; build ב-push; סוויטות דפדפן בסוף), כל מחרוזת UI דרך termOf, כל יכולת מאחורי דגל, ratchet לכל כלל, commit לכל אשכול בקידומת `קופות N ·`.

## הכרעות הבעלים (30.7.2026 — מחייבות, אין לסטות)
1. **אין גישת רכזים למערכת** — ניהול משרדי בלבד. אפס עבודת הרשאות/roles.
2. בעמודה: **כרטיסי רכזים בדפוס כרטיסי מורים**, והקופות **מקוננות בכרטיס הפנימי של הרכז בדפוס החוגים**.
3. בעמודה: **מסך בית** (טיפול משרדי), **לוח שנה ייעודי**, **מסך ראווה** — הכול בתוך העמודה.
4. **בידוד מלא "כרגע":** הכסף נרשם רק בעמודה הזאת — לא מזין תרומות/קבלות/דוחות; אירועי הלוח הייעודי **לא** מופיעים בלוח הראשי ולא בשום מסך אחר. "אחר כך נעדכן" ⇒ הארכיטקטורה משאירה דלת לחיבור עתידי, אבל היום — כלום לא זולג החוצה.
5. **ניקוד גיימיפיקציה** לרכזים — כלול.
6. **הוספת לא-רשומים מתוך העמודה:** ילד/הורה חדש למשפחה רשומה, או משפחה חדשה לגמרי, מסווגת תורמת/נתמכת. משפחה/בן-משפחה שנוצרים כך הם רשומות CRM אמיתיות (`upsertFamily`/`upsertMember` הקיימים) — זו תשתית משותפת, לא זליגת נתוני-מודול; כל נתוני המודול עצמם (קופות, כסף, אירועים, ניקוד) נשארים במודול בלבד.

---

## אשכול 1 · שכבת נתונים (`קופות 1 ·`)

**קבצים:** `src/types/domain.ts` · `src/store/persist.ts` · `src/lib/cloud-diff.ts` · `src/lib/cloud-merge.ts`.

1. ב-`types/domain.ts` — עדכן את הערת הקידומות (שורה 6): הוסף `tzc/tzb/tzp/tze/tzl`. הוסף לפני `interface Db` את הבלוק (מילה-במילה):

```ts
/* ---------- קופות צדקה (מודול tzedaka — מבודד; BUILD-ORDER-TZEDAKA-2026-07-30) ---------- */

/** רישום שינוי ניקוד של רכז/ת (גיימיפיקציה) — דפוס CredLogEntry. */
export interface TzScoreEntry {
  date: IsoDate;
  delta: number;
  reason: string;
}

/** רכז/ת קופות — ילד/ה או הורה. קישור לבן-משפחה קיים = רשות. */
export interface TzCoordinator {
  id: Id;
  name: string;
  famId: Id | '';
  memberId: Id | '';
  phone: string;
  notes: string;
  active: boolean;
  startDate: IsoDate | '';
  /** ניקוד גיימיפיקציה — מתחיל 0, רק המודול כותב אליו. */
  score: number;
  scoreLog: TzScoreEntry[];
}

/** ריקון קופה — הכסף נרשם כאן בלבד (מבודד מקבלות/תרומות/דוחות — הכרעת בעלים 30.7). */
export interface TzCollection {
  id: Id;
  date: IsoDate;
  /** ₪ שלמים, כמו בכל המערכת. */
  amount: number;
  campaignId: Id | '';
  note: string;
}

/** home=אצל משפחה · office=במשרד · lost=אבדה · retired=הוצאה משימוש. */
export type TzBoxStatus = 'home' | 'office' | 'lost' | 'retired';

export interface TzBox {
  id: Id;
  /** המספר הפיזי המודבק על הקופה. */
  num: string;
  coordinatorId: Id;
  /** המשפחה המחזיקה (רשות — קופה יכולה לשבת במשרד). */
  famId: Id | '';
  holderKind: 'donor' | 'supported' | '';
  since: IsoDate | '';
  status: TzBoxStatus;
  notes: string;
  collections: TzCollection[];
}

export interface TzCampaign {
  id: Id;
  name: string;
  start: IsoDate;
  end: IsoDate | '';
  /** יעד בש"ח — 0 = אין יעד. */
  goal: number;
  active: boolean;
  notes: string;
}

/** אירוע הלוח הייעודי — לא נשמר ב-db.events ולא מופיע בלוח הראשי (בידוד). */
export interface TzEvent {
  id: Id;
  title: string;
  date: IsoDate;
  time: TimeHM | '';
  /** round=סבב ריקון · campaign=מבצע · reminder=תזכורת · custom=אחר. */
  kind: 'round' | 'campaign' | 'reminder' | 'custom';
  coordinatorId: Id | '';
  boxId: Id | '';
  notes: string;
  done: boolean;
}
```

2. ב-`interface Db` (אחרי `supporters`): `tzCoordinators: TzCoordinator[]; tzBoxes: TzBox[]; tzCampaigns: TzCampaign[]; tzEvents: TzEvent[];` + אתחול `[]` לארבעתם ב-`emptyDb()`. עדכן את הערת "7 מערכי ישויות" ל-11 היכן שמופיעה (domain.ts אם יש, CLAUDE.md בסגירה).
3. **`DB_VERSION` נשאר 5** — תוספת אדיטיבית: `migrate()` פורש `emptyDb()` כבסיס, מפתח חסר = ברירת מחדל. אין bump.
4. ב-`persist.ts migrate()` — אחרי בלוק ה-supporters (~שורה 202) הוסף נרמול:
   - ארבעת המערכים: `Array.isArray(db.X) ? … : []`.
   - פר-רכז: `score` לא-מספר/לא-סופי → 0; `scoreLog` לא-מערך → `[]`.
   - פר-קופה: `collections` לא-מערך → `[]`; `status` לא מארבעת הערכים → `'office'`.
5. `cloud-diff.ts` (שורות 12-18) — הוסף לרשימת ה-COLLECTIONS: `'tzCoordinators', 'tzBoxes', 'tzCampaigns', 'tzEvents'`.
6. `cloud-merge.ts` (~שורה 19) — הוסף ל-NESTED_ARRAYS: `tzBoxes: ['collections'], tzCoordinators: ['scoreLog']`.
7. **בדיקות** (`src/store/__tests__` או קובץ קיים במוסכמה): (א) גיבוי ישן בלי מערכי tz → migrate מחזיר `[]` לארבעתם; (ב) רכז עם score מושחת/scoreLog חסר → נרפא; (ג) קופה בלי collections/סטטוס זר → נרפאת; (ד) cloud-diff מזהה set/delete ב-tzBoxes; (ה) applyEntityPartial על tzBoxes בלי collections → מערך ריק (הגנת NESTED_ARRAYS).

## אשכול 2 · שלד המודול — ניווט, דגלים, מונחים (`קופות 2 ·`)

**קבצים:** `src/types/config.ts` · `src/lib/config.ts` · `src/types/features.ts` · `src/store/useApp.ts` · `src/App.tsx` · `src/components/builder/sections.ts` · `src/components/tzedaka/TzedakaView.tsx` (חדש).

8. `types/config.ts:14` — `ModuleKey` מקבל `| 'tzedaka'`.
9. `lib/config.ts:19` — הוסף `'tzedaka'` ל-`NAV_MODULE_KEYS` (שרשור כיבוי-מודול→דגלים אוטומטי). עדכן את ההערה "ששת" → "שבעת".
10. `types/features.ts` — ב-union של `FeatureDef.module` הוסף `| 'tzedaka'`, והוסף ל-FEATURES (עברית בנוסח הקיים):

```ts
  // ——— קופות צדקה ———
  { key: 'tzedaka.campaigns', label: 'מבצעי התרמה', desc: 'ניהול מבצעים עם יעד ושיוך ריקונים למבצע', module: 'tzedaka' },
  { key: 'tzedaka.score', label: 'ניקוד רכזים', desc: 'ניקוד גיימיפיקציה אוטומטי על ריקונים + לוח מובילים', module: 'tzedaka' },
  { key: 'tzedaka.showcase', label: 'מסך ראווה', desc: 'תצוגת ראווה של המבצע והרכזים המובילים למסך גדול', module: 'tzedaka' },
  { key: 'tzedaka.calendar', label: 'לוח ייעודי', desc: 'לוח שנה פנימי לסבבי ריקון, מבצעים ותזכורות (מבודד מהלוח הראשי)', module: 'tzedaka' },
  { key: 'tzedaka.inlinecreate', label: 'הוספת לא-רשומים', desc: 'יצירת משפחה חדשה או ילד/הורה חדש ישירות מתוך העמודה', module: 'tzedaka' },
```

11. מונחי termOf חדשים (fallback בקוד, אין קובץ מילון נפרד): `nav.tzedaka`='קופות צדקה' · `entity.tzCoordinator`='רכז' · `entity.tzBox`='קופה' · `entity.tzCampaign`='מבצע'.
12. `useApp.ts:53` — `View` מקבל `| 'tzedaka'`.
13. `App.tsx` — ל-NAV (אחרי supporters): `{ view: 'tzedaka', icon: '🪙', label: 'קופות צדקה' }`; ל-VIEWS: `tzedaka: TzedakaView`; עדכן את הערת "ששת מסכי המודולים" ב-labelOf. הסינון/termOf עובדים לבד (הדפוס הקיים).
14. `builder/sections.ts` — הוסף section: `{ id: 'tzedaka', title: 'קופות צדקה', emoji: '🪙', module: 'tzedaka', termKeys: ['nav.tzedaka', 'entity.tzCoordinator', 'entity.tzBox', 'entity.tzCampaign'] }`; ודא ש-`featureModuleKey` (שורה 67) ממפה `'tzedaka'` ל-ModuleKey.
15. `TzedakaView.tsx` שלד: 4 טאבים פנימיים — `🏠 טיפול` · `🧑‍🤝‍🧑 רכזים` (ברירת מחדל) · `📅 לוח` (מאחורי tzedaka.calendar) · `🏆 ראווה` (מאחורי tzedaka.showcase). מצב נבחר-רכז ב-useState מקומי (לא ב-store — בידוד, אין ניווט חוצה-מסכים).
16. **בדיקות:** (א) ratchet חוזה-דגלים: `modules.tzedaka=false` ⇒ `featureOn(cfg,'tzedaka.score')===false` (שרשור); (ב) הגנת-מקור (`?raw`) על App.tsx: NAV מכיל `'tzedaka'` ו-VIEWS ממפה אותו.

## אשכול 3 · מנוע טהור + פעולות store (`קופות 3 ·`)

**קבצים:** `src/components/tzedaka/lib.ts` (חדש, טהור — בלי store/DOM) · `src/store/useApp.ts`.

17. `lib.ts` — פונקציות (חתימות מחייבות):
    - `TZ_SCORE_RULES = { emptyPts: 10, ilsPerPoint: 50, streakDays: 60, streakPts: 5 } as const` — ריקון ‎+10; ‏+1 לכל 50₪ שלמים; בונוס רצף ‎+5 אם הריקון בתוך 60 יום מהריקון הקודם באותה קופה. ברירות-מחדל של הארכיטקט — הבעלים רשאי לכוון (קבוע אחד, מקום אחד).
    - `collectionScoreDelta(box: TzBox, date: IsoDate, amount: number, rules = TZ_SCORE_RULES): number`
    - `boxTotal(box)` · `coordinatorBoxes(boxes, coordId)` · `coordinatorTotal(boxes, coordId)` · `grandTotal(boxes)` · `campaignTotal(boxes, campaignId)`
    - `lastCollectionIso(box): IsoDate | ''`
    - `TZ_STALE_DAYS = 90` + `staleBoxes(boxes, todayIso, days = TZ_STALE_DAYS)` — קופות בסטטוס home שלא רוקנו ≥N יום (או מעולם, לפי since)
    - `needsCare(db, todayIso)` — מערך ממוין: קופות ישנות · קופות lost · רכזים לא-פעילים שעדיין מחזיקים קופות home · מבצע פעיל שמסתיים בתוך ≤14 יום. כל פריט `{ kind, id, label, hint }`.
    - `leaderboard(coordinators, boxes)` — פעילים, ממוין score יורד ואז סכום יורד; מחזיר `{ coordinator, total, boxCount }[]`
    - `campaignProgress(campaign, boxes): { sum, goal, pct }` (‏pct קטום ל-100; goal=0 ⇒ pct=0)
    - לוח: `buildTzGrid(tzEvents, anchorIso, hebMode: boolean)` — גריד חודשי לועזי/עברי. **Reuse טהור מ-`../calendar/calLib`:** `isoOf`, `hpOf`, `DAY_NAMES`, `FULL_HOLIDAYS` (ייבוא lib→lib מותר; אין תלות ב-db.events!). תאים עם האירועים הייעודיים בלבד.
    - תאריכים: `isoToday`/פרסור `T12:00:00` מ-date-util — לא `toISOString`.
18. פעולות store (הדפוסים הקיימים — `setDb` + `nextId`; קידומות: רכז `tzc`, קופה `tzb`, מבצע `tzp`, אירוע `tze`, ריקון `tzl`):
    - `upsertTzCoordinator(c)` · `upsertTzBox(b)` · `upsertTzCampaign(c)` · `upsertTzEvent(e)` — upsert לפי id, id ריק ⇒ nextId.
    - `deleteTzCoordinator(id): boolean` — **חסום** אם יש לו קופות בסטטוס home/office (טוסט "יש להעביר קודם את הקופות"); מוחק גם את אירועי-הלוח המקושרים (`coordinatorId`) — דפוס unlinkEvent, בלי יתומים.
    - `deleteTzBox(id)` — מוחק + מנקה אירועים מקושרים (`boxId`). אישור בשכבת UI עם `useArmed`.
    - `deleteTzCampaign(id)` — ריקונים משויכים מקבלים `campaignId:''` (אין אובדן כסף).
    - `deleteTzEvent(id)`.
    - `addTzCollection(boxId, { date, amount, campaignId, note }): { ok: boolean; delta: number }` — דוחה amount לא-חיובי/לא-סופי (`{ok:false}` + טוסט, בלי לגעת ב-db — לקח באג-5); מוסיף ריקון; אם `featureOn('tzedaka.score')` — מחשב delta ב-collectionScoreDelta, מעדכן score+scoreLog של הרכז (reason: `ריקון קופה <num>`); טוסט כולל `‎+N נק׳` כשיש ניקוד. **לא נוגע ב-receiptSeq/donationSeq/supporters/enrollments — בידוד.**
    - `addTzScore(coordinatorId, delta, reason)` — כוונון ידני, reason חובה.
19. **בדיקות** (`src/components/tzedaka/__tests__/tz-lib.test.ts` + בדיקת store במוסכמה הקיימת):
    - ניקוד: ריקון ראשון 120₪ ⇒ ‎10+2=12; ריקון שני בתוך 60 יום ⇒ ‎+5 רצף; אחרי 61 יום ⇒ בלי רצף; ‏49₪ ⇒ ‎+10 בלבד.
    - staleBoxes/needsCare/leaderboard/campaignProgress — מקרה לכל כלל (כולל goal=0).
    - buildTzGrid: אירוע ב-15 לחודש מופיע בתא הנכון בשני המצבים.
    - **ratchet בידוד (מתועד "הכרעת בעלים 30.7.2026"):** ‏(א) `addTzCollection` לא משנה `donationSeq`/`receiptSeq` ולא מוסיף Donation/Payment; (ב) `dayItems()` של הלוח הראשי על db עם tzEvents באותו תאריך — לא מחזיר אותם.
    - deleteTzCoordinator חסום עם קופות home; מוחק אירועים מקושרים כשמותר.

## אשכול 4 · רכזים + קופות — הכרטיסים (`קופות 4 ·`)

**קבצים חדשים ב-`src/components/tzedaka/`:** `CoordinatorsTab.tsx` · `CoordinatorCard.tsx` · `CoordinatorForm.tsx` · `BoxForm.tsx` · `CollectModal.tsx`.

20. **CoordinatorsTab** — גריד כרטיסים (דפוס TeachersSection): שם, טלפון, צ'יפ פעיל/לא, `🏆 N נק׳` (מאחורי tzedaka.score), `N קופות · X ₪`. כפתור `➕ הוספת <termOf entity.tzCoordinator>` (מוסכמת ה-e2e!). לחיצה על כרטיס ⇒ CoordinatorCard.
21. **CoordinatorCard** (הכרטיס הפנימי, דפוס CourseDetail): פרטי הרכז + קישור לבן-המשפחה (שם בלבד, לא ניווט — בידוד) + ניקוד והיסטוריית scoreLog (מאחורי tzedaka.score, עם כפתור "± כוונון" ל-addTzScore) + **הקופות מקוננות**: שורה לכל קופה — `num`, משפחה מחזיקה + סיווג (🤲 נתמכת / 💛 תורמת), סטטוס, ריקון אחרון, סה"כ שנאסף; פעולות פר-קופה: `💰 ריקון` (CollectModal) · `✏️` (BoxForm) · `⤵ החזרה למשרד` (status→office, מנקה famId? לא — משאיר היסטוריה, רק status) · `⚠ אבדה` (status→lost) · מחיקה ב-useArmed. כפתור `➕ הוספת <termOf entity.tzBox>`.
22. **CoordinatorForm** (מודאל, רכיבי Field/Modal מ-ui.tsx): שם (חובה), טלפון, פעיל, startDate, הערות, וקישור רשות: בחר משפחה (datalist מ-db.families) → בחר בן-משפחה. מאחורי `tzedaka.inlinecreate`: `➕ משפחה חדשה` (שם, טלפון, סיווג תורמת/נתמכת ⇒ `upsertFamily` רגיל) ו-`➕ ילד/הורה חדש` למשפחה שנבחרה (שם, מגדר, isParent ⇒ `upsertMember`) — נוצרים כרשומות CRM אמיתיות ומקושרים מיד (דפוס `courses.enroll.inlinecreate`).
23. **BoxForm**: מספר קופה (חובה, ייחודי — אזהרה רכה על כפילות), משפחה מחזיקה (בחירה או inline-create כמו בסעיף 22), holderKind, since (ברירת isoToday), סטטוס (ברירת home), הערות.
24. **CollectModal**: תאריך (ברירת isoToday), סכום (חובה), מבצע (select המבצעים הפעילים — מאחורי tzedaka.campaigns), הערה. שמירה ⇒ `addTzCollection`; טוסט: `נרשם ריקון X ₪` + `‏· +N נק׳` כשרלוונטי. ההיסטוריה מוצגת בתוך שורת הקופה (הרחבה/קיפול).
25. **בדיקות:** הגנת-מקור — CoordinatorsTab מכיל `➕ הוספת` + termOf; CollectModal לא מייבא כלום מ-supporters/דפוס קבלות (regex על הקובץ — ratchet בידוד).

## אשכול 5 · מסך הבית — טיפול משרדי (`קופות 5 ·`)

**קובץ חדש:** `HomeTab.tsx`.

26. שורת מדדים (צ'יפים): קופות אצל משפחות / במשרד / אבדו · רכזים פעילים · נאסף סה"כ · נאסף במבצע הפעיל (מאחורי tzedaka.campaigns).
27. רשימת "דורש טיפול" מ-`needsCare()` — כל שורה עם כפתור פעולה (קופה ישנה ⇒ פותח CollectModal; רכז לא-פעיל ⇒ פותח את הכרטיס; מבצע מסתיים ⇒ פותח עריכת מבצע).
28. ניהול מבצעים (מאחורי tzedaka.campaigns): רשימה + `➕ הוספת <termOf entity.tzCampaign>` (שם, start, end, goal, פעיל) + פס התקדמות מ-`campaignProgress` + סגירת מבצע (active=false).
29. קיצורי פעולה: `➕ רכז` · `➕ קופה` · `💰 ריקון מהיר` (בחירת קופה ⇒ CollectModal).

## אשכול 6 · הלוח הייעודי (`קופות 6 ·`)

**קובץ חדש:** `CalendarTab.tsx` (+ `TzEventModal.tsx`).

30. גריד חודשי מ-`buildTzGrid` — נפתח **בעברי** (כמו הלגאסי), מתג עברי/לועזי, ניווט חודשים + "היום". צבעי kind: round=`#fdf1d4/#9a6414` (כמו SESSION_META), reminder/campaign/custom לפי PRIORITY_COLOR הקיימים — ייבוא הקבועים מ-calLib, לא שכפול.
31. לחיצה על יום ⇒ רשימת האירועים + `➕ הוספת אירוע`; TzEventModal: כותרת (חובה), תאריך (HebDateInput), שעה, kind, קישור-רשות לרכז/קופה, הערות, ✓בוצע. מחיקה ב-useArmed.
32. **בידוד:** הקומפוננטה קוראת `db.tzEvents` בלבד; שום כתיבה ל-`db.events`. (ה-ratchet מאשכול 3 מכסה; הוסף הגנת-מקור: `CalendarTab.tsx` לא מכיל `upsertEvent`).

## אשכול 7 · מסך הראווה (`קופות 7 ·`)

**קובץ חדש:** `ShowcaseTab.tsx` — מאחורי `tzedaka.showcase`.

33. תוכן (בטאב): כותרת המבצע הפעיל + טבעת התקדמות (דפוס RING_R/RING_C מ-ImpactWall) · סה"כ שנאסף (fmtIls מ-wallData — ייבוא, לא שכפול) · לוח מובילים מ-`leaderboard()` עם 🥇🥈🥉 לשלושת הראשונים (דפוס MEDALS) · מונה קופות פעילות.
34. כפתור `🖥 מסך מלא` ⇒ overlay ‏fixed inset-0 בדפוס ImpactWall (עיצוב dark-luxe ב-`<style>` פנימי בהיקף `.tz-wall`, שעון חי 30ש׳, יציאה ב-Escape/✕, הסתרת סמן). **בלי hash חדש** — נפתח מתוך הטאב בלבד (בידוד מהצוהר הראשי).

## אשכול 8 · סגירה (`קופות 8 ·`)

35. **e2e:** ‏`e2e/toggle-matrix.mjs` — הוסף `tzedaka: false` לשני מערכי הכל-כבוי (שורות ~49 ו-~225) + assert שהקישור "קופות צדקה" נעדר בפרופיל הכבוי וקיים בברירת המחדל; בפרופיל ברירת-המחדל: פתיחת העמודה + הוספת רכז + הוספת קופה + ריקון 100₪ + הופעת הסכום. הרץ את שלוש הסוויטות (build קודם).
36. **ידע:** דוח `knowledge/CLOSED-TZEDAKA-2026-07-30.md` (מה נבנה, סטיות, ספירת בדיקות); עדכון `CLAUDE.md`: ‏101→106 דגלים, 33→37 מונחים, "7 מערכי ישויות"→11, והוספת שורת המודול. עדכון `gaps.json` לא נדרש (זה פיצ'ר חדש, לא פער לגאסי).
37. **DoD:** ‏verify מלא ירוק · שלוש סוויטות ירוקות · כל ההכרעות 1-6 ממומשות · אפס נגיעה בהתנהגות מסכים קיימים כשהמודול כבוי **וגם כשדלוק** (הבידוד) · דוח מסירה עם טבלת פריט-מול-סטטוס.

---

## גבולות קשיחים (חריגה = עצירה ודיווח, לא אלתור)
- אין כתיבה ל-`db.events`, `supporters`, `enrollments`, `receiptSeq`, `donationSeq` משום מקום במודול (חריג יחיד: `upsertFamily`/`upsertMember` בהוספת לא-רשומים — הכרעה 6).
- אין נגיעה בפלטת הפקודות, בדוחות, בלוח הראשי ובמסך הבית הראשי — שום משטח חדש מחוץ לעמודה.
- החלטות מוצר חדשות שצצות תוך כדי — לרשום כשאלה בדוח המסירה, לא להכריע.
