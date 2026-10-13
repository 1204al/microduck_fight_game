// CPU duck. Its "training level" sets reaction time and how often it blocks, dashes,
// grabs items, and remembers that falling off the desk is bad.
window.MD = window.MD || {};
MD.AI = (function () {
  const LEVELS = [
    { react: 0.55, aggro: 0.4, block: 0.08, dash: 0.12, item: 0.3, edge: 0.35, peck: 0.7 },
    { react: 0.3, aggro: 0.65, block: 0.3, dash: 0.3, item: 0.6, edge: 0.8, peck: 0.6 },
    { react: 0.15, aggro: 0.85, block: 0.55, dash: 0.45, item: 0.85, edge: 1.0, peck: 0.5 },
  ];
  const ATTACKS = ['peck', 'headbutt', 'dash', 'throw'];

  function think(f, o, G, dt) {
    const L = LEVELS[f.level != null ? f.level : G.level] || LEVELS[1];
    const ai = f.ai || (f.ai = { t: 0, mx: 0, mz: 0, strafe: Math.random() < 0.5 ? 1 : -1 });
    const inp = f.input;
    ai.t -= dt;
    if (!G.canAct(f)) { inp.mx = inp.mz = 0; inp.block = false; return; }
    if (ai.t > 0) { inp.mx = ai.mx; inp.mz = ai.mz; return; }
    ai.t = L.react * (0.6 + Math.random() * 0.8);

    const dx = o.x - f.x, dz = o.z - f.z, d = Math.hypot(dx, dz) || 0.001;
    const hw = MD.Arena.hw, hd = MD.Arena.hd;
    let tx = o.x, tz = o.z, press = null;
    inp.block = false;

    const nearEdge = MD.Arena.edgeDist(f.x, f.z) < 1.3;
    const oppThreat = ATTACKS.includes(o.state) && d < 2.4;
    const laser = MD.Items.laser;

    if (laser.active && Math.random() < 0.85) { tx = laser.x; tz = laser.z; }
    else if (nearEdge && Math.random() < L.edge) { tx = f.x * 0.3; tz = f.z * 0.3; }
    else if (oppThreat && Math.random() < L.block) { inp.block = true; ai.t = 0.35; tx = f.x; tz = f.z; }
    else if (oppThreat && Math.random() < L.block * 0.3) { press = 'hop'; }
    else if (f.holding && d > 1.5 && d < 7) { press = 'peck'; }
    else {
      // Useful item nearby?
      let best = null, bd = 99;
      if (Math.random() < L.item) {
        for (const it of MD.Items.list) {
          if (!it.landed) continue;
          if ((it.type === 'sock' || it.type === 'snowball') && f.holding) continue;
          if (it.type === 'battery' && f.battery > 70) continue;
          const id = Math.hypot(it.x - f.x, it.z - f.z);
          if (id < bd && id < 5.5) { bd = id; best = it; }
        }
      }
      if (best && (d > 2.4 || bd < 1.2)) { tx = best.x; tz = best.z; }
      else if (o.state === 'down' || o.state === 'sleep') {
        if (Math.random() < 0.08) press = 'flip';
        else { tx = o.x - (dx / d) * 1.6; tz = o.z - (dz / d) * 1.6; }
      } else if (d > 4 && f.cd.dash <= 0 && Math.random() < L.dash) {
        press = 'dash';
      } else if (d > 1.95) {
        // Approach from the side that pushes them toward the nearest edge.
        const ol = Math.hypot(o.x, o.z) || 1;
        tx = o.x - (o.x / ol) * 0.9; tz = o.z - (o.z / ol) * 0.9;
        if (Math.random() < 0.2) { tx += -dz / d * ai.strafe; tz += dx / d * ai.strafe; }
      } else if (Math.random() < L.aggro) {
        const r = Math.random();
        if (o.state === 'block') press = r < 0.6 ? 'hb' : 'hop';
        else press = r < L.peck ? 'peck' : r < 0.92 ? 'hb' : r < 0.98 ? 'hop' : 'flip';
        tx = o.x; tz = o.z;
      } else {
        tx = f.x - dx / d; tz = f.z - dz / d; ai.strafe *= -1;
      }
    }
    if (press) inp.press[press] = true;
    const mx = tx - f.x, mz = tz - f.z, ml = Math.hypot(mx, mz);
    ai.mx = ml > 0.25 && !inp.block ? mx / ml : 0;
    ai.mz = ml > 0.25 && !inp.block ? mz / ml : 0;
    if (press === 'dash' || press === 'peck' || press === 'hb') { ai.mx = dx / d; ai.mz = dz / d; }
    inp.mx = ai.mx; inp.mz = ai.mz;
  }
  return { think, LEVELS };
})();
