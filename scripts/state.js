export const state = {
	mode: "6-bit",
	show24HourFormat: true,
	helpVisible: false,
	digitalVisible: false,
	theme: "classic-rgb-neon",
	modeTransitioning: false,
	transitionTargetMode: null,
	transitionTimeoutId: null,
	transitionArmId: null,
	transitionActivateId: null,
	themeMotionTimeoutId: null,
	pendingTick: null,
	intervalId: null
};
