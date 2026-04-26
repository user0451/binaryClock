export const STORAGE_KEYS = {
	mode: "binaryClockMode",
	format: "binaryClockFormat",
	help: "binaryClockHelp",
	digital: "binaryClockDigital",
	theme: "binaryClockTheme",
	bitOrientation: "binaryClockBitOrientation"
};

export const HELP_WEIGHTS = [32, 16, 8, 4, 2, 1];
export const FOUR_BIT_WEIGHTS = [8, 4, 2, 1];
export const MODE_TRANSITION_WINDOW_MS = 2600;
export const THEME_MOTION_WINDOW_MS = 1550;
export const THEME_FADE_START_MS = 200;
export const THEME_FADE_DURATION_MS = 2050;
export const PAGE_ASSEMBLY_WINDOW_MS = 1800;
export const ORIENTATION_TRANSITION_WINDOW_MS = 1600;
export const RANDOM_THEME_INTERVAL_MS = 10 * 60 * 1000;
export const SHUFFLEABLE_THEMES = [
	"classic-rgb-neon", "amber-terminal", "ice-glass", "matrix-pulse",
	"sunset-bloom", "cyberpunk-grid", "metallic-core", "monochrome-noir",
	"electric-storm", "gloomy-mist", "sunny-pop", "christmas-glow",
	"galactic-disco-inferno", "enchanted-forest-glow", "midnight-mirage",
	"retro-pixel-crunch", "bit-boring", "boring-bit"
];

export const TRANSITION_EASINGS = [
	"cubic-bezier(0.2, 0.78, 0.18, 1)",
	"cubic-bezier(0.4, 0, 0.2, 1)",
	"ease-out",
	"ease-in",
	"ease-in-out",
	"cubic-bezier(0.34, 1.56, 0.64, 1)",
	"cubic-bezier(0.6, 0.05, 0.01, 0.99)",
	"cubic-bezier(0.76, 0.02, 0.05, 1)",
	"cubic-bezier(0.23, 1.03, 0.32, 1)",
	"cubic-bezier(0.33, 0.02, 0.68, 1)",
	"cubic-bezier(0.25, 0.46, 0.45, 0.94)",
	"cubic-bezier(0.55, 0.06, 0.68, 0.19)",
	"cubic-bezier(0.22, 1.36, 0.7, 1.01)",
	"cubic-bezier(0.51, 0.92, 0.24, 1.15)",
	"cubic-bezier(0.42, 0, 0.58, 1)",
	"cubic-bezier(0.4, 0, 1, 1)",
	"cubic-bezier(0.3, 0.7, 0.4, 1)",
	"cubic-bezier(0.8, 4.2, 0.2, 2)",
	"cubic-bezier(0.6, -0.28, 0.735, 0.045)",
	"cubic-bezier(0.25, 0.46, 0.45, 0.94)",
	"cubic-bezier(0.55, 0.06, 0.68, 0.19)",
	"cubic-bezier(0.22, 1.36, 0.7, 1.01)",
	"cubic-bezier(0.51, 0.92, 0.24, 1.15)"
]; // some weirdness inspired by https://easings.net/en
