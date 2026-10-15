/* Approved workstation frames shared by room, shop, museum and delivery cards. */
(() => {
  'use strict';
  const DATA = __BAGSEED_DESK_DATA__, image = new Image();
  const originalBench = Gear.bench, originalIcon = drawGearIcon;
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
  const ready = new Promise((resolve, reject) => {
    image.onload = () => { loaded = true; resolve(); };
    image.onerror = () => reject(new Error('Seedling desk artwork failed to load'));
    image.src = DATA.image;
  }).then(async () => {
    await Promise.all([window.BagseedArt?.ready, window.BagseedBedroom?.ready, window.BagseedBeds?.ready]);
    if (screen === 'game') { hydrate(document); View.snap(); }
    return { tiers: DATA.tiers.map(t => t.name) };
  });
  window.BagseedDesks = Object.freeze({ revision: DATA.revision, ready, get loaded() { return loaded; } });
  ready.catch(error => console.error(error));
})();
