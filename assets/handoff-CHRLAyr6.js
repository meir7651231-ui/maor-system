import{Cn as e,Dn as t,wn as n}from"./jsx-runtime-zB3qSzqV.js";import{i as r,n as i,r as a,t as o}from"./sections-BR4X8tQ9.js";var s={receipts:60,payments:90,whatsapp:50,sms:40,phone:90,gcal:30,drive:30,sheets:40,maps:40,esign:60,ai:120,campaign:60},c={base:290,modules:{families:0,calendar:0,courses:120,diary:70,supporters:180,reports:60,tzedaka:90,shop:90,shop7:80},integrations:s,sizeMult:{small:1,medium:1.6,large:2.4},setup:1500,enterprise:{oneTime:55e3,annualMaintenance:9e3}},l={small:`קטן`,medium:`בינוני`,large:`גדול`};function u(e){let n=e&&typeof e==`object`?e:{},r=(e,t)=>typeof e==`number`&&Number.isFinite(e)&&e>=0?e:t,i={};for(let e of t)i[e]=r(n.modules?.[e],c.modules[e]??0);let a={};for(let e of Object.keys(s))a[e]=r(n.integrations?.[e],s[e]);return{base:r(n.base,c.base),modules:i,integrations:a,sizeMult:{small:r(n.sizeMult?.small,c.sizeMult.small),medium:r(n.sizeMult?.medium,c.sizeMult.medium),large:r(n.sizeMult?.large,c.sizeMult.large)},setup:r(n.setup,c.setup),enterprise:{oneTime:r(n.enterprise?.oneTime,c.enterprise.oneTime),annualMaintenance:r(n.enterprise?.annualMaintenance,c.enterprise.annualMaintenance)}}}function d(e,n,r,i,a=[],o=`subscription`){let s=t.filter(t=>e.modules?.[t]!==!1).map(e=>({key:e,label:i(e),price:r.modules[e]??0,kind:`module`})),c=a.map(e=>({key:e.key,label:e.label,price:r.integrations[e.key]??0,kind:`integration`})),l=[...s.filter(e=>e.price>0),...c.filter(e=>e.price>0)],u=s.filter(e=>e.price===0),d=l.reduce((e,t)=>e+t.price,0),f=r.sizeMult[n]??1,p=Math.round((r.base+d)*f),m=r.setup??0;return{lines:l,included:u,base:r.base,modulesSubtotal:d,size:n,sizeMult:f,monthly:p,setup:m,firstPayment:p+m,yearly:p*12,yearlyDiscounted:p*10,mode:o,enterpriseOneTime:r.enterprise.oneTime,enterpriseAnnual:r.enterprise.annualMaintenance}}function f(e){return`₪`+Math.round(e).toLocaleString(`he-IL`)}var p=`maor_prices`;function m(){try{let e=localStorage.getItem(p);return e?u(JSON.parse(e)):{...c}}catch{return{...c}}}function h(e){try{localStorage.setItem(p,JSON.stringify(e))}catch{}}var g={families:`משפחות ובני משפחה`,courses:`חוגים, שיבוצים ותשלומים`,calendar:`לוח שנה עברי-לועזי`,diary:`יומן חדרים ונוכחות`,supporters:`תורמים ותרומות`,reports:`דוחות וייצוא`},_={"or-rishon":`אור ראשון (שמנת-ענבר)`,heichal:`היכל (כהה-זהב)`,tsohar:`צֹהַר (בהיר-מודרני)`,kehila:`קהילה (צבעוני-צעיר)`},v={receipts:`🧾 קבלות אוטומטיות + סעיף 46`,payments:`💳 סליקה והוראות קבע`,whatsapp:`💬 הודעות וואטסאפ`,sms:`📱 הודעות SMS`,phone:`📞 מערכת טלפונית (ימות המשיח)`,gcal:`📅 ייצוא ליומן Google/Outlook (ICS)`,drive:`☁️ גיבוי ענן אוטומטי`,sheets:`📊 גיליון חי להנהלה`,maps:`🗺️ מפות ומסלולי חלוקה`,esign:`✍️ חתימה דיגיטלית`,ai:`🤖 עוזר חכם (AI)`,campaign:`📣 חיבור קמפיין גיוס`,mail:`📧 קבלות ותזכורות במייל`,gcontacts:`📇 סנכרון אנשי-קשר ל-Google`},y={whatsapp:`live`,maps:`live`,gcal:`live`,payments:`live`,ai:`live`,esign:`live`,campaign:`live`,receipts:`included`,drive:`included`,sheets:`roadmap`,sms:`roadmap`,phone:`roadmap`,mail:`roadmap`,gcontacts:`roadmap`};function b(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function x(e){return Object.entries(e.integrations??{}).filter(([e,t])=>t.enabled&&y[e]===`live`).map(([e])=>({key:e,label:v[e]??e}))}function S(e,t){return e.terms?.[`nav.${t}`]?.trim()||g[t]||t}function C(e,t){let n=a(t);return n?S(e,n):o.find(e=>e.id===t)?.title??t}function w(e){return r.filter(t=>!i(e,t))}function T(e){if(!e)return``;if(e.mode===`enterprise`)return`<h2>💼 הצעת מחיר — Enterprise (על הענן שלכם)</h2>
      <table>
        <tr><th>רכיב</th><th style="text-align:left">מחיר</th></tr>
        <tr><td>הקמה מלאה + פריסה על ה-Firebase שלכם + מיתוג + הדרכה + מסירה</td><td style="text-align:left">${b(f(e.enterpriseOneTime))} <small>חד-פעמי</small></td></tr>
        <tr><td>תחזוקה שנתית (עדכונים · תמיכה · תיקונים · קבלות §46 מעודכנות)</td><td style="text-align:left">${b(f(e.enterpriseAnnual))} <small>לשנה</small></td></tr>
      </table>
      <p style="font-size:13px">המערכת רצה על תשתית הענן שבבעלותכם — הנתונים, החיוב והשליטה שלכם. אינו כולל מע״מ.</p>`;let t=e.lines.map(e=>`<tr><td>${b(e.label)}</td><td style="text-align:left">${b(f(e.price))}</td></tr>`).join(``),n=e.included.length?`<p style="font-size:13px;color:#777">כלול בבסיס ללא תוספת: ${e.included.map(e=>b(e.label)).join(` · `)}</p>`:``,r=e.setup>0?`<tr><td>הקמה חד-פעמית</td><td style="text-align:left">${b(f(e.setup))}</td></tr>`:``;return`<h2>💰 הצעת מחיר</h2>
    <table>
      <tr><th>רכיב</th><th style="text-align:left">מחיר / חודש</th></tr>
      <tr><td>מנוי בסיס (בית · משפחות · לוח · הגדרות)</td><td style="text-align:left">${b(f(e.base))}</td></tr>
      ${t}
      <tr><td>התאמת גודל ארגון (${b(l[e.size])})</td><td style="text-align:left">×${e.sizeMult}</td></tr>
      <tr style="font-weight:800;background:#f6f3ec"><td>סה״כ חודשי</td><td style="text-align:left">${b(f(e.monthly))}</td></tr>
      ${r}
    </table>
    ${n}
    <p style="font-size:13px">מנוי שנתי מראש: <b>${b(f(e.yearlyDiscounted))}</b> לשנה <small>(חודשיים חינם — במקום ${b(f(e.yearly))})</small></p>
    <p style="font-size:12px;color:#777">המחירים לפי הרכב המערכת שנבחר; ניתן להוסיף/להסיר מודולים בכל עת. אינם כוללים מע״מ.</p>`}var E=[`א׳`,`ב׳`,`ג׳`,`ד׳`,`ה׳`,`ו׳`,`שבת`],D={sim:`SIM בשער`,virtual:`הפניה`,whatsapp:`ווצאפ`};function O(e){let t=e.telephony;if(!t||t.enabled!==!0)return``;let n=t.numbers.filter(e=>e.e164.trim());if(!n.length)return``;let r=n.map(e=>`<li>${b(e.label)} — <span dir="ltr">${b(e.e164)}</span> <small>(${b(D[e.kind]??e.kind)}${e.kosher?` · כשר`:``})</small></li>`).join(``),i=t.officeDays.length?t.officeDays.map(e=>E[e]??e).join(`, `):`—`,a=[t.hebrewCalendar&&`חגים`,t.shabbat&&`שבת`,t.fasts&&`צומות`].filter(Boolean).join(` · `),o=[a&&`סגירה אוטומטית: ${a}`,t.kosherMode&&`מצב כשר (יציאה)`].filter(Boolean).join(` · `);return`<h2>☎️ טלפוניה</h2>
    <ul>${r}</ul>
    <p style="font-size:13px">שעות משרד: ${b(i)} · ${b(t.officeStart)}–${b(t.officeEnd)}${o?` · ${b(o)}`:``}</p>
    <p style="font-size:12px;color:#777">קונפיג-המרכזייה מותקן אצל המפעיל (FreeSWITCH). המערכת אינה ספק טלפוניה — היא יושבת אחרי הקווים שלכם.</p>`}function k(e,t,n,r){let i=e.slug==="default"?t:`${t}${t.includes(`?`)?`&`:`?`}org=${e.slug}`,a=Object.keys(g).filter(t=>e.modules[t]!==!1).map(t=>`<li>✅ ${b(S(e,t))}</li>`).join(``),o=w(e),s=o.length?`<h2>➖ מה הוסר מהחבילה</h2>
       <p>היכולות הבאות הוסרו בהתאמה אישית. אפשר להפעיל כל אחת מהן בעתיד — ללא אובדן נתונים:</p>
       <ul>${o.map(t=>`<li>✖ ${b(t.label)} <small>(${b(C(e,t.module))})</small></li>`).join(``)}</ul>`:``,c=Object.entries(e.integrations??{}).filter(([,e])=>e.enabled),l=c.filter(([e])=>y[e]===`live`),u=c.filter(([e])=>y[e]===`roadmap`),d=l.length||u.length?`<h2>🔌 הרחבות</h2>
       ${l.length?`<ul>${l.map(([e])=>`<li>${b(v[e]??e)} — <b>פעיל</b></li>`).join(``)}</ul>`:``}
       ${u.length?`<p style="font-size:13px;color:#777">בפיתוח (יופעלו עם השקתם, ללא חיוב היום): ${u.map(([e])=>b(v[e]??e)).join(` · `)}</p>`:``}`:``;return`<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8">
<title>ערכת מסירה — ${b(e.orgName)}</title>
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
<h1>🕯️ ${b(e.orgName)} — מערכת הניהול שלכם</h1>
<p>נמסר בתאריך: ${new Date().toLocaleDateString(`he-IL`)}</p>

<h2>🌐 הכתובת שלכם</h2>
<div class="url">${b(i)}</div>
<p>שמרו כמועדף בכל מחשב. אפשר גם "להתקין" למסך הבית (בדפדפן: התקנת אפליקציה / הוספה למסך הבית).</p>

<h2>📦 מה כלול בחבילה</h2>
<ul>${a}</ul>
<p>ערכת עיצוב: <b>${b(_[e.theme]??e.theme)}</b></p>

${T(r)}

${s}

${d}

${O(e)}

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

<footer>הוקם ונמסר על-ידי ${b(n)} · המערכת פועלת ללא דמי מנוי למטמיע · מנויי ספקים חיצוניים (אם נרכשו) משולמים ישירות על-ידי העמותה.</footer>
</body></html>`}function A(t,r,i=`text/html`){if(!e())return n();let a=document.createElement(`a`);return a.href=URL.createObjectURL(new Blob([r],{type:`${i};charset=utf-8`})),a.download=t,a.click(),setTimeout(()=>URL.revokeObjectURL(a.href),5e3),!0}export{A as a,d as c,h as d,k as i,m as l,y as n,x as o,_ as r,l as s,v as t,f as u};