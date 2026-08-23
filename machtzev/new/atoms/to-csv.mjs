/** חוט · to-csv — שורות⇒CSV+BOM. חוזה: to-csv.contract.md · שקע: escape */
export function toCsv(rows, escape) {
  return '﻿' + rows.map((r) => r.map(escape).join(',')).join('\n');
}
