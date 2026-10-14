// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:functions/src/approveUsers.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const APPROVE_USERS_CAP = 500;
function cleanApproveUids(input, cap = APPROVE_USERS_CAP) {
    if (!Array.isArray(input)) {
        return { uids: [], error: "uids (string[]) is required." };
    }
    const seen = new Set();
    for (const u of input) {
        if (typeof u !== "string" || u.length === 0) {
            return { uids: [], error: "every uid must be a non-empty string." };
        }
        seen.add(u);
    }
    const uids = [...seen];
    if (uids.length === 0) {
        return { uids: [], error: "uids must contain at least one uid." };
    }
    if (uids.length > cap) {
        return { uids: [], error: `too many uids in one batch (max ${cap}).` };
    }
    return { uids, error: null };
}
export function inner$onCall$clean(request) {
    const { uids, approve } = (request.data ?? {});
    const clean = cleanApproveUids(uids);
    return clean;
}
export function inner$onCall$clean$$step(uids) {
    const clean = cleanApproveUids(uids);
    return clean;
}
export function inner$onCall$status(request) {
    const { uids, approve } = (request.data ?? {});
    const status = approve ? "active" : "pending";
    return status;
}
export function inner$onCall$status$$step(approve) {
    const status = approve ? "active" : "pending";
    return status;
}

export const SIGS = {
  inner$onCall$clean: [{"name":"request","d":{"t":"any"},"opt":false}],
  inner$onCall$clean$$step: [{"name":"uids","d":{"t":"any"},"opt":false}],
  inner$onCall$status: [{"name":"request","d":{"t":"any"},"opt":false}],
  inner$onCall$status$$step: [{"name":"approve","d":{"t":"any"},"opt":false}],
};
