/* ---------------- 3D ---------------- */
const view = $('#view'), labelsEl = $('#labels');
let renderer, scene, camera, controls, runners = [], trackMats = {};
const TR = M.TRACK, A = TR.straight / 2, R_IN = TR.kerbR, R_OUT = TR.kerbR + TR.lanes * TR.laneW;
const TRACK_COLORS = { red: { surf: 0x8e3725, apron: 0x732d1f }, blue: { surf: 0x2a5590, apron: 0x22467a }, purple: { surf: 0x55397f, apron: 0x45306a } };

function stadiumPts(r, n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const L = 2 * TR.straight + 2 * Math.PI * r; const p = i / n * L; const b = Math.PI * r; let x, z, q = p;
    if (q < b) { const f = q / r; x = A + r * Math.sin(f); z = r * Math.cos(f); }
    else if ((q -= b) < TR.straight) { x = A - q; z = -r; }
    else if ((q -= TR.straight) < b) { const f = q / r; x = -A - r * Math.sin(f); z = -r * Math.cos(f); }
    else { q -= b; x = -A + q; z = r; }
    pts.push(new THREE.Vector2(x, -z));
  }
  return pts;
}
function ringMesh(r1, r2, mat, y) {
  const shape = new THREE.Shape(stadiumPts(r2, 240));
  shape.holes.push(new THREE.Path(stadiumPts(r1, 240).reverse()));
  const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat);
  m.rotation.x = -Math.PI / 2; m.position.y = y; return m;
}

function init3D() {
  if (!window.THREE) { view.innerHTML = '<div class="empty" style="margin:20px">The 3D view could not load. The race model and coach report still work.</div>'; return; }
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  view.appendChild(renderer.domElement);
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0d12);
  scene.fog = new THREE.Fog(0x0a0d12, 170, 380);
  camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
  camera.position.set(0, 95, 125);
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.49; controls.minDistance = 3; controls.maxDistance = 320;
  controls.addEventListener('start', () => setCam('free'));

  scene.add(new THREE.HemisphereLight(0xe8eeff, 0x1a1410, 0.85));
  const dl = new THREE.DirectionalLight(0xfff4e6, 0.95); dl.position.set(40, 90, 60); scene.add(dl);
  const dl2 = new THREE.DirectionalLight(0xa9bbdd, 0.35); dl2.position.set(-60, 40, -50); scene.add(dl2);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), new THREE.MeshStandardMaterial({ color: 0x101419, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.03; scene.add(ground);
  const grass = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(stadiumPts(R_IN, 240))), new THREE.MeshStandardMaterial({ color: 0x2c5a32, roughness: 1 }));
  grass.rotation.x = -Math.PI / 2; scene.add(grass);
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0x336a3a, roughness: 1 });
  for (let i = -5; i <= 5; i += 2) { const st = new THREE.Mesh(new THREE.PlaneGeometry(8, 2 * R_IN - 6), stripeMat); st.rotation.x = -Math.PI / 2; st.position.set(i * 8, 0.002, 0); scene.add(st); }
  trackMats.surf = new THREE.MeshStandardMaterial({ color: TRACK_COLORS.red.surf, roughness: 0.9 });
  trackMats.apron = new THREE.MeshStandardMaterial({ color: TRACK_COLORS.red.apron, roughness: 0.95 });
  scene.add(ringMesh(R_IN, R_OUT, trackMats.surf, 0.005));
  scene.add(ringMesh(R_OUT, R_OUT + 3.5, trackMats.apron, 0.004));
  scene.add(ringMesh(R_IN - 0.25, R_IN, new THREE.MeshStandardMaterial({ color: 0xe9ecef, roughness: 0.6 }), 0.03));
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
  for (let i = 1; i <= TR.lanes; i++) scene.add(ringMesh(R_IN + i * TR.laneW - 0.025, R_IN + i * TR.laneW + 0.025, lineMat, 0.012));
  const fin = new THREE.Mesh(new THREE.PlaneGeometry(0.05, R_OUT - R_IN), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  fin.rotation.x = -Math.PI / 2; fin.position.set(A, 0.014, (R_IN + R_OUT) / 2); scene.add(fin);
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 0.2), new THREE.MeshStandardMaterial({ color: 0xf7f8fa }));
  post.position.set(A, 1.6, R_IN - 1.2); scene.add(post);
  for (let l = 1; l <= TR.lanes; l++) {
    const P = M.lanePos(l, M.stagger(l)); const ox = -P.hz, oz = P.hx;
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(TR.laneW - 0.05, 0.05), lineMat);
    bar.position.set(P.x + ox * 0.35, 0.014, P.z + oz * 0.35); bar.rotation.set(-Math.PI / 2, 0, -Math.atan2(oz, ox)); scene.add(bar);
  }
  const standShape = new THREE.Shape(stadiumPts(R_OUT + 18, 200)); standShape.holes.push(new THREE.Path(stadiumPts(R_OUT + 7, 200).reverse()));
  const stand = new THREE.Mesh(new THREE.ExtrudeGeometry(standShape, { depth: 5, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: 0x1a1f27, roughness: 1 }));
  stand.rotation.x = -Math.PI / 2; scene.add(stand);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x2a2f37 }), headMat = new THREE.MeshBasicMaterial({ color: 0xfff6e0 });
  [[-95, -74], [95, -74], [-95, 74], [95, 74]].forEach(([x, z]) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 40, 8), poleMat); p.position.set(x, 20, z); scene.add(p);
    const h = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 0.6), headMat); h.position.set(x, 40, z); h.lookAt(0, 0, 0); scene.add(h);
  });
  new ResizeObserver(resize).observe(view); resize();
  requestAnimationFrame(loop);
}
function paintTrack() { if (!trackMats.surf) return; const c = TRACK_COLORS[state.track]; trackMats.surf.color.setHex(c.surf); trackMats.apron.color.setHex(c.apron); }
function resize() {
  if (!renderer) return; const w = view.clientWidth, h = view.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
}

/* ---- runner figure and sprint gait ---- */
const D2R = Math.PI / 180;
// keyframes over one stride cycle (u = 0 at touchdown of this leg); degrees. Stance ~22% of the cycle, then flight.
const HIP = [[0, 25], [0.11, 2], [0.22, -22], [0.34, 8], [0.5, 45], [0.64, 68], [0.8, 55], [0.92, 34], [1, 25]];
const KNEE = [[0, 22], [0.1, 40], [0.22, 22], [0.34, 95], [0.47, 128], [0.6, 112], [0.76, 68], [0.9, 30], [1, 22]];
const ANKLE = [[0, 0], [0.1, -12], [0.22, 28], [0.4, 10], [0.7, -10], [0.92, -6], [1, 0]];
function kf(tab, u) {
  u = ((u % 1) + 1) % 1;
  let i = 0; while (i < tab.length - 2 && tab[i + 1][0] <= u) i++;
  const [u0, a0] = tab[i], [u1, a1] = tab[i + 1];
  const f = (u - u0) / (u1 - u0), s = f * f * (3 - 2 * f);
  return a0 + (a1 - a0) * s;
}
function makeRunner(a) {
  const ghost = isGhost(a), W = a.sex === 'W';
  const mats = [];
  const mat = (color, rough) => { const m = new THREE.MeshStandardMaterial({ color, roughness: rough }); if (ghost) { m.transparent = true; m.opacity = 0.3; m.depthWrite = false; } mats.push(m); return m; };
  const kit = mat(new THREE.Color(a.color), 0.5);
  const kit2 = mat(new THREE.Color(a.color).multiplyScalar(0.55), 0.6);
  const skin = mat(new THREE.Color(0xc9ced6), 0.65);
  const hair = mat(new THREE.Color(0x2b2e35), 0.8);
  const shoe = mat(new THREE.Color(0x1b1f26), 0.5);
  const seg = (r1, r2, len, m) => { const g = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, len, 10), m); g.position.y = -len / 2; return g; };
  const ball = (r, m) => new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), m);
  // build: women slightly narrower shoulders, wider hips, slimmer limbs
  const SH = W ? 0.178 : 0.2, HIPW = W ? 0.09 : 0.085, LIMB = W ? 0.9 : 1, CHEST = W ? 0.158 : 0.175;
  const root = new THREE.Group(); root.rotation.order = 'YXZ';
  const lean = new THREE.Group(); root.add(lean);
  const pelvis = new THREE.Group(); pelvis.position.y = 0.98; lean.add(pelvis);
  const shorts = new THREE.Mesh(new THREE.CylinderGeometry(W ? 0.145 : 0.15, W ? 0.15 : 0.14, W ? 0.13 : 0.2, 12), kit2); shorts.scale.z = 0.75; shorts.position.y = W ? 0.02 : 0; pelvis.add(shorts);
  const trunk = new THREE.Group(); pelvis.add(trunk);
  if (W) {
    // crop top over the chest, skin at the midriff
    const mid = new THREE.Mesh(new THREE.CylinderGeometry(0.128, 0.135, 0.2, 12), skin); mid.scale.z = 0.62; mid.position.y = 0.14; trunk.add(mid);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(CHEST, 0.13, 0.32, 12), kit); top.scale.z = 0.66; top.position.y = 0.4; trunk.add(top);
  } else {
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(CHEST, 0.13, 0.52, 12), kit); torso.scale.z = 0.62; torso.position.y = 0.3; trunk.add(torso);
  }
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.048, 0.12, 8), skin); neck.position.y = 0.62; trunk.add(neck);
  const headG = new THREE.Group(); headG.position.y = 0.76; trunk.add(headG);
  const head = ball(W ? 0.1 : 0.105, skin); head.scale.set(0.9, 1.05, 1); headG.add(head);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(W ? 0.106 : 0.11, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), hair); cap.scale.set(0.92, 1.05, 1.02); cap.position.set(0, 0.012, -0.008); cap.rotation.x = -0.25; headG.add(cap);
  let tail = null;
  if (W) {
    const bun = ball(0.045, hair); bun.position.set(0, 0.05, -0.1); headG.add(bun);
    tail = new THREE.Group(); tail.position.set(0, 0.04, -0.12); headG.add(tail);
    const t1 = seg(0.035, 0.012, 0.22, hair); tail.add(t1); tail.rotation.x = 0.5;
  }
  const legs = [], arms = [];
  for (const side of [1, -1]) {
    const hip = new THREE.Group(); hip.position.set(HIPW * side, -0.02, 0); pelvis.add(hip);
    hip.add(seg(0.078 * LIMB, 0.056 * LIMB, 0.46, skin));
    if (!W) { const leg = seg(0.084, 0.072, 0.17, kit2); hip.add(leg); }   // men: shorts over the upper thigh
    const knee = new THREE.Group(); knee.position.y = -0.46; hip.add(knee);
    knee.add(ball(0.056 * LIMB, skin)); knee.add(seg(0.054 * LIMB, 0.034 * LIMB, 0.44, skin));
    const ankle = new THREE.Group(); ankle.position.y = -0.45; knee.add(ankle);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.06, 0.25), shoe); foot.position.set(0, -0.025, 0.07); ankle.add(foot);
    legs.push({ hip, knee, ankle, side });
    const sh = new THREE.Group(); sh.position.set(SH * side, 0.55, 0); trunk.add(sh);
    sh.add(ball(0.055 * LIMB, W ? skin : kit)); sh.add(seg(0.046 * LIMB, 0.036 * LIMB, 0.28, skin));
    const el = new THREE.Group(); el.position.y = -0.28; sh.add(el);
    el.add(seg(0.035 * LIMB, 0.028 * LIMB, 0.25, skin));
    const hand = ball(0.04 * LIMB, skin); hand.position.y = -0.27; el.add(hand);
    arms.push({ sh, el, side });
  }
  const ring = new THREE.Mesh(new THREE.RingGeometry(ghost ? 0.5 : 0.45, 0.55, 28), new THREE.MeshBasicMaterial({ color: new THREE.Color(a.color), transparent: true, opacity: ghost ? 0.35 : 0.9, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; root.add(ring);
  lean.scale.setScalar(a.p.height / 1.8);
  if (ghost) root.renderOrder = 2;
  scene.add(root);
  return { a, root, lean, pelvis, trunk, legs, arms, tail, cycle: 0, lab: null, ghost };
}
function poseRunner(rn, v, s, t, R, dtSim) {
  const a = rn.a;
  const st = M.strideAt(v, a.p);
  rn.cycle += (st.sf / 2) * dtSim;                    // one cycle = two steps
  const u = rn.cycle;
  const amp = Math.min(1, Math.max(0.35, v / 8));
  const tSince = state.results && !state.stale ? t - a.p.rt : -1;
  const w = tSince <= 0 ? 0 : Math.min(1, tSince / 0.4); // blend from the set position into running
  const set = 1 - w;
  const drive = s < 30 ? 1 - s / 30 : 0;
  rn.trunk.rotation.x = (12 + 30 * drive * drive) * D2R * w + 62 * D2R * set;
  rn.pelvis.position.y = 0.98 + (-0.035 * Math.cos(2 * Math.PI * (2 * u - 0.22))) * amp * w - 0.42 * set;
  rn.pelvis.position.z = 0.25 * set;
  rn.legs.forEach(L => {
    const uu = u + (L.side > 0 ? 0 : 0.5);
    const k = 0.55 + 0.45 * amp;
    const hipSet = L.side > 0 ? 95 : 45, kneeSet = L.side > 0 ? 95 : 120;
    L.hip.rotation.x = -((kf(HIP, uu) * k) * w + hipSet * set) * D2R;
    L.knee.rotation.x = ((kf(KNEE, uu) * k) * w + kneeSet * set) * D2R;
    L.ankle.rotation.x = kf(ANKLE, uu) * w * D2R;
  });
  rn.arms.forEach(Ar => {
    const ph = Math.cos(2 * Math.PI * (u - (Ar.side > 0 ? 0.15 : 0.65)));
    Ar.sh.rotation.x = -(((55 * ph - 8) * amp) * w + 60 * set) * D2R;
    Ar.el.rotation.x = -((88 + 18 * ph) * w + 5 * set) * D2R;
    Ar.sh.rotation.z = Ar.side * (6 + 4 * (1 - ph)) * D2R * w;
  });
  rn.lean.rotation.z = R !== Infinity ? -Math.atan(v * v / (9.81 * R)) : 0;
  if (rn.tail) { rn.tail.rotation.x = 0.4 + (0.2 + 0.15 * Math.sin(4 * Math.PI * u)) * amp * w; rn.tail.rotation.z = 0.25 * Math.sin(2 * Math.PI * u) * amp * w; }
}
function rebuildRunners() {
  if (!scene) return;
  runners.forEach(r => scene.remove(r.root)); runners = [];
  for (const a of state.athletes) runners.push(makeRunner(a));
  rebuildLabels();
  placeRunners(0);
}
function rebuildLabels() {
  labelsEl.innerHTML = '';
  for (const rn of runners) {
    const d = document.createElement('div'); d.className = 'lab';
    if (rn.ghost) d.classList.add('lab-ghost');
    d.innerHTML = `<i style="background:${rn.a.color}"></i><b>${rn.ghost ? 'Ghost · ' : ''}${esc(short(rn.a.name))}</b><em></em>`;
    labelsEl.appendChild(d); rn.lab = d;
  }
  labelsEl.hidden = !state.labels;
}
function placeRunners(dtSim) {
  for (const rn of runners) {
    const a = rn.a, r = state.results && state.results[a.id];
    let s = 0, v = 0;
    if (r && !state.stale) { const smp = sampleAt(r, state.t); s = smp.s; v = smp.v; }
    const P = M.lanePos(a.lane, M.stagger(a.lane) + s);
    const ox = -P.hz, oz = P.hx;
    const off = rn.ghost ? 0.85 : 0.35; // a ghost runs on the outer half of the same lane
    rn.root.position.set(P.x + ox * off, 0, P.z + oz * off);
    rn.root.rotation.y = Math.atan2(P.hx, P.hz);
    poseRunner(rn, v, s, state.t, P.R, dtSim);
    rn.s = s; rn.v = v; rn.pos = rn.root.position; rn.head = P;
  }
}
const tmpV = window.THREE ? new THREE.Vector3() : null;
function placeLabels() {
  if (!state.labels || !runners.length) return;
  const w = view.clientWidth, h = view.clientHeight;
  for (const rn of runners) {
    tmpV.set(rn.pos.x, 2.2 * rn.a.p.height / 1.8, rn.pos.z).project(camera);
    const vis = tmpV.z < 1 && tmpV.x > -1.1 && tmpV.x < 1.1 && tmpV.y > -1.1 && tmpV.y < 1.1;
    rn.lab.style.display = vis ? '' : 'none';
    if (!vis) continue;
    rn.lab.style.transform = `translate(${((tmpV.x * 0.5 + 0.5) * w).toFixed(1)}px, ${((-tmpV.y * 0.5 + 0.5) * h).toFixed(1)}px) translate(-50%, -100%)`;
    const r = state.results && state.results[rn.a.id];
    const txt = r && !state.stale && state.t >= r.time ? fmtT(r.time) : '';
    const em = rn.lab.querySelector('em'); if (em.textContent !== txt) em.textContent = txt;
  }
}

const camGoal = window.THREE ? { pos: new THREE.Vector3(0, 95, 125), tgt: new THREE.Vector3(0, 0, 0) } : null;
function setCam(m) { state.cam = m; document.querySelectorAll('[data-cam]').forEach(b => b.setAttribute('aria-pressed', b.dataset.cam === m)); }
document.querySelectorAll('[data-cam]').forEach(b => b.addEventListener('click', () => setCam(b.dataset.cam)));
$('#labelsBtn').addEventListener('click', () => { state.labels = !state.labels; $('#labelsBtn').setAttribute('aria-pressed', state.labels); labelsEl.hidden = !state.labels; });

function updateCam(dt) {
  if (state.cam === 'free' || !runners.length) return;
  if (state.cam === 'overview') { camGoal.pos.set(0, 96, 122); camGoal.tgt.set(0, 0, 4); }
  else if (state.cam === 'finish') { camGoal.pos.set(A + 3, 8, R_OUT + 9); camGoal.tgt.set(A - 22, 0.6, (R_IN + R_OUT) / 2); }
  else {
    // TV-style: follow the athlete selected in the Lanes list, from the outside of the track
    const f = runners.find(r => r.a.id === state.sel) || runners[0];
    const hx = f.head.hx, hz = f.head.hz, ox = -hz, oz = hx;
    camGoal.tgt.set(f.pos.x + hx * 2 - ox * 2, 1.0, f.pos.z + hz * 2 - oz * 2);
    camGoal.pos.set(f.pos.x + ox * 9 - hx * 5, 4.2, f.pos.z + oz * 9 - hz * 5);
  }
  const k = 1 - Math.exp(-dt * 4);
  camera.position.lerp(camGoal.pos, k);
  controls.target.lerp(camGoal.tgt, k);
}

let last = performance.now(), liveAcc = 0;
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  let dtSim = 0;
  if (state.results && state.playing && !state.stale) {
    dtSim = dt * state.speed;
    state.t = Math.min(state.duration, state.t + dtSim);
    if (state.t >= state.duration) { state.playing = false; $('#playBtn').textContent = 'Play'; }
  }
  placeRunners(dtSim);
  updateCam(dt);
  controls.update();
  renderer.render(scene, camera);
  placeLabels();
  liveAcc += dt;
  if (liveAcc > 0.1) { liveAcc = 0; renderLive(); updateClock(); }
  requestAnimationFrame(loop);
}
function updateClock() {
  const t = state.results && !state.stale ? state.t : 0;
  const shown = state.results ? Math.min(t, Math.max(...Object.values(state.results).map(r => r.time))) : 0;
  $('#clock').innerHTML = shown.toFixed(2) + '<small>' + (state.stale ? 'press run' : 's') + '</small>';
}
$('#playBtn').addEventListener('click', () => {
  if (!state.results) return;
  if (state.t >= state.duration) state.t = 0;
  state.playing = !state.playing; $('#playBtn').textContent = state.playing ? 'Pause' : 'Play';
});
$('#restartBtn').addEventListener('click', () => { state.t = 0; state.playing = true; $('#playBtn').textContent = 'Pause'; runners.forEach(r => r.cycle = 0); });
document.querySelectorAll('[data-speed]').forEach(b => b.addEventListener('click', () => {
  state.speed = +b.dataset.speed; document.querySelectorAll('[data-speed]').forEach(x => x.setAttribute('aria-pressed', x === b));
}));
$('#collapseBtn').addEventListener('click', () => { $('#app').classList.toggle('collapsed'); setTimeout(() => { resize(); drawChart(); }, 30); });
window.addEventListener('resize', () => drawChart());

