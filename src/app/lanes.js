
/* ---------------- Sidebar tabs ---------------- */
function showSide(name) {
  state.side = name;
  document.querySelectorAll('[data-side]').forEach(x => x.setAttribute('aria-selected', x.dataset.side === name));
  $('#setupPane').hidden = name !== 'setup';
  $('#historyPane').hidden = name !== 'history';
  renderHistory();
}
document.querySelectorAll('[data-side]').forEach(b => b.addEventListener('click', () => showSide(b.dataset.side)));

/* ---------------- Sidebar: lanes ---------------- */
function kindLabel(a) {
  if (a.isMe) return 'Your profile';
  if (a.kind === 'real') return 'Real · ' + esc(raceLabel(raceById(a.real.raceId))) + (a.real.round && a.real.round !== 'Final' ? ' ' + esc(a.real.round.replace('Semi-final', 'SF')) : '') + ' · ' + fmtT(a.real.splits[3]);
  if (a.kind === 'rec') return 'Recorded run · ' + fmtDay(a.recInfo.date) + ' · ' + fmtT(a.recInfo.total);
  if (a.kind === 'past') return 'Past simulation · ' + esc(a.pastInfo.when);
  return 'Created profile · ' + (a.sex === 'M' ? 'men' : 'women');
}
function renderList() {
  const el = $('#athList');
  const main = lanesUsed().slice().sort((x, y) => x.lane - y.lane);
  el.innerHTML = main.map(a => {
    const ghosts = state.athletes.filter(g => g.ghostOf === a.id);
    return `
    <div class="ath ${a.id === state.sel ? 'sel' : ''}" role="button" tabindex="0" data-id="${a.id}" aria-pressed="${a.id === state.sel}">
      <span class="dot" style="background:${a.color}"></span>
      <span class="nm"><b>${esc(a.name)}</b><small>${kindLabel(a)}</small></span>
      <span class="ln">L${a.lane}</span>
      ${a.isMe ? '<span></span>' : `<button class="x" data-del="${a.id}" aria-label="Remove ${esc(a.name)}">×</button>`}
    </div>
    ${ghosts.map(g => `<div class="ath ghost-row ${g.id === state.sel ? 'sel' : ''}" role="button" tabindex="0" data-id="${g.id}" aria-pressed="${g.id === state.sel}">
      <span class="dot ghost-dot" style="border-color:${a.color}"></span>
      <span class="nm"><b>Ghost · ${esc(g.name)}</b><small>${kindLabel(g)}</small></span>
      <span class="ln">L${a.lane}</span>
      <button class="x" data-del="${g.id}" aria-label="Remove ghost">×</button>
    </div>`).join('')}`;
  }).join('');
  const full = lanesUsed().length >= 9;
  $('#addAth').disabled = full; $('#addReal').disabled = full;
  $('#resetBtn').disabled = state.athletes.length <= 1 && !state.results;
}
$('#athList').addEventListener('click', e => {
  const del = e.target.closest('[data-del]');
  if (del) { e.stopPropagation(); removeAthlete(+del.dataset.del); return; }
  const row = e.target.closest('.ath'); if (!row) return;
  state.sel = +row.dataset.id; renderList(); renderEditor();
});
$('#athList').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('ath')) { e.preventDefault(); e.target.click(); } });

function freeLane(pref) {
  const used = new Set(lanesUsed().map(a => a.lane));
  if (pref && !used.has(pref)) return pref;
  const order = [4, 5, 6, 3, 7, 2, 8, 1, 9];
  if (pref) order.sort((x, y) => Math.abs(x - pref) - Math.abs(y - pref));
  for (const l of order) if (!used.has(l)) return l;
  return null;
}
function freeColor() { const used = new Set(state.athletes.map(a => a.colorIdx)); for (let i = 0; i < COLORS.length; i++) if (!used.has(i)) return i; return 0; }
function afterAdd(a) { state.sel = a.id; markStale(); renderList(); renderEditor(); rebuildRunners(); refreshSelectors(); }
$('#addAth').addEventListener('click', () => {
  const lane = freeLane(); if (!lane) return;
  const n = state.athletes.filter(x => x.kind === 'custom' && !x.isMe).length + 1;
  const a = mkCustom('Profile ' + n, 'natM', lane, freeColor());
  state.athletes.push(a); afterAdd(a);
});
function removeAthlete(id) {
  const a = byId(id); if (!a || a.isMe) return;
  state.athletes = state.athletes.filter(x => x.id !== id && x.ghostOf !== id);
  if (!byId(state.sel)) state.sel = state.athletes[0].id;
  if (state.results) { delete state.results[id]; }
  markStale(); renderList(); renderEditor(); rebuildRunners(); refreshSelectors();
}
$('#resetBtn').addEventListener('click', () => {
  const me = state.athletes.find(a => a.isMe) || state.athletes[0];
  state.athletes = [me]; state.sel = me.id; state.focus = me.id; state.ref = null;
  state.results = null; state.currentRunId = null; state.restoredAt = null; state.picker = null; state.pastPicker = null; state.t = 0;
  state.stale = false; $('#runBtn').classList.remove('stale'); $('#runBtn').textContent = 'Run race';
  renderPicker(); renderPastPicker(); renderList(); renderEditor(); rebuildRunners(); refreshSelectors(); renderCoach(); renderLive(); updateClock(); renderHistory();
});
