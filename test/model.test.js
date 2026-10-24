// Run with: npm test
const test = require('node:test'), assert = require('node:assert');
const M = require('../src/model.js'), B = require('../data/benchmarks.js');

const elite = { mass: 76, height: 1.85, rt: 0.17, vmax: 11.2, t90: 2.4, ac: 100, vo2: 67 };
const club = { mass: 74, height: 1.80, rt: 0.20, vmax: 9.9, t90: 2.6, ac: 75, vo2: 56 };

test('track geometry: lane 1 is 400 m and staggers grow outward', () => {
  assert.ok(Math.abs(M.laneLength(1) - 400) < 0.2, 'lane 1 = ' + M.laneLength(1));
  for (let l = 2; l <= 9; l++) assert.ok(M.stagger(l) > M.stagger(l - 1));
  assert.ok(Math.abs(M.stagger(8) - 53.0) < 1.5, 'lane 8 stagger ' + M.stagger(8));
});
test('typical profiles land on realistic 400 m times', () => {
  const e = M.bestPlan(elite, {}, 4, 'M').time, c = M.bestPlan(club, {}, 4, 'M').time;
  assert.ok(e > 43.5 && e < 45.5, 'elite ' + e);
  assert.ok(c > 50 && c < 53, 'club ' + c);
});
test('split shape: second 100 m fastest, home straight slowest', () => {
  const s = M.split100(M.bestPlan(elite, {}, 4, 'M').r);
  assert.ok(s[1] < s[0] && s[1] < s[2] && s[3] > s[2], s.join(' '));
});
test('conditions move the time the right way', () => {
  const base = M.bestPlan(elite, {}, 4, 'M').time;
  assert.ok(M.bestPlan(elite, { alt: 2000 }, 4, 'M').time < base, 'altitude helps');
  assert.ok(M.bestPlan(elite, { wet: true }, 4, 'M').time > base, 'wet track hurts');
  assert.ok(M.bestPlan(elite, {}, 1, 'M').time > M.bestPlan(elite, {}, 8, 'M').time, 'tight inside lane costs time');
});
test('more speed endurance and more top speed both make the athlete faster', () => {
  const base = M.bestPlan(elite, {}, 4, 'M').time;
  assert.ok(M.bestPlan({ ...elite, ac: 105 }, {}, 4, 'M').time < base);
  assert.ok(M.bestPlan({ ...elite, vmax: 11.4 }, {}, 4, 'M').time < base);
});
test('a plan that is too fast breaks down', () => {
  const r = M.simulate({ ...club, plan: [11.0, 10.2, 11.0, 12.5], allOutFinish: true }, {}, { lane: 4 });
  const c = M.cum100(r);
  assert.ok(c[2] - 32.2 > 0.3, 'falls behind the plan by 300 m: ' + c[2]);
});
test('PB estimation reproduces both personal bests', () => {
  const e = M.estimateFromPBs({ mass: 74, height: 1.82, rt: 0.18, vmax: 10, t90: 2.5, ac: 80, vo2: 62 }, 10.9, 48.5, 'M');
  assert.ok(Math.abs(M.simplePB100(e) - 10.9) < 0.03);
  assert.ok(Math.abs(M.bestPlan(e, {}, 4, 'M').time - 48.5) < 0.1);
});
test('fitted real athletes reproduce their published splits', () => {
  const sample = B.RACES.filter(r => ['m2024', 'w2025', 'm2023sf2'].includes(r.id));
  for (const r of sample) for (const a of r.athletes.slice(0, 3)) {
    const f = M.fitToSplits(r.sex, a, { alt: r.alt, temp: r.temp, hum: r.hum });
    assert.ok(f.fitErr < 0.08, `${r.id} ${a.name}: ${f.fitErr}`);
  }
});
test('benchmark data is consistent', () => {
  for (const r of B.RACES) for (const a of r.athletes) {
    const c = a.splits; assert.ok(c[0] < c[1] && c[1] < c[2] && c[2] < c[3], r.id + ' ' + a.name);
    if (a.s50) assert.ok(Math.abs(a.s50[7] - c[3]) < 0.015 && Math.abs(a.s50[1] - c[0]) < 0.015, r.id + ' ' + a.name + ' 50 m');
  }
});
