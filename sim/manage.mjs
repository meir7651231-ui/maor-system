// דף הניהול — זה מה שנפתח במחשב כשמכניסים את כרטיס הזיכרון.
// מצב סימולטור (?sim=1): הכרטיס = localStorage של הסימולטור.
// מצב אמיתי: פותחים את KUPA.JSON מהכרטיס ושומרים חזרה אליו.
import * as K from '../engine/kupa.mjs';
import { ean13Svg } from '../engine/ean13svg.mjs';
import * as F from '../engine/files.mjs';
import { loadCardResult, saveCard, downloadCard, loadFiles, saveFiles } from './store.mjs';

const $ = (id) => document.getElementById(id);
const SIM = new URLSearchParams(location.search).has('sim');

const first = SIM ? loadCardResult() : { card: K.emptyCard() };
let card = first.card || K.emptyCard();
// כרטיס שלא נקרא (פגום) — חוסמים כל שמירה, כדי לא לכתוב כרטיס ריק מעל הקבלות
let badCard = first.error || '';
let fileHandle = null; // File System Access (כרום/אדג׳) — שמירה ישירות לכרטיס
let dirty = false;

function toast(t) {
  const el = $('toast');
  el.textContent = t;
  el.classList.add('show');
  clearTimeout(toast.h);
  toast.h = setTimeout(() => el.classList.remove('show'), 2200);
}
function esc(s) { return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function toAg(v) { const n = Number(String(v).replace(',', '.')); return Number.isFinite(n) ? Math.round(n * 100) : NaN; }

function localNow() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
function commit(next, note) {
  if (badCard) return toast(`⛔ ${badCard} — לא שומרים. פנו לספק`);
  const g = K.guardManaged(card, next);
  if (g.error) return toast(g.error);
  card = { ...next, pcTime: localNow() }; // שעת המחשב — הצעה לכיוון שעון הקופה
  if (SIM) saveCard(card); else dirty = true;
  renderAll();
  if (note) toast(note);
}

// ── מקור הכרטיס ──
function renderSrc() {
  $('fileBtns').style.display = SIM ? 'none' : '';
  $('src').textContent = SIM ? 'כרטיס הסימולטור — כל שינוי נשמר מיד' : (dirty ? '● יש שינויים שלא נשמרו לכרטיס' : 'מסונכרן עם הכרטיס');
}
async function openFile() {
  if (window.showOpenFilePicker) {
    try {
      [fileHandle] = await window.showOpenFilePicker({ types: [{ description: 'כרטיס קופה', accept: { 'application/json': ['.json', '.JSON'] } }] });
      loadText(await (await fileHandle.getFile()).text());
    } catch { /* בוטל */ }
  } else $('fileIn').click();
}
function loadText(text) {
  const r = K.parseCard(text);
  if (r.error) { fileHandle = null; badCard = r.error; card = K.emptyCard(); renderAll(); return toast(`⛔ ${r.error} — לא שומרים עליו`); }
  card = r.card; dirty = false; badCard = '';
  renderAll();
  toast('הכרטיס נקרא');
}
async function saveFile() {
  if (badCard) return toast(`⛔ ${badCard} — לא שומרים. פנו לספק`);
  if (fileHandle && fileHandle.createWritable) {
    const w = await fileHandle.createWritable();
    await w.write(K.serializeCard(card));
    await w.close();
  } else downloadCard(card); // דפדפן בלי גישה ישירה: מורידים ומעתיקים לכרטיס
  dirty = false;
  renderSrc();
  toast('נשמר לכרטיס');
}
$('openFile').onclick = openFile;
$('saveFile').onclick = saveFile;
$('fileIn').onchange = async (e) => { const f = e.target.files[0]; if (f) loadText(await f.text()); e.target.value = ''; };
window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

// ── לשוניות ──
$('tabs').onclick = (e) => {
  const b = e.target.closest('button[data-t]');
  if (!b) return;
  for (const x of $('tabs').children) x.setAttribute('aria-selected', String(x === b));
  for (const s of document.querySelectorAll('section')) s.classList.toggle('on', s.id === 't-' + b.dataset.t);
};

// ── העסק ──
function renderBiz() {
  const s = card.settings;
  $('bizName').value = s.bizName; $('osekType').value = s.osekType; $('osekNo').value = s.osekNo;
  $('address').value = s.address; $('phone').value = s.phone; $('footer').value = s.footer;
  $('vat').value = String(Math.round(s.vatRate * 1000) / 10);
  $('paper').value = String(s.width);
  $('cashRound').checked = s.cashRound !== false;
  $('pin').value = '';
  const inDevice = s.pinHash === K.PIN_IN_DEVICE;
  $('pin').disabled = inDevice;
  $('pin').placeholder = inDevice ? 'נשמר בקופה' : s.pinHash ? '•••• (מוגדר — הקלידו קוד חדש להחלפה)' : 'לא מוגדר';
  $('pinNote').innerHTML = inDevice ? 'הקוד נשמר בזיכרון הקופה (לא בכרטיס). החלפה — רק בקופה: תפריט ← 7.'
    : s.pinHash ? 'כדי לבטל את הקוד: <button class="btn" id="pinClear" type="button">ביטול קוד מנהל</button> · אחרי הקלדה ראשונה בקופה הקוד עובר לקופה ומשנים אותו רק שם'
    : 'קוד ראשוני. אחרי שמקלידים אותו בקופה פעם אחת הוא עובר לזיכרון הקופה, ומשנים אותו רק שם (תפריט ← 7).';
  const pc = $('pinClear');
  if (pc) pc.onclick = (e) => armed(e.currentTarget, 'ביטול קוד מנהל', () => commit(K.setPin(card, '').card, 'קוד המנהל בוטל'));
  $('vat').disabled = s.osekType === 'פטור';
  $('setupMsg').innerHTML = K.isConfigured(card)
    ? '<span class="ok">✓ הקופה מוגדרת ויכולה למכור.</span>'
    : '<span class="err">הקופה עדיין לא מוגדרת: צריך שם עסק ומספר עוסק בן 9 ספרות.</span>';
  osekNote();
}
function osekNote() {
  const v = $('osekNo').value;
  $('osekNote').innerHTML = !v ? '' : K.validOsekNo(v) ? '<span class="ok">✓ ספרת ביקורת תקינה</span>' : '<span class="err">ספרת הביקורת לא תואמת — בדקו את המספר</span>';
}
$('osekNo').oninput = osekNote;
$('osekType').onchange = () => { $('vat').disabled = $('osekType').value === 'פטור'; };
$('saveBiz').onclick = () => {
  const vat = $('osekType').value === 'פטור' ? 0 : Number($('vat').value) / 100;
  if (!(vat >= 0 && vat < 1)) return toast('אחוז מע"מ לא תקין');
  let next = K.updateSettings(card, {
    bizName: $('bizName').value.trim(), osekType: $('osekType').value, osekNo: $('osekNo').value,
    address: $('address').value.trim(), phone: $('phone').value.trim(), footer: $('footer').value.trim(), vatRate: vat, width: Number($('paper').value),
    cashRound: $('cashRound').checked,
  });
  if ($('pin').value.trim()) {
    const r = K.setPin(next, $('pin').value.trim());
    if (r.error) return toast(r.error);
    next = r.card;
  }
  commit(next, 'פרטי העסק נשמרו');
};

// ── מוצרים ──
function renderProducts() {
  const q = $('prodFilter').value.trim();
  const rows = card.products.filter((p) => !q || p.name.includes(q) || p.code.includes(q));
  $('prodRows').innerHTML = rows.map((p) => `<tr>
    <td class="num">${esc(p.code)}</td><td>${esc(p.name)}</td><td class="num">${K.money(p.price)}</td>
    <td class="num">${p.stock ?? '—'}</td>
    <td><button class="btn" data-edit="${esc(p.code)}" type="button">✎</button> <button class="btn bad" data-del="${esc(p.code)}" type="button">🗑</button></td></tr>`).join('')
    || '<tr><td colspan="5" class="note">אין מוצרים עדיין</td></tr>';
}
$('prodFilter').oninput = renderProducts;
$('genCode').onclick = () => {
  const r = K.nextInternalCode(card);
  card = r.card; // המונה נשמר יחד עם המוצר
  $('pCode').value = r.code;
  $('pName').focus();
};
$('saveProd').onclick = () => {
  const price = toAg($('pPrice').value);
  const r = K.upsertProduct(card, { code: $('pCode').value, name: $('pName').value, price, stock: $('pStock').value.trim() });
  if (r.error) return toast(r.error);
  for (const id of ['pCode', 'pName', 'pPrice', 'pStock']) $(id).value = '';
  commit(r.card, 'המוצר נשמר');
  $('pCode').focus();
};
$('pCode').onkeydown = (e) => {
  if (e.key !== 'Enter') return;
  const p = K.findProduct(card, e.target.value);
  if (p) { $('pName').value = p.name; $('pPrice').value = K.money(p.price); $('pStock').value = p.stock ?? ''; }
  $('pName').focus();
};
let armedDel = null;
$('prodRows').onclick = (e) => {
  const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
  if (ed) {
    const p = K.findProduct(card, ed.dataset.edit);
    $('pCode').value = p.code; $('pName').value = p.name; $('pPrice').value = K.money(p.price); $('pStock').value = p.stock ?? '';
    $('pName').focus();
  } else if (del) {
    if (armedDel !== del.dataset.del) { armedDel = del.dataset.del; del.textContent = 'בטוח?'; setTimeout(() => { armedDel = null; renderProducts(); }, 3000); return; }
    armedDel = null;
    commit(K.removeProduct(card, del.dataset.del), 'המוצר נמחק');
  }
};

// ── מלאי ──
function renderStock() {
  const rows = K.stockReport(card);
  $('stockRows').innerHTML = rows.map((r) => `<tr><td>${esc(r.name)}</td><td class="num">${r.stock}</td><td>${r.low ? '<span class="err">⚠ נמוך</span>' : ''}</td></tr>`).join('')
    || '<tr><td colspan="3" class="note">אין מוצרים במעקב מלאי (מלאי ריק = בלי מעקב)</td></tr>';
}
$('addStock').onclick = () => {
  const p = K.findProduct(card, $('sCode').value);
  const q = Number($('sQty').value);
  if (!p) return toast('מוצר לא נמצא');
  if (!Number.isInteger(q) || q === 0) return toast('כמות לא תקינה');
  $('sCode').value = ''; $('sQty').value = '';
  commit(K.addStock(card, p.code, q), `${p.name}: +${q}`);
};

// ── מדבקות ──
function renderLabelPick() {
  $('labelPick').innerHTML = card.products.map((p) => `<label style="display:inline-flex;gap:6px;align-items:center;margin-left:14px;color:var(--ink)">
    <input type="checkbox" value="${esc(p.code)}" style="width:auto"> ${esc(p.name)}
    <input type="number" min="1" value="1" data-n="${esc(p.code)}" style="width:60px" aria-label="כמות מדבקות"></label>`).join('') || '<div class="note">אין מוצרים</div>';
}
$('printLabels').onclick = () => {
  const out = [];
  for (const cb of $('labelPick').querySelectorAll('input[type=checkbox]:checked')) {
    const p = K.findProduct(card, cb.value);
    const n = Math.min(100, Number($('labelPick').querySelector(`[data-n="${CSS.escape(p.code)}"]`).value) || 1);
    let svg;
    try { svg = K.validEan13(p.code) ? ean13Svg(p.code) : `<div class="num">${esc(p.code)}</div>`; } catch { svg = esc(p.code); }
    for (let i = 0; i < n; i++) out.push(`<div class="label"><b>${esc(p.name)}</b>${svg}<span>₪${K.money(p.price)}</span></div>`);
  }
  if (!out.length) return toast('סמנו לפחות מוצר אחד');
  $('labelOut').innerHTML = out.join('');
  setTimeout(() => window.print(), 50);
};

// ── דוחות ──
function renderReports() {
  const x = K.interimReport(card, '');
  const st = (l, v) => `<div class="stat"><small>${l}</small><b>${v}</b></div>`;
  $('xStats').innerHTML = st('מסמכים', x.count) + st('מכירות', x.sales) + st('החזרות', x.refunds) + st('מזומן', '₪' + K.money(x.cash)) + st('אשראי', '₪' + K.money(x.credit)) + st('סה"כ', '₪' + K.money(x.total)) + st('מצטבר מיום הפתיחה (GT)', '₪' + K.money(x.gt));
  const seq = K.checkSequence(card);
  $('seqNote').innerHTML = (seq.ok
    ? `<span class="ok">✓ מספור הקבלות רציף (${seq.from}–${seq.top})</span>`
    : `<span class="err">⚠ ${seq.missing.length ? 'חסרות קבלות: ' + seq.missing.join(', ') : ''}${seq.dup.length ? ' · כפולות: ' + seq.dup.join(', ') : ''}</span>`)
    + `<br>🔏 ${card.deviceId ? `הכרטיס שייך לקופה ${esc(card.deviceId)} · ${card.seq.op} פעולות חתומות · הקופה מאמתת את החתימות בכל הכנסת כרטיס` : 'הכרטיס עוד לא שויך לקופה'}`;
  $('mRows').innerHTML = K.monthlySummary(card).slice().reverse().map((m) => `<tr><td>${m.month}</td><td>${m.count}</td><td class="num">${K.money(m.cash)}</td><td class="num">${K.money(m.credit)}</td><td class="num">${K.money(m.rounding)}</td><td class="num">${K.money(m.discount)}</td><td class="num">${K.money(m.total)}</td><td class="num">${K.money(m.vat)}</td></tr>`).join('')
    || '<tr><td colspan="8" class="note">אין עדיין מכירות</td></tr>';
  const size = K.cardSize(card);
  if (size > K.CARD_WARN_BYTES) $('seqNote').innerHTML += `<br><span class="err">⚠ הכרטיס גדול (${(size / 1048576).toFixed(1)}MB) — שמרו גיבוי וקחו כרטיס חדש (הקופה תמשיך את המספור)</span>`;
  $('zRows').innerHTML = card.zReports.slice().reverse().map((z) => `<tr><td>${z.no}</td><td>${esc(z.at.replace('T', ' ').slice(0, 16))}</td><td>${z.fromNo}–${z.toNo}</td>
    <td class="num">${K.money(z.cash)}</td><td class="num">${K.money(z.credit)}</td><td class="num">${K.money(z.total)}</td><td class="num">${K.money(z.vat)}</td></tr>`).join('')
    || '<tr><td colspan="7" class="note">עוד לא נסגר יום</td></tr>';
  $('rRows').innerHTML = card.receipts.slice(-50).reverse().map((r) => `<tr><td>${r.no}</td><td>${esc(r.at.replace('T', ' ').slice(0, 16))}</td>
    <td>${r.type === 'refund' ? 'החזרה' : 'מכירה'}</td><td>${r.method === 'cash' ? 'מזומן' : 'אשראי'}</td><td class="num">${K.money(r.total)}</td></tr>`).join('')
    || '<tr><td colspan="5" class="note">אין קבלות</td></tr>';
}
function downloadCsv(rows, name) {
  const q = (v) => { const s = String(v); return /^[=+\-@]/.test(s) && !/^-?\d/.test(s) ? `"'${s}"` : `"${s.replace(/"/g, '""')}"`; };
  const blob = new Blob(['\uFEFF' + rows.map((r) => r.map(q).join(',')).join('\r\n')], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
}
$('monthCsv').onclick = () => {
  const blob = new Blob([F.monthlyCsv(card)], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'kupa-monthly.csv'; a.click();
};
$('csv').onclick = () => {
  const rows = [['מספר', 'תאריך', 'סוג', 'תשלום', 'סה"כ', 'מע"מ', 'פריטים']];
  for (const r of card.receipts) rows.push([r.no, r.at, r.type === 'refund' ? 'החזרה' : 'מכירה', r.method === 'cash' ? 'מזומן' : 'אשראי', K.money(r.total), K.money(r.vat), r.lines.map((l) => `${l.name}×${l.qty}`).join(' | ')]);
  const blob = new Blob(['﻿' + rows.map((r) => r.map(q).join(',')).join('\r\n')], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'kupa-receipts.csv'; a.click();
};

// ── גיבוי ──
$('backupDl').onclick = () => {
  const blob = new Blob([K.serializeCard(card)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `kupa-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  try { localStorage.setItem('kupa.lastBackup', new Date().toISOString()); } catch { /* ignore */ }
  renderBackup();
};
function armed(btn, label, fn) {
  if (btn.dataset.armed) { delete btn.dataset.armed; btn.textContent = label; return fn(); }
  btn.dataset.armed = '1'; btn.textContent = 'לחצו שוב לאישור';
  setTimeout(() => { delete btn.dataset.armed; btn.textContent = label; }, 3000);
}
// נתוני הדגמה — רק בסימולטור ורק על כרטיס שעוד לא הפיק אף מסמך (לא דורס קבלות)
$('demo').onclick = (e) => {
  if (card.receipts.length || card.zReports.length) return toast('בכרטיס כבר יש קבלות — אי אפשר לטעון הדגמה');
  armed(e.currentTarget, '🧪 טעינת נתוני הדגמה (בוטיק לנשים)', () => commit(demoCard(), 'נתוני ההדגמה נטענו'));
};
$('zCsv').onclick = () => {
  const rows = [['מספר Z', 'תאריך', 'מקבלה', 'עד קבלה', 'מכירות', 'החזרות', 'מזומן', 'אשראי', 'הנחות', 'סה"כ', 'מע"מ']];
  for (const z of card.zReports) rows.push([z.no, z.at, z.fromNo, z.toNo, z.sales, z.refunds, K.money(z.cash), K.money(z.credit), K.money(z.discount), K.money(z.total), K.money(z.vat)]);
  downloadCsv(rows, 'kupa-z-reports.csv');
};
function renderBackup() {
  $('demoBox').classList.toggle('hidden', !(SIM && !card.receipts.length && !card.zReports.length));
  let last = null;
  try { last = localStorage.getItem('kupa.lastBackup'); } catch { /* ignore */ }
  const days = last ? Math.floor((Date.now() - Date.parse(last)) / 86400000) : null;
  $('lastBackup').innerHTML = last == null ? '<span class="err">עוד לא נשמר גיבוי מהמחשב הזה</span>'
    : days > 90 ? `<span class="err">⚠ הגיבוי האחרון לפני ${days} ימים — עבר רבעון</span>` : `<span class="ok">גיבוי אחרון: לפני ${days} ימים</span>`;
}

function demoCard() {
  // נבנה על הכרטיס הקיים (שומר שיוך-קופה ומונים) — רק הגדרות ומוצרים
  let c = K.updateSettings(card, {
    bizName: 'בוטיק לנשים - הדגמה', osekNo: '000000018', address: 'רחוב הדוגמה 1', phone: '050-0000000',
  });
  const items = [['חולצת כותנה', 8990, 12], ['חצאית מידי', 14900, 6], ['שמלת ערב', 34900, 3], ['צעיף', 4500, 20], ['חגורת עור', 7900, 2], ['גרביונים', 2500, null]];
  items.forEach(([name, price, stock], i) => {
    const d12 = '72900000' + String(i + 1).padStart(4, '0');
    c = K.upsertProduct(c, { code: d12 + K.ean13CheckDigit(d12), name, price, stock }).card;
  });
  return c;
}

// ── קבצים בכרטיס ──
// בסימולטור: הקבצים שהקופה כתבה (הורדה, ועריכת מוצרים.csv באקסל והעלאה חזרה).
// בכרטיס אמיתי: הקבצים יושבים בתיקיית הכרטיס עצמה — פותחים אותם ישירות מהמחשב.
function renderFiles() {
  if (!SIM) {
    $('filesBox').innerHTML = '<div class="note">הקבצים נמצאים בתיקיית הכרטיס, ליד הקובץ הזה. פותחים אותם ישירות (לחיצה כפולה). כאן אפשר לבדוק מוצרים.csv ששמרתם באקסל לפני שמחזירים את הכרטיס:</div>'
      + '<button class="btn" id="csvPick" type="button">🔎 בדיקת מוצרים.csv</button><input type="file" id="csvIn" accept=".csv,text/csv" hidden>';
  } else {
    const files = loadFiles();
    const names = Object.keys(files).sort();
    $('filesBox').innerHTML = (names.length ? '<table><thead><tr><th>קובץ</th><th></th></tr></thead><tbody>'
      + names.map((n) => `<tr><td>${esc(n)}</td><td><button class="btn" data-dl="${esc(n)}" type="button">⬇ הורדה</button>${n === F.PRODUCTS_FILE ? ' <button class="btn pri" id="csvPick" type="button">⬆ החלפה בקובץ שנערך באקסל</button><input type="file" id="csvIn" accept=".csv,text/csv" hidden>' : ''}</td></tr>`).join('')
      + '</tbody></table>' : '<div class="note">הקופה עוד לא כתבה קבצים — הכניסו את הכרטיס לקופה פעם אחת.</div>');
  }
  const pick = $('csvPick');
  if (pick) pick.onclick = () => $('csvIn').click();
  const inp = $('csvIn');
  if (inp) inp.onchange = async (e) => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    const bytes = new Uint8Array(await f.arrayBuffer());
    const { products, errors } = F.parseProductsCsv(bytes, card.products.map((p) => p.code));
    if (errors.length) {
      $('csvCheck').innerHTML = '<span class="err">הקופה לא תקבל את הקובץ:</span><br>' + errors.map((x) => `שורה ${x.line}: ${esc(x.msg)}`).join('<br>');
      return;
    }
    $('csvCheck').innerHTML = `<span class="ok">✓ הקובץ תקין — ${products.length} מוצרים.</span>` + (SIM ? ' הוא נשמר בכרטיס; הקופה תקלוט אותו כשתכניסו את הכרטיס.' : ' אפשר להחזיר את הכרטיס לקופה.');
    if (SIM) { saveFiles({ ...loadFiles(), [F.PRODUCTS_FILE]: F.decodeText(bytes) }); renderFiles(); }
  };
  $('filesBox').querySelectorAll('[data-dl]').forEach((b) => {
    b.onclick = () => {
      const blob = new Blob([loadFiles()[b.dataset.dl]], { type: 'text/plain' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = b.dataset.dl.split('/').pop(); a.click();
    };
  });
}

function renderAll() { renderSrc(); renderBiz(); renderProducts(); renderStock(); renderLabelPick(); renderReports(); renderBackup(); renderFiles(); }
renderAll();
