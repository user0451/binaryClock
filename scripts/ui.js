import { STORAGE_KEYS } from "./config.js";
import { clockElement, controls, digitalPanel } from "./dom.js";
import { state } from "./state.js";

export function setModeLabel() {
	controls.modeLabel.innerText = state.mode;
}

export function setTimeFormatLabel() {
	controls.timeFormatLabel.innerText = state.show24HourFormat ? "24h" : "12h";
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
		setLSBTitle();
	}
}

 function setLSBTitle() {
	if (controls.lsbToggle) {
		controls.lsbLabel.innerText = state.lsbFirst ? (state.bitOrientation === "horizontal" ? "LSB →" : "LSB ↓") : (state.bitOrientation === "horizontal" ? "LSB ←" : "LSB ↑");
		controls.lsbToggle.parentElement.title = state.lsbFirst ? (state.bitOrientation === "horizontal" ? "Least Significant Bit Left to Right" : "Least Significant Bit Top to Bottom") : (state.bitOrientation === "horizontal" ? "Least Significant Bit Right to Left" : "Least Significant Bit Bottom to Top");
 	}
}

export function setLSBLabel() {
	if (controls.lsbLabel) {
		setLSBTitle();
	}
}

export function applyLSBState() {
	document.body.classList.toggle("lsb-first", state.lsbFirst);
	setLSBLabel();
}

export function persistState() {
	localStorage.setItem(STORAGE_KEYS.mode, state.mode);
	localStorage.setItem(STORAGE_KEYS.format, state.show24HourFormat ? "24" : "12");
	localStorage.setItem(STORAGE_KEYS.help, state.helpVisible ? "on" : "off");
	// When help is active, save the real pre-help preference, not the forced value
	const digitalToSave = state.helpVisible && state.digitalVisibleBeforeHelp !== null
		? state.digitalVisibleBeforeHelp
		: state.digitalVisible;
	localStorage.setItem(STORAGE_KEYS.digital, digitalToSave ? "on" : "off");
	localStorage.setItem(STORAGE_KEYS.scanlines, state.scanlinesVisible ? "on" : "off");
	localStorage.setItem(STORAGE_KEYS.theme, state.randomMode ? "random-shuffle" : state.theme);
	localStorage.setItem(STORAGE_KEYS.bitOrientation, state.bitOrientation);
	localStorage.setItem(STORAGE_KEYS.lsbFirst, state.lsbFirst ? "on" : "off");
	// Game state (only save high score, not active session)
	localStorage.setItem(STORAGE_KEYS.gameScore, state.gameScore);
	localStorage.setItem(STORAGE_KEYS.gameLevel, state.gameLevel);
}

export function applyHelpState() {
	const enabling = state.helpVisible;
	document.body.classList.toggle("help-visible", enabling);

	if (enabling) {
		// Cache the user's real digital preference and force digital visible
		state.digitalVisibleBeforeHelp = state.digitalVisible;
		state.digitalVisible = true;
		if (controls.digitalToggle) {
			controls.digitalToggle.checked = true;
			controls.digitalToggle.disabled = true;
		}
		applyDigitalState();
	} else {
		// Restore prior digital visibility
		if (state.digitalVisibleBeforeHelp !== null) {
			state.digitalVisible = state.digitalVisibleBeforeHelp;
			state.digitalVisibleBeforeHelp = null;
		}
		if (controls.digitalToggle) {
			controls.digitalToggle.checked = state.digitalVisible;
			controls.digitalToggle.disabled = false;
		}
		applyDigitalState();
	}
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

export function applyGameModeState() {
	const isGameActive = state.gameActive;
	document.body.classList.toggle("game-mode-active", isGameActive);
	
	if (isGameActive) {
		// Disable controls that would interfere with the game
		controls.modeToggle.disabled = true;
		controls.orientationToggle.disabled = true;
		controls.scanlinesToggle.disabled = true;
		controls.shuffleButton.disabled = true;
		controls.themeSelectDisplay.disabled = true;
		// Help shows the answers – disable it during game
		if (controls.helpToggle) {
			if (state.helpVisible) {
				state.helpVisible = false;
				controls.helpToggle.checked = false;
				applyHelpState();
			}
			controls.helpToggle.disabled = true;
		}
	} else {
		// Re-enable controls when exiting game
		controls.modeToggle.disabled = false;
		controls.orientationToggle.disabled = false;
		controls.scanlinesToggle.disabled = false;
		controls.shuffleButton.disabled = false;
		controls.themeSelectDisplay.disabled = false;
		if (controls.helpToggle) {
			controls.helpToggle.disabled = false;
		}
	}
}

export function applyGameTypeState(gameType) {
	document.body.classList.remove("game-type-bit-clicking", "game-type-quiz");
	
	if (gameType === "bit-clicking") {
		document.body.classList.add("game-type-bit-clicking");
	} else if (gameType === "quiz") {
		document.body.classList.add("game-type-quiz");
	}
}

export function setGameModeLabel() {
	if (controls.gameModeLabel) {
		controls.gameModeLabel.textContent = state.gameActive ? "Close Game" : "Game";
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

	const lsbFirst = localStorage.getItem(STORAGE_KEYS.lsbFirst);
	state.lsbFirst = lsbFirst === "on";

	// Restore game state (high score and level only)
	const gameScore = localStorage.getItem(STORAGE_KEYS.gameScore);
	if (gameScore) {
		state.gameScore = parseInt(gameScore, 10);
	}
	const gameLevel = localStorage.getItem(STORAGE_KEYS.gameLevel);
	if (gameLevel) {
		state.gameLevel = parseInt(gameLevel, 10);
	}

	controls.modeToggle.checked = state.mode === "4-bit";
	controls.timeFormatToggle.checked = state.show24HourFormat;
	controls.helpToggle.checked = state.helpVisible;
	controls.digitalToggle.checked = state.digitalVisible;
	controls.scanlinesToggle.checked = state.scanlinesVisible;
	controls.orientationToggle.checked = state.bitOrientation === "horizontal";
	controls.gameModeToggle.checked = false; // Game mode always starts unchecked
	if (controls.lsbToggle) {
		controls.lsbToggle.checked = state.lsbFirst;
	}
	setModeLabel();
	setTimeFormatLabel();
	setDigitalLabel();
	setScanlinesLabel();
	setOrientationLabel();
	setGameModeLabel();
	setLSBLabel();
	applyHelpState();
	applyDigitalState();
	applyScanlineState();
	applyBitOrientationState();
	applyLSBState();
	applyTheme();
	clockElement.setAttribute("data-mode", state.mode === "4-bit" ? "4bit" : "6bit");
}
