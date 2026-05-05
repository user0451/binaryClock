/**
 * Bit-Clicking Game Logic
 *
 * Uses SECONDS, then MINUTES, then HOURS as the interactive game canvas.
 * In 6-bit mode: L1-L3 unlock seconds (4-6 bits), L4-L9 unlock minutes, L10-L15 unlock hours.
 * Hours column bits continue the progressive weighting from 4096 to 131072.
 * In 4-bit mode: progression is capped by available 8 interactive bits (seconds only).
 */

import { HELP_WEIGHTS, STORAGE_KEYS } from "./config.js";
import { gameHUD, quizHUD, quizLivesBitNodes, sixBitNodes, tipHUD, tipHUDText } from "./dom.js";
import { state } from "./state.js";

let feedbackTimer = null;
let questionStartedAt = Date.now();
const TIP_TOTAL_VISIBLE_MS = 10000;
const TIP_FADE_MS = 400;

function readStoredInt(key) {
	const rawValue = localStorage.getItem(key);
	if (rawValue === null) return null;
	const parsed = parseInt(rawValue, 10);
	return Number.isFinite(parsed) ? parsed : null;
}

function writeStoredInt(key, value) {
	localStorage.setItem(key, String(value));
}

function formatElapsedMs(milliseconds) {
	const totalTenths = Math.max(0, Math.round(milliseconds / 100));
	const minutes = Math.floor(totalTenths / 600);
	const seconds = Math.floor((totalTenths % 600) / 10);
	const tenths = totalTenths % 10;
	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

let quizHighScore = readStoredInt(STORAGE_KEYS.quizHighScore) ?? 0;
let bitClickingBestTimeMs = readStoredInt(STORAGE_KEYS.bitClickingBestTimeMs);
let bitClickingTimerInterval = null;
let bitClickingStartedAt = null;
let bitClickingElapsedMs = 0;
let bitClickingRunCompleted = false;
let bitClickingCompletionLabel = "Run Complete";
let bitClickingCompletionLine = "";

function renderBitClickingTipHUD(label = "Timer", line = null) {
	if (!tipHUD || !tipHUDText || !state.gameActive || state.gameMode !== "bit-clicking") return;
	const personalBestText = bitClickingBestTimeMs === null
		? "PB --:--.-"
		: `PB ${formatElapsedMs(bitClickingBestTimeMs)}`;
	const hudLine = line ?? `${formatElapsedMs(bitClickingElapsedMs)} • ${personalBestText}`;
	tipHUD.setAttribute("data-tip-label", label);
	tipHUDText.textContent = hudLine;
	tipHUD.setAttribute("aria-label", `${label}: ${hudLine}`);
	tipHUD.setAttribute("aria-hidden", "false");
	tipHUD.classList.add("tip-visible");
}

function restorePersistentTipHUD() {
	if (state.gameActive && state.gameMode === "bit-clicking") {
		if (bitClickingRunCompleted && bitClickingCompletionLine) {
			renderBitClickingTipHUD(bitClickingCompletionLabel, bitClickingCompletionLine);
			return true;
		}
		if (bitClickingStartedAt !== null) {
			renderBitClickingTipHUD("Timer");
			return true;
		}
	}
	return false;
}

function updateBitClickingTimerHUD() {
	if (bitClickingStartedAt === null || bitClickingRunCompleted) return;
	bitClickingElapsedMs = Date.now() - bitClickingStartedAt;
	if (!tipTimer) renderBitClickingTipHUD("Timer");
}

function startBitClickingTimer() {
	if (bitClickingStartedAt !== null || bitClickingRunCompleted) return;
	if (tipTimer) {
		clearTimeout(tipTimer);
		tipTimer = null;
	}
	bitClickingStartedAt = Date.now();
	bitClickingElapsedMs = 0;
	renderBitClickingTipHUD("Timer");
	bitClickingTimerInterval = setInterval(updateBitClickingTimerHUD, 100);
}

function stopBitClickingTimer() {
	if (bitClickingTimerInterval) {
		clearInterval(bitClickingTimerInterval);
		bitClickingTimerInterval = null;
	}
	if (bitClickingStartedAt === null) return null;
	bitClickingElapsedMs = Date.now() - bitClickingStartedAt;
	bitClickingStartedAt = null;
	return bitClickingElapsedMs;
}

function resetBitClickingTimer() {
	stopBitClickingTimer();
	bitClickingElapsedMs = 0;
	bitClickingRunCompleted = false;
	bitClickingCompletionLabel = "Run Complete";
	bitClickingCompletionLine = "";
}

function completeBitClickingRun() {
	const completionMs = stopBitClickingTimer();
	const previousBestTimeMs = bitClickingBestTimeMs;
	const hasMeasuredRun = completionMs !== null;
	const isNewBest = hasMeasuredRun && (previousBestTimeMs === null || completionMs < previousBestTimeMs);

	bitClickingRunCompleted = true;
	if (isNewBest) {
		bitClickingBestTimeMs = completionMs;
		writeStoredInt(STORAGE_KEYS.bitClickingBestTimeMs, completionMs);
	}

	bitClickingCompletionLabel = isNewBest ? "New Best" : "Run Complete";
	bitClickingCompletionLine = !hasMeasuredRun
		? "18-bit run complete. Timer starts on your first bit click."
		: isNewBest
			? `18-bit run ${formatElapsedMs(completionMs)} • New PB`
			: `18-bit run ${formatElapsedMs(completionMs)} • PB ${formatElapsedMs(bitClickingBestTimeMs ?? completionMs)}`;

	renderBitClickingTipHUD(bitClickingCompletionLabel, bitClickingCompletionLine);
}

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
		"You overshot: start from the MSB and only keep it if it still fits.",
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
	bitClickingStart: [
		"Bit Clicking: set the lit bits so your value matches the target, then submit.",
		"Bit Clicking: toggle bits on/off to hit the target number exactly.",
	],
	quizStart: [
		"Quiz: in binary mode, click bits to match the decimal target; in decimal mode, type the decimal value and submit.",
		"Quiz: alternate between building binary and reading binary back to decimal.",
	],
	quizJeopardyRound: [
		"Jeopardy round: one random question is hot. Correct wins +1 life, wrong costs 2 lives.",
		"Jeopardy active: a hidden bonus question can restore a life or take two.",
	],
	quizJeopardyWin: [
		"Jeopardy cleared: +1 life recovered.",
		"Bonus nailed. You earned 1 life back.",
	],
	quizJeopardyFail: [
		"Jeopardy missed: penalty is 2 lives.",
		"Bonus failed. You lost 2 lives.",
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
	bitClickingStart: "How To Play",
	quizStart: "How To Play",
	quizJeopardyRound: "Jeopardy Mode",
	quizJeopardyWin: "Jeopardy Bonus",
	quizJeopardyFail: "Jeopardy Penalty",
	general: "Binary Tip",
};

// Performance feedback messages keyed by grade (0–4, best to worst).
// Grade is determined after each 10-question level window.
const LEVEL_UP_FEEDBACK = {
	perfect: [
		"Flawless! Every answer correct.",
		"Perfect round — not a single mistake!",
		"Clean sweep! 10 out of 10.",
	],
	strong: [
		"Strong round — only a slip or two.",
		"Really solid. Minor mistakes, but great control.",
		"Nearly perfect — nice consistency.",
	],
	steady: [
		"Decent round. A few corrections needed, but steady overall.",
		"More right than wrong — keep building on that.",
		"Reasonable accuracy. The patterns will get easier with practice.",
	],
	shaky: [
		"Struggled a bit — review the bit weights before the next round.",
		"Rough level, but you pushed through. Focus on the MSB first.",
		"More misses than hits — try a top-down approach next time.",
	],
	slow: [
		"Good accuracy but taking time — try chunking the bits into groups.",
		"Accurate but slow — practice reading the MSB first to speed up.",
		"Nice correctness — now work on reading the pattern faster.",
	],
};

// Tracks performance across the current 10-question level window.
let levelWindowCorrect = 0;
let levelWindowWrong = 0;
let levelWindowTotalMs = 0;
const BIT_CLICKING_QUESTIONS_PER_LEVEL = 10;

function resetLevelWindow() {
	levelWindowCorrect = 0;
	levelWindowWrong = 0;
	levelWindowTotalMs = 0;
}

function gradeLevelWindow(correct, wrong, totalMs, questionCount) {
	const accuracy = questionCount > 0 ? correct / questionCount : 0;
	const avgMs = questionCount > 0 ? totalMs / questionCount : 0;
	const slowThreshold = getSlowThresholdMs() * 1.4;

	if (accuracy === 1) return "perfect";
	if (accuracy >= 0.8) return avgMs > slowThreshold ? "slow" : "strong";
	if (accuracy >= 0.6) return "steady";
	return avgMs > slowThreshold ? "slow" : "shaky";
}

function showLevelUpTip(newLevel, maxLevel, grade) {
	if (!tipHUD) return;
	if (tipTimer) { clearTimeout(tipTimer); tipTimer = null; }

	const feedbackPool = LEVEL_UP_FEEDBACK[grade] ?? LEVEL_UP_FEEDBACK.steady;
	const feedback = feedbackPool[Math.floor(Math.random() * feedbackPool.length)];
	const remaining = maxLevel - newLevel;
	const suffix = remaining > 0
		? `${remaining} level${remaining === 1 ? "" : "s"} to go.`
		: "Max level — the clock keeps running. How long can you hold it?";
	const labelText = remaining > 0 ? "Level Up" : "Max Level";
	const levelLine = remaining > 0
		? `Level ${newLevel}. ${feedback} ${suffix}`
		: suffix;

	tipHUD.setAttribute("data-tip-label", labelText);
	if (tipHUDText) tipHUDText.textContent = levelLine;
	tipHUD.setAttribute("aria-label", `Level Up: ${levelLine}`);
	tipHUD.setAttribute("aria-hidden", "false");
	tipHUD.classList.add("tip-visible");
	tipTimer = setTimeout(() => {
		tipHUD.classList.remove("tip-visible");
		tipTimer = setTimeout(() => {
			if (restorePersistentTipHUD()) {
				tipTimer = null;
				return;
			}
			if (!state.gameActive || state.gameMode !== "quiz") {
				tipHUD.setAttribute("aria-hidden", "true");
			}
			tipHUD.removeAttribute("data-tip-label");
			tipHUD.removeAttribute("aria-label");
			if (tipHUDText) tipHUDText.textContent = "";
			tipTimer = null;
		}, TIP_FADE_MS);
	}, Math.max(0, TIP_TOTAL_VISIBLE_MS - TIP_FADE_MS));
}

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
	if (tipHUDText) tipHUDText.textContent = tip;
	tipHUD.setAttribute("aria-label", `${label}: ${tip}`);
	tipHUD.setAttribute("aria-hidden", "false");
	tipHUD.classList.add("tip-visible");
	tipTimer = setTimeout(() => {
		tipHUD.classList.remove("tip-visible");
		tipTimer = setTimeout(() => {
			if (restorePersistentTipHUD()) {
				tipTimer = null;
				return;
			}
			if (!state.gameActive || state.gameMode !== "quiz") {
				tipHUD.setAttribute("aria-hidden", "true");
			}
			tipHUD.removeAttribute("data-tip-label");
			tipHUD.removeAttribute("aria-label");
			if (tipHUDText) tipHUDText.textContent = "";
			tipTimer = null;
		}, TIP_FADE_MS);
	}, Math.max(0, TIP_TOTAL_VISIBLE_MS - TIP_FADE_MS));
}

function clearHelpTip() {
	if (tipTimer) {
		clearTimeout(tipTimer);
		tipTimer = null;
	}
	if (tipHUD) {
		tipHUD.classList.remove("tip-visible");
		if (restorePersistentTipHUD()) {
			consecutiveWrong = 0;
			resetMistakeCounters();
			return;
		}
		if (!state.gameActive || state.gameMode !== "quiz") {
			tipHUD.setAttribute("aria-hidden", "true");
		}
		tipHUD.removeAttribute("data-tip-label");
		tipHUD.removeAttribute("aria-label");
		if (tipHUDText) tipHUDText.textContent = "";
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
	for (const idx of indices) {
		ordered.push(sixBitNodes.hours[idx]);
	}

	return ordered;
}

function getBitClickingNodes() {
	return [...sixBitNodes.seconds, ...sixBitNodes.minutes, ...sixBitNodes.hours];
}

function getBitNodeWeight(node) {
	// Game weighting is progressive across ordered game bits.
	// Seconds: 1..32 (6-bit) or 1..8 (4-bit), minutes: 64..2048, hours: 4096..131072.
	const ordered = getBitClickingOrderedNodes();
	const orderedIndex = ordered.indexOf(node);
	if (orderedIndex === -1) return 0;
	return 2 ** orderedIndex;
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
	const bitCount = getLevelBitCount();
	document.body.classList.toggle("game-minutes-active", bitCount > perColumnBits);
	document.body.classList.toggle("game-hours-active", bitCount > perColumnBits * 2);
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
	const atCompletedMaxWindow = bitClickingRunCompleted
		&& state.gameLevel >= getBitClickingMaxLevel()
		&& state.gameQuestionsAnswered % BIT_CLICKING_QUESTIONS_PER_LEVEL === 0;
	const currentQuestion = atCompletedMaxWindow
		? BIT_CLICKING_QUESTIONS_PER_LEVEL
		: Math.min((state.gameQuestionsAnswered % BIT_CLICKING_QUESTIONS_PER_LEVEL) + 1, BIT_CLICKING_QUESTIONS_PER_LEVEL);
	if (gameHUD.targetDisplay) {
		gameHUD.targetDisplay.textContent = String(state.gameTargetValue ?? 0);
	}
	if (gameHUD.playerDisplay) {
		gameHUD.playerDisplay.textContent = String(player);
	}
	if (gameHUD.scoreDisplay) {
		gameHUD.scoreDisplay.textContent = `${currentQuestion}/${BIT_CLICKING_QUESTIONS_PER_LEVEL}`;
		gameHUD.scoreDisplay.setAttribute("aria-label", `Current question ${currentQuestion} of ${BIT_CLICKING_QUESTIONS_PER_LEVEL}`);
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

	startBitClickingTimer();
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

	const elapsedMs = Date.now() - questionStartedAt;
	levelWindowTotalMs += elapsedMs;

	if (isCorrect) {
		levelWindowCorrect++;
		consecutiveWrong = 0;
		resetMistakeCounters();
		state.gameStreak++;
	} else {
		levelWindowWrong++;
		state.gameStreak = 0;
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
	const completedRun = state.gameQuestionsAnswered % BIT_CLICKING_QUESTIONS_PER_LEVEL === 0
		&& state.gameLevel >= maxLevel;
	if (completedRun) {
		completeBitClickingRun();
		updateGameHUD();
		feedbackTimer = setTimeout(() => {
			feedbackTimer = null;
			clearFeedbackClasses();
		}, isCorrect ? 1000 : 1500);
		return;
	}
	if (state.gameQuestionsAnswered % BIT_CLICKING_QUESTIONS_PER_LEVEL === 0) {
		const grade = gradeLevelWindow(levelWindowCorrect, levelWindowWrong, levelWindowTotalMs, BIT_CLICKING_QUESTIONS_PER_LEVEL);
		resetLevelWindow();
		if (state.gameLevel < maxLevel) {
			state.gameLevel = Math.min(state.gameLevel + 1, maxLevel);
		}
		showLevelUpTip(state.gameLevel, maxLevel, grade);
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
	resetLevelWindow();
	resetBitClickingTimer();
	state.gameScore = 0;
	state.gameLevel = 1;
	state.gameQuestionsAnswered = 0;
	state.gameStreak = 0;
	state.gameTargetValue = 0;

	generateNewQuestion();

	if (gameHUD.panel) {
		gameHUD.panel.setAttribute("aria-hidden", "false");
	}
	showHelpTip("bitClickingStart");
}

export function stopBitClickingGame() {
	if (feedbackTimer) {
		clearTimeout(feedbackTimer);
		feedbackTimer = null;
	}
	resetBitClickingTimer();
	clearHelpTip();
	clearGameClasses();
	document.body.classList.remove("game-minutes-active", "game-hours-active");

	if (gameHUD.panel) {
		gameHUD.panel.setAttribute("aria-hidden", "true");
		gameHUD.panel.classList.remove("game-hud-match");
	}
}

// ===========================================================================
// QUIZ MODE
// ===========================================================================

const QUIZ_LEVEL_CONFIG = [
	// Group 1 — Seconds column only (values 0–63)
	{ bits: 4,  type: "decimal-to-binary", timerSec: 0  },  // L1
	{ bits: 4,  type: "binary-to-decimal", timerSec: 0  },  // L2
	{ bits: 5,  type: "decimal-to-binary", timerSec: 0  },  // L3
	{ bits: 5,  type: "binary-to-decimal", timerSec: 0  },  // L4
	{ bits: 6,  type: "decimal-to-binary", timerSec: 0  },  // L5
	{ bits: 6,  type: "binary-to-decimal", timerSec: 0  },  // L6
	{ bits: 6,  type: "mixed",             timerSec: 15 },  // L7  ← timed
	{ bits: 6,  type: "mixed",             timerSec: 10 },  // L8  ← timed
	// Group 2 — Seconds + Minutes columns (values 0–4095)
	{ bits: 8,  type: "decimal-to-binary", timerSec: 0  },  // L9
	{ bits: 8,  type: "binary-to-decimal", timerSec: 0  },  // L10
	{ bits: 10, type: "decimal-to-binary", timerSec: 0  },  // L11
	{ bits: 10, type: "binary-to-decimal", timerSec: 0  },  // L12
	{ bits: 12, type: "decimal-to-binary", timerSec: 0  },  // L13
	{ bits: 12, type: "binary-to-decimal", timerSec: 0  },  // L14
	{ bits: 12, type: "mixed",             timerSec: 20 },  // L15 ← timed
	{ bits: 12, type: "mixed",             timerSec: 15 },  // L16 ← timed
	// Group 3 — Seconds + Minutes + Hours columns (values 0–262143)
	{ bits: 14, type: "decimal-to-binary", timerSec: 0  },  // L17
	{ bits: 14, type: "binary-to-decimal", timerSec: 0  },  // L18
	{ bits: 16, type: "decimal-to-binary", timerSec: 0  },  // L19
	{ bits: 16, type: "binary-to-decimal", timerSec: 0  },  // L20
	{ bits: 18, type: "decimal-to-binary", timerSec: 0  },  // L21
	{ bits: 18, type: "binary-to-decimal", timerSec: 0  },  // L22
	{ bits: 18, type: "mixed",             timerSec: 30 },  // L23 ← timed
	{ bits: 18, type: "mixed",             timerSec: 20 },  // L24 ← timed
	// Final challenge — 25% less time than L24
	{ bits: 18, type: "mixed",             timerSec: 15 },  // L25 ← timed
];
const QUIZ_MAX_LEVEL = QUIZ_LEVEL_CONFIG.length;
const QUIZ_QUESTIONS_PER_LEVEL = 10;

let quizTimerInterval = null;
let quizQuestionType = null;
let quizFeedbackTimer = null;
let quizGameOver = false;
let rollingScoreTimer = null;
let displayedScore = 0;
let quizLevelWindowCorrect = 0;
let quizLevelWindowWrong = 0;
let quizRoundLivesLost = 0;
let quizPendingJeopardyRound = false;
let quizJeopardyRoundActive = false;
let quizJeopardyQuestionIndex = -1;
let quizCurrentQuestionIsJeopardy = false;
let quizJeopardyResultState = null;
let quizJeopardyResultTimer = null;
let quizRoundAnchor = -1;

const QUIZ_MAX_LIVES = 5;
let quizLives = QUIZ_MAX_LIVES;

function resetQuizLevelWindow() {
	quizLevelWindowCorrect = 0;
	quizLevelWindowWrong = 0;
}

function getQuizLevelGrade() {
	const total = quizLevelWindowCorrect + quizLevelWindowWrong;
	if (total <= 0) return "steady";
	const accuracy = quizLevelWindowCorrect / total;
	if (accuracy === 1) return "perfect";
	if (accuracy >= 0.8) return "strong";
	if (accuracy >= 0.6) return "steady";
	return "shaky";
}

function syncQuizJeopardyClasses() {
	document.body.classList.toggle("quiz-jeopardy-mode", state.gameActive && state.gameMode === "quiz" && quizJeopardyRoundActive);
	document.body.classList.toggle("quiz-jeopardy-question", state.gameActive && state.gameMode === "quiz" && quizCurrentQuestionIsJeopardy);
	document.body.classList.toggle("quiz-jeopardy-result-correct", state.gameActive && state.gameMode === "quiz" && quizJeopardyResultState === "correct");
	document.body.classList.toggle("quiz-jeopardy-result-wrong", state.gameActive && state.gameMode === "quiz" && quizJeopardyResultState === "wrong");
}

function clearQuizJeopardyResultFlash() {
	if (quizJeopardyResultTimer) {
		clearTimeout(quizJeopardyResultTimer);
		quizJeopardyResultTimer = null;
	}
	if (quizJeopardyResultState) {
		quizJeopardyResultState = null;
		syncQuizJeopardyClasses();
	}
}

function triggerQuizJeopardyResultFlash(result) {
	clearQuizJeopardyResultFlash();
	quizJeopardyResultState = result;
	syncQuizJeopardyClasses();
	quizJeopardyResultTimer = setTimeout(() => {
		quizJeopardyResultTimer = null;
		quizJeopardyResultState = null;
		syncQuizJeopardyClasses();
	}, 1000);
}

function resetQuizJeopardyState() {
	clearQuizJeopardyResultFlash();
	quizRoundLivesLost = 0;
	quizPendingJeopardyRound = false;
	quizJeopardyRoundActive = false;
	quizJeopardyQuestionIndex = -1;
	quizCurrentQuestionIsJeopardy = false;
	quizJeopardyResultState = null;
	quizRoundAnchor = -1;
	syncQuizJeopardyClasses();
}

function loseQuizLives(amount) {
	const safeAmount = Math.max(0, amount);
	if (safeAmount <= 0) return 0;
	const before = quizLives;
	quizLives = Math.max(0, quizLives - safeAmount);
	const lost = before - quizLives;
	if (lost > 0) {
		quizRoundLivesLost += lost;
		updateQuizLivesDisplay();
	}
	return lost;
}

function gainQuizLives(amount) {
	const safeAmount = Math.max(0, amount);
	if (safeAmount <= 0) return 0;
	const before = quizLives;
	quizLives = Math.min(QUIZ_MAX_LIVES, quizLives + safeAmount);
	const gained = quizLives - before;
	if (gained > 0) updateQuizLivesDisplay();
	return gained;
}

function prepareQuizRoundIfNeeded() {
	const answered = state.gameQuestionsAnswered;
	if (answered % QUIZ_QUESTIONS_PER_LEVEL !== 0) return;
	if (quizRoundAnchor === answered) return;
	quizRoundAnchor = answered;
	quizCurrentQuestionIsJeopardy = false;
	quizRoundLivesLost = 0;

	if (quizPendingJeopardyRound) {
		quizJeopardyRoundActive = true;
		quizJeopardyQuestionIndex = Math.floor(Math.random() * QUIZ_QUESTIONS_PER_LEVEL);
		quizPendingJeopardyRound = false;
	} else {
		quizJeopardyRoundActive = false;
		quizJeopardyQuestionIndex = -1;
	}

	syncQuizJeopardyClasses();
}

function updateQuizLivesDisplay() {
	if (!quizLivesBitNodes?.length) return;
	// 3 bits, MSB→LSB: weights [4, 2, 1]
	const weights = [4, 2, 1];
	quizLivesBitNodes.forEach((node, i) => {
		node.classList.toggle("on", (quizLives & weights[i]) !== 0);
	});
	if (tipHUD) tipHUD.dataset.lives = String(quizLives);
	const livesBar = document.getElementById("quizLivesBar");
	if (livesBar) livesBar.setAttribute("aria-label", `${quizLives} of ${QUIZ_MAX_LIVES} lives remaining`);
}

function getQuizConfig() {
	return QUIZ_LEVEL_CONFIG[Math.min(state.gameLevel - 1, QUIZ_MAX_LEVEL - 1)];
}

function getQuizBitCount() {
	const maxBits = state.mode === "6-bit" ? 18 : 4;
	return Math.min(getQuizConfig().bits, maxBits);
}

/** Returns active quiz bit nodes in order, LSB (weight 1) first. */
function getQuizOrderedNodes() {
	const count = getQuizBitCount();
	const nodes = [];
	const secCount = Math.min(count, 6);
	for (let i = 0; i < secCount; i++) nodes.push(sixBitNodes.seconds[5 - i]);
	if (count > 6) {
		const minCount = Math.min(count - 6, 6);
		for (let i = 0; i < minCount; i++) nodes.push(sixBitNodes.minutes[5 - i]);
	}
	if (count > 12) {
		const hrCount = Math.min(count - 12, 6);
		for (let i = 0; i < hrCount; i++) nodes.push(sixBitNodes.hours[5 - i]);
	}
	return nodes;
}

function getQuizMaxValue() {
	const count = getQuizBitCount();
	return count >= 31 ? 0x7FFFFFFF : (1 << count) - 1;
}

function syncQuizBodyClasses() {
	const count = getQuizBitCount();
	document.body.classList.toggle("quiz-minutes-active", count > 6);
	document.body.classList.toggle("quiz-hours-active", count > 12);
}

function startRollingScore(target) {
	if (rollingScoreTimer) { clearInterval(rollingScoreTimer); rollingScoreTimer = null; }
	if (displayedScore === target) return;
	const start = displayedScore;
	const delta = target - start;
	const steps = 16;
	let step = 0;
	rollingScoreTimer = setInterval(() => {
		step++;
		const t = Math.min(step / steps, 1);
		displayedScore = Math.round(start + delta * t);
		if (quizHUD.scoreDisplay) quizHUD.scoreDisplay.textContent = String(displayedScore);
		if (step >= steps) { clearInterval(rollingScoreTimer); rollingScoreTimer = null; }
	}, 25);
}

function setQuizBitsToValue(value) {
	const ordered = getQuizOrderedNodes();
	const activeSet = new Set(ordered);
	[...sixBitNodes.seconds, ...sixBitNodes.minutes, ...sixBitNodes.hours].forEach(n => {
		n.classList.remove("on", "game-bit-inactive", "game-bit-correct", "game-bit-incorrect");
		if (!activeSet.has(n)) n.classList.add("game-bit-inactive");
	});
	for (let i = 0; i < ordered.length; i++) {
		ordered[i].classList.toggle("on", ((value >> i) & 1) === 1);
	}
}

function clearQuizBits() {
	[...sixBitNodes.seconds, ...sixBitNodes.minutes, ...sixBitNodes.hours].forEach(n => {
		n.classList.remove("on", "game-bit-correct", "game-bit-incorrect", "game-bit-inactive");
	});
}

function flashQuizBitFeedback(isCorrect) {
	const cls = isCorrect ? "game-bit-correct" : "game-bit-incorrect";
	getQuizOrderedNodes().forEach(n => n.classList.add(cls));
}

function clearQuizFeedbackClasses() {
	[...sixBitNodes.seconds, ...sixBitNodes.minutes, ...sixBitNodes.hours].forEach(n =>
		n.classList.remove("game-bit-correct", "game-bit-incorrect"));
}

function readQuizPlayerBits() {
	const ordered = getQuizOrderedNodes();
	let value = 0;
	for (let i = 0; i < ordered.length; i++) {
		if (ordered[i].classList.contains("on")) value += (1 << i);
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
	quizLevelWindowWrong++;
	const wasJeopardyQuestion = quizCurrentQuestionIsJeopardy;
	const lifePenalty = quizCurrentQuestionIsJeopardy ? 2 : 1;
	loseQuizLives(lifePenalty);
	if (wasJeopardyQuestion) {
		showHelpTip("quizJeopardyFail");
		triggerQuizJeopardyResultFlash("wrong");
	}
	state.gameQuestionsAnswered++;
	quizCurrentQuestionIsJeopardy = false;
	syncQuizJeopardyClasses();
	if (quizLives <= 0) {
		updateQuizHUD();
		showQuizSummary();
		return;
	}
	if (state.gameQuestionsAnswered % QUIZ_QUESTIONS_PER_LEVEL === 0) {
		quizPendingJeopardyRound = quizRoundLivesLost > 0;
	}
	if (state.gameQuestionsAnswered % QUIZ_QUESTIONS_PER_LEVEL === 0 && state.gameLevel >= QUIZ_MAX_LEVEL) {
		updateQuizHUD();
		showQuizSummary();
		return;
	}
	if (state.gameQuestionsAnswered % QUIZ_QUESTIONS_PER_LEVEL === 0) {
		resetQuizLevelWindow();
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
	startRollingScore(state.gameScore);
	if (quizHUD.levelDisplay) quizHUD.levelDisplay.textContent = `L${state.gameLevel}`;
	const qInLevel = (state.gameQuestionsAnswered % QUIZ_QUESTIONS_PER_LEVEL) + 1;
	if (quizHUD.progress) {
		if (quizGameOver) return;
		const modePrefix = quizCurrentQuestionIsJeopardy ? "Jeopardy " : "";
		quizHUD.progress.textContent = `${modePrefix}${qInLevel}/${QUIZ_QUESTIONS_PER_LEVEL}`;
	}
}

export function generateQuizQuestion() {
	if (quizGameOver) return;
	if (quizFeedbackTimer) { clearTimeout(quizFeedbackTimer); quizFeedbackTimer = null; }
	clearQuizJeopardyResultFlash();
	stopQuizTimer();
	clearQuizBits();
	prepareQuizRoundIfNeeded();
	syncQuizBodyClasses();

	const config = getQuizConfig();
	quizQuestionType = config.type === "mixed"
		? (state.gameQuestionsAnswered % 2 === 0 ? "decimal-to-binary" : "binary-to-decimal")
		: config.type;

	setQuizBodyType(quizQuestionType);
	const questionIndexInLevel = state.gameQuestionsAnswered % QUIZ_QUESTIONS_PER_LEVEL;
	quizCurrentQuestionIsJeopardy = quizJeopardyRoundActive && questionIndexInLevel === quizJeopardyQuestionIndex;
	syncQuizJeopardyClasses();
	if (quizCurrentQuestionIsJeopardy) showHelpTip("quizJeopardyRound");
	const maxValue = getQuizMaxValue();
	const previousValue = state.gameTargetValue;
	state.gameTargetValue = randomTargetExcluding(maxValue, previousValue);

	if (quizQuestionType === "decimal-to-binary") {
		const activeSet = new Set(getQuizOrderedNodes());
		[...sixBitNodes.seconds, ...sixBitNodes.minutes, ...sixBitNodes.hours].forEach(n => {
			if (!activeSet.has(n)) n.classList.add("game-bit-inactive");
		});
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
	if (quizHUD.actions) quizHUD.actions.setAttribute("aria-hidden", "true");

	if (config.timerSec > 0) startQuizTimer(config.timerSec);
	updateQuizHUD();
}

export function handleQuizBitClick(bitNode) {
	if (!state.gameActive || state.gameMode !== "quiz") return;
	if (quizGameOver) return;
	if (quizQuestionType !== "decimal-to-binary") return;
	if (bitNode.classList.contains("game-bit-inactive")) return;
	if (!getQuizOrderedNodes().includes(bitNode)) return;
	if (quizFeedbackTimer !== null) return;
	bitNode.classList.toggle("on");
}

function showQuizSummary() {
	quizGameOver = true;
	stopQuizTimer();
	setQuizBodyType(null);
	quizCurrentQuestionIsJeopardy = false;
	syncQuizJeopardyClasses();

	const failedOut = quizLives <= 0;
	const previousHighScore = quizHighScore;
	const isNewHighScore = state.gameScore > previousHighScore;
	if (isNewHighScore) {
		quizHighScore = state.gameScore;
		writeStoredInt(STORAGE_KEYS.quizHighScore, quizHighScore);
	}
	const bestScore = Math.max(quizHighScore, state.gameScore);

	if (quizHUD.panel) quizHUD.panel.dataset.type = "summary";
	if (quizHUD.label) quizHUD.label.textContent = "score";
	if (quizHUD.valueDisplay) quizHUD.valueDisplay.textContent = String(state.gameScore);
	if (quizHUD.progress) quizHUD.progress.textContent = failedOut ? "Game Over" : "Complete";
	if (quizHUD.scoreDisplay) {
		quizHUD.scoreDisplay.textContent = isNewHighScore ? `New best ${bestScore}` : `Best ${bestScore}`;
		quizHUD.scoreDisplay.setAttribute("aria-label", `Best score ${bestScore}`);
	}
	if (quizHUD.levelDisplay) quizHUD.levelDisplay.textContent = `L${state.gameLevel}`;
	if (quizHUD.actions) quizHUD.actions.setAttribute("aria-hidden", "false");
	if (quizHUD.submitButton) {
		quizHUD.submitButton.disabled = true;
		quizHUD.submitButton.textContent = "✓";
	}

	if (tipHUD && tipHUDText) {
		if (tipTimer) { clearTimeout(tipTimer); tipTimer = null; }
		const summaryLabel = failedOut ? "Game Over" : "Complete";
		const msg = isNewHighScore
			? `New high score: ${state.gameScore}`
			: `Final score: ${state.gameScore} • Best: ${bestScore}`;
		tipHUD.setAttribute("data-tip-label", summaryLabel);
		tipHUDText.textContent = msg;
		tipHUD.setAttribute("aria-label", msg);
		tipHUD.setAttribute("aria-hidden", "false");
		tipHUD.classList.add("tip-visible");
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
	const wasJeopardyQuestion = quizCurrentQuestionIsJeopardy;

	if (isCorrect) {
		state.gameScore += 10 + state.gameStreak * 2;
		state.gameStreak++;
		quizLevelWindowCorrect++;
		if (wasJeopardyQuestion) {
			gainQuizLives(1);
			showHelpTip("quizJeopardyWin");
			triggerQuizJeopardyResultFlash("correct");
		}
	} else {
		state.gameStreak = 0;
		state.gameScore = Math.max(0, state.gameScore - 2);
		quizLevelWindowWrong++;
		const lifePenalty = wasJeopardyQuestion ? 2 : 1;
		loseQuizLives(lifePenalty);
		if (wasJeopardyQuestion) {
			showHelpTip("quizJeopardyFail");
			triggerQuizJeopardyResultFlash("wrong");
		}
	}
	state.gameQuestionsAnswered++;
	quizCurrentQuestionIsJeopardy = false;
	syncQuizJeopardyClasses();

	if (quizLives <= 0) {
		updateQuizHUD();
		showQuizSummary();
		return;
	}

	if (state.gameQuestionsAnswered % QUIZ_QUESTIONS_PER_LEVEL === 0) {
		quizPendingJeopardyRound = quizRoundLivesLost > 0;
	}

	if (state.gameQuestionsAnswered % QUIZ_QUESTIONS_PER_LEVEL === 0) {
		if (state.gameLevel >= QUIZ_MAX_LEVEL) {
			updateQuizHUD();
			showQuizSummary();
			return;
		}
		const grade = getQuizLevelGrade();
		resetQuizLevelWindow();
		state.gameLevel = Math.min(state.gameLevel + 1, QUIZ_MAX_LEVEL);
		showLevelUpTip(state.gameLevel, QUIZ_MAX_LEVEL, grade);
	}

	updateQuizHUD();
	quizFeedbackTimer = setTimeout(() => {
		quizFeedbackTimer = null;
		clearQuizFeedbackClasses();
		generateQuizQuestion();
	}, isCorrect ? 1000 : 1500);
}

export function startQuizGame() {
	clearHelpTip();
	state.gameScore = 0;
	state.gameLevel = 1;
	state.gameQuestionsAnswered = 0;
	state.gameStreak = 0;
	state.gameTargetValue = 0;
	quizQuestionType = null;
	quizGameOver = false;
	displayedScore = 0;
	resetQuizLevelWindow();
	resetQuizJeopardyState();
	quizLives = QUIZ_MAX_LIVES;
	updateQuizLivesDisplay();
	if (tipHUD) {
		tipHUD.setAttribute("aria-hidden", "false");
		tipHUD.removeAttribute("data-tip-label");
		if (tipHUDText) tipHUDText.textContent = "";
	}
	if (quizHUD.actions) quizHUD.actions.setAttribute("aria-hidden", "true");
	generateQuizQuestion();
	if (quizHUD.panel) quizHUD.panel.setAttribute("aria-hidden", "false");
	showHelpTip("quizStart");
}

export function stopQuizGame() {
	stopQuizTimer();
	clearHelpTip();
	if (rollingScoreTimer) { clearInterval(rollingScoreTimer); rollingScoreTimer = null; }
	if (quizFeedbackTimer) { clearTimeout(quizFeedbackTimer); quizFeedbackTimer = null; }
	clearQuizBits();
	setQuizBodyType(null);
	document.body.classList.remove("quiz-minutes-active", "quiz-hours-active");
	quizQuestionType = null;
	quizGameOver = false;
	resetQuizJeopardyState();
	quizLives = QUIZ_MAX_LIVES;
	updateQuizLivesDisplay();
	if (tipHUD) tipHUD.removeAttribute("data-lives");
	if (quizHUD.panel) {
		quizHUD.panel.setAttribute("aria-hidden", "true");
		quizHUD.panel.dataset.type = "decimal-to-binary";
	}
	if (quizHUD.submitButton) {
		quizHUD.submitButton.disabled = false;
		quizHUD.submitButton.textContent = "✓";
	}
	if (quizHUD.actions) quizHUD.actions.setAttribute("aria-hidden", "true");
}
