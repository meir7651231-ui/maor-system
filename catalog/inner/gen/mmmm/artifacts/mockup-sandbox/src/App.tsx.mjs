// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:artifacts/mockup-sandbox/src/App.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function _resolveComponent(mod, name) {
    const fns = Object.values(mod).filter((v) => typeof v === "function");
    return (mod.default ||
        mod.Preview ||
        mod[name] ||
        fns[fns.length - 1]);
}
function getBasePath() {
    return import.meta.env.BASE_URL.replace(/\/$/, "");
}
export function inner$_resolveComponent$fns(mod) {
    const fns = Object.values(mod).filter((v) => typeof v === "function");
    return fns;
}
export function inner$PreviewRenderer$useEffect$loadComponent$key(componentPath) {
    const key = `./components/mockups/${componentPath}.tsx`;
    return key;
}
export function inner$PreviewRenderer$useEffect$loadComponent$name(componentPath) {
    const name = componentPath.split("/").pop();
    return name;
}
export function inner$PreviewRenderer$useEffect$loadComponent$comp(componentPath, mod) {
    const name = componentPath.split("/").pop();
    const comp = _resolveComponent(mod, name);
    return comp;
}
export function inner$PreviewRenderer$useEffect$loadComponent$comp$$step(mod, name) {
    const comp = _resolveComponent(mod, name);
    return comp;
}
export function inner$PreviewRenderer$useEffect$loadComponent$message(e) {
    const message = e instanceof Error ? e.message : String(e);
    return message;
}
export function inner$getPreviewExamplePath$basePath() {
    const basePath = getBasePath();
    return basePath;
}
export function inner$getPreviewPath$basePath() {
    const basePath = getBasePath();
    return basePath;
}
export function inner$getPreviewPath$local(pathname) {
    const basePath = getBasePath();
    const local = basePath && pathname.startsWith(basePath)
        ? pathname.slice(basePath.length) || "/"
        : pathname;
    return local;
}
export function inner$getPreviewPath$local$$step(basePath, pathname) {
    const local = basePath && pathname.startsWith(basePath)
        ? pathname.slice(basePath.length) || "/"
        : pathname;
    return local;
}
export function inner$getPreviewPath$match(pathname) {
    const basePath = getBasePath();
    const local = basePath && pathname.startsWith(basePath)
        ? pathname.slice(basePath.length) || "/"
        : pathname;
    const match = local.match(/^\/preview\/(.+)$/);
    return match;
}
export function inner$getPreviewPath$match$$step(local) {
    const match = local.match(/^\/preview\/(.+)$/);
    return match;
}

export const SIGS = {
  inner$_resolveComponent$fns: [{"name":"mod","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$PreviewRenderer$useEffect$loadComponent$key: [{"name":"componentPath","d":{"t":"str"},"opt":false}],
  inner$PreviewRenderer$useEffect$loadComponent$name: [{"name":"componentPath","d":{"t":"str"},"opt":false}],
  inner$PreviewRenderer$useEffect$loadComponent$comp: [{"name":"componentPath","d":{"t":"str"},"opt":false},{"name":"mod","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$PreviewRenderer$useEffect$loadComponent$comp$$step: [{"name":"mod","d":{"t":"rec","of":{"t":"any"}},"opt":false},{"name":"name","d":{"t":"str"},"opt":false}],
  inner$PreviewRenderer$useEffect$loadComponent$message: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$getPreviewExamplePath$basePath: [],
  inner$getPreviewPath$basePath: [],
  inner$getPreviewPath$local: [{"name":"pathname","d":{"t":"str"},"opt":false}],
  inner$getPreviewPath$local$$step: [{"name":"basePath","d":{"t":"str"},"opt":false},{"name":"pathname","d":{"t":"str"},"opt":false}],
  inner$getPreviewPath$match: [{"name":"pathname","d":{"t":"str"},"opt":false}],
  inner$getPreviewPath$match$$step: [{"name":"local","d":{"t":"str"},"opt":false}],
};
