// מסע מלא בדפדפן: הגדרה → מכירות → X → Z → זיוף בכרטיס → דף-ניהול בקובץ יחיד מ-file://
// הרצה: (cd kupa && python3 -m http.server 8765 &) ; node e2e/sim.cjs [תיקיית-צילומים]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const OUT = process.argv[2] || '/tmp';
const BASE = 'http://localhost:8765/sim/index.html';
let fail = 0;
const check = (ok, msg) => { console.log((ok ? '✓ ' : '✗ ') + msg); if (!ok) fail++; };

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto(BASE);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  const scr = async () => (await p.locator('#screen').innerText()).replace(/\n/g, ' | ');
  const key = async (...ks) => { for (const k of ks) await p.click(`#keys [data-k="${k}"]`); };

  check((await scr()).includes('צריך הגדרה'), 'כרטיס ריק ⇒ "צריך הגדרה במחשב"');
  await p.click('#cardBtn');
  const f = p.frameLocator('#manage');
  await f.locator('#tabs button[data-t=backup]').click();
  await f.locator('#demo').click(); await f.locator('#demo').click();
  await p.click('#cardBtn');
  check((await scr()).includes('מוכן'), 'אחרי הגדרה ⇒ "מוכן"');

  const samples = p.locator('#samples button');
  await samples.nth(0).click(); await samples.nth(0).click(); await samples.nth(1).click();
  await key('5', '0', 'PRICE', '1', '0', 'DISC');
  check((await p.locator('#cust').innerText()).includes('368.80'), 'מסך הלקוח מראה את הסכום לתשלום');
  await key('CASH');
  check((await scr()).includes('כמה שילם'), 'מזומן ⇒ "כמה שילם הלקוח?"');
  await key('3', '0', '0');
  check((await scr()).includes('חסר') && (await scr()).includes('68.80'), 'הקלדת 300 ⇒ "חסר 68.80" תוך כדי');
  await key('OK');
  check((await p.locator('.slip').count()) === 0, 'אישור עם סכום חסר ⇒ אין קבלה');
  await key('C', '5', '0', '0');
  check((await scr()).includes('עודף') && (await scr()).includes('131.20'), 'הקלדת 500 ⇒ "עודף 131.20" תוך כדי');
  check((await p.locator('#cust').innerText()).includes('131.20'), 'מסך הלקוח מראה את העודף');
  await key('OK');
  const after = await scr();
  check(after.includes('שולם') && after.includes('500.00') && after.includes('131.20'), 'אחרי התשלום: "שולם 500 · עודף 131.20" נשאר על המסך');
  const rc = await p.locator('.slip').first().innerText();
  check(rc.includes('התקבל במזומן') && rc.includes('500.00') && rc.includes('131.20'), 'בקבלה: התקבל 500.00, עודף 131.20');
  await samples.nth(3).click(); await key('CREDIT');
  check(!(await scr()).includes('עודף'), 'סריקה חדשה מנקה את תצוגת העודף');
  await key('REFUND'); await samples.nth(0).click(); await key('CASH');
  await samples.nth(4).click(); await key('CASH', 'OK'); // מזומן בדיוק
  await samples.nth(2).click(); await key('CANCEL', 'CANCEL');
  await key('MENU', '4');
  await key('MENU', '1');
  await key('MENU', '2', 'OK');
  const z = await p.locator('.slip').first().innerText();
  check(z.includes('סגירת יום') && z.includes('402.90') && z.includes('GT') && z.includes('סוף דוח'), 'דוח Z: פדיון 402.90, GT, סוף דוח');
  check(/פעולות שאינן מכירה\s+3/.test(z), 'Z סופר 3 פעולות שאינן מכירה (ביטול, העתק, X)');
  const copy = await p.locator('.slip').nth(2).innerText();
  check(copy.includes('העתק'), 'העתק מסומן "העתק"');
  const orig = await p.locator('.slip').last().innerText();
  check(orig.includes('מקור'), 'קבלה מקורית מסומנת "מקור"');
  await p.screenshot({ path: path.join(OUT, 'kupa-sim.png'), fullPage: true });

  // ייצוא הכרטיס לקובץ (לבדיקת דף-הניהול בקובץ יחיד)
  const cardText = await p.evaluate(() => localStorage.getItem('kupa.card'));
  const cardFile = path.join(OUT, 'KUPA.JSON');
  fs.writeFileSync(cardFile, cardText);

  // זיוף: עריכת סכום קבלה בכרטיס ⇒ הקופה פוסלת
  await p.click('#cardBtn');
  await p.evaluate(() => { const c = JSON.parse(localStorage.getItem('kupa.card')); c.receipts[0].total = 100; localStorage.setItem('kupa.card', JSON.stringify(c)); });
  await p.click('#cardBtn');
  check((await scr()).includes('נפסל'), 'כרטיס שנערך במחשב ⇒ "הכרטיס נפסל"');
  const before = await p.locator('.slip').count();
  await samples.nth(0).click().catch(() => {});
  await key('CASH');
  check((await p.locator('.slip').count()) === before, 'בכרטיס פסול לא יוצאת קבלה');
  check(errs.length === 0, 'אין שגיאות בקונסולה: ' + JSON.stringify(errs));

  // דף הניהול בקובץ יחיד, נפתח מ-file:// בלי שרת
  const p2 = await b.newPage({ viewport: { width: 1100, height: 900 } });
  const errs2 = [];
  p2.on('pageerror', (e) => errs2.push(e.message));
  await p2.addInitScript(() => { delete window.showOpenFilePicker; });
  await p2.goto('file://' + path.resolve(__dirname, '../dist/ניהול-הקופה.html'));
  await p2.setInputFiles('#fileIn', cardFile);
  await p2.click('#tabs button[data-t=rep]');
  const rep = await p2.locator('#t-rep').innerText();
  check(rep.includes('רציף') && rep.includes('402.90'), 'דף-הניהול מ-file:// קורא את הכרטיס ומציג דוחות');
  check(rep.includes('פעולות חתומות'), 'דף-הניהול מציג את שיוך הכרטיס והחתימות');
  await p2.screenshot({ path: path.join(OUT, 'kupa-manage.png'), fullPage: true });
  check(errs2.length === 0, 'דף-הניהול: אין שגיאות ' + JSON.stringify(errs2));

  await b.close();
  console.log(fail ? `\n${fail} נכשלו` : '\nהכול עבר');
  process.exit(fail ? 1 : 0);
})();
