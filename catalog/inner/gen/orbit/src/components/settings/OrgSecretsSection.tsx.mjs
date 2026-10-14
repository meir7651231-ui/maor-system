// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/settings/OrgSecretsSection.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$OrgSecretsSection$save$v(vals, k) {
    const v = (vals[k] ?? '').trim();
    return v;
}

export const SIGS = {
  inner$OrgSecretsSection$save$v: [{"name":"vals","d":{"t":"obj","n":"Partial","p":[["yemotToken",{"t":"any"},true],["nedarimMosad",{"t":"any"},true],["nedarimApiPass",{"t":"any"},true],["smsApiKey",{"t":"any"},true],["smtpUrl",{"t":"any"},true],["solaXKey",{"t":"any"},true],["gcontactsClientId",{"t":"any"},true],["gcontactsClientSecret",{"t":"any"},true],["gcontactsRefresh",{"t":"any"},true]]},"opt":false},{"name":"k","d":{"t":"lit","v":["yemotToken","nedarimMosad","nedarimApiPass","smsApiKey","smtpUrl","solaXKey","gcontactsClientId","gcontactsClientSecret","gcontactsRefresh"]},"opt":false}],
};
