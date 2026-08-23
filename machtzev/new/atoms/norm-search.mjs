/** חוט · norm-search — נרמול-חיפוש עברי. חוזה: norm-search.contract.md
 *  חולץ כלשונו מ-maor/src/lib/validate.ts */
export function normSearch(t) {
  return String(t || '')
    .toLowerCase()
    .replace(/[֑-ׇ]/g, '')
    .replace(/[ךםןףץ]/g, (ch) => ({ ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' })[ch])
    .replace(/['"׳״\-–._]/g, '')
    .trim();
}
