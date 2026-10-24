// Run with: node --test test/
const test = require('node:test'), assert = require('node:assert');
const P = require('../src/parsers.js');
// a synthetic athlete: time at distance s (warm-up jog, then a 400 m in ~48.5 s, then walking)
const real = [6.5, 11.8, 17.3, 22.9, 28.8, 34.9, 41.4, 48.5];
function tAt(s) { // piecewise linear through the 50 m marks
  if (s <= 0) return 0; const i = Math.min(7, Math.floor(s / 50)); const t0 = i ? real[i - 1] : 0; return t0 + (s - i * 50) / 50 * (real[i] - t0);
}
function series(hz, warm = 300) { // time, distance including a slow warm-up and recovery
  const t = [], d = []; let time = 0;
  for (let x = 0; x < warm; x += 3) { t.push(time); d.push(x); time += 1; }        // 3 m/s jog
  const t0 = time;
  for (let k = 0; k <= Math.ceil(48.5 * hz); k++) { const tt = k / hz; let lo = 0, hi = 400; for (let j = 0; j < 40; j++) { const m = (lo + hi) / 2; if (tAt(m) < tt) lo = m; else hi = m; } t.push(t0 + tt); d.push(warm + lo); }
  for (let x = 1; x < 60; x++) { t.push(t0 + 48.5 + x); d.push(warm + 400 + x * 1.2); }
  return { t, d };
}
const near = (a, b, tol) => a.forEach((x, i) => assert.ok(Math.abs(x - b[i]) <= tol, `mark ${i}: ${x} vs ${b[i]}`));

test('parseTime', () => { assert.equal(P.parseTime('0:47.31'), 47.31); assert.equal(P.parseTime('47,31'), 47.31); assert.equal(P.parseTime('1:02.5'), 62.5); });
test('typed cumulative', () => { const r = P.parseText('11.8 22.9 34.9 48.5'); near(r.marks, [11.8, 22.9, 34.9, 48.5], 1e-9); });
test('typed lap splits become cumulative', () => { const r = P.parseText('11.8 11.1 12.0 13.6'); near(r.marks, [11.8, 22.9, 34.9, 48.5], 1e-9); });
test('rejects impossible times', () => { assert.ok(P.parseText('5 10 15 20').error); assert.ok(P.parseText('11 22').error); });
test('CSV split table', () => { const r = P.parseCSV('distance,time\n100,11.8\n200,22.9\n300,34.9\n400,48.5\n'); near(r.marks, [11.8, 22.9, 34.9, 48.5], 1e-9); });
test('CSV split table 50 m, semicolons and mm:ss', () => { const r = P.parseCSV('d;t\n' + real.map((x, i) => `${(i + 1) * 50};0:${x.toFixed(2).padStart(5, '0')}`).join('\n')); assert.equal(r.marks.length, 8); near(r.marks, real, 1e-9); });
test('timing gates stream', () => {
  const s = series(20, 0); const csv = 'time,distance\n' + s.t.map((x, i) => `${x.toFixed(3)},${s.d[i].toFixed(3)}`).join('\n');
  const r = P.parseCSV(csv); assert.equal(r.source, 'gates'); assert.equal(r.marks.length, 8); near(r.marks, real, 0.02);
});
test('radar speed stream', () => {
  const s = series(30, 0); const rows = ['time,speed'];
  for (let i = 0; i < s.t.length; i++) { const j = Math.min(s.t.length - 1, i + 1), k = Math.max(0, i - 1); rows.push(`${s.t[i].toFixed(4)},${((s.d[j] - s.d[k]) / (s.t[j] - s.t[k])).toFixed(4)}`); }
  const r = P.parseCSV(rows.join('\n')); near(r.marks, real, 0.15);
});
test('GPX with warm-up finds the fast 400 m', () => {
  const s = series(1); const lat0 = 51.5, m2deg = 1 / 111195;
  const pts = s.t.map((x, i) => `<trkpt lat="${(lat0 + s.d[i] * m2deg).toFixed(8)}" lon="0.0"><time>${new Date(Date.UTC(2026, 9, 24, 10, 0, 0) + x * 1000).toISOString()}</time></trkpt>`).join('');
  const r = P.parseGPX(`<gpx><trk><trkseg>${pts}</trkseg></trk></gpx>`);
  assert.equal(r.source, 'gps'); assert.ok(r.approx); assert.ok(Math.abs(r.marks[r.marks.length - 1] - 48.5) < 0.6, 'total ' + r.marks[r.marks.length - 1]);
});
test('TCX distance', () => {
  const s = series(1); const pts = s.t.map((x, i) => `<Trackpoint><Time>${new Date(Date.UTC(2026, 9, 24) + x * 1000).toISOString()}</Time><DistanceMeters>${s.d[i].toFixed(2)}</DistanceMeters></Trackpoint>`).join('');
  const r = P.parseTCX(`<TrainingCenterDatabase>${pts}</TrainingCenterDatabase>`); assert.ok(Math.abs(r.marks[r.marks.length - 1] - 48.5) < 0.6);
});
test('FIT records', () => {
  // build a minimal FIT file: header + one definition (record: timestamp, distance) + data messages
  const s = series(1); const recs = s.t.map((x, i) => [Math.round(1e9 + x), Math.round(s.d[i] * 100)]);
  const body = [];
  body.push(0x40, 0, 0, 20, 0, 2, 253, 4, 0x86, 5, 4, 0x86);
  for (const [ts, dist] of recs) { body.push(0x00); const b = Buffer.alloc(8); b.writeUInt32LE(ts, 0); b.writeUInt32LE(dist, 4); body.push(...b); }
  const hdr = Buffer.alloc(12); hdr.writeUInt8(12, 0); hdr.writeUInt8(16, 1); hdr.writeUInt16LE(2100, 2); hdr.writeUInt32LE(body.length, 4); hdr.write('.FIT', 8);
  const file = Buffer.concat([hdr, Buffer.from(body), Buffer.alloc(2)]);
  const r = P.parseFIT(file); assert.ok(!r.error, r.error); assert.ok(Math.abs(r.marks[r.marks.length - 1] - 48.5) < 0.6);
});
test('too short recording', () => { const r = P.parseCSV('time,distance\n0,0\n10,80\n20,160\n30,240\n40,300\n50,350'); assert.ok(r.error); });
