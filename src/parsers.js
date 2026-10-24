// Readers for recorded 400 m runs: typed or pasted split times, CSV (split tables, timing gates, laser or radar
// streams), GPX, TCX and FIT files. Every reader ends in the same shape:
//   { marks: [cumulative s at 50, 100, ... 400 m] (8 values) or at 100..400 m (4 values), source, approx, note, trace? }
(function (root) {
  'use strict';

  // "47.31", "0:47.31", "1:02.5", "47,31"
  function parseTime(str) {
    if (str == null) return NaN;
    const s = String(str).trim().replace(',', '.');
    if (!s) return NaN;
    if (s.includes(':')) {
      const p = s.split(':').map(Number);
      if (p.some(x => !isFinite(x))) return NaN;
      return p.reduce((acc, x) => acc * 60 + x, 0);
    }
    const n = Number(s);
    return isFinite(n) ? n : NaN;
  }

  // Check and normalise a list of cumulative marks (4 x 100 m or 8 x 50 m).
  function checkMarks(marks) {
    if (!(marks.length === 4 || marks.length === 8)) return 'Give the time at every 100 m (4 times) or every 50 m (8 times).';
    if (marks.some(x => !isFinite(x) || x <= 0)) return 'Every time must be a number of seconds, like 11.42 or 0:47.31.';
    for (let i = 1; i < marks.length; i++) if (marks[i] <= marks[i - 1]) return 'Times must increase from one mark to the next. Enter cumulative times (at 100 m, at 200 m…), not lap splits.';
    const L = 400 / marks.length, total = marks[marks.length - 1];
    if (total < 40 || total > 90) return 'The 400 m time must be between 40 and 90 s.';
    const segs = marks.map((x, i) => i ? x - marks[i - 1] : x);
    const vmax = Math.max(...segs.slice(1).map(s => L / s));
    if (vmax > 12.6) return `One section works out at ${vmax.toFixed(1)} m/s, faster than any human. Check the times.`;
    return null;
  }

  // If a list of 4/8 numbers looks like section times (each ~9–20 s for 100 m), turn them into cumulative marks.
  function toCumulative(nums) {
    const n = nums.length; if (!(n === 4 || n === 8)) return nums;
    const L = 400 / n, increasing = nums.every((x, i) => !i || x > nums[i - 1]);
    const lapLike = nums.every(x => x > L * 0.075 && x < L * 0.2);
    if (!increasing || (lapLike && nums[n - 1] < 30)) { let c = 0; return nums.map(x => +(c += x).toFixed(3)); }
    return nums;
  }

  // Interpolate the time at each mark from a time–distance series; start = time at the start of the 400 m.
  function marksFromSeries(t, d, start, startDist, n) {
    const out = [], L = 400 / n;
    let j = 0;
    for (let k = 1; k <= n; k++) {
      const target = startDist + k * L;
      while (j < d.length - 1 && d[j + 1] < target) j++;
      if (j >= d.length - 1) return null;
      const f = (target - d[j]) / Math.max(1e-9, d[j + 1] - d[j]);
      out.push(+(t[j] + f * (t[j + 1] - t[j]) - start).toFixed(3));
    }
    return out;
  }
  // Fastest 400 m inside a longer recording (warm-up and recovery are ignored).
  function fastest400(t, d) {
    let best = null, j = 0;
    for (let i = 0; i < d.length; i++) {
      if (j < i) j = i;
      while (j < d.length - 1 && d[j] - d[i] < 400) j++;
      if (d[j] - d[i] < 400) break;
      const f = (d[i] + 400 - d[j - 1]) / Math.max(1e-9, d[j] - d[j - 1]);
      const tEnd = t[j - 1] + f * (t[j] - t[j - 1]);
      const dur = tEnd - t[i];
      if (!best || dur < best.dur) best = { i, dur, start: t[i], startDist: d[i] };
    }
    return best;
  }
  // Make distance non-decreasing and drop duplicate times.
  function clean(t, d) {
    const T = [], D = [];
    let maxD = -Infinity;
    for (let i = 0; i < t.length; i++) {
      if (!isFinite(t[i]) || !isFinite(d[i])) continue;
      if (T.length && t[i] <= T[T.length - 1]) continue;
      maxD = Math.max(maxD, d[i]);
      T.push(t[i]); D.push(maxD);
    }
    return { t: T, d: D };
  }
  function fromSeries(t, d, source, approx, note) {
    const c = clean(t, d);
    if (c.t.length < 5) return { error: 'The file has too few points to find a 400 m run.' };
    const total = c.d[c.d.length - 1] - c.d[0];
    if (total < 400) return { error: `The recording covers only ${Math.round(total)} m, so it does not contain a full 400 m.` };
    const best = fastest400(c.t, c.d);
    if (!best) return { error: 'Could not find a continuous 400 m in this recording.' };
    // Use 50 m marks when the data is dense enough (at least ~3 points per 50 m), else 100 m marks.
    const ptsPer400 = c.d.filter(x => x >= best.startDist && x <= best.startDist + 400).length;
    const n = ptsPer400 >= 24 ? 8 : 4;
    const marks = marksFromSeries(c.t, c.d, best.start, best.startDist, n);
    if (!marks) return { error: 'Could not find a continuous 400 m in this recording.' };
    const extra = total > 420 ? ` The recording is ${Math.round(total)} m long; the fastest 400 m inside it was used.` : '';
    return { marks, source, approx, note: (note || '') + extra };
  }

  /* ---------- typed or pasted text ---------- */
  function parseText(text) {
    const nums = String(text).split(/[\s;|\t]+|,(?=\s)/).map(parseTime).filter(x => isFinite(x));
    if (nums.length !== 4 && nums.length !== 8) return { error: 'Paste 4 times (every 100 m) or 8 times (every 50 m).' };
    const marks = toCumulative(nums);
    const err = checkMarks(marks);
    return err ? { error: err } : { marks, source: 'splits', approx: false, note: '' };
  }

  /* ---------- CSV ---------- */
  function splitRow(line) {
    const sep = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
    return line.split(sep).map(x => x.trim().replace(/^"|"$/g, ''));
  }
  function parseCSV(text) {
    const lines = String(text).split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    if (!lines.length) return { error: 'The file is empty.' };
    let header = null, rows = lines.map(splitRow);
    if (rows[0].some(c => /[a-z]/i.test(c) && !isFinite(parseTime(c)))) { header = rows[0].map(h => h.toLowerCase()); rows = rows.slice(1); }
    const num = rows.map(r => r.map(parseTime));
    const cols = num[0] ? num[0].length : 0;
    const find = re => header ? header.findIndex(h => re.test(h)) : -1;
    let ti = find(/time|^t$|sec|split|elapsed/), di = find(/dist|^d$|meter|metre|^m$/), vi = find(/speed|veloc|^v$|m\/s/);
    // single column of times
    if (cols === 1 || (rows.length === 1 && cols >= 4)) {
      const flat = cols === 1 ? num.map(r => r[0]) : num[0];
      return parseText(flat.join(' '));
    }
    // guess columns without a header: distance is the column ending near/after 400 with round steps
    if (!header || (ti < 0 && di < 0 && vi < 0)) {
      const colVals = k => num.map(r => r[k]).filter(isFinite);
      const looksDist = k => { const v = colVals(k); return v.length > 1 && v[v.length - 1] >= 380 && v.every((x, i) => !i || x >= v[i - 1]); };
      di = [0, 1].find(looksDist); if (di == null) di = -1;
      ti = di === 0 ? 1 : 0;
    }
    if (ti >= 0 && di >= 0) {
      const t = num.map(r => r[ti]), d = num.map(r => r[di]);
      const pairs = t.map((x, i) => [d[i], x]).filter(p => isFinite(p[0]) && isFinite(p[1]));
      const markRows = pairs.filter(p => p[0] > 0 && Math.abs(p[0] / 50 - Math.round(p[0] / 50)) < 1e-6);
      // a split table: rows at 50 or 100 m marks only
      if (pairs.length <= 10 && markRows.length === pairs.length) {
        const by = new Map(pairs);
        const m8 = [50, 100, 150, 200, 250, 300, 350, 400].map(x => by.get(x));
        const m4 = [100, 200, 300, 400].map(x => by.get(x));
        let marks = m8.every(isFinite) ? m8 : m4.every(isFinite) ? m4 : null;
        if (!marks) return { error: 'The table needs a time at every 100 m (or every 50 m) up to 400 m.' };
        marks = toCumulative(marks);
        const err = checkMarks(marks);
        return err ? { error: err } : { marks, source: 'splits', approx: false, note: '' };
      }
      return fromSeries(t, d, 'gates', false, 'Read as timing gates or laser data (time against distance).');
    }
    if (ti >= 0 && vi >= 0) {
      // radar: integrate speed over time
      const t = num.map(r => r[ti]), v = num.map(r => r[vi]);
      const d = [0];
      for (let i = 1; i < t.length; i++) d.push(d[i - 1] + 0.5 * ((v[i] || 0) + (v[i - 1] || 0)) * Math.max(0, t[i] - t[i - 1]));
      return fromSeries(t, d, 'gates', false, 'Read as radar data: distance comes from integrating the speed.');
    }
    return { error: 'Could not tell which columns hold time and distance. Name the columns "time" and "distance" (or "speed").' };
  }

  /* ---------- GPX / TCX ---------- */
  const R_EARTH = 6371008.8;
  function hav(a, b) {
    const r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2;
    return 2 * R_EARTH * Math.asin(Math.sqrt(x));
  }
  function attr(tag, name) { const m = tag.match(new RegExp(name + '\\s*=\\s*"([^"]+)"')); return m ? Number(m[1]) : NaN; }
  function tagVal(block, name) { const m = block.match(new RegExp('<(?:\\w+:)?' + name + '>([^<]+)</(?:\\w+:)?' + name + '>')); return m ? m[1].trim() : null; }
  function parseGPX(text) {
    const pts = [];
    const re = /<trkpt\b([^>]*)>([\s\S]*?)<\/trkpt>/g; let m;
    while ((m = re.exec(text))) {
      const lat = attr(m[1], 'lat'), lon = attr(m[1], 'lon'), time = tagVal(m[2], 'time');
      if (isFinite(lat) && isFinite(lon) && time) pts.push({ lat, lon, t: Date.parse(time) / 1000 });
    }
    if (pts.length < 5) return { error: 'No timed GPS points found in this GPX file.' };
    const t0 = pts[0].t, t = [], d = [0];
    pts.forEach((p, i) => { t.push(p.t - t0); if (i) d.push(d[i - 1] + hav([pts[i - 1].lat, pts[i - 1].lon], [p.lat, p.lon])); });
    return fromSeries(t, d, 'gps', true, 'From GPS positions: expect errors of a few tenths of a second per split.');
  }
  function parseTCX(text) {
    const pts = [];
    const re = /<Trackpoint>([\s\S]*?)<\/Trackpoint>/g; let m;
    while ((m = re.exec(text))) {
      const time = tagVal(m[1], 'Time'), dist = Number(tagVal(m[1], 'DistanceMeters'));
      const lat = Number(tagVal(m[1], 'LatitudeDegrees')), lon = Number(tagVal(m[1], 'LongitudeDegrees'));
      if (time) pts.push({ t: Date.parse(time) / 1000, dist, lat, lon });
    }
    if (pts.length < 5) return { error: 'No timed points found in this TCX file.' };
    const t0 = pts[0].t, t = pts.map(p => p.t - t0);
    let d;
    if (pts.every(p => isFinite(p.dist))) d = pts.map(p => p.dist);
    else if (pts.every(p => isFinite(p.lat))) { d = [0]; for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + hav([pts[i - 1].lat, pts[i - 1].lon], [pts[i].lat, pts[i].lon])); }
    else return { error: 'The TCX file has no distance or position data.' };
    return fromSeries(t, d, 'gps', true, 'From the watch\'s distance: expect errors of a few tenths of a second per split.');
  }

  /* ---------- FIT (Garmin, Coros, Wahoo, Suunto…) ---------- */
  function parseFIT(buf) {
    const dv = new DataView(buf instanceof ArrayBuffer ? buf : buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    if (dv.byteLength < 14) return { error: 'This FIT file is too short.' };
    const hsize = dv.getUint8(0);
    const sig = String.fromCharCode(dv.getUint8(8), dv.getUint8(9), dv.getUint8(10), dv.getUint8(11));
    if (sig !== '.FIT') return { error: 'This is not a FIT file.' };
    const dataEnd = Math.min(dv.byteLength, hsize + dv.getUint32(4, true));
    const defs = {};
    let p = hsize, lastTs = null;
    const T = [], D = [], V = [];
    const readField = (o, size, base, little) => {
      const bt = base & 0x1f;
      if (size === 1) { const x = dv.getUint8(o); return x === 0xff ? null : x; }
      if (size === 2) { const x = dv.getUint16(o, little); return x === 0xffff ? null : x; }
      if (size === 4) {
        if (bt === 5) { const x = dv.getInt32(o, little); return x === 0x7fffffff ? null : x; }
        const x = dv.getUint32(o, little); return x === 0xffffffff ? null : x;
      }
      return null;
    };
    try {
      while (p < dataEnd) {
        const h = dv.getUint8(p++);
        if (h & 0x80) {                                  // compressed timestamp header
          const local = (h >> 5) & 0x03, offs = h & 0x1f, def = defs[local];
          if (!def) return { error: 'This FIT file could not be read.' };
          if (lastTs != null) { let ts = (lastTs & ~0x1f) + offs; if (offs < (lastTs & 0x1f)) ts += 0x20; lastTs = ts; }
          const rec = {}; let o = p;
          for (const f of def.fields) { rec[f.num] = readField(o, f.size, f.base, def.little); o += f.size; }
          p += def.len;
          if (def.global === 20) { rec[253] = lastTs; pushRec(rec); }
          continue;
        }
        const local = h & 0x0f;
        if (h & 0x40) {                                  // definition message
          const little = dv.getUint8(p + 1) === 0, global = dv.getUint16(p + 2, little), nf = dv.getUint8(p + 4);
          p += 5; const fields = []; let len = 0;
          for (let i = 0; i < nf; i++) { const f = { num: dv.getUint8(p), size: dv.getUint8(p + 1), base: dv.getUint8(p + 2) }; fields.push(f); len += f.size; p += 3; }
          if (h & 0x20) { const nd = dv.getUint8(p++); for (let i = 0; i < nd; i++) { len += dv.getUint8(p + 1); p += 3; } }
          defs[local] = { little, global, fields, len };
        } else {                                         // data message
          const def = defs[local]; if (!def) return { error: 'This FIT file could not be read.' };
          const rec = {}; let o = p;
          for (const f of def.fields) { rec[f.num] = readField(o, f.size, f.base, def.little); o += f.size; }
          p += def.len;
          if (rec[253] != null) lastTs = rec[253];
          if (def.global === 20) pushRec(rec);
        }
      }
    } catch (e) { return { error: 'This FIT file could not be read to the end.' }; }
    function pushRec(rec) {
      if (rec[253] == null) return;
      // fractional seconds can live in field 254? (not standard for records); integer timestamps are interpolated
      T.push(rec[253]); D.push(rec[5] != null ? rec[5] / 100 : NaN); V.push(rec[73] != null ? rec[73] / 1000 : rec[6] != null ? rec[6] / 1000 : NaN);
    }
    if (T.length < 5) return { error: 'No timed records found in this FIT file.' };
    const t0 = T[0], t = T.map(x => x - t0);
    let d = D;
    if (D.filter(isFinite).length < T.length * 0.8) {
      if (V.filter(isFinite).length < T.length * 0.8) return { error: 'The FIT file has no distance or speed data.' };
      d = [0]; for (let i = 1; i < t.length; i++) d.push(d[i - 1] + 0.5 * ((V[i] || 0) + (V[i - 1] || 0)) * (t[i] - t[i - 1]));
    }
    return fromSeries(t, d, 'gps', true, 'From the watch file: most watches record once per second, so expect errors of a few tenths of a second per split.');
  }

  function parseFile(name, data) {
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (ext === 'fit') return parseFIT(data);
    const text = typeof data === 'string' ? data : new TextDecoder().decode(data);
    if (ext === 'gpx' || /<gpx[\s>]/i.test(text)) return parseGPX(text);
    if (ext === 'tcx' || /<TrainingCenterDatabase/i.test(text)) return parseTCX(text);
    return parseCSV(text);
  }

  const api = { parseTime, parseText, parseCSV, parseGPX, parseTCX, parseFIT, parseFile, checkMarks, toCumulative, fastest400 };
  if (typeof module !== 'undefined') module.exports = api; else root.RunParsers = api;
})(this);
