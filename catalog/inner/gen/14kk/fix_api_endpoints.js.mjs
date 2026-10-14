// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:fix_api_endpoints.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$APIEndpointFixer$fixPostEndpoints$parseBodyInsert() {
    const parseBodyFunction = `
    // Parse request body
    async parseBody(req) {
      return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            resolve(body ? JSON.parse(body) : null);
          } catch (error) {
            reject(error);
          }
        });
        req.on('error', reject);
      });
    }
  `;
    const parseBodyInsert = parseBodyFunction + '\n\n' + '  // אתחול נתונים לדוגמה';
    return parseBodyInsert;
}

export const SIGS = {
  inner$APIEndpointFixer$fixPostEndpoints$parseBodyInsert: [],
};
