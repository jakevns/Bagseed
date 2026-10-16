# Mobile loading camera — awaiting approval

User request: keep the loading screen focused on the window on mobile and remove the camera sweep while time changes.

The mobile canvas now stays centered on the painted window. Its focal point is derived from the existing window coordinates; CSS keeps that point centered in portrait and short landscape layouts. The day/sunset/twilight/night cycle and clouds still animate, and the reduced-motion view uses the same framing. Normal desktop layouts retain their full-room panorama. The live gameplay window is unchanged.

Previews: phone-day.png, phone-sunset.png, phone-night.png, and fixed-window.gif. Captured from the early loading shell of public/index.html while the rest of the game download was deliberately held.

Validation: npm run check passed. The loading integration test passed, checking centered and unchanged camera bounds at 0/3/6/9/12 seconds on 390×844, 375×667, 320×568, and 844×390 layouts. It also checked animated lighting/clouds, seamless cycle, reduced motion, readiness/input gating, error/reload recovery, and saved-game Continue. See report.json.

Saved locally. Do not push until the user approves this framing change.
