/* Approved workstation frames shared by room, shop, museum and delivery cards. */
(() => {
  'use strict';
  const DATA = __BAGSEED_DESK_DATA__, image = new Image(), suppliesImage = new Image();
  const originalBench = Gear.bench, originalSupplies = Gear.benchSupplies, originalIcon = drawGearIcon;
  let loaded = false;
  const supported = tier => loaded && !!DATA.tiers[tier];
  Gear.bench = function(c, x, y, tier) {
    if (!supported(tier)) return originalBench.call(this, c, x, y, tier);
    const { rect, anchorY } = DATA.tiers[tier], scale = 68 / rect[2];
    groundShadow(c, x + 34, y + 21, 70);
    c.save(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(image, ...rect, x, y + (rect[1] - anchorY) * scale, 68, rect[3] * scale);
    c.restore();
  };
  function supplyLayout(x, y) {
    const ids = ['seeds', 'trowel', 'bottle'];
    if (state.inv.synth > 0) ids.push('synth');
    if (state.inv.organic > 0) ids.push('organic');
    if (Feed.all().some(b => b.uses > 0 || b.brewing)) ids.push('jug');
    if (state.inv.phpen) ids.push('pen');
    const gap = 2, sprites = DATA.supplies.sprites;
    const width = ids.reduce((sum, id) => sum + sprites[id].width, 0) + gap * (ids.length - 1);
    let left = x + (68 - width) / 2;
    return ids.map(id => {
      const { rect, width: w } = sprites[id], h = w * rect[3] / rect[2];
      const item = { rect, x: left, y: y + BENCH_TABLETOP.y - 80 - h, w, h };
      left += w + gap;
      return item;
    });
  }
  Gear.benchSupplies = function(c, x, y) {
    if (!loaded) return originalSupplies.call(this, c, x, y);
    c.save(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    for (const item of supplyLayout(x, y)) c.drawImage(suppliesImage, ...item.rect, item.x, item.y, item.w, item.h);
    c.restore();
  };
  function alignPlacedDecor(st) {
    const placed = st.room?.placed || [];
    for (const d of placed) {
      const def = decorDef(d.id);
      if (def?.k !== 'desk' || (d.on && !['bench', 'benchTop'].includes(d.on)) || d.x < 224 || d.x + def.w > 292) continue;
      const base = d.y + def.h;
      let surface;
      if (st.gear.workbench === 2 && Math.abs(base - 56) < .01) surface = BENCH_PEGBOARD_TOP;
      else if (st.gear.workbench !== 2 && d.on === 'benchTop' && Math.abs(base - 52) < .01) surface = { y: 56, x0: 222, x1: 282, name: 'sill' };
      else if (Math.abs(base - 80) < .01) surface = BENCH_TABLETOP;
      if (!surface) continue;
      d.y = surface.y - def.h;
      d.x = clamp(d.x, surface.x0, surface.x1 - def.w);
      if (surface.name === 'sill') delete d.on;
      else d.on = surface.name;
    }
  }
  INIT115.push(alignPlacedDecor);
  const originalInstall = Gear115.install;
  Gear115.install = function(iid, loc, ...args) {
    const result = originalInstall.call(this, iid, loc, ...args);
    if (result && this.get(iid)?.slot === 'workbench') alignPlacedDecor(state);
    return result;
  };
  drawGearIcon = function(ctx, canvas, slot, tier, museum) {
    if (slot !== 'workbench' || !supported(tier)) return originalIcon(ctx, canvas, slot, tier, museum);
    // Use one common frame for all three tiers so the pegboard fits and
    // previews retain their proportions in both store and package cards.
    if (canvas.width !== 240 || canvas.height !== 180) {
      canvas.width = 240; canvas.height = 180;
    }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = museum ? '#2a2016' : '#1a2420';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(3, 3); Gear.bench(ctx, 6, 34, tier); ctx.restore();
  };
  const ready = Promise.all([[image, DATA.image], [suppliesImage, DATA.supplies.image]].map(([img, src]) => new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error('Seedling desk artwork failed to load'));
    img.src = src;
  }))).then(async () => {
    loaded = true;
    await Promise.all([window.BagseedArt?.ready, window.BagseedBedroom?.ready, window.BagseedBeds?.ready]);
    if (screen === 'game') { hydrate(document); View.snap(); }
    return { tiers: DATA.tiers.map(t => t.name) };
  });
  window.BagseedDesks = Object.freeze({ revision: DATA.revision, ready, get loaded() { return loaded; } });
  ready.catch(error => console.error(error));
})();
