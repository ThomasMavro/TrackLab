function drawChart() {
  const cv = $('#speedChart'); if (!cv || !state.results) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = cv.clientWidth, H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr;
  const g = cv.getContext('2d'); g.scale(dpr, dpr);
  const a = byId(state.focus), r = state.results[a.id], ref = state.ref ? byId(state.ref) : null, rr = ref ? state.results[ref.id] : null;
  const band = rr ? 18 : 0;
  const pad = { l: 34, r: 10, t: 14, b: 26 + band };
  const shown = state.athletes.filter(x => state.results[x.id]);
  const vmax = Math.ceil(Math.max(...shown.map(x => state.results[x.id].peakV)) + 0.5);
  const vmin = Math.max(0, vmax - 6);
  const X = s => pad.l + s / 400 * (W - pad.l - pad.r);
  const Y = v => pad.t + (1 - (v - vmin) / (vmax - vmin)) * (H - pad.t - pad.b);
  g.font = '11px "IBM Plex Mono", monospace'; g.strokeStyle = '#242b35'; g.lineWidth = 1;
  g.fillStyle = 'rgba(255,255,255,0.03)';
  g.fillRect(X(0), pad.t, X(100) - X(0), H - pad.t - pad.b); g.fillRect(X(200), pad.t, X(300) - X(200), H - pad.t - pad.b);
  g.fillStyle = '#8b95a5';
  for (let v = vmin; v <= vmax; v += 1) { g.beginPath(); g.moveTo(pad.l, Y(v)); g.lineTo(W - pad.r, Y(v)); g.stroke(); g.textAlign = 'right'; g.fillText(v, pad.l - 6, Y(v) + 4); }
  for (let s = 0; s <= 400; s += 100) { g.beginPath(); g.moveTo(X(s), pad.t); g.lineTo(X(s), H - pad.b); g.stroke(); g.textAlign = s === 0 ? 'left' : s === 400 ? 'right' : 'center'; g.fillText(s + ' m', X(s), H - 8); }
  g.textAlign = 'left'; g.fillText('m/s', pad.l + 4, pad.t + 10);
  g.fillStyle = '#5c6675'; g.textAlign = 'center'; g.fillText('bend', X(50), pad.t + 10); g.fillText('bend', X(250), pad.t + 10);
  if (rr) {
    const y0 = H - pad.b + 4, bh = 10;
    for (let s0 = 0; s0 < 400; s0 += 10) {
      const d = (timeAt(r, s0 + 10) - timeAt(r, s0)) - (timeAt(rr, s0 + 10) - timeAt(rr, s0));
      const k = Math.min(1, Math.abs(d) / 0.04);
      g.fillStyle = d > 0 ? `rgba(255,107,125,${0.12 + 0.88 * k})` : `rgba(62,207,142,${0.12 + 0.88 * k})`;
      g.fillRect(X(s0) + 0.5, y0, X(s0 + 10) - X(s0) - 1, bh);
    }
  }
  const order = shown.slice().sort((x, y) => ((x.id === state.focus) * 2 + (x.id === state.ref)) - ((y.id === state.focus) * 2 + (y.id === state.ref)));
  for (const x of order) {
    const tr = state.results[x.id].trace, isF = x.id === state.focus, isR = x.id === state.ref;
    g.strokeStyle = x.color; g.lineWidth = isF ? 2.5 : isR ? 2 : 1.25; g.globalAlpha = isF || isR ? 1 : 0.35;
    g.setLineDash(isGhost(x) ? [6, 4] : []);
    g.beginPath(); let started = false;
    for (let i = 0; i < tr.s.length; i += 2) { const v = tr.v[i]; if (v < vmin) continue; const px = X(tr.s[i]), py = Y(v); if (!started) { g.moveTo(px, py); started = true; } else g.lineTo(px, py); }
    g.stroke();
  }
  g.globalAlpha = 1; g.setLineDash([]);
}

