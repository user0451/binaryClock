# Binary Clock

Learn binary by reading real time.

An interactive binary clock designed to subtly teach how binary works through visualisation and simple, progressive features.

👉 Live demo: https://spinningrock.net/binary/

![demo](https://github.com/user0451/binaryClock/blob/master/media/binaryclock.gif)
---
## Why This Exists
Most binary clocks are visual novelty. Mine isn't far off to be fair, but is really designed to teach:

- how binary values are built from powers of two
- how the same value can be shown as bits, digits, and decimal time
- how quickly your brain can move from "adding weights" to "recognizing patterns"

## What You Will Learn
- Bit weights (`1, 2, 4, 8, 16, 32`)
- How active bits add into a decimal value
- Why MSB-first vs LSB-first changes reading flow
- How BCD (4-bit mode) differs from direct binary (6-bit mode)
- How to convert both directions through interactive game modes

## Quick Binary Primer
Each row is a power of two. Add the rows that are on.

```text
8  4  2  1
0  1  1  0  -> 4 + 2 = 6
```

## Learning Path (Recommended)
1. Start in default view and watch bit changes over time.
2. Enable Help mode to see per-bit values.
3. Turn on the Digital panel and compare binary with decimal instantly.
4. Switch to 0/1 themes (`Bit Boring` or `Boring Bit`) to focus on binary digits.
5. Try 4-bit mode to understand decimal digits as binary-coded chunks.
6. Use game modes to practice active recall under feedback.

## Features Built For Learning

### Help Mode

- Shows bit weights and additive structure
- Makes value construction explicit instead of decorative
- Keeps a decimal reference visible for verification

### Multiple Representations

The same time value can be read in different forms:

- visual (on/off bits)
- binary digits (`0/1` themes)
- weighted rows (Help mode)
- decimal (Digital panel)

Switching representation is the core teaching method.

### 6-bit and 4-bit Modes

- **6-bit mode**: direct binary for each time unit
- **4-bit mode**: binary-coded decimal style (tens and units split)

Both are useful: 6-bit builds fluency, 4-bit builds understanding.

### Interactive Practice Modes

- **Bit-clicking mode**: click bits to match target values, level up, and receive performance-based feedback
- **Quiz mode**: convert between binary and decimal with time pressure

The goal is to move from passive observation to active recall.

## Controls At A Glance

- `6-bit / 4-bit`: switch representation model
- `Help`: show bit values and support guided reading
- `Digital`: show decimal companion clock
- `Vertical / Horizontal`: change spatial reading direction
- `MSB / LSB`: reverse bit significance order
- `24h / 12h`: switch time format
- `Theme`: choose visual style or shuffle through themes

## Run Locally

No install needed for normal use.
```bash
git clone https://github.com/user0451/binaryClock
cd binaryClock
```
1. Open [index.html](index.html) in your browser.


## Project Structure

- [index.html](index.html): UI markup and controls
- [code.js](code.js): app entry bootstrap
- [scripts](scripts): behavior and game logic
- [styles](styles): layout, theme, motion, and interaction styles

## Philosophy
- Teach with minimal text, clear visual feedback, and repeatable interaction. If you spend enough time with this clock, you should stop "calculating" and start "recognizing" binary patterns.
- Go nuts with CSS...

## License
Steal whatever you like.
