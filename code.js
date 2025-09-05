
//12/24h switch
var show24HourFormat = true; // true for 24h, false for 12h
function toggleTimeFormat() {
	if (document.getElementById("timeFormatToggle").checked) {
		// Switch to 12-hour format
		show24HourFormat = false;
		document.getElementById("timeFormatLabel").innerText = "12h Format";
	} else {
		// Switch to 24-hour format
		show24HourFormat = true;
		document.getElementById("timeFormatLabel").innerText = "24h Format";
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
	if (document.getElementById("modeToggle").checked) {
		fourBitMode();
		document.getElementById("modeLabel").innerText = "4-bit Mode";
	} else {
		sixBitMode();
		document.getElementById("modeLabel").innerText = "6-bit Mode";
	}
}

function fourBitMode() {
	clearCurrentInterval();
	showFourBitMode();
}
function sixBitMode() {
	clearCurrentInterval();
	showSixBitMode();
}

// Start in 6-bit mode by default
sixBitMode();

function showFourBitMode() {
	// Set the mode to 4-bit
	document.querySelector(".clock").setAttribute("data-mode", "4bit");
	// document.querySelectorAll("[data-not6Bit]").forEach( (el) => { el.style.display = ""; } );
	// Update the clock every 100 milliseconds
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
	}, 100);
}

function showSixBitMode() {
	// Set the mode to 6-bit
	document.querySelector(".clock").setAttribute("data-mode", "6bit");
	// document.querySelectorAll("[data-not6Bit]").forEach( (el) => { el.style.display = "none"; } );
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
	}, 100);
}