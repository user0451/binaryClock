# Binary Clock

An animated, CSS-forward binary clock with learning overlays, a rolling digital readout, theme switching, and responsive controls.

https://spinningrock.net/binary/


## Current State
- Two display modes: 6-bit (default) and 4-bit.
- Two bit orientations: vertical (default) and horizontal.
- Two time formats: 24-hour (default) and 12-hour — also toggled by clicking the digital panel.
- Configurable bit order: MSB-first (default) or LSB-first.
- Optional learning overlays and optional digital panel.
- Theme picker with 18 built-in themes, plus a shuffle mode that rotates automatically every 10 minutes.
- Page-load assembly animation and per-bit randomised easing on mode/theme transitions.
- Animated CRT-style scan lines on the background.
- Pointer-responsive liquid bits: bits morph and shift toward the cursor or touch point.
- Smart auto-orientation on mobile: the clock switches between vertical and horizontal layout automatically based on device orientation.
- Responsive layout for desktop and mobile, including an optimised landscape mode for phones.
- State persistence in localStorage.

## Modes
- **6-bit mode**: Each time unit (hours, minutes, seconds) is represented by 6 bits, allowing for a direct binary representation of values up to 63. This mode emphasises the binary nature of the clock and is ideal for users familiar with binary counting.
- **4-bit mode**: Each time unit is split into two columns representing the tens and units place. This mode is more pedagogical, designed to teach binary concepts by breaking down each time unit into its decimal place values. For example, the hours are represented with a tens column (0–2) and a units column (0–9), with the tens place only using 2 bits since the maximum hour value is 23.

### Where to Start
- Hardcore: 6-bit mode only.
- General: 6-bit mode, Horizontal orientation with the digital panel on.
- Beginner: 4-bit mode, Vertical orientation with digital and help values on.
- 12/24-hour format is a personal preference.

## Run
No build step is required.

1. Open [index.html](index.html) in a browser.
2. The app bootstraps through [code.js](code.js), which initialises [scripts/main.js](scripts/main.js).

## Controls
- **6-bit / 4-bit**: switches binary representation mode with animated transition choreography. The label updates instantly on click.
- **24 / 12**: switches time format.
- **Digital**: toggles the rolling digital companion panel.
- **Digital panel (click)**: clicking the digital panel itself also toggles 12/24-hour format.
- **Vertical / Horizontal**: switches bit orientation. Bits animate between layouts using the same jitter-delay infrastructure as mode transitions.
- **LSB / MSB**: toggles bit order between least-significant-bit-first and most-significant-bit-first. Arrows in the label indicate the current direction.
- **Help**: toggles inline binary weight annotations and forces the digital panel on while active (restores previous digital state on exit).
- **Auto-orient** *(mobile only)*: when enabled, the clock automatically switches between vertical and horizontal layout to match the device's physical orientation. The toggle is hidden on desktop.
- **Theme (button)**: click to toggle automatic shuffle mode — the container sways gently while shuffle is active. Tooltip and `aria-pressed` state reflect the current mode.
- **Theme (dropdown)**: selects a specific theme. Picking any theme manually stops the shuffle.

## Display Behaviour

### 6-bit Mode
- Hours, minutes, and seconds are each shown as six binary rows; most significant bit at the top (or left in horizontal orientation).
- Help values map to row weights: 32, 16, 8, 4, 2, 1.

### 4-bit Mode
- Each time unit is split into tens and units digits, each up to 4 bits.
- Tens and units show weighted help contributions in help mode.
- Hours tens only uses 2 active bits (max value 2).
- In horizontal orientation, tens stacks above units; bits within each digit run left to right.

### Orientation
- **Vertical** (default): bits stack top to bottom within each time unit; time groups are arranged in a row.
- **Horizontal**: bits run left to right; time groups are stacked vertically with a divider line between them.
- Switching orientation triggers the full jitter-delay bit animation with randomised easing, mirroring the mode-switch choreography.
- On mobile devices, **auto-orientation** maps vertical layout to portrait and horizontal layout to landscape automatically. The detection uses the Screen Orientation API with `matchMedia` and resize/visibilitychange fallbacks. The orientation control is hidden on desktop.

### Digital Panel
- Rolling two-slot H:M:S values with per-slot digit animation.
- In 24-hour mode, hours are zero-padded.
- In 12-hour mode, hours do not show a leading zero.
- AM/PM badge is visible only in 12-hour mode.
- Clicking the digital panel toggles 12/24-hour format directly.
- During help mode the digital panel is forced on and the Digital toggle is disabled; on help exit the previous digital state is restored.

### Bit Order
- **MSB-first** (default): most significant bit at the top (vertical) or left (horizontal), matching standard binary notation.
- **LSB-first**: bit order is reversed — least significant bit at top or left. Useful for learning to read binary from the "natural" direction, or for a different visual challenge.
- The LSB label shows directional arrows (↑ MSB→LSB / ↓ LSB→MSB) as a quick visual cue.

### Liquid Bits/Blobs
- Each bit is a "blob" that morphs and shifts in response to pointer movement and
- Bits respond to pointer movement and touch: they morph their border-radius and shift slightly toward the cursor or touch point, giving the clock face a fluid, tactile feel.
- The effect is suppressed when `prefers-reduced-motion` is set.
- Pinch-zoom on mobile is fully preserved.

### Scan Lines
- A subtle animated CRT scan-line overlay plays on the background via `body::after`.
- Two layered animations (`scanlineDrift`, `scanlineWave`) give a slow, organic drift.
- Suppressed when `prefers-reduced-motion` is set.

### Page Load
- On first render, all clock bits play a staggered assembly animation (`bitAssemble`) before the clock starts ticking, giving the initial experience a satisfying "power on" feel. Actually, it's not that great - nowhere near!

## Themes
18 built-in themes, plus shuffle mode:

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
13. Galactic Disco Inferno
14. Enchanted Forest Glow
15. Midnight Mirage
16. Retro Pixel Crunch
17. Bit Boring
18. Boring Bit

Most themes include a custom `bit.on` animation tuned to a subtle theme-appropriate motion profile. **Shuffle mode** rotates through all 18 themes every 10 minutes; the theme selector container gently sways while active. Picking any theme manually disables shuffle.

## Animations
- **Mode transitions**: bits fly out and back in with per-bit randomised `--rand-delay-in/out` and `--rand-ease-in/out` CSS custom properties, drawn from a pool of easing curves. The direction of animation adapts to whether the target mode is 6-bit or 4-bit, and to the current bit orientation.
- **Orientation transitions**: same jitter infrastructure fires when switching vertical ↔ horizontal. `bitFlyInHorizontal` is used when entering horizontal; `bitFlyIn` returns to vertical.
- **Theme motion bursts**: triggered on theme change; uses the same bit animation window without changing the mode.
- **Page assembly**: `bitAssemble` plays on all bits during the `page-assembling` body-class window (1800 ms) at startup.
- All bit animations respect `column-offset` and `--rand-delay-*` for a staggered, non-uniform feel.
- `prefers-reduced-motion` suppresses the shuffle-container sway animation.

## Responsive Behaviour
- **Desktop** (`min-width: 40rem` + `pointer: fine`): full layout with settings overlay, orientation toggle visible.
- **Mobile portrait**: compact centred layout; settings overlay scrollable; auto-orientation switches to vertical layout.
- **Mobile landscape** (`pointer: coarse` + `orientation: landscape`): reduced control sizes, settings panel uses a two-column grid to fit on screen, clock is centred with constrained max-width. Auto-orientation switches to horizontal layout.
- The orientation toggle (`auto-orient`) is hidden on desktop via `@media (pointer: fine)` — it is only relevant on touch devices.
- While settings are open, background scrolling is locked.
- Pinch-zoom is fully preserved on mobile (no pointer capture on clock bits).
- `touch-action: pan-x pan-y pinch-zoom` is applied to the clock and bits; `touch-action: auto` is restored on the root.

## Persistence
Saved keys in localStorage:

| Key | Values |
|---|---|
| `binaryClockMode` | `6-bit` / `4-bit` |
| `binaryClockFormat` | `24` / `12` |
| `binaryClockHelp` | `on` / `off` |
| `binaryClockDigital` | `on` / `off` |
| `binaryClockTheme` | theme value or `random-shuffle` |
| `binaryClockBitOrientation` | `vertical` / `horizontal` |
| `binaryClockLSBFirst` | `true` / `false` |

## Project Structure
- [index.html](index.html): markup and controls.
- [style.css](style.css): stylesheet imports.
- [styles/base.css](styles/base.css): CSS custom property tokens, foundational layout, scan-line overlay animation, touch-action rules.
- [styles/clock.css](styles/clock.css): clock bit and digital panel styling, digital panel click affordance.
- [styles/modes.css](styles/modes.css): 4-bit/6-bit layout rules, horizontal orientation rules, LSB-first bit-order reversal.
- [styles/motion.css](styles/motion.css): transition and keyframe choreography, scan-line keyframes.
- [styles/themes.css](styles/themes.css): per-theme CSS variable definitions and theme-specific bit animations.
- [styles/controls.css](styles/controls.css): settings UI, toggle switches, shuffle button, disabled-switch style, landscape two-column grid.
- [styles/interactions.css](styles/interactions.css): liquid bit pointer/touch response (`--liquid-offset-x/y`, `will-change`).
- [styles/responsive.css](styles/responsive.css): desktop breakpoints (gated to `pointer: fine`), mobile landscape overrides, reduced-motion handling.
- [scripts/main.js](scripts/main.js): event wiring, app lifecycle, shuffle interval management, auto-orientation logic (Screen Orientation API + fallbacks), liquid bit pointer/touch handlers.
- [scripts/display.js](scripts/display.js): time logic, bit painting, help annotations, digital rolling text, jitter delay assignment.
- [scripts/transitions.js](scripts/transitions.js): mode transition and orientation transition state machines, theme motion burst.
- [scripts/ui.js](scripts/ui.js): UI state application, label updates (including LSB label), persistence hooks, restore-on-load, help-mode digital lock.
- [scripts/state.js](scripts/state.js): global singleton state object (`lsbFirst`, `autoOrient`, `digitalVisibleBeforeHelp`).
- [scripts/dom.js](scripts/dom.js): cached DOM element references (`lsbToggle`, `lsbLabel`).
- [scripts/config.js](scripts/config.js): constants, timing windows, storage keys (`binaryClockLSBFirst`), easing pool, shuffleable theme list.

## Future
Some things I could do in the future if bored enough, but probably won't:
- The help annotations are a bit basic and could be more visually integrated with the clock face, perhaps with better typography or a more intuitive layout.
- Expose the shuffle time interval in the UI for user control.
- Add an optional seconds progress ring around the clock face.
- Add a mode with only hours and minutes for a more minimalist look.
- Add a "learn" mode with interactive quizzes to test binary understanding.
- Add a "colorblind mode" with high-contrast patterns instead of colors for better accessibility.
- Add a "darken inactive bits" toggle for better focus on the active bits.
- Add some fun easter egg themes unlocked by clicking the title a certain number of times, for nobody to ever discover.
- Add a "custom theme" mode where users can pick their own colors and animation profiles.
- Add a "holiday mode" that automatically changes themes based on the time of year (spooky in October, festive in December, otherwise seasonal defaults).
- Add a night mode that gradually darkens the color scheme as the night progresses, based on the user's local time.
- Add sound effects that can be toggled — a satisfying click when bits change, a whoosh during transitions, maybe a tick-tock synced to seconds. I don't want to do this, but it would be fun if I had any audio skills at all.
- Add particle effects during mode switches or time changes — little bursts of binary digits or colorful sparks from the clock face.
- Add a celebration mode for special occasions like New Year's Eve, where midnight triggers confetti and general chaos.
- Countdown timers or alarm functionality with a binary countdown and a fun completion animation.
- Hide unused tens-hour bits in 4-bit mode, with an option to toggle them for symmetry.

## Known Issues
- auto-orientation switch missing from mobile view (hidden on desktop)

## License
Steal whatever you like, but don't blame me if it explodes. If you make something cool with this code, let me know!