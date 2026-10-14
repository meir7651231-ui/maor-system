// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:self_reviewing_code.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$SelfReviewingCode$loadCode$lines(code) {
    const lines = code.split('\n');
    return lines;
}
export function inner$SelfReviewingCode$segmentCode$start(i) {
    const start = i + 1;
    return start;
}
export function inner$SelfReviewingCode$checkSyntax$lineNum(i) {
    const lineNum = i + 1;
    return lineNum;
}
export function inner$SelfReviewingCode$checkStandards$lineNum(i) {
    const lineNum = i + 1;
    return lineNum;
}
export function inner$SelfReviewingCode$checkSecurity$lineNum(i) {
    const lineNum = i + 1;
    return lineNum;
}
export function inner$SelfReviewingCode$checkSyntax$issues$$after_loop(lines) {
    const issues = [];
    const recommendations = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;
        // בדיקת תחביר
        if (line.includes('while (true)')) {
            issues.push({
                type: 'CRITICAL',
                line: lineNum,
                message: 'while(true) חוסם את כל המערכת',
                severity: 'HIGH'
            });
        }
        // בדיקת פונקציות לא סגורות
        if (line.includes('function') && !line.includes('{')) {
            recommendations.push({
                line: lineNum,
                message: 'הוסף סוגריים לפונקציות'
            });
        }
    }
    return issues;
}
export function inner$SelfReviewingCode$checkSyntax$recommendations$$after_loop(lines) {
    const issues = [];
    const recommendations = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;
        // בדיקת תחביר
        if (line.includes('while (true)')) {
            issues.push({
                type: 'CRITICAL',
                line: lineNum,
                message: 'while(true) חוסם את כל המערכת',
                severity: 'HIGH'
            });
        }
        // בדיקת פונקציות לא סגורות
        if (line.includes('function') && !line.includes('{')) {
            recommendations.push({
                line: lineNum,
                message: 'הוסף סוגריים לפונקציות'
            });
        }
    }
    return recommendations;
}
export function inner$SelfReviewingCode$checkLogic$issues$$after_loop(lines) {
    const issues = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('while (true)')) {
            issues.push({
                type: 'LOGIC',
                line: i + 1,
                message: 'לולאה אינסופית תגרום לקריסת מערכת',
                severity: 'HIGH'
            });
        }
    }
    return issues;
}
export function inner$SelfReviewingCode$checkStandards$recommendations$$after_loop(lines) {
    const recommendations = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;
        // בדיקת תיעוד
        if (line.includes('// TODO') || line.includes('// FIXME')) {
            recommendations.push({
                line: lineNum,
                message: 'יש לסיים את המשימות הממתינות'
            });
        }
    }
    return recommendations;
}
export function inner$SelfReviewingCode$checkPerformance$issues$$after_loop(lines) {
    const issues = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('while (true)')) {
            issues.push({
                type: 'PERFORMANCE',
                line: i + 1,
                message: 'לולאה אינסופית תצרוך 100% CPU',
                severity: 'HIGH'
            });
        }
    }
    return issues;
}
export function inner$SelfReviewingCode$checkSecurity$issues$$after_loop(lines) {
    const issues = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;
        // בדיקת חשיפת סיסמאות
        if (line.includes('password') || line.includes('secret')) {
            issues.push({
                type: 'SECURITY',
                line: lineNum,
                message: 'חשיפת סיסמאות או סודות',
                severity: 'HIGH'
            });
        }
    }
    return issues;
}

export const SIGS = {
  inner$SelfReviewingCode$loadCode$lines: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$segmentCode$start: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$SelfReviewingCode$checkSyntax$lineNum: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$SelfReviewingCode$checkStandards$lineNum: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$SelfReviewingCode$checkSecurity$lineNum: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$SelfReviewingCode$checkSyntax$issues$$after_loop: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkSyntax$recommendations$$after_loop: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkLogic$issues$$after_loop: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkStandards$recommendations$$after_loop: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkPerformance$issues$$after_loop: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkSecurity$issues$$after_loop: [{"name":"lines","d":{"t":"any"},"opt":false}],
};
