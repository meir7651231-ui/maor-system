#!/usr/bin/env node
/** 🥇 רתמת-זהב · ניווט-אחורה+נפתחו-לאחרונה — הישן (maor src/lib/navhist.ts מתורגם-חי
 *  + חיווט-ה-store useApp.ts:1361-1405 משוחזר-שורה-בשורה עם הפונקציות הישנות) ≡ החדש
 *  (Genesis new/boxes/navhist.mjs) על קורפוס-LCG seed=20260824: מסעות-ניווט אקראיים
 *  (go/selectFamily/selectCourse/goBack) עם עברית/null/''/כפולים. אפס-סטייה. בלי Date.now. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'nh-'));
// המקור כולו טהור — מתורגם כמות-שהוא (interface נמחק ע"י הטרנספיילר)
const src = fs.readFileSync('/home/user/maor-system/src/lib/navhist.ts', 'utf8');
fs.writeFileSync(path.join(tdir, 'navhist.mjs'),
  ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
const OLD = await import(pathToFileURL(path.join(tdir, 'navhist.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/navhist.mjs');

// ── החיווט הישן, משוחזר verbatim מ-useApp.ts (navLocOf:652-654 · go:1362-1367 ·
//    selectFamily:1368-1379 · selectCourse:1380-1389 · goBack:1392-1405) ──
const locOf = (s) => ({ view: s.view, selFamilyId: s.selFamilyId, selCourseId: s.selCourseId });
const oldOps = {
  go: (s, view) => {
    const prev = locOf(s), next = { view, selFamilyId: s.selFamilyId, selCourseId: s.selCourseId };
    return { ...s, view, ...(OLD.sameLoc(prev, next) ? {} : { navHist: OLD.pushNav(s.navHist, prev) }) };
  },
  selectFamily: (s, id) => {
    const prev = locOf(s), next = { view: 'families', selFamilyId: id, selCourseId: s.selCourseId };
    return {
      ...s, selFamilyId: id, view: 'families',
      ...(OLD.sameLoc(prev, next) ? {} : { navHist: OLD.pushNav(s.navHist, prev) }),
      ...(id ? { recentIds: OLD.pushRecent(s.recentIds, id) } : {}),
    };
  },
  selectCourse: (s, id) => {
    const prev = locOf(s), next = { view: 'courses', selFamilyId: s.selFamilyId, selCourseId: id };
    return { ...s, selCourseId: id, view: 'courses', ...(OLD.sameLoc(prev, next) ? {} : { navHist: OLD.pushNav(s.navHist, prev) }) };
  },
  goBack: (s) => {
    const h = s.navHist, p = h[h.length - 1];
    if (!p) return s;
    return { ...s, navHist: h.slice(0, -1), view: p.view, selFamilyId: p.selFamilyId, selCourseId: p.selCourseId };
  },
};
// ── אותם מסעות דרך הקופסה החדשה ──
const newOps = {
  go: (s, view) => {
    const r = NEW.goTo({ hist: s.navHist, prev: locOf(s), view });
    return { ...s, view: r.view, navHist: r.hist };
  },
  selectFamily: (s, id) => {
    const r = NEW.openFamily({ hist: s.navHist, recentIds: s.recentIds, prev: locOf(s), id });
    return { ...s, view: r.view, selFamilyId: r.selFamilyId, navHist: r.hist, recentIds: r.recentIds };
  },
  selectCourse: (s, id) => {
    const r = NEW.openCourse({ hist: s.navHist, prev: locOf(s), id });
    return { ...s, view: r.view, selCourseId: r.selCourseId, navHist: r.hist };
  },
  goBack: (s) => {
    const r = NEW.goBack(s.navHist);
    if (!r) return s;
    return { ...s, navHist: r.hist, view: r.loc.view, selFamilyId: r.loc.selFamilyId, selCourseId: r.loc.selCourseId };
  },
};

let seed = 20260824;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const views = ['home', 'families', 'courses', 'calendar', 'settings', 'תרומות', 'families'];
const famIds = [null, '', 'f1', 'f2', 'משפחה-3', 'f1'];
const crsIds = [null, '', 'c1', 'חוג-אור', 'c1'];
const opNames = ['go', 'selectFamily', 'selectCourse', 'goBack', 'go', 'selectFamily', 'goBack'];

// קבועים ותצוגת-הכפתור
assert.strictEqual(NEW.NAV_HIST_MAX, OLD.NAV_HIST_MAX, 'NAV_HIST_MAX');
assert.strictEqual(NEW.RECENT_MAX, OLD.RECENT_MAX, 'RECENT_MAX');
let n = 2;

for (let round = 0; round < 300; round++) {
  let o = { view: 'home', selFamilyId: null, selCourseId: null, navHist: [], recentIds: [] };
  let w = { ...o };
  for (let step = 0; step < 30; step++) {
    const op = pick(opNames);
    const arg = op === 'go' ? pick(views) : op === 'selectFamily' ? pick(famIds) : pick(crsIds);
    o = oldOps[op](o, arg);
    w = newOps[op](w, arg);
    assert.deepStrictEqual(
      { view: w.view, selFamilyId: w.selFamilyId, selCourseId: w.selCourseId, navHist: w.navHist, recentIds: w.recentIds },
      { view: o.view, selFamilyId: o.selFamilyId, selCourseId: o.selCourseId, navHist: o.navHist, recentIds: o.recentIds },
      `round ${round} step ${step} op ${op}(${JSON.stringify(arg)})`);
    // הכפתור: מוצג רק כשיש היסטוריה (App.tsx:630 navHistLen>0)
    assert.strictEqual(NEW.canGoBack(w.navHist), o.navHist.length > 0, 'canGoBack');
    n += 2;
  }
}
fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-הניווט: ישן≡חדש על ${n} השוואות (300 מסעות × 30 צעדים: מצב-מלא + canGoBack), אפס-סטייה`);
