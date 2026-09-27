// Shared parts for CombustionClear: atomic masses, fuels, the burning model (who ends up with which
// atom), molecules drawn as atom-coloured balls, flames, a digital balance, chart boards, puffs and
// layout helpers. +x right, +y up. Each chapter says what one scene unit is.
import { THREE, M, box, beam, rod, sphere, canvasTexture, clamp, smooth, lerp } from './kit.js';

// ---------------------------------------------------------------- constants
// Standard atomic weights (IUPAC 2021, conventional values).
export const AW = { C: 12.011, H: 1.008, O: 15.999, N: 14.007, Fe: 55.845 };
export const O2_AIR = 0.2314;          // mass fraction of O₂ in dry air (20.95 % by volume)
export const C_LIGHT = 299792458;      // m/s
export const MW = { O2: 31.998, CO2: 44.009, H2O: 18.015, CO: 28.010, C: 12.011 };
// Heat given back when CO burns on to CO₂ (283.0 kJ/mol) and when carbon burns to CO₂ (393.5 kJ/mol):
// standard enthalpies of combustion (NIST Chemistry WebBook). Energy left behind by incomplete burning.
export const H_CO = 0.2830, H_C = 0.3935;   // MJ per mol

// Fuels as CₓHᵧO_z. Heating values in MJ/kg, higher (HHV, water condensed) and lower (LHV, water left as
// vapour): methane 55.5 / 50.0, n-butane 49.5 / 45.7, n-octane 47.8 / 44.4 (Engineering Toolbox, "Fuels:
// higher and lower calorific values"; NIST). Wood is drawn as its main substance, cellulose (C₆H₁₀O₅)ₙ:
// dry wood gives about 16–18 MJ/kg (we use HHV 17.5, and LHV 16.1 once its water leaves as vapour).
// Glucose: 2,803 kJ/mol (HHV) ÷ 180.16 g/mol = 15.6 MJ/kg, the "4 kcal per gram" of food labels.
export const FUELS = {
  methane: { n: 'Methane', short: 'Methane', f: 'CH₄', C: 1, H: 4, O: 0, hhv: 55.5, lhv: 50.0, where: 'natural gas, PNG, CNG, biogas' },
  butane: { n: 'Butane (LPG)', short: 'LPG', f: 'C₄H₁₀', C: 4, H: 10, O: 0, hhv: 49.5, lhv: 45.7, where: 'the cooking-gas cylinder' },
  octane: { n: 'Octane (petrol)', short: 'Petrol', f: 'C₈H₁₈', C: 8, H: 18, O: 0, hhv: 47.8, lhv: 44.4, where: 'petrol, stands in for its mix of molecules' },
  wood: { n: 'Wood (cellulose)', short: 'Wood', f: 'C₆H₁₀O₅', C: 6, H: 10, O: 5, hhv: 17.5, lhv: 16.1, where: 'dry wood, paper, cotton' },
  glucose: { n: 'Glucose', short: 'Glucose', f: 'C₆H₁₂O₆', C: 6, H: 12, O: 6, hhv: 15.6, lhv: 14.1, where: 'the sugar your cells burn' },
};
export const mw = (f) => f.C * AW.C + f.H * AW.H + f.O * AW.O;
// O₂ molecules needed per fuel molecule for complete burning: x + y/4 − z/2.
export const stO2 = (f) => f.C + f.H / 4 - f.O / 2;
// Stoichiometric air-to-fuel ratio by mass.
export const afr = (f) => (stO2(f) * MW.O2) / mw(f) / O2_AIR;

// Who gets the oxygen. We use the textbook simplification for burning with too little air: hydrogen
// grabs its oxygen first (to water), then carbon goes to CO, and only then CO to CO₂. Anything left
// is spare O₂; if even CO runs short, carbon is left as soot. Every atom is kept track of, so mass in
// always equals mass out. n = moles of fuel (or a whole number of molecules), lam = air supplied ÷ air
// needed (λ). Works with whole numbers too, for drawing molecules.
export function share(f, n, lam, round = false) {
  let O2 = lam * stO2(f) * n; if (round) O2 = Math.round(O2);
  const H2O = (f.H / 2) * n, C = f.C * n;
  const Or = Math.max(0, 2 * O2 + f.O * n - H2O);
  let CO2 = 0, CO = 0, soot = 0, spare = 0;
  if (Or >= 2 * C) { CO2 = C; spare = (Or - 2 * C) / 2; }
  else if (Or >= C) { CO2 = Or - C; CO = 2 * C - Or; }
  else { CO = Or; soot = C - Or; }
  return { n, O2, H2O, CO2, CO, soot, spare };
}
// The same in grams, with heat. grams = fuel burned.
export function burn(fk, grams, lam = 1) {
  const f = FUELS[fk], n = grams / mw(f), r = share(f, n, lam);
  const g = { fuel: grams, O2: r.O2 * MW.O2, CO2: r.CO2 * MW.CO2, H2O: r.H2O * MW.H2O, CO: r.CO * MW.CO, soot: r.soot * MW.C, spare: r.spare * MW.O2 };
  g.O2used = g.O2 - g.spare;
  g.in = g.fuel + g.O2; g.out = g.CO2 + g.H2O + g.CO + g.soot + g.spare;
  g.air = g.O2 / O2_AIR;
  const MJ = (grams / 1000) * f.lhv - r.CO * H_CO - r.soot * H_C;
  return { ...r, g, MJ: Math.max(0, MJ), MJfull: (grams / 1000) * f.lhv, f };
}
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
// "2 C₄H₁₀ + 13 O₂ → 8 CO₂ + 10 H₂O": the balanced equation for complete burning.
export function equation(fk) {
  const f = FUELS[fk];
  let a = 4, b = 4 * stO2(f), c = 4 * f.C, d = 2 * f.H;
  const k = [a, b, c, d].reduce(gcd); a /= k; b /= k; c /= k; d /= k;
  const t = (n, s) => (n === 1 ? s : n + ' ' + s);
  return `${t(a, f.f)} + ${t(b, 'O₂')} → ${t(c, 'CO₂')} + ${t(d, 'H₂O')}`;
}
// The equation for a whole-number sample (from share(..., true)), reduced.
export function sampleEquation(fk, r) {
  const f = FUELS[fk];
  const parts = [r.n, r.O2, r.CO2, r.CO, r.H2O, r.soot, r.spare].filter((v) => v > 0);
  const k = parts.reduce(gcd);
  const t = (n, s) => (n / k === 1 ? s : n / k + ' ' + s);
  const out = [];
  if (r.CO2) out.push(t(r.CO2, 'CO₂'));
  if (r.CO) out.push(`<span style="color:${COL.CO}">${t(r.CO, 'CO')}</span>`);
  if (r.soot) out.push(`<span style="color:${COL.soot}">${t(r.soot, 'C')}</span>`);
  out.push(t(r.H2O, 'H₂O'));
  if (r.spare) out.push(`${t(r.spare, 'O₂')} <small>spare</small>`);
  return `${t(r.n, f.f)} + ${t(r.O2, 'O₂')} → ${out.join(' + ')}`;
}

// ---------------------------------------------------------------- colours and numbers
export const COL = {
  C: '#5b616d', H: '#f2f4f8', O: '#ff4a3d', N: '#5b8cff', Fe: '#b8742f',
  CO2: '#9aa3b2', H2O: '#6fb6ff', O2: '#ff6b5e', CO: '#ffd24a', soot: '#9a8f86', fuel: '#ffb547',
  heat: '#ff7a3d', mass: '#5ce1a9', text: '#e8eef8', flame: '#4f8cff',
};
export const hex = (c) => new THREE.Color(c).getHex();
export const fmt0 = (v) => Math.round(v).toLocaleString('en-IN');
export function fmtG(g) {
  const a = Math.abs(g);
  if (a >= 1e6) return (g / 1e6).toFixed(2) + ' t';
  if (a >= 1000) return (g / 1000).toFixed(a >= 1e4 ? 1 : 2) + ' kg';
  if (a >= 10) return g.toFixed(1) + ' g';
  if (a >= 0.01) return g.toFixed(2) + ' g';
  if (a >= 1e-5) return (g * 1000).toFixed(2) + ' mg';
  return (g * 1e6).toFixed(3) + ' µg';
}
export const fmtKg = (kg) => (Math.abs(kg) >= 100 ? fmt0(kg) : kg.toFixed(kg >= 10 ? 1 : 2)) + ' kg';
export function fmtMJ(MJ) { const a = Math.abs(MJ); return a >= 100 ? MJ.toFixed(0) + ' MJ' : a >= 10 ? MJ.toFixed(1) + ' MJ' : a >= 0.1 ? MJ.toFixed(2) + ' MJ' : (MJ * 1000).toFixed(a >= 0.01 ? 1 : 2) + ' kJ'; }

// ---------------------------------------------------------------- chart boards
export function panelBg(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.9)'; g.fillRect(0, 0, w, h); }
export function board(root, w, h, pxW, pxH, draw, pos) {
  const tex = canvasTexture(pxW, pxH, draw);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex.tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  m.position.set(...pos); root.add(m);
  return Object.assign(tex, { mesh: m });
}
export function axes(g, w, h, { x0 = 84, x1 = w - 28, y0 = h - 64, y1 = 70, xMax, yMax, xMin = 0, yMin = 0, xTicks, yTicks, xFmt = String, yFmt = String, xLabel = '', yLabel = '' }) {
  const X = (x) => x0 + ((x - xMin) / (xMax - xMin)) * (x1 - x0);
  const Y = (y) => y0 - ((y - yMin) / (yMax - yMin)) * (y0 - y1);
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '19px sans-serif';
  for (const t of xTicks) { g.beginPath(); g.moveTo(X(t), y1); g.lineTo(X(t), y0); g.stroke(); const s = xFmt(t); g.fillText(s, X(t) - g.measureText(s).width / 2, y0 + 26); }
  for (const t of yTicks) { g.beginPath(); g.moveTo(x0, Y(t)); g.lineTo(x1, Y(t)); g.stroke(); const s = yFmt(t); g.fillText(s, x0 - 10 - g.measureText(s).width, Y(t) + 6); }
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '18px sans-serif';
  if (xLabel) g.fillText(xLabel, x1 - g.measureText(xLabel).width, y0 + 50);
  if (yLabel) g.fillText(yLabel, x0 + 8, y1 - 10);
  return { X, Y, x0, x1, y0, y1 };
}
export function title(g, text, sub = '') {
  g.fillStyle = COL.text; g.font = 'bold 24px sans-serif'; g.fillText(text, 20, 34);
  if (sub) { const x = 34 + g.measureText(text).width; g.font = '17px sans-serif'; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText(sub, x, 34); }
}
export function line(g, pts, X, Y, col, wdt = 4, dash = null) {
  if (pts.length < 2) return;
  g.strokeStyle = col; g.lineWidth = wdt; g.setLineDash(dash || []); g.lineJoin = 'round'; g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))));
  g.stroke(); g.setLineDash([]);
}
export function dot(g, x, y, col, r = 10) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
export function legend(g, items, x = 24, y = 50, font = 18) {
  g.font = `bold ${font}px sans-serif`;
  for (const [n, c] of items) { g.fillStyle = c; g.fillRect(x, y, 16, 16); g.fillStyle = COL.text; g.fillText(n, x + 22, y + 15); x += 36 + g.measureText(n).width; }
}
// A stacked horizontal bar: parts [{ v, color, label }] scaled so `max` fills the width.
export function stack(g, x, y, wdt, hgt, parts, max, name) {
  g.font = 'bold 18px sans-serif'; g.fillStyle = COL.text; g.fillText(name, x, y - 8);
  let xx = x;
  for (const p of parts) {
    const L = (p.v / max) * wdt; if (L <= 0) continue;
    g.fillStyle = p.color; g.fillRect(xx, y, L, hgt);
    if (p.label && L > g.measureText(p.label).width + 10) { g.fillStyle = '#0a0c12'; g.font = 'bold 16px sans-serif'; g.fillText(p.label, xx + 6, y + hgt / 2 + 6); g.font = 'bold 18px sans-serif'; }
    xx += L;
  }
}
// A horizontal bar on a log scale from lo to hi.
export function logBar(g, x0, x1, y, hgt, v, lo, hi, col, label, text) {
  const k = clamp(Math.log(Math.max(v, lo) / lo) / Math.log(hi / lo), 0, 1);
  g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(x0, y, x1 - x0, hgt);
  g.fillStyle = col; g.fillRect(x0, y, Math.max(3, (x1 - x0) * k), hgt);
  g.fillStyle = 'rgba(255,255,255,.8)'; g.font = '18px sans-serif'; g.fillText(label, 20, y + hgt - 7);
  g.fillStyle = '#fff'; g.font = 'bold 18px sans-serif';
  const tw = g.measureText(text).width, tx = x0 + (x1 - x0) * k + 8;
  g.fillText(text, tx + tw > x1 ? x0 + (x1 - x0) * k - tw - 8 : tx, y + hgt - 7);
}

// ---------------------------------------------------------------- random numbers
export function rng(seed = 1) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// ---------------------------------------------------------------- dots and puffs
export function dots(n, r, color = 0xffffff, seg = 8, lit = false) {
  const mat = lit ? new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.05 }) : new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(r, seg, Math.max(4, seg - 2)), mat, n);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  const o = new THREE.Object3D(), col = new THREE.Color(color);
  for (let i = 0; i < n; i++) mesh.setColorAt(i, col);
  mesh.place = (i, x, y, z, s = 1) => { o.position.set(x, y, z); o.scale.setScalar(Math.max(0.0001, s)); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); };
  mesh.hide = (i) => mesh.place(i, 0, -99, 0, 0.0001);
  mesh.tint = (i, c) => mesh.setColorAt(i, c);
  mesh.done = () => { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; };
  return mesh;
}
// Little particles that drift from a source: step(dt, rate, at(), vel(p), life).
export function puffs(parent, n, r, color, rnd) {
  const d = dots(n, r, color); parent.add(d);
  const P = Array.from({ length: n }, () => ({ life: 0, max: 1, p: [0, -99, 0], v: [0, 0, 0] }));
  let acc = 0;
  return {
    mesh: d,
    step(dt, rate, at, vel, life = 1.2, grow = 0) {
      acc += rate * dt;
      for (let i = 0; i < n; i++) {
        const q = P[i];
        if (q.life <= 0 && acc >= 1) { acc -= 1; q.life = q.max = life * (0.75 + 0.5 * rnd()); q.p = at(); q.v = vel(q.p); }
        if (q.life > 0) { q.life -= dt; q.p[0] += q.v[0] * dt; q.p[1] += q.v[1] * dt; q.p[2] += q.v[2] * dt; }
        const k = q.life / q.max;
        d.place(i, q.p[0], q.p[1], q.p[2], q.life > 0 ? (grow ? 1 + grow * (1 - k) : 0.35 + 0.65 * k) : 0.0001);
      }
      if (acc > 20) acc = 20;
      d.done();
    },
    clear() { P.forEach((q) => { q.life = 0; }); acc = 0; },
  };
}

// ---------------------------------------------------------------- molecules
// Atom sizes (display units) and colours: the usual CPK colours, carbon lightened for a dark screen.
export const ATOM = { C: { r: 0.17, col: COL.C }, H: { r: 0.11, col: COL.H }, O: { r: 0.16, col: COL.O }, N: { r: 0.16, col: COL.N } };
const TET = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map((v) => v.map((x) => x * 0.2));
// Local atom positions [el, x, y, z] for each kind of molecule.
export function shapeOf(kind) {
  switch (kind) {
    case 'O2': return [['O', -0.13, 0, 0], ['O', 0.13, 0, 0]];
    case 'CO2': return [['O', -0.27, 0, 0], ['C', 0, 0, 0], ['O', 0.27, 0, 0]];
    case 'H2O': return [['O', 0, 0, 0], ['H', 0.17, 0.12, 0], ['H', -0.17, 0.12, 0]];
    case 'CO': return [['C', -0.13, 0, 0], ['O', 0.13, 0, 0]];
    case 'C': return [['C', 0, 0, 0]];
    case 'N2': return [['N', -0.12, 0, 0], ['N', 0.12, 0, 0]];
    case 'methane': return [['C', 0, 0, 0], ...TET.map((v) => ['H', ...v])];
    case 'butane': case 'octane': {
      const n = kind === 'butane' ? 4 : 8, out = [];
      for (let i = 0; i < n; i++) {
        const x = (i - (n - 1) / 2) * 0.26, y = i % 2 ? 0.08 : -0.08;
        out.push(['C', x, y, 0]);
        const s = i % 2 ? 1 : -1;
        out.push(['H', x, y + s * 0.12, 0.17], ['H', x, y + s * 0.12, -0.17]);
        if (i === 0) out.push(['H', x - 0.2, y - 0.02, 0]);
        if (i === n - 1) out.push(['H', x + 0.2, y + s * 0.02, 0]);
      }
      return out;
    }
    case 'wood': case 'glucose': {
      // a six-membered ring (five carbons and an oxygen), a sixth carbon, OH groups and hydrogens
      const f = FUELS[kind], out = [], ring = [];
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ring.push([Math.cos(a) * 0.28, (i % 2 ? 0.06 : -0.06), Math.sin(a) * 0.28]); }
      ring.forEach((p, i) => out.push([i === 5 ? 'O' : 'C', ...p]));
      out.push(['C', 0.55, 0.12, 0]);
      const rest = []; for (let i = 0; i < f.O - 1; i++) rest.push('O'); for (let i = 0; i < f.H; i++) rest.push('H');
      rest.forEach((el, i) => { const a = (i / rest.length) * Math.PI * 2 + 0.3, rr = el === 'O' ? 0.5 : 0.62; out.push([el, Math.cos(a) * rr, (i % 2 ? 0.2 : -0.2), Math.sin(a) * rr]); });
      return out;
    }
  }
  return [];
}
// A cloud of molecules whose atoms regroup as the reaction runs. set(reactants, products) takes lists
// of { kind, at:[x,y,z] }; update(p, time) draws the atoms at progress p (0 = all reactants, 1 = all
// products). Atoms are matched element by element, so none is ever created or destroyed.
export function makeCloud(parent, cap = 260, scale = 1) {
  const els = ['C', 'H', 'O', 'N'];
  const mesh = dots(cap, 1, 0xffffff, 14, true); mesh.castShadow = false; parent.add(mesh);
  const col = new THREE.Color();
  let atoms = [], prods = [];
  const cloud = {
    mesh, count: { C: 0, H: 0, O: 0, N: 0 }, after: { C: 0, H: 0, O: 0, N: 0 },
    set(react, prod) {
      const A = {}, B = {}; els.forEach((e) => { A[e] = []; B[e] = []; });
      react.forEach((m, mi) => shapeOf(m.kind).forEach(([el, x, y, z]) => A[el].push({ el, m: mi, off: [x * scale, y * scale, z * scale], home: m })));
      prods = prod.map((m, j) => ({ ...m, j }));
      prods.forEach((m) => shapeOf(m.kind).forEach(([el, x, y, z]) => B[el].push({ off: [x * scale, y * scale, z * scale], home: m })));
      atoms = [];
      els.forEach((e) => {
        cloud.count[e] = A[e].length; cloud.after[e] = B[e].length;
        const a = A[e].sort((p, q) => p.home.at[0] - q.home.at[0]), b = B[e].sort((p, q) => p.home.at[0] - q.home.at[0]);
        a.forEach((at, i) => atoms.push({ ...at, to: b[Math.min(i, b.length - 1)] }));
      });
      atoms.length = Math.min(atoms.length, cap);
      for (let i = 0; i < cap; i++) mesh.hide(i);
      atoms.forEach((a, i) => mesh.tint(i, col.set(ATOM[a.el].col)));
      mesh.done();
    },
    // where(m, time) may move a molecule's centre (drift, escape): returns [x,y,z].
    update(p, time, where = (m) => m.at) {
      const P = Math.max(1, prods.length);
      atoms.forEach((a, i) => {
        const t0 = (a.to.home.j / P) * 0.75, k = smooth((p - t0) / 0.2);
        const c0 = where(a.home, time, 0), c1 = where(a.to.home, time, 1);
        const x = lerp(c0[0] + a.off[0], c1[0] + a.to.off[0], k), y = lerp(c0[1] + a.off[1], c1[1] + a.to.off[1], k) + Math.sin(k * Math.PI) * 0.15, z = lerp(c0[2] + a.off[2], c1[2] + a.to.off[2], k);
        mesh.place(i, x, y, z, ATOM[a.el].r * scale);
      });
      mesh.done();
    },
  };
  return cloud;
}
// Scatter n points in a cylinder (radius R, from y0 to y1) around (cx, cz), keeping them apart.
export function scatter(n, R, y0, y1, rnd, gap = 0.45, cx = 0, cz = 0) {
  const out = [];
  for (let i = 0; i < n; i++) {
    let best = null, bd = -1;
    for (let t = 0; t < 14; t++) {
      const a = rnd() * Math.PI * 2, r = R * Math.sqrt(rnd()), p = [cx + r * Math.cos(a), y0 + rnd() * (y1 - y0), cz + r * Math.sin(a)];
      const d = out.reduce((m, q) => Math.min(m, Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])), 9);
      if (d > bd) { bd = d; best = p; } if (d > gap) break;
    }
    out.push(best);
  }
  return out;
}
// Molecule lists for n fuel molecules at air ratio lam: { react, prod, r }.
export function moleculeLists(fk, n, lam) {
  const f = FUELS[fk], r = share(f, n, lam, true);
  const react = [], prod = [];
  for (let i = 0; i < n; i++) react.push({ kind: fk });
  for (let i = 0; i < r.O2; i++) react.push({ kind: 'O2' });
  for (let i = 0; i < r.CO2; i++) prod.push({ kind: 'CO2' });
  for (let i = 0; i < r.CO; i++) prod.push({ kind: 'CO' });
  for (let i = 0; i < r.soot; i++) prod.push({ kind: 'C' });
  for (let i = 0; i < r.H2O; i++) prod.push({ kind: 'H2O' });
  for (let i = 0; i < r.spare; i++) prod.push({ kind: 'O2' });
  return { react, prod, r };
}
// How many fuel molecules to draw so the picture stays readable (always an even number).
export const SAMPLE = { methane: 4, butane: 2, octane: 2, wood: 2, glucose: 2 };

// ---------------------------------------------------------------- flames
// A flame: a bright inner cone and a softer outer plume, additive. set(size, yellow 0…1, time).
export function makeFlame(parent, h = 0.6, r = 0.14, lit = true) {
  const g = new THREE.Group(); parent.add(g);
  const add = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false };
  const prof = []; for (let i = 0; i <= 18; i++) { const t = i / 18; prof.push(new THREE.Vector2(1.25 * Math.pow(Math.sin(Math.PI * t), 0.6) * Math.pow(1 - t, 0.7) + 0.0001, t * 2)); }
  const geo = new THREE.LatheGeometry(prof, 20);
  const inner = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x3d7bff, opacity: 0.9, ...add }));
  const outer = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xff9a3d, opacity: 0.5, ...add }));
  const core = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xbfe0ff, opacity: 0.8, ...add }));
  g.add(outer, inner, core);
  const light = lit ? new THREE.PointLight(0xffa050, 0, 4, 2) : { color: new THREE.Color(), intensity: 0, position: new THREE.Vector3() }; light.position.y = h * 0.6; if (lit) g.add(light);
  const cBlue = new THREE.Color(0x2f6bff), cYel = new THREE.Color(0xffb030), cOut = new THREE.Color(0x3a55ff), tmp = new THREE.Color();
  g.set = (size, yellow = 0, time = 0) => {
    g.visible = size > 0.01;
    const fl = 1 + 0.06 * Math.sin(time * 23) + 0.04 * Math.sin(time * 37 + 1);
    const tall = h * size * (1 + yellow * 0.9) * fl, wide = r * Math.sqrt(size) * (1 + yellow * 0.35);
    outer.scale.set(wide * 1.25, tall * 0.5, wide * 1.25);
    inner.scale.set(wide * 0.8, tall * 0.5 * (0.55 - 0.25 * yellow), wide * 0.8);
    core.scale.set(wide * 0.35, tall * 0.5 * 0.22, wide * 0.35);
    outer.material.color.copy(tmp.copy(cOut).lerp(cYel, clamp(yellow * 1.3, 0, 1)));
    outer.material.opacity = 0.35 + 0.45 * yellow;
    inner.material.color.copy(cBlue).lerp(cYel, yellow * 0.5);
    core.visible = yellow < 0.7;
    light.intensity = size * (1.5 + 5 * yellow);
    light.color.copy(tmp.copy(cBlue).lerp(cYel, 0.3 + 0.7 * yellow));
  };
  g.set(1);
  return g;
}

// ---------------------------------------------------------------- a digital balance
// A flat weighing scale with an LED display facing +z. set(text, colour) updates the display.
export function makeScale(parent, w = 2.4, d = 1.8) {
  const g = new THREE.Group(); parent.add(g);
  const base = box(w, 0.28, d, M.matte(0x2c313b)); base.position.y = 0.14; g.add(base);
  const pan = box(w * 0.86, 0.05, d * 0.8, M.metal(0xc9ced8, { roughness: 0.25 })); pan.position.set(0, 0.31, -0.02); g.add(pan);
  const face = box(w * 0.5, 0.22, 0.04, M.matte(0x16181e)); face.position.set(0, 0.14, d / 2 + 0.01); g.add(face);
  const tex = canvasTexture(420, 88, (x, W, H, text = '0.00 g', col = '#5ce1a9') => {
    x.fillStyle = '#05140d'; x.fillRect(0, 0, W, H);
    x.fillStyle = col; x.font = 'bold 62px monospace'; x.textAlign = 'right'; x.fillText(text, W - 16, H - 18);
  });
  const led = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.46, w * 0.46 * 88 / 420), new THREE.MeshBasicMaterial({ map: tex.tex, toneMapped: false }));
  led.position.set(0, 0.14, d / 2 + 0.035); g.add(led);
  let last = '';
  g.set = (text, col) => { const k = text + col; if (k !== last) { last = k; tex.redraw(text, col); } };
  g.top = 0.335;
  return g;
}

// ---------------------------------------------------------------- layout helpers
export const inReel = () => document.body.classList.contains('gb-reel');
export function fitNarrow(stage, minor = []) {
  const narrow = stage.host.clientWidth < 560;
  minor.forEach((l) => { if (l) l.visible = !narrow; });
  const y = narrow && !inReel() ? -0.12 : 0;
  if (!stage.shift || stage.shift[1] !== y) stage.setShift(0, y);
  return narrow;
}
// Boards sit beside the model on a wide screen. In the tall reel video they move to `pos` instead.
export function reelPlace(boards) {
  const r = inReel();
  boards.forEach(([b, pos, scale = 1.25]) => {
    if (!b.home) b.home = { p: b.mesh.position.clone(), r: b.mesh.rotation.y };
    if (r) { b.mesh.position.set(...pos); b.mesh.scale.setScalar(scale); b.mesh.rotation.y = 0; }
    else { b.mesh.position.copy(b.home.p); b.mesh.scale.setScalar(1); b.mesh.rotation.y = b.home.r; }
  });
}
// A glass jar (open cylinder, optional lid) standing on y = 0, radius R, height H.
export function makeJar(parent, R, H) {
  const g = new THREE.Group(); parent.add(g);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 48, 1, true), M.clear(0xcfe8ff, 0.12)); wall.position.y = H / 2; g.add(wall);
  const rimT = new THREE.Mesh(new THREE.TorusGeometry(R, 0.025, 8, 48), M.clear(0xe6f6ff, 0.5)); rimT.rotation.x = Math.PI / 2; rimT.position.y = H; g.add(rimT);
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.04, 48), M.clear(0xcfe8ff, 0.25)); floor.position.y = 0.02; g.add(floor);
  const lid = new THREE.Group(); g.add(lid);
  const lidTop = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.06, R + 0.06, 0.08, 48), M.metal(0x9aa3b2, { roughness: 0.35 })); lidTop.position.y = H + 0.04; lid.add(lidTop);
  const knob = sphere(0.09, M.matte(0x1b1d22), 16); knob.position.y = H + 0.14; lid.add(knob);
  g.lid = lid; g.R = R; g.H = H;
  return g;
}
export { clamp, smooth, lerp, beam, box, rod, sphere };
