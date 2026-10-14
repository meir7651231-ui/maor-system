// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:artifacts/api-server/src/swarm/agents.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$runMarketAgent$userBrands(profile) {
    const israeliBrands = [
        "זארה", "H&M", "מנגו", "קסטרו", "רנואר", "פוקס", "Terminal X",
        "Adika", "ביגוד", "Golf", "Sheinstore", "Crazy Line", "Intimissimi"
    ];
    const userBrands = profile.favoriteBrands.length > 0 ? profile.favoriteBrands : israeliBrands.slice(0, 5);
    return userBrands;
}
export function inner$runMarketAgent$userBrands$$step(profile, israeliBrands) {
    const userBrands = profile.favoriteBrands.length > 0 ? profile.favoriteBrands : israeliBrands.slice(0, 5);
    return userBrands;
}
export function inner$runQAAgent$jsonMatch(response) {
    const content = response.choices[0]?.message?.content ?? "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch;
}
export function inner$runQAAgent$jsonMatch$$step(content) {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch;
}
export function inner$runQAAgent$parsed(response) {
    const content = response.choices[0]?.message?.content ?? "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
}
export function inner$runQAAgent$parsed$$step(jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
}
export function inner$fallbackSuggestions$brands(profile) {
    const brands = profile.favoriteBrands.length > 0 ? profile.favoriteBrands : ["זארה", "H&M", "מנגו"];
    return brands;
}
export function inner$runSwarm$preview(result) {
    const preview = result.slice(0, 120) + (result.length > 120 ? "..." : "");
    return preview;
}

export const SIGS = {
  inner$runMarketAgent$userBrands: [{"name":"profile","d":{"t":"any"},"opt":false}],
  inner$runMarketAgent$userBrands$$step: [{"name":"profile","d":{"t":"any"},"opt":false},{"name":"israeliBrands","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$runQAAgent$jsonMatch: [{"name":"response","d":{"t":"any"},"opt":false}],
  inner$runQAAgent$jsonMatch$$step: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$runQAAgent$parsed: [{"name":"response","d":{"t":"any"},"opt":false}],
  inner$runQAAgent$parsed$$step: [{"name":"jsonMatch","d":{"t":"any"},"opt":false}],
  inner$fallbackSuggestions$brands: [{"name":"profile","d":{"t":"any"},"opt":false}],
  inner$runSwarm$preview: [{"name":"result","d":{"t":"any"},"opt":false}],
};
