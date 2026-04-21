# Binary Clock V1 Outline

## Scope Boundary
- Canonical implementation target is V1 only: `index.html`, `style.css`, `code.js`.
- V2 files (`index2.html`, `style2.css`, `code2.js`) remain unchanged and are reference-only for future cutover planning.

## Display Modes
- `6-bit` mode shows one 6-bit value per time column (hours, minutes, seconds).
- `4-bit` mode uses decimal split (tens + units) while preserving original V1 bit IDs.
- Mode transitions are CSS-first and animate with transform/opacity/scale, avoiding display/flex-direction snaps.

## Inline Help System
- Two inline help columns stay mounted in layout:
	- between Hours and Minutes
	- between Minutes and Seconds
- Help visibility is controlled by state class (`body.help-visible`) rather than display toggling.
- Help panels animate open/close with animatable properties (`opacity`, `transform`, `clip-path`, `max-width`/`max-height`).
- Each help panel shows:
	- bit weights per row
	- live per-row contribution values for both adjacent columns
	- live totals in clock format (for example `12 : 34`)

## Controls
- Control row includes:
	- 4/6 bit mode toggle
	- 12/24 hour toggle
	- help toggle
	- theme dropdown
- State is persisted with localStorage keys:
	- `binaryClockMode`
	- `binaryClockFormat`
	- `binaryClockHelp`
	- `binaryClockTheme`

## Theme System
- Theme is applied via root attribute: `html[data-theme="..."]`.
- Delivered themes:
	- Classic RGB Neon
	- Amber Terminal
	- Ice Glass
	- Matrix Pulse
	- Sunset Bloom
- Themes vary in more than color: texture, border treatment, glow character, type feel, and optional pulse behavior.

## Responsive Behavior
- Core sizing is tokenized with CSS variables and `clamp()`.
- Desktop keeps horizontal inline-help composition.
- Tablet tightens spacing.
- Mobile stacks clock groups and converts help reveal to vertical expansion so controls/help remain reachable.
- Viewport sizing uses `min-height: 100vh` plus `100dvh` support.

## Accessibility and Motion
- Keyboard focus rings are visible for toggles and dropdown.
- Controls and theme picker meet touch target sizing intent on small screens.
- Reduced motion path is supported through `prefers-reduced-motion`, minimizing decorative animation while preserving state readability.

