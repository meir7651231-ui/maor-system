// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/parnasa/ZmanimLocationEditor.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const num = (s) => {
    const t = s.trim();
    if (!t)
        return undefined;
    const n = Number(t);
    return Number.isFinite(n) ? n : undefined;
};
export function inner$num$t(s) {
    const t = s.trim();
    return t;
}
export function inner$num$n(s) {
    const t = s.trim();
    const n = Number(t);
    return n;
}
export function inner$num$n$$step(t) {
    const n = Number(t);
    return n;
}
export function inner$ZmanimLocationEditor$draft(mode, f) {
    const draft = {
        ...(mode === 'city' ? { city: f.city } : { lat: num(f.lat), lon: num(f.lon) }),
        label: f.label.trim() || undefined,
        candleMin: num(f.candleMin),
        tzeisMin: num(f.tzeisMin),
        tz: f.tz.trim() || undefined,
        elevation: num(f.elevation),
    };
    return draft;
}
export function inner$ZmanimLocationEditor$cityDefault(mode, f, CITIES, PR_DEFAULT_CITY) {
    const cityDefault = CITIES[mode === 'city' ? f.city : PR_DEFAULT_CITY];
    return cityDefault;
}
export function inner$ZmanimLocationEditor$save$clean(draft) {
    const clean = Object.fromEntries(Object.entries(draft).filter(([, v]) => v !== undefined));
    return clean;
}

export const SIGS = {
  inner$num$t: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$num$n: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$num$n$$step: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$ZmanimLocationEditor$draft: [{"name":"mode","d":{"t":"lit","v":["city","geo"]},"opt":false},{"name":"f","d":{"t":"obj","p":[["city",{"t":"str"},false],["lat",{"t":"str"},false],["lon",{"t":"str"},false],["label",{"t":"str"},false],["candleMin",{"t":"str"},false],["tzeisMin",{"t":"str"},false],["tz",{"t":"str"},false],["elevation",{"t":"str"},false]]},"opt":false}],
  inner$ZmanimLocationEditor$cityDefault: [{"name":"mode","d":{"t":"lit","v":["city","geo"]},"opt":false},{"name":"f","d":{"t":"obj","p":[["city",{"t":"str"},false],["lat",{"t":"str"},false],["lon",{"t":"str"},false],["label",{"t":"str"},false],["candleMin",{"t":"str"},false],["tzeisMin",{"t":"str"},false],["tz",{"t":"str"},false],["elevation",{"t":"str"},false]]},"opt":false},{"name":"CITIES","d":{"t":"rec","of":{"t":"obj","n":"CityGeo","p":[["he",{"t":"str"},false],["lat",{"t":"num"},false],["lon",{"t":"num"},false],["candle",{"t":"num"},false]]}},"opt":false},{"name":"PR_DEFAULT_CITY","d":{"t":"lit","v":["bneibrak"]},"opt":false}],
  inner$ZmanimLocationEditor$save$clean: [{"name":"draft","d":{"t":"obj","n":"ParnasaZmanimPrefs","p":[["city",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["lat",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lon",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["elevation",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tz",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["label",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["candleMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tzeisMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
};
