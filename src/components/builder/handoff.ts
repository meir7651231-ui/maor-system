/**
 * מחולל ערכת המסירה — דף HTML עברי מודפס שנמסר ללקוח בסוף פגישת ההקמה:
 * מה קיבלתם, הכתובת, כללי הגיבוי, מדריך מזכירה מקוצר, וטבלת החשבונות
 * החיצוניים שנפתחים על שם העמותה.
 */
import type { ModuleKey, OrgConfig } from '../../types/config';
import { FEATURES, type FeatureDef } from '../../types/features';
import { featureModuleKey, WIZARD_SECTIONS } from './sections';

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
  gcal: '📅 סנכרון יומן Google/Outlook',
  drive: '☁️ גיבוי ענן אוטומטי',
  sheets: '📊 גיליון חי להנהלה',
  maps: '🗺️ מפות ומסלולי חלוקה',
  esign: '✍️ חתימה דיגיטלית',
  ai: '🤖 עוזר חכם (AI)',
  campaign: '📣 חיבור קמפיין גיוס',
};

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

export function buildHandoffHtml(cfg: OrgConfig, appUrl: string, installerName: string): string {
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
  const sold = Object.entries(cfg.integrations ?? {}).filter(([, v]) => v.enabled);
  const integrations = sold.length
    ? `<h2>🔌 הרחבות שנרכשו</h2>
       <p>ההרחבות הבאות נרכשו ויופעלו בפגישת המשך קצרה (נדרש לפתוח חשבונות על שם העמותה):</p>
       <ul>${sold.map(([k]) => `<li>${esc(INTEGRATION_LABELS[k] ?? k)} — <b>ממתין להפעלה</b></li>`).join('')}</ul>
       <table><tr><th>חשבון לפתיחה</th><th>על שם</th><th>מי פותח</th></tr>
       ${sold.map(([k]) => `<tr><td>${esc(INTEGRATION_LABELS[k] ?? k)}</td><td>העמותה</td><td>יחד בפגישת ההפעלה</td></tr>`).join('')}
       </table>`
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

${removedHtml}

${integrations}

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
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
