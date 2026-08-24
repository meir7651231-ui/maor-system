#!/usr/bin/env node
/** 🥇 רתמת-זהב · פיד-יומן (ics-feed) — הישן (maor/src/lib/icsFeed.ts, מתורגם-חי עם
 *  typescript של מאור) ≡ החדש (Genesis new/boxes/ics-feed.mjs) על קורפוס-LCG:
 *  slug/projectId/token/ics(כולל גבולות-גודל+עברית)/opts × מסמכי-פיד קיימים/חסרים.
 *  אפס-סטייה: mintFeedToken (crypto דטרמיניסטי-מוזרק) · icsFeedUrl · readIcsFeedToken
 *  (עדות-נתיב) · publishIcsFeed (token+מסמך-נכתב). בלי Date.now — Date קבוע-מוזרק. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'icsf-'));

// ── תרגום-חי של המקור: מנטרלים את שני ה-import (firebase/firestore + ./cloud),
//    ומזריקים cloudDb/doc/getDoc/setDoc דרך שקע-גלובלי מתחלף. אפס "שיפור" — הגוף verbatim. ──
let srcTs = fs.readFileSync('/home/user/maor-system/src/lib/icsFeed.ts', 'utf8');
srcTs = srcTs
  .replace("import { doc, getDoc, setDoc } from 'firebase/firestore';", '')
  .replace("import { cloudDb } from './cloud';", '');
const preamble = [
  'const cloudDb = () => globalThis.__ICS_IO.db;',
  'const doc = (...a) => globalThis.__ICS_IO.doc(...a);',
  'const getDoc = (...a) => globalThis.__ICS_IO.getDoc(...a);',
  'const setDoc = (...a) => globalThis.__ICS_IO.setDoc(...a);',
  '',
].join('\n');
fs.writeFileSync(
  path.join(tdir, 'icsFeed.mjs'),
  ts.transpileModule(preamble + srcTs, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText,
);
const OLD = await import(pathToFileURL(path.join(tdir, 'icsFeed.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/ics-feed.mjs');

// ── שקעי-דטרמיניזם: crypto ניתן-לאיפוס + Date קבוע (שני הצדדים חולקים אותם) ──
let __cc = 0;
Object.defineProperty(globalThis, 'crypto', {
  configurable: true,
  value: {
    getRandomValues(a) {
      for (let i = 0; i < a.length; i++) { __cc = (__cc * 1664525 + 1013904223) >>> 0; a[i] = __cc & 0xff; }
      return a;
    },
  },
});
const NOW = '2026-08-24T10:00:00.000Z';
class FakeDate extends Date { constructor(...a) { if (a.length) super(...a); else super(NOW); } }
globalThis.Date = FakeDate;

// ── זיוף-Firestore זהה לשני הצדדים (בנוי מאותו snapData ⇒ נתיבים משתווים) ──
const makeIO = (snapData) => {
  const calls = { doc: [], get: 0, set: [] };
  return {
    calls,
    io: {
      db: 'DB',
      doc: (db, col, id) => { calls.doc.push([db, col, id]); return { db, col, id }; },
      getDoc: async () => { calls.get++; return { exists: () => snapData !== undefined, data: () => snapData }; },
      setDoc: async (ref, data) => { calls.set.push({ ref, data }); },
    },
  };
};

// ── קורפוס-LCG דטרמיניסטי (seed=20260824) ──
let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const slugs = ['kehila', 'org1', 'a-b', 'שלום', 'x y', ''];
const projs = ['proj-1', 'my-proj', 'us-central', ''];
const tokens = ['abc', 'A1B2', '', 'ק ו ד', 't&k=1'];
const icsBodies = ['', 'BEGIN:VCALENDAR', 'X'.repeat(10), 'א'.repeat(20),
  'a'.repeat(900_000), 'a'.repeat(900_001), 'א'.repeat(450_001)];
const snaps = [undefined, { token: 'tok-old' }, { token: '' }, { token: 42 },
  { token: 'a1b2c3d4', ics: 'BEGIN:VCALENDAR' }, { ics: 'no-token' }];
const optsSet = [undefined, {}, { rotate: false }, { rotate: true }];

const capture = async (fn) => { try { return { tok: await fn() }; } catch (e) { return { err: e.message }; } };

let n = 0;
for (let i = 0; i < 300; i++) {
  const slug = pick(slugs), proj = pick(projs), token = pick(tokens);
  const ics = pick(icsBodies), snap = pick(snaps), opts = pick(optsSet);

  // 1) mintFeedToken — crypto מאופס לאותו seed משני הצדדים ⇒ תו-בתו
  __cc = 777; const om = OLD.mintFeedToken();
  __cc = 777; const nm = NEW.mintFeedToken();
  assert.strictEqual(nm, om, 'mint'); assert.match(nm, /^[0-9a-f]{32}$/, 'mint-hex'); n++;

  // 2) icsFeedUrl — תו-בתו
  assert.strictEqual(NEW.icsFeedUrl(proj, slug, token), OLD.icsFeedUrl(proj, slug, token), 'url'); n++;

  // 3) readIcsFeedToken — תוצאה + עדות-נתיב (db,'icsFeeds',slug)
  const oR = makeIO(snap); globalThis.__ICS_IO = oR.io;
  const oldRead = await OLD.readIcsFeedToken(slug);
  const nR = makeIO(snap);
  const newRead = await NEW.readIcsFeedToken(slug, nR.io);
  assert.strictEqual(newRead, oldRead, `read ${slug}`);
  assert.deepStrictEqual(nR.calls.doc, oR.calls.doc, 'read-path');
  assert.strictEqual(nR.calls.get, oR.calls.get, 'read-get'); n++;

  // 4) publishIcsFeed — token/שגיאה + מסמך-נכתב + נתיבים (crypto מאופס זהה משני הצדדים)
  const oP = makeIO(snap); globalThis.__ICS_IO = oP.io; __cc = 555;
  const oldPub = await capture(() => OLD.publishIcsFeed(slug, ics, opts));
  const nP = makeIO(snap); __cc = 555;
  const newPub = await capture(() => NEW.publishIcsFeed(slug, ics, opts, nP.io));
  assert.deepStrictEqual(newPub, oldPub, `publish ${slug} ics=${ics.length}b opts=${JSON.stringify(opts)}`);
  assert.deepStrictEqual(nP.calls.set, oP.calls.set, 'publish-write');
  assert.deepStrictEqual(nP.calls.doc, oP.calls.doc, 'publish-doc-path');
  assert.strictEqual(nP.calls.get, oP.calls.get, 'publish-read-count'); n++;
}
fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-פיד-יומן: ישן≡חדש על ${n} השוואות (300 סבבים: mint+url+read+publish, נתיבי-ענן ומסמך-נכתב תו-בתו)`);
