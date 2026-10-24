
/* ---------------- Editor ---------------- */
function laneOptions(a) {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].map(l => {
    const taken = lanesUsed().find(o => o.lane === l && o.id !== a.id);
    return `<option value="${l}" ${l === a.lane ? 'selected' : ''} ${taken ? 'disabled' : ''}>Lane ${l}${taken ? ' · ' + esc(short(taken.name)) : ''}</option>`;
  }).join('');
}
function presetEditor() {
  return `<details class="inline" id="presetEdit"${state.presetOpen ? ' open' : ''}><summary>Adjust the typical profiles</summary>
    <div class="prio">
      <p class="hint">Set the times each typical profile should run. The tool refits its top speed and anaerobic capacity to match. Athletes already on the track keep their metrics. Remembered in this browser.</p>
      <div class="preset-grid">
        <span class="lbl">Profile</span><span class="lbl">100 m</span><span class="lbl">400 m</span>
        ${Object.entries(PRESETS).map(([k, v]) => `
          <span>${v.label}</span>
          <input class="inp mono" data-preset="${k}" data-pb="100" inputmode="decimal" aria-label="${v.label} 100 m time" value="${fmtT(PRESET_100[k])}">
          <input class="inp mono" data-preset="${k}" data-pb="400" inputmode="decimal" aria-label="${v.label} 400 m time" value="${fmtT(PRESET_T[k])}">`).join('')}
      </div>
      ${state.presetMsg ? `<div class="note ${state.presetWarn ? 'warn' : ''}">${state.presetMsg}</div>` : ''}
      <div><button class="btn" id="presetReset">Restore default times</button></div>
    </div></details>`;
}
function renderEditor() {
  const a = byId(state.sel); const ed = $('#editor');
  if (!a) { ed.innerHTML = ''; return; }
  const kindName = a.isMe ? 'Your profile' : isGhost(a) ? 'Ghost' : a.kind === 'real' ? 'Real athlete' : a.kind === 'rec' ? 'Recorded run' : a.kind === 'past' ? 'Past simulation' : 'Created profile';
  const head = `<div class="sec-h"><span class="eyebrow"><span class="dot ${isGhost(a) ? 'ghost-dot' : ''}" style="${isGhost(a) ? 'border-color' : 'background'}:${a.color}"></span>${kindName}</span></div>`;
  const ghostNote = isGhost(a) ? `<div class="note">This see-through runner shares lane ${a.lane} with ${esc(ownerOf(a).name)}, so you can watch the two race each other. Remove it with × in the Lanes list.</div>` : '';
  const laneField = label => isGhost(a) ? '' : `<div class="field"><label for="athLane">${label}</label><select class="inp" id="athLane">${laneOptions(a)}</select></div>`;
  const ghostBox = isGhost(a) ? '' : `<div class="ghost-box"><b>Race against a past run</b><span>Add a see-through ghost of a recorded run or a saved simulation in ${esc(a.name)}'s lane.</span><div><button class="btn" id="ghostBtn">Choose a ghost</button></div></div>`;
  if (a.kind === 'rec' || a.kind === 'past') {
    const per = per100(a.plan);
    ed.innerHTML = head + `
      <div><b style="font-size:16px">${esc(a.name)}</b><br><span class="hint">${a.kind === 'rec' ? fmtDay(a.recInfo.date) + ' · ' + (a.recInfo.source === 'gps' ? 'GPS watch' : a.recInfo.source === 'gates' ? 'Timing gates' : 'Split times') + (a.recInfo.approx ? ' (approximate)' : '') : 'Saved simulation from ' + esc(a.pastInfo.when)}</span></div>
      ${ghostNote}${laneField('Lane')}
      <dl class="kv">
        <dt>${a.kind === 'rec' ? 'Recorded time' : 'Time in that run'}</dt><dd>${a.kind === 'rec' ? fmtT(a.recInfo.total) : a.pastInfo.time.toFixed(2)}</dd>
        <dt>Per 100 m</dt><dd>${per.map(fmtT).join(' · ')}</dd>
        <dt>Top speed${a.kind === 'rec' ? ' (estimate)' : ''}</dt><dd>${a.p.vmax.toFixed(2)} m/s</dd>
        <dt>Anaerobic capacity${a.kind === 'rec' ? ' (estimate)' : ''}</dt><dd>${Math.round(a.p.ac)} / 100</dd>
        <dt>Body</dt><dd>${a.p.mass.toFixed(1)} kg · ${Math.round(a.p.height * 100)} cm</dd>
      </dl>
      <p class="hint">${a.kind === 'rec' ? 'Runs its recorded splits again in the simulator, with the profile fitted to them.' : 'Runs exactly as it did in that simulation, with that run\'s conditions.'}</p>
      <div><button class="btn" id="cloneBtn">Make an editable copy</button></div>${ghostBox}`;
    return;
  }
  if (a.kind === 'real') {
    const r = raceById(a.real.raceId), c = a.real.splits;
    ed.innerHTML = head + `
      <div><b style="font-size:16px">${esc(a.name)}</b> <span class="hint">${a.real.nat}</span><br><span class="hint">${esc(r.champ)}, ${esc(r.city)} ${r.year} · ${r.sex === 'M' ? "men's" : "women's"} ${r.round.toLowerCase()} · place ${a.real.place}</span></div>
      ${ghostNote}${laneField('Lane in this race')}
      ${a.laneNote ? `<div class="note warn">${esc(a.laneNote)}</div>` : ''}
      <dl class="kv">
        <dt>Official time</dt><dd>${fmtT(c[3])}</dd>
        <dt>At 100 / 200 / 300 m</dt><dd>${c.slice(0, 3).map(fmtT).join(' / ')}</dd>
        <dt>Per 100 m</dt><dd>${per100(a.plan).map(fmtT).join(' · ')}</dd>${a.real.s50 ? `<dt>50 m splits</dt><dd>published</dd>` : ''}
        <dt>Reaction time</dt><dd>${a.p.rt.toFixed(3)}</dd>
        <dt>Raced in lane</dt><dd>${a.origLane}</dd>
        <dt>Conditions</dt><dd>${r.temp != null ? r.temp + '°C · ' + r.hum + '%' : 'not recorded'} · ${r.alt} m</dd>
        <dt>Top speed (estimate)</dt><dd>${a.p.vmax.toFixed(2)} m/s</dd>
        <dt>Anaerobic capacity (estimate)</dt><dd>${Math.round(a.p.ac)} / 100</dd>
      </dl>
      <p class="hint">Estimates come from fitting the model to the real splits (within ${a.real.fitErr.toFixed(2)} s). Body size is set to a typical finalist.</p>
      <div><button class="btn" id="cloneBtn">Make an editable copy</button></div>${ghostBox}`;
    return;
  }
  const presetOpts = `<option value="">Load a typical profile…</option>` + Object.entries(PRESETS).map(([k, v]) => `<option value="${k}">${v.label} (~${fmtT(PRESET_T[k])})</option>`).join('');
  let body = '';
  if (a.mode === 'metrics') {
    body = METRICS.map(m => m.group ? `<div class="group-t">${m.group}</div>` : `
      <div class="metric">
        <div class="metric-top"><label for="m_${m.k}">${m.label}</label><output id="o_${m.k}">${m.fmt(a.p[m.k])}</output></div>
        <input type="range" id="m_${m.k}" data-k="${m.k}" min="${m.min}" max="${m.max}" step="${m.step}" value="${a.p[m.k]}" style="--acc:${a.color}">
        ${m.hint ? `<p class="hint">${m.hint}</p>` : ''}
      </div>`).join('');
    body = body.replace('<div class="group-t">Speed</div>', `<label class="check"><input type="checkbox" id="keepStr" ${a.keepStrength ? 'checked' : ''}> Same strength when body mass changes</label>
      <p class="hint">${a.keepStrength ? 'On: moving body mass also changes top speed, anaerobic capacity and VO₂max, as if the same muscles moved a lighter or heavier body. An approximation.' : 'Off: body mass only changes air drag.'}</p><div class="group-t">Speed</div>`);
  } else if (a.mode === 'pb') {
    body = `
      <p class="hint">Enter real personal bests. The tool keeps this athlete's body, acceleration, reaction and VO₂max, and fits top speed and anaerobic capacity so the model reproduces both times.</p>
      <div class="row2">
        <div class="field"><label for="pb100">100 m PB (s)</label><input class="inp" id="pb100" inputmode="decimal" placeholder="e.g. 10.90" value="${esc(a.pb100)}"></div>
        <div class="field"><label for="pb400">400 m PB (s)</label><input class="inp" id="pb400" inputmode="decimal" placeholder="e.g. 48.50" value="${esc(a.pb400)}"></div>
      </div>
      <div><button class="btn" id="estBtn">Estimate profile</button></div>
      ${a.pbMsg ? `<div class="note ${a.pbWarn ? 'warn' : ''}">${a.pbMsg}</div>` : ''}`;
  } else {
    ensurePlan(a);
    let c = 0; const cum = a.plan.map(x => (c += x));
    body = `
      <p class="hint">Target time for each 100 m. The athlete runs to these targets for as long as the energy lasts. The first 100 m is timed from the gun.</p>
      <div class="row4">${a.plan.map((x, i) => `<div class="field"><label for="pl${i}">${i * 100}–${(i + 1) * 100}</label><input class="inp mono" id="pl${i}" data-plan="${i}" inputmode="decimal" value="${x.toFixed(2)}"></div>`).join('')}</div>
      <p class="hint">At 100 / 200 / 300 m: ${cum.slice(0, 3).map(fmtT).join(' / ')} · target ${fmtT(cum[3])} s</p>
      <label class="check"><input type="checkbox" id="allOut" ${a.allOutFinish ? 'checked' : ''}> All-out from 300 m (ignore the last target)</label>
      <div class="note explain">
        <b>Suggested plan</b>
        <span>Fills in the four targets for you: the fastest plan this athlete can hold to 300 m, shaped like the splits of Olympic and World finalists (a fast second 100 m, then a controlled slowdown).</span>
        <div><button class="btn" id="suggestBtn">Fill in the suggested plan</button></div>
        ${a.planAuto ? '<span class="state-ok">● Using the suggested plan. It updates when you change the metrics, until you edit a target yourself.</span>' : '<span>● Using your own targets.</span>'}
      </div>
      ${a.planNote ? `<div class="note good">${a.planNote}</div>` : ''}`;
  }
  ed.innerHTML = head + `
    <div class="row2">
      <div class="field"><label for="athName">Name</label><input class="inp" id="athName" value="${esc(a.name)}" maxlength="24"></div>
      <div class="field"><label for="athLane">Lane</label><select class="inp" id="athLane">${laneOptions(a)}</select></div>
    </div>
    <div class="row2">
      <div class="field"><label for="athSex">Category</label><select class="inp" id="athSex"><option value="M" ${a.sex === 'M' ? 'selected' : ''}>Men</option><option value="W" ${a.sex === 'W' ? 'selected' : ''}>Women</option></select></div>
      <div class="field"><label for="athPreset">Starting point</label><select class="inp" id="athPreset">${presetOpts}</select></div>
    </div>
    ${presetEditor()}
    <div class="seg-ctl" role="tablist">
      <button role="tab" data-mode="metrics" aria-selected="${a.mode === 'metrics'}">Metrics</button>
      <button role="tab" data-mode="pb" aria-selected="${a.mode === 'pb'}">From PBs</button>
      <button role="tab" data-mode="plan" aria-selected="${a.mode === 'plan'}">Race plan</button>
    </div>
    ${body}${ghostBox}`;
}
$('#editor').addEventListener('input', e => {
  const a = byId(state.sel); const t = e.target;
  if (t.dataset.k) {
    const k = t.dataset.k; a.p[k] = +t.value; const m = METRICS.find(x => x.k === k); $('#o_' + k).innerHTML = m.fmt(a.p[k]); a.planNote = null;
    if (a.keepStrength) {
      const b = a.keepStrength;
      if (k === 'mass') {
        // same muscles, different body: top speed ~ (m0/m)^(1/3); per-kg energy and VO2max ~ m0/m
        const r = b.m0 / a.p.mass;
        a.p.vmax = +(b.vmax0 * Math.pow(r, 1 / 3)).toFixed(2); a.p.ac = +(b.ac0 * r).toFixed(1); a.p.vo2 = +(b.vo20 * r).toFixed(1);
        for (const kk of ['vmax', 'ac', 'vo2']) { const mm = METRICS.find(x => x.k === kk); const inp = $('#m_' + kk); if (inp) inp.value = a.p[kk]; const o = $('#o_' + kk); if (o) o.innerHTML = mm.fmt(a.p[kk]); }
      } else a.keepStrength = { m0: a.p.mass, vmax0: a.p.vmax, ac0: a.p.ac, vo20: a.p.vo2 };
    }
    markStale();
  }
  else if (t.id === 'athName') { a.name = t.value || 'Athlete'; document.querySelectorAll('.ath').forEach(r => { if (+r.dataset.id === a.id) r.querySelector('.nm b').textContent = a.name; }); refreshSelectors(); rebuildLabels(); }
  else if (t.id === 'pb100') a.pb100 = t.value;
  else if (t.id === 'pb400') a.pb400 = t.value;
});
$('#editor').addEventListener('change', e => {
  const a = byId(state.sel); const t = e.target;
  if (t.id === 'athLane') { a.lane = +t.value; a.laneNote = null; markStale(); renderList(); renderEditor(); rebuildRunners(); }
  if (t.id === 'athSex') { a.sex = t.value; markStale(); renderList(); }
  if (t.id === 'athPreset' && t.value) { a.p = Object.assign({}, PRESETS[t.value].p); a.sex = PRESETS[t.value].sex; a.planAuto = true; a.planNote = null; a.mode = 'metrics'; markStale(); renderEditor(); renderList(); rebuildRunners(); }
  if (t.dataset.plan != null) {
    const v = parseFloat(t.value.replace(',', '.'));
    if (v >= 9 && v <= 30) { a.plan[+t.dataset.plan] = Math.round(v * 100) / 100; a.planAuto = false; a.planNote = null; markStale(); }
    renderEditor();
  }
  if (t.id === 'allOut') { a.allOutFinish = t.checked; markStale(); }
  if (t.id === 'keepStr') { a.keepStrength = t.checked ? { m0: a.p.mass, vmax0: a.p.vmax, ac0: a.p.ac, vo20: a.p.vo2 } : null; renderEditor(); }
  if (t.dataset.preset) editPreset(t.dataset.preset, t.dataset.pb, t.value);
});
$('#editor').addEventListener('toggle', e => { if (e.target.id === 'presetEdit') state.presetOpen = e.target.open; }, true);
$('#editor').addEventListener('click', e => {
  const a = byId(state.sel);
  const tab = e.target.closest('[data-mode]');
  if (tab) { a.mode = tab.dataset.mode; renderEditor(); return; }
  if (e.target.id === 'estBtn') estimate(a);
  if (e.target.id === 'suggestBtn') suggest(a);
  if (e.target.id === 'presetReset') {
    for (const k in PRESETS) { PRESETS[k].p = Object.assign({}, PRESET_DEFAULTS[k].p); refreshPresetTimes(k); }
    savePresets(); state.presetMsg = 'Default times restored.'; state.presetWarn = false; renderEditor();
  }
  if (e.target.id === 'ghostBtn') {
    state.picker = null; renderPicker();
    state.pastPicker = { ghostFor: a.id }; renderPastPicker();
    const side = $('#side'); if (side) side.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  if (e.target.id === 'cloneBtn') {
    const lane = freeLane(); if (!lane) { a.laneNote = 'All nine lanes are taken. Remove someone to add a copy.'; renderEditor(); return; }
    const c = mkCustom('My ' + short(a.name), 'natM', lane, freeColor());
    c.p = Object.assign({}, a.p); c.sex = a.sex; c.plan = per100(a.plan).map(x => Math.round(x * 100) / 100); c.planAuto = false; c.mode = 'metrics';
    state.athletes.push(c); state.sel = c.id; markStale(); renderList(); renderEditor(); rebuildRunners(); refreshSelectors();
  }
});

function suggest(a) {
  const env = envFor(a);
  const before = a.plan ? { plan: a.plan.slice(), time: M.simulate(runner(a), env, { lane: a.lane, record: false }).time } : null;
  const best = M.bestPlan(a.p, env, a.lane, a.sex);
  a.plan = best.plan; a.planAuto = true; a.allOutFinish = true;
  const same = before && before.plan.every((x, i) => Math.abs(x - best.plan[i]) < 0.005);
  a.planNote = same
    ? `This is already the suggested plan: ${best.plan.map(fmtT).join(' / ')}, projected ${fmtT(best.time)} s.`
    : `Targets set to ${best.plan.map(fmtT).join(' / ')}. Projected ${fmtT(best.time)} s${before ? ` (${fmtT(before.time)} s with the previous plan, ${before.plan.map(fmtT).join(' / ')})` : ''}. Press Run race to see it.`;
  markStale(); renderEditor();
}

function editPreset(k, which, raw) {
  const v = parseFloat(String(raw).replace(',', '.'));
  const pr = PRESETS[k];
  const p1 = which === '100' ? v : PRESET_100[k], p4 = which === '400' ? v : PRESET_T[k];
  state.presetWarn = true;
  if (!(p1 >= 9.4 && p1 <= 16) || !(p4 >= 42 && p4 <= 80) || p4 < p1 * 4) { state.presetMsg = 'Use a 100 m time between 9.40 and 16.00 s and a 400 m time between 42.00 and 80.00 s.'; renderEditor(); return; }
  const est = M.estimateFromPBs(pr.p, p1, p4, pr.sex);
  pr.p.vmax = Math.round(est.vmax * 100) / 100; pr.p.ac = Math.round(est.ac * 10) / 10;
  refreshPresetTimes(k); savePresets();
  state.presetWarn = false;
  state.presetMsg = `${pr.label} now runs about ${fmtT(PRESET_100[k])} s for 100 m and ${fmtT(PRESET_T[k])} s for 400 m.`;
  renderEditor();
}

function estimate(a) {
  const p1 = parseFloat(String(a.pb100).replace(',', '.')), p4 = parseFloat(String(a.pb400).replace(',', '.'));
  a.pbWarn = false;
  if (!(p1 >= 9.4 && p1 <= 16)) { a.pbMsg = 'Enter a 100 m time between 9.40 and 16.00 s.'; a.pbWarn = true; renderEditor(); return; }
  if (!(p4 >= 42 && p4 <= 80)) { a.pbMsg = 'Enter a 400 m time between 42.00 and 80.00 s.'; a.pbWarn = true; renderEditor(); return; }
  if (p4 < p1 * 4) { a.pbMsg = 'The 400 m time must be slower than four times the 100 m time.'; a.pbWarn = true; renderEditor(); return; }
  const est = M.estimateFromPBs(a.p, p1, p4, a.sex);
  const acRaw = est.ac;
  a.p.vmax = Math.round(est.vmax * 100) / 100;
  a.p.ac = Math.max(30, Math.min(160, Math.round(acRaw)));
  a.planAuto = true; a.plan = null; a.planNote = null;
  const check = M.bestPlan(a.p, {}, 4, a.sex).time;
  a.pbMsg = `Fitted top speed <b>${a.p.vmax.toFixed(2)} m/s</b> and anaerobic capacity <b>${a.p.ac}</b>. Model check in still air, lane 4: 100 m ${M.simplePB100(a.p).toFixed(2)} s, 400 m ${check.toFixed(2)} s. The race plan is reset to the suggested plan.`;
  if (acRaw < 30.5 || acRaw > 159.5) { a.pbWarn = true; a.pbMsg += ' These PBs sit outside the model\'s usual range, so treat the fit with care.'; }
  markStale(); renderEditor();
}

function markStale() { state.stale = true; $('#runBtn').classList.add('stale'); $('#runBtn').textContent = 'Run race · updated'; }
