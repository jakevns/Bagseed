/* Approved batch 01 only: starter/wooden × the existing ten bedding IDs. */
(() => {
  'use strict';
  const DATA = __BAGSEED_BED_DATA__, images = new Map(), sprites = new Map();
  let loaded = false;
  const originalBed = RoomArt.drawBed, originalIcon = drawStyleIcon;
  const supported = (frame, bedding) => loaded && !!DATA.frames[frame]?.tiles[bedding];
  function sprite(frame, bedding) {
    const key = `${frame}|${bedding}`;
    if (sprites.has(key)) return sprites.get(key);
    const tile = DATA.frames[frame].tiles[bedding];
    const canvas = document.createElement('canvas'); canvas.width = 252; canvas.height = 240;
    const g = canvas.getContext('2d'); g.scale(3, 3);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    const height = 78 * tile[3] / tile[2];
    g.drawImage(images.get(frame), ...tile, 2, 77 - height, 78, height);
    sprites.set(key, canvas); return canvas;
  }
  RoomArt.drawBed = function(c) {
    const { bed, bedding } = state.room;
    if (!supported(bed, bedding)) return originalBed.call(this, c);
    groundShadow(c, 42, 177, 76);
    c.drawImage(sprite(bed, bedding), 0, 100, 84, 80);
    this.hit('bed', 8, 126, 72, 50, 'Bed (sleep)', [86, 160], 'furniture');
  };
  drawStyleIcon = function(ctx, canvas, slot, id) {
    const frame = slot === 'bed' ? id : state.room.bed;
    const bedding = slot === 'bedding' ? id : state.room.bedding;
    if (!['bed', 'bedding'].includes(slot) || !supported(frame, bedding)) return originalIcon(ctx, canvas, slot, id);
    const saved = state.room[slot], hits = RoomArt.hits;
    const tmp = document.createElement('canvas'); tmp.width = 252; tmp.height = 240;
    const g = tmp.getContext('2d'); g.scale(3, 3); g.translate(0, -100);
    try {
      state.room[slot] = id; RoomArt.hits = [];
      drawBackground(g); RoomArt.drawBed(g);
    } finally { state.room[slot] = saved; RoomArt.hits = hits; }
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height); ctx.restore();
  };
  const ready = Promise.all(Object.entries(DATA.frames).map(([id, frame]) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => { images.set(id, image); resolve(); };
    image.onerror = () => reject(new Error(`Bed artwork failed: ${id}`));
    image.src = frame.image;
  }))).then(async () => {
    loaded = true;
    if (window.BagseedArt) await BagseedArt.ready;
    if (screen === 'game') { hydrate(document); View.snap(); }
    return { frames: Object.keys(DATA.frames), combinations: 20 };
  });
  window.BagseedBeds = Object.freeze({ revision: DATA.revision, ready,
    frames: Object.keys(DATA.frames), get loaded() { return loaded; } });
  ready.catch(error => console.error(error));
})();
