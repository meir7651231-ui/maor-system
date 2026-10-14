// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:functions/src/r2.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$sanitizeFileName$last(name) {
    const last = (name ?? "").split("/").pop() ?? "";
    return last;
}
export function inner$sanitizeFileName$base(name) {
    const last = (name ?? "").split("/").pop() ?? "";
    const base = (last.split("\\").pop() ?? "")
        .replace(/[^A-Za-z0-9._-]/g, "-")
        .replace(/^[.-]+/, "")
        .slice(0, 80);
    return base;
}
export function inner$sanitizeFileName$base$$step(last) {
    const base = (last.split("\\").pop() ?? "")
        .replace(/[^A-Za-z0-9._-]/g, "-")
        .replace(/^[.-]+/, "")
        .slice(0, 80);
    return base;
}
export function inner$onCall$contentType(request) {
    const data = (request.data ?? {});
    const contentType = typeof data.contentType === "string"
        ? data.contentType
        : "";
    return contentType;
}
export function inner$onCall$contentType$$step(data) {
    const contentType = typeof data.contentType === "string"
        ? data.contentType
        : "";
    return contentType;
}

export const SIGS = {
  inner$sanitizeFileName$last: [{"name":"name","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$sanitizeFileName$base: [{"name":"name","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$sanitizeFileName$base$$step: [{"name":"last","d":{"t":"str"},"opt":false}],
  inner$onCall$contentType: [{"name":"request","d":{"t":"any"},"opt":false}],
  inner$onCall$contentType$$step: [{"name":"data","d":{"t":"obj","n":"GetUploadUrlData","p":[["kind",{"t":"any"},true],["contentType",{"t":"any"},true],["fileName",{"t":"any"},true]]},"opt":false}],
};
