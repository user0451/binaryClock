# Binary Clock

An animated, CSS-forward binary clock with learning overlays, a rolling digital readout, theme switching, and responsive controls.

## Current State
- Live clock updates every 250ms.
- Two display modes: 6-bit and 4-bit.
- Two time formats: 24-hour and 12-hour.
- Optional learning overlays and optional digital panel.
- Theme picker with 12 built-in themes.
- Responsive behavior for desktop and mobile.
- State persistence in localStorage.

## Run
No build step is required.

1. Open [index.html](index.html) in a browser.
2. The app bootstraps through [code.js](code.js), which initializes [scripts/main.js](scripts/main.js).

## Controls
- `6-bit / 4-bit`: switches binary representation mode with staged transition choreography.
- `24 / 12`: switches time format.
- `Help`: toggles inline binary help values.
- `Digital`: toggles the digital companion panel.
- `Theme`: applies visual style presets.

## Display Behavior

### 6-bit Mode
- Hours, minutes, and seconds are each shown as six binary rows; most significant bit at the top.
- Help values map to row weights: 32, 16, 8, 4, 2, 1.

### 4-bit Mode
- I see this as a more pedagogical mode, designed to teach binary concepts by breaking down each time unit into its decimal place values.
- Each unit is split into tens and units columns.
- Tens and units both show weighted help contributions in help mode.
- Help values for hours tens now use weighted values (1, 2, 4, 8), matching units.

### Digital Panel
- Rolling two-slot H/M/S values with per-slot animation.
- In 24-hour mode, hours are zero-padded.
- In 12-hour mode, hours do not show a leading zero.
- AM/PM badge is visible only in 12-hour mode.

## Themes
Current built-in themes:

1. Classic RGB Neon
2. Amber Terminal
3. Ice Glass
4. Matrix Pulse
5. Sunset Bloom
6. Cyberpunk Grid
7. Metallic Core
8. Monochrome Noir
9. Electric Storm
10. Gloomy Mist
11. Sunny Pop
12. Christmas Glow

All themes include custom `bit.on` motion tuned to a subtle profile.

## Responsive Behavior
- Desktop: settings are shown as a bottom control bar.
- Small screens: a settings trigger opens a panel overlay.
- While settings are open, background scrolling is locked.
- The clock panel is centered and bounded on small screens with left/right margins.

## Persistence
Saved keys in localStorage:

- `binaryClockMode`
- `binaryClockFormat`
- `binaryClockHelp`
- `binaryClockDigital`
- `binaryClockTheme`

## Project Structure
- [index.html](index.html): markup and controls.
- [style.css](style.css): stylesheet imports.
- [styles/base.css](styles/base.css): tokens and foundational layout.
- [styles/clock.css](styles/clock.css): clock and digital panel styling.
- [styles/modes.css](styles/modes.css): 4-bit/6-bit structural mode rules.
- [styles/motion.css](styles/motion.css): transition and keyframe choreography.
- [styles/themes.css](styles/themes.css): theme variables and theme-specific motion.
- [styles/controls.css](styles/controls.css): settings UI.
- [styles/responsive.css](styles/responsive.css): breakpoints and reduced-motion handling.
- [scripts/main.js](scripts/main.js): event wiring and app lifecycle.
- [scripts/display.js](scripts/display.js): time logic, bit painting, help, and digital rolling text.
- [scripts/transitions.js](scripts/transitions.js): mode/theme transition state machine.
- [scripts/ui.js](scripts/ui.js): UI state application and persistence hooks.
- [scripts/config.js](scripts/config.js): constants and storage keys.

