#!/usr/bin/env node
/** 🥇 רתמת-זהב · lib-pwa — הישן (maor/src/lib/pwa.ts, מתורגם-חי) ≡ החדש
 *  (Genesis new/boxes/lib-pwa.mjs) על קורפוס-LCG seed=20260824. אפס-סטייה.
 *  שקעי-הדפדפן (window/navigator/document/serviceWorker/Blob/import.meta.env)
 *  מוזרקים כגלובלים-מזויפים למקור וכפרמטרים לחדש — ומושווים תו-בתו:
 *    installAvailable · promptInstall · isIos · isStandalone ·
 *    registerPwa (רצף-קריאות-serviceWorker) · applyOrgManifest (JSON-המניפסט).
 *  בלי Date.now — אין תלות-זמן. גבול-IO אמיתי (fetch/DOM) מוחלף בשקע-מרגל בלבד. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'pwa-'));

// ── טרנספילציה-חיה של המקור, עם החלפת שקעי-import.meta.env לגלובלים ומחיקת ה-import של featureOn ──
let oldSrc = fs.readFileSync('/home/user/maor-system/src/lib/pwa.ts', 'utf8');
oldSrc = oldSrc
  .replace("import { featureOn } from './config';", '')
  .replaceAll('import.meta.env.PROD', 'globalThis.__PROD__')
  .replaceAll('import.meta.env.BASE_URL', 'globalThis.__BASE__');
// featureOn נאמן-ל-config.ts עבור מפתחות-shell (shell אינו מודול-ניווט ⇒ שרשור-דגלים בלבד)
const shim = `const featureOn = (cfg, key) => { const p = key.split('.'); for (let i = 1; i <= p.length; i++) { if (cfg.features?.[p.slice(0, i).join('.')] === false) return false; } return true; };\n`;
const oldOut = ts.transpileModule(oldSrc, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
fs.writeFileSync(path.join(tdir, 'old.mjs'), shim + oldOut);

// ── שקעי-דפדפן גלובליים (חייבים להיות מוגדרים לפני ה-import — ה-listener נרשם בזמן-טעינה) ──
// navigator הוא גטר-קריאה-בלבד ב-node 22 ⇒ defineProperty (לא השמה ישירה)
const setGlobal = (k, v) => Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true });
let capturedHandler = null;
setGlobal('window', {
  addEventListener: (name, h) => { if (name === 'beforeinstallprompt') capturedHandler = h; },
  dispatchEvent: () => {},
  location: { href: 'https://root.example/' },
  matchMedia: () => ({ matches: false }),
});
setGlobal('navigator', { userAgent: '' });
setGlobal('document', { querySelector: () => null });
globalThis.__PROD__ = true;
globalThis.__BASE__ = '/';

// לכידת JSON-המניפסט דרך Blob/createObjectURL (המקור בונה Blob([JSON]) ומקבל blob-url)
let blobText = null; let blobSeq = 0;
class CaptureBlob { constructor(parts) { blobText = Array.isArray(parts) ? parts[0] : parts; } }
globalThis.Blob = CaptureBlob;
globalThis.URL.createObjectURL = () => 'blob:old' + (++blobSeq);
globalThis.URL.revokeObjectURL = () => {};

const OLD = await import(pathToFileURL(path.join(tdir, 'old.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/lib-pwa.mjs');
assert.ok(capturedHandler, 'listener beforeinstallprompt לא נלכד מהמקור');

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];

const uas = ['', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 'Mozilla/5.0 (iPad; CPU OS 16)',
  'Mozilla/5.0 (Windows NT 10.0) Firefox/120', 'Mozilla/5.0 (Linux; Android 13) Chrome', 'iPod touch'];
const outcomes = ['accepted', 'dismissed', 'unknown', ''];
const mmMatches = [true, false];
const standaloneVals = [true, false, undefined];
const configs = [
  { features: {} }, { features: { 'shell.pwa': false } }, { features: { shell: false } },
  { features: { 'shell.pwa': true } }, {},
];
const slugs = ['default', 'maor', 'עמותה', '', 'a-very-long-organization-slug'];
const names = ['', '   ', 'מאור', 'מאור החסד לקהילה', 'X', 'ארגון-עם-שם-ארוך-מאוד-בהחלט'];
const bases = ['/', '/app/', '/c/x/', 'https://s.co/base/'];
const hrefs = ['https://s.co/', 'https://sub.b.org/x', 'http://d.local:3000/'];

let n = 0;
const realCreate = globalThis.URL.createObjectURL;
try {
  for (let i = 0; i < 250; i++) {
    // ── א׳: installAvailable + promptInstall (מצב-מודול נשלט דרך ה-listener) ──
    // מצב-פתיחה: deferredInstall=null (אופס בסבב-קודם ע"י promptInstall)
    assert.strictEqual(OLD.installAvailable(), false, 'OLD.installAvailable init != null');
    assert.strictEqual(NEW.installAvailable(null), OLD.installAvailable(), 'installAvailable(null)');
    n++;
    const outcome = pick(outcomes);
    const mk = () => ({ prompt: async () => {}, userChoice: Promise.resolve({ outcome }) });
    const eOld = mk();
    capturedHandler({ preventDefault: () => {}, ...eOld, prompt: eOld.prompt, userChoice: eOld.userChoice });
    // ה-handler שם deferredInstall=האירוע; installAvailable ⇒ true
    assert.strictEqual(OLD.installAvailable(), true, 'OLD.installAvailable אחרי-לכידה');
    assert.strictEqual(NEW.installAvailable(eOld), OLD.installAvailable(), 'installAvailable(event)');
    n++;
    const oldRes = await OLD.promptInstall();
    const newRes = await NEW.promptInstall(mk());
    assert.strictEqual(newRes, oldRes, `promptInstall outcome=${outcome}`);
    n++;
    // אחרי promptInstall שני-הצדדים אופסו ⇒ null
    assert.strictEqual(OLD.installAvailable(), false, 'OLD אופס אחרי promptInstall');
    assert.strictEqual(NEW.installAvailable(null), false, 'NEW null אחרי promptInstall');
    n++;

    // ── ב׳: isIos (navigator גלובלי) ──
    const ua = pick(uas);
    setGlobal("navigator", { userAgent: ua });
    assert.strictEqual(NEW.isIos(), OLD.isIos(), `isIos ua=${ua}`);
    n++;

    // ── ג׳: isStandalone (window+navigator גלובליים למקור, מוזרקים לחדש) ──
    const mm = pick(mmMatches), sa = pick(standaloneVals);
    globalThis.window.matchMedia = () => ({ matches: mm });
    setGlobal("navigator", { userAgent: ua, standalone: sa });
    const oldSA = OLD.isStandalone();
    const newSA = NEW.isStandalone({ window: globalThis.window, navigator: globalThis.navigator });
    assert.strictEqual(newSA, oldSA, `isStandalone mm=${mm} sa=${sa}`);
    n++;

    // ── ד׳: registerPwa (רצף-קריאות-serviceWorker תו-בתו) ──
    const cfg = pick(configs);
    const isProd = pick([true, false]);
    const hasSW = pick([true, false]);
    const webdriver = pick([true, false]);
    const base = pick(bases), href = pick(hrefs);
    const existing = [[], ['https://s.co/base/sw.js'], ['https://x/sw.js', 'https://x/o.js']][Math.floor(rnd() * 3)];
    const makeSpyNav = () => {
      const log = [];
      const swUrlOf = new URL(base + 'sw.js', href).href;
      const nav = { webdriver, userAgent: ua };
      if (hasSW) nav.serviceWorker = {
        register: (u) => { log.push('register:' + u); return { catch: () => {} }; },
        getRegistrations: () => Promise.resolve(existing.map((url) => ({ active: { scriptURL: url }, unregister: () => log.push('unregister:' + url) }))),
      };
      return { nav, log, swUrlOf };
    };
    const A = makeSpyNav(), B = makeSpyNav();
    // מקור: navigator/window/import.meta גלובליים
    setGlobal("navigator", A.nav);
    globalThis.window.location = { href };
    globalThis.__PROD__ = isProd;
    globalThis.__BASE__ = base;
    OLD.registerPwa(cfg);
    NEW.registerPwa(cfg, { navigator: B.nav, isProd, baseUrl: base, href });
    await Promise.resolve(); await Promise.resolve();
    assert.strictEqual(JSON.stringify(B.log), JSON.stringify(A.log),
      `registerPwa cfg=${JSON.stringify(cfg)} prod=${isProd} sw=${hasSW} wd=${webdriver}`);
    n++;

    // ── ה׳: applyOrgManifest — JSON-המניפסט תו-בתו (או שניהם דילגו) ──
    const mcfg = { slug: pick(slugs), orgName: pick(names) };
    const mbase = pick(bases), mhref = pick(hrefs);
    const hasLink = rnd() < 0.85;
    const fakeLink = { href: null, setAttribute(k, v) { if (k === 'href') this.href = v; } };
    globalThis.document = { querySelector: () => (hasLink ? fakeLink : null) };
    globalThis.window.location = { href: mhref };
    globalThis.__BASE__ = mbase;
    globalThis.URL.createObjectURL = realCreate;
    blobText = null;
    OLD.applyOrgManifest(mcfg);
    const oldManifest = fakeLink.href ? blobText : null;
    // חדש דרך שקעים מזויפים
    let newBlob = null; const newLink = { href: null, setAttribute(k, v) { if (k === 'href') this.href = v; } };
    NEW.applyOrgManifest(mcfg, {
      document: { querySelector: () => (hasLink ? newLink : null) },
      baseUrl: mbase, href: mhref,
      makeBlob: (str) => str,
      createObjectURL: (str) => { newBlob = str; return 'blob:new'; },
      revokeObjectURL: () => {},
      state: {},
    });
    const newManifest = newLink.href ? newBlob : null;
    assert.strictEqual(newManifest, oldManifest, `applyOrgManifest slug=${mcfg.slug} name=${JSON.stringify(mcfg.orgName)} link=${hasLink}`);
    n++;
  }
} finally {
  globalThis.URL.createObjectURL = realCreate;
  fs.rmSync(tdir, { recursive: true, force: true });
  delete globalThis.window; delete globalThis.navigator; delete globalThis.document;
  delete globalThis.__PROD__; delete globalThis.__BASE__;
}
console.log(`🥇 זהב-lib-pwa: ישן≡חדש על ${n} השוואות (250 סבבים: installAvailable/promptInstall/isIos/isStandalone/registerPwa-actions/applyOrgManifest-JSON תו-בתו)`);
