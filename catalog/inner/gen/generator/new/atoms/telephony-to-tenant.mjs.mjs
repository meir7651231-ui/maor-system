// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/telephony-to-tenant.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$telephonyToTenant$map$base(ONRAMP, CHANNELS, n) {
    const base = {
        id: n.id,
        e164: n.e164.trim(),
        label: n.label || n.id,
        type: n.kind,
        onramp: ONRAMP[n.kind],
        channels: CHANNELS[n.kind],
        ...(n.kosher ? { kosher: true } : {}),
    };
    return base;
}
export function inner$telephonyToTenant$firstSim(T, numbers) {
    const firstSim = numbers.find((n) => n.onramp === T.k1);
    return firstSim;
}

export const SIGS = {
  inner$telephonyToTenant$map$base: [{"name":"ONRAMP","d":{"t":"obj","p":[["sim",{"t":"any"},false],["virtual",{"t":"any"},false],["whatsapp",{"t":"any"},false]]},"opt":false},{"name":"CHANNELS","d":{"t":"obj","p":[["sim",{"t":"arr","of":{"t":"any"}},false],["virtual",{"t":"arr","of":{"t":"any"}},false],["whatsapp",{"t":"arr","of":{"t":"any"}},false]]},"opt":false},{"name":"n","d":{"t":"any"},"opt":false}],
  inner$telephonyToTenant$firstSim: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"numbers","d":{"t":"any"},"opt":false}],
};
