// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:test_frontend_api_connection.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$FrontendAPITester$makeRequest$Promise$options(method, urlObj) {
    const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Asset-Manager-Tester'
        }
    };
    return options;
}
export function inner$FrontendAPITester$makeRequest$Promise$request$on$data(body) {
    const data = JSON.parse(body);
    return data;
}

export const SIGS = {
  inner$FrontendAPITester$makeRequest$Promise$options: [{"name":"method","d":{"t":"str"},"opt":false},{"name":"urlObj","d":{"t":"obj","n":"URL","p":[["hash",{"t":"str"},false],["host",{"t":"str"},false],["hostname",{"t":"str"},false],["href",{"t":"str"},false],["toString",{"t":"fn"},false],["origin",{"t":"str"},false],["password",{"t":"str"},false],["pathname",{"t":"str"},false],["port",{"t":"str"},false],["protocol",{"t":"str"},false],["search",{"t":"str"},false],["searchParams",{"t":"obj","n":"URLSearchParams","p":[["size",{"t":"num"},false],["append",{"t":"fn"},false],["delete",{"t":"fn"},false],["get",{"t":"fn"},false],["getAll",{"t":"fn"},false],["has",{"t":"fn"},false],["set",{"t":"fn"},false],["sort",{"t":"fn"},false],["toString",{"t":"fn"},false],["forEach",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false]]},false],["username",{"t":"str"},false],["toJSON",{"t":"fn"},false]]},"opt":false}],
  inner$FrontendAPITester$makeRequest$Promise$request$on$data: [{"name":"body","d":{"t":"str"},"opt":false}],
};
