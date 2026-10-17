# Subtle nighttime equipment lighting

The shared helper paints small soft halos around powered indicators, controls and digital screens. It fades in after dusk and out at dawn; daytime sprites and store/delivery icons retain their previous appearance. The two heaters, humidifiers, dehumidifiers, digital sensors, exterior brain controllers, electronic exhaust indicators and computer status lights use it. Passive paper notes and analog dials do not emit light; grow-light emitters retain their existing separate lighting renderer.

Glows are painted locally in the device's ordinary draw pass, before tent fabric, foreground plants, furniture, players/NPCs and room tint. There is no late repaint of equipment or fabric, so glows cannot shine through occluders. The helper does not change power, targets, placement, simulation state or RNG. `withWorld` confines it to real world rendering; store canvases remain independent of the current time of day. Reduced motion does not animate these static halos.

The heater review helper verifies all updated glow families, daylight identity, gradual dusk, live heater state and unchanged catalog/anchors. Diagnostic marks and the optional disabled flag belong to the renderer only, not save data.
