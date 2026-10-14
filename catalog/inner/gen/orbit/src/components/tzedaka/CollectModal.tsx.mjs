// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/tzedaka/CollectModal.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$CollectModal$active(campaigns) {
    const active = campaigns.filter((c) => c.active);
    return active;
}
export function inner$CollectModal$save$amount(f) {
    const amount = Math.round(+f.amount);
    return amount;
}

export const SIGS = {
  inner$CollectModal$active: [{"name":"campaigns","d":{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["start",{"t":"str"},false],["end",{"t":"str"},false],["goal",{"t":"num"},false],["active",{"t":"bool"},false],["notes",{"t":"str"},false]]}},"opt":false}],
  inner$CollectModal$save$amount: [{"name":"f","d":{"t":"obj","p":[["date",{"t":"str"},false],["amount",{"t":"str"},false],["campaignId",{"t":"str"},false],["note",{"t":"str"},false]]},"opt":false}],
};
