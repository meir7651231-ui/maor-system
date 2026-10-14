// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:artifacts/mockup-sandbox/src/components/ui/chart.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function getPayloadConfigFromPayload(config, payload, key) {
    if (typeof payload !== "object" || payload === null) {
        return undefined;
    }
    const payloadPayload = "payload" in payload &&
        typeof payload.payload === "object" &&
        payload.payload !== null
        ? payload.payload
        : undefined;
    let configLabelKey = key;
    if (key in payload &&
        typeof payload[key] === "string") {
        configLabelKey = payload[key];
    }
    else if (payloadPayload &&
        key in payloadPayload &&
        typeof payloadPayload[key] === "string") {
        configLabelKey = payloadPayload[key];
    }
    return configLabelKey in config
        ? config[configLabelKey]
        : config[key];
}
export function inner$forwardRef$chartId(id, uniqueId) {
    const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;
    return chartId;
}
export function inner$ChartStyle$colorConfig(config) {
    const colorConfig = Object.entries(config).filter(([, config]) => config.theme || config.color);
    return colorConfig;
}
export function inner$forwardRef$useMemo$key(labelKey, item) {
    const key = `${labelKey || item?.dataKey || item?.name || "value"}`;
    return key;
}
export function inner$forwardRef$useMemo$itemConfig(labelKey, config, item) {
    const key = `${labelKey || item?.dataKey || item?.name || "value"}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    return itemConfig;
}
export function inner$forwardRef$useMemo$itemConfig$$step(config, item, key) {
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    return itemConfig;
}
export function inner$forwardRef$useMemo$value(label, labelKey, config, item) {
    const key = `${labelKey || item?.dataKey || item?.name || "value"}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    const value = !labelKey && typeof label === "string"
        ? config[label]?.label || label
        : itemConfig?.label;
    return value;
}
export function inner$forwardRef$useMemo$value$$step(label, labelKey, config, itemConfig) {
    const value = !labelKey && typeof label === "string"
        ? config[label]?.label || label
        : itemConfig?.label;
    return value;
}
export function inner$forwardRef$nestLabel(payload, indicator) {
    const nestLabel = payload.length === 1 && indicator !== "dot";
    return nestLabel;
}
export function inner$forwardRef$map$key(nameKey, item) {
    const key = `${nameKey || item.name || item.dataKey || "value"}`;
    return key;
}
export function inner$forwardRef$map$itemConfig(nameKey, config, item) {
    const key = `${nameKey || item.name || item.dataKey || "value"}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    return itemConfig;
}
export function inner$forwardRef$map$itemConfig$$step(config, item, key) {
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    return itemConfig;
}
export function inner$forwardRef$map$key_L290(nameKey, item) {
    const key = `${nameKey || item.dataKey || "value"}`;
    return key;
}
export function inner$forwardRef$map$itemConfig_L291(nameKey, config, item) {
    const key = `${nameKey || item.dataKey || "value"}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    return itemConfig;
}
export function inner$forwardRef$map$itemConfig_L291$$step(config, item, key) {
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    return itemConfig;
}
export function inner$getPayloadConfigFromPayload$payloadPayload(payload) {
    const payloadPayload = "payload" in payload &&
        typeof payload.payload === "object" &&
        payload.payload !== null
        ? payload.payload
        : undefined;
    return payloadPayload;
}

export const SIGS = {
  inner$forwardRef$chartId: [{"name":"id","d":{"t":"any"},"opt":false},{"name":"uniqueId","d":{"t":"any"},"opt":false}],
  inner$ChartStyle$colorConfig: [{"name":"config","d":{"t":"rec","of":{"t":"or","of":[{"t":"obj","p":[["label",{"t":"any"},true],["icon",{"t":"any"},true],["color",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"undef"},true]]},{"t":"obj","p":[["label",{"t":"any"},true],["icon",{"t":"any"},true],["color",{"t":"undef"},true],["theme",{"t":"obj","n":"Record","p":[["light",{"t":"any"},false],["dark",{"t":"any"},false]]},false]]}]}},"opt":false}],
  inner$forwardRef$useMemo$key: [{"name":"labelKey","d":{"t":"any"},"opt":false},{"name":"item","d":{"t":"any"},"opt":false}],
  inner$forwardRef$useMemo$itemConfig: [{"name":"labelKey","d":{"t":"any"},"opt":false},{"name":"config","d":{"t":"any"},"opt":false},{"name":"item","d":{"t":"any"},"opt":false}],
  inner$forwardRef$useMemo$itemConfig$$step: [{"name":"config","d":{"t":"any"},"opt":false},{"name":"item","d":{"t":"any"},"opt":false},{"name":"key","d":{"t":"str"},"opt":false}],
  inner$forwardRef$useMemo$value: [{"name":"label","d":{"t":"any"},"opt":false},{"name":"labelKey","d":{"t":"any"},"opt":false},{"name":"config","d":{"t":"any"},"opt":false},{"name":"item","d":{"t":"any"},"opt":false}],
  inner$forwardRef$useMemo$value$$step: [{"name":"label","d":{"t":"any"},"opt":false},{"name":"labelKey","d":{"t":"any"},"opt":false},{"name":"config","d":{"t":"any"},"opt":false},{"name":"itemConfig","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["label",{"t":"any"},true],["icon",{"t":"any"},true],["color",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"undef"},true]]},{"t":"obj","p":[["label",{"t":"any"},true],["icon",{"t":"any"},true],["color",{"t":"undef"},true],["theme",{"t":"obj","n":"Record","p":[["light",{"t":"any"},false],["dark",{"t":"any"},false]]},false]]}]},"opt":false}],
  inner$forwardRef$nestLabel: [{"name":"payload","d":{"t":"any"},"opt":false},{"name":"indicator","d":{"t":"str"},"opt":false}],
  inner$forwardRef$map$key: [{"name":"nameKey","d":{"t":"any"},"opt":false},{"name":"item","d":{"t":"any"},"opt":false}],
  inner$forwardRef$map$itemConfig: [{"name":"nameKey","d":{"t":"any"},"opt":false},{"name":"config","d":{"t":"any"},"opt":false},{"name":"item","d":{"t":"any"},"opt":false}],
  inner$forwardRef$map$itemConfig$$step: [{"name":"config","d":{"t":"any"},"opt":false},{"name":"item","d":{"t":"any"},"opt":false},{"name":"key","d":{"t":"str"},"opt":false}],
  inner$forwardRef$map$key_L290: [{"name":"nameKey","d":{"t":"any"},"opt":false},{"name":"item","d":{"t":"any"},"opt":false}],
  inner$forwardRef$map$itemConfig_L291: [{"name":"nameKey","d":{"t":"any"},"opt":false},{"name":"config","d":{"t":"any"},"opt":false},{"name":"item","d":{"t":"any"},"opt":false}],
  inner$forwardRef$map$itemConfig_L291$$step: [{"name":"config","d":{"t":"any"},"opt":false},{"name":"item","d":{"t":"any"},"opt":false},{"name":"key","d":{"t":"str"},"opt":false}],
  inner$getPayloadConfigFromPayload$payloadPayload: [{"name":"payload","d":{"t":"any"},"opt":false}],
};
