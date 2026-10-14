// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/receipt.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
export function inner$hebrewLocaleDate$d(iso) {
    const d = new Date(iso.slice(0, 10) + 'T12:00:00');
    return d;
}
export function inner$receiptVerifyCode$s(rid, amount, currency, date) {
    const s = rid + '|' + amount + '|' + (currency || '₪') + '|' + date.slice(0, 10);
    return s;
}
export function inner$receiptVerifyCode$code(rid, amount, currency, date) {
    const s = rid + '|' + amount + '|' + (currency || '₪') + '|' + date.slice(0, 10);
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    const code = h.toString(36).toUpperCase().padStart(7, '0').slice(-6);
    return code;
}
export function inner$receiptVerifyCode$code$$step(h) {
    const code = h.toString(36).toUpperCase().padStart(7, '0').slice(-6);
    return code;
}
export function inner$receiptLines$d(o) {
    const d = new Date(o.date.slice(0, 10) + 'T12:00:00');
    return d;
}
export function inner$receiptLines$gregorian(o) {
    const d = new Date(o.date.slice(0, 10) + 'T12:00:00');
    const gregorian = isNaN(d.getTime()) ? o.date : d.toLocaleDateString('he-IL');
    return gregorian;
}
export function inner$receiptLines$gregorian$$step(o, d) {
    const gregorian = isNaN(d.getTime()) ? o.date : d.toLocaleDateString('he-IL');
    return gregorian;
}
export function inner$receiptLines$curSym(o) {
    const cur = o.currency || '₪';
    const curSym = cur === '$' ? '$' : '₪';
    return curSym;
}
export function inner$receiptLines$curSym$$step(cur) {
    const curSym = cur === '$' ? '$' : '₪';
    return curSym;
}
export function inner$receiptLines$isShopConfirmation(o) {
    const isShopConfirmation = String(o.rid ?? '').startsWith('S-');
    return isShopConfirmation;
}
export function inner$downloadReceipt$text(lines) {
    const text = '\uFEFF' + lines.filter((x) => x !== '').join('\n');
    return text;
}
export function inner$receiptHtml$body(rest) {
    const body = rest.map((ln) => '<div class="ln">' + esc(ln) + '</div>').join('\n');
    return body;
}
export function inner$receiptVerifyCode$h$$after_loop(rid, amount, currency, date) {
    const s = rid + '|' + amount + '|' + (currency || '₪') + '|' + date.slice(0, 10);
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h;
}

export const SIGS = {
  inner$hebrewLocaleDate$d: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$receiptVerifyCode$s: [{"name":"rid","d":{"t":"str"},"opt":false},{"name":"amount","d":{"t":"num"},"opt":false},{"name":"currency","d":{"t":"str"},"opt":false},{"name":"date","d":{"t":"str"},"opt":false}],
  inner$receiptVerifyCode$code: [{"name":"rid","d":{"t":"str"},"opt":false},{"name":"amount","d":{"t":"num"},"opt":false},{"name":"currency","d":{"t":"str"},"opt":false},{"name":"date","d":{"t":"str"},"opt":false}],
  inner$receiptVerifyCode$code$$step: [{"name":"h","d":{"t":"num"},"opt":false}],
  inner$receiptLines$d: [{"name":"o","d":{"t":"obj","n":"ReceiptInfo","p":[["rid",{"t":"str"},false],["orgName",{"t":"str"},false],["payer",{"t":"str"},false],["amount",{"t":"num"},false],["currency",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["method",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["date",{"t":"str"},false],["forWhat",{"t":"str"},false],["site",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["taxReceipt",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["payerId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["signatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["copy",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["mark",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["verify",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["summary",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["totalDue",{"t":"num"},false],["paidSoFar",{"t":"num"},false],["balance",{"t":"num"},false],["nextDate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},true]]},"opt":false}],
  inner$receiptLines$gregorian: [{"name":"o","d":{"t":"obj","n":"ReceiptInfo","p":[["rid",{"t":"str"},false],["orgName",{"t":"str"},false],["payer",{"t":"str"},false],["amount",{"t":"num"},false],["currency",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["method",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["date",{"t":"str"},false],["forWhat",{"t":"str"},false],["site",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["taxReceipt",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["payerId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["signatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["copy",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["mark",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["verify",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["summary",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["totalDue",{"t":"num"},false],["paidSoFar",{"t":"num"},false],["balance",{"t":"num"},false],["nextDate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},true]]},"opt":false}],
  inner$receiptLines$gregorian$$step: [{"name":"o","d":{"t":"obj","n":"ReceiptInfo","p":[["rid",{"t":"str"},false],["orgName",{"t":"str"},false],["payer",{"t":"str"},false],["amount",{"t":"num"},false],["currency",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["method",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["date",{"t":"str"},false],["forWhat",{"t":"str"},false],["site",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["taxReceipt",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["payerId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["signatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["copy",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["mark",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["verify",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["summary",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["totalDue",{"t":"num"},false],["paidSoFar",{"t":"num"},false],["balance",{"t":"num"},false],["nextDate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},true]]},"opt":false},{"name":"d","d":{"t":"date"},"opt":false}],
  inner$receiptLines$curSym: [{"name":"o","d":{"t":"obj","n":"ReceiptInfo","p":[["rid",{"t":"str"},false],["orgName",{"t":"str"},false],["payer",{"t":"str"},false],["amount",{"t":"num"},false],["currency",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["method",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["date",{"t":"str"},false],["forWhat",{"t":"str"},false],["site",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["taxReceipt",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["payerId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["signatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["copy",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["mark",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["verify",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["summary",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["totalDue",{"t":"num"},false],["paidSoFar",{"t":"num"},false],["balance",{"t":"num"},false],["nextDate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},true]]},"opt":false}],
  inner$receiptLines$curSym$$step: [{"name":"cur","d":{"t":"str"},"opt":false}],
  inner$receiptLines$isShopConfirmation: [{"name":"o","d":{"t":"obj","n":"ReceiptInfo","p":[["rid",{"t":"str"},false],["orgName",{"t":"str"},false],["payer",{"t":"str"},false],["amount",{"t":"num"},false],["currency",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["method",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["date",{"t":"str"},false],["forWhat",{"t":"str"},false],["site",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["taxReceipt",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["payerId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["signatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["copy",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["mark",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["verify",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["summary",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["totalDue",{"t":"num"},false],["paidSoFar",{"t":"num"},false],["balance",{"t":"num"},false],["nextDate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},true]]},"opt":false}],
  inner$downloadReceipt$text: [{"name":"lines","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$receiptHtml$body: [{"name":"rest","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$receiptVerifyCode$h$$after_loop: [{"name":"rid","d":{"t":"str"},"opt":false},{"name":"amount","d":{"t":"num"},"opt":false},{"name":"currency","d":{"t":"str"},"opt":false},{"name":"date","d":{"t":"str"},"opt":false}],
};
