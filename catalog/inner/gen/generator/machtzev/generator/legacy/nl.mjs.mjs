// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/legacy/nl.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const heWords = (s) => [...(s || '').matchAll(/[֐-׿][֐-׿״׳]*/g)].map((m) => m[0]);
const cleanLabel = (s) => heWords(s).join(' ').slice(0, 34) || 'פריט';
export function inner$interpret$title(text) {
    const title = cleanLabel(text.split(/[.,\n]/)[0]).slice(0, 40) || 'המסך שלי';
    return title;
}
export function inner$interpret$fillWords(content) {
    const fillWords = (content || []).map((c) => typeof c === 'string' ? { name: cleanLabel(c), sub: '' } : { name: cleanLabel(c.name), sub: (c.sub || '').trim() }).filter((w) => w.name);
    return fillWords;
}
export function inner$interpret$phrases(text) {
    const phrases = text.split(/[,.\n]|\s+ו|\s+עם\s+|\s*\+\s*/).map((s) => s.trim()).filter((s) => s.length > 1);
    return phrases;
}
export function inner$interpret$hit(used, hits) {
    const hit = hits.find((h) => !used.has(h.cls)) || hits[0];
    return hit;
}
export function inner$interpret$boardScore(bd) {
    const boardScore = bd ? bd.s : 0;
    return boardScore;
}
export function inner$interpret$screenName(bd) {
    const screenName = bd ? bd.screen.replace(/^screens__/, '').replace(/_screen$/, '').replace(/_/g, ' ') : '';
    return screenName;
}

export const SIGS = {
  inner$interpret$title: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$interpret$fillWords: [{"name":"content","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$interpret$phrases: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$interpret$hit: [{"name":"used","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"hits","d":{"t":"any"},"opt":false}],
  inner$interpret$boardScore: [{"name":"bd","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["screen",{"t":"any"},false],["atoms",{"t":"arr","of":{"t":"any"}},false],["s",{"t":"any"},false],["cover",{"t":"any"},false],["rawParts",{"t":"any"},false]]}]},"opt":false}],
  inner$interpret$screenName: [{"name":"bd","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["screen",{"t":"any"},false],["atoms",{"t":"arr","of":{"t":"any"}},false],["s",{"t":"any"},false],["cover",{"t":"any"},false],["rawParts",{"t":"any"},false]]}]},"opt":false}],
};
