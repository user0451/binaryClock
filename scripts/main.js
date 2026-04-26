import { controls } from "./dom.js";
import { applyModeJitterDelays, runTick } from "./display.js";
import { PAGE_ASSEMBLY_WINDOW_MS, RANDOM_THEME_INTERVAL_MS, SHUFFLEABLE_THEMES } from "./config.js";
import { state } from "./state.js";
import { runThemeMotionBurst, transitionToMode, transitionToOrientation } from "./transitions.js";
import { applyBitOrientationState, applyDigitalState, applyHelpState, applyTheme, persistState, restoreState, setOrientationLabel, setSettingsOpen, setTimeFormatLabel, toggleSettings } from "./ui.js";

function closeThemeDropdown() {
	if (!controls.themeSelectList || !controls.themeSelectDisplay) {
		return;
	}
	controls.themeSelectList.classList.remove("open");
	controls.themeSelectList.style.maxHeight = "";
	controls.themeSelectDisplay.setAttribute("aria-expanded", "false");
	const themeContainer = controls.themeSelectDisplay.closest(".themeSelect");
	themeContainer?.classList.remove("open");
	themeContainer?.classList.remove("open-up");
}

function positionThemeDropdown() {
	if (!controls.themeSelectList || !controls.themeSelectDisplay) {
		return;
	}
	const themeContainer = controls.themeSelectDisplay.closest(".themeSelect");
	if (!themeContainer) {
		return;
	}

	const triggerRect = controls.themeSelectDisplay.getBoundingClientRect();
	const viewportPadding = 12;
	const popupGap = 8;
	const minHeight = 120;
	const preferredHeight = Math.min(window.innerHeight * 0.42, 320);

	const spaceBelow = window.innerHeight - triggerRect.bottom - viewportPadding - popupGap;
	const spaceAbove = triggerRect.top - viewportPadding - popupGap;
	const openUp = spaceBelow < minHeight && spaceAbove > spaceBelow;
	const availableSpace = openUp ? spaceAbove : spaceBelow;
	const nextMaxHeight = Math.max(minHeight, Math.min(preferredHeight, availableSpace));

	themeContainer.classList.toggle("open-up", openUp);
	controls.themeSelectList.style.maxHeight = `${Math.floor(nextMaxHeight)}px`;
}

function syncThemeDropdownDisplay() {
	if (!controls.themeSelectDisplay || !controls.themeSelect) {
		return;
	}
	const selectedOption = controls.themeSelect.options[controls.themeSelect.selectedIndex];
	controls.themeSelectDisplay.textContent = selectedOption ? selectedOption.text : "Theme";
	if (controls.themeSelectList) {
		controls.themeSelectList.querySelectorAll(".theme-select-option").forEach((optionNode) => {
			optionNode.setAttribute("aria-selected", optionNode.dataset.themeValue === controls.themeSelect.value ? "true" : "false");
		});
	}
}

function buildThemeDropdownOptions() {
	if (!controls.themeSelectList || !controls.themeSelect) {
		return;
	}
	controls.themeSelectList.innerHTML = "";
	Array.from(controls.themeSelect.options).forEach((option) => {
		const optionButton = document.createElement("button");
		optionButton.type = "button";
		optionButton.className = "theme-select-option";
		optionButton.role = "option";
		optionButton.dataset.themeValue = option.value;
		optionButton.textContent = option.text;
		optionButton.setAttribute("aria-selected", option.value === controls.themeSelect.value ? "true" : "false");
		optionButton.addEventListener("click", () => {
			controls.themeSelect.value = option.value;
			controls.themeSelect.dispatchEvent(new Event("change", { bubbles: true }));
			closeThemeDropdown();
		});
		controls.themeSelectList.appendChild(optionButton);
	});
	syncThemeDropdownDisplay();
}

function toggleThemeDropdown() {
	if (!controls.themeSelectDisplay || !controls.themeSelectList) {
		return;
	}
	const isOpen = controls.themeSelectDisplay.getAttribute("aria-expanded") === "true";
	if (isOpen) {
		closeThemeDropdown();
		return;
	}
	controls.themeSelectDisplay.setAttribute("aria-expanded", "true");
	controls.themeSelectDisplay.closest(".themeSelect")?.classList.add("open");
	controls.themeSelectList.classList.add("open");
	positionThemeDropdown();
}

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
	runThemeMotionBurst(() => applyTheme());
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
	runThemeMotionBurst(() => applyTheme());
	syncThemeDropdownDisplay();
	persistState();
}

function toggleRandomMode() {
	closeThemeDropdown();
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
	buildThemeDropdownOptions();
	controls.modeToggle.addEventListener("change", toggleMode);
	controls.timeFormatToggle.addEventListener("change", toggleTimeFormat);
	controls.helpToggle.addEventListener("change", toggleHelp);
	controls.orientationToggle.addEventListener("change", toggleOrientation);
	controls.digitalToggle.addEventListener("change", toggleDigital);
	controls.themeSelect.addEventListener("change", onThemeChange);
	controls.themeSelectDisplay?.addEventListener("click", toggleThemeDropdown);
	controls.shuffleButton.addEventListener("click", toggleRandomMode);
	controls.settingsButton.addEventListener("click", toggleSettings);
	controls.settingsClose.addEventListener("click", () => setSettingsOpen(false));
	controls.settingsOverlay.addEventListener("click", (event) => {
		if (event.target === controls.settingsOverlay) {
			closeThemeDropdown();
			setSettingsOpen(false);
		}
	});
	document.addEventListener("click", (event) => {
		if (!controls.themeSelectDisplay || !controls.themeSelectList) {
			return;
		}
		const themeContainer = controls.themeSelectDisplay.closest(".themeSelect");
		if (themeContainer && !themeContainer.contains(event.target)) {
			closeThemeDropdown();
		}
	});
	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape") {
			closeThemeDropdown();
		}
		if (event.key === "Escape" && document.body.classList.contains("settings-open")) {
			setSettingsOpen(false);
		}
	});
	window.addEventListener("resize", () => {
		if (controls.themeSelectDisplay?.getAttribute("aria-expanded") === "true") {
			positionThemeDropdown();
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
