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

## נותר (roadmap · מוגדר-היקף)
- **היקום 3D + מכונת-זמן** — הרחבת הגלקסיה (סרגל-זמן "אם לא תעשה כלום" + מבט-תלת-ממד).
- **בורר-מבטים מאוחד** — לאחד את מתגי-המבטים לרכיב-סגמנט אחד.
- **מיגרציית-דרגות אמיתית** — דורש שמירת-מצב-היסטורי (כרגע פרוקסי-מגמה).
