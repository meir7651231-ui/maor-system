/**
 * סיווג כל סקריפטי e2e/*.mjs לסוויטות-CI (11.11.2026).
 *
 * למה: עד היום אף סקריפט-דפדפן לא רץ ב-CI (רק toggle-matrix ידנית) ⇒ 10 מתוך 36 נשברו בשקט
 * במשך שבועות (נתיב-chromium ישן, תוויות שהשתנו, עיצוב שהשתנה). מעכשיו:
 *   push    — רץ בכל push ל-claude/** ובכל PR (ג'וב `e2e` ב-ci.yml).
 *   nightly — הארוכים (5–17 דק' כל אחד): רצים בלילה ובהפעלה ידנית (e2e-nightly.yml).
 *   manual  — לא בדיקות: מחוללי-צילומים, כלי-מדידה, עזרים, ו-rules-redteam (יש לו ג'וב `rules` משלו).
 *
 * כל קובץ חדש ב-e2e/ חייב להופיע באחת הרשימות — נאכף ב-src/lib/__tests__/e2e-suites.test.ts,
 * אחרת סקריפט חדש פשוט לא ירוץ אף פעם ואף אחד לא ישים לב (בדיוק מה שקרה).
 */

/** מהירים (≤ ~2 דק' כל אחד) — שער לכל push. */
export const PUSH = [
  'toggle-matrix.mjs',
  'vertical-matrix.mjs',
  'demo-link.mjs',
  'demo-walkthrough.mjs',
  'launch-readiness.mjs',
  'signup.mjs',
  'dialer-smoke.mjs',
  'segula-smoke.mjs',
  'segula-board-smoke.mjs',
  'segula-cloudcfg-smoke.mjs',
  'care-back-smoke.mjs',
  'care-center-smoke.mjs',
  'ayin-names-smoke.mjs',
  'name-split-smoke.mjs',
  'recur-reminders-smoke.mjs',
  'course-date-smoke.mjs',
  'courses-filters-smoke.mjs',
  'filter-memory-smoke.mjs',
  'last-filter-smoke.mjs',
  'next-topic-board-smoke.mjs',
  'teachers-csv-segula-diag-smoke.mjs',
  'demo-purge-smoke.mjs',
  'flagmax-smoke.mjs',
  'paylink-smoke.mjs',
  'crosswire-smoke.mjs',
  'home-fullinfo-wire.mjs',
  'home-widgets-wire.mjs',
  'interactivity-check.mjs',
  'site-live-smoke.mjs',
  'store-search-audit.mjs',
  'cloud2-truth-test.mjs',
  'p0-data-diag.mjs',
];

/** ארוכים — לילי + ידני. */
export const NIGHTLY = [
  'demo-no-export.mjs', // ~16.5 דק' — נעילת-הדמו: לוחץ על כל פקד-ייצוא בכל מסך
  'swarm-capture.mjs', // ~11 דק'
  'full-audit.mjs', // ~7 דק' — דסקטופ+מובייל, גלישה/יישור
  'modal-audit.mjs', // ~5 דק'
];

/** לא בדיקות (או שרצות במקום אחר) — מסווגים כדי שהאכיפה תדע שזה מכוון. */
export const MANUAL = [
  'chrome-path.mjs', // עזר: נתיב-הדפדפן
  'ci-suites.mjs', // הקובץ הזה
  'run-ci.mjs', // המריץ
  'rules-redteam.mjs', // ג'וב `rules` נפרד (אמולטור Firestore + Java)
  'perf-supporters.mjs', // כלי-מדידה, לא שער (ראו CLOSED-PERF-SUPPORTERS-A)
  'ayin-board-sheet-shot.mjs',
  'ayin-sheet-shot.mjs',
  'ayin-shot.mjs',
  'donor-board-shot.mjs',
  'edu-vertical-shot.mjs',
  'filters-shot.mjs',
  'gcontacts-shot.mjs',
  'nextgen-shots.mjs',
  'owner-list-1013-shots.mjs',
  'portal-shot.mjs',
  'proof-shots.mjs',
  'shop-tzedaka-shot.mjs',
  'teamchat-entry-shot.mjs',
  'update-banner-shot.mjs',
  'wave5-shots.mjs',
  'wizard-shot.mjs',
];

/** מגבלת-זמן לסקריפט (ש'). מעבר לה = כשל (סקריפט תקוע). */
export const TIMEOUT_S = { push: 300, nightly: 1500 };
