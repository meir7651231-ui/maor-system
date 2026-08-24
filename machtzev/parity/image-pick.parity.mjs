#!/usr/bin/env node
/** 🥇 רתמת-זהב · image-pick — הישן (maor/src/lib/imagePick.ts, מתורגם-חי) ≡ החדש
 *  (Genesis new/boxes/image-pick.mjs) על קורפוס-LCG (seed=20260824): סוגי-קובץ ×
 *  מימדים (כולל 0/עיגול/הגדלה) × גדלים × maxBytes. אפס-סטייה — פלט או זריקה זהים.
 *  אין Date.now; שקעי-הדפדפן (FileReader/Image/canvas) מזויפים דטרמיניסטית —
 *  אותה מכניקה גלובלית לישן, מוזרקת לחדש. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'ip-'));

// ── שקעי-דפדפן מזויפים דטרמיניסטיים (גלובליים לישן) ──
// data-URL מקודד את המימדים ⇒ Image משחזר אותם; canvas.toDataURL דטרמיניסטי.
function encode(file) { return `DATA:${file.type}:${file._w}x${file._h}`; }
globalThis.FileReader = class {
  readAsDataURL(file) { this.result = encode(file); queueMicrotask(() => this.onload && this.onload()); }
};
globalThis.Image = class {
  set src(v) { const m = /:(\d+)x(\d+)$/.exec(v); this.width = +m[1]; this.height = +m[2];
    queueMicrotask(() => this.onload && this.onload()); }
  get src() { return this._src; }
};
globalThis.document = {
  createElement() {
    const c = { width: 0, height: 0 };
    c.getContext = () => ({ drawImage() {} });
    c.toDataURL = (type, q) => `OUT|${c.width}x${c.height}|${type}|q=${q}`;
    return c;
  },
};

// ── תרגום-חי של המקור ──
const oldSrc = fs.readFileSync('/home/user/maor-system/src/lib/imagePick.ts', 'utf8');
fs.writeFileSync(path.join(tdir, 'imagePick.mjs'),
  ts.transpileModule(oldSrc, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
const OLD = await import(pathToFileURL(path.join(tdir, 'imagePick.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/image-pick.mjs');

// שקעי-io לחדש = אותה מכניקה של הפייק הגלובלי
const io = {
  readAsDataUrl: (file) => new Promise((res) => { const r = new globalThis.FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(file); }),
  loadImage: (src) => new Promise((res) => { const im = new globalThis.Image(); im.onload = () => res(im); im.src = src; }),
  createCanvas: () => globalThis.document.createElement('canvas'),
};

async function outcome(fn) { try { return { v: await fn() }; } catch (e) { return { err: e.message }; } }

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const types = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/', 'text/plain', 'application/pdf', '', ' '];
const dims = [0, 1, 25, 50, 100, 319, 320, 321, 333, 480, 640, 1000, 2000];
const sizes = [0, 1, 1000, 3145728, 3145729, 8388608, 8388609, 12000000];
const maxes = [undefined, 1048576, 2621440, 3145728, 5000000];

let n = 0;
for (let i = 0; i < 400; i++) {
  const file = { type: pick(types), size: pick(sizes), _w: pick(dims), _h: pick(dims) };
  // 1) pickAndCompressImage — פלט/זריקה זהים
  const oldP = await outcome(() => OLD.pickAndCompressImage(file));
  const newP = await outcome(() => NEW.pickAndCompressImage(file, io));
  assert.deepStrictEqual(newP, oldP, `pick: ${JSON.stringify(file)} ⇒ old=${JSON.stringify(oldP)} new=${JSON.stringify(newP)}`);
  n++;
  // 2) readFileAsDataUrl — פלט/זריקה זהים (maxBytes אקראי כולל ברירת-מחדל)
  const mb = pick(maxes);
  const oldR = await outcome(() => mb === undefined ? OLD.readFileAsDataUrl(file) : OLD.readFileAsDataUrl(file, mb));
  const newR = await outcome(() => NEW.readFileAsDataUrl(file, io, mb));
  assert.deepStrictEqual(newR, oldR, `read: ${JSON.stringify(file)} mb=${mb} ⇒ old=${JSON.stringify(oldR)} new=${JSON.stringify(newR)}`);
  n++;
}

// שוויון-קבועים ישן≡חדש
assert.strictEqual(NEW.MAX_UPLOAD_BYTES, OLD.MAX_UPLOAD_BYTES, 'MAX_UPLOAD_BYTES');
assert.strictEqual(NEW.MAX_EMBED_BYTES, OLD.MAX_EMBED_BYTES, 'MAX_EMBED_BYTES');

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-image-pick: ישן≡חדש על ${n} השוואות (400 סבבים × pick+read: פלט-או-זריקה תו-בתו) + 2 קבועים`);
