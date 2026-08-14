# סגירת נחיל-השיפור האחרון (9×9) — מנוע-הטלפוניה

**מתי:** אחרי שלושה סבבי-תיקון מלאים (73 ממצאים נסגרו), נחיל-שיפור אחרון של 9×9
(54 סוכנים · 44 הצעות → 43 שוות-מימוש → 38 לעכשיו) הפיק תוכנית-שיפור מדורגת.
מומשו **8 שדרוגי-הליבה** (⭐ "לממש עכשיו"), כל אחד עם בדיקת-ratchet.

## העיקרון-המנחה
**golden מקפיא בייטים — לא נכונות-ניתוב.** כל שדרוג מוסיף שכבת-אמת שאין ל-golden:
שכל **הבטחה** של ה-manifest/דיאלפלן יש לה **מימוש מקביל, נגיש, ומבודד** ב-XML,
ושכל שיחה **תמיד עונה**. שלושה אינווריאנטים נאכפים-מכונה במקום מוסכמה-שבירה:
1. **סגירת-מסלולים** — אין הבטחת-ניתוב בלי ארטיפקט תואם ונגיש.
2. **בידוד** — סוד/זהות של דייר-א׳ לעולם לא בקבצי-ב׳.
3. **fail-safe** — אין מבוי-סתום שקט; toll-fraud חסום-בתקרה; שער-מת מתגלה בצד-המפעיל.

## 8 השדרוגים שמומשו

| # | שדרוג | קובץ | מהות |
|---|--------|------|------|
| ⭐1 | **אורקל סגירת-מסלולים** `auditRoutes` | `lib/audit-routes.mjs` (חדש) | מצליב dialplan/directory/gateways בלי-מפרש: גשר ל-`user/<ext>@` בלי `<user id>` (dangling), transfer ל-label שאין לו תנאי-`destination_number` נגיש (orphan — נבדק לפי התנאי, לא לפי שם-ה-extension!), גשר ל-`sofia/gateway/<gw>` בלי `<gateway>`. |
| ⭐2 | **max_forwards loop-guard** | `lib/generate.mjs` | `set max_forwards=20` ב-setup_defaults — שרשרת-transfer לא תיסגר למעגל שמכלה ערוצים ומשבית דיירים-אחרים. |
| ⭐3 | **fail-safe · "השיחה תמיד עונה"** | `lib/generate.mjs` | afterhours בלי-voicemail ⇒ טרמינל answer+`tone_stream`+hangup (בלי-קובץ, בלי-שקט); כל hangup עם סיבה מפורשת (NORMAL_CLEARING / NO_ROUTE_DESTINATION) ⇒ CDR נקי. |
| ⭐4 | **גלאי-מקשים-שהושמטו** `reportDroppedKeys` | `lib/config.mjs`+`validate.mjs` | מפתח-תצורה לא-מוכר במרחק-עריכה≤2 ממוכר ⇒ אזהרה "אולי התכוונת ל-". סוגר את כשל-ה"הדלקתי-בשקט" (`voice.ivrr`). |
| ⭐5 | **secretPreflight** | `lib/apply.mjs`+`tel.mjs` | מצליב `$${NAME}` מהקבצים מול env; env-var-חסר = שער-דומם שקט ⇒ אזהרה-רועשת בזמן-החלה (מסווג gateway/ext-auth/voicemail/recording). `--strict-secrets` חוסם. |
| ⭐6 | **crossTenantLeakScan** | `lib/security.mjs`+`tel.mjs` | הוכחה-סמנטית: טביעת-סוד/זהות של דייר-א׳ לא מופיעה בקבצי-דייר-ב׳ — תופס כל רגרסיית copy-paste בגנרטור. חוסם apply. |
| ⭐7 | **תקרות-toll-fraud קשיחות** (opt-in `voice.hardening`) | `lib/generate.mjs`+`config.mjs` | כל גשר-שער-יוצא עטוף `limit hash tenant_<id> outbound <רוחב-SIM> !USER_BUSY` + `sched_hangup +3600` ⇒ cred-גנוב לא מרוקן את חשבון-הסלולר. כבוי=ביט-זהה. |
| ⭐8 | **לוח-ידוע רב-שנתי** `luach-known.json` | `test.mjs`+`fixtures/` (חדש) | עוגני-אמת מפורסמים (2024–2030) + אינווריאנטים: אין-צום-בשבת (למעט יו״כ — דיני-דחייה), כל-יו״ט-סגור, אפס-סגירת-שווא + טבלה-קפואה. מגן על שער-הזמנים מרגרסיות Intl/DST/שנה-מעוברת. |

**בדיקות:** 369 → **407 עוברים** (+38 ratchet). golden השתנה מינימלית ובמכוון:
`max_forwards` בכל הדיאלפלנים + סיבת-ניתוק להכרזה (voice) — אפס-נגיעה ב-manifest/directory/gateway.
בידוד ⭐7 מאומת (`voice.hardening` כבוי = ביט-זהה).

## מה-נדחה ל"גל-הבא" (מתועד בסינתזה, לא מומש כאן)
- **`interpret.mjs`** — מפרש-דיאלפלן מינימלי כאורקל-שלישי (`interpret ≡ simulateCall`) —
  ה-differential-testing האמיתי שסוגר סופית את golden↔routing. TRANSFORMATIVE×large.
- **רתמת property-testing** (`arb.mjs`, seed-מוזרק) + יחסים-מטמורפיים (רובם על simulate לבד).
- **`zmanim.mjs`** — שקיעה→הדלקת-נרות/צאת פר-עיר (מחליף `shabbatFriEnd` הסטטי). TRANSFORMATIVE×large.
- **apply פר-לקוח עם בידוד-כשל** (`planApplyBatch`) · lockfile פר-לקוח · `monitor.mjs` (parser fs_cli).

## עיקרון-הברזל
כל השדרוגים **pure-downstream** — מנתחים ארטיפקט-פלט או מחשבים מקומית; אפס
אינטגרציית-ספק/API/trunk. טהורים+דטרמיניסטיים, מגודרי-דגל (⭐7 כבוי=ביט-זהה),
עם ratchet פר-שדרוג.
