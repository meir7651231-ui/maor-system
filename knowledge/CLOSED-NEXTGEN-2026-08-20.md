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

## נותר (roadmap · מוגדר-היקף)
- **היקום 3D** — הרחבת הגלקסיה למבט-תלת-ממד (סרגל-הזמן כבר קיים במכונת-הזמן).
- **בורר-מבטים מאוחד** — לאחד את מתגי-המבטים לרכיב-סגמנט אחד.
- **מיגרציית-דרגות אמיתית** — דורש שמירת-מצב-היסטורי (כרגע פרוקסי-מגמה).
