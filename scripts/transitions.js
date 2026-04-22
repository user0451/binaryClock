import { MODE_TRANSITION_WINDOW_MS, ORIENTATION_TRANSITION_WINDOW_MS, THEME_FADE_DURATION_MS, THEME_FADE_START_MS, THEME_MOTION_WINDOW_MS } from "./config.js";
import { clockElement, controls } from "./dom.js";
import { applyModeJitterDelays, getCurrentTimeValues, runTick, updateTimeDisplay, updateTimeDisplayForMode } from "./display.js";
import { state } from "./state.js";
import { persistState, setModeLabel, setOrientationLabel } from "./ui.js";

const THEME_TRANSITION_PROPS = [
	"--surface-bg",
	"--surface-card",
	"--theme-bg-glow",
	"--theme-accent-color",
	"--help-plus-color",
	"--help-plus-glow",
	"--help-annotation-bg",
	"--help-annotation-shadow",
	"--help-anchor-color",
	"--hours-on",
	"--minutes-on",
	"--seconds-on",
	"--hours-glow",
	"--minutes-glow",
	"--seconds-glow"
];

function syncHelpRowTransitionClass() {
	document.body.classList.toggle("help-rows-transitioning", state.modeTransitioning || Boolean(state.orientationTransitionTimeoutId));
}

function setThemeFadeSnapshot(snapshot) {
	THEME_TRANSITION_PROPS.forEach((prop) => {
		document.body.style.setProperty(`--theme-fade${prop.slice(1)}`, snapshot[prop]);
	});
	document.body.style.setProperty("--theme-fade-start", `${THEME_FADE_START_MS}ms`);
	document.body.style.setProperty("--theme-fade-duration", `${THEME_FADE_DURATION_MS}ms`);
}

function clearThemeFadeSnapshot() {
	THEME_TRANSITION_PROPS.forEach((prop) => {
		document.body.style.removeProperty(`--theme-fade${prop.slice(1)}`);
	});
	document.body.style.removeProperty("--theme-fade-start");
	document.body.style.removeProperty("--theme-fade-duration");
	document.body.classList.remove("theme-transitioning");
}

function captureThemeSnapshot() {
	const styles = window.getComputedStyle(document.documentElement);
	return THEME_TRANSITION_PROPS.reduce((snapshot, prop) => {
		snapshot[prop] = styles.getPropertyValue(prop).trim();
		return snapshot;
	}, {});
}

function clearTransitionClasses() {
	document.body.classList.remove("mode-transitioning", "to-4bit", "to-6bit");
	syncHelpRowTransitionClass();
}

export function stopThemeMotionBurst() {
	if (!state.themeMotionTimeoutId) {
		clearThemeFadeSnapshot();
		return;
	}
	window.clearTimeout(state.themeMotionTimeoutId);
	state.themeMotionTimeoutId = null;
	clearThemeFadeSnapshot();
	if (!state.modeTransitioning) {
		clearTransitionClasses();
	}
}

export function runThemeMotionBurst(applyThemeChange) {
	if (state.modeTransitioning) {
		if (typeof applyThemeChange === "function") {
			applyThemeChange();
		}
		return;
	}

	if (state.themeMotionTimeoutId) {
		window.clearTimeout(state.themeMotionTimeoutId);
		state.themeMotionTimeoutId = null;
	}

	const previousThemeSnapshot = captureThemeSnapshot();
	if (typeof applyThemeChange === "function") {
		applyThemeChange();
	}

	applyModeJitterDelays();
	setThemeFadeSnapshot(previousThemeSnapshot);
	clearTransitionClasses();

	const modeClass = state.mode === "4-bit" ? "to-4bit" : "to-6bit";
	void clockElement.offsetWidth;
	document.body.classList.add("mode-transitioning", modeClass);
	document.body.classList.add("theme-transitioning");

	state.themeMotionTimeoutId = window.setTimeout(() => {
		state.themeMotionTimeoutId = null;
		clearThemeFadeSnapshot();
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
	syncHelpRowTransitionClass();
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
	syncHelpRowTransitionClass();
	setModeLabel();
	runTick();
}

export function transitionToOrientation(targetOrientation) {
	if (state.orientationTransitionTimeoutId) {
		window.clearTimeout(state.orientationTransitionTimeoutId);
		state.orientationTransitionTimeoutId = null;
		document.body.classList.remove("orientation-transitioning", "to-horizontal", "to-vertical");
	}
	if (state.orientationTransitionArmId) {
		window.cancelAnimationFrame(state.orientationTransitionArmId);
		state.orientationTransitionArmId = null;
	}
	if (state.orientationTransitionActivateId) {
		window.cancelAnimationFrame(state.orientationTransitionActivateId);
		state.orientationTransitionActivateId = null;
	}

	applyModeJitterDelays();

	const dirClass = targetOrientation === "horizontal" ? "to-horizontal" : "to-vertical";
	void clockElement.offsetWidth;
	document.body.classList.add("orientation-transitioning", dirClass);

	state.orientationTransitionArmId = window.requestAnimationFrame(() => {
		state.orientationTransitionActivateId = window.requestAnimationFrame(() => {
			document.body.classList.toggle("bits-horizontal", targetOrientation === "horizontal");
			state.orientationTransitionArmId = null;
			state.orientationTransitionActivateId = null;
		});
	});

	state.orientationTransitionTimeoutId = window.setTimeout(() => {
		state.orientationTransitionTimeoutId = null;
		document.body.classList.remove("orientation-transitioning", "to-horizontal", "to-vertical");
		syncHelpRowTransitionClass();
	}, ORIENTATION_TRANSITION_WINDOW_MS);
	syncHelpRowTransitionClass();
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
	controls.modeLabel.textContent = targetMode;
	document.body.classList.add("mode-transitioning", targetMode === "4-bit" ? "to-4bit" : "to-6bit");
	syncHelpRowTransitionClass();

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
