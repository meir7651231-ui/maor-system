// הפעלה 445 (מבקר 270ℹ️): clickSave ב-lib.mjs — כשהכפתור «שמירה» כבוי, השגיאה אומרת באיזה שלב ומה מצב המסך.
// בלי שרת: דף סטטי (setContent), אפס בקשות רשת.
import { createRequire } from 'node:module';
import { clickSave, launchChromium } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const ok = (c, m) => { if (!c) throw new Error(m); };
const b = await launchChromium(chromium);
try {
  const p = await b.newPage();
  let net = 0; p.on('request', r => { if (!r.url().startsWith('data:') && r.url() !== 'about:blank') net++; });
  await p.setContent(`<div data-testid="settings-live" data-loaded="1"></div><input aria-label="ע.מ. / ח.פ." aria-invalid="true">
    <button data-testid="settings-save" disabled>שמירה בשרת</button><span data-testid="settings-dirty">יש שינויים שלא נשמרו</span>
    <script>window.clicks=0;document.querySelector('button').onclick=()=>window.clicks++;</script>`);
  let msg = '';
  try { await clickSave(p, 'שלב בדיקה', 400); } catch (e) { msg = e.message; }
  for (const s of ['שלב «שלב בדיקה»', '"loaded":"1"', '"disabled":true', 'יש שינויים שלא נשמרו', 'ע.מ. / ח.פ.']) ok(msg.includes(s), `חסר «${s}» בהודעה: ${msg}`);
  // כפתור שנהיה זמין תוך כדי ההמתנה ⇒ נלחץ פעם אחת
  await p.evaluate(() => setTimeout(() => { document.querySelector('button').disabled = false; }, 200));
  await clickSave(p, 'נהיה זמין', 3000);
  ok(await p.evaluate(() => window.clicks) === 1, 'הלחיצה לא נרשמה');
  let noStage = ''; try { await clickSave(p, ''); } catch (e) { noStage = e.message; }
  ok(noStage.includes('בלי שם שלב'), 'clickSave בלי שם שלב לא נדחה');
  ok(net === 0, `בקשות רשת: ${net}`);
  console.log('✓ clickSave: שלב + אבחון כשהכפתור כבוי, לחיצה אחת כשנהיה זמין, 0 בקשות רשת');
} finally { await b.close(); }
