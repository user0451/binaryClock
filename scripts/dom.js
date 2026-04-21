export const controls = {
	modeToggle: document.getElementById("modeToggle"),
	modeLabel: document.getElementById("modeLabel"),
	timeFormatToggle: document.getElementById("timeFormatToggle"),
	timeFormatLabel: document.getElementById("timeFormatLabel"),
	helpToggle: document.getElementById("helpToggle"),
	digitalToggle: document.getElementById("digitalToggle"),
	digitalLabel: document.getElementById("digitalLabel"),
	themeSelect: document.getElementById("themeSelect"),
	settingsButton: document.getElementById("settingsButton"),
	settingsOverlay: document.getElementById("settingsOverlay"),
	settingsClose: document.getElementById("settingsClose")
};

export const clockElement = document.querySelector(".clock");
export const allBitNodes = Array.from(document.querySelectorAll(".clock .bit"));
export const totalsPanel = document.querySelector(".totalsPanel");
export const meridiemBadge = document.getElementById("meridiemBadge");

export const totalsNodes = {
	sixBit: {
		hours: document.getElementById("total6-hours"),
		minutes: document.getElementById("total6-minutes"),
		seconds: document.getElementById("total6-seconds")
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
