// Chapter 1: the law itself. A small burner stands in a glass jar on a digital balance. Burn some fuel
// and watch its molecules regroup, atom by atom, into CO₂ and water. Sealed, the balance never moves;
// open, it drops by the fuel burned, while the gases that escape weigh far more than that.
// Scene units: the jar is about 20 cm across (1 unit ≈ 10 cm). The molecules are drawn hugely magnified,
// and only a handful: the real burn has about 10²² of each.
// Model (combust.js): CₓHᵧO_z + (x + y/4 − z/2) O₂ → x CO₂ + y/2 H₂O. With too little air (λ < 1) we use
// the textbook split: hydrogen takes its oxygen first, then carbon to CO, then CO to CO₂; anything short
// stays as CO or soot. Heat = mass × lower heating value, minus the energy still locked in CO (283 kJ/mol)
// and soot (393.5 kJ/mol). Heating values: methane 55.5 HHV / 50.0 LHV, butane 49.5 / 45.7, octane
// 47.8 / 44.4 MJ/kg (Engineering Toolbox, NIST); dry wood about 16–18 MJ/kg.
// The balance weighs the jar, burner and fuel (1,850 g of glass and steel plus the fuel). Air inside
// a rigid jar is buoyed by the air outside, so what matters is only what goes in or out of the jar.
import { THREE, M, box, beam, rod } from '../kit.js';
import {
  FUELS, MW, burn, equation, sampleEquation, moleculeLists, SAMPLE, afr, mw, stO2, COL, hex, fmtG, fmtMJ, board, panelBg, axes, title, line, dot, legend, stack,
  makeCloud, scatter, makeFlame, makeScale, makeJar, rng, fitNarrow, reelPlace, inReel, clamp, smooth,
} from '../combust.js';

const BASE = 1850;                     // g: jar, lid and burner on the balance
const JX = -1.2;                        // where the jar stands
const T_WAIT = 0.4, T_BURN = 4.2, T_HOLD = 2.4;
const YELLOW = { methane: 0, butane: 0.05, octane: 0.75, wood: 0.85 };   // diffusion flames of liquids and wood are sooty
const FUEL_OPTS = ['methane', 'butane', 'octane', 'wood'];

export default {
  id: 'idea',
  short: 'Nothing is lost',
  title: 'Burning makes nothing vanish',
  subtitle: 'Burn gas, petrol or wood in a sealed jar on a balance. Count the atoms, then weigh them.',
  view: { pos: [0.65, 3.3, 8.6], target: [0.65, 2.7, 0] },
  learn: `<p><b>Combustion</b> is fast burning: a <b>fuel</b> joins with <b>oxygen</b> and gives out <b>heat</b> and light. The fuels we burn most are made of carbon and hydrogen. When they burn, every carbon atom ends up in <b>carbon dioxide</b> (CO₂) and every hydrogen atom in <b>water</b> (H₂O).</p>
    <p>For methane, the gas in a kitchen pipeline: <b>CH₄ + 2 O₂ → CO₂ + 2 H₂O</b>. Count them: one carbon, four hydrogens and four oxygens on each side. Burning only <b>swaps partners</b>. No atom is made and none is destroyed, so the mass can't change either. That's the <b>law of conservation of mass</b>: in a closed system, grams in = grams out.</p>
    <p>So why does a candle seem to shrink away to nothing? Because in the open, its products are <b>invisible gases</b> that float off, and the oxygen it takes comes from the air. Seal it in a jar and the balance doesn't budge. Antoine and Marie-Anne Lavoisier proved this with careful sealed-vessel experiments in the 1770s and 1780s.</p>
    <p>Each fuel carries a different amount of energy: about <b>50 MJ per kg</b> for methane, 46 for LPG, 44 for petrol and only 16 to 18 for dry wood, which already contains a lot of oxygen.</p>
    <p class="tip"><b>Try it:</b> burn the methane sealed, then open the jar and burn it again. Watch the balance, then the chart. Now turn the air supply below 1 and see carbon monoxide and soot appear.</p>`,
  terms: [
    { t: 'Combustion', d: 'A fast reaction of a fuel with oxygen that releases heat and light.' },
    { t: 'Conservation of mass', d: 'In a closed system, the total mass stays the same through any chemical reaction.' },
    { t: 'Balanced equation', d: 'A reaction written so every kind of atom appears the same number of times on both sides.' },
    { t: 'Closed system', d: 'One that nothing can enter or leave, like a sealed jar.' },
    { t: 'Heating value', d: 'Heat released by burning 1 kg of fuel. The lower value (LHV) leaves the water as steam; the higher (HHV) counts its condensing too.' },
    { t: 'Air supply (λ)', d: 'Air given ÷ air needed to burn the fuel completely. Below 1 is rich (too little air), above 1 lean.' },
  ],
  defaults: { fuel: 'methane', g: 1, lam: 1, sys: 'sealed' },
  controls: [
    { key: 'fuel', type: 'seg', label: 'Fuel', options: FUEL_OPTS.map((k) => ({ v: k, label: FUELS[k].short })), fmt: (v) => `${FUELS[v].f}, ${FUELS[v].where}` },
    { key: 'g', type: 'range', label: 'Amount burned', min: 0.1, max: 2, step: 0.1, ends: ['0.1 g', '2 g'], fmt: (v) => v.toFixed(1) + ' g of fuel' },
    { key: 'lam', type: 'range', label: 'Air supply (λ: 1 = just enough)', min: 0.5, max: 1.5, step: 0.05, ends: ['half', '1.5×'], fmt: (v) => `λ = ${v.toFixed(2)}${v < 0.97 ? ', rich' : v > 1.03 ? ', lean' : ''}` },
    { key: 'sys', type: 'seg', label: 'The jar', options: [{ v: 'sealed', label: 'Sealed' }, { v: 'open', label: 'Open' }] },
    { key: 'go', type: 'buttons', label: 'Run it again', items: [{ label: 'Burn again', act: (s, inst) => inst.restart?.() }] },
  ],
  onChange(s, key) { if (key && key !== 'action') s._re = true; },
  quiz: [
    { q: 'Methane burns in a sealed jar on a balance. What does the balance show?', options: ['It goes down, because the gas is used up', 'It goes up, because CO₂ is heavy', 'It stays the same', 'It goes down by the heat released'], answer: 2, why: 'Nothing gets in or out of a sealed jar. The atoms only regroup into CO₂ and water, so the total mass stays the same.' },
    { q: 'How many O₂ molecules does one CH₄ need to burn completely?', options: ['1', '2', '3', '4'], answer: 1, why: 'CH₄ + 2 O₂ → CO₂ + 2 H₂O. Carbon needs two oxygen atoms and four hydrogens need two more: four oxygen atoms, which is two O₂.' },
    { q: 'A candle burns in the open and gets lighter. Where did the mass go?', options: ['It was destroyed by the flame', 'It turned into heat and light', 'Into invisible CO₂ and water vapour that drifted away', 'Into the wick'], answer: 2, why: 'The wax atoms join oxygen from the air and float away as gases. Those gases weigh more than the wax burned, because they include the oxygen.' },
  ],
  reel: [
    { ms: 5600, caption: 'Burn methane in a sealed jar and every atom just swaps partners. The balance does not move.', set: { fuel: 'methane', g: 1, lam: 1, sys: 'sealed' }, act: (s, inst) => inst.restart(), view: { pos: [JX, 4.3, 6.2], target: [JX, 4.2, 0] }, spin: 0.05 },
    { ms: 5600, caption: 'Open the jar and the fuel seems to vanish. Its gases float away, heavier than the fuel was.', set: { fuel: 'butane', g: 1, lam: 1, sys: 'open' }, act: (s, inst) => inst.restart(), view: { pos: [JX, 4.3, 6.2], target: [JX, 4.2, 0] }, spin: -0.05 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const bench = box(7.8, 0.12, 3.2, M.matte(0x2b3039)); bench.position.set(0.6, -0.06, 0); root.add(bench);
    const scale = makeScale(root, 3.0, 2.4); scale.position.set(JX, 0, 0);
    const jarY = scale.top, R = 0.98, H = 2.35;
    const jar = makeJar(root, R, H); jar.position.set(JX, jarY, 0);
    // fuels: a gas burner, a petrol dish with a wick, a stick of wood
    const gasB = new THREE.Group(); jar.add(gasB);
    const bBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.07, 32), M.metal(0x6a707c)); bBase.position.y = 0.035; gasB.add(bBase);
    const bOut = beam([0, 0.02, 0], [0, 0.42, 0], 0.05, M.metal(0xb9bec8)); gasB.add(bOut);
    const hose = beam([0, 0.06, 0], [0.8, 0.06, 0.3], 0.03, M.matte(0xd05030)); gasB.add(hose);
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.42, 24), M.plastic(0xd33a2c)); tank.position.set(0.72, 0.25, 0.35); gasB.add(tank);
    const dish = new THREE.Group(); jar.add(dish);
    const dishM = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.2, 0.16, 32), M.metal(0x9aa3b2)); dishM.position.y = 0.1; dish.add(dishM);
    const petrol = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.02, 32), M.plastic(0xe0c060, { transparent: true, opacity: 0.8 })); petrol.position.y = 0.16; dish.add(petrol);
    dish.add(beam([0, 0.15, 0], [0, 0.34, 0], 0.025, M.matte(0xeeeeee)));
    const wood = new THREE.Group(); jar.add(wood);
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; wood.add(beam([0.28 * Math.cos(a), 0.05, 0.28 * Math.sin(a)], [0.05 * Math.cos(a), 0.36, 0.05 * Math.sin(a)], 0.055, M.matte(0x7a5230))); }
    const flame = makeFlame(jar, 0.55, 0.13); flame.position.y = 0.38;
    const cloud = makeCloud(jar, 200, 0.95);
    const rnd = rng(7);
    const lJar = stage.label('', [JX - R - 0.1, jarY + H + 0.35, 0], root, 'hot');
    const lBal = stage.label('', [JX + 1.2, 0.1, 1.35], root, 'hot'); lBal.element.style.setProperty('--c', COL.mass);
    const lKey = stage.label(`<span style="color:${COL.C}">●</span> C <span style="color:${COL.H}">●</span> H <span style="color:${COL.O}">●</span> O`, [JX + R + 0.45, jarY + 1.3, 0.3], root);

    // ---------------------------------------------------------------- state
    const st = { t: 0, p: 0, fk: '', lam: 0, lists: null, seeds: [] };
    let S = {};
    function rebuild() {
      const fk = S.fuel, n = SAMPLE[fk];
      const L = moleculeLists(fk, n, S.lam);
      const pr = scatter(L.react.length, R - 0.28, 0.9, H - 0.28, rnd, 0.42), pp = scatter(L.prod.length, R - 0.25, 0.9, H - 0.28, rnd, 0.36);
      L.react.forEach((m, i) => { m.at = pr[i]; m.ph = rnd() * 6.28; });
      L.prod.forEach((m, i) => { m.at = pp[i]; m.ph = rnd() * 6.28; });
      cloud.set(L.react, L.prod);
      st.lists = L; st.fk = fk; st.lam = S.lam;
      gasB.visible = fk === 'methane' || fk === 'butane'; dish.visible = fk === 'octane'; wood.visible = fk === 'wood';
      tank.material.color.setHex(fk === 'methane' ? 0x3a7bd5 : 0xd33a2c);
    }
    const restart = () => { st.t = 0; st.p = 0; };

    // ---------------------------------------------------------------- boards
    const atomsB = board(root, 2.9, 1.8, 620, 384, (g, w, h) => {
      panelBg(g, w, h);
      title(g, 'Count the atoms', 'the molecules in the jar');
      const els = [['C', 'carbon', COL.C], ['H', 'hydrogen', COL.H], ['O', 'oxygen', COL.O]];
      const mx = Math.max(4, ...els.map(([e]) => cloud.count[e]));
      els.forEach(([e, n, c], i) => {
        const y = 64 + i * 46, a = cloud.count[e], b = cloud.after[e];
        g.font = 'bold 19px sans-serif'; g.fillStyle = c === COL.C ? '#9aa3b2' : c; g.fillText(n, 20, y + 24);
        const x0 = 140, W = (w - x0 - 40) / 2;
        g.fillStyle = c; g.globalAlpha = 0.85; g.fillRect(x0, y + 6, (a / mx) * (W - 60), 24); g.fillRect(x0 + W, y + 6, (b / mx) * (W - 60), 24); g.globalAlpha = 1;
        g.fillStyle = '#fff'; g.font = '18px sans-serif'; g.fillText(String(a), x0 + (a / mx) * (W - 60) + 8, y + 25); g.fillText(String(b), x0 + W + (b / mx) * (W - 60) + 8, y + 25);
      });
      g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '16px sans-serif'; g.fillText('before', 140, 60); g.fillText('after', 140 + (w - 180) / 2, 60);
      const r = burn(S.fuel || 'methane', S.g || 1, S.lam || 1), G = r.g, mx2 = G.in * 1.02, W2 = w - 170;
      stack(g, 150, 232, W2, 34, [{ v: G.fuel, color: COL.fuel, label: 'fuel' }, { v: G.O2, color: COL.O2, label: 'O₂' }], mx2, '');
      stack(g, 150, 296, W2, 34, [{ v: G.CO2, color: COL.CO2, label: 'CO₂' }, { v: G.H2O, color: COL.H2O, label: 'H₂O' }, { v: G.CO, color: COL.CO, label: 'CO' }, { v: G.soot, color: COL.soot, label: '' }, { v: G.spare, color: COL.O2, label: 'O₂' }], mx2, '');
      g.font = 'bold 19px sans-serif'; g.fillStyle = COL.text; g.fillText('grams in', 20, 256); g.fillText('grams out', 20, 320);
      g.fillStyle = COL.mass; g.font = 'bold 21px sans-serif'; g.fillText(`${fmtG(G.in)} in = ${fmtG(G.out)} out`, 150, 366);
    }, [2.75, 3.4, 0]);
    const massB = board(root, 2.9, 1.8, 620, 384, (g, w, h) => {
      panelBg(g, w, h);
      const r = burn(S.fuel || 'methane', S.g || 1, S.lam || 1), G = r.g;
      title(g, 'Mass as it burns', `${(S.g || 1).toFixed(1)} g of ${FUELS[S.fuel || 'methane'].short.toLowerCase()}`);
      const top = Math.ceil(G.in * 1.1), bot = -Math.max(0.5, Math.ceil(G.fuel * 1.2 * 2) / 2);
      const yt = []; const step = top > 20 ? 10 : top > 8 ? 4 : top > 4 ? 2 : 1; for (let v = Math.ceil(bot / step) * step; v <= top; v += step) yt.push(v);
      const { X, Y } = axes(g, w, h, { x0: 70, y1: 80, y0: h - 50, xMax: 100, yMin: bot, yMax: top, xTicks: [0, 25, 50, 75, 100], yTicks: yt, xFmt: (v) => v + '%', yFmt: (v) => (v > 0 ? '+' : '') + v + ' g' });
      line(g, [[0, 0], [100, 0]], X, Y, COL.mass, 5);
      line(g, [[0, 0], [100, -G.fuel]], X, Y, '#ff7a59', 4);
      line(g, [[0, 0], [100, G.out - G.spare]], X, Y, COL.CO2, 4, [10, 7]);
      const P = st.p * 100;
      dot(g, X(P), Y(S.sys === 'open' ? -G.fuel * st.p : 0), S.sys === 'open' ? '#ff7a59' : COL.mass, 9);
      legend(g, [['sealed jar', COL.mass], ['open jar', '#ff7a59'], ['gases made', COL.CO2]], 20, 48, 16);
      g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '16px sans-serif'; g.fillText('change on the balance vs fuel burned', w - 330, h - 12);
    }, [2.75, 1.35, 0]);

    return {
      restart,
      update(dt, s, time) {
        dt = Math.max(0, Math.min(dt, 0.1)); S = s;
        fitNarrow(stage, [lKey, lBal]);
        reelPlace([[atomsB, [JX, 7.25, 0], 1.12], [massB, [JX, 4.95, 0], 1.12]]);
        if (s._re || st.fk !== s.fuel || st.lam !== s.lam || !st.lists) { s._re = false; rebuild(); restart(); }
        st.t += dt;
        const T = st.t - T_WAIT;
        st.p = clamp(T / T_BURN, 0, 1);
        if (st.t > T_WAIT + T_BURN + T_HOLD && !inReel()) restart();
        const p = st.p, open = s.sys === 'open';
        jar.lid.visible = !open;
        // flame: burns while fuel and oxygen last; yellow when rich or for liquid and wood fuels
        const yel = clamp(YELLOW[s.fuel] + (1 - s.lam) * 1.6, 0, 1);
        flame.set(p > 0 && p < 1 ? 0.7 + 0.3 * s.g / 2 : 0.0, yel, time);
        cloud.update(p, time, (m, t, side) => {
          const w = 0.06, a = m.at;
          let y = a[1] + w * Math.sin(t * 0.9 + m.ph);
          if (open && side === 1) { const t0 = (m.j / Math.max(1, st.lists.prod.length)) * 0.75; y += Math.max(0, p - t0 - 0.12) * 5.5; }
          return [a[0] + w * Math.cos(t * 0.7 + m.ph), y, a[2] + w * Math.sin(t * 0.8 + m.ph * 2)];
        });
        const r = burn(s.fuel, s.g, s.lam);
        const reading = open ? BASE + s.g * (1 - p) : BASE + s.g;
        scale.set(reading.toFixed(2) + ' g', open && p > 0 ? '#ff9a7a' : '#5ce1a9');
        lJar.element.innerHTML = open ? 'open: gases escape' : 'sealed: nothing in or out';
        lJar.element.style.setProperty('--c', open ? '#ff7a59' : COL.mass);
        lBal.element.innerHTML = open ? `balance <b>−${(s.g * p).toFixed(2)} g</b>` : 'balance <b>±0.00 g</b>';
        const k = `${s.fuel}|${s.g}|${s.lam}|${s.sys}|${Math.round(p * 40)}`;
        if (k !== st.key) { st.key = k; atomsB.redraw(); massB.redraw(); }
        st.r = r;
      },
      readout(s) {
        const r = burn(s.fuel, s.g, s.lam), G = r.g, f = FUELS[s.fuel], L = st.lists;
        const inc = G.CO > 1e-6 || G.soot > 1e-6;
        const z = (v) => v > 1e-6;
        return `<div class="big">${equation(s.fuel)}</div>
          <div class="row"><span>In: fuel + O₂</span><b>${fmtG(G.fuel)} + ${fmtG(G.O2)}</b></div>
          <div class="row"><span>Out: ${['CO₂', 'H₂O', z(G.CO) && 'CO', z(G.soot) && 'soot', z(G.spare) && 'spare O₂'].filter(Boolean).join(' + ')}</span><b>${[G.CO2, G.H2O, z(G.CO) && G.CO, z(G.soot) && G.soot, z(G.spare) && G.spare].filter((v) => v !== false).map(fmtG).join(' + ')}</b></div>
          <div class="row"><span>Grams in = grams out</span><b style="color:${COL.mass}">${fmtG(G.in)} = ${fmtG(G.out)}</b></div>
          <div class="row"><span>Heat (${f.lhv} MJ/kg LHV, ${f.hhv} HHV)</span><b style="color:${COL.heat}">${fmtMJ(r.MJ)}</b></div>
          <div class="row"><span>The balance, ${s.sys}</span><b>${s.sys === 'open' ? '−' + fmtG(s.g * st.p) : 'no change'}</b></div>
          <small>${inc ? `Too little air: ${L ? sampleEquation(s.fuel, L.r) : ''}. CO and soot keep ${fmtMJ(r.MJfull - r.MJ)} of the heat locked up.` : s.sys === 'open' ? 'Open: the balance only loses the fuel. The CO₂ and water that fly off weigh more, because they carry oxygen from the air.' : `Sealed: the atoms only swap partners. Burning it fully needs ${afr(f).toFixed(1)} g of air per gram.`}</small>`;
      },
    };
  },
};
