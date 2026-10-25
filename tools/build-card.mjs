// בונה את דף הניהול כקובץ HTML יחיד — מועתק לכרטיס הזיכרון ונפתח בלחיצה כפולה,
// בלי שרת ובלי אינטרנט (מודולים חיצוניים לא נטענים מ-file://, קוד מוטמע כן).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const stripImports = (code) => code.replace(/^import .*?;\s*$/gm, '');
const exportsOf = (code) => [...code.matchAll(/^export (?:const|function) (\w+)/gm)].map((m) => m[1]);

// מודול ⇒ IIFE שמחזיר את מה שהוא מייצא
function ns(name, code) {
  const names = exportsOf(code);
  const body = stripImports(code).replace(/^export /gm, '');
  return `const ${name} = (() => {\n${body}\nreturn { ${names.join(', ')} };\n})();\n`;
}

const sign = read('engine/sign.mjs');
const kupa = read('engine/kupa.mjs');
const ean = read('engine/ean13svg.mjs');
const files = read('engine/files.mjs');
const keymap = read('engine/keymap.mjs');
const store = read('sim/store.mjs');
const manage = read('sim/manage.mjs');

const bundle = [
  ns('SIGN', sign),
  `const { ${exportsOf(sign).join(', ')} } = SIGN;`,
  ns('K', kupa),
  ns('EAN', ean),
  'const { ean13Svg } = EAN;',
  `const { ${exportsOf(kupa).join(', ')} } = K;`,
  ns('F', files),
  ns('KM', keymap),
  ns('STORE', store),
  `const { ${exportsOf(store).join(', ')} } = STORE;`,
  stripImports(manage),
].join('\n');

const html = read('sim/manage.html').replace(
  '<script type="module" src="./manage.mjs"></script>',
  () => `<script type="module">\n${bundle.replace(/<\/script/gi, '<\\/script')}\n</script>`,
);
if (html.includes('src="./manage.mjs"')) throw new Error('script tag not replaced');

mkdirSync(new URL('../dist/', import.meta.url), { recursive: true });
const out = new URL('../dist/ניהול-הקופה.html', import.meta.url);
writeFileSync(out, html);
console.log('built', out.pathname, html.length, 'bytes');
