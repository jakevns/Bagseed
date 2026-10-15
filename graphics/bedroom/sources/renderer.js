/* Approved bedroom shell. Logical coordinates and furniture remain native. */
(() => {
  'use strict';
  const image = new Image();
  let loaded = false, cache = null, cacheKey = null;
  const previousBackground = drawBackground;
  drawBackground = function(c) {
    if (!loaded) return previousBackground(c);
    const { wall, floor } = state.room;
    const key = `${wall}|${floor}|${ROOM.W}|${ROOM.H}|${ROOM.floorY}`;
    if (key !== cacheKey) {
      cache = document.createElement('canvas');
      cache.width = ROOM.W * 3; cache.height = ROOM.H * 3;
      const g = cache.getContext('2d'); g.scale(3, 3);
      // Retain all purchased finishes; only the baseline sage/oak is replaced.
      paintWall(g, wall); paintFloor(g, floor);
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      const split = 500, F = ROOM.floorY;
      if (floor === 'wood') g.drawImage(image, 0, split, image.width, image.height - split, 0, F, ROOM.W, ROOM.H - F);
      if (wall === 'sage') g.drawImage(image, 0, 0, image.width, split, 0, 0, ROOM.W, F);
      cacheKey = key;
    }
    c.drawImage(cache, 0, 0, ROOM.W, ROOM.H);
  };

  // Frame the existing live window without obscuring its weather, neighbors,
  // cat, AC or any curtain choice. Keep the original method and hit targets.
  const windowArt = RoomArt.drawWindow;
  RoomArt.drawWindow = function(c, t) {
    c.save();
    c.fillStyle = 'rgba(47,46,35,.20)'; c.fillRect(221, 10, 63, 52);
    const trim = c.createLinearGradient(220, 0, 282, 0);
    trim.addColorStop(0, '#d6c6a4'); trim.addColorStop(.08, '#f1e6cc'); trim.addColorStop(.92, '#eee2c5'); trim.addColorStop(1, '#baa88a');
    c.fillStyle = trim; c.fillRect(221, 10, 62, 50);
    // The original window paints the opening over the trim.
    c.restore();
    return windowArt.call(this, c, t);
  };

  // The house expansion moves the door; derive its position from its spawn.
  const doorArt = RoomArt.drawDoor;
  RoomArt.drawDoor = function(c, t) {
    const x = SCENES.bedroom.spawns.door[0] - 16;
    c.save();
    c.fillStyle = 'rgba(45,36,25,.22)'; c.fillRect(x - 3, 21, 34, 77);
    c.fillStyle = '#d5c3a2'; c.fillRect(x - 3, 20, 33, 78);
    c.fillStyle = '#efe3c8'; c.fillRect(x - 3, 20, 33, 2); c.fillRect(x - 3, 22, 2, 76);
    c.restore();
    return doorArt.call(this, c, t);
  };

  function drawLight(c, hour) {
    const curtains = state.room.curtains;
    if (curtains === 'blackout' || ['Rain', 'Fog'].includes(state.weather)) return;
    const day = hour > 7 && hour < 18, night = hour >= 20.5 || hour < 5.5;
    if (!day && !night) return;
    const strength = day ? Math.sin((hour - 7) / 11 * Math.PI) : .16;
    const weather = ['Cloudy', 'Muggy'].includes(state.weather) ? .25 : 1;
    const cloth = curtains === 'blinds' ? .45 : curtains === 'sheer' ? .7 : 1;
    const shift = day ? (hour - 12) * 4 : -12;
    const F = ROOM.floorY, top = 225 - shift, spread = 27;
    c.save(); c.beginPath(); c.rect(0, F, ROOM.W, ROOM.H - F); c.clip();
    const glow = c.createLinearGradient(0, F, 0, ROOM.H);
    const alpha = strength * weather * cloth;
    glow.addColorStop(0, `rgba(${day ? '255,222,155' : '150,190,255'},${alpha * .25})`);
    glow.addColorStop(1, `rgba(${day ? '255,231,183' : '150,190,255'},${alpha * .08})`);
    c.fillStyle = glow;
    // Four separated panes leave visible mullion shadows. No baked light in art.
    for (let row = 0; row < 2; row++) for (let col = 0; col < 2; col++) {
      const y0 = F + 3 + row * 29, y1 = y0 + 26;
      const x0 = top + col * 24 + row * spread;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + 22, y0);
      c.lineTo(x0 + 22 + spread, y1); c.lineTo(x0 + spread, y1); c.closePath(); c.fill();
    }
    c.restore();
  }
  const ready = new Promise((resolve, reject) => {
    image.onload = () => { loaded = true; BG.key = null; resolve(); };
    image.onerror = () => reject(new Error('Bedroom shell image failed to load'));
    image.src = __BAGSEED_BEDROOM_IMAGE__;
  });
  window.BagseedBedroom = Object.freeze({ version: 'bedroom-shell-1', ready, drawLight, get loaded() { return loaded; } });
  ready.catch(error => console.error(error));
})();
