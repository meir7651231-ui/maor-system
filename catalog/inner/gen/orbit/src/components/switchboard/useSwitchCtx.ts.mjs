// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/switchboard/useSwitchCtx.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$useWatchedDb$keysKey(keys) {
    const keysKey = keys.join('|');
    return keysKey;
}
export function inner$useSwitchCtx$idsKey(ids) {
    const idsKey = ids.join('|');
    return idsKey;
}

export const SIGS = {
  inner$useWatchedDb$keysKey: [{"name":"keys","d":{"t":"arr","of":{"t":"lit","v":["families","supporters","deliveries","distributionDays","courses","reports","v","savedAt","seq","receiptSeq","donationSeq","shopReceiptSeq","enrollments","events","rooms","teachers","tzCoordinators","tzBoxes","tzCampaigns","tzEvents","shopItems","shopProducts","shopStores","shopCriteria","shopAssignments","shopEvents","shopIntakes","volunteers","tasks","warehouse","prListings","prRequests","prPosts","prAds","hostUnits","hostBookings","hostRecords","orgName","orgSite","orgDonate","orgGoal","budget","usdRate","notif","ui","attnDone","security","audit","delLog"]}},"opt":false}],
  inner$useSwitchCtx$idsKey: [{"name":"ids","d":{"t":"arr","of":{"t":"lit","v":["hosting.today","hosting.availability","parnasa.findPro","parnasa.shabbat","parnasa.minyanim","parnasa.emergency","calendar.dayInfo"]}},"opt":false}],
};
