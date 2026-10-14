// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:final_supervisor_protocol.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$FinalSupervisorProtocol$calculateFileQuality$functionMatches(content) {
    const functionMatches = content.match(/function\s+\w+|const\s+\w+\s*=|class\s+\w+/g);
    return functionMatches;
}
export function inner$FinalSupervisorProtocol$calculateFileQuality$commentMatches(content) {
    const commentMatches = content.match(/\/\*[\s\S]*?\*\/|\/\/.*$/gm);
    return commentMatches;
}
export function inner$FinalSupervisorProtocol$calculateFileQuality$ifMatches(content) {
    const ifMatches = content.match(/if\s*\(/g);
    return ifMatches;
}
export function inner$FinalSupervisorProtocol$calculateFileQuality$tryMatches(content) {
    const tryMatches = content.match(/try\s*\{/g);
    return tryMatches;
}
export function inner$FinalSupervisorProtocol$calculateFileQuality$catchMatches(content) {
    const catchMatches = content.match(/catch\s*\(/g);
    return catchMatches;
}
export function inner$FinalSupervisorProtocol$calculateFileQuality$throwMatches(content) {
    const throwMatches = content.match(/throw\s+/g);
    return throwMatches;
}
export function inner$FinalSupervisorProtocol$calculateEfficiency$totalEfficiency$$after_loop(efficiencyFactors) {
    let totalEfficiency = 0;
    let totalWeight = 0;
    for (const factor of efficiencyFactors) {
        totalEfficiency += factor.value * factor.weight;
        totalWeight += factor.weight;
    }
    return totalEfficiency;
}
export function inner$FinalSupervisorProtocol$calculateEfficiency$totalWeight$$after_loop(efficiencyFactors) {
    let totalEfficiency = 0;
    let totalWeight = 0;
    for (const factor of efficiencyFactors) {
        totalEfficiency += factor.value * factor.weight;
        totalWeight += factor.weight;
    }
    return totalWeight;
}
export function inner$FinalSupervisorProtocol$calculateFinalHealthScore$totalHealth$$after_loop(healthFactors) {
    let totalHealth = 0;
    let totalWeight = 0;
    for (const factor of healthFactors) {
        totalHealth += factor.value * factor.weight;
        totalWeight += factor.weight;
    }
    return totalHealth;
}
export function inner$FinalSupervisorProtocol$calculateFinalHealthScore$totalWeight$$after_loop(healthFactors) {
    let totalHealth = 0;
    let totalWeight = 0;
    for (const factor of healthFactors) {
        totalHealth += factor.value * factor.weight;
        totalWeight += factor.weight;
    }
    return totalWeight;
}

export const SIGS = {
  inner$FinalSupervisorProtocol$calculateFileQuality$functionMatches: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$FinalSupervisorProtocol$calculateFileQuality$commentMatches: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$FinalSupervisorProtocol$calculateFileQuality$ifMatches: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$FinalSupervisorProtocol$calculateFileQuality$tryMatches: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$FinalSupervisorProtocol$calculateFileQuality$catchMatches: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$FinalSupervisorProtocol$calculateFileQuality$throwMatches: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$FinalSupervisorProtocol$calculateEfficiency$totalEfficiency$$after_loop: [{"name":"efficiencyFactors","d":{"t":"arr","of":{"t":"obj","p":[["name",{"t":"str"},false],["weight",{"t":"num"},false],["value",{"t":"num"},false]]}},"opt":false}],
  inner$FinalSupervisorProtocol$calculateEfficiency$totalWeight$$after_loop: [{"name":"efficiencyFactors","d":{"t":"arr","of":{"t":"obj","p":[["name",{"t":"str"},false],["weight",{"t":"num"},false],["value",{"t":"num"},false]]}},"opt":false}],
  inner$FinalSupervisorProtocol$calculateFinalHealthScore$totalHealth$$after_loop: [{"name":"healthFactors","d":{"t":"arr","of":{"t":"obj","p":[["name",{"t":"str"},false],["weight",{"t":"num"},false],["value",{"t":"any"},false]]}},"opt":false}],
  inner$FinalSupervisorProtocol$calculateFinalHealthScore$totalWeight$$after_loop: [{"name":"healthFactors","d":{"t":"arr","of":{"t":"obj","p":[["name",{"t":"str"},false],["weight",{"t":"num"},false],["value",{"t":"any"},false]]}},"opt":false}],
};
