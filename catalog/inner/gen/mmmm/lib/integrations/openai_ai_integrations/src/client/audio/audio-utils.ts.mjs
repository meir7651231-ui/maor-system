// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:lib/integrations/openai_ai_integrations/src/client/audio/audio-utils.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$decodePCM16ToFloat32$bytes$$after_loop(raw) {
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
        bytes[i] = raw.charCodeAt(i);
    }
    return bytes;
}
export function inner$decodePCM16ToFloat32$float32$$after_loop(raw) {
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
        bytes[i] = raw.charCodeAt(i);
    }
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768;
    }
    return float32;
}

export const SIGS = {
  inner$decodePCM16ToFloat32$bytes$$after_loop: [{"name":"raw","d":{"t":"str"},"opt":false}],
  inner$decodePCM16ToFloat32$float32$$after_loop: [{"name":"raw","d":{"t":"str"},"opt":false}],
};
