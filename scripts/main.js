import { allBitNodes, controls, digitalPanel } from "./dom.js";
import { applyModeJitterDelays, runTick } from "./display.js";
import { PAGE_ASSEMBLY_WINDOW_MS, RANDOM_THEME_INTERVAL_MS, SHUFFLEABLE_THEMES } from "./config.js";
import { state } from "./state.js";
import { runThemeMotionBurst, transitionToMode, transitionToOrientation } from "./transitions.js";
import { applyBitOrientationState, applyDigitalState, applyHelpState, applyLSBState, applyScanlineState, applyTheme, persistState, restoreState, setLSBLabel, setOrientationLabel, setSettingsOpen, setTimeFormatLabel, toggleSettings } from "./ui.js";

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
	applyAutoOrientation(targetMode);
}

function toggleTimeFormat() {
	state.show24HourFormat = !state.show24HourFormat;
	controls.timeFormatToggle.checked = state.show24HourFormat;
	setTimeFormatLabel();
	persistState();
	runTick();
}

function toggleHelp() {
	state.helpVisible = controls.helpToggle.checked;
	applyHelpState();
	persistState();
}

function toggleLSB() {
	state.lsbFirst = controls.lsbToggle.checked;
	applyLSBState();
	persistState();
	runTick();
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

const portraitMQL = window.matchMedia("(orientation: portrait)");
const landscapeMQL = window.matchMedia("(orientation: landscape)");
const coarsePointerMQL = window.matchMedia("(pointer: coarse)");

function getDeviceOrientation() {
	const orientationType = window.screen?.orientation?.type;
	if (typeof orientationType === "string") {
		if (orientationType.includes("portrait")) {
			return "portrait";
		}
		if (orientationType.includes("landscape")) {
			return "landscape";
		}
	}

	if (portraitMQL.matches) {
		return "portrait";
	}
	if (landscapeMQL.matches) {
		return "landscape";
	}

	return window.innerHeight >= window.innerWidth ? "portrait" : "landscape";
}

function isAutoOrientationDevice() {
	// Use capability + viewport heuristics so desktop resize doesn't trigger auto-orient.
	const hasTouch = navigator.maxTouchPoints > 0;
	const coarsePointer = coarsePointerMQL.matches;
	const shortEdge = Math.min(window.innerWidth, window.innerHeight);
	const isPhoneOrTabletViewport = shortEdge <= 1024;

	return (hasTouch || coarsePointer) && isPhoneOrTabletViewport;
}

function getAutoOrientation(mode = state.mode) {
	const orientation = getDeviceOrientation();
	if (!orientation) {
		return state.bitOrientation;
	}

	if (mode === "6-bit") {
		return orientation === "portrait" ? "vertical" : "horizontal";
	}

	// 4-bit: opposite mapping for readability.
	return orientation === "portrait" ? "horizontal" : "vertical";
}

function applyAutoOrientation(modeOverride) {
	if (!state.autoOrient || !isAutoOrientationDevice()) {
		return;
	}

	const mode = typeof modeOverride === "string" ? modeOverride : state.mode;
	const target = getAutoOrientation(mode);
	if (target !== state.bitOrientation) {
		state.bitOrientation = target;
		controls.orientationToggle.checked = target === "horizontal";
		setOrientationLabel();
		transitionToOrientation(target);
		persistState();
	}
}

function addMediaQueryChangeListener(mediaQueryList, listener) {
	if (typeof mediaQueryList.addEventListener === "function") {
		mediaQueryList.addEventListener("change", listener);
		return;
	}
	if (typeof mediaQueryList.addListener === "function") {
		mediaQueryList.addListener(listener);
	}
}

function wireAutoOrientationListeners() {
	addMediaQueryChangeListener(portraitMQL, applyAutoOrientation);
	addMediaQueryChangeListener(landscapeMQL, applyAutoOrientation);
	addMediaQueryChangeListener(coarsePointerMQL, applyAutoOrientation);

	if (window.screen?.orientation && typeof window.screen.orientation.addEventListener === "function") {
		window.screen.orientation.addEventListener("change", applyAutoOrientation);
	}

	window.addEventListener("resize", applyAutoOrientation);
	window.addEventListener("pageshow", applyAutoOrientation);
	document.addEventListener("visibilitychange", () => {
		if (!document.hidden) {
			applyAutoOrientation();
		}
	});
}

function wireBitLiquidInteractions() {
	const releaseTimers = new WeakMap();
	const liquidProfiles = new WeakMap();
	const settleAnimations = new WeakMap();
	const pointerPositions = new WeakMap();
	const moveFramePending = new WeakMap();
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

	function createBiasedLiquidShape(rx, ry) {
		// rx, ry in -1…+1 relative to bit centre.
		// Corners TOWARD the pointer compress; corners AWAY bulge.
		// Base range 30–70, offset by up to ±16pp.
		const bias = 16;
		const topLeftX = randomInt(30, 70) + Math.round(-rx * bias);
		const topRightX = 100 - (randomInt(30, 70) + Math.round(rx * bias));
		const bottomLeftX = randomInt(30, 70) + Math.round(-rx * bias);
		const bottomRightX = 100 - (randomInt(30, 70) + Math.round(rx * bias));
		const topLeftY = randomInt(30, 70) + Math.round(-ry * bias);
		const topRightY = 100 - (randomInt(30, 70) + Math.round(ry * bias));
		const bottomLeftY = randomInt(30, 70) + Math.round(-ry * bias);
		const bottomRightY = 100 - (randomInt(30, 70) + Math.round(ry * bias));

		const clamp = (v) => Math.min(80, Math.max(20, v));
		return `${clamp(topLeftX)}% ${clamp(topRightX)}% ${clamp(bottomLeftX)}% ${clamp(bottomRightX)}% / ${clamp(topLeftY)}% ${clamp(topRightY)}% ${clamp(bottomLeftY)}% ${clamp(bottomRightY)}%`;
	}

	function applyBiasedShape(bitNode, rx, ry) {
		bitNode.style.setProperty("--liquid-shape-0", createBiasedLiquidShape(rx, ry));
		bitNode.style.setProperty("--liquid-offset-x", `${(rx * 3).toFixed(1)}px`);
		bitNode.style.setProperty("--liquid-offset-y", `${(ry * 3).toFixed(1)}px`);
	}

	function onLiquidPointerMove(event, bitNode) {
		if (!bitNode.classList.contains("liquid-live")) {
			return;
		}
		const rect = bitNode.getBoundingClientRect();
		const rx = Math.max(-1, Math.min(1, (event.clientX - rect.left - rect.width / 2) / (rect.width / 2)));
		const ry = Math.max(-1, Math.min(1, (event.clientY - rect.top - rect.height / 2) / (rect.height / 2)));
		pointerPositions.set(bitNode, { rx, ry });
		if (!moveFramePending.get(bitNode)) {
			moveFramePending.set(bitNode, true);
			requestAnimationFrame(() => {
				const pos = pointerPositions.get(bitNode);
				if (pos) {
					applyBiasedShape(bitNode, pos.rx, pos.ry);
				}
				moveFramePending.delete(bitNode);
			});
		}
	}

	function clearPointerBias(bitNode) {
		pointerPositions.delete(bitNode);
		moveFramePending.delete(bitNode);
		bitNode.style.setProperty("--liquid-offset-x", "0px");
		bitNode.style.setProperty("--liquid-offset-y", "0px");
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
		clearPointerBias(bitNode);
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
		clearPointerBias(bitNode);
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
				onLiquidPointerMove(event, bitNode);
			}
		});

		bitNode.addEventListener("pointerleave", () => {
			releaseLiquid(bitNode);
		});

		bitNode.addEventListener("pointerdown", (event) => {
			startLiquid(bitNode, event.pointerType);
			onLiquidPointerMove(event, bitNode);
		});

		bitNode.addEventListener("pointermove", (event) => {
			onLiquidPointerMove(event, bitNode);
		});

		bitNode.addEventListener("pointerup", (event) => {
			releaseLiquid(bitNode);
		});

		bitNode.addEventListener("pointercancel", (event) => {
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
	if (controls.lsbToggle) {
		controls.lsbToggle.addEventListener("change", toggleLSB);
	}
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
	if (digitalPanel) {
		digitalPanel.addEventListener("click", toggleTimeFormat);
		digitalPanel.addEventListener("keydown", (event) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				toggleTimeFormat();
			}
		});
	}
	wireAutoOrientationListeners();
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
	applyAutoOrientation();
	applyModeJitterDelays();
	document.body.classList.add("page-assembling");
	window.setTimeout(() => {
		document.body.classList.remove("page-assembling");
	}, PAGE_ASSEMBLY_WINDOW_MS);
	startClock();
}
