/**
 * מחולל אייקוני-PWA — מרנדר את public/favicon.svg ב-Chromium ומצלם PNG:
 * icon-192 · icon-512 (שקופים-לבנים) · icon-maskable-512 (רקע מלא + שוליים
 * בטוחים 20% לעיגול-האנדרואיד) · apple-touch-icon (180, רקע מלא — iOS לא
 * תומך שקיפות). מריצים פעם אחת (node scripts/gen-icons.mjs) והתוצרים בקומיט.
 */
import { chromium } from 'playwright-core';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svg = await readFile(join(root, 'public', 'favicon.svg'), 'utf8');

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const pg = await b.newPage();

async function shoot(size, { pad = 0.1, bg = 'transparent' } = {}) {
  const inner = Math.round(size * (1 - pad * 2));
  await pg.setViewportSize({ width: size, height: size });
  await pg.setContent(
    `<body style="margin:0;width:${size}px;height:${size}px;background:${bg};display:flex;align-items:center;justify-content:center">` +
      `<div style="width:${inner}px;height:${inner}px;display:flex;align-items:center;justify-content:center">` +
      svg.replace('<svg ', `<svg style="width:100%;height:100%" `) +
      `</div></body>`,
  );
  return pg.screenshot({ omitBackground: bg === 'transparent' });
}

const { writeFile } = await import('node:fs/promises');
const out = (n) => join(root, 'public', 'icons', n);
await writeFile(out('icon-192.png'), await shoot(192, { pad: 0.08, bg: '#faf7f2' }));
await writeFile(out('icon-512.png'), await shoot(512, { pad: 0.08, bg: '#faf7f2' }));
// maskable: אזור-בטוח — הלוגו בתוך 60% מרכזיים, רקע מלא
await writeFile(out('icon-maskable-512.png'), await shoot(512, { pad: 0.2, bg: '#211d17' }));
await writeFile(out('apple-touch-icon.png'), await shoot(180, { pad: 0.12, bg: '#211d17' }));

await b.close();
console.log('✓ אייקוני-PWA נוצרו ב-public/icons/');
