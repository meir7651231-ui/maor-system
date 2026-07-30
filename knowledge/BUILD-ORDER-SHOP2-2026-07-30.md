# 🛍 פקודת בנייה — שדרוגי חנות (SHOP2: מלאי · אישור תשלום · תוקף קופונים)

**מאת:** הארכיטקט · 30.7.2026 · **ענף:** `claude/what-do-you-see-bcxttj` · המשך ישיר ל-BUILD-ORDER-SHOP (אותם כללים, אותם גבולות קשיחים). קידומות commit: `חנות 9 ·`–`חנות 12 ·`.

## הכרעות הבעלים (30.7 — "כן הכל" על שלוש השאלות הפתוחות מ-AUDIT-SHOP)
10. **מלאי לרכיבים** — מונה כמות פר-רכיב, עם "נותרו N" והתרעת אפס.
11. **אישור על התשלום הסמלי** — מסמך להורדה פר-מימוש עם מספור רציף.
12. **תוקף קופונים** — ימי תוקף פר-רכיב-קופון, "בתוקף עד", והתרעת פקיעה.

**ברירות ארכיטקט (ניתנות לדריסה):**
- **האישור אינו קבלת מס.** סדרת מספור נפרדת `S-{shopReceiptSeq}` (רציפה, "רק עולה" בענן — כמו R-/D-), והמסמך נושא את הכיתוב **"אישור תשלום — אינו קבלה לצורכי מס"**. סדרות R-/D- הרציפות לקבלות-מס נשארות ללא נגיעה (הבידוד). חיבור לקבלות אמת = "אחר כך נעדכן".
- מלאי חסר (undefined) = בלי מעקב מלאי; אפס = אזל. מימוש כשהמלאי אזל **לא נחסם** — אזהרה רכה (שיקול משרדי).
- פקיעת קופון **לא חוסמת** מימוש — אזהרה רכה + פריט טיפול.

---

## אשכול 9 · מלאי לרכיבים (`חנות 9 ·`)

**קבצים:** `types/domain.ts` · `store/persist.ts` · `shop/lib.ts` · `CatalogTab/ProductForm/AssignmentsTab/HomeTab`.

1. `ShopComponent` מקבל `stock?: number` (הערה: "כמות במלאי — undefined = ללא מעקב; הנותר = stock פחות המימושים").
2. `migrate()` — ריפוי פר-רכיב: stock לא-סופי → מוסר (undefined); שלילי → 0.
3. `shop/lib.ts` — `componentRemaining(componentId: Id, productId: Id, assignments: readonly ShopAssignment[], stock: number | undefined): number | null` — ‏null כשאין מעקב; אחרת `stock − Σ מימושי הרכיב` בכל שיוכי המוצר (קטום ב-0). ‏+ ‏`needsCare` מקבל סוג `stockOut` — רכיב עם מעקב שהנותר בו 0 ומוצרו active.
4. UI: שדה "מלאי" ב-ProductForm (רשות, מספר); בכרטיס המוצר בקטלוג ובשורת הרכיב בשיוך — צ'יפ "נותרו N" (ירוק >2, כתום 1-2, אדום 0); RedeemModal מציג אזהרה רכה "⚠ המלאי אזל" כשהנותר 0 (לא חוסם).
5. **בדיקות:** componentRemaining על שני שיוכים לאותו מוצר; null בלי מעקב; קטימה ב-0; stockOut ב-needsCare; ריפוי מיגרציה.

## אשכול 10 · אישור תשלום סמלי (`חנות 10 ·`)

**קבצים:** `types/domain.ts` · `store/persist.ts` · `lib/cloud-diff.ts` (meta) · `lib/cloud-merge.ts` · `useApp.ts` · `RedeemModal/AssignmentsTab`.

6. `Db.shopReceiptSeq: number` (ברירת 1 ב-emptyDb; הערה: "מונה אישורי תשלום סמלי S- — רציף ונפרד; אינו קבלת מס"). `ShopRedemption.rid?: string`.
7. `migrate()` — ‏`shopReceiptSeq: db.shopReceiptSeq ?? base.shopReceiptSeq` + זריעה מ-`maxRid('S-', …)` על כל מימושי כל השיוכים (הדפוס הקיים של R-/D- בשורות ~149-163) + ייחודיות: rid ‏S- כפול ממוספר מחדש (דפוס seenR).
8. **ענן:** בכל מקום ש-receiptSeq/donationSeq מופיעים כמונים — הוסף shopReceiptSeq: ‏meta ב-cloud-diff · `bumpCounter('shopReceiptSeq')` ב-cloud-merge (~שורה 91, הרחב את הטיפוס) — "מונים רק עולים".
9. `addShopRedemption` — כשהמימוש נקלט ו-`paid > 0`: מנפיק `rid = 'S-' + shopReceiptSeq++` (אטומי בתוך setDb, כמו addDonation). מחזיר `{ ok, rid? }` — ה-UI לא מנחש rid (לקח באג-5).
10. UI: אחרי מימוש עם rid — טוסט "אישור S-N הונפק"; בשורת מימוש עם rid — כפתור `🧾 אישור` שמוריד דרך `downloadReceipt` מ-`lib/receipt` עם: `rid`, ‏orgName (config.orgName||db.orgName), ‏payer=beneficiaryLabel, ‏amount=paid, ‏date, ‏`forWhat` = "מימוש: <תווית הרכיב> (<שם המוצר>)" + **`taxReceipt: false` תמיד**, ובשורת forWhat מצורף "אישור תשלום — אינו קבלה לצורכי מס". אסור להעביר orgTaxId/signatory (שדות ה-§46).
11. **בדיקות:** rid מונפק רק כש-paid>0 (‏paid=0 ⇒ בלי rid, בלי קידום מונה); רציפות S-1,S-2; זריעת מיגרציה מ-S- קיים; bumpCounter לא מקטין; **ratchet בידוד מורחב:** addShopRedemption עם paid>0 לא משנה receiptSeq/donationSeq (ה-S- חי לבד); הגנת-מקור — קריאת downloadReceipt בחנות בלי `taxReceipt: true` ובלי orgTaxId.

## אשכול 11 · תוקף קופונים (`חנות 11 ·`)

**קבצים:** `types/domain.ts` · `store/persist.ts` · `shop/lib.ts` · `ProductForm/AssignmentsTab/RedeemModal`.

12. `ShopComponent` מקבל `validDays?: number` (רלוונטי ל-kind==='coupon'; ‏undefined/0 = ללא תוקף). ריפוי: לא-סופי → מוסר; שלילי → 0.
13. `shop/lib.ts` — `couponExpiry(a: ShopAssignment, comp: ShopComponent): IsoDate | ''` — ‏'' כשאין validDays או אין a.since; אחרת since ‎+ validDays (חישוב ב-T12:00:00 + isoOf). ‏`needsCare` מקבל סוג `couponExpired` — קופון שלא מומש ופג (expiry < today) בשיוך active; ה-hint כולל את תאריך הפקיעה.
14. UI: שדה "ימי תוקף" ב-ProductForm (מוצג רק כשהסוג קופון); בשורת קופון בשיוך — "בתוקף עד X" (אדום כשפג); RedeemModal — אזהרה רכה "⚠ הקופון פג ב-X" (לא חוסם).
15. **בדיקות:** couponExpiry — יום הגבול עצמו בתוקף, למחרת פג; '' בלי since/validDays; couponExpired ב-needsCare (פג-ומומש לא מופיע).

## אשכול 12 · סגירה (`חנות 12 ·`)

16. **e2e** — הרחבת זרימת החנות הקיימת ב-toggle-matrix: המוצר נוצר עם מלאי 3 ⇒ אחרי המימוש מופיע "נותרו 2"; המימוש (paid 50) מציג "אישור S-1". שלוש הסוויטות (build קודם).
17. **ידע:** ‏`CLOSED-SHOP2-2026-07-30.md` קצר · עדכון CLAUDE.md (שורת מודול החנות: + מלאי/אישורי S-/תוקף; המונים: seq + receiptSeq/donationSeq + shopReceiptSeq) · עדכון DECISIONS (הכרעות 10-12 + ברירות הארכיטקט).
18. **DoD:** verify ירוק · שלוש סוויטות ירוקות · כל בדיקות הקופות והחנות הקיימות ירוקות ללא שינוי · אפס נגיעה ב-R-/D- (מוכח ב-ratchet).

---

**גבולות קשיחים:** כמו BUILD-ORDER-SHOP סעיף אחרון, ובנוסף: אסור ש-S- ייגע ב-receiptSeq/donationSeq או יסומן taxReceipt; שאלות מוצר חדשות — לדוח, לא להכרעה.
