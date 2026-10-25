// הקופה: מסך + מקלדת + סורק + מדפסת. כל החישוב במנוע; כאן רק קלט/תצוגה.
import * as K from '../engine/kupa.mjs';
import { loadCard, saveCard, cardInserted, setInserted, loadDevice, saveDevice } from './store.mjs';

const $ = (id) => document.getElementById(id);

let device = loadDevice();
let card = loadCard();
let inserted = cardInserted();
let cardError = ''; // כרטיס שנפסל (נערך / ישן / של קופה אחרת)
let cart = K.emptyCart();
let buf = '';
let sel = -1; // -1 = השורה האחרונה
let mode = 'sale'; // sale | menu | confirmZ | cash
let paidInfo = null; // אחרי תשלום במזומן: {paid, change} — מוצג עד הסריקה הבאה
let cancelArmed = false;
let msg = { text: '', kind: '' };
let lastReceipt = null;

// ── עזר ──
function nowIso() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
function bufAgorot() {
  if (!buf) return null;
  const n = Number(buf);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}
function selIdx() { return sel < 0 ? cart.lines.length - 1 : sel; }
function say(text, kind = 'info') { msg = { text, kind }; }

let ac;
function beep(ok = true) {
  try {
    ac = ac || new AudioContext();
    const tones = ok ? [[1800, 0.07]] : [[300, 0.12], [220, 0.16]];
    let t = ac.currentTime;
    for (const [f, d] of tones) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.value = f; g.gain.value = 0.08;
      o.connect(g); g.connect(ac.destination);
      o.start(t); o.stop(t + d); t += d + 0.04;
    }
  } catch { /* בלי שמע */ }
}

function print(lines) {
  const roll = $('roll');
  const empty = roll.querySelector('.empty');
  if (empty) empty.remove();
  const slip = document.createElement('div');
  slip.className = 'slip';
  for (const l of lines) {
    const d = document.createElement('div');
    d.className = 'ln';
    d.textContent = l || ' ';
    slip.appendChild(d);
  }
  roll.prepend(slip);
  roll.scrollTop = 0;
}

// במכשיר: קודם הכרטיס, אחר כך הזיכרון הפנימי (כתיבה אטומית לכל אחד)
function commit(r) { card = r.card; saveCard(card); if (r.device) { device = r.device; saveDevice(device); } }

function readCard() {
  card = loadCard();
  const r = K.checkCard(card, device);
  if (r.error) { cardError = r.error; say(`⛔ ${r.error}`, 'err'); beep(false); return; }
  cardError = '';
  if (r.bound) { card = r.card; saveCard(card); }
}

function ready() {
  if (!inserted) { say('אין כרטיס בקופה', 'err'); beep(false); return false; }
  if (cardError) { say(`⛔ ${cardError}`, 'err'); beep(false); return false; }
  if (!K.isConfigured(card)) { say('הקופה לא הוגדרה — הוציאו את הכרטיס והגדירו עסק במחשב', 'err'); beep(false); return false; }
  return true;
}

// ── פעולות ──
function scan(code) {
  code = String(code).trim();
  if (!code) return;
  if (!ready()) return render();
  const r = K.cartAdd(cart, card, code);
  if (r.error) { say(`${r.error}: ${code}`, 'err'); beep(false); }
  else { cart = r.cart; sel = -1; buf = ''; paidInfo = null; const l = cart.lines[cart.lines.length - 1]; say(`${l.name} · ${K.money(l.price)}`, 'ok'); beep(true); }
  cancelArmed = false;
  render();
}

function pay(method) {
  if (!ready()) return;
  const tendered = method === 'cash' ? (bufAgorot() ?? 0) : 0;
  const r = K.checkout(card, cart, { method, tendered, now: nowIso(), device });
  if (r.error) { say(r.error, 'err'); beep(false); return; }
  commit(r);
  lastReceipt = r.receipt;
  print(K.receiptLines(card, r.receipt));
  cart = K.emptyCart(); buf = ''; sel = -1; mode = 'sale';
  paidInfo = method === 'cash' && r.receipt.type === 'sale' ? { paid: r.receipt.tendered, change: r.receipt.change } : null;
  say(`קבלה ${r.receipt.no} הודפסה`, 'ok');
  beep(true);
}

// מצב "כמה שילם הלקוח": מקלידים סכום ⇒ רואים עודף/חסר תוך כדי ⇒ אישור/מזומן
function cashKey(k) {
  if (/^[0-9]$/.test(k) || k === '00' || k === '.') {
    if (buf.length < 9 && !(k === '.' && buf.includes('.'))) buf += k;
  } else if (k === 'C') {
    if (buf) buf = ''; else { mode = 'sale'; say('התשלום בוטל — אפשר להמשיך לסרוק', 'info'); }
  } else if (k === 'OK' || k === 'CASH') {
    const t = K.cartTotals(cart, card.settings.vatRate).total;
    const paid = bufAgorot() ?? t; // בלי סכום = שילם בדיוק
    if (paid < t) { say(`חסרים ₪${K.money(t - paid)}`, 'err'); beep(false); }
    else pay('cash');
  } else if (k === 'CREDIT') {
    buf = ''; pay('credit');
  }
  render();
}

function menuPick(n) {
  mode = 'sale';
  if (n === '1') { const r = K.printInterim(card, nowIso(), device); commit(r); print(K.reportLines(card, r.report)); say('דוח ביניים הודפס', 'ok'); }
  else if (n === '2') { mode = 'confirmZ'; say('סגירת יום? אישור = כן · C = לא', 'info'); }
  else if (n === '3') { print(K.stockLines(card, nowIso())); say('דוח מלאי הודפס', 'ok'); }
  else if (n === '4') {
    if (lastReceipt) { commit(K.logOp(card, device, nowIso(), 'COPY', { ref: lastReceipt.no })); print(K.receiptLines(card, lastReceipt, { copy: true })); say('העתק הודפס', 'ok'); }
    else { say('אין קבלה אחרונה', 'err'); beep(false); }
  } else { say('בחירה לא קיימת', 'err'); beep(false); }
}

function key(k) {
  if (mode === 'menu') {
    if (/^[0-9]$/.test(k)) menuPick(k);
    else if (k === 'C') { mode = 'sale'; say(''); }
    return render();
  }
  if (mode === 'cash') return cashKey(k);
  if (mode === 'confirmZ') {
    if (k === 'OK') {
      const r = K.closeDay(card, nowIso(), device);
      if (r.error) { say(r.error, 'err'); beep(false); }
      else { commit(r); print(K.reportLines(card, r.report)); say(`יום ${r.report.no} נסגר`, 'ok'); beep(true); }
    } else say('סגירת היום בוטלה', 'info');
    mode = 'sale';
    return render();
  }
  if (k !== 'CANCEL') cancelArmed = false;

  if (/^[0-9]$/.test(k) || k === '00' || k === '.') {
    if (buf.length < 9 && !(k === '.' && buf.includes('.'))) buf += k;
  } else if (k === 'C') {
    if (buf) buf = ''; else say('');
  } else if (k === 'UP') {
    if (cart.lines.length) sel = Math.max(0, selIdx() - 1);
  } else if (k === 'DOWN') {
    if (cart.lines.length) { const i = selIdx() + 1; sel = i >= cart.lines.length - 1 ? -1 : i; }
  } else if (k === 'MENU') {
    if (cart.lines.length) { say('קודם סיימו או בטלו את העסקה', 'err'); beep(false); }
    else if (ready()) { mode = 'menu'; say(''); }
  } else if (k === 'OK') {
    if (buf) { const code = buf; buf = ''; return scan(code); } // הקלדת ברקוד ידנית
  } else if (!ready()) {
    /* ready() כבר הציג שגיאה */
  } else if (k === 'QTY') {
    const q = Number(buf);
    const r = K.cartSetQty(cart, selIdx(), q);
    if (r.error) { say(r.error, 'err'); beep(false); } else { cart = r.cart; buf = ''; say(`כמות: ${q}`, 'ok'); }
  } else if (k === 'DISC') {
    const a = bufAgorot();
    const r = a === null ? { error: 'הקלידו סכום הנחה' } : K.cartDiscount(cart, selIdx(), a);
    if (r.error) { say(r.error, 'err'); beep(false); } else { cart = r.cart; buf = ''; say(`הנחה ₪${K.money(a)}`, 'ok'); }
  } else if (k === 'PRICE') {
    const a = bufAgorot();
    const r = a === null ? { error: 'הקלידו מחיר' } : K.cartAddManual(cart, a);
    if (r.error) { say(r.error, 'err'); beep(false); } else { cart = r.cart; sel = -1; buf = ''; say(`פריט כללי ₪${K.money(a)}`, 'ok'); beep(true); }
  } else if (k === 'DEL') {
    const r = K.cartVoid(cart, selIdx());
    if (r.error) { say('אין מה למחוק', 'err'); beep(false); } else { cart = r.cart; sel = -1; say('השורה נמחקה', 'info'); }
  } else if (k === 'CANCEL') {
    if (!cart.lines.length && !cart.refund) say('אין עסקה פתוחה', 'info');
    else if (!cancelArmed) { cancelArmed = true; say('לבטל את כל העסקה? לחצו בטל שוב', 'info'); }
    else {
      const t = K.cartTotals(cart, card.settings.vatRate);
      if (cart.lines.length) commit(K.logOp(card, device, nowIso(), 'CANCEL', { items: t.items, amount: t.total }));
      cart = K.emptyCart(); buf = ''; sel = -1; cancelArmed = false; say('העסקה בוטלה ונרשמה', 'info');
    }
  } else if (k === 'REFUND') {
    cart = K.cartToggleRefund(cart);
    say(cart.refund ? 'מצב החזרה — סרקו את הפריטים המוחזרים' : 'חזרה למכירה רגילה', 'info');
  } else if (k === 'CASH') {
    if (cart.refund || buf) pay('cash'); // החזרה, או קיצור: סכום הוקלד מראש
    else if (!cart.lines.length) { say('אין פריטים', 'err'); beep(false); }
    else { mode = 'cash'; say(''); }
  } else if (k === 'CREDIT') {
    pay('credit');
  }
  render();
}

// ── מסך ──
function render() {
  const s = $('screen');
  const t = K.cartTotals(cart, card.settings.vatRate);
  const clock = nowIso().slice(11, 16);
  const head = `<div class="s-head"><span>${esc(card.settings.bizName || 'קופה לא מוגדרת')}</span><span>${inserted ? '💾' : '⛔ אין כרטיס'} ${clock}</span></div>`;
  let body = '';
  const big = (label, val, cls = '') => `<div class="s-pay ${cls}"><span>${label}</span><b>₪${K.money(val)}</b></div>`;
  if (mode === 'cash') {
    const paid = bufAgorot();
    const diff = paid === null ? null : paid - t.total;
    body = '<div class="s-lines" style="display:flex;flex-direction:column;justify-content:center;gap:6px">'
      + big('לתשלום', t.total)
      + `<div class="s-pay ask"><span>כמה שילם הלקוח?</span><b>${buf ? '₪' + esc(buf) : '—'}</b></div>`
      + (diff === null ? '<div class="s-hint">הקלידו סכום · אישור בלי סכום = בדיוק</div>'
        : diff >= 0 ? big('עודף', diff, 'change') : big('חסר', -diff, 'short'))
      + '</div>';
  } else if (mode === 'menu') {
    body = `<div class="s-lines s-menu"><div><b>תפריט</b></div><div>1 · דוח ביניים (X)</div><div>2 · סגירת יום (Z)</div><div>3 · דוח מלאי</div><div>4 · העתק קבלה אחרונה</div><div style="color:#9fb3d9">C · חזרה</div></div>`;
  } else if (!cart.lines.length && paidInfo) {
    body = '<div class="s-lines" style="display:flex;flex-direction:column;justify-content:center;gap:8px">'
      + big('שולם', paidInfo.paid) + big('עודף ללקוח', paidInfo.change, 'change') + '</div>';
  } else if (!cart.lines.length) {
    const idle = !inserted ? 'הכניסו כרטיס' : cardError ? '⛔ הכרטיס נפסל' : !K.isConfigured(card) ? 'צריך הגדרה במחשב'
      : K.needsClose(card, nowIso()) ? 'סגרו את היום הקודם · תפריט 2' : cart.refund ? 'החזרה — סרקו פריט' : 'מוכן · סרקו מוצר';
    body = `<div class="s-lines" style="display:flex;align-items:center;justify-content:center;font-size:18px;color:#9fb3d9">${idle}</div>`;
  } else {
    const si = selIdx();
    const start = Math.max(0, Math.min(si - 3, cart.lines.length - 6));
    const shown = cart.lines.slice(start, start + 6);
    body = '<div class="s-lines">' + shown.map((l, j) => {
      const i = start + j;
      const extra = (l.qty > 1 ? ` <small>×${l.qty}</small>` : '') + (l.discount ? ` <small>-${K.money(l.discount)}</small>` : '');
      return `<div class="s-line${i === si ? ' sel' : ''}"><span>${esc(l.name)}${extra}</span><span>${K.money(K.lineTotal(l))}</span></div>`;
    }).join('') + '</div>';
  }
  const total = mode === 'menu' || mode === 'cash' || (paidInfo && !cart.lines.length) ? '' : `<div class="s-total${cart.refund ? ' refund' : ''}"><span>${cart.refund ? 'להחזר' : 'לתשלום'}${t.items ? ` · ${t.items} פריטים` : ''}</span><span>₪${K.money(t.total)}</span></div>`;
  const input = mode === 'cash' ? '' : `<div class="s-input"><span>${buf ? 'הקלדה:' : ''}</span><span>${esc(buf)}</span></div>`;
  s.innerHTML = head + body + total + input + `<div class="s-msg ${msg.kind}">${esc(msg.text)}</div>`;

  const last = cart.lines[cart.lines.length - 1];
  const typed = bufAgorot();
  $('cust').innerHTML = mode === 'cash'
    ? `<div>לתשלום ₪${K.money(t.total)}${typed !== null ? ` · שולם ₪${K.money(typed)}` : ''}</div><div class="big">${typed !== null && typed >= t.total ? `עודף ₪${K.money(typed - t.total)}` : `לתשלום ₪${K.money(t.total)}`}</div>`
    : cart.lines.length
      ? `<div>${esc(last.name)} ${K.money(K.lineTotal(last))}</div><div class="big">${cart.refund ? 'להחזר' : 'לתשלום'} ₪${K.money(t.total)}</div>`
      : paidInfo ? `<div>שולם ₪${K.money(paidInfo.paid)}</div><div class="big">עודף ₪${K.money(paidInfo.change)}</div>`
        : `<div class="big">${esc(card.settings.bizName || 'ברוכים הבאים')}</div>`;

  $('samples').innerHTML = inserted && card.products.length
    ? card.products.slice(0, 8).map((p) => `<button type="button" data-code="${esc(p.code)}" title="${esc(p.code)}">${esc(p.name)}</button>`).join('')
    : '';
}

function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

// ── מקלדת ──
const KEYS = [
  ['MENU', 'תפריט', 'fn'], ['UP', '▲', 'fn'], ['DOWN', '▼', 'fn'], ['REFUND', 'החזרה', 'fn'], ['CANCEL', 'בטל', 'red'],
  ['7'], ['8'], ['9'], ['QTY', '×', 'fn'], ['DEL', 'מחק', 'red'],
  ['4'], ['5'], ['6'], ['DISC', 'הנחה', 'fn'], ['C', 'C', 'red'],
  ['1'], ['2'], ['3'], ['PRICE', 'מחיר', 'fn'], ['CREDIT', 'אשראי', 'pay'],
  ['0'], ['00'], ['.'], ['OK', 'אישור', 'fn'], ['CASH', 'מזומן', 'pay'],
];
$('keys').innerHTML = KEYS.map(([k, label, cls]) => `<button type="button" data-k="${k}" class="${cls || ''}">${label || k}</button>`).join('');
$('keys').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-k]');
  if (b) key(b.dataset.k);
});

// ── סורק ──
$('scan').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { scan(e.target.value); e.target.value = ''; }
});
$('scanBtn').addEventListener('click', () => { scan($('scan').value); $('scan').value = ''; $('scan').focus(); });
$('samples').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-code]');
  if (b) scan(b.dataset.code);
});

// ── כרטיס הזיכרון ──
function renderSlot() {
  $('led').classList.toggle('off', !inserted);
  $('slotTxt').textContent = inserted ? 'כרטיס בפנים' : 'אין כרטיס';
  $('cardBtn').textContent = inserted ? '⏏ הוצא כרטיס' : '⤵ הכנס כרטיס';
  $('cardHint').textContent = inserted ? 'הוציאו את הכרטיס כדי לנהל אותו במחשב' : 'הכרטיס במחשב. סיימתם? הכניסו אותו חזרה';
  $('computer').classList.toggle('hidden', inserted);
  if (!inserted && !$('manage').src) $('manage').src = './manage.html?sim=1';
  if (inserted) $('manage').removeAttribute('src');
}
$('cardBtn').addEventListener('click', () => {
  if (inserted && cart.lines.length) { say('אי אפשר להוציא כרטיס באמצע עסקה', 'err'); beep(false); return render(); }
  inserted = !inserted;
  setInserted(inserted);
  if (inserted) { say('הכרטיס נקרא', 'ok'); readCard(); } else say('');
  renderSlot();
  render();
});

setInterval(render, 30000);
if (inserted) readCard();
renderSlot();
render();
$('scan').focus();
