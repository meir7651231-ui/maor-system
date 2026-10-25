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
  await p.uncheck('#rawPrint'); // הבדיקות קוראות את הטקסט הלוגי; תצוגת-מדפסת נבדקת בנפרד למטה
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
  await key('REFUND');
  check((await scr()).includes("מס' קבלה מקורית"), 'החזרה ⇒ "מס\' קבלה מקורית"');
  await key('1', 'OK');
  await samples.nth(3).click();
  check((await scr()).includes('לא נמצא בקבלה 1'), 'בהחזרה: מוצר שלא היה בקבלה ⇒ נדחה');
  await samples.nth(0).click(); await key('CASH');
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

  // ── אקסל: עריכת מוצרים.csv במחשב ⇒ הקופה קולטת ──
  const cp1255 = (t) => Buffer.from([...t].map((ch) => { const c = ch.codePointAt(0); return c >= 0x5d0 && c <= 0x5ea ? c - 0x5d0 + 0xe0 : c; }));
  await p.click('#cardBtn');
  await f.locator('#tabs button[data-t=files]').click();
  check(await f.locator('#filesBox').innerText().then((t) => t.includes('מוצרים.csv') && t.includes('קבלות.csv') && t.includes('סגירת-יום-0001')), 'הקופה כתבה לכרטיס: מוצרים.csv, קבלות.csv, דוח סגירת יום');
  const badCsv = path.join(OUT, 'bad.csv');
  fs.writeFileSync(badCsv, cp1255('ברקוד,שם,מחיר,מלאי\r\n7.29E+12,חולצה,99.90,4\r\n'));
  await f.locator('#csvIn').setInputFiles(badCsv);
  check((await f.locator('#csvCheck').innerText()).includes('השתבש באקסל'), 'קובץ עם ברקוד ששובש באקסל ⇒ "הברקוד השתבש באקסל" ולא נשמר');
  const prods = await p.evaluate(() => JSON.parse(localStorage.getItem('kupa.card')).products);
  const lines = ['ברקוד,שם,מחיר,מלאי'];
  for (const pr of prods) lines.push([pr.code, pr.name, pr.code === prods[0].code ? '99.90' : (pr.price / 100).toFixed(2), pr.stock ?? ''].join(','));
  lines.push('7290000000077,כובע,59,10');
  const goodCsv = path.join(OUT, 'good.csv');
  fs.writeFileSync(goodCsv, cp1255(lines.join('\r\n') + '\r\n')); // כמו "CSV" רגיל מאקסל עברי
  await f.locator('#csvIn').setInputFiles(goodCsv);
  check((await f.locator('#csvCheck').innerText()).includes('הקובץ תקין'), 'קובץ שנשמר באקסל (Windows-1255, בלי גרש) ⇒ "הקובץ תקין"');
  await p.click('#cardBtn');
  const msgAfter = await scr();
  check(msgAfter.includes('1 נוספו') && msgAfter.includes('1 עודכנו'), 'הכנסת הכרטיס ⇒ "מוצרים.csv: 1 נוספו · 1 עודכנו"');
  check(await p.locator('#samples button', { hasText: 'כובע' }).count() === 1, 'המוצר החדש מהאקסל זמין למכירה');
  check(!(await scr()).includes('נפסל'), 'עריכת מוצרים באקסל לא פוסלת את הכרטיס (רק קבלות חתומות)');

  // ── קוד מנהל, הנחות ועיגול ──
  await p.click('#cardBtn');
  await f.locator('#tabs button[data-t=biz]').click();
  await f.locator('#pin').fill('2468');
  await f.locator('#saveBiz').click();
  await p.click('#cardBtn');
  await samples.nth(0).click();
  await key('1', '0', 'PCT');
  check((await scr()).includes('קוד מנהל'), 'הנחה כשמוגדר קוד מנהל ⇒ מבקש קוד');
  await key('1', '1', '1', '1', 'OK');
  check((await scr()).includes('שגוי'), 'קוד שגוי ⇒ "קוד מנהל שגוי"');
  await key('PCT', '2', '4', '6', '8', 'OK');
  check((await scr()).includes('הנחה 10%'), 'קוד נכון ⇒ הנחה 10% על השורה');
  await key('CANCEL', 'CANCEL');
  await key('1', '7', '.', '0', '4', 'PRICE', 'CASH');
  const cashScr = await scr();
  check(cashScr.includes('17.00') && cashScr.includes('עיגול'), 'מזומן 17.04 ⇒ לתשלום 17.00 (עיגול)');
  await key('OK');
  check((await p.locator('.slip').first().innerText()).includes('עיגול מזומן'), 'בקבלה מודפסת שורת "עיגול מזומן"');

  // תצוגת "כמו במדפסת אמיתית": אותה קבלה בסדר חזותי (מה שנשלח ל-Epson)
  await p.check('#rawPrint');
  const raw = await p.locator('.slip').first().innerText();
  check(raw.includes('ןמוזמב לבקתה') && raw.includes('ןמוזמ לוגיע'), 'תצוגת מדפסת: העברית בסדר חזותי (כפי שתודפס משמאל לימין)');
  await p.uncheck('#rawPrint');

  // ייצוא הכרטיס לקובץ (לבדיקת דף-הניהול בקובץ יחיד)
  const cardText = await p.evaluate(() => localStorage.getItem('kupa.card'));
  const cardFile = path.join(OUT, 'KUPA.JSON');
  fs.writeFileSync(cardFile, cardText);

  // זיוף: עריכת סכום קבלה בכרטיס ⇒ הקופה פוסלת
  await p.click('#cardBtn');
  await p.evaluate(() => { const c = JSON.parse(localStorage.getItem('kupa.card')); c.receipts[0].total = 100; localStorage.setItem('kupa.card', JSON.stringify(c)); });
  await p.click('#cardBtn');
  const tamperScr = await scr();
  check(tamperScr.includes('נפסל'), 'כרטיס שנערך במחשב ⇒ "הכרטיס נפסל" · ' + tamperScr);
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
