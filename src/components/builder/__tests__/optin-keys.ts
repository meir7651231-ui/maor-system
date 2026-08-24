/**
 * רשימת דגלי-ה-opt-in המפורשים (`features[key] === true` בקוד) — מקור-אמת יחיד
 * לשני הראצ'טים: optin-wizard (סמנטיקת-האשף) + optin-registry (סריקת-מקור דו-צדדית).
 * מודול-עזר של בדיקות בלבד (אינו .test — לא נאסף כקובץ-בדיקות ולא נסרק).
 */
export const OPT_IN_KEYS = [
  'supporters.cockpit',
  'supporters.intel',
  'supporters.galaxy',
  'supporters.rebrand',
  'supporters.card',
  'courses.cockpit',
  'courses.plannedcharges',
  'shop.plannedcharges',
  // גל ה׳ — מסכי-החוגים החדשים מגודרים `=== true` בקוד ⇒ חייבים optIn:true באשף
  'courses.teacherapp',
  'courses.parentcard',
  'courses.ai',
  // שער-הצטרפות בעמוד-השיווק — opt-in מפורש
  'shell.portal',
  // ממצא-נחיל 21.8: שלושה דגלים שנשלחו מגודרים `=== true` וסחפו מחוץ לרשימה —
  // hokbulk/universe3d בכלל לא היו ב-FEATURES (לא באשף, בלתי-ניתנים-להדלקה בענן),
  // ו-photos היה במרשם בלי optIn (האשף הציג "דלוק" ולחיצת-הדלקה מחקה את המפתח).
  'supporters.photos',
  'supporters.hokbulk',
  'supporters.plannedcharges',
  'supporters.universe3d',
  // רישום-לשנה-הבאה — מסך "רישום" מגודר `=== true` בקוד ⇒ חייב optIn:true באשף
  'courses.reenroll',
  // ▶ "פעולה אחת עכשיו" (VISION-LIGHT ‏#16, 23.8) — מסך-משימה-אחת opt-in
  'supporters.oneflow',
  // 🕎 מנוע-העיתוי העברי (VISION-LIGHT ‏#37, 23.8) — "העונה שלהם" בקוקפיט
  'supporters.hebtiming',
  // 🌅 תדרוך-הבוקר (VISION-LIGHT ‏#29, 23.8) — "הבוקר שלך" במסך-הבית
  'home.morningbrief',
  // 🤖 שאל-את-מאור (VISION-LIGHT ‏#30, 23.8) — פרשן-שאלות מקומי במרכז-העזרה
  'shell.askmaor',
];
