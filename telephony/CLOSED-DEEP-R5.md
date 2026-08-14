# סגירת נחיל-עומק · סבב-5 (R5)

**תאריך:** 2026-08-14 · **ענף:** `claude/telephony-engine` · **בדיקות:** 587 → **624** (‏0 נכשלו) · **golden:** עודכן-מכוון (F15 בלבד — ביט-מאומת).

נחיל-עומק סבב-5 (‏38 סוכנים · 10 ממדים · מצאי→אימות-אדוורסרי→סינתזה) אימת את R4 וחפר עמוק יותר. **R4 החזיק חלקית:** ‏C2/C3/C5 והיישורים נכונים, אך **C1 לא-שלם** (email), **C4 הכניס רגרסיה** (התו `_` בגבול), ו-**simulate עדיין סטה** מ-generate בכמה מסלולים. ‏25 ממצאים אושרו → **18 ייחודיים** תוקנו, כל אחד עם ratchet מתועד.

## 🔴 קריטי · הפרת-אינווריאנט · רגרסיה

| # | ממצא | קובץ | תיקון |
|---|------|------|-------|
| **F1** | ‏C1 לא-שלם — `destinations.office/voicemail.email` עקפו את `noVars` ⇒ `$${SECRET}` נצרב ל-`vm-mailto` (‏esc לא בורח `$`) | `validate.mjs` | `EMAIL_RE` קפדני (בלי `$`/מרכאות/סוגריים/רווח) + `cleanEmail` — פסול מושמט עם אזהרה, לא מגיע ל-XML |
| **F2** | **רגרסיית-C4** — הגבול `(?![a-z0-9_-])` עיוור סוד-פר-שלוחה: `tenantId` לעולם בלי `_` ⇒ ה-`_` לא מנע false-positive אבל ביטל כל חתם שהגנרטור ממשיך ב-`_` (`PROVISION_PW__id__ext`, `VM_PW__id__ext`, `tenant_id_q/_gw`) | `security.mjs` | הוסר `_` מהמחלקה → `(?![a-z0-9-])`. דליפת-סוד-פר-שלוחה נתפסת שוב; ה-`-` שומר על אי-false-positive (chesed⊂chesed-north) |
| **F3** | `tenantFingerprint` חסר את חתמי הדומיין (`user/<ext>@<id>`) והשער (`sofia/gateway/<id>-gw<n>`) — גשר/toll-fraud חוצה-דיירים בלתי-נראה | `security.mjs` | נוסף `@<id>` (מסתיים-סלאג, גבול) ו-`<id>-gw` (ממשיך-בספרה, substring) |
| **F4** | `trustReport` הצהיר "‏AES-256-GCM פעיל" על-סמך דגל בלבד; ‏`record_session` כותב `.wav` גולמי, `REC_KEY` לא נצרב (ענף-מת) ⇒ הצהרה בלתי-ניתנת-לאימות לוועד | `report.mjs` | `pass:false` בשני המצבים; דלוק ⇒ "מודל-דורמנטי טרם-מחווט" (כמו הצפנת-הענן של מאור) |
| **F5** | מסלול `apply` קרא `buildTenant` בלי `anchorDate` ובלע את `b.warnings` ⇒ עמותה עם `calendar.hebrew` נבנתה **בלי סגירות-חג, בשקט** (מצלצל ביו״כ) | `tel.mjs` | עוגן-לוח (`--anchor` או היום) מוזרק בגבול-ה-CLI; `b.warnings` מוצגות |

## 🟠 נכונות — סטיות simulate↔generate (כלי-האמון דיווח הצלחה בלי כיסוי)

| # | ממצא | קובץ | תיקון |
|---|------|------|-------|
| **F6** | ‏simulate outbound התעלם מכל דגלי-ה-outbound/הפורמט ⇒ `via:label` שקרי לעמותת-receive-only (הדיאלפלן ריק מ-extension יוצא) | `simulate.mjs` | מגודר-דגלים מיושר לגנרטור: `outbound`/`.pick`/`.default`/`.international` + רגקס-פורמט ⇒ `outbound-disabled`/`no-route` |
| **F7** | `zmanimClosedReason` לא העביר `geo.tzeis` (נפל ל-40) ⇒ חלון-מוצ״ש ב-simulate הסתיים מוקדם מהגנרטור לדייר עם tzeis≠40 | `simulate.mjs` | `tzeis` מועבר זהה לגנרטור |
| **F8** | יו״כ (yomTov+fast): simulate סגר יום-מלא (`c.fast && !c.shabbat`), generate פתח אחרי-צאת (מכוסה בחלון) | `simulate.mjs` | `!c.yomTov` בענף-הצום — יו״כ נסגר בחלון, לא יום-מלא |
| **F16** | ערב-יו״ט-המסכם (הושענא-רבה אחרי הדלקה): simulate החזיר "חול המועד", generate דרס ל-"שמיני עצרת" (חלון אחרי לוח) | `simulate.mjs` | **סדר-דריסה מיושר** — החלון-המדויק נבדק **לפני** היום-המלא (last-writer-wins כמו בגנרטור) |
| **F9** | `manifest.outboundDefault` פלט `defaultNumberId` גולמי לצד `kosherOutbound:true`, בעוד הדיאלפלן מחייג דרך `def` המסונן-כשר | `generate.mjs` | המניפסט משקף את ה-SIM שהדיאלפלן באמת מחייג דרכו (`defSim`) |
| **F10** | `matchMessageContact` חסר `vertical` ⇒ `primary` בעדיפות-קבועה, בעוד `screenPop` לפי-ורטיקל ⇒ כרטיס-הודעה ≠ כרטיס-שיחה | `channels.mjs` | פרמטר `vertical` → `popPriorityFor` (ברירת-מחדל ביט-זהה) |
| **F11** | outcome `afterhours` תמיד תואר "→ תא-קולי", גם כשה-voicemail כבוי (הגנרטור מנגן צליל-תפוס+ניתוק) | `simulate.mjs` | התיאור מודע-voicemail; השרשרת (מנהל→גלישה→תא-קולי/צליל-תפוס) בנתיב |
| **F12** | `migrationRisk` סימן הוספת-SIM טהורה (ספירה עולה) כ-`outbound-swapped` high ⇒ הרגלת-התעלמות | `apply.mjs` | בדיקת-swap רק על **שווה-כמות** |
| **F13** | `callHeatmap.since` השוואת-מחרוזת גולמית ⇒ אירוע-תאריך-בלבד באותו-יום נדחה מול `since` עם שעה | `cti.mjs` | נרמול-גרנולריות (תאריך-בלבד → `T00:00:00`) לפני ההשוואה |
| **F14** | `hebrewClosedWindows` fail-**open** בקוטב (שקיעה `null` ⇒ החלון מושמט, הקו פתוח לתוך השבת) | `zmanim.mjs` | **fail-CLOSED** — נפילה לסגירת-יום-מלא של הרצף כשהשקיעה לא-מחושבת |

## 🟡 חיזוק · עקביות

| # | ממצא | קובץ | תיקון |
|---|------|------|-------|
| **F15** | צום תויג `closed_kind=holiday` ⇒ `do_closed_holiday` ניגן `greeting-holiday.wav` ("חג שמח") ביום-צום | `generate.mjs` | `closed_kind=holiday` רק ל-`kind!=='fast'`; צום ⇒ `do_closed` הגנרי (`greeting-closed.wav`). **golden עודכן** — 5 שורות `closed_kind` פר-ורטיקל (kollel/shul), יו״ט נשמר |
| **F17** | הכרעת-דיאספורה בשני-נוסחים (`Asia/Hebron` בגנרטור מול `Hebron` ב-simulate/zmanim) — מקור-סחף | `config.mjs`+3 | `isDiaspora()` מרוכז אחד; generate/simulate/zmanim קוראים ממנו |
| **F18** | קדימות `priority<mourning` (מתקשר-בסיכון בשבעה → אחראי, לא מחליף) לא-מקובעת בבדיקות | `test.mjs` | ratchet: `incoming_priority`/`line_nh_priority` לפני ה-mourning בשתי השרשראות + סימולציה |

## אינווריאנטים שנשמרו
- **‏golden byte-identical** — כל שינוי-golden (F15) אומת: הסרת **רק** שורות `closed_kind=holiday` בימי-צום; יו״ט/חוה״מ נשמרו. הוכחה: הסרת כל שורות `closed_kind=holiday` ⇒ old≡new.
- **דגל-כבוי = ביט-זהה** — F9/F15/F17 נוגעים רק בפיצ׳רים-דלוקים; geo-ישראלי מחשב שקיעה תמיד (F14 לא נוגע). 5 חבילות-golden ללא-features → אפס שינוי.
- **pure-downstream · CTI קריאה-בלבד · אין הנפקת-קבלות** — לא נגעו.
- **דטרמיניזם** — `new Date()` רק בגבול-ה-CLI (`tel.mjs apply` auto-anchor); הליבה טהורה.

**מצב:** ‏624/624 ירוק. הלולאה ממשיכה — סבב-6 מאמת את R5 וחופר עמוק יותר.
