import { STORAGE_KEYS } from "./config.js";
import { clockElement, controls, totalsPanel } from "./dom.js";
import { state } from "./state.js";

export function setModeLabel() {
	controls.modeLabel.innerText = state.mode;
}

export function setTimeFormatLabel() {
	controls.timeFormatLabel.innerText = state.show24HourFormat ? "24" : "12";
}

export function setDigitalLabel() {
	if (controls.digitalLabel) {
		controls.digitalLabel.innerText = "Digital";
	}
}

export function persistState() {
	localStorage.setItem(STORAGE_KEYS.mode, state.mode);
	localStorage.setItem(STORAGE_KEYS.format, state.show24HourFormat ? "24" : "12");
	localStorage.setItem(STORAGE_KEYS.help, state.helpVisible ? "on" : "off");
	localStorage.setItem(STORAGE_KEYS.digital, state.digitalVisible ? "on" : "off");
	localStorage.setItem(STORAGE_KEYS.theme, state.theme);
}

export function applyHelpState() {
	document.body.classList.toggle("help-visible", state.helpVisible);
}

export function applyDigitalState() {
	document.body.classList.toggle("digital-visible", state.digitalVisible);
	if (totalsPanel) {
		totalsPanel.setAttribute("aria-hidden", state.digitalVisible ? "false" : "true");
	}
}

export function applyTheme() {
	document.documentElement.setAttribute("data-theme", state.theme);
	if (controls.themeSelect.value !== state.theme) {
		controls.themeSelect.value = state.theme;
	}
}

export function setSettingsOpen(isOpen) {
	document.body.classList.toggle("settings-open", isOpen);
	controls.settingsOverlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
	controls.settingsButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

export function toggleSettings() {
	setSettingsOpen(!document.body.classList.contains("settings-open"));
}

export function restoreState() {
	const mode = localStorage.getItem(STORAGE_KEYS.mode);
	if (mode === "4-bit" || mode === "6-bit") {
		state.mode = mode;
	}

	const format = localStorage.getItem(STORAGE_KEYS.format);
	state.show24HourFormat = format !== "12";

	const help = localStorage.getItem(STORAGE_KEYS.help);
	state.helpVisible = help === "on";

	const digital = localStorage.getItem(STORAGE_KEYS.digital);
	state.digitalVisible = digital === "on";

	const theme = localStorage.getItem(STORAGE_KEYS.theme);
	if (theme) {
		state.theme = theme;
	}

	controls.modeToggle.checked = state.mode === "4-bit";
	controls.timeFormatToggle.checked = !state.show24HourFormat;
	controls.helpToggle.checked = state.helpVisible;
	controls.digitalToggle.checked = state.digitalVisible;
	setModeLabel();
	setTimeFormatLabel();
	setDigitalLabel();
	applyHelpState();
	applyDigitalState();
	applyTheme();
	clockElement.setAttribute("data-mode", state.mode === "4-bit" ? "4bit" : "6bit");
}
