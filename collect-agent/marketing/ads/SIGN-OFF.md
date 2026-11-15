# גבי עיצוב · חבילה מוכנה לחתימת מאיר

כל הנכסים בענף `collect-agent`. **שום דבר לא פורסם.** חתימה = «מאשר» על הרשימה הזו (או הערה פרטנית לנכס).

| # | נכס | קבצים | הוכחה |
|---|---|---|---|
| 1 | לוגו סופי (עיצוב מאיר) + חבילת מותג | `web/src/brand/logo.ts`, `web/public/*`, `docs/brand/concepts/gabi-final/` | `web` tests (logo pinned) |
| 2 | סרטון 16:9 (16.4ש׳) + גרסה שקטה | `marketing/video/gabi-demo-16x9{,-silent}.mp4` | `compose/qa/verify_edit_h_summary.txt` · `finish_check.py` |
| 3 | רילס 9:16 (26.7ש׳) + גרסה שקטה | `marketing/video/gabi-reel-9x16{,-silent}.mp4` | `compose/qa/verify_edit_v_summary.txt` · `scan_final.py` · `finish_check.py` |
| 4 | 2 תמונות ממוזערות לסרטון | `marketing/ads/out/thumb-*.png` | `node marketing/ads/check.mjs` |
| 5 | 4 מודעות סטטיות (ריבוע/פיד/4:5/סטורי) | `marketing/ads/out/ad-*.png` | אותה בדיקה |
| 6 | 8 מודעות לפי ורטיקל (מספרה/מוסך/קליניקה/לקוח רו״ח × ריבוע+סטורי) | `marketing/ads/out/vert-*.png` | אותה בדיקה |

**מחיר בכל הנכסים = הכרעת 6.11:** ₪119 לחודש או ₪1,190 לשנה · כולל מע״מ ככל שחל · 14 ימי ניסיון בלי כרטיס.
**כתובת:** ממקור יחיד `marketing/launch/launch.json` (גבי שיווק). כל עוד placeholder — אין כתובת באף נכס (אין `gabi.example`).

## מה נשאר — רק אצל מאיר
1. **חתימה** על הנכסים 1–6.
2. **דומיין** (גם חוסם של גבי שיווק). ביום הדומיין, 3 פקודות ואין עבודת עיצוב:
   `python3 marketing/launch/set_domain.py <דומיין>` → `node marketing/ads/render.mjs` → `cd marketing/video/compose && node endcard.mjs end && python finish.py end`
3. **לשיקול:** צילומי ירוק-מסך באיכות גבוהה יותר יחזירו לסרטון את רגעי הרמת-הטלפון והלחיצה שנחתכו (לא חוסם).
