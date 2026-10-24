/* ---------------- Finalist picker ---------------- */
$('#addReal').addEventListener('click', () => {
  if (state.picker) { state.picker = null; renderPicker(); return; }
  state.pastPicker = null; renderPastPicker();
  state.picker = { champ: 'Olympic Games', sex: 'M', raceId: null, chosen: new Set() };
  const rs = racesFor(state.picker); state.picker.raceId = rs.length ? rs[rs.length - 1].id : null;
  renderPicker();
});
function racesFor(pk) { return BENCH.RACES.filter(r => r.champ === pk.champ && r.sex === pk.sex && r.round === 'Final').sort((a, b) => a.year - b.year); }
function roundsFor(raceId) { const f = raceById(raceId); return f ? BENCH.RACES.filter(r => r.sex === f.sex && r.year === f.year && r.city === f.city) : []; }
const finalOf = id => { const r = raceById(id); return r && r.round !== 'Final' ? BENCH.RACES.find(x => x.round === 'Final' && x.sex === r.sex && x.year === r.year && x.city === r.city) : r; };
function renderPicker() {
  const el = $('#picker');
  if (!state.picker) { el.hidden = true; el.innerHTML = ''; return; }
  const pk = state.picker, races = racesFor(pk), race = raceById(pk.raceId), fin = finalOf(pk.raceId), rounds = roundsFor(fin && fin.id);
  const room = 9 - lanesUsed().length;
  const already = new Set(state.athletes.filter(a => a.kind === 'real').map(a => a.real.raceId + '|' + a.real.idx));
  el.hidden = false;
  el.innerHTML = `<div class="picker">
    <div class="seg-ctl" role="group" aria-label="Championship">
      <button data-pk-champ="Olympic Games" aria-pressed="${pk.champ === 'Olympic Games'}">Olympic Games</button>
      <button data-pk-champ="World Championships" aria-pressed="${pk.champ === 'World Championships'}">World Champs</button>
    </div>
    <div class="row2">
      <div class="field"><label for="pkSex">Category</label><select class="inp" id="pkSex"><option value="M" ${pk.sex === 'M' ? 'selected' : ''}>Men</option><option value="W" ${pk.sex === 'W' ? 'selected' : ''}>Women</option></select></div>
      <div class="field"><label for="pkYear">Year</label><select class="inp" id="pkYear">${races.map(r => `<option value="${r.id}" ${fin && r.id === fin.id ? 'selected' : ''}>${r.year} · ${r.city}</option>`).join('')}</select></div>
    </div>
    ${rounds.length > 1 ? `<div class="field"><label for="pkRound">Round</label><select class="inp" id="pkRound">${rounds.map(r => `<option value="${r.id}" ${r.id === pk.raceId ? 'selected' : ''}>${r.round}</option>`).join('')}</select></div>` : ''}
    ${race ? `<p class="hint">${race.temp != null ? race.temp + '°C, ' + race.hum + '% humidity' : 'Conditions not in our sources'} · ${race.athletes.length} athlete${race.athletes.length > 1 ? 's' : ''} with published splits${race.athletes.some(a => a.s50) ? ', some every 50 m' : ''}${race.note ? ' · ' + esc(race.note) : ''}</p>
    <div class="pick-list">${race.athletes.map((a, i) => {
      const key = race.id + '|' + i, dis = already.has(key);
      return `<label class="pick-item ${dis ? 'disabled' : ''}"><input type="checkbox" data-pk-i="${i}" ${pk.chosen.has(i) || dis ? 'checked' : ''} ${dis ? 'disabled' : ''}><span class="pl">${i + 1}</span><span>${esc(a.name)} <small>${a.nat} · L${a.lane}</small></span><span class="tm">${fmtT(a.splits[3])}</span></label>`;
    }).join('')}</div>` : '<p class="hint">No race with published splits for this choice.</p>'}
    <div class="btn-row"><button class="btn primary" id="pkAdd" ${pk.chosen.size === 0 || pk.chosen.size > room ? 'disabled' : ''}>Add ${pk.chosen.size || ''} to the race</button><button class="btn" id="pkCancel">Cancel</button></div>
    ${pk.chosen.size > room ? `<p class="hint" style="color:var(--warn)">Only ${room} lane${room === 1 ? '' : 's'} free.</p>` : ''}
  </div>`;
}
$('#picker').addEventListener('click', e => {
  const pk = state.picker; if (!pk) return;
  const c = e.target.closest('[data-pk-champ]');
  if (c) { pk.champ = c.dataset.pkChamp; const rs = racesFor(pk); pk.raceId = rs.length ? rs[rs.length - 1].id : null; pk.chosen.clear(); renderPicker(); return; }
  if (e.target.id === 'pkCancel') { state.picker = null; renderPicker(); return; }
  if (e.target.id === 'pkAdd') {
    const notes = []; let lastId = null;
    for (const i of [...pk.chosen].sort((x, y) => x - y)) {
      const ath = raceById(pk.raceId).athletes[i];
      const lane = freeLane(ath.lane); if (!lane) break;
      const a = mkReal(pk.raceId, i, lane, freeColor());
      if (lane !== ath.lane) { a.laneNote = `Raced in lane ${ath.lane}, which is taken here, so this run is in lane ${lane}. The time is re-simulated for the new lane.`; notes.push(a.name); }
      state.athletes.push(a); lastId = a.id;
    }
    if (lastId) state.sel = lastId;
    state.picker = null; renderPicker(); markStale(); renderList(); renderEditor(); rebuildRunners(); refreshSelectors();
  }
});
$('#picker').addEventListener('change', e => {
  const pk = state.picker; if (!pk) return;
  if (e.target.id === 'pkSex') { pk.sex = e.target.value; const rs = racesFor(pk); pk.raceId = rs.length ? rs[rs.length - 1].id : null; pk.chosen.clear(); }
  if (e.target.id === 'pkYear' || e.target.id === 'pkRound') { pk.raceId = e.target.value; pk.chosen.clear(); }
  if (e.target.dataset.pkI != null) { const i = +e.target.dataset.pkI; if (e.target.checked) pk.chosen.add(i); else pk.chosen.delete(i); }
  renderPicker();
});

