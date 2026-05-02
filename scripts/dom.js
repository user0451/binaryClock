export const controls = {
	modeToggle: document.getElementById("modeToggle"),
	modeLabel: document.getElementById("modeLabel"),
	timeFormatToggle: document.getElementById("timeFormatToggle"),
	timeFormatLabel: document.getElementById("timeFormatLabel"),
	helpToggle: document.getElementById("helpToggle"),
	orientationToggle: document.getElementById("orientationToggle"),
	orientationLabel: document.getElementById("orientationLabel"),
	digitalToggle: document.getElementById("digitalToggle"),
	digitalLabel: document.getElementById("digitalLabel"),
	scanlinesToggle: document.getElementById("scanlinesToggle"),
	scanlinesLabel: document.getElementById("scanlinesLabel"),
	shuffleButton: document.getElementById("shuffleButton"),
	themeSelectDisplay: document.getElementById("themeSelectDisplay"),
	themeSelectList: document.getElementById("themeSelectList"),
	themeSelect: document.getElementById("themeSelect"),
	settingsButton: document.getElementById("settingsButton"),
	settingsOverlay: document.getElementById("settingsOverlay"),
	settingsClose: document.getElementById("settingsClose")
};

export const clockElement = document.querySelector(".clock");
export const allBitNodes = Array.from(document.querySelectorAll(".clock .bit"));
export const helpRowNodes = Array.from(document.querySelectorAll(".clock .helpRows4, .clock .helpRows6"));
export const digitalPanel = document.querySelector(".digitalPanel");
export const meridiemBadge = document.getElementById("meridiemBadge");

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
