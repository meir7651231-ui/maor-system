// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/supporters/SupporterForm.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$SupporterForm$save$idn(f) {
    const idn = f.idNum.trim();
    return idn;
}
export function inner$SupporterForm$save$digits(vals) {
    const digits = vals.phone.replace(/\D/g, '');
    return digits;
}

export const SIGS = {
  inner$SupporterForm$save$idn: [{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["phone",{"t":"str"},false],["email",{"t":"str"},false],["address",{"t":"str"},false],["city",{"t":"str"},false],["idNum",{"t":"str"},false],["cat",{"t":"str"},false],["forWho",{"t":"str"},false],["notes",{"t":"str"},false]]},"opt":false}],
  inner$SupporterForm$save$digits: [{"name":"vals","d":{"t":"obj","p":[["name",{"t":"str"},false],["phone",{"t":"str"},false],["email",{"t":"str"},false],["address",{"t":"str"},false],["city",{"t":"str"},false],["idNum",{"t":"str"},false],["cat",{"t":"str"},false],["forWho",{"t":"str"},false],["notes",{"t":"str"},false],["phones",{"t":"arr","of":{"t":"obj","n":"SupPhone","p":[["id",{"t":"str"},false],["num",{"t":"str"},false],["label",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["wa",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false]]},"opt":false}],
};
