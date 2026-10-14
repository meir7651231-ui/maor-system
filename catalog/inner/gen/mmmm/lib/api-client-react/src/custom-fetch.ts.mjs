// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:lib/api-client-react/src/custom-fetch.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function stripBom(text) {
    return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}
function getStringField(value, key) {
    if (!value || typeof value !== "object")
        return undefined;
    const candidate = value[key];
    if (typeof candidate !== "string")
        return undefined;
    const trimmed = candidate.trim();
    return trimmed === "" ? undefined : trimmed;
}
export function inner$applyBaseUrl$absolute(_baseUrl, url) {
    const absolute = `${_baseUrl}${url}`;
    return absolute;
}
export function inner$looksLikeJson$trimmed(text) {
    const trimmed = text.trimStart();
    return trimmed;
}
export function inner$getStringField$trimmed(candidate) {
    const trimmed = candidate.trim();
    return trimmed;
}
export function inner$buildErrorMessage$prefix(response) {
    const prefix = `HTTP ${response.status} ${response.statusText}`;
    return prefix;
}
export function inner$buildErrorMessage$text(data) {
    const text = data.trim();
    return text;
}
export function inner$buildErrorMessage$title(data) {
    const title = getStringField(data, "title");
    return title;
}
export function inner$buildErrorMessage$detail(data) {
    const detail = getStringField(data, "detail");
    return detail;
}
export function inner$buildErrorMessage$message(data) {
    const message = getStringField(data, "message") ??
        getStringField(data, "error_description") ??
        getStringField(data, "error");
    return message;
}
export function inner$parseJsonBody$normalized(raw) {
    const normalized = stripBom(raw);
    return normalized;
}
export function inner$parseErrorBody$normalized(raw) {
    const normalized = stripBom(raw);
    return normalized;
}
export function inner$parseErrorBody$trimmed(raw) {
    const normalized = stripBom(raw);
    const trimmed = normalized.trim();
    return trimmed;
}
export function inner$parseErrorBody$trimmed$$step(normalized) {
    const trimmed = normalized.trim();
    return trimmed;
}

export const SIGS = {
  inner$applyBaseUrl$absolute: [{"name":"_baseUrl","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false},{"name":"url","d":{"t":"str"},"opt":false}],
  inner$looksLikeJson$trimmed: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$getStringField$trimmed: [{"name":"candidate","d":{"t":"any"},"opt":false}],
  inner$buildErrorMessage$prefix: [{"name":"response","d":{"t":"obj","n":"Response","p":[["headers",{"t":"obj","n":"Headers","p":[["append",{"t":"fn"},false],["delete",{"t":"fn"},false],["get",{"t":"fn"},false],["getSetCookie",{"t":"fn"},false],["has",{"t":"fn"},false],["set",{"t":"fn"},false],["forEach",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false]]},false],["ok",{"t":"bool"},false],["redirected",{"t":"bool"},false],["status",{"t":"num"},false],["statusText",{"t":"str"},false],["type",{"t":"lit","v":["default","basic","cors","error","opaque","opaqueredirect"]},false],["url",{"t":"str"},false],["clone",{"t":"fn"},false],["body",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"ReadableStream","p":[["locked",{"t":"bool"},false],["cancel",{"t":"fn"},false],["getReader",{"t":"fn"},false],["pipeThrough",{"t":"fn"},false],["pipeTo",{"t":"fn"},false],["tee",{"t":"fn"},false],["values",{"t":"fn"},false]]}]},false],["bodyUsed",{"t":"bool"},false],["arrayBuffer",{"t":"fn"},false],["blob",{"t":"fn"},false],["bytes",{"t":"fn"},false],["formData",{"t":"fn"},false],["json",{"t":"fn"},false],["text",{"t":"fn"},false]]},"opt":false}],
  inner$buildErrorMessage$text: [{"name":"data","d":{"t":"any"},"opt":false}],
  inner$buildErrorMessage$title: [{"name":"data","d":{"t":"any"},"opt":false}],
  inner$buildErrorMessage$detail: [{"name":"data","d":{"t":"any"},"opt":false}],
  inner$buildErrorMessage$message: [{"name":"data","d":{"t":"any"},"opt":false}],
  inner$parseJsonBody$normalized: [{"name":"raw","d":{"t":"str"},"opt":false}],
  inner$parseErrorBody$normalized: [{"name":"raw","d":{"t":"str"},"opt":false}],
  inner$parseErrorBody$trimmed: [{"name":"raw","d":{"t":"str"},"opt":false}],
  inner$parseErrorBody$trimmed$$step: [{"name":"normalized","d":{"t":"str"},"opt":false}],
};
