// Chapter 2: the law in the kitchen.
// Hob (1 unit ≈ 10 cm). A big LPG burner of 2 kW (Indian domestic hobs are rated about 1.5–2.5 kW per
// burner; see ChimneyClear). LPG is modelled as butane, C₄H₁₀ (domestic LPG in India is a butane–propane
// mix; propane gives 3.0 kg CO₂ per kg too). LHV 45.7 MJ/kg, so 2 kW burns 2,000 ÷ 45.7e6 × 3,600 =
// 158 g an hour. Per kg of butane: 3.58 kg O₂ in, 3.03 kg CO₂ and 1.55 kg H₂O out. A 14.2 kg cylinder:
// 14.2 + 50.8 kg of O₂ = 43.0 kg CO₂ + 22.0 kg of water vapour.
// Kitchen air: a well-mixed box of 25 m³ with 1 air change an hour (a closed-up kitchen) or a hood that
// pulls 500 m³/h and catches 80 % of the plume (a typical capture efficiency for a hood over the back
// burners). CO₂ rise = G ÷ Q × (1 − e^(−Q t ÷ V)); CO₂ at 20 °C is 1.84 kg/m³. Outdoor air ≈ 420 ppm.
// Flame colour: with enough primary air (premixed before the burner) the flame is blue; starved of it,
// soot forms and glows yellow and more CO escapes (see ChimneyClear's flame chapter).
// Iron (1 unit ≈ 5 cm). An equal-arm balance. Steel wool burns mostly to magnetite: 3 Fe + 2 O₂ → Fe₃O₄,
// which weighs 231.5 ÷ 167.5 = 1.38 times the iron. Rust is mostly hydrated iron oxide, taken here as
// FeO(OH): 4 Fe + 3 O₂ + 2 H₂O → 4 FeO(OH), 1.59 times the iron.
import { THREE, M, box, beam, rod, sphere, torus } from '../kit.js';
import {
  FUELS, AW, MW, burn, COL, hex, fmtG, fmtKg, fmt0, board, panelBg, axes, title, line, dot, legend, stack,
  makeFlame, puffs, rng, fitNarrow, reelPlace, inReel, clamp, smooth, lerp,
} from '../combust.js';

const HOB = { kW: 2, cyl: 14.2, V: 25, Qn: 25, Qh: 500, cap: 0.8, rhoCO2: 1.84, out: 420 };
const lpgPerH = (HOB.kW * 3600) / (FUELS.butane.lhv * 1000);            // kg per hour: 0.158
const PERKG = (() => { const r = burn('butane', 1000, 1).g; return { O2: r.O2 / 1000, CO2: r.CO2 / 1000, H2O: r.H2O / 1000 }; })();
export function kitchenCO2(mins, hood) {
  const G = (lpgPerH * PERKG.CO2) / HOB.rhoCO2, t = mins / 60;            // m³ of CO₂ an hour
  const g = hood ? G * (1 - HOB.cap) : G, Q = hood ? HOB.Qn + HOB.Qh : HOB.Qn;
  return HOB.out + (g / Q) * (1 - Math.exp((-Q * t) / HOB.V)) * 1e6;
}
const FE = { burn: { f: 'Fe₃O₄', k: (3 * AW.Fe + 4 * AW.O) / (3 * AW.Fe), eq: '3 Fe + 2 O₂ → Fe₃O₄', name: 'burning steel wool' }, rust: { f: 'FeO(OH)', k: (AW.Fe + 2 * AW.O + AW.H) / AW.Fe, eq: '4 Fe + 3 O₂ + 2 H₂O → 4 FeO(OH)', name: 'rusting' } };
const SX = 11;
const VIEWS = { hob: { pos: [0.8, 3.9, 8.9], target: [0.8, 3.25, 0] }, iron: { pos: [SX + 0.7, 2.9, 7.8], target: [SX + 0.7, 2.45, 0] } };

export default {
  id: 'kitchen',
  short: 'In the kitchen',
  title: 'A gas cylinder makes three times its weight in CO₂',
  subtitle: 'The LPG hob and its chimney, and steel wool that gets heavier as it burns.',
  view: VIEWS.hob,
  learn: `<p><b>The gas hob.</b> A 14.2 kg LPG cylinder holds mostly butane, C₄H₁₀. Burn it all and you make about <b>43 kg of carbon dioxide</b> and 22 kg of water vapour. How can 14.2 kg become 65 kg? Every carbon atom picks up <b>two oxygen atoms</b> from your kitchen air, and oxygen is heavy. The cylinder also used up about <b>51 kg of oxygen</b>, from roughly 220 kg of air.</p>
    <p>That's why a kitchen needs a <b>chimney</b> or an exhaust fan (see ChimneyClear). An hour on a big burner adds about half a kilogram of CO₂ and a quarter of a litre of water to the room. With the windows shut and no hood, CO₂ can climb to several thousand ppm, enough to feel stuffy and sleepy.</p>
    <p><b>Blue or yellow?</b> A blue flame gets enough air mixed in before it burns, so the carbon burns right through. Starve it and specks of carbon, <b>soot</b>, glow yellow, blacken the pan and some <b>carbon monoxide</b> escapes.</p>
    <p><b>Iron that gets heavier.</b> Light a pad of steel wool on a balance and it <b>sinks</b>: the iron joins oxygen to make iron oxide, which weighs more. Rusting is the same reaction, only slow. This was Lavoisier's big clue: burning doesn't release something, it <b>takes in</b> oxygen.</p>
    <p class="tip"><b>Try it:</b> close the air on the hob and watch the flame turn yellow. Switch the hood off and cook for 30 minutes. Then light the steel wool and watch the balance tip.</p>`,
  terms: [
    { t: 'LPG', d: 'Liquefied petroleum gas: butane and propane squeezed into a liquid in a cylinder.' },
    { t: 'Primary air', d: 'Air mixed with the gas inside the burner, before it reaches the flame. Enough of it gives a clean blue flame.' },
    { t: 'Soot', d: 'Tiny specks of unburnt carbon. When they glow they make a flame yellow.' },
    { t: 'ppm', d: 'Parts per million. Outdoor air has about 420 ppm of CO₂; above 1,000 a room feels stuffy.' },
    { t: 'Oxide', d: 'A compound of an element with oxygen, like iron oxide (rust) or carbon dioxide.' },
    { t: 'Oxidation', d: 'Joining with oxygen. Burning is fast oxidation; rusting is slow oxidation.' },
  ],
  defaults: { look: 'hob', air: 0.7, hood: true, mins: 30, used: 14.2, metal: 'burn', wool: 5, frac: 60 },
  controls: [
    { key: 'look', type: 'seg', label: 'Look at', options: [{ v: 'hob', label: 'LPG hob' }, { v: 'iron', label: 'Steel wool' }] },
    { key: 'air', type: 'range', label: 'Hob: air mixed into the gas', min: 0.05, max: 1, step: 0.05, ends: ['starved', 'plenty'], fmt: (v) => (v < 0.3 ? 'yellow, sooty' : v < 0.5 ? 'lazy, orange tips' : 'crisp blue') },
    { key: 'hood', type: 'toggle', label: 'Hob: chimney hood on' },
    { key: 'mins', type: 'range', label: 'Hob: cooking time', min: 0, max: 120, step: 5, ends: ['0', '2 hours'], fmt: (v) => v + ' min' },
    { key: 'used', type: 'range', label: 'Hob: LPG burned', min: 0.5, max: 14.2, step: 0.1, ends: ['0.5 kg', 'a full 14.2 kg cylinder'], fmt: (v) => v.toFixed(1) + ' kg' },
    { key: 'metal', type: 'seg', label: 'Iron: reaction', options: [{ v: 'burn', label: 'Burn it' }, { v: 'rust', label: 'Let it rust' }] },
    { key: 'wool', type: 'range', label: 'Iron: steel wool on the pan', min: 1, max: 10, step: 0.5, ends: ['1 g', '10 g'], fmt: (v) => v.toFixed(1) + ' g' },
    { key: 'frac', type: 'range', label: 'Iron: how much has reacted', min: 0, max: 100, step: 5, ends: ['none', 'all'], fmt: (v) => v + '%' },
  ],
  onChange(s, key) {
    if (['air', 'hood', 'mins', 'used'].includes(key)) s.look = 'hob';
    if (['metal', 'wool', 'frac'].includes(key)) s.look = 'iron';
  },
  quiz: [
    { q: 'A 14.2 kg LPG cylinder makes about 43 kg of CO₂. Where does the extra mass come from?', options: ['From the steel of the cylinder', 'From oxygen in the kitchen air, which joins the carbon', 'It is made by the heat', 'From the pan'], answer: 1, why: 'Each carbon atom (12 units) leaves as CO₂ (44 units), carrying two oxygen atoms from the air. So the gases weigh about three times the fuel.' },
    { q: 'Why does a gas flame turn yellow when its air holes are blocked?', options: ['The gas gets hotter', 'Unburnt specks of carbon (soot) glow yellow', 'Water vapour is yellow', 'The pan reflects light'], answer: 1, why: 'Without enough oxygen mixed in, some carbon doesn’t burn. Tiny glowing soot particles make the yellow light, and more carbon monoxide escapes.' },
    { q: 'Steel wool burns on a balance. What happens to the reading?', options: ['It goes down, like a candle', 'It stays exactly the same', 'It goes up', 'It goes down, then up'], answer: 2, why: 'Iron joins oxygen from the air to make iron oxide, a solid that stays on the pan. It weighs more than the iron did.' },
  ],
  reel: [
    { ms: 5400, caption: 'Burn a 14.2 kg LPG cylinder and you make about 43 kg of CO₂, with oxygen taken from the air.', set: { look: 'hob', hood: true, used: 14.2, mins: 30 }, anim: { air: [0.1, 0.8] }, view: { pos: [0.6, 4.6, 6.6], target: [0.6, 4.8, 0] }, spin: 0.06 },
    { ms: 5200, caption: 'Steel wool gets heavier as it burns. The iron grabs oxygen: Lavoisier’s big clue.', set: { look: 'iron', metal: 'burn', wool: 6 }, anim: { frac: [0, 100] }, view: { pos: [SX + 0.4, 3.9, 6.0], target: [SX + 0.4, 3.9, 0] }, spin: 0.05 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const rnd = rng(21);
    let S = {};
    // ================================================================ hob and hood
    const Hb = new THREE.Group(); root.add(Hb);
    const counter = box(5.6, 0.9, 2.4, M.matte(0x3a3f4b)); counter.position.set(0, 0.45, 0); Hb.add(counter);
    const top = box(5.6, 0.06, 2.4, M.matte(0x9aa0aa, { roughness: 0.4 })); top.position.set(0, 0.93, 0); Hb.add(top);
    const hob = box(2.2, 0.12, 1.3, new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.15, metalness: 0.3 })); hob.position.set(0, 1.02, 0.1); Hb.add(hob);
    const BY = 1.14;
    const ring = torus(0.28, 0.05, M.metal(0x8a909c), 40); ring.rotation.x = Math.PI / 2; ring.position.set(0, BY, 0.1); Hb.add(ring);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.06, 32), M.metal(0x2a2c31)); cap.position.set(0, BY + 0.03, 0.1); Hb.add(cap);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; Hb.add(beam([0.25 * Math.cos(a), BY + 0.03, 0.1 + 0.25 * Math.sin(a)], [0.5 * Math.cos(a), BY + 0.14, 0.1 + 0.5 * Math.sin(a)], 0.025, M.matte(0x1b1d22))); }
    const flames = []; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, f = makeFlame(Hb, 0.26, 0.05, i % 6 === 0); f.position.set(0.27 * Math.cos(a), BY + 0.02, 0.1 + 0.27 * Math.sin(a)); f.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35); flames.push(f); }
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.5, 0.32, 40, 1, true), M.metal(0xb9bec8, { side: THREE.DoubleSide })); pan.position.set(0, BY + 0.34, 0.1); Hb.add(pan);
    const panB = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.03, 40), M.metal(0x6a707c)); panB.position.set(0, BY + 0.19, 0.1); Hb.add(panB);
    const sootMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false });
    const soot = new THREE.Mesh(new THREE.CircleGeometry(0.49, 32), sootMat); soot.rotation.x = Math.PI / 2; soot.position.set(0, BY + 0.172, 0.1); Hb.add(soot);
    const hand = beam([0.62, BY + 0.42, 0.1], [1.4, BY + 0.46, 0.1], 0.04, M.matte(0x1b1d22)); Hb.add(hand);
    // the chimney hood and duct
    const HY = 3.4;
    const hoodM = M.metal(0xc9ced8, { roughness: 0.3, transparent: true, opacity: 0.55, depthWrite: false });
    const hoodG = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 1.4, 0.7, 4, 1, true), hoodM); hoodG.rotation.y = Math.PI / 4; hoodG.scale.set(1, 1, 0.7); hoodG.position.set(0, HY, 0.05); Hb.add(hoodG);
    const duct = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.7, 0.45), hoodM); duct.position.set(0, HY + 1.2, -0.1); Hb.add(duct);
    const filt = box(1.8, 0.03, 1.2, M.matte(0x6a707c, { transparent: true, opacity: 0.6 })); filt.position.set(0, HY - 0.34, 0.05); Hb.add(filt);
    const fanR = new THREE.Group(); fanR.position.set(0, HY + 0.4, -0.1); Hb.add(fanR);
    for (let i = 0; i < 4; i++) { const b = box(0.24, 0.02, 0.07, M.matte(0x8fb0ff)); b.geometry.translate(0.12, 0, 0); b.rotation.y = (i / 4) * Math.PI * 2; fanR.add(b); }
    const gasCO2 = puffs(Hb, 160, 0.05, hex(COL.CO2), rnd), gasH2O = puffs(Hb, 160, 0.045, hex(COL.H2O), rnd), sootP = puffs(Hb, 60, 0.03, 0x222222, rnd);
    const cyl = new THREE.Group(); cyl.position.set(-2.1, 0, 1.5); Hb.add(cyl);
    const cylBody = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.2, 32), M.plastic(0xc8302a)); cylBody.position.y = 0.7; cyl.add(cylBody);
    const cylTop = sphere(0.4, M.plastic(0xc8302a), 24); cylTop.scale.y = 0.5; cylTop.position.y = 1.3; cyl.add(cylTop);
    const valve = rod(-0.08, 0.08, 0.08, 0.08, M.metal(0xb9bec8), 16); valve.rotation.z = Math.PI / 2; valve.position.y = 1.52; cyl.add(valve);
    const cylFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.1, 32), M.matte(0x3a3f4b)); cylFoot.position.y = 0.05; cyl.add(cylFoot);
    const lCyl = stage.label('', [-2.1, 1.95, 1.5], Hb, 'hot'); lCyl.element.style.setProperty('--c', '#ff7a59');
    const lHood = stage.label('', [-1.75, HY - 0.1, 0.3], Hb, 'hot'); lHood.element.style.setProperty('--c', COL.CO2);
    const lFl = stage.label('', [0.9, BY + 0.05, 0.9], Hb, 'hot');
    const hb = board(root, 3.1, 2.07, 600, 400, (g, w, h) => {
      panelBg(g, w, h);
      const kg = S.used || 14.2;
      title(g, 'Where the mass goes', `${kg.toFixed(1)} kg of LPG`);
      const IN = kg * (1 + PERKG.O2), mx = IN * 1.02, W = w - 180;
      stack(g, 160, 92, W, 40, [{ v: kg, color: COL.fuel, label: 'LPG' }, { v: kg * PERKG.O2, color: COL.O2, label: 'oxygen from the air' }], mx, '');
      stack(g, 160, 170, W, 40, [{ v: kg * PERKG.CO2, color: COL.CO2, label: 'carbon dioxide' }, { v: kg * PERKG.H2O, color: COL.H2O, label: 'water' }], mx, '');
      g.font = 'bold 20px sans-serif'; g.fillStyle = COL.text; g.fillText('in', 20, 120); g.fillText('out', 20, 198);
      g.font = '19px sans-serif'; g.fillStyle = 'rgba(255,255,255,.8)';
      g.fillText(`${fmtKg(kg)} LPG + ${fmtKg(kg * PERKG.O2)} O₂`, 160, 82); g.fillText(`${fmtKg(kg * PERKG.CO2)} CO₂ + ${fmtKg(kg * PERKG.H2O)} water`, 160, 238);
      // CO₂ in the kitchen over time
      const pts = (hood) => { const a = []; for (let m = 0; m <= 120; m += 4) a.push([m, kitchenCO2(m, hood)]); return a; };
      const { X, Y } = axes(g, w, h, { x0: 90, y1: 280, y0: h - 34, xMax: 120, yMax: 8000, xTicks: [0, 30, 60, 90, 120], yTicks: [0, 4000, 8000], xFmt: (v) => v + ' min', yFmt: (v) => fmt0(v) });
      line(g, pts(false), X, Y, '#ff7a59', 4); line(g, pts(true), X, Y, COL.mass, 4);
      dot(g, X(S.mins || 0), Y(kitchenCO2(S.mins || 0, S.hood)), S.hood ? COL.mass : '#ff7a59', 8);
      g.font = 'bold 16px sans-serif'; g.fillStyle = '#ff7a59'; g.fillText('no hood', X(70), Y(kitchenCO2(70, false)) - 12);
      g.fillStyle = COL.mass; g.fillText('hood on', X(98), Y(600) - 10);
      g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '16px sans-serif'; g.fillText('kitchen CO₂, ppm', 20, 270);
    }, [3.65, 2.45, 0]);
    hb.mesh.rotation.y = -0.3;

    // ================================================================ steel wool on a beam balance
    const Fb = new THREE.Group(); Fb.position.x = SX; root.add(Fb);
    const ironBench = box(5.6, 0.12, 2.4, M.matte(0x2b3039)); ironBench.position.set(0, -0.06, 0); Fb.add(ironBench);
    const baseF = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.14, 32), M.matte(0x3a2a1c)); baseF.position.y = 0.07; Fb.add(baseF);
    const post = beam([0, 0.1, 0], [0, 2.6, 0], 0.07, M.metal(0xc8a24a)); Fb.add(post);
    const beamG = new THREE.Group(); beamG.position.y = 2.65; Fb.add(beamG);
    beamG.add(rod(-1.8, 1.8, 0.045, 0.045, M.metal(0xc8a24a), 16));
    const pivot = sphere(0.09, M.metal(0xc8a24a), 16); beamG.add(pivot);
    const needle = beam([0, 0, 0], [0, 0.55, 0], 0.02, M.metal(0x333333)); beamG.add(needle);
    const scaleArc = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.012, 6, 32, 0.6), M.matte(0xdddddd)); scaleArc.rotation.z = Math.PI / 2 - 0.3; scaleArc.position.set(0, 2.65, 0.02); Fb.add(scaleArc);
    const mkPan = () => {
      const p = new THREE.Group();
      for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; p.add(beam([0, 0, 0], [0.42 * Math.cos(a), -1.1, 0.42 * Math.sin(a)], 0.008, M.metal(0x999999), 6)); }
      const dishP = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 0.08, 32), M.metal(0xc8a24a)); dishP.position.y = -1.12; p.add(dishP);
      Fb.add(p); return p;
    };
    const panL = mkPan(), panR = mkPan();
    const woolMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.9, metalness: 0.6 });
    const wool = new THREE.Group(); panL.add(wool);
    for (let i = 0; i < 26; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.12 + 0.12 * rnd(), 0.012, 4, 18), woolMat); t.position.set((rnd() - 0.5) * 0.35, -0.95 + rnd() * 0.18, (rnd() - 0.5) * 0.35); t.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); wool.add(t); }
    const weights = new THREE.Group(); panR.add(weights);
    const wMat = M.metal(0xd4a84a);
    [[0, 0.16], [0.14, 0.12], [-0.13, 0.1]].forEach(([x, r]) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r * 0.6, r * 1.2, 20), wMat); c.position.set(x, -1.08 + r * 0.6, 0); weights.add(c); });
    const sparks = puffs(Fb, 120, 0.025, 0xffb040, rnd);
    const lL = stage.label('', [-1.8, 1.9, 0.5], Fb, 'hot'), lR = stage.label('', [1.8, 1.9, 0.5], Fb);
    lL.element.style.setProperty('--c', COL.Fe);
    const fb = board(root, 2.9, 1.9, 600, 392, (g, w, h) => {
      panelBg(g, w, h);
      const m = FE[S.metal || 'burn'], m0 = S.wool || 5, f = (S.frac ?? 0) / 100, gain = m0 * f * (m.k - 1);
      title(g, 'Weigh it', m.name);
      const mx = m0 * 1.65, W = w - 200;
      stack(g, 180, 80, W, 40, [{ v: m0, color: COL.Fe, label: 'iron' }], mx, '');
      stack(g, 180, 160, W, 40, [{ v: m0 * (1 - f), color: COL.Fe, label: 'iron' }, { v: m0 * f, color: '#6b3b2a', label: '' }, { v: gain, color: COL.O2, label: 'O' }], mx, '');
      g.font = 'bold 19px sans-serif'; g.fillStyle = COL.text; g.fillText('before', 20, 108); g.fillText('after', 20, 188);
      g.fillStyle = '#ffd24a'; g.fillText('phlogiston says', 20, 268);
      stack(g, 180, 240, W, 40, [{ v: m0 * (1 - 0.1 * f), color: 'rgba(255,210,74,.5)', label: 'lighter?' }], mx, '');
      g.fillStyle = COL.mass; g.font = 'bold 22px sans-serif'; g.fillText(`${fmtG(m0)} → ${fmtG(m0 + gain)}  (+${fmtG(gain)})`, 20, 340);
      g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '16px sans-serif'; g.fillText(`${m.eq}, ×${m.k.toFixed(2)}`, 20, 372);
    }, [SX + 3.9, 2.0, -0.3]);
    fb.mesh.rotation.y = -0.3;

    let look = '', key = '', tilt = 0;
    const cB = new THREE.Color(0x9aa0a8), cK = new THREE.Color(0x2a2d3a), cR = new THREE.Color(0x9a4a22);
    return {
      update(dt, s, time) {
        dt = Math.max(0, Math.min(dt, 0.1)); S = s;
        fitNarrow(stage, [lFl, lR]);
        reelPlace([[hb, [0.6, 7.3, 0], 1.2], [fb, [SX + 0.4, 6.35, 0], 1.25]]);
        if (s.look !== look) { look = s.look; if (!inReel()) { const v = VIEWS[look]; stage.setView(v.pos, v.target, 1.0); } }
        Hb.visible = hb.mesh.visible = look === 'hob'; Fb.visible = fb.mesh.visible = look === 'iron';
        // ---- hob
        const yel = clamp((0.5 - s.air) / 0.4, 0, 1);
        flames.forEach((f, i) => f.set(1, yel, time + i * 0.37));
        sootMat.opacity = 0.25 * yel;
        const hood = s.hood;
        fanR.rotation.y += dt * (hood ? 14 : 0);
        const at = () => { const a = rnd() * Math.PI * 2; return [0.7 * Math.cos(a), BY + 0.4, 0.1 + 0.6 * Math.sin(a)]; };
        const vel = (p) => { return hood ? [-p[0] * 0.25, 0.75, -0.02] : [p[0] * 0.25 + (rnd() - 0.5) * 0.3, 0.45, (rnd() - 0.2) * 0.35]; };
        gasCO2.step(dt, 26, at, vel, hood ? 3.6 : 5, hood ? 0 : 0.4);
        gasH2O.step(dt, 52, at, vel, hood ? 3.6 : 5, hood ? 0 : 0.4);
        sootP.step(dt, 40 * yel, () => [(rnd() - 0.5) * 0.5, BY + 0.3, 0.1 + (rnd() - 0.5) * 0.5], () => [(rnd() - 0.5) * 0.2, 0.6, 0], 1.6);
        lCyl.element.innerHTML = `${s.used.toFixed(1)} kg LPG → <b>${fmtKg(s.used * PERKG.CO2)} CO₂</b>`;
        lHood.element.innerHTML = hood ? 'hood pulls CO₂ + steam out' : 'no hood: CO₂ + steam fill the room';
        lFl.element.innerHTML = yel > 0.5 ? 'yellow: soot + CO' : yel > 0.05 ? 'orange tips' : 'blue: clean burn';
        lFl.element.style.setProperty('--c', yel > 0.3 ? '#ffb030' : COL.flame);
        // ---- iron
        const m = FE[s.metal], f = s.frac / 100, gain = s.wool * f * (m.k - 1);
        tilt = lerp(tilt, clamp(gain * 0.09, 0, 0.32), 1 - Math.exp(-5 * dt));
        beamG.rotation.z = tilt;
        const ex = Math.cos(tilt) * 1.8, ey = Math.sin(tilt) * 1.8;
        panL.position.set(-ex, 2.65 - ey, 0); panR.position.set(ex, 2.65 + ey, 0);
        woolMat.color.copy(cB).lerp(s.metal === 'burn' ? cK : cR, f);
        wool.scale.setScalar(0.8 + 0.06 * s.wool);
        const burning = s.metal === 'burn' && f > 0 && f < 1;
        sparks.step(dt, burning ? 70 : 0, () => { const p = panL.position; return [p.x + (rnd() - 0.5) * 0.4, p.y - 0.85, (rnd() - 0.5) * 0.4]; }, () => [(rnd() - 0.5) * 1.2, 0.6 + rnd() * 0.8, (rnd() - 0.5) * 1.2], 0.5);
        lL.position.set(-ex, 2.65 - ey - 0.6, 0.6); lL.element.innerHTML = `${m.f === 'Fe₃O₄' ? 'steel wool' : 'iron'} <b>${fmtG(s.wool + gain)}</b>`;
        lR.position.set(ex, 2.65 + ey - 0.6, 0.6); lR.element.innerHTML = `weights ${fmtG(s.wool)}`;
        const kk = `${s.used}|${s.mins}|${s.hood}|${s.metal}|${s.wool}|${s.frac}`;
        if (kk !== key) { key = kk; hb.redraw(); fb.redraw(); }
      },
      readout(s) {
        if (s.look === 'iron') {
          const m = FE[s.metal], f = s.frac / 100, gain = s.wool * f * (m.k - 1);
          return `<div class="big">${m.eq}</div>
            <div class="row"><span>Iron on the pan</span><b>${fmtG(s.wool)}</b></div>
            <div class="row"><span>Oxygen it has taken from the air</span><b style="color:${COL.O2}">+${fmtG(gain)}</b></div>
            <div class="row"><span>On the pan now</span><b style="color:${COL.mass}">${fmtG(s.wool + gain)}</b></div>
            <div class="row"><span>Fully reacted, ${m.f} weighs</span><b>${m.k.toFixed(2)} × the iron</b></div>
            <small>${s.metal === 'burn' ? 'Burning is fast oxidation. The oxide stays on the pan, so the balance tips down, the opposite of a candle.' : 'Rust is slow oxidation, with water too. A rusty nail weighs more than the bright nail it was.'} The phlogiston theory said burning released something, so it should get lighter.</small>`;
        }
        const ppm = kitchenCO2(s.mins, s.hood), hr = s.mins / 60;
        return `<div class="big">2 C₄H₁₀ + 13 O₂ → 8 CO₂ + 10 H₂O</div>
          <div class="row"><span>${s.used.toFixed(1)} kg LPG + ${fmtKg(s.used * PERKG.O2)} O₂ from the air</span><b>${fmtKg(s.used * (1 + PERKG.O2))}</b></div>
          <div class="row"><span>Makes CO₂ + water vapour</span><b style="color:${COL.mass}">${fmtKg(s.used * PERKG.CO2)} + ${fmtKg(s.used * PERKG.H2O)}</b></div>
          <div class="row"><span>A 2 kW burner for ${s.mins} min burns</span><b>${fmt0(lpgPerH * 1000 * hr)} g → ${fmt0(lpgPerH * PERKG.CO2 * 1000 * hr)} g CO₂</b></div>
          <div class="row"><span>Kitchen CO₂ (25 m³, ${s.hood ? 'hood on' : 'windows shut, no hood'})</span><b class="${ppm > 2000 ? 'no' : 'ok'}">${fmt0(ppm)} ppm</b></div>
          <small>Each 12 g of carbon leaves with 32 g of oxygen as 44 g of CO₂: that is why the gas weighs three times the fuel. ${s.air < 0.3 ? 'Starved of air, the flame makes soot and carbon monoxide.' : ''}</small>`;
      },
    };
  },
};
