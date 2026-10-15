/* Desk frames only; computers, cameras, coffee and chairs retain their own renderers. */
(() => {
  'use strict';
  const DATA = __BAGSEED_COMPUTER_DESKS_DATA__, atlas = new Image();
  const originalDesk = RoomArt.drawDesk, originalSide = DECOR.sidedesk.d, originalIcon = drawDecorIcon;
  let loaded = false;
  function frame(c, index, x, y, w, h) {
    c.save(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(atlas, ...DATA.desks[index].rect, x, y, w, h); c.restore();
  }
  RoomArt.drawDesk = function(c, t) {
    if (!loaded) return originalDesk.call(this, c, t);
    const tier = state.gear.computer;
    groundShadow(c, 189, 100, 64);
    frame(c, 0, 158, 72, 62, 28);
    Gear.computer(c, 162, 73, tier, t, true);
    if (state.coffeeDay !== state.day) {
      R(c, 208, 69, 5, 5, '#f1ece0'); R(c, 213, 70, 2, 3, '#f1ece0'); R(c, 209, 70, 3, 1, '#6b3e1f');
      if (!settings.reduced) R(c, 210 + Math.round(Math.sin(t * 2)), 64 + Math.floor(t * 4 % 4), 1, 2, 'rgba(255,255,255,.5)');
      this.hit('coffee', 206, 64, 10, 11, 'Coffee mug', null, 'item');
    }
    if (state.gear.camera === 1) Gear.camera(c, 199, 73, 1);
    this.hit('computer', 160, 56, 50, 20, EQ.computer[tier].name, null, 'furniture');
  };
  DECOR.sidedesk.d = function(c, x, y, flip, t, V) {
    if (!loaded) return originalSide.call(this, c, x, y, flip, t, V);
    const variant = Math.max(0, DECOR.sidedesk.vars.findIndex(v => v === V || v.n === V?.n));
    groundShadow(c, x + 15, y + 16, 30);
    frame(c, variant + 1, x, y - 1.5, 30, 17.5);
  };
  drawDecorIcon = function(ctx, cv, id, variant = 0) {
    if (id !== 'sidedesk' || !loaded) return originalIcon.call(this, ctx, cv, id);
    cv.width = 320; cv.height = 200;
    ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle = '#1a2420'; ctx.fillRect(0,0,320,200);
    ctx.scale(8,8); DECOR.sidedesk.d(ctx,5,5,false,0,DECOR.sidedesk.vars[variant]); ctx.restore();
  };
  const ready = new Promise((resolve,reject) => {
    atlas.onload = () => { loaded = true; if (screen === 'game') { hydrate(document); View.snap(); } resolve({desks:DATA.desks.map(d=>d.name)}); };
    atlas.onerror = () => reject(new Error('Computer desk artwork failed to load'));
    atlas.src = DATA.image;
  });
  window.BagseedComputerDesks = Object.freeze({revision:DATA.revision, ready, get loaded(){return loaded;}});
  ready.catch(error=>console.error(error));
})();
