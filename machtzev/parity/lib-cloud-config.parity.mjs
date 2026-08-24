#!/usr/bin/env node
/** 🥇 רתמת-זהב · lib-cloud-config — הישן (maor/src/lib/cloudConfig.ts, מתורגם-חי עם
 *  typescript של מאור) ≡ החדש (Genesis new/boxes/lib-cloud-config.mjs) על קורפוס-LCG
 *  דטרמיניסטי (seed=20260824): slugs/uids/מיילים(עברית+רווחים+null) · טקסטי-צ׳אט ·
 *  patches-סודות · snaps קיימים/חסרים · רשימות-מסמכים. אפס-סטייה: כל חוט מושווה
 *  ב(א) ערך-מוחזר ו(ב) רצף-קריאות-ה-Firestore (נתיבים/data/merge/FieldPath/increment)
 *  תו-בתו. שקעי-Firestore זהים לשני הצדדים; Date קבוע-מוזרק (בלי Date.now). */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccfg-'));
const tp = (src) => ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;

// ── Date קבוע (שני הצדדים חולקים) — כל at/updatedAt/deletedAt דטרמיניסטי ──
const NOW = '2026-08-24T10:00:00.000Z';
class FakeDate extends Date { constructor(...a) { if (a.length) super(...a); else super(NOW); } }
globalThis.Date = FakeDate;

// ── sanitizeSupportText האמיתי מ-supportChat.ts (חילוץ החוט לבדו) ──
const scSrc = fs.readFileSync('/home/user/maor-system/src/lib/supportChat.ts', 'utf8');
fs.writeFileSync(path.join(tdir, 'sc.mjs'), tp(scSrc));
const SC = await import(pathToFileURL(path.join(tdir, 'sc.mjs')).href);

// ── FieldPath משותף (מחלקה יחידה ⇒ deepStrictEqual משווה מופעים) — מוגדר לפני
//    ייבוא-OLD כי המקור קושר אותו ברמת-המודול (const FieldPath = globalThis.__CC_FieldPath). ──
class FieldPath { constructor(...seg) { this.__seg = seg; } }
globalThis.__CC_FieldPath = FieldPath;

// ── תרגום-חי של המקור: מנטרלים firebase/firestore + ./cloud + ./supportChat,
//    ומזריקים את כולם דרך שקע-גלובלי מתחלף (__CC_IO). אפס "שיפור" — הגוף verbatim. ──
let srcTs = fs.readFileSync('/home/user/maor-system/src/lib/cloudConfig.ts', 'utf8');
srcTs = srcTs
  .replace(/import \{ addDoc, arrayRemove.*?\} from 'firebase\/firestore';\n/, '')
  .replace("import { cloudDb } from './cloud';\n", '')
  .replace(/import \{ sanitizeSupportText,.*?\} from '\.\/supportChat';\n/, '');
const preamble = [
  'const cloudDb = () => globalThis.__CC_IO.db;',
  'const FieldPath = globalThis.__CC_FieldPath;',
  'const sanitizeSupportText = (...a) => globalThis.__CC_IO.sanitize(...a);',
  ...['doc', 'collection', 'setDoc', 'addDoc', 'deleteDoc', 'updateDoc', 'getDoc', 'getDocs',
    'onSnapshot', 'query', 'where', 'arrayUnion', 'arrayRemove', 'deleteField', 'increment']
    .map((k) => `const ${k} = (...a) => globalThis.__CC_IO.${k}(...a);`),
  '',
].join('\n');
fs.writeFileSync(path.join(tdir, 'cc.mjs'), tp(preamble + srcTs));
const OLD = await import(pathToFileURL(path.join(tdir, 'cc.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/lib-cloud-config.mjs');

// ── מפעל-Firestore מזויף (לוג רושם-קריאות, זהה לשני הצדדים) ──
const makeIO = (snap, docsList) => {
  const log = { doc: [], collection: [], setDoc: [], addDoc: [], deleteDoc: [], updateDoc: [], getDoc: 0, getDocs: 0, onSnapshot: [] };
  const nexts = [], errs = [];
  const io = {
    db: 'DB',
    sanitize: SC.sanitizeSupportText,
    FieldPath,
    doc: (_db, ...seg) => { log.doc.push(seg); return { __r: 'doc', seg }; },
    collection: (_db, ...seg) => { log.collection.push(seg); return { __r: 'col', seg }; },
    setDoc: async (ref, data, opts) => { log.setDoc.push({ ref, data, opts: opts ?? null }); },
    addDoc: async (ref, data) => { log.addDoc.push({ ref, data }); },
    deleteDoc: async (ref) => { log.deleteDoc.push(ref); },
    updateDoc: async (ref, ...rest) => { log.updateDoc.push({ ref, rest }); },
    getDoc: async () => { log.getDoc++; return { exists: () => snap !== undefined, data: () => snap }; },
    getDocs: async () => { log.getDocs++; return { docs: docsList }; },
    onSnapshot: (ref, next, err) => { log.onSnapshot.push({ ref }); nexts.push(next); errs.push(err); return () => 'unsub'; },
    query: (colRef, ...clauses) => ({ __r: 'query', colRef, clauses }),
    where: (field, op, val) => ({ __where: [field, op, val] }),
    arrayUnion: (...v) => ({ __arrayUnion: v }),
    arrayRemove: (...v) => ({ __arrayRemove: v }),
    deleteField: () => ({ __deleteField: true }),
    increment: (n) => ({ __increment: n }),
  };
  return { io, log, nexts, errs };
};

// ── קורפוס-LCG דטרמיניסטי (seed=20260824) ──
let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const maybe = (v) => (rnd() < 0.5 ? v : undefined);

const slugs = ['kehila', 'org1', 'a-b', 'שלום', 'x y', ''];
const uids = ['u1', 'u77', 'abcDEF', ''];
const emails = [' A@B.CO ', 'e@o.co', 'ADMIN@ORG.CO', '   ', 'x@y.z'];
const texts = [null, undefined, '', '   ', 'שלום עולם', '  עברית  ', 'a'.repeat(2100), '\tטאב\n', 'תודה!', ' x '];
const names = ['דנה', 'ענת', '', 'a'.repeat(80)];
const metas = [{}, { email: 'e@o.co', orgName: 'ארגון' }, { email: 'x'.repeat(200) }];
const reqs = [{ orgName: 'א', contactName: 'משה', phone: '050', x: undefined }, { email: 'e@o.co' }, {}];
const leads = [{ phone: '050', notes: 'הערה' }, { contactName: 'רות', at: undefined }, {}];
const patches = [{ smtpUrl: ' u ' }, { smsApiKey: '' }, { unknownKey: 'x' }, { yemotToken: 'T', smtpUrl: '' }, {}];
const fields = ['weeklyGoal', 'designations'];
const sides = ['admin', 'user'];
const entityColsPool = [['families'], ['families', 'courses'], []];
const snaps = [undefined, { config: {}, members: ['a@b.co'] }, { orgName: 'א' }, { smtpUrl: true }, { token: 'x' }, { unreadAdmin: 2 }];
const docListPool = [
  [],
  [{ id: 'd1', ref: 'R1', data: () => ({ orgName: 'א' }) }],
  [{ id: 'd1', ref: 'R1', data: () => ({ email: 'e@o.co' }) }, { id: 'd2', ref: 'R2', data: () => ({ email: 'c@d.co', lastText: 'שלום' }) }],
];

// ── משווה: מריץ OLD ואז NEW על שני IO טריים (אותו snap/docs) ומוודא ret+log זהים ──
let n = 0;
const cmp = async (name, oldRun, newRun, snap, docs) => {
  const O = makeIO(snap, docs); globalThis.__CC_IO = O.io;
  let oRet, oErr = null; try { oRet = await oldRun(O.io); } catch (e) { oErr = e.message; }
  const N = makeIO(snap, docs); globalThis.__CC_IO = N.io; // NEW מקבל io כ-cloud, אך גם משתמש בגלובל דרך אטומים? לא — האטומים מקבלים fs מפורש.
  let nRet, nErr = null; try { nRet = await newRun(N.io); } catch (e) { nErr = e.message; }
  assert.strictEqual(nErr, oErr, `${name}: שגיאה ${nErr} ≠ ${oErr}`);
  assert.deepStrictEqual(nRet, oRet, `${name}: ערך-מוחזר`);
  assert.deepStrictEqual(N.log, O.log, `${name}: רצף-קריאות-Firestore`);
  n++;
  return { O, N };
};

// ── משווה-האזנה: בונה watcher בשני הצדדים, מוודא נתיב זהה, ומריץ next/err עם צילום ──
const cmpWatch = (name, oldMk, newMk, driveSnap, snap, docs) => {
  const O = makeIO(snap, docs); globalThis.__CC_IO = O.io;
  const oSeen = []; oldMk(O.io, (x) => oSeen.push(x));
  const N = makeIO(snap, docs); globalThis.__CC_IO = N.io;
  const nSeen = []; newMk(N.io, (x) => nSeen.push(x));
  assert.deepStrictEqual(N.log.collection, O.log.collection, `${name}: collection-path`);
  assert.deepStrictEqual(N.log.doc, O.log.doc, `${name}: doc-path`);
  assert.deepStrictEqual(N.log.onSnapshot.map((x) => x.ref), O.log.onSnapshot.map((x) => x.ref), `${name}: onSnapshot-ref`);
  // מפעילים את next עם צילום, ואז err — שני הצדדים
  O.nexts[0](driveSnap); N.nexts[0](driveSnap);
  let oq = true, nq = true; try { O.errs[0](new Error('denied')); } catch { oq = false; } try { N.errs[0](new Error('denied')); } catch { nq = false; }
  assert.deepStrictEqual(nSeen, oSeen, `${name}: cb-פלט`);
  assert.strictEqual(nq, oq, `${name}: כשל-רך`);
  n++;
};

for (let i = 0; i < 300; i++) {
  // כל קלט-אקראי נדגם **פעם-אחת** ומשותף לשני הצדדים (אחרת ה-RNG מתפצל ⇒ קלטים שונים)
  const slug = pick(slugs), uid = pick(uids), email = pick(emails), text = pick(texts);
  const snap = pick(snaps), docs = pick(docListPool);
  const req = pick(reqs), req2 = pick(reqs), patch = pick(patches), field = pick(fields);
  const cols = pick(entityColsPool), lead = pick(leads), meta = pick(metas), side = pick(sides), name = pick(names);
  const cfg = { theme: pick(['a', 'b']), modules: {}, x: undefined };

  await cmp('fetchOrgCloudConfig', () => OLD.fetchOrgCloudConfig(slug), (io) => NEW.fetchOrgCloudConfig(slug, io), snap, docs);
  await cmp('writeOrgCloudDoc', () => OLD.writeOrgCloudDoc(slug, req), (io) => NEW.writeOrgCloudDoc(slug, req, io), snap, docs);
  await cmp('writeOrgCloudConfig', () => OLD.writeOrgCloudConfig(slug, cfg), (io) => NEW.writeOrgCloudConfig(slug, cfg, io), snap, docs);
  await cmp('writeOrgSecrets', () => OLD.writeOrgSecrets(slug, patch), (io) => NEW.writeOrgSecrets(slug, patch, io), snap, docs);
  await cmp('readOrgSecretsMeta', () => OLD.readOrgSecretsMeta(slug), (io) => NEW.readOrgSecretsMeta(slug, io), snap, docs);
  await cmp('deleteOrgRequest', () => OLD.deleteOrgRequest(uid), (io) => NEW.deleteOrgRequest(uid, io), snap, docs);
  await cmp('writeOrgRequest', () => OLD.writeOrgRequest(uid, req), (io) => NEW.writeOrgRequest(uid, req, io), snap, docs);
  await cmp('fetchOrgRequests', () => OLD.fetchOrgRequests(), (io) => NEW.fetchOrgRequests(io), snap, docs);
  await cmp('findMemberOrgSlugs', () => OLD.findMemberOrgSlugs(email), (io) => NEW.findMemberOrgSlugs(email, io), snap, docs);
  await cmp('fetchAllOrgs', () => OLD.fetchAllOrgs(), (io) => NEW.fetchAllOrgs(io), snap, docs);
  await cmp('writeOrgJoinRequest', () => OLD.writeOrgJoinRequest(slug, uid, req2), (io) => NEW.writeOrgJoinRequest(slug, uid, req2, io), snap, docs);
  await cmp('fetchOrgJoinRequests', () => OLD.fetchOrgJoinRequests(slug), (io) => NEW.fetchOrgJoinRequests(slug, io), snap, docs);
  await cmp('deleteOrgJoinRequest', () => OLD.deleteOrgJoinRequest(slug, uid), (io) => NEW.deleteOrgJoinRequest(slug, uid, io), snap, docs);
  await cmp('deleteOrgMemberConfig', () => OLD.deleteOrgMemberConfig(slug, email), (io) => NEW.deleteOrgMemberConfig(slug, email, io), snap, docs);
  await cmp('clearEmployeeField', () => OLD.clearEmployeeField(slug, email, field), (io) => NEW.clearEmployeeField(slug, email, field, io), snap, docs);
  await cmp('addOrgMember', () => OLD.addOrgMember(slug, email), (io) => NEW.addOrgMember(slug, email, io), snap, docs);
  await cmp('removeOrgMember', () => OLD.removeOrgMember(slug, email), (io) => NEW.removeOrgMember(slug, email, io), snap, docs);
  await cmp('deleteOrgCompletely', () => OLD.deleteOrgCompletely(slug, cols), (io) => NEW.deleteOrgCompletely(slug, cols, io), snap, docs);
  await cmp('writeOrgLead', () => OLD.writeOrgLead(lead), (io) => NEW.writeOrgLead(lead, io), snap, docs);
  await cmp('fetchOrgLeads', () => OLD.fetchOrgLeads(), (io) => NEW.fetchOrgLeads(io), snap, docs);
  await cmp('sendSupportMessage', () => OLD.sendSupportMessage(uid, meta, text), (io) => NEW.sendSupportMessage(uid, meta, text, io), snap, docs);
  await cmp('sendSupportReply', () => OLD.sendSupportReply(uid, text), (io) => NEW.sendSupportReply(uid, text, io), snap, docs);
  await cmp('markSupportRead', () => OLD.markSupportRead(uid, side), (io) => NEW.markSupportRead(uid, side, io), snap, docs);
  await cmp('sendTeamMessage', () => OLD.sendTeamMessage(slug, email, name, text), (io) => NEW.sendTeamMessage(slug, email, name, text, io), snap, docs);

  // ── האזנות (4) ──
  const driveMsgs = { docs: [{ id: 'm1', data: () => ({ from: 'user', text: 'שלום', at: '2026-08-24T09:00:00.000Z' }) }, { id: 'm2', data: () => ({ from: 'admin', text: 'היי', at: '2026-08-24T09:05:00.000Z' }) }] };
  const driveMeta = { exists: () => snap !== undefined, data: () => snap };
  const driveThreads = { docs: [{ id: 'u1', data: () => ({ lastText: 'שלום', unreadAdmin: 2 }) }, { id: 'u2', data: () => ({ lastText: 'היי' }) }] };
  cmpWatch('watchOrgCloudConfig', (io, cb) => OLD.watchOrgCloudConfig(slug, cb), (io, cb) => NEW.watchOrgCloudConfig(slug, cb, io), driveMeta, snap, docs);
  cmpWatch('watchSupportMessages', (io, cb) => OLD.watchSupportMessages(uid, cb), (io, cb) => NEW.watchSupportMessages(uid, cb, io), driveMsgs, snap, docs);
  cmpWatch('watchSupportThreadMeta', (io, cb) => OLD.watchSupportThreadMeta(uid, cb), (io, cb) => NEW.watchSupportThreadMeta(uid, cb, io), driveMeta, snap, docs);
  cmpWatch('watchAllSupportThreads', (io, cb) => OLD.watchAllSupportThreads(cb), (io, cb) => NEW.watchAllSupportThreads(cb, io), driveThreads, snap, docs);
  cmpWatch('watchTeamMessages', (io, cb) => OLD.watchTeamMessages(slug, cb), (io, cb) => NEW.watchTeamMessages(slug, cb, io), driveMsgs, snap, docs);

  // ── קבועים ──
  assert.strictEqual(NEW.PLATFORM_ORGS, OLD.PLATFORM_ORGS, 'PLATFORM_ORGS');
  assert.strictEqual(NEW.PLATFORM_REQUESTS, OLD.PLATFORM_REQUESTS, 'PLATFORM_REQUESTS');
  assert.strictEqual(NEW.PLATFORM_LEADS, OLD.PLATFORM_LEADS, 'PLATFORM_LEADS');
  assert.strictEqual(NEW.SUPPORT_CHATS, OLD.SUPPORT_CHATS, 'SUPPORT_CHATS');
  assert.strictEqual(NEW.TEAM_CHATS, OLD.TEAM_CHATS, 'TEAM_CHATS');
  assert.deepStrictEqual([...NEW.ORG_SECRET_KEYS], [...OLD.ORG_SECRET_KEYS], 'ORG_SECRET_KEYS');
  n += 6;
}

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-lib-cloud-config: ישן≡חדש על ${n} השוואות (300 סבבים · 35 חוטים — ערך-מוחזר + רצף-Firestore + האזנות + קבועים, אפס-סטייה)`);
