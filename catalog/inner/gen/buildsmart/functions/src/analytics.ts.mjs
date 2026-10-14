// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:functions/src/analytics.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$pickShard$i(r, numShards) {
    const i = Math.floor(r * numShards);
    return i;
}
export function inner$summarizePresence$lastSeen(d) {
    const lastSeen = typeof d.lastSeen === "number" ? d.lastSeen : 0;
    return lastSeen;
}
export function inner$summarizePresence$role(d) {
    const role = typeof d.role === "string" && d.role.length > 0 ? d.role : "unknown";
    return role;
}
export function inner$summarizePresence$uid(d) {
    const uid = typeof d.uid === "string" && d.uid.length > 0 ? d.uid : null;
    return uid;
}
export function inner$onSchedule$docs(snap) {
    const docs = snap.docs.map((d) => ({
        role: d.get("role"),
        lastSeen: d.get("lastSeen"),
        uid: d.id,
    }));
    return docs;
}
export function inner$sumShards$total$$after_loop(values) {
    let total = 0;
    for (const v of values) {
        if (typeof v === "number" && Number.isFinite(v))
            total += v;
    }
    return total;
}
export function inner$summarizePresence$count$$after_loop(docs, now, staleMs, sampleCap) {
    let count = 0;
    const byRole = {};
    const sample = [];
    for (const d of docs) {
        const lastSeen = typeof d.lastSeen === "number" ? d.lastSeen : 0;
        if (now - lastSeen > staleMs)
            continue; // ghost → not counted
        count++;
        const role = typeof d.role === "string" && d.role.length > 0 ? d.role : "unknown";
        byRole[role] = (byRole[role] ?? 0) + 1;
        const uid = typeof d.uid === "string" && d.uid.length > 0 ? d.uid : null;
        if (uid !== null && sample.length < sampleCap)
            sample.push(uid);
    }
    return count;
}
export function inner$summarizePresence$byRole$$after_loop(docs, now, staleMs, sampleCap) {
    let count = 0;
    const byRole = {};
    const sample = [];
    for (const d of docs) {
        const lastSeen = typeof d.lastSeen === "number" ? d.lastSeen : 0;
        if (now - lastSeen > staleMs)
            continue; // ghost → not counted
        count++;
        const role = typeof d.role === "string" && d.role.length > 0 ? d.role : "unknown";
        byRole[role] = (byRole[role] ?? 0) + 1;
        const uid = typeof d.uid === "string" && d.uid.length > 0 ? d.uid : null;
        if (uid !== null && sample.length < sampleCap)
            sample.push(uid);
    }
    return byRole;
}
export function inner$summarizePresence$sample$$after_loop(docs, now, staleMs, sampleCap) {
    let count = 0;
    const byRole = {};
    const sample = [];
    for (const d of docs) {
        const lastSeen = typeof d.lastSeen === "number" ? d.lastSeen : 0;
        if (now - lastSeen > staleMs)
            continue; // ghost → not counted
        count++;
        const role = typeof d.role === "string" && d.role.length > 0 ? d.role : "unknown";
        byRole[role] = (byRole[role] ?? 0) + 1;
        const uid = typeof d.uid === "string" && d.uid.length > 0 ? d.uid : null;
        if (uid !== null && sample.length < sampleCap)
            sample.push(uid);
    }
    return sample;
}

export const SIGS = {
  inner$pickShard$i: [{"name":"r","d":{"t":"num"},"opt":false},{"name":"numShards","d":{"t":"num"},"opt":false}],
  inner$summarizePresence$lastSeen: [{"name":"d","d":{"t":"obj","n":"PresenceDoc","p":[["role",{"t":"any"},true],["lastSeen",{"t":"any"},true],["uid",{"t":"any"},true]]},"opt":false}],
  inner$summarizePresence$role: [{"name":"d","d":{"t":"obj","n":"PresenceDoc","p":[["role",{"t":"any"},true],["lastSeen",{"t":"any"},true],["uid",{"t":"any"},true]]},"opt":false}],
  inner$summarizePresence$uid: [{"name":"d","d":{"t":"obj","n":"PresenceDoc","p":[["role",{"t":"any"},true],["lastSeen",{"t":"any"},true],["uid",{"t":"any"},true]]},"opt":false}],
  inner$onSchedule$docs: [{"name":"snap","d":{"t":"any"},"opt":false}],
  inner$sumShards$total$$after_loop: [{"name":"values","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$summarizePresence$count$$after_loop: [{"name":"docs","d":{"t":"arr","of":{"t":"obj","n":"PresenceDoc","p":[["role",{"t":"any"},true],["lastSeen",{"t":"any"},true],["uid",{"t":"any"},true]]}},"opt":false},{"name":"now","d":{"t":"num"},"opt":false},{"name":"staleMs","d":{"t":"num"},"opt":false},{"name":"sampleCap","d":{"t":"num"},"opt":false}],
  inner$summarizePresence$byRole$$after_loop: [{"name":"docs","d":{"t":"arr","of":{"t":"obj","n":"PresenceDoc","p":[["role",{"t":"any"},true],["lastSeen",{"t":"any"},true],["uid",{"t":"any"},true]]}},"opt":false},{"name":"now","d":{"t":"num"},"opt":false},{"name":"staleMs","d":{"t":"num"},"opt":false},{"name":"sampleCap","d":{"t":"num"},"opt":false}],
  inner$summarizePresence$sample$$after_loop: [{"name":"docs","d":{"t":"arr","of":{"t":"obj","n":"PresenceDoc","p":[["role",{"t":"any"},true],["lastSeen",{"t":"any"},true],["uid",{"t":"any"},true]]}},"opt":false},{"name":"now","d":{"t":"num"},"opt":false},{"name":"staleMs","d":{"t":"num"},"opt":false},{"name":"sampleCap","d":{"t":"num"},"opt":false}],
};
