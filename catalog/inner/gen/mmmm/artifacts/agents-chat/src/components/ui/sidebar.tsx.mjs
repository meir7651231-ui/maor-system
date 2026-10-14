// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:artifacts/agents-chat/src/components/ui/sidebar.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$SidebarProvider$state(openProp, _open) {
    const open = openProp ?? _open;
    const state = open ? "expanded" : "collapsed";
    return state;
}
export function inner$SidebarProvider$state$$step(open) {
    const state = open ? "expanded" : "collapsed";
    return state;
}
export function inner$SidebarGroupLabel$Comp(asChild, Slot) {
    const Comp = asChild ? Slot : "div";
    return Comp;
}
export function inner$SidebarGroupAction$Comp(asChild, Slot) {
    const Comp = asChild ? Slot : "button";
    return Comp;
}
export function inner$SidebarMenuButton$Comp(asChild, Slot) {
    const Comp = asChild ? Slot : "button";
    return Comp;
}
export function inner$SidebarMenuAction$Comp(asChild, Slot) {
    const Comp = asChild ? Slot : "button";
    return Comp;
}
export function inner$SidebarMenuSubButton$Comp(asChild, Slot) {
    const Comp = asChild ? Slot : "a";
    return Comp;
}

export const SIGS = {
  inner$SidebarProvider$state: [{"name":"openProp","d":{"t":"any"},"opt":false},{"name":"_open","d":{"t":"any"},"opt":false}],
  inner$SidebarProvider$state$$step: [{"name":"open","d":{"t":"any"},"opt":false}],
  inner$SidebarGroupLabel$Comp: [{"name":"asChild","d":{"t":"any"},"opt":false},{"name":"Slot","d":{"t":"any"},"opt":false}],
  inner$SidebarGroupAction$Comp: [{"name":"asChild","d":{"t":"any"},"opt":false},{"name":"Slot","d":{"t":"any"},"opt":false}],
  inner$SidebarMenuButton$Comp: [{"name":"asChild","d":{"t":"any"},"opt":false},{"name":"Slot","d":{"t":"any"},"opt":false}],
  inner$SidebarMenuAction$Comp: [{"name":"asChild","d":{"t":"any"},"opt":false},{"name":"Slot","d":{"t":"any"},"opt":false}],
  inner$SidebarMenuSubButton$Comp: [{"name":"asChild","d":{"t":"any"},"opt":false},{"name":"Slot","d":{"t":"any"},"opt":false}],
};
