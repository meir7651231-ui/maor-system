// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/parnasa/Luach.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$FlipClock$t(props) {
    const t = props.hhmm.padStart(5, '0');
    return t;
}
export function inner$NoteCard$label(n, PR_NOTICE_KIND_LABELS) {
    const label = (PR_NOTICE_KIND_LABELS[n.k] ?? 'מודעה') + ': ' + n.h;
    return label;
}

export const SIGS = {
  inner$FlipClock$t: [{"name":"props","d":{"t":"obj","p":[["hhmm",{"t":"str"},false]]},"opt":false}],
  inner$NoteCard$label: [{"name":"n","d":{"t":"obj","n":"PnNote","p":[["id",{"t":"str"},false],["k",{"t":"str"},false],["h",{"t":"str"},false],["b",{"t":"str"},false],["place",{"t":"str"},false],["time",{"t":"str"},false],["phone",{"t":"str"},false],["nm",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["org",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["rot",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["st",{"t":"lit","v":["pending","approved"]},false],["pinned",{"t":"bool"},false],["ex",{"t":"bool"},false],["post",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PrPost","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["notice","minyan","event","emergency"]},false],["title",{"t":"str"},false],["text",{"t":"str"},false],["place",{"t":"str"},false],["phone",{"t":"str"},false],["noticeKind",{"t":"str"},false],["prayers",{"t":"arr","of":{"t":"obj","n":"PrPrayerTimes","p":[["prayer",{"t":"str"},false],["times",{"t":"arr","of":{"t":"str"}},false]]}},false],["days",{"t":"arr","of":{"t":"num"}},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["until",{"t":"str"},false],["approved",{"t":"bool"},false],["pinned",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}]},true]]},"opt":false},{"name":"PR_NOTICE_KIND_LABELS","d":{"t":"rec","of":{"t":"str"}},"opt":false}],
};
