/* ---------------- Conditions ---------------- */
function envLabel(d) {
  const along = Math.cos(d * Math.PI / 180);
  if (Math.abs(along) > 0.92) return along > 0 ? 'tailwind in home straight' : 'headwind in home straight';
  if (Math.abs(along) < 0.38) return 'crosswind on the straights';
  return along > 0 ? 'mostly helps the home straight' : 'mostly hurts the home straight';
}
function renderEnv() {
  const e = state.env;
  $('#windOut').innerHTML = e.wind.toFixed(1) + ' <small>m/s</small>';
  $('#windDirOut').innerHTML = `${e.windDir}° <small>${envLabel(e.windDir)}</small>`;
  $('#altOut').innerHTML = e.alt + ' <small>m</small>';
  $('#tempOut').innerHTML = e.temp + ' <small>°C</small>';
  $('#humOut').innerHTML = e.hum + ' <small>%</small>';
  $('#windArrow').setAttribute('transform', `translate(37 25) rotate(${e.windDir})`);
  $('#windArrow').style.opacity = e.wind > 0 ? 1 : 0.25;
  ['wind', 'windDir', 'alt', 'temp', 'hum'].forEach(k => { $('#' + k).value = e[k]; });
  $('#dryBtn').setAttribute('aria-pressed', !e.wet); $('#wetBtn').setAttribute('aria-pressed', e.wet);
}
['wind', 'windDir', 'alt', 'temp', 'hum'].forEach(k => $('#' + k).addEventListener('input', ev => { state.env[k] = +ev.target.value; $('#condPreset').value = ''; renderEnv(); markStale(); }));
$('#dryBtn').addEventListener('click', () => { state.env.wet = false; renderEnv(); markStale(); });
$('#wetBtn').addEventListener('click', () => { state.env.wet = true; renderEnv(); markStale(); });
(function () {
  const seen = new Set(), opts = [];
  for (const r of BENCH.RACES) { const key = r.city + r.year; if (r.temp == null || seen.has(key)) continue; seen.add(key); opts.push(r); }
  opts.sort((a, b) => b.year - a.year);
  $('#condPreset').innerHTML = '<option value="">Choose a championship…</option>' + opts.map(r => `<option value="${r.id}">${r.city} ${r.year} · ${r.temp}°C, ${r.hum}%, ${r.alt} m</option>`).join('');
})();
$('#condPreset').addEventListener('change', e => {
  const r = raceById(e.target.value); if (!r) return;
  Object.assign(state.env, { alt: r.alt, temp: r.temp, hum: r.hum, wind: 0, wet: false });
  renderEnv(); markStale();
});
document.querySelectorAll('[data-track]').forEach(b => b.addEventListener('click', () => {
  state.track = b.dataset.track; document.querySelectorAll('[data-track]').forEach(x => x.setAttribute('aria-pressed', x === b)); paintTrack();
}));

