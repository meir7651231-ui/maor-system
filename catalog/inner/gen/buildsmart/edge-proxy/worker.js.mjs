// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:edge-proxy/worker.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$class$fetch$label(url) {
    const label = url.hostname.split('.')[0];
    return label;
}
export function inner$class$fetch$seg(url) {
    const seg = url.pathname.split('/').filter(Boolean);
    return seg;
}

export const SIGS = {
  inner$class$fetch$label: [{"name":"url","d":{"t":"obj","n":"URL","p":[["hash",{"t":"str"},false],["host",{"t":"str"},false],["hostname",{"t":"str"},false],["href",{"t":"str"},false],["toString",{"t":"fn"},false],["origin",{"t":"str"},false],["password",{"t":"str"},false],["pathname",{"t":"str"},false],["port",{"t":"str"},false],["protocol",{"t":"str"},false],["search",{"t":"str"},false],["searchParams",{"t":"obj","n":"URLSearchParams","p":[["size",{"t":"num"},false],["append",{"t":"fn"},false],["delete",{"t":"fn"},false],["get",{"t":"fn"},false],["getAll",{"t":"fn"},false],["has",{"t":"fn"},false],["set",{"t":"fn"},false],["sort",{"t":"fn"},false],["toString",{"t":"fn"},false],["forEach",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false]]},false],["username",{"t":"str"},false],["toJSON",{"t":"fn"},false]]},"opt":false}],
  inner$class$fetch$seg: [{"name":"url","d":{"t":"obj","n":"URL","p":[["hash",{"t":"str"},false],["host",{"t":"str"},false],["hostname",{"t":"str"},false],["href",{"t":"str"},false],["toString",{"t":"fn"},false],["origin",{"t":"str"},false],["password",{"t":"str"},false],["pathname",{"t":"str"},false],["port",{"t":"str"},false],["protocol",{"t":"str"},false],["search",{"t":"str"},false],["searchParams",{"t":"obj","n":"URLSearchParams","p":[["size",{"t":"num"},false],["append",{"t":"fn"},false],["delete",{"t":"fn"},false],["get",{"t":"fn"},false],["getAll",{"t":"fn"},false],["has",{"t":"fn"},false],["set",{"t":"fn"},false],["sort",{"t":"fn"},false],["toString",{"t":"fn"},false],["forEach",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false]]},false],["username",{"t":"str"},false],["toJSON",{"t":"fn"},false]]},"opt":false}],
};
