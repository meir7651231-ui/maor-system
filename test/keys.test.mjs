// מקשי המכשיר (PicoCalc + מדבקות): כל מקש פיזי עושה משהו; מקשים מהירים, ישירים, בדיקת מחיר, ±1
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as K from '../engine/kupa.mjs';
import * as R from '../engine/register.mjs';
import * as KM from '../engine/keymap.mjs';

const NOW = '2026-10-25T14:59:00';
const SHIRT = '7290000000011';

function fresh() {
  let card = K.updateSettings(K.emptyCard(), { bizName: 'בוטיק', osekNo: '000000018' });
  card = K.upsertProduct(card, { code: SHIRT, name: 'חולצה', price: 8990, stock: 5 }).card;
  const r = K.nextInternalCode(card);
  card = K.upsertProduct(r.card, { code: r.code, name: 'שקית', price: 100, stock: null }).card;
  card = K.setQuick(card, 1, r.code).card;
  card = K.setQuick(card, 30, SHIRT).card;
  const device = K.newDevice('KUPA-T', 'a1'.repeat(32));
  return R.insertCard(R.initState({ card, device, inserted: false }), card, {}, NOW).st;
}
function keys(st, seq) {
  let out;
  const prints = [];
  for (const k of seq) { ({ st, out } = k.startsWith('scan:') ? R.scan(st, k.slice(5), NOW) : R.press(st, k, NOW)); prints.push(...out.prints); }
  return { st, out, prints };
}

test('המקלדת: 67 מקשים פיזיים, כולם פעילים, אין כפילות', () => {
  const all = KM.allKeys();
  assert.equal(all.length, 67);
  assert.equal(new Set(all.map((x) => x.k)).size, 67);
  assert.equal(all.filter((x) => x.cls === 'quick').length, K.QUICK_KEYS);
});

test('כל מקש במקלדת מוכר למנוע — אף לחיצה לא "נבלעת" בשקט', () => {
  const st = keys(fresh(), ['scan:' + SHIRT, 'Q1']).st; // שתי שורות — כדי שגם החצים יזוזו
  for (const x of KM.allKeys()) {
    const from = x.k === 'DOWN' ? { ...st, sel: 0 } : st; // ▼ מהשורה העליונה, ▲ מהתחתונה
    const r = R.press(from, x.k, NOW);
    const changed = JSON.stringify(r.st) !== JSON.stringify(from) || r.out.prints.length || r.out.beep !== null;
    assert.ok(changed, `המקש ${x.phys} (${x.k}) לא עשה כלום`);
  }
});

test('מקש מהיר = מוצר בלחיצה אחת; מקש לא מוגדר ⇒ הודעה', () => {
  let r = keys(fresh(), ['Q1', 'Q1', 'Q30']);
  assert.deepEqual(r.st.cart.lines.map((l) => [l.name, l.qty]), [['שקית', 2], ['חולצה', 1]]);
  r = keys(r.st, ['Q5']);
  assert.match(r.st.msg.text, /לא הוגדר/);
  // מוצר שנמחק — המקש לא מצביע עליו יותר
  assert.equal(K.quickCode(K.removeProduct(fresh().card, SHIRT), 30), '');
});

test('מקשים מהירים: רק רשימת ברקודים; ערך פגום מהמחשב לא שובר', () => {
  const c = fresh().card;
  assert.ok(K.setQuick(c, 31, SHIRT).error);
  assert.ok(K.setQuick(c, 2, '999').error);
  const bad = K.parseCard(K.serializeCard({ ...c, settings: { ...c.settings, quick: 'x' } })).card;
  assert.deepEqual(bad.settings.quick, []);
  assert.equal(K.setQuick(c, 30, '').card.settings.quick.length, 1); // ריקים בסוף מתקצרים
});

test('מקשים ישירים: דוח X, מלאי, העתק — בלי לעבור בתפריט; לא באמצע עסקה', () => {
  let r = keys(fresh(), ['scan:' + SHIRT, 'CREDIT', 'X']);
  assert.ok(r.prints.at(-1).some((l) => l.includes('דוח ביניים')));
  r = keys(r.st, ['STOCK']);
  assert.ok(r.prints[0].some((l) => l.includes('דוח מלאי')));
  r = keys(r.st, ['COPY']);
  assert.ok(r.prints[0].some((l) => l.includes('העתק')));
  r = keys(r.st, ['scan:' + SHIRT, 'X']);
  assert.match(r.st.msg.text, /קודם סיימו/);
  r = keys(r.st, ['CANCEL', 'CANCEL', 'Z']);
  assert.equal(r.st.mode, 'confirmZ');
});

test('בדיקת מחיר: מראה מחיר ומלאי ולא מוסיפה לעסקה', () => {
  let r = keys(fresh(), ['PCHK', 'scan:' + SHIRT]);
  assert.match(r.st.msg.text, /חולצה · ₪89\.90 · במלאי 5/);
  assert.equal(r.st.cart.lines.length, 0);
  assert.equal(r.st.mode, 'sale');
  r = keys(r.st, ['PCHK', 'Q1']);
  assert.match(r.st.msg.text, /שקית · ₪1\.00/);
  r = keys(r.st, ['PCHK', 'C']);
  assert.equal(r.st.mode, 'sale');
});

test('±1 על השורה הנבחרת; −1 לא מוריד מתחת ל-1; לא בהחזרה', () => {
  let r = keys(fresh(), ['scan:' + SHIRT, 'PLUS', 'PLUS']);
  assert.equal(r.st.cart.lines[0].qty, 3);
  r = keys(r.st, ['MINUS', 'MINUS', 'MINUS']);
  assert.equal(r.st.cart.lines[0].qty, 1);
  assert.match(r.st.msg.text, /מחק/);
  r = keys(r.st, ['CREDIT', 'REFUND', '1', 'OK', 'scan:' + SHIRT, 'PLUS']);
  assert.match(r.st.msg.text, /בהחזרה/);
});
