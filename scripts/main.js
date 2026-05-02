import { allBitNodes, controls } from "./dom.js";
import { applyModeJitterDelays, runTick } from "./display.js";
import { PAGE_ASSEMBLY_WINDOW_MS, RANDOM_THEME_INTERVAL_MS, SHUFFLEABLE_THEMES } from "./config.js";
import { state } from "./state.js";
import { runThemeMotionBurst, transitionToMode, transitionToOrientation } from "./transitions.js";
import { applyBitOrientationState, applyDigitalState, applyHelpState, applyScanlineState, applyTheme, persistState, restoreState, setOrientationLabel, setSettingsOpen, setTimeFormatLabel, toggleSettings } from "./ui.js";

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
	state.show24HourFormat = controls.timeFormatToggle.checked;
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

function toggleScanlines() {
	state.scanlinesVisible = controls.scanlinesToggle.checked;
	applyScanlineState();
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

function wireBitLiquidInteractions() {
	const releaseTimers = new WeakMap();
	const liquidProfiles = new WeakMap();
	const settleAnimations = new WeakMap();
	const liquidShapeCount = 6;

	function randomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	function createLiquidShape() {
		const topLeftX = randomInt(30, 70);
		const topRightX = 100 - topLeftX;
		const bottomLeftX = randomInt(30, 70);
		const bottomRightX = 100 - bottomLeftX;
		const topLeftY = randomInt(30, 70);
		const topRightY = 100 - topLeftY;
		const bottomLeftY = randomInt(30, 70);
		const bottomRightY = 100 - bottomLeftY;

		return `${topLeftX}% ${topRightX}% ${bottomLeftX}% ${bottomRightX}% / ${topLeftY}% ${topRightY}% ${bottomLeftY}% ${bottomRightY}%`;
	}

	function applyRandomLiquidProfile(bitNode, pointerType) {
		for (let index = 0; index < liquidShapeCount; index += 1) {
			bitNode.style.setProperty(`--liquid-shape-${index}`, createLiquidShape());
		}

		const durationSeconds = pointerType === "touch"
			? (randomInt(95, 150) / 100).toFixed(2)
			: (randomInt(180, 520) / 100).toFixed(2);
		const negativeOffsetSeconds = (Math.random() * Number(durationSeconds)).toFixed(2);

		bitNode.style.setProperty("--liquid-duration", `${durationSeconds}s`);
		bitNode.style.setProperty("--liquid-delay", `-${negativeOffsetSeconds}s`);
		liquidProfiles.set(bitNode, {
			startedAt: performance.now(),
			durationMs: Number(durationSeconds) * 1000,
			offsetMs: Number(negativeOffsetSeconds) * 1000
		});
	}

	function cancelSettleAnimation(bitNode) {
		const animation = settleAnimations.get(bitNode);
		if (animation) {
			animation.cancel();
			settleAnimations.delete(bitNode);
		}
		bitNode.style.removeProperty("border-radius");
	}

	function createSettlingShape() {
		const topLeftX = randomInt(44, 56);
		const topRightX = 100 - topLeftX;
		const bottomLeftX = randomInt(44, 56);
		const bottomRightX = 100 - bottomLeftX;
		const topLeftY = randomInt(44, 56);
		const topRightY = 100 - topLeftY;
		const bottomLeftY = randomInt(44, 56);
		const bottomRightY = 100 - bottomLeftY;

		return `${topLeftX}% ${topRightX}% ${bottomLeftX}% ${bottomRightX}% / ${topLeftY}% ${topRightY}% ${bottomLeftY}% ${bottomRightY}%`;
	}

	function createCircleShape() {
		return "50% 50% 50% 50% / 50% 50% 50% 50%";
	}

	function finishLiquid(bitNode) {
		const currentRadius = window.getComputedStyle(bitNode).borderRadius;
		bitNode.classList.remove("liquid-live", "liquid-touch");

		if (typeof bitNode.animate !== "function") {
			bitNode.style.borderRadius = currentRadius;
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					bitNode.style.removeProperty("border-radius");
				});
			});
			return;
		}

		const settleAnimation = bitNode.animate([
			{ borderRadius: currentRadius, offset: 0 },
			{ borderRadius: createSettlingShape(), offset: 0.42 },
			{ borderRadius: createSettlingShape(), offset: 0.78 },
			{ borderRadius: createCircleShape(), offset: 1 }
		], {
			duration: bitNode.classList.contains("liquid-touch") ? 420 : 520,
			easing: "cubic-bezier(0.2, 0.78, 0.18, 1)",
			fill: "forwards"
		});

		settleAnimations.set(bitNode, settleAnimation);
		settleAnimation.addEventListener("finish", () => {
			if (settleAnimations.get(bitNode) !== settleAnimation) {
				return;
			}
			settleAnimations.delete(bitNode);
			bitNode.style.borderRadius = createCircleShape();
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
			bitNode.style.removeProperty("border-radius");
				});
			});
		});
		settleAnimation.addEventListener("cancel", () => {
			if (settleAnimations.get(bitNode) === settleAnimation) {
				settleAnimations.delete(bitNode);
			}
		});
	}

	function getLiquidReleaseDelay(bitNode) {
		const profile = liquidProfiles.get(bitNode);
		if (!profile) {
			return bitNode.classList.contains("liquid-touch") ? 220 : 180;
		}

		const elapsedMs = performance.now() - profile.startedAt;
		const progressMs = (profile.offsetMs + elapsedMs) % profile.durationMs;
		const remainingMs = profile.durationMs - progressMs;

		return Math.max(remainingMs, 80);
	}

	function clearReleaseTimer(bitNode) {
		const timerId = releaseTimers.get(bitNode);
		if (timerId) {
			window.clearTimeout(timerId);
			releaseTimers.delete(bitNode);
		}
	}

	function startLiquid(bitNode, pointerType) {
		clearReleaseTimer(bitNode);
		cancelSettleAnimation(bitNode);
		applyRandomLiquidProfile(bitNode, pointerType);
		bitNode.classList.add("liquid-live");
		bitNode.classList.toggle("liquid-touch", pointerType === "touch");
	}

	function releaseLiquid(bitNode) {
		clearReleaseTimer(bitNode);
		const delayMs = getLiquidReleaseDelay(bitNode);
		const timerId = window.setTimeout(() => {
			finishLiquid(bitNode);
			liquidProfiles.delete(bitNode);
			releaseTimers.delete(bitNode);
		}, delayMs);
		releaseTimers.set(bitNode, timerId);
	}

	allBitNodes.forEach((bitNode) => {
		bitNode.addEventListener("pointerenter", (event) => {
			if (event.pointerType === "mouse" || event.pointerType === "pen") {
				startLiquid(bitNode, event.pointerType);
			}
		});

		bitNode.addEventListener("pointerleave", () => {
			releaseLiquid(bitNode);
		});

		bitNode.addEventListener("pointerdown", (event) => {
			startLiquid(bitNode, event.pointerType);
		});

		bitNode.addEventListener("pointerup", () => {
			releaseLiquid(bitNode);
		});

		bitNode.addEventListener("pointercancel", () => {
			releaseLiquid(bitNode);
		});

		bitNode.addEventListener("lostpointercapture", () => {
			releaseLiquid(bitNode);
		});
	});
}

function wireEvents() {
	buildThemeDropdownOptions();
	wireBitLiquidInteractions();
	controls.modeToggle.addEventListener("change", toggleMode);
	controls.timeFormatToggle.addEventListener("change", toggleTimeFormat);
	controls.helpToggle.addEventListener("change", toggleHelp);
	controls.orientationToggle.addEventListener("change", toggleOrientation);
	controls.digitalToggle.addEventListener("change", toggleDigital);
	controls.scanlinesToggle.addEventListener("change", toggleScanlines);
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
