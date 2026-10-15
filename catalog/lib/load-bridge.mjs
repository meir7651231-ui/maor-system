/**
 * טוען את גשר-המאמת (bridge.ts) מתוך סקריפט node: אורז אותו עם rolldown לקובץ ESM במטמון
 * (node_modules/.cache/catalog/bridge.mjs) ומייבא. אותו קוד כמו במאמת של המפעל — בלי העתקה.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** אורז את bridge.ts (אפשר גם קובץ אחר) ומחזיר את נתיב ה-ESM. */
export async function bundleBridge(entry = join(ROOT, 'catalog/lib/bridge.ts')) {
  const { rolldown } = await import('rolldown');
  const b = await rolldown({ input: entry, platform: 'node', logLevel: 'silent', resolve: { extensions: ['.ts', '.tsx', '.mjs', '.js', '.json'] } });
  const { output } = await b.generate({ format: 'esm' });
  // ⚡ SPEED1000: מה שנארז — לרשם (מעקב-קריאות של בדיקות; rolldown קורא בקוד מקורי)
  globalThis.__catalogBundleDeps?.((output[0].moduleIds ?? []).filter((id) => typeof id === 'string' && id.startsWith('/')));
  await b.close();
  const out = join(ROOT, 'node_modules/.cache/catalog/bridge.mjs');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, output[0].code);
  return out;
}

export async function loadBridge() {
  const p = await bundleBridge();
  return import(pathToFileURL(p).href);
}
