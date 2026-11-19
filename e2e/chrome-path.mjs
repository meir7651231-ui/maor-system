/**
 * נתיב-הדפדפן לכל סקריפטי-הדפדפן (e2e/ ו-scripts/).
 * באג (10.11.2026): 43 סקריפטים קיבעו '/opt/pw-browsers/chromium-1194/...' — אחרי עדכון-הסביבה
 * ל-chromium-1243 הנתיב נעלם ⇒ סקריפט שלא קרא משתנה-סביבה קרס ב-launch (name-split, course-date,
 * recur-reminders, flagmax, segula-board ועוד). כאן: הראשון שקיים מבין משתני-הסביבה והנתיבים המוכרים.
 */
import { existsSync } from 'fs';

export const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  process.env.CHROME,
  process.env.CHROME_BIN,
  '/opt/pw-browsers/chromium', // symlink יציב לגרסה המותקנת
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', // הנתיב ההיסטורי
  '/usr/bin/google-chrome',
];

export const CHROME_EXE = CHROME_CANDIDATES.find((p) => p && existsSync(p)) ?? '/opt/pw-browsers/chromium';
