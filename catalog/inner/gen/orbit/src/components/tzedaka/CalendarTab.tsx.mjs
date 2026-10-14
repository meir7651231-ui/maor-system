// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/tzedaka/CalendarTab.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$CalendarTab$activeDay(mode, anchor, dayIso) {
    const activeDay = mode === 'day' ? anchor : dayIso;
    return activeDay;
}
export function inner$CalendarTab$dayEvents(mode, anchor, dayIso, shownEvents) {
    const activeDay = mode === 'day' ? anchor : dayIso;
    const dayEvents = activeDay ? shownEvents.filter((e) => e.date === activeDay) : [];
    return dayEvents;
}
export function inner$CalendarTab$dayEvents$$step(shownEvents, activeDay) {
    const dayEvents = activeDay ? shownEvents.filter((e) => e.date === activeDay) : [];
    return dayEvents;
}

export const SIGS = {
  inner$CalendarTab$activeDay: [{"name":"mode","d":{"t":"lit","v":["week","month","day"]},"opt":false},{"name":"anchor","d":{"t":"str"},"opt":false},{"name":"dayIso","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$CalendarTab$dayEvents: [{"name":"mode","d":{"t":"lit","v":["week","month","day"]},"opt":false},{"name":"anchor","d":{"t":"str"},"opt":false},{"name":"dayIso","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false},{"name":"shownEvents","d":{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[["id",{"t":"str"},false],["title",{"t":"str"},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["kind",{"t":"lit","v":["round","reminder","custom","campaign"]},false],["coordinatorId",{"t":"str"},false],["boxId",{"t":"str"},false],["notes",{"t":"str"},false],["done",{"t":"bool"},false]]}},"opt":false}],
  inner$CalendarTab$dayEvents$$step: [{"name":"shownEvents","d":{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[["id",{"t":"str"},false],["title",{"t":"str"},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["kind",{"t":"lit","v":["round","reminder","custom","campaign"]},false],["coordinatorId",{"t":"str"},false],["boxId",{"t":"str"},false],["notes",{"t":"str"},false],["done",{"t":"bool"},false]]}},"opt":false},{"name":"activeDay","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
};
