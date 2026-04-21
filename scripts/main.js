import { controls } from "./dom.js";
import { applyModeJitterDelays, runTick } from "./display.js";
import { PAGE_ASSEMBLY_WINDOW_MS, RANDOM_THEME_INTERVAL_MS, SHUFFLEABLE_THEMES } from "./config.js";
import { state } from "./state.js";
import { runThemeMotionBurst, transitionToMode, transitionToOrientation } from "./transitions.js";
import { applyBitOrientationState, applyDigitalState, applyHelpState, applyTheme, persistState, restoreState, setOrientationLabel, setSettingsOpen, setTimeFormatLabel, toggleSettings } from "./ui.js";

function toggleMode() {
	const targetMode = controls.modeToggle.checked ? "4-bit" : "6-bit";
	transitionToMode(targetMode);
}

function toggleTimeFormat() {
	state.show24HourFormat = !controls.timeFormatToggle.checked;
	setTimeFormatLabel();
	persistState();
	runTick();
}

function toggleHelp() {
	state.helpVisible = controls.helpToggle.checked;
	applyHelpState();
	persistState();
}

function toggleOrientation() {
	const targetOrientation = controls.orientationToggle.checked ? "horizontal" : "vertical";
	state.bitOrientation = targetOrientation;
	setOrientationLabel();
	persistState();
	transitionToOrientation(targetOrientation);
}

function toggleDigital() {
	state.digitalVisible = controls.digitalToggle.checked;
	applyDigitalState();
	persistState();
}

function pickRandomTheme() {
	const available = SHUFFLEABLE_THEMES.filter(t => t !== state.theme);
	state.theme = available[Math.floor(Math.random() * available.length)];
	applyTheme();
	runThemeMotionBurst();
}

export function startRandomMode() {
	state.randomMode = true;
	pickRandomTheme();
	if (state.randomThemeIntervalId) {
		window.clearInterval(state.randomThemeIntervalId);
	}
	state.randomThemeIntervalId = window.setInterval(pickRandomTheme, RANDOM_THEME_INTERVAL_MS);
}

function stopRandomMode() {
	state.randomMode = false;
	if (state.randomThemeIntervalId) {
		window.clearInterval(state.randomThemeIntervalId);
		state.randomThemeIntervalId = null;
	}
}

function onThemeChange() {
	stopRandomMode();
	state.theme = controls.themeSelect.value;
	applyTheme();
	runThemeMotionBurst();
	persistState();
}

function toggleRandomMode() {
	if (state.randomMode) {
		stopRandomMode();
		applyTheme();
	} else {
		startRandomMode();
	}
	persistState();
}

function startClock() {
	if (state.intervalId) {
		window.clearInterval(state.intervalId);
	}
	state.intervalId = window.setInterval(runTick, 250);
	runTick();
}

function wireEvents() {
	controls.modeToggle.addEventListener("change", toggleMode);
	controls.timeFormatToggle.addEventListener("change", toggleTimeFormat);
	controls.helpToggle.addEventListener("change", toggleHelp);
	controls.orientationToggle.addEventListener("change", toggleOrientation);
	controls.digitalToggle.addEventListener("change", toggleDigital);
	controls.themeSelect.addEventListener("change", onThemeChange);
	controls.shuffleButton.addEventListener("click", toggleRandomMode);
	controls.settingsButton.addEventListener("click", toggleSettings);
	controls.settingsClose.addEventListener("click", () => setSettingsOpen(false));
	controls.settingsOverlay.addEventListener("click", (event) => {
		if (event.target === controls.settingsOverlay) {
			setSettingsOpen(false);
		}
	});
	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape" && document.body.classList.contains("settings-open")) {
			setSettingsOpen(false);
		}
	});
}

export function initApp() {
	wireEvents();
	restoreState();
	if (state.randomMode) {
		startRandomMode();
	}
	applyModeJitterDelays();
	document.body.classList.add("page-assembling");
	window.setTimeout(() => {
		document.body.classList.remove("page-assembling");
	}, PAGE_ASSEMBLY_WINDOW_MS);
	startClock();
}
