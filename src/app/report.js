
/* ---------------- Your report ---------------- */
function refreshSelectors(reset) {
  const ids = state.athletes.map(a => a.id);
  if (reset || !ids.includes(state.focus)) { const me = state.athletes.find(a => a.isMe) || state.athletes.find(a => a.kind === 'custom'); state.focus = (me || state.athletes[0]).id; }
  if (reset || (state.ref != null && !ids.includes(state.ref)) || state.ref === state.focus) {
    const others = state.athletes.filter(a => a.id !== state.focus);
    const ghost = state.athletes.find(g => g.ghostOf === state.focus);
    if (ghost) state.ref = ghost.id;
    else if (state.results && others.length && others.every(o => state.results[o.id])) { others.sort((x, y) => state.results[x.id].time - state.results[y.id].time); state.ref = others[0].id; }
    else state.ref = others[0] ? others[0].id : null;
  }
  const nameOf = a => isGhost(a) ? 'Ghost · ' + a.name : a.name;
  $('#focusSel').innerHTML = state.athletes.map(a => `<option value="${a.id}" ${a.id === state.focus ? 'selected' : ''}>${esc(nameOf(a))}</option>`).join('');
  $('#refSel').innerHTML = `<option value="">nobody</option>` + state.athletes.filter(a => a.id !== state.focus).map(a => `<option value="${a.id}" ${a.id === state.ref ? 'selected' : ''}>${esc(nameOf(a))}</option>`).join('');
}
$('#focusSel').addEventListener('change', e => { state.focus = +e.target.value; if (state.ref === state.focus) state.ref = null; refreshSelectors(); renderCoach(); scheduleRunUpdate(); });
$('#refSel').addEventListener('change', e => { state.ref = e.target.value ? +e.target.value : null; renderCoach(); scheduleRunUpdate(); });

function analyse(a) {
  const env = envFor(a), lane = a.lane;
  const best = M.bestPlan(a.p, env, lane, a.sex, true);
  const cur = M.simulate(runner(a), env, { lane, record: false, dt: 0.01 });
  const gains = {};
  for (const L of LEVERS) {
    const x = a.sizes[L.k];
    if (!x || a.prio[L.k] === 'skip') { gains[L.k] = null; continue; }
    gains[L.k] = best.time - M.bestPlan(Object.assign({}, a.p, L.apply(a.p, x)), env, lane, a.sex, true).time;
  }
  const planGain = cur.time - best.time;
  return { best, cur, gains, planGain: planGain > 0.03 ? planGain : 0 };
}
function planIssues(a, r) {
  if (!a.plan) return null;
  const pc = [100, 200, 300].map(d => planTimeAt(a.plan, d));
  for (let i = 0; i < 3; i++) if (r.cum[i] - pc[i] > 0.08) return { type: 'behind', at: (i + 1) * 100, by: r.cum[i] - pc[i] };
  if (r.eFinish > 0.12) return { type: 'slow', fuel: r.eFinish };
  return null;
}
const isFocus = (a, k) => a.prio[k] === 'focus';

function renderCoach() {
  const el = $('#coach');
  if (!state.results) {
    el.innerHTML = `<div class="empty">Set up the race and press <b>Run race</b> to get your report. Each run is saved in History.</div>`;
    return;
  }
  const a = byId(state.focus), r = state.results[a.id];
  if (!r) { el.innerHTML = `<div class="empty">Run the race again to include ${esc(a.name)}.</div>`; return; }
  const ref = state.ref ? byId(state.ref) : null, rr = ref ? state.results[ref.id] : null;
  const an = analyse(a);
  a._an = an;
  const s = r.split100, sr = rr ? rr.split100 : null;
  const order = state.athletes.filter(x => state.results[x.id]).map(x => ({ x, t: state.results[x.id].time })).sort((p, q) => p.t - q.t);
  const place = order.findIndex(o => o.x.id === a.id) + 1;
  const segNames = ['the first 100 m', 'the back straight', 'the second bend', 'the home straight'];
  const deltas = sr ? s.map((v, i) => v - sr[i]) : null;
  const issue = planIssues(a, r);
  const nm = esc(a.name);
  const you = /^you$/i.test(a.name.trim());
  const V = (third, base) => you ? base : third;
  const POS = you ? 'your' : 'their';

  // ranked levers
  const active = LEVERS.filter(L => an.gains[L.k] != null).map(L => ({ L, g: an.gains[L.k], focus: isFocus(a, L.k) }));
  const byGain = active.slice().sort((p, q) => q.g - p.g);
  const focusList = byGain.filter(x => x.focus);
  const topFocus = focusList[0] || null, topAll = byGain[0] || null;
  const hasFocus = LEVERS.some(L => isFocus(a, L.k));

  // verdict
  const REFN = ref ? (isGhost(ref) ? (you ? 'your' : nm + "'s") + ' ghost' + (ref.pastInfo ? ' from ' + esc(ref.pastInfo.when) : ref.recInfo ? ' from ' + fmtDay(ref.recInfo.date) : '') : esc(ref.name)) : '';
  let head;
  if (rr) {
    const gap = r.time - rr.time;
    if (gap > 0.005) {
      const worst = deltas.indexOf(Math.max(...deltas));
      head = `${nm} ${V('finishes', 'finish')} <span class="hl-bad">${gap.toFixed(2)} s</span> behind ${REFN}. The biggest loss is in ${segNames[worst]}: <span class="hl-bad">${deltas[worst].toFixed(2)} s</span>.`;
    } else {
      const best = deltas.indexOf(Math.min(...deltas));
      head = `${nm} ${V('beats', 'beat')} ${REFN} by <span class="hl-good">${Math.abs(gap).toFixed(2)} s</span>, gaining most in ${segNames[best]}.`;
    }
  } else head = `${nm} ${V('is', 'are')} projected to run <span class="hl-good">${fmtT(r.time)} s</span>.`;
  let sub = '';
  if (topFocus) sub = `Of ${POS} focus areas, <b>${topFocus.L.name.toLowerCase()}</b> gains the most: ${topFocus.g.toFixed(2)} s.`;
  else if (topAll) sub = `Biggest lever: <b>${topAll.L.name.toLowerCase()}</b>, worth ${topAll.g.toFixed(2)} s. ${hasFocus ? '' : 'Mark what matters to ' + (you ? 'you' : nm) + ' in the priorities below to tailor this report.'}`;
  if (an.planGain) sub += ` A better race plan alone saves ${an.planGain.toFixed(2)} s.`;
  let flag = '';
  if (issue && issue.type === 'behind') flag = `The plan is too fast for this profile: ${nm} ${V('is', 'are')} ${issue.by.toFixed(2)} s behind it at ${issue.at} m.`;
  if (issue && issue.type === 'slow') flag = `The plan is too slow: ${nm} ${V('finishes', 'finish')} with ${Math.round(issue.fuel * 100)}% of the anaerobic fuel unused.`;

  // priorities and levers
  const maxGain = Math.max(0.01, ...active.map(x => x.g), an.planGain);
  const rowOrder = LEVERS.slice().sort((p, q) => {
    const rank = L => (a.prio[L.k] === 'focus' ? 0 : a.prio[L.k] === 'normal' ? 1 : 2);
    return rank(p) - rank(q) || ((an.gains[q.k] || 0) - (an.gains[p.k] || 0));
  });
  const prioRows = rowOrder.map(L => {
    const pv = a.prio[L.k], g = an.gains[L.k];
    const badge = topAll && topAll.L.k === L.k ? '<span class="badge">Biggest gain</span>' : topFocus && topFocus.L.k === L.k ? '<span class="badge focus">Top of your focus</span>' : '';
    return `<div class="pr ${pv}">
      <div class="pq"><b>${L.name}</b><span>${L.train}</span></div>
      <div class="seg-ctl small" role="group" aria-label="How much ${L.name} matters">
        ${['focus', 'normal', 'skip'].map(v => `<button data-prio="${L.k}" data-v="${v}" aria-pressed="${pv === v}">${v === 'focus' ? 'Focus' : v === 'normal' ? 'Normal' : 'Skip'}</button>`).join('')}
      </div>
      <div class="metric">
        <div class="metric-top"><label for="sz_${L.k}" class="sr">${L.name}: realistic improvement</label><output id="szo_${L.k}">${L.fmtSize(a.sizes[L.k])}</output></div>
        <input type="range" id="sz_${L.k}" data-size="${L.k}" min="${L.step}" max="${L.max}" step="${L.step}" value="${a.sizes[L.k]}" ${pv === 'skip' ? 'disabled' : ''}>
      </div>
      <div class="pg">${g == null ? '<span class="g none">skipped</span>' : `<span class="g ${g < 0.005 ? 'none' : ''}">${g >= 0.005 ? '−' + g.toFixed(2) + ' s' : 'no gain'}</span><div class="gbar"><b style="width:${Math.max(0, g) / maxGain * 100}%"></b></div>${badge}`}</div>
    </div>`;
  }).join('') + (an.planGain ? `<div class="pr plan">
      <div class="pq"><b>Race plan</b><span>Switch to the suggested plan: ${an.best.plan.map(fmtT).join(' / ')}. No training needed.</span></div>
      <div></div><div></div>
      <div class="pg"><span class="g">−${an.planGain.toFixed(2)} s</span><div class="gbar"><b style="width:${an.planGain / maxGain * 100}%"></b></div></div>
    </div>` : '');

  // advice, led by the user's focus
  const adv = [];
  if (an.planGain) adv.push(`<b>Free time first:</b> run the suggested plan, about ${fmtT(planTimeAt(an.best.plan, 200))} s at 200 m (now ${fmtT(planTimeAt(a.plan, 200))} s), for ${an.planGain.toFixed(2)} s.`);
  if (focusList.length) {
    focusList.slice(0, 2).forEach((x, i) => adv.push(`<b>${i === 0 ? 'Your main focus' : 'Also in your focus'}: ${x.L.name.toLowerCase()}</b> (${x.L.fmtSize(a.sizes[x.L.k])}, −${x.g.toFixed(2)} s). Typical work: ${x.L.train}.`));
    const other = byGain.find(x => !x.focus);
    if (other && topFocus && other.g > topFocus.g * 1.2 && other.g > 0.05) adv.push(`<b>Worth knowing:</b> ${other.L.name.toLowerCase()} is not in ${POS} focus, but would gain more (−${other.g.toFixed(2)} s).`);
  } else if (topAll && topAll.g > 0.01) {
    adv.push(`<b>Training priority: ${topAll.L.name.toLowerCase()}</b> (${topAll.L.fmtSize(a.sizes[topAll.L.k])}, −${topAll.g.toFixed(2)} s). Typical work: ${topAll.L.train}.`);
  }
  const fade = s[3] - Math.min(s[1], s[2]);
  adv.push(`The home straight is ${fade.toFixed(2)} s slower than the fastest 100 m. ${fade > 2.6 ? 'That is a heavy fade: the energy runs out too early.' : fade < 1.2 ? 'That is a very controlled finish, so there may be room to go out faster.' : 'Championship finalists typically fade by 1.3–2.5 s, so this is in the normal range.'}`);

  const segRows = ['0–100 m', '100–200 m', '200–300 m', '300–400 m'].map((n, i) => `<tr><td>${n}</td><td class="num">${a.plan ? fmtT(per100(a.plan)[i]) : '—'}</td><td class="num">${s[i].toFixed(2)}</td><td class="num">${sr ? sr[i].toFixed(2) : '—'}</td><td class="num ${deltas ? (deltas[i] > 0.005 ? 'delta-pos' : deltas[i] < -0.005 ? 'delta-neg' : '') : ''}">${deltas ? (deltas[i] >= 0 ? '+' : '−') + Math.abs(deltas[i]).toFixed(2) : '—'}</td></tr>`).join('');

  el.innerHTML = `
    ${state.restoredAt ? `<div class="note saved">Saved run from ${fmtWhen(state.restoredAt)}. Changes to priorities and goal are saved to this run. Changing the setup and pressing Run race adds a new run.</div>` : ''}
    <div class="export-bar"><button class="btn sm" data-export="png">Export image</button><button class="btn sm" data-export="pdf">Export PDF</button><span class="hint" id="exportStatus"></span></div>
    <div id="reportExport"><div id="exportHead" class="export-head"></div>
    <div class="verdict">
      <h3>${head}</h3>
      ${sub ? `<p>${sub}</p>` : ''}
      ${flag ? `<p class="flag">${flag}</p>` : ''}
      <div class="stats">
        <div class="big"><b style="color:${a.color === '#f7f8fa' ? 'var(--fg)' : a.color}">${fmtT(r.time)}</b><span>${nm} · place ${place} of ${order.length}</span></div>
        ${rr ? `<div class="big"><b>${fmtT(rr.time)}</b><span>${isGhost(ref) ? 'Ghost · ' : ''}${esc(ref.name)}</span></div>` : ''}
        <div class="big"><b>${fmtT(r.cum[1])}</b><span>at 200 m</span></div>
        <div class="big"><b>${fmtT(an.best.time)}</b><span>best possible with current fitness</span></div>
      </div>
    </div>
    <div class="card prio-card">
      <div class="card-h"><h3>${you ? 'Your' : nm + "'s"} priorities and levers</h3></div>
      <p class="hint" style="max-width:80ch">Mark what matters to ${you ? 'you' : nm} and how much each quality could realistically improve in the time available. Each gain re-runs the race with that one change. The verdict, the advice and the goal mix follow these choices.</p>
      <div class="prio-table">
        <div class="pr head"><span>Quality</span><span>Matters to ${you ? 'you' : nm}</span><span>Realistic improvement</span><span>Time gained</span></div>
        ${prioRows}
      </div>
      <div><button class="link-btn" id="resetSizes">Reset priorities</button></div>
    </div>
    <div class="coach-grid">
      <div class="card chart-card">
        <div class="card-h"><h3>Where time is won and lost</h3><span class="hint">${rr ? 'Band under the chart: ' + nm + ' against ' + esc(ref.name) + ', every 10 m' : 'Pick someone to compare against'}</span></div>
        <canvas id="speedChart" role="img" aria-label="Speed against distance for each athlete, with a band showing where time is gained or lost"></canvas>
        <div class="legend">${state.athletes.filter(x => state.results[x.id]).map(x => `<span><i style="background:${x.color};opacity:${x.id === a.id || x.id === state.ref ? 1 : .45}"></i>${esc(short(x.name))} ${fmtT(state.results[x.id].time)}</span>`).join('')}
          ${rr ? '<span><i class="zone" style="background:var(--bad)"></i>losing time</span><span><i class="zone" style="background:var(--good)"></i>gaining time</span>' : ''}</div>
      </div>
      <div class="card">
        <div class="card-h"><h3>What to work on</h3></div>
        <ul class="advice">${adv.map(t => `<li>${t}</li>`).join('')}</ul>
      </div>
    </div>
    <div class="card goal-card">
      <div class="card-h"><h3>Goal: what would it take?</h3></div>
      <div class="goal-row">
        <div class="field"><label for="goalT">Target time (s)</label><input class="inp mono" id="goalT" inputmode="decimal" value="${a.goal ? a.goal.toFixed(2) : (Math.floor((an.best.time - 0.5) * 10) / 10).toFixed(2)}"></div>
        <button class="btn primary" id="goalBtn">Find out</button>
        <span class="hint" id="goalStatus">From ${fmtT(an.best.time)} s, the best ${you ? 'you' : nm} can run now with the best plan.</span>
      </div>
      <div id="goalOut">${goalHTML(a, a.goalResult)}</div>
    </div>
    <details class="more">
      <summary>Split details</summary>
      <div class="tbl-wrap" style="margin-top:12px"><table>
        <thead><tr><th>Section</th><th class="num">Plan</th><th class="num">${esc(short(a.name))}</th><th class="num">${ref ? esc(short(ref.name)) : '—'}</th><th class="num">Δ</th></tr></thead>
        <tbody>${segRows}</tbody></table></div>
    </details></div>`;
  drawChart();
}
$('#coach').addEventListener('input', e => {
  const k = e.target.dataset.size; if (!k) return;
  const a = byId(state.focus);
  a.sizes[k] = +e.target.value; $('#szo_' + k).innerHTML = LEVER[k].fmtSize(a.sizes[k]);
});
$('#coach').addEventListener('change', e => {
  if (e.target.dataset.size) { byId(state.focus).goalResult = null; renderCoach(); scheduleRunUpdate(); }
});
$('#coach').addEventListener('click', e => {
  const pb = e.target.closest('[data-prio]');
  if (pb) { const a = byId(state.focus); a.prio[pb.dataset.prio] = pb.dataset.v; a.goalResult = null; renderCoach(); scheduleRunUpdate(); return; }
  if (e.target.id === 'resetSizes') { const a = byId(state.focus); a.sizes = defaultSizes(); a.prio = defaultPrio(); a.goalResult = null; renderCoach(); scheduleRunUpdate(); }
  if (e.target.id === 'goalBtn') runGoal();
  const ex = e.target.closest('[data-export]'); if (ex) exportReport(ex.dataset.export);
});

/* goal mode */
function goalLevers(a) {
  const focus = LEVERS.filter(L => L.k !== 'rt' && isFocus(a, L.k));
  const mixSet = (focus.length ? focus : LEVERS.filter(L => a.prio[L.k] !== 'skip'));
  return { solo: LEVERS.filter(L => L.k !== 'rt' && a.prio[L.k] !== 'skip'), mix: mixSet, mixLabel: focus.length ? 'Mix of your focus areas' : 'Mix of all your levers' };
}
function goalHTML(a, R) {
  const gl = goalLevers(a);
  const fx = (L, x) => L.k === 't90' ? x.toFixed(1) + '% quicker' : L.k === 'rt' ? '−' + x.toFixed(3) + ' s' : '+' + x.toFixed(1) + '%';
  const val = (L, x) => { const p = Object.assign({}, a.p, L.apply(a.p, x)); return L.k === 'vmax' ? ` · ${a.p.vmax.toFixed(2)} → ${p.vmax.toFixed(2)} m/s` : L.k === 'vo2' ? ` · ${Math.round(a.p.vo2)} → ${Math.round(p.vo2)}` : L.k === 'ac' ? ` · ${Math.round(a.p.ac)} → ${Math.round(p.ac)}` : ''; };
  if (R && R.already) return `<p class="hint">${esc(a.name)} can already run ${fmtT(R.base)} s with the best plan, so ${fmtT(R.g)} s needs no change in fitness.</p>`;
  const solo = gl.solo.map(L => {
    const o = R && R.solo ? R.solo.find(x => x.k === L.k) : null;
    const v = !o ? '—' : o.none ? 'not enough on its own' : `${fx(L, o.x)} ${L.goalName}${val(L, o.x)}`;
    return `<li class="${o && o.none ? 'no' : ''} ${!o ? 'empty-v' : ''}"><span>${L.name} alone</span><b>${v}</b></li>`;
  }).join('');
  let mix = '';
  if (gl.mix.length) {
    let v = '—', detail = '';
    if (R && R.mix) {
      if (R.mix.none) v = 'out of reach';
      else { v = R.mix.m.toFixed(1) + '× your realistic gains'; detail = R.mix.parts.map(p => `${fx(LEVER[p.k], p.x)} ${LEVER[p.k].goalName}`).join(', '); }
    }
    mix = `<li class="mix ${R && R.mix && R.mix.none ? 'no' : ''} ${!R ? 'empty-v' : ''}"><span>${gl.mixLabel}${detail ? ': ' + detail : ''}</span><b>${v}</b></li>`;
  }
  const foot = R && R.mix && !R.mix.none ? `<p class="hint">${R.mix.m <= 1.05 ? 'The mix fits inside what you set as realistic.' : `That is ${R.mix.m.toFixed(1)} times what you set as realistic, so expect about ${Math.ceil(R.mix.m)} training blocks of that size.`}</p>` : '';
  return `<ul class="goal-list">${solo}${mix}</ul>${foot}`;
}
const tick = () => new Promise(res => setTimeout(res, 0));
async function runGoal() {
  const a = byId(state.focus); const g = parseFloat($('#goalT').value.replace(',', '.'));
  const status = $('#goalStatus');
  if (!(g > 30 && g < 90)) { status.textContent = 'Enter a target between 30 and 90 s.'; status.style.color = 'var(--warn)'; return; }
  a.goal = g;
  const env = envFor(a), base = a._an ? a._an.best.time : M.bestPlan(a.p, env, a.lane, a.sex, true).time;
  if (g >= base - 0.005) { a.goalResult = { already: true, base, g }; $('#goalOut').innerHTML = goalHTML(a, a.goalResult); scheduleRunUpdate(); return; }
  status.textContent = 'Working it out…'; status.style.color = ''; $('#goalBtn').disabled = true;
  const gl = goalLevers(a);
  const job = { p: a.p, env, lane: a.lane, sex: a.sex, g, solo: gl.solo.map(L => L.k), mix: gl.mix.map(L => L.k), sizes: a.sizes };
  let out;
  try { out = await goalInWorker(job); } catch (e) { await tick(); out = goalCompute(job, M); }
  const { solo, mix } = out;
  a.goalResult = { g, base, solo, mix };
  const b = $('#goalBtn'); if (b) b.disabled = false;
  if (status) status.textContent = `From ${fmtT(base)} s to ${fmtT(g)} s:`;
  $('#goalOut').innerHTML = goalHTML(a, a.goalResult);
  scheduleRunUpdate();
}


// The goal search runs many simulations, so it runs in a background worker to keep the page responsive.
function goalCompute(job, Mod) {
  const AP = { vmax: (p, x) => ({ vmax: p.vmax * (1 + x / 100) }), ac: (p, x) => ({ ac: p.ac * (1 + x / 100) }), vo2: (p, x) => ({ vo2: p.vo2 * (1 + x / 100) }), t90: (p, x) => ({ t90: p.t90 * (1 - x / 100) }), rt: (p, x) => ({ rt: Math.max(0.1, p.rt - x) }) };
  const t = p => Mod.bestPlan(p, job.env, job.lane, job.sex, true).time;
  const solo = [];
  for (const k of job.solo) {
    const lim = k === 't90' ? 40 : 50;
    if (t(Object.assign({}, job.p, AP[k](job.p, lim))) > job.g) { solo.push({ k, none: true }); continue; }
    solo.push({ k, x: Mod.bisect(x => t(Object.assign({}, job.p, AP[k](job.p, x))), 0, lim, job.g, 11, false) });
  }
  let mix = null;
  if (job.mix.length) {
    const applyAll = m => { const p = Object.assign({}, job.p); for (const k of job.mix) Object.assign(p, AP[k](p, job.sizes[k] * m)); return p; };
    if (t(applyAll(8)) <= job.g) { const m = Mod.bisect(m => t(applyAll(m)), 0, 8, job.g, 12, false); mix = { m, parts: job.mix.map(k => ({ k, x: job.sizes[k] * m })) }; }
    else mix = { none: true };
  }
  return { solo, mix };
}
let goalWorker = null;
function goalInWorker(job) {
  return new Promise((resolve, reject) => {
    try {
      if (!goalWorker) {
        const src = document.getElementById('modelSrc').textContent + '\n' + goalCompute.toString() + '\nonmessage = e => postMessage(goalCompute(e.data, self.RaceModel));';
        goalWorker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
      }
      const w = goalWorker;
      const timer = setTimeout(() => { w.terminate(); goalWorker = null; reject(new Error('timeout')); }, 30000);
      w.onmessage = e => { clearTimeout(timer); resolve(e.data); };
      w.onerror = err => { clearTimeout(timer); goalWorker = null; reject(err); };
      w.postMessage(JSON.parse(JSON.stringify(job)));
    } catch (e) { reject(e); }
  });
}
