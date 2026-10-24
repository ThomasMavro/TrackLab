/* ---------------- Simulation ---------------- */
function runRace(opts) {
  opts = opts || {};
  const res = {};
  for (const g of state.athletes.filter(isGhost)) { const o = ownerOf(g); if (o) g.lane = o.lane; }
  state.athletes = state.athletes.filter(a => !isGhost(a) || ownerOf(a));
  for (const a of state.athletes) {
    ensurePlan(a);
    const r = M.simulate(runner(a), envFor(a), { lane: a.lane });
    r.split100 = M.split100(r); r.cum = M.cum100(r);
    res[a.id] = r;
  }
  state.results = res;
  state.t = 0; state.playing = true; $('#playBtn').textContent = 'Pause';
  state.stale = false; $('#runBtn').classList.remove('stale'); $('#runBtn').textContent = 'Run race';
  state.duration = Math.max(...Object.values(res).map(r => r.time)) + 3;
  rebuildRunners();
  if (opts.focusIdx != null) {
    state.focus = (state.athletes[opts.focusIdx] || state.athletes[0]).id;
    state.ref = opts.refIdx != null && opts.refIdx >= 0 && state.athletes[opts.refIdx] ? state.athletes[opts.refIdx].id : null;
    refreshSelectors();
  } else refreshSelectors(true);
  if (!opts.restore) state.restoredAt = null;
  renderEditor();
  renderCoach();
  if (opts.save) saveNewRun();
}
$('#runBtn').addEventListener('click', () => runRace({ save: true }));

function sampleAt(r, t) {
  const tr = r.trace, T = tr.t, n = T.length;
  if (t >= r.time) { const vf = tr.v[n - 1], dt = t - r.time, k = 1.6; return { s: 400 + vf * k * (1 - Math.exp(-dt / k)), v: vf * Math.exp(-dt / k), e: tr.e[n - 1], done: true }; }
  if (t <= T[0]) return { s: 0, v: 0, e: 1 };
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (T[m] <= t) lo = m; else hi = m; }
  const f = (t - T[lo]) / Math.max(1e-6, T[hi] - T[lo]);
  return { s: tr.s[lo] + (tr.s[hi] - tr.s[lo]) * f, v: tr.v[lo] + (tr.v[hi] - tr.v[lo]) * f, e: tr.e[lo] + (tr.e[hi] - tr.e[lo]) * f };
}
function timeAt(r, s) {
  const tr = r.trace; if (s <= 0) return 0; if (s >= 400) return r.time;
  let lo = 0, hi = tr.s.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tr.s[m] <= s) lo = m; else hi = m; }
  const f = (s - tr.s[lo]) / Math.max(1e-6, tr.s[hi] - tr.s[lo]);
  return tr.t[lo] + (tr.t[hi] - tr.t[lo]) * f;
}

