// Builds docs/index.html: one self-contained page (three.js loads from a CDN), served by GitHub Pages.
const fs = require('fs'), path = require('path');
const R = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const ORDER = ['head', 'lanes', 'picker', 'past', 'editor', 'cond', 'sim', 'live', 'report', 'chart', 'history', 'compare', '3d', 'guide', 'boot'];
const main = ORDER.map(n => R('src/app/' + n + '.js')).join('\n');
let html = R('src/index.template.html');
const parts = { '/*MAIN*/': main, '/*MODEL*/': R('src/model.js'), '/*PARSERS*/': R('src/parsers.js'), '/*BENCH*/': R('data/benchmarks.js'), '/*FITS*/': R('data/fits.js') };
for (const [k, v] of Object.entries(parts)) { if (!html.includes(k)) throw new Error('missing placeholder ' + k); html = html.split(k).join(v); }
const page = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<style>body{margin:0}[hidden]{display:none!important}</style></head><body>\n' + html + '\n</body></html>\n';
fs.writeFileSync(path.join(__dirname, '../docs/index.html'), page);
console.log('docs/index.html', (page.length / 1024).toFixed(0) + ' KB');
