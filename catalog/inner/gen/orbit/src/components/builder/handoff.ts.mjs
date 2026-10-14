// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/builder/handoff.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const INTEGRATION_LABELS = {
    receipts: '🧾 קבלות אוטומטיות + סעיף 46',
    payments: '💳 סליקה והוראות קבע',
    whatsapp: '💬 הודעות וואטסאפ',
    sms: '📱 הודעות SMS',
    phone: '📞 מערכת טלפונית (ימות המשיח)',
    gcal: '📅 ייצוא ליומן Google/Outlook (ICS)',
    drive: '☁️ גיבוי ענן אוטומטי',
    sheets: '📊 גיליון חי להנהלה',
    maps: '🗺️ מפות ומסלולי חלוקה',
    esign: '✍️ חתימה דיגיטלית',
    ai: '🤖 עוזר חכם (AI)',
    campaign: '📣 חיבור קמפיין גיוס',
    mail: '📧 קבלות ותזכורות במייל',
    gcontacts: '📇 סנכרון אנשי-קשר ל-Google',
};
const INTEGRATION_STATUS = {
    whatsapp: 'live', // wa.me — src/lib/wa.ts
    maps: 'live', // Google Maps links — src/lib/mapsLink.ts
    gcal: 'live', // ICS — src/lib/ics.ts + calLib.icsWindowEvents
    // גל ג׳ "עד-המפתח" (4.8.2026): ארבע עלו ל-live — עובדות ברגע שהבעלים מזין מפתח/URL
    payments: 'live', // קישורי-תשלום — lib/payLink.ts (המפתח: payUrl של הארגון)
    ai: 'live', // עוזר-AI — lib/ai.ts (המפתח: API-key מקומי-למכשיר)
    esign: 'live', // חתימה-על-מסך — SignaturePad (בלי ספק בכלל)
    campaign: 'live', // קישור-קמפיין — safeHttpsUrl (המפתח: URL)
    receipts: 'included', // §46 במודול תורמים (receipt.ts)
    drive: 'included', // 3 שכבות גיבוי + סנכרון-ענן opt-in
    sheets: 'roadmap', // שרת-מוכן-בריפו (functions/) — ממתין ל-Blaze+deploy
    sms: 'roadmap', // שרת-מוכן-בריפו (functions/)
    phone: 'roadmap', // שרת-מוכן-בריפו (functions/)
    mail: 'roadmap', // צרור-הלילה — mailOutbox בשרת (functions/), ממתין ל-Blaze+deploy
    gcontacts: 'roadmap', // People API בשרת (functions/gcontactsSync) — ממתין ל-OAuth של הבעלים
};
function esc(s) {
    // כולל גרשיים — הגנה גם אם עריכה עתידית תשים פלט esc בתוך attribute (ביקורת 4.8)
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
const HANDOFF_DOW = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'שבת'];
const TEL_KIND_LABEL = { sim: 'SIM בשער', virtual: 'הפניה', whatsapp: 'ווצאפ' };
export function inner$moduleDisplayName$override(cfg, k) {
    const override = cfg.terms?.[`nav.${k}`]?.trim();
    return override;
}
export function inner$quoteSection$incl(quote) {
    const incl = quote.included.length
        ? `<p style="font-size:13px;color:#777">כלול בבסיס ללא תוספת: ${quote.included.map((l) => esc(l.label)).join(' · ')}</p>`
        : '';
    return incl;
}
export function inner$telephonySection$lines(t) {
    const lines = t.numbers.filter((n) => n.e164.trim());
    return lines;
}
export function inner$telephonySection$numRows(t) {
    const lines = t.numbers.filter((n) => n.e164.trim());
    const numRows = lines
        .map((n) => `<li>${esc(n.label)} — <span dir="ltr">${esc(n.e164)}</span> <small>(${esc(TEL_KIND_LABEL[n.kind] ?? n.kind)}${n.kosher ? ' · כשר' : ''})</small></li>`)
        .join('');
    return numRows;
}
export function inner$telephonySection$numRows$$step(lines) {
    const numRows = lines
        .map((n) => `<li>${esc(n.label)} — <span dir="ltr">${esc(n.e164)}</span> <small>(${esc(TEL_KIND_LABEL[n.kind] ?? n.kind)}${n.kosher ? ' · כשר' : ''})</small></li>`)
        .join('');
    return numRows;
}
export function inner$telephonySection$days(t) {
    const days = t.officeDays.length ? t.officeDays.map((d) => HANDOFF_DOW[d] ?? d).join(', ') : '—';
    return days;
}
export function inner$telephonySection$closures(t) {
    const closures = [t.hebrewCalendar && 'חגים', t.shabbat && 'שבת', t.fasts && 'צומות'].filter(Boolean).join(' · ');
    return closures;
}
export function inner$telephonySection$extras(t) {
    const closures = [t.hebrewCalendar && 'חגים', t.shabbat && 'שבת', t.fasts && 'צומות'].filter(Boolean).join(' · ');
    const extras = [closures && `סגירה אוטומטית: ${closures}`, t.kosherMode && 'מצב כשר (יציאה)'].filter(Boolean).join(' · ');
    return extras;
}
export function inner$telephonySection$extras$$step(t, closures) {
    const extras = [closures && `סגירה אוטומטית: ${closures}`, t.kosherMode && 'מצב כשר (יציאה)'].filter(Boolean).join(' · ');
    return extras;
}
export function inner$buildHandoffHtml$url(cfg, appUrl) {
    const url = cfg.slug === 'default' ? appUrl : `${appUrl}${appUrl.includes('?') ? '&' : '?'}org=${cfg.slug}`;
    return url;
}
export function inner$buildHandoffHtml$sold(cfg) {
    const sold = Object.entries(cfg.integrations ?? {}).filter(([, v]) => v.enabled);
    return sold;
}
export function inner$buildHandoffHtml$liveSold(cfg) {
    const sold = Object.entries(cfg.integrations ?? {}).filter(([, v]) => v.enabled);
    const liveSold = sold.filter(([k]) => INTEGRATION_STATUS[k] === 'live');
    return liveSold;
}
export function inner$buildHandoffHtml$liveSold$$step(sold) {
    const liveSold = sold.filter(([k]) => INTEGRATION_STATUS[k] === 'live');
    return liveSold;
}
export function inner$buildHandoffHtml$roadSold(cfg) {
    const sold = Object.entries(cfg.integrations ?? {}).filter(([, v]) => v.enabled);
    const roadSold = sold.filter(([k]) => INTEGRATION_STATUS[k] === 'roadmap');
    return roadSold;
}
export function inner$buildHandoffHtml$roadSold$$step(sold) {
    const roadSold = sold.filter(([k]) => INTEGRATION_STATUS[k] === 'roadmap');
    return roadSold;
}
export function inner$buildHandoffHtml$integrations(cfg) {
    const sold = Object.entries(cfg.integrations ?? {}).filter(([, v]) => v.enabled);
    const liveSold = sold.filter(([k]) => INTEGRATION_STATUS[k] === 'live');
    const roadSold = sold.filter(([k]) => INTEGRATION_STATUS[k] === 'roadmap');
    const integrations = liveSold.length || roadSold.length
        ? `<h2>🔌 הרחבות</h2>
         ${liveSold.length ? `<ul>${liveSold.map(([k]) => `<li>${esc(INTEGRATION_LABELS[k] ?? k)} — <b>פעיל</b></li>`).join('')}</ul>` : ''}
         ${roadSold.length ? `<p style="font-size:13px;color:#777">בפיתוח (יופעלו עם השקתם, ללא חיוב היום): ${roadSold.map(([k]) => esc(INTEGRATION_LABELS[k] ?? k)).join(' · ')}</p>` : ''}`
        : '';
    return integrations;
}
export function inner$buildHandoffHtml$integrations$$step(liveSold, roadSold) {
    const integrations = liveSold.length || roadSold.length
        ? `<h2>🔌 הרחבות</h2>
         ${liveSold.length ? `<ul>${liveSold.map(([k]) => `<li>${esc(INTEGRATION_LABELS[k] ?? k)} — <b>פעיל</b></li>`).join('')}</ul>` : ''}
         ${roadSold.length ? `<p style="font-size:13px;color:#777">בפיתוח (יופעלו עם השקתם, ללא חיוב היום): ${roadSold.map(([k]) => esc(INTEGRATION_LABELS[k] ?? k)).join(' · ')}</p>` : ''}`
        : '';
    return integrations;
}

export const SIGS = {
  inner$moduleDisplayName$override: [{"name":"cfg","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false},{"name":"k","d":{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},"opt":false}],
  inner$quoteSection$incl: [{"name":"quote","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Quote","p":[["lines",{"t":"arr","of":{"t":"obj","n":"QuoteLine","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["price",{"t":"num"},false],["kind",{"t":"lit","v":["module","integration"]},false]]}},false],["included",{"t":"arr","of":{"t":"obj","n":"QuoteLine","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["price",{"t":"num"},false],["kind",{"t":"lit","v":["module","integration"]},false]]}},false],["base",{"t":"num"},false],["modulesSubtotal",{"t":"num"},false],["size",{"t":"lit","v":["small","large","medium"]},false],["sizeMult",{"t":"num"},false],["monthly",{"t":"num"},false],["setup",{"t":"num"},false],["firstPayment",{"t":"num"},false],["yearly",{"t":"num"},false],["yearlyDiscounted",{"t":"num"},false],["mode",{"t":"lit","v":["subscription","enterprise"]},false],["enterpriseOneTime",{"t":"num"},false],["enterpriseAnnual",{"t":"num"},false]]}]},"opt":false}],
  inner$telephonySection$lines: [{"name":"t","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[["enabled",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["numbers",{"t":"arr","of":{"t":"obj","n":"TelNumber","p":[["id",{"t":"str"},false],["e164",{"t":"str"},false],["label",{"t":"str"},false],["kind",{"t":"lit","v":["sim","virtual","whatsapp"]},false],["kosher",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["officeDays",{"t":"arr","of":{"t":"num"}},false],["officeStart",{"t":"str"},false],["officeEnd",{"t":"str"},false],["officeExt",{"t":"str"},false],["managerExt",{"t":"str"},false],["vmBox",{"t":"str"},false],["city",{"t":"str"},false],["kosherMode",{"t":"bool"},false],["hebrewCalendar",{"t":"bool"},false],["zmanim",{"t":"bool"},false],["shabbat",{"t":"bool"},false],["fasts",{"t":"bool"},false],["voicemail",{"t":"bool"},false]]}]},"opt":false}],
  inner$telephonySection$numRows: [{"name":"t","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[["enabled",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["numbers",{"t":"arr","of":{"t":"obj","n":"TelNumber","p":[["id",{"t":"str"},false],["e164",{"t":"str"},false],["label",{"t":"str"},false],["kind",{"t":"lit","v":["sim","virtual","whatsapp"]},false],["kosher",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["officeDays",{"t":"arr","of":{"t":"num"}},false],["officeStart",{"t":"str"},false],["officeEnd",{"t":"str"},false],["officeExt",{"t":"str"},false],["managerExt",{"t":"str"},false],["vmBox",{"t":"str"},false],["city",{"t":"str"},false],["kosherMode",{"t":"bool"},false],["hebrewCalendar",{"t":"bool"},false],["zmanim",{"t":"bool"},false],["shabbat",{"t":"bool"},false],["fasts",{"t":"bool"},false],["voicemail",{"t":"bool"},false]]}]},"opt":false}],
  inner$telephonySection$numRows$$step: [{"name":"lines","d":{"t":"arr","of":{"t":"obj","n":"TelNumber","p":[["id",{"t":"str"},false],["e164",{"t":"str"},false],["label",{"t":"str"},false],["kind",{"t":"lit","v":["sim","virtual","whatsapp"]},false],["kosher",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},"opt":false}],
  inner$telephonySection$days: [{"name":"t","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[["enabled",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["numbers",{"t":"arr","of":{"t":"obj","n":"TelNumber","p":[["id",{"t":"str"},false],["e164",{"t":"str"},false],["label",{"t":"str"},false],["kind",{"t":"lit","v":["sim","virtual","whatsapp"]},false],["kosher",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["officeDays",{"t":"arr","of":{"t":"num"}},false],["officeStart",{"t":"str"},false],["officeEnd",{"t":"str"},false],["officeExt",{"t":"str"},false],["managerExt",{"t":"str"},false],["vmBox",{"t":"str"},false],["city",{"t":"str"},false],["kosherMode",{"t":"bool"},false],["hebrewCalendar",{"t":"bool"},false],["zmanim",{"t":"bool"},false],["shabbat",{"t":"bool"},false],["fasts",{"t":"bool"},false],["voicemail",{"t":"bool"},false]]}]},"opt":false}],
  inner$telephonySection$closures: [{"name":"t","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[["enabled",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["numbers",{"t":"arr","of":{"t":"obj","n":"TelNumber","p":[["id",{"t":"str"},false],["e164",{"t":"str"},false],["label",{"t":"str"},false],["kind",{"t":"lit","v":["sim","virtual","whatsapp"]},false],["kosher",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["officeDays",{"t":"arr","of":{"t":"num"}},false],["officeStart",{"t":"str"},false],["officeEnd",{"t":"str"},false],["officeExt",{"t":"str"},false],["managerExt",{"t":"str"},false],["vmBox",{"t":"str"},false],["city",{"t":"str"},false],["kosherMode",{"t":"bool"},false],["hebrewCalendar",{"t":"bool"},false],["zmanim",{"t":"bool"},false],["shabbat",{"t":"bool"},false],["fasts",{"t":"bool"},false],["voicemail",{"t":"bool"},false]]}]},"opt":false}],
  inner$telephonySection$extras: [{"name":"t","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[["enabled",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["numbers",{"t":"arr","of":{"t":"obj","n":"TelNumber","p":[["id",{"t":"str"},false],["e164",{"t":"str"},false],["label",{"t":"str"},false],["kind",{"t":"lit","v":["sim","virtual","whatsapp"]},false],["kosher",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["officeDays",{"t":"arr","of":{"t":"num"}},false],["officeStart",{"t":"str"},false],["officeEnd",{"t":"str"},false],["officeExt",{"t":"str"},false],["managerExt",{"t":"str"},false],["vmBox",{"t":"str"},false],["city",{"t":"str"},false],["kosherMode",{"t":"bool"},false],["hebrewCalendar",{"t":"bool"},false],["zmanim",{"t":"bool"},false],["shabbat",{"t":"bool"},false],["fasts",{"t":"bool"},false],["voicemail",{"t":"bool"},false]]}]},"opt":false}],
  inner$telephonySection$extras$$step: [{"name":"t","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[["enabled",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["numbers",{"t":"arr","of":{"t":"obj","n":"TelNumber","p":[["id",{"t":"str"},false],["e164",{"t":"str"},false],["label",{"t":"str"},false],["kind",{"t":"lit","v":["sim","virtual","whatsapp"]},false],["kosher",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["officeDays",{"t":"arr","of":{"t":"num"}},false],["officeStart",{"t":"str"},false],["officeEnd",{"t":"str"},false],["officeExt",{"t":"str"},false],["managerExt",{"t":"str"},false],["vmBox",{"t":"str"},false],["city",{"t":"str"},false],["kosherMode",{"t":"bool"},false],["hebrewCalendar",{"t":"bool"},false],["zmanim",{"t":"bool"},false],["shabbat",{"t":"bool"},false],["fasts",{"t":"bool"},false],["voicemail",{"t":"bool"},false]]}]},"opt":false},{"name":"closures","d":{"t":"str"},"opt":false}],
  inner$buildHandoffHtml$url: [{"name":"cfg","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false},{"name":"appUrl","d":{"t":"str"},"opt":false}],
  inner$buildHandoffHtml$sold: [{"name":"cfg","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false}],
  inner$buildHandoffHtml$liveSold: [{"name":"cfg","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false}],
  inner$buildHandoffHtml$liveSold$$step: [{"name":"sold","d":{"t":"arr","of":{"t":"tup","of":[{"t":"str"},{"t":"obj","p":[["enabled",{"t":"bool"},false]]}]}},"opt":false}],
  inner$buildHandoffHtml$roadSold: [{"name":"cfg","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false}],
  inner$buildHandoffHtml$roadSold$$step: [{"name":"sold","d":{"t":"arr","of":{"t":"tup","of":[{"t":"str"},{"t":"obj","p":[["enabled",{"t":"bool"},false]]}]}},"opt":false}],
  inner$buildHandoffHtml$integrations: [{"name":"cfg","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false}],
  inner$buildHandoffHtml$integrations$$step: [{"name":"liveSold","d":{"t":"arr","of":{"t":"tup","of":[{"t":"str"},{"t":"obj","p":[["enabled",{"t":"bool"},false]]}]}},"opt":false},{"name":"roadSold","d":{"t":"arr","of":{"t":"tup","of":[{"t":"str"},{"t":"obj","p":[["enabled",{"t":"bool"},false]]}]}},"opt":false}],
};
