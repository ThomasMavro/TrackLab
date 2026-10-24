
/* ---------------- Compare two saved runs ---------------- */
function simFromSnap(cfg) {
  const c = cfg.athletes[cfg.focusIdx] || cfg.athletes[0];
  const a = athleteFromSnap(c);
  const env = a.kind === 'real' ? envFor(a) : (a.envOverride || Object.assign({}, cfg.env));
  if (!a.plan) a.plan = M.suggestPlan(a.p, env, a.lane, a.sex);
  const r = M.simulate(runner(a), env, { lane: a.lane });
  return { a, env, r, split: M.split100(r), cum: M.cum100(r) };
}
function openCompare(idA, idB) {
  const A = Store.items.find(x => x.id === idA), B = Store.items.find(x => x.id === idB);
  if (!A || !B) return;
  const [first, second] = A.createdAt <= B.createdAt ? [A, B] : [B, A];
  state.compare = { first, second, x: simFromSnap(JSON.parse(first.cfg)), y: simFromSnap(JSON.parse(second.cfg)) };
  renderCompare();
  const sec = $('#compareSec'); const main = document.querySelector('main');
  if (sec && main) main.scrollTo({ top: sec.offsetTop - 12, behavior: 'smooth' });
}
function renderCompare() {
  const el = $('#compareSec');
  if (!state.compare) { el.hidden = true; el.innerHTML = ''; return; }
  const { first, second, x, y } = state.compare;
  const fmt = {
    mass: v => v.toFixed(1) + ' kg', height: v => Math.round(v * 100) + ' cm', vmax: v => v.toFixed(2) + ' m/s', t90: v => v.toFixed(2) + ' s',
    rt: v => v.toFixed(3) + ' s', ac: v => Math.round(v) + '', vo2: v => Math.round(v) + '',
  };
  const lab = { mass: 'Body mass', height: 'Height', vmax: 'Top speed', t90: 'Acceleration (to 90%)', rt: 'Reaction time', ac: 'Anaerobic capacity', vo2: 'VO₂max' };
  const diffRow = (label, a, b, changed) => `<tr class="${changed ? 'chg' : ''}"><td>${label}</td><td class="num">${a}</td><td class="num">${b}</td><td>${changed ? '<span class="badge focus">changed</span>' : ''}</td></tr>`;
  const rows = [];
  for (const k of Object.keys(lab)) { const a = x.a.p[k], b = y.a.p[k]; rows.push(diffRow(lab[k], fmt[k](a), fmt[k](b), Math.abs(a - b) > 1e-6)); }
  const pa = per100(x.a.plan).map(fmtT).join(' / '), pb = per100(y.a.plan).map(fmtT).join(' / ');
  rows.push(diffRow('Race plan per 100 m', pa, pb, pa !== pb));
  const ea = `${x.env.temp ?? 20}°C · ${x.env.hum ?? 50}% · ${x.env.alt || 0} m${x.env.wind ? ' · wind ' + x.env.wind + ' m/s' : ''}${x.env.wet ? ' · wet' : ''}`;
  const eb = `${y.env.temp ?? 20}°C · ${y.env.hum ?? 50}% · ${y.env.alt || 0} m${y.env.wind ? ' · wind ' + y.env.wind + ' m/s' : ''}${y.env.wet ? ' · wet' : ''}`;
  rows.push(diffRow('Conditions', ea, eb, ea !== eb));
  rows.push(diffRow('Lane', x.a.lane, y.a.lane, x.a.lane !== y.a.lane));
  const d = y.r.time - x.r.time;
  const segRows = ['0–100 m', '100–200 m', '200–300 m', '300–400 m'].map((n, i) => { const dd = y.split[i] - x.split[i]; return `<tr><td>${n}</td><td class="num">${fmtT(x.split[i])}</td><td class="num">${fmtT(y.split[i])}</td><td class="num ${dd < -0.005 ? 'delta-neg' : dd > 0.005 ? 'delta-pos' : ''}">${(dd <= 0 ? '−' : '+') + Math.abs(dd).toFixed(2)}</td></tr>`; }).join('');
  const changed = rows.filter(r => r.includes('class="chg"')).length;
  el.hidden = false;
  el.innerHTML = `
    <div class="blk-h"><h2>Run comparison</h2><button class="btn" id="cmpClose">Close comparison</button></div>
    <div class="verdict cmp-verdict">
      <h3>${esc(y.a.name)} ${/^you$/i.test(y.a.name.trim()) ? 'are' : 'is'} <span class="${d <= 0 ? 'hl-good' : 'hl-bad'}">${Math.abs(d).toFixed(2)} s ${d <= 0 ? 'faster' : 'slower'}</span> in the later run: ${fmtT(x.r.time)} → ${fmtT(y.r.time)}.</h3>
      <p>${changed ? `${changed} setting${changed > 1 ? 's' : ''} changed between the two runs (highlighted below).` : 'The settings are identical, so the time is identical too.'} Earlier: ${fmtWhen(first.createdAt)}. Later: ${fmtWhen(second.createdAt)}.</p>
    </div>
    <div class="tbl-wrap cmp-table"><table>
        <thead><tr><th>Setting for ${esc(short(y.a.name))}</th><th class="num">Earlier</th><th class="num">Later</th><th></th></tr></thead>
        <tbody>${rows.join('')}</tbody></table></div>
    <div class="coach-grid" style="margin-top:0">
      <div class="card chart-card">
        <div class="card-h"><h3>Speed over the race</h3></div>
        <canvas id="cmpChart" role="img" aria-label="Speed against distance for the earlier and later run"></canvas>
        <div class="legend"><span><i style="background:var(--muted)"></i>Earlier ${fmtT(x.r.time)}</span><span><i style="background:var(--fg)"></i>Later ${fmtT(y.r.time)}</span></div>
      </div>
      <div class="tbl-wrap" style="align-self:start"><table><thead><tr><th>Section</th><th class="num">Earlier</th><th class="num">Later</th><th class="num">Δ</th></tr></thead><tbody>${segRows}</tbody></table></div>
    </div>`;
  drawLines($('#cmpChart'), [{ tr: x.r.trace, color: '#8b95a5', w: 2 }, { tr: y.r.trace, color: '#eef1f5', w: 2.5 }]);
}
$('#compareSec').addEventListener('click', e => { if (e.target.id === 'cmpClose') { state.compare = null; renderCompare(); } });
function drawLines(cv, lines) {
  if (!cv) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
  cv.width = W * dpr; cv.height = H * dpr;
  const g = cv.getContext('2d'); g.scale(dpr, dpr);
  const pad = { l: 34, r: 10, t: 12, b: 24 };
  const vmax = Math.ceil(Math.max(...lines.map(l => Math.max(...l.tr.v))) + 0.5), vmin = Math.max(0, vmax - 6);
  const X = s => pad.l + s / 400 * (W - pad.l - pad.r), Y = v => pad.t + (1 - (v - vmin) / (vmax - vmin)) * (H - pad.t - pad.b);
  g.font = '11px "IBM Plex Mono", monospace'; g.strokeStyle = '#242b35'; g.fillStyle = '#8b95a5'; g.lineWidth = 1;
  for (let v = vmin; v <= vmax; v++) { g.beginPath(); g.moveTo(pad.l, Y(v)); g.lineTo(W - pad.r, Y(v)); g.stroke(); g.textAlign = 'right'; g.fillText(v, pad.l - 6, Y(v) + 4); }
  for (let s = 0; s <= 400; s += 100) { g.textAlign = s === 0 ? 'left' : s === 400 ? 'right' : 'center'; g.fillText(s + ' m', X(s), H - 6); }
  for (const l of lines) {
    g.strokeStyle = l.color; g.lineWidth = l.w; g.beginPath(); let st = false;
    for (let i = 0; i < l.tr.s.length; i += 2) { const v = l.tr.v[i]; if (v < vmin) continue; const px = X(l.tr.s[i]), py = Y(v); if (!st) { g.moveTo(px, py); st = true; } else g.lineTo(px, py); }
    g.stroke();
  }
}

/* ---------------- Export the report as an image or PDF ---------------- */
function loadScript(src) {
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('load')); document.head.appendChild(s); });
}
async function exportReport(kind) {
  const btns = document.querySelectorAll('[data-export]'); const status = $('#exportStatus');
  const say = (t, warn) => { if (status) { status.textContent = t; status.style.color = warn ? 'var(--warn)' : ''; } };
  let dl = null;
  try { dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null; } catch (e) { dl = null; }
  const standalone = !window.claude; // opened as a plain web page (e.g. from GitHub): use a normal browser download
  if (!dl && !standalone) { say('Saving files is not available in this view.', true); return; }
  btns.forEach(b => b.disabled = true); say('Preparing…');
  try {
    if (!window.html2canvas) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    if (kind === 'pdf' && !(window.jspdf && window.jspdf.jsPDF)) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    const node = $('#reportExport');
    node.classList.add('exporting');
    const a = byId(state.focus);
    $('#exportHead').innerHTML = `<b>400m Race Lab · report for ${esc(a.name)}</b><span>${new Date().toLocaleString()} · ${state.athletes.length} runner${state.athletes.length > 1 ? 's' : ''} · ${state.env.temp}°C, ${state.env.hum}%, ${state.env.alt} m${state.env.wind ? ', wind ' + state.env.wind + ' m/s' : ''}${state.env.wet ? ', wet track' : ''}</span>`;
    const canvas = await window.html2canvas(node, { backgroundColor: '#0a0c10', scale: 2, logging: false, useCORS: true });
    node.classList.remove('exporting');
    const base = `race-lab-${a.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().slice(0, 10)}`;
    let data, filename;
    if (kind === 'png') {
      data = await new Promise(r => canvas.toBlob(r, 'image/png')); filename = base + '.png';
    } else {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight(), m = 24;
      const w = pw - 2 * m, scale = w / canvas.width, pageH = (ph - 2 * m) / scale;
      for (let y = 0, page = 0; y < canvas.height; y += pageH, page++) {
        const slice = document.createElement('canvas'); slice.width = canvas.width; slice.height = Math.min(pageH, canvas.height - y);
        const sg = slice.getContext('2d'); sg.fillStyle = '#0a0c10'; sg.fillRect(0, 0, slice.width, slice.height); sg.drawImage(canvas, 0, -y);
        if (page) pdf.addPage();
        pdf.setFillColor(10, 12, 16); pdf.rect(0, 0, pw, ph, 'F');
        pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', m, m, w, slice.height * scale);
      }
      data = pdf.output('arraybuffer'); filename = base + '.pdf';
    }
    if (dl) await dl.save({ filename, data });
    else {
      const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type: 'application/pdf' }));
      const link = document.createElement('a'); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
    say('Saved.');
  } catch (e) {
    $('#reportExport') && $('#reportExport').classList.remove('exporting');
    say(e && e.code === 'declined' ? 'Not saved.' : e && e.message === 'load' ? 'The export tools could not load. Check your connection and try again.' : 'The export did not work. Try again.', true);
  } finally { btns.forEach(b => b.disabled = false); }
}
