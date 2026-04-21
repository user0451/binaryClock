import { FOUR_BIT_WEIGHTS, HELP_WEIGHTS } from "./config.js";
import { allBitNodes, meridiemBadge, sixBitNodes, totalsNodes } from "./dom.js";
import { state } from "./state.js";

function randomDelayMs(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function applyModeJitterDelays() {
	allBitNodes.forEach((node, index) => {
		const wave = (index % 3) * 18;
		const inDelay = randomDelayMs(0, 170) + wave;
		const outDelay = randomDelayMs(0, 180) + ((2 - (index % 3)) * 14);
		node.style.setProperty("--rand-delay-in", `${inDelay}ms`);
		node.style.setProperty("--rand-delay-out", `${outDelay}ms`);
	});
}

export function getCurrentTimeValues() {
	const now = new Date();
	const hours24 = now.getHours();
	const hours = state.show24HourFormat ? hours24 : (hours24 % 12 || 12);
	return {
		hours,
		minutes: now.getMinutes(),
		seconds: now.getSeconds(),
		meridiem: hours24 >= 12 ? "PM" : "AM"
	};
}

function updateMeridiemBadge(values) {
	if (!meridiemBadge) {
		return;
	}

	const showMeridiem = !state.show24HourFormat;
	meridiemBadge.textContent = values.meridiem;
	meridiemBadge.classList.toggle("is-visible", showMeridiem);
	meridiemBadge.setAttribute("aria-hidden", showMeridiem ? "false" : "true");
}

function applySixBit(unit, value) {
	const list = sixBitNodes[unit];
	for (let i = 0; i < 6; i++) {
		const bitValue = 1 << (5 - i);
		list[i].classList.toggle("on", (value & bitValue) !== 0);
	}
}

function applyFourBit(prefix, value) {
	const tens = Math.floor(value / 10);
	const units = value % 10;
	for (let i = 0; i < 4; i++) {
		const bitValue = 1 << (3 - i);
		document.getElementById(prefix + "Tens" + bitValue).classList.toggle("on", (tens & bitValue) !== 0);
		document.getElementById(prefix + bitValue).classList.toggle("on", (units & bitValue) !== 0);
	}
}

function setBitHelpData(bitNode, contribution, weightLabel) {
	bitNode.dataset.help = String(contribution);
	bitNode.dataset.weight = String(weightLabel);
	bitNode.dataset.activeHelp = contribution > 0 ? "true" : "false";
}

function ensureRollingSlots(node, seedValue) {
	const slots = Array.from(node.querySelectorAll(".digitSlot"));
	if (slots.length === 2) {
		return slots;
	}

	const seed = String(seedValue || "00").padStart(2, "0").slice(-2);
	node.textContent = "";

	for (let i = 0; i < 2; i++) {
		const slot = document.createElement("span");
		slot.className = "digitSlot";
		slot.dataset.digit = seed[i];
		slot.textContent = seed[i];
		node.appendChild(slot);
	}

	return Array.from(node.querySelectorAll(".digitSlot"));
}

function setRollingDigit(slot, nextDigit) {
	const current = slot.dataset.digit;
	if (current === undefined) {
		slot.dataset.digit = nextDigit;
		slot.textContent = nextDigit;
		return;
	}

	if (current === nextDigit) {
		return;
	}

	if (slot._rollTimeoutId) {
		window.clearTimeout(slot._rollTimeoutId);
		slot._rollTimeoutId = null;
	}

	slot.dataset.digit = nextDigit;
	slot.innerHTML = `<span class="digitLayer out">${current}</span><span class="digitLayer in">${nextDigit}</span>`;
	slot._rollTimeoutId = window.setTimeout(() => {
		slot.textContent = nextDigit;
		slot._rollTimeoutId = null;
	}, 380);
}

function setRollingText(node, nextValue) {
	if (!node) {
		return;
	}

	const next = String(nextValue).slice(-2).padStart(2, " ");
	const current = node.dataset.rollValue;
	const slots = ensureRollingSlots(node, current || next);

	if (current === undefined) {
		node.dataset.rollValue = next;
		slots[0].dataset.digit = next[0];
		slots[0].textContent = next[0];
		slots[1].dataset.digit = next[1];
		slots[1].textContent = next[1];
		return;
	}

	if (current === next) {
		return;
	}

	node.dataset.rollValue = next;
	setRollingDigit(slots[0], next[0]);
	setRollingDigit(slots[1], next[1]);
}

function setHelpTotals(values) {
	const hoursText = state.show24HourFormat
		? String(values.hours).padStart(2, "0")
		: String(values.hours).padStart(2, " ");
	setRollingText(totalsNodes.sixBit.hours, hoursText);
	setRollingText(totalsNodes.sixBit.minutes, String(values.minutes).padStart(2, "0"));
	setRollingText(totalsNodes.sixBit.seconds, String(values.seconds).padStart(2, "0"));
}

function updateInlineBitHelp(values, mode) {
	if (mode === "6-bit") {
		Object.keys(sixBitNodes).forEach((unit) => {
			sixBitNodes[unit].forEach((node, index) => {
				const weight = HELP_WEIGHTS[index];
				const contribution = (values[unit] & weight) !== 0 ? weight : 0;
				setBitHelpData(node, contribution, weight);
			});
		});
		setHelpTotals(values);
		return;
	}

	["hours", "minutes", "seconds"].forEach((unit) => {
		const value = values[unit];
		const tens = Math.floor(value / 10);
		const units = value % 10;

		FOUR_BIT_WEIGHTS.forEach((weight) => {
			const tensNode = document.getElementById(`${unit}Tens${weight}`);
			const unitsNode = document.getElementById(`${unit}${weight}`);
			const tensContribution = (tens & weight) !== 0 ? weight : 0;
			const unitsContribution = (units & weight) !== 0 ? weight : 0;
			setBitHelpData(tensNode, tensContribution, weight);
			setBitHelpData(unitsNode, unitsContribution, weight);
		});
	});

	setHelpTotals(values);
}

export function updateTimeDisplayForMode(values, mode) {
	if (mode === "6-bit") {
		applySixBit("hours", values.hours);
		applySixBit("minutes", values.minutes);
		applySixBit("seconds", values.seconds);
	} else {
		applyFourBit("hours", values.hours);
		applyFourBit("minutes", values.minutes);
		applyFourBit("seconds", values.seconds);
	}
	updateMeridiemBadge(values);
	updateInlineBitHelp(values, mode);
}

export function updateTimeDisplay(values) {
	updateTimeDisplayForMode(values, state.mode);
}

export function runTick() {
	const values = getCurrentTimeValues();
	if (state.modeTransitioning) {
		state.pendingTick = values;
		if (state.transitionTargetMode) {
			updateTimeDisplayForMode(values, state.transitionTargetMode);
		}
		return;
	}
	updateTimeDisplay(values);
}
