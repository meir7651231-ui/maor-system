/** חוט · rule-contains — חוזה: rule-contains.contract.md */
export const ruleContains = (nq, nt) => (nq.length >= 2 && nt.includes(nq) ? 62 : null);
