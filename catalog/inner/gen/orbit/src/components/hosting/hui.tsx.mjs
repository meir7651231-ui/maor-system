// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/hosting/hui.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$HModal$useEffect$onKey$b(items) {
    const b = items[items.length - 1];
    return b;
}
export function inner$HModal$label(props) {
    const label = props.label ?? (typeof props.title === 'string' ? props.title : undefined);
    return label;
}
export function inner$FSelect$map$val(o) {
    const [val, lab] = typeof o === 'string' ? [o, o] : o;
    return val;
}
export function inner$FSelect$map$lab(o) {
    const [val, lab] = typeof o === 'string' ? [o, o] : o;
    return lab;
}
export function inner$CountUp$useEffect$step$p(t0, now) {
    const p = Math.min(1, (now - t0) / 900);
    return p;
}

export const SIGS = {
  inner$HModal$useEffect$onKey$b: [{"name":"items","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$HModal$label: [{"name":"props","d":{"t":"obj","p":[["title",{"t":"any"},false],["label",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["children",{"t":"any"},false],["footer",{"t":"any"},true],["onClose",{"t":"fn"},false],["maxWidth",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["wide",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["z",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["noHead",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["bodyStyle",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"CSSProperties","p":[]}]},true]]},"opt":false}],
  inner$FSelect$map$val: [{"name":"o","d":{"t":"or","of":[{"t":"str"},{"t":"tup","of":[{"t":"str"},{"t":"str"}]}]},"opt":false}],
  inner$FSelect$map$lab: [{"name":"o","d":{"t":"or","of":[{"t":"str"},{"t":"tup","of":[{"t":"str"},{"t":"str"}]}]},"opt":false}],
  inner$CountUp$useEffect$step$p: [{"name":"t0","d":{"t":"num"},"opt":false},{"name":"now","d":{"t":"num"},"opt":false}],
};
