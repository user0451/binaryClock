/**
 * Bit-Clicking Game Logic
 *
 * Uses SECONDS, then MINUTES, as the interactive game canvas.
 * Hours/minutes continue showing real time.
 * In 6-bit mode: L1-L3 unlock seconds (4-6 bits), then L4-L9 unlock minutes.
 * In 4-bit mode: progression is capped by available 8 interactive bits.
 */

import { HELP_WEIGHTS } from "./config.js";
import { gameHUD, quizHUD, sixBitNodes, tipHUD } from "./dom.js";
import { state } from "./state.js";

let feedbackTimer = null;
let questionStartedAt = Date.now();

// ---------------------------------------------------------------------------
// Help tips — shown after 3 consecutive wrong answers in bit-clicking mode
// ---------------------------------------------------------------------------

const BIT_TIPS = {
	missedBit: [
		"Odd/even check: if the 1 bit (LSB) is on, the answer must be odd.",
		"Use the LSB as a fast parity check before you submit.",
		"If the target parity is wrong, fix the 1 bit first.",
		"The LSB decides odd vs even instantly.",
	],
	overshotBit: [
		"You overshot: start from the MSB and only keep it if you still fit.",
		"Turn on large bits carefully; the MSB alone can add a big jump.",
		"If your total is too high, clear the highest lit bit first.",
		"Build up value from largest to smallest to avoid overshooting.",
	],
	slowResponse: [
		"Try pattern recognition: 7, 15, and 31 are all lower bits on.",
		"Chunk the sum into groups instead of calculating each bit from scratch.",
		"Use a quick mental flow: MSB check -> remainder -> next bit.",
		"Practice a top-down scan to speed up your decisions.",
	],
	undershotBit: [
		"You were low: check if a larger bit should be on.",
		"If you are under target, try enabling the next highest useful bit.",
		"Large misses below target usually mean a missing high-value bit.",
	],
	nearMiss: [
		"Close one: compare against target and adjust one bit at a time.",
		"Near miss usually means one wrong bit toggle.",
		"When you are off by 1, check the LSB first.",
	],
	largeMiss: [
		"Big gap: break the target into powers of two before toggling.",
		"Estimate range first, then place the biggest matching bit.",
		"Think binary decomposition: target = sum of active bit weights.",
	],
	streakRecovery: [
		"Reset calmly: accuracy first, speed second.",
		"Use a consistent method each round to reduce repeat mistakes.",
		"Read, plan, then toggle. A steady routine improves streaks.",
	],
	general: [
		"Each bit is a power of two: 1, 2, 4, 8, 16, 32.",
		"If all bits are off, the value is 0.",
		"If all active bits are on, the value is 2^n - 1.",
		"Each extra bit doubles the representable range.",
	],
};

const TIP_CATEGORY_LABELS = {
	missedBit: "Parity Check",
	overshotBit: "Overshot",
	slowResponse: "Speed Pattern",
	undershotBit: "Undershot",
	nearMiss: "Near Miss",
	largeMiss: "Big Gap",
	streakRecovery: "Streak Recovery",
	general: "Binary Tip",
};

let consecutiveWrong = 0;
let tipTimer = null;
let recentMistakeCounts = {
	missedBit: 0,
	overshotBit: 0,
	slowResponse: 0,
	undershotBit: 0,
	nearMiss: 0,
	largeMiss: 0,
	streakRecovery: 0,
};

function resetMistakeCounters() {
	recentMistakeCounts = {
		missedBit: 0,
		overshotBit: 0,
		slowResponse: 0,
		undershotBit: 0,
		nearMiss: 0,
		largeMiss: 0,
		streakRecovery: 0,
	};
}

function addMistakeSignals(categories) {
	for (const category of categories) {
		if (Object.hasOwn(recentMistakeCounts, category)) {
			recentMistakeCounts[category] += 1;
		}
	}
}

function pickTopMistakeCategory() {
	let topCategory = "general";
	let topCount = 0;
	for (const [category, count] of Object.entries(recentMistakeCounts)) {
		if (count > topCount) {
			topCategory = category;
			topCount = count;
		}
	}
	return topCategory;
}

function getSlowThresholdMs() {
	return Math.max(4500, getLevelBitCount() * 1200);
}

function categorizeMistake(player, target, elapsedMs) {
	const categories = [];
	const diff = player - target;
	const absDiff = Math.abs(diff);

	if ((player & 1) !== (target & 1)) {
		categories.push("missedBit");
	}

	if (diff > 0) {
		categories.push("overshotBit");
	} else if (diff < 0) {
		categories.push("undershotBit");
	}

	if (elapsedMs >= getSlowThresholdMs()) {
		categories.push("slowResponse");
	}

	if (absDiff > 0 && absDiff <= 2) {
		categories.push("nearMiss");
	}

	const maxValue = Math.max(1, getMaxValue());
	if (absDiff >= Math.ceil(maxValue * 0.45)) {
		categories.push("largeMiss");
	}

	if (consecutiveWrong >= 2) {
		categories.push("streakRecovery");
	}

	if (categories.length === 0) {
		categories.push("general");
	}

	return categories;
}

function showHelpTip(category = "general") {
	if (!tipHUD) return;
	if (tipTimer) {
		clearTimeout(tipTimer);
		tipTimer = null;
	}
	const source = BIT_TIPS[category] ?? BIT_TIPS.general;
	const tip = source[Math.floor(Math.random() * source.length)];
	const label = TIP_CATEGORY_LABELS[category] ?? TIP_CATEGORY_LABELS.general;
	tipHUD.setAttribute("data-tip-label", label);
	tipHUD.textContent = tip;
	tipHUD.setAttribute("aria-label", `${label}: ${tip}`);
	tipHUD.setAttribute("aria-hidden", "false");
	tipHUD.classList.add("tip-visible");
	tipTimer = setTimeout(() => {
		tipHUD.classList.remove("tip-visible");
		tipTimer = setTimeout(() => {
			tipHUD.setAttribute("aria-hidden", "true");
			tipTimer = null;
		}, 400);
	}, 14600);
}

function clearHelpTip() {
	if (tipTimer) {
		clearTimeout(tipTimer);
		tipTimer = null;
	}
	if (tipHUD) {
		tipHUD.classList.remove("tip-visible");
		tipHUD.setAttribute("aria-hidden", "true");
		tipHUD.removeAttribute("data-tip-label");
		tipHUD.removeAttribute("aria-label");
	}
	consecutiveWrong = 0;
	resetMistakeCounters();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBitClickingColumnIndices() {
	const isSixBit = state.mode === "6-bit";
	return isSixBit ? [5, 4, 3, 2, 1, 0] : [5, 4, 3, 2];
}

function getBitClickingOrderedNodes() {
	const indices = getBitClickingColumnIndices();
	const ordered = [];

	for (const idx of indices) {
		ordered.push(sixBitNodes.seconds[idx]);
	}
	for (const idx of indices) {
		ordered.push(sixBitNodes.minutes[idx]);
	}

	return ordered;
}

function getBitClickingNodes() {
	return [...sixBitNodes.seconds, ...sixBitNodes.minutes];
}

function getBitNodeWeight(node) {
	const secondsIndex = sixBitNodes.seconds.indexOf(node);
	if (secondsIndex !== -1) return HELP_WEIGHTS[secondsIndex];

	const minutesIndex = sixBitNodes.minutes.indexOf(node);
	if (minutesIndex !== -1) return HELP_WEIGHTS[minutesIndex];

	return 0;
}

function getActiveBitNodes() {
	const ordered = getBitClickingOrderedNodes();
	return ordered.slice(0, getLevelBitCount());
}

function getBitClickingMaxLevel() {
	return Math.max(1, getBitClickingOrderedNodes().length - 3);
}

function syncBitClickingBodyClasses() {
	const perColumnBits = getBitClickingColumnIndices().length;
	const minutesActive = getLevelBitCount() > perColumnBits;
	document.body.classList.toggle("game-minutes-active", minutesActive);
}

/** Number of active bits for the current level and clock mode. */
function getLevelBitCount() {
	return Math.min(3 + state.gameLevel, getBitClickingOrderedNodes().length);
}

/** Max target value for current level / mode. */
function getMaxValue() {
	return getActiveBitNodes().reduce((sum, node) => sum + getBitNodeWeight(node), 0);
}

function randomTargetExcluding(maxValue, previousValue) {
	if (maxValue <= 0) return 0;
	const next = Math.floor(Math.random() * maxValue);
	return next >= previousValue ? next + 1 : next;
}

/** Read the decimal value the player has currently set in active game bits. */
function readPlayerValue() {
	const nodes = getActiveBitNodes();
	let value = 0;
	for (const node of nodes) {
		if (node.classList.contains("on")) {
			value += getBitNodeWeight(node);
		}
	}
	return value;
}

/** Remove all transient game classes from interactive game nodes. */
function clearGameClasses() {
	getBitClickingNodes().forEach((node) => {
		node.classList.remove("on", "game-bit-correct", "game-bit-incorrect", "game-bit-inactive");
	});
}

/** Apply inactive styling to bits that are out of range for the current level. */
function markInactiveBits() {
	const activeNodes = new Set(getActiveBitNodes());
	for (const node of getBitClickingNodes()) {
		node.classList.toggle("game-bit-inactive", !activeNodes.has(node));
	}
	syncBitClickingBodyClasses();
}

/** Flash the active bits correct (green) or incorrect (red). */
function flashBitFeedback(isCorrect) {
	const cls = isCorrect ? "game-bit-correct" : "game-bit-incorrect";
	for (const node of getActiveBitNodes()) {
		node.classList.add(cls);
	}
}

function clearFeedbackClasses() {
	getBitClickingNodes().forEach((node) => {
		node.classList.remove("game-bit-correct", "game-bit-incorrect");
	});
}

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------

export function updateGameHUD() {
	if (!gameHUD.panel) return;
	const player = readPlayerValue();
	if (gameHUD.targetDisplay) {
		gameHUD.targetDisplay.textContent = String(state.gameTargetValue ?? 0);
	}
	if (gameHUD.playerDisplay) {
		gameHUD.playerDisplay.textContent = String(player);
	}
	if (gameHUD.scoreDisplay) {
		gameHUD.scoreDisplay.textContent = String(state.gameScore);
	}
	if (gameHUD.levelDisplay) {
		gameHUD.levelDisplay.textContent = `L${state.gameLevel}`;
	}
	// Highlight the HUD when the player has matched the target
	gameHUD.panel.classList.toggle("game-hud-match", player === state.gameTargetValue);
}

// ---------------------------------------------------------------------------
// Question lifecycle
// ---------------------------------------------------------------------------

export function generateNewQuestion() {
	if (feedbackTimer) {
		clearTimeout(feedbackTimer);
		feedbackTimer = null;
	}
	clearGameClasses();
	markInactiveBits();

	const maxValue = getMaxValue();
	const previousValue = state.gameTargetValue;
	state.gameTargetValue = randomTargetExcluding(maxValue, previousValue);
	questionStartedAt = Date.now();
	updateGameHUD();
}

// ---------------------------------------------------------------------------
// Bit interaction
// ---------------------------------------------------------------------------

/** Called when a bit node is clicked while bit-clicking game is active. */
export function handleGameBitClick(bitNode) {
	if (!state.gameActive || state.gameMode !== "bit-clicking") return;
	// Ignore inactive bits and bits outside the active game columns
	if (bitNode.classList.contains("game-bit-inactive")) return;
	if (!getBitClickingNodes().includes(bitNode)) return;
	// Ignore during feedback (brief lock-out)
	if (feedbackTimer !== null) return;

	bitNode.classList.toggle("on");
	updateGameHUD();
}

// ---------------------------------------------------------------------------
// Answer submission
// ---------------------------------------------------------------------------

export function submitGameAnswer() {
	if (!state.gameActive || state.gameMode !== "bit-clicking") return;
	// Already waiting for feedback – don't double-submit
	if (feedbackTimer !== null) return;

	const player = readPlayerValue();
	const isCorrect = player === state.gameTargetValue;

	flashBitFeedback(isCorrect);

	if (isCorrect) {
		consecutiveWrong = 0;
		resetMistakeCounters();
		state.gameScore += 10 + state.gameStreak * 2;
		state.gameStreak++;
	} else {
		state.gameStreak = 0;
		state.gameScore = Math.max(0, state.gameScore - 2);
		const elapsedMs = Date.now() - questionStartedAt;
		addMistakeSignals(categorizeMistake(player, state.gameTargetValue, elapsedMs));
		consecutiveWrong++;
		if (consecutiveWrong >= 3) {
			showHelpTip(pickTopMistakeCategory());
			consecutiveWrong = 0;
			resetMistakeCounters();
		}
	}
	state.gameQuestionsAnswered++;

	// Level up every 10 questions.
	// In 6-bit mode this reaches L9 (seconds first, then minutes).
	const maxLevel = getBitClickingMaxLevel();
	if (state.gameQuestionsAnswered % 10 === 0) {
		state.gameLevel = Math.min(state.gameLevel + 1, maxLevel);
	}

	updateGameHUD();

	feedbackTimer = setTimeout(() => {
		feedbackTimer = null;
		clearFeedbackClasses();
		generateNewQuestion();
	}, isCorrect ? 1000 : 1500);
}

// ---------------------------------------------------------------------------
// Session start / stop
// ---------------------------------------------------------------------------

export function startBitClickingGame() {
	clearHelpTip();
	state.gameScore = 0;
	state.gameLevel = 1;
	state.gameQuestionsAnswered = 0;
	state.gameStreak = 0;
	state.gameTargetValue = 0;

	generateNewQuestion();

	if (gameHUD.panel) {
		gameHUD.panel.setAttribute("aria-hidden", "false");
	}
}

export function stopBitClickingGame() {
	if (feedbackTimer) {
		clearTimeout(feedbackTimer);
		feedbackTimer = null;
	}
	clearHelpTip();
	clearGameClasses();
	document.body.classList.remove("game-minutes-active");

	if (gameHUD.panel) {
		gameHUD.panel.setAttribute("aria-hidden", "true");
		gameHUD.panel.classList.remove("game-hud-match");
	}
}

// ===========================================================================
// QUIZ MODE
// ===========================================================================

const QUIZ_LEVEL_CONFIG = [
	{ bits: 4, type: "decimal-to-binary", timerSec: 0 },  // L1
	{ bits: 4, type: "binary-to-decimal", timerSec: 0 },  // L2
	{ bits: 5, type: "decimal-to-binary", timerSec: 0 },  // L3
	{ bits: 5, type: "binary-to-decimal", timerSec: 0 },  // L4
	{ bits: 6, type: "decimal-to-binary", timerSec: 0 },  // L5
	{ bits: 6, type: "binary-to-decimal", timerSec: 0 },  // L6
	{ bits: 6, type: "mixed",             timerSec: 15 }, // L7
	{ bits: 6, type: "mixed",             timerSec: 10 }, // L8
];
const QUIZ_MAX_LEVEL = QUIZ_LEVEL_CONFIG.length;
const QUIZ_QUESTIONS_PER_LEVEL = 10;

let quizTimerInterval = null;
let quizQuestionType = null;
let quizFeedbackTimer = null;
let quizGameOver = false;

function getQuizConfig() {
	return QUIZ_LEVEL_CONFIG[Math.min(state.gameLevel - 1, QUIZ_MAX_LEVEL - 1)];
}

function getQuizBitCount() {
	const maxBits = state.mode === "6-bit" ? 6 : 4;
	return Math.min(getQuizConfig().bits, maxBits);
}

function getQuizStartIndex() {
	return 6 - getQuizBitCount();
}

function getQuizMaxValue() {
	return (1 << getQuizBitCount()) - 1;
}

function setQuizBitsToValue(value) {
	const nodes = sixBitNodes.seconds;
	const start = getQuizStartIndex();
	for (let i = 0; i < start; i++) {
		nodes[i].classList.remove("on");
		nodes[i].classList.add("game-bit-inactive");
	}
	for (let i = start; i < 6; i++) {
		nodes[i].classList.remove("game-bit-inactive", "game-bit-correct", "game-bit-incorrect");
		nodes[i].classList.toggle("on", (value & HELP_WEIGHTS[i]) !== 0);
	}
}

function clearQuizBits() {
	sixBitNodes.seconds.forEach(n => {
		n.classList.remove("on", "game-bit-correct", "game-bit-incorrect", "game-bit-inactive");
	});
}

function flashQuizBitFeedback(isCorrect) {
	const cls = isCorrect ? "game-bit-correct" : "game-bit-incorrect";
	const start = getQuizStartIndex();
	for (let i = start; i < 6; i++) {
		sixBitNodes.seconds[i].classList.add(cls);
	}
}

function clearQuizFeedbackClasses() {
	sixBitNodes.seconds.forEach(n => n.classList.remove("game-bit-correct", "game-bit-incorrect"));
}

function readQuizPlayerBits() {
	const nodes = sixBitNodes.seconds;
	const start = getQuizStartIndex();
	let value = 0;
	for (let i = start; i < 6; i++) {
		if (nodes[i].classList.contains("on")) value += HELP_WEIGHTS[i];
	}
	return value;
}

function stopQuizTimer() {
	if (quizTimerInterval) { clearInterval(quizTimerInterval); quizTimerInterval = null; }
	if (quizHUD.timerFill) quizHUD.timerFill.style.width = "0%";
	if (quizHUD.timerTrack) quizHUD.timerTrack.classList.remove("quiz-timer-warning");
}

function startQuizTimer(seconds) {
	stopQuizTimer();
	const totalTicks = seconds * 10;
	let remaining = totalTicks;
	if (quizHUD.timerFill) quizHUD.timerFill.style.width = "100%";
	if (quizHUD.timerTrack) quizHUD.timerTrack.setAttribute("aria-hidden", "false");
	quizTimerInterval = setInterval(() => {
		remaining--;
		const pct = ((remaining / totalTicks) * 100).toFixed(1) + "%";
		if (quizHUD.timerFill) quizHUD.timerFill.style.width = pct;
		if (quizHUD.timerTrack) {
			quizHUD.timerTrack.classList.toggle("quiz-timer-warning", remaining <= totalTicks * 0.35);
		}
		if (remaining <= 0) { stopQuizTimer(); handleQuizTimeout(); }
	}, 100);
}

function handleQuizTimeout() {
	if (quizFeedbackTimer !== null) return;
	state.gameStreak = 0;
	state.gameScore = Math.max(0, state.gameScore - 2);
	state.gameQuestionsAnswered++;
	if (state.gameQuestionsAnswered % QUIZ_QUESTIONS_PER_LEVEL === 0 && state.gameLevel >= QUIZ_MAX_LEVEL) {
		updateQuizHUD();
		showQuizSummary();
		return;
	}
	if (state.gameQuestionsAnswered % QUIZ_QUESTIONS_PER_LEVEL === 0) {
		state.gameLevel = Math.min(state.gameLevel + 1, QUIZ_MAX_LEVEL);
	}
	if (quizQuestionType === "decimal-to-binary") setQuizBitsToValue(state.gameTargetValue);
	flashQuizBitFeedback(false);
	updateQuizHUD();
	quizFeedbackTimer = setTimeout(() => {
		quizFeedbackTimer = null;
		clearQuizFeedbackClasses();
		generateQuizQuestion();
	}, 1500);
}

function setQuizBodyType(type) {
	document.body.classList.remove("quiz-type-decimal-to-binary", "quiz-type-binary-to-decimal");
	if (type) document.body.classList.add(`quiz-type-${type}`);
}

export function updateQuizHUD() {
	if (!quizHUD.panel) return;
	if (quizHUD.scoreDisplay) quizHUD.scoreDisplay.textContent = String(state.gameScore);
	if (quizHUD.levelDisplay) quizHUD.levelDisplay.textContent = `L${state.gameLevel}`;
	const qInLevel = (state.gameQuestionsAnswered % QUIZ_QUESTIONS_PER_LEVEL) + 1;
	if (quizHUD.progress) quizHUD.progress.textContent = `${qInLevel}/${QUIZ_QUESTIONS_PER_LEVEL}`;
}

export function generateQuizQuestion() {
	if (quizGameOver) return;
	if (quizFeedbackTimer) { clearTimeout(quizFeedbackTimer); quizFeedbackTimer = null; }
	stopQuizTimer();
	clearQuizBits();

	const config = getQuizConfig();
	quizQuestionType = config.type === "mixed"
		? (state.gameQuestionsAnswered % 2 === 0 ? "decimal-to-binary" : "binary-to-decimal")
		: config.type;

	setQuizBodyType(quizQuestionType);
	const maxValue = getQuizMaxValue();
	const previousValue = state.gameTargetValue;
	state.gameTargetValue = randomTargetExcluding(maxValue, previousValue);

	if (quizQuestionType === "decimal-to-binary") {
		const start = getQuizStartIndex();
		for (let i = 0; i < start; i++) sixBitNodes.seconds[i].classList.add("game-bit-inactive");
		if (quizHUD.valueDisplay) quizHUD.valueDisplay.textContent = String(state.gameTargetValue);
		if (quizHUD.panel) quizHUD.panel.dataset.type = "decimal-to-binary";
		if (quizHUD.label) quizHUD.label.textContent = "bin";
	} else {
		setQuizBitsToValue(state.gameTargetValue);
		if (quizHUD.input) { quizHUD.input.value = ""; requestAnimationFrame(() => quizHUD.input.focus()); }
		if (quizHUD.panel) quizHUD.panel.dataset.type = "binary-to-decimal";
		if (quizHUD.label) quizHUD.label.textContent = "dec";
	}
	if (quizHUD.submitButton) {
		quizHUD.submitButton.disabled = false;
		quizHUD.submitButton.textContent = "✓";
	}

	if (config.timerSec > 0) startQuizTimer(config.timerSec);
	updateQuizHUD();
}

export function handleQuizBitClick(bitNode) {
	if (!state.gameActive || state.gameMode !== "quiz") return;
	if (quizGameOver) return;
	if (quizQuestionType !== "decimal-to-binary") return;
	if (bitNode.classList.contains("game-bit-inactive")) return;
	if (!sixBitNodes.seconds.includes(bitNode)) return;
	if (quizFeedbackTimer !== null) return;
	bitNode.classList.toggle("on");
}

function showQuizSummary() {
	quizGameOver = true;
	stopQuizTimer();
	setQuizBodyType(null);

	if (quizHUD.panel) quizHUD.panel.dataset.type = "summary";
	if (quizHUD.label) quizHUD.label.textContent = "score";
	if (quizHUD.valueDisplay) quizHUD.valueDisplay.textContent = String(state.gameScore);
	if (quizHUD.progress) quizHUD.progress.textContent = "Complete";
	if (quizHUD.levelDisplay) quizHUD.levelDisplay.textContent = `L${QUIZ_MAX_LEVEL}`;
	if (quizHUD.submitButton) {
		quizHUD.submitButton.disabled = true;
		quizHUD.submitButton.textContent = "Done";
	}
}

export function submitQuizAnswer() {
	if (!state.gameActive || state.gameMode !== "quiz") return;
	if (quizGameOver) return;
	if (quizFeedbackTimer !== null) return;
	stopQuizTimer();

	let isCorrect = false;
	if (quizQuestionType === "decimal-to-binary") {
		isCorrect = readQuizPlayerBits() === state.gameTargetValue;
		if (!isCorrect) setQuizBitsToValue(state.gameTargetValue);
	} else {
		const inputVal = parseInt(quizHUD.input?.value ?? "", 10);
		isCorrect = !isNaN(inputVal) && inputVal === state.gameTargetValue;
		if (quizHUD.input) quizHUD.input.value = "";
	}

	flashQuizBitFeedback(isCorrect);

	if (isCorrect) {
		state.gameScore += 10 + state.gameStreak * 2;
		state.gameStreak++;
	} else {
		state.gameStreak = 0;
		state.gameScore = Math.max(0, state.gameScore - 2);
	}
	state.gameQuestionsAnswered++;

	if (state.gameQuestionsAnswered % QUIZ_QUESTIONS_PER_LEVEL === 0) {
		if (state.gameLevel >= QUIZ_MAX_LEVEL) {
			updateQuizHUD();
			showQuizSummary();
			return;
		}
		state.gameLevel = Math.min(state.gameLevel + 1, QUIZ_MAX_LEVEL);
	}

	updateQuizHUD();
	quizFeedbackTimer = setTimeout(() => {
		quizFeedbackTimer = null;
		clearQuizFeedbackClasses();
		generateQuizQuestion();
	}, isCorrect ? 1000 : 1500);
}

export function startQuizGame() {
	state.gameScore = 0;
	state.gameLevel = 1;
	state.gameQuestionsAnswered = 0;
	state.gameStreak = 0;
	state.gameTargetValue = 0;
	quizQuestionType = null;
	quizGameOver = false;
	generateQuizQuestion();
	if (quizHUD.panel) quizHUD.panel.setAttribute("aria-hidden", "false");
}

export function stopQuizGame() {
	stopQuizTimer();
	if (quizFeedbackTimer) { clearTimeout(quizFeedbackTimer); quizFeedbackTimer = null; }
	clearQuizBits();
	setQuizBodyType(null);
	quizQuestionType = null;
	quizGameOver = false;
	if (quizHUD.panel) {
		quizHUD.panel.setAttribute("aria-hidden", "true");
		quizHUD.panel.dataset.type = "decimal-to-binary";
	}
	if (quizHUD.submitButton) {
		quizHUD.submitButton.disabled = false;
		quizHUD.submitButton.textContent = "✓";
	}
}
