// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/settings/RoomsSection.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$RoomsSection$eqSummary$on(r) {
    const on = Object.keys(r.eq ?? {}).filter((k) => r.eq[k]);
    return on;
}
export function inner$RoomForm$save$name(f) {
    const name = f.name.trim();
    return name;
}
export function inner$RoomForm$save$fields(f) {
    const name = f.name.trim();
    const fields = {
        name,
        active: f.activeSel === 'yes',
        slot: +f.slot || 60,
        cap: +f.cap || 0,
        location: f.location.trim(),
        rate: +f.rate || 0,
        from: f.from || '08:00',
        to: f.to || '20:00',
        access: f.accessSel === 'yes',
        notes: f.notes.trim(),
        eq: f.eq,
    };
    return fields;
}
export function inner$RoomForm$save$fields$$step(f, name) {
    const fields = {
        name,
        active: f.activeSel === 'yes',
        slot: +f.slot || 60,
        cap: +f.cap || 0,
        location: f.location.trim(),
        rate: +f.rate || 0,
        from: f.from || '08:00',
        to: f.to || '20:00',
        access: f.accessSel === 'yes',
        notes: f.notes.trim(),
        eq: f.eq,
    };
    return fields;
}

export const SIGS = {
  inner$RoomsSection$eqSummary$on: [{"name":"r","d":{"t":"obj","n":"Room","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["active",{"t":"bool"},false],["slot",{"t":"num"},false],["cap",{"t":"num"},false],["location",{"t":"str"},false],["rate",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["access",{"t":"bool"},false],["notes",{"t":"str"},false],["eq",{"t":"rec","of":{"t":"bool"}},false]]},"opt":false}],
  inner$RoomForm$save$name: [{"name":"f","d":{"t":"obj","n":"RoomFormState","p":[["name",{"t":"str"},false],["activeSel",{"t":"str"},false],["slot",{"t":"str"},false],["cap",{"t":"str"},false],["location",{"t":"str"},false],["rate",{"t":"str"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["accessSel",{"t":"str"},false],["notes",{"t":"str"},false],["eq",{"t":"rec","of":{"t":"bool"}},false]]},"opt":false}],
  inner$RoomForm$save$fields: [{"name":"f","d":{"t":"obj","n":"RoomFormState","p":[["name",{"t":"str"},false],["activeSel",{"t":"str"},false],["slot",{"t":"str"},false],["cap",{"t":"str"},false],["location",{"t":"str"},false],["rate",{"t":"str"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["accessSel",{"t":"str"},false],["notes",{"t":"str"},false],["eq",{"t":"rec","of":{"t":"bool"}},false]]},"opt":false}],
  inner$RoomForm$save$fields$$step: [{"name":"f","d":{"t":"obj","n":"RoomFormState","p":[["name",{"t":"str"},false],["activeSel",{"t":"str"},false],["slot",{"t":"str"},false],["cap",{"t":"str"},false],["location",{"t":"str"},false],["rate",{"t":"str"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["accessSel",{"t":"str"},false],["notes",{"t":"str"},false],["eq",{"t":"rec","of":{"t":"bool"}},false]]},"opt":false},{"name":"name","d":{"t":"str"},"opt":false}],
};
