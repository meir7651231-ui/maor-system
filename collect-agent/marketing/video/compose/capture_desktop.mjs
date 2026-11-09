// לכידת לוח-הבוקר (dashboard) ברוחב-דסקטופ למסך הלפטופ בקליפ האנכי: 1440×900 @2x ⇒ ui/desktop_dash.png
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
const WEB = '/home/user/maor-system/collect-agent/web/';
const require = createRequire(WEB + 'package.json');
const { chromium } = require('playwright');
const OUT = process.argv[2] || 'ui';
const srv = spawn('npx', ['vite', 'preview', '--port', '4332', '--strictPort'], { cwd: WEB, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 2500));
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await p.goto('http://localhost:4332/#/dashboard');
  await p.getByRole('button', { name: 'תצוגה ואישור' }).first().waitFor();
  await p.waitForTimeout(800);
  await p.addStyleTag({ content: '*{caret-color:transparent!important;transition:none!important;animation:none!important}' });
  await p.screenshot({ path: `${OUT}/desktop_dash.png` });
} finally { await b.close(); srv.kill(); }
console.log('ok');
