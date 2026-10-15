/* The menu is available before the larger gameplay art modules finish loading. */
(() => {
  'use strict';
  const image = document.getElementById('menuArtwork'), canvas = document.getElementById('menuScene');
  const details = document.getElementById('menuDetails');
  const DATA = __BAGSEED_MENU_MANIFEST__;
  let loaded = false;
  function imageReady(element) {
    return new Promise((resolve, reject) => {
      if (element.complete && element.naturalWidth) resolve();
      else {
        element.addEventListener('load', resolve, { once: true });
        element.addEventListener('error', () => reject(new Error('Main menu artwork failed to load: ' + element.id)), { once: true });
      }
    });
  }
  const ready = Promise.all([imageReady(image), imageReady(details)]).then(() => {
    const [x,y,w,h] = DATA.phoneCrop;
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(image,x,y,w,h,0,0,w,h);
    for (const detail of document.querySelectorAll('[data-menu-detail]')) {
      const [sx,sy,sw,sh] = DATA.details.tiles[detail.dataset.menuDetail];
      detail.width = sw; detail.height = sh;
      detail.getContext('2d').drawImage(details,sx,sy,sw,sh,0,0,sw,sh);
    }
    loaded = true; return { revision: DATA.revision };
  });
  window.BagseedMenu = Object.freeze({ revision: DATA.revision, ready, get loaded() { return loaded; } });
  ready.catch(error => console.error(error));
})();
