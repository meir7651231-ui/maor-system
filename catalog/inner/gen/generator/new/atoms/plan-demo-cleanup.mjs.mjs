// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/plan-demo-cleanup.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$planDemoCleanup$ROOT_ENTITIES(T) {
    const FP_FIELDS = {
        families: [T.k1, T.k2, T.k3, T.k4, T.k5, T.k6, T.k7, T.k8],
        supporters: [T.k1, T.k4, T.k8, T.k9, T.k10, T.k11],
        courses: [T.k1, T.k12, T.k13, T.k14, T.k15],
        teachers: [T.k1, T.k4, T.k8, T.k9, T.k16],
        rooms: [T.k1, T.k17, T.k18],
        events: [T.k19, T.k20, T.k21, T.k22, T.k13, T.k23],
        volunteers: [T.k1, T.k4, T.k24],
        distributionDays: [T.k19, T.k25],
        tzCoordinators: [T.k1, T.k4],
        tzCampaigns: [T.k1, T.k19, T.k26],
        tzEvents: [T.k19, T.k1, T.k22],
        shopItems: [T.k1, T.k27, T.k28, T.k29],
        shopStores: [T.k1, T.k4, T.k7],
        shopCriteria: [T.k1, T.k30, T.k31],
        shopProducts: [T.k1, T.k19, T.k27],
        shopEvents: [T.k19, T.k1, T.k22],
        shopIntakes: [T.k1, T.k25],
        tasks: [T.k19, T.k25, T.k31],
        warehouse: [T.k1, T.k32, T.k25],
    };
    const ROOT_ENTITIES = Object.keys(FP_FIELDS);
    return ROOT_ENTITIES;
}
export function inner$planDemoCleanup$ROOT_ENTITIES$$step(FP_FIELDS) {
    const ROOT_ENTITIES = Object.keys(FP_FIELDS);
    return ROOT_ENTITIES;
}
export function inner$planDemoCleanup$id(r) {
    const id = String(r.id ?? '');
    return id;
}
export function inner$planDemoCleanup$mid(m) {
    const mid = String(m?.id ?? '');
    return mid;
}
export function inner$planDemoCleanup$total$$after_loop(removed) {
    let total = 0;
    for (const k of Object.keys(removed))
        total += removed[k].count;
    return total;
}

export const SIGS = {
  inner$planDemoCleanup$ROOT_ENTITIES: [{"name":"T","d":{"t":"any"},"opt":false}],
  inner$planDemoCleanup$ROOT_ENTITIES$$step: [{"name":"FP_FIELDS","d":{"t":"obj","p":[["families",{"t":"arr","of":{"t":"any"}},false],["supporters",{"t":"arr","of":{"t":"any"}},false],["courses",{"t":"arr","of":{"t":"any"}},false],["teachers",{"t":"arr","of":{"t":"any"}},false],["rooms",{"t":"arr","of":{"t":"any"}},false],["events",{"t":"arr","of":{"t":"any"}},false],["volunteers",{"t":"arr","of":{"t":"any"}},false],["distributionDays",{"t":"arr","of":{"t":"any"}},false],["tzCoordinators",{"t":"arr","of":{"t":"any"}},false],["tzCampaigns",{"t":"arr","of":{"t":"any"}},false],["tzEvents",{"t":"arr","of":{"t":"any"}},false],["shopItems",{"t":"arr","of":{"t":"any"}},false],["shopStores",{"t":"arr","of":{"t":"any"}},false],["shopCriteria",{"t":"arr","of":{"t":"any"}},false],["shopProducts",{"t":"arr","of":{"t":"any"}},false],["shopEvents",{"t":"arr","of":{"t":"any"}},false],["shopIntakes",{"t":"arr","of":{"t":"any"}},false],["tasks",{"t":"arr","of":{"t":"any"}},false],["warehouse",{"t":"arr","of":{"t":"any"}},false]]},"opt":false}],
  inner$planDemoCleanup$id: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$planDemoCleanup$mid: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$planDemoCleanup$total$$after_loop: [{"name":"removed","d":{"t":"obj","n":"removed","p":[]},"opt":false}],
};
