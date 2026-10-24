// Fits every real performance in data/benchmarks.js and writes data/fits.js (top speed, anaerobic capacity, fit error).
const path = require('path'), fs = require('fs');
const M = require('../src/model.js'), B = require('../data/benchmarks.js');
const out = {};
for (const r of B.RACES) for (const a of r.athletes) {
  const f = M.fitToSplits(r.sex, a, { alt: r.alt, temp: r.temp, hum: r.hum });
  out[r.id + '|' + a.name] = [+f.vmax.toFixed(3), f.ac, +f.fitErr.toFixed(3)];
}
fs.writeFileSync(path.join(__dirname, '../data/fits.js'), '(function(root){root.BENCH_FITS=' + JSON.stringify(out) + ';})(this);\n');
const errs = Object.values(out).map(x => x[2]).sort((a, b) => a - b);
console.log(`${errs.length} performances fitted · median error ${errs[errs.length >> 1]} s · max ${errs[errs.length - 1]} s`);
