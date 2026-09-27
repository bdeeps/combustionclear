// Chapter 3: a petrol engine (see CarClear and MotorcycleClear). 1 unit ≈ 4 cm.
// Petrol is a mix of hundreds of hydrocarbons. On average it is about CH₁.₈₇ (Heywood, Internal
// Combustion Engine Fundamentals, table D.4), density about 0.74 kg/L, LHV about 43.4 MJ/kg.
// Per kg: O₂ needed = (1 + 1.87/4) × 32.00 ÷ 13.90 = 3.38 kg, from 14.6 kg of air: the "14.7 : 1"
// stoichiometric air–fuel ratio quoted for petrol (pure octane would need 15.1). CO₂ = 44.01 ÷ 13.90 =
// 3.17 kg per kg, so 1 L (0.74 kg) makes 2.34 kg of CO₂ (US EPA: 8,887 g per US gallon = 2.35 kg/L)
// and 0.90 kg of water.
// Engine-out pollutants against λ (air ÷ stoichiometric air): CO comes from our oxygen-sharing model
// (combust.js) plus about 0.5 % near λ = 1 from dissociation; unburnt hydrocarbons (HC) about 2,000 ppm
// at λ = 1, more when rich, and a rise near the lean misfire limit; NOx peaks just lean of λ = 1 (hot,
// with spare oxygen). These follow the shapes of Heywood fig. 11-2; the numbers are typical, not one
// engine's. A three-way catalytic converter cleans all three only in a narrow window around λ = 1
// (about ±1 %): rich, it lacks O₂ to burn CO and HC; lean, it can't strip oxygen from NOx.
import { THREE, M, box, beam, rod, sphere, torus } from '../kit.js';
import { AW, MW, O2_AIR, COL, hex, fmtG, fmtKg, fmt0, board, panelBg, axes, title, line, dot, legend, stack, dots, puffs, rng, fitNarrow, reelPlace, inReel, clamp, smooth, lerp } from '../combust.js';

const PET = { C: 1, H: 1.87, rho: 0.74, lhv: 43.4, afr: 14.7 };
const pmw = AW.C + PET.H * AW.H;                                  // 13.90 g per "CH1.87"
const PER = { O2: ((1 + PET.H / 4) * MW.O2) / pmw, CO2: MW.CO2 / pmw, H2O: ((PET.H / 2) * MW.H2O) / pmw };
// Exhaust gas made per mole of CH1.87 at air ratio lam, and the engine-out pollutant levels.
export function exhaust(lam) {
  const st = 1 + PET.H / 4, O2 = lam * st, N2 = O2 * 3.773, H2O = PET.H / 2;
  const Or = 2 * O2 - H2O; let CO2 = 1, CO = 0, spare = 0;
  if (Or >= 2) spare = (Or - 2) / 2; else { CO2 = Or - 1; CO = 2 - Or; }
  const tot = CO2 + CO + H2O + N2 + spare;
  const COpct = (CO / tot) * 100 + 0.5 * Math.exp(-Math.max(0, lam - 1) * 18) * (lam >= 1 ? 1 : 1);
  const HC = 2000 * (1 + 3 * Math.max(0, 1 - lam)) + 9000 * Math.max(0, lam - 1.12) ** 1.5 * 10;
  const NOx = 3500 * Math.exp(-(((lam - 1.07) / 0.1) ** 2)) + 150;
  return { CO2, CO, H2O, N2, spare, COpct, HC, NOx };
}
const sig = (x) => 1 / (1 + Math.exp(-x));
export const catEff = (lam) => ({ ox: 0.98 * sig((lam - 0.99) / 0.004), nox: 0.98 * sig((1.01 - lam) / 0.004) });
const VEH = { car: { n: 'Car', kmpl: 15, note: 'a small petrol car, 15 km per litre' }, bike: { n: 'Motorcycle', kmpl: 50, note: 'a 125 cc motorcycle, 50 km per litre' } };

export default {
  id: 'engines',
  short: 'Engines',
  title: 'A litre of petrol makes 2.3 kg of CO₂',
  subtitle: 'Inside a petrol engine: the 14.7 : 1 mixture, lean and rich, and the catalytic converter.',
  view: { pos: [-0.6, 4.1, 11], target: [-0.6, 3.3, 0] },
  learn: `<p>A car or motorbike engine is a <b>combustion chamber</b> that burns a tiny puff of petrol and air thousands of times a minute (see CarClear and MotorcycleClear). The hot gas pushes the piston down, and the burnt gas leaves through the exhaust.</p>
    <p>Petrol is made of carbon and hydrogen, roughly CH₁.₈₇. To burn each gram completely it needs about <b>14.7 grams of air</b>. That's the <b>stoichiometric ratio</b>, and engine computers aim for it all the time, using an oxygen sensor in the exhaust.</p>
    <p>Now weigh it. A litre of petrol is only <b>0.74 kg</b>, but it makes about <b>2.3 kg of CO₂</b> and 0.9 kg of water. The carbon picks up oxygen from nearly 11 kg of air. Most of what comes out of the tailpipe is actually <b>nitrogen</b> from that air, passing straight through.</p>
    <p><b>Rich</b> (too little air, λ below 1) leaves <b>carbon monoxide</b> and unburnt fuel (<b>HC</b>). <b>Lean</b> (spare air) runs hot and makes <b>NOx</b>, from nitrogen and oxygen joining in the heat. The <b>catalytic converter</b> is a honeycomb coated with platinum, palladium and rhodium. At λ = 1 it turns CO and HC into CO₂ and water, and NOx back into nitrogen. It can't remove the CO₂, though: that is the fuel's carbon, and it has nowhere else to go.</p>
    <p class="tip"><b>Try it:</b> slide the mixture from rich to lean and watch the three pollutants swap places. Then switch the catalytic converter off.</p>`,
  terms: [
    { t: 'Air–fuel ratio', d: 'Mass of air per mass of fuel. For petrol, 14.7 : 1 burns it completely with nothing to spare.' },
    { t: 'Rich and lean', d: 'Rich: less air than needed (λ < 1). Lean: more air than needed (λ > 1).' },
    { t: 'Carbon monoxide (CO)', d: 'A poisonous gas made when carbon burns with too little oxygen.' },
    { t: 'HC', d: 'Unburnt or partly burnt hydrocarbons: fuel that escaped the flame.' },
    { t: 'NOx', d: 'Nitrogen oxides, made when the nitrogen and oxygen of air join in a very hot flame. They cause smog.' },
    { t: 'Three-way catalytic converter', d: 'A honeycomb in the exhaust that cleans CO, HC and NOx at once, but only near λ = 1.' },
  ],
  defaults: { lam: 1, veh: 'car', L: 1, cat: true },
  controls: [
    { key: 'lam', type: 'range', label: 'Mixture (λ: 1 = 14.7 : 1)', min: 0.8, max: 1.25, step: 0.01, ends: ['rich', 'lean'], fmt: (v) => `λ = ${v.toFixed(2)} · ${(v * PET.afr).toFixed(1)} : 1` },
    { key: 'cat', type: 'toggle', label: 'Catalytic converter' },
    { key: 'L', type: 'range', label: 'Petrol burned', min: 1, max: 40, step: 1, ends: ['1 L', '40 L, a full tank'], fmt: (v) => v + ' L' },
    { key: 'veh', type: 'seg', label: 'Vehicle', options: [{ v: 'car', label: 'Car' }, { v: 'bike', label: 'Motorcycle' }], fmt: (v) => VEH[v].note },
  ],
  quiz: [
    { q: 'A litre of petrol weighs 0.74 kg. About how much CO₂ does it make?', options: ['0.74 kg, the same', 'About 0.3 kg', 'About 2.3 kg', 'About 15 kg'], answer: 2, why: 'Each carbon atom leaves with two oxygen atoms from the air, so the CO₂ weighs about three times the petrol’s carbon: about 2.3 kg per litre.' },
    { q: 'What does an air–fuel ratio of 14.7 : 1 mean?', options: ['14.7 litres of fuel per litre of air', '14.7 g of air for every gram of petrol', '14.7 km per litre', '14.7 % oxygen'], answer: 1, why: 'It is by mass: 14.7 g of air has just enough oxygen to burn 1 g of petrol completely.' },
    { q: 'Why must a catalytic converter run near λ = 1?', options: ['It melts otherwise', 'Rich, there is no spare O₂ to burn CO and HC; lean, it can’t take oxygen off NOx', 'It only works at night', 'It makes the engine stronger'], answer: 1, why: 'A three-way catalyst needs a balance: just enough oxygen to finish CO and HC, and not so much that NOx can’t give its oxygen up.' },
  ],
  reel: [
    { ms: 5400, caption: 'A litre of petrol weighs 0.74 kg but makes 2.3 kg of CO₂. The rest is oxygen from 11 kg of air.', set: { cat: true, L: 1, veh: 'car' }, anim: { lam: [0.85, 1.0] }, view: { pos: [-1.5, 5.0, 8.2], target: [-1.5, 4.6, 0] }, spin: 0.05 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const rnd = rng(33);
    const floorB = box(10.5, 0.1, 3, M.matte(0x2b3039)); floorB.position.set(-1.0, -0.05, 0); root.add(floorB);
    // ---- the cylinder, cut away
    const BORE = 0.55, Y0 = 1.3, Y1 = 3.4;
    const block = new THREE.Mesh(new THREE.CylinderGeometry(BORE + 0.12, BORE + 0.12, Y1 - Y0, 40, 1, true, Math.PI * 0.15, Math.PI * 1.7), M.metal(0x8a909c, { side: THREE.DoubleSide, roughness: 0.5 }));
    block.position.y = (Y0 + Y1) / 2; root.add(block);
    const head = box(1.7, 0.4, 1.4, M.metal(0x6a707c, { roughness: 0.5 })); head.position.y = Y1 + 0.2; root.add(head);
    const gasMat = new THREE.MeshBasicMaterial({ color: 0xff7a2a, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending });
    const gas = new THREE.Mesh(new THREE.CylinderGeometry(BORE - 0.01, BORE - 0.01, 1, 32), gasMat); root.add(gas);
    const piston = new THREE.Mesh(new THREE.CylinderGeometry(BORE - 0.02, BORE - 0.02, 0.4, 32), M.metal(0xc9ced8, { roughness: 0.3 })); root.add(piston);
    const rodM = beam([0, 0, 0], [0, 1, 0], 0.07, M.metal(0xa9aeb8)); root.add(rodM);
    const crank = new THREE.Group(); crank.position.set(0, 0.55, 0); root.add(crank);
    const web = box(0.2, 0.62, 0.12, M.metal(0x6a707c)); web.position.y = 0.2; crank.add(web);
    const cw = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 24, 1, false, Math.PI * 0.6, Math.PI * 0.8), M.metal(0x6a707c)); cw.rotation.x = Math.PI / 2; crank.add(cw);
    const plug = beam([0, Y1 + 0.35, 0], [0, Y1 + 0.85, 0], 0.07, M.matte(0xe8e2d0)); root.add(plug);
    const spark = sphere(0.12, M.glow(0xbfe0ff), 12); spark.position.y = Y1 - 0.04; root.add(spark);
    const vIn = beam([0.3, Y1 - 0.02, 0], [0.3, Y1 + 0.5, 0], 0.035, M.metal(0xb9bec8)), vEx = beam([-0.3, Y1 - 0.02, 0], [-0.3, Y1 + 0.5, 0], 0.035, M.metal(0xb9bec8));
    root.add(vIn, vEx);
    // intake and exhaust pipes
    const pipeM = M.metal(0x9aa3b2, { roughness: 0.4, transparent: true, opacity: 0.5, depthWrite: false });
    const intake = beam([0.35, Y1 + 0.2, 0], [2.2, Y1 + 0.9, 0], 0.2, pipeM); root.add(intake);
    const inj = beam([1.1, Y1 + 0.95, 0], [0.95, Y1 + 0.45, 0], 0.05, M.matte(0x1b1d22)); root.add(inj);
    const ex1 = beam([-0.35, Y1 + 0.2, 0], [-1.3, Y1 + 0.2, 0], 0.18, pipeM), ex2 = beam([-1.3, Y1 + 0.2, 0], [-1.8, 1.0, 0], 0.18, pipeM), ex3 = beam([-1.8, 1.0, 0], [-2.4, 1.0, 0], 0.18, pipeM);
    root.add(ex1, ex2, ex3);
    const catShell = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.4, 32, 1, true), M.metal(0xb9bec8, { transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })); catShell.rotation.z = Math.PI / 2; catShell.position.set(-3.1, 1.0, 0); root.add(catShell);
    const honey = new THREE.Group(); honey.position.set(-3.1, 1.0, 0); root.add(honey);
    const honeyM = M.matte(0x8a6a3a); for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) { if (i * i + j * j > 11) continue; const c = box(1.3, 0.1, 0.1, honeyM); c.position.set(0, i * 0.11, j * 0.11); c.scale.set(1, 0.6, 0.6); honey.add(c); }
    const ex4 = beam([-3.8, 1.0, 0], [-5.2, 1.0, 0], 0.14, pipeM); root.add(ex4);
    const airIn = puffs(root, 90, 0.04, 0xcfe8ff, rnd), fuelIn = puffs(root, 60, 0.03, hex(COL.fuel), rnd);
    // tailpipe molecules: each puff is one gas, colour-coded
    const NP = 220, out = dots(NP, 0.055); root.add(out);
    const P = Array.from({ length: NP }, () => ({ life: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, sp: 'N2' }));
    const SPC = { N2: '#5b8cff', CO2: COL.CO2, H2O: COL.H2O, CO: COL.CO, HC: '#c49bff', NOx: '#c8743a', O2: COL.O2 };
    const lCat = stage.label('', [-3.1, 1.75, 0], root, 'hot'), lPipe = stage.label('', [-5.2, 0.6, 0.3], root, 'hot'), lMix = stage.label('', [2.3, Y1 + 1.35, 0], root, 'hot');
    const lKey = stage.label(Object.entries({ N2: 'N₂', CO2: 'CO₂', H2O: 'H₂O', CO: 'CO', HC: 'HC', NOx: 'NOx' }).map(([k, n]) => `<span style="color:${SPC[k]}">●</span> ${n}`).join(' '), [-2.6, 0.2, 1.3], root);
    lMix.element.style.setProperty('--c', COL.fuel);
    let S = {};
    const bd = board(root, 3.2, 2.53, 640, 506, (g, w, h) => {
      panelBg(g, w, h);
      const lam = S.lam ?? 1;
      title(g, 'Pollutants vs mixture', S.cat ? 'dashed: after the converter' : 'no converter');
      const { X, Y } = axes(g, w, 290, { x0: 70, y1: 70, y0: 250, xMin: 0.8, xMax: 1.25, yMax: 100, xTicks: [0.8, 0.9, 1, 1.1, 1.2], yTicks: [0, 50, 100], xFmt: (v) => v.toFixed(1), yFmt: (v) => v + '%' });
      const ser = (fn) => { const a = []; for (let l = 0.8; l <= 1.2501; l += 0.005) a.push([l, fn(l)]); return a; };
      const nCO = (l) => (exhaust(l).COpct / 8) * 100, nHC = (l) => (exhaust(l).HC / 8000) * 100, nNO = (l) => (exhaust(l).NOx / 4000) * 100;
      line(g, ser(nCO), X, Y, COL.CO, 4); line(g, ser(nHC), X, Y, SPC.HC, 4); line(g, ser(nNO), X, Y, SPC.NOx, 4);
      if (S.cat) { line(g, ser((l) => nCO(l) * (1 - catEff(l).ox)), X, Y, COL.CO, 3, [7, 6]); line(g, ser((l) => nNO(l) * (1 - catEff(l).nox)), X, Y, SPC.NOx, 3, [7, 6]); }
      g.fillStyle = 'rgba(92,225,169,.15)'; g.fillRect(X(0.99), 70, X(1.01) - X(0.99), 180);
      g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(X(lam), 70); g.lineTo(X(lam), 250); g.stroke();
      legend(g, [['CO (8 % = top)', COL.CO], ['HC', SPC.HC], ['NOx', SPC.NOx]], 20, 44, 16);
      // mass per litre
      const L = S.L || 1, kg = L * PET.rho, mx = kg * (1 + 14.7) * 1.02, W = w - 150;
      g.font = 'bold 20px sans-serif'; g.fillStyle = COL.text; g.fillText(`${L} L of petrol, ${fmtKg(kg)}:`, 20, 330);
      stack(g, 130, 350, W, 38, [{ v: kg, color: COL.fuel, label: '' }, { v: kg * PER.O2 * lam, color: COL.O2, label: 'O₂' }, { v: kg * 14.7 * lam - kg * PER.O2 * lam, color: '#5b8cff', label: 'nitrogen + argon' }], mx * Math.max(1, lam), '');
      const e = exhaust(lam), molC = (kg * 1000) / pmw, co2 = molC * e.CO2 * MW.CO2 / 1000, co = molC * e.CO * MW.CO / 1000;
      stack(g, 130, 420, W, 38, [{ v: co2, color: COL.CO2, label: 'CO₂' }, { v: co, color: COL.CO, label: '' }, { v: kg * PER.H2O, color: COL.H2O, label: '' }, { v: kg * 14.7 * lam - kg * PER.O2 * lam, color: '#5b8cff', label: 'nitrogen + argon' }, { v: molC * e.spare * MW.O2 / 1000, color: COL.O2, label: '' }], mx * Math.max(1, lam), '');
      g.font = 'bold 19px sans-serif'; g.fillStyle = COL.text; g.fillText('in', 20, 376); g.fillText('out', 20, 446);
      g.fillStyle = COL.mass; g.fillText(`CO₂ ${fmtKg(co2)}  ·  in = out = ${fmtKg(kg * (1 + 14.7 * lam))}`, 20, 494);
    }, [2.75, 1.4, 0.3]);
    bd.mesh.rotation.y = -0.2;

    let ph = 0, key = '';
    return {
      update(dt, s, time) {
        dt = Math.max(0, Math.min(dt, 0.1)); S = s;
        fitNarrow(stage, [lKey, lMix]);
        reelPlace([[bd, [-1.0, 7.0, 0], 1.3]]);
        // four strokes, slowed right down: one cycle in 2.4 s
        ph = (ph + dt / 2.4) % 1;
        const ang = ph * 4 * Math.PI, r = 0.45, Lr = 1.9;
        const cx = r * Math.sin(ang), cy = 0.55 + r * Math.cos(ang);
        const py = cy + Math.sqrt(Lr * Lr - cx * cx) + 0.2;
        crank.rotation.z = -ang;
        piston.position.y = py;
        const a0 = new THREE.Vector3(cx, cy, 0.1), a1 = new THREE.Vector3(0, py - 0.2, 0.1);
        rodM.position.copy(a0).add(a1).multiplyScalar(0.5); rodM.scale.y = a0.distanceTo(a1); rodM.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), a1.clone().sub(a0).normalize());
        gas.scale.y = Math.max(0.01, Y1 - (py + 0.2)); gas.position.y = (Y1 + py + 0.2) / 2;
        const stroke = Math.floor(ph * 4);                 // 0 intake, 1 compression, 2 power, 3 exhaust
        const sub = ph * 4 - stroke;
        vIn.position.y = stroke === 0 ? -0.12 * Math.sin(sub * Math.PI) : 0; vEx.position.y = stroke === 3 ? -0.12 * Math.sin(sub * Math.PI) : 0;
        spark.visible = stroke === 2 && sub < 0.08;
        const rich = clamp((1 - s.lam) / 0.2, 0, 1);
        gasMat.color.setHex(rich > 0.4 ? 0xffa030 : 0xff6a2a);
        gasMat.opacity = stroke === 2 ? 0.75 * (1 - sub) : stroke === 1 ? 0.12 : stroke === 3 ? 0.18 * (1 - sub) : 0.05;
        airIn.step(dt, stroke === 0 ? 70 : 6, () => [2.2 - rnd() * 0.3, Y1 + 0.9 + (rnd() - 0.5) * 0.2, (rnd() - 0.5) * 0.25], () => [-1.7, -0.65, 0], 1.0);
        fuelIn.step(dt, stroke === 0 ? 30 / s.lam : 0, () => [0.98, Y1 + 0.5, 0], () => [-0.8 - rnd() * 0.3, -0.5 - rnd() * 0.3, (rnd() - 0.5) * 0.3], 0.6);
        // exhaust gas: pick species by what is really in it (pollutants shown 10× more often so they can be seen)
        const e = exhaust(s.lam), eff = s.cat ? catEff(s.lam) : { ox: 0, nox: 0 };
        const tot = e.CO2 + e.CO + e.H2O + e.N2 + e.spare;
        const w = { N2: e.N2 / tot, CO2: e.CO2 / tot, H2O: e.H2O / tot, O2: e.spare / tot, CO: 10 * (e.COpct / 100), HC: 10 * e.HC * 1e-6 * 3, NOx: 10 * e.NOx * 1e-6 * 3 };
        const pick = (xPos) => {
          const after = xPos > 3.4 && s.cat;
          const ww = { ...w }; if (after) { ww.CO *= 1 - eff.ox; ww.HC *= 1 - eff.ox; ww.NOx *= 1 - eff.nox; }
          let sum = 0; for (const k in ww) sum += ww[k]; let u = rnd() * sum;
          for (const k in ww) { u -= ww[k]; if (u <= 0) return k; } return 'N2';
        };
        const col = new THREE.Color();
        let emit = stroke === 3 ? 90 * dt : 0;
        P.forEach((q, i) => {
          if (q.life <= 0 && emit >= 1 - rnd()) { emit -= 1; q.life = 3; q.x = 0.4; q.y = Y1 + 0.2; q.z = (rnd() - 0.5) * 0.15; q.sp = pick(0); q.seg = 0; q.cat = false; }
          if (q.life > 0) {
            q.life -= dt;
            const v = 1.6;
            if (q.x < 1.3) { q.x += v * dt; }
            else if (q.x < 1.8 && q.y > 1.0) { q.x += 0.35 * v * dt; q.y -= 1.9 * v * dt * 0.62; if (q.y < 1.0) q.y = 1.0; }
            else { q.x += v * dt; q.y = lerp(q.y, 1.0 + (rnd() - 0.5) * 0.02, 0.2); }
            if (!q.cat && q.x > 3.1) { q.cat = true; if (s.cat) { if ((q.sp === 'CO' || q.sp === 'HC') && rnd() < eff.ox) q.sp = rnd() < 0.5 ? 'CO2' : 'H2O'; if (q.sp === 'NOx' && rnd() < eff.nox) q.sp = 'N2'; } }
            if (q.x > 5.2) { q.y += 0.3 * dt; q.z += (rnd() - 0.5) * 0.05; }
            if (q.x > 6.0) q.life = 0;
            out.place(i, -q.x, q.y, q.z, 1); out.tint(i, col.set(SPC[q.sp]));
          } else out.hide(i);
        });
        out.done();
        honeyM.color.setHex(s.cat ? 0x8a6a3a : 0x3a3f4b); honey.visible = s.cat;
        const ok = s.lam >= 0.99 && s.lam <= 1.01;
        lCat.element.innerHTML = s.cat ? (ok ? 'converter: <b>cleaning all three</b>' : s.lam < 1 ? 'converter: CO and HC slip through' : 'converter: NOx slips through') : 'no converter';
        lCat.element.style.setProperty('--c', s.cat && ok ? COL.mass : '#ff7a59');
        lPipe.element.innerHTML = `tailpipe`;
        lMix.element.innerHTML = `${(14.7 * s.lam).toFixed(1)} g air : 1 g petrol`;
        const k = `${s.lam}|${s.cat}|${s.L}|${s.veh}`;
        if (k !== key) { key = k; bd.redraw(); }
      },
      readout(s) {
        const kg = s.L * PET.rho, v = VEH[s.veh], e = exhaust(s.lam), molC = (kg * 1000) / pmw;
        const co2 = (molC * e.CO2 * MW.CO2) / 1000, co = (molC * e.CO * MW.CO) / 1000, eff = s.cat ? catEff(s.lam) : { ox: 0, nox: 0 };
        const coT = (e.COpct * (1 - eff.ox)), noT = e.NOx * (1 - eff.nox);
        const gkm = ((PER.CO2 * PET.rho) * 1000) / v.kmpl;
        return `<div class="big">${s.L} L of petrol → ${fmtKg(co2 + co * (s.cat ? eff.ox * MW.CO2 / MW.CO : 0))} CO₂</div>
          <div class="row"><span>Petrol ${fmtKg(kg)} + air ${fmtKg(kg * 14.7 * s.lam)} (O₂ ${fmtKg(kg * PER.O2 * s.lam)})</span><b>${fmtKg(kg * (1 + 14.7 * s.lam))} in</b></div>
          <div class="row"><span>Water vapour made</span><b style="color:${COL.H2O}">${fmtKg(kg * PER.H2O)}</b></div>
          <div class="row"><span>Tailpipe CO · NOx${s.cat ? ', after the converter' : ''}</span><b class="${coT > 0.5 || noT > 500 ? 'no' : 'ok'}">${coT.toFixed(2)} % · ${fmt0(noT)} ppm</b></div>
          <div class="row"><span>${v.n}, ${v.kmpl} km/L</span><b>${fmt0(gkm)} g CO₂ per km</b></div>
          <small>${s.lam < 0.99 ? 'Rich: not enough oxygen for all the carbon, so CO and unburnt fuel come out, and some energy is wasted.' : s.lam > 1.01 ? `Lean: spare oxygen and a hot flame make NOx${s.cat ? ', and the converter can’t clean it.' : '.'}` : (s.cat ? 'Just right: the oxygen sensor keeps the mixture at 14.7 : 1 so the converter can clean all three pollutants.' : 'Just right, but with no converter the CO, HC and NOx all come out.')} Mass in = mass out, always.</small>`;
      },
    };
  },
};
