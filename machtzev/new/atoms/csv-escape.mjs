/** חוט · csv-escape — הגנת תא-CSV. חוזה: csv-escape.contract.md
 *  חולץ כלשונו מ-maor/src/lib/csvx.ts */
export function csvEscape(x) {
  let v = String(x ?? '');
  if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;
  return v.includes(',') || v.includes('"') || v.includes('\n') || v.includes('\r')
    ? '"' + v.replace(/"/g, '""') + '"'
    : v;
}
