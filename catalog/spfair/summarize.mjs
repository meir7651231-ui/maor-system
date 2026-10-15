/** ⚖️ SP-FAIR — סיכום ההרצות (טהור; fair.mjs כותב אותו ל-summary.json). */
export function summarize(runs) {
  const exp1 = {}; const targets = {}; const exactAll = {};
  for (const [n, r] of Object.entries(runs)) {
    exp1[n] = {
      salt: r.salt, rounds: r.rounds, sameBytesAsBranch: Object.values(r.sameBytesAsBranch).every(Boolean),
      exactFair: r.exactByBlueprintFair.map((e) => e.verb),
      exactBaseline: Object.keys(r.exact.baseline).filter((v) => r.exact.baseline[v].fromOthers),
      averagePct: { baseline: r.bestGrown.baseline.average?.pct ?? null, selfprint: r.bestGrown.selfprint.average?.pct ?? null },
      blueprints: r.blueprints.total, success: r.blueprints.birthedSuccess, maxDepthSuccess: r.blueprints.maxDepthSuccess,
      wrongImprovements: r.wrongImprovements,
    };
    for (const e of r.exactByBlueprintFair) (exactAll[e.verb] ||= []).push(n);
    // floor 0 = חלק שכבר היה בקטלוג (לא נבנה) — נרשם בנפרד; רק מה שנבנה (צמיחה / שרטוט) נספר
    for (const side of ['selfprint', 'baseline']) for (const h of r.targets[side].hits) {
      const k = h.target; const e = (targets[k] ||= { he: h.he, known: h.known, selfprint: [], baseline: [], byBlueprint: [], alreadyPart: [] });
      if (h.floor === 0) { e.alreadyPart.push(n); continue; }
      e[side].push(n);
      if (h.blueprint) e.byBlueprint.push(n + ':' + h.blueprint.source + ':' + h.blueprint.id + ':d' + h.blueprint.depth);
    }
  }
  for (const k of Object.keys(targets)) for (const s of ['selfprint', 'baseline', 'byBlueprint', 'alreadyPart']) targets[k][s] = [...new Set(targets[k][s])];
  return { runs: exp1, exactFairBy: exactAll, targetsHitBy: Object.fromEntries(Object.keys(targets).sort().map((k) => [k, targets[k]])) };
}
