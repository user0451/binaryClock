//event listeners for switches
document.getElementById("modeToggle").addEventListener("change", toggleMode);
document.getElementById("timeFormatToggle").addEventListener("change", toggleTimeFormat);


//12/24h switch
var show24HourFormat = true; // true for 24h, false for 12h
function toggleTimeFormat() {
	if (document.getElementById("timeFormatToggle").checked) {
		// Switch to 12-hour format
		show24HourFormat = false;
		document.getElementById("timeFormatLabel").innerText = "12";
		localStorage.setItem("binaryClockFormat", "12");
	} else {
		// Switch to 24-hour format
		show24HourFormat = true;
		document.getElementById("timeFormatLabel").innerText = "24";
		localStorage.setItem("binaryClockFormat", "24");
	}
}


//click events to switch modes and stop current intervals
var currentInterval;
function clearCurrentInterval() {
	if (currentInterval) {	
		clearInterval(currentInterval);
		currentInterval = null;
	}
}

function toggleMode() {
	clearCurrentInterval();
	if (document.getElementById("modeToggle").checked) {
		showFourBitMode();
		setMode("4-bit");
	} else {
		showSixBitMode();
		setMode("6-bit");
	}
}



function setMode(mode) {
	document.getElementById("modeLabel").innerText = mode;
	localStorage.setItem("binaryClockMode", mode);
}

function showFourBitMode() {
	// Set the mode to 4-bit
	document.querySelector(".clock").setAttribute("data-mode", "4bit");
	//changing the display to 4-bit mode means the css will take care of hiding the unnecessary bits and moving the others into place, so we just need to update the time here.
	currentInterval = setInterval(() => {
		let now = new Date();
		let currentSecond = now.getSeconds(), currentMinute = now.getMinutes(); 
		let currentHour = show24HourFormat ? now.getHours() : now.getHours() % 12;
		let tensOfSeconds = Math.floor(currentSecond / 10);
		let secondsUnit = currentSecond % 10;
		let tensOfMinutes = Math.floor(currentMinute / 10);
		let minutesUnit = currentMinute % 10;
		let tensOfHours = Math.floor(currentHour / 10);
		let hoursUnit = currentHour % 10;
		for (let i = 0; i < 4; i++) {
			let bit = 1 << (3 - i);
			document.getElementById("secondsTens" + bit).classList.toggle("on", (tensOfSeconds & bit) != 0);
			document.getElementById("seconds" + bit).classList.toggle("on", (secondsUnit & bit) != 0);
			document.getElementById("minutesTens" + bit).classList.toggle("on", (tensOfMinutes & bit) != 0);
			document.getElementById("minutes" + bit).classList.toggle("on", (minutesUnit & bit) != 0);
			document.getElementById("hoursTens" + bit).classList.toggle("on", (tensOfHours & bit) != 0);
			document.getElementById("hours" + bit).classList.toggle("on", (hoursUnit & bit) != 0);
		}
		//console.log("FirstDigit =", tensOfSeconds.toString(2), "\nLastDigit =", secondsUnit.toString(2));
	}, 250);
}

function showSixBitMode() {
	// Set the mode to 6-bit
	document.querySelector(".clock").setAttribute("data-mode", "6bit");
	// Update the clock every 100 milliseconds
	currentInterval = setInterval(() => {
		let now = new Date();
		let currentSecond = now.getSeconds();
		let currentMinute = now.getMinutes();
		let currentHour = show24HourFormat ? now.getHours() : now.getHours() % 12;
		for (let i = 0; i < 6; i++) {
			let bit = 1 << (5 - i);
			document.getElementsByClassName("second"+(i+1))[0].classList.toggle("on", (currentSecond & bit) != 0);
			document.getElementsByClassName("minute"+(i+1))[0].classList.toggle("on", (currentMinute & bit) != 0);
			document.getElementsByClassName("hour"+(i+1))[0].classList.toggle("on", (currentHour & bit) != 0);
		}
		// console.log("hours =",currentHour.toString(2),"\nminutes =",currentMinute.toString(2),"\nseconds =",currentSecond.toString(2));
	}, 250);
}

// Start in 6-bit mode by default
//check for stored value
if (localStorage.getItem("binaryClockMode") === "4-bit") {
	document.getElementById("modeToggle").checked = true;
}
toggleMode();
if (localStorage.getItem("binaryClockFormat") === "12") {
	document.getElementById("timeFormatToggle").checked = true;
}
