// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:strategic_protocol.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$StrategicAnalyzer$assessMarketSize$totalMarket() {
    const markets = {
        'AI Automation': '$50B globally',
        'Developer Tools': '$20B globally',
        'Communication Platforms': '$15B globally',
        'Style/Design Tech': '$5B globally'
    };
    const totalMarket = Object.values(markets).reduce((sum, size) => {
        return sum + parseInt(size.replace(/\D/g, '')) * 1000000;
    }, 0);
    return totalMarket;
}
export function inner$StrategicAnalyzer$assessMarketSize$totalMarket$$step(markets) {
    const totalMarket = Object.values(markets).reduce((sum, size) => {
        return sum + parseInt(size.replace(/\D/g, '')) * 1000000;
    }, 0);
    return totalMarket;
}

export const SIGS = {
  inner$StrategicAnalyzer$assessMarketSize$totalMarket: [],
  inner$StrategicAnalyzer$assessMarketSize$totalMarket$$step: [{"name":"markets","d":{"t":"obj","p":[["AI Automation",{"t":"str"},false],["Developer Tools",{"t":"str"},false],["Communication Platforms",{"t":"str"},false],["Style/Design Tech",{"t":"str"},false]]},"opt":false}],
};
