
/* ---------------- History: sessions, saved runs and recorded runs ---------------- */
// Kept in the viewer's private artifact storage when available, otherwise in this browser.
const Store = {
  mode: 'memory', items: [], db: null, uid: null, chain: Promise.resolve(), error: null,
  col() { return this.db.collection('data/users/' + this.uid); },
  put(item) {
    const i = this.items.findIndex(x => x.id === item.id);
    if (i >= 0) this.items[i] = item; else this.items.push(item);
    this.chain = this.chain.then(() => this.mode === 'db' ? this.col().doc(item.id).set(item) : this.saveLocal())
      .then(() => { this.error = null; }).catch(e => { this.error = (e && e.message) || 'Could not save'; renderHistory(); });
    return this.chain;
  },
  del(id) {
    this.items = this.items.filter(x => x.id !== id);
    this.chain = this.chain.then(() => this.mode === 'db' ? this.col().doc(id).delete() : this.saveLocal()).catch(() => {});
    return this.chain;
  },
  saveLocal() {
    try { localStorage.setItem('raceLabHistory', JSON.stringify(this.items)); this.mode = 'local'; }
    catch (e) { this.mode = 'memory'; }
  },
};
async function initStore() {
  try { const raw = localStorage.getItem('raceLabHistory'); Store.items = raw ? JSON.parse(raw) : []; Store.mode = 'local'; }
  catch (e) { Store.items = []; Store.mode = 'memory'; }
  renderHistory();
  if (!window.claude || typeof window.claude.use !== 'function') return;
  try {
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    if (!db || !user) return;
    const id = await user.id(); if (!id) return;
    Store.db = db; Store.uid = id;
    const snap = await Store.col().get();
    const remote = snap.docs.map(d => Object.assign({}, d.data()));
    const known = new Set(remote.map(x => x.id));
    const localOnly = Store.items.filter(x => !known.has(x.id));
    Store.mode = 'db'; Store.items = remote;
    for (const it of localOnly) await Store.put(it); // move items made in this browser into the account store
    try { localStorage.removeItem('raceLabHistory'); } catch (e) { /* ignore */ }
    renderHistory(); renderPastPicker();
  } catch (e) { /* keep browser storage */ }
}
const newId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function fmtWhen(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
}
function newSession() {
  const s = { id: newId('s_'), type: 'session', name: 'Session · ' + new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), createdAt: new Date().toISOString() };
  state.sessionId = s.id; state.currentRunId = null;
  Store.put(s); renderHistory();
  return s;
}

/* ---- snapshots of the whole dashboard ---- */
function snapAthlete(a) {
  const goalOut = R => !R ? null : R.already ? { already: true, base: R.base, g: R.g } : { g: R.g, base: R.base, solo: R.solo, mix: R.mix };
  return {
    kind: a.kind, name: a.name, lane: a.lane, colorIdx: a.colorIdx, sex: a.sex, isMe: !!a.isMe,
    p: a.p, plan: a.plan, planAuto: a.planAuto, allOutFinish: a.allOutFinish, keepStrength: a.keepStrength || null,
    real: a.real ? { raceId: a.real.raceId, idx: a.real.idx } : null,
    recId: a.recId || null, recInfo: a.recInfo || null, pastInfo: a.pastInfo || null, envOverride: a.envOverride || null,
    ghostOfIdx: isGhost(a) ? state.athletes.findIndex(x => x.id === a.ghostOf) : -1,
    sizes: a.sizes, prio: a.prio, goal: a.goal || null, goalResult: goalOut(a.goalResult), laneNote: a.laneNote || null,
  };
}
function snapshot() {
  return {
    v: 2, env: Object.assign({}, state.env), track: state.track,
    focusIdx: state.athletes.findIndex(a => a.id === state.focus),
    refIdx: state.athletes.findIndex(a => a.id === state.ref),
    selIdx: state.athletes.findIndex(a => a.id === state.sel),
    athletes: state.athletes.map(snapAthlete),
  };
}
function athleteFromSnap(c, lane, colorIdx) {
  lane = lane != null ? lane : c.lane; colorIdx = colorIdx != null ? colorIdx : c.colorIdx;
  let a;
  if (c.kind === 'real' && c.real && raceById(c.real.raceId)) a = mkReal(c.real.raceId, c.real.idx, lane, colorIdx);
  else {
    a = mkCustom(c.name, 'natM', lane, colorIdx);
    Object.assign(a, { kind: c.kind || 'custom', sex: c.sex, p: Object.assign({}, c.p), plan: c.plan ? c.plan.slice() : null, planAuto: c.planAuto, allOutFinish: c.allOutFinish,
      recId: c.recId || undefined, recInfo: c.recInfo || undefined, pastInfo: c.pastInfo || undefined, envOverride: c.envOverride || undefined, keepStrength: c.keepStrength || undefined });
  }
  a.isMe = !!c.isMe; a.lane = lane;
  a.sizes = Object.assign(defaultSizes(), c.sizes); a.prio = Object.assign(defaultPrio(), c.prio);
  a.goal = c.goal; a.goalResult = c.goalResult; a.laneNote = c.laneNote;
  return a;
}
function restore(cfg) {
  state.athletes = cfg.athletes.map(c => athleteFromSnap(c));
  cfg.athletes.forEach((c, i) => { if (c.ghostOfIdx != null && c.ghostOfIdx >= 0 && state.athletes[c.ghostOfIdx]) { state.athletes[i].ghostOf = state.athletes[c.ghostOfIdx].id; state.athletes[i].color = state.athletes[c.ghostOfIdx].color; } });
  if (!state.athletes.some(a => a.isMe)) { const c = state.athletes.find(a => a.kind === 'custom'); if (c) c.isMe = true; }
  Object.assign(state.env, cfg.env || {}); state.track = cfg.track || 'red';
  document.querySelectorAll('[data-track]').forEach(x => x.setAttribute('aria-pressed', x.dataset.track === state.track)); paintTrack();
  renderEnv();
  state.sel = (state.athletes[cfg.selIdx] || state.athletes[0]).id;
  state.picker = null; state.pastPicker = null; renderPicker(); renderPastPicker();
  renderList(); renderEditor();
  runRace({ restore: true, focusIdx: cfg.focusIdx, refIdx: cfg.refIdx });
}

function runSummary() {
  const f = byId(state.focus), ref = state.ref ? byId(state.ref) : null;
  return { focusName: f.name, focusTime: +state.results[f.id].time.toFixed(2), refName: ref ? (isGhost(ref) ? 'ghost ' + ref.name : ref.name) : null, refTime: ref ? +state.results[ref.id].time.toFixed(2) : null, runners: state.athletes.length };
}
function saveNewRun() {
  if (!state.sessionId || !Store.items.some(x => x.id === state.sessionId)) newSession();
  const item = Object.assign({ id: newId('r_'), type: 'run', sessionId: state.sessionId, createdAt: new Date().toISOString() }, runSummary(), { cfg: JSON.stringify(snapshot()) });
  state.currentRunId = item.id;
  Store.put(item); renderHistory();
}
let runUpdTimer = null;
function scheduleRunUpdate() {
  if (!state.currentRunId || !state.results) return;
  clearTimeout(runUpdTimer);
  runUpdTimer = setTimeout(() => {
    const cur = Store.items.find(x => x.id === state.currentRunId); if (!cur) return;
    Store.put(Object.assign({}, cur, runSummary(), { cfg: JSON.stringify(snapshot()) }));
    renderHistory();
  }, 700);
}

/* ---- recorded runs (uploads and typed results) ---- */
const srcLabel = r => r.source === 'gps' ? 'GPS watch' : r.source === 'gates' ? 'Timing gates' : 'Split times';
function blankRecForm() {
  const me = state.athletes.find(a => a.isMe) || state.athletes[0];
  return { tab: 'type', n: 4, vals: ['', '', '', '', '', '', '', ''], name: 'Training run', date: new Date().toISOString().slice(0, 10), sex: me.sex, lane: 4, start: 'move', rt: '0.170', parsed: null, err: null, fileName: '' };
}
function recFormMarks(f) {
  if (f.tab === 'file') return f.parsed ? f.parsed.marks : null;
  const vals = f.vals.slice(0, f.n).map(RunParsers.parseTime);
  return vals.every(isFinite) ? vals : null;
}
function recFormHTML() {
  const f = state.recForm;
  const marks = recFormMarks(f), err = f.err || (marks ? RunParsers.checkMarks(marks) : null);
  const L = 400 / f.n;
  const typed = `
    <div class="seg-ctl small" role="group" aria-label="Split interval"><button data-recn="4" aria-pressed="${f.n === 4}">Every 100 m</button><button data-recn="8" aria-pressed="${f.n === 8}">Every 50 m</button></div>
    <div class="row4">${Array.from({ length: f.n }, (_, i) => `<div class="field"><label for="rv${i}">${(i + 1) * L} m</label><input class="inp mono" id="rv${i}" data-recv="${i}" inputmode="decimal" placeholder="${f.n === 4 ? ['11.8', '22.9', '34.9', '48.5'][i] : ''}" value="${esc(f.vals[i])}"></div>`).join('')}</div>
    <p class="hint">Cumulative times (at 100 m, at 200 m…). Lap times are converted for you. Formats like 47.31 or 0:47.31 work. You can also paste all times at once into the first box.</p>`;
  const file = `
    <label class="file-drop" for="recFile"><b>${f.fileName ? esc(f.fileName) : 'Choose a file'}</b><span>GPX, TCX or FIT from a watch · CSV from timing gates, laser or radar · CSV or TXT with split times</span></label>
    <input type="file" id="recFile" accept=".gpx,.tcx,.fit,.csv,.txt,.tsv" hidden>
    ${f.parsed ? `<div class="note ${f.parsed.approx ? 'warn' : 'good'}">Found a 400 m in ${fmtT(f.parsed.marks[f.parsed.marks.length - 1])} s, with ${f.parsed.marks.length === 8 ? '50' : '100'} m splits. ${esc(f.parsed.note || '')}</div>` : ''}`;
  const preview = marks && !err ? (() => { const p = per100(marks.map((x, i) => i ? x - marks[i - 1] : x)); return `<p class="hint">Per 100 m: ${p.map(fmtT).join(' · ')} · total <b style="color:var(--fg)">${fmtT(marks[marks.length - 1])}</b></p>`; })() : '';
  return `<div class="picker rec-form">
    <div class="sec-h"><span class="eyebrow">New recorded run</span></div>
    <div class="seg-ctl" role="tablist"><button role="tab" data-rectab="type" aria-selected="${f.tab === 'type'}">Type times</button><button role="tab" data-rectab="file" aria-selected="${f.tab === 'file'}">Upload a file</button></div>
    ${f.tab === 'type' ? typed : file}
    ${err ? `<div class="note warn">${esc(err)}</div>` : preview}
    <div class="row2">
      <div class="field"><label for="recName">Name</label><input class="inp" id="recName" maxlength="40" value="${esc(f.name)}"></div>
      <div class="field"><label for="recDate">Date</label><input class="inp" id="recDate" type="date" value="${esc(f.date)}"></div>
    </div>
    <div class="row2">
      <div class="field"><label for="recSex">Category</label><select class="inp" id="recSex"><option value="M" ${f.sex === 'M' ? 'selected' : ''}>Men</option><option value="W" ${f.sex === 'W' ? 'selected' : ''}>Women</option></select></div>
      <div class="field"><label for="recLane">Lane run in</label><select class="inp" id="recLane">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(l => `<option ${l === +f.lane ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    </div>
    <div class="field"><label for="recStart">Timing started at</label><select class="inp" id="recStart"><option value="move" ${f.start === 'move' ? 'selected' : ''}>First movement (training, watch, gates)</option><option value="gun" ${f.start === 'gun' ? 'selected' : ''}>The gun (race result, reaction included)</option></select></div>
    ${f.start === 'gun' ? `<div class="field"><label for="recRT">Reaction time (s)</label><input class="inp mono" id="recRT" inputmode="decimal" value="${esc(f.rt)}"></div>` : ''}
    <p class="hint">The run is fitted with your profile's body, acceleration and VO₂max, so the tool can estimate the top speed and anaerobic capacity it shows.</p>
    <div class="btn-row"><button class="btn primary" id="recSave" ${marks && !err ? '' : 'disabled'}>Save recorded run</button><button class="btn" id="recCancel">Cancel</button></div>
  </div>`;
}
function saveRec() {
  const f = state.recForm, marks = recFormMarks(f);
  if (!marks || RunParsers.checkMarks(marks)) return;
  const me = state.athletes.find(a => a.isMe) || state.athletes[0];
  const rt = f.start === 'gun' ? Math.min(0.3, Math.max(0.1, RunParsers.parseTime(f.rt) || 0.17)) : 0;
  const rec = { id: newId('rec_'), type: 'rec', name: f.name.trim() || 'Recorded run', date: f.date || new Date().toISOString().slice(0, 10), createdAt: new Date().toISOString(),
    sex: f.sex, lane: +f.lane, rt, marks, source: f.tab === 'file' && f.parsed ? f.parsed.source : 'splits', approx: !!(f.tab === 'file' && f.parsed && f.parsed.approx), env: { alt: 0, temp: 20, hum: 50 } };
  rec.fit = fitRec(rec, bodyOf(me.p));
  Store.put(rec);
  state.recForm = null; state.recMsg = `Saved "${rec.name}". Estimated top speed ${rec.fit.vmax.toFixed(2)} m/s, anaerobic capacity ${Math.round(rec.fit.ac)}.`;
  renderHistory(); renderPastPicker();
}
function fitRec(rec, body) {
  const m = rec.marks;
  const ath = { rt: rec.rt, lane: rec.lane, splits: m.length === 8 ? [m[1], m[3], m[5], m[7]] : m.slice(), s50: m.length === 8 ? m.slice() : null };
  const f = M.fitToSplits(rec.sex, ath, Object.assign({ wind: 0, windDir: 0, wet: false }, rec.env), { body });
  return { vmax: +f.vmax.toFixed(3), ac: f.ac, fitErr: +f.fitErr.toFixed(3), body };
}
function useRecForProfile(rec) {
  const me = state.athletes.find(a => a.isMe) || state.athletes[0];
  const fit = fitRec(rec, bodyOf(me.p));
  me.p.vmax = Math.round(fit.vmax * 100) / 100; me.p.ac = Math.max(30, Math.min(160, Math.round(fit.ac)));
  me.p.rt = rec.rt || me.p.rt; me.planAuto = true; me.plan = null; me.sex = rec.sex;
  me.pbMsg = null;
  state.recMsg = `Your profile now matches "${rec.name}": top speed ${me.p.vmax.toFixed(2)} m/s, anaerobic capacity ${me.p.ac}. Press Run race to see it.`;
  state.sel = me.id; markStale(); renderList(); renderEditor(); renderHistory();
}

/* ---- comparing two saved runs ---- */
function toggleCompare(id) {
  const c = state.compareSel || (state.compareSel = []);
  const i = c.indexOf(id);
  if (i >= 0) c.splice(i, 1); else { c.push(id); if (c.length > 2) c.shift(); }
  renderHistory();
}

function renderHistory() {
  const runs = Store.items.filter(x => x.type === 'run');
  const recs = Store.items.filter(x => x.type === 'rec').sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  $('#histCount').textContent = runs.length + recs.length ? String(runs.length + recs.length) : '';
  const pane = $('#historyPane'); if (pane.hidden) return;
  const sessions = Store.items.filter(x => x.type === 'session').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const bySess = {};
  for (const r of runs) (bySess[r.sessionId] = bySess[r.sessionId] || []).push(r);
  const where = Store.mode === 'db' ? 'Saved to your account and private to you.' : Store.mode === 'local' ? 'Saved in this browser only.' : 'History cannot be saved here, so it lasts until you close the page.';
  const cmp = state.compareSel || [];
  const sessHTML = s => {
    const list = (bySess[s.id] || []).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const rows = list.map((r, i) => {
      const prev = list.slice(0, i).reverse().find(p => p.focusName === r.focusName);
      const d = prev ? r.focusTime - prev.focusTime : null;
      return `<li><input type="checkbox" class="cmp" data-cmp="${r.id}" ${cmp.includes(r.id) ? 'checked' : ''} aria-label="Select for comparison">
        <button class="run-row ${r.id === state.currentRunId ? 'cur' : ''}" data-run="${r.id}">
          <span class="rt">${new Date(r.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
          <span class="rl">${esc(short(r.focusName))} <b>${r.focusTime.toFixed(2)}</b>${r.refName ? ` <small>vs ${esc(short(r.refName))} ${r.refTime.toFixed(2)}</small>` : ''}</span>
          <span class="rd ${d == null ? '' : d < -0.004 ? 'delta-neg' : d > 0.004 ? 'delta-pos' : ''}">${d == null ? '' : (d <= 0 ? '−' : '+') + Math.abs(d).toFixed(2)}</span>
        </button><button class="x" data-rdel="${r.id}" aria-label="Delete this run">×</button></li>`;
    }).join('');
    return `<div class="sess ${s.id === state.sessionId ? 'cur' : ''}">
      <div class="sess-h"><input class="inp sess-name" data-sname="${s.id}" value="${esc(s.name)}" aria-label="Session name" maxlength="60">
        <button class="link-btn" data-sdel="${s.id}">${state.confirmDel === s.id ? 'Confirm delete' : 'Delete'}</button></div>
      <span class="hint">${fmtWhen(s.createdAt)} · ${list.length} run${list.length === 1 ? '' : 's'}${s.id === state.sessionId ? ' · new runs go here' : ''}</span>
      ${list.length ? `<ol class="runs">${rows}</ol>` : ''}
      ${s.id !== state.sessionId ? `<div><button class="link-btn" data-suse="${s.id}">Add new runs to this session</button></div>` : ''}
    </div>`;
  };
  const recHTML = r => `<li class="rec-item">
      <div class="ri-h"><b>${esc(r.name)}</b><span class="tm">${fmtT(r.marks[r.marks.length - 1])}</span></div>
      <span class="hint">${fmtDay(r.date)} · ${srcLabel(r)}${r.approx ? ' (approximate)' : ''} · lane ${r.lane} · per 100 m ${per100(r.marks.map((x, i) => i ? x - r.marks[i - 1] : x)).map(fmtT).join(' / ')}</span>
      <div class="btn-row">
        <button class="link-btn" data-rec-lane="${r.id}" ${lanesUsed().length >= 9 ? 'disabled' : ''}>Add to the race</button>
        <button class="link-btn" data-rec-ghost="${r.id}">Ghost vs ${esc(short((state.athletes.find(a => a.isMe) || state.athletes[0]).name))}</button>
        <button class="link-btn" data-rec-prof="${r.id}">Update my profile</button>
        <button class="link-btn" data-rec-del="${r.id}">${state.confirmDel === r.id ? 'Confirm delete' : 'Delete'}</button>
      </div></li>`;
  pane.innerHTML = `
    <div class="sec-h"><span class="eyebrow">Recorded runs</span>${state.recForm ? '' : '<button class="btn" id="recNew">Add a run</button>'}</div>
    <p class="hint">Real 400 m runs from training or competition: typed splits, a CSV, or a GPS watch file. Race them, ghost them, or update your profile from them.</p>
    ${state.recMsg ? `<div class="note good">${esc(state.recMsg)}</div>` : ''}
    ${state.recForm ? recFormHTML() : ''}
    ${recs.length ? `<ul class="rec-list">${recs.map(recHTML).join('')}</ul>` : (state.recForm ? '' : '<div class="empty">No recorded runs yet.</div>')}
    <div class="sec-h" style="margin-top:10px"><span class="eyebrow">Simulation sessions</span><button class="btn" id="newSess">New session</button></div>
    <p class="hint">Every press of Run race saves the setup and your report. Click a run to bring back that dashboard. Tick two runs to compare them. ${where}</p>
    ${cmp.length ? `<div class="cmp-bar"><span>${cmp.length} of 2 selected</span><button class="btn primary" id="cmpGo" ${cmp.length === 2 ? '' : 'disabled'}>Compare</button><button class="link-btn" id="cmpClear">Clear</button></div>` : ''}
    ${Store.error ? `<div class="note warn">The last change could not be saved: ${esc(Store.error)}</div>` : ''}
    ${sessions.length ? sessions.map(sessHTML).join('') : '<div class="empty">No runs yet. Set up a race and press Run race.</div>'}`;
}
$('#historyPane').addEventListener('click', e => {
  const t = e.target.closest('button, input[type=checkbox], label.file-drop'); if (!t) return;
  if (t.dataset.cmp) { toggleCompare(t.dataset.cmp); return; }
  if (t.id === 'newSess') { newSession(); return; }
  if (t.id === 'recNew') { state.recForm = blankRecForm(); state.recMsg = null; renderHistory(); return; }
  if (t.id === 'recCancel') { state.recForm = null; renderHistory(); return; }
  if (t.id === 'recSave') { saveRec(); return; }
  if (t.dataset.rectab) { state.recForm.tab = t.dataset.rectab; state.recForm.err = null; renderHistory(); return; }
  if (t.dataset.recn) { state.recForm.n = +t.dataset.recn; renderHistory(); return; }
  if (t.id === 'cmpGo') { openCompare(state.compareSel[0], state.compareSel[1]); return; }
  if (t.id === 'cmpClear') { state.compareSel = []; renderHistory(); return; }
  if (t.dataset.recLane) { addAsLane('rec', t.dataset.recLane); state.recMsg = 'Added to the race. Press Run race.'; renderHistory(); return; }
  if (t.dataset.recGhost) { const me = state.athletes.find(a => a.isMe) || state.athletes[0]; addGhost(me.id, 'rec', t.dataset.recGhost); state.recMsg = 'Ghost added in your lane. Press Run race.'; renderHistory(); return; }
  if (t.dataset.recProf) { const r = recById(t.dataset.recProf); if (r) useRecForProfile(r); return; }
  if (t.dataset.recDel) {
    const id = t.dataset.recDel;
    if (state.confirmDel !== id) { state.confirmDel = id; renderHistory(); return; }
    state.confirmDel = null; Store.del(id); renderHistory(); renderPastPicker(); return;
  }
  if (t.dataset.run) {
    const r = Store.items.find(x => x.id === t.dataset.run); if (!r) return;
    try { restore(JSON.parse(r.cfg)); } catch (err) { return; }
    state.currentRunId = r.id; state.sessionId = r.sessionId; state.restoredAt = r.createdAt;
    renderCoach(); renderHistory();
    const main = document.querySelector('main'); const rep = $('#coachH');
    if (main && rep && main.scrollHeight > main.clientHeight) main.scrollTo({ top: rep.offsetTop - 20, behavior: 'smooth' });
    return;
  }
  if (t.dataset.rdel) { if (state.currentRunId === t.dataset.rdel) state.currentRunId = null; Store.del(t.dataset.rdel); renderHistory(); return; }
  if (t.dataset.suse) { state.sessionId = t.dataset.suse; renderHistory(); return; }
  if (t.dataset.sdel) {
    const id = t.dataset.sdel;
    if (state.confirmDel !== id) { state.confirmDel = id; renderHistory(); return; }
    state.confirmDel = null;
    for (const r of Store.items.filter(x => x.type === 'run' && x.sessionId === id)) Store.del(r.id);
    Store.del(id);
    if (state.sessionId === id) { state.sessionId = null; state.currentRunId = null; }
    renderHistory();
  }
});
$('#historyPane').addEventListener('input', e => {
  const f = state.recForm; if (!f) return;
  const t = e.target;
  if (t.dataset.recv != null) { f.vals[+t.dataset.recv] = t.value; return; }
  if (t.id === 'recName') f.name = t.value;
  if (t.id === 'recRT') f.rt = t.value;
});
$('#historyPane').addEventListener('change', e => {
  const t = e.target, f = state.recForm;
  if (t.dataset.sname) {
    const s = Store.items.find(x => x.id === t.dataset.sname); if (!s) return;
    Store.put(Object.assign({}, s, { name: t.value.trim() || s.name })); return;
  }
  if (!f) return;
  if (t.dataset.recv != null) {
    // several times pasted into one box fill them all; lap times are turned into cumulative times
    const parts = t.value.trim().split(/[\s;|\t]+/).filter(Boolean);
    let nums;
    if (parts.length === 4 || parts.length === 8) { nums = parts.map(RunParsers.parseTime); f.n = nums.length; }
    else { f.vals[+t.dataset.recv] = t.value; nums = f.vals.slice(0, f.n).map(RunParsers.parseTime); }
    if (nums.every(isFinite)) { const cum = RunParsers.toCumulative(nums); f.vals = cum.map(x => String(+x.toFixed(2))).concat(['', '', '', '', '', '', '', '']).slice(0, 8); }
    f.err = null; renderHistory(); return;
  }
  if (t.id === 'recDate') f.date = t.value;
  if (t.id === 'recSex') f.sex = t.value;
  if (t.id === 'recLane') f.lane = +t.value;
  if (t.id === 'recStart') { f.start = t.value; renderHistory(); }
  if (t.id === 'recFile' && t.files && t.files[0]) readRecFile(t.files[0]);
});
function readRecFile(file) {
  const f = state.recForm; f.fileName = file.name; f.parsed = null; f.err = null;
  const binary = /\.fit$/i.test(file.name);
  const rd = new FileReader();
  rd.onload = () => {
    let res;
    try { res = RunParsers.parseFile(file.name, binary ? rd.result : String(rd.result)); } catch (err) { res = { error: 'This file could not be read.' }; }
    if (res.error) f.err = res.error; else { f.parsed = res; if (f.name === 'Training run') f.name = file.name.replace(/\.[^.]+$/, '').slice(0, 40); }
    renderHistory();
  };
  rd.onerror = () => { f.err = 'This file could not be read.'; renderHistory(); };
  if (binary) rd.readAsArrayBuffer(file); else rd.readAsText(file);
}
