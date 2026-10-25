import { test } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import * as K from '../engine/kupa.mjs';
import * as R from '../engine/register.mjs';
import * as U from '../engine/update.mjs';

const NOW = '2026-10-25T14:59:00';
const subtle = webcrypto.subtle;

async function keys() {
  const k = await subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const pub = Buffer.from(await subtle.exportKey('raw', k.publicKey)).toString('base64');
  return { k, pub };
}
async function build(k, version, payloadText = 'firmware-bytes', notes = 'תיקונים') {
  const payload = new TextEncoder().encode(payloadText);
  const manifest = U.makeManifest({ version, notes, regNo: 'R-1', created: '2026-10-25' }, payload);
  const sig = new Uint8Array(await subtle.sign('Ed25519', k.privateKey, U.signedMessage(manifest)));
  return { manifest, payload: U.bytesToB64(payload), sig: U.bytesToB64(sig) };
}

test('עדכון חתום ותקין — עובר את כל הבדיקות', async () => {
  const { k, pub } = await keys();
  const u = await build(k, '1.1.0');
  assert.ok(U.checkUpdate(u, '1.0.0').ok);
  assert.deepEqual(await U.verifyUpdate(u, pub, subtle), { ok: true });
});

test('עדכון שתוכנו שונה אחרי החתימה — נדחה', async () => {
  const { k } = await keys();
  const u = await build(k, '1.1.0');
  const bad = { ...u, payload: U.bytesToB64(new TextEncoder().encode('evil')) };
  assert.match(U.checkUpdate(bad, '1.0.0').error, /לא תואם לטביעה/);
});

test('חתימה במפתח אחר / manifest ששונה — נדחה', async () => {
  const a = await keys(), b = await keys();
  const u = await build(a.k, '1.1.0');
  assert.match((await U.verifyUpdate(u, b.pub, subtle)).error, /חתימת העדכון לא תקינה/);
  const forged = { ...u, manifest: { ...u.manifest, version: '9.9.9' } };
  assert.match((await U.verifyUpdate(forged, a.pub, subtle)).error, /לא תקינה/);
});

test('אין חזרה לגרסה ישנה, אין מוצר אחר, בלי מפתח — אין עדכון', async () => {
  const { k } = await keys();
  assert.ok(U.checkUpdate(await build(k, '1.0.0'), '1.0.0').old);
  assert.ok(U.checkUpdate(await build(k, '0.9.0'), '1.0.0').old);
  const other = await build(k, '2.0.0');
  assert.match(U.checkUpdate({ ...other, manifest: { ...other.manifest, product: 'x' } }, '1.0.0').error, /מוצר אחר/);
  assert.match((await U.verifyUpdate(other, null, subtle)).error, /לא הוגדר מפתח/);
  assert.equal(U.cmpVersion('1.10.0', '1.9.9'), 1);
});

test('בקופה: עדכון בכרטיס ⇒ אישור ⇒ קוד מנהל ⇒ אימות ⇒ נרשם ביומן החתום וגרסה בדוח Z', async () => {
  const { k, pub } = await keys();
  let card = K.updateSettings(K.emptyCard(), { bizName: 'ב', osekNo: '000000018' });
  card = K.setPin(card, '2468').card;
  const device = K.newDevice('KUPA-T', 'a1'.repeat(32));
  let r = R.insertCard(R.initState({ card, device, inserted: false }), card, {}, NOW);
  const upd = JSON.stringify(await build(k, '1.1.0'));
  r = R.insertCard(R.ejectCard(r.st).st, r.st.card, { [U.UPDATE_FILE]: upd }, NOW);
  assert.equal(r.st.mode, 'confirmUpdate');
  assert.match(r.st.msg.text, /עדכון לגרסה 1.1.0/);
  r = R.press(r.st, 'OK', NOW); // ⇒ קוד מנהל
  assert.equal(r.st.mode, 'pin');
  for (const d of '2468') r = R.press(r.st, d, NOW);
  r = R.press(r.st, 'OK', NOW);
  assert.equal(r.st.mode, 'updating');
  assert.ok(r.out.verifyUpdate);
  const res = await U.verifyUpdate(r.out.verifyUpdate, pub, subtle);
  r = R.updateResult(r.st, res, NOW);
  assert.match(r.st.msg.text, /עודכנה לגרסה 1.1.0/);
  assert.equal(r.st.device.version, '1.1.0');
  assert.equal(r.st.card.ops.at(-1).op, 'UPDATE');
  assert.ok(r.out.persist && r.out.install);
  assert.ok(K.checkCard(r.st.card, r.st.device).card);
  // אותו קובץ בהכנסה הבאה — כבר מותקן ⇒ לא שואל שוב
  const again = R.insertCard(R.ejectCard(r.st).st, r.st.card, { [U.UPDATE_FILE]: upd }, NOW);
  assert.equal(again.st.mode, 'sale');
  // הגרסה מודפסת בדוח
  let z = R.press(R.press(again.st, '1', NOW).st, 'PRICE', NOW);
  z = R.press(z.st, 'CREDIT', NOW);
  z = R.press(R.press(z.st, 'MENU', NOW).st, '2', NOW);
  for (const d of '2468') z = R.press(z.st, d, NOW);
  z = R.press(z.st, 'OK', NOW);
  z = R.press(z.st, 'OK', NOW);
  assert.ok(z.out.prints[0].some((l) => l.includes('גרסת תוכנה') && l.includes('1.1.0')));
});

test('בקופה: עדכון עם חתימה שגויה ⇒ נדחה, הגרסה לא משתנה ושום דבר לא נשמר', async () => {
  const a = await keys(), b = await keys();
  const card = K.updateSettings(K.emptyCard(), { bizName: 'ב', osekNo: '000000018' });
  const device = K.newDevice('KUPA-T', 'a1'.repeat(32));
  let r = R.insertCard(R.initState({ card, device, inserted: false }), card, { [U.UPDATE_FILE]: JSON.stringify(await build(a.k, '1.1.0')) }, NOW);
  r = R.press(r.st, 'OK', NOW);
  const res = await U.verifyUpdate(r.out.verifyUpdate, b.pub, subtle);
  r = R.updateResult(r.st, res, NOW);
  assert.match(r.st.msg.text, /לא תקינה/);
  assert.equal(R.versionOf(r.st), U.VERSION);
  assert.equal(r.out.persist, false);
});

test('קובץ עדכון פגום/משובש ⇒ הודעה, והקופה ממשיכה למכור', () => {
  const card = K.updateSettings(K.emptyCard(), { bizName: 'ב', osekNo: '000000018' });
  const device = K.newDevice('KUPA-T', 'a1'.repeat(32));
  const r = R.insertCard(R.initState({ card, device, inserted: false }), card, { [U.UPDATE_FILE]: '{broken' }, NOW);
  assert.equal(r.st.mode, 'sale');
  assert.match(r.st.msg.text, /קובץ העדכון בכרטיס נדחה/);
});
