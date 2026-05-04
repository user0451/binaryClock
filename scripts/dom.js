export const controls = {
	modeToggle: document.getElementById("modeToggle"),
	modeLabel: document.getElementById("modeLabel"),
	lsbToggle: document.getElementById("lsbToggle"),
	lsbLabel: document.getElementById("lsbLabel"),
	timeFormatToggle: document.getElementById("timeFormatToggle"),
	timeFormatLabel: document.getElementById("timeFormatLabel"),
	helpToggle: document.getElementById("helpToggle"),
	orientationToggle: document.getElementById("orientationToggle"),
	orientationLabel: document.getElementById("orientationLabel"),
	digitalToggle: document.getElementById("digitalToggle"),
	digitalLabel: document.getElementById("digitalLabel"),
	scanlinesToggle: document.getElementById("scanlinesToggle"),
	scanlinesLabel: document.getElementById("scanlinesLabel"),
	gameModeToggle: document.getElementById("gameModeToggle"),
	gameModeLabel: document.getElementById("gameModeLabel"),
	gameTypeSelect: document.getElementById("gameTypeSelect"),
	gameTypeOptions: Array.from(document.querySelectorAll(".gameTypeOption")),
	shuffleButton: document.getElementById("shuffleButton"),
	themeSelectDisplay: document.getElementById("themeSelectDisplay"),
	themeSelectList: document.getElementById("themeSelectList"),
	themeSelect: document.getElementById("themeSelect"),
	settingsButton: document.getElementById("settingsButton"),
	settingsOverlay: document.getElementById("settingsOverlay"),
	settingsClose: document.getElementById("settingsClose")
};

export const gameHUD = {
	panel: document.getElementById("gameHUD"),
	targetDisplay: document.getElementById("gameHUDTarget"),
	playerDisplay: document.getElementById("gameHUDPlayer"),
	scoreDisplay: document.getElementById("gameHUDScore"),
	levelDisplay: document.getElementById("gameHUDLevel"),
	submitButton: document.getElementById("gameHUDSubmit")
};

export const quizHUD = {
	panel: document.getElementById("quizHUD"),
	label: document.getElementById("quizHUDLabel"),
	valueDisplay: document.getElementById("quizHUDValue"),
	input: document.getElementById("quizHUDInput"),
	progress: document.getElementById("quizHUDProgress"),
	scoreDisplay: document.getElementById("quizHUDScore"),
	levelDisplay: document.getElementById("quizHUDLevel"),
	submitButton: document.getElementById("quizHUDSubmit"),
	actions: document.getElementById("quizHUDActions"),
	restartButton: document.getElementById("quizHUDRestart"),
	closeButton: document.getElementById("quizHUDClose"),
	timerTrack: document.getElementById("quizHUDTimerTrack"),
	timerFill: document.getElementById("quizHUDTimerFill")
};

export const clockElement = document.querySelector(".clock");
export const allBitNodes = Array.from(document.querySelectorAll(".clock .bit"));
export const helpRowNodes = Array.from(document.querySelectorAll(".clock .helpRows4, .clock .helpRows6"));
export const digitalPanel = document.querySelector(".digitalPanel");
export const meridiemBadge = document.getElementById("meridiemBadge");
export const tipHUD = document.getElementById("tipHUD");
export const tipHUDText = document.getElementById("tipHUDText");
export const quizLivesBitNodes = Array.from(document.querySelectorAll(".quizLivesBit"));

export const digitalNodes = {
	sixBit: {
		hours: document.getElementById("digital-hours"),
		minutes: document.getElementById("digital-minutes"),
		seconds: document.getElementById("digital-seconds")
	}
};

const sixBitSelectors = {
	hours: ["hour1", "hour2", "hour3", "hour4", "hour5", "hour6"],
	minutes: ["minute1", "minute2", "minute3", "minute4", "minute5", "minute6"],
	seconds: ["second1", "second2", "second3", "second4", "second5", "second6"]
};

export const sixBitNodes = {
	hours: sixBitSelectors.hours.map((name) => document.getElementsByClassName(name)[0]),
	minutes: sixBitSelectors.minutes.map((name) => document.getElementsByClassName(name)[0]),
	seconds: sixBitSelectors.seconds.map((name) => document.getElementsByClassName(name)[0])
};
