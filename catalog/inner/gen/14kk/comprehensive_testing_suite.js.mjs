// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:comprehensive_testing_suite.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$ComprehensiveTestingSuite$makeRequest$Promise$request$on$parsed(data) {
    const parsed = JSON.parse(data);
    return parsed;
}
export function inner$ComprehensiveTestingSuite$testFrontend$options(test) {
    const options = {
        hostname: 'localhost',
        port: 3001,
        path: test.url.replace('http://localhost:3001', ''),
        method: 'GET'
    };
    return options;
}
export function inner$ComprehensiveTestingSuite$testPerformance$test$passed(responseTime) {
    const passed = responseTime < 1000;
    return passed;
}
export function inner$ComprehensiveTestingSuite$testPerformance$test$passed_L308(results, responseTime) {
    const passed = results.every(r => r.status === 200) && responseTime < 5000;
    return passed;
}
export function inner$ComprehensiveTestingSuite$run$forEach$percentage(results) {
    const percentage = results.total > 0 ? Math.round((results.passed / results.total) * 100) : 0;
    return percentage;
}

export const SIGS = {
  inner$ComprehensiveTestingSuite$makeRequest$Promise$request$on$parsed: [{"name":"data","d":{"t":"str"},"opt":false}],
  inner$ComprehensiveTestingSuite$testFrontend$options: [{"name":"test","d":{"t":"obj","p":[["name",{"t":"str"},false],["url",{"t":"str"},false]]},"opt":false}],
  inner$ComprehensiveTestingSuite$testPerformance$test$passed: [{"name":"responseTime","d":{"t":"num"},"opt":false}],
  inner$ComprehensiveTestingSuite$testPerformance$test$passed_L308: [{"name":"results","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"responseTime","d":{"t":"num"},"opt":false}],
  inner$ComprehensiveTestingSuite$run$forEach$percentage: [{"name":"results","d":{"t":"obj","p":[["passed",{"t":"num"},false],["failed",{"t":"num"},false],["total",{"t":"num"},false]]},"opt":false}],
};
