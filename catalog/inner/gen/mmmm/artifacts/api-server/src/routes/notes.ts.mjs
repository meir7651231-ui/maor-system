// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:artifacts/api-server/src/routes/notes.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const STYLE_KEYWORDS = ["קז'ואל", "אלגנטי", "ספורטיבי", "רומנטי", "מינימליסטי", "בוהמי", "קלאסי", "אורבני", "נשי", "גברי", "אוברסייז"];
const BRAND_KEYWORDS = ["זארה", "zara", "h&m", "מנגו", "mango", "קסטרו", "castro", "פוקס", "fox", "רנואר", "renuar", "terminal x", "adidas", "nike", "sandro", "maje", "boss"];
const COLOR_KEYWORDS = ["שחור", "לבן", "אפור", "כחול", "אדום", "ירוק", "צהוב", "ורוד", "סגול", "כתום", "בז'", "חום", "זהב", "כסף", "טורקיז", "נייבי", "בורדו"];
function extractFromText(text) {
    const lower = text.toLowerCase();
    const extractedPreferences = STYLE_KEYWORDS.filter(kw => lower.includes(kw.toLowerCase()));
    const extractedBrands = BRAND_KEYWORDS.filter(kw => lower.includes(kw.toLowerCase())).map(b => b.charAt(0).toUpperCase() + b.slice(1));
    const extractedColors = COLOR_KEYWORDS.filter(kw => lower.includes(kw.toLowerCase()));
    const summary = buildSummary(extractedPreferences, extractedBrands, extractedColors);
    return { extractedPreferences, extractedBrands, extractedColors, summary };
}
function buildSummary(prefs, brands, colors) {
    const parts = [];
    if (prefs.length > 0)
        parts.push(`סגנון: ${prefs.join(", ")}`);
    if (brands.length > 0)
        parts.push(`מותגים: ${brands.join(", ")}`);
    if (colors.length > 0)
        parts.push(`צבעים: ${colors.join(", ")}`);
    if (parts.length === 0) {
        return "לא זוהו העדפות סטייל ספציפיות בטקסט. נסה לכלול מילות מפתח כמו סגנונות, מותגים או צבעים.";
    }
    return `זוהו העדפות הבאות: ${parts.join(" | ")}`;
}
export function inner$extractFromText$lower(text) {
    const lower = text.toLowerCase();
    return lower;
}
export function inner$extractFromText$extractedPreferences(text) {
    const lower = text.toLowerCase();
    const extractedPreferences = STYLE_KEYWORDS.filter(kw => lower.includes(kw.toLowerCase()));
    return extractedPreferences;
}
export function inner$extractFromText$extractedPreferences$$step(lower) {
    const extractedPreferences = STYLE_KEYWORDS.filter(kw => lower.includes(kw.toLowerCase()));
    return extractedPreferences;
}
export function inner$extractFromText$extractedBrands(text) {
    const lower = text.toLowerCase();
    const extractedBrands = BRAND_KEYWORDS.filter(kw => lower.includes(kw.toLowerCase())).map(b => b.charAt(0).toUpperCase() + b.slice(1));
    return extractedBrands;
}
export function inner$extractFromText$extractedBrands$$step(lower) {
    const extractedBrands = BRAND_KEYWORDS.filter(kw => lower.includes(kw.toLowerCase())).map(b => b.charAt(0).toUpperCase() + b.slice(1));
    return extractedBrands;
}
export function inner$extractFromText$extractedColors(text) {
    const lower = text.toLowerCase();
    const extractedColors = COLOR_KEYWORDS.filter(kw => lower.includes(kw.toLowerCase()));
    return extractedColors;
}
export function inner$extractFromText$extractedColors$$step(lower) {
    const extractedColors = COLOR_KEYWORDS.filter(kw => lower.includes(kw.toLowerCase()));
    return extractedColors;
}
export function inner$extractFromText$summary(text) {
    const lower = text.toLowerCase();
    const extractedPreferences = STYLE_KEYWORDS.filter(kw => lower.includes(kw.toLowerCase()));
    const extractedBrands = BRAND_KEYWORDS.filter(kw => lower.includes(kw.toLowerCase())).map(b => b.charAt(0).toUpperCase() + b.slice(1));
    const extractedColors = COLOR_KEYWORDS.filter(kw => lower.includes(kw.toLowerCase()));
    const summary = buildSummary(extractedPreferences, extractedBrands, extractedColors);
    return summary;
}
export function inner$extractFromText$summary$$step(extractedPreferences, extractedBrands, extractedColors) {
    const summary = buildSummary(extractedPreferences, extractedBrands, extractedColors);
    return summary;
}
export function inner$post$extractedPreferences(text) {
    const { extractedPreferences, extractedBrands, extractedColors, summary } = extractFromText(text);
    return extractedPreferences;
}
export function inner$post$extractedBrands(text) {
    const { extractedPreferences, extractedBrands, extractedColors, summary } = extractFromText(text);
    return extractedBrands;
}
export function inner$post$extractedColors(text) {
    const { extractedPreferences, extractedBrands, extractedColors, summary } = extractFromText(text);
    return extractedColors;
}
export function inner$post$summary(text) {
    const { extractedPreferences, extractedBrands, extractedColors, summary } = extractFromText(text);
    return summary;
}
export function inner$post$mergedPrefs(text, profile) {
    const { extractedPreferences, extractedBrands, extractedColors, summary } = extractFromText(text);
    const mergedPrefs = Array.from(new Set([...profile.stylePreferences, ...extractedPreferences]));
    return mergedPrefs;
}
export function inner$post$mergedPrefs$$step(extractedPreferences, profile) {
    const mergedPrefs = Array.from(new Set([...profile.stylePreferences, ...extractedPreferences]));
    return mergedPrefs;
}
export function inner$post$mergedBrands(text, profile) {
    const { extractedPreferences, extractedBrands, extractedColors, summary } = extractFromText(text);
    const mergedBrands = Array.from(new Set([...profile.favoriteBrands, ...extractedBrands]));
    return mergedBrands;
}
export function inner$post$mergedBrands$$step(extractedBrands, profile) {
    const mergedBrands = Array.from(new Set([...profile.favoriteBrands, ...extractedBrands]));
    return mergedBrands;
}
export function inner$post$mergedColors(text, profile) {
    const { extractedPreferences, extractedBrands, extractedColors, summary } = extractFromText(text);
    const mergedColors = Array.from(new Set([...profile.colorPalette, ...extractedColors]));
    return mergedColors;
}
export function inner$post$mergedColors$$step(extractedColors, profile) {
    const mergedColors = Array.from(new Set([...profile.colorPalette, ...extractedColors]));
    return mergedColors;
}

export const SIGS = {
  inner$extractFromText$lower: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$extractFromText$extractedPreferences: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$extractFromText$extractedPreferences$$step: [{"name":"lower","d":{"t":"str"},"opt":false}],
  inner$extractFromText$extractedBrands: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$extractFromText$extractedBrands$$step: [{"name":"lower","d":{"t":"str"},"opt":false}],
  inner$extractFromText$extractedColors: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$extractFromText$extractedColors$$step: [{"name":"lower","d":{"t":"str"},"opt":false}],
  inner$extractFromText$summary: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$extractFromText$summary$$step: [{"name":"extractedPreferences","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"extractedBrands","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"extractedColors","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$post$extractedPreferences: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$post$extractedBrands: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$post$extractedColors: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$post$summary: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$post$mergedPrefs: [{"name":"text","d":{"t":"any"},"opt":false},{"name":"profile","d":{"t":"any"},"opt":false}],
  inner$post$mergedPrefs$$step: [{"name":"extractedPreferences","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"profile","d":{"t":"any"},"opt":false}],
  inner$post$mergedBrands: [{"name":"text","d":{"t":"any"},"opt":false},{"name":"profile","d":{"t":"any"},"opt":false}],
  inner$post$mergedBrands$$step: [{"name":"extractedBrands","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"profile","d":{"t":"any"},"opt":false}],
  inner$post$mergedColors: [{"name":"text","d":{"t":"any"},"opt":false},{"name":"profile","d":{"t":"any"},"opt":false}],
  inner$post$mergedColors$$step: [{"name":"extractedColors","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"profile","d":{"t":"any"},"opt":false}],
};
