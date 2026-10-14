// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/goal-card.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$makeCard$card(screen, goal, models, atoms, accept, prev) {
    const card = { v: 1, ...(prev || {}), screen, goal: goal || (prev && prev.goal) || '', models: models.length ? models : (prev && prev.models) || [], atoms: atoms.length ? atoms : (prev && prev.atoms) || [], accept: accept.length ? accept : (prev && prev.accept) || [] };
    return card;
}
export function inner$makeCard$jpg(b) {
    const jpg = b[0] === 0xff && b[1] === 0xd8;
    return jpg;
}
export function inner$makeCard$body(card) {
    const body = JSON.stringify({ ...card, sig: undefined });
    return body;
}
export function inner$opt$i(argv, k) {
    const i = argv.indexOf(k);
    return i;
}

export const SIGS = {
  inner$makeCard$card: [{"name":"screen","d":{"t":"any"},"opt":false},{"name":"goal","d":{"t":"any"},"opt":false},{"name":"models","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"atoms","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"accept","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"prev","d":{"t":"null"},"opt":false}],
  inner$makeCard$jpg: [{"name":"b","d":{"t":"undef"},"opt":false}],
  inner$makeCard$body: [{"name":"card","d":{"t":"obj","p":[["screen",{"t":"any"},false],["goal",{"t":"any"},false],["models",{"t":"arr","of":{"t":"any"}},false],["atoms",{"t":"arr","of":{"t":"any"}},false],["accept",{"t":"arr","of":{"t":"any"}},false],["v",{"t":"num"},false]]},"opt":false}],
  inner$opt$i: [{"name":"argv","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
};
