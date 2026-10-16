// Software-canvas artwork checks need a stable scene. Pause only the unrelated
// loading animation through its public API; asset decoding, startup readiness,
// input guards and the artwork under test still run normally. Loading-screen
// tests use their own pages and continue exercising the animation itself.
module.exports = async function artPage(browser, options) {
  const page = await browser.newPage(options);
  await page.addInitScript(() => {
    const watch = new MutationObserver(() => {
      if (window.BagseedLoadingScene) {
        BagseedLoadingScene.pause();
        watch.disconnect();
      }
    });
    watch.observe(document, { childList: true, subtree: true });
  });
  return page;
};
