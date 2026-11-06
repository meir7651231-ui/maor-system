## מה השתנה · What changed


## למה · Why


## בדיקות · Testing
- [ ] `npm run verify` ירוק · green (typecheck · lint · test · build)
- [ ] נוספה/עודכנה בדיקת ratchet לבאג שתוקן · ratchet test added for a fixed bug
- [ ] נבדק בדפדפן מול `?org=demo` · checked in the browser on `?org=demo`

## סיכון · Risk
- [ ] נוגע בכסף, בקבלות או במוני הרציפות · touches money, receipts or sequence counters
- [ ] נוגע בסנכרון ענן או ב-`firestore.rules` · touches cloud sync or rules
- [ ] נוגע ב-`.github/workflows/` (פריסה) · touches deployment workflows
- [ ] דגל חדש: opt-in מפורש `=== true` או ברירת-מחדל פעילה? · new flag: explicit opt-in or default-on?

## צילומי מסך · Screenshots
<!-- מהדמו בלבד, בלי נתונים אמיתיים · demo data only -->

**CI על main · CI on main:** ✅ / ❌ — <!-- קישור לריצה האחרונה על main · link to the latest main run -->
