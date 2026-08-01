# 🪐 פקודת בנייה — SIGNUP2: פיצול three ל-lazy-chunk (ביצועים)

**מאת:** הארכיטקט · 31.7.2026 · **ענף:** `claude/what-do-you-see-bcxttj` · קידומת: `מיתוג 5 ·` (אשכול יחיד). מקור: `AUDIT-SIGNUP-2026-07-31.md` (הכרעת בעלים "כן").

## הבעיה (מאומתת)
`three` יושב בבנדל הראשי (‏WebGLRenderer ×5 ב-`index-*.js`); הבנדל קפץ ‎~845K→~1.5MB. הסיבה: **import סטטי** ב-`SignupHero.tsx:10` — `import { mountBrainScene } from '../../lib/three-scene'`. כל טעינה (כולל הלקוח הקיים שלא רואה את ה-Hero) מורידה ~650K three מיותר.

## התיקון (אשכול יחיד)
**קובץ:** `src/components/cloud/SignupHero.tsx`.
1. **הסר את ה-import הסטטי** של `mountBrainScene` (השאר את `type BrainSceneHandle` כ-`import type` — טיפוסים לא משפיעים על ה-bundle).
2. בתוך ה-`useEffect` (שכבר מגודר signup.hero3d + זמינות WebGL): טען דינמית ⇒
   ```ts
   let handle: BrainSceneHandle | null = null;
   let cancelled = false;
   import('../../lib/three-scene').then(({ mountBrainScene }) => {
     if (cancelled || !canvasRef.current) return;
     handle = mountBrainScene(canvasRef.current, { palette: 'Aurora', pulse: 1, bloom: 0.5 });
   });
   return () => { cancelled = true; handle?.dispose(); };
   ```
   ⇒ Vite מפצל את `three-scene` + `three` ל-chunk נפרד שנטען **רק** כשה-Hero מתרנדר. שמור על הנפילה הסטטית (דגל כבוי / אין WebGL) ללא שינוי — היא לא נוגעת ב-three.
3. **בדיקות:**
   - ratchet חדש (הגנת-מקור): `SignupHero.tsx?raw` מכיל `import(` ל-three-scene ו**אינו** מכיל import סטטי של `mountBrainScene` (ערך, לא type).
   - הבדיקה הקיימת של signup.hero3d — נשארת ירוקה (ההתנהגות זהה, רק העיתוי דחוי).

## חיווט "צפו בסרטון" (הכרעת בעלים "כן")
**קובץ:** `src/components/cloud/LoginScreen.tsx` (~שורה 130) + `VideoModal.tsx` (חדש, קטן).
7. ה-asset כבר בריפו: `public/orbit/orbit-tour.webm` (הסיור המלא, 11MB — נטען on-demand, לא בבנדל).
8. החלף את `onClick={() => toast('...בקרוב...')}` בפתיחת `VideoModal` — overlay פשוט עם `<video controls autoplay src="{BASE_URL}orbit/orbit-tour.webm">`, סגירה ב-✕/Escape/קליק-רקע (דפוס NewsReader). הווידאו נטען רק כשלוחצים ⇒ אפס עלות לטעינת המסך.
9. **בדיקות:** הגנת-מקור — הכפתור פותח VideoModal (לא טוסט "בקרוב"); e2e signup: לחיצה על "צפו בסרטון" פותחת אלמנט `<video>`.

## סגירה
4. **e2e:** `signup.mjs` — הכדור עדיין עולה (עכשיו אחרי טעינת ה-chunk; הוסף `waitForTimeout` קצר אם צריך). שלוש הסוויטות הקיימות + signup ירוקות.
5. **אימות משקל (DoD המרכזי):** אחרי build — ‏`grep -c WebGLRenderer dist/assets/index-*.js` מחזיר **0** (three לא בראשי); three מופיע ב-chunk נפרד; הבנדל הראשי חוזר ל~845K. תעד את שני המשקלים בדוח.
6. **ידע:** CLOSED-SIGNUP2 קצר + עדכון AUDIT-SIGNUP (הממצא נסגר) + CLAUDE.md (three lazy).

**גבולות:** אין לשנות את מראה/התנהגות מסך ההרשמה — רק את עיתוי הטעינה של ה-3D. אין להחזיר CDN.
