// const container = document.querySelector(".clock");
// const observer = new MutationObserver(logMutationTarget);
// observer.observe(container, { childList: true, subtree: true, attributeFilter: ['data-bit'] });
// function logMutationTarget(mutationsList, observer) {
// 	for (const mutation of mutationsList) {
// 		if (mutation.type === 'attributes') {
// 			console.log('The ' + mutation.attributeName + ' attribute was modified by ' + mutation.target + '.');
			
// 		}
// 	}
// }
//observer.disconnect(); // Call this method when you want to stop observing


document.getElementById("modeToggle").addEventListener("change", toggleMode);
document.getElementById("timeFormatToggle").addEventListener("change", toggleTimeFormat);

function toggleTimeFormat() {
	show24HourFormat = !show24HourFormat;
	localStorage.setItem("binaryClockFormat", show24HourFormat ? "24" : "12");
}
let show24HourFormat = localStorage.getItem("binaryClockFormat") === "24" ? true : false;
let currentInterval;

function toggleMode() {
	if (currentInterval) clearInterval(currentInterval);
	if (document.getElementById("modeToggle").checked) {
		localStorage.setItem("binaryClockMode", "4-bit");
		// showFourBitMode();
		currentInterval = setInterval(() => {
				setTime4Bit(document.getElementById("seconds").children, document.getElementById("minutes").children, document.getElementById("hours").children);
			}, 250); 
	} else {
		localStorage.setItem("binaryClockMode", "6-bit");
		// showSixBitMode();
	}
}




function setTime4Bit(seconds, minutes, hours) {
	let now = new Date();
	let currentSecond = now.getSeconds(), currentMinute = now.getMinutes();	
	let currentHour = show24HourFormat ? now.getHours() : now.getHours() % 12;
	setBits(seconds, Math.floor(currentSecond / 10).toString(2).padStart(4, '0') + (currentSecond % 10).toString(2).padStart(4, '0'));
	setBits(minutes, Math.floor(currentMinute / 10).toString(2).padStart(4, '0') + (currentMinute % 10).toString(2).padStart(4, '0'));
	setBits(hours, Math.floor(currentHour / 10).toString(2).padStart(4, '0') + (currentHour % 10).toString(2).padStart(4, '0'));
}


/**
 * Sets the "data-bit" attribute for each element in the container based on the corresponding value in digitalBits.
 *
 * @param {HTMLElement[]} container - The elements containing the bits for seconds, minutes and hours, whose "data-bit" attribute will be set.
 * @param {string} digitalBits - An 8-bit binary string representing the bits to set for each element.
 */
function setBits(container, digitalBits) {
	// Set the bits in the container
	for (let bit = 0; bit < container.length; bit++) {
		container[bit].setAttribute("data-bit", digitalBits[bit]);
	}
}




