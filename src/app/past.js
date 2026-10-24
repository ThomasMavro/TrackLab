
/* ---------------- Past runs: saved simulations and recorded runs as runners or ghosts ---------------- */
function runFocusSnap(run) {
  const cfg = JSON.parse(run.cfg);
  const c = cfg.athletes[cfg.focusIdx] || cfg.athletes.find(x => x.isMe) || cfg.athletes[0];
  return { cfg, c };
}
const shortWhen = iso => { const d = new Date(iso); return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }); };
function mkPast(run, lane, colorIdx) {
  const { cfg, c } = runFocusSnap(run);
  const a = athleteFromSnap(c, lane, colorIdx);
  if (a.kind === 'custom') {
    a.kind = 'past'; a.planAuto = false;
    if (!a.plan) a.plan = M.suggestPlan(a.p, cfg.env, lane, a.sex);
    a.envOverride = Object.assign({}, cfg.env);
  }
  a.isMe = false; a.ghostOf = null;
  a.pastInfo = { when: shortWhen(run.createdAt), runId: run.id, time: run.focusTime };
  a.name = c.name;
  return a;
}
function recById(id) { return Store.items.find(x => x.id === id && x.type === 'rec'); }
function makerFor(kind, id) {
  if (kind === 'rec') { const rec = recById(id); return rec ? (lane, col) => mkRec(rec, lane, col) : null; }
  const run = Store.items.find(x => x.id === id && x.type === 'run');
  return run ? (lane, col) => mkPast(run, lane, col) : null;
}
function addAsLane(kind, id) {
  const make = makerFor(kind, id); const lane = freeLane(); if (!make || !lane) return;
  const a = make(lane, freeColor()); state.athletes.push(a); afterAdd(a);
}
function addGhost(ownerId, kind, id) {
  const owner = byId(ownerId), make = makerFor(kind, id); if (!owner || !make) return;
  state.athletes = state.athletes.filter(g => g.ghostOf !== ownerId); // one ghost per athlete
  const g = make(owner.lane, owner.colorIdx);
  g.ghostOf = owner.id; g.color = owner.color; g.isMe = false;
  state.athletes.push(g);
  state.ref = g.id; state.focus = owner.id;
  markStale(); renderList(); renderEditor(); rebuildRunners(); refreshSelectors();
}

$('#addPast').addEventListener('click', () => {
  if (state.pastPicker) { state.pastPicker = null; renderPastPicker(); return; }
  state.picker = null; renderPicker();
  const owner = byId(state.sel);
  state.pastPicker = { ghostFor: owner && !isGhost(owner) ? owner.id : (state.athletes.find(a => a.isMe) || state.athletes[0]).id };
  renderPastPicker();
});
function renderPastPicker() {
  const el = $('#pastPicker');
  if (!state.pastPicker) { el.hidden = true; el.innerHTML = ''; return; }
  const pp = state.pastPicker;
  const recs = Store.items.filter(x => x.type === 'rec').sort((a, b) => b.date.localeCompare(a.date));
  const runs = Store.items.filter(x => x.type === 'run').sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 30);
  const sess = id => { const s = Store.items.find(x => x.id === id); return s ? s.name : ''; };
  const full = lanesUsed().length >= 9;
  const owners = lanesUsed();
  const row = (kind, id, title, sub, time) => `<li class="past-item">
      <span class="pi-t"><b>${title}</b><small>${sub}</small></span><span class="tm">${time}</span>
      <span class="pi-a"><button class="btn sm" data-past-lane="${kind}|${id}" ${full ? 'disabled' : ''}>Add to a lane</button><button class="btn sm" data-past-ghost="${kind}|${id}">Ghost</button></span>
    </li>`;
  el.hidden = false;
  el.innerHTML = `<div class="picker">
    <p class="hint">Bring back a run as a new lane, or as a see-through <b>ghost</b> in the same lane as an athlete, so they race their past self.</p>
    <div class="field"><label for="ghostFor">Ghost runs in the lane of</label><select class="inp" id="ghostFor">${owners.map(a => `<option value="${a.id}" ${a.id === pp.ghostFor ? 'selected' : ''}>${esc(a.name)} · lane ${a.lane}</option>`).join('')}</select></div>
    <div class="group-t">Recorded runs</div>
    ${recs.length ? `<ul class="past-list">${recs.map(r => row('rec', r.id, esc(r.name), fmtDay(r.date) + ' · ' + srcLabel(r), fmtT(r.marks[r.marks.length - 1]))).join('')}</ul>`
      : '<p class="hint">None yet. Add one in History → Recorded runs (typed splits, a CSV, or a GPS watch file).</p>'}
    <div class="group-t">Saved simulations</div>
    ${runs.length ? `<ul class="past-list">${runs.map(r => row('run', r.id, esc(r.focusName), esc(sess(r.sessionId)) + ' · ' + shortWhen(r.createdAt), r.focusTime.toFixed(2))).join('')}</ul>`
      : '<p class="hint">None yet. Every press of Run race is saved here.</p>'}
    <div><button class="btn" id="pastCancel">Close</button></div>
  </div>`;
}
$('#pastPicker').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.id === 'pastCancel') { state.pastPicker = null; renderPastPicker(); return; }
  if (b.dataset.pastLane) { const [k, id] = b.dataset.pastLane.split('|'); addAsLane(k, id); state.pastPicker = null; renderPastPicker(); }
  if (b.dataset.pastGhost) { const [k, id] = b.dataset.pastGhost.split('|'); addGhost(state.pastPicker.ghostFor, k, id); state.pastPicker = null; renderPastPicker(); }
});
$('#pastPicker').addEventListener('change', e => { if (e.target.id === 'ghostFor') state.pastPicker.ghostFor = +e.target.value; });
