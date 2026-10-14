// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/boxes/caller-id.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$screenPop$famId(caller, CALLER_ID_TERMS) {
    const famId = caller.kind === CALLER_ID_TERMS.k1 ? caller.id : caller.kind === CALLER_ID_TERMS.k2 ? caller.famId : null;
    return famId;
}

export const SIGS = {
  inner$screenPop$famId: [{"name":"caller","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["kind",{"t":"any"},false],["name",{"t":"any"},false],["phone",{"t":"any"},false],["id",{"t":"any"},false],["view",{"t":"any"},false],["famId",{"t":"any"},false]]},{"t":"obj","p":[["kind",{"t":"any"},false],["name",{"t":"any"},false],["phone",{"t":"any"},false],["id",{"t":"any"},false],["view",{"t":"any"},false],["famId",{"t":"undef"},true]]}]},"opt":false},{"name":"CALLER_ID_TERMS","d":{"t":"obj","p":[["k1",{"t":"str"},false],["k2",{"t":"str"},false]]},"opt":false}],
};
