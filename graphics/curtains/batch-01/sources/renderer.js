/* Two approved curtain sets. Room, store and animation use the same painted cloth. */
(() => {
  'use strict';
  const DATA = __BAGSEED_CURTAIN_DATA__, image = new Image(), sprites = new Map();
  const previous = window.BagseedCurtains, original = RoomArt.drawCurtains, originalIcon = drawStyleIcon;
  let loaded = false;
  const supports = id => loaded && !!DATA.styles[id];
  function draw(c, x, y, w, h, id, t, weather, reduced) {
    const sprite = sprites.get(id), dw = w + 20, dh = dw * sprite.height / sprite.width, dx = x - 10, dy = y - 8;
    c.save(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    if (reduced) c.drawImage(sprite, dx, dy, dw, dh);
    else {
      // Mounting hardware stays fixed. The hem responds more than the tieback.
      const top = 6, split = sprite.width / 2, sy = sprite.height / dh;
      c.drawImage(sprite, 0, 0, sprite.width, top * sy, dx, dy, dw, top);
      const windy = weather === 'Windy', speed = windy ? 1.8 : .72;
      const amp = (windy ? 1.25 : .35) * (id === 'blackout' ? .62 : 1);
      for (let row = top; row < dh; row++) {
        const height = Math.min(1, dh - row), q = (row - top) / (dh - top);
        const anchored = q < .58 ? q * .18 : .1044 + Math.pow((q - .58) / .42, 1.5) * .8956;
        for (let side = 0; side < 2; side++) {
          const off = Math.sin(t * speed + side * .65 + q * .9) * amp * anchored;
          c.drawImage(sprite, side * split, row * sy, split, height * sy,
            dx + side * dw / 2 + off, dy + row, dw / 2, height);
        }
      }
    }
    c.restore();
  }
  RoomArt.drawCurtains = function(c, x, y, w, h, t) {
    const id = state.room.curtains;
    if (!supports(id)) return original.call(this, c, x, y, w, h, t);
    draw(c, x, y, w, h, id, t, state.weather, settings.reduced);
  };
  drawStyleIcon = function(ctx, canvas, slot, id) {
    if (slot !== 'curtains' || !supports(id)) return originalIcon(ctx, canvas, slot, id);
    canvas.width = 320; canvas.height = 272;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#a4ac87'; ctx.fillRect(0,0,320,272); ctx.scale(4,4);
    const x = 14, y = 10, w = 52, h = 42;
    ctx.fillStyle = '#e9ddc0'; ctx.fillRect(x-2,y-2,w+4,h+5);
    ctx.fillStyle = '#a6cee0'; ctx.fillRect(x,y,w,h);
    ctx.fillStyle = '#ebdfc3'; ctx.fillRect(x+w/2-1,y,2,h); ctx.fillRect(x,y+h/2,w,1);
    draw(ctx,x,y,w,h,id,0,'Sunny',true); ctx.restore();
  };
  const ready = new Promise((resolve, reject) => {
    image.onload = () => {
      for (const [id, { rect }] of Object.entries(DATA.styles)) {
        const cv = document.createElement('canvas'); cv.width = 288; cv.height = Math.round(288 * rect[3] / rect[2]);
        const g = cv.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
        g.drawImage(image,...rect,0,0,cv.width,cv.height); sprites.set(id,cv);
      }
      loaded = true; resolve();
    };
    image.onerror = () => reject(new Error('Curtain artwork failed to load'));
    image.src = DATA.image;
  }).then(async () => {
    await Promise.all([previous?.ready,window.BagseedArt?.ready,window.BagseedBedroom?.ready,window.BagseedBeds?.ready,window.BagseedDesks?.ready]);
    if (screen === 'game') { hydrate(document); View.snap(); }
  });
  window.BagseedCurtains = Object.freeze({ revision: DATA.revision, styles: [...(previous?.styles || []),...Object.keys(DATA.styles)],
    ready, get loaded() { return loaded; } });
  ready.catch(error => console.error(error));
})();
