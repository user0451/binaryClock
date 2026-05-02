import { STORAGE_KEYS } from "./config.js";
import { clockElement, controls, digitalPanel } from "./dom.js";
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

export function setScanlinesLabel() {
	if (controls.scanlinesLabel) {
		controls.scanlinesLabel.innerText = "Scanlines";
	}
}

export function setOrientationLabel() {
	if (controls.orientationLabel) {
		controls.orientationLabel.innerText = state.bitOrientation === "horizontal" ? "Horizontal" : "Vertical";
	}
}

export function persistState() {
	localStorage.setItem(STORAGE_KEYS.mode, state.mode);
	localStorage.setItem(STORAGE_KEYS.format, state.show24HourFormat ? "24" : "12");
	localStorage.setItem(STORAGE_KEYS.help, state.helpVisible ? "on" : "off");
	localStorage.setItem(STORAGE_KEYS.digital, state.digitalVisible ? "on" : "off");
	localStorage.setItem(STORAGE_KEYS.scanlines, state.scanlinesVisible ? "on" : "off");
	localStorage.setItem(STORAGE_KEYS.theme, state.randomMode ? "random-shuffle" : state.theme);
	localStorage.setItem(STORAGE_KEYS.bitOrientation, state.bitOrientation);
}

export function applyHelpState() {
	document.body.classList.toggle("help-visible", state.helpVisible);
}

export function applyDigitalState() {
	document.body.classList.toggle("digital-visible", state.digitalVisible);
	if (digitalPanel) {
		digitalPanel.setAttribute("aria-hidden", state.digitalVisible ? "false" : "true");
	}
}

export function applyScanlineState() {
	document.body.classList.toggle("scanlines-off", !state.scanlinesVisible);
}

export function applyBitOrientationState() {
	document.body.classList.toggle("bits-horizontal", state.bitOrientation === "horizontal");
	setOrientationLabel();
}

export function applyTheme() {
	document.documentElement.setAttribute("data-theme", state.theme);
	document.body.classList.toggle("random-shuffle-active", state.randomMode);
	if (controls.shuffleButton) {
		controls.shuffleButton.setAttribute("aria-pressed", state.randomMode ? "true" : "false");
		controls.shuffleButton.innerText = "Theme";
		controls.shuffleButton.title = state.randomMode
			? "Shuffle on. Themes rotate automatically every 10 minutes. Click to stop."
			: "Shuffle off. Click to rotate themes automatically every 10 minutes.";
		controls.shuffleButton.setAttribute("aria-label", state.randomMode
			? "Shuffle is on. Click to stop automatic 10 minute theme rotation."
			: "Shuffle is off. Click to start automatic 10 minute theme rotation.");
	}
	if (controls.themeSelect.value !== state.theme) {
		controls.themeSelect.value = state.theme;
	}
	if (controls.themeSelectDisplay) {
		const selectedOption = controls.themeSelect.options[controls.themeSelect.selectedIndex];
		controls.themeSelectDisplay.textContent = selectedOption ? selectedOption.text : "Theme";
	}
	if (controls.themeSelectList) {
		controls.themeSelectList.querySelectorAll(".theme-select-option").forEach((optionNode) => {
			optionNode.setAttribute("aria-selected", optionNode.dataset.themeValue === state.theme ? "true" : "false");
		});
	}
}

export function setSettingsOpen(isOpen) {
	document.body.classList.toggle("settings-open", isOpen);
	controls.settingsOverlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
	controls.settingsButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
	if (isOpen) {
		// Move focus to the first interactive control inside the panel
		const firstFocusable = controls.settingsOverlay.querySelector(
			'input, button, select, [tabindex]:not([tabindex="-1"])'
		);
		if (firstFocusable) {
			requestAnimationFrame(() => firstFocusable.focus());
		}
	} else if (controls.settingsButton) {
		controls.settingsButton.focus();
	}
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
	state.show24HourFormat = format === "24";

	const help = localStorage.getItem(STORAGE_KEYS.help);
	state.helpVisible = help === "on";

	const digital = localStorage.getItem(STORAGE_KEYS.digital);
	state.digitalVisible = digital !== "off";

	const scanlines = localStorage.getItem(STORAGE_KEYS.scanlines);
	state.scanlinesVisible = scanlines !== "off";

	const theme = localStorage.getItem(STORAGE_KEYS.theme);
	if (theme === "random-shuffle") {
		state.randomMode = true;
	} else if (theme) {
		state.theme = theme;
	}

	const bitOrientation = localStorage.getItem(STORAGE_KEYS.bitOrientation);
	if (bitOrientation === "horizontal" || bitOrientation === "vertical") {
		state.bitOrientation = bitOrientation;
	}

	controls.modeToggle.checked = state.mode === "4-bit";
	controls.timeFormatToggle.checked = state.show24HourFormat;
	controls.helpToggle.checked = state.helpVisible;
	controls.digitalToggle.checked = state.digitalVisible;
	controls.scanlinesToggle.checked = state.scanlinesVisible;
	controls.orientationToggle.checked = state.bitOrientation === "horizontal";
	setModeLabel();
	setTimeFormatLabel();
	setDigitalLabel();
	setScanlinesLabel();
	setOrientationLabel();
	applyHelpState();
	applyDigitalState();
	applyScanlineState();
	applyBitOrientationState();
	applyTheme();
	clockElement.setAttribute("data-mode", state.mode === "4-bit" ? "4bit" : "6bit");
}
