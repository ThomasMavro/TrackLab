(function () {
'use strict';
const M = window.RaceModel, BENCH = window.BENCH, FITS = window.BENCH_FITS;
const COLORS = ['#0081c8', '#fcb131', '#f7f8fa', '#00a651', '#ee334e', '#7cc3ee', '#ffd88a', '#7fd8a8', '#c9a0ff'];

const PRESET_DEFAULTS = {
  eliteM: { sex: 'M', label: 'World-class man', p: { mass: 76, height: 1.85, rt: 0.17, vmax: 11.2, t90: 2.4, ac: 100, vo2: 67 } },
  natM:   { sex: 'M', label: 'National-level man', p: { mass: 74, height: 1.82, rt: 0.18, vmax: 10.7, t90: 2.5, ac: 88, vo2: 62 } },
  clubM:  { sex: 'M', label: 'Club man', p: { mass: 74, height: 1.80, rt: 0.20, vmax: 9.9, t90: 2.6, ac: 75, vo2: 56 } },
  eliteW: { sex: 'W', label: 'World-class woman', p: { mass: 60, height: 1.72, rt: 0.18, vmax: 9.9, t90: 2.4, ac: 82, vo2: 58 } },
  clubW:  { sex: 'W', label: 'Club woman', p: { mass: 60, height: 1.68, rt: 0.21, vmax: 8.8, t90: 2.6, ac: 75, vo2: 50 } },
};
// typical profiles can be re-timed by the user; the change is remembered in this browser
const PRESETS = JSON.parse(JSON.stringify(PRESET_DEFAULTS));
try {
  const saved = JSON.parse(localStorage.getItem('raceLabPresets') || 'null');
  if (saved) for (const k in saved) if (PRESETS[k]) Object.assign(PRESETS[k].p, saved[k]);
} catch (e) { /* storage unavailable */ }
const PRESET_T = {}, PRESET_100 = {};
function refreshPresetTimes(k) { const v = PRESETS[k]; PRESET_T[k] = M.bestPlan(v.p, {}, 4, v.sex, true).time; PRESET_100[k] = M.simplePB100(v.p); }
for (const k in PRESETS) refreshPresetTimes(k);
function savePresets() {
  try {
    const o = {};
    for (const k in PRESETS) if (PRESETS[k].p.vmax !== PRESET_DEFAULTS[k].p.vmax || PRESETS[k].p.ac !== PRESET_DEFAULTS[k].p.ac) o[k] = { vmax: PRESETS[k].p.vmax, ac: PRESETS[k].p.ac };
    localStorage.setItem('raceLabPresets', JSON.stringify(o));
  } catch (e) { /* storage unavailable */ }
}

const METRICS = [
  { group: 'Body' },
  { k: 'mass', label: 'Body mass', min: 40, max: 110, step: 0.5, fmt: v => v.toFixed(1) + ' <small>kg</small>' },
  { k: 'height', label: 'Height', min: 1.5, max: 2.05, step: 0.01, fmt: v => Math.round(v * 100) + ' <small>cm</small>' },
  { group: 'Speed' },
  { k: 'vmax', label: 'Top speed', min: 7, max: 12.5, step: 0.05, fmt: v => v.toFixed(2) + ' <small>m/s · ' + (v * 3.6).toFixed(1) + ' km/h</small>', hint: 'Best flying speed when fresh. World-class 400 m men reach about 11 m/s.' },
  { k: 't90', label: 'Acceleration', min: 1.6, max: 3.6, step: 0.05, fmt: v => v.toFixed(2) + ' <small>s to 90% of top speed</small>', hint: 'Lower is quicker out of the blocks.' },
  { k: 'rt', label: 'Reaction time', min: 0.1, max: 0.3, step: 0.005, fmt: v => v.toFixed(3) + ' <small>s</small>' },
  { group: 'Energy' },
  { k: 'ac', label: 'Anaerobic capacity', min: 30, max: 160, step: 1, fmt: v => Math.round(v) + ' <small>/ 100 = world-class man</small>', hint: 'Speed endurance. The main limit in the home straight.' },
  { k: 'vo2', label: 'VO₂max', min: 40, max: 85, step: 1, fmt: v => Math.round(v) + ' <small>ml/kg/min</small>', hint: 'Aerobic power. Supplies roughly a third of 400 m energy.' },
];

const LEVERS = [
  { k: 'vmax', name: 'Top speed', def: 2, max: 6, step: 0.5, apply: (p, x) => ({ vmax: p.vmax * (1 + x / 100) }), fmtSize: x => '+' + x + '%', goalName: 'top speed', train: 'max-velocity sprinting (flying 20–30 m runs) plus strength and power work', why: 'raises the speed the whole race is built on' },
  { k: 'ac', name: 'Speed endurance', def: 5, max: 15, step: 0.5, apply: (p, x) => ({ ac: p.ac * (1 + x / 100) }), fmtSize: x => '+' + x + '% anaerobic capacity', goalName: 'anaerobic capacity', train: '150–300 m repeats near race pace with full recovery', why: 'delays the slowdown in the home straight' },
  { k: 'vo2', name: 'Aerobic power', def: 5, max: 12, step: 0.5, apply: (p, x) => ({ vo2: p.vo2 * (1 + x / 100) }), fmtSize: x => '+' + x + '% VO₂max', goalName: 'VO₂max', train: 'extended tempo runs and 400–600 m intervals', why: 'saves anaerobic fuel for the finish' },
  { k: 't90', name: 'Acceleration', def: 5, max: 12, step: 0.5, apply: (p, x) => ({ t90: p.t90 * (1 - x / 100) }), fmtSize: x => x + '% quicker', goalName: 'quicker acceleration', train: 'block starts and 20–40 m accelerations', why: 'gets to race pace sooner' },
  { k: 'rt', name: 'Reaction', def: 0.02, max: 0.06, step: 0.005, apply: (p, x) => ({ rt: Math.max(0.1, p.rt - x) }), fmtSize: x => '−' + x.toFixed(3) + ' s', goalName: 'reaction', train: 'start-reaction drills', why: 'is a direct saving at the gun' },
];
const LEVER = Object.fromEntries(LEVERS.map(L => [L.k, L]));
const defaultSizes = () => Object.fromEntries(LEVERS.map(L => [L.k, L.def]));
const defaultPrio = () => Object.fromEntries(LEVERS.map(L => [L.k, 'normal']));

let uid = 0;
function mkCustom(name, presetKey, lane, colorIdx) {
  const pr = PRESETS[presetKey];
  return { id: ++uid, kind: 'custom', name, lane, colorIdx, color: COLORS[colorIdx], sex: pr.sex, p: Object.assign({}, pr.p), plan: null, planAuto: true, allOutFinish: true, mode: 'metrics', pb100: '', pb400: '', pbMsg: '', sizes: defaultSizes(), prio: defaultPrio() };
}
function raceById(id) { return BENCH.RACES.find(r => r.id === id); }
function raceLabel(r) { return `${r.champ === 'Olympic Games' ? 'Olympics' : 'Worlds'} ${r.city} ${r.year}`; }
function mkReal(raceId, idx, lane, colorIdx) {
  const r = raceById(raceId), ath = r.athletes[idx];
  const f = FITS[raceId + '|' + ath.name];
  const c = ath.splits;
  const p = Object.assign({}, M.DEFAULT_BODY[r.sex], { rt: ath.rt, vmax: f[0], ac: f[1] });
  return { id: ++uid, kind: 'real', name: ath.name, lane, origLane: ath.lane, colorIdx, color: COLORS[colorIdx], sex: r.sex, p,
    plan: ath.s50 ? ath.s50.map((x, i) => +(i ? x - ath.s50[i - 1] : x).toFixed(3)) : [c[0], +(c[1] - c[0]).toFixed(2), +(c[2] - c[1]).toFixed(2), +(c[3] - c[2]).toFixed(2)], planAuto: false, allOutFinish: !ath.s50,
    real: { raceId, round: r.round, idx, place: idx + 1, splits: c, s50: ath.s50 || null, nat: ath.nat, fitErr: f[2] }, sizes: defaultSizes(), prio: defaultPrio() };
}

const state = {
  athletes: [], sel: null, env: { wind: 0, windDir: 0, alt: 0, temp: 20, hum: 50, wet: false },
  results: null, playing: true, speed: 1, t: 0, cam: 'tv', stale: false, labels: true, track: 'red',
  focus: null, ref: null, picker: null, side: 'setup', presetOpen: false,
  sessionId: null, currentRunId: null, restoredAt: null, confirmDel: null,
};
state.athletes.push(Object.assign(mkCustom('You', 'natM', 4, 0), { isMe: true }));
state.athletes.push(mkReal('m2024', 0, 8, 1));
state.sel = state.athletes[0].id;

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const byId = id => state.athletes.find(a => a.id === id);
const fmtT = t => t.toFixed(2);
const short = n => { const parts = n.split(' '); return parts.length > 1 && n.length > 14 ? parts[0][0] + '. ' + parts.slice(1).join(' ') : n; };
function envFor(a) {
  if (a.kind === 'real') { const r = raceById(a.real.raceId); return { alt: r.alt, temp: r.temp, hum: r.hum, wind: 0, windDir: 0, wet: false }; }
  if (a.envOverride) return a.envOverride;
  return state.env;
}
const isGhost = a => a.ghostOf != null;
const lanesUsed = () => state.athletes.filter(a => !isGhost(a));
const ownerOf = g => byId(g.ghostOf);
// cumulative planned time at distance s for a plan of 4 (100 m) or 8 (50 m) sections
function planTimeAt(plan, s) { const n = plan.length, L = 400 / n; let c = 0; for (let i = 0; i < n; i++) { if (s <= (i + 1) * L) return c + (s - i * L) / L * plan[i]; c += plan[i]; } return c; }
const per100 = plan => [100, 200, 300, 400].map((d, i) => planTimeAt(plan, d) - (i ? planTimeAt(plan, d - 100) : 0));
const bodyOf = p => ({ mass: p.mass, height: p.height, t90: p.t90, vo2: p.vo2 });
const fmtDay = iso => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
// A recorded run (uploaded or typed) turned into a runner. The fit is cached on the record.
function mkRec(rec, lane, colorIdx) {
  const f = rec.fit;
  const marks = rec.marks;
  const plan = marks.map((x, i) => +(i ? x - marks[i - 1] : x).toFixed(3));
  const p = Object.assign({}, f.body, { rt: rec.rt || 0, vmax: f.vmax, ac: f.ac });
  return { id: ++uid, kind: 'rec', name: rec.name, lane, colorIdx, color: COLORS[colorIdx], sex: rec.sex, p, plan, planAuto: false,
    allOutFinish: marks.length !== 8, envOverride: Object.assign({ wind: 0, windDir: 0, wet: false, alt: 0, temp: 20, hum: 50 }, rec.env || {}),
    recId: rec.id, recInfo: { date: rec.date, source: rec.source, approx: rec.approx, total: marks[marks.length - 1] }, sizes: defaultSizes(), prio: defaultPrio() };
}
function runner(a) { return Object.assign({}, a.p, { plan: a.plan, allOutFinish: a.allOutFinish }); }
const editable = a => a.kind === 'custom';
function ensurePlan(a) { if (a.kind === 'custom' && (a.planAuto || !a.plan)) a.plan = M.suggestPlan(a.p, envFor(a), a.lane, a.sex); }
