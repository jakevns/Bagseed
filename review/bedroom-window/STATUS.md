# Live bedroom window — approved for publication

User request: reuse the new outdoor art in the actual game, preserve neighbors appearing in the window, and add sensible layers. This batch updates the bedroom's live outdoor view. The existing room/furniture art is retained.

The approved daylight, sunset, twilight, and night garden views now follow the game clock. Clouds cross the sky behind the scenery. Doug and street passers-by follow their native appearance rules and are occluded by the near fence/shrubs/garden. Original window controls, weather, all curtain choices, mullions, cat and tomato gift remain connected.

Previews are captured from public/index.html:
- window-day.png, window-sunset.png, window-twilight.png, window-night.png: live window details.
- room-day.png, room-sunset.png, room-twilight.png, room-night.png: actual bedroom views.
- phone-sunset.png: phone camera centered on the window.
- live-window.gif: animated live window at sunset, with passing-neighbor and cat fixtures for visual review. These fixtures do not change production schedules.

Validation and preservation evidence: report.json, loading-regression.json, integration-modules.json. Native bedroom and curtain batch 03 tests passed, including store/package and save choices. The loading startup/error/reload test also passed after extracting the shared scenery painter. Final deterministic day/sunset/night loading frames were checked pixel-for-pixel against the approved release; they are identical.

The user approved publication on 2026-10-16. Origin/main was fetched and had no newer changes. The checked public/index.html matches the approved preview; this batch is being published alone from artwork/bedroom-window.
