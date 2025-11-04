// src/utils/batchReport.js
export function normalizeBatchResult(raw) {
  // raw shape matches what you pasted
  // { batch_id, status, calls: [ { call_id, triggers: [ { trigger_id, matched, evidence } ] } ] }

  const calls = Array.isArray(raw?.calls) ? raw.calls : [];

  // Unique trigger ids seen across all calls
  const triggerSet = new Set();
  for (const c of calls) {
    for (const t of c?.triggers || []) triggerSet.add(t.trigger_id);
  }

  // Totals
  const totals = {
    calls: calls.length,
    triggers: triggerSet.size,
    evaluations: calls.reduce((acc, c) => acc + (c?.triggers?.length || 0), 0),
    matches: calls.reduce(
      (acc, c) => acc + (c?.triggers?.filter(t => !!t.matched)?.length || 0),
      0
    ),
  };

  // By trigger
  const trigMap = new Map();
  for (const c of calls) {
    for (const t of c?.triggers || []) {
      const row = trigMap.get(t.trigger_id) || { trigger_id: t.trigger_id, evaluated: 0, matches: 0 };
      row.evaluated += 1;
      if (t.matched) row.matches += 1;
      trigMap.set(t.trigger_id, row);
    }
  }
  const by_trigger = Array.from(trigMap.values()).map(r => ({
    ...r,
    match_rate: r.evaluated ? r.matches / r.evaluated : 0,
  })).sort((a, b) => b.matches - a.matches);

  // By call
  const by_call = calls.map(c => {
    const evaluated = c?.triggers?.length || 0;
    const matches = c?.triggers?.filter(t => !!t.matched)?.length || 0;
    return { call_id: c.call_id, evaluated, matches };
  }).sort((a, b) => b.matches - a.matches);

  return {
    batch_id: raw?.batch_id ?? null,
    status: raw?.status ?? "unknown",
    totals,
    by_trigger,
    by_call,
    // keep original for drilldowns if needed
    _raw: raw,
  };
}
