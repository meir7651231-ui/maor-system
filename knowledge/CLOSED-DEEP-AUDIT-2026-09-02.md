# ביקורת-עומק 6 עדשות — סגירה (2–3.9.2026)

**בקשת-הבעלים:** "תבדוק שהכל חי ותבדוק עמוק יותר הכי עמוק שאתה יכול" (אחרי ביקורת-ה-e2e של 1.9,
`CLOSED-E2E-AUDIT-2026-09-01.md`, שכיסתה את **המסכים**). הפעם — **הקוד**: 6 עדשות מקבילות
(סנכרון-ענן · כסף/קבלות · אבטחה · עמידות-נתונים · ריפוי-סכמה · חיווט-UI/מונחים) ⇒ ~40 טענות
⇒ אימות מול הקוד (file:line) ⇒ תיקון כל מה שמכני-ובטוח ⇒ ratchets ⇒ PR יחיד.
**עקרון:** אפס שינוי-סכמה · additive · הלקוח-החי ביט-זהה בלי דגלים · אפס-כסף בלי שער.

## 1. סנכרון-ענן (המסוכן ביותר — נתונים חיים)

| # | ממצא | תיקון | קובץ |
|---|---|---|---|
| C1 | `subscribeAll` דילג על **כל** ה-snapshot כשהיה בו כתיבה-מקומית-ממתינה (`snap.metadata.hasPendingWrites`) — שינוי מרוחק שהגיע באותו snapshot אבד עד ה-snapshot הבא | סינון **פר-מסמך**: `docChanges().filter(!ch.doc.metadata.hasPendingWrites)`; ה-meta רק `exists()` | `lib/cloud.ts` |
| C2 | איחוד-לפי-rid כיסה רק `supporters.donations`; תשלום-R- ב-`enrollments.payments` נדרס ע"י מסמך-ענן ישן = קבלה בלי רשומה | `RID_UNION = {supporters:'donations', enrollments:'payments'}`; `mergeDonationsPreserving` מאחד payments | `lib/cloud-merge.ts` |
| C3 | לחיצת-היד (handshake) ב-startCloudSync: ענן-מנצח גורף לישות שקיימת בשני הצדדים — בלי איחוד-rid, ובלי כיבוד מצבות-מחיקה מקומיות | לולאה חדשה: מצבה-מקומית מסננת מסמך-ענן שנמחק כאן; both-present ⇒ `mergeDonationsPreserving`; local-only מצורף | `store/cloudSync.ts` |
| C4 | `restoreDb`/`resetAll` החליפו DB בלי מצבות ⇒ ישות שנעלמה בשחזור "קמה לתחייה" מהענן | `withRemovalTombstones(prev,next)` — מצבה לכל id שהיה ואינו | `store/useApp.ts` |
| C5 | `LIST_FIELDS` בלי `courses.sessions`/`tasks` ⇒ מסמך-ענן ישן בלי המערך מקריס | הושלם | `lib/cloud-merge.ts` |
| C6 | `sanitizeIncoming` לא ריפא ערכים לא-חוקיים (family.status/cred, event.type, task.pri) ⇒ קריסת-רינדור (`STATUS_META[x].bg`) | `healRecord(col,item)` — no-op לכשר, ריפוי לפגום | `lib/cloud-merge.ts` |
| C7 | **סנכרון-נדרים ידני (כסף #2):** התוכנית חושבה מתצלום בפתיחת-המודאל ונכתבה **גורפת** ב-apply — תרומה/קבלה שנרשמה בזמן שהמודאל פתוח (טאב אחר/ענן) נדרסה | `reconcileNedarimApply(live, planned)` טהור: מתוכנן-מנצח, תרומות איחוד-rid+מונים-max, hist איחוד-txn, כרטיס-שנולד נשאר; `applyNedarimSync` ⇒ `setDb((db)=>…)` | `store/useApp.ts` |

## 2. כסף / קבלות

| # | ממצא | תיקון |
|---|---|---|
| M1 | `addDonation`/`addPayment` קיבלו סכום NaN/0/שלילי ⇒ קבלת-מס על "NaN ₪" עם מונה שנצרך | שער `Number.isFinite(amount) && amount>0` **לפני** צריכת-המונה; toast "סכום לא-תקין" |
| M2 | ראה C7 | — |
| M3 | `IncomingPayments`: ניתוב תשלום-דולרי כתשלום-חוג (שקלים) ⇒ R- בסכום שגוי | ניתוב-משפחה נחסם ל-`$` עם הסבר; `amount>0` |
| M4 | `PlannedChargesSection`/`EnrollmentPlannedSection`: `parseFloat` בלי clamp ⇒ תוכנית-חיוב שלילית | `Math.max(0, …)` + עיגול-אגורות |
| M5 | `receipt.ts` `o.rid.startsWith('S-')` על rid חסר ⇒ TypeError בתדפיס | `String(o.rid ?? '')` |

## 3. אבטחה

| # | ממצא | תיקון |
|---|---|---|
| S1 | `gcontactsSync.js` `supers.includes(el)` = התאמת-**תת-מחרוזת** על רשימת-מיילים ⇒ `a@b` "מייל-על" | `superSet()` Set + התאמה-מלאה + עוגן קשיח |
| S2 | לקוח-השורש (`cloudRoot`) סונכרן 0 אנשי-קשר (השרת קרא `orgs/root/*`) | `colFor(db, org, name)` — root ⇒ אוספי-שורש |
| S3 | on-demand בלי אימות-slug/הרחבה-דלוקה/קצב | `ORG_RE` · 403 `gcontacts-disabled` · 429 cooldown 60s · 500 קבוע `sync-failed` |
| S4 | TSV ללוח (CoursesDashboard/CollectionCenter) עקף `guardExport` ואת `csvEscape` (הזרקת-נוסחה) | שער + escaping |
| S5 | `canGrantedAction`/`bulkGranted` התעלמו מ-`false` מפורש (מנהל ראה פעולה-כבויה) | `!== false && (manager || === true)` |
| S6 | `lock.ts` `saltHex.match(/../g)` על מלח פגום ⇒ TypeError במסך-הנעילה (נעילת-משתמש בחוץ) | `?? []` |
| S7 | `decodeURIComponent` על hash זדוני ⇒ URIError מפיל את App | `safeDecode` |

## 4. עמידות-נתונים / ריפוי-סכמה

- `persist.migrate`: ריפוי `family.status` (allowlist) · `event.type` (EVENT_TYPES ⇒ 'custom') · `task.pri` (⇒2).
- `writeEnvelope` מחזיר boolean; `changeEncryptionPassword` מחליף envelope **רק אם הכתיבה הצליחה** (אחרת סיסמה-חדשה בזיכרון, ישנה בדיסק ⇒ נעילה-לצמיתות).
- `scheduleSave` עוטף `saveDb` ב-try/catch (זריקה השאירה dirty לנצח בלי toast); `exportBackup` `.catch` ⇒ toast.
- `evMeta(ev)` — מפת-סוגי-אירוע עם נפילה ל-`custom` ב-5 משטחים (calLib/widgets/exportRows/customExport/eventMeta) — מסמך-ענן עם type לא-מוכר לא מקריס לוח.
- null-safety: `STATUS_META[x.status] ?? STATUS_META.active` (FamilyPanels/families-lib/ExportSection) · `PRI_LABELS[t.pri] ?? PRI_LABELS[2]` (widgets/ManagerPanel) · `AyinCard` `{...emptyAyin(), ...sp.ayin}` · `ayinActive` על מערכים חסרים · `wallData` `createdAt ?? ''` · `SupportChat`/App watcher `alive`+`.catch` (setState אחרי unmount / import שנכשל) · `DonationSplitSection` `.catch` · `ProductForm.removeComp` מנקה בורר-פריט · `ReenrollView` `academicYearLabel(isoToday())`.

## 5. חיווט-UI / מונחים

- `customExport` כותרת "שם החוג" ⇒ `termOf(entity.course)`; `SecuritySection` "תורמים" ⇒ `termOf(nav.supporters)`.
- `DialerChip` מגודר גם `moduleOn('supporters')` (הופיע כשמודול-התורמים כבוי).
- `GRANTABLE_STAFF_FEATURES` += bulkmail/bulkwa/bulkmerge (המנהל לא יכל להעניק).
- `seedOverduePlannedReminders(isoToday())` (היה תאריך-UTC).

## 6. הוכחות

- יחידה: **2585/2585** (367 קבצים) — חדשים: `deep-audit-2026-09-02.test.ts` (הגנות-מקור לכל אשכול), `nedarim-apply-reconcile.test.ts` (5), `family-status-heal`, `e2e-audit-fixes`; ratchets ישנים עודכנו: `swarm2-C-guards` (dirty אחרי `withRemovalTombstones`), `cloud-merge` (הסטאב משקף status/cred — כמו-בפרודקשן), `grantable-features` (+3), `clear-purpose`, `integrations-wave1` (14).
- typecheck · lint · build (bundle 156.9KB gzip, 87% תקרה) ירוקים.
- דפדפן: 16 סוויטות (ראה §7 עדכון-ריצה) · functions 62/62.

## 7. נדחה להכרעת-בעלים (לא תוקן בעיוור — גבול-תפקיד)

1. **ארכיון-קבלות / מניעת-מחיקה של תורם עם קבלות** — סעיף 46 דורש שמירת-רשומות; היום מחיקת-תורם מוחקת גם את D-/R-. הצעה: מצבת-קבלות (archive) במקום מחיקה. **שאלת-רו"ח.**
2. **קידום `mail`/`gcontacts` ב-`INTEGRATION_STATUS` ל-live** — טקסונומיית-מכירה (שוליים/תמחור) = הכרעת-בעלים.
3. **תווית "חשבונית" בקופה** (מ-TRUST) — עדיין שאלת-רו"ח.
4. דליפות-מונח במצבי-ריק (CoursesCockpit:116 · RetentionCenter:110 · CoursesDashboard:85 · ParentCard:93 · parent.ts:92 · SupportersIntel:619 · Universe3D:239) — קוסמטי, יטופל בגל-מונחים.
5. `onRemote` בחלון-apply (סנכרון) — תיאורטי, לא שוחזר; `scanId` ניפוח-תגית-ספרות — קוסמטי.
6. **MFA** — קונסולת-Firebase (בעלים).

## 8. לקחים (נוספו ל-ARCHITECT-LESSONS)

- **תצלום ⇒ apply גורף = דריסה.** כל מודאל שמחשב תוכנית מתצלום-store ואז כותב — חייב למזג מול `get().db` **ברגע-הלחיצה**, לא לכתוב את התצלום.
- **סינון hasPendingWrites פר-מסמך, לא פר-snapshot.**
- **ratchet שנועל נוסח-קוד מדויק** (`set({ db });`) נשבר בתיקון-נכון — עדיף לנעול את ה-**סדר** (set ⇒ dirty) עם `[^\n]*`.

## 9. 🔴 ממצא-תשתית: orbit-il.com מוגש מריפו אחר ומפגר עד 24 שעות

**התסמין (חזר 3 פעמים בסשן):** אחרי מיזוג ל-main, `github.io/maor-system/version.json` התחלף
תוך דקה — אבל `orbit-il.com/version.json` הציג build של 07:24 גם 17 שעות אחר-כך (etag שונה,
`age:0`, `x-cache:MISS` ⇒ **לא מטמון-קצה**; המקור עצמו שונה).

**האבחון (ראיות):**
- ל-maor-system אין deploy-Pages ב-07:24 UTC ב-2.9 (רק 13:10/13:15/23:27).
- `list_repos` חשף ריפו `meir7651231-ui/orbit-il`, ‏pushed_at = **07:24:19** — התאמה מדויקת ל-build-id.
- הריפו מכיל רק `.github/workflows/deploy.yml` + README: ‏checkout `maor-system@main` ⇒ `npm run build` ⇒
  `dist/CNAME=orbit-il.com` ⇒ push-f ל-gh-pages שלו. טריגרים: push ל-main **שלו** (README-בלבד),
  `workflow_dispatch`, ו-**`schedule: '0 3 * * *'`** (03:00 UTC; ‏GitHub מאחר cron בשעות תחת עומס — לכן 07:24).
- GitHub Pages כובל דומיין-מותאם לריפו **אחד** בחשבון ⇒ ה-CNAME ב-gh-pages של maor-system (מ-`public/CNAME`)
  לא-פעיל; הדומיין שייך ל-orbit-il.

**המשמעות:** "מוזג ⇒ חי" לא נכון ללקוח-החי. כל אימות-פריסה שנעשה מול github.io היה אמת-חלקית.
כל תיקון-דחוף (למשל 4 הבאגים של 1.9) הגיע ללקוחות רק בבוקר-למחרת.

**מה נעשה עכשיו:** תיעוד ב-CLAUDE.md (כללי-עבודה) + הפעלה ידנית של ה-workflow אחרי מיזוג ה-PR הזה.

**תיקון-קבע (הכרעת-בעלים — שתי דרכים):**
1. **הפשוטה (מומלץ):** ב-GitHub ← ריפו `orbit-il` ← Settings ← Pages ← להסיר את הדומיין; ואז ב-`maor-system`
   ← Settings ← Pages ← Custom domain = `orbit-il.com` ← Save ← Enforce HTTPS. מרגע זה `deploy.yml` של מאור
   (שכבר כותב CNAME) פורס ישירות ל-orbit-il.com תוך ~1 דקה. את ריפו orbit-il אפשר להשאיר/לארכב.
2. **החלופה:** PAT (fine-grained, ‏actions:write על orbit-il) כ-secret במאור + צעד `repository_dispatch` בסוף
   `deploy.yml` ⇒ המראה נבנית מיד אחרי כל מיזוג (עדיין build כפול).
