// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:artifacts/api-server/src/routes/swarm.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$post$id(req) {
    const id = parseInt(req.params.id);
    return id;
}
export function inner$post$occasion(body) {
    const occasion = body.success && body.data.occasion ? body.data.occasion : "יומיומי";
    return occasion;
}
export function inner$post$season(body) {
    const season = body.success && body.data.season ? body.data.season : "אביב";
    return season;
}
export function inner$post$mood(body) {
    const mood = body.success && body.data.mood ? body.data.mood : "רגוע";
    return mood;
}
export function inner$post$msg(err) {
    const msg = err instanceof Error ? err.message : String(err);
    return msg;
}
export function inner$post$msg_L67(err) {
    const msg = err instanceof Error ? err.message : String(err);
    return msg;
}
export function inner$post$profileNames(response) {
    const profileNames = response.map(p => p.name);
    return profileNames;
}
export function inner$post$msg_L126(err) {
    const msg = err instanceof Error ? err.message : String(err);
    return msg;
}
export function inner$extractWithAI$jsonMatch(response) {
    const content = response.choices[0]?.message?.content ?? "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch;
}
export function inner$extractWithAI$jsonMatch$$step(content) {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch;
}

export const SIGS = {
  inner$post$id: [{"name":"req","d":{"t":"any"},"opt":false}],
  inner$post$occasion: [{"name":"body","d":{"t":"any"},"opt":false}],
  inner$post$season: [{"name":"body","d":{"t":"any"},"opt":false}],
  inner$post$mood: [{"name":"body","d":{"t":"any"},"opt":false}],
  inner$post$msg: [{"name":"err","d":{"t":"any"},"opt":false}],
  inner$post$msg_L67: [{"name":"err","d":{"t":"any"},"opt":false}],
  inner$post$profileNames: [{"name":"response","d":{"t":"any"},"opt":false}],
  inner$post$msg_L126: [{"name":"err","d":{"t":"any"},"opt":false}],
  inner$extractWithAI$jsonMatch: [{"name":"response","d":{"t":"any"},"opt":false}],
  inner$extractWithAI$jsonMatch$$step: [{"name":"content","d":{"t":"any"},"opt":false}],
};
