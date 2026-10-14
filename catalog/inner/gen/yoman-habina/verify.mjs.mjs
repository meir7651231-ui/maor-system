// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך yoman-habina:verify.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const EDITIONS = ["personal", "public"];
export function inner$makeValidator$check$isType(val, t) {
    const isType = t === "array" ? Array.isArray(val) :
        t === "object" ? (val && typeof val === "object" && !Array.isArray(val)) :
            t === "string" ? typeof val === "string" :
                t === "boolean" ? typeof val === "boolean" :
                    t === "integer" ? Number.isInteger(val) :
                        t === "number" ? typeof val === "number" : true;
    return isType;
}
export function inner$partInjection$nonHttps() {
    const urls = [];
    const nonHttps = urls.filter(u => !/^https:\/\//.test(u));
    return nonHttps;
}
export function inner$partInjection$nonHttps$$step(urls) {
    const nonHttps = urls.filter(u => !/^https:\/\//.test(u));
    return nonHttps;
}
export function inner$islandHtml$island(json) {
    const island = `<script id="issue-data" type="application/json">${json}</script>`;
    return island;
}
export function inner$partSmoke$base(port) {
    const base = `http://localhost:${port}`;
    return base;
}
export function inner$partSmoke$label(c) {
    const label = `${c.ed}/${c.mode}`;
    return label;
}
export function inner$partSmoke$cases$$after_loop(port) {
    const base = `http://localhost:${port}`;
    const cases = [];
    for (const ed of EDITIONS) {
        cases.push({ ed, mode: "fetch", url: `${base}/index.html?issue=${ed}` });
        cases.push({ ed, mode: "island", url: `${base}/__island?issue=${ed}` });
    }
    return cases;
}

export const SIGS = {
  inner$makeValidator$check$isType: [{"name":"val","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$partInjection$nonHttps: [],
  inner$partInjection$nonHttps$$step: [{"name":"urls","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$islandHtml$island: [{"name":"json","d":{"t":"any"},"opt":false}],
  inner$partSmoke$base: [{"name":"port","d":{"t":"any"},"opt":false}],
  inner$partSmoke$label: [{"name":"c","d":{"t":"obj","p":[["ed",{"t":"str"},false],["mode",{"t":"str"},false],["url",{"t":"str"},false]]},"opt":false}],
  inner$partSmoke$cases$$after_loop: [{"name":"port","d":{"t":"any"},"opt":false}],
};
