#!/usr/bin/env node
/** 🥇 רתמת-זהב · גלריית-תמונות — הישן (maor/src/lib/photoGallery.ts, מתורגם-חי) ≡ החדש
 *  (Genesis new/boxes/photo-gallery.mjs) על קורפוס-LCG seed=20260824: מחרוזות-data
 *  חוקיות/פסולות (svg/http/עברית/null) × מערכים-מעורבים × ממדים. אפס-סטייה. בלי Date.now. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'pg-'));
// המקור טהור לחלוטין (אפס תלויות) — מתרגמים אותו כמו-שהוא
const srcTs = fs.readFileSync('/home/user/maor-system/src/lib/photoGallery.ts', 'utf8');
fs.writeFileSync(
  path.join(tdir, 'pg.mjs'),
  ts.transpileModule(srcTs, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText,
);
const OLD = await import(pathToFileURL(path.join(tdir, 'pg.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/photo-gallery.mjs');

// 0) קבועים ביט-זהים
assert.strictEqual(NEW.PHOTO_MAX, OLD.PHOTO_MAX, 'PHOTO_MAX');
assert.strictEqual(NEW.PHOTO_MAX_DIM, OLD.PHOTO_MAX_DIM, 'PHOTO_MAX_DIM');
assert.strictEqual(NEW.PHOTO_MAX_LEN, OLD.PHOTO_MAX_LEN, 'PHOTO_MAX_LEN');

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];

const fmts = ['png', 'jpeg', 'jpg', 'webp', 'gif', 'svg+xml', 'bmp'];
const mkImg = () => `data:image/${pick(fmts)};base64,${'A'.repeat(Math.floor(rnd() * 5))}`;
// מועמדי-מחרוזת: data-images (חלקם svg/bmp פסולים), url, עברית, ריק, וכן heavy
const heavy = 'data:image/png;base64,' + 'A'.repeat(OLD.PHOTO_MAX_LEN + 1);
const candidates = [mkImg, () => 'http://x/a.png', () => 'תמונה עברית', () => '', () => heavy, () => null, () => 123, () => ({ x: 1 }), () => undefined];

let n = 0;
for (let i = 0; i < 400; i++) {
  // 1) isDataImage תו-בתו
  const sVal = pick(candidates)();
  assert.strictEqual(NEW.isDataImage(sVal), OLD.isDataImage(sVal), `isDataImage ${JSON.stringify(sVal)}`);
  n++;

  // 2) canAddPhoto — מערכים באורכים 0..6 (כולל undefined)
  const len = Math.floor(rnd() * 7);
  const arr = rnd() < 0.1 ? undefined : Array.from({ length: len }, () => 'x');
  assert.strictEqual(NEW.canAddPhoto(arr), OLD.canAddPhoto(arr), `canAddPhoto len=${len}`);
  n++;

  // 3) fitDimensions — כולל אפס/שלילי/קטן. הישן מקבל max מפורש; החדש בברירת-PHOTO_MAX_DIM.
  const w = Math.floor(rnd() * 4000) - 200; // -200..3799
  const h = Math.floor(rnd() * 4000) - 200;
  const max = pick([OLD.PHOTO_MAX_DIM, 100, 1, 2, 2000]);
  assert.deepStrictEqual(NEW.fitDimensions(w, h, max), OLD.fitDimensions(w, h, max), `fit ${w}x${h}@${max}`);
  n++;
  // ובברירת-המחדל של הקופסה: NEW(w,h) ≡ OLD(w,h,PHOTO_MAX_DIM)
  assert.deepStrictEqual(NEW.fitDimensions(w, h), OLD.fitDimensions(w, h, OLD.PHOTO_MAX_DIM), `fit-default ${w}x${h}`);
  n++;

  // 4) sanitizePhotos — מערך-מעורב (data חוקי/svg/heavy/עברית/null) או לא-מערך
  const raw = rnd() < 0.1
    ? pick(['not-array', null, 42, { a: 1 }])
    : Array.from({ length: Math.floor(rnd() * 9) }, () => pick(candidates)());
  assert.deepStrictEqual(NEW.sanitizePhotos(raw), OLD.sanitizePhotos(raw), `sanitize ${JSON.stringify(raw).slice(0, 60)}`);
  n++;
}

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-גלריית-תמונות: ישן≡חדש על ${n} השוואות (400 סבבים: קבועים + isDataImage/canAddPhoto/fitDimensions/sanitizePhotos תו-בתו)`);
