// Chapter 4: fire, and the slow "burning" inside you.
// Fire (1 unit ≈ 20 cm). The fire triangle: fuel, heat and oxygen; take any one away and the fire goes out.
//  - Water cools: warming 1 kg from 25 to 100 °C takes 0.31 MJ and boiling it 2.26 MJ, 2.6 MJ in all.
//  - CO₂ smothers: most flames die below about 15 % oxygen. A CO₂ flooding system is designed for at
//    least 34 % CO₂ (NFPA 12 minimum design concentration), which dilutes air's 20.9 % O₂ to 13.8 %.
//    Released CO₂ fills 0.54 m³ per kg (1.84 kg/m³ at 20 °C), so a 4.5 kg extinguisher gives 2.4 m³.
//  - A blanket cuts off the air: the flame uses up the oxygen under it.
//  The fire here is a small wood fire of about 30 kW: 108 MJ an hour, about 7 kg of dry wood at 16 MJ/kg.
// Body (1 unit ≈ 25 cm). Glucose: C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O, 2,803 kJ/mol. Stored fat is taken as the
// triglyceride C₅₅H₁₀₄O₆ that Meerman and Brown used (BMJ 2014;349:g7257): C₅₅H₁₀₄O₆ + 78 O₂ → 55 CO₂ +
// 52 H₂O. 10 kg of fat needs 29.0 kg O₂ and makes 28.1 kg CO₂ and 10.9 kg water. Tracing only the fat's
// own atoms: all its carbon leaves as CO₂, all its hydrogen as water, and its oxygen splits in the ratio
// the products hold it (110 : 52), so 84 % of the fat's mass is breathed out as CO₂ and 16 % leaves as water.
// A day's CO₂: glucose gives 94 g CO₂ per MJ; fat 71 g per MJ (fat about 39.5 MJ/kg). A mixed diet is
// taken as half and half: about 83 g per MJ, so 2,000 kcal (8.4 MJ) → about 0.7 kg of CO₂ a day
// (Meerman and Brown: 0.74 kg for a 70 kg person at rest).
import { THREE, M, box, beam, rod, sphere, torus } from '../kit.js';
import { AW, MW, COL, hex, fmtG, fmtKg, fmt0, board, panelBg, axes, title, line, dot, legend, stack, dots, puffs, makeFlame, rng, fitNarrow, reelPlace, inReel, clamp, smooth, lerp } from '../combust.js';

const TG = { C: 55, H: 104, O: 6 }, tgMW = TG.C * AW.C + TG.H * AW.H + TG.O * AW.O;   // 861.4 g/mol
const FAT = { O2: (78 * MW.O2) / tgMW, CO2: (55 * MW.CO2) / tgMW, H2O: (52 * MW.H2O) / tgMW };
const oToCO2 = 110 / 162;
export const FAT_CO2_SHARE = (TG.C * AW.C + TG.O * AW.O * oToCO2) / tgMW;            // 0.843
const GPERMJ = { carb: (6 * MW.CO2) / 2.803, fat: (55 * MW.CO2) / (0.8614 * 39.5), o2carb: (6 * MW.O2) / 2.803, o2fat: (78 * MW.O2) / (0.8614 * 39.5) };
const EXT = {
  none: { n: 'Nothing', side: '' },
  water: { n: 'Water', side: 'heat' },
  co2: { n: 'CO₂', side: 'oxygen' },
  blanket: { n: 'Fire blanket', side: 'oxygen' },
  fuel: { n: 'Remove the fuel', side: 'fuel' },
};
const BX = 12;
const VIEWS = { fire: { pos: [-0.2, 3.2, 7.6], target: [-0.2, 2.55, 0] }, body: { pos: [BX + 0.7, 3.9, 9.4], target: [BX + 0.7, 3.25, 0] } };

export default {
  id: 'body',
  short: 'Fire and you',
  title: 'Put out a fire, and breathe out your lunch',
  subtitle: 'The fire triangle and how extinguishers break it, and why lost fat leaves through your lungs.',
  view: VIEWS.fire,
  learn: `<p><b>The fire triangle.</b> A fire needs three things at once: <b>fuel</b>, <b>heat</b> and <b>oxygen</b>. Take away any one and it goes out. <b>Water</b> takes away heat: each kilogram soaks up about 2.6 MJ as it warms and boils into steam. <b>CO₂</b> from an extinguisher pushes the oxygen out: below about 15 % oxygen (air has 21 %) most flames die. A <b>fire blanket</b> or a lid on a burning pan does the same by cutting off the air.</p>
    <p>Never throw water on burning oil. The water sinks, flashes into steam in an instant and throws the burning oil everywhere. Put a lid on it and turn the gas off.</p>
    <p><b>Your body burns too, slowly.</b> Your cells combine food with the oxygen you breathe: <b>C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O</b>, exactly the same reaction as burning sugar in a flame. The energy comes out in small steps, as chemical energy your cells can use, and as body heat, not as fire.</p>
    <p>So where does fat go when you lose weight? Chemists Ruben Meerman and Andrew Brown followed every atom in 2014: about <b>84 % leaves as CO₂ through your lungs</b>, and 16 % as water. Your lungs are the main exit for lost weight (see LungsClear). Breathing harder doesn't help, though: only the energy you actually use burns fat.</p>
    <p class="tip"><b>Try it:</b> try each way to put out the fire and watch which side of the triangle breaks. Then set how much fat to lose and follow its atoms out.</p>`,
  terms: [
    { t: 'Fire triangle', d: 'Fuel, heat and oxygen. A fire needs all three; remove one and it goes out.' },
    { t: 'Latent heat', d: 'Heat that turns water into steam without warming it: 2.26 MJ per kg.' },
    { t: 'Smothering', d: 'Putting out a fire by cutting off or diluting its oxygen.' },
    { t: 'Respiration', d: 'Your cells’ slow “burning” of food with oxygen, making CO₂, water and energy.' },
    { t: 'Triglyceride', d: 'The molecule of stored body fat: three fatty acids on a glycerol backbone, about C₅₅H₁₀₄O₆.' },
    { t: 'Metabolism', d: 'All the chemical reactions that keep you alive, including burning food for energy.' },
  ],
  defaults: { look: 'fire', ext: 'none', fat: 10, kcal: 2000 },
  controls: [
    { key: 'look', type: 'seg', label: 'Look at', options: [{ v: 'fire', label: 'Fire triangle' }, { v: 'body', label: 'Your body' }] },
    { key: 'ext', type: 'seg', label: 'Fire: put it out with', options: Object.entries(EXT).map(([v, e]) => ({ v, label: e.n })) },
    { key: 'go', type: 'buttons', label: 'Fire', items: [{ label: 'Light it again', act: (s, inst) => { s.ext = 'none'; inst.relight?.(); } }] },
    { key: 'fat', type: 'range', label: 'Body: fat to lose', min: 1, max: 20, step: 0.5, ends: ['1 kg', '20 kg'], fmt: (v) => v.toFixed(1) + ' kg' },
    { key: 'kcal', type: 'range', label: 'Body: energy you use a day', min: 1400, max: 3500, step: 100, ends: ['1,400 kcal', '3,500 kcal'], fmt: (v) => fmt0(v) + ' kcal' },
  ],
  onChange(s, key) {
    if (key === 'ext' || key === 'action') s.look = 'fire';
    if (key === 'fat' || key === 'kcal') s.look = 'body';
  },
  quiz: [
    { q: 'A CO₂ extinguisher puts out a fire mainly by…', options: ['Cooling it with ice', 'Pushing the oxygen away, so the air around the fire has too little to burn', 'Adding fuel', 'Making it rain'], answer: 1, why: 'CO₂ dilutes the air. Below about 15 % oxygen, most flames can’t keep going. It breaks the oxygen side of the fire triangle.' },
    { q: 'When you lose 10 kg of fat, where does most of it go?', options: ['Out as sweat', 'Turned into muscle', 'Breathed out as CO₂', 'Burned into energy, so it disappears'], answer: 2, why: 'Meerman and Brown traced the atoms: about 8.4 kg leaves as CO₂ through the lungs and 1.6 kg as water. Mass is never turned into energy in chemistry.' },
    { q: 'Why is water good at putting out a wood fire?', options: ['It removes the fuel', 'It soaks up a lot of heat, especially as it boils into steam', 'It contains no oxygen', 'It is heavy'], answer: 1, why: 'Heating and boiling 1 kg of water takes about 2.6 MJ, pulling the fuel below the temperature it needs to keep burning.' },
  ],
  reel: [
    { ms: 5200, caption: 'A fire needs fuel, heat and oxygen. A CO₂ extinguisher pushes the oxygen out.', set: { look: 'fire', ext: 'none' }, act: (s, inst) => { inst.relight(); s.ext = 'co2'; }, view: { pos: [0.4, 3.8, 6.4], target: [0.4, 3.9, 0] }, spin: 0.06 },
    { ms: 5200, caption: 'Lose 10 kg of fat and 8.4 kg of it leaves as CO₂, breathed out through your lungs.', set: { look: 'body', kcal: 2000 }, anim: { fat: [1, 10] }, view: { pos: [BX + 0.4, 3.9, 6.2], target: [BX + 0.4, 4.0, 0] }, spin: 0.05 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const rnd = rng(44);
    // ================================================================ fire
    const F = new THREE.Group(); root.add(F);
    const ground = box(6, 0.1, 3, M.matte(0x3a3226)); ground.position.set(0.3, -0.05, 0); F.add(ground);
    const ring = []; for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, st = sphere(0.16, M.matte(0x6a6f78), 10); st.scale.y = 0.7; st.position.set(0.75 * Math.cos(a), 0.1, 0.75 * Math.sin(a)); F.add(st); ring.push(st); }
    const logs = new THREE.Group(); F.add(logs);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; logs.add(beam([0.55 * Math.cos(a), 0.08, 0.55 * Math.sin(a)], [0.05 * Math.cos(a), 0.55, 0.05 * Math.sin(a)], 0.08, M.matte(0x6b4a2b))); }
    const embers = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.08, 20), new THREE.MeshBasicMaterial({ color: 0xff5a1a, toneMapped: false })); embers.position.y = 0.06; F.add(embers);
    const fl = [makeFlame(F, 1.1, 0.25), makeFlame(F, 0.8, 0.18, false), makeFlame(F, 0.7, 0.16, false)];
    fl[0].position.set(0, 0.2, 0); fl[1].position.set(0.2, 0.2, 0.12); fl[2].position.set(-0.18, 0.2, -0.1);
    const smoke = puffs(F, 120, 0.045, 0x7a808a, rnd), water = puffs(F, 160, 0.035, 0x6fb6ff, rnd), steam = puffs(F, 100, 0.05, 0xdfe8f5, rnd), co2 = puffs(F, 200, 0.055, 0xe8eef8, rnd);
    const blanket = box(2.2, 0.04, 2.2, M.matte(0xb0342a)); blanket.position.y = 3; F.add(blanket);
    // extinguisher
    const exG = new THREE.Group(); exG.position.set(-2.1, 0, 0.5); F.add(exG);
    const exBody = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.1, 24), M.plastic(0xc8302a)); exBody.position.y = 0.55; exG.add(exBody);
    exG.add(beam([0, 1.1, 0], [0, 1.25, 0], 0.06, M.matte(0x1b1d22)));
    const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.04, 0.4, 16, 1, true), M.matte(0x1b1d22, { side: THREE.DoubleSide })); horn.rotation.z = -Math.PI / 2 - 0.4; horn.position.set(0.45, 1.15, 0); exG.add(horn);
    exG.add(beam([0, 1.2, 0], [0.3, 1.2, 0], 0.03, M.matte(0x1b1d22)));
    // the fire triangle, glowing behind
    const TRI = [[0, 3.6], [-1.2, 1.55], [1.2, 1.55]].map(([x, y]) => [x + 0.3, y, -1.1]);
    const sides = [[0, 1], [0, 2], [1, 2]].map(([a, b]) => { const m = beam(TRI[a], TRI[b], 0.05, new THREE.MeshBasicMaterial({ color: 0xffb547, toneMapped: false, transparent: true })); F.add(m); return m; });
    // side 0 (left) = heat, side 1 (right) = oxygen, side 2 (bottom) = fuel
    const lSides = [stage.label('HEAT', [-0.55, 2.7, -1.1], F, 'hot'), stage.label('OXYGEN', [1.25, 2.7, -1.1], F, 'hot'), stage.label('FUEL', [0.3, 1.25, -1.1], F, 'hot')];
    const lFire = stage.label('', [1.6, 0.9, 0.9], F, 'hot');
    const fs = { k: 1, o2: 20.9, T: 1, fuel: 1, blanket: 0, t: 0 };
    const relight = () => { fs.k = 1; fs.o2 = 20.9; fs.T = 1; fs.fuel = 1; fs.blanket = 0; fs.t = 0; smoke.clear(); water.clear(); steam.clear(); co2.clear(); };

    // ================================================================ body
    const B = new THREE.Group(); B.position.x = BX; root.add(B);
    const floorB = box(6, 0.1, 3, M.matte(0x2b3039)); floorB.position.set(0.4, -0.05, 0); B.add(floorB);
    const skin = M.matte(0xc68a62, { roughness: 0.7 }), cloth = M.matte(0x3a6ea5);
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.0, 8, 20), M.clear(0x3a6ea5, 0.35)); torso.position.y = 2.35; torso.scale.z = 0.62; B.add(torso);
    const headM = sphere(0.3, skin, 24); headM.position.y = 3.45; B.add(headM);
    B.add(beam([0, 3.1, 0], [0, 3.25, 0], 0.11, skin));
    const legs = [-0.2, 0.2].map((x) => { const l = beam([x, 1.6, 0], [x, 0.1, 0], 0.13, M.matte(0x2a2e37)); B.add(l); return l; });
    const arms = [-1, 1].map((sd) => { const a = beam([sd * 0.5, 2.85, 0], [sd * 0.7, 1.8, 0.1], 0.1, cloth); B.add(a); return a; });
    const lungMat = new THREE.MeshStandardMaterial({ color: 0xff8a9a, emissive: 0xff4a6a, emissiveIntensity: 0.3, transparent: true, opacity: 0.85 });
    const lungs = [-1, 1].map((sd) => { const l = sphere(0.2, lungMat, 20); l.scale.set(1, 1.6, 0.8); l.position.set(sd * 0.2, 2.6, 0); B.add(l); return l; });
    const mouth = new THREE.Vector3(0, 3.38, 0.28);
    const breath = puffs(B, 160, 0.05, hex(COL.CO2), rnd), breathW = puffs(B, 80, 0.04, hex(COL.H2O), rnd), inhale = puffs(B, 80, 0.04, hex(COL.O2), rnd);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 0.05, 32), M.plastic(0xf2f2f2)); plate.position.set(-1.5, 1.2, 0.3); B.add(plate);
    const table = box(1.3, 0.06, 1, M.matte(0x7a5230)); table.position.set(-1.5, 1.15, 0.3); B.add(table);
    [[-0.55, -0.4], [0.55, -0.4], [-0.55, 0.4], [0.55, 0.4]].forEach(([x, z]) => B.add(beam([-1.5 + x, 0, 0.3 + z], [-1.5 + x, 1.12, 0.3 + z], 0.03, M.matte(0x7a5230))));
    const roti = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.03, 24), M.matte(0xd9a860)); roti.position.set(-1.58, 1.25, 0.28); B.add(roti);
    const lBreath = stage.label('', [1.25, 3.95, 0.4], B, 'hot'), lFood = stage.label('food: C, H and O', [-1.5, 1.6, 0.5], B);
    lBreath.element.style.setProperty('--c', COL.CO2);
    let S = {};
    const bb = board(root, 3.2, 2.2, 620, 426, (g, w, h) => {
      panelBg(g, w, h);
      const kg = S.fat || 10;
      title(g, `Where ${kg} kg of fat goes`, 'Meerman and Brown, BMJ 2014');
      const mx = kg * (1 + FAT.O2) * 1.02, W = w - 150;
      stack(g, 130, 80, W, 38, [{ v: kg, color: COL.fuel, label: 'fat' }, { v: kg * FAT.O2, color: COL.O2, label: 'oxygen breathed in' }], mx, '');
      stack(g, 130, 150, W, 38, [{ v: kg * FAT.CO2, color: COL.CO2, label: 'CO₂ breathed out' }, { v: kg * FAT.H2O, color: COL.H2O, label: 'water' }], mx, '');
      g.font = 'bold 19px sans-serif'; g.fillStyle = COL.text; g.fillText('in', 20, 106); g.fillText('out', 20, 176);
      g.fillStyle = 'rgba(255,255,255,.8)'; g.font = '18px sans-serif'; g.fillText(`${fmtKg(kg)} + ${fmtKg(kg * FAT.O2)} O₂ = ${fmtKg(kg * FAT.CO2)} CO₂ + ${fmtKg(kg * FAT.H2O)} water`, 20, 226);
      g.font = 'bold 20px sans-serif'; g.fillStyle = COL.text; g.fillText('Follow only the fat’s own atoms:', 20, 272);
      stack(g, 20, 290, w - 40, 46, [{ v: FAT_CO2_SHARE, color: COL.CO2, label: `${fmtKg(kg * FAT_CO2_SHARE)} out as CO₂ (lungs)` }, { v: 1 - FAT_CO2_SHARE, color: COL.H2O, label: `${Math.round((1 - FAT_CO2_SHARE) * 100)}%` }], 1, '');
      g.fillStyle = COL.mass; g.font = 'bold 22px sans-serif'; g.fillText(`${Math.round(FAT_CO2_SHARE * 100)} % breathed out, ${Math.round((1 - FAT_CO2_SHARE) * 100)} % as water`, 20, 380);
      g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '16px sans-serif'; g.fillText('C₅₅H₁₀₄O₆ + 78 O₂ → 55 CO₂ + 52 H₂O', 20, 410);
    }, [BX + 3.7, 2.2, -0.3]);
    bb.mesh.rotation.y = -0.3;

    let look = '', key = '';
    const cOn = new THREE.Color(0xffb547), cOff = new THREE.Color(0x333844);
    return {
      relight,
      update(dt, s, time) {
        dt = Math.max(0, Math.min(dt, 0.1)); S = s;
        fitNarrow(stage, [lFood, ...lSides]);
        reelPlace([[bb, [BX + 0.4, 6.5, 0], 1.15]]);
        if (s.look !== look) { look = s.look; if (!inReel()) { const v = VIEWS[look]; stage.setView(v.pos, v.target, 1.0); } }
        F.visible = look === 'fire'; B.visible = bb.mesh.visible = look === 'body';
        // ---- fire
        fs.t += dt;
        const e = s.ext;
        if (e === 'water') fs.T = Math.max(0, fs.T - dt * 0.5);
        if (e === 'co2') fs.o2 = Math.max(12, fs.o2 - dt * 5);
        if (e === 'blanket') { fs.blanket = Math.min(1, fs.blanket + dt * 1.5); if (fs.blanket >= 1) fs.o2 = Math.max(10, fs.o2 - dt * 4); }
        if (e === 'fuel') fs.fuel = Math.max(0, fs.fuel - dt * 0.8);
        if (e === 'none') { fs.o2 = Math.min(20.9, fs.o2 + dt * 3); fs.blanket = Math.max(0, fs.blanket - dt * 2); }
        const oK = clamp((fs.o2 - 15) / 3, 0, 1), target = Math.min(oK, fs.T > 0.35 ? 1 : 0, fs.fuel > 0.1 ? 1 : 0) * (fs.k > 0.02 || e === 'none' ? 1 : 0);
        fs.k = lerp(fs.k, target, 1 - Math.exp(-3 * dt));
        if (fs.k < 0.02 && e === 'none' && fs.fuel > 0.1 && fs.T > 0.35) fs.k = 0.02;
        fl.forEach((f, i) => f.set(fs.k * (i ? 0.8 : 1), 0.8, time + i));
        embers.material.color.setHex(fs.T > 0.35 ? 0xff5a1a : 0x3a2a20);
        logs.scale.setScalar(0.3 + 0.7 * fs.fuel); logs.position.x = (1 - fs.fuel) * 2.4;
        blanket.position.y = lerp(3, 0.75, smooth(fs.blanket)); blanket.visible = fs.blanket > 0.01;
        exG.visible = e === 'co2' || e === 'water'; exBody.material.color.setHex(e === 'co2' ? 0x1b1d22 : 0xc8302a);
        smoke.step(dt, 25 * fs.k, () => [(rnd() - 0.5) * 0.3, 1 + rnd() * 0.3, (rnd() - 0.5) * 0.3], () => [(rnd() - 0.5) * 0.2, 0.7, (rnd() - 0.5) * 0.2], 2.2, 0.5);
        water.step(dt, e === 'water' && fs.T > 0.05 ? 120 : 0, () => [-1.6, 1.15, 0.5], () => [1.9 + rnd() * 0.5, 0.5 + rnd() * 0.5, -0.4 + (rnd() - 0.5) * 0.4], 0.9);
        steam.step(dt, e === 'water' && fs.T > 0.05 ? 50 : 0, () => [(rnd() - 0.5) * 0.6, 0.4, (rnd() - 0.5) * 0.6], () => [(rnd() - 0.5) * 0.5, 0.9, (rnd() - 0.5) * 0.5], 1.8, 0.4);
        co2.step(dt, e === 'co2' && fs.o2 > 12.5 ? 160 : 0, () => [-1.55, 1.05, 0.5], () => [1.7 + rnd() * 0.6, -0.3 + rnd() * 0.4, -0.5 + (rnd() - 0.5) * 0.9], 1.4, 1.2);
        const broken = [fs.T <= 0.35, fs.o2 < 15.5, fs.fuel <= 0.1];
        sides.forEach((m, i) => { m.material.color.copy(broken[i] ? cOff : cOn); m.material.opacity = broken[i] ? 0.4 : 1; });
        lSides.forEach((l, i) => { l.element.style.setProperty('--c', broken[i] ? '#666c78' : '#ffb547'); l.element.style.textDecoration = broken[i] ? 'line-through' : 'none'; });
        lFire.element.innerHTML = fs.k > 0.3 ? `fire <b>burning</b> · O₂ ${fs.o2.toFixed(1)} %` : `fire <b>out</b> · O₂ ${fs.o2.toFixed(1)} %`;
        lFire.element.style.setProperty('--c', fs.k > 0.3 ? '#ff7a3d' : COL.mass);
        // ---- body: one breath every 4 s
        const br = (time % 4) / 4, exh = br > 0.45;
        lungs.forEach((l) => l.scale.set(1 + 0.12 * Math.sin(br * Math.PI * 2), 1.6 + 0.2 * Math.sin(br * Math.PI * 2), 0.8));
        torso.scale.x = 1 + 0.04 * Math.sin(br * Math.PI * 2);
        const out = () => [mouth.x + (rnd() - 0.5) * 0.05, mouth.y, mouth.z + 0.05];
        breath.step(dt, exh ? 45 : 0, out, () => [0.35 + rnd() * 0.3, 0.1 + rnd() * 0.25, 0.4 + rnd() * 0.3], 2.2, 0.8);
        breathW.step(dt, exh ? 22 : 0, out, () => [0.3 + rnd() * 0.3, 0.15 + rnd() * 0.25, 0.4 + rnd() * 0.3], 2.0, 0.5);
        inhale.step(dt, exh ? 0 : 30, () => [mouth.x + 0.8 + (rnd() - 0.5) * 0.4, mouth.y - 0.3 + (rnd() - 0.5) * 0.4, mouth.z + 0.7], () => [-0.7, 0.27, -0.6], 1.1);
        const MJ = (s.kcal * 4.184) / 1000, co2d = (MJ * (GPERMJ.carb + GPERMJ.fat)) / 2;
        lBreath.element.innerHTML = `breathing out <b>${fmt0(co2d)} g CO₂</b> a day`;
        const k = `${s.fat}`; if (k !== key) { key = k; bb.redraw(); }
      },
      readout(s) {
        if (s.look === 'body') {
          const MJ = (s.kcal * 4.184) / 1000, co2d = (MJ * (GPERMJ.carb + GPERMJ.fat)) / 2, o2d = (MJ * (GPERMJ.o2carb + GPERMJ.o2fat)) / 2;
          return `<div class="big">C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O</div>
            <div class="row"><span>A day on ${fmt0(s.kcal)} kcal: O₂ in · CO₂ out</span><b>${fmt0(o2d)} g · ${fmt0(co2d)} g</b></div>
            <div class="row"><span>${s.fat} kg of fat takes in O₂</span><b style="color:${COL.O2}">${fmtKg(s.fat * FAT.O2)}</b></div>
            <div class="row"><span>and gives out CO₂ + water</span><b>${fmtKg(s.fat * FAT.CO2)} + ${fmtKg(s.fat * FAT.H2O)}</b></div>
            <div class="row"><span>The fat’s own mass breathed out</span><b style="color:${COL.mass}">${fmtKg(s.fat * FAT_CO2_SHARE)} (${Math.round(FAT_CO2_SHARE * 100)} %)</b></div>
            <small>Same reaction as a flame, done in small steps by enzymes. Fat holds about 39 MJ per kg, so losing 1 kg means using about 9,400 kcal more than you eat.</small>`;
        }
        const ex = EXT[s.ext];
        const why = { none: 'All three sides are there, so it keeps burning. Pick a way to break the triangle.', water: 'Water breaks the heat side: heating and boiling each kg takes 2.6 MJ (0.31 to warm, 2.26 to boil).', co2: 'CO₂ breaks the oxygen side: at 34 % CO₂ the air holds only 13.8 % oxygen, below the roughly 15 % flames need.', blanket: 'The blanket breaks the oxygen side: the flame uses up the air trapped under it.', fuel: 'No fuel, no fire. That’s why firefighters cut firebreaks, and why you turn the gas off first.' }[s.ext];
        return `<div class="big">${fs.k > 0.3 ? 'Burning: fuel + heat + oxygen' : 'Out: the triangle is broken'}</div>
          <div class="row"><span>Oxygen in the air round the fire</span><b class="${fs.o2 < 15 ? 'ok' : ''}">${fs.o2.toFixed(1)} %</b></div>
          <div class="row"><span>Put out with</span><b>${ex.n}${ex.side ? ' → removes ' + ex.side : ''}</b></div>
          <div class="row"><span>A small wood fire gives about</span><b>30 kW</b></div>
          <small>${why} Never use water on burning oil or electrics.</small>`;
      },
    };
  },
};
