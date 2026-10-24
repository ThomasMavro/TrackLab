// 400m race model v2 — force-velocity + bioenergetic (Keller-type) with drag, wind, air density, wet track, bends,
// pacing by opening pace or by a per-100 m race plan.
(function (root) {
  const TRACK = { straight: 84.39, kerbR: 36.5, laneW: 1.22, lanes: 9 };
  const G = 9.81, RHO0 = 1.225;
  const CFG = {
    E_REF: 2900,   // J/kg anaerobic store at index 100
    SIG_REF: 43,   // W/kg aerobic supply at VO2max 67
    VO2_REF: 67,
    TAU_AE: 10,    // s, aerobic ramp
    G_MIN: 0.6,    // force capacity floor when the anaerobic store is empty
    Q: 2,        // fatigue curve shape
    U0: 0.65,      // share of anaerobic store used before force starts to fall
    CD: 0.9,
    TAU_E: 1.04,   // fixed metabolic 'internal resistance' (decouples energy cost from acceleration ability)
    KB: 0.8,       // bend penalty on available force
    CB: 0.6,       // bend penalty on energy cost (sideways force)
    K_EFF: 0.5, N_EFF: 6, // extra metabolic cost near top speed
    KICK: 300,     // all-out from here (opening-pace mode, or plan with all-out finish)
    DRIVE: 0.95,   // effort in the drive phase (opening-pace mode)
    WET_GRIP: 0.988, WET_BEND: 1.6, // wet track: slight loss of push-off, larger bend penalty
  };

  function laneRadius(lane) { return TRACK.kerbR + (lane === 1 ? 0.30 : 0.20 + TRACK.laneW * (lane - 1)); }
  function laneLength(lane) { return 2 * TRACK.straight + 2 * Math.PI * laneRadius(lane); }
  function stagger(lane) { return laneLength(lane) - laneLength(1); }

  // position along lane, p measured from the finish line (counter-clockwise)
  function lanePos(lane, p) {
    const R = laneRadius(lane), a = TRACK.straight / 2, L = laneLength(lane);
    p = ((p % L) + L) % L;
    const b = Math.PI * R;
    if (p < b) { const f = p / R; return { x: a + R * Math.sin(f), z: R * Math.cos(f), hx: Math.cos(f), hz: -Math.sin(f), R }; }
    p -= b;
    if (p < TRACK.straight) return { x: a - p, z: -R, hx: -1, hz: 0, R: Infinity };
    p -= TRACK.straight;
    if (p < b) { const f = p / R; return { x: -a - R * Math.sin(f), z: -R * Math.cos(f), hx: -Math.cos(f), hz: Math.sin(f), R }; }
    p -= b;
    return { x: -a + p, z: R, hx: 1, hz: 0, R: Infinity };
  }

  function frontalArea(m, h) { const bsa = 0.007184 * Math.pow(m, 0.425) * Math.pow(h * 100, 0.725); return 0.266 * bsa; }
  function airDensity(env) {
    const T = (env.temp == null ? 20 : env.temp), hum = (env.hum == null ? 50 : env.hum);
    const p = 101325 * Math.exp(-(env.alt || 0) / 8434);
    const es = 610.78 * Math.pow(10, 7.5 * T / (T + 237.3));
    const pv = Math.min(1, Math.max(0, hum / 100)) * es, Tk = T + 273.15;
    return (p - pv) / (287.05 * Tk) + pv / (461.5 * Tk);
  }

  function derive(a) {
    const tau = a.t90 / Math.LN10;
    const k0 = 0.5 * RHO0 * CFG.CD * frontalArea(a.mass, a.height) / a.mass;
    const F = a.vmax / tau + k0 * a.vmax * a.vmax;
    return { tau, k0, F, E0: CFG.E_REF * a.ac / 100, sig: CFG.SIG_REF * a.vo2 / CFG.VO2_REF };
  }

  function planCum(plan) { const c = []; let s = 0; for (const x of plan) { s += x; c.push(s); } return c; }

  // a: {mass,height,rt,vmax,t90,ac,vo2,pace, plan?:[4 segment times, first from the gun], allOutFinish}
  // env: {wind, windDir(deg), alt, temp, hum, wet}
  // opts: {lane, distance, straightOnly, dt, record, allOut, usePlan}
  function simulate(a, env, opts) {
    opts = opts || {}; env = env || {};
    const lane = opts.lane || 4, D = opts.distance || 400, dt = opts.dt || 0.005, rec = opts.record !== false;
    const d = derive(a), rho = airDensity(env), k = d.k0 * rho / RHO0;
    const th = (env.windDir || 0) * Math.PI / 180, wx = (env.wind || 0) * Math.cos(th), wz = (env.wind || 0) * Math.sin(th);
    const st = opts.straightOnly ? 0 : stagger(lane);
    const grip = env.wet ? CFG.WET_GRIP : 1, kb = CFG.KB * (env.wet ? CFG.WET_BEND : 1);
    const usePlan = !opts.allOut && opts.usePlan !== false && a.plan && (a.plan.length === 4 || a.plan.length === 8);
    const nSeg = usePlan ? a.plan.length : 4, L = 400 / nSeg;
    const cum = usePlan ? planCum(a.plan) : null;
    const allOutFinish = usePlan ? a.allOutFinish !== false : true;
    let t = 0, s = 0, v = 0, E = d.E0, cruising = false;
    const out = { t: [], s: [], v: [], e: [] };
    const splits = []; let nextSplit = 50;
    let peakV = 0, peakS = 0, lastRec = -1;
    while (s < D && t < 200) {
      if (t >= a.rt) {
        let hx = 1, hz = 0, R = Infinity;
        if (!opts.straightOnly) { const P = lanePos(lane, st + s); hx = P.hx; hz = P.hz; R = P.R; }
        const wal = opts.straightOnly ? (env.wind || 0) : wx * hx + wz * hz;
        const rel = v - wal, drag = k * rel * Math.abs(rel);
        const e = Math.max(0, E / d.E0);
        const x = Math.min(1, Math.max(0, (1 - e - CFG.U0) / (1 - CFG.U0)));
        let Fa = d.F * grip * (1 - (1 - CFG.G_MIN) * Math.pow(x, CFG.Q));
        let bendCost = 1;
        if (R !== Infinity) { const c = v * v / (G * R); Fa *= Math.max(0.5, 1 - kb * c * c); bendCost = 1 + CFG.CB * (env.wet ? CFG.WET_BEND : 1) * c * c; }
        const sig = d.sig * (1 - Math.exp(-(t - a.rt) / CFG.TAU_AE));
        let f = Fa;
        if (usePlan) {
          const kickW = allOutFinish ? Math.min(1, Math.max(0, (s - CFG.KICK) / 25)) : 0; // ramp into the all-out finish
          if (kickW < 1) {
            let vdes;
            if (s < L - 10) {
              // first segment: run the speed that reaches the first mark on schedule
              vdes = (L - s) / Math.max(cum[0] - t, 0.8);
            } else {
              // afterwards: hold the planned segment speed, nudged by how far ahead or behind schedule.
              // With an all-out finish, the last planned segment before 300 m is held into the kick.
              const jmax = allOutFinish ? Math.round(CFG.KICK / L) - 1 : nSeg - 1;
              const j = Math.min(jmax, Math.max(1, Math.floor(s / L)));
              const texp = cum[j - 1] + (s - L * j) / L * a.plan[j];
              const err = t - texp;
              let vp = L / a.plan[j];
              const m = Math.round(s / L) * L, BW = Math.min(12, 0.12 * L); // blend across each mark
              if (m >= 2 * L && m <= jmax * L && Math.abs(s - m) < BW) {
                const f2 = (s - m + BW) / (2 * BW), v0 = L / a.plan[m / L - 1], v1 = L / a.plan[m / L];
                vp = v0 + (v1 - v0) * f2 * f2 * (3 - 2 * f2);
              }
              vdes = vp * (1 + Math.max(-0.05, Math.min(0.08, 0.15 * err)));
            }
            const need = v / d.tau + drag + (vdes - v) * 4;
            f = Math.max(0, Math.min(Fa, need));
            if (kickW > 0) f = f + (Fa - f) * kickW;
          }
        } else if (!opts.allOut && s < CFG.KICK) {
          const target = a.pace * a.vmax;
          if (!cruising && v >= target) cruising = true;
          if (!cruising) f = Fa * Math.max(CFG.DRIVE, Math.min(1, a.pace + 0.04));
          else { const need = v / d.tau + drag + (target - v) * 4; f = Math.max(0, Math.min(Fa, need)); }
        }
        const acc = f - v / d.tau - drag;
        const P = Math.max(0, f - v / d.tau + v / CFG.TAU_E) * Math.max(v, 0) * (1 + CFG.K_EFF * Math.pow(Math.min(1.2, v / a.vmax), CFG.N_EFF)) * bendCost;
        v = Math.max(0, v + acc * dt);
        const ds = v * dt;
        while (s + ds >= nextSplit && nextSplit <= D) { splits.push(t + dt * (nextSplit - s) / Math.max(ds, 1e-9)); nextSplit += 50; }
        s += ds;
        E += (sig - P) * dt;
        if (E < 0) E = 0;
        if (v > peakV) { peakV = v; peakS = s; }
      }
      t += dt;
      if (rec && t - lastRec >= 0.02) { out.t.push(t); out.s.push(Math.min(s, D)); out.v.push(v); out.e.push(E / d.E0); lastRec = t; }
    }
    const time = splits.length ? splits[splits.length - 1] : t;
    if (rec) { out.t.push(time); out.s.push(D); out.v.push(v); out.e.push(E / d.E0); }
    return { time, splits, trace: out, eFinish: E / d.E0, peakV, peakS, finalV: v, lane, derived: d };
  }

  // cumulative 100 m splits [100,200,300,400] and segment times
  function cum100(r) { const sp = r.splits; return [sp[1], sp[3], sp[5], sp[7]]; }
  function split100(r) { const c = cum100(r); return [c[0], c[1] - c[0], c[2] - c[1], c[3] - c[2]]; }

  function simplePB100(a) { return simulate(Object.assign({}, a, { plan: null }), {}, { distance: 100, straightOnly: true, allOut: true, record: false, dt: 0.004 }).time; }

  function bisect(fn, lo, hi, target, iters, increasing) {
    for (let i = 0; i < iters; i++) { const mid = (lo + hi) / 2, val = fn(mid); if ((val > target) === increasing) hi = mid; else lo = mid; }
    return (lo + hi) / 2;
  }

  // best even-effort pacing for a profile; returns {pace, time, r}
  function bestPacing(a, env, lane, fine) {
    const b = Object.assign({}, a, { plan: null });
    let best = null;
    const step = fine ? 0.005 : 0.01;
    for (let p = 0.82; p <= 0.9801; p += step) {
      const r = simulate(Object.assign({}, b, { pace: p }), env, { lane, record: false, dt: fine ? 0.005 : 0.01 });
      if (!best || r.time < best.time) best = { pace: p, time: r.time, r };
    }
    return best;
  }
  // average split shape of championship finalists (share of final time per 100 m), from the benchmark data
  const SHAPE = { M: [0.2468, 0.2280, 0.2474, 0.2778], W: [0.2447, 0.2309, 0.2495, 0.2749] };
  function shapedPlan(T, sex) { return SHAPE[sex || 'M'].map(f => Math.round(f * T * 100) / 100); }
  // suggested plan with the championship split shape: find the fastest target the athlete can hold to 300 m,
  // then the self-consistent target (the athlete finishes on the planned time when running it, all-out from 300 m).
  function bestPlan(a, env, lane, sex, fast) {
    const DT = fast ? 0.02 : 0.01, N1 = fast ? 12 : 16, N2 = fast ? 10 : 14;
    const run = (T) => simulate(Object.assign({}, a, { plan: shapedPlan(T, sex), allOutFinish: true }), env, { lane, record: false, dt: DT });
    const holds = T => { const p = shapedPlan(T, sex), c = cum100(run(T)); return c[1] - (p[0] + p[1]) <= 0.05 && c[2] - (p[0] + p[1] + p[2]) <= 0.05; };
    let lo = 400 / a.vmax + 2, hi = lo + 40;
    if (holds(lo)) hi = lo;
    else for (let i = 0; i < N1; i++) { const mid = (lo + hi) / 2; if (holds(mid)) hi = mid; else lo = mid; }
    // then the self-consistent plan: the target time the athlete actually finishes in when running it
    let a2 = hi, b2 = hi + 6;
    for (let i = 0; i < N2; i++) { const mid = (a2 + b2) / 2; if (run(mid).time > mid) a2 = mid; else b2 = mid; }
    const T = Math.round(b2 * 100) / 100;
    const plan = shapedPlan(T, sex);
    const r = simulate(Object.assign({}, a, { plan, allOutFinish: true }), env, { lane, record: false, dt: fast ? 0.01 : 0.005 });
    return { plan, time: r.time, r };
  }
  function suggestPlan(a, env, lane, sex) { return bestPlan(a, env, lane, sex).plan; }

  // Estimate vmax from 100m PB and anaerobic index from 400m PB (best pacing, lane 4, still air)
  function estimateFromPBs(a, pb100, pb400, sex) {
    const b = Object.assign({}, a, { plan: null });
    b.vmax = bisect(x => simplePB100(Object.assign({}, b, { vmax: x })), 6, 13.5, pb100, 28, false);
    const sim = ac => bestPlan(Object.assign({}, b, { ac }), {}, 4, sex, true).time;
    b.ac = bisect(sim, 15, 260, pb400, 18, false);
    return b;
  }

  const DEFAULT_BODY = {
    M: { mass: 75, height: 1.84, t90: 2.4, vo2: 66 },
    W: { mass: 58, height: 1.71, t90: 2.4, vo2: 58 },
  };
  // Fit a real athlete to their published splits: plan = real splits, all-out home straight.
  // Top speed is not identifiable from 400 m splits alone, so among equally good fits we keep the one
  // closest to ~10% above the fastest flying 100 m; anaerobic capacity is fitted to the final time.
  function fitToSplits(sex, ath, env, opts) {
    opts = opts || {};
    const c = ath.s50 && !opts.only100 ? ath.s50 : ath.splits;           // cumulative marks (8 x 50 m or 4 x 100 m)
    const segs = c.map((x, i) => +(i ? x - c[i - 1] : x).toFixed(3));
    const body = opts.body || DEFAULT_BODY[sex];
    const base = Object.assign({}, body, { rt: ath.rt, plan: segs, allOutFinish: segs.length !== 8, pace: 0.9 }); // with 50 m points the real race is followed to the line
    const fly = (400 / segs.length) / Math.min(...segs.slice(1, segs.length - 1));
    const errOf = a => { const r = simulate(a, env, { lane: ath.lane, record: false, dt: 0.01 }); return Math.max(...marks(r, c.length).map((x, i) => Math.abs(x - c[i]))); };
    const cands = [];
    for (let ratio = 0.84; ratio <= 0.961; ratio += 0.02) {
      const a = Object.assign({}, base, { vmax: fly / ratio });
      a.ac = bisect(ac => simulate(Object.assign({}, a, { ac }), env, { lane: ath.lane, record: false, dt: 0.01 }).time, 10, 400, c[c.length - 1], 20, false);
      cands.push({ a, ratio, err: errOf(a) });
    }
    const minErr = Math.min(...cands.map(x => x.err));
    const ok = cands.filter(x => x.err <= minErr + 0.02).sort((p, q) => Math.abs(p.ratio - 0.9) - Math.abs(q.ratio - 0.9));
    const a = ok[0].a;
    a.ac = Math.round(a.ac * 10) / 10;
    const r = simulate(a, env, { lane: ath.lane, record: false });
    a.fitErr = Math.max(...marks(r, c.length).map((x, i) => Math.abs(x - c[i])));
    return a;
  }
  // cumulative times at n equal marks (4 -> every 100 m, 8 -> every 50 m)
  function marks(r, n) { const k = 8 / n; const out = []; for (let i = 1; i <= n; i++) out.push(r.splits[i * k - 1]); return out; }

  function strideAt(v, a) {
    const slMax = 1.32 * a.height, r = Math.max(0.05, v / a.vmax);
    const sl = slMax * Math.pow(r, 0.4);
    return { sl, sf: v > 0.05 ? v / sl : 0 };
  }

  const api = { marks, TRACK, CFG, laneRadius, laneLength, stagger, lanePos, simulate, cum100, split100, simplePB100, estimateFromPBs, fitToSplits, bestPacing, bestPlan, shapedPlan, suggestPlan, SHAPE, DEFAULT_BODY, strideAt, derive, airDensity, bisect };
  if (typeof module !== 'undefined') module.exports = api; else root.RaceModel = api;
})(this);
