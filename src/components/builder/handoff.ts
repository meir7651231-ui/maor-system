/**
 * מחולל ערכת המסירה — דף HTML עברי מודפס שנמסר ללקוח בסוף פגישת ההקמה:
 * מה קיבלתם, הכתובת, כללי הגיבוי, מדריך מזכירה מקוצר, וטבלת החשבונות
 * החיצוניים שנפתחים על שם העמותה.
 */
import type { ModuleKey, OrgConfig } from '../../types/config';
import { FEATURES, type FeatureDef } from '../../types/features';
import { featureModuleKey, WIZARD_SECTIONS } from './sections';
import { SIZE_LABELS, shekel, type Quote } from '../../lib/pricing';
import { guardExport } from '../../lib/exportGate';

export const MODULE_LABELS: Record<string, string> = {
  families: 'משפחות ובני משפחה',
  courses: 'חוגים, שיבוצים ותשלומים',
  calendar: 'לוח שנה עברי-לועזי',
  diary: 'יומן חדרים ונוכחות',
  supporters: 'תורמים ותרומות',
  reports: 'דוחות וייצוא',
};

export const THEME_LABELS: Record<string, string> = {
  'or-rishon': 'אור ראשון (שמנת-ענבר)',
  heichal: 'היכל (כהה-זהב)',
  tsohar: 'צֹהַר (בהיר-מודרני)',
  kehila: 'קהילה (צבעוני-צעיר)',
};

export const INTEGRATION_LABELS: Record<string, string> = {
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
};

/**
 * טקסונומיית-כנות (INTEGRATIONS גל א׳, ליעוס 4.8.2026): מה באמת קיים.
 * ‏live = ממומש בקוד ונמכר (מגודר integrationOn — חסר=כבוי) · included = כבר
 * כלול נייטיב במערכת (לא נמכר פעמיים) · roadmap = דורש שרת/ספק — לא-נמכר באשף
 * (אין צ'יפ-מכירה; דגל-מיובא-תקוע מוצג להסרה), לא מתומחר, לא מובטח במסירה.
 * **אי-אפשר למכור בטעות מה שלא קיים.**
 */
export type IntegrationStatus = 'live' | 'included' | 'roadmap';
export const INTEGRATION_STATUS: Record<string, IntegrationStatus> = {
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
};

function esc(s: string): string {
  // כולל גרשיים — הגנה גם אם עריכה עתידית תשים פלט esc בתוך attribute (ביקורת 4.8)
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * ההרחבות הדלוקות **הממומשות** (live) — מקור-אמת יחיד לסינון-הכנות של ההצעה.
 * ‏computeQuote עצמו עיוור-לסטטוס (מתמחר מה שמקבל) ⇒ כל caller חייב לעבור כאן.
 */
export function liveAddons(cfg: Pick<OrgConfig, 'integrations'>): Array<{ key: string; label: string }> {
  return Object.entries(cfg.integrations ?? {})
    .filter(([k, v]) => v.enabled && INTEGRATION_STATUS[k] === 'live')
    .map(([k]) => ({ key: k, label: INTEGRATION_LABELS[k] ?? k }));
}

/** שם מודול לתצוגה — דריסת מונח (nav.*) של הלקוח גוברת על התווית הכללית. */
function moduleDisplayName(cfg: OrgConfig, k: ModuleKey): string {
  const override = cfg.terms?.[`nav.${k}`]?.trim();
  return override || MODULE_LABELS[k] || k;
}

/** שם הקבוצה של פיצ'ר (כולל home/settings/core שאין להם מודול). */
function featureGroupName(cfg: OrgConfig, m: FeatureDef['module']): string {
  const mk = featureModuleKey(m);
  if (mk) return moduleDisplayName(cfg, mk);
  return WIZARD_SECTIONS.find((s) => s.id === m)?.title ?? m;
}

/**
 * מה הוסר מהחבילה — פיצ'רים שאינם פעילים בפועל: כובו במפורש (features[key]=false)
 * או שהמודול-האב שלהם כבוי. הרשימה נמסרת ללקוח כ"ניתן להפעלה בעתיד".
 */
export function removedFeatures(cfg: OrgConfig): FeatureDef[] {
  return FEATURES.filter((f) => {
    const mk = featureModuleKey(f.module);
    return (mk && cfg.modules[mk] === false) || cfg.features?.[f.key] === false;
  });
}

/** מקטע הצעת-המחיר בדף המסירה — נבנה רק כשנמסר quote (אחרת ריק, ביט-זהה לקודם). */
function quoteSection(quote: Quote | undefined): string {
  if (!quote) return '';
  // עסקת Enterprise ("על הענן שלו") — חד-פעמי + תחזוקה שנתית, לא מנוי חודשי.
  if (quote.mode === 'enterprise') {
    return `<h2>💼 הצעת מחיר — Enterprise (על הענן שלכם)</h2>
      <table>
        <tr><th>רכיב</th><th style="text-align:left">מחיר</th></tr>
        <tr><td>הקמה מלאה + פריסה על ה-Firebase שלכם + מיתוג + הדרכה + מסירה</td><td style="text-align:left">${esc(shekel(quote.enterpriseOneTime))} <small>חד-פעמי</small></td></tr>
        <tr><td>תחזוקה שנתית (עדכונים · תמיכה · תיקונים · קבלות §46 מעודכנות)</td><td style="text-align:left">${esc(shekel(quote.enterpriseAnnual))} <small>לשנה</small></td></tr>
      </table>
      <p style="font-size:13px">המערכת רצה על תשתית הענן שבבעלותכם — הנתונים, החיוב והשליטה שלכם. אינו כולל מע״מ.</p>`;
  }
  const rows = quote.lines
    .map((l) => `<tr><td>${esc(l.label)}</td><td style="text-align:left">${esc(shekel(l.price))}</td></tr>`)
    .join('');
  const incl = quote.included.length
    ? `<p style="font-size:13px;color:#777">כלול בבסיס ללא תוספת: ${quote.included.map((l) => esc(l.label)).join(' · ')}</p>`
    : '';
  const setupRow = quote.setup > 0
    ? `<tr><td>הקמה חד-פעמית</td><td style="text-align:left">${esc(shekel(quote.setup))}</td></tr>`
    : '';
  return `<h2>💰 הצעת מחיר</h2>
    <table>
      <tr><th>רכיב</th><th style="text-align:left">מחיר / חודש</th></tr>
      <tr><td>מנוי בסיס (בית · משפחות · לוח · הגדרות)</td><td style="text-align:left">${esc(shekel(quote.base))}</td></tr>
      ${rows}
      <tr><td>התאמת גודל ארגון (${esc(SIZE_LABELS[quote.size])})</td><td style="text-align:left">×${quote.sizeMult}</td></tr>
      <tr style="font-weight:800;background:#f6f3ec"><td>סה״כ חודשי</td><td style="text-align:left">${esc(shekel(quote.monthly))}</td></tr>
      ${setupRow}
    </table>
    ${incl}
    <p style="font-size:13px">מנוי שנתי מראש: <b>${esc(shekel(quote.yearlyDiscounted))}</b> לשנה <small>(חודשיים חינם — במקום ${esc(shekel(quote.yearly))})</small></p>
    <p style="font-size:12px;color:#777">המחירים לפי הרכב המערכת שנבחר; ניתן להוסיף/להסיר מודולים בכל עת. אינם כוללים מע״מ.</p>`;
}

/** ימות-השבוע בעברית לתצוגה בדף-המסירה (0=ראשון). */
const HANDOFF_DOW = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'שבת'];
const TEL_KIND_LABEL: Record<string, string> = { sim: 'SIM בשער', virtual: 'הפניה', whatsapp: 'ווצאפ' };

/**
 * מקטע-הטלפוניה בדף-המסירה — נבנה רק כשהמתג **דלוק** (enabled) ויש קו-אחד לפחות
 * (אחרת ריק, ביט-זהה לקודם). downstream: מבהיר שהמערכת יושבת אחרי קווי-הלקוח, לא ספק.
 */
function telephonySection(cfg: OrgConfig): string {
  const t = cfg.telephony;
  if (!t || t.enabled !== true) return ''; // כבוי (ברירת-מחדל) ⇒ לא נמסר
  const lines = t.numbers.filter((n) => n.e164.trim());
  if (!lines.length) return '';
  const numRows = lines
    .map(
      (n) =>
        `<li>${esc(n.label)} — <span dir="ltr">${esc(n.e164)}</span> <small>(${esc(TEL_KIND_LABEL[n.kind] ?? n.kind)}${n.kosher ? ' · כשר' : ''})</small></li>`,
    )
    .join('');
  const days = t.officeDays.length ? t.officeDays.map((d) => HANDOFF_DOW[d] ?? d).join(', ') : '—';
  const closures = [t.hebrewCalendar && 'חגים', t.shabbat && 'שבת', t.fasts && 'צומות'].filter(Boolean).join(' · ');
  const extras = [closures && `סגירה אוטומטית: ${closures}`, t.kosherMode && 'מצב כשר (יציאה)'].filter(Boolean).join(' · ');
  return `<h2>☎️ טלפוניה</h2>
    <ul>${numRows}</ul>
    <p style="font-size:13px">שעות משרד: ${esc(days)} · ${esc(t.officeStart)}–${esc(t.officeEnd)}${extras ? ` · ${esc(extras)}` : ''}</p>
    <p style="font-size:12px;color:#777">קונפיג-המרכזייה מותקן אצל המפעיל (FreeSWITCH). המערכת אינה ספק טלפוניה — היא יושבת אחרי הקווים שלכם.</p>`;
}

export function buildHandoffHtml(cfg: OrgConfig, appUrl: string, installerName: string, quote?: Quote): string {
  const url = cfg.slug === 'default' ? appUrl : `${appUrl}${appUrl.includes('?') ? '&' : '?'}org=${cfg.slug}`;
  const modules = (Object.keys(MODULE_LABELS) as ModuleKey[])
    .filter((k) => cfg.modules[k] !== false)
    .map((k) => `<li>✅ ${esc(moduleDisplayName(cfg, k))}</li>`)
    .join('');
  const removed = removedFeatures(cfg);
  const removedHtml = removed.length
    ? `<h2>➖ מה הוסר מהחבילה</h2>
       <p>היכולות הבאות הוסרו בהתאמה אישית. אפשר להפעיל כל אחת מהן בעתיד — ללא אובדן נתונים:</p>
       <ul>${removed
         .map((f) => `<li>✖ ${esc(f.label)} <small>(${esc(featureGroupName(cfg, f.module))})</small></li>`)
         .join('')}</ul>`
    : '';
  // כנות-מסירה (INTEGRATIONS גל א׳): live = "פעיל" (הופעל במסירה); roadmap —
  // אם בכל-זאת סומן (האשף חוסם) — "בפיתוח, ללא חיוב". אין יותר הבטחות-אוויר.
  const sold = Object.entries(cfg.integrations ?? {}).filter(([, v]) => v.enabled);
  const liveSold = sold.filter(([k]) => INTEGRATION_STATUS[k] === 'live');
  const roadSold = sold.filter(([k]) => INTEGRATION_STATUS[k] === 'roadmap');
  const integrations =
    liveSold.length || roadSold.length
      ? `<h2>🔌 הרחבות</h2>
       ${liveSold.length ? `<ul>${liveSold.map(([k]) => `<li>${esc(INTEGRATION_LABELS[k] ?? k)} — <b>פעיל</b></li>`).join('')}</ul>` : ''}
       ${roadSold.length ? `<p style="font-size:13px;color:#777">בפיתוח (יופעלו עם השקתם, ללא חיוב היום): ${roadSold.map(([k]) => esc(INTEGRATION_LABELS[k] ?? k)).join(' · ')}</p>` : ''}`
      : '';

  return `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8">
<title>ערכת מסירה — ${esc(cfg.orgName)}</title>
<style>
  body{font-family:-apple-system,'Segoe UI',sans-serif;max-width:720px;margin:32px auto;padding:0 20px;color:#241f18;line-height:1.6}
  h1{border-bottom:3px solid #f3c76b;padding-bottom:8px}
  h2{margin-top:28px;color:#a05008}
  .url{background:#211d17;color:#f3c76b;padding:14px 18px;border-radius:10px;font-size:18px;direction:ltr;text-align:center;word-break:break-all}
  table{width:100%;border-collapse:collapse;margin:10px 0}
  th,td{border:1px solid #ddd;padding:8px 12px;text-align:right}
  th{background:#f6f3ec}
  .warn{background:#fdf3e0;border:1px solid #f3c76b;border-radius:10px;padding:12px 16px}
  footer{margin-top:36px;border-top:1px solid #ddd;padding-top:12px;color:#777;font-size:13px}
  @media print{body{margin:8mm}}
</style></head><body>
<h1>🕯️ ${esc(cfg.orgName)} — מערכת הניהול שלכם</h1>
<p>נמסר בתאריך: ${new Date().toLocaleDateString('he-IL')}</p>

<h2>🌐 הכתובת שלכם</h2>
<div class="url">${esc(url)}</div>
<p>שמרו כמועדף בכל מחשב. אפשר גם "להתקין" למסך הבית (בדפדפן: התקנת אפליקציה / הוספה למסך הבית).</p>

<h2>📦 מה כלול בחבילה</h2>
<ul>${modules}</ul>
<p>ערכת עיצוב: <b>${esc(THEME_LABELS[cfg.theme] ?? cfg.theme)}</b></p>

${quoteSection(quote)}

${removedHtml}

${integrations}

${telephonySection(cfg)}

<h2>💾 ארבעת כללי הזהב לשמירת הנתונים</h2>
<div class="warn"><ol>
<li><b>עובדים תמיד מאותו מחשב ואותו דפדפן.</b></li>
<li><b>קובץ הגיבוי היומי</b> (יורד אוטומטית בסוף היום) — לשמור בתיקייה מסודרת, רצוי בתיקיית Google Drive.</li>
<li><b>לא</b> לגלוש למערכת במצב פרטי/גלישה בסתר, ו<b>לא</b> לנקות נתוני אתרים בדפדפן.</li>
<li><b>מעבר מחשב:</b> הגדרות ← גיבוי ← הורדה במחשב הישן, ואז הגדרות ← שחזור במחשב החדש.</li>
</ol></div>

<h2>👩‍💼 5 פעולות שכדאי להכיר ביום הראשון</h2>
<table>
<tr><th>מה רוצים</th><th>איך</th></tr>
<tr><td>למצוא כל דבר</td><td>Ctrl+K — מקלידים שם/טלפון (סולח על שגיאות כתיב)</td></tr>
<tr><td>משפחה חדשה</td><td>בית ← "+ משפחה חדשה"</td></tr>
<tr><td>נוכחות בחוג</td><td>בית ← "היום" ← "נוכחות ←" ליד המפגש</td></tr>
<tr><td>מה דחוף היום</td><td>הפאנל "דורש טיפול" בבית; סיימתם? "✓ טופל"</td></tr>
<tr><td>גיבוי ידני</td><td>הגדרות ← גיבוי ← "הורדת גיבוי מלא"</td></tr>
</table>

<footer>הוקם ונמסר על-ידי ${esc(installerName)} · המערכת פועלת ללא דמי מנוי למטמיע · מנויי ספקים חיצוניים (אם נרכשו) משולמים ישירות על-ידי העמותה.</footer>
</body></html>`;
}

export function downloadTextFile(filename: string, content: string, mime = 'text/html'): void {
  if (!guardExport()) return; // 🔐 שער יציאת-מידע (core.export כבוי בכרטיס-העובד)
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
