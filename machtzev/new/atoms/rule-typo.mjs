/** חוט · rule-typo — חוזה: rule-typo.contract.md · שקע: distance */
export const ruleTypo = (nq, nt, distance) => {
  if (nq.length < 3 || /^\d+$/.test(nq)) return null;
  const max = nt.length >= 6 ? 2 : 1;
  const d = distance(nq, nt);
  return d <= max ? 52 - d * 4 : null;
};
