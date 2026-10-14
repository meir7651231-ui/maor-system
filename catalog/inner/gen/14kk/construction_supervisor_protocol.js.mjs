// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:construction_supervisor_protocol.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$ConstructionSupervisor$checkTaskCompletion$completed(todoList) {
    const completed = todoList.filter(task => task.status === 'completed').length;
    return completed;
}
export function inner$ConstructionSupervisor$checkTestResults$failedTests(passedTests) {
    const totalTests = 100;
    const failedTests = totalTests - passedTests;
    return failedTests;
}
export function inner$ConstructionSupervisor$calculateDeveloperProductivity$productivity(tasksCompleted, developers, daysElapsed) {
    const productivity = (tasksCompleted / (developers * daysElapsed)) * 100;
    return productivity;
}
export function inner$ConstructionSupervisor$logStep$logEntry(message, timestamp) {
    const logEntry = `[${timestamp}] ${message}`;
    return logEntry;
}
export function inner$ConstructionSupervisor$displayReport$forEach$status(completed) {
    const status = completed ? '✅' : '⏳';
    return status;
}

export const SIGS = {
  inner$ConstructionSupervisor$checkTaskCompletion$completed: [{"name":"todoList","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"num"},false],["status",{"t":"str"},false],["task",{"t":"str"},false]]}},"opt":false}],
  inner$ConstructionSupervisor$checkTestResults$failedTests: [{"name":"passedTests","d":{"t":"num"},"opt":false}],
  inner$ConstructionSupervisor$calculateDeveloperProductivity$productivity: [{"name":"tasksCompleted","d":{"t":"num"},"opt":false},{"name":"developers","d":{"t":"num"},"opt":false},{"name":"daysElapsed","d":{"t":"num"},"opt":false}],
  inner$ConstructionSupervisor$logStep$logEntry: [{"name":"message","d":{"t":"any"},"opt":false},{"name":"timestamp","d":{"t":"str"},"opt":false}],
  inner$ConstructionSupervisor$displayReport$forEach$status: [{"name":"completed","d":{"t":"any"},"opt":false}],
};
