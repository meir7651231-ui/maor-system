#!/usr/bin/env node
/** 🥇 רתמת-זהב · support-chat — הישן (maor/src/lib/supportChat.ts, מתורגם-חי ב-typescript
 *  של מאור) ≡ החדש (Genesis new/boxes/support-chat.mjs) על קורפוס-LCG דטרמיניסטי
 *  (seed=20260824): טקסטים-עברית/רווחים/ארוכים/null · ISO תקין+שבור · שיחות/הודעות.
 *  אפס-סטייה. בלי Date.now — כל התאריכים קבועים. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-'));
// המקור כולו — transpileModule מפשיט את ה-types (interfaces), החוטים נשארים.
const scSrc = fs.readFileSync('/home/user/maor-system/src/lib/supportChat.ts', 'utf8');
fs.writeFileSync(
  path.join(tdir, 'sc.mjs'),
  ts.transpileModule(scSrc, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText,
);
const OLD = await import(pathToFileURL(path.join(tdir, 'sc.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/support-chat.mjs');

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];

// ── מאגרי-קלט ──
const rawTexts = [
  null, undefined, '', '   ', 'שלום עולם', '  עברית  ', 'a'.repeat(2100), 'x'.repeat(50),
  '\tטאב\n', 'עם   רווחים   רבים', 'קו בלתי-שביר', 'תודה רבה!', 'a', ' x ', '😀 אימוג׳י',
];
// ISO — תקין (עם/בלי T), שבור, ריק
const ats = [
  '2026-08-24T10:00:00', '2026-08-24T08:00:00', '2026-08-23T23:59:00', '2026-08-24',
  '2026-08-01T00:00:00', '2026-12-31T12:30:00', 'שבור', '', '2026-13-40T99:99', '2025-02-28T06:15:00',
];
const todays = ['2026-08-24', '2026-08-23', '2026-01-01', '2026-12-31', '2026-08-01'];
const sides = ['admin', 'user'];

const mkMsg = () => ({ from: pick(sides), text: pick(rawTexts) ?? '', at: pick(ats) });
const mkTeamMsg = () => ({ sender: pick(['a@b.co', 'c@d.co']), name: pick(['אבי', 'דנה']), text: pick(rawTexts) ?? '', at: pick(ats) });
const mkThread = (i) => {
  const t = { uid: 'u' + i };
  if (rnd() < 0.8) t.lastAt = pick(ats);
  if (rnd() < 0.6) t.unreadAdmin = Math.floor(rnd() * 6) - 1; // כולל שלילי/0
  if (rnd() < 0.6) t.unreadUser = Math.floor(rnd() * 6) - 1;
  return t;
};

let n = 0;
const eq = (a, b, ctx) => { assert.deepStrictEqual(a, b, ctx); n++; };

// 1) קבוע
assert.strictEqual(NEW.SUPPORT_MSG_MAX, OLD.SUPPORT_MSG_MAX, 'SUPPORT_MSG_MAX'); n++;

for (let i = 0; i < 400; i++) {
  const raw = pick(rawTexts);
  eq(NEW.sanitizeSupportText(raw), OLD.sanitizeSupportText(raw), 'sanitize');
  eq(NEW.isSendableSupportText(raw), OLD.isSendableSupportText(raw), 'isSendable');

  const at = pick(ats);
  eq(NEW.supportMsgTime(at), OLD.supportMsgTime(at), 'supportMsgTime ' + at);

  const today = pick(todays);
  eq(NEW.supportDayLabel(at, today), OLD.supportDayLabel(at, today), `dayLabel ${at}|${today}`);

  const txt = pick(rawTexts);
  const max = 1 + Math.floor(rnd() * 45);
  eq(NEW.supportPreview(txt, max), OLD.supportPreview(txt, max), 'preview');
  eq(NEW.supportPreview(txt), OLD.supportPreview(txt), 'preview-default');

  const thread = rnd() < 0.15 ? null : mkThread(i);
  const side = pick(sides);
  eq(NEW.supportUnread(thread, side), OLD.supportUnread(thread, side), 'unread');

  const msgs = Array.from({ length: Math.floor(rnd() * 6) }, mkMsg);
  eq(NEW.sortSupportMsgs(msgs), OLD.sortSupportMsgs(msgs), 'sortSupportMsgs');

  const tmsgs = Array.from({ length: Math.floor(rnd() * 6) }, mkTeamMsg);
  eq(NEW.sortTeamMsgs(tmsgs), OLD.sortTeamMsgs(tmsgs), 'sortTeamMsgs');

  const threads = Array.from({ length: Math.floor(rnd() * 7) }, (_, k) => mkThread(k));
  eq(NEW.sortSupportThreads(threads), OLD.sortSupportThreads(threads), 'sortSupportThreads');
}

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-support-chat: ישן≡חדש על ${n} השוואות (400 סבבים · 9 חוטים + קבוע · טקסט/ISO/שיחות)`);
