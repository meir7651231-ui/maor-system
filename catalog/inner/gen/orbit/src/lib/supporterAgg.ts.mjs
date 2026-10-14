// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/supporterAgg.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$supporterAggregates$dons(sp) {
    const dons = Array.isArray(sp.donations) ? sp.donations : [];
    return dons;
}
export function inner$supporterAggregates$amt(d) {
    const amt = Number.isFinite(d.amount) ? d.amount : 0;
    return amt;
}

export const SIGS = {
  inner$supporterAggregates$dons: [{"name":"sp","d":{"t":"obj","n":"Pick","p":[["donations",{"t":"arr","of":{"t":"obj","n":"Donation","p":[["rid",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["cat",{"t":"str"},false],["designation",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["purpose",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["hist",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["d",{"t":"str"},false],["a",{"t":"num"},false],["c",{"t":"or","of":[{"t":"lit","v":["₪","$"]},{"t":"undef"}]},true],["ref",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["txn",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["receipt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["brand",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["last4",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["clearer",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["pays",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["status",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true]]},"opt":false}],
  inner$supporterAggregates$amt: [{"name":"d","d":{"t":"obj","n":"Donation","p":[["rid",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["cat",{"t":"str"},false],["designation",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["purpose",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
};
