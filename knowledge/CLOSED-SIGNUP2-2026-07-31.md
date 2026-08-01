# ✅ CLOSED-SIGNUP2 — פיצול three ל-lazy + חיווט "צפו בסרטון"

**בנאי · 1.8.2026 · ענף:** `claude/what-do-you-see-bcxttj` · מנדט: `BUILD-ORDER-SIGNUP2-2026-07-31.md` (אשכול יחיד `מיתוג 5 ·`) · מקור: `AUDIT-SIGNUP-2026-07-31.md`.

## מה נמסר (קומיט אחד)

| שינוי | פרט |
|---|---|
| **three ב-lazy-chunk** | `SignupHero.tsx`: ה-import הסטטי של `mountBrainScene` הוסר (הטיפוס נשאר `import type`); בתוך ה-`useEffect` (המגודר signup.hero3d + WebGL) — `import('../../lib/three-scene').then(...)` עם guard `cancelled`. ⇒ Vite מפצל את `three-scene`+`three` ל-chunk נפרד שיורד **רק** כשה-Hero מתרנדר. הנפילה הסטטית (דגל כבוי/אין WebGL) ללא שינוי |
| **חיווט "צפו בסרטון"** | `VideoModal.tsx` (חדש) — overlay עם `<video controls autoplay src={BASE}orbit/orbit-tour.webm>` (on-demand, לא בבנדל); Escape/✕/קליק-רקע סוגרים (דפוס NewsReader). `LoginScreen`: הכפתור פותח VideoModal במקום הטוסט "בקרוב" |

## DoD המרכזי — משקל הבנדל (מתועד)

| מדד | לפני (מיתוג 4) | אחרי (מיתוג 5) |
|---|---|---|
| `grep -c WebGLRenderer dist/assets/index-*.js` | 5 | **0** ✅ |
| סמלי-three אחרים בראשי (ACESFilmicToneMapping/BufferGeometry/ShaderMaterial) | — | **0** |
| הבנדל הראשי `index-*.js` | 1,467,156 בייטים (~1.43MB) | **977,330 בייטים (~954K)** |
| chunk `three-scene-*.js` (on-demand) | — | **490,240 בייטים (~479K)** |

הפער ‎−489,826 בייטים = בדיוק גודל ה-chunk שנשלף מהראשי. הלקוח הקיים (מאור החסד, נכנס ישר ולא רואה את ה-Hero) **לא מוריד יותר את three**.
*הערה: היעד "~845K" מהמנדט הוא ה-baseline טרם-SIGNUP; ה-977K כולל את קוד מסך-ההרשמה עצמו (Login/Hero/News/Callback/Video) שנוסף ב-SIGNUP — לא נסיגה; three עצמו יצא מהראשי במלואו.*

## אימות

- verify מלא ירוק — **858 בדיקות / 129 קבצים** (typecheck · lint · test · build).
- **signup.mjs ירוק** — הכדור עדיין עולה (אחרי טעינת ה-chunk, swiftshader); "צפו בסרטון" פותח `<video>`; עיתון/נחזור-אליכם/לשוניות — אפס שגיאות JS.
- **toggle-matrix ✓ · launch 13/13 ✓** (cloud-off — לא רואים את מסך ההרשמה, ללא שינוי).
- 3 בדיקות-מקור חדשות: lazy-import (`import(` ל-three-scene, בלי import-ערך סטטי של mountBrainScene, `import type` לטיפוס) + וידאו (VideoModal, לא "בקרוב", `<video>` on-demand).

## גבולות — נשמרו

מראה/התנהגות מסך ההרשמה לא שונו — רק עיתוי הטעינה של ה-3D (דחוי ל-chunk) והכפתור שהיה טוסט הפך למודאל וידאו. אפס CDN (three עדיין import מקומי, רק דינמי).

## ⚠️ ממצא נפרד (לא-SIGNUP2) — demo-walkthrough

`demo-walkthrough` נכשל ב-3 בדיקות מדורגות: **שיבוץ כרטיסייה מכרטיס המשפחה** (רוני מסתיים משובץ ל"חוג ציור" החודשי בלבד; שיבוץ ה"התעמלות" הכרטיסייה מכרטיס-המשפחה לא מתבצע ⇒ "10 מתוך 10" והניקוב שאחריו נכשלים). **מאומת כפרה-קיים ולא-קשור ל-SIGNUP2:** `git stash` של שינויי מיתוג 5 + rebuild מפיק את אותם 3 כשלים בדיוק; "אפס שגיאות JS בכל המעבר" עובר (אי-התאמת זרימה, לא קריסה). SIGNUP2 נוגע רק במסך-הענן (cloud-off לא רואה אותו). **לא נחסם ב-CI/pre-push** (רק typecheck/lint/test/build; הסוויטות ידניות). מתועד ב-AUDIT-SIGNUP; **שאלה לארכיטקט:** לפתוח משימה נפרדת לתיקון זרימת שיבוץ-כרטיסייה-מהכרטיס?
