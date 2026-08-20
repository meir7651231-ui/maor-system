# דוח סגירה · מסכי-הדור-הבא לתורמים — 20.8.2026

> שכבת-מנועים טהורה + 3 מסכים חדשים, כולם מוזגו ל-main בשער-CI מלא.
> **אפס אובדן · אפס שינוי-סכמה · כל מסך opt-in מפורש ⇒ אפס-השפעה על הלקוח-החי.**
> הכל scale-ready: בדיקות-ביצועים על 30k–50k תרומות. הבסיס: אינוונטר-המקור
> `knowledge/INVENTORY-SUPPORTERS-2026-08-19.md` + דוח-הקוקפיט `CLOSED-COCKPIT-2026-08-20.md`.

## שכבת-המנועים הטהורה (PR #251)
כל מדדי-תורם מחושבים ב**מעבר-יחיד** (‏`donorScan`) ⇒ O(סה"כ-האירועים). דטרמיניסטי
(יום מוזרק, בלי Date.now).

- **`intel.ts`** — פר-תורם: `donorScan` · `rfmFromScan` (RFM מפורק, ספי-supScore) ·
  `churnFromScan` (0–100) · `forecastFromScan` (תחזית-מתנה: ₪·תאריך·ביטחון) ·
  `trendFromScan` · `donorIntel` (חבילה).
- **`portfolio.ts`** — כלל-התיק: `portfolioIntel` (LTV · שימור-12ח׳ · ₪-בסכנה ·
  ריכוזיות top-N · תחזית-30/90 · פיזור-ציון · tierCounts) · `tierTrendCounts`
  (פרוקסי-מיגרציה, מסומן ככן) · `activeByMonth`.
- **`constellation.ts`** — `donorConstellation`: מיפוי דטרמיניסטי תורם→כוכב
  (זווית=hash-יציב · רדיוס=טריות · גודל=לוג-LTV · דרגה · atRisk).

## שלושת המסכים (כל אחד מגודר opt-in נפרד)

| מסך | קובץ | דגל | תמצית |
|-----|------|-----|--------|
| 📊 מרכז-המודיעין (#252) | `SupportersIntel.tsx` | `supporters.intel` | רצועת-תיק + טבלה-עמוקה (RFM/LTV/תחזית/סיכון) + כרטיס-צלילה (ציר-זמן·RFM·תחזית) |
| 🌌 גלקסיית-התורמים (#253) | `SupportersGalaxy.tsx` | `supporters.galaxy` | canvas חי — כוכב לכל תורם, ריחוף→טוליטיפ · לחיצה→כרטיס; RENDER_CAP=400; מכבד prefers-reduced-motion |
| ✨ ריברנד (#255) | `SupportersKpiStrip.tsx` | `supporters.rebrand` | רצועת-KPI חיה **מעל הטבלה הקיימת** — צ׳יפים=סינון קיים (setTierF/setHokF), אפס כפילות-מצב |

## אינווריאנטים
- **opt-in מפורש לכל דגל** — `config.features['supporters.X'] === true` (במכוון **לא**
  `featureOn` — ברירת-מחדל 'on' היה מדליק לכל לקוח-חי). ננעל ב-ratchets פר-מסך
  (`intel-wiring`/`galaxy-wiring`/`rebrand-wiring`).
- **אפס שינוי-סכמה** — הכל נגזרת של `db.supporters` הקיים.
- **הרשאת-ייעוד** — כל מסך מוזן מ-`visibleSupportersForDesignations`.
- **ביצועים** — כל מדד memoized; מעבר-יחיד; הגלקסיה עם תקרת-רינדור.

## הפעלה (חלון-בעלים)
```json
{ "features": {
  "supporters.cockpit": true,
  "supporters.intel":   true,
  "supporters.galaxy":  true,
  "supporters.rebrand": true
} }
```
⇒ במסך התורמים: מתגים 🎯 חלון-העבודה · 📊 מודיעין · 🌌 גלקסיה, ורצועת-KPI מעל הטבלה.

## מכונת-הזמן (העמקה · PR-הבא)
מנוע `timemachine.ts` טהור — **סימולציית-תיק קדימה** ("אם לא תעשה כלום"). התובנה
שמאפשרת אותו בזול: סיכון-הנטישה תלוי רק ב**ימים-מאז-המתנה-האחרונה** מול קצב-הנתינה,
ולכן הזזת-היום קדימה ב-N ימים = הגדלת daysSince ב-N — בלי סריקה-חוזרת. סורק כל תורם
פעם-אחת ומקרין על כל האופקים ⇒ O(תורמים) (‏perf: 50k תרומות × 6 אופקים < 500ms).
- `churnAtOffset(scan, today, off)` — סיכון-נטישה בעוד off ימים (off=0 ≡ churnFromScan).
- `timeMachine(supporters, today, rate, horizons)` — פר-אופק: atRiskCount/Money ·
  newlyAtRisk (חדשים-בסכנה מול היום) · expectedIncoming (תחזית-מתנה + צבירת-הו״ק) ·
  activeCount. כותרות: `erosionMoney`/`erosionDonors` ("עלות-אי-הפעולה") · `incomingEnd`.
- UI: `TimeBand` במרכז-המודיעין — כותרת-עלות + עקומת-דעיכה-לחיצה + פירוט-אופק-נבחר.
  ננעל ב-ratchet `intel-wiring` (`timeMachine(props.supporters` + `<TimeBand`).

## מפת-העונתיות (העמקה · אותו PR-משפחה)
מנוע `seasonality.ts` טהור — **מתי** נכנס הכסף. אגרגציה פר-חודש-לועזי (1–12)
**חוצת-שנים** על כל אירועי-הנתינה ⇒ חושף מקצב-עונתי (חגי-תשרי · פורים · סוף-שנת-מס)
לתזמון-קמפיין. מעבר-יחיד O(סה"כ-האירועים); perf 50k < 400ms.
- `seasonality(supporters, rate)` — `byMonth[12]` (ils/gifts/donors פר-חודש) ·
  `peakMonth`/`troughMonth` · `peakShare` (ריכוזיות-עונתית).
- `donorRhythm(sp, rate)` — קצב-אישי: `topMonth` · `concentration` · דגל `seasonal`.
- UI: `SeasonBand` במרכז-המודיעין — מפת-חום 12-חודשים, שיא/שפל מודגשים.
  ננעל ב-ratchet `intel-wiring` (`seasonality(props.supporters` + `<SeasonBand`).

## לוח-האותות (העמקה · אותו PR-משפחה)
מנוע `signals.ts` טהור — **מה השתנה** בדפוס-הנתינה (מה ש-RFM הסטטי מפספס). כל אות
נגזר מרצף-הנתינה הממוין של התורם (בלי Date.now). מעבר פר-תורם O(אירועיו).
- `donorSignals(sp, today, rate)` — 0+ אותות: `drop` (מתנה < 50% מהממוצע · ותק ≥3) ·
  `jump` (> פי-2) · `reactivated` (פער ≥ שנה ואז מתנה טרייה) · `firstgift` (יחידה-טרייה) ·
  `lapsing` (ותיק ששקט ≥240 יום). ספים ב-`SIGNAL` (מיוצא לכוונון).
- `portfolioSignals(...)` — `counts` פר-סוג + `movers` (ממויין עוצמה×כסף) + `total`.
- UI: `SignalsBand` במרכז-המודיעין (מעל הטבלה) — צ׳יפי-מונים לחיצים (סינון) +
  רשימת-מזיזים דחופה, קליק→כרטיס. ננעל ב-ratchet `intel-wiring`.

> **מרכז-המודיעין כולל כעת 6 שכבות-עומק:** אריחי-תיק · לוח-אותות · טבלה-עמוקה+צלילה ·
> מפת-עונתיות · מכונת-זמן · רצועת-קוהורטה. כולן נגזרות טהורות של `db.supporters`,
> memoized, מגודרות `supporters.intel === true`.

## ייצוא + העשרת-צלילה (העמקה · אותו PR-משפחה)
- **`intelExport.ts`** — `intelCsvRows(supporters, today, rate)`: שורה-לתורם עם
  **כל עומק-הנתונים** (RFM · דרגה · LTV · מתנה-ממוצעת · סיכון · תחזית סכום/תאריך/ביטחון ·
  חודש-שיא · עונתי · אותות). מרכז את כל המנועים הטהורים. כפתור **⬇ CSV מלא** בכותרת,
  מגודר `core.export` (ברירת-מחדל-דלוק ⇒ הלקוח-החי שומר; רק false מכבה) דרך `downloadCsv`.
- **כרטיס-הצלילה מועשר** — `donorRhythm` (צ׳יפ "🗓️ עונתי · שיא <חודש>") + `donorSignals`
  (צ׳יפי-אותות פר-תורם). ננעל ב-ratchet `intel-wiring` + `intelExport.test`.

## דירוג/אחוזון (העמקה · אותו PR-משפחה)
מנוע `ranks.ts` טהור — **היכן התורם ממוקם** מול כלל-התיק ומול דרגתו (משלים RFM
"כמה שווה" בהקשר-יחסי "איפה זה מציב"). מיון-יחיד לפי-LTV O(n log n); שובר-שוויון
יציב לפי id ⇒ דירוג חוזר-על-עצמו (ratchet-friendly).
- `donorRanks(supporters, today, rate)` — Map id→{ltvRank/total/percentile/tierRank/tierSize}.
- UI: צ׳יפ "#<מקום>/<סה"כ> · אחוזון <N>" בכרטיס-הצלילה. ננעל ב-ratchet `intel-wiring`.

## קוהורטת-גיוס (העמקה · אותו PR-משפחה)
מנוע `retention.ts` טהור — שימור לפי **שנת-הגיוס** (שנת המתנה-הראשונה): לכל מחזור,
כמה גויסו וכמה עדיין-פעילים היום (נתנו ב-365 יום). התובנה הקלאסית של fundraising —
"מאיזה מחזור התורמים עדיין נותנים / האם הגיוס-האחרון דולף". מעבר-יחיד O(סה"כ).
- `acquisitionCohorts(supporters, today, rate)` — `cohorts[]` (year/size/activeNow/
  retentionPct/ltv) + `overallRetention` משוקלל.
- UI: `RetentionBand` במרכז-המודיעין — פס פר-שנה (מילוי=הפעילים), שימור%+LTV, צבע-לפי-שימור.
  ננעל ב-ratchet `intel-wiring`.

> **מרכז-המודיעין = 7 שכבות-עומק:** אריחי-תיק · לוח-אותות · טבלה-עמוקה+צלילה(דירוג/קצב/אותות)
> · מפת-עונתיות · קוהורטת-גיוס · מכונת-זמן · רצועת-קוהורטה. + ⬇ ייצוא-CSV מלא.
> כולן נגזרות טהורות memoized, מגודרות `supporters.intel === true`, perf 50k < 500ms.

## בורר-מבטים מאוחד (✅ בוצע)
`SupportersViewSwitcher.tsx` — רכיב-סגמנט אחד שמאגד את מבטי-מסך-התורמים (נתונים ·
חלון-עבודה · מודיעין · גלקסיה) במקום 3 כפתורים מפוזרים. כל מבט-על מגודר בדגל-ה-opt-in
שלו; בורר עם מבט-יחיד (data בלבד) לא-מרונדר ⇒ הלקוח-החי ביט-זהה. הבחירה מנתבת
לסטייטים הקיימים (setWorkMode/setIntelMode/setGalaxyMode) בלי לשבור את ה-early-return.
ננעל ב-ratchet `view-switcher`.

## ריכוזיות התיק · פארטו/ג׳יני (✅ בוצע · עוד-עומק)
מנוע `pareto.ts` טהור — עד כמה התיק תלוי במעטים (סיכון-ריכוזיות). מיון-יחיד O(n log n),
ג׳יני בנוסחת-הסדרה-הממוינת (בלי O(n²)) ⇒ perf 50k < 400ms.
- `paretoReport(supporters, today, rate)` — עקומת-לורנץ + `top20Share` + `halfDonorPct`
  (כמה-מעט = חצי מהכסף) + `eightyDonorPct` + `gini` (0–100).
- UI: `ParetoBand` במרכז-המודיעין — עקומת-לורנץ מול קו-שוויון + 3 ספי-ריכוזיות + ג׳יני.
  ננעל ב-ratchet `intel-wiring` + `pareto.test`. **מרכז-המודיעין = 8 שכבות-עומק.**

## היקום 3D + מכונת-הזמן החיה (✅ בוצע)
- **מנוע:** `donorConstellation` הורחב ב-`offsetDays` — הקרנה-קדימה: הרדיוס גדל
  (הכוכב נסחף החוצה) והסיכון מחושב ב-`churnAtOffset` (מכונת-הזמן). offset=0 ≡ היום.
- **UI (`SupportersGalaxy`):** סרגל-אופק (`range` 0–365) שמזין את המנוע דרך `offsetDays` —
  גוררים קדימה והכוכבים נסחפים-החוצה ומאדימים ("אם לא תעשה כלום"); מונה `+N יגלשו-לסכנה`
  מול הבסיס + כפתור "↺ היום". **פסאודו-תלת-ממד:** דיסק-מוטה (רינגים אליפטיים `ellipse`,
  ציר-y דחוס TILT=0.6, עומק לפי חצי-הדיסק). ננעל ב-ratchet `galaxy-wiring`.

## מעברי-דרגה אמיתיים (✅ בוצע · בלי שינוי-סכמה!)
מנוע `tierMigration.ts` טהור — **מעברי-דרגה אמיתיים**, לא פרוקסי. התובנה: דרגת-תורם
**as-of תאריך** נגזרת מהיסטוריית-הנתינה עצמה (סורקים רק נתינות עד אותו יום, טריות
יחסית-אליו) ⇒ **אין צורך בשמירת-מצב-היסטורי / שינוי-סכמה**.
- `tierAsOf(sp, asOfIso, rate)` — דרגה נכון-לתאריך (null=לא-היה-תורם עדיין).
- `tierMigration(supporters, today, monthsBack, rate)` — `promoted`/`demoted`/`stable`/
  `newDonors` + `flows` (from→to). perf 50k × 2 נקודות < 500ms.
- UI: כרטיס-מיגרציית-הדרגות ברצועת-הקוהורטה — צ׳יפי עלו/ירדו/יציבים/חדשים + top-flows,
  מעל מגמת-הדרגה הנוכחית. ננעל ב-ratchet `intel-wiring` + `tierMigration.test`.

## ✅ כל צרור "הכל בלולאה" הושלם
בורר-מבטים מאוחד · ריכוזיות-פארטו · היקום-3D+מכונת-זמן-חיה · מעברי-דרגה-אמיתיים.
**מרכז-המודיעין = 8 שכבות-עומק; הגלקסיה = יקום-זמן חי.** אפס-אובדן · הכל opt-in ·
נגזרות-טהורות memoized · perf 50k. נותר לבעלים: הדלקת הדגלים (‏supporters.intel/galaxy/
cockpit/rebrand) בקונפיג-הארגון.

## כרטיס-תורם מאוחד (✅ בוצע · שאלת-בעלים "למה לא גם הכרטיס")
`SupporterCard.tsx` — מעטפת-לשוניות **אפס-שכפול**: לשונית "📇 הכרטיס" מרנדרת את
`SupporterDetail` המלא הקיים **verbatim** (כל היכולות נשמרות), לשונית "📊 מודיעין"
מוסיפה ניתוח-עומק פר-תורם (RFM · תחזית · סיכון · קצב-עונתי · אותות · דירוג/אחוזון).
- דגל `supporters.card` **optIn:true** ⇒ **כפתור באשף** (נסגר הפער: כל 5 דגלי-התורמים
  החדשים חשופים כעת באשף כ-opt-in). כבוי = הכרטיס הרגיל ביט-זהה.
- חיווט ב-`SupportersView`: `cardOn ? <SupporterCard> : <SupporterDetail>`.
- ננעל ב-ratchets `card-wiring` + `optin-wizard` (supporters.card ברשימה).
