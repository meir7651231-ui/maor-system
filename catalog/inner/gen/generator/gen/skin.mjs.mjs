// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/skin.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const px = (n) => `${Math.round(n * 100) / 100}px`;
const vars = (o) => Object.entries(o).map(([k, v]) => `${k}:${v}`).join(';');
export function inner$loadSkin$paper(pl, S) {
    const snap = S.skinSnapshot || {};
    const paper = pl ? { ...pl.neutral, ...pl.semantic, ...(pl.skins?.[S.pick.skin] || {}) } : snap.paper;
    return paper;
}
export function inner$loadSkin$paper$$step(pl, S, snap) {
    const paper = pl ? { ...pl.neutral, ...pl.semantic, ...(pl.skins?.[S.pick.skin] || {}) } : snap.paper;
    return paper;
}
export function inner$loadSkin$dark(pl, S) {
    const snap = S.skinSnapshot || {};
    const dark = pl ? { ...pl.neutral, ...pl.semantic } : snap.dark;
    return dark;
}
export function inner$loadSkin$dark$$step(pl, snap) {
    const dark = pl ? { ...pl.neutral, ...pl.semantic } : snap.dark;
    return dark;
}
export function inner$loadSkin$theme(pl, S) {
    const snap = S.skinSnapshot || {};
    const theme = pl ? pl.themes?.[S.pick.theme] : snap.theme;
    return theme;
}
export function inner$loadSkin$theme$$step(pl, S, snap) {
    const theme = pl ? pl.themes?.[S.pick.theme] : snap.theme;
    return theme;
}
export function inner$tokensCss$space(S, g) {
    const space = S.spaceMul.map((m, i) => `--s${i + 1}:${px(g * m)}`).join(';');
    return space;
}
export function inner$tokensCss$radii(S, r0) {
    const radii = Object.entries(S.radiusMul).map(([k, m]) => `--r-${k}:${px(r0 * m)}`).join(';') + ';--r-pill:999px';
    return radii;
}
export function inner$tokensCss$type(T) {
    const type = Object.entries(T).filter(([k]) => !k.startsWith('_')).map(([k, v]) => `--t-${k}:${px(v.px)};--lh-${k}:${v.lh};--w-${k}:${v.w}`).join(';');
    return type;
}
export function inner$tokensCss$rows(g, D) {
    const rows = Object.entries(D.unitMul).map(([k, m]) => `--row-${k}:${px(g * m)}`).join(';');
    return rows;
}
export function inner$tokensCss$pads(g, D) {
    const pads = Object.entries(D.cellPadMul).map(([k, m]) => `--pad-${k}:${px(g * m)}`).join(';') + ';' + Object.entries(D.cellPadBlockMul).map(([k, m]) => `--padb-${k}:${px(g * m)}`).join(';');
    return pads;
}
export function inner$tokensCss$motion(seed) {
    const motion = Object.entries(seed.motion || {}).map(([k, v]) => `--m-${k}:${v}ms`).join(';');
    return motion;
}
export function inner$tokensCss$alias() {
    const alias = vars({
        '--bg': 'var(--canvas)', '--card': 'var(--surface)', '--raise': 'var(--raised)', '--code': 'var(--raised2)',
        '--mute': 'var(--mut)', '--line': 'var(--hair)', '--acc': 'var(--a)', '--acc-hi': 'var(--a-hi)', '--acc-ink': 'var(--on-a)', '--none': 'var(--err)',
    });
    return alias;
}
export function inner$tokensCss$density(D) {
    const density = `--row-h:var(--row-${D.default});--cell-pad:var(--pad-${D.default});--cell-pad-block:var(--padb-${D.default})`;
    return density;
}
export function inner$tokensCss$scales(S, seed, g, r0, T, D) {
    const space = S.spaceMul.map((m, i) => `--s${i + 1}:${px(g * m)}`).join(';');
    const radii = Object.entries(S.radiusMul).map(([k, m]) => `--r-${k}:${px(r0 * m)}`).join(';') + ';--r-pill:999px';
    const type = Object.entries(T).filter(([k]) => !k.startsWith('_')).map(([k, v]) => `--t-${k}:${px(v.px)};--lh-${k}:${v.lh};--w-${k}:${v.w}`).join(';');
    const rows = Object.entries(D.unitMul).map(([k, m]) => `--row-${k}:${px(g * m)}`).join(';');
    const pads = Object.entries(D.cellPadMul).map(([k, m]) => `--pad-${k}:${px(g * m)}`).join(';') + ';' + Object.entries(D.cellPadBlockMul).map(([k, m]) => `--padb-${k}:${px(g * m)}`).join(';');
    const motion = Object.entries(seed.motion || {}).map(([k, v]) => `--m-${k}:${v}ms`).join(';');
    const density = `--row-h:var(--row-${D.default});--cell-pad:var(--pad-${D.default});--cell-pad-block:var(--padb-${D.default})`;
    const scales = [space, radii, type, rows, pads, motion, density,
        `--measure:${px(S.measure.content)}`, `--measure-report:${px(S.measure.report)}`,
        `--focus-w:${px(g * S.focus.widthMul)}`, `--focus-off:${px(S.focus.offsetPx)}`,
        `--font-he:${S.fontStack.he}`, `--font-mono:${S.fontStack.mono}`].join(';');
    return scales;
}
export function inner$tokensCss$scales$$step(S, g, space, radii, type, rows, pads, motion, density) {
    const scales = [space, radii, type, rows, pads, motion, density,
        `--measure:${px(S.measure.content)}`, `--measure-report:${px(S.measure.report)}`,
        `--focus-w:${px(g * S.focus.widthMul)}`, `--focus-off:${px(S.focus.offsetPx)}`,
        `--font-he:${S.fontStack.he}`, `--font-mono:${S.fontStack.mono}`].join(';');
    return scales;
}
export function inner$tokensCss$dk(dark, theme) {
    const dk = vars(dark) + ';' + vars(theme);
    return dk;
}

export const SIGS = {
  inner$loadSkin$paper: [{"name":"pl","d":{"t":"any"},"opt":false},{"name":"S","d":{"t":"any"},"opt":false}],
  inner$loadSkin$paper$$step: [{"name":"pl","d":{"t":"any"},"opt":false},{"name":"S","d":{"t":"any"},"opt":false},{"name":"snap","d":{"t":"any"},"opt":false}],
  inner$loadSkin$dark: [{"name":"pl","d":{"t":"any"},"opt":false},{"name":"S","d":{"t":"any"},"opt":false}],
  inner$loadSkin$dark$$step: [{"name":"pl","d":{"t":"any"},"opt":false},{"name":"snap","d":{"t":"any"},"opt":false}],
  inner$loadSkin$theme: [{"name":"pl","d":{"t":"any"},"opt":false},{"name":"S","d":{"t":"any"},"opt":false}],
  inner$loadSkin$theme$$step: [{"name":"pl","d":{"t":"any"},"opt":false},{"name":"S","d":{"t":"any"},"opt":false},{"name":"snap","d":{"t":"any"},"opt":false}],
  inner$tokensCss$space: [{"name":"S","d":{"t":"any"},"opt":false},{"name":"g","d":{"t":"num"},"opt":false}],
  inner$tokensCss$radii: [{"name":"S","d":{"t":"any"},"opt":false},{"name":"r0","d":{"t":"num"},"opt":false}],
  inner$tokensCss$type: [{"name":"T","d":{"t":"any"},"opt":false}],
  inner$tokensCss$rows: [{"name":"g","d":{"t":"num"},"opt":false},{"name":"D","d":{"t":"any"},"opt":false}],
  inner$tokensCss$pads: [{"name":"g","d":{"t":"num"},"opt":false},{"name":"D","d":{"t":"any"},"opt":false}],
  inner$tokensCss$motion: [{"name":"seed","d":{"t":"any"},"opt":false}],
  inner$tokensCss$alias: [],
  inner$tokensCss$density: [{"name":"D","d":{"t":"any"},"opt":false}],
  inner$tokensCss$scales: [{"name":"S","d":{"t":"any"},"opt":false},{"name":"seed","d":{"t":"any"},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"r0","d":{"t":"num"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"D","d":{"t":"any"},"opt":false}],
  inner$tokensCss$scales$$step: [{"name":"S","d":{"t":"any"},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"space","d":{"t":"any"},"opt":false},{"name":"radii","d":{"t":"str"},"opt":false},{"name":"type","d":{"t":"str"},"opt":false},{"name":"rows","d":{"t":"str"},"opt":false},{"name":"pads","d":{"t":"str"},"opt":false},{"name":"motion","d":{"t":"str"},"opt":false},{"name":"density","d":{"t":"str"},"opt":false}],
  inner$tokensCss$dk: [{"name":"dark","d":{"t":"any"},"opt":false},{"name":"theme","d":{"t":"any"},"opt":false}],
};
