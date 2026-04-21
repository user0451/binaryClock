# Binary Clock

An animated, CSS-forward binary clock with learning overlays, a rolling digital readout, theme switching, and responsive controls.

https://spinningrock.net/binary/


## Current State
- Live clock updates every 250ms.
- Two display modes: 6-bit and 4-bit.
- Two time formats: 24-hour and 12-hour.
- Optional learning overlays and optional digital panel.
- Theme picker with 12 built-in themes.
- Responsive behavior for desktop and mobile.
- State persistence in localStorage.

## Modes
- **6-bit mode**: Each time unit (hours, minutes, seconds) is represented by 6 bits, allowing for a direct binary representation of values up to 63. This mode emphasizes the binary nature of the clock and is ideal for users familiar with binary counting.
- **4-bit mode**: Each time unit is split into two columns representing the tens and units place. This mode is more pedagogical, designed to teach binary concepts by breaking down each time unit into its decimal place values. For example, the hours are represented with a tens column (0, 10) and a units column (0-9), with the tens place only using 2 bits since the maximum hour value is 23.

### Where to Start
- Hardcore: 6-bit mode only.
- Average: 6-bit mode with digital clock on.
- Beginner: 4-bit mode with digital clock and help values on.
12/24-hour format is a personal preference.

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
- Each unit is split into tens and units columns.
- Tens and units both show weighted help contributions in help mode.
- Hours tens place only uses 2 bits (0, 10) since the max is 23.

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

I ran out of silly names! Most themes include custom `bit.on` motion tuned to a subtle profile.

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

** Future
- Add more themes!
- Add an optional seconds progress ring around the clock face.
- Add a mode with only hours and minutes for a more minimalist look.
- Add a mode with a binary progress bar for each time unit instead of discrete bits.
- Add a "learn" mode with interactive quizzes to test binary understanding.
- Reverse ordered bit modes
- Horizontal bit layout modes
- My responsive breakpoint game is weak, maybe add some intermediate breakpoints for tablets and landscape phones. The entire current responsive implementation is quite poor; I went down the wrong avenue...
- The transition animations could do with another pass, to make them less predictable and more dynamic. Maybe add some randomization to the timing and easing profiles for each bit during mode/theme switches.
- Add animations on page load to make the clock bits "assemble" into place when the app first loads, for a more engaging initial experience.
- Add a "colorblind mode" with high-contrast patterns instead of colors for better accessibility.
- Maybe add a "darken inactive bits" toggle for better focus on the current time.
- Add some fun easter egg themes that can be unlocked by clicking the title a certain number of times or something stupid that noone will ever see.
- Add a "custom theme" mode where users can pick their own colors and animation profiles.
- Add a "party mode" with rapidly changing colors and fast animations for fun.
- Add a "stealth mode" with very subtle animations and a muted color palette for low-visibility environments.
- Add a "retro mode" with pixelated fonts and chunky bits for a vintage computer vibe.
- Add a "nature mode" with earthy colors and organic motion profiles for a calming effect.
- Add a "space mode" with starry backgrounds and cosmic color schemes for astronomy enthusiasts.
- Add a "holiday mode" that automatically changes themes based on the time of year (e.g. spooky themes in October, festive themes in December, otherwise defaulting to four seasonal themes).
- Add a night mode that gradually darkens the color scheme as the night progresses, based on the user's local time. The bits could transition to deeper blues and purples after sunset for a more soothing nighttime experience.
- Add a "random mode" that picks a new theme every time you load the page for a fun surprise.
- think of stupid names for the new themes in keeping with the current theme naming convention. Maybe "Galactic Disco Inferno" for the space mode, "Pixelated Pumpkin Patch" for the retro mode, "Enchanted Forest Glow" for the nature mode, "Spooky Spectral Shift" for the holiday mode, and "Midnight Mirage" for the night mode. I have no creativity left.



## known Issues
- The transition choreography is pretty complex and has some edge cases where bits can get stuck in the wrong state if you switch modes/themes rapidly. I haven't fully ironed out all the timing issues yet, but it seems to work fine as long as you don't spam the controls too much.
- The mobile responsive behavior is pretty basic and could use some work. The settings panel is a bit clunky and the clock face could be better optimized for small screens. I may add some intermediate breakpoints for tablets and landscape phones.
- 4-bit/6-bit switch labels should change on click, not after animations complete. This is a minor UX issue that I haven't gotten around to fixing yet. It would have been quicker to fix it than to type this out...
- Maybe vertically center the digital clock digits...
- and vertically center the help values too; although I think I prefer the top alignment for this...
- The digital clock rolling animation can be a bit janky if you switch modes/themes rapidly. I may need to add some debouncing or state checks to prevent animation conflicts. But, I'm not sure I care enough...


## License
Steal whatever you like, it's yours; but don't blame me if it explodes. If you make something cool with this code, let me know!