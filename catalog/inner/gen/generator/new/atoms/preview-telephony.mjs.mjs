// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/preview-telephony.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$previewTelephony$voiceDid(tc, T) {
    const voiceDid = (tc.numbers.find((n) => n.kind === T.k1 || n.kind === T.k2) || tc.numbers[0])?.e164 || '';
    return voiceDid;
}

export const SIGS = {
  inner$previewTelephony$voiceDid: [{"name":"tc","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
