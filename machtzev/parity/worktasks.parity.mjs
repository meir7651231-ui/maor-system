#!/usr/bin/env node
/** 🥇 רתמת-זהב · משימות-העבודה — הישן (maor/src/lib/worktasks.ts, מתורגם-חי)
 *  ≡ החדש (Genesis new/boxes/worktasks.mjs) על קורפוס-LCG seed=20260824:
 *  משימות עם עדיפויות/יעדים/doneAt-עבר-והווה-ועתיד/זהויות-עם-רווחים-ורישיות ×
 *  תורמים עם/בלי nextDate + קיימות-דדופ. אפס-סטייה. בלי Date.now — היום קבוע. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'wt-'));
// הקובץ מייבא רק `import type` (נמחק בטרנספילציה) — מתרגמים כלשונו.
const wtSrc = fs.readFileSync('/home/user/maor-system/src/lib/worktasks.ts', 'utf8');
fs.writeFileSync(path.join(tdir, 'wt.mjs'), ts.transpileModule(wtSrc, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText);
const OLD = await import(pathToFileURL(path.join(tdir, 'wt.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/worktasks.mjs');

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];

const TODAY = '2026-08-24';
const emails = [null, undefined, '', 'a@x.co', 'A@X.co', ' a@x.co ', 'b@x.co', 'מקומי'];
const dues = [undefined, '2026-08-01', '2026-08-20', '2026-08-24', '2026-08-25', '2026-09-10'];
const dones = [undefined, '2026-08-10T09:00', '2026-08-17T00:00', '2026-08-18T23:59',
  '2026-08-23T09:00', '2026-08-24T12:00', '2026-08-25T08:00'];
const pris = [1, 2, 3];
const kinds = ['supporter', 'family'];

const mkTask = () => {
  const t = { assignee: pick(emails), pri: pick(pris), createdAt: '2026-08-' + String(1 + Math.floor(rnd() * 28)).padStart(2, '0') };
  const due = pick(dues); if (due) t.due = due;
  const done = pick(dones); if (done) t.doneAt = done;
  if (rnd() < 0.5) t.ref = { kind: pick(kinds), id: 's' + Math.floor(rnd() * 6) };
  return t;
};
const mkSup = (i) => {
  const sp = { id: 's' + i, name: pick(['ראובן', 'שמעון', 'לוי', 'יהודה', '']) };
  const nd = pick([undefined, '2026-08-01', '2026-08-24', '2026-08-25', '2026-09-01']);
  if (nd) sp.nextDate = nd;
  return sp;
};

let n = 0;
for (let i = 0; i < 400; i++) {
  const tasks = Array.from({ length: Math.floor(rnd() * 8) }, mkTask);
  const identity = pick(emails);

  // identityOf ≡ taskIdentity
  assert.strictEqual(NEW.identityOf(identity), OLD.taskIdentity(identity), 'identity'); n++;

  // openTasks ≡ openTasksFor (תו-בתו על הסדר)
  assert.deepStrictEqual(NEW.openTasks(tasks, identity), OLD.openTasksFor(tasks, identity), 'open'); n++;

  // doneToday ≡ doneTodayFor
  assert.strictEqual(NEW.doneToday(tasks, identity, TODAY), OLD.doneTodayFor(tasks, identity, TODAY), 'done'); n++;

  // stats ≡ taskStatsFor
  assert.deepStrictEqual(NEW.stats(tasks, identity, TODAY), OLD.taskStatsFor(tasks, identity, TODAY), 'stats'); n++;

  // isOverdue ≡ taskOverdue (על כל משימה)
  for (const t of tasks) { assert.strictEqual(NEW.isOverdue(t, TODAY), OLD.taskOverdue(t, TODAY), 'overdue'); n++; }

  // contactDrafts ≡ overdueContactTaskDrafts
  const sups = Array.from({ length: Math.floor(rnd() * 6) }, (_, k) => mkSup(k));
  assert.deepStrictEqual(
    NEW.contactDrafts(sups, tasks, identity, TODAY),
    OLD.overdueContactTaskDrafts(sups, tasks, identity, TODAY), 'drafts'); n++;
}
// מילון-עדיפות ≡ קבוע-המקור
assert.deepStrictEqual(NEW.PRI_LABELS, OLD.PRI_LABELS, 'PRI_LABELS'); n++;

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-worktasks: ישן≡חדש על ${n} השוואות (400 סבבים: identity/open/done/stats/overdue/drafts + מילון-עדיפות)`);
