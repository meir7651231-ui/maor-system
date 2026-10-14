// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:lib/integrations-openai-ai-react/src/audio/useVoiceStream.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function toError(error) {
    if (error instanceof Error)
        return error;
    return new Error(typeof error === "string" ? error : "Unknown error");
}
function isVoiceStreamEvent(value) {
    if (!value || typeof value !== "object")
        return false;
    const record = value;
    if (record.done === true)
        return true;
    switch (record.type) {
        case "user_transcript":
        case "transcript":
        case "audio":
            return typeof record.data === "string";
        case "error":
            return typeof record.error === "string";
        default:
            return false;
    }
}
function parseVoiceStreamEvent(raw) {
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        throw new Error("Received malformed SSE JSON payload");
    }
    if (!isVoiceStreamEvent(parsed)) {
        throw new Error("Received unexpected SSE event shape");
    }
    return parsed;
}
function readSseDataFromBlock(block) {
    const normalizedBlock = block.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const dataLines = [];
    for (const line of normalizedBlock.split("\n")) {
        if (!line.startsWith("data:")) {
            continue;
        }
        // SSE allows one optional leading space after the colon.
        dataLines.push(line.slice(5).replace(/^ /, ""));
    }
    if (dataLines.length === 0) {
        return null;
    }
    return dataLines.join("\n");
}
export function inner$readSseDataFromBlock$normalizedBlock(block) {
    const normalizedBlock = block.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    return normalizedBlock;
}
export function inner$blobToBase64$Promise$onload$commaIndex(result) {
    const commaIndex = result.indexOf(",");
    return commaIndex;
}
export function inner$useVoiceStream$useCallback$processBlocks$rawData(block) {
    const rawData = readSseDataFromBlock(block);
    return rawData;
}
export function inner$useVoiceStream$useCallback$processBlocks$event(block) {
    const rawData = readSseDataFromBlock(block);
    const event = parseVoiceStreamEvent(rawData);
    return event;
}
export function inner$useVoiceStream$useCallback$processBlocks$event$$step(rawData) {
    const event = parseVoiceStreamEvent(rawData);
    return event;
}
export function inner$useVoiceStream$useCallback$finalData(remaining) {
    const finalData = readSseDataFromBlock(remaining);
    return finalData;
}
export function inner$useVoiceStream$useCallback$event(remaining) {
    const finalData = readSseDataFromBlock(remaining);
    const event = parseVoiceStreamEvent(finalData);
    return event;
}
export function inner$useVoiceStream$useCallback$event$$step(finalData) {
    const event = parseVoiceStreamEvent(finalData);
    return event;
}
export function inner$useVoiceStream$useCallback$err(error) {
    const err = toError(error);
    return err;
}
export function inner$readSseDataFromBlock$dataLines$$after_loop(block) {
    const normalizedBlock = block.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const dataLines = [];
    for (const line of normalizedBlock.split("\n")) {
        if (!line.startsWith("data:")) {
            continue;
        }
        // SSE allows one optional leading space after the colon.
        dataLines.push(line.slice(5).replace(/^ /, ""));
    }
    return dataLines;
}

export const SIGS = {
  inner$readSseDataFromBlock$normalizedBlock: [{"name":"block","d":{"t":"str"},"opt":false}],
  inner$blobToBase64$Promise$onload$commaIndex: [{"name":"result","d":{"t":"or","of":[{"t":"null"},{"t":"str"},{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]}]},"opt":false}],
  inner$useVoiceStream$useCallback$processBlocks$rawData: [{"name":"block","d":{"t":"str"},"opt":false}],
  inner$useVoiceStream$useCallback$processBlocks$event: [{"name":"block","d":{"t":"str"},"opt":false}],
  inner$useVoiceStream$useCallback$processBlocks$event$$step: [{"name":"rawData","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$useVoiceStream$useCallback$finalData: [{"name":"remaining","d":{"t":"str"},"opt":false}],
  inner$useVoiceStream$useCallback$event: [{"name":"remaining","d":{"t":"str"},"opt":false}],
  inner$useVoiceStream$useCallback$event$$step: [{"name":"finalData","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$useVoiceStream$useCallback$err: [{"name":"error","d":{"t":"any"},"opt":false}],
  inner$readSseDataFromBlock$dataLines$$after_loop: [{"name":"block","d":{"t":"str"},"opt":false}],
};
