// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:box-drafts/buildsmart-seed/start-voice-recognition@app_src_lib_voice_ts.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$startVoiceRecognition$onresult$text$$after_loop(e) {
    let text = '';
    let isFinal = false;
    for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        text += r[0].transcript;
        if (r.isFinal)
            isFinal = true;
    }
    return text;
}
export function inner$startVoiceRecognition$onresult$isFinal$$after_loop(e) {
    let text = '';
    let isFinal = false;
    for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        text += r[0].transcript;
        if (r.isFinal)
            isFinal = true;
    }
    return isFinal;
}

export const SIGS = {
  inner$startVoiceRecognition$onresult$text$$after_loop: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$startVoiceRecognition$onresult$isFinal$$after_loop: [{"name":"e","d":{"t":"any"},"opt":false}],
};
