# אינוונטר מלא · מסך התורמים (origin/main, 19.8.2026)

> מקור-האמת לכל יכולת שקיימת **היום** במסך התורמים. חולץ שורה-אחר-שורה מ-12 קבצי
> המסך החי ב-`origin/main` (‏HEAD 04b5b49, PR #231). האינווריאנט העליון: **אפס
> אובדן יכולת** — כל פריט כאן חייב בית בעיצוב החדש. אם זה לא ברשימה, זה לא נמפה.

קבצים: `SupportersView` (901) · `SupporterDetail` (733) · `lib` (706) ·
`DonationModal` (188) · `IncomingPayments` (319) · `NedarimSyncModal` (220) ·
`SupDedupModal` (177) · `SupporterForm` (170) · `SupporterImport` (205) ·
`DonationCalendar` (290) · `AyinBoard` (248) · `AyinCard` (491).

---

## A · מסך הרשימה (SupportersView)

### A1 · תצוגה/מבט
- טוגל **☰ רשימה / ▦ גריד** — נשמר ב-`db.ui.supView`; ברירת-מחדל חכמה: מסך צר (≤760px) בלי העדפה ⇒ גריד.
- **טבלה** עד ~14 עמודות ממוינות + פילטר-שורה פר-עמודה + גלילה-צידית (`hscroll` scroll-shadow).
- **גריד** — כרטיסים ידידותיים-למגע: נקודת-דרגה צבעונית, שם, אייקון-הו״ק 🔁, קטגוריה, טלפון, "N תרומות · סה״כ · אחרונה", "☎ קשר הבא".
- עמודות: תומך/ת · קטגוריה · טלפון · אימייל · תרומות · סה״כ ₪ · סה״כ $ · תרומה-אחרונה · קשר-הבא(nextOn) · ציון-RFM(rfmOn) · שלב-טיפול(ayinOn) · כמות/eyes(ayinOn) · שולם(ayinOn) · דרגה-TierChip(rfmOn) · פעולות(📞/💬). כותרות מונחיות דרך `termOf`/`unitLabel`.

### A2 · חיפוש וסינון
- **חיפוש חופשי** — שם/טלפון/מייל/קטגוריה/כתובת/ייעוד (התאמת-טלפון על ספרות ≥3).
- **בורר קטגוריה** — "כל הקטגוריות" + קטגוריות ייחודיות.
- **בורר ייעוד** (`supporters.purpose`) — "כל הייעודים" + כל ייעוד עם 🔐; עובד-מוגבל ננעל לייעודו.
- **פאנל "🔎 סינון מתקדם"** מתקפל + באדג׳ מספר-פעילים:
  - צ׳יפי **דרגות RFM** (rfmOn): זהב/כסף/ארד/רדומה + מונה פר-דרגה.
  - צ׳יפי **הו״ק** (hokOn): 🔁 פעילות·N · ⏳ טרם-נרשמו-החודש·N.
  - צ׳יפי **מעקב-טיפול** (ayinOn): עם-מונה · בלי-מונה · עודכן-היום·N.
- **פילטרים פר-עמודה** (`numMatch` N/N+/N-M): תרומות(count) · סה״כ-₪-שקול(total) · ציון(score).
- מונה תוצאות "X מתוך Y".

### A3 · מיון
- **תלת-מצבי** (▲→▼→כבוי) על כל כותרת; זמין ל-name/cat/phone/email/count/ils/usd/last/nextDate/score/stage/eyes/paid; `aria-sort`.

### A4 · פעולות פר-תורם
- פתיחת כרטיס (קליק/Enter/רווח) · **📞 חיוג-ישיר** (`supporters.click2call`) · **💬 וואטסאפ** (`whatsapp`) · צ׳ק-בוקס-בחירה · אינדיקטור-הו״ק 🔁 עם title.

### A5 · פעולות אצווה/כלליות
- **➕ הוספת תומך/ת** · **מצב בחירה-מרובה** (☑ בחירה / בחר-הכל / נקה) + סרגל-דביק.
- **🗑 מחיקת N** (מודל-אישור הרסני) · **🏷 שיוך-ייעוד·N** (purpose+admin) · **📞 חייגן מונחה** (telephony).
- תפריט **⋯ עוד פעולות**: ⬆ ייבוא-CSV(import) · 📊 דו״ח-מותאם(customreport) · 📄 דוחות-שנתיים-לכולם(annualreport) · 📋 דוח-יומי(ayin+dailyreport) · 📥 דוח-שמות-למנהל(ayin+admin) · 🔗 איחוד-כפולים·N(dedup>0) · 📣 לקמפיין-הגיוס(campaign).
- **💰 תשלומים-נכנסים** (payments+cloud) · **🔄 סנכרון-מנדרים** (payments+cloud).

### A6 · אינדיקטורים/סיכומים
- כותרת-KPI: "X מתוך Y משפחות-תומכות · סה״כ ₪TOT + $TOT" (כולל hist דרך supIls/supUsd).
- דרגות-RFM עם מונה · TierChip פר-שורה · נקודת-דרגה בגריד.
- סטטים-RFM: "תרמו ב-12 החודשים · ממוצע-לתרומה".
- **היסטוגרמת פיזור-ציון** (10 סלים 0–999) · מונה-כפולים · מונה-תוצאות.

### A7 · לוחות משובצים
- **🩺 לוח מעקב-הטיפול** מתקפל (ayin) → `AyinBoard`.
- **🗓 לוח התרומות הכללי** מתקפל (doncal) → `OrgDonationCalendar`.

### A8 · פתיחה חיצונית
- `supFormReq` (פלטה→טופס) · `supOpenReq` (פלטה→כרטיס לפי id).

---

## B · כרטיס התורם (SupporterDetail)

### B1 · ראש
- אווטאר (אות ראשונה/💛) · שם · שבב-דרגה+tooltip-ציון (rfm) · שורת-סטטיסטיקה (N תרומות · סה״כ · מ-DATE · אחרונה DATE).

### B2 · כרטיס-פרטים
- טלפון · אימייל · כתובת · ת״ז · קטגוריה · ייעוד(forWho) · הערות. ריק=—, LTR לפרטי-קשר.

### B3 · פעולות-קשר
- 📞 חיוג(telephony) · 💬 וואטסאפ(whatsapp) · 💳 עמוד-תרומה(payments) · 📱 SMS(sms+cloud) · 🤖 מכתב-תודה-AI(ai+key).

### B4 · טבלת-היסטוריה
- כותרת+מונה · ➕ רישום-תרומה · עמודות תאריך/עברי/סכום/קטגוריה/מקור(hist)|קבלה.
- מיזוג קבלות+hist (histOn) דרך `supDonEvents`; מטא-דאטת-סליקה (עסקה/אסמכתא/מותג/4-ספרות/סולק/תשלומים/סטטוס).
- קליק-שורה ⇒ מיקוד-יום בלוח-האישי · קיטום-תצוגה 60 ("הכול נשמר וזמין בייצוא").
- פר-שורה (rid+receipts): 🧾 הורדה-חוזרת(copy) · 📧 מייל(mail+cloud+email).

### B5 · קבלות מס
- פורמט txt/PDF(`receiptFmtOf`) · קוד-אימות(verifycode) · סימון-העתק(copymark) · §46(taxreceipt) · שם-ארגון/ח.פ/חתימה/ת״ז-משלם.

### B6 · הוראת-קבע (hok)
- כרטיס "הוראת קבע 🔁": הגדרה/עריכה · סכום+יום+אמצעי+הערה+פעילה · "✓ חיוב-החודש נרשם" / 🔁 רישום-חיוב-החודש.
- **HokModal**: סכום · מטבע(multicur) · יום 1–28 · אמצעי(בנקאית/אשראי/מזומן/אחר) · הערה · פעילה · שמירה/🗑 הסרה/ביטול.

### B7 · לוח-תרומות-אישי (DonationCalendar, doncal)
- גריד-חודשי לועזי+גימטריה · ניווט חודשים+חזרה · טוגל **לוח-עברי** · שורת-סיכום-חודש · צביעת-תאים (היום/תרומות/יעד+מעקב) · רשימת-יום · מיקוד-חיצוני(focusIso) · קריאה-בלבד.

### B8 · עריכה
- ✎ עריכה → `SupporterForm`.

### B9 · תודות/AI/דוחות
- 📞 תודה(thankyou→אירוע-לוח) · 🤖 מכתב-תודה-AI(askClaude, העתקה/נסח-מחדש) · 📄 דוח-שנתי(annualreport→txt).

### B10 · ניווט/מודלים
- ➕ רישום-תרומה→DonationModal(canIssue) · ✎→SupporterForm · 🗑 מחיקה-דו-שלבית(+unlink יעד) · HokModal · SMS-modal · AI-modal · StickyBackBar · קשר-הבא 🎯(nextdate, HebDateInput→אירוע-call, unlink בניקוי).

### B11 · מעקב-טיפול
- `AyinCard` (ayin) — כרטיס-טיפול מלא (ר׳ חלק E).

---

## C · מנוע האנליטיקה (lib.ts) — כל פונקציה מיוצאת

**תאריך/פורמט:** fmtDate · isoToday · fixPhone · chipStyle · normName.
**הרשאות-ראוּת פר-ייעוד:** supporterPurposes · supporterVisibleForDesignations · visibleSupportersForDesignations · allDonationPurposes.
**צבירות (כולל hist):** supIls · supUsd · supCount · supLast · supTotalIls(rate).
**RFM:** supScore(0–1000) · supTier · TIER_ORDER · SupTier.
**אנליטיקת-אוכלוסייה:** supScoreBins(10 סלים) · supAvgDon · sup12m.
**תווית-כספית:** totalLabel ("₪X + $Y").
**אירועי-תרומה/לוח:** SupDonEvent · supDonEvents · SupCalEntry · personalCalEntries · orgCalEntries · donCalMonthLine.
**ייבוא:** SupporterImportRow · SUP_NAME_KEYS · excelSerialToIso · parseSupporterGrid · parseSupporterCsv · SupporterImportPlan · applyAyinNames · HistEntry · mergeHist · planSupporterImport · mergeSupporterRow · newSupporterFromRow.
**הו״ק:** HOK_CAT · hokRecordedThisMonth · hokDue · hokMonthlyTotal · hokMethodLabel.

---

## D · המודלים (workflows)

### D1 · תרומה חדשה (DonationModal)
- תאריך(HebDateInput) · סכום(>0) · מטבע(multicur) · קטגוריה(+צ׳יפים עד-5) · designation "אמץ חתן"(sponsor) · ייעוד/purpose(+צ׳יפים עד-8).
- `addDonation`→rid · הנפקת-קבלה(receipts: §46/verify/copy/פרטי-ארגון/ת״ז) · מייל-אוטומטי(mail+cloud+email→mailOutbox) · טוסטים.

### D2 · תשלומים נכנסים (IncomingPayments)
- טעינה `fetchIncomingPayments` · תקרת-תצוגה 300.
- **🔗 מזג-אוטומטית-את-כל-הממתינים(N)** — `autoMatchCharges` על **כל** הערימה (לא רק המוצג; PR #231).
- בחירה-מרובה: 🔗 מזג-אוטומטי · ✓ סמן-שנרשמו · נקה.
- פר-שורה: 🔗 מזג-לכרטיס(MergeView) · נרשם ✓.
- **MergeView**: מועמדים-אוטומטיים(candidateSupportersForCharge) / חיפוש-חופשי · השוואת-שדות תשלום↔כרטיס(CmpRow ✓ירוק) · שיוך דו-לחיצה.

### D3 · סנכרון נדרים (NedarimSyncModal)
- 🔁 זהה-הו״ק-רטרואקטיבי(detectNedarimHok, 3+ חודשים; ידני לא-נדרס).
- 🔄 אפס-הכל-מנדרים(resetNedarimImport; קבלות מקוריות לא-נגעות).
- תצוגה-מקדימה (ToremId→ת״ז→טלפון→אימייל→שם+עיר) · לוח-מונים 6 · שורת-סכומים · דגימת-שמות · 🔄 בצע-סנכרון דו-שלבי → hist[] (נדרים מנפיק §46 ⇒ מונים לא-נגעים).

### D4 · מיזוג כפולים (SupDedupModal)
- מפתחות: טלפון/אימייל/ת״ז/ToremId/שם+עיר · בחירת-שומר(רדיו, ברירת-מחדל רב-תרומות).
- 🔗 מזג-קבוצה(mergeSupportersGroup; כסף לא-נמחק) · 🧩 מיזוג-שדה-שדה(dedup.fields) · 🗑 הסרת-רשומה.

### D5 · טופס תורם (SupporterForm)
- שם* · טלפון(fixPhone) · אימייל · ת״ז(validIsraeliId) · כתובת · עיר · קטגוריה · ייעוד(purpose+צ׳יפים) · הערות · מניעת-כפילות · `upsertSupporter`.

### D6 · ייבוא (SupporterImport)
- CSV + xlsx(fflate lazy) + הדבקת-טקסט · UTF-8/windows-1255 · עמודות שם*/טלפון/אימייל/ת״ז/כתובת/קטגוריה/עבור + 11 עמודות-סליקה→hist.
- ⬇ תבנית · הצלבה-לפי-שם · דו-שלבי(import.preview) · applyAyinNames · טוסטים.

---

## E · מנוע העין / פרויקטים (AyinBoard + AyinCard)

### E1 · AyinBoard (לוח-משפך)
- כותרת+מונה-פעילים · סינון-שלב · מיון(🎯 יעד-קרוב/עדכון-אחרון/שם/שלב) · קיפול.
- שורה: שם · StageChips(הושלם✓/נוכחי/עתידי) · שורת-שמות(·eyes) · יעד-קרוב · עדכון-אחרון · הכפתור-החכם.
- קליק→onOpen · ראוּת-ייעוד.

### E2 · AyinCard (כרטיס-פרויקט)
- שלבי-משפך(revert לשלב-שהושלם) + הכפתור-החכם(advance).
- **פריטים-למעקב**: הוספה(שם+מונה) · מונה/כמות · הערת-טקסט · [BOQ: ₪-ליח׳+סכום-שורה] · ✓/✗ · 🗑 · שורת-סיכום.
- **תבניות-הצעה**(BOQ): 📋 החל · ✕ מחק · 💾 שמור-כתבנית.
- **⏱️ שעתון**(time): שעות×₪/שעה+תיאור · סיכום-עלות-עבודה.
- **🧱 חומרים**(mat): כמות×₪-ליח׳ · סיכום.
- **💰 P&L**(pnl=boq|time|mat): הצעה−עלות=רווח-גולמי · נגבה/יתרה.
- **תשובות/הערות** · **מתי-לדבר-שוב**(HebDateInput+שעה+🔁) · **היסטוריית-מונה**(30) · **↻ מחזור-חדש**.
- דגלים: ayin.boq/time/mat · הסתרה מלאה ב-`core.taxreceipt` (מסחרי-בלבד).

---

## F · דגלי-פיצ׳ר שמגדרים יכולות (סיכום)
supporters.rfm · nextdate · ayin · ayin.dailyreport · ayin.boq · ayin.time · ayin.mat ·
customreport · annualreport · purpose · hok · doncal · multicur · hist · sponsor · thankyou ·
click2call · import · import.preview · settings.dedup.fields ·
core.receipts · taxreceipt · receipt.verifycode · receipt.copymark ·
integrations: whatsapp · payments · campaign · ai · sms · mail · telephony ·
cloud(enabled+user) · isAdminUser · canIssueReceipt · allowedDesignations.

---

## סה״כ: ~150+ יכולות בדידות. **כל אחת חייבת בית בעיצוב החדש.**

---

## שלב 1 · חלון-העבודה (הקוקפיט) — נבנה 19.8.2026

מנוע-ההעצמה הראשון של התוכנית הגרנדיוזית. **אפס אובדן · אפס שינוי-סכמה · opt-in מלא.**

- **מנוע טהור** `src/components/supporters/cockpit.ts` — נגזרת דטרמיניסטית של `db.supporters`
  (היום מוזרק, בלי `Date.now`): `cockpitKpis` (תורמים/נגבה-החודש/צפוי-מהו״ק/בסיכון) ·
  `cockpitCalls` (יעד-שעבר ∪ בסיכון-נטישה, סיבה לכל אחת) · `cockpitThanks` (תרומה טרייה) ·
  `cockpitHokTasks` (עוטף `hokDue` הקיים) · `cockpitQueue`/`cockpitProgress`. נשען כולו על
  `lib.ts` הקיים (‏hokDue/hokMonthlyTotal/supLast/supIls/supUsd/supCount).
- **תצוגה** `SupportersCockpit.tsx` — רצועת-KPI + תור-משימות עם לחיצה-אחת (חייג/וואטסאפ/פתח-כרטיס
  + "✓ בוצע" מקומי + פס-התקדמות). פעולות-קשר מגודרות כמו בשאר המסך (whatsapp/click2call).
- **חיווט** ב-`SupportersView` — מתג "🎯 חלון העבודה / ☰ מסך הנתונים", ניתוב-לכרטיס דרך `setSelId`.
- **הפעלה (opt-in):** בקונפיג הארגון `features: { "supporters.cockpit": true }`.
  ⚠️ הגידור `=== true` **במכוון** ולא `featureOn` — כי `featureOn` ברירת-מחדל 'on' ⇒ היה
  מדליק לכל לקוח-חי. חסר-הדגל ⇒ אפס-השפעה על הפרודקשן. ננעל ב-ratchet
  `__tests__/cockpit-wiring.test.ts`.
- **בדיקות:** `cockpit.test.ts` (12) + `cockpit-wiring.test.ts` (5) — הגנות-מקור על ה-opt-in.
