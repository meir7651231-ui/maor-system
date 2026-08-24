#!/usr/bin/env node
/** 🥇 רתמת-זהב · עוזר-AI (lib-ai) — הישן (maor/src/lib/ai.ts, מתורגם-חי) ≡ החדש
 *  (Genesis new/boxes/lib-ai.mjs) על קורפוס-LCG seed=20260824. אפס-סטייה על ארבעת
 *  החוטים: כספת-מפתח (readAiKey/writeAiKey — nsLsKey+storage מוזרקים) · thanksPrompt ·
 *  askClaude (doFetch מוזרק, אפס רשת). בלי Date.now. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-'));

// המקור החי — מסירים רק את שורת-הייבוא של nsLsKey (השקע), שאותו נזריק כגלובל.
// readAiKey/writeAiKey מפנים ל-nsLsKey ו-localStorage כמשתנים-חופשיים ⇒ גלובל.
const aiSrc = fs.readFileSync('/home/user/maor-system/src/lib/ai.ts', 'utf8')
  .split('\n').filter((l) => !/from '\.\.\/store\/persist'/.test(l)).join('\n');
fs.writeFileSync(path.join(tdir, 'ai.mjs'), ts.transpileModule(aiSrc, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText);
const OLD = await import(pathToFileURL(path.join(tdir, 'ai.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/lib-ai.mjs');

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];

const store = (map, opts = {}) => ({
  getItem: (k) => { if (opts.throwGet) throw new Error('x'); return k in map ? map[k] : null; },
  setItem: (k, v) => { if (opts.throwSet) throw new Error('x'); map[k] = v; },
  removeItem: (k) => { if (opts.throwSet) throw new Error('x'); delete map[k]; },
});
const nsVariants = [(b) => b, (b) => b + ':org1', (b) => b + ':חסד'];
const keys = ['sk-abc', '  sk-padded  ', '', '   ', '\tsk\t', 'מפתח-עברי', 'sk-' + '9'.repeat(40), 'x'];
const initMaps = [{}, { maor_ai_key: 'pre' }, { 'maor_ai_key:org1': 'preorg' }];

let n = 0;
for (let i = 0; i < 400; i++) {
  const ns = pick(nsVariants);
  const throwGet = rnd() < 0.15, throwSet = rnd() < 0.15;

  // ── readAiKey: ישן≡חדש ──
  {
    const m = { ...pick(initMaps) };
    globalThis.nsLsKey = ns;
    globalThis.localStorage = store(m, { throwGet });
    const rOld = OLD.readAiKey();
    const rNew = NEW.readAiKey(ns, store({ ...m }, { throwGet }));
    assert.strictEqual(rNew, rOld, `readAiKey #${i}`);
    n++;
  }

  // ── writeAiKey: אפקט ישן≡חדש (מפת-האחסון הסופית) ──
  {
    const key = pick(keys);
    const oldMap = { ...pick(initMaps) };
    const newMap = { ...oldMap };
    globalThis.nsLsKey = ns;
    globalThis.localStorage = store(oldMap, { throwSet });
    OLD.writeAiKey(key);
    NEW.writeAiKey(ns, store(newMap, { throwSet }), key);
    assert.deepStrictEqual(newMap, oldMap, `writeAiKey #${i} key=${JSON.stringify(key)}`);
    n++;
  }

  // ── thanksPrompt: ישן≡חדש (תו-בתו) ──
  {
    const inp = {
      orgName: pick(['מאור', '', 'ארגון הבנייה', 'A"B']),
      supporterName: pick(['דנה לוי', 'ר׳ כהן', 'משפ׳ ישראלי']),
      lastAmount: pick(['₪500', '$100', '1,250 ₪']),
      designation: pick([undefined, 'אמץ חתן', 'קמחא דפסחא']),
      totalSoFar: pick([undefined, '₪2,000', '$5,400']),
    };
    assert.strictEqual(NEW.thanksPrompt(inp), OLD.thanksPrompt(inp), `thanksPrompt #${i}`);
    n++;
  }

  // ── askClaude: ישן≡חדש (תוצאה/שגיאה + צורת-הבקשה) ──
  {
    const status = pick([200, 200, 200, 401, 429, 500, 503]);
    const blocks = pick([
      [{ type: 'text', text: '  שלום עולם  ' }],
      [{ type: 'thinking', text: 'X' }, { type: 'text', text: 'א' }, { type: 'text', text: 'ב' }],
      [{ type: 'text' }],
      [],
      [{ type: 'text', text: '   ' }],
    ]);
    const apiKey = pick(['sk-1', 'מפתח', '']);
    const prompt = pick(['פרומפט', 'שאלה\nשורה2', '']);
    const mk = () => {
      let cap = null;
      const fetchFn = async (u, init) => { cap = { u, init }; return { ok: status >= 200 && status < 300, status, json: async () => ({ content: blocks }) }; };
      return { fetchFn, get: () => cap };
    };
    const o = mk(), nw = mk();
    const run = async (fn, f) => { try { return { v: await fn('X', 'Y', f) }; } catch (e) { return { e: e.message }; } };
    const rOld = await run(OLD.askClaude, o.fetchFn);
    const rNew = await run(NEW.askClaude, nw.fetchFn);
    assert.deepStrictEqual(rNew, rOld, `askClaude #${i} status=${status}`);
    assert.deepStrictEqual(nw.get(), o.get(), `askClaude request-shape #${i}`);
    n++;
    // מסלול-מפתח/פרומפט חיים (לא רק 'X'/'Y') — התוצאה וצורת-הבקשה מול המקור
    const capO = mk(), capN = mk();
    const rr = await run((a, p, ff) => OLD.askClaude(apiKey, prompt, ff), capO.fetchFn);
    const rr2 = await run((a, p, ff) => NEW.askClaude(apiKey, prompt, ff), capN.fetchFn);
    assert.deepStrictEqual(rr2, rr, `askClaude live-args #${i}`);
    assert.deepStrictEqual(capN.get(), capO.get(), `askClaude live-request #${i}`);
    n++;
  }
}

delete globalThis.nsLsKey; delete globalThis.localStorage;
fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-lib-ai: ישן≡חדש על ${n} השוואות (400 סבבים: כספת-מפתח + פרומפט + askClaude תוצאה+צורת-בקשה)`);
