import { MODE_TRANSITION_WINDOW_MS, THEME_MOTION_WINDOW_MS } from "./config.js";
import { clockElement } from "./dom.js";
import { applyModeJitterDelays, getCurrentTimeValues, runTick, updateTimeDisplay, updateTimeDisplayForMode } from "./display.js";
import { state } from "./state.js";
import { persistState, setModeLabel } from "./ui.js";

function clearTransitionClasses() {
	document.body.classList.remove("mode-transitioning", "to-4bit", "to-6bit");
}

export function stopThemeMotionBurst() {
	if (!state.themeMotionTimeoutId) {
		return;
	}
	window.clearTimeout(state.themeMotionTimeoutId);
	state.themeMotionTimeoutId = null;
	if (!state.modeTransitioning) {
		clearTransitionClasses();
	}
}

export function runThemeMotionBurst() {
	if (state.modeTransitioning) {
		return;
	}

	if (state.themeMotionTimeoutId) {
		window.clearTimeout(state.themeMotionTimeoutId);
		state.themeMotionTimeoutId = null;
	}

	applyModeJitterDelays();
	clearTransitionClasses();

	const modeClass = state.mode === "4-bit" ? "to-4bit" : "to-6bit";
	void clockElement.offsetWidth;
	document.body.classList.add("mode-transitioning", modeClass);

	state.themeMotionTimeoutId = window.setTimeout(() => {
		state.themeMotionTimeoutId = null;
		if (!state.modeTransitioning) {
			clearTransitionClasses();
		}
	}, THEME_MOTION_WINDOW_MS);
}

function finishModeTransition(targetMode) {
	if (!state.modeTransitioning) {
		return;
	}
	if (state.transitionTimeoutId) {
		window.clearTimeout(state.transitionTimeoutId);
		state.transitionTimeoutId = null;
	}
	if (state.transitionArmId) {
		window.cancelAnimationFrame(state.transitionArmId);
		state.transitionArmId = null;
	}
	if (state.transitionActivateId) {
		window.cancelAnimationFrame(state.transitionActivateId);
		state.transitionActivateId = null;
	}
	state.mode = targetMode;
	state.modeTransitioning = false;
	state.transitionTargetMode = null;
	clearTransitionClasses();
	setModeLabel();
	persistState();

	const latest = state.pendingTick || getCurrentTimeValues();
	state.pendingTick = null;
	updateTimeDisplay(latest);
}

function abortModeTransition() {
	if (!state.modeTransitioning) {
		return;
	}
	if (state.transitionTimeoutId) {
		window.clearTimeout(state.transitionTimeoutId);
		state.transitionTimeoutId = null;
	}
	if (state.transitionArmId) {
		window.cancelAnimationFrame(state.transitionArmId);
		state.transitionArmId = null;
	}
	if (state.transitionActivateId) {
		window.cancelAnimationFrame(state.transitionActivateId);
		state.transitionActivateId = null;
	}

	if (state.transitionTargetMode) {
		state.mode = state.transitionTargetMode;
	}

	state.modeTransitioning = false;
	state.transitionTargetMode = null;
	clearTransitionClasses();
	setModeLabel();
	runTick();
}

export function transitionToMode(targetMode) {
	if (state.modeTransitioning) {
		abortModeTransition();
	}

	if (targetMode === state.mode) {
		return;
	}

	stopThemeMotionBurst();

	applyModeJitterDelays();
	state.modeTransitioning = true;
	state.transitionTargetMode = targetMode;
	document.body.classList.add("mode-transitioning", targetMode === "4-bit" ? "to-4bit" : "to-6bit");

	const instantValues = getCurrentTimeValues();
	state.pendingTick = instantValues;
	updateTimeDisplayForMode(instantValues, targetMode);

	const targetModeAttr = targetMode === "4-bit" ? "4bit" : "6bit";

	let done = false;
	const complete = () => {
		if (done) {
			return;
		}
		done = true;
		finishModeTransition(targetMode);
	};

	void clockElement.offsetWidth;

	state.transitionArmId = window.requestAnimationFrame(() => {
		state.transitionActivateId = window.requestAnimationFrame(() => {
			clockElement.setAttribute("data-mode", targetModeAttr);
		});
	});

	state.transitionTimeoutId = window.setTimeout(complete, MODE_TRANSITION_WINDOW_MS);
}
