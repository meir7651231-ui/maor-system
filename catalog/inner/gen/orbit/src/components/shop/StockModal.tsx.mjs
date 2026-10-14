// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/shop/StockModal.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$StockModal$save$n(amount) {
    const n = Math.round(+amount);
    return n;
}
export function inner$StockModal$save$c(kind, cost) {
    const c = kind === 'donation' ? 0 : Math.round(+(cost || '0'));
    return c;
}

export const SIGS = {
  inner$StockModal$save$n: [{"name":"amount","d":{"t":"str"},"opt":false}],
  inner$StockModal$save$c: [{"name":"kind","d":{"t":"lit","v":["buy","donation"]},"opt":false},{"name":"cost","d":{"t":"str"},"opt":false}],
};
