// הקופה: מסך + מקלדת + סורק + מדפסת. כל החישוב במנוע; כאן רק קלט/תצוגה.
import * as K from '../engine/kupa.mjs';
import * as R from '../engine/register.mjs';
import * as E from '../engine/escpos.mjs';
import { loadCard, saveCard, cardInserted, setInserted, loadDevice, saveDevice, loadFiles, saveFiles } from './store.mjs';

const $ = (id) => document.getElementById(id);

// כל ההיגיון במנוע המקשים (engine/register.mjs) — כאן רק תצוגה, צפצוף, הדפסה ושמירה
let st = R.initState({ card: loadCard(), device: loadDevice(), inserted: cardInserted() });

// ── עזר ──
function nowIso() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
function bufAgorot() {
  if (!st.buf) return null;
  const n = Number(st.buf);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

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

// "כמו במדפסת אמיתית": השורות בדיוק כפי שיישלחו ל-Epson (סדר חזותי, משמאל לימין, בלי עיבוד-כיוון של הדפדפן)
function fillSlip(slip) {
  const raw = $('rawPrint').checked;
  const w = st.card.settings.width;
  slip.classList.toggle('raw', raw);
  slip.textContent = '';
  for (const l of JSON.parse(slip.dataset.lines)) {
    const d = document.createElement('div');
    d.className = 'ln';
    d.textContent = raw ? E.toVisual(l + ' '.repeat(Math.max(0, w - [...l].length))) : l || ' ';
    slip.appendChild(d);
  }
}
function print(lines) {
  const roll = $('roll');
  const empty = roll.querySelector('.empty');
  if (empty) empty.remove();
  const slip = document.createElement('div');
  slip.className = 'slip';
  slip.dataset.lines = JSON.stringify(lines);
  fillSlip(slip);
  roll.prepend(slip);
  roll.scrollTop = 0;
}
$('rawPrint').addEventListener('change', () => document.querySelectorAll('.slip').forEach(fillSlip));

// ביצוע תוצאת המנוע. סדר השמירה: קודם הכרטיס (+קבצים), אחר כך הזיכרון הפנימי —
// הפסקת חשמל ביניהם ⇒ הקופה משלימה את הזיכרון מהכרטיס בהכנסה הבאה (checkCard).
function apply({ st: next, out }) {
  st = next;
  if (out.persist) {
    if (out.files) saveFiles({ ...loadFiles(), ...out.files });
    saveCard(st.card);
    saveDevice(st.device);
  }
  for (const lines of out.prints) print(lines);
  if (out.beep !== null) beep(out.beep);
  render();
}

const key = (k) => apply(R.press(st, k, nowIso()));
const scan = (code) => apply(R.scan(st, code, nowIso()));
const readCard = () => apply(R.insertCard(st, loadCard(), loadFiles()));

// ── מסך ──
function render() {
  const { card, cart, mode, buf, paidInfo, msg, inserted, cardError } = st;
  const s = $('screen');
  const t = K.cartTotals(cart, card.settings.vatRate);
  const clock = nowIso().slice(11, 16);
  const head = `<div class="s-head"><span>${esc(card.settings.bizName || 'קופה לא מוגדרת')}</span><span>${inserted ? '💾' : '⛔ אין כרטיס'} ${clock}</span></div>`;
  let body = '';
  const big = (label, val, cls = '') => `<div class="s-pay ${cls}"><span>${label}</span><b>₪${K.money(val)}</b></div>`;
  const center = (html) => `<div class="s-lines" style="display:flex;flex-direction:column;justify-content:center;gap:8px">${html}</div>`;
  if (mode === 'cash') {
    const due = K.payableOf(card, cart, 'cash');
    const paid = bufAgorot();
    const diff = paid === null ? null : paid - due;
    body = center(big('לתשלום', due) + (due !== t.total ? `<div class="s-hint">${K.money(t.total)} · עיגול ${K.money(due - t.total)}</div>` : '')
      + `<div class="s-pay ask"><span>כמה שילם הלקוח?</span><b>${buf ? '₪' + esc(buf) : '—'}</b></div>`
      + (diff === null ? '<div class="s-hint">הקלידו סכום · אישור בלי סכום = בדיוק</div>'
        : diff >= 0 ? big('עודף', diff, 'change') : big('חסר', -diff, 'short')));
  } else if (mode === 'pin') {
    body = center(`<div class="s-pay ask"><span>קוד מנהל</span><b>${'•'.repeat(buf.length) || '—'}</b></div><div class="s-hint">הקלידו קוד · אישור · C = ביטול</div>`);
  } else if (mode === 'refundOf') {
    body = center(`<div class="s-pay ask"><span>מס' קבלה מקורית</span><b>${esc(buf) || '—'}</b></div><div class="s-hint">רואים את המספר בראש הקבלה · אישור · C = ביטול</div>`);
  } else if (mode === 'confirmCsv') {
    body = center('<div style="font-size:16px;color:#ffd27a">אישור מחיקת מוצרים מהאקסל</div>');
  } else if (mode === 'menu') {
    body = `<div class="s-lines s-menu"><div><b>תפריט</b></div><div>1 · דוח ביניים (X)</div><div>2 · סגירת יום (Z)</div><div>3 · דוח מלאי</div><div>4 · העתק קבלה אחרונה</div><div style="color:#9fb3d9">C · חזרה</div></div>`;
  } else if (!cart.lines.length && paidInfo) {
    body = center(big('שולם', paidInfo.paid) + big('עודף ללקוח', paidInfo.change, 'change'));
  } else if (!cart.lines.length) {
    const idle = !inserted ? 'הכניסו כרטיס' : cardError ? '⛔ הכרטיס נפסל' : !K.isConfigured(card) ? 'צריך הגדרה במחשב'
      : K.needsClose(card, nowIso()) ? 'סגרו את היום הקודם · תפריט 2' : cart.refund ? `החזרה לקבלה ${cart.refundOf} — סרקו פריט` : 'מוכן · סרקו מוצר';
    body = `<div class="s-lines" style="display:flex;align-items:center;justify-content:center;font-size:18px;color:#9fb3d9;text-align:center">${idle}</div>`;
  } else {
    const si = R.selIdx(st);
    const start = Math.max(0, Math.min(si - 3, cart.lines.length - 6));
    const shown = cart.lines.slice(start, start + 6);
    body = '<div class="s-lines">' + shown.map((l, j) => {
      const i = start + j;
      const extra = (l.qty > 1 ? ` <small>×${l.qty}</small>` : '') + (l.discount ? ` <small>-${K.money(l.discount)}</small>` : '');
      return `<div class="s-line${i === si ? ' sel' : ''}"><span>${esc(l.name)}${extra}</span><span>${K.money(K.lineTotal(l))}</span></div>`;
    }).join('') + (t.basket ? `<div class="s-line"><span><small>הנחת סל</small></span><span>-${K.money(t.basket)}</span></div>` : '') + '</div>';
  }
  const hideTotal = ['menu', 'cash', 'pin', 'refundOf', 'confirmCsv'].includes(mode) || (paidInfo && !cart.lines.length);
  const total = hideTotal ? '' : `<div class="s-total${cart.refund ? ' refund' : ''}"><span>${cart.refund ? 'להחזר' : 'לתשלום'}${t.items ? ` · ${t.items} פריטים` : ''}</span><span>₪${K.money(t.total)}</span></div>`;
  const input = ['cash', 'pin', 'refundOf'].includes(mode) ? '' : `<div class="s-input"><span>${buf ? 'הקלדה:' : ''}</span><span>${esc(buf)}</span></div>`;
  s.innerHTML = head + body + total + input + `<div class="s-msg ${msg.kind}">${esc(msg.text)}</div>`;

  const last = cart.lines[cart.lines.length - 1];
  const typed = bufAgorot();
  const due = K.payableOf(card, cart, 'cash');
  $('cust').innerHTML = mode === 'cash'
    ? `<div>לתשלום ₪${K.money(due)}${typed !== null ? ` · שולם ₪${K.money(typed)}` : ''}</div><div class="big">${typed !== null && typed >= due ? `עודף ₪${K.money(typed - due)}` : `לתשלום ₪${K.money(due)}`}</div>`
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
  ['PCT', '% לשורה', 'fn wide'], ['BPCT', '% לסל', 'fn wide'], ['BASKET', '₪ לסל', 'fn'],
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
  const { inserted } = st;
  $('led').classList.toggle('off', !inserted);
  $('slotTxt').textContent = inserted ? 'כרטיס בפנים' : 'אין כרטיס';
  $('cardBtn').textContent = inserted ? '⏏ הוצא כרטיס' : '⤵ הכנס כרטיס';
  $('cardHint').textContent = inserted ? 'הוציאו את הכרטיס כדי לנהל אותו במחשב' : 'הכרטיס במחשב. סיימתם? הכניסו אותו חזרה';
  $('computer').classList.toggle('hidden', inserted);
  if (!inserted && !$('manage').src) $('manage').src = './manage.html?sim=1';
  if (inserted) $('manage').removeAttribute('src');
}
$('cardBtn').addEventListener('click', () => {
  if (st.inserted) {
    apply(R.ejectCard(st));
    if (!st.inserted) setInserted(false);
  } else {
    setInserted(true);
    readCard();
  }
  renderSlot();
});

setInterval(render, 30000);
if (st.inserted) readCard();
renderSlot();
render();
$('scan').focus();
