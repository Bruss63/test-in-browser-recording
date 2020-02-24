import { React } from 'react';

/*
------------------
Under Construction
------------------
*/

//Functions

function formatTimer(time) {
	let formattedMs = time.ms.toString();
	let formattedSec = time.sec.toString();
	let formattedMin = time.min.toString();

	//Create leading zeros to create consistent display
	while (formattedMs.length !== 4) {
		formattedMs = 0 + formattedMs;
	}

	while (formattedSec.length !== 2) {
		formattedSec = 0 + formattedSec;
	}

	while (formattedMin.length !== 2) {
		formattedMin = 0 + formattedMin;
	}
	return (
		formattedMs,
		formattedSec,
		formattedMin
	)
}

export function updateTimer(time, start) {
	let ms = Date.now() - start;
	let sec = time.sec
	let min = time.min
	if (ms >= 1000) {
		start = Date.now();
		ms = Date.now() - start;
		sec += 1;
	}
	if (sec >= 60) {
		sec = 0;
		min += 1;
	}
	time = {
		ms,
		sec,
		min
	}
	let formattedTime = formatTimer(time);
	return (
		time, 
		formattedTime
	)
}

export function startTimer(timerInterval) {
	let time = {
		ms: 0,
		sec: 0,
		min: 0
	};
	let timerActive = true;
	let start = Date.now() - time.ms;
	timerInterval = setInterval(updateTimer(time,start), 10);
	return timerInterval, time, timerActive, start;
}

export function stopTimer(timerInterval) {
	timerInterval = clearInterval(updateTimer);
	let timerActive = false;
	return timerInterval, timerActive;
}

//Displayed Element
function Timer(props) {
	let {formattedTime, isShowing} = props;
	let {formattedMs, formattedSec, formattedMin} = formattedTime

	return isShowing ? (
		<div>
			<h1 className="clock-face">
				{formattedMin}
				{":"}
				{formattedSec}
				{":"}
				{formattedMs}
			</h1>
		</div>
	) : null;
}

export default Timer