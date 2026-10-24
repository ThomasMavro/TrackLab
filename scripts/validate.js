// Out-of-sample validation: profile fitted on an athlete's SEMI-FINAL, then used to predict the same athlete's FINAL.
// Test 1 (fatigue): give the model the athlete's real 0–300 m pacing in the final, let it run all-out from 300 m, and compare
//                   the predicted home straight and finish time with what actually happened.
// Test 2 (capacity): predict the final time from the semi profile alone, assuming the suggested championship-shaped plan.
// Baselines: Test 1 vs "average finalist fade" (last 100 m = 27.8% of final time); Test 2 vs "same time as the semi".
const M = require('../src/model.js'), B = require('../data/benchmarks.js');
const envOf = r => ({ alt: r.alt, temp: r.temp, hum: r.hum });
const finals = B.RACES.filter(r => r.round === 'Final');
const semis = B.RACES.filter(r => r.round !== 'Final');
const rows = [];
for (const f of finals) {
  const ss = semis.filter(s => s.sex === f.sex && s.year === f.year && s.city === f.city);
  for (const a of f.athletes) {
    let semiAth = null, semiRace = null;
    for (const s of ss) { const x = s.athletes.find(y => y.name === a.name); if (x) { semiAth = x; semiRace = s; } }
    if (!semiAth) continue;
    const prof = M.fitToSplits(f.sex, semiAth, envOf(semiRace));
    const c = a.splits, seg = [c[0], c[1] - c[0], c[2] - c[1], c[3] - c[2]];
    // Test 1: real 0–300 pacing, all-out from 300
    const p1 = Object.assign({}, prof, { rt: a.rt, plan: [seg[0], seg[1], seg[2], seg[3]], allOutFinish: true });
    const r1 = M.simulate(p1, envOf(f), { lane: a.lane, record: false });
    const k1 = M.cum100(r1);
    const behind300 = k1[2] - c[2]; // > 0.1 means the profile could not even hold the real 0–300 pace
    const naiveFin = c[2] / (1 - 0.2778);
    // Test 2: suggested plan only
    const b2 = M.bestPlan(Object.assign({}, prof, { rt: a.rt }), envOf(f), a.lane, f.sex);
    rows.push({ race: f.id, name: a.name, semi: semiAth.splits[3], final: c[3], last100: seg[3],
      t1: +r1.time.toFixed(2), t1err: +(r1.time - c[3]).toFixed(3), last100pred: +(r1.time - k1[2]).toFixed(2), behind300: +behind300.toFixed(3),
      naive1err: +(naiveFin - c[3]).toFixed(3),
      t2: +b2.time.toFixed(2), t2err: +(b2.time - c[3]).toFixed(3), naive2err: +(semiAth.splits[3] - c[3]).toFixed(3) });
  }
}
const mae = k => rows.reduce((s, r) => s + Math.abs(r[k]), 0) / rows.length;
const bias = k => rows.reduce((s, r) => s + r[k], 0) / rows.length;
const within = (k, x) => rows.filter(r => Math.abs(r[k]) <= x).length / rows.length;
const summary = {
  n: rows.length, races: [...new Set(rows.map(r => r.race))],
  test1: { mae: +mae('t1err').toFixed(3), bias: +bias('t1err').toFixed(3), within02: +within('t1err', 0.2).toFixed(2), within04: +within('t1err', 0.4).toFixed(2), baselineMae: +mae('naive1err').toFixed(3), couldNotHold: rows.filter(r => r.behind300 > 0.1).length },
  test2: { mae: +mae('t2err').toFixed(3), bias: +bias('t2err').toFixed(3), within03: +within('t2err', 0.3).toFixed(2), baselineMae: +mae('naive2err').toFixed(3) },
};
module.exports = { rows, summary };
if (require.main === module) {
  console.log(JSON.stringify(summary, null, 1));
  rows.sort((a, b) => Math.abs(b.t1err) - Math.abs(a.t1err)).slice(0, 6).forEach(r => console.log('worst1', r.race, r.name, 'final', r.final, 'pred', r.t1, 'err', r.t1err, 'behind300', r.behind300));
  rows.sort((a, b) => Math.abs(b.t2err) - Math.abs(a.t2err)).slice(0, 4).forEach(r => console.log('worst2', r.race, r.name, 'semi', r.semi, 'final', r.final, 'pred', r.t2, 'err', r.t2err));
  require('fs').writeFileSync(require('path').join(__dirname, '../validation/results.json'), JSON.stringify({ summary, rows }, null, 1));
}
