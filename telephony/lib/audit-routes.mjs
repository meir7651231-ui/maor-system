// ─────────────────────────────────────────────────────────────────────────────
// telephony · audit-routes — אורקל סגירת-מסלולים (route-closure).
//
// golden מקפיא בייטים, לא נכונות-ניתוב. כאן אורקל-סמנטי טהור שמצליב מבנית את
// שלושת הקבצים (dialplan/directory/gateways) בלי מפרש-FreeSWITCH — regex-צולב —
// ומוודא שכל הבטחת-ניתוב ב-XML יש לה יעד-קיים ונגיש:
//   · כל bridge ל-user/<ext>@ ⇒ קיימת רשומת-<user id="<ext>"> ב-directory
//     (gsr יתום = כשל-שקט בפרודקשן: ההודעה/השיחה נופלת בלי אזהרה).
//   · כל transfer ל-<label> XML ⇒ קיים <extension name="<label>"> בדיאלפלן.
//   · כל bridge ל-sofia/gateway/<gw>/ ⇒ קיים <gateway name="<gw>"> בשער.
// יעדים דינמיים (user/$1, ivr_opt_${...}) מדולגים במכוון (אינם ניתנים-להצלבה-סטטית).
//
// טהור, אפס-תלויות. downstream (מנתח מחרוזות-פלט בלבד, אין הנחת-ספק).
// ─────────────────────────────────────────────────────────────────────────────

/** אוסף קבוצת-התאמות (capture 1) של regex גלובלי על מחרוזת. */
function allMatches(str, re) {
  const out = [];
  for (const m of String(str || '').matchAll(re)) out.push(m[1]);
  return out;
}

/**
 * מצליב את הקבצים שחולל generateConfig ומחזיר הפרות-סגירה.
 * @param {{files:Record<string,string>, manifest?:object}} bundle תוצר generateConfig
 * @returns {{ok:boolean, dangling:Array, orphanTransfers:Array, missingGateways:Array}}
 *   dangling = bridge לשלוחה בלי רשומת-directory · orphanTransfers = transfer ל-label
 *   שאין לו extension · missingGateways = bridge לשער שאין לו רשומת-gateway.
 */
export function auditRoutes(bundle) {
  const files = (bundle && bundle.files) || {};
  const dialplan = Object.entries(files).find(([p]) => p.startsWith('dialplan/'));
  const directory = Object.entries(files).find(([p]) => p.startsWith('directory/'));
  const gateways = Object.entries(files).find(([p]) => p.startsWith('sip_profiles/gateways/'));
  const dp = dialplan ? dialplan[1] : '';
  const dir = directory ? directory[1] : '';
  const gw = gateways ? gateways[1] : '';

  // רשומות-קיימות.
  const userIds = new Set(allMatches(dir, /<user id="([A-Za-z0-9_]+)"/g));
  const gatewayNames = new Set(allMatches(gw, /<gateway name="([A-Za-z0-9_]+)"/g));
  // יעדי-transfer מגיעים לפי תנאי-destination_number, לא לפי שם-ה-extension:
  // ‏line_n3 מנותב ע״י ה-extensions ששמם line_n3_closed/_w1/_default שכולם תופסים
  // ‏^line_n3$. לכן קבוצת-היעדים-הנגישים = כל תנאי destination_number מצורת ^label$.
  const reachable = new Set(allMatches(dp, /field="destination_number" expression="\^([A-Za-z0-9_]+)\$"/g));

  const dangling = [];
  const orphanTransfers = [];
  const missingGateways = [];

  // (1) גשרי-שלוחה: user/<ext>@ — רק ליטרליים (בלי $/משתנה).
  for (const ext of allMatches(dp, /user\/([A-Za-z0-9_]+)@/g)) {
    if (!userIds.has(ext) && !dangling.includes(ext)) dangling.push(ext);
  }
  // (2) transfer ל-label סטטי: data="<label> XML tenant_..." — דינמיים (${..}) מדולגים.
  //     היעד נגיש אם קיים תנאי destination_number שתופס ^label$.
  for (const label of allMatches(dp, /data="([A-Za-z0-9_]+) XML tenant_/g)) {
    if (!reachable.has(label) && !orphanTransfers.includes(label)) orphanTransfers.push(label);
  }
  // (3) גשרי-שער: sofia/gateway/<gw>/ — כל השערים ליטרליים.
  for (const g of allMatches(dp, /sofia\/gateway\/([A-Za-z0-9_]+)\//g)) {
    if (!gatewayNames.has(g) && !missingGateways.includes(g)) missingGateways.push(g);
  }

  return {
    ok: dangling.length === 0 && orphanTransfers.length === 0 && missingGateways.length === 0,
    dangling,
    orphanTransfers,
    missingGateways,
  };
}
