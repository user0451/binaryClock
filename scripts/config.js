export const STORAGE_KEYS = {
	mode: "binaryClockMode",
	format: "binaryClockFormat",
	help: "binaryClockHelp",
	digital: "binaryClockDigital",
	scanlines: "binaryClockScanlines",
	theme: "binaryClockTheme",
	bitOrientation: "binaryClockBitOrientation",
	lsbFirst: "binaryClockLSBFirst",
	gameMode: "binaryClockGameMode",
	gameScore: "binaryClockGameScore",
	gameLevel: "binaryClockGameLevel"
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

// Query parameter validation
export const VALID_MODES = ["6-bit", "4-bit"];
export const VALID_FORMATS = ["12", "24"];
export const VALID_ORIENTATIONS = ["vertical", "horizontal"];
export const VALID_BOOLEAN_STRINGS = ["true", "false"];
export const VALID_LSB_VALUES = ["true", "false"];

export const QUERY_PARAM_KEYS = {
	mode: "mode",
	format: "format",
	theme: "theme",
	orientation: "orientation",
	lsb: "lsb",
	help: "help",
	digital: "digital",
	persist: "persist"
};

/**
 * Validates a query parameter key-value pair
 * @param {string} key - The parameter key
 * @param {string} value - The parameter value (as string from URL)
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidQueryParam(key, value) {
	if (!key || !value) return false;

	switch (key) {
		case QUERY_PARAM_KEYS.mode:
			return VALID_MODES.includes(value);
		case QUERY_PARAM_KEYS.format:
			return VALID_FORMATS.includes(value);
		case QUERY_PARAM_KEYS.theme:
			return SHUFFLEABLE_THEMES.includes(value);
		case QUERY_PARAM_KEYS.orientation:
			return VALID_ORIENTATIONS.includes(value);
		case QUERY_PARAM_KEYS.lsb:
		case QUERY_PARAM_KEYS.help:
		case QUERY_PARAM_KEYS.digital:
		case QUERY_PARAM_KEYS.persist:
			return VALID_BOOLEAN_STRINGS.includes(value);
		default:
			return false;
	}
}

/**
 * Parses URL query parameters and returns a validated object
 * @returns {Object} - Object with validated query parameters
 */
export function parseQueryParams() {
	const params = new URLSearchParams(window.location.search);
	const result = {};

	for (const [key, value] of params.entries()) {
		if (isValidQueryParam(key, value)) {
			result[key] = value;
		} else if (value) {
			console.warn(`Ignored invalid query parameter: ${key}=${value}`);
		}
	}

	return result;
}
