// Chapter 5: where mass "seems" to vanish, where it really does (a tiny bit), and a deadly side effect.
// Candle (1 unit ≈ 5 cm). Paraffin wax taken as C₂₅H₅₂ (352.7 g/mol): C₂₅H₅₂ + 38 O₂ → 25 CO₂ + 26 H₂O.
//   Per gram of wax: 3.45 g O₂ in, 3.12 g CO₂ and 1.33 g H₂O out. A household candle burns about 7 g an
//   hour (typical figures are 5–10 g/h).
// E = mc² (Einstein, 1905). The heat a reaction gives out carries mass away: Δm = E ÷ c². Burning 1 kg of
//   methane releases 55.5 MJ (HHV), which is 55.5e6 ÷ (2.998e8)² = 6.2 × 10⁻¹⁰ kg, 0.6 µg. Against the
//   5 kg of methane and oxygen that react, that is about 1 part in 10¹⁰. The jar in chapter 1 (1 g of
//   methane) loses 0.6 ng. A good laboratory balance reads to 0.01 mg; the best kilogram comparators at
//   national labs resolve about 0.1–1 µg on 1 kg, far short of this. Fission of U-235 releases about
//   200 MeV per atom, 0.09 % of its mass (200 ÷ (235 × 931.5)).
// Carbon monoxide in a closed room (1 unit ≈ 50 cm). A charcoal angithi burning 0.5 kg an hour. Charcoal
//   stoves emit roughly 100–300 g of CO per kg of charcoal (WHO indoor air quality guidelines: household
//   fuel combustion, 2014, and stove tests); we use 200 g/kg, so 100 g of CO an hour, 87 L at 25 °C
//   (1.145 kg/m³). Room 30 m³. Air changes per hour: 0.3 for a room shut up for a winter night, up to 6
//   with a window wide open. Well mixed: C(t) = G ÷ Q × (1 − e^(−Q t ÷ V)). Real rooms are worse near the
//   floor and the fire, and as oxygen falls the charcoal makes even more CO.
//   Health effects (commonly quoted guide, e.g. Goldstein, J Emerg Nurs 2008; US CPSC): 35 ppm limit for
//   8 hours; 200 ppm headache in 2–3 h; 400 ppm life-threatening after 3 h; 800 ppm unconscious within
//   2 h; 1,600 ppm death within 1 h; 6,400 ppm death within 20 minutes.
import { THREE, M, box, beam, rod, sphere, torus } from '../kit.js';
import { FUELS, AW, MW, C_LIGHT, COL, hex, fmtG, fmtKg, fmt0, fmtMJ, board, panelBg, axes, title, line, dot, legend, logBar, dots, puffs, makeFlame, makeScale, makeJar, rng, fitNarrow, reelPlace, inReel, clamp, smooth, lerp } from '../combust.js';

const WAX = { C: 25, H: 52 }, waxMW = WAX.C * AW.C + WAX.H * AW.H;
const PERW = { O2: (38 * MW.O2) / waxMW, CO2: (25 * MW.CO2) / waxMW, H2O: (26 * MW.H2O) / waxMW };
const CANDLE = { g: 60, rate: 7 };
const ROOM = { V: 30, kgph: 0.5, ef: 0.2, rho: 1.145 };
export function coPPM(h, ach) { const G = (ROOM.kgph * ROOM.ef) / ROOM.rho, Q = ach * ROOM.V; return (G / Q) * (1 - Math.exp((-Q * h) / ROOM.V)) * 1e6; }
const DANGER = [[35, '35: safe limit for 8 h', '#5ce1a9'], [200, '200: headache in 2–3 h', '#ffd24a'], [400, '400: life-threatening after 3 h', '#ffb547'], [800, '800: unconscious within 2 h', '#ff7a59'], [1600, '1,600: death within 1 h', '#ff4a3d'], [6400, '6,400: death in 20 min', '#d02040']];
const effect = (ppm) => { let e = 'normal air: under 10 ppm'; for (const [v, t] of DANGER) if (ppm >= v) e = t.split(': ')[1]; return e; };
const X2 = 12, X3 = 24;
const VIEWS = { open: { pos: [0.7, 3.0, 7.6], target: [0.7, 2.5, 0] }, emc2: { pos: [X2 + 0.7, 3.0, 7.6], target: [X2 + 0.7, 2.45, 0] }, co: { pos: [X3 + 1.0, 4.4, 9.4], target: [X3 + 1.0, 2.8, 0] } };

export default {
  id: 'limits',
  short: 'Surprises and limits',
  title: 'Vanishing candles, E = mc², and a silent killer',
  subtitle: 'Where mass only seems to go, where a tiny bit really does, and why incomplete burning kills.',
  view: VIEWS.open,
  learn: `<p><b>The vanishing candle.</b> A candle on a balance gets lighter all evening, so it looks as if burning destroys matter. It doesn't: it's an <b>open system</b>. The wax leaves as invisible CO₂ and water vapour, and those gases weigh <b>more</b> than the wax, because they carry oxygen from the air.</p>
    <p><b>Myth-buster: phlogiston.</b> In the 1700s chemists said burning things give off <b>phlogiston</b>, a “fire substance”. A candle getting lighter seemed to prove it. But burnt metals get <b>heavier</b>, so phlogiston would need negative weight. The Lavoisiers weighed everything in sealed vessels and showed that burning <b>takes in</b> oxygen. Phlogiston was never real.</p>
    <p><b>E = mc².</b> Here's the honest fine print. When anything gives out energy, it loses a tiny bit of mass: <b>Δm = E ÷ c²</b>. For burning, that is about <b>one part in 10 billion</b>, far too small for any balance to see. Chemistry conserves mass to better than we can measure; nuclear fission changes about 0.1 % of the mass, which is why it's millions of times more powerful.</p>
    <p><b>The silent killer.</b> With too little air, carbon burns only halfway, to <b>carbon monoxide</b>. CO has no smell or colour, and it grabs your blood's haemoglobin more than 200 times as tightly as oxygen. Every winter, people in India die after sleeping with a charcoal <b>angithi</b> or a gas heater in a closed room. <b>Never burn anything in a shut room, and never sleep with it.</b></p>
    <p class="tip"><b>Try it:</b> burn the candle for a few hours and compare the weight lost with the gases made. Then shut the window in the bedroom and see how fast CO climbs.</p>`,
  terms: [
    { t: 'Open system', d: 'One that swaps matter with its surroundings, like a candle in a room.' },
    { t: 'Phlogiston', d: 'A “fire substance” that 18th-century chemists wrongly thought burning released.' },
    { t: 'Mass–energy equivalence', d: 'E = mc²: energy has mass. Giving out energy E means losing mass E ÷ c².' },
    { t: 'Incomplete combustion', d: 'Burning with too little oxygen, which leaves carbon monoxide and soot.' },
    { t: 'Carbon monoxide', d: 'CO: a colourless, odourless, poisonous gas that stops blood carrying oxygen.' },
    { t: 'Ventilation', d: 'Replacing a room’s air with fresh air, measured in air changes per hour.' },
  ],
  defaults: { look: 'open', hrs: 3, fuel: 'methane', kg: 1, ach: 0.3, night: 3 },
  controls: [
    { key: 'look', type: 'seg', label: 'Look at', options: [{ v: 'open', label: 'Vanishing candle' }, { v: 'emc2', label: 'E = mc²' }, { v: 'co', label: 'CO in a closed room' }] },
    { key: 'hrs', type: 'range', label: 'Candle: hours burned', min: 0, max: 6, step: 0.25, ends: ['0', '6 h'], fmt: (v) => v.toFixed(2).replace(/\.?0+$/, '') + ' h' },
    { key: 'fuel', type: 'seg', label: 'E = mc²: fuel', options: ['methane', 'butane', 'octane', 'wood'].map((k) => ({ v: k, label: FUELS[k].short })) },
    { key: 'kg', type: 'log', label: 'E = mc²: amount burned', min: 0.001, max: 1000, ends: ['1 g', '1 tonne'], fmt: (v) => (v < 1 ? fmt0(v * 1000) + ' g' : v < 1000 ? (v < 10 ? v.toFixed(1) : fmt0(v)) + ' kg' : '1 tonne') },
    { key: 'ach', type: 'log', label: 'Room: fresh air (air changes an hour)', min: 0.2, max: 6, ends: ['shut tight', 'window wide open'], fmt: (v) => v.toFixed(1) + ' per hour' },
    { key: 'night', type: 'range', label: 'Room: hours with the angithi', min: 0, max: 8, step: 0.25, ends: ['0', '8 h'], fmt: (v) => v.toFixed(2).replace(/\.?0+$/, '') + ' h' },
  ],
  onChange(s, key) {
    if (key === 'hrs') s.look = 'open';
    if (key === 'fuel' || key === 'kg') s.look = 'emc2';
    if (key === 'ach' || key === 'night') s.look = 'co';
  },
  quiz: [
    { q: 'Why did phlogiston theory fail?', options: ['Candles get heavier when burned', 'Burnt metals get heavier, so phlogiston would need negative weight', 'Nobody could see flames', 'It said fire was cold'], answer: 1, why: 'If burning released phlogiston, everything should get lighter. Metals gain weight as they burn, because they take in oxygen, as the Lavoisiers showed.' },
    { q: 'Burning 1 kg of methane gives out 55 MJ. By E = mc², how much mass does that heat carry away?', options: ['About 1 g', 'About 1 mg', 'About 0.6 µg (millionths of a gram)', 'Exactly zero'], answer: 2, why: 'Δm = E ÷ c² = 55.5 × 10⁶ ÷ (3 × 10⁸)² ≈ 6 × 10⁻¹⁰ kg, 0.6 µg: about one part in 10 billion of what reacted, far below what a balance can detect.' },
    { q: 'Why is a charcoal angithi dangerous in a closed bedroom?', options: ['It makes the room too dry', 'As air runs short, carbon burns only to carbon monoxide, which you can’t see or smell', 'It uses up all the nitrogen', 'Charcoal smoke is always harmless'], answer: 1, why: 'With little fresh air, CO builds up to deadly levels. It binds to haemoglobin far more tightly than oxygen does, and sleeping people don’t notice.' },
  ],
  reel: [
    { ms: 5400, caption: 'Never keep an angithi burning in a closed room. Carbon monoxide builds up silently and kills.', set: { look: 'co', ach: 0.3 }, anim: { night: [0, 4] }, view: { pos: [X3 + 1.0, 5.2, 8.0], target: [X3 + 1.0, 4.2, 0] }, spin: 0.05 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const rnd = rng(55);
    let S = {};
    // ================================================================ candle on a balance
    const Cn = new THREE.Group(); root.add(Cn);
    const b1 = box(5, 0.1, 2.6, M.matte(0x2b3039)); b1.position.set(0.5, -0.05, 0); Cn.add(b1);
    const sc1 = makeScale(Cn, 2.2, 1.8); sc1.position.set(-0.4, 0, 0);
    const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.1, 32), M.metal(0xc8a24a)); holder.position.set(-0.4, sc1.top + 0.05, 0); Cn.add(holder);
    const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1, 32), M.matte(0xf4efe4, { roughness: 0.6 })); Cn.add(wax);
    const wick = beam([0, 0, 0], [0, 0.12, 0], 0.012, M.matte(0x1b1d22)); Cn.add(wick);
    const cf = makeFlame(Cn, 0.45, 0.07);
    const cGas = puffs(Cn, 180, 0.04, hex(COL.CO2), rnd), cH2O = puffs(Cn, 120, 0.035, hex(COL.H2O), rnd), cO2 = puffs(Cn, 120, 0.035, hex(COL.O2), rnd);
    const lWax = stage.label('', [0, 0, 0], Cn, 'hot'), lGas = stage.label('', [-0.4, 3.6, 0], Cn, 'hot');
    lWax.element.style.setProperty('--c', '#ff7a59'); lGas.element.style.setProperty('--c', COL.CO2);
    const cb = board(root, 3.0, 2.0, 600, 400, (g, w, h) => {
      panelBg(g, w, h);
      const hr = S.hrs ?? 3, wg = Math.min(CANDLE.g, CANDLE.rate * hr);
      title(g, 'The candle over time', 'an open system');
      const { X, Y } = axes(g, w, h, { x0: 80, y1: 80, y0: h - 50, xMax: 6, yMin: -60, yMax: 200, xTicks: [0, 2, 4, 6], yTicks: [-50, 0, 50, 100, 150, 200], xFmt: (v) => v + ' h', yFmt: (v) => (v > 0 ? '+' : '') + v + ' g' });
      const pts = (f) => { const a = []; for (let t = 0; t <= 6.001; t += 0.25) a.push([t, f(Math.min(CANDLE.g, CANDLE.rate * t))]); return a; };
      line(g, pts((m) => -m), X, Y, '#ff7a59', 4);
      line(g, pts((m) => m * (PERW.CO2 + PERW.H2O)), X, Y, COL.CO2, 4);
      line(g, pts((m) => m * PERW.O2), X, Y, COL.O2, 3, [8, 6]);
      dot(g, X(hr), Y(-wg), '#ff7a59', 8); dot(g, X(hr), Y(wg * (PERW.CO2 + PERW.H2O)), COL.CO2, 8);
      legend(g, [['on the balance', '#ff7a59'], ['gases made', COL.CO2], ['O₂ taken', COL.O2]], 20, 46, 16);
    }, [3.3, 2.2, -0.3]);
    cb.mesh.rotation.y = -0.3;

    // ================================================================ E = mc²
    const Em = new THREE.Group(); Em.position.x = X2; root.add(Em);
    const b2 = box(5, 0.1, 2.6, M.matte(0x2b3039)); b2.position.set(0.5, -0.05, 0); Em.add(b2);
    const sc2 = makeScale(Em, 2.4, 1.9); sc2.position.set(-0.5, 0, 0);
    const jar = makeJar(Em, 0.8, 1.9); jar.position.set(-0.5, sc2.top, 0);
    const ef = makeFlame(jar, 0.45, 0.1); ef.position.y = 0.3;
    jar.add(beam([0, 0.02, 0], [0, 0.3, 0], 0.04, M.metal(0xb9bec8)));
    const lE = stage.label('', [-0.5, 2.8, 0], Em, 'hot'); lE.element.style.setProperty('--c', COL.heat);
    const eb = board(root, 3.4, 2.3, 620, 420, (g, w, h) => {
      panelBg(g, w, h);
      const f = FUELS[S.fuel || 'methane'], kg = S.kg || 1, dm = (kg * f.hhv * 1e6) / (C_LIGHT * C_LIGHT);   // kg
      title(g, 'Mass carried off as heat', 'log scale');
      const x0 = 250, x1 = w - 20, lo = 1e-15, hi = 1e3, G = (v) => v * 1000;  // grams
      const row = (y, v, col, label, text) => logBar(g, x0, x1, y, 32, v, lo, hi, col, label, text);
      row(66, G(kg), COL.fuel, `${f.short} burned`, fmtG(G(kg)));
      row(116, G(dm), COL.heat, 'mass lost as heat', fmtG(G(dm)));
      row(166, 0.01, '#6fb6ff', 'kitchen balance sees', '0.01 g');
      row(216, 1e-6, '#8ef0ff', 'best 1 kg comparator', '≈ 1 µg');
      row(266, G(kg) * 0.00091, '#c49bff', 'same mass of U-235 fission', fmtG(G(kg) * 0.00091));
      g.fillStyle = COL.text; g.font = 'bold 20px sans-serif';
      g.fillText(`Δm = E ÷ c² = ${(dm / kg).toExponential(1)} of the fuel’s mass`, 20, 340);
      g.fillStyle = 'rgba(255,255,255,.65)'; g.font = '17px sans-serif'; g.fillText('with the oxygen too, about 1 part in 10 billion', 20, 372);
    }, [X2 + 3.3, 2.1, -0.3]);
    eb.mesh.rotation.y = -0.3;

    // ================================================================ closed room with an angithi
    const R = new THREE.Group(); R.position.x = X3; root.add(R);
    const RW = 4.4, RH = 2.6, RD = 3;
    const fl = box(RW, 0.08, RD, M.matte(0x5a4a3a)); fl.position.set(0, -0.04, 0); R.add(fl);
    const wallM = M.clear(0xe8e2d0, 0.12);
    const back = box(RW, RH, 0.05, M.matte(0xd8d0c0, { transparent: true, opacity: 0.35 })); back.position.set(0, RH / 2, -RD / 2); R.add(back);
    const left = box(0.05, RH, RD, wallM); left.position.set(-RW / 2, RH / 2, 0); R.add(left);
    const right = box(0.05, RH, RD, wallM); right.position.set(RW / 2, RH / 2, 0); R.add(right);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(RW, RH, RD)), new THREE.LineBasicMaterial({ color: 0x9fb4c8, transparent: true, opacity: 0.6 })); edges.position.y = RH / 2; R.add(edges);
    const winFrame = box(1.1, 0.9, 0.08, M.matte(0x6a4a2a)); winFrame.position.set(0.8, 1.6, -RD / 2 + 0.02); R.add(winFrame);
    const sky = box(0.95, 0.75, 0.02, M.glow(0x2a4a7a)); sky.position.set(0.8, 1.6, -RD / 2 + 0.07); R.add(sky);
    const shutter = new THREE.Group(); shutter.position.set(0.8 - 0.475, 1.6, -RD / 2 + 0.1); R.add(shutter);
    const sh = box(0.95, 0.75, 0.03, M.matte(0x8a6a4a)); sh.position.x = 0.475; shutter.add(sh);
    // bed and sleeper
    const bed = box(1.9, 0.45, 1.0, M.matte(0x6a5a8a)); bed.position.set(-1.1, 0.23, -0.7); R.add(bed);
    const quilt = box(1.4, 0.18, 0.95, M.matte(0x3a6ea5)); quilt.position.set(-0.9, 0.52, -0.7); R.add(quilt);
    const pillow = box(0.4, 0.14, 0.7, M.matte(0xf2f2f2)); pillow.position.set(-1.8, 0.52, -0.7); R.add(pillow);
    const headS = sphere(0.14, M.matte(0xc68a62), 16); headS.position.set(-1.72, 0.66, -0.7); R.add(headS);
    // the angithi: an iron bowl of glowing charcoal
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.22, 0.3, 24, 1, true), M.metal(0x3a3f4b, { side: THREE.DoubleSide })); bowl.position.set(0.9, 0.4, 0.5); R.add(bowl);
    [0, 1, 2].forEach((i) => { const a = (i / 3) * Math.PI * 2; R.add(beam([0.9 + 0.2 * Math.cos(a), 0.26, 0.5 + 0.2 * Math.sin(a)], [0.9 + 0.3 * Math.cos(a), 0, 0.5 + 0.3 * Math.sin(a)], 0.025, M.metal(0x3a3f4b))); });
    const coals = new THREE.Group(); R.add(coals);
    const coalM = new THREE.MeshBasicMaterial({ color: 0xff5a1a, toneMapped: false });
    for (let i = 0; i < 14; i++) { const c = sphere(0.07 + 0.03 * rnd(), i % 3 ? coalM : M.matte(0x2a2a2a), 8); c.position.set(0.9 + (rnd() - 0.5) * 0.5, 0.52 + rnd() * 0.06, 0.5 + (rnd() - 0.5) * 0.5); coals.add(c); }
    const glow = new THREE.PointLight(0xff6a2a, 3, 3, 2); glow.position.set(0.9, 0.9, 0.5); R.add(glow);
    const NCO = 260, coDots = dots(NCO, 0.045, hex(COL.CO)); R.add(coDots);
    const cph = Array.from({ length: NCO }, () => [(rnd() - 0.5) * (RW - 0.3), 0.1 + rnd() * (RH - 0.2), (rnd() - 0.5) * (RD - 0.3), rnd() * 6.28]);
    const lCO = stage.label('', [0, RH + 0.35, 0], R, 'hot'), lWin = stage.label('', [0.8, 2.2, -RD / 2], R);
    const rb = board(root, 3.5, 2.4, 620, 426, (g, w, h) => {
      panelBg(g, w, h);
      const ach = S.ach ?? 0.3, hr = S.night ?? 3;
      title(g, 'Carbon monoxide in the room', 'ppm, log scale');
      const x0 = 80, x1 = w - 24, y0 = h - 44, y1 = 70, lo = 10, hi = 20000;
      const X = (t) => x0 + (t / 8) * (x1 - x0), Y = (v) => y0 - (Math.log10(Math.max(lo, v) / lo) / Math.log10(hi / lo)) * (y0 - y1);
      g.font = '15px sans-serif';
      DANGER.forEach(([v, t, c]) => { g.strokeStyle = c; g.globalAlpha = 0.6; g.setLineDash([6, 5]); g.lineWidth = 2; g.beginPath(); g.moveTo(x0, Y(v)); g.lineTo(x1, Y(v)); g.stroke(); g.setLineDash([]); g.globalAlpha = 1; g.fillStyle = c; g.fillText(t, x0 + 6, Y(v) - 5); });
      g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '17px sans-serif';
      [0, 2, 4, 6, 8].forEach((t) => g.fillText(t + ' h', X(t) - 10, y0 + 24));
      [10, 100, 1000, 10000].forEach((v) => g.fillText(fmt0(v), 10, Y(v) + 6));
      const pts = (a) => { const p = []; for (let t = 0.02; t <= 8.001; t += 0.1) p.push([X(t), Y(coPPM(t, a))]); return p; };
      const draw = (p, c, wd) => { g.strokeStyle = c; g.lineWidth = wd; g.beginPath(); p.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); };
      draw(pts(6), 'rgba(92,225,169,.6)', 3); draw(pts(ach), '#ffd24a', 5);
      const v = coPPM(hr, ach); g.fillStyle = '#ffd24a'; g.beginPath(); g.arc(X(hr), Y(v), 9, 0, 6.3); g.fill();
      g.fillStyle = 'rgba(92,225,169,.9)'; g.font = 'bold 15px sans-serif'; g.fillText('window wide open', X(5.6), Y(coPPM(8, 6)) + 20);
    }, [X3 + 4.4, 2.3, -0.4]);
    rb.mesh.rotation.y = -0.3;

    let look = '', key = '';
    const cc = new THREE.Color();
    return {
      update(dt, s, time) {
        dt = Math.max(0, Math.min(dt, 0.1)); S = s;
        fitNarrow(stage, [lWin, lGas]);
        reelPlace([[cb, [0.2, 6.0, 0], 1.2], [eb, [X2 + 0.2, 6.2, 0], 1.2], [rb, [X3 + 1.0, 6.3, 0], 1.25]]);
        if (s.look !== look) { look = s.look; if (!inReel()) { const v = VIEWS[look]; stage.setView(v.pos, v.target, 1.0); } }
        Cn.visible = cb.mesh.visible = look === 'open'; Em.visible = eb.mesh.visible = look === 'emc2'; R.visible = rb.mesh.visible = look === 'co';
        // ---- candle: 60 g of wax, 1 unit ≈ 5 cm tall at the start
        const wg = Math.min(CANDLE.g, CANDLE.rate * s.hrs), left = 1 - wg / CANDLE.g, hgt = 0.1 + 1.8 * left;
        const cy = sc1.top + 0.1;
        wax.scale.y = hgt; wax.position.set(-0.4, cy + hgt / 2, 0);
        wick.position.set(-0.4, cy + hgt, 0); cf.position.set(-0.4, cy + hgt + 0.08, 0);
        cf.set(left > 0.01 ? 1 : 0, 0.8, time);
        const top = cy + hgt + 0.4;
        cGas.step(dt, left > 0.01 ? 22 : 0, () => [-0.4 + (rnd() - 0.5) * 0.1, top, (rnd() - 0.5) * 0.1], () => [(rnd() - 0.5) * 0.3, 0.7, (rnd() - 0.5) * 0.3], 2.2, 1);
        cH2O.step(dt, left > 0.01 ? 22 : 0, () => [-0.4 + (rnd() - 0.5) * 0.1, top, (rnd() - 0.5) * 0.1], () => [(rnd() - 0.5) * 0.3, 0.7, (rnd() - 0.5) * 0.3], 2.2, 1);
        cO2.step(dt, left > 0.01 ? 26 : 0, () => { const a = rnd() * 6.28; return [-0.4 + 1.1 * Math.cos(a), cy + hgt, 1.1 * Math.sin(a)]; }, (p) => [(-0.4 - p[0]) * 1.4, 0.15, -p[2] * 1.4], 0.7);
        sc1.set((412.0 - wg).toFixed(1) + ' g', wg > 0 ? '#ff9a7a' : '#5ce1a9');
        lWax.position.set(0.5, cy + hgt * 0.5, 0.3); lWax.element.innerHTML = `wax lost <b>−${fmtG(wg)}</b>`;
        lGas.position.set(0.7, top + 0.6, 0); lGas.element.innerHTML = `gases made <b>+${fmtG(wg * (PERW.CO2 + PERW.H2O))}</b>`;
        // ---- E = mc²
        const f = FUELS[s.fuel], dm = (s.kg * f.hhv * 1e6) / (C_LIGHT * C_LIGHT);
        ef.set(1, s.fuel === 'wood' || s.fuel === 'octane' ? 0.8 : 0, time);
        sc2.set('1851.00 g', '#5ce1a9');
        lE.element.innerHTML = `heat carries off <b>${fmtG(dm * 1000)}</b>`;
        // ---- CO room
        const ppm = coPPM(s.night, s.ach), open = clamp(Math.log(s.ach / 0.5) / Math.log(12), 0, 1);
        shutter.rotation.y = -open * 1.6;
        const n = Math.round(clamp(Math.log10(1 + ppm / 20) / Math.log10(1 + 20000 / 20), 0, 1) * NCO);
        cph.forEach((p, i) => { if (i < n) coDots.place(i, p[0] + 0.1 * Math.sin(time * 0.5 + p[3]), p[1] + 0.08 * Math.cos(time * 0.4 + p[3]), p[2] + 0.1 * Math.sin(time * 0.3 + p[3] * 2)); else coDots.hide(i); });
        coDots.done();
        glow.intensity = 2.5 + 0.8 * Math.sin(time * 3);
        let lvl = '#5ce1a9'; for (const [v, , c] of DANGER) if (ppm >= v) lvl = c;
        lCO.element.innerHTML = `CO <b>${fmt0(ppm)} ppm</b> · ${effect(ppm)}`; lCO.element.style.setProperty('--c', lvl);
        lWin.element.innerHTML = open < 0.05 ? 'window shut' : 'window open';
        const k = `${s.hrs}|${s.fuel}|${s.kg}|${s.ach}|${s.night}`;
        if (k !== key) { key = k; cb.redraw(); eb.redraw(); rb.redraw(); }
      },
      readout(s) {
        if (s.look === 'emc2') {
          const f = FUELS[s.fuel], E = s.kg * f.hhv, dm = (E * 1e6) / (C_LIGHT * C_LIGHT);
          return `<div class="big">Δm = E ÷ c²</div>
            <div class="row"><span>Heat from ${s.kg < 1 ? fmt0(s.kg * 1000) + ' g' : fmtKg(s.kg)} of ${f.short.toLowerCase()} (HHV ${f.hhv} MJ/kg)</span><b style="color:${COL.heat}">${fmtMJ(E)}</b></div>
            <div class="row"><span>c², the speed of light squared</span><b>9.0 × 10¹⁶ m²/s²</b></div>
            <div class="row"><span>Mass carried off by the heat</span><b style="color:${COL.heat}">${fmtG(dm * 1000)}</b></div>
            <div class="row"><span>Fraction of the fuel’s mass</span><b>${(dm / s.kg).toExponential(1)}</b></div>
            <small>True, but tiny: about one part in 10 billion of everything that reacted. No balance can see it, so for chemistry, mass is conserved. In nuclear fission about 0.09 % of the mass turns into energy.</small>`;
        }
        if (s.look === 'co') {
          const ppm = coPPM(s.night, s.ach);
          return `<div class="big ${ppm >= 200 ? 'no' : ''}">CO: ${fmt0(ppm)} ppm after ${s.night} h</div>
            <div class="row"><span>Charcoal burned, 0.5 kg an hour</span><b>${fmtKg(0.5 * s.night)}</b></div>
            <div class="row"><span>Carbon monoxide made (about 200 g per kg)</span><b style="color:${COL.CO}">${fmt0(100 * s.night)} g</b></div>
            <div class="row"><span>Fresh air: ${s.ach.toFixed(1)} room-fulls an hour (30 m³ room)</span><b>${fmt0(s.ach * 30)} m³/h</b></div>
            <div class="row"><span>What it does to you</span><b class="${ppm >= 200 ? 'no' : 'ok'}">${effect(ppm)}</b></div>
            <small>A rough, well-mixed estimate; real rooms can be worse. CO has no smell. Never sleep with an angithi, a coal stove or a gas heater burning in a closed room.</small>`;
        }
        const wg = Math.min(CANDLE.g, CANDLE.rate * s.hrs);
        return `<div class="big">C₂₅H₅₂ + 38 O₂ → 25 CO₂ + 26 H₂O</div>
          <div class="row"><span>Wax burned in ${s.hrs} h (about 7 g an hour)</span><b style="color:#ff7a59">${fmtG(wg)}</b></div>
          <div class="row"><span>Oxygen taken from the room</span><b style="color:${COL.O2}">${fmtG(wg * PERW.O2)}</b></div>
          <div class="row"><span>CO₂ + water vapour sent into the room</span><b style="color:${COL.mass}">${fmtG(wg * PERW.CO2)} + ${fmtG(wg * PERW.H2O)}</b></div>
          <div class="row"><span>The balance</span><b>−${fmtG(wg)}</b></div>
          <small>Myth-buster: the candle isn’t destroyed. It leaves as gases that weigh ${(PERW.CO2 + PERW.H2O).toFixed(1)} times the wax. Phlogiston theory read the falling balance the wrong way round.</small>`;
      },
    };
  },
};
