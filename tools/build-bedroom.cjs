const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const marker = 'bagseed-bedroom-production-code';
function bedroomScript() {
  const art = fs.readFileSync(path.join(root, 'graphics/bedroom/assets/room-shell.png'));
  const code = fs.readFileSync(path.join(root, 'graphics/bedroom/sources/renderer.js'), 'utf8')
    .replace('__BAGSEED_BEDROOM_IMAGE__', () => JSON.stringify('data:image/png;base64,' + art.toString('base64')));
  new (require('node:vm').Script)(code);
  return `<script id="${marker}">\n${code}\n</script>\n${require('./compile-beds.cjs')()}${require('./compile-desks.cjs')()}${require('./compile-curtains.cjs')()}${require('./compile-curtains.cjs')('02')}${require('./compile-curtains.cjs')('03')}${require('./compile-computer-desks.cjs')()}${require('./compile-computer-equipment.cjs')()}${require('./compile-cameras.cjs')()}${require('./compile-chairs.cjs')()}${require('./compile-coffee.cjs')()}${require('./compile-under-desk-storage.cjs')()}${require('./compile-bedroom-window.cjs')()}${require('./compile-tent-placement.cjs')()}${require('./compile-starter-tent.cjs')()}${require('./compile-tent2.cjs')()}${require('./compile-tent4.cjs')()}${require('./compile-tent5.cjs')()}${require('./compile-grow-lights.cjs')()}${require('./compile-fans.cjs')()}${require('./compile-exhaust.cjs')()}${require('./compile-humidifiers.cjs')()}${require('./compile-dehumidifiers.cjs')()}${require('./compile-sensors.cjs')()}${require('./compile-heaters.cjs')()}${require('./compile-equipment-glow.cjs')()}${require('./compile-room-climate.cjs')()}${require('./compile-air-conditioners.cjs')()}${require('./compile-hvac.cjs')()}${require('./compile-tent-details.cjs')()}${require('./compile-water-and-pots.cjs')()}${require('./compile-night-colors.cjs')()}`;
}
module.exports = bedroomScript;
if (require.main === module) {
  const output = path.join(root, 'public/index.html');
  const reportPath = path.join(root, 'graphics/production/build.json');
  const report = JSON.parse(fs.readFileSync(reportPath));
  const current = fs.readFileSync(output);
  assert.equal(sha(current), report.updatedSHA, 'Unexpected output edits; preserve before rebuilding');
  const source = fs.readFileSync(path.join(root, 'src/game.html'), 'utf8');
  const character = current.toString().match(/<script id="bagseed-illustrated-production-code">[\s\S]*?<\/script>/g);
  assert.equal(character?.length, 1, 'Expected exactly one verified character renderer');
  const characterData = current.toString().match(/<script id="bagseed-illustrated-character-data" src="character-data.js"><\/script>/g) || [];
  assert.equal(characterData.length, report.characterDataFile ? 1 : 0, 'Preserve the character data companion before rebuilding');
  assert.ok(source.endsWith('</body></html>\n') || source.endsWith('</body></html>'), 'Missing insertion point');
  const html = require('./compile-main-menu.cjs')(source).replace('</body></html>', `${characterData[0] || ''}${character[0]}\n${bedroomScript()}</body></html>`).replace(/\r\n/g, '\n');
  assert.equal(sha(fs.readFileSync(path.join(root, 'baselines/Bagseed_v1.1.5.1_Night_Walker_Flashlights_Update.html'))), report.baselineSHA);
  fs.writeFileSync(output + '.tmp', html); fs.renameSync(output + '.tmp', output);
  Object.assign(report, { workingSourceSHA: sha(source), updatedSHA: sha(html), bytes: Buffer.byteLength(html), nightColorsRevision: 'night-temperature-colors-1', bedroomRevision: 'bedroom-shell-1', bedRevision: 'beds-batch-04', bedCombinations: 80, deskRevision: 'seedling-desks-1', deskVariations: 3, menuRevision: JSON.parse(fs.readFileSync(path.join(root, 'graphics/main-menu/sources/manifest.json'))).revision });
  Object.assign(report, { curtainRevision: 'curtains-batch-03', curtainSets: 6 });
  Object.assign(report, { computerDeskRevision: 'computer-desks-1', computerDeskDesigns: 4 });
  Object.assign(report, { computerEquipmentRevision: 'computer-equipment-1', computerTiers: 3, keyboardOptions: 4, deskMatOptions: 3, monitorWallpapers: 5 });
  Object.assign(report, { cameraRevision: 'cameras-1', cameraTiers: 3, decorativeCameras: 1 });
  Object.assign(report, { chairRevision: 'chairs-2', deskChairDesigns: 4, officeChairFinishes: 2 });
  Object.assign(report, { coffeeRevision: 'coffee-1', coffeeSteamPeriod: 4 });
  Object.assign(report, { underDeskStorageRevision: 'under-desk-storage-1', storageTiers: 3, supplyBoxes: 1 });
  Object.assign(report, { loadingRevision: 'loading-bedroom-3' });
  Object.assign(report, { loadingMobileFraming: 'fixed-window' });
  Object.assign(report, { bedroomWindowRevision: 'bedroom-window-1', outdoorArtSharedWithLoading: true });
  Object.assign(report, { starterTentRevision: 'starter-tent-2', growLightsRevision: 'grow-lights-2', tentPlacementRevision: 'tent-flap-1', exhaustRevision: 'exhaust-1', exhaustTiers: 3, roomClimatePlacementRevision: 'window-station-1', waterPotsRevision: 'water-and-pots-1', waterPotsDesigns: 9, tentDetailsRevision: 'tent-details-1', hvacRevision: 'hvac-1', hvacTiers: 2, airConditionersRevision: 'air-conditioners-1', airConditionerTiers: 2, heatersRevision: 'heaters-1', heaterTiers: 2, equipmentGlowRevision: 'equipment-glow-1', sensorsRevision: 'sensors-1', sensorDesigns: 4, dehumidifiersRevision: 'dehumidifiers-1', dehumidifierTiers: 2, exteriorTentSensors: true, dualFanLayout: 'opposite-sides', humidifiersRevision: 'humidifiers-1', humidifierTiers: 3, growLightTiers: 4, fansRevision: 'fans-1', fanTiers: 3, tent5Revision: 'tent5-1', tent5Shells: ['standard','pro','premium'], tent4Revision: 'tent4-1', tent4Shells: ['standard','pro','premium'], tent2Revision: 'tent2-1', tent2Shells: ['standard','pro','premium'], starterTentShells: ['budget','standard'] });
  fs.writeFileSync(reportPath + '.tmp', JSON.stringify(report, null, 2) + '\n'); fs.renameSync(reportPath + '.tmp', reportPath);
  console.log('Rebuilt approved main menu, bedroom, beds, desks and curtains; verified character payload retained unchanged.');
}
