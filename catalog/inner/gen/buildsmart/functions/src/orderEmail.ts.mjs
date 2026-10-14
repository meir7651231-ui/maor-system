// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:functions/src/orderEmail.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function esc(v) {
    return String(v ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
function looksLikeEmail(s) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.trim());
}
export function inner$fmtDate$s(iso) {
    const s = typeof iso === "string" ? iso : "";
    return s;
}
export function inner$buildOrderEmailHtml$rows(lines) {
    const rows = lines
        .map((l) => {
        const name = `${esc(l.emoji ?? "")} ${esc(l.name ?? "")}`.trim();
        const qty = esc(l.qty ?? "");
        const price = Number(l.price ?? 0);
        return `<tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right">${name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center">${qty}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:left;white-space:nowrap">₪${price.toLocaleString()}</td>
        </tr>`;
    })
        .join("");
    return rows;
}
export function inner$buildOrderEmailHtml$map$name(l) {
    const name = `${esc(l.emoji ?? "")} ${esc(l.name ?? "")}`.trim();
    return name;
}
export function inner$buildOrderEmailHtml$map$qty(l) {
    const qty = esc(l.qty ?? "");
    return qty;
}
export function inner$buildOrderEmailHtml$map$price(l) {
    const price = Number(l.price ?? 0);
    return price;
}
export function inner$buildOrderEmailHtml$phoneVal(customerPhone) {
    const phoneVal = (customerPhone ?? "").trim();
    return phoneVal;
}
export function inner$buildOrderEmailHtml$emailVal(customerEmail) {
    const emailVal = (customerEmail ?? "").trim();
    return emailVal;
}
export function inner$buildOrderEmailHtml$emailToShow(customerPhone, customerEmail) {
    const phoneVal = (customerPhone ?? "").trim();
    const emailVal = (customerEmail ?? "").trim();
    const emailToShow = emailVal || (looksLikeEmail(phoneVal) ? phoneVal : "");
    return emailToShow;
}
export function inner$buildOrderEmailHtml$emailToShow$$step(phoneVal, emailVal) {
    const emailToShow = emailVal || (looksLikeEmail(phoneVal) ? phoneVal : "");
    return emailToShow;
}
export function inner$buildOrderEmailHtml$contactRows(customerPhone, customerEmail) {
    const phoneVal = (customerPhone ?? "").trim();
    const emailVal = (customerEmail ?? "").trim();
    const emailToShow = emailVal || (looksLikeEmail(phoneVal) ? phoneVal : "");
    const contactRows = (phoneVal && !looksLikeEmail(phoneVal)
        ? `<tr><td style="padding:4px 0;color:#888">טלפון</td><td style="padding:4px 0;text-align:left">${esc(phoneVal)}</td></tr>`
        : "") +
        (emailToShow
            ? `<tr><td style="padding:4px 0;color:#888">אימייל</td><td style="padding:4px 0;text-align:left">${esc(emailToShow)}</td></tr>`
            : "");
    return contactRows;
}
export function inner$buildOrderEmailHtml$contactRows$$step(phoneVal, emailToShow) {
    const contactRows = (phoneVal && !looksLikeEmail(phoneVal)
        ? `<tr><td style="padding:4px 0;color:#888">טלפון</td><td style="padding:4px 0;text-align:left">${esc(phoneVal)}</td></tr>`
        : "") +
        (emailToShow
            ? `<tr><td style="padding:4px 0;color:#888">אימייל</td><td style="padding:4px 0;text-align:left">${esc(emailToShow)}</td></tr>`
            : "");
    return contactRows;
}
export function inner$onDocumentCreated$customerEmail(o) {
    const customerEmail = typeof o.customerEmail === "string" ? o.customerEmail.trim() : "";
    return customerEmail;
}
export function inner$onDocumentCreated$isEmail(o) {
    const customerEmail = typeof o.customerEmail === "string" ? o.customerEmail.trim() : "";
    const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customerEmail);
    return isEmail;
}
export function inner$onDocumentCreated$isEmail$$step(customerEmail) {
    const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customerEmail);
    return isEmail;
}
export function inner$onDocumentCreated$lines(o) {
    const lines = Array.isArray(o.lines) ? o.lines : [];
    return lines;
}

export const SIGS = {
  inner$fmtDate$s: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$buildOrderEmailHtml$rows: [{"name":"lines","d":{"t":"arr","of":{"t":"obj","n":"Line","p":[["name",{"t":"any"},true],["emoji",{"t":"any"},true],["qty",{"t":"any"},true],["price",{"t":"any"},true]]}},"opt":false}],
  inner$buildOrderEmailHtml$map$name: [{"name":"l","d":{"t":"obj","n":"Line","p":[["name",{"t":"any"},true],["emoji",{"t":"any"},true],["qty",{"t":"any"},true],["price",{"t":"any"},true]]},"opt":false}],
  inner$buildOrderEmailHtml$map$qty: [{"name":"l","d":{"t":"obj","n":"Line","p":[["name",{"t":"any"},true],["emoji",{"t":"any"},true],["qty",{"t":"any"},true],["price",{"t":"any"},true]]},"opt":false}],
  inner$buildOrderEmailHtml$map$price: [{"name":"l","d":{"t":"obj","n":"Line","p":[["name",{"t":"any"},true],["emoji",{"t":"any"},true],["qty",{"t":"any"},true],["price",{"t":"any"},true]]},"opt":false}],
  inner$buildOrderEmailHtml$phoneVal: [{"name":"customerPhone","d":{"t":"str"},"opt":false}],
  inner$buildOrderEmailHtml$emailVal: [{"name":"customerEmail","d":{"t":"str"},"opt":false}],
  inner$buildOrderEmailHtml$emailToShow: [{"name":"customerPhone","d":{"t":"str"},"opt":false},{"name":"customerEmail","d":{"t":"str"},"opt":false}],
  inner$buildOrderEmailHtml$emailToShow$$step: [{"name":"phoneVal","d":{"t":"str"},"opt":false},{"name":"emailVal","d":{"t":"str"},"opt":false}],
  inner$buildOrderEmailHtml$contactRows: [{"name":"customerPhone","d":{"t":"str"},"opt":false},{"name":"customerEmail","d":{"t":"str"},"opt":false}],
  inner$buildOrderEmailHtml$contactRows$$step: [{"name":"phoneVal","d":{"t":"str"},"opt":false},{"name":"emailToShow","d":{"t":"str"},"opt":false}],
  inner$onDocumentCreated$customerEmail: [{"name":"o","d":{"t":"any"},"opt":false}],
  inner$onDocumentCreated$isEmail: [{"name":"o","d":{"t":"any"},"opt":false}],
  inner$onDocumentCreated$isEmail$$step: [{"name":"customerEmail","d":{"t":"any"},"opt":false}],
  inner$onDocumentCreated$lines: [{"name":"o","d":{"t":"any"},"opt":false}],
};
