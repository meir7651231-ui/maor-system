// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:functions/src/push.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$sendToUsers$unique(uids) {
    const unique = [...new Set(uids.filter((u) => u.length > 0))];
    return unique;
}
export function inner$sendToUsers$targets(looked) {
    const targets = looked.filter((t) => t.token !== null);
    return targets;
}
export function inner$onDocumentUpdated$from(before) {
    const from = before.get("stage");
    return from;
}
export function inner$onDocumentUpdated$to(after) {
    const to = after.get("stage");
    return to;
}
export function inner$onDocumentUpdated$guardChanged(before, after) {
    const guardChanged = JSON.stringify(before.get("stageGuard") ?? null) !==
        JSON.stringify(after.get("stageGuard") ?? null);
    return guardChanged;
}
export function inner$onDocumentCreated$raw(thread) {
    const raw = thread.get("participantUids");
    return raw;
}
export function inner$onDocumentCreated$participantUids(thread) {
    const raw = thread.get("participantUids");
    const participantUids = Array.isArray(raw)
        ? raw.filter((p) => typeof p === "string" && p.length > 0)
        : [];
    return participantUids;
}
export function inner$onDocumentCreated$participantUids$$step(raw) {
    const participantUids = Array.isArray(raw)
        ? raw.filter((p) => typeof p === "string" && p.length > 0)
        : [];
    return participantUids;
}
export function inner$onDocumentCreated$recipients(fromUid, thread) {
    const raw = thread.get("participantUids");
    const participantUids = Array.isArray(raw)
        ? raw.filter((p) => typeof p === "string" && p.length > 0)
        : [];
    const recipients = participantUids.filter((p) => p !== fromUid);
    return recipients;
}
export function inner$onDocumentCreated$recipients$$step(fromUid, participantUids) {
    const recipients = participantUids.filter((p) => p !== fromUid);
    return recipients;
}
export function inner$onDocumentCreated$title(sender) {
    const title = sender !== null ? `הודעה חדשה מ־${sender}` : "הודעה חדשה";
    return title;
}
export function inner$onDocumentCreated$preview(text) {
    const preview = text.length > 80 ? `${text.slice(0, 79)}…` : text;
    return preview;
}

export const SIGS = {
  inner$sendToUsers$unique: [{"name":"uids","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$sendToUsers$targets: [{"name":"looked","d":{"t":"arr","of":{"t":"obj","p":[["uid",{"t":"str"},false],["token",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}},"opt":false}],
  inner$onDocumentUpdated$from: [{"name":"before","d":{"t":"any"},"opt":false}],
  inner$onDocumentUpdated$to: [{"name":"after","d":{"t":"any"},"opt":false}],
  inner$onDocumentUpdated$guardChanged: [{"name":"before","d":{"t":"any"},"opt":false},{"name":"after","d":{"t":"any"},"opt":false}],
  inner$onDocumentCreated$raw: [{"name":"thread","d":{"t":"any"},"opt":false}],
  inner$onDocumentCreated$participantUids: [{"name":"thread","d":{"t":"any"},"opt":false}],
  inner$onDocumentCreated$participantUids$$step: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$onDocumentCreated$recipients: [{"name":"fromUid","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false},{"name":"thread","d":{"t":"any"},"opt":false}],
  inner$onDocumentCreated$recipients$$step: [{"name":"fromUid","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false},{"name":"participantUids","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$onDocumentCreated$title: [{"name":"sender","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$onDocumentCreated$preview: [{"name":"text","d":{"t":"str"},"opt":false}],
};
