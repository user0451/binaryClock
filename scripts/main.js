import { controls } from "./dom.js";
import { runTick } from "./display.js";
import { state } from "./state.js";
import { runThemeMotionBurst, transitionToMode } from "./transitions.js";
import { applyDigitalState, applyHelpState, applyTheme, persistState, restoreState, setSettingsOpen, setTimeFormatLabel, toggleSettings } from "./ui.js";

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

function toggleDigital() {
	state.digitalVisible = controls.digitalToggle.checked;
	applyDigitalState();
	persistState();
}

function onThemeChange() {
	state.theme = controls.themeSelect.value;
	applyTheme();
	runThemeMotionBurst();
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
	controls.digitalToggle.addEventListener("change", toggleDigital);
	controls.themeSelect.addEventListener("change", onThemeChange);
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
	startClock();
}
