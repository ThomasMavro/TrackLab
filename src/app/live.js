/* ---------------- Live strip ---------------- */
function renderLive() {
  const body = $('#liveBody');
  if (!state.results) { body.innerHTML = `<tr><td colspan="9" style="color:var(--muted)">Press Run race to start.</td></tr>`; return; }
  const rows = state.athletes.map(a => {
    const r = state.results[a.id]; if (!r) return null;
    const smp = sampleAt(r, state.t);
    return { a, r, smp, s: Math.min(400, smp.s), fin: state.t >= r.time };
  }).filter(Boolean);
  rows.sort((x, y) => (x.fin && y.fin) ? x.r.time - y.r.time : (x.fin ? -1 : y.fin ? 1 : (timeAt(x.r, Math.min(x.s, y.s)) - timeAt(y.r, Math.min(x.s, y.s)))));
  const lead = rows[0];
  body.innerHTML = rows.map((o, i) => {
    let gap;
    if (i === 0) gap = o.fin ? fmtT(o.r.time) : '—';
    else if (o.fin) gap = '+' + (o.r.time - lead.r.time).toFixed(2);
    else { const ds = Math.min(o.s, lead.s); gap = '+' + Math.max(0, timeAt(o.r, ds) - timeAt(lead.r, ds)).toFixed(2); }
    let plan = '—', pc = '';
    const mk = Math.floor(o.s / 100) * 100;
    if (o.a.plan && mk >= 100) {
      const d = timeAt(o.r, mk) - planTimeAt(o.a.plan, mk);
      plan = (d >= 0 ? '+' : '−') + Math.abs(d).toFixed(2) + ` <small style="color:var(--faint)">@${mk}</small>`; pc = Math.abs(d) < 0.05 ? 'ok' : d > 0 ? 'behind' : 'ahead';
    }
    const st = M.strideAt(o.smp.v, o.a.p);
    const v = o.fin ? 0 : o.smp.v;
    return `<tr>
      <td><span class="pos">${i + 1}</span></td>
      <td><span class="who"><i class="${isGhost(o.a) ? 'ghost-dot' : ''}" style="${isGhost(o.a) ? 'border-color' : 'background'}:${o.a.color}"></i>${isGhost(o.a) ? 'Ghost · ' : ''}${esc(o.a.name)}${o.a.kind === 'real' ? ` <small>${raceById(o.a.real.raceId).year}${o.a.real.round !== 'Final' ? ' SF' : ''}</small>` : o.a.kind === 'rec' ? ` <small>${fmtDay(o.a.recInfo.date)}</small>` : o.a.kind === 'past' ? ` <small>${esc(o.a.pastInfo.when)}</small>` : ''}</span></td>
      <td class="num">${o.a.lane}</td>
      <td class="num">${o.s.toFixed(0)} m</td>
      <td class="num">${o.fin ? '—' : v.toFixed(2) + ' m/s'}</td>
      <td class="num">${o.fin || v < 0.5 ? '—' : st.sl.toFixed(2) + ' m · ' + st.sf.toFixed(2) + ' Hz'}</td>
      <td class="num">${gap}</td>
      <td class="num"><span class="on-plan ${pc}">${plan}</span></td>
      <td><div class="fuel" title="${Math.round(o.smp.e * 100)}%"><b style="width:${Math.max(0, Math.min(100, o.smp.e * 100))}%;background:${o.a.color}"></b></div></td>
    </tr>`;
  }).join('');
}

