/* The menu is available before the larger gameplay art modules finish loading. */
(() => {
  'use strict';
  const image = document.getElementById('menuArtwork'), canvas = document.getElementById('menuScene');
  const DATA = __BAGSEED_MENU_MANIFEST__;
  let loaded = false;
  const ready = new Promise((resolve, reject) => {
    function finish() {
      const [x,y,w,h] = DATA.phoneCrop;
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(image,x,y,w,h,0,0,w,h);
      loaded = true; resolve({ revision: DATA.revision });
    }
    if (image.complete && image.naturalWidth) finish();
    else {
      image.addEventListener('load', finish, { once: true });
      image.addEventListener('error', () => reject(new Error('Main menu artwork failed to load')), { once: true });
    }
  });
  window.BagseedMenu = Object.freeze({ revision: DATA.revision, ready, get loaded() { return loaded; } });
  ready.catch(error => console.error(error));
})();
