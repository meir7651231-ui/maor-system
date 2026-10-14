// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/chisel-all.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const TIME = /(?<![\w.])(86_?400_?000|3_?600_?000|604_?800_?000|60_?000|1000)(?![\w.])/;
const isMechLine = (ln) => TIME.test(ln) || // יחידות-זמן
    /parseInt\([^,]+,\s*\d+\s*\)/.test(ln) || // בסיס-מספר
    /\bnew Array(?:<[^>]*>)?\(\s*\d+\s*\)|\bArray\(\s*\d+\s*\)/.test(ln) || // הקצאת-מערך בגודל-קבוע (אינדוקס)
    /\b(?:365|366|7|52)\b/.test(ln) && /day|days|year|week|יום|ימים|שנה|שבוע/i.test(ln) || // ימי-שנה/שבוע (בהקשר-זמן)
    /\.(slice|substr|substring|charAt|padStart|padEnd|repeat|codePointAt)\(/.test(ln) || // אינדקס/אורך-מחרוזת
    /new Date\(|\.set(Date|Hours|Minutes|Month|FullYear)\(/.test(ln) || // רכיבי-תאריך
    /[*/]\s*12\b|\b12\s*[*+]|month/i.test(ln) || // חודשי-שנה
    />=?\s*1\s*&&[^&]*<=?\s*(?:12|31|7)\b|<=?\s*(?:12|31|7)\s*&&[^&]*>=?\s*1\b/.test(ln) || // שער-טווח-לוח (חודש/יום-בחודש/יום-בשבוע)
    /for\s*\([^;]*;[^;]*<=?\s*(?:12|31|7)\s*;[^)]*\+\+/.test(ln) || // לולאת-לוח (חודשים/ימים)
    /(?<![\w.])9{4,}(?![\w.])|Number\.(MAX_SAFE_INTEGER|MAX_VALUE)|Infinity/.test(ln) || // סנטינל-אינסוף (תקרת-מונה)
    /%\s*(?:24|12|7|60|360|100|1000)\b/.test(ln) || // מודולו בסיס-לוח/מתמטי (שעות/חודשים/ימים/מעלות)
    /[+\-]=?\s*24\b|\b24\s*[+\-]/.test(ln) || // חשבון-שעות (עטיפת-יממה)
    /[*/]\s*100\b|\b100\s*[*/]|\)\s*\*\s*100|Math\.round\([^)]*100/.test(ln);
const isProtoLine = (ln) => (/console\.(?:warn|log|error|info|debug)/.test(ln) && /%c|color:|font-(?:weight|size):/.test(ln)) || // עיצוב-קונסולה
    /\.endsWith\(\s*['"]\.[a-z]/i.test(ln);
export function inner$fn$i(process) {
    const i = process.argv.indexOf('--limit');
    return i;
}
export function inner$autoPurify$prev(out) {
    const prev = out[out.length - 1] || '';
    return prev;
}
export function inner$autoPurify$out$$after_loop(lines) {
    const out = [];
    for (const ln of lines) {
        const prev = out[out.length - 1] || '';
        if (isMechLine(ln) && !/קבוע-מתמטי/.test(prev)) {
            out.push((ln.match(/^\s*/) || [''])[0] + '// קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)');
        }
        else if (isProtoLine(ln) && !/פרוטוקול-חיצוני/.test(prev)) {
            out.push((ln.match(/^\s*/) || [''])[0] + '// פרוטוקול-חיצוני: עיצוב-קונסולה/סיומת-מארח (חוק-6)');
        }
        out.push(ln);
    }
    return out;
}

export const SIGS = {
  inner$fn$i: [{"name":"process","d":{"t":"obj","n":"process","p":[["env",{"t":"obj","n":"env","p":[["YESHIVA_LEDGER",{"t":"any"},false],["YESHIVA_LEDGER_CAP",{"t":"str"},false],["GEN_OUT",{"t":"any"},false],["GEN_DATA_OUT",{"t":"any"},false]]},false],["exitCode",{"t":"num"},false]]},"opt":false}],
  inner$autoPurify$prev: [{"name":"out","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$autoPurify$out$$after_loop: [{"name":"lines","d":{"t":"any"},"opt":false}],
};
