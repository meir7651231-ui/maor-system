// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/enginebox/GoalPanel.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$GoalRouteCard$hasLinks(r) {
    const hasLinks = r.linkKeys.length > 0;
    return hasLinks;
}
export function inner$GoalPanel$typed(props) {
    const typed = props.text.trim().length > 0;
    return typed;
}

export const SIGS = {
  inner$GoalRouteCard$hasLinks: [{"name":"r","d":{"t":"obj","n":"GoalRoute","p":[["steps",{"t":"arr","of":{"t":"str"}},false],["linkKeys",{"t":"arr","of":{"t":"str"}},false],["alreadyLinked",{"t":"bool"},false],["missing",{"t":"arr","of":{"t":"obj","n":"GoalMissing","p":[["plug",{"t":"str"},false],["label",{"t":"str"},false],["kind",{"t":"lit","v":["none","off","planned"]},false],["line",{"t":"str"},false],["partNames",{"t":"arr","of":{"t":"str"}},false]]}},false]]},"opt":false}],
  inner$GoalPanel$typed: [{"name":"props","d":{"t":"obj","p":[["text",{"t":"str"},false],["result",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"GoalResult","p":[["plugs",{"t":"arr","of":{"t":"str"}},false],["matched",{"t":"arr","of":{"t":"obj","p":[["word",{"t":"str"},false],["plug",{"t":"str"},false],["label",{"t":"str"},false]]}},false],["routes",{"t":"arr","of":{"t":"obj","n":"GoalRoute","p":[["steps",{"t":"arr","of":{"t":"str"}},false],["linkKeys",{"t":"arr","of":{"t":"str"}},false],["alreadyLinked",{"t":"bool"},false],["missing",{"t":"arr","of":{"t":"obj","n":"GoalMissing","p":[["plug",{"t":"str"},false],["label",{"t":"str"},false],["kind",{"t":"lit","v":["none","off","planned"]},false],["line",{"t":"str"},false],["partNames",{"t":"arr","of":{"t":"any"}},false]]}},false]]}},false],["missing",{"t":"arr","of":{"t":"obj","n":"GoalMissing","p":[["plug",{"t":"str"},false],["label",{"t":"str"},false],["kind",{"t":"lit","v":["none","off","planned"]},false],["line",{"t":"str"},false],["partNames",{"t":"arr","of":{"t":"str"}},false]]}},false]]}]},false],["canEdit",{"t":"bool"},false],["onText",{"t":"fn"},false],["onApply",{"t":"fn"},false],["onRequestEngine",{"t":"fn"},false]]},"opt":false}],
};
