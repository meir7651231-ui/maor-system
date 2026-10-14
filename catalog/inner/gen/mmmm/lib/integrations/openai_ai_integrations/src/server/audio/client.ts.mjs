// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:lib/integrations/openai_ai_integrations/src/server/audio/client.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function detectAudioFormat(buffer) {
    if (buffer.length < 12)
        return "unknown";
    // WAV: RIFF....WAVE
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
        return "wav";
    }
    // WebM: EBML header
    if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
        return "webm";
    }
    // MP3: ID3 tag or frame sync
    if ((buffer[0] === 0xff && (buffer[1] === 0xfb || buffer[1] === 0xfa || buffer[1] === 0xf3)) ||
        (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33)) {
        return "mp3";
    }
    // MP4/M4A/MOV: ....ftyp (Safari/iOS records in these containers)
    if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
        return "mp4";
    }
    // OGG: OggS
    if (buffer[0] === 0x4f && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) {
        return "ogg";
    }
    return "unknown";
}
export function inner$ensureCompatibleFormat$detected(audioBuffer) {
    const detected = detectAudioFormat(audioBuffer);
    return detected;
}
export function inner$voiceChat$audioBase64(audioBuffer) {
    const audioBase64 = audioBuffer.toString("base64");
    return audioBase64;
}
export function inner$voiceChatStream$audioBase64(audioBuffer) {
    const audioBase64 = audioBuffer.toString("base64");
    return audioBase64;
}

export const SIGS = {
  inner$ensureCompatibleFormat$detected: [{"name":"audioBuffer","d":{"t":"any"},"opt":false}],
  inner$voiceChat$audioBase64: [{"name":"audioBuffer","d":{"t":"any"},"opt":false}],
  inner$voiceChatStream$audioBase64: [{"name":"audioBuffer","d":{"t":"any"},"opt":false}],
};
