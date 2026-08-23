/** חוט · rule-skeleton — חוזה: rule-skeleton.contract.md */
export const ruleSkeleton = (nq, nt) => {
  if (nq.length < 3 || /^\d+$/.test(nq)) return null;
  const sq = nq.replace(/[יו]/g, ''), st = nt.replace(/[יו]/g, '');
  return sq.length >= 2 && sq === st ? 58 : null;
};
