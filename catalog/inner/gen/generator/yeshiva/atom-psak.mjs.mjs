// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:yeshiva/atom-psak.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const SOCK_THR = /^(threshold|thr|limit|max|min|target|goal|of|total|cap|bound)$/i;
const SOCK_STATE = /^(tone|severity|level|status|state|ok|danger|warn|alert|variants)$/i;
const SOCK_ENUM = /^(items|options|values|choices)$/i;
const SOCK_DECOR = /^(trend|delta|series|spark|sparkline|history|points|change|diff)$/i;
const SOCK_MATCH = { label: /^(label|title|caption|name|text)$/, value: /^(value|val|amount|total|count|num)$/, sub: /^(sub|subtitle|desc|body|note)$/, glyph: /^(glyph|emoji|icon)$/, onTap: /^(onTap|onPressed|onAction|onSelect|onCell)$/, message: /^(message)$/, items: SOCK_ENUM, labels: /^(labels|cols|columns|headers)$/, rows: /^(rows|data)$/, fraction: /^(fraction|pct|percent|progress)$/ };
export function inner$judge$roles(purpose) {
    const roles = purpose ? (purpose.roles || (purpose.role ? [purpose.role] : [])).filter(Boolean) : [];
    return roles;
}
export function inner$judge$cls(cand) {
    const cls = String(cand).split('@')[0];
    return cls;
}
export function inner$judge$names(w0) {
    const names = w0 ? [...w0.types.keys()].filter((n) => !/^(key|child|children|bare)$/.test(n)) : [];
    return names;
}
export function inner$judge$unfilled(w0, w) {
    const names = w0 ? [...w0.types.keys()].filter((n) => !/^(key|child|children|bare)$/.test(n)) : [];
    const unfilled = names.filter((n) => !w.filled.includes(n));
    return unfilled;
}
export function inner$judge$unfilled$$step(names, w) {
    const unfilled = names.filter((n) => !w.filled.includes(n));
    return unfilled;
}
export function inner$judge$has(w0) {
    const names = w0 ? [...w0.types.keys()].filter((n) => !/^(key|child|children|bare)$/.test(n)) : [];
    const has = names.some((n) => SOCK_THR.test(n) || SOCK_STATE.test(n));
    return has;
}
export function inner$judge$has$$step(names) {
    const has = names.some((n) => SOCK_THR.test(n) || SOCK_STATE.test(n));
    return has;
}
export function inner$judge$decor(w0, w) {
    const names = w0 ? [...w0.types.keys()].filter((n) => !/^(key|child|children|bare)$/.test(n)) : [];
    const unfilled = names.filter((n) => !w.filled.includes(n));
    const decor = unfilled.filter((n) => SOCK_DECOR.test(n));
    return decor;
}
export function inner$judge$decor$$step(unfilled) {
    const decor = unfilled.filter((n) => SOCK_DECOR.test(n));
    return decor;
}
export function inner$judge$covered(purpose, w) {
    const need = (purpose && purpose.need) || [];
    const covered = need.filter((k) => (SOCK_MATCH[k] || new RegExp(`^${k}$`)).source && w.filled.some((n) => (SOCK_MATCH[k] || new RegExp(`^${k}$`)).test(n)));
    return covered;
}
export function inner$judge$covered$$step(w, need) {
    const covered = need.filter((k) => (SOCK_MATCH[k] || new RegExp(`^${k}$`)).source && w.filled.some((n) => (SOCK_MATCH[k] || new RegExp(`^${k}$`)).test(n)));
    return covered;
}
export function inner$judge$missingNeed(purpose, w) {
    const need = (purpose && purpose.need) || [];
    const covered = need.filter((k) => (SOCK_MATCH[k] || new RegExp(`^${k}$`)).source && w.filled.some((n) => (SOCK_MATCH[k] || new RegExp(`^${k}$`)).test(n)));
    const missingNeed = need.filter((k) => !covered.includes(k));
    return missingNeed;
}
export function inner$judge$missingNeed$$step(need, covered) {
    const missingNeed = need.filter((k) => !covered.includes(k));
    return missingNeed;
}
export function inner$judge$best(survivors) {
    const best = survivors.reduce((a, b) => (b.covered > a.covered || (b.covered === a.covered && (b.shape > a.shape || (b.shape === a.shape && b.left < a.left)))) ? b : a, survivors[0]);
    return best;
}
export function inner$judge$same(survivors) {
    const best = survivors.reduce((a, b) => (b.covered > a.covered || (b.covered === a.covered && (b.shape > a.shape || (b.shape === a.shape && b.left < a.left)))) ? b : a, survivors[0]);
    const same = survivors.filter((s) => s.filledKey === best.filledKey && s.shape === best.shape);
    return same;
}
export function inner$judge$same$$step(survivors, best) {
    const same = survivors.filter((s) => s.filledKey === best.filledKey && s.shape === best.shape);
    return same;
}
export function inner$judge$chosen(survivors) {
    const best = survivors.reduce((a, b) => (b.covered > a.covered || (b.covered === a.covered && (b.shape > a.shape || (b.shape === a.shape && b.left < a.left)))) ? b : a, survivors[0]);
    const same = survivors.filter((s) => s.filledKey === best.filledKey && s.shape === best.shape);
    const chosen = same.length > 1 ? same[0] : best;
    return chosen;
}
export function inner$judge$chosen$$step(best, same) {
    const chosen = same.length > 1 ? same[0] : best;
    return chosen;
}
export function inner$judge$move(survivors) {
    const best = survivors.reduce((a, b) => (b.covered > a.covered || (b.covered === a.covered && (b.shape > a.shape || (b.shape === a.shape && b.left < a.left)))) ? b : a, survivors[0]);
    const same = survivors.filter((s) => s.filledKey === best.filledKey && s.shape === best.shape);
    const move = same.length > 1 && same[0].cls !== best.cls ? 'ממה נפשך' : same.length > 1 ? 'ממה נפשך' : 'הכרעה-20א';
    return move;
}
export function inner$judge$move$$step(best, same) {
    const move = same.length > 1 && same[0].cls !== best.cls ? 'ממה נפשך' : same.length > 1 ? 'ממה נפשך' : 'הכרעה-20א';
    return move;
}
export function inner$ledgerLine$fell(r) {
    const fell = r.rulings.filter((x) => x.verdict === 'פליגא').map((x) => `${x.cls}: ${x.move} — ${x.why}`);
    return fell;
}

export const SIGS = {
  inner$judge$roles: [{"name":"purpose","d":{"t":"any"},"opt":false}],
  inner$judge$cls: [{"name":"cand","d":{"t":"any"},"opt":false}],
  inner$judge$names: [{"name":"w0","d":{"t":"any"},"opt":false}],
  inner$judge$unfilled: [{"name":"w0","d":{"t":"any"},"opt":false},{"name":"w","d":{"t":"any"},"opt":false}],
  inner$judge$unfilled$$step: [{"name":"names","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"w","d":{"t":"any"},"opt":false}],
  inner$judge$has: [{"name":"w0","d":{"t":"any"},"opt":false}],
  inner$judge$has$$step: [{"name":"names","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$judge$decor: [{"name":"w0","d":{"t":"any"},"opt":false},{"name":"w","d":{"t":"any"},"opt":false}],
  inner$judge$decor$$step: [{"name":"unfilled","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$judge$covered: [{"name":"purpose","d":{"t":"any"},"opt":false},{"name":"w","d":{"t":"any"},"opt":false}],
  inner$judge$covered$$step: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"need","d":{"t":"any"},"opt":false}],
  inner$judge$missingNeed: [{"name":"purpose","d":{"t":"any"},"opt":false},{"name":"w","d":{"t":"any"},"opt":false}],
  inner$judge$missingNeed$$step: [{"name":"need","d":{"t":"any"},"opt":false},{"name":"covered","d":{"t":"any"},"opt":false}],
  inner$judge$best: [{"name":"survivors","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$judge$same: [{"name":"survivors","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$judge$same$$step: [{"name":"survivors","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"best","d":{"t":"obj","p":[["cls",{"t":"str"},false],["w",{"t":"any"},false],["covered",{"t":"any"},false],["left",{"t":"num"},false],["filledKey",{"t":"str"},false],["shape",{"t":"num"},false],["measured",{"t":"bool"},false]]},"opt":false}],
  inner$judge$chosen: [{"name":"survivors","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$judge$chosen$$step: [{"name":"best","d":{"t":"obj","p":[["cls",{"t":"str"},false],["w",{"t":"any"},false],["covered",{"t":"any"},false],["left",{"t":"num"},false],["filledKey",{"t":"str"},false],["shape",{"t":"num"},false],["measured",{"t":"bool"},false]]},"opt":false},{"name":"same","d":{"t":"arr","of":{"t":"obj","p":[["cls",{"t":"str"},false],["w",{"t":"any"},false],["covered",{"t":"any"},false],["left",{"t":"num"},false],["filledKey",{"t":"str"},false],["shape",{"t":"num"},false],["measured",{"t":"bool"},false]]}},"opt":false}],
  inner$judge$move: [{"name":"survivors","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$judge$move$$step: [{"name":"best","d":{"t":"obj","p":[["cls",{"t":"str"},false],["w",{"t":"any"},false],["covered",{"t":"any"},false],["left",{"t":"num"},false],["filledKey",{"t":"str"},false],["shape",{"t":"num"},false],["measured",{"t":"bool"},false]]},"opt":false},{"name":"same","d":{"t":"arr","of":{"t":"obj","p":[["cls",{"t":"str"},false],["w",{"t":"any"},false],["covered",{"t":"any"},false],["left",{"t":"num"},false],["filledKey",{"t":"str"},false],["shape",{"t":"num"},false],["measured",{"t":"bool"},false]]}},"opt":false}],
  inner$ledgerLine$fell: [{"name":"r","d":{"t":"any"},"opt":false}],
};
