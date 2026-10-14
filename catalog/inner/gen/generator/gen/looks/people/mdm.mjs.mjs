// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/people/mdm.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$GATE$wall(txt) {
    const wall = ['request a demo', 'book a demo', 'get a demo', 'contact sales', 'talk to sales', 'schedule a demo']
        .filter(w => txt.includes(w));
    return wall;
}
export function inner$GATE$freeTrial(txt) {
    const freeTrial = ['start free', 'try free', 'sign up free', 'free trial'].filter(w => txt.includes(w));
    return freeTrial;
}

export const SIGS = {
  inner$GATE$wall: [{"name":"txt","d":{"t":"str"},"opt":false}],
  inner$GATE$freeTrial: [{"name":"txt","d":{"t":"str"},"opt":false}],
};
