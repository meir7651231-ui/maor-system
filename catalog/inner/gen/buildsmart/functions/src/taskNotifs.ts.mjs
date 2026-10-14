// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:functions/src/taskNotifs.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const CAP = 50;
function bellFor(from, to) {
    if (to === "done")
        return { emoji: "✅", title: "המשימה אושרה" };
    if (to === "rejected")
        return { emoji: "🔁", title: "הוחזרה לתיקון" };
    if (to === "active" && from === "proposed") {
        return { emoji: "✅", title: "ההצעה אושרה — המשימה פעילה" };
    }
    if (to === "active" && from === "pending") {
        return { emoji: "📋", title: "משימה חדשה הוקצתה" };
    }
    return null; // →review / →proposed / no-op — not the worker's bell
}
export function inner$onDocumentUpdated$bell(from, to) {
    const bell = bellFor(from, to);
    return bell;
}
export function inner$onDocumentUpdated$entry(event, from, to, taskId, name) {
    const bell = bellFor(from, to);
    const entry = {
        id: `${taskId}-${to}-${event.time}`, // deterministic per transition
        emoji: bell.emoji,
        title: bell.title,
        body: name,
        ts: event.time,
        read: false,
    };
    return entry;
}
export function inner$onDocumentUpdated$entry$$step(event, to, bell, taskId, name) {
    const entry = {
        id: `${taskId}-${to}-${event.time}`, // deterministic per transition
        emoji: bell.emoji,
        title: bell.title,
        body: name,
        ts: event.time,
        read: false,
    };
    return entry;
}
export function inner$onDocumentUpdated$runTransaction$prev(snap) {
    const prev = (snap.exists ? snap.get("items") : null);
    return prev;
}
export function inner$onDocumentUpdated$runTransaction$items(entry, snap) {
    const prev = (snap.exists ? snap.get("items") : null);
    const items = [entry, ...(Array.isArray(prev) ? prev : [])].slice(0, CAP);
    return items;
}
export function inner$onDocumentUpdated$runTransaction$items$$step(entry, prev) {
    const items = [entry, ...(Array.isArray(prev) ? prev : [])].slice(0, CAP);
    return items;
}

export const SIGS = {
  inner$onDocumentUpdated$bell: [{"name":"from","d":{"t":"str"},"opt":false},{"name":"to","d":{"t":"str"},"opt":false}],
  inner$onDocumentUpdated$entry: [{"name":"event","d":{"t":"any"},"opt":false},{"name":"from","d":{"t":"str"},"opt":false},{"name":"to","d":{"t":"str"},"opt":false},{"name":"taskId","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"str"},"opt":false}],
  inner$onDocumentUpdated$entry$$step: [{"name":"event","d":{"t":"any"},"opt":false},{"name":"to","d":{"t":"str"},"opt":false},{"name":"bell","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["emoji",{"t":"str"},false],["title",{"t":"str"},false]]}]},"opt":false},{"name":"taskId","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"str"},"opt":false}],
  inner$onDocumentUpdated$runTransaction$prev: [{"name":"snap","d":{"t":"any"},"opt":false}],
  inner$onDocumentUpdated$runTransaction$items: [{"name":"entry","d":{"t":"obj","n":"Bell","p":[["id",{"t":"str"},false],["emoji",{"t":"str"},false],["title",{"t":"str"},false],["body",{"t":"str"},false],["ts",{"t":"str"},false],["read",{"t":"bool"},false]]},"opt":false},{"name":"snap","d":{"t":"any"},"opt":false}],
  inner$onDocumentUpdated$runTransaction$items$$step: [{"name":"entry","d":{"t":"obj","n":"Bell","p":[["id",{"t":"str"},false],["emoji",{"t":"str"},false],["title",{"t":"str"},false],["body",{"t":"str"},false],["ts",{"t":"str"},false],["read",{"t":"bool"},false]]},"opt":false},{"name":"prev","d":{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"obj","n":"Bell","p":[["id",{"t":"str"},false],["emoji",{"t":"str"},false],["title",{"t":"str"},false],["body",{"t":"str"},false],["ts",{"t":"str"},false],["read",{"t":"bool"},false]]}}]},"opt":false}],
};
