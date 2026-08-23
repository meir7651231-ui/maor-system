/** חוט · rule-plural — חוזה: rule-plural.contract.md */
export const rulePlural = (nq, nt) => {
  if (nq.length >= 5 && (nq.endsWith('ימ') || nq.endsWith('ות'))) {
    const stem = nq.slice(0, -2);
    if (nt === stem || nt.startsWith(stem)) return 70;
  }
  return null;
};
